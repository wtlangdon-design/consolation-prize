import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { gotoRooms, planBoot, planNear, planRoom } from '../engine/core/BootAssets.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';

/**
 * THE GAME LOADS BY ROOM (Tyler, 2026-11-05: a `?room=` link to the third
 * room was a black screen). Boot used to wait for the start room whatever the
 * session opened in, then queue every image in the game at once; the warped-to
 * room's plate was file 581 in that queue, and every plate then sat in
 * graphics memory together.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('boot waits for the room the session opens in, not the start room', async () => {
  const content = await loadContent(fsReader);
  const start = content.manifest.startRoom;
  const other = [...content.rooms.values()].find((room) => room.id !== start && room.background && room.kind !== 'map')!;
  const keys = new Set(planBoot(content, other.id).required.map((asset) => asset.key));
  assert.ok(keys.has(`bg:${other.id}`), 'the opening room\'s plate is waited for');
  assert.ok(!keys.has(`bg:${start}`), 'the start room\'s plate is not, when the session opens elsewhere');
  const fromStart = new Set(planBoot(content).required.map((asset) => asset.key));
  assert.ok(fromStart.has(`bg:${start}`), 'a new game still waits for the start room');
});

test('a room asks for itself first and never for the whole game', async () => {
  const content = await loadContent(fsReader);
  const all = planBoot(content).deferred.length + planBoot(content).required.length;
  for (const room of content.rooms.values()) {
    const near = planNear(content, room.id);
    if (room.background) assert.equal(near[0]?.key, `bg:${room.id}`, `${room.id}: its own plate comes first`);
    const plates = near.filter((asset) => asset.key.startsWith('bg:')).length;
    assert.ok(plates <= 1 + new Set([...(room.exits ?? []).map((exit) => exit.to), ...gotoRooms(content, room.id)]).size,
      `${room.id}: asks for ${plates} plates, more than itself and its neighbours`);
    assert.ok(near.length < all, `${room.id}: asks for all ${all} images`);
  }
});

/*
 * THE ROOMS REACHED WITHOUT AN EXIT (the full playthrough in the real build,
 * 2026-11-09). Every room the town map took the player to, and the Washout
 * after the ride, was first asked for on arrival and drawn without its props
 * while they came in: the map has no exits, and a `goto` is not one.
 */
const missing = (near: { key: string }[], roomId: string, content: Awaited<ReturnType<typeof loadContent>>) => {
  const keys = new Set(near.map((asset) => asset.key));
  return planRoom(content, roomId).filter((asset) => !keys.has(asset.key)).map((asset) => asset.key);
};

test('a place clicked on the map is fetched while he walks there', async () => {
  const content = await loadContent(fsReader);
  const map = [...content.rooms.values()].find((room) => room.kind === 'map');
  assert.ok(map?.locations?.length, 'the game has a town map with places on it');
  let unreached = 0;
  for (const location of map.locations) {
    if (!content.rooms.has(location.room)) continue;
    // The defect's shape: the map alone is next door to nothing.
    if (missing(planNear(content, map.id), location.room, content).length) unreached += 1;
    assert.deepEqual(missing(planNear(content, map.id, location.room), location.room, content), [],
      `${location.id}: everything ${location.room} needs to be seen whole is asked for once it is the way he is heading`);
  }
  assert.ok(unreached > 0, 'without the heading some place on the map is not asked for -- which is why the heading is needed');
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const click = scene.slice(scene.indexOf('private onMapClick('), scene.indexOf('this.mapWalk = { walk,'));
  assert.match(click, /this\.loadNear\(location\.room\)/, 'the map click asks for the place before the walk begins');
});

test('a room a goto hands on to is next door, like an exit\'s', async () => {
  const content = await loadContent(fsReader);
  let checked = 0;
  for (const room of content.rooms.values()) {
    for (const to of gotoRooms(content, room.id)) {
      assert.deepEqual(missing(planNear(content, room.id), to, content), [], `${room.id} -> ${to}: asked for before the goto`);
      checked += 1;
    }
  }
  // Found from the data: an item pair's goto (the ride) and a room file's own.
  const pairRooms = (content.combinations?.pairs ?? []).filter((pair) => JSON.stringify(pair).includes('"goto"')).map((pair) => pair.room);
  assert.ok(pairRooms.length > 0 && pairRooms.every((id) => gotoRooms(content, id).length > 0), 'a pair\'s goto counts for the room it is used in');
  assert.ok(checked > pairRooms.length, 'and a room file\'s own gotos count too');
});
