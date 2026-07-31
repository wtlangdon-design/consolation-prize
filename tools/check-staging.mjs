import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Errata ruling 23 and doc 21 gap 7: staging marks and arrival points are
 * positions a character is PUT at, so every one of them has to be somewhere a
 * character can stand.
 *
 * A mark on a wall is invisible in the data and obvious the first time a
 * cutscene puts someone through the boardwalk. That is the whole reason
 * ruling 22 moves character placement to step 4 of composition instead of
 * discovering it later, and this is the check that makes step 4 mean
 * something.
 *
 * The rule is deliberately just "on walkable floor". Reach and legibility at
 * each mark are the legibility audit's business, not this one's -- a check
 * that tries to judge two things at once is a check nobody can read the
 * output of.
 */
function insideAnyRegion(regions, x, y) {
  return regions.some(({ rect: [rx, ry, rw, rh] }) => x >= rx && x < rx + rw && y >= ry && y < ry + rh);
}

export function check() {
  const report = new Report('Staging marks and arrival points stand on floor');
  const content = loadContent();

  let marks = 0;
  let arrivals = 0;
  let roomsWithout = 0;

  for (const { path, data } of content.rooms) {
    if (data.fixture) continue;
    const regions = data.walkable ?? [];

    const placed = (data.entrances ?? []).filter((entrance) => entrance.at);
    for (const entrance of placed) {
      arrivals += 1;
      const [x, y] = entrance.at;
      if (!insideAnyRegion(regions, x, y)) {
        report.fail(`${data.id} (${path}): arrival from ${entrance.from} at ${x},${y} is not on floor`);
      }
    }

    for (const mark of data.staging ?? []) {
      marks += 1;
      if (!Array.isArray(mark.at) || mark.at.length !== 2) {
        report.fail(`${data.id}: staging mark ${mark.id} has no position`);
        continue;
      }
      const [x, y] = mark.at;
      if (!insideAnyRegion(regions, x, y)) {
        report.fail(`${data.id}: staging mark ${mark.id} at ${x},${y} is not on floor`);
      }
    }

    // Not a failure. Ruling 23 adds the field; the thirty-nine unbuilt rooms
    // acquire marks when they are blocked out, and a room that has none yet
    // is a room that has not reached step 4 rather than a broken one.
    if ((data.staging ?? []).length === 0 && regions.length > 0) roomsWithout += 1;
  }

  report.note(`${marks} staging mark(s) and ${arrivals} placed arrival point(s) checked`);
  report.note(`${roomsWithout} room(s) with floor declare no staging marks yet -- ruling 22 step 4`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
