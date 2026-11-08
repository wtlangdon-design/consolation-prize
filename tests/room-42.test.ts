/**
 * ROOM 42, THE BARBER'S (errata 183): the way in from the Lane and back, the barber who lives here, the price
 * board's lettering, and the repeat with a beat in it. Every line asserted here is read from the documents or
 * from content extracted from them, never typed into this file.
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

test("the barber's opens off the Lane, and its door leads back to the Lane's own arrival", async () => {
  const content = await loadContent(fsReader);
  const lane = content.rooms.get('the_lane');
  const shop = content.rooms.get('barbers');
  assert.ok(lane && shop, 'both rooms are loaded');
  const into = lane.exits.find((exit) => exit.to === 'barbers');
  assert.ok(into, 'the Lane has a door into the barber\'s');
  const back = shop.exits.find((exit) => exit.to === 'the_lane');
  assert.ok(back, 'the barber\'s has a door back to the Lane');
  assert.ok((lane.entrances ?? []).some((one) => one.from === 'barbers'),
    'coming out of the barber\'s puts Thad at its door, not at the Lane\'s far end (errata 83 G)');
});

test('the barber stands in his shop, speaks doc 07\'s tree, and has a bark for every reputation', async () => {
  const content = await loadContent(fsReader);
  const barber = content.ambient.get('barber');
  assert.ok(barber, 'the barber is loaded');
  assert.equal(barber.room, 'barbers');
  assert.ok(barber.tree && content.dialogue.has(barber.tree), 'his tree is loaded');
  const states = (await json('content/reputation.json')).states as string[];
  for (const state of states) assert.ok(barber.barks?.[state], `a bark for ${state}`);
  const doc07 = await readFile(resolve(ROOT, 'docs/07-ambient-layer.md'), 'utf8');
  const root = content.dialogue.get(barber.tree)!.nodes.root;
  assert.ok(root, 'his tree has a root');
  for (const option of root.options) {
    if (option.ends) continue;
    assert.ok(doc07.includes(`"${option.text}"`), `"${option.text}" is doc 07's`);
  }
});

test('THE PRICE BOARD is lettered with its own first LOOK, word for word', async () => {
  const room = await json('content/rooms/barbers.json');
  const board = room.hotspots.find((one: { id: string }) => one.id === 'price_board');
  const look: string = board.responses.LOOK_AT[0].say;
  const prop = (room.props ?? []).find((one: { id: string }) => one.id === 'price_board_lettering');
  assert.ok(prop, 'the board carries its lettering');
  const [x, y, w, h] = board.rect;
  assert.ok(prop.x > x && prop.x < x + w && prop.y > y && prop.y <= y + h, 'the lettering is on the board');
  // What the board says, as the LOOK reads it: three prices, each a trade and its price.
  const said = [...look.matchAll(/([A-Z]+) ([0-9$]+(?: BITS)?)\./g)].flatMap((m) => [m[1], m[2]]);
  assert.deepEqual(said, ['SHAVE', '2 BITS', 'TOOTH', '4 BITS', 'LIMB', '$1']);
});

test('a repeat written with a beat in it is spoken whole: the jar keeps its punchline (errata 183)', async () => {
  const doc = await readFile(resolve(ROOT, 'docs/105-the-six-interiors.md'), 'utf8');
  const row = doc.split('\n').find((line) => line.startsWith('**THE JAR** — LOOK 2'));
  assert.ok(row, 'doc 105 writes the jar\'s repeats');
  const piece = row.split('·')[0] ?? '';
  const quotes = [...piece.replace(/\*\(.*?\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(quotes.length, 2, 'the second LOOK is two quotes either side of a beat');
  const room = await json('content/rooms/barbers.json');
  const jar = room.hotspots.find((one: { id: string }) => one.id === 'jar');
  assert.equal(jar.responses.LOOK_AT[0].repeat[0], quotes.join(' '));
});
