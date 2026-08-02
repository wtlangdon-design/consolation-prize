import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { IllegalStateError, pureResolution } from '../engine/core/Assertions.ts';
import { EFFECT_PHASE } from '../engine/core/Commit.ts';
import type { ContentBundle, Interactable } from '../engine/core/types.ts';
import type { DurableEffect } from '../engine/core/runtime-types.ts';

/**
 * Step B: resolution is pure, and effects land in journal-phase order.
 *
 * Doc 34 section 1.2 names three defects and this file is one section per
 * defect, in its order:
 *
 *   1. DialogueRunner.select() wrote flags and moved the node immediately.
 *   2. VerbSystem.resolve()/resolveWith() wrote flags during resolution.
 *   3. GameState.interact() changed objects, ownership and the room before
 *      the response line existed.
 *
 * THE RULE THIS FILE IS WRITTEN TO. Each of the three has a test that fails
 * against the old behaviour rather than merely passing against the new one.
 * The old behaviour is one line in each case -- applying the writes inside
 * the resolver -- and each test below was watched to fail with that line put
 * back. Doc 34 section 1.1's complaint about the green checks is the reason:
 * a check that cannot fail proves nothing about the code, only about itself.
 *
 * The sweeps run over /content rather than over fixtures built here. The
 * harness rooms and the harness tree ARE content -- they are the Phase 1
 * acceptance fixture errata ruling 8 asks for, they live in /content, and
 * they are the only records in the game that exercise `add`, `take` and
 * `setState` together. Every other room and every authored tree is swept
 * alongside them.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolvePath(ROOT, path), 'utf8'));

async function bundle(): Promise<ContentBundle> {
  return loadContent(fsReader);
}

async function fresh(): Promise<GameState> {
  return new GameState(await bundle(), new MemoryStorage());
}

/** The whole durable world, as one comparable string. */
function worldSignature(state: GameState): string {
  return JSON.stringify({
    room: state.roomId,
    inventory: state.carried,
    flags: state.flags.snapshot(),
    counts: state.dialogue.progressSnapshot(),
    position: state.dialogue.positionSnapshot(),
    targets: state.targets.map((target) => `${target.id}:${state.stateOf(target) ?? ''}`),
  });
}

function effectKinds(effects: readonly DurableEffect[]): string[] {
  return effects.map((effect) => effect.kind);
}

/* =========================================================================
 * Defect 1 -- "Dialogue option selection immediately writes flags/additions
 * and may end/change node."   D30, adopted by errata 45.
 * ====================================================================== */

test('D30: resolving a dialogue option over every authored tree writes nothing', async () => {
  const state = await fresh();
  let optionsResolved = 0;
  let effectsSeen = 0;

  for (const tree of state.content.dialogue.values()) {
    for (const nodeId of Object.keys(tree.nodes)) {
      state.dialogue.start(tree.id);
      // Walk the runner to this node the only way the runtime can: restore
      // its position. Selecting through the tree would commit as it went.
      state.dialogue.restore(state.dialogue.progressSnapshot(), { tree: tree.id, node: nodeId });

      for (const presented of state.dialogue.presentOptions()) {
        const before = worldSignature(state);
        const resolution = state.dialogue.resolveSelection(presented.option.id);
        assert.equal(
          worldSignature(state), before,
          `${tree.id}/${nodeId}/${presented.option.id} changed the world while resolving`,
        );
        // Whatever it would have written is described instead.
        const kinds = new Set(effectKinds(resolution.effects));
        assert.ok(kinds.has('dialogueTaken'), 'every selection reserves its own count');
        for (const kind of kinds) {
          assert.ok(
            kind === 'dialogueTaken' || kind === 'flag' || kind === 'flagAdd',
            `a tree may not reserve ${kind} -- section 4.2 gives it counts and flags only`,
          );
        }
        if (presented.option.set || presented.option.add) effectsSeen += 1;
        optionsResolved += 1;
      }
      state.dialogue.end();
    }
  }

  // 45 authored options, one of which (opt_gated) is behind a flag that is
  // false on a fresh save and so is never offered by this sweep.
  assert.ok(optionsResolved >= 44, `swept ${optionsResolved} options`);
  // Without this the sweep could pass by resolving nothing that writes.
  assert.ok(effectsSeen >= 4, `${effectsSeen} authored options carry writes and were resolved`);
});

