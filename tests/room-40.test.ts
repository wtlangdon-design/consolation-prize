/**
 * ROOM 40, THE EMPTY STOREFRONT (errata 183; Tyler, 2026-11-08, "Door beside the window"): entered from the Lane by a
 * door beside the boarded window, which stays boarded so the Lane's lines about it stay true; the sign lettered with
 * its own LOOK. Every line asserted here is read from the documents or from content extracted from them.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const json = async (path: string) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('the storefront opens off the Lane by a door beside its window, and the window is still the boarded one', async () => {
  const content = await loadContent(fsReader);
  const lane = content.rooms.get('the_lane');
  assert.ok(lane);
  const door = lane.exits.find((exit) => exit.to === 'empty_storefront');
  const front = lane.hotspots.find((one) => one.id === 'empty_storefront');
  assert.ok(door && front, 'the Lane has the storefront and its door');
  assert.ok(door.rect[0] >= front.rect[0] + front.rect[2], 'the door is beside the boarded window, not over it');
  const look = (front.responses?.LOOK_AT?.[0] as { say: string }).say;
  assert.match(look, /boarded/, 'the storefront is still described as boarded, and still is');
  assert.ok(content.rooms.get('empty_storefront')?.exits.some((exit) => exit.to === 'the_lane'), 'its door goes back to the Lane');
  assert.ok((lane.entrances ?? []).some((one) => one.from === 'empty_storefront'), 'coming out puts the hero at its door');
});

test('THE SIGN is lettered with its own name, from its first LOOK', async () => {
  const room = await json('content/rooms/empty-storefront.json');
  const sign = room.hotspots.find((one: { id: string }) => one.id === 'sign');
  const look: string = sign.responses.LOOK_AT[0].say;
  const prop = room.props.find((one: { id: string }) => one.id === 'sign_lettering');
  const [x, y, w, h] = sign.rect;
  assert.ok(prop.x > x && prop.x < x + w && prop.y > y && prop.y < y + h, 'the lettering is on the sign');
  assert.match(look, /^HARDWARE & SUNDRIES\./, 'the name the lettering draws is the LOOK\'s');
});

test('nobody is in the empty storefront', async () => {
  const content = await loadContent(fsReader);
  assert.deepEqual([...content.ambient.values()].filter((one) => one.room === 'empty_storefront').map((one) => one.id), []);
});
