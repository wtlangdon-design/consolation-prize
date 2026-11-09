/**
 * FIDDLER'S GULCH: WHAT CHANGES IN CONSOLATION (reference/fiddlers-gulch/brief.md, "What changes in Consolation";
 * doc 109; doc 108 THE RIDE; errata 213).
 *
 *   A9   the filing fee paid, Sump goes into the back and comes out with the third copy (doc 109 A9).
 *   B1   Frame's trade pays in the Clarion as well, still damp (doc 109 B1).
 *   G1   Ozymandia hires out the second rod for the filing fee in Act II; without the money she will not (doc 109 G1).
 *   B3   the fork on Grievance is the ride over black to the washout, and the trip begins (doc 108).
 *        Going home is USE on Grievance once Vessel has gone for the coach (G9), and lands in the Nugget.
 *   VES_B1 in the Nugget, after the trip, opens on doc 109's greeting and has neither the replay nor the
 *        challenge: those were the Gulch's (tests/assay.test.ts plays both).
 *
 * Every line asserted is read from the content extracted from the documents; every room, person and item from the
 * fixtures and the content. Nothing here is typed from a document.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer } from './lib/headless-player.ts';

// PLAYS: G1

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

const inFixture = async (id: string, also: { flags?: Record<string, boolean | number>; carrying?: string[] } = {}) => {
  const state = new GameState(await loadContent(fsReader), new MemoryStorage());
  const fixture = state.content.fixtures.get(id);
  assert.ok(fixture, `fixture ${id}`);
  const merged = {
    ...fixture,
    flags: { ...fixture.flags, ...also.flags },
    inventory: also.carrying ?? fixture.inventory,
  };
  assert.ok(state.applyFixture(merged), `fixture ${id} applies`);
  return { state, player: new HeadlessPlayer(state) };
};

/** The option of a tree whose gate takes an item, read from the content: G1's two halves. */
const g1Options = (state: GameState) => {
  for (const tree of state.content.dialogue.values()) {
    for (const node of Object.values(tree.nodes)) {
      const paid = node.options.find((one) => one.puzzle?.G1);
      if (!paid) continue;
      const unpaid = node.options.find((one) => one !== paid && one.text === paid.text && one.lacks?.length);
      return { tree, node, paid, unpaid };
    }
  }
  assert.fail('some option completes G1');
};
const npcOfTree = (state: GameState, treeId: string) =>
  [...state.content.ambient.values()].find((npc) => npc.tree === treeId)!;

test('G1: in Act II, with the filing fee, the second rod is hired; the fee goes and the rod comes', async () => {
  const { state, player } = await inFixture('r16-a', { flags: { ACT: 2 } });
  const { tree, paid } = g1Options(state);
  assert.deepEqual(paid.holds, paid.takes, 'it asks for the money it takes');
  const fee = paid.takes![0]!;
  assert.ok(state.carried.includes(fee));
  player.talk(npcOfTree(state, tree.id).id);
  assert.ok(state.dialogue.presentOptions().some((one) => one.option.id === paid.id), 'offered with the money in hand');
  player.choose(paid.id);
  player.leave();
  assert.ok(state.puzzleComplete('G1'));
  assert.ok(!state.carried.includes(fee), 'the fee is spent');
  for (const item of paid.gives ?? []) assert.ok(state.carried.includes(item), `${item} is carried`);
  assert.ok(Object.entries(paid.set ?? {}).every(([flag, value]) => state.flags.get(flag) === value));
});

test('G1: without the money, she will not; the option stays, and asked again it is doc 109\'s "without" line', async () => {
  const content = await loadContent(fsReader);
  const fixture = content.fixtures.get('r16-a')!;
  const { paid: g1 } = g1Options(new GameState(content, new MemoryStorage()));
  const fee = g1.takes![0]!;
  const { state, player } = await inFixture('r16-a', { flags: { ACT: 2 }, carrying: fixture.inventory!.filter((item) => item !== fee) });
  const { tree, paid, unpaid } = g1Options(state);
  assert.ok(unpaid, 'the same question, gated on lacking the fee');
  assert.ok(!state.carried.includes(fee));
  player.talk(npcOfTree(state, tree.id).id);
  const offered = () => state.dialogue.presentOptions().map((one) => one.option.id);
  assert.ok(!offered().includes(paid.id) && offered().includes(unpaid!.id));
  player.choose(unpaid!.id);
  assert.ok(!state.puzzleComplete('G1'));
  for (const item of paid.gives ?? []) assert.ok(!state.carried.includes(item), `no ${item} without paying`);
  assert.ok(offered().includes(unpaid!.id), 'still offered: the money can be found');
  const again = state.dialogue.select(unpaid!.id);
  assert.equal(again.say ?? again.rest[0]?.line, unpaid!.repeat, 'the repeat is the "without" line');
});