test('D30: a selection is reserved, and lands only when the exchange drains', async () => {
  const state = await fresh();
  state.dialogue.start('harness_tree');

  // opt_unlock is the shape the defect was reported against: it writes a flag
  // AND moves the node, and both used to happen before the reply existed.
  const exchange = state.dialogue.beginSelection('opt_unlock');

  assert.equal(state.flags.getBoolean('T_HARNESS_UNLOCKED'), false, 'reserved, not written');
  assert.equal(state.dialogue.positionSnapshot().node, 'HARN_1', 'the node has not moved');
  assert.deepEqual(state.dialogue.progressSnapshot(), {}, 'the option is not taken yet');
  assert.deepEqual(
    state.dialogue.presentOptions().map((presented) => presented.option.id),
    ['opt_unlock', 'opt_topic', 'opt_comic', 'opt_exit_1'],
    'the list still shows the node the player is standing on',
  );
  assert.equal(exchange.tx.phase, 'reserved');
  assert.equal(exchange.tx.effects.effects.length, 2, 'one count, one flag');
  assert.throws(() => {
    (exchange.tx.effects.effects as { length: number }).length = 0;
  }, 'the bundle is frozen, not merely conventionally immutable');

  // The echo and the reply play. Still nothing durable.
  exchange.advance('echo');
  exchange.advance('reply');
  assert.equal(state.flags.getBoolean('T_HARNESS_UNLOCKED'), false, 'nothing lands under the reply');
  assert.equal(state.dialogue.positionSnapshot().node, 'HARN_1');

  exchange.settle();
  assert.equal(state.flags.getBoolean('T_HARNESS_UNLOCKED'), true);
  assert.equal(state.dialogue.positionSnapshot().node, 'HARN_2');
  assert.deepEqual(state.dialogue.progressSnapshot(), { harness_tree: ['HARN_1:opt_unlock'] });
  assert.deepEqual(exchange.tx.journal.trace, ['line', 'lineSettle', 'worldState', 'flags', 'stable']);
  assert.equal(exchange.tx.phase, 'settled');
  assert.deepEqual(exchange.tx.counts, { node: 'HARN_2', taken: ['HARN_1:opt_unlock'] });
});

test('D30: EXIT does not close the tree under its own last line', async () => {
  const state = await fresh();
  state.dialogue.start('STAGE_DRIVER');

  // Errata 45's example, exactly: "Thank you for the ride." sets
  // T_COACH_DEPARTED and ends the tree, and the coach must not begin
  // departing underneath the driver's "Wasn't for you."
  const exchange = state.dialogue.beginSelection('drv4');
  assert.equal(state.dialogue.isActive, true, 'the tree is still open while the line plays');
  assert.equal(state.flags.getBoolean('T_COACH_DEPARTED'), false);
  assert.equal(exchange.presentation.ended, true, 'the caller is told it WILL end');

  exchange.settle();
  assert.equal(state.dialogue.isActive, false);
  assert.equal(state.flags.getBoolean('T_COACH_DEPARTED'), true);
});

test('D30: a tree may not write inventory, a room or object state', async () => {
  const state = await fresh();
  state.dialogue.start('harness_tree');
  const exchange = state.dialogue.beginSelection('opt_unlock');
  // Doc 34 G1 -- "a puzzle response presented as dialogue would have two
  // commit owners" -- is prevented by the tree's world refusing the four
  // effects a tree does not own. Reached directly because no authored option
  // can produce one, which is the point.
  const runner = state.dialogue as unknown as { dialogueWorld: () => Record<string, () => void> };
  const forbidden = runner.dialogueWorld();
  for (const name of ['addInventory', 'removeInventory', 'enterRoom', 'setObjectState']) {
    assert.throws(() => (forbidden[name] as () => void)(), new RegExp('Dialogue may not write'), name);
  }
  exchange.settle();
});

