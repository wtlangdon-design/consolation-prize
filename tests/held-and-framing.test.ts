/**
 * ERRATA 348, two things from the Act I playtest.
 *
 * 1. AN ITEM IS PUT DOWN BY ANY FINISHED ACTION. Only USE and GIVE put it down, so LOOK AT a thing with the fork in
 *    hand left the fork there and the sentence line read "Look at THE TUNING FORK on ..." for every hover after.
 * 2. MAIN STREET'S DOG IS IN FRAME FROM THE BOARDWALK. The zoomed view follows the player's feet; from
 *    the boardwalk the bottom of the street, the dog and the foot of the hitching rail were below it.
 *
 * Proved against the defect: with `if (used)` back in GameState.interact the first test fails; without Main Street's
 * `viewFloor` the second fails (the view's bottom is well above the dog's feet).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { cameraYFor } from '../engine/core/Camera.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);

test('an item in hand is put down by any finished action, not only by USE and GIVE', () => {
  const state = new GameState(content, new MemoryStorage());
  const target = state.targets.find((one) => one.responses?.LOOK_AT?.length)!;
  const item = state.carried[0]!;
  for (const verb of ['LOOK_AT', 'LISTEN_TO', 'USE']) {
    state.holdItem(item);
    assert.equal(state.heldItem, item);
    state.verbs.selectVerb(verb);
    state.interact(target, verb);
    assert.equal(state.heldItem, null, `${verb} done: nothing is in hand`);
  }
});

test('from Main Street\'s boardwalk the dog and the foot of the hitching rail are in frame', () => {
  const street = content.rooms.get('main_street')!;
  const view = 864 / street.zoom!;
  const farBand = Math.min(...street.walkBoxes!.flatMap((box) => box.points.map((point) => point.y)));
  const bottom = cameraYFor(farBand, 864, view, false, street.viewFloor) + view;
  const dog = content.ambient.get('dog')!;
  const horses = content.ambient.get('hitching_horses')!;
  assert.ok(bottom >= dog.y, `the view's bottom (${bottom}) reaches the dog's feet (${dog.y}) with him at the street's far edge (${farBand})`);
  assert.ok(bottom >= horses.y, `and the horses' (${horses.y})`);
});
