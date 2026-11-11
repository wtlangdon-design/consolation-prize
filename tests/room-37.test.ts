/**
 * ROOM 37, THE BOARDING HOUSE PARLOUR (errata 183): the way in from the map and back, the two women who run the
 * house and answer in two voices, and where the hero stands to look at things. Every line asserted here is read
 * from the documents or from content extracted from them, never typed into this file.
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

test('the boarding house is a built place on the map, and its door goes back to the map', async () => {
  const map = await json('content/rooms/town-map.json');
  const place = map.locations.find((one: { room: string }) => one.room === 'boarding_house_parlour');
  assert.ok(place, 'the map has the parlour');
  assert.ok(!place.unbuilt && !place.label, 'a built place draws its room\'s own name (MapLocation)');
  const content = await loadContent(fsReader);
  const parlour = content.rooms.get('boarding_house_parlour');
  assert.ok(parlour?.exits.some((exit) => exit.to === 'town_map'), 'the door goes back to the map');
});

test('the two women answer in two voices, and B asks again in her own (doc 07)', async () => {
  const content = await loadContent(fsReader);
  const a = content.ambient.get('boarding_a');
  const b = content.ambient.get('boarding_b');
  assert.ok(a && b && a.room === 'boarding_house_parlour' && b.room === 'boarding_house_parlour');
  assert.equal(a.tree, b.tree, 'TALK TO either opens the one tree');
  const tree = content.dialogue.get(a.tree!)!;
  const root = tree.nodes.root;
  assert.ok(root);
  const doc07 = await readFile(resolve(ROOT, 'docs/07-ambient-layer.md'), 'utf8');
  for (const option of root.options) if (!option.ends) assert.ok(doc07.includes(`"${option.text}"`), `"${option.text}" is doc 07's`);
  // THE JOKE is the COMIC that asks again (errata 183); errata 288 gave them a second COMIC, which does not.
  const comic = root.options.find((option) => option.tag === 'COMIC' && option.repeats);
  assert.ok(comic?.repeats?.[0]?.exchange, 'the joke has a second answer, as an exchange');
  const first = (comic.exchange ?? []).map((line) => line.speaker);
  const again = comic.repeats[0].exchange!.map((line) => line.speaker);
  assert.deepEqual(again, first, 'the same woman answers the second time as the first');
  const states = (await json('content/reputation.json')).states as string[];
  for (const state of states) assert.ok((a as unknown as { barkExchange: Record<string, unknown[]> }).barkExchange[state]?.length, `an exchange for ${state}`);
});

test('looking at anything in the parlour never stands the hero on top of either woman (doc 55 section 8)', async () => {
  const room = await json('content/rooms/boarding-house-parlour.json');
  const ann = await json('reference/room-37/annotation.json');
  const { far, near } = ann.scaling;
  const man = (y: number) => far.height + ((y - far.y) / (near.y - far.y)) * (near.height - far.height);
  const women = await Promise.all(['boarding-a', 'boarding-b'].map((f) => json(`content/ambient/${f}.json`)));
  const spots = [...room.hotspots.map((one: { id: string; walkTo: { x: number; y: number } }) => ({ id: one.id, ...one.walkTo })),
    { id: 'their talk spot', ...women[0].walkTo }];
  for (const who of women) {
    const [, , fw] = who.sprite.frames[0];
    const half = (fw * man(who.y) * who.sprite.stature / who.sprite.figureHeight) / 2;
    for (const spot of spots) {
      const width = man(spot.y) * 0.305;
      const clear = spot.x + width / 2 <= who.x - half || spot.x - width / 2 >= who.x + half;
      assert.ok(clear, `${spot.id}: the hero at ${spot.x},${spot.y} stands over ${who.id} at ${who.x}`);
    }
  }
});
