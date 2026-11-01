/**
 * ROOM 7, THE CLAIMS REGISTRAR: its puzzles, played through the game state
 * from the room's own fixtures (content/fixtures/room-07.json).
 *
 * A6 by the clerk's tree and by the deed on the counter; A9 in the statute's
 * order, the deed, the survey and the fee, ending in the read-back, the
 * invitation and the Act I turn; D1 in Act II and E1, E2 in Act III by
 * SUM_B1 and SUM_E1. Every line asserted here is read from content that was
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

// PLAYS: A6, A9, D1, E1, E2

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
const pairOf = (state: GameState, item: string, target: string) => {
  const pair = state.content.combinations.pairs.find((one) => one.item === item
    && one.room === state.roomId && one.target === target);
  assert.ok(pair?.rules?.length, `${item} on ${target} answers by case`);
  return pair;
};
const ruleOf = (state: GameState, item: string, target: string, label: string) => {
  const rule = pairOf(state, item, target).rules!.find((one) => one.case?.startsWith(label));
  assert.ok(rule, `${item} on ${target}: a case "${label}"`);
  return rule;
};
const use = (state: GameState, item: string, target: Interactable) => {
  state.holdItem(null);
  state.holdItem(item);
  return state.interact(target, 'USE');
};
const counter = (state: GameState) => {
  const found = state.findTarget('counter');
  assert.ok(found, 'the counter is a hotspot');
  return found;
};
// THE ROOM'S CLERK, found by what the content says about him -- the one character in
// this room with a tree -- so no name of the fiction is written in code.
const clerkOf = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  return npc;
};
const clerk = (state: GameState): Interactable => {
  const npc = clerkOf(state);
  return { id: npc.id, name: npc.name, rect: [npc.x - 40, npc.y - 200, 80, 200], colour: 0, responses: {} } as Interactable;
};
const talk = (state: GameState, ids: string[]) => {
  state.dialogue.start(clerkOf(state).tree as string);
  for (const id of ids) state.dialogue.select(id);
};
const opt = (state: GameState, suffix: string) => `${clerkOf(state).id}${suffix}`;

test('A6: the deed on the counter with no survey is the clerk\'s refusal, in his voice, and it is the puzzle', async () => {
  const state = await inState('r7-a');
  const said = use(state, 'deed', counter(state));
  const rule = ruleOf(state, 'deed', 'counter', 'without THE SURVEY');
  assert.equal(said.say, rule.say);
  assert.equal(said.by, clerkOf(state).id, 'the refusal is his');
  assert.ok(state.flags.get('T_SURVEY_NEEDED'));
  assert.ok(state.puzzleComplete('A6'));
  assert.ok(state.carried.includes('deed'), 'the deed cannot be lost');
});

test('A6 by the tree: option 1 refuses, and the surveyor question follows it', async () => {
  const state = await inState('r7-a');
  state.dialogue.start(clerkOf(state).tree as string);
  const shown = () => state.dialogue.presentOptions().map((one) => one.option.id);
  assert.ok(shown().includes(opt(state, '1')));
  assert.ok(!shown().includes(opt(state, '1a')), 'where to find a surveyor waits for the refusal');
  assert.ok(!shown().includes(opt(state, '1b')), '"I have a survey." waits for the survey');
  state.dialogue.select(opt(state, '1'));
  assert.ok(state.puzzleComplete('A6'));
  assert.ok(state.flags.get('T_SURVEY_NEEDED'));
  assert.ok(shown().includes(opt(state, '1a')), 'the surveyor question is offered after the refusal');
});

test('A9: in the statute\'s order -- deed, survey, fee -- and out of order the clerk says which comes first', async () => {
  const state = await inState('r7-b');
  const desk = counter(state);
  // Out of order first: the fee before anything, then the survey before the deed.
  assert.equal(use(state, 'filing_fee', clerk(state)).say, ruleOf(state, 'filing_fee', clerkOf(state).id, 'before').say);
  assert.ok(state.carried.includes('filing_fee'), 'refused money is not taken');
  const early = use(state, 'survey', desk);
  assert.equal(early.say, ruleOf(state, 'survey', 'counter', 'before the deed').say);
  assert.equal(early.by, clerkOf(state).id);
  assert.ok(state.carried.includes('survey'));
  // The tree's rephrase, holding the survey.
  state.dialogue.start(clerkOf(state).tree as string);
  assert.ok(state.dialogue.presentOptions().some((one) => one.option.id === opt(state, '1b')), '"I have a survey." is offered while he carries it');
  // Now in order.
  assert.equal(use(state, 'deed', desk).say, ruleOf(state, 'deed', 'counter', 'with THE SURVEY').say);
  assert.ok(state.carried.includes('deed'));
  assert.equal(use(state, 'survey', desk).say, ruleOf(state, 'survey', 'counter', 'after the deed').say);
  assert.ok(!state.carried.includes('survey'), 'the survey is lodged; it leaves inventory');
  const paid = use(state, 'filing_fee', clerk(state));
  const last = ruleOf(state, 'filing_fee', clerkOf(state).id, 'after both');
  assert.equal(paid.say, last.say);
  assert.deepEqual(paid.then, last.then, 'the read-back, every word, and the note');
  assert.ok(paid.then?.some((line) => typeof line === 'object' && line.speaker === clerkOf(state).id), 'the read-back is his');
  assert.ok(state.puzzleComplete('A9'));
  assert.ok(state.flags.get('T_BORDERS_MOTT'), 'the Act I turn');
  assert.ok(state.carried.includes('invitation'), 'there is a note for him');
  assert.ok(!state.carried.includes('filing_fee'), 'the fee is paid');
  assert.ok(state.carried.includes('deed'), 'the deed is never lost');
});

test('D1: Act II opens SUM_B1, and About Document D is the ninety-day rule', async () => {
  const state = await inState('r7-c');
  state.dialogue.start(clerkOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'SUM_B1');
  state.dialogue.select(opt(state, '1b'));
  assert.ok(state.puzzleComplete('D1'));
  assert.ok(state.flags.get('T_NINETY_DAYS'));
});

test('E1 and E2: Act III opens SUM_E1; the petition fails by design, and section nineteen follows it', async () => {
  const state = await inState('r7-d');
  state.dialogue.start(clerkOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'SUM_E1');
  assert.ok(!state.dialogue.presentOptions().some((one) => one.option.id === opt(state, '2')), 'the loophole waits for the petition');
  talk(state, [opt(state, '1'), opt(state, '2')]);
  assert.ok(state.puzzleComplete('E1'));
  assert.ok(state.puzzleComplete('E2'));
  assert.ok(state.flags.get('T_NEED_TO_DIE'));
  assert.ok(state.flags.get('T_EXECUTOR_RULE'));
});

test('Act I opens on SUM_A1, and nothing in the tree writes inventory', async () => {
  const state = await inState('r7-a');
  state.dialogue.start(clerkOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'SUM_A1');
  const before = [...state.carried];
  for (const id of [opt(state, '2'), opt(state, '3'), opt(state, '3')]) state.dialogue.select(id);
  assert.deepEqual(state.carried, before);
});
