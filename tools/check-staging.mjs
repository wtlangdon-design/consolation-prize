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

function insideAnyBox(boxes, x, y) {
  return boxes.some((box) => {
    const xs = box.points.map((point) => point.x);
    const ys = box.points.map((point) => point.y);
    return x >= Math.min(...xs) && x <= Math.max(...xs)
      && y >= Math.min(...ys) && y <= Math.max(...ys);
  });
}

/**
 * THE FLOOR IS THE BOXES WHERE A ROOM HAS THEM, and the bands only where it
 * does not. Errata 28a item 1: `walkBoxes` REPLACE `walkable`, and this check
 * was reading the bands in every room -- so a point on Main Street's
 * BOARDWALK, which is a walk box and not a band, was reported as off the
 * floor. Found by Phase 1.5I, when the Nugget's arrival moved onto the
 * boardwalk because the ground in front of its door is behind a hitching rail.
 * The bands are also the PRE-CARVE floor, which means this check could not see
 * an obstacle at all: a mark inside the water trough passed.
 */
function onFloor(room, x, y) {
  const boxes = room.walkBoxes ?? [];
  if (boxes.length) return insideAnyBox(boxes, x, y);
  return insideAnyRegion(room.walkable ?? [], x, y);
}

export function check() {
  const report = new Report('Staging marks and arrival points stand on floor');
  const content = loadContent();

  let marks = 0;
  let arrivals = 0;
  let roomsWithout = 0;

  for (const { path, data } of content.rooms) {
    if (data.fixture) continue;

    const placed = (data.entrances ?? []).filter((entrance) => entrance.at);
    for (const entrance of placed) {
      arrivals += 1;
      const [x, y] = entrance.at;
      if (!onFloor(data, x, y)) {
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
      if (!onFloor(data, x, y)) {
        report.fail(`${data.id}: staging mark ${mark.id} at ${x},${y} is not on floor`);
      }
    }

    // Not a failure. Ruling 23 adds the field; the thirty-nine unbuilt rooms
    // acquire marks when they are blocked out, and a room that has none yet
    // is a room that has not reached step 4 rather than a broken one.
    const floor = (data.walkBoxes ?? []).length + (data.walkable ?? []).length;
    if ((data.staging ?? []).length === 0 && floor > 0) roomsWithout += 1;
  }

  report.note(`${marks} staging mark(s) and ${arrivals} placed arrival point(s) checked`);
  report.note(`${roomsWithout} room(s) with floor declare no staging marks yet -- ruling 22 step 4`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
