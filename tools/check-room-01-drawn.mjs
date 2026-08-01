import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report } from './lib/content.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOM01 = join(ROOT, 'tools/pixelart/room01');
const SHIM = join(ROOT, 'tools/pixelart/room01_stage_road.py');

/**
 * Room 1 is DRAWN. It is not a copy of the reference with the file extension
 * changed.
 *
 * The rebuild works against two reference images, and the cheapest way to beat
 * any visual critic is to quantise the reference into the locked palette and
 * paste the result into a Python source file as an array of indices. It would
 * look perfect. It would also be useless: the coach has to be able to leave,
 * the lantern flame has to live in its own reserved palette band so the engine
 * can cycle it, the near plane has to draw over the actor, and every one of
 * those needs code that knows what it is drawing rather than code that knows
 * what colour pixel (214, 87) is.
 *
 * A visual critic cannot catch that, by construction -- the transcription is
 * the thing it would score highest. So it is caught here instead.
 *
 * THREE RULES.
 *
 * 1. Nothing under tools/pixelart/room01/ may read anything under reference/.
 *    Measuring the reference while authoring is encouraged; reaching for it at
 *    compose time is the asset smuggling itself in through the back door.
 *
 * 2. No module may carry a bulk literal big enough to be pixels. The frame is
 *    320x144 = 46,080 pixels, and a region is a few thousand; the ceiling here
 *    is well under the smallest region so that even a corner of the picture
 *    cannot arrive pre-baked. Hand-placed sprite data is legitimate and stays
 *    legitimate -- what is banned is a blob, and a blob is what a number this
 *    size is.
 *
 * 3. No base64, and no compressed byte strings. Rule 2 counts integers, so the
 *    obvious way around it is to stop writing integers.
 *
 * 4. NO GLYPHS. Signage is blank geometry; the engine renders sign text in the
 *    game font at runtime. buildings.py::signboard has said so since long
 *    before this rebuild, and every other sign in every other room obeys it.
 *
 *    This one needs a check rather than a comment, because the pressure to
 *    break it is structural and permanent. The reference image is 34x our
 *    resolution, so its board is legibly lettered; ours cannot be, at a 3.45
 *    pixel pitch. A blind critic shown both will prefer the reference's board
 *    every round for ever, and it will be right about the picture and wrong
 *    about the game -- painting the word in fixes the crop and ships a second,
 *    frozen copy of a string that lives in content. It was drawn in for four
 *    rounds on exactly that pressure.
 */

//: Largest run of comma-separated numeric literals any single expression may
//: hold. A palette ramp is a handful; a measured table of horse-leg offsets is
//: a few dozen; the smallest region of the frame is 1,900 pixels.
const LITERAL_CEILING = 600;

const FORBIDDEN_READS = [
  /reference\s*\//,
  /image-[AB]-/,
  /image-B-in-locked-palette/,
];

//: Glyph tables, however they are spelled. The lettering that had to come out
//: was a dict of six-row binary masks keyed by capital letter, which is what
//: anybody would reach for next time.
const FORBIDDEN_GLYPHS = [
  { pattern: /\bGLYPHS?\b\s*[:=]/, why: 'a glyph table' },
  { pattern: /\bLETTERS?\b\s*[:=]/, why: 'a letter table' },
  { pattern: /["']([A-Z])["']\s*:\s*\(\s*0b/, why: 'letterform bitmasks' },
  { pattern: /\bALPHABET\b/, why: 'an alphabet' },
];

const FORBIDDEN_ENCODINGS = [
  { pattern: /\bbase64\b/i, why: 'base64 data' },
  { pattern: /\bzlib\b|\bbz2\b|\blzma\b|\bgzip\b/i, why: 'a compressed blob' },
  { pattern: /Image\.open\s*\(/, why: 'reading an image at compose time' },
];

function pythonFiles() {
  const found = [];
  const walk = (directory) => {
    let entries;
    try {
      entries = readdirSync(directory);
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        if (entry !== '__pycache__') walk(path);
      } else if (entry.endsWith('.py')) {
        found.push(path);
      }
    }
  };
  walk(ROOM01);
  try {
    if (statSync(SHIM).isFile()) found.push(SHIM);
  } catch {
    /* the shim is allowed not to exist yet */
  }
  return found;
}

/** Longest run of numeric literals separated only by commas and whitespace. */
function longestNumericRun(source) {
  let longest = 0;
  const runs = source.matchAll(/(?:-?\d+(?:\.\d+)?\s*,\s*){20,}-?\d+(?:\.\d+)?/g);
  for (const [run] of runs) {
    const count = run.split(',').length;
    if (count > longest) longest = count;
  }
  return longest;
}

export function check() {
  const report = new Report('Room 1 is drawn, not transcribed');
  const files = pythonFiles();

  if (files.length === 0) {
    report.note('no Room 1 compositor yet -- nothing to check');
    return report;
  }

  for (const path of files) {
    const shown = relative(ROOT, path);
    const source = readFileSync(path, 'utf8');
    // Comments and docstrings talk ABOUT the reference constantly, and should:
    // that is where the measurements are recorded. Only code is checked.
    const code = source
      .replace(/"""[\s\S]*?"""/g, '')
      .replace(/'''[\s\S]*?'''/g, '')
      .replace(/^\s*#.*$/gm, '');

    for (const pattern of FORBIDDEN_READS) {
      if (pattern.test(code)) {
        report.fail(`${shown} reaches for the reference at compose time (${pattern})`);
      }
    }
    for (const { pattern, why } of FORBIDDEN_ENCODINGS) {
      if (pattern.test(code)) {
        report.fail(`${shown} contains ${why}`);
      }
    }

    for (const { pattern, why } of FORBIDDEN_GLYPHS) {
      if (pattern.test(code)) {
        report.fail(
          `${shown} contains ${why} -- signage is blank geometry, and the engine ` +
            'renders sign text in the game font at runtime',
        );
      }
    }

    const run = longestNumericRun(code);
    if (run > LITERAL_CEILING) {
      report.fail(
        `${shown} has a literal run of ${run} numbers (ceiling ${LITERAL_CEILING}) -- ` +
          'that is pixel data, not a drawing',
      );
    }
  }

  report.note(`${files.length} Room 1 module(s) checked`);
  return report;
}
