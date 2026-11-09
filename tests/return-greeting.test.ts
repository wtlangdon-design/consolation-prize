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
 * A GREETING THAT CALLS HIM NEW IS SAID ONCE (errata 225). The editor greeted Thad "You're new!" on all three of
 * the playthrough's visits, across three acts, after he had already printed him. The first visit is the
 * exchange; every visit after says the return line doc 04 writes for it. And generally: no tree's opening that
 * calls the player new is said on a second visit.
 */
test('the first visit says the meeting, every later visit the return line', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const tree = content.dialogue.get('FRAME')!;
  const first = state.dialogue.openingOf(tree.id);
  assert.ok(first.some((one) => /new!/.test(one.line)), 'the first visit lost its meeting');
  state.dialogue.start(tree.id);
  state.dialogue.end();
  for (let visit = 2; visit <= 3; visit += 1) {
    const again = state.dialogue.openingOf(tree.id);
    assert.ok(again.length > 0, `visit ${visit} opens on nothing`);
    assert.ok(!again.some((one) => /new!/.test(one.line)), `visit ${visit} calls him new again`);
    state.dialogue.start(tree.id);
    state.dialogue.end();
  }
});

test('no opening that calls the player new can be said twice', async () => {
  const content = await loadContent(fsReader);
  const repeats = [...content.dialogue.values()].flatMap((tree) => Object.entries(tree.nodes)
    .filter(([, node]) => (node.opening ?? []).some((one) => /\byou're new\b/i.test(one.line)) && !node.openingOnce)
    .map(([nodeId]) => `${tree.id}/${nodeId}`));
  assert.deepEqual(repeats, []);
});
