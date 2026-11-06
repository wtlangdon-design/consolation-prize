import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { FLAT_ROWS, check, flatRows } from '../tools/check-plate-flat-edges.mjs';
import { readPng } from '../tools/lib/png.mjs';

/**
 * A PLATE THAT STOPS SHORT OF ITS FRAME FAILS (errata 119). Room 13 shipped
 * with its top 38 rows one flat colour (mean 23,23,22) over a near-black line;
 * operation 4 painted the ceiling there. This puts the band back on the
 * repaired plate and shows tools/check-plate-flat-edges.mjs catches it, top
 * and bottom, and that every plate in the game passes as shipped.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const plate = () => readPng(readFileSync(resolve(ROOT, 'art/backgrounds/room-13-undertakers.png')));

const band = (png, rows, fromBottom) => {
  const pixels = Buffer.from(png.pixels);
  for (let i = 0; i < rows; i += 1) {
    const y = fromBottom ? png.height - 1 - i : i;
    for (let x = 0; x < png.width; x += 1) {
      const at = (y * png.width + x) * 4;
      // Room 13's old band: 23,23,22 with a spread of about one.
      const n = (x * 7 + y * 13) % 3;
      pixels[at] = 22 + n; pixels[at + 1] = 22 + n; pixels[at + 2] = 21 + n;
    }
  }
  return { ...png, pixels };
};

test('the repaired undertaker\'s plate reaches its top edge', () => {
  assert.ok(flatRows(plate(), false) < FLAT_ROWS);
});

test('Room 13\'s old flat band, put back, is caught at the top and at the bottom', () => {
  assert.ok(flatRows(band(plate(), 38, false), false) >= 38, 'the top band');
  assert.ok(flatRows(band(plate(), 38, true), true) >= 38, 'the same band at the bottom');
  assert.ok(flatRows(band(plate(), FLAT_ROWS - 1, false), false) < FLAT_ROWS, 'a thin dark border is not a band');
});

test('every room plate in the game reaches its edges', () => {
  const report = check();
  assert.deepEqual(report.failures, []);
});
