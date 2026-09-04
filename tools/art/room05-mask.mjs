import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { writePng } from '../lib/pngwrite.mjs';

/**
 * ROOM 5's COUNTER OCCLUSION MASK, MEASURED OFF THE CANDIDATE PLATE.
 *
 * Plane 1 is the counter Winnie stands behind: its top back edge down to its
 * base across its width, plus the brass cage bars that rise from it and pass
 * in front of her. The counter is authored as a rectangle read off the
 * picture; the bars are found by colour inside the cage's own rectangle --
 * brass is the one warm, bright thing in a grey-and-bone room, so a
 * threshold on "warm and bright" inside that box is the bars and nothing
 * else. Both are deterministic reads of a named file, and the mask records
 * the plate hash it was read from.
 *
 *   node tools/art/room05-mask.mjs <candidate plate> <out mask>
 */
const [, , platePath, outPath] = process.argv;
const bytes = readFileSync(resolve(ROOT, platePath));
const plate = readPng(bytes);
if (plate.width !== 1920 || plate.height !== 864) throw new Error('expects a 1920x864 plate');

const mask = new Uint8Array(1920 * 864 * 4);
const set = (x, y) => { const at = (y * 1920 + x) * 4; mask[at] = 255; mask[at + 1] = 255; mask[at + 2] = 255; mask[at + 3] = 255; };

// The counter: back edge of the top surface (y404) to the floor line (y705).
const COUNTER = { x0: 695, y0: 395, x1: 1497, y1: 706 };  // plate-02
for (let y = COUNTER.y0; y < COUNTER.y1; y += 1) for (let x = COUNTER.x0; x < COUNTER.x1; x += 1) set(x, y);

// The cage bars above it: warm, bright pixels inside the cage rectangle --
// AND ONLY THE LONG RUNS. A plain threshold also caught the vial labels on
// the shelves behind her, the scales' brass and the ledger's pages, which
// would have masked her with things that are BEHIND her or UNDER her hands.
// A bar is a warm pixel in a vertical run of at least 30 or a horizontal
// run of at least 60; a label is neither.
const CAGE = { x0: 720, y0: 0, x1: 1400, y1: 395 };  // plate-02
const warm = new Uint8Array(1920 * 864);
for (let y = CAGE.y0; y < CAGE.y1; y += 1) {
  for (let x = CAGE.x0; x < CAGE.x1; x += 1) {
    const at = (y * 1920 + x) * 4;
    const r = plate.pixels[at], g = plate.pixels[at + 1], b = plate.pixels[at + 2];
    if (r - b > 40 && r > 110 && g > 80) warm[y * 1920 + x] = 1;
  }
}
const keep = new Uint8Array(1920 * 864);
for (let x = CAGE.x0; x < CAGE.x1; x += 1) {
  let run = 0;
  for (let y = CAGE.y0; y <= CAGE.y1; y += 1) {
    if (y < CAGE.y1 && warm[y * 1920 + x]) { run += 1; continue; }
    if (run >= 30) for (let k = y - run; k < y; k += 1) keep[k * 1920 + x] = 1;
    run = 0;
  }
}
for (let y = CAGE.y0; y < CAGE.y1; y += 1) {
  let run = 0;
  for (let x = CAGE.x0; x <= CAGE.x1; x += 1) {
    if (x < CAGE.x1 && warm[y * 1920 + x]) { run += 1; continue; }
    if (run >= 60) for (let k = x - run; k < x; k += 1) keep[y * 1920 + k] = 1;
    run = 0;
  }
}
// Objects ON the counter top are under her hands by design: never masks.
const UNDER_HANDS = [[955, 368, 200, 56], [1150, 395, 95, 45]];  // ledger, queue book -- plate-02
let barPixels = 0;
for (let y = CAGE.y0; y < CAGE.y1; y += 1) {
  for (let x = CAGE.x0; x < CAGE.x1; x += 1) {
    if (!keep[y * 1920 + x]) continue;
    if (UNDER_HANDS.some(([ux, uy, uw, uh]) => x >= ux && x < ux + uw && y >= uy && y < uy + uh)) continue;
    set(x, y); barPixels += 1;
  }
}
// Dilate the bars by one pixel so their anti-aliased rims do not show her
// through them.
const copy = new Uint8Array(mask);
for (let y = CAGE.y0 + 1; y < CAGE.y1 - 1; y += 1) {
  for (let x = CAGE.x0 + 1; x < CAGE.x1 - 1; x += 1) {
    const at = (y * 1920 + x) * 4;
    if (copy[at + 3]) continue;
    if (copy[at - 4 + 3] || copy[at + 4 + 3] || copy[at - 1920 * 4 + 3] || copy[at + 1920 * 4 + 3]) set(x, y);
  }
}
const out = writePng({ width: 1920, height: 864, pixels: mask }, { alpha: true });
writeFileSync(resolve(ROOT, outPath), out);
console.log(`${outPath}: counter ${JSON.stringify(COUNTER)}, ${barPixels} bar pixel(s) found in the cage, `
  + `read from ${platePath} sha ${createHash('sha256').update(bytes).digest('hex').slice(0, 12)}`);
