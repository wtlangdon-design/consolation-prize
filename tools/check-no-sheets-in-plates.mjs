/**
 * NO SPRITE SHEET IS BAKED INTO A PLATE.
 *
 * The Nugget's bar drinkers appeared SIX times instead of three, because the
 * plate was built by pasting `art/actors/nugget-bar-*.png` whole -- and those
 * are sheets, six frames wide from an earlier experiment. Every frame of every
 * drinker went into the background, side by side, and the room shipped with
 * twice the men it has.
 *
 * Nothing caught it: the plate is a valid PNG of the right size, the checks
 * that read it were happy, and the men are plausible-looking men. Tyler caught
 * it by looking at the room.
 *
 * This compares each actor sheet's declared frame width against the sheet's
 * own width. A sheet wider than one frame is fine -- that is what a sheet is --
 * but the plate must not contain a run of identical-width copies of one, which
 * is what baking a whole sheet produces.
 */
import { readFileSync } from 'node:fs';

import { Report, loadContent } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

export function check() {
  const report = new Report('No sprite sheet is baked into a background plate');
  const content = loadContent();
  let compared = 0;

  for (const { data: npc } of content.ambient ?? []) {
    const sprite = npc.sprite;
    if (!sprite?.sheet || !sprite.frames?.length) continue;
    const room = [...content.rooms].find(({ data }) => data.id === npc.room);
    if (!room?.data?.background) continue;

    let sheet;
    let plate;
    try {
      sheet = readPng(readFileSync(sprite.sheet));
      plate = readPng(readFileSync(room.data.background));
    } catch (error) {
      report.fail(`${npc.id}: cannot read its sheet or its plate -- ${error.message}`);
      continue;
    }
    compared += 1;

    // A frame's width, and the sheet's. If the sheet is many frames wide and
    // the plate is wide enough to hold the whole sheet where the figure sits,
    // that is the shape of the mistake -- report it as worth an eye.
    const frameWidth = sprite.frames[0][2];
    const frames = Math.round(sheet.width / (frameWidth + 2));
    if (frames > 1 && npc.x + sheet.width < plate.width) {
      report.note(`${npc.id}: ${frames}-frame sheet, ${frameWidth}px per frame -- `
        + 'a plate built from this must take one frame, not the sheet');
    }
  }

  report.note(`${compared} sheet(s) compared against the plates of their rooms`);
  return report;
}