test('G1: not before Act II', async () => {
  const { state, player } = await inFixture('r16-a');
  const { tree, paid, unpaid } = g1Options(state);
  player.talk(npcOfTree(state, tree.id).id);
  const offered = state.dialogue.presentOptions().map((one) => one.option.id);
  assert.ok(!offered.includes(paid.id) && !offered.includes(unpaid!.id));
});

test('A9: the fee paid after the deed and the survey, the clerk goes into the back and brings the third copy', async () => {
  const { state } = await inFixture('r7-b');
  const pair = state.content.combinations.pairs.find((one) => one.puzzle === 'A9' && one.rules?.some((rule) => rule.items?.length));
  assert.ok(pair, 'A9\'s last pair hands something over');
  const rule = pair.rules!.find((one) => one.items?.length)!;
  const copy = rule.items!.find((item) => !state.carried.includes(item))!;
  const player = new HeadlessPlayer(state);
  // The statute's order (tests/room-07.test.ts): the deed and the survey on the counter, read from A9's own pairs.
  for (const item of ['deed', 'survey']) {
    const on = state.content.combinations.pairs.find((one) => one.puzzle === 'A9' && one.item === item)!;
    player.use(item, on.target!);
  }
  player.use(pair.item!, pair.target!);
  assert.ok(state.puzzleComplete('A9'));
  assert.ok(state.carried.includes(copy), `${copy} is carried`);
  const said = (rule.then ?? []).filter((one) => typeof one === 'object' && one.direction).map((one) => (one as { line: string }).line);
  assert.ok(said.length > 0, 'he goes into the back, and the direction is doc 109\'s');
});

test('B1: either story buys the newspaper as well as Fiddler\'s Gulch', async () => {
  const { state, player } = await inFixture('r9-a');
  const frameTree = [...state.content.dialogue.values()].find((tree) =>
    Object.values(tree.nodes).some((node) => node.options.some((one) => one.puzzle?.B1)))!;
  const [nodeId, node] = Object.entries(frameTree.nodes).find(([, one]) => one.options.some((option) => option.puzzle?.B1))!;
  const stories = node.options.filter((one) => one.puzzle?.B1);
  assert.ok(stories.length >= 2, 'two stories');
  for (const story of stories) assert.ok(story.gives?.length, `${story.id} hands something over`);
  const paper = stories[0]!.gives![0]!;
  assert.ok(stories.every((one) => one.gives!.includes(paper)), 'the same paper either way');
  player.talk(npcOfTree(state, frameTree.id).id);
  const path = state.dialogue.positionSnapshot().node === nodeId ? [] : state.dialogue.presentOptions()
    .filter((one) => one.option.goto === nodeId).map((one) => one.option.id);
  for (const id of path.slice(0, 1)) player.choose(id);
  player.choose(stories[0]!.id);
  assert.ok(state.puzzleComplete('B1'));
  assert.ok(state.carried.includes(paper), `${paper} is carried`);
});

test('B3 to the washout, and home again: USE on the mule once he has gone for the coach lands back in town', async () => {
  const { state, player } = await inFixture('r45-a');
  const mule = state.targets.find((one) => one.responses?.USE?.some((response) => response.goto))!;
  assert.ok(mule, 'something in the washout rides home');
  const home = mule.responses!.USE!.find((response) => response.goto)!;
  assert.ok(!state.flags.test(home.when), 'not before G9');
  const early = state.interact(mule, 'USE');
  assert.equal(state.roomId, state.content.fixtures.get('r45-a')!.room, 'and stays put');
  assert.ok(early.say !== home.say);
  state.flags.set('T_VESSEL_FOUND', true);
  const ride = player.verb(mule.id, 'USE');
  assert.equal(ride.say, home.say);
  assert.ok((home.then ?? []).some((one) => typeof one === 'object' && one.overBlack), 'the ride is over black');
  player.settle();
  assert.equal(state.roomId, home.goto);
  assert.equal(state.flags.get('T_GULCH_HOME'), true);
});
