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
  const report = new Report('DIAGNOSTIC: sheets whose plates a person should look at');
  const content = loadContent();
  // WHY THIS IS A DIAGNOSTIC AND NOT A CHECK, and it is the sharpest case of
  // the three. Its only report.fail() fires when a file cannot be READ. The
  // condition in its own title -- a sheet baked into a plate -- is reported as
  // a NOTE, and it never compares plate pixels against sheet pixels at all.
  //
  // Proved by making the dog's declared sheet BE the Nugget's plate, which is
  // the fault in its purest form: it passed. The six bar men that prompted it
  // would not be caught by it today.
  //
  // Kept, because naming which sheets are multi-frame and which plates were
  // built from them is exactly the list somebody wants before looking. Not
  // counted, because it does not establish what it is named after. Closing
  // the gap for real means searching each plate for the sheet's SECOND frame,
  // which is a pixel search worth costing before it is written.
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
