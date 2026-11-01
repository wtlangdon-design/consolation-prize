import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { DuelSession, duelOrder, rightSlot, type AssayFile } from '../engine/core/Assay.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

/**
 * THE LIAR'S ASSAY (doc 03, errata 73, errata 76 A).
 *
 * The rules a duel follows are mechanism and are proved here; every word a
 * duel says is doc 03's and is proved by check-extraction. The one property
 * worth an exhaustive walk is invariant 6: a player who holds fourteen pairs
 * can always win Duel Two, whichever fourteen, and one who holds thirteen
 * cannot -- doc 02 B6's ">=14 pairs", kept by the duel itself.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const assayFile = async (): Promise<AssayFile> => JSON.parse(
  await readFile(resolve(ROOT, 'content/assay/assay.json'), 'utf8'));

/** Plays a duel choosing the right counter whenever it is offered, else the first wrong one. */
function playBest(file: AssayFile, duelId: string, known: Set<number>) {
  const duel = new DuelSession(file, duelId, known);
  for (let guard = 0; guard < 30; guard += 1) {
    const offers = duel.offered();
    const pick = offers.find((o) => o.id === 'right') ?? offers[0]!;
    const choice = duel.commit(pick.id);
    if (choice.ended) return choice;
  }
  throw new Error('duel did not end');
}

test('every pair the player can learn has three wrong answers, none reused (doc 03 Part Five, note 1)', async () => {
  const file = await assayFile();
  const seen = new Set<string>();
  for (const pair of file.pairs) {
    assert.equal(pair.wrong.length, 3, `pair ${pair.n}`);
    for (const wrong of pair.wrong) {
      assert.ok(!seen.has(wrong.text), `reused: ${wrong.text}`);
      seen.add(wrong.text);
      assert.notEqual(wrong.text, pair.counter);
      assert.ok(wrong.reply.length > 0);
    }
  }
  assert.equal(file.pairs.filter((p) => p.flag).length, 21, 'Tiers 1-5 are learnable; Tier 6 belongs to the final duel');
});

test('Duel One: pairs 1-4 then 1 again, wrong answers only, lost five straight (errata 73 C, D)', async () => {
  const file = await assayFile();
  assert.deepEqual(duelOrder(file, 'duel_one', new Set()), [1, 2, 3, 4, 1]);
  const duel = new DuelSession(file, 'duel_one', new Set());
  const mutters: number[] = [];
  let last;
  for (let exchange = 0; exchange < 5; exchange += 1) {
    const offers = duel.offered();
    assert.equal(offers.length, 3, 'nothing but wrong answers');
    assert.ok(!offers.some((o) => o.id === 'right'));
    const pair = duel.currentPair;
    last = duel.commit(offers[exchange % 3]!.id);
    if (last.lines.some((l) => l.speaker === file.bystander)) mutters.push(pair);
  }
  assert.ok(last!.ended);
  assert.equal(last!.outcome, 'lost');
  assert.deepEqual(mutters, [1, 2, 3, 4], 'nobody mutters on the repeat of pair 1');
  assert.deepEqual(last!.sets, {
    ASSAY_PAIR_01: true, ASSAY_PAIR_02: true, ASSAY_PAIR_03: true, ASSAY_PAIR_04: true, T_DUEL_ONE_LOST: true,
  }, 'the notebook joins his repertoire when the duel is over');
  assert.deepEqual(last!.yields, []);
});

test('Duel One: every mutter is followed by his notebook line, pairs 1-4 (errata 73 D, 75)', async () => {
  const file = await assayFile();
  const duel = new DuelSession(file, 'duel_one', new Set());
  const writer = file.duels.duel_one!.notebook!['1']!.speaker;
  for (const pair of [1, 2, 3, 4]) {
    const choice = duel.commit('w0');
    const speakers = choice.lines.map((l) => l.speaker);
    assert.deepEqual(speakers.slice(0, 3), [file.duels.duel_one!.opponent, file.bystander, writer], `pair ${pair}`);
    assert.equal(choice.lines[2]!.line, file.duels.duel_one!.notebook![String(pair)]!.line);
  }
  const repeat = duel.commit('w0');
  assert.ok(!repeat.lines.some((l) => l.speaker === file.bystander), 'nobody mutters on the repeat of pair 1');
});

test('the right counter, once learned, is offered in a slot that varies by pair (errata 73 C)', async () => {
  const file = await assayFile();
  const slots = new Set<number>();
  for (let n = 1; n <= 21; n += 1) slots.add(rightSlot(n));
  assert.ok(slots.size > 1);
  const duel = new DuelSession(file, 'duel_two', new Set(Array.from({ length: 21 }, (_, i) => i + 1)));
  const offers = duel.offered();
  assert.equal(offers.length, 4);
  assert.equal(offers.findIndex((o) => o.id === 'right'), rightSlot(duel.currentPair));
});

test('Duel Two: every the player with fourteen pairs can win, none with thirteen can (doc 02 B6, invariant 6)', async () => {
  const file = await assayFile();
  const others = Array.from({ length: 17 }, (_, i) => i + 5);
  let checked = 0;
  for (let mask = 0; mask < 1 << others.length; mask += 1) {
    const known = new Set([1, 2, 3, 4]);
    others.forEach((n, bit) => { if (mask & (1 << bit)) known.add(n); });
    const result = playBest(file, 'duel_two', known);
    assert.equal(result.outcome, known.size >= 14 ? 'won' : 'lost', `known ${[...known].join(',')}`);
    checked += 1;
  }
  assert.equal(checked, 131072);
});

