/**
 * FIDDLER'S GULCH, ROOM 54: UPSTREAM (reference/fiddlers-gulch/brief.md, "What the engine needs" 10; doc 109; errata 209).
 *
 * G8, the messages: the panner and the man upstream will not speak to each other, so they speak through the hero, in
 * boasts. Carrying the panner's boast up teaches pair 25 (the man upstream's answer); carrying his own back down teaches
 * pair 26 (the panner's answer). Both wait for the camp's trust. The pairs are doc 109's Tier 7, read into the Assay, with
 * their wrong answers, and they join Duel Two's pool, which "still needs fourteen".
 *
 * Every line asserted here is read from doc 109 or from the content extracted from the documents, never typed here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: G8

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc109 = readFileSync(resolve(ROOT, 'docs/109-fiddlers-gulch-lines.md'), 'utf8');
const G8 = doc109.slice(doc109.indexOf('\n## G8 ·'), doc109.indexOf('\n### The pairs, for doc 03 Part Two'));
const PAIRS = doc109.slice(doc109.indexOf('\n### The pairs, for doc 03 Part Two'), doc109.indexOf('\n### Their wrong answers'));
const quotes = (text: string) => [...text.replace(/\*\([^)]*\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]!);

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture && state.applyFixture(fixture), `fixture ${fixtureId} applies`);
  return state;
};
/** The tree of the person who stands in this room. */
const treeIn = (state: GameState, room: string) => [...state.content.ambient.values()]
  .find((npc) => npc.room === room && npc.tree && npc.barkTurns)!.tree!;
const offered = (state: GameState, tree: string) => {
  state.dialogue.start(tree);
  return state.dialogue.presentOptions().map((one) => one.option);
};
const progress = (state: GameState, tree: string) => offered(state, tree).filter((one) => one.tag === 'PROGRESS');

test('G8: the boast carried up teaches pair 25, the answer carried down teaches pair 26', async () => {
  const state = await inState('r54-a');
  const upstream = treeIn(state, state.roomId);
  const river = [...state.content.ambient.values()].find((npc) => npc.room !== state.roomId && npc.tree
    && state.content.dialogue.get(npc.tree)!.nodes[state.content.dialogue.get(npc.tree)!.start!]!.options.some((o) => o.set?.T_GULCH_MESSAGE_UP))!.tree!;
  assert.deepEqual(progress(state, upstream), [], 'nothing to carry yet, so nothing to say upstream');

  // The panner's message, given down at the river.
  const give = progress(state, river);
  assert.equal(give.length, 1, 'the panner has one message to send');
  state.dialogue.select(give[0]!.id);
  assert.equal(state.flags.get('T_GULCH_MESSAGE_UP'), true);
  const boast25 = quotes(PAIRS.split('**25.**')[1]!)[0]!;
  assert.ok(JSON.stringify(give[0]!.exchange).includes(boast25), 'the message is pair 25\'s boast');
  // Asked again before it is carried: doc 109's second answer.
  const again = progress(state, river).find((one) => one.id === give[0]!.id)!;
  assert.equal(state.dialogue.select(again.id).say, quotes(G8.split('\n').find((one) => one.includes('*(second, if asked again'))!)[0]);

  // Carried up: the man upstream answers it, teaching pair 25, and sends his own.
  const carry = progress(state, upstream);
  assert.equal(carry.length, 1);
  state.dialogue.select(carry[0]!.id);
  assert.equal(state.flags.get('ASSAY_PAIR_25'), true, 'pair 25 is learned');
  assert.equal(state.flags.get('T_GULCH_MESSAGE_DOWN'), true);
  assert.deepEqual(progress(state, upstream), [], 'his part is done');

  // Carried down: the panner's answer teaches pair 26, and his first message is gone.
  const back = progress(state, river);
  assert.equal(back.length, 1, 'only the answer is left to give him');
  state.dialogue.select(back[0]!.id);
  assert.equal(state.flags.get('ASSAY_PAIR_26'), true, 'pair 26 is learned');
  assert.deepEqual(progress(state, river), [], 'nothing more to carry');
});

test('both messages wait for the camp\'s trust (G3)', async () => {
  const state = await inState('r54-a');
  const trusted = Object.keys(state.content.fixtures.get('r54-a')!.flags).find((one) => /TRUST/.test(one))!;
  state.flags.set(trusted, false);
  for (const npc of state.content.ambient.values()) {
    if (!npc.tree || !npc.room.startsWith('gulch') && npc.room !== state.roomId) continue;
    assert.ok(!progress(state, npc.tree).some((one) => one.set?.T_GULCH_MESSAGE_UP || one.set?.T_GULCH_MESSAGE_DOWN),
      `${npc.id}: no message before G3`);
  }
});

test('pairs 25 and 26 are in the Assay with three wrong answers each, and in Duel Two\'s pool, which still needs fourteen', async () => {
  const content = await loadContent(fsReader);
  const assay = content.assay!;
  for (const n of [25, 26]) {
    const pair = assay.pairs.find((one) => one.n === n)!;
    const written = quotes(PAIRS.split(`**${n}.**`)[1]!.split('\n**')[0]!);
    assert.deepEqual([pair.boast, pair.counter], written.slice(0, 2), `pair ${n} is doc 109's`);
    assert.equal(pair.wrong.length, 3);
    assert.ok(pair.flag, `pair ${n} is learned by a flag`);
  }
  const two = Object.values(assay.duels).find((duel) => duel.threshold)!;
  assert.ok([25, 26].every((n) => two.pool!.includes(n)), 'Duel Two can throw them');
  assert.equal(two.threshold, 14, '"The duel still needs fourteen."');
});
