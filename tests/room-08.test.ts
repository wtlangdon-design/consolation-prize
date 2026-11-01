/**
 * ROOM 8, THE REGISTRAR'S ARCHIVE: E9, played through the game state from the
 * room's fixtures (content/fixtures/room-08.json).
 *
 * Doc 57 E9: with the executor named, OPEN on Room 7's archive door is the
 * clerk's exchange and the way in; inside, THE EXECUTOR'S FORM on THE MOTT
 * FILE is the same hand -- or, with T_HOB_HANDWRITING, LOOKing is enough
 * (invariant 7). Without either, the file's ordinary lines play and nothing
 * is lost. Every line asserted here is read from extracted content.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: E9

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
const target = (state: GameState, id: string) => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is here`);
  return found;
};

test('E9: the executor\'s agent is let in, and the form on the file is the same hand', async () => {
  const state = await inState('r8-a');
  const door = target(state, 'sealed_archive_door');
  const rule = door.responses?.OPEN?.find((one) => one.when && 'T_EXECUTOR_NAMED' in one.when);
  assert.ok(rule?.goto, 'the door\'s executor line leads somewhere');
  const opened = state.interact(door, 'OPEN');
  assert.equal(opened.say, rule.say);
  assert.ok(opened.by, 'the clerk speaks first');
  assert.equal(opened.changedRoom, false, 'the exchange is spoken at the door');
  assert.equal(opened.goesTo, rule.goto, 'and leads in once it has been read');
  state.enterRoom(opened.goesTo);
  const file = target(state, 'mott_file');
  const pair = state.content.combinations.pairs.find((one) => one.room === state.roomId && one.target === file.id);
  assert.ok(pair?.rules?.length);
  state.holdItem(pair.item);
  const seen = state.interact(file, 'USE');
  assert.equal(seen.say, pair.rules[0]!.say);
  assert.ok(state.puzzleComplete('E9'));
  assert.ok(state.flags.get('T_SAME_HAND'));
  assert.ok(state.carried.includes(pair.item), 'the form is kept');
});

test('E9 by looking: with T_HOB_HANDWRITING the LOOK is enough, and without it nothing is lost', async () => {
  const state = await inState('r8-b');
  const file = target(state, 'mott_file');
  const rule = file.responses?.LOOK_AT?.find((one) => one.when && 'T_HOB_HANDWRITING' in one.when);
  assert.ok(rule?.completes, 'the look completes a puzzle');
  assert.equal(state.interact(file, 'LOOK_AT').say, rule.say);
  assert.ok(state.puzzleComplete('E9'));
  const plain = await inState('r8-b');
  plain.flags.set('T_HOB_HANDWRITING', false);
  const said = plain.interact(target(plain, 'mott_file'), 'LOOK_AT').say;
  assert.notEqual(said, rule.say, 'the ordinary lines play');
  assert.equal(plain.puzzleComplete('E9'), false);
});

test('before the executor is named the archive door stays locked, in its own words', async () => {
  const state = await inState('r8-a');
  state.flags.set('T_EXECUTOR_NAMED', false);
  const door = target(state, 'sealed_archive_door');
  const here = state.roomId;
  const said = state.interact(door, 'OPEN');
  assert.equal(said.say, door.overrides?.OPEN);
  assert.equal(state.roomId, here);
});
