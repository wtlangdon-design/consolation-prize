/**
 * ROOM 16, THE DIVINER'S TENT: A7, played through the game state from the
 * room's own fixture (content/fixtures/room-16.json).
 *
 * Doc 57 A7: her tree's first option waits for the survey to be wanted (A6)
 * and names her price; the filing fee answers it and is spent; the company
 * map, paid for, is divined into THE SURVEY on Form 12-C and handed back --
 * and before the fee, she asks for it in advance. Every line asserted here is
 * read from content extracted from the documents, never typed into this file.
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

// PLAYS: A7

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
const shown = (state: GameState) => state.dialogue.presentOptions().map((one) => one.option.id);
const useOn = (state: GameState, item: string) => {
  state.holdItem(null);
  state.holdItem(item);
  return state.interact(host(state), 'GIVE');
};
const ruleOf = (state: GameState, item: string, label: string) => {
  const pair = state.content.combinations.pairs.find((one) => one.item === item && one.room === state.roomId);
  const rule = pair?.rules?.find((one) => one.case === label);
  assert.ok(rule, `${item}: a case "${label}"`);
  return rule;
};

/**
 * Walks the survey as the room's own rules order it: at each leg, the subject whose rule waits on that leg. Read from
 * the content, so the order is not typed here.
 */
function walkTheBoundary(state: GameState): void {
  const LEG = 'SURVEY_LEG';
  for (let guard = 0; guard < 8 && state.playerStays; guard += 1) {
    const leg = state.flags.get(LEG);
    const next = state.targets.find((one) => (one.responses?.USE ?? []).some((rule) => (rule.when as Record<string, unknown> | undefined)?.[LEG] === leg));
    assert.ok(next, `nothing on the map takes the rod at leg ${String(leg)}`);
    state.interact(next, 'USE');
  }
}

test('A7: no boundary until the survey is wanted; then her price', async () => {
  const state = await inState('r16-a');
  state.flags.set('T_SURVEY_NEEDED', false);
  state.dialogue.start(hostOf(state).tree as string);
  assert.ok(!shown(state).includes(opt(state, '1')), 'nothing to divine yet');
  const ready = await inState('r16-a');
  ready.dialogue.start(hostOf(ready).tree as string);
  ready.dialogue.select(opt(ready, '1'));
  assert.ok(ready.flags.get('T_OZY_ASKED'));
});

test('A7: the map before the fee is asked for in advance; the fee, then the map, is THE SURVEY', async () => {
  const state = await inState('r16-a');
  state.dialogue.start(hostOf(state).tree as string);
  state.dialogue.select(opt(state, '1'));
  const early = useOn(state, 'company_map');
  assert.equal(early.say, ruleOf(state, 'company_map', 'not yet paid').say);
  assert.equal(early.by, hostOf(state).id);
  const fee = useOn(state, 'filing_fee');
  const paid = ruleOf(state, 'filing_fee', 'after OZY_A1 option 1');
  assert.equal(fee.say, paid.say);
  assert.deepEqual(fee.then, paid.then);
  assert.ok(!state.carried.includes('filing_fee'), 'the fee is spent');
  assert.ok(state.flags.get('T_OZY_PAID'));
  // Errata 251 (doc 120 I-3): the map unrolled, he is given the rod and walks the boundary on it; home is the survey.
  const map = useOn(state, 'company_map');
  assert.equal(map.say, ruleOf(state, 'company_map', 'the map unrolled').say);
  assert.ok(state.playerStays && !state.carried.includes('survey'), 'the survey is not handed over for the asking');
  walkTheBoundary(state);
  assert.ok(state.carried.includes('survey'), 'THE SURVEY, on Form 12-C');
  assert.ok(state.carried.includes('company_map'), 'she hands back the map');
  assert.ok(state.puzzleComplete('A7'));
});

test('pair 19: her Assay story teaches it', async () => {
  const state = await inState('r16-a');
  state.dialogue.start(hostOf(state).tree as string);
  state.dialogue.select(opt(state, '5'));
  assert.ok(state.flags.get('ASSAY_PAIR_19'));
});
