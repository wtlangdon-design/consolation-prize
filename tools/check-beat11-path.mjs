import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Report, ROOT, readJson } from './lib/content.mjs';

/**
 * Beat 11's traced path is a path a man could walk.
 *
 *     node tools/check-beat11-path.mjs
 *
 * NOT IN run-all.mjs, AND THAT IS THE POINT OF THIS PARAGRAPH RATHER THAN AN
 * OMISSION. There is no path yet. A check that passes because its subject does
 * not exist reports the same green as a check that passed on real work, which
 * is R5l wearing a check's clothes: everything looks finished and the only
 * thing missing is the thing it was built to judge. It goes into the suite in
 * the same change that commits a path, and until then it is run by hand and
 * says out loud that it found nothing.
 *
 * WHAT IT KNOWS THAT THE BROWSER TOOL CANNOT. `tools/beat11/trace-path.html`
 * has to run from file:// on a Chromebook, where fetching JSON is blocked, so
 * its walkable band is a copied constant. This reads `content/rooms` and is
 * therefore the authority on whether the first step lands on ground -- if the
 * two ever disagree, this one is right and the copy is stale (R5k).
 */
const PATH_FILE = 'content/sequences/beat11-path.json';
const ROOM_FILE = 'content/rooms/stage-road.json';

// The handoff, from the legibility ladder: the height at which the eight-frame
// back walk drops from five distinct pictures to four. Doc 36 Q86.
const HANDOFF = 22;

/** Is (x, y) inside any of the room's walk boxes? */
function standable(room, x, y) {
  for (const box of room.walkBoxes ?? []) {
    const pts = box.points ?? [];
    if (pts.length < 3) continue;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      const a = pts[i], b = pts[j];
      if ((a.y > y) !== (b.y > y)
        && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    if (inside) return box.id ?? true;
  }
  return null;
}

export function check() {
  const report = new Report('Beat 11\'s path recedes, starts on ground, and hands off');
  const full = resolve(ROOT, PATH_FILE);
  if (!existsSync(full)) {
    report.note(`${PATH_FILE} does not exist yet, so NOTHING WAS CHECKED. Trace one with `
      + 'tools/beat11/trace-path.html, commit it, and register this check in run-all.mjs '
      + 'in the same change');
    return report;
  }

  let path;
  try {
    path = JSON.parse(readFileSync(full, 'utf8'));
  } catch (error) {
    report.fail(`${PATH_FILE} is not readable JSON -- ${error.message}`);
    return report;
  }
  const room = readJson(ROOM_FILE);
  const [playW, playH] = path.playArea ?? [1920, 864];
  const points = path.waypoints ?? [];

  if (points.length < 2) {
    report.fail(`${PATH_FILE} has ${points.length} waypoint(s); a path needs at least two`);
    return report;
  }
  if (!(path.beatSeconds > 0)) {
    report.fail(`beatSeconds is ${path.beatSeconds}. It sets the rate of the walk AND the `
      + 'length of the title, so it cannot be absent or zero');
  }

  points.forEach((p, i) => {
    if (p.x < 0 || p.x > playW || p.y < 0 || p.y > playH) {
      report.fail(`waypoint ${i} at ${p.x},${p.y} is outside the ${playW}x${playH} play area`);
    }
    if (!(p.figureHeight > 0)) {
      report.fail(`waypoint ${i} has figureHeight ${p.figureHeight}`);
      return;
    }
    // STRICTLY DECREASING. He is walking away for the whole beat; a height that
    // holds or rises anywhere is a stretch of path where he stops receding, and
    // it reads as him stopping.
    if (i > 0 && p.figureHeight >= points[i - 1].figureHeight) {
      report.fail(`waypoint ${i} is ${p.figureHeight}px against waypoint ${i - 1}'s `
        + `${points[i - 1].figureHeight}px. Height must strictly decrease`);
    }
  });

  const first = points[0];
  const box = standable(room, first.x, first.y);
  if (!box) {
    report.fail(`the first waypoint ${first.x},${first.y} is in no walk box of `
      + `${room.id ?? ROOM_FILE}. He has to start from ground he can stand on`);
  } else {
    report.note(`first waypoint ${first.x},${first.y} stands in walk box ${box}`);
  }

  // THE HANDOFF IS AN INDEX INTO THIS PATH, and it has to agree with the
  // heights beside it rather than being a number somebody typed once (R5k).
  const expected = points.findIndex((p) => p.figureHeight < HANDOFF);
  const declared = path.farClipHandoff;
  if (declared === undefined || declared === null) {
    report.fail(`farClipHandoff is absent. It is ${expected} for these heights `
      + `(-1 would mean he never drops below ${HANDOFF}px)`);
  } else if (declared !== expected) {
    report.fail(`farClipHandoff says ${declared} but the first waypoint below `
      + `${HANDOFF}px is ${expected}. The blob would take over in the wrong place`);
  } else if (declared >= 0) {
    report.note(`farClipHandoff ${declared}: waypoint ${declared} is `
      + `${points[declared].figureHeight}px, the first below ${HANDOFF}`);
  } else {
    report.note(`farClipHandoff -1: no waypoint drops below ${HANDOFF}px, so the derived `
      + 'blob never takes over and thad-farwalk-back is unused by this path');
  }

  report.note(`${points.length} waypoint(s), ${points[0].figureHeight}px down to `
    + `${points[points.length - 1].figureHeight}px over ${path.beatSeconds}s`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { runCheck } = await import('./lib/content.mjs');
  process.exit(runCheck(check()) ? 0 : 1);
}
