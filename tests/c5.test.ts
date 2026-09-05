import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * C5 AND WIN_B2, AT THE STATE LEVEL. Errata 66 A-C, doc 53, doc 36 Q113.
 * The scene's walk and beat are proven in the game (tools/gauntlet/c5-proof.mjs);
 * these drive the same state the scene drives: the pair that fires once,
 * the puzzle that lands only at contact, the tree that opens through it,
 * and the rows that move the world as doc 04 says.
 *
 * Ids of the fiction are read from the data where possible: the fixture
 * named for the state, the pair from the combinations table, the tree from
 * the room's character.
 */
const setup = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  const npc = [...content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  const pair = content.combinations.pairs.find((one) => one.room === state.roomId && one.target === npc.id && one.opens);
  assert.ok(pair, 'doc 24 pairs an item with the character in this room');
  return { content, storage, state, npc, pair, tree: npc.tree as string };
};

test('the item is extracted from doc 23 with the owner\'s copy, and is held in the ready fixture', async () => {
  const { content, state, pair } = await setup('r5-c');
  const item = content.items.get(pair.item);
  assert.ok(item, 'the pair\'s item exists');
  assert.ok(item.note?.includes('EXTRACTED from docs/23-inventory-act1.md'));
  assert.ok(state.carried.includes(pair.item), 'held in the ready state');
  assert.equal(item.responses?.LOOK_AT?.[0]?.repeat?.length, 2, 'three LOOK lines');
  assert.equal(item.responses?.LISTEN_TO?.[0]?.repeat?.length, 2, 'three LISTEN lines');
});

test('the pair is live in the ready state, and not before its puzzles or after its own', async () => {
  const { content, state, npc, pair } = await setup('r5-c');
  assert.ok(state.evidencePairFor(pair.item, npc.id), 'live: the puzzles it needs are complete and its own is not');
  assert.equal(state.puzzleComplete(pair.completes as string), false, 'C5 is not written before contact');
  // Before its prerequisites: the same item held with C4 not complete.
  const early = new GameState(content, new MemoryStorage());
  early.applyFixture({ id: 'x', label: 'x', room: state.roomId, flags: {}, inventory: [pair.item] });
  assert.equal(early.evidencePairFor(pair.item, npc.id), null, 'not live without its prerequisites');
  // Another item on the same person: no pair.
  assert.equal(state.evidencePairFor('tuning_fork', npc.id), null, 'an unrelated item has no pair here');
});

test('contact commits C5 exactly once, keeps the item, and the tree then opens through the action', async () => {
  const { state, npc, pair, tree } = await setup('r5-c');
  assert.deepEqual(state.dialogue.openingOf(tree), state.dialogue.openingOf(tree, true), 'before C5 the greeting is the same either way');
  state.commitEvidence(pair);
  assert.equal(state.puzzleComplete('C5'), true);
  assert.ok(state.carried.includes(pair.item), 'showing is not surrendering');
  assert.equal(state.evidencePairFor(pair.item, npc.id), null, 'the pair does not fire again');
  const opening = state.dialogue.openingOf(tree, true);
  assert.equal(opening.length, 4, 'WIN_B2\'s four-line opening, for the action');
  assert.deepEqual(state.dialogue.openingOf(tree), [], 'and an ordinary TALK TO does not replay it');
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_B2');
  assert.equal(state.dialogue.presentOptions().length, 5, 'four rows and the exit');
});

test('WIN_B2\'s rows move the world as doc 04 says, through W1, and the states stay apart', async () => {
  const { state, pair, tree } = await setup('r5-c-post');
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_B2');
  const rows = state.dialogue.presentOptions().map((p) => p.option.id);
  assert.deepEqual(rows, ['winnie1', 'winnie2', 'winnie3', 'winnie4', 'winniex'], 'authored order');
  assert.equal(state.puzzleProgress().C6, undefined, 'C6 is nothing yet');
  state.dialogue.select('winnie1');
  assert.equal(state.puzzleProgress().C6, 'pending', 'the assay is granted: C6 pending, not complete');
  assert.equal(state.puzzleComplete('C6'), false);
  assert.ok(!state.carried.includes('document_b'), 'no Document B');
  state.dialogue.select('winnie2');
  assert.equal(state.flags.get('T_NO_MOTT_GOLD'), true);
  state.dialogue.select('winnie3');
  assert.equal(state.flags.get('T_SECOND_LEDGER'), true);
  assert.equal(state.stateOf(state.targets.find((t) => t.id === 'floorboard')!), 'rest', 'the board is untouched');
  const after = state.dialogue.presentOptions().map((p) => p.option.id);
  assert.deepEqual(after, ['winnie4', 'winniex'], 'the three progress rows are removed; the comic and the exit remain');
  state.dialogue.select('winnie4');
  assert.ok(state.dialogue.presentOptions().some((p) => p.option.id === 'winnie4' && p.exhausted), 'the comic is retained and greyed');
  assert.equal(state.puzzleComplete('C5'), true, 'C5 stays complete');
  assert.ok(state.carried.includes(pair.item), 'the log is still held');
  // Apart: puzzle progress, topic flags, inventory, counts.
  assert.deepEqual(Object.keys(state.puzzleProgress()).sort(), ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
  assert.equal(state.flags.isDefined('T_QUEUE_PADDED'), false, 'no topic flag stands in for C5 (the build declares none)');
  assert.deepEqual(state.dialogue.progressSnapshot()[tree], { 'WIN_B1:winnie1': 1, 'WIN_B2:winnie1': 1, 'WIN_B2:winnie2': 1, 'WIN_B2:winnie3': 1, 'WIN_B2:winnie4': 1 });
});

test('removed rows, the pending puzzle and the topics survive re-entry, save and load', async () => {
  const { content, storage, state, tree } = await setup('r5-c-post');
  state.dialogue.start(tree);
  state.dialogue.select('winnie1'); state.dialogue.select('winnie3');
  state.dialogue.end();
  state.dialogue.start(tree);
  assert.deepEqual(state.dialogue.presentOptions().map((p) => p.option.id), ['winnie2', 'winnie4', 'winniex'], 'gone on re-entry');
  state.dialogue.end();
  state.save();
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load());
  assert.equal(loaded.puzzleProgress().C5, 'complete');
  assert.equal(loaded.puzzleProgress().C6, 'pending');
  assert.equal(loaded.flags.get('T_SECOND_LEDGER'), true);
  loaded.dialogue.start(tree);
  assert.equal(loaded.dialogue.positionSnapshot().node, 'WIN_B2', 'still WIN_B2 while C5 is the current state');
  assert.deepEqual(loaded.dialogue.presentOptions().map((p) => p.option.id), ['winnie2', 'winnie4', 'winniex']);
  assert.deepEqual(loaded.dialogue.openingOf(tree), [], 'no replay of the confrontation after a load');
});

test('T_SECOND_LEDGER does not route to WIN_B3: the tree has no such node yet, and WIN_B2 stays the root', async () => {
  const { content, state, tree } = await setup('r5-c-post');
  state.flags.set('T_SECOND_LEDGER', true);
  assert.equal(content.dialogue.get(tree)?.nodes.WIN_B3, undefined, 'WIN_B3 is not extracted in this slice');
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_B2');
});
