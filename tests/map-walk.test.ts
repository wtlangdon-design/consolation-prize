/**
 * ERRATA 163: THE MAP'S TOKEN. A small figure of the hero walks the district's drawn roads
 * to the place clicked, and arrives before the room changes. Held here: every
 * place is on the roads, every road leads somewhere, every walk ends where it
 * was going and inside its time, and his sheet holds the frames it names.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MapWalk, homeLocation, mapPath, placePoint } from '../engine/core/MapWalk.ts';
import type { RoomFile } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json') as { rooms: string[] };
const rooms = manifest.rooms.map((path) => read(path) as RoomFile);
const map = rooms.find((room) => room.kind === 'map')!;

test('the map has its token and its roads', () => {
  assert.ok(map.mapToken, 'mapToken');
  assert.ok(map.roads && Object.keys(map.roads.nodes).length > 0, 'roads');
});

test('every place on the map stands on a road node', () => {
  for (const place of map.locations ?? []) {
    assert.ok(place.node && map.roads!.nodes[place.node], place.id + ' names no node on the roads');
  }
  for (const [a, b] of map.roads!.edges) {
    assert.ok(map.roads!.nodes[a] && map.roads!.nodes[b], 'a road from ' + a + ' to ' + b + ' names a node that is not there');
  }
});

test('every place can be walked to from every other, along the roads, and the walk ends there in time', () => {
  const places = map.locations ?? [];
  for (const from of places) {
    for (const to of places) {
      if (from === to) continue;
      const path = mapPath(map, from, to);
      assert.ok(path.length > 2 || from.node === to.node || path.length === 2, from.id + ' to ' + to.id);
      const walk = new MapWalk(path, map.mapToken!);
      assert.ok(walk.seconds > 0 && walk.seconds <= (map.mapToken!.maxSeconds ?? Infinity), from.id + ' to ' + to.id + ': ' + walk.seconds + 's');
      const end = walk.at(walk.seconds + 1);
      const [x, y] = placePoint(map, to);
      assert.ok(end.done && Math.hypot(end.x - x, end.y - y) < 1, from.id + ' to ' + to.id + ' does not end at ' + to.id);
      assert.equal(end.frame, map.mapToken!.rest, 'he stands when he arrives');
    }
  }
  // Not a straight line across the map: Main Street to Boot Hill goes by the bridge.
  const town = places.find((place) => place.room === 'main_street')!;
  const hill = places.find((place) => place.room === 'boot_hill')!;
  assert.ok(mapPath(map, town, hill).length > 4, 'the walk to the hill follows the roads');
});

test('he stands at the place of the room the map was opened from, or at his home for it', () => {
  for (const place of map.locations ?? []) assert.equal(homeLocation(map, place.room)?.id, place.id);
  for (const [room, place] of Object.entries(map.mapToken!.homes ?? {})) {
    assert.ok(rooms.some((one) => one.id === room), 'homes names ' + room + ', which is no room');
    assert.equal(homeLocation(map, room)?.id, place, room + ' should open the map with him at ' + place);
  }
  assert.ok(homeLocation(map, 'lower_street'), 'a room with no place still has him somewhere');
});

test('his sheet holds every frame the map names, and the walk cycles them', () => {
  const token = map.mapToken!;
  const png = readPng(readFileSync(resolve(ROOT, token.sheet))) as { width: number; height: number };
  for (const [x, y, w, h] of token.frames) assert.ok(x + w <= png.width && y + h <= png.height, 'a frame outside the sheet');
  for (const index of [...token.walk, token.rest]) assert.ok(token.frames[index], 'frame ' + index + ' is not in the sheet');
  const town = (map.locations ?? []).find((place) => place.room === 'main_street')!;
  const creek = (map.locations ?? []).find((place) => place.room === 'creek')!;
  const walk = new MapWalk(mapPath(map, town, creek), token);
  const seen = new Set<number>();
  for (let t = 0; t < walk.seconds; t += 0.05) seen.add(walk.at(t).frame);
  assert.ok(seen.size >= token.walk.length, 'he walks through every walk frame');
});

test('while he walks the map, no place label is drawn over the road he walks (Tyler, 2026-11-11: "What happened to him?")', () => {
  // The hovered place's label is large and sits where the pointer chose it, which is where he is walking: he walked
  // under the words and could not be seen. Proved against the defect: the frame handing the label over regardless.
  const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
  assert.match(scene, /hoveredLocation: this\.mapWalk \? null : this\.hoveredLocation,/);
});
