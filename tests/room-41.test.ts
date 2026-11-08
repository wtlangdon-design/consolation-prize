/**
 * ROOM 41, THE SCHOOLHOUSE (errata 183): on the map, its door a way out with doc 105's own lines, nobody in it, and
 * its counted things composed to the count doc 105 gives. Every line asserted here is read from the documents or from
 * content extracted from them.
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

test('the schoolhouse is a built place on the map, and THE DOOR leads back to it with doc 105\'s lines', async () => {
  const map = await json('content/rooms/town-map.json');
  const place = map.locations.find((one: { room: string }) => one.room === 'schoolhouse');
  assert.ok(place && !place.unbuilt && !place.label, 'a built place, drawing its room\'s own name');
  const content = await loadContent(fsReader);
  const door = content.rooms.get('schoolhouse')?.exits.find((exit) => exit.to === 'town_map');
  assert.ok(door, 'the door goes back to the map');
  assert.ok(!door.stub && door.responses?.LOOK_AT, 'the door has its own lines, not a stub');
});

test('the composer lays exactly the count doc 105 gives: fourteen desks and fourteen hooks', async () => {
  const doc = await readFile(resolve(ROOT, 'docs/105-the-six-interiors.md'), 'utf8');
  assert.match(doc, /"Fourteen desks, made by hand/, 'doc 105 counts the desks');
  assert.match(doc, /Fourteen hooks\. They counted\./, 'doc 105 counts the hooks');
  const tool = await readFile(resolve(ROOT, 'tools/art/room41-compose.py'), 'utf8');
  const rows = /ROWS = \[(.+?)\]\n/.exec(tool)?.[1] ?? '';
  const perRow = Number(/for i in range\((\d+)\)/.exec(tool)?.[1]);
  assert.equal((rows.match(/\(/g) ?? []).length * perRow, 14, 'rows times desks per row');
  const record = await json('art/staging/room-41/plate-01/frame.json');
  assert.match(record.source, /source-composed\.png$/, 'the shipping plate is derived from the composed picture');
});

test('nobody is in the schoolhouse', async () => {
  const content = await loadContent(fsReader);
  assert.deepEqual([...content.ambient.values()].filter((one) => one.room === 'schoolhouse').map((one) => one.id), []);
});
