import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

import { ROOT } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { writePng } from '../lib/pngwrite.mjs';
import { CROP, deriveFixedRoomPlate, FIXED_ROOM, RESAMPLER, SOURCE_SIZE } from './derive.mjs';

/**
 * THE DRY RUN. Errata 63's transform, proven without generating Room 5.
 *
 * Everything here runs against a DISPOSABLE FIXTURE built in this file plus
 * whatever is already staged. Nothing is generated, no API call is made, no
 * shipping file is touched, and the scratch directory is destroyed at the end.
 *
 * What it proves, in order: the writer and reader agree; the transform lands
 * on exactly 1920x864; it is deterministic across runs; the crop takes the
 * region it says; the derivation refuses a source of the wrong size; the
 * provenance fragment carries both hashes and the algorithm; and no approved
 * asset changed while it ran.
 */

const SCRATCH = 'art/staging/derive-dryrun';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const say = (line) => process.stdout.write(`${line}\n`);

let failures = 0;
function check(claim, ok, detail = '') {
  say(`   ${ok ? 'ok  ' : 'FAIL'}  ${claim}${detail ? ` -- ${detail}` : ''}`);
  if (!ok) failures += 1;
}

/**
 * A fixture with structure a resample can be judged on, not a flat fill.
 *
 * A flat colour survives any filter, including a broken one, so it proves
 * nothing. This has a one-pixel grid, a diagonal and a smooth gradient: the
 * grid shows ringing, the diagonal shows stair-stepping, and the gradient
 * shows banding. It also carries four corner markers INSIDE the crop
 * rectangle and four outside it, which is how the crop is verified to have
 * taken the region it claims.
 */
function fixture() {
  const { width, height } = SOURCE_SIZE;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const grid = (x % 16 === 0 || y % 16 === 0) ? 60 : 0;
      const diagonal = Math.abs(((x + y) % 128) - 64) < 3 ? 70 : 0;
      pixels[at] = Math.min(255, Math.round((x / width) * 200) + grid);
      pixels[at + 1] = Math.min(255, Math.round((y / height) * 200) + diagonal);
      pixels[at + 2] = Math.min(255, 40 + grid + diagonal);
      pixels[at + 3] = 255;
    }
  }
  const mark = (x, y, r, g, b) => {
    for (let dy = 0; dy < 8; dy += 1) {
      for (let dx = 0; dx < 8; dx += 1) {
        const at = ((y + dy) * width + (x + dx)) * 4;
        pixels[at] = r; pixels[at + 1] = g; pixels[at + 2] = b; pixels[at + 3] = 255;
      }
    }
  };
  // Inside the crop, at its four corners.
  mark(CROP.x, CROP.y, 255, 0, 0);
  mark(CROP.x + CROP.width - 8, CROP.y, 0, 255, 0);
  mark(CROP.x, CROP.y + CROP.height - 8, 0, 0, 255);
  mark(CROP.x + CROP.width - 8, CROP.y + CROP.height - 8, 255, 255, 0);
  // Outside it -- these must NOT survive the crop.
  mark(0, 0, 255, 0, 255);
  mark(width - 8, height - 8, 0, 255, 255);
  return { width, height, pixels };
}

function corner(image, x, y) {
  const at = (y * image.width + x) * 4;
  return [image.pixels[at], image.pixels[at + 1], image.pixels[at + 2]];
}

