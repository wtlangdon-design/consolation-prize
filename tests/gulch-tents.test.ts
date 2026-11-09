/**
 * FIDDLER'S GULCH, ROOM 51: THE TENTS AND THE LOOKOUT (reference/fiddlers-gulch/brief.md, "What the engine needs" 4;
 * doc 109; errata 202).
 *
 * "Before G3, walking from 51 toward 52 or 53 is stopped with doc 109's three lines. Giving him the paper is G3."
 * The lines are said one a time, in order, then the third again, counted so a save keeps its place; after G3 the
 * ways are open. His barks are said one a visit, in turn, the same in every reputation state, and change at G3; his
 * tree opens on the side of G3 the player is on. GIVE THE DEED is his line; GIVE anything else is the player's. And the
 * Gulch's people each answer a wrong verb (errata 202), which the readiness gate now requires by name.
 *
 * Every line asserted here is read from doc 109 or from the content extracted from it, never typed into this file.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations.
import { readiness } from '../tools/check-room-readiness.mjs';

// PLAYS: G3

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc109 = await readFile(resolve(ROOT, 'docs/109-fiddlers-gulch-lines.md'), 'utf8');
const quotes = (text: string) => [...text.replace(/\*\([^)]*\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
const lineStarting = (starts: string) => {
  const found = doc109.split('\n').find((line) => line.startsWith(starts));
  assert.ok(found, `doc 109 has a line starting ${starts}`);
  return found;
};
const STOPPED = quotes(lineStarting('**STOPPED BY THE LOOKOUT**'));
const BARKS_BEFORE = quotes(lineStarting('**Barks, before G3**'));
const BARKS_AFTER = quotes(lineStarting('**Barks, after G3**'));
const [DEED, ANYTHING_ELSE] = quotes(lineStarting('**THE LOOKOUT** · GIVE THE DEED'));

const ROOM = (await import('../proofs/readiness/room-51.sources.json', { with: { type: 'json' } })).default.roomFile as string;

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture && state.applyFixture(fixture), `fixture ${fixtureId} applies`);
  assert.ok(ROOM.endsWith(`${state.roomId.replace(/_/g, '-')}.json`), `${fixtureId} stands in Room 51`);
  return state;
};
const lookoutOf = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc, 'the tents have a person with a tree');
  return npc;
};
const asTarget = (state: GameState): Interactable => {
  const npc = lookoutOf(state);
  return { id: npc.id, name: npc.name, rect: [npc.x - 40, npc.y - 200, 80, 200], colour: 0, responses: {} } as Interactable;
};
const give = (state: GameState, item: string) => {
  state.holdItem(null);
  state.holdItem(item);
  const result = state.interact(asTarget(state), 'USE');
  state.holdItem(null);
  return result;
};
const walk = (state: GameState, id: string) => {
  const way = state.findTarget(id);
  assert.ok(way, `${id} is a way out of the tents`);
  return state.interact(way, 'WALK_TO');
};
const spoken = (one: unknown) => (typeof one === 'string' ? one : (one as { line: string }).line);

test('before G3 the lookout stops him at the grog tent and the river, one line a time, in order, then the third again', async () => {
  const state = await inState('r51-a');
  assert.equal(STOPPED.length, 3);
  const said: string[] = [];
  for (const id of ['to_grog_tent', 'to_river', 'to_grog_tent', 'to_river']) {
    const result = walk(state, id);
    said.push(result.say!);
    assert.equal(result.goesTo ?? null, null, `${id}: he stays in the tents`);
    assert.equal(state.roomId, 'gulch_tents');
  }
  assert.deepEqual(said, [STOPPED[0], STOPPED[1], STOPPED[2], STOPPED[2]], 'one a time, in order, then the third again');
  assert.equal(state.flags.getNumber('LOOKOUT_STOPS'), 3, 'counted in a flag, so a save keeps its place');
  const path = walk(state, 'to_ledge');
  assert.ok(!STOPPED.includes(path.say ?? ''), 'the path back up is never stopped');
});

test('Giving him the paper is G3: his scene, the paper leaves inventory, and the ways are open', async () => {
  const state = await inState('r51-a');
  const npc = lookoutOf(state);
  // The paper is whatever item the pair that completes G3 takes, read from the content (never named here).
  const pair = state.content.combinations.pairs.find((one) => one.target === npc.id && one.rules?.some((rule) => rule.completes === 'G3'))!;
  const paper = pair.item;
  const result = give(state, paper);
  const scene = pair.rules![0]!;
  assert.equal(result.say, scene.say, 'the direction first');
  assert.deepEqual((result.then ?? []).map(spoken), (scene.then ?? []).map(spoken), 'then the exchange, in order');
  assert.ok(state.puzzleComplete('G3'), 'G3 is complete');
  assert.equal(state.flags.get('T_CAMP_TRUSTS'), true);
  assert.ok(!state.carried.includes(paper), 'the paper leaves inventory');
  for (const id of ['to_grog_tent', 'to_river']) {
    const way = state.findTarget(id) as { transitScene?: { when?: Record<string, unknown> }[] };
    assert.ok(!(way.transitScene ?? []).some((rule) => state.flags.test(rule.when as never)), `${id}: no stop holds after G3`);
  }
});

test('GIVE THE DEED is his line; anything else is the player\'s', async () => {
  const state = await inState('r51-a');
  const deed = give(state, 'deed');
  assert.equal(deed.say, DEED);
  assert.equal(give(state, 'tuning_fork').say, ANYTHING_ELSE);
  assert.equal(give(state, 'brass_rod').say, ANYTHING_ELSE);
  assert.equal(state.flags.get('T_CAMP_TRUSTS'), false, 'none of them is proof he owns nothing');
});

test('his barks are said one a visit, in turn and round again, the same in every state, and change at G3', async () => {
  for (const [fixtureId, lines] of [['r51-a', BARKS_BEFORE], ['r51-b', BARKS_AFTER]] as const) {
    const state = await inState(fixtureId);
    const npc = lookoutOf(state);
    assert.deepEqual(npc.barks, {}, 'no reputation barks: the Gulch has not heard of him (doc 107)');
    const layer = new AmbientLayer(state);
    const heard: string[] = [];
    for (let visit = 0; visit < 4; visit += 1) {
      layer.arrived();
      heard.push(layer.checkApproach(npc.x, npc.y)!.line);
      assert.equal(layer.checkApproach(npc.x, npc.y), null, 'one a visit');
    }
    assert.deepEqual(heard, [...lines, lines[0]], `${fixtureId}: in turn, and round again`);
    // The town's worst opinion of him (its last state's headline puzzle complete) changes nothing here.
    const { states, setBy } = state.content.reputation;
    const headline = setBy?.[states[states.length - 1]!];
    if (headline) (state as unknown as { puzzles: Map<string, string> }).puzzles.set(headline, 'complete');
    assert.equal(state.reputationIndex, states.length - 1);
    layer.arrived();
    assert.equal(layer.checkApproach(npc.x, npc.y)!.line, lines[1], 'whatever the town thinks of him');
  }
});

test('his tree opens on the side of G3 the player is on, with the options that side offers', async () => {
  for (const [fixtureId, trusted] of [['r51-a', false], ['r51-b', true]] as const) {
    const state = await inState(fixtureId);
    const tree = state.content.dialogue.get(lookoutOf(state).tree!)!;
    const entry = (tree.entries ?? []).find((one) => state.flags.test(one.when));
    const node = tree.nodes[entry?.node ?? tree.start]!;
    const openings = [...doc109.matchAll(/^> \*\*LOOKOUT:\*\* \*\((before|after) G3\)\* "([^"]+)"/gm)];
    // What is SPOKEN, not the prompt the renderer draws nowhere (errata 218: this line was only ever the prompt).
    assert.deepEqual(state.dialogue.openingOf(tree.id).map((one) => one.line),
      [openings.find((m) => (m[1] === 'after') === trusted)![2]], 'his opening is spoken, the side of G3 the player is on');
    const offered = node.options.filter((one) => state.flags.test(one.when)).map((one) => one.text);
    assert.equal(offered.includes(quotes(lineStarting('| 5 |'))[0]!), trusted, 'You trust me now? -- after G3 only');
    assert.equal(offered.includes(quotes(lineStarting('| 1 |'))[0]!), !trusted, "I'm not a claim jumper -- before G3 only");
  }
});

test('the Gulch\'s people each answer a wrong verb, and the readiness gate asks for each by name (errata 202)', async () => {
  const state = await inState('r51-a');
  const room = state.room as { peopleResponses?: Record<string, Record<string, unknown>> };
  const npc = lookoutOf(state);
  for (const verb of ['PICK_UP', 'PUSH', 'USE', 'LOOK_AT', 'LISTEN_TO']) {
    assert.ok(room.peopleResponses?.[npc.id]?.[verb], `the lookout answers ${verb}`);
  }
  for (const n of [51, 52, 53, 54]) {
    // The gate's own function, not its command line: the command writes proofs/readiness/room-NN.json with a fresh
    // timestamp, and a test that writes to the tree fails CI's clean-tree step.
    const result = await readiness(n) as { dimensions: { question: string; answer: string }[]; content: { question: string; answer: string }[] };
    const asked = [...result.content, ...result.dimensions].find((one) => one.question === 'Character behaviour sufficiently authored?');
    assert.equal(asked?.answer, 'YES', `Room ${n}: every person answers a wrong verb`);
  }
});
