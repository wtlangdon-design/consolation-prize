import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: E4

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * E4, THE CERTIFICATE. Doc 57: "WIN_C1 (doc 04) opens once T_FUNERAL_BOOKED is
 * set and C5 is complete. Option 4 and the signing -> THE DEATH CERTIFICATE."
 * Doc 04: "Options 1-3 are not failures -- they can be exhausted freely -- but
 * only 4 advances."
 */
const setup = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r5-c-post')!));
  const npc = [...content.ambient.values()].find((one) => one.room === state.roomId && one.tree)!;
  return { content, state, tree: npc.tree as string };
};
const certificate = (content: Awaited<ReturnType<typeof loadContent>>) => content.dialogue.get('WINNIE')!
  .nodes.WIN_C1!.options.find((one) => one.gives?.length)!.gives![0]!;

test('the tree opens on the death certificate once the funeral is booked, and not before', async () => {
  const { state, tree } = await setup();
  state.dialogue.start(tree);
  assert.notEqual(state.dialogue.positionSnapshot().node, 'WIN_C1');
  state.dialogue.end();
  state.flags.set('T_FUNERAL_BOOKED', true);
  assert.ok(state.dialogue.openingOf(tree).length >= 2, 'he asks; she says no');
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'WIN_C1');
});

test('arguing changes nothing; dropping it is the signing, the certificate and E4', async () => {
  const { content, state, tree } = await setup();
  state.flags.set('T_FUNERAL_BOOKED', true);
  state.dialogue.start(tree);
  const paper = certificate(content);
  for (const row of ['winnie1', 'winnie2', 'winnie3']) {
    state.dialogue.select(row);
    assert.notEqual(state.puzzleProgress().E4, 'complete', `${row} does not advance`);
    assert.ok(!state.carried.includes(paper));
  }
  const rows = state.dialogue.presentOptions().map((p) => p.option.id);
  assert.ok(rows.includes('winnie1') && rows.includes('winnie4'), 'the arguments are retained; the right one is still there');
  state.dialogue.select('winnie4');
  assert.equal(state.puzzleComplete('E4'), true);
  assert.ok(state.carried.includes(paper), 'THE DEATH CERTIFICATE');
  assert.ok(!state.dialogue.presentOptions().some((p) => p.option.id === 'winnie4'), 'signed once');
});
