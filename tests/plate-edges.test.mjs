/**
 * NO FRAME LEFT ON A PLATE, NO KEY COLOUR LEFT ON A FIGURE (errata 345).
 *
 * The Act I review's art director saw a pale grey line across the top of the Company's lobby, the livery and
 * Ozymandia's tent (and the bottom of two): the generation's frame, left on when the plate was cut. He also saw a
 * streak of key green on the message boy's shin. tools/art/plate-edge-lines.py and tools/art/key-fringe.py took them
 * off. Proved against the defect: on main before errata 345 the first test fails on six plates and the second on
 * art/actors/message-boy.png.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// The town map is a drawn sheet of paper with a border of its own.
const FRAMED_ON_PURPOSE = new Set(['room-00-town-map.png']);

const row = (png, y) => {
  let lum = 0; let sat = 0;
  for (let x = 0; x < png.width; x += 1) {
    const i = (y * png.width + x) * 4;
    const [r, g, b] = [png.pixels[i], png.pixels[i + 1], png.pixels[i + 2]];
    lum += 0.299 * r + 0.587 * g + 0.114 * b;
    sat += Math.max(r, g, b) - Math.min(r, g, b);
  }
  return { lum: lum / png.width, sat: sat / png.width };
};

test('no room plate has a pale grey line along its top or bottom edge', () => {
  const framed = [];
  for (const name of readdirSync(`${ROOT}art/backgrounds`).filter((one) => one.endsWith('.png') && !FRAMED_ON_PURPOSE.has(one))) {
    let png;
    // The reader takes truecolour only; the few indexed pictures here are not room plates.
    try { png = readPng(readFileSync(`${ROOT}art/backgrounds/${name}`)); } catch { continue; }
    if (png.width < 1900) continue;
    const [top, inTop, bottom, inBottom] = [row(png, 0), row(png, 5), row(png, png.height - 1), row(png, png.height - 6)];
    if (top.lum - inTop.lum > 40 && top.sat < 12) framed.push(`${name}: top`);
    if (bottom.lum - inBottom.lum > 40 && bottom.sat < inBottom.sat - 8) framed.push(`${name}: bottom`);
  }
  assert.deepEqual(framed, [], 'python3 tools/art/plate-edge-lines.py (add the plate to its list)');
});

test('the figures cleaned of their key colour carry none of its green', () => {
  for (const sheet of ['art/actors/room-43-bell-ringer.png', 'art/actors/message-boy.png', 'art/actors/ambient-map-seller-master.png']) {
    const png = readPng(readFileSync(`${ROOT}${sheet}`));
    let green = 0;
    for (let i = 0; i < png.pixels.length; i += 4) {
      const [r, g, b, a] = [png.pixels[i], png.pixels[i + 1], png.pixels[i + 2], png.pixels[i + 3]];
      if (a > 0 && g > r * 1.12 && g > b * 1.3 && g > 50) green += 1;
    }
    assert.equal(green, 0, `${sheet}: python3 tools/art/key-fringe.py`);
  }
});
