import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: F4

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * F4, DUEL THREE. Doc 57 F4 and doc 03: the opponent calls it; exchanges in
 * the order 4, 9, 22, 23, then the fifth; "a lost exchange is thrown again"
 * (errata 75), so it cannot be lost; the fifth's right answer is pair 24, the
 * truth; won -> T_FANSHAWE_BEATEN, F4. Pairs 4 and 9 are Act II's, 22-24 join
 * at E10 (doc 57).
 */
const setup = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r7-d')!));
  const assay = content.assay!;
  const [duelId, duel] = Object.entries(assay.duels).find(([, one]) => one.calledByOpponent)!;
  const tree = [...content.ambient.values()].find((npc) => npc.id === duel.opponent)!.tree;
  for (const n of [4, 9]) state.flags.set(assay.pairs.find((p) => p.n === n)!.flag!, true);
  state.completeByTimeline('E10');
  return { content, state, duelId, duel, tree };
};

test('the order is 4, 9, 22, 23, then the fifth, and every answer is on offer', async () => {
  const { state, duelId, duel, tree } = await setup();
  assert.deepEqual(duel.sequence, [4, 9, 22, 23, 24]);
  assert.ok(state.dialogue.duelIntro(duelId).length >= 2, 'the challenge and the first boast');
  state.dialogue.startDuel(tree, duelId);
  for (let round = 0; round < 5; round += 1) {
    const offers = state.dialogue.presentOptions();
    assert.equal(offers.length, 4, 'three jokes or wrong answers, and the right one');
    state.dialogue.select('right');
  }
  assert.equal(state.flags.get('T_FANSHAWE_BEATEN'), true);
  assert.equal(state.puzzleComplete(duel.puzzle), true);
  assert.equal(state.dialogue.isActive, false, 'he called it; when it ends the conversation is over');
});

test('a lost exchange is thrown again, and the duel cannot be lost', async () => {
  const { state, duelId, duel, tree } = await setup();
  state.dialogue.startDuel(tree, duelId);
  for (let miss = 0; miss < 7; miss += 1) state.dialogue.select('w0');
  assert.equal(state.flags.get('T_FANSHAWE_BEATEN'), false, 'seven misses end nothing');
  assert.equal(state.dialogue.isActive, true);
  for (let round = 0; round < 5; round += 1) state.dialogue.select('right');
  assert.equal(state.puzzleComplete(duel.puzzle), true);
});

test('without the confession the truth is still offered, but 22 and 23 are not', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r7-d')!));
  const assay = content.assay!;
  const [duelId, duel] = Object.entries(assay.duels).find(([, one]) => one.calledByOpponent)!;
  const tree = [...content.ambient.values()].find((npc) => npc.id === duel.opponent)!.tree;
  for (const n of [4, 9]) state.flags.set(assay.pairs.find((p) => p.n === n)!.flag!, true);
  state.dialogue.startDuel(tree, duelId);
  state.dialogue.select('right');
  state.dialogue.select('right');
  assert.equal(state.dialogue.presentOptions().length, 3, 'pair 22 is not his until E10');
});