test('D30: an abandoned exchange writes nothing and frees its effect ids', async () => {
  const state = await fresh();
  state.dialogue.start('harness_tree');

  const abandoned = state.dialogue.beginSelection('opt_unlock');
  abandoned.abandon('sessionAbandoned');
  assert.equal(state.flags.getBoolean('T_HARNESS_UNLOCKED'), false);
  assert.equal(abandoned.finishedWith(), 'sessionAbandoned');

  // The same option again, which would fire EFFECT_ONE_OWNER if the first
  // reservation had kept its claim.
  state.dialogue.select('opt_unlock');
  assert.equal(state.flags.getBoolean('T_HARNESS_UNLOCKED'), true);
});

test('D30: exhaustion, repeat lines and errata 37 removal are unchanged', async () => {
  const state = await fresh();
  state.dialogue.start('harness_tree');

  const first = state.dialogue.select('opt_topic');
  const second = state.dialogue.select('opt_topic');
  assert.notEqual(first.say, second.say, 'a TOPIC option answers differently once taken');

  const ids = state.dialogue.presentOptions().map((presented) => presented.option.id);
  assert.ok(ids.includes('opt_topic'), 'errata 37: TOPIC stays, greys, remains selectable');

  state.dialogue.select('opt_unlock');
  const after = state.dialogue.presentOptions().map((presented) => presented.option.id);
  assert.ok(!after.includes('opt_unlock'), 'errata 37: a spent PROGRESS option is removed');
});

/* =========================================================================
 * Defect 2 -- "Item/verb resolution writes flags during resolveWith()/
 * resolve()."   D31, adopted by errata 48.
 * ====================================================================== */

test('D31: verb resolution over every target in every room writes no flags', async () => {
  const state = await fresh();
  let resolutions = 0;
  let writingRules = 0;

  for (const room of state.content.rooms.values()) {
    state.enterRoom(room.id);
    for (const target of state.targets) {
      for (const verb of state.content.verbs.verbs) {
        const before = state.flags.snapshot();
        const action = pureResolution(
          () => JSON.stringify(state.flags.snapshot()),
          () => state.verbs.resolve(verb.id, target, room.id),
        );
        assert.deepEqual(state.flags.snapshot(), before, `${room.id}/${target.id}+${verb.id} wrote`);
        if (action.effects.length > 0) {
          writingRules += 1;
          for (const effect of action.effects) {
            assert.equal(EFFECT_PHASE[effect.kind], 'flags', 'a resolver reserves flags only');
          }
        }
        resolutions += 1;
      }
    }
  }

  assert.ok(resolutions >= 500, `swept ${resolutions} verb/target pairs`);
  assert.ok(writingRules >= 2, `${writingRules} authored rules carry flag writes and were resolved`);
});

test('D31: an item combination reserves its writes, and precedence is unchanged', async () => {
  const state = await fresh();
  const table = state.content.combinations;

  for (const pair of table.pairs) {
    const room = state.content.rooms.get(pair.room);
    if (!room) continue;
    state.enterRoom(pair.room);
    const target = state.findTarget(pair.target);
    if (!target) continue;

    const before = state.flags.snapshot();
    const action = state.verbs.resolveWith('USE', pair.item, target, pair.room);
    assert.deepEqual(state.flags.snapshot(), before, `${pair.item} on ${pair.target} wrote`);
    // Doc 24 tier 1: the authored pair answers, and its line is the written
    // one rather than a pool line standing in for it.
    assert.equal(action.say, pair.say ?? null);
    for (const effect of action.effects) {
      assert.equal(EFFECT_PHASE[effect.kind], 'flags');
    }
  }

  // Tiers 2 and 3, in doc 24's order: the item's own pool before the global
  // one, and both rotating rather than repeating.
  state.enterRoom('harness_a');
  const alpha = state.findTarget('hs_alpha') as Interactable;
  const own = state.verbs.resolveWith('USE', 'tuning_fork', alpha, 'harness_a');
  assert.ok(table.itemPools['tuning_fork']?.includes(own.say as string), 'tier 2: the item pool');
  const second = state.verbs.resolveWith('USE', 'tuning_fork', alpha, 'harness_a');
  assert.notEqual(second.say, own.say, 'the pool rotates');

  const global = state.verbs.resolveWith('USE', 'harness_token', alpha, 'harness_a');
  assert.ok(table.globalPool.includes(global.say as string), 'tier 3: the global pool');
});

