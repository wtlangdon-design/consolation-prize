/**
 * ROOM 18, THE HOTEL LOBBY: A2, played through the game state from the room's
 * own fixture (content/fixtures/room-18.json).
 *
 * Doc 27 and doc 57 A2: the clerk's tree grants leave to tune the piano
 * (option 4, after the price and the four dollars); the fork on the parlor
 * piano is refused before that leave, earns the room after it -- doc 24's line,
 * then the clerk's -- and is only checked again after. The stairs are not a
 * way up until the room is given: before, they answer with the clerk's line.
 * Every line asserted here is read from content extracted from the documents.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: A2

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
const pair = (state: GameState) => {
  const found = state.content.combinations.pairs.find((one) => one.room === state.roomId && one.item === 'tuning_fork');
  assert.ok(found?.rules?.length, 'the fork has a pair in this room');
  return found;
};
const fork = (state: GameState) => {
  const target = state.findTarget(pair(state).target);
  assert.ok(target, 'the instrument is in the room');
  state.holdItem(null);
  state.holdItem('tuning_fork');
  return state.interact(target, 'USE');
};
const ruleOf = (state: GameState, label: string) => {
  const rule = pair(state).rules?.find((one) => one.case === label);
  assert.ok(rule, `a case "${label}"`);
  return rule;
};
const upstairs = (state: GameState) => (state.room.exits ?? []).find((exit) => exit.id === 'stairs');

test('A2: refused before the clerk agrees; his leave, then the fork, is the room', async () => {
  const state = await inState('r18-a');
  assert.equal(fork(state).say, ruleOf(state, 'before T_TUNES_PIANOS').say);
  assert.ok(!state.puzzleComplete('A2'));
  state.dialogue.start(hostOf(state).tree as string);
  for (const suffix of ['2', '3', '4']) state.dialogue.select(opt(state, suffix));
  assert.ok(state.flags.get('T_TUNES_PIANOS'), 'option 4 grants leave');
  assert.ok(!state.puzzleComplete('A2'), 'option 4 does not complete the puzzle (doc 27)');
  const tuned = fork(state);
  const rule = ruleOf(state, 'after T_TUNES_PIANOS');
  assert.equal(tuned.say, rule.say);
  assert.deepEqual(tuned.then, rule.then);
  assert.ok(state.puzzleComplete('A2'));
  assert.equal(fork(state).say, ruleOf(state, 'after A2').say);
});

test('the stairs are the clerk\'s line until the room is given, and then the way up', async () => {
  const state = await inState('r18-a');
  const exit = upstairs(state);
  assert.ok(exit, 'the stairs are an exit');
  assert.ok(!state.flags.test(exit.when), 'not before A2');
  const closed = state.findTarget('stairs_closed');
  assert.ok(closed, 'in their place, the stairs that answer');
  const said = state.interact(closed, 'WALK_TO');
  assert.ok(said.say, 'a written line');
  assert.equal(said.by, hostOf(state).id, 'the clerk says it');
  assert.ok(closed.responses?.LOOK_AT?.length, 'and they can still be looked at');
  state.flags.set('T_ROOM_GRANTED', true);
  assert.ok(state.flags.test(exit.when));
  assert.equal(state.findTarget('stairs_closed'), undefined);
});
