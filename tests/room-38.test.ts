/**
 * ROOM 38, THE PHOTOGRAPHER'S STUDIO (errata 183): the way in from the Lane and back, the photographer who works
 * here, and where the hero stands to look at things. Every line asserted here is read from the documents or from
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

test("the studio opens off the Lane by the door beside the window, and its door leads back to the Lane's own arrival", async () => {
  const content = await loadContent(fsReader);
  const lane = content.rooms.get('the_lane');
  const studio = content.rooms.get('photographers_studio');
  assert.ok(lane && studio, 'both rooms are loaded');
  const into = lane.exits.find((exit) => exit.to === 'photographers_studio');
  assert.ok(into, 'the Lane has a door into the studio');
  const window = lane.hotspots.find((one) => one.id === 'photographer_s_window');
  assert.ok(window, 'the window is still on the Lane, with doc 97\'s lines');
  const [wx, , ww] = window.rect;
  assert.ok(into.rect[0] >= wx + ww, 'the door is beside the window, not over it');
  assert.ok(studio.exits.some((exit) => exit.to === 'the_lane'), 'the studio has a door back to the Lane');
  assert.ok((lane.entrances ?? []).some((one) => one.from === 'photographers_studio'),
    'coming out of the studio puts the hero at its door (errata 83 G)');
});

test('the photographer works in his studio, speaks doc 07\'s tree, and has a bark for every reputation', async () => {
  const content = await loadContent(fsReader);
  const who = content.ambient.get('photographer');
  assert.ok(who, 'the photographer is loaded');
  assert.equal(who.room, 'photographers_studio');
  assert.ok(who.tree && content.dialogue.has(who.tree), 'his tree is loaded');
  const states = (await json('content/reputation.json')).states as string[];
  for (const state of states) assert.ok(who.barks?.[state], `a bark for ${state}`);
  const doc07 = await readFile(resolve(ROOT, 'docs/07-ambient-layer.md'), 'utf8');
  const root = content.dialogue.get(who.tree)!.nodes.root;
  assert.ok(root, 'his tree has a root');
  for (const option of root.options) {
    if (option.ends) continue;
    assert.ok(doc07.includes(`"${option.text}"`), `"${option.text}" is doc 07's`);
  }
});

test('looking at anything in the studio never stands the hero on top of the photographer (doc 55 section 8)', async () => {
  const room = await json('content/rooms/photographers-studio.json');
  const ann = await json('reference/room-38/annotation.json');
  const who = await json('content/ambient/photographer.json');
  const [, , fw] = who.sprite.frames[0];
  const { far, near } = ann.scaling;
  const man = (y: number) => far.height + ((y - far.y) / (near.y - far.y)) * (near.height - far.height);
  const half = (fw * man(who.y) / who.sprite.figureHeight) / 2;
  for (const spot of [...room.hotspots.map((one: { id: string; walkTo: { x: number; y: number } }) => ({ id: one.id, ...one.walkTo })),
    { id: 'his talk spot', ...who.walkTo }]) {
    const width = man(spot.y) * 0.305;
    const clear = spot.x + width / 2 <= who.x - half || spot.x - width / 2 >= who.x + half;
    assert.ok(clear, `${spot.id}: the hero at ${spot.x},${spot.y} stands over the photographer at ${who.x}`);
  }
});
