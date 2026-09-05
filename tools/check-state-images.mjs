import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadContent, Report, ROOT, runCheck } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * A PICTURE THAT BELONGS TO A VISUAL STATE IS DECLARED WITH IT. Factory v2's
 * first check, and the defect it is named after is Room 5's floorboard
 * (doc 36 Q108, iteration 2): a DAY-lit board drawn over the NIGHT plate read
 * as a freshly replaced tile, because the night derivation rode a `?candidate=`
 * swap on the playtest URL and the URL without it drew the day picture. The
 * fix was `imageByState`; this is the check that the fix is complete.
 *
 * THE ROOM'S STATE SET IS DERIVED, NOT DECLARED. A room has a visual state the
 * moment anything in it answers to one: a lamp's `amountByState` (the hanging
 * work lamp's night light), a state image's `imageByState` (the board's night
 * derivation), or a `visualStates` list if a room ever declares one. Take the
 * union. A room where nothing answers to a state has no states and nothing to
 * check, and the check says so rather than passing quietly.
 *
 * THREE ASSERTIONS, per state image, per room visual state:
 *
 *   1. MISSING COMPANION. The image has no `imageByState[state]` and does not
 *      say `sameInAllStates: true`. That is the floorboard defect exactly: the
 *      day picture would draw at night. The declaration is the honest half --
 *      the hanging lamp IS one prop in every state (only its light differs),
 *      and a check that could not be told so would fail on correct work (R5j)
 *      and be switched off.
 *   2. MISMATCHED GEOMETRY. A companion whose PNG dimensions differ from the
 *      base image's. Both are drawn at the same place by the same code, so a
 *      companion a different size is a different picture in the same slot.
 *   3. A COMPANION THAT IS THE BASE FILE. `imageByState.night` naming the day
 *      file is `sameInAllStates` wearing a disguise: it passes 1 and 2 and
 *      draws the day picture at night. Say it plainly instead.
 *
 * Plus the obvious: a state with `imageByState` and no `image` has no base
 * picture; a companion file must exist (check-asset-paths walks every string
 * too, but a missing companion is this check's subject, so it names it).
 *
 * WHAT IT DOES NOT ASSERT: that the companion LOOKS like night. Doc 44's first
 * honesty. A companion that exists, fits and differs is admissible; whether
 * it is lit right is Tyler's.
 */

function dimensions(relPath) {
  const bytes = readFileSync(resolve(ROOT, relPath));
  const image = readPng(bytes);
  return [image.width, image.height];
}

/** The visual states a room answers to, from everything in it that does. */
export function roomVisualStates(room) {
  const states = new Set(room.visualStates ?? []);
  for (const lamp of room.lamps ?? []) {
    for (const name of Object.keys(lamp.amountByState ?? {})) states.add(name);
  }
  for (const target of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
    for (const shown of Object.values(target.states ?? {})) {
      for (const name of Object.keys(shown.imageByState ?? {})) states.add(name);
    }
  }
  return [...states].sort();
}

export function check(content = loadContent()) {
  const report = new Report('Every state image has a companion for every visual state its room answers to');
  let roomsWithStates = 0;
  let images = 0;
  let companions = 0;
  for (const { path, data: room } of content.rooms) {
    const states = roomVisualStates(room);
    if (states.length === 0) continue;
    roomsWithStates += 1;
    const declaredBy = [];
    for (const target of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      for (const [stateName, shown] of Object.entries(target.states ?? {})) {
        const where = `${path}: ${target.id}/${stateName}`;
        const byState = shown.imageByState ?? {};
        if (!shown.image) {
          if (Object.keys(byState).length) {
            report.fail(`${where}: has imageByState and no base image, so there is nothing to `
              + 'draw when no state is named');
          }
          continue;
        }
        images += 1;
        if (!existsSync(resolve(ROOT, shown.image))) {
          report.fail(`${where}: base image ${shown.image} does not exist`);
          continue;
        }
        const base = dimensions(shown.image);
        if (shown.sameInAllStates === true && Object.keys(byState).length) {
          report.fail(`${where}: says sameInAllStates and also declares imageByState for `
            + `${Object.keys(byState).join(', ')}. One or the other: a picture is the same `
            + 'in every state or it has companions.');
        }
        for (const visual of states) {
          const companion = byState[visual];
          if (companion === undefined) {
            if (shown.sameInAllStates === true) continue;
            report.fail(`${where}: ${shown.image} has no imageByState.${visual} and does not `
              + `say sameInAllStates. Under the room's "${visual}" state the base picture `
              + 'would draw over the state\'s plate -- the floorboard defect (doc 36 Q108). '
              + 'Declare the companion, or declare that this picture is one prop in every state.');
            continue;
          }
          companions += 1;
          if (companion === shown.image) {
            report.fail(`${where}: imageByState.${visual} names the base image itself. That `
              + 'is sameInAllStates in disguise; say it plainly so the next reader knows it '
              + 'was decided.');
            continue;
          }
          if (!existsSync(resolve(ROOT, companion))) {
            report.fail(`${where}: imageByState.${visual} names ${companion}, which does not exist`);
            continue;
          }
          const size = dimensions(companion);
          if (size[0] !== base[0] || size[1] !== base[1]) {
            report.fail(`${where}: imageByState.${visual} is ${size[0]}x${size[1]} and the base `
              + `image is ${base[0]}x${base[1]}. Both draw in the same slot; a companion a `
              + 'different size is a different picture, not a relight.');
          }
        }
        for (const named of Object.keys(byState)) {
          if (!states.includes(named)) {
            report.fail(`${where}: imageByState names "${named}", which nothing in the room `
              + 'answers to -- impossible by construction, so the state set derivation is wrong');
          }
        }
        if (shown.sameInAllStates === true) declaredBy.push(`${target.id}/${stateName}`);
      }
    }
    report.note(`${room.id}: visual state(s) ${states.join(', ')}`
      + (declaredBy.length ? `; same in every state by declaration: ${declaredBy.join(', ')}` : ''));
  }
  if (roomsWithStates === 0) {
    report.note('no room answers to a visual state, so nothing was asserted');
  } else {
    report.note(`${roomsWithStates} room(s) with visual states: ${images} state image(s), `
      + `${companions} companion(s) checked for presence, identity and geometry`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
