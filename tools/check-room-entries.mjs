import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Doc 20 rule 1: every room has a stated route in. A room with no entry is a
 * build failure, not an oversight.
 *
 * Nothing graphed the rooms until doc 20 -- doc 02 graphs the PUZZLES, which
 * is a different graph and it does not notice a room nobody can walk into.
 * That is how Room 7 came to be wired with five hotspots and no door: doc 05
 * scripts it in full and no document says which room it opens off, and there
 * was no check that would have said so.
 *
 * A route may be stated two ways:
 *
 *   AN EXIT. Some other room has an exit whose `to` is this room. The normal
 *   case and the strongest one, because it is the same declaration the engine
 *   walks the player through.
 *
 *   AN `entrances` DECLARATION. Doc 20 reaches thirteen rooms through the
 *   town map, which is a screen rather than a doorway, so those rooms carry
 *   the route themselves. Its `from` may name a room that does not exist yet
 *   -- the map is unbuilt -- and that is REPORTED, not failed. The rule is
 *   that the route is stated, and it is.
 *
 * The start room is entered by starting.
 */
export function check() {
  const report = new Report('Every room has a stated route in (doc 20 rule 1)');
  const content = loadContent();

  const known = new Set(content.rooms.map(({ data }) => data.id));
  const reachedByExit = new Map();
  for (const { data } of content.rooms) {
    for (const exit of data.exits ?? []) {
      if (!exit.to) continue;
      if (!reachedByExit.has(exit.to)) reachedByExit.set(exit.to, []);
      reachedByExit.get(exit.to).push(`${data.id}/${exit.id}`);
    }
  }

  const pending = [];
  let byExit = 0;
  let byDeclaration = 0;
  let fixtures = 0;

  for (const { path, data } of content.rooms) {
    // Fixtures are engine test rooms, not places. They are counted rather
    // than skipped silently, because "excluded from a reachability check" is
    // exactly the sort of exemption that should be visible.
    if (data.fixture) {
      fixtures += 1;
      continue;
    }
    if (data.id === content.manifest.startRoom) continue;

    if (reachedByExit.has(data.id)) {
      byExit += 1;
      continue;
    }

    const declared = data.entrances ?? [];
    if (declared.length === 0) {
      report.fail(`${data.id} (${path}): no room exits to it and it declares no entrance`);
      continue;
    }
    byDeclaration += 1;
    for (const entrance of declared) {
      if (!entrance.from) {
        report.fail(`${data.id}: an entrance with no "from" states nothing`);
      } else if (!known.has(entrance.from)) {
        pending.push(`${data.id} <- ${entrance.from} (${entrance.note ?? 'not built yet'})`);
      }
    }
  }

  // The other direction, cheap and worth having: an exit that names a room
  // the manifest does not carry is a route to nowhere. check-content-schema
  // catches it too; catching it here as well means this check's own map of
  // the world is sound rather than assumed.
  for (const [target, sources] of reachedByExit) {
    if (!known.has(target)) {
      report.fail(`exits ${sources.join(', ')} lead to unknown room "${target}"`);
    }
  }

  // COMING BACK THROUGH THE DOOR YOU LEFT BY. A room with several doors that
  // you return to from one of its own doors must say where that door's
  // arrival is; otherwise the engine uses `default`, which is one place for
  // every door, and you come out of the Company's door at the far end of the
  // street. Main Street named that arrival `from: "company"` while the room
  // was `company_lobby` (Room 10, 2026-11-02), and nothing failed: the
  // arrival simply never matched.
  const byId = new Map(content.rooms.map(({ data }) => [data.id, data]));
  let returns = 0;
  for (const { data: room } of content.rooms) {
    if (room.fixture) continue;
    const doors = (room.exits ?? []).filter((exit) => exit.to && byId.has(exit.to));
    if (doors.length < 2) continue;
    const arrivals = new Set((room.entrances ?? []).map((one) => one.from));
    for (const door of doors) {
      const back = (byId.get(door.to).exits ?? []).some((exit) => exit.to === room.id);
      if (!back) continue;
      returns += 1;
      if (!arrivals.has(door.to)) {
        report.fail(`${room.id}: you can come back from ${door.to} (through ${door.id}), and no entrance `
          + `says where -- add { "from": "${door.to}" } at ${door.id}, or you arrive at its default`);
      }
    }
  }
  report.note(`${returns} way(s) back into a room of several doors, each with its own arrival`);

  report.note(`${byExit} room(s) entered through an exit, `
    + `${byDeclaration} through a declared entrance, 1 by starting there`);
  if (fixtures > 0) report.note(`${fixtures} engine fixture room(s) excluded -- not places`);
  for (const line of pending) {
    report.note(`  route stated to a room that does not exist yet: ${line}`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