/* =========================================================================
 * Defect 3 -- "Object state/take/room change occurs before the response line
 * finishes."   D31 success order, adopted by errata 48.
 * ====================================================================== */

test('E48: an interaction resolves over every room without touching the world', async () => {
  const state = await fresh();
  let resolutions = 0;
  let withEffects = 0;

  for (const room of state.content.rooms.values()) {
    state.enterRoom(room.id);
    for (const target of state.targets) {
      for (const verb of state.content.verbs.verbs) {
        const before = worldSignature(state);
        const resolution = state.resolveInteraction(target, verb.id);
        assert.equal(
          worldSignature(state), before,
          `${room.id}/${target.id}+${verb.id} changed the world while resolving`,
        );
        if (resolution.effects.length > 0) withEffects += 1;
        resolutions += 1;
      }
    }
  }

  assert.ok(resolutions >= 500, `swept ${resolutions} interactions`);
  assert.ok(withEffects >= 5, `${withEffects} of them reserved durable effects`);
});

test('E48: the line exists before the object changes and before the item arrives', async () => {
  const state = await fresh();
  state.enterRoom('harness_a');
  const gamma = state.findTarget('hs_gamma') as Interactable;

  const interaction = state.beginInteraction(gamma, 'PICK_UP');
  assert.deepEqual(
    effectKinds(interaction.resolution.effects), ['objectState', 'inventoryAdd'],
    'state and ownership are reserved, in errata 48 order',
  );
  assert.ok(!state.carried.includes('harness_token'), 'nothing has been picked up yet');
  assert.equal(state.stateOf(gamma), 'present', 'and the hatch has not changed');
  assert.deepEqual(interaction.tx.journal.trace, [], 'no phase has been emitted');

  const line = interaction.presentLine();
  assert.equal(line, 'GAMMA BLOCK TAKEN');
  assert.deepEqual(interaction.tx.journal.trace, ['line']);
  assert.ok(
    !state.carried.includes('harness_token'),
    'THE DEFECT: the item used to be in the inventory by now',
  );
  assert.ok(state.findTarget('hs_gamma'), 'and the hatch was still in the room to be looked at');

  const result = interaction.settle();
  assert.equal(result.say, 'GAMMA BLOCK TAKEN');
  assert.ok(state.carried.includes('harness_token'));
  assert.equal(state.findTarget('hs_gamma'), undefined, 'ownership passed: it left the room');
  assert.deepEqual(
    interaction.tx.journal.trace,
    ['line', 'lineSettle', 'worldState', 'inventory', 'stable'],
    'section 9.1 order: the performance, then world state, then inventory',
  );
});

test('E48: a room change lands after the line, and the arrival is saved once', async () => {
  const state = await fresh();
  state.enterRoom('harness_a');
  const door = state.findTarget('exit_a_to_b') as Interactable;

  const interaction = state.beginInteraction(door, state.verbs.walkVerbId);
  assert.equal(interaction.resolution.transit, true);
  assert.equal(interaction.resolution.destination, 'harness_b');
  assert.equal(state.roomId, 'harness_a', 'reserved, not walked through');

  // Doc 14: transit produces no line, so there is no line phase to emit.
  assert.equal(interaction.presentLine(), null);
  assert.deepEqual(interaction.tx.journal.trace, []);

  const result = interaction.settle();
  assert.equal(result.changedRoom, true);
  assert.equal(state.roomId, 'harness_b');
  assert.deepEqual(interaction.tx.journal.trace, ['worldState', 'stable']);

  const save = state.saves.read();
  assert.equal(save?.room, 'harness_b', 'one autosave, at the settle, after the arrival');
});

