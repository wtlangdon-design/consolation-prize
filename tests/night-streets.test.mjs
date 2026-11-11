import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

/**
 * THE TOWN'S STREETS ARE ONE NIGHT (errata 268).
 *
 * Tyler, 2026-11-10: "do you think Main Street looks like it was drawn by the same hand as all of the other rooms?"
 * It did not. Its ground was twice as bright as the side streets' (66 against 32) and scattered with neon-blue
 * puddles (4% of the ground), where the streets it opens onto were dim, quiet dirt. tools/art/night-streets.py brought
 * Main Street down and the side streets up. This holds them together: whichever plate is replaced next has to come
 * out in the same night as the streets beside it.
 */
const root = new URL('..', import.meta.url);
const MAIN = 'art/backgrounds/room-02-main-street.png';
const SIDE = ['art/backgrounds/room-43-lower-street.png', 'art/backgrounds/room-44-the-lane.png', 'art/backgrounds/room-20-back-alley.png'];
/** The bottom quarter of a plate: how light it is, and how much of it is a blue far bluer than it is red. */
function ground(path) {
  const image = readPng(readFileSync(new URL(path, root)));
  let sum = 0; let neon = 0; let n = 0;
  for (let y = Math.floor(image.height * 0.75); y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 3) {
      const at = (y * image.width + x) * 4;
      const [r, g, b] = [image.pixels[at], image.pixels[at + 1], image.pixels[at + 2]];
      sum += (r + g + b) / 3; n += 1;
      if (b - r > 60) neon += 1;
    }
  }
  return { light: sum / n, neon: neon / n };
}

test('Main Street\'s ground is the side streets\' ground with more lamps on it, not another town\'s', () => {
  const main = ground(MAIN);
  const side = SIDE.map(ground);
  const theirs = side.reduce((total, one) => total + one.light, 0) / side.length;
  assert.ok(main.light / theirs <= 1.5,
    `Main Street's ground is ${(main.light / theirs).toFixed(2)} times as light as the streets it opens onto (${main.light.toFixed(1)} against ${theirs.toFixed(1)})`);
  // Errata 276: the redraw is drawn in the side streets' own hand and night, so their grounds now match (0.96); what
  // this guards against is Main Street going much darker than the streets it opens onto.
  assert.ok(main.light / theirs >= 0.9, `Main Street's ground is ${(main.light / theirs).toFixed(2)} of the side streets': the lit street much darker than its back streets`);
});

test('no street at night has puddles that glow', () => {
  for (const path of [MAIN, ...SIDE]) {
    const { neon } = ground(path);
    assert.ok(neon <= 0.015, `${path}: ${(neon * 100).toFixed(1)}% of the ground is a bright blue no night sky would put there`);
  }
});
