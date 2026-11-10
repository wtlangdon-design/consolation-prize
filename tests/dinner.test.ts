import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playThrough } from './lib/headless-player.ts';

// PLAYS: A10

/**
 * THE DINNER IS ENDED BY HAND (doc 120 I-1; errata 248). It was a list of things to say, and one of them ended it. Now
 * he keeps his chair, the table can be tried, the contract is under the silver cover, and the cover put back over it is
 * what ends the dinner. Held here: nothing said ends it; nothing on the table ends it but that; the dish is covered
 * again for a dinner begun again; and he keeps the seat until it is over.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as { steps: { id: string }[] };

/** At the table: the route played to the step that walks him into the dinner. */
function atTheTable() {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  const upTo = walkthrough.steps.findIndex((step) => step.id === 'A10.1');
  playThrough(player, walkthrough.steps.slice(0, upTo + 1) as never);
  return { state, player };
}
const DINED = 'T_DINED';

test('nothing he can say at the table ends the dinner', () => {
  const { state } = atTheTable();
  const host = state.content.ambient.get(state.room.onEnter!.accost!.npc)!;
  const node = state.content.dialogue.get(host.tree!)!.nodes[state.dialogue.positionSnapshot().node!]!;
  for (const option of node.options) {
    assert.notEqual(option.set?.[DINED], true, `${option.id} ends the dinner by being said`);
    assert.equal(option.puzzle?.A10, undefined, `${option.id} completes the dinner by being said`);
  }
  // Every row is tried, as often as it is offered, and he is still at dinner.
  for (let round = 0; round < 3; round += 1) {
    for (const offered of state.dialogue.presentOptions()) {
      if (offered.option.ends || offered.exhausted) continue;
      state.dialogue.select(offered.option.id);
    }
  }
  assert.equal(state.flags.get(DINED), false);
});

test('on the table, only the cover put back over the contract ends it; and it hands him the handkerchief', () => {
  const { state } = atTheTable();
  state.dialogue.end();
  const laid = state.targets.filter((one) => 'when' in one && JSON.stringify((one as { when?: unknown }).when ?? {}).includes(DINED));
  assert.ok(laid.length >= 3, `the table's things are there (${laid.map((one) => one.id).join(', ')})`);
  const verbs = state.content.verbs.verbs.map((verb) => verb.id).filter((id) => id !== state.content.verbs.walkVerb.id);
  // While the dish is covered: every verb that changes nothing is tried, and nothing that changes anything ends it.
  for (const target of laid) {
    for (const verb of verbs) {
      if (verb === 'TALK_TO') continue;
      const rule = target.responses?.[verb]?.find((one) => state.flags.test(one.when));
      assert.notEqual(rule?.set?.[DINED], true, `${verb} ${target.id} ends the dinner with the dish covered`);
      if (rule?.set) continue;
      state.interact(target, verb);
      assert.equal(state.flags.get(DINED), false, `${verb} ${target.id} ended the dinner`);
    }
  }
  const dish = laid.find((one) => one.responses?.OPEN?.some((rule) => Object.keys(rule.set ?? {}).length === 1))!;
  assert.ok(dish, 'a dish to uncover');
  state.interact(dish, 'OPEN');
  // The contract is there now, and of everything on the table one verb on one thing ends it.
  const enders: string[] = [];
  const again = state.targets.filter((one) => JSON.stringify((one as { when?: unknown }).when ?? {}).includes(DINED));
  for (const target of again) {
    for (const verb of verbs) {
      const rule = target.responses?.[verb]?.find((one) => state.flags.test(one.when));
      if (rule?.set?.[DINED] === true) enders.push(`${verb} ${target.id}`);
    }
  }
  assert.equal(enders.length, 1, `one way to end it: ${enders.join(', ')}`);
  assert.match(enders[0]!, /^CLOSE /, 'and it is the cover put back');
  const [, id] = enders[0]!.split(' ');
  const before = state.carried.length;
  state.interact(state.findTarget(id!)!, 'CLOSE');
  assert.equal(state.flags.get(DINED), true);
  assert.ok(state.puzzleComplete('A10'));
  assert.ok(state.carried.includes('handkerchief'));
  assert.ok(!state.carried.includes('invitation'), 'and the invitation is left on the table');
  assert.equal(state.carried.length, before, 'one thing in, one thing out');
});

test('a dinner left by the door starts again with the dish covered; and he keeps his seat until it is over', () => {
  const { state } = atTheTable();
  state.dialogue.end();
  const served = Object.keys(state.room.onEnter!.set ?? {});
  assert.equal(served.length, 1, 'entering covers the dish again');
  const dish = state.targets.find((one) => one.responses?.OPEN?.some((rule) => rule.set?.[served[0]!] === true))!;
  state.interact(dish, 'OPEN');
  assert.equal(state.flags.get(served[0]!), true);
  const door = state.room.exits.find((exit) => exit.transitScene?.some((rule) => state.flags.test(rule.when) && !rule.stays))!;
  assert.ok(door, 'the door answers from the table, and lets him go');
  const office = state.roomId;
  state.enterRoom(door.to);
  state.enterRoom(office);
  assert.equal(state.flags.get(served[0]!), false);
  const seat = state.room.onEnter!.accost!.seat!;
  assert.deepEqual(seat.keepWhile, { [DINED]: false }, 'the chair is his until the dinner is over');
});
