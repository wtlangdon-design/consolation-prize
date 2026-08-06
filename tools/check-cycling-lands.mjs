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
 */
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

    const present = new Set();
    for (let at = 0; at < png.pixels.length; at += 4) {
      present.add(`${png.pixels[at]},${png.pixels[at + 1]},${png.pixels[at + 2]}`);
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
      const found = wanted.filter((hex) => hex && present.has(rgb(hex).join(',')));
      if (found.length === 0) {
        report.fail(`${room.id}/${element.id}: none of its ${wanted.length} band colours appear in `
          + `${room.background}. Errata 54's plates are graded full RGB, so index recovery finds `
          + 'nothing and the element does not animate. Either the plate carries the reserved '
          + 'colours or the element should not be declared.');
      } else {
        landed += 1;
      }
    }
  }

  report.note(`${landed} of ${declared} declared cycling element(s) find their pixels`);
  return report;
}