test('E48: flags and inventory of one action commit exactly once, in order', async () => {
  const state = await fresh();
  state.enterRoom('harness_a');
  const beta = state.findTarget('hs_beta') as Interactable;

  const interaction = state.beginInteraction(beta, 'PUSH');
  assert.equal(state.flags.getNumber('HARNESS_PUSH_COUNT'), 0, 'the counter has not moved');
  interaction.presentLine();
  interaction.settle();
  assert.equal(state.flags.getNumber('HARNESS_PUSH_COUNT'), 1);
  assert.deepEqual(interaction.tx.journal.trace, ['line', 'lineSettle', 'flags', 'stable']);

  // Section 15.2: "State, flags, and inventory occur once." A second settle
  // is refused rather than counted twice.
  assert.throws(() => interaction.settle(), /already finished/);
  assert.equal(state.flags.getNumber('HARNESS_PUSH_COUNT'), 1);
});

test('E48: a reserved interaction that is abandoned changes nothing', async () => {
  const state = await fresh();
  state.enterRoom('harness_a');
  const alpha = state.findTarget('hs_alpha') as Interactable;

  const before = worldSignature(state);
  const interaction = state.beginInteraction(alpha, 'LOOK_AT');
  interaction.presentLine();
  interaction.abandon('playerCancelled');
  assert.equal(worldSignature(state), before, 'an abandoned action leaves no half-written story');
  assert.equal(state.flags.getBoolean('T_HARNESS_EXAMINED'), false);

  // And the ids are free, so the same action can be performed for real.
  state.interact(alpha, 'LOOK_AT');
  assert.equal(state.flags.getBoolean('T_HARNESS_EXAMINED'), true);
});

test('E48: two open interactions on one target are refused, not merged', async () => {
  const state = await fresh();
  state.enterRoom('harness_a');
  const alpha = state.findTarget('hs_alpha') as Interactable;

  const first = state.beginInteraction(alpha, 'LOOK_AT');
  // Doc 34 section 4.6 row 2: one transaction owner per durable effect id.
  assert.throws(() => state.beginInteraction(alpha, 'LOOK_AT'), (error: unknown) => {
    assert.ok(error instanceof IllegalStateError);
    assert.equal(error.code, 'EFFECT_ONE_OWNER');
    return true;
  });
  first.settle();
});

/* =========================================================================
 * What must not have changed
 * ====================================================================== */

test('the roughly forty percent of options that do nothing still do nothing', async () => {
  const state = await fresh();
  let comic = 0;

  for (const tree of state.content.dialogue.values()) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      for (const option of node.options) {
        if (option.tag !== 'COMIC') continue;
        comic += 1;
        state.dialogue.start(tree.id);
        state.dialogue.restore(state.dialogue.progressSnapshot(), { tree: tree.id, node: nodeId });
        if (!state.dialogue.presentOptions().some((shown) => shown.option.id === option.id)) continue;
        const resolution = state.dialogue.resolveSelection(option.id);
        // A COMIC option may set a flag -- invariant 7, HOB_C1 option 4, and
        // doc 34 section 3.1's ruling that the dialogue tag and
        // PuzzleFeedback.COMIC_NOOP are separate namespaces. What it may not
        // do is announce itself, and nothing here marks it.
        assert.equal(resolution.presentation.ended, false, 'a COMIC option is not an exit');
        assert.equal(
          effectKinds(resolution.effects).filter((kind) => kind !== 'dialogueTaken' && kind !== 'flag')
            .length,
          0,
          'a COMIC option reserves nothing but its count and any authored flag',
        );
        state.dialogue.end();
      }
    }
  }

  assert.ok(comic >= 8, `${comic} COMIC options checked`);
});

test('every authored line still answers, resolved rather than written', async () => {
  const state = await fresh();

  // The same guarantee tests/interface.test.ts makes through interact(),
  // made through the pure resolver: LOOK and LISTEN answer everywhere.
  for (const room of state.content.rooms.values()) {
    state.enterRoom(room.id);
    for (const target of state.targets) {
      const isStub = (target as { stub?: boolean }).stub === true;
      const isExit = (target as { to?: string }).to !== undefined;
      if (isStub) continue;
      for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
        if (isExit && state.verbs.isTransit(verb)) continue;
        const resolution = state.resolveInteraction(target, verb);
        assert.ok(
          resolution.say !== null || resolution.dialogue !== null,
          `${room.id}/${target.id} + ${verb} resolved to nothing`,
        );
      }
    }
  }
});