function approvedArt() {
  const out = new Map();
  for (const line of execSync('git ls-files art/backgrounds art/foregrounds art/masks art/ui',
    { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean)) {
    out.set(line, sha(readFileSync(resolve(ROOT, line))));
  }
  return out;
}

const before = approvedArt();
say(`\nERRATA 63 SOURCE-ACQUISITION DRY RUN -- no generation, no API call\n`);
say(`transform: ${SOURCE_SIZE.width}x${SOURCE_SIZE.height} -> crop `
  + `${CROP.x},${CROP.y} ${CROP.width}x${CROP.height} -> ${FIXED_ROOM.width}x${FIXED_ROOM.height}`);
say(`resampler: ${RESAMPLER}\n`);

mkdirSync(resolve(ROOT, SCRATCH), { recursive: true });
let record = null;
try {
  // ---- 1 · the writer and the reader agree -------------------------------
  say('1 · the PNG writer round-trips through the project\'s reader');
  const source = fixture();
  const sourcePath = `${SCRATCH}/fixture-source.png`;
  writeFileSync(resolve(ROOT, sourcePath), writePng(source, { alpha: false }));
  const reread = readPng(readFileSync(resolve(ROOT, sourcePath)));
  check('dimensions survive', reread.width === source.width && reread.height === source.height,
    `${reread.width}x${reread.height}`);
  let same = true;
  for (let at = 0; at < source.pixels.length; at += 4) {
    if (reread.pixels[at] !== source.pixels[at]
      || reread.pixels[at + 1] !== source.pixels[at + 1]
      || reread.pixels[at + 2] !== source.pixels[at + 2]) { same = false; break; }
  }
  check('every RGB byte survives', same);

  // ---- 2 · the transform lands on exactly the shipping size --------------
  say('\n2 · the derivation lands on exactly 1920x864');
  const derivedPath = `${SCRATCH}/fixture-derived.png`;
  record = deriveFixedRoomPlate({ source: sourcePath, out: derivedPath });
  const derived = readPng(readFileSync(resolve(ROOT, derivedPath)));
  check('width is exactly 1920', derived.width === FIXED_ROOM.width, String(derived.width));
  check('height is exactly 864', derived.height === FIXED_ROOM.height, String(derived.height));
  check('the source is preserved untouched',
    sha(readFileSync(resolve(ROOT, sourcePath))) === record.source.hash);

  // ---- 3 · determinism ----------------------------------------------------
  say('\n3 · determinism');
  const againPath = `${SCRATCH}/fixture-derived-again.png`;
  const again = deriveFixedRoomPlate({ source: sourcePath, out: againPath });
  check('a second run produces the identical file',
    again.derived.hash === record.derived.hash, record.derived.hash.slice(0, 16));

  // ---- 4 · the crop took the region it claims -----------------------------
  say('\n4 · the crop took the region it names');
  const scale = FIXED_ROOM.width / CROP.width;
  const inset = Math.round(4 * scale);
  const marks = [
    ['top-left red', corner(derived, inset, inset), [255, 0, 0]],
    ['top-right green', corner(derived, derived.width - 1 - inset, inset), [0, 255, 0]],
    ['bottom-left blue', corner(derived, inset, derived.height - 1 - inset), [0, 0, 255]],
    ['bottom-right yellow',
      corner(derived, derived.width - 1 - inset, derived.height - 1 - inset), [255, 255, 0]],
  ];
  for (const [name, got, want] of marks) {
    const near = got.every((value, index) => Math.abs(value - want[index]) <= 24);
    check(`${name} marker is at the derived corner`, near, `rgb(${got.join(',')})`);
  }
  // The magenta and cyan markers sat outside the crop and must be gone.
  let strays = 0;
  for (let at = 0; at < derived.pixels.length; at += 4) {
    const [r, g, b] = [derived.pixels[at], derived.pixels[at + 1], derived.pixels[at + 2]];
    if (r > 220 && g < 40 && b > 220) strays += 1;
    if (r < 40 && g > 220 && b > 220) strays += 1;
  }
  check('nothing outside the crop rectangle survived', strays === 0, `${strays} stray pixel(s)`);

  // ---- 5 · it refuses a source of the wrong size --------------------------
  say('\n5 · it refuses rather than adapting');
  const wrongPath = `${SCRATCH}/fixture-wrong-size.png`;
  writeFileSync(resolve(ROOT, wrongPath), writePng({
    width: 1024, height: 1024, pixels: new Uint8Array(1024 * 1024 * 4).fill(200),
  }, { alpha: false }));
  let refused = null;
  try { deriveFixedRoomPlate({ source: wrongPath, out: `${SCRATCH}/never.png` }); }
  catch (error) { refused = error.message; }
  check('a 1024x1024 source is refused, not cropped anyway', refused !== null,
    refused ? refused.slice(0, 72) : 'IT PROCEEDED');
  check('and it wrote nothing', !existsSync(resolve(ROOT, `${SCRATCH}/never.png`)));

  // ---- 6 · the same transform on a real staged API image ------------------
  say('\n6 · against a real staged image, if one is present');
  const staged = 'art/staging/smoke/edit-01.png';
  if (existsSync(resolve(ROOT, staged))) {
    const image = readPng(readFileSync(resolve(ROOT, staged)));
    check(`${staged} is ${image.width}x${image.height}, which is NOT the 1536x1024 this `
      + 'transform takes', image.width !== SOURCE_SIZE.width);
    let refusedStaged = null;
    try { deriveFixedRoomPlate({ source: staged, out: `${SCRATCH}/staged.png` }); }
    catch (error) { refusedStaged = error.message; }
    check('so it is refused, which is the correct answer', refusedStaged !== null);
    say('      (the smoke test generated at 1024x1024. A Room 5 source must be requested at '
      + '1536x1024 landscape -- that is the size the prompt has to ask for.)');
  } else {
    say(`      ${staged} is not present -- staged images are gitignored. Skipped.`);
  }

  // ---- 7 · provenance -----------------------------------------------------
  say('\n7 · the provenance fragment');
  check('names the source path and hash', !!record.source.path && /^[0-9a-f]{64}$/.test(record.source.hash));
  check('names the crop rectangle', record.crop.x === CROP.x && record.crop.y === CROP.y
    && record.crop.width === CROP.width && record.crop.height === CROP.height);
  check('names the exact resampling algorithm', record.resample.algorithm === RESAMPLER);
  check('names the derived path and hash', !!record.derived.path && /^[0-9a-f]{64}$/.test(record.derived.hash));
  check('records that it is provisional', record.provisional === true);
  check('lists what the derivation may not do',
    record.resample.forbidden.includes('nearest-neighbour')
    && record.resample.forbidden.includes('ai-upscale')
    && record.resample.forbidden.includes('sharpen'));
} finally {
  // ---- 8 · nothing approved moved, and the scratch is destroyed -----------
  const after = approvedArt();
  let changed = 0;
  for (const [path, hash] of before) if (after.get(path) !== hash) { changed += 1; say(`   CHANGED ${path}`); }
  for (const path of after.keys()) if (!before.has(path)) { changed += 1; say(`   NEW ${path}`); }
  say(`\n8 · approved art: ${before.size} file(s) hashed before and after, ${changed} changed`);
  if (changed !== 0) failures += 1;
  rmSync(resolve(ROOT, SCRATCH), { recursive: true, force: true });
  say(`   scratch ${SCRATCH} destroyed`);
}

if (record) {
  say(`\nderived ${record.derived.width}x${record.derived.height} `
    + `sha ${record.derived.hash.slice(0, 12)} from source sha ${record.source.hash.slice(0, 12)}`);
}
say(failures === 0
  ? '\nDRY RUN PASSED. The transform is implemented and proven. NO ROOM 5 ART WAS GENERATED.'
  : `\nDRY RUN FAILED: ${failures} check(s).`);
process.exit(failures === 0 ? 0 : 1);
