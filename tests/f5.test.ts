import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: F5

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const docs = (await Promise.all(['docs/57-puzzle-completion.md', 'docs/04-dialogue-trees.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');

/**
 * F5, THE FILING. Doc 57 F5 and doc 48 S6: after F4, the four documents laid
 * on the counter one by one in any order (each a USE on THE COUNTER); anything
 * already given is "Already on file"; then SUM_F1, the name -- only the
 * claim's own holder advances -- WIN_F2 and the read-back; T_FILED, F5, and the room hands
 * on to the dawn.
 */
const setup = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r7-d')!));
  state.flags.set('T_FANSHAWE_BEATEN', true);
  state.flags.set('T_ASSAY_RUN', true);
  const four = content.combinations!.pairs
    .filter((pair) => pair.room === state.roomId && pair.rules?.some((rule) => rule.add?.F5_LAID))
    .map((pair) => pair.item);
  const inventory = (state as unknown as { inventory: string[] }).inventory;
  for (const item of [...four, 'survey']) if (!inventory.includes(item)) inventory.push(item);
  const counter = state.findTarget('counter')!;
  const npc = [...content.ambient.values()].find((one) => one.room === state.roomId && one.tree)!;
  return { content, state, four, counter, tree: npc.tree };
};

test('the four documents go down one by one, in any order, each with doc 57\'s lines', async () => {
  const { state, four, counter } = await setup();
  assert.equal(four.length, 4);
  for (const item of [...four].reverse()) {
    state.holdItem(null);
    state.holdItem(item);
    const said = state.interact(counter, 'USE');
    assert.ok(said.say && docs.includes(said.say), `${item}: "${said.say}"`);
  }
  assert.equal(state.flags.getNumber('F5_LAID'), 4);
  state.holdItem(null);
  state.holdItem(four[0]!);
  const again = state.interact(counter, 'USE').say!;
  assert.ok(again.startsWith('Already on file'), 'a paper already down is on file');
  assert.equal(state.flags.getNumber('F5_LAID'), 4, 'and is not counted twice');
  state.holdItem(null);
  state.holdItem('survey');
  assert.ok(state.interact(counter, 'USE').say!.startsWith('Already on file'), 'so is anything he gave the office before');
});

test('the name: only the first name advances, and the filing is the end of the office', async () => {
  const { state, four, counter, tree } = await setup();
  state.dialogue.start(tree);
  assert.notEqual(state.dialogue.positionSnapshot().node, 'SUM_F1', 'not before the four are down');
  state.dialogue.end();
  for (const item of four) { state.holdItem(null); state.holdItem(item); state.interact(counter, 'USE'); }
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'SUM_F1');
  for (const wrong of ['sump2', 'sump3', 'sump4']) {
    state.dialogue.select(wrong);
    assert.equal(state.flags.get('T_FILED'), false, `${wrong} does not file`);
  }
  state.dialogue.select('sump1');
  assert.equal(state.flags.get('T_FILED'), true);
  assert.equal(state.puzzleComplete('F5'), true);
  assert.equal(state.flags.test(state.room.afterTimeline!.when), true, 'the room hands on');
  assert.ok(state.content.rooms.has(state.room.afterTimeline!.goto), 'to the dawn');
});

test('before the duel is won, the counter answers as it always has', async () => {
  const { state, four, counter } = await setup();
  state.flags.set('T_FANSHAWE_BEATEN', false);
  state.holdItem(null);
  state.holdItem(four.find((item) => item !== 'deed')!);
  state.interact(counter, 'USE');
  assert.equal(state.flags.getNumber('F5_LAID'), 0);
});
