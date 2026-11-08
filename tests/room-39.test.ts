/**
 * ROOM 39, THE BAKEHOUSE (errata 183): the way in from the map and back, the boy who works there and never
 * speaks, and where the hero stands to look at things. Every line asserted here is read from the documents or from
 * content extracted from them, never typed into this file.
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

test('the bakehouse is a built place on the map, and its door goes back to the map', async () => {
  const map = await json('content/rooms/town-map.json');
  const place = map.locations.find((one: { room: string }) => one.room === 'bakehouse');
  assert.ok(place && !place.unbuilt && !place.label, 'a built place, drawing its room\'s own name');
  const content = await loadContent(fsReader);
  assert.ok(content.rooms.get('bakehouse')?.exits.some((exit) => exit.to === 'town_map'), 'the door goes back to the map');
});

test('the boy is a figure, not a speaker: no tree, and TALK TO answers with doc 105\'s own line', async () => {
  const content = await loadContent(fsReader);
  const boy = content.ambient.get('bakehouse_boy');
  assert.ok(boy && boy.room === 'bakehouse');
  assert.ok(!boy.tree, 'doc 07 writes him no tree');
  const room = await json('content/rooms/bakehouse.json');
  const hotspot = room.hotspots.find((one: { id: string }) => one.id === 'boy');
  const [x, y, w, h] = hotspot.rect;
  assert.ok(boy.x > x && boy.x < x + w && boy.y > y && boy.y <= y + h + 10, 'THE BOY\'s hotspot is on his figure');
  const doc = await readFile(resolve(ROOT, 'docs/105-the-six-interiors.md'), 'utf8');
  assert.ok(doc.includes(`**THE BOY** · TALK TO — "${hotspot.overrides.TALK_TO}"`), 'his TALK TO is doc 105\'s');
});

test('looking at anything in the bakehouse never stands the hero on top of the boy (doc 55 section 8)', async () => {
  const room = await json('content/rooms/bakehouse.json');
  const ann = await json('reference/room-39/annotation.json');
  const boy = await json('content/ambient/bakehouse-boy.json');
  const { far, near } = ann.scaling;
  const man = (y: number) => far.height + ((y - far.y) / (near.y - far.y)) * (near.height - far.height);
  const [, , fw] = boy.sprite.frames[0];
  const half = (fw * man(boy.y) * boy.sprite.stature / boy.sprite.figureHeight) / 2;
  for (const one of room.hotspots as { id: string; walkTo: { x: number; y: number } }[]) {
    const width = man(one.walkTo.y) * 0.305;
    const clear = one.walkTo.x + width / 2 <= boy.x - half || one.walkTo.x - width / 2 >= boy.x + half;
    assert.ok(clear, `${one.id}: the hero at ${one.walkTo.x},${one.walkTo.y} stands over the boy at ${boy.x}`);
  }
});
