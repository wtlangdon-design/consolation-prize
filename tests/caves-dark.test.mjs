/**
 * ERRATA 368: THE CAVES ARE LIT BY ONE LAMP AGAIN. The redrawn caves (errata 365) came back lighter than the plates
 * they replaced, "a single oil lamp providing the only light" (doc 12, Rooms 32 and 33 as the bible numbers them).
 * Tyler, 2026-11-16, left the call to the main session, which graded them back to the dark they had. Fails on main
 * before errata 368: the plates there average 24.3 and 24.2 of 255.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readPng } from '../tools/lib/png.mjs';

const ROOT = new URL('../', import.meta.url);
const mean = (path) => {
  const img = readPng(readFileSync(new URL(path, ROOT)));
  let sum = 0; let n = 0;
  for (let i = 0; i < img.pixels.length; i += 4) { sum += img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]; n += 3; }
  return sum / n;
};

// Each plate's mean before the redraw, in the same measure, with a little room.
for (const [path, most] of [
  ['art/backgrounds/room-33-listening-chamber.png', 15.5], ['art/backgrounds/room-33-listening-chamber-after.png', 15.5],
  ['art/backgrounds/room-34-under-prosperity.png', 19.5], ['art/backgrounds/room-34-under-prosperity-after.png', 19.5],
]) {
  test(`${path} is as dark as one lamp leaves it`, () => {
    const m = mean(path);
    assert.ok(m <= most, `mean ${m.toFixed(1)} of 255, more than ${most}`);
  });
}
