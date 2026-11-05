/**
 * ROOM 29, THE HIGH RIDGE, from the room's own fixture
 * (content/fixtures/room-29.json). Doc 02 sites no puzzle here; nobody is up
 * here.
 *
 * Doc 05: "The path up the ridge starts at the door" -- the laundry's door is
 * the way up and this room's path the way down (errata 99 E); and on the map
 * once the road to the claims has been walked (errata 99 A). THE ROAD EAST's
 * LISTEN is "Nothing coming." every time, as doc 54 decides. Every line
 * asserted is read from the documents.
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
const docs = (await Promise.all(['docs/05-examine-layer.md', 'docs/10-examine-batch-3.md', 'docs/54-batch-c.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-29.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;

const inState = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(FIXTURE.fixtures[0]!.id)!));
  return state;
};

test('every subject answers LOOK and LISTEN with a line the documents write', async () => {
  const state = await inState();
  assert.equal(state.roomId, ROOM);
  for (const target of state.room.hotspots ?? []) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(target, verb).say;
      assert.ok(said && docs.includes(said), `${target.id} ${verb}: "${said}" is written`);
    }
  }
  assert.equal((state.room.hotspots ?? []).length, 8, 'doc 05: eight subjects');
});

test('down the path to the door it starts at, and back up through the door', async () => {
  const state = await inState();
  const down = (state.room.exits ?? [])[0]!;
  state.enterRoom(down.to!);
  const up = (state.room.exits ?? []).find((exit) => exit.to === ROOM);
  assert.ok(up, 'the door is the way up');
  assert.ok(docs.includes(state.interact(up, 'LOOK_AT').say!), 'and it keeps its written lines');
  state.enterRoom(ROOM);
  assert.ok(state.room.entrances?.some((one) => one.from === down.to));
});

test('the ridge goes on the map once the road to the claims has been walked', async () => {
  const state = await inState();
  state.flags.set('T_SEEN_CLAIMS_ROAD', false);
  state.enterRoom('town_map');
  assert.ok(!state.mapLocations.some((one) => one.location.room === ROOM));
  state.flags.set('T_SEEN_CLAIMS_ROAD', true);
  state.enterRoom('town_map');
  assert.ok(state.mapLocations.some((one) => one.location.room === ROOM));
});
