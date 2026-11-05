/**
 * ROOM 27, THE ABANDONED CLAIM ROW, from the room's own fixture
 * (content/fixtures/room-27.json). Doc 02 sites no puzzle here; nobody is up
 * here (doc 08).
 *
 * Doc 05: "Eleven holes", "Of the eleven, this is the one I think about". The
 * row has eleven markers, each a subject: ten painted into the plate and the
 * last, THE BLANK ONE, a prop at the path's end (errata 99 C). On the map
 * once the road to the claims has been walked (errata 99 A). Every line
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
const docs = (await Promise.all(['docs/05-examine-layer.md', 'docs/08-examine-batch-1.md', 'docs/10-examine-batch-3.md', 'docs/54-batch-c.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-27.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
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
  assert.equal((state.room.hotspots ?? []).length, 15, 'doc 05: fifteen subjects');
});

test('the row has eleven markers, the last one standing at the path\'s end', async () => {
  const state = await inState();
  const markers = (state.room.hotspots ?? []).filter((one) => one.id.startsWith('claim_marker_'));
  assert.equal(markers.length, 11, 'eleven');
  const last = [...markers].sort((a, b) => a.rect[0] - b.rect[0]).at(-1)!;
  const prop = (state.room.props ?? [])[0];
  assert.ok(prop, 'the eleventh is a prop');
  const [x, y, w, h] = last.rect;
  assert.ok(prop.x >= x && prop.x <= x + w && prop.y - 40 >= y && prop.y - 40 <= y + h, 'and its hotspot is over it');
});

test('the row goes on the map once the road to the claims has been walked, and leads back to it', async () => {
  const state = await inState();
  state.flags.set('T_SEEN_CLAIMS_ROAD', false);
  state.enterRoom('town_map');
  assert.ok(!state.mapLocations.some((one) => one.location.room === ROOM));
  state.flags.set('T_SEEN_CLAIMS_ROAD', true);
  state.enterRoom('town_map');
  assert.ok(state.mapLocations.some((one) => one.location.room === ROOM));
  const out = state.content.rooms.get(ROOM)!.exits![0]!;
  state.enterRoom(out.to!);
  assert.ok(state.room.entrances?.some((one) => one.from === ROOM));
});
