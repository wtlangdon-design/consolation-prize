import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { DuelSession, duelOrder, rightSlot, type AssayFile } from '../engine/core/Assay.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { DialoguePerformance } from '../engine/core/DialoguePerformance.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: B4, B5, B6

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
    const spoken = choice.lines.filter((l) => !l.mark);
    const speakers = spoken.map((l) => l.speaker);
    assert.deepEqual(speakers.slice(0, 3), [file.duels.duel_one!.opponent, file.bystander, writer], `pair ${pair}`);
    assert.equal(spoken[2]!.line, file.duels.duel_one!.notebook![String(pair)]!.line);
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

test('a lost Duel Two ends on the reply that lost it and the judges\' mark (errata 73 H, 130 B)', async () => {
  const file = await assayFile();
  const result = playBest(file, 'duel_two', new Set([1, 2, 3, 4]));
  assert.equal(result.outcome, 'lost');
  assert.equal(result.sets.T_DUEL_TWO_WON, undefined, 'nothing is won');
  const said = result.lines.filter((l) => l.rest === undefined);
  assert.equal(said.length, 2, 'the reply, and the ring muttering the counter he lacked');
  assert.equal(said[0]!.speaker, 'deke_vessel');
  assert.equal(said[1]!.speaker, file.bystander);
});

test('losing Duel Two teaches what he could not answer, and every retry throws boasts he has not heard (doc 03 Learning; errata 130 A)', async () => {
  // Found by the duel audit: only Duel One muttered, so a lost Duel Two taught
  // nothing and every retry was the same thirty-three lines. Doc 03 Part One's
  // rule is for every duel: "When an opponent uses a boast he has no answer
  // to, he hears the correct counter from the crowd."
  const file = await assayFile();
  let known = new Set([1, 2, 3, 4]);
  const heard: number[][] = [];
  let won = false;
  for (let attempt = 1; attempt <= 3 && !won; attempt += 1) {
    const duel = new DuelSession(file, 'duel_two', known);
    const thrown: number[] = [];
    let result: ReturnType<DuelSession['commit']> | undefined;
    for (let guard = 0; guard < 30 && !result?.ended; guard += 1) {
      thrown.push(duel.currentPair);
      const offers = duel.offered();
      result = duel.commit((offers.find((o) => o.id === 'right') ?? offers[0]!).id);
    }
    heard.push(thrown);
    if (result!.outcome === 'won') { won = true; break; }
    const learned = Object.keys(result!.sets).filter((flag) => flag.startsWith('ASSAY_PAIR_'))
      .map((flag) => Number(flag.slice(-2)));
    assert.ok(learned.length > 0, `attempt ${attempt} was lost and taught nothing`);
    for (const n of learned) {
      assert.ok(thrown.includes(n) && !known.has(n), `pair ${n} joined without being thrown at him unanswered`);
    }
    known = new Set([...known, ...learned]);
  }
  assert.ok(won, 'a player who only ever loses has won by the third attempt');
  for (let a = 1; a < heard.length; a += 1) {
    assert.notDeepEqual(heard[a]!.slice(4), heard[a - 1]!.slice(4), 'a retry is not the same duel again');
  }
});

test('every scored exchange is written down in a held beat after the line that won it, before the next boast (doc 45 U-ASSAY-PENCIL; errata 130 B)', async () => {
  // Found by the duel audit: the pencil sounded when the exchange settled,
  // which was after the NEXT boast had been read, as the new options appeared.
  const file = await assayFile();
  const boasts = new Set(file.pairs.map((p) => p.boast));
  const all = new Set(Array.from({ length: 21 }, (_, i) => i + 1));
  const runs: [string, Set<number>][] = [['duel_one', new Set()], ['duel_two', new Set([1, 2, 3, 4])],
    ['duel_two', all], ['duel_three', new Set([22, 23])]];
  for (const [duelId, known] of runs) {
    const duel = new DuelSession(file, duelId, known);
    for (let guard = 0; guard < 30; guard += 1) {
      const offers = duel.offered();
      const pick = (guard % 2 === 0 ? offers.find((o) => o.id === 'right') : undefined) ?? offers[0]!;
      const choice = duel.commit(pick.id);
      const marks = choice.lines.map((l, i) => (l.mark ? i : -1)).filter((i) => i >= 0);
      assert.equal(marks.length, 1, `${duelId}: one point, one mark`);
      // A won ending that opens on a held silence holds it first; the pencil goes down in it (errata 131 D).
      const silenceFirst = choice.lines[0]?.rest !== undefined && !choice.lines[0]?.mark;
      assert.equal(marks[0], choice.correct && !silenceFirst ? 0 : 1, `${duelId}: the mark follows ${choice.correct ? 'his counter' : 'the reply'}`);
      assert.ok((choice.lines[marks[0]!]!.rest ?? 0) > 0, 'the mark is a held beat');
      const boastAt = choice.lines.findIndex((l) => boasts.has(l.line));
      if (boastAt >= 0) assert.ok(boastAt > marks[0]!, `${duelId}: the next boast waits for the pencil`);
      if (choice.ended) break;
    }
  }
});

