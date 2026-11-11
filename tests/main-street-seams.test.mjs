import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

/**
 * MAIN STREET IS CUT FROM ITS WINDOWS, NEVER BLENDED (errata 277).
 *
 * The redraw (errata 272, 276) was painted in three overlapping windows and stitched back. The first stitch feathered
 * each overlap, and where two drawings of one porch sit a few pixels apart a blend shows both: Tyler, 2026-11-11,
 * "The pillars look slightly doubled up?" (the Nugget's porch). The stitch now cuts each overlap along the path where
 * the two drawings differ least, so every pixel of the street is one window's own. This holds that: across both
 * overlaps, sampled pixels of the shipped plate are exactly some window's pixel at that place.
 */
const root = new URL('..', import.meta.url);
const png = (path) => readPng(readFileSync(new URL(path, root)));
const plate = png('art/backgrounds/room-02-main-street.png');
const used = JSON.parse(readFileSync(new URL('art/staging/room-02/redraw/candidate.json', root), 'utf8'));
const windows = [1, 2, 3].map((n) => png(`art/staging/room-02/redraw/${used[String(n)]}`));
const SMALL_W = 2929; const BAND = 684; const WIN = 1520; const XS = [0, 705, 1409]; const AT = [8, 170];

test('every sampled pixel in the overlaps is one window\'s own, not a mix of two', () => {
  let checked = 0; let mixed = 0;
  for (let i = 0; i < 4000; i += 1) {
    const sx = 705 + ((i * 7919) % (2225 - 705));
    const sy = (i * 104729) % BAND;
    // Where PIL's nearest-neighbour enlargement put this small pixel on the 3700 x 864 street.
    const X = Math.min(3699, Math.floor(((sx + 0.5) * 3700) / SMALL_W));
    const Y = Math.min(863, Math.floor(((sy + 0.5) * 864) / BAND));
    const at = (Y * plate.width + X) * 4;
    const here = [plate.pixels[at], plate.pixels[at + 1], plate.pixels[at + 2]];
    const sxBack = Math.min(SMALL_W - 1, Math.floor(((X + 0.5) * SMALL_W) / 3700));
    const syBack = Math.min(BAND - 1, Math.floor(((Y + 0.5) * BAND) / 864));
    const owners = windows.filter((_, k) => sxBack >= XS[k] && sxBack < XS[k] + WIN).map((image) => {
      const k = windows.indexOf(image);
      const wx = AT[0] + sxBack - XS[k]; const wy = AT[1] + syBack;
      const w = (wy * image.width + wx) * 4;
      return [image.pixels[w], image.pixels[w + 1], image.pixels[w + 2]];
    });
    if (owners.length < 2) continue;
    checked += 1;
    if (!owners.some((one) => one.every((v, c) => Math.abs(v - here[c]) <= 1))) mixed += 1;
  }
  assert.ok(checked > 1000, `only ${checked} overlap pixels sampled`);
  assert.ok(mixed / checked < 0.01, `${mixed} of ${checked} overlap pixels are no window's own: the windows were blended, and a blend doubles what moved`);
});
