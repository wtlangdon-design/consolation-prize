/**
 * A DECLARED CYCLING ELEMENT FINDS ITS PIXELS IN ITS OWN PLATE.
 *
 * CyclingBackground recovers palette indices by matching exact band colours in
 * the background image, and says why that is exact: "the pipeline stores
 * indices and colour resolves at export... the reservation rule makes the
 * recovery exact." That was true when plates were exported from the locked
 * 256-colour palette.
 *
 * ERRATA 54 RETIRED THE LOCKED PALETTE. Every shipping plate is now a
 * generated image, graded to Room 1's levels and shadow-lifted, and contains
 * no exact palette colour anywhere. Room 1 still DECLARES hobs_lamp and
 * puddles; both find zero pixels and have been doing nothing since.
 *
 * Nothing failed, because a scan that finds nothing looks exactly like a scan
 * of a room with nothing to cycle. This check is the difference.
 *
 * IT SCANS THE ELEMENT'S OWN BOUNDS, AND THE FIRST VERSION DID NOT.
 *
 * It scanned the WHOLE PLATE for the band colours and passed if any of them
 * appeared anywhere. Measured on the one live subject: `stage_road/puddles`
 * declares bounds [0,96,320,48] and its three band colours appear in
 * room-01-stage-road.png exactly ONCE -- a single pixel of `#31396d` at
 * (891,408), in the sky, five hundred rows above the road and outside its own
 * rectangle entirely. The check reported "1 of 1 declared cycling element(s)
 * find their pixels" and went green on it.
 *
 * Two mutations proved it: moving `puddles`' bounds to a 1x1 box in the corner
 * and then off the plate altogether both left the check passing. An assertion
 * that a declared region can be moved anywhere without changing the answer is
 * not an assertion about that region.
 *
 * AND THE BOUNDS THEMSELVES ARE 320x144 COORDINATES. Errata 54 multiplied the
 * play area by six and this declaration was never migrated, so the rectangle
 * it names is the top-left twelfth of a 1920x864 plate. That is recorded
 * rather than fixed here: errata 54 voids Room 1's cycling declarations
 * outright, so the honest state of `puddles` is `dormant`, which is what it
 * now carries -- and a migrated rectangle for a mechanism that no longer
 * exists would be a tidier way of pretending it does.
 *
 * A FLOOR, NOT A SINGLE PIXEL. One matching pixel inside a region is a
 * coincidence at 8-bit precision across a graded plate; a band that is
 * genuinely reserved covers a shape.
 */

/**
 * Pixels of a band colour needed inside the bounds before the element counts
 * as landed. Chosen against the measurement above rather than as a round
 * number: the accidental match was ONE pixel, and the smallest thing doc 18
 * ever asked to cycle -- Hob's flame at [80,76,16,16] in the old space -- is
 * 256 pixels of which the flame is most.
 */
const MINIMUM = 16;
import { readFileSync } from 'node:fs';

import { Report, loadContent, readJson } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

const rgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16));
};

export function check() {
  const report = new Report('Every declared cycling element finds its pixels');
  const content = loadContent();
  const palette = readJson('art/palette/consolation-256.json');
  let declared = 0;
  let landed = 0;

  for (const { data: room } of content.rooms) {
    const elements = room.cycling ?? [];
    if (!elements.length || !room.background) continue;
    // LOUD, NOT SILENT. The first version of this check wrote
    // `catch { continue }` here, and readPng could not open an RGB plate, so
    // every room was skipped and the check reported "0 of 0 elements" and
    // passed. A check that cannot read its input must say so.
    let png;
    try {
      png = readPng(readFileSync(room.background));
    } catch (error) {
      report.fail(`${room.id}: cannot read ${room.background} -- ${error.message}`);
      continue;
    }


    for (const element of elements) {
      // A DORMANT ELEMENT IS DECLARED, KNOWN NOT TO RUN, AND SAID SO IN THE
      // CONTENT. That is a different thing from one that silently does
      // nothing, which is what this check exists to catch -- so it is
      // reported by name and does not fail the build.
      if (element.dormant) {
        report.note(`${room.id}/${element.id} is dormant: declared, known not to animate`);
        continue;
      }
      declared += 1;
      const family = palette.families[element.ramp.family];
      if (!family) {
        report.fail(`${room.id}/${element.id} names no such family: ${element.ramp.family}`);
        continue;
      }
      const first = family.start + element.ramp.start;
      const wanted = [];
      for (let index = first; index < first + element.ramp.count; index += 1) {
        wanted.push(palette.colours[index]);
      }
      // WITHIN THE DECLARED RECTANGLE, CLIPPED TO THE PLATE. A band that
      // reserves a region and finds its colours somewhere else entirely has
      // not found its pixels; it has found a coincidence.
      const [bx, by, bw, bh] = element.bounds ?? [0, 0, png.width, png.height];
      const left = Math.max(0, bx);
      const top = Math.max(0, by);
      const right = Math.min(png.width, bx + bw);
      const bottom = Math.min(png.height, by + bh);
      if (right <= left || bottom <= top) {
        report.fail(`${room.id}/${element.id}: its bounds ${element.bounds?.join(',')} do not `
          + `overlap ${room.background} (${png.width}x${png.height}) at all, so the region it `
          + 'reserves contains no pixels of that plate.');
        continue;
      }
      let hits = 0;
      for (const hex of wanted) {
        if (!hex) continue;
        const [r, g, b] = rgb(hex);
        for (let y = top; y < bottom && hits < MINIMUM; y += 1) {
          for (let x = left; x < right; x += 1) {
            const at = (y * png.width + x) * 4;
            if (png.pixels[at] === r && png.pixels[at + 1] === g && png.pixels[at + 2] === b) {
              hits += 1;
              if (hits >= MINIMUM) break;
            }
          }
        }
      }
      if (hits < MINIMUM) {
        report.fail(`${room.id}/${element.id}: ${hits} pixel(s) of its ${wanted.length} band `
          + `colours inside its own bounds ${element.bounds?.join(',')} in ${room.background}, `
          + `against a floor of ${MINIMUM}. Errata 54's plates are graded full RGB, so index `
          + 'recovery finds nothing and the element does not animate. Either the plate carries '
          + 'the reserved colours inside the region, or the element should not be declared.');
      } else {
        landed += 1;
      }
    }
  }

  report.note(`${landed} of ${declared} declared cycling element(s) find their pixels `
    + 'INSIDE THEIR OWN DECLARED BOUNDS');
  // A ZERO-SUBJECT GREEN SAYS SO. Every cycling element in the game is now
  // dormant -- errata 54 voided the mechanism and both of Room 1's
  // declarations with it -- so this check has nothing live left to examine
  // and passes on an empty set. That is a true report and it is not evidence
  // about anything, and the difference has to be on the page: a check that
  // passes because there is nothing to check looks identical to one that
  // passed on real work.
  if (declared === 0) {
    report.note('NO LIVE SUBJECTS. Every declared element is dormant, so this check is '
      + 'currently inert: it is not passing on evidence. It becomes live again the day '
      + 'anything declares cycling it expects to animate.');
  }
  return report;
}