test('a held beat cannot be clicked through and ends on its own, even when lines wait for a click (errata 130)', async () => {
  const state = await inBackRoom({ T_VESSEL_FOUND: true });
  state.dialogue.select('ves_b1_6');
  const exchange = state.dialogue.beginSelection('w0');
  const said = exchange.presentation;
  const replies = [...(said.say ? [{ speaker: said.sayer, line: said.say }] : []), ...said.rest];
  const timing = { base: 0.45, perGlyph: 0.055, minimum: 1.8, maximum: 8, waitForClick: true };
  const performance = new DialoguePerformance(exchange, { speaker: state.content.actor.id, line: 'echo' }, replies, timing, 0);
  let now = 0;
  while (performance.current && performance.current.rest === undefined) { now += 1; performance.skip(now); }
  const beat = performance.current!;
  assert.ok(beat.mark && (beat.rest ?? 0) > 0, 'the judges\' beat comes after the reply');
  assert.equal(performance.skip(now + 0.2), false, 'a click does not cut the beat short');
  assert.equal(performance.current, beat);
  assert.equal(performance.tick(now + beat.rest! + 0.01), true, 'the beat ends by itself');
  assert.notEqual(performance.current, beat);
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
  assert.ok(ids().includes('ves_b1_6'));
  assert.ok(!ids().includes('ves_b1_3'), 'option 3 is the replay: offered once Duel One is lost (errata 76 A, 130 D)');
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
  writer.dialogue.select('ves_b1_6');
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
  state.dialogue.select('ves_b1_6');
  state.dialogue.select('w0');
  state.dialogue.end();
  state.dialogue.start('DEKE_VESSEL');
  assert.ok(state.dialogue.presentOptions().some((o) => o.option.id === 'ves_b1_6'));
});

test('Duel One cannot be reached without B4, nor fought once the Assay is over (duel audit 9a, 9b; errata 130 D)', async () => {
  // Found by the duel audit: option 3 started Duel One first and completed B5
  // with B4 never done; and whichever of options 3 and 6 the player had not
  // taken stayed on offer for ever -- after Duel Two was won and the judges
  // had gone home, Vessel would still be asked to sign what he had signed.
  const duelOne = (state: GameState) => state.dialogue.presentOptions()
    .filter((o) => (o.option as { duel?: string }).duel === 'duel_one').map((o) => o.option.id);
  const loseDuelOne = (state: GameState) => {
    for (let n = 0; n < 5 && state.dialogue.inDuel; n += 1) state.dialogue.select(state.dialogue.presentOptions()[0]!.option.id);
  };
  const pairs = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`ASSAY_PAIR_${String(i + 1).padStart(2, '0')}`, true]));
  const winDuelTwo = (state: GameState) => {
    for (const [flag, value] of Object.entries(pairs)) state.flags.set(flag, value);
    state.dialogue.select('ves_b1_5');
    for (let n = 0; n < 5; n += 1) state.dialogue.select('right');
    assert.equal(state.flags.getBoolean('T_DUEL_TWO_WON'), true);
  };
  const state = await inBackRoom({ T_VESSEL_FOUND: true });
  assert.deepEqual(duelOne(state), ['ves_b1_6'], 'before Duel One, only the affidavit starts it (B4)');
  state.dialogue.select('ves_b1_6');
  loseDuelOne(state);
  assert.ok(state.puzzleComplete('B4') && state.puzzleComplete('B5'));
  assert.deepEqual(duelOne(state), ['ves_b1_3'], 'after Duel One, the replay and only the replay');
  winDuelTwo(state);
  assert.deepEqual(duelOne(state), [], 'no Duel One once Duel Two is won');
  // And with the replay taken first.
  const other = await inBackRoom({ T_VESSEL_FOUND: true });
  other.dialogue.select('ves_b1_6');
  loseDuelOne(other);
  other.dialogue.select('ves_b1_3');
  loseDuelOne(other);
  assert.deepEqual(duelOne(other), [], 'twice if asked, and then no more');
});

test('the rematch stays at full weight while one is owed (duel audit 2d; errata 130 E)', async () => {
  // A greyed row reads as "already asked". After a lost Duel Two the rematch
  // is the only way on, and it went grey.
  const state = await inBackRoom({ T_VESSEL_FOUND: true, T_DUEL_ONE_LOST: true });
  state.dialogue.select('ves_b1_5');
  for (let n = 0; n < 30 && state.dialogue.inDuel; n += 1) state.dialogue.select(state.dialogue.presentOptions()[0]!.option.id);
  assert.notEqual(state.flags.getBoolean('T_DUEL_TWO_WON'), true);
  const rematch = state.dialogue.presentOptions().find((o) => o.option.id === 'ves_b1_5');
  assert.ok(rematch, 'the rematch is offered again');
  assert.equal(rematch!.exhausted, false, 'and is not greyed');
});

