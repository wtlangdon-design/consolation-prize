/**
 * ROOM 14, BOOT HILL: its states, played through the game state from the
 * room's own fixtures (content/fixtures/room-14.json).
 *
 * Nobody stands here and no puzzle completes here (A1 is the undertaker's
 * news, tests/room-13.test.ts). What the room does is change: the funeral
 * day ends on walking up (doc 57 C3), the plot beside Pike is dug for Thad
 * once his obituary is printed, and after the funeral it is his own grave
 * (doc 05 Part Two-B). Every line asserted here is read from content
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
const shownProps = (state: GameState) => (state.room.props ?? [])
  .filter((prop) => state.flags.test(prop.when)).map((prop) => prop.id);
const here = (state: GameState, id: string) => state.findTarget(id) !== undefined;
const lookChain = (state: GameState, id: string) => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is in the room`);
  const rule = found.responses?.LOOK_AT?.[0];
  return [rule?.say, ...(rule?.repeat ?? [])];
};

test('on the map once Pike is dead, and the gate leads back to it', async () => {
  const state = await inState('r14-a');
  const map = state.content.rooms.get('town_map');
  const place = map?.locations?.find((one) => one.room === state.roomId);
  assert.ok(place, 'the map has a place for the hill');
  assert.ok(!('unbuilt' in place), 'and it is built');
  assert.ok(state.flags.test(place.when), 'shown once the undertaker has said it');
  state.flags.set('T_PIKE_DEAD', false);
  assert.ok(!state.flags.test(place.when), 'and not before');
  const gate = (state.room.exits ?? []).find((exit) => exit.to === 'town_map');
  assert.ok(gate?.overrides?.CLOSE, 'doc 49 writes the gate one line');
});

test('Act I: Pike\'s board, the nineteen read along, and nothing beside Pike yet', async () => {
  const state = await inState('r14-a');
  assert.deepEqual(shownProps(state), []);
  const ids = state.targets.map((one) => one.id);
  assert.ok(ids.every((id) => !['pike_s_neighbor', 'my_own_plot'].includes(id)), 'the plot is grass');
  const row = lookChain(state, 'nineteen');
  assert.equal(row.length, 10, 'nine names, then the row\'s end, which then repeats');
  const once = state.interact(state.findTarget('nineteen')!, 'LOOK_AT').say;
  assert.equal(once, row[0]);
});

test('the funeral day: walking up says the service is over, and the day ends', async () => {
  const state = await inState('r14-b');
  const entry = state.room.onEnter;
  assert.ok(entry?.say?.length, 'doc 57 C3 writes the line');
  assert.ok(state.flags.test(entry.sayWhen), 'it plays on the funeral day');
  assert.deepEqual(entry.saySet, { T_FUNERAL_DAY: false }, 'and playing it ends the day');
  state.flags.applyWrites(entry.saySet);
  assert.ok(!state.flags.test(entry.sayWhen), 'so the next entry is ordinary');
});

test('Act III, after the obituary: the plot beside Pike is dug, until the funeral', async () => {
  const state = await inState('r14-c');
  assert.deepEqual(shownProps(state), ['fresh_plot']);
  assert.ok(here(state, 'pike_s_neighbor'));
  assert.ok(!here(state, 'my_own_plot'));
  const neighbor = state.findTarget('pike_s_neighbor')!;
  assert.equal(state.interact(neighbor, 'LOOK_AT').say, lookChain(state, 'pike_s_neighbor')[0]);
  state.flags.set('T_OBITUARY', false);
  assert.deepEqual(shownProps(state), [], 'not dug before his name is in print');
});

test('after the funeral: his own plot, headboard and all, in its act', async () => {
  const state = await inState('r14-d');
  assert.deepEqual(shownProps(state), ['own_plot']);
  assert.ok(!here(state, 'pike_s_neighbor'));
  assert.ok(here(state, 'my_own_plot'));
  assert.equal(lookChain(state, 'my_own_plot').length, 3, 'Part Two-B\'s line and doc 54\'s two repeats');
  state.flags.set('ACT', 2);
  assert.ok(!here(state, 'my_own_plot'), 'acts 3-4 only');
});
