/**
 * ROOM 13, THE UNDERTAKER'S: its puzzles, played through the game state from
 * the room's own fixtures (content/fixtures/room-13.json).
 *
 * A1 is the news (doc 02, doc 57): the undertaker states that Pike is dead,
 * and Boot Hill is on the map. E3's third step is his (doc 57): UND_C1 sizes
 * the coffin, and SHENG'S LOAN on him pays for the funeral -- refused, in his
 * words, until the Reverend's figure and the sizing are in. THE COFFINS' USE
 * stays doc 26's fixed line. Every line asserted here is read from content
 * extracted from the documents, never typed into this file.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';

// PLAYS: A1, E3

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
// THE ROOM'S ONE CHARACTER WITH A TREE, found by what the content says.
const hostOf = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  return npc;
};
const host = (state: GameState): Interactable => {
  const npc = hostOf(state);
  return { id: npc.id, name: npc.name, rect: [npc.x - 40, npc.y - 200, 80, 200], colour: 0, responses: {} } as Interactable;
};
const opt = (state: GameState, suffix: string) => `${hostOf(state).id}${suffix}`;
const pay = (state: GameState) => {
  state.holdItem(null);
  state.holdItem('loan');
  return state.interact(host(state), 'USE');
};
const ruleOf = (state: GameState, label: string) => {
  const pair = state.content.combinations.pairs.find((one) => one.item === 'loan' && one.room === state.roomId);
  const rule = pair?.rules?.find((one) => one.case?.startsWith(label));
  assert.ok(rule, `the loan on him: a case "${label}"`);
  return rule;
};

test('A1: Pike first, then "Up the hill?" -- Pike is dead, and A1 is the news', async () => {
  const state = await inState('r13-a');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'root');
  state.dialogue.select(opt(state, '1'));
  assert.ok(!state.puzzleComplete('A1'));
  state.dialogue.select(opt(state, '2'));
  assert.ok(state.flags.get('T_PIKE_DEAD'));
  assert.ok(state.puzzleComplete('A1'));
});

test('E3: after the loophole he opens on UND_C1; sized, the loan pays, and the funeral is booked', async () => {
  const state = await inState('r13-b');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'UND_C1');
  // Before the sizing, the loan is refused in his words.
  const early = pay(state);
  assert.equal(early.say, ruleOf(state, 'before the sizing').say);
  assert.equal(early.by, hostOf(state).id);
  assert.ok(state.carried.includes('loan'), 'refused money is not taken');
  state.dialogue.select(opt(state, '_c1'));
  assert.ok(state.flags.get('T_COFFIN_SIZED'));
  const paid = pay(state);
  const rule = ruleOf(state, 'with');
  assert.equal(paid.say, rule.say);
  assert.deepEqual(paid.then, rule.then, 'and then: "Paid."');
  assert.ok(!state.carried.includes('loan'), 'the loan is spent');
  assert.ok(state.flags.get('T_FUNERAL_BOOKED'));
  assert.ok(state.puzzleComplete('E3'));
});

test('E3: without the Reverend\'s figure he does not bury on estimates', async () => {
  const state = await inState('r13-b');
  state.flags.set('T_SOWERBY_PRICE', false);
  assert.equal(pay(state).say, ruleOf(state, 'before the Reverend').say);
  assert.ok(state.carried.includes('loan'));
});

test('THE COFFINS\' USE is doc 26\'s fixed line, with no variant, in Act I and Act III alike', async () => {
  for (const id of ['r13-a', 'r13-b']) {
    const state = await inState(id);
    const coffins = state.findTarget('coffins');
    assert.ok(coffins?.overrides?.USE);
    const once = state.interact(coffins, 'USE').say;
    const twice = state.interact(coffins, 'USE').say;
    assert.equal(once, coffins.overrides.USE);
    assert.equal(twice, once, 'the same line, every time');
  }
});