test('Duel Two won yields Document A and the watch, and closes the rematch', async () => {
  const file = await assayFile();
  const result = playBest(file, 'duel_two', new Set(Array.from({ length: 14 }, (_, i) => i + 1)));
  assert.equal(result.outcome, 'won');
  assert.deepEqual(result.yields, ['document_a', 'watch']);
  assert.equal(result.sets.T_DUEL_TWO_WON, true);
  assert.equal(result.lines.at(-1)?.speaker, 'deke_vessel');
});

test('a lost Duel Two ends on the reply that lost it and writes nothing (errata 73 H)', async () => {
  const file = await assayFile();
  const result = playBest(file, 'duel_two', new Set([1, 2, 3, 4]));
  assert.equal(result.outcome, 'lost');
  assert.deepEqual(result.sets, {});
  assert.equal(result.lines.length, 1, 'only the reply');
});

async function inBackRoom(flags: Record<string, boolean>) {
  const state = new GameState(await loadContent(fsReader), new MemoryStorage());
  for (const [id, value] of Object.entries(flags)) state.flags.set(id, value);
  state.dialogue.start('DEKE_VESSEL');
  return state;
}

test('VES_B1 opens once Vessel is found; option 6 is B4 and Duel One; B5 when it ends (doc 57)', async () => {
  const state = await inBackRoom({ T_VESSEL_FOUND: true });
  assert.equal(state.dialogue.positionSnapshot().node, 'VES_B1');
  const ids = () => state.dialogue.presentOptions().map((o) => o.option.id);
  assert.ok(ids().includes('ves_b1_6') && ids().includes('ves_b1_3'));
  assert.ok(!ids().includes('ves_b1_5'), 'the rematch is offered once Duel One is lost');

  const opened = state.dialogue.select('ves_b1_6');
  assert.ok(opened.rest.length >= 6, 'his two lines, the five rules read, and the first boast');
  assert.ok(state.puzzleComplete('B4'));
  assert.ok(state.dialogue.inDuel);
  for (let n = 0; n < 5; n += 1) state.dialogue.select(state.dialogue.presentOptions()[0]!.option.id);
  assert.ok(!state.dialogue.inDuel);
  assert.equal(state.flags.getBoolean('T_DUEL_ONE_LOST'), true);
  assert.equal(state.flags.getBoolean('ASSAY_PAIR_04'), true);
  assert.ok(state.puzzleComplete('B5'), 'Duel One completes B5 by being lost');
  assert.ok(!ids().includes('ves_b1_6'), 'the affidavit question is spent');
  assert.ok(ids().includes('ves_b1_3'), 'option 3 replays Duel One, twice if asked');
  assert.ok(ids().includes('ves_b1_5'), 'and the rematch is offered');
});

test('the Duel One greeting plays on the first TALK TO only (doc 57 B4)', async () => {
  const state = await inBackRoom({});
  state.dialogue.end();
  state.flags.set('T_VESSEL_FOUND', true);
  assert.equal(state.dialogue.openingOf('DEKE_VESSEL').length, 3);
  state.dialogue.start('DEKE_VESSEL');
  state.dialogue.end();
  assert.equal(state.dialogue.openingOf('DEKE_VESSEL').length, 0);
});

test('Duel Two through the conversation: won with fourteen pairs, the yields reach the inventory', async () => {
  const pairs = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`ASSAY_PAIR_${String(i + 1).padStart(2, '0')}`, true]));
  const state = await inBackRoom({ T_VESSEL_FOUND: true, T_DUEL_ONE_LOST: true, ...pairs });
  state.dialogue.select('ves_b1_5');
  for (let n = 0; n < 5; n += 1) state.dialogue.select('right');
  assert.equal(state.flags.getBoolean('T_DUEL_TWO_WON'), true);
  assert.ok(state.carried.includes('document_a'));
  assert.ok(!state.dialogue.presentOptions().some((o) => o.option.id === 'ves_b1_5'), 'nothing left to win');
  assert.ok(state.puzzleComplete('B6'));
});

test('a duel saved mid-fight resumes at the same boast (save/load restores partial trees)', async () => {
  const storage = new MemoryStorage();
  const writer = new GameState(await loadContent(fsReader), storage);
  writer.flags.set('T_VESSEL_FOUND', true);
  writer.dialogue.start('DEKE_VESSEL');
  writer.dialogue.select('ves_b1_3');
  writer.dialogue.select('w0');
  writer.dialogue.select('w1');
  writer.save(1);
  const reader = new GameState(await loadContent(fsReader), storage);
  assert.equal(reader.dialogue.inDuel, false);
  assert.ok(reader.load(1));
  assert.ok(reader.dialogue.inDuel);
  assert.deepEqual(reader.dialogue.duelSnapshot(), writer.dialogue.duelSnapshot());
  assert.deepEqual(reader.dialogue.presentOptions().map((o) => o.option.id),
    writer.dialogue.presentOptions().map((o) => o.option.id));
});

test('a duel dropped mid-fight leaves Duel One on offer (invariant 6)', async () => {
  const state = await inBackRoom({ T_VESSEL_FOUND: true });
  state.dialogue.select('ves_b1_3');
  state.dialogue.select('w0');
  state.dialogue.end();
  state.dialogue.start('DEKE_VESSEL');
  assert.ok(state.dialogue.presentOptions().some((o) => o.option.id === 'ves_b1_3'));
});
