/**
 * ROOM 15, THE LIVERY STABLE: its puzzles, played through the game state from
 * the room's own fixtures (content/fixtures/room-15.json).
 *
 * B2 (doc 57): LIV_A1's refusal, then the man she moved for, and only then
 * the tune. The blanket on loan (LIV_A1 option 5, doc 23): the bin is drawn
 * bare and the blanket is no subject while it is out. B3 (doc 54, doc 57):
 * the tuning fork on the mule in the stall -- refused before the hum and before the
 * hero knows where Vessel is; with both, the livery man's line, the ride
 * over black, and the room it ends in. Every line asserted here is read from content
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

// PLAYS: B2, B3

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
const opt = (state: GameState, suffix: string) => `${hostOf(state).id}${suffix}`;
const shown = (state: GameState) => state.dialogue.presentOptions().map((one) => one.option.id);
const shownProps = (state: GameState) => (state.room.props ?? [])
  .filter((prop) => state.flags.test(prop.when)).map((prop) => prop.id);
// THE ONE FIGURE WITH NO TREE BEHIND A DOOR: the hotspot the fork is used on is
// the pair's target, found by what the content says.
const forkPair = (state: GameState) => {
  const pair = state.content.combinations.pairs.find((one) => one.room === state.roomId && one.item === 'tuning_fork');
  assert.ok(pair?.rules?.length, 'the fork has a pair in this room');
  return pair;
};
const useFork = (state: GameState) => {
  const target = state.findTarget(forkPair(state).target);
  assert.ok(target, 'the fork\'s target is in the room');
  state.holdItem(null);
  state.holdItem('tuning_fork');
  return state.interact(target, 'USE');
};
const ruleOf = (state: GameState, label: string) => {
  const rule = forkPair(state).rules?.find((one) => one.case === label);
  assert.ok(rule, `a case "${label}"`);
  return rule;
};

test('B2: the tune waits for the man she moved for; option 6 is B2 and opens it', async () => {
  const state = await inState('r15-a');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'LIV_A1');
  assert.ok(!shown(state).includes(opt(state, '4')), 'no tune before the story');
  state.dialogue.select(opt(state, '1'));
  assert.ok(!state.puzzleComplete('B2'), 'the refusal alone is not B2');
  state.dialogue.select(opt(state, '6'));
  assert.ok(state.flags.get('T_GRIEVANCE_MOTT'));
  assert.ok(state.puzzleComplete('B2'));
  assert.ok(shown(state).includes(opt(state, '4')), 'now the tune');
  state.dialogue.select(opt(state, '4'));
  assert.ok(state.flags.get('T_HUM_HEARD'));
});

test('the blanket on loan: the bin is bare and the blanket is no subject while it is out', async () => {
  const state = await inState('r15-a');
  assert.deepEqual(shownProps(state), []);
  const blanket = state.targets.find((one) => one.id.includes('blanket'));
  assert.ok(blanket, 'the blanket is on the bin');
  state.dialogue.start(hostOf(state).tree as string);
  state.dialogue.select(opt(state, '5'));
  // Errata 245 (doc 118 O-5): leave is given; he takes it off her himself.
  assert.ok(!state.carried.includes('blanket'), 'leave is not the blanket');
  state.dialogue.end();
  state.interact(state.findTarget(blanket.id)!, 'PICK_UP');
  assert.ok(state.carried.includes('blanket'), 'THE LIVERY BLANKET, on loan');
  assert.deepEqual(shownProps(state), ['bin_bare']);
  assert.ok(!state.targets.some((one) => one.id === blanket.id), 'not drawn, not clickable');
});

test('B3: refused before the hum, and before the whereabouts are known', async () => {
  const state = await inState('r15-b');
  state.flags.set('T_HUM_HEARD', false);
  assert.equal(useFork(state).say, ruleOf(state, 'before the livery man has hummed').say);
  state.flags.set('T_HUM_HEARD', true);
  state.flags.set('T_VESSEL_LOCATION', false);
  assert.equal(useFork(state).say, ruleOf(state, 'after T_HUM_HEARD, without T_VESSEL_LOCATION').say);
  assert.ok(!state.puzzleComplete('B3'));
});

test('B3: with both, his line, the ride over black, and the room it ends in; then not twice', async () => {
  const state = await inState('r15-b');
  const rule = ruleOf(state, 'with both');
  const out = useFork(state);
  assert.equal(out.say, rule.say);
  assert.ok(out.direction, 'it opens on the staging, which doc 95 acts (row 78)');
  assert.deepEqual(out.then, rule.then);
  const said = out.then?.[0];
  assert.ok(typeof said === 'object' && said.speaker === hostOf(state).id, 'then the livery man says his line');
  const ride = out.then?.at(-1);
  assert.ok(typeof ride === 'object' && ride.overBlack, 'the ride is over black');
  assert.equal(out.goesTo, rule.goto, 'and the room changes once it is read');
  assert.ok(state.content.rooms.has(rule.goto as string));
  // Doc 107 / errata 206: the ride ends at the washout, the trip begins; Vessel is found in the Gulch, not here.
  assert.ok(state.flags.get('T_GULCH_TRIP'), 'the trip has begun');
  assert.ok(!state.flags.get('T_VESSEL_FOUND'), 'Vessel is found at the tent, not by the ride');
  assert.ok(state.puzzleComplete('B3'));
  state.enterRoom('livery');
  assert.equal(useFork(state).say, ruleOf(state, 'after B3').say);
});

test('pair 20: the livery man\'s Assay story teaches it', async () => {
  const state = await inState('r15-a');
  state.dialogue.start(hostOf(state).tree as string);
  state.dialogue.select(opt(state, '7'));
  assert.ok(state.flags.get('ASSAY_PAIR_20'));
});
