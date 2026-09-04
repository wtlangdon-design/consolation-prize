import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { writePng } from '../lib/pngwrite.mjs';
import { CROP, deriveFixedRoomPlate, FIXED_ROOM, SOURCE_SIZE } from './derive.mjs';

/**
 * SAFE-FRAME VALIDATION. Tyler's ruling 22, for the Room 5 pilot.
 *
 * The fixed crop must not silently turn a badly framed source into an
 * apparently valid plate. For every background source this writes three
 * things a person can look at side by side:
 *
 *   1. the complete 1536x1024 source, untouched;
 *   2. the same source with the exact production crop drawn on it;
 *   3. the resulting 1920x864 candidate.
 *
 * And it records, per required element, whether the element's authored
 * bounds fall inside the crop. The elements and their bounds are READ FROM A
 * FILE the person wrote after looking at the source -- this tool cannot see
 * what a window is. What it can do is refuse to let a rectangle somebody
 * measured be quietly cut in half.
 *
 *   node tools/art/safe-frame.mjs <source.png> <elements.json> <out dir>
 *
 * elements.json: { "elements": { "<name>": [x, y, w, h], ... } } in SOURCE
 * pixels. An element is CLIPPED if any part of its box lies outside the
 * crop; the report says how much and marks the candidate SAFE-FRAME FAILURE
 * when a required element loses more than `tolerance` (default 0.12) of its
 * area.
 */

const [, , source, elementsPath, outDir, tolArg] = process.argv;
if (!source || !elementsPath || !outDir) {
  console.error('usage: safe-frame.mjs <source.png> <elements.json> <out dir> [tolerance]');
  process.exit(2);
}
const tolerance = tolArg ? Number(tolArg) : 0.12;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
mkdirSync(resolve(ROOT, outDir), { recursive: true });

const sourceBytes = readFileSync(resolve(ROOT, source));
const image = readPng(sourceBytes);
if (image.width !== SOURCE_SIZE.width || image.height !== SOURCE_SIZE.height) {
  console.error(`${source} is ${image.width}x${image.height}, not ${SOURCE_SIZE.width}x${SOURCE_SIZE.height}`);
  process.exit(1);
}

// ---- 2 · the crop rectangle, drawn on a copy ---------------------------------
const overlay = { width: image.width, height: image.height, pixels: new Uint8Array(image.pixels) };
const darken = (x, y) => {
  const at = (y * overlay.width + x) * 4;
  overlay.pixels[at] = overlay.pixels[at] >> 2;
  overlay.pixels[at + 1] = overlay.pixels[at + 1] >> 2;
  overlay.pixels[at + 2] = overlay.pixels[at + 2] >> 2;
};
const line = (x, y) => {
  const at = (y * overlay.width + x) * 4;
  overlay.pixels[at] = 255; overlay.pixels[at + 1] = 40; overlay.pixels[at + 2] = 40;
};
for (let y = 0; y < overlay.height; y += 1) {
  for (let x = 0; x < overlay.width; x += 1) {
    const inside = x >= CROP.x && x < CROP.x + CROP.width && y >= CROP.y && y < CROP.y + CROP.height;
    if (!inside) darken(x, y);
  }
}
for (let x = CROP.x; x < CROP.x + CROP.width; x += 1) {
  for (let t = 0; t < 3; t += 1) { line(x, CROP.y + t); line(x, CROP.y + CROP.height - 1 - t); }
}
for (let y = CROP.y; y < CROP.y + CROP.height; y += 1) {
  for (let t = 0; t < 3; t += 1) { line(CROP.x + t, y); line(CROP.x + CROP.width - 1 - t, y); }
}
const overlayPath = `${outDir}/crop-overlay.png`;
writeFileSync(resolve(ROOT, overlayPath), writePng(overlay, { alpha: false }));

// ---- 3 · the derived candidate ---------------------------------------------------
const derivedPath = `${outDir}/candidate-1920x864.png`;
const derivation = deriveFixedRoomPlate({ source, out: derivedPath });

// ---- the element audit -------------------------------------------------------
const elements = JSON.parse(readFileSync(resolve(ROOT, elementsPath), 'utf8'));
const rows = [];
let failed = false;
for (const [name, box] of Object.entries(elements.elements ?? {})) {
  const [x, y, w, h] = box;
  const ix0 = Math.max(x, CROP.x), iy0 = Math.max(y, CROP.y);
  const ix1 = Math.min(x + w, CROP.x + CROP.width), iy1 = Math.min(y + h, CROP.y + CROP.height);
  const kept = Math.max(0, ix1 - ix0) * Math.max(0, iy1 - iy0);
  const lost = 1 - kept / (w * h);
  const required = elements.required?.includes(name) ?? true;
  const verdict = lost === 0 ? 'inside' : lost <= tolerance ? `edge-clipped ${(lost * 100).toFixed(0)}%`
    : `CLIPPED ${(lost * 100).toFixed(0)}%`;
  if (required && lost > tolerance) failed = true;
  rows.push({ name, box, required, lost: Number(lost.toFixed(3)), verdict });
}

const report = {
  schema: 1,
  note: 'SAFE-FRAME DIAGNOSTIC. Element boxes were authored by a person looking at the source; '
    + 'this tool only measures them against the fixed crop. It does not see the picture.',
  source: { path: source, hash: sha(sourceBytes), width: image.width, height: image.height },
  crop: CROP,
  candidate: { path: derivedPath, hash: derivation.derived.hash, width: FIXED_ROOM.width, height: FIXED_ROOM.height },
  overlay: overlayPath,
  tolerance,
  elements: rows,
  verdict: failed ? 'SAFE-FRAME FAILURE' : 'SAFE',
  derivation,
  at: new Date().toISOString(),
};
writeFileSync(resolve(ROOT, `${outDir}/safe-frame.json`), `${JSON.stringify(report, null, 1)}\n`);
for (const row of rows) {
  console.log(`  ${row.required ? 'REQ ' : 'opt '} ${row.name.padEnd(22)} ${row.verdict}`);
}
console.log(`\n${report.verdict}  source ${report.source.hash.slice(0, 12)} -> candidate ${report.candidate.hash.slice(0, 12)}`);
console.log(`overlay ${overlayPath}\ncandidate ${derivedPath}\nreport ${outDir}/safe-frame.json`);
process.exit(failed ? 1 : 0);
