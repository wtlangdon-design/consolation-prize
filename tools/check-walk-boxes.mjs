import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Errata 28a and 28b, checked as geometry rather than as intent.
 *
 * Four things go wrong with authored walk boxes and none of them are visible
 * in the JSON:
 *
 *   a box that names a neighbour that does not exist;
 *   adjacency declared one way round only, so routing works east but not west;
 *   a box unreachable from the room's own entrances;
 *   a walkTo point or staging mark that is not on any box.
 *
 * And errata 28b's rule that EVERY object declares a defaultVerb, which is an
 * authoring decision per object and therefore exactly the kind of thing that
 * gets missed on the fortieth one.
 */
function boxContains(box, x, y) {
  let positive = false;
  let negative = false;
  for (let index = 0; index < box.points.length; index += 1) {
    const a = box.points[index];
    const b = box.points[(index + 1) % box.points.length];
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross > 0) positive = true;
    if (cross < 0) negative = true;
    if (positive && negative) return false;
  }
  return true;
}

export function check() {
  const report = new Report('Walk boxes route, and every object declares a default verb');
  const content = loadContent();
  const verbIds = new Set([
    ...content.verbs.verbs.map((verb) => verb.id),
    content.verbs.walkVerb.id,
  ]);

  let boxed = 0;
  let objects = 0;
  let staged = 0;

  for (const { path, data } of content.rooms) {
    for (const target of [...(data.hotspots ?? []), ...(data.exits ?? [])]) {
      objects += 1;
      const verb = target.defaultVerb;
      if (!verb) {
        report.fail(`${data.id}/${target.id} (${path}): no defaultVerb -- errata 28b`);
      } else if (!verbIds.has(verb)) {
        report.fail(`${data.id}/${target.id}: defaultVerb "${verb}" is not a declared verb`);
      }
    }

    const boxes = data.walkBoxes;
    if (!boxes) continue;
    boxed += 1;
    const byId = new Map(boxes.map((box) => [box.id, box]));

    for (const box of boxes) {
      if (box.points.length !== 4) {
        report.fail(`${data.id}/${box.id}: ${box.points.length} points -- boxes are quads`);
      }
      for (const neighbour of box.neighbours) {
        const other = byId.get(neighbour);
        if (!other) {
          report.fail(`${data.id}/${box.id}: neighbour "${neighbour}" does not exist`);
          continue;
        }
        // One-way adjacency is the bug that makes routing work in one
        // direction and silently strand the actor in the other.
        if (!other.neighbours.includes(box.id)) {
          report.fail(`${data.id}/${box.id} -> ${neighbour} is one-way; `
            + `${neighbour} does not name ${box.id} back`);
        }
      }
    }

    // Every box reachable from every other. A room whose floor is in two
    // disconnected halves is a room the player can walk into and not out of.
    const first = boxes[0];
    const seen = new Set([first.id]);
    const queue = [first.id];
    while (queue.length > 0) {
      for (const next of byId.get(queue.shift()).neighbours) {
        if (!seen.has(next) && byId.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    for (const box of boxes) {
      if (!seen.has(box.id)) {
        report.fail(`${data.id}/${box.id} is not reachable from ${first.id}`);
      }
    }

    const onFloor = (x, y) => boxes.some((box) => boxContains(box, x, y));
    for (const target of [...(data.hotspots ?? []), ...(data.exits ?? [])]) {
      if (!target.walkTo) continue;
      staged += 1;
      const { x, y, facing } = target.walkTo;
      if (!onFloor(x, y)) {
        report.fail(`${data.id}/${target.id}: walkTo ${x},${y} is not on any walk box`);
      }
      if (!facing) {
        report.fail(`${data.id}/${target.id}: walkTo has no facing -- doc 22 section 6 `
          + 'wants the object to know which way the actor looks');
      }
    }
    for (const mark of data.staging ?? []) {
      if (!onFloor(mark.at[0], mark.at[1])) {
        report.fail(`${data.id}: staging mark ${mark.id} is not on any walk box`);
      }
    }
    for (const entrance of data.entrances ?? []) {
      if (entrance.at && !onFloor(entrance.at[0], entrance.at[1])) {
        report.fail(`${data.id}: arrival from ${entrance.from} is not on any walk box`);
      }
    }
  }

  report.note(`${objects} object(s) carry a default verb; ${staged} declare a staging point`);
  report.note(`${boxed} room(s) converted to walk boxes; `
    + `${content.rooms.length - boxed} still on the zone model -- ruling 22 step 2`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
