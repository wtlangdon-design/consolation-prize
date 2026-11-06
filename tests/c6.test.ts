import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: C6

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * C6, THE ASSAY RETURNS. Doc 57 C6 and doc 04 WIN_B4: "Opened by the first
 * TALK TO after WIN_B2 option 1 has left C6 pending and Thad has been out of
 * the office and back. The opening completes C6 and issues Document B."
 *
 * From the C5-complete fixture: ask for the assay, talk again without leaving
 * (still WIN_B2), leave and come back, and the next conversation opens on the
 * returned assay -- once.
 */
const setup = async () => {
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  assert.ok(state.applyFixture(content.fixtures.get('r5-c-post')!));
  const npc = [...content.ambient.values()].find((one) => one.room === state.roomId && one.tree)!;
  const office = state.roomId;
  const outside = state.room.exits[0]!.to;
  return { content, storage, state, tree: npc.tree as string, office, outside };
};

test('asking is not enough: the assay is back only once he has left the office and come in again', async () => {
  const { state, tree, office, outside } = await setup();
  state.dialogue.start(tree);
  state.dialogue.select('winnie1');
  state.dialogue.end();
  assert.equal(state.puzzleProgress().C6, 'pending');
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_B2', 'still asking, not yet returned');
  state.dialogue.end();
  state.enterRoom(outside);
  state.enterRoom(office);
  const opening = state.dialogue.openingOf(tree);
  assert.ok(opening.length >= 3, 'the returned assay is spoken');
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_B4');
  assert.equal(state.puzzleComplete('C6'), true, 'the opening completes C6');
  assert.ok(state.carried.includes('document_b'), 'and issues Document B');
});

test('the opening happens once: Document B is not issued twice and the greeting is not replayed', async () => {
  const { content, storage, state, tree, office, outside } = await setup();
  state.dialogue.start(tree);
  state.dialogue.select('winnie1');
  state.dialogue.end();
  state.enterRoom(outside);
  state.enterRoom(office);
  state.dialogue.start(tree);
  state.dialogue.end();
  const count = state.carried.filter((one) => one === 'document_b').length;
  state.enterRoom(outside);
  state.enterRoom(office);
  assert.deepEqual(state.dialogue.openingOf(tree), [], 'no replay');
  state.dialogue.start(tree);
  assert.equal(state.carried.filter((one) => one === 'document_b').length, count, 'issued once');
  state.dialogue.end();
  state.save();
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load());
  assert.equal(loaded.puzzleComplete('C6'), true);
  assert.ok(loaded.carried.includes('document_b'));
});

test('before the asking, coming and going changes nothing', async () => {
  const { state, tree, office, outside } = await setup();
  state.enterRoom(outside);
  state.enterRoom(office);
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_B2');
  assert.notEqual(state.puzzleProgress().C6, 'complete');
});
