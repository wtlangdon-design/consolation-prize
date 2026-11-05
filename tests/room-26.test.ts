/**
 * ROOM 26, THE CREEK AND THE SLUICE, from the room's own fixture
 * (content/fixtures/room-26.json). Doc 02 sites no puzzle here.
 *
 * Doc 20: the diggings are reached "via 22", the junction -- the creek goes
 * on the map once Thad has walked the road to the claims (errata 99 A), and
 * its way back leads up to the road. THE MAN PANNING is a figure with no
 * tree (doc 10: "He has not spoken in nine hours"), examined through the
 * hotspot over him. Every line asserted is read from the documents.
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
const FIXTURE = JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-26.json'), 'utf8')) as { fixtures: { id: string; room: string }[] };
const ROOM = FIXTURE.fixtures[0]!.room;

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};

test('the creek goes on the map once the road to the claims has been walked', async () => {
  const fresh = await inState('r22-a');
  const road = fresh.content.rooms.get(ROOM)!.exits!.find((exit) => exit.to)!.to!;
  fresh.flags.set('T_SEEN_CLAIMS_ROAD', false);
  fresh.enterRoom('town_map');
  assert.ok(!fresh.mapLocations.some((one) => one.location.room === ROOM), 'not before');
  fresh.enterRoom(road);
  for (const [flag, value] of Object.entries(fresh.room.onEnter?.set ?? {})) fresh.flags.set(flag, value);
  fresh.enterRoom('town_map');
  assert.ok(fresh.mapLocations.some((one) => one.location.room === ROOM), 'after the road');
});

test('every subject answers LOOK and LISTEN with a line the documents write', async () => {
  const state = await inState('r26-a');
  assert.equal(state.roomId, ROOM);
  let subjects = 0;
  for (const target of state.room.hotspots ?? []) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(target, verb).say;
      assert.ok(said && docs.includes(said), `${target.id} ${verb}: "${said}" is written`);
    }
    subjects += 1;
  }
  assert.equal(subjects, 10, 'doc 54: ten objects');
});

test('the man panning is examined, not spoken to: no tree, a hotspot over him', async () => {
  const state = await inState('r26-a');
  const figure = [...state.content.ambient.values()].find((one) => one.room === ROOM);
  assert.ok(figure, 'he is at the water');
  assert.equal(figure.tree ?? '', '', 'he does not speak');
  const over = (state.room.hotspots ?? []).find((one) => {
    const [x, y, w, h] = one.rect;
    return figure.x >= x && figure.x <= x + w && figure.y - 20 >= y && figure.y - 20 <= y + h && one.id !== 'creek' && one.id !== 'boot_prints';
  });
  assert.ok(over, 'a hotspot over him');
  assert.ok(docs.includes(state.interact(over, 'LOOK_AT').say!));
});

test('the way back leads up to the road', async () => {
  const state = await inState('r26-a');
  const out = (state.room.exits ?? [])[0];
  assert.ok(out?.to && state.content.rooms.has(out.to));
  state.enterRoom(out.to);
  assert.ok(state.room.entrances?.some((one) => one.from === ROOM), 'the road has somewhere to land him');
});
