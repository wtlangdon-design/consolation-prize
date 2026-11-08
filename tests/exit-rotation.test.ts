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
 * DOC 04'S GOODBYES ROTATE (errata 167; Tyler, 2026-11-07: "'I've taken enough of your time. I'll take more later.'
 * shouldn't be used multiple times"). Every universal exit shows the pool's next line, taken in turn, whichever
 * tree it is in, and a saved game goes on from where it was.
 */
test('every goodbye comes round once before any comes round twice, across trees and a save', async () => {
  const content = await loadContent(fsReader);
  assert.ok(content.exitPool.length >= 3, 'doc 04\'s pool is loaded');
  const storage = new MemoryStorage();
  let state = new GameState(content, storage);
  const trees = [...content.dialogue.values()].filter((tree) =>
    (tree.nodes[tree.start]?.options ?? []).some((option) => option.universal && !option.when));
  assert.ok(trees.length >= 2, 'trees open on a node with a universal exit');
  const said: string[] = [];
  for (let turn = 0; turn < content.exitPool.length * 2; turn += 1) {
    const tree = trees[turn % trees.length]!;
    state.dialogue.start(tree.id);
    const exit = state.dialogue.presentOptions().find((shown) => shown.option.universal);
    if (!exit) { state.dialogue.end(); continue; }
    said.push(exit.text);
    state.dialogue.select(exit.option.id);
    state.dialogue.end();
    if (turn === 2) {
      state.save();
      state = new GameState(content, storage);
      assert.ok(state.load(), 'the save loads');
    }
  }
  assert.ok(said.length >= content.exitPool.length, `only ${said.length} goodbyes were offered`);
  const first = said.slice(0, content.exitPool.length);
  assert.equal(new Set(first).size, content.exitPool.length, `the first round repeats: ${first.join(' | ')}`);
  for (let i = 1; i < said.length; i += 1) assert.notEqual(said[i], said[i - 1], 'the same goodbye twice in a row');
});
