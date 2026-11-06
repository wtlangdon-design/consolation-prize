import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { planBoot, planNear } from '../engine/core/BootAssets.ts';
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
    assert.ok(plates <= 1 + new Set((room.exits ?? []).map((exit) => exit.to)).size,
      `${room.id}: asks for ${plates} plates, more than itself and its neighbours`);
    assert.ok(near.length < all, `${room.id}: asks for all ${all} images`);
  }
});
