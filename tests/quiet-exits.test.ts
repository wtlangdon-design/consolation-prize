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
 * NO COMIC GOODBYE AFTER THE GAME'S MOST SERIOUS MOMENTS (errata 225). The feel review found "This has been
 * clarifying" straight after Winnie signs the death certificate, inside the coffin with Hob, and after Hob's
 * confession, and "I'll be taking more later" after Winnie's "a number I believed". Tyler: trim them, "yes".
 *
 * Every node the documents give a quiet exit says it, once its moment has happened, instead of any line in the
 * comic pool; and the pool waits, so the next ordinary goodbye is the one that would have come.
 */
test('after each emotional moment the goodbye is the quiet line, never the comic pool', async () => {
  const content = await loadContent(fsReader);
  const quiet = [...content.dialogue.values()].flatMap((tree) =>
    Object.entries(tree.nodes).filter(([, node]) => node.quietExit).map(([nodeId, node]) => ({ tree: tree.id, nodeId, node })));
  assert.ok(quiet.length >= 4, `only ${quiet.length} quiet exits are declared; the review named four moments`);
  for (const { tree, nodeId, node } of quiet) {
    const state = new GameState(content, new MemoryStorage());
    for (const [flag, value] of Object.entries(node.quietExit!.when ?? {})) state.flags.set(flag, value as boolean);
    state.dialogue.restore({}, { tree, node: nodeId });
    const exit = state.dialogue.presentOptions().find((shown) => shown.option.universal);
    assert.ok(exit, `${tree}/${nodeId} offers no goodbye`);
    assert.equal(exit.text, node.quietExit!.text, `${tree}/${nodeId} says "${exit.text}"`);
    assert.ok(!content.exitPool.includes(exit.text), `${tree}/${nodeId}'s goodbye is a comic one`);
  }
});

test("before the moment, the node's goodbye is still the pool's", async () => {
  const content = await loadContent(fsReader);
  const gated = [...content.dialogue.values()].flatMap((tree) => Object.entries(tree.nodes)
    .filter(([, node]) => node.quietExit?.when).map(([nodeId]) => ({ tree: tree.id, nodeId })));
  assert.ok(gated.length >= 2, 'the two gated quiet exits are declared');
  for (const { tree, nodeId } of gated) {
    const state = new GameState(content, new MemoryStorage());
    state.dialogue.restore({}, { tree, node: nodeId });
    const exit = state.dialogue.presentOptions().find((shown) => shown.option.universal);
    assert.ok(exit && content.exitPool.includes(exit.text), `${tree}/${nodeId} went quiet before its moment`);
  }
});

test('a quiet goodbye does not use up a comic one', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.dialogue.restore({}, { tree: 'HOB', node: 'HOB_C1' });
  const before = state.flags.isDefined('EXIT_TURN') ? state.flags.getNumber('EXIT_TURN') : 0;
  const exit = state.dialogue.presentOptions().find((shown) => shown.option.universal)!;
  state.dialogue.select(exit.option.id);
  const after = state.flags.isDefined('EXIT_TURN') ? state.flags.getNumber('EXIT_TURN') : 0;
  assert.equal(after, before, 'the pool moved on for a goodbye it did not say');
});
