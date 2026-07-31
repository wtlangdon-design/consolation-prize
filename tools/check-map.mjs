import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Room 0's rules, from doc 20 and errata 30c.
 *
 * The map is the one screen in the game that is a menu, and the ways it can
 * go wrong are all quiet ones: a label that has drifted from the room it
 * names, a destination that is not a room, a first state that is empty
 * because every location turned out to be gated on something.
 *
 * THE FLOOR OF TWO is the one worth having a script for. Errata 30c amends
 * doc 20 rule 3 -- seeing counts, not just hearing -- precisely because a
 * player can take the driver's EXIT option immediately, hear nothing, and
 * open a map with nothing on it. That failure only appears on one path
 * through the opening, which is exactly the kind nobody finds by playing.
 */
export function check() {
  const report = new Report('The town map resolves, and is never empty (doc 20, errata 30c)');
  const content = loadContent();
  const rooms = new Map(content.rooms.map(({ data }) => [data.id, data]));
  const maps = content.rooms.filter(({ data }) => data.kind === 'map');

  if (maps.length === 0) {
    report.note('no map room in the manifest -- doc 20 room 0 is not built');
    return report;
  }
  if (maps.length > 1) report.fail(`${maps.length} rooms declare kind: map; doc 20 has one`);

  for (const { path, data } of maps) {
    const locations = data.locations ?? [];
    if (locations.length === 0) report.fail(`${path}: a map with no locations is a blank screen`);

    // Errata 30c's floor. A location with no `when` is on the map from the
    // first opening; there must be at least two of them.
    const ungated = locations.filter((location) => !location.when);
    if (ungated.length < 2) {
      report.fail(`${path}: ${ungated.length} ungated location(s) -- errata 30c sets the `
        + 'first state at a minimum of two, never zero');
    }

    const seen = new Set();
    for (const location of locations) {
      const where = `${path}: ${location.id}`;
      if (seen.has(location.id)) report.fail(`${where}: duplicated`);
      seen.add(location.id);

      if (!Array.isArray(location.at) || location.at.length !== 2) {
        report.fail(`${where}: no marker position`);
      }

      const room = rooms.get(location.room);
      if (!room) {
        if (!location.unbuilt) {
          report.fail(`${where}: travels to "${location.room}", which is not in the manifest `
            + 'and is not marked unbuilt');
        } else if (!location.label) {
          report.fail(`${where}: unbuilt and has no label, so it would draw as its own id`);
        } else {
          report.note(`unbuilt: ${location.label} -- doc 20 room not composed yet`);
        }
        continue;
      }
      // A built room supplies its own name. A label as well is two names for
      // one place, and doc 20's whole reason for drawing labels in the engine
      // font is that a name change should not need anything redrawn.
      if (location.label) {
        report.fail(`${where}: has a label AND a built room -- the room's name governs`);
      }
    }

    // Errata 30c note: the six Main Street FACADES are entered from the
    // street and are not map entries. Doors only -- the road out to the
    // diggings is also an exit from Main Street and errata 30c puts it on the
    // map's first state, so "duplicates a Main Street exit" is too wide a
    // net. A door is an exit whose defaultVerb is OPEN, which is errata 28b's
    // own authoring rule and not a guess made here.
    const streetExits = new Set();
    for (const { data: room } of content.rooms) {
      if (room.id !== 'main_street') continue;
      for (const exit of room.exits ?? []) {
        if (exit.defaultVerb === 'OPEN') streetExits.add(exit.to);
      }
    }
    for (const location of locations) {
      if (streetExits.has(location.room) && location.room !== 'main_street') {
        report.fail(`${path}: ${location.id} is a facade Main Street already opens onto `
          + '-- errata 30c: the six facades are not map entries');
      }
    }

    for (const pending of data.pendingLocations ?? []) {
      report.note(`pending: ${pending.name} -- ${pending.missing.split('.')[0]}`);
    }
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
