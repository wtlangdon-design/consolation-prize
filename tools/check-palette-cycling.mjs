import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Palette cycling declarations are well formed and reserve what they claim.
 *
 * The structural half. The pixel half -- proving no reserved index is drawn
 * outside its element -- lives in tools/pixelart/cycling.py, because that is
 * where the indices still exist: by the time a background is a PNG on disk it
 * is RGB and the reservation can only be re-derived, not enforced.
 *
 * The two halves meet at one requirement checked here: a reserved index must
 * have a palette-UNIQUE colour. That is what lets the engine recover the band
 * from the exported image by scanning for its colour, and it is the only
 * reason the runtime needs no index map shipped alongside every background.
 */

const MODES = new Set(['rotate', 'pingpong', 'pulse']);
//: Doc 18 discipline rule 4. Faster reads as a glitch at 320x144.
const MAX_RATE = 4;
//: Doc 18 discipline rule 1.
const MAX_ELEMENTS = 2;

export function check() {
  // DOC 18 IS VOID IN FULL under errata 54: palette cycling needs an index
  // palette and there is not one. Every element this examines is dormant, so
  // what it validates is the shape of declarations that animate nothing.
  //
  // The structural assertions still work -- a 9 Hz rate and a band running out
  // of its family were both caught by mutation -- which is why this is kept
  // rather than deleted: the day a mechanism replaces cycling, these are the
  // rules it will want. Until then it is not an acceptance criterion, because
  // the condition it enforces is not required by anything.
  const report = new Report('DIAGNOSTIC: cycling declarations are well formed (doc 18, VOID)');
  const content = loadContent();
  const palette = content.palette;
  const duplicated = colourDuplicates(palette.colours);

  let elements = 0;
  let rooms = 0;

  for (const { data } of content.rooms) {
    const declared = data.cycling ?? [];
    if (declared.length === 0) continue;
    rooms += 1;
    elements += declared.length;

    if (declared.length > MAX_ELEMENTS) {
      report.fail(`${data.id}: ${declared.length} cycling elements, doc 18 allows ${MAX_ELEMENTS}`);
    }

    const owner = new Map();
    for (const element of declared) {
      const where = `${data.id}/${element.id}`;
      if (!MODES.has(element.mode)) {
        report.fail(`${where}: unknown mode "${element.mode}"`);
      }
      if (!(element.rate > 0 && element.rate <= MAX_RATE)) {
        report.fail(`${where}: rate ${element.rate} outside 0..${MAX_RATE} Hz`);
      }
      const family = palette.families[element.ramp.family];
      if (!family) {
        report.fail(`${where}: no palette family "${element.ramp.family}"`);
        continue;
      }
      const first = family.start + element.ramp.start;
      const last = first + element.ramp.count - 1;
      if (element.ramp.start < 0 || last >= family.start + family.count) {
        report.fail(`${where}: band ${first}..${last} runs outside ${element.ramp.family}`);
        continue;
      }
      if (element.ramp.count < 2) {
        report.fail(`${where}: a band of ${element.ramp.count} cannot cycle`);
      }
      for (let index = first; index <= last; index += 1) {
        if (owner.has(index)) {
          report.fail(`${where}: index ${index} is already reserved by ${owner.get(index)}`);
        }
        owner.set(index, where);
        // The engine finds a band in the exported image by its colour. Two
        // indices sharing a colour would make that recovery ambiguous, and it
        // would fail silently -- as a second object quietly joining the cycle.
        if (duplicated.has(palette.colours[index])) {
          report.fail(`${where}: index ${index} shares its colour with another entry, `
            + 'so the runtime cannot tell the band from what matches it');
        }
      }

      const [x, y, width, height] = element.bounds ?? [];
      if ([x, y, width, height].some((value) => typeof value !== 'number')) {
        report.fail(`${where}: no bounds, so nothing is reserved`);
      } else if (width <= 0 || height <= 0) {
        report.fail(`${where}: bounds ${element.bounds} has no area`);
      }
    }
  }

  report.note(`${elements} cycling element(s) across ${rooms} room(s)`);
  report.note('the pixel half runs at composition time -- tools/pixelart/cycling.py');
  return report;
}

function colourDuplicates(colours) {
  const seen = new Set();
  const twice = new Set();
  for (const colour of colours) {
    if (seen.has(colour)) twice.add(colour);
    seen.add(colour);
  }
  return twice;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
