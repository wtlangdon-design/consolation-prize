/**
 * ROOM 15, THE LIVERY STABLE: its puzzles, played through the game state from
 * the room's own fixtures (content/fixtures/room-15.json).
 *
 * B2 (doc 57): LIV_A1's refusal, then the man she moved for, asked from the
 * board of names, and only then the tune, heard by LISTENing (errata 278). The blanket on loan (LIV_A1 option 5, doc 23): the bin is drawn
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
import { HeadlessPlayer } from './lib/headless-player.ts';

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

// ERRATA 278 (doc 125): the errand by hand. The question is asked from the
// board, and the tune is heard, not asked for.
const boardOf = (state: GameState) => {
  const board = state.room.hotspots.find((one) => (one.responses?.LOOK_AT ?? []).some((rule) => rule.set?.T_BOARD_GRIEVANCE));
  assert.ok(board, 'a hotspot whose LOOK writes T_BOARD_GRIEVANCE');
  return state.findTarget(board.id)!;
};
const listenToHim = (state: GameState) => {
  state.dialogue.end();
  return new HeadlessPlayer(state).verb(hostOf(state).id, 'LISTEN_TO');
};

test('B2: asked from the board; the tune is heard, then asked about; option 6 is B2', async () => {
  const state = await inState('r15-a');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'LIV_A1');
  assert.ok(!shown(state).includes(opt(state, '6')), 'nothing to ask from before the board is read');
  assert.ok(!shown(state).includes(opt(state, '4')), 'no tune before the story');
  state.dialogue.select(opt(state, '1'));
  assert.ok(!state.puzzleComplete('B2'), 'the refusal alone is not B2');
  state.dialogue.end();

  const before = listenToHim(state);
  assert.ok(before.say, 'he can be listened to before the story');
  assert.ok(!state.flags.get('T_HUM_HEARD'), 'no hum before the story');

  const first = state.interact(boardOf(state), 'LOOK_AT');
  assert.ok(state.flags.get('T_BOARD_GRIEVANCE'), 'the board has been read');
  const second = state.interact(boardOf(state), 'LOOK_AT');
  assert.notEqual(second.say, first.say, 'the board\'s second look is its repeat, not its first line again');

  state.dialogue.start(hostOf(state).tree as string);
  assert.ok(shown(state).includes(opt(state, '6')), 'now the question from the board');
  state.dialogue.select(opt(state, '6'));
  assert.ok(state.flags.get('T_GRIEVANCE_MOTT'));
  assert.ok(state.puzzleComplete('B2'));
  assert.ok(!shown(state).includes(opt(state, '4')), 'not asked for: the tune has to be heard first');

  const hum = listenToHim(state);
  assert.notEqual(hum.say, before.say, 'after the story he is humming');
  assert.ok(state.flags.get('T_HUM_HEARD'), 'hearing it is what B3 needs');
  // Unmarked (invariant 3's rule, kept here): the rule is a LISTEN like any other, with no cue of its own.
  const rules = state.content.rooms.get(state.roomId)?.peopleResponses?.[hostOf(state).id]?.LISTEN_TO ?? [];
  assert.ok(rules.length, 'his LISTEN lines are in the room');
  for (const rule of rules) assert.deepEqual(Object.keys(rule).filter((key) => !['when', 'say', 'repeat', 'set'].includes(key)), []);

  state.dialogue.start(hostOf(state).tree as string);
  assert.ok(shown(state).includes(opt(state, '4')), 'now he can be asked what the tune is');
  state.dialogue.select(opt(state, '4'));
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