test('the Assay stays sitting until the player walks out after Duel Two, and is gone when he returns', async () => {
  const state = new GameState(await loadContent(fsReader), new MemoryStorage());
  // Every name is read from the data: the room the Assay sits in is the one
  // whose door writes T_ASSAY_ADJOURNED, and the sitting figures are the ones
  // whose presence that flag ends.
  const roomId = [...state.content.rooms.values()]
    .find((room) => room.exits.some((exit) => exit.setOnTransit?.T_ASSAY_ADJOURNED !== undefined))!.id;
  state.flags.set('T_VESSEL_FOUND', true);
  state.enterRoom(roomId);
  const door = () => state.room.exits.find((exit) => exit.setOnTransit?.T_ASSAY_ADJOURNED !== undefined)!;
  const sitting = () => (state.room.ambient ?? [])
    .map((id) => state.content.ambient.get(id)!)
    .filter((npc) => (npc.when as Record<string, unknown> | undefined)?.T_ASSAY_ADJOURNED === false)
    // AmbientLayer.present's own rule (engine/core/Ambient.ts).
    .filter((npc) => state.flags.test(npc.placements?.[state.roomId]?.when ?? npc.when));
  const leave = () => {
    const out = door();
    state.interact(out, 'WALK_TO');
    assert.equal(state.roomId, out.to);
    state.enterRoom(roomId);
  };
  const seated = sitting().length;
  assert.ok(seated >= 4, 'the judges and the presiding figure are there once the Assay convenes');
  leave();
  assert.notEqual(state.flags.get('T_ASSAY_ADJOURNED'), true, 'leaving before the win adjourns nothing');
  assert.equal(sitting().length, seated);
  state.flags.set('T_DUEL_TWO_WON', true);
  assert.equal(sitting().length, seated, 'winning does not make anyone vanish in front of him');
  leave();
  assert.equal(state.flags.get('T_ASSAY_ADJOURNED'), true, 'walking out after the win adjourns it');
  assert.equal(sitting().length, 0, 'and when he comes back they are gone');
});

test('every pair the player can learn is taught by some row or duel, by the teacher doc 03 names (doc 57 pair table)', async () => {
  // Found by the continuous playthrough (tests/full-game.test.ts): the two
  // sparrings (WIN_B4 1, PRA_D6 4) and Hob's pair 21 wrote nothing, so real
  // play could hold 9 pairs against Duel Two's 14 and B6 could not be won.
  const content = await loadContent(fsReader);
  const file = await assayFile();
  const written = new Map<string, string[]>();
  for (const tree of content.dialogue.values()) {
    for (const node of Object.values(tree.nodes)) {
      for (const option of node.options) {
        for (const [flag, value] of Object.entries(option.set ?? {})) {
          if (value === true) written.set(flag, [...(written.get(flag) ?? []), tree.speaker ?? tree.id]);
        }
      }
    }
  }
  // A duel teaches by its `learns` (Duel One's notebook, errata 73 D).
  for (const duel of Object.values(file.duels)) {
    for (const n of (duel as { learns?: number[] }).learns ?? []) {
      const flag = file.pairs.find((pair) => pair.n === n)?.flag;
      if (flag) written.set(flag, ['duel']);
    }
  }
  const untaught = file.pairs.filter((pair) => pair.flag && !written.has(pair.flag)).map((pair) => pair.n);
  assert.deepEqual(untaught, [], 'pairs nothing teaches');
  // A teacher's row teaches only the teacher's own pairs.
  for (const pair of file.pairs.filter((one) => one.flag)) {
    const who = (pair as { learnedFrom?: string }).learnedFrom ?? '';
    for (const speaker of (written.get(pair.flag!) ?? []).filter((one) => one !== 'duel')) {
      const name = content.ambient.get(speaker)?.name ?? speaker;
      assert.ok(who.toLowerCase().split(/\s+/).some((word) => name.toLowerCase().includes(word)),
        `pair ${pair.n} is doc 03's ${who}'s, and ${speaker} teaches it`);
    }
  }
});

test('Duel Three always ends, whatever the player learned before it (invariant 6; errata 120)', async () => {
  // The fewest pairs a player can hold at F4: Duel One's four, then whatever
  // the confession gives. Errata 75 I says pairs 4 and 9 are "guaranteed in
  // Act II", but pair 9's one source is an option the player can walk past for
  // good. Duel Three re-throws a lost exchange, and a pair the player cannot
  // answer is offered only its wrong answers -- so it must be one he knows.
  const file = await assayFile();
  const confession = (file.duels['duel_three']?.sequence ?? []).filter((n) => n >= 22);
  for (const known of [new Set<number>([1, 2, 3, 4, ...confession]), new Set<number>(confession)]) {
    assert.equal(playBest(file, 'duel_three', known).ended, true, `stuck with ${[...known].join(',')}`);
  }
});
