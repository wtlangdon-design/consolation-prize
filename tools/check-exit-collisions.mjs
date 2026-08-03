import { readJson, Report } from './lib/content.mjs';

/**
 * Nothing a player can click is hidden behind something else, an exit that
 * starts a scripted departure shares its rectangle with nothing, and an exit
 * gated on a flag has a writer that exists.
 *
 * THE FIRST VERSION OF THIS CHECK FAILED SEVENTEEN TIMES ON A CORRECT TREE.
 * It called any overlap between an exit and a hotspot a defect. It is not:
 * `GameState.targets` is `[...exits, ...hotspots]` deliberately -- its own
 * comment says "scenery first made every exit in the room unclickable" -- so
 * a door drawn on the front of a building is SUPPOSED to sit inside
 * `false_fronts`, and the boardwalk and the mud run the full width of Room 2
 * under everything. Overlap is the design. A check that fails on the design
 * teaches people to ignore it, which is worse than not having it.
 *
 * WHAT IS ACTUALLY WRONG is one of two things:
 *
 * (1) A target with NO PIXELS LEFT. Measured by subtracting every
 *     simultaneously-live target that answers before it, not by counting
 *     overlaps. A hotspot half-covered by a door is still clickable on its
 *     other half; a hotspot entirely inside one is not there at all.
 *
 * (2) ANY overlap at all where the exit declares `travelWhenTold`. That exit
 *     does not walk anywhere -- it writes a flag and hands the beat a cue --
 *     so a click that lands on it by accident does not take a wrong door, it
 *     begins the game's closing shot. It is the one target where "the other
 *     one is still mostly clickable" is not a defence.
 *
 * THE DEFECT THAT SHIPPED was (2). Room 1's west exit was moved to the gap in
 * the fence and its rect landed on THE WATCHMAN'S LAMP. `targetAt` returns the
 * first match and exits are first, so examining the watchman started the
 * ending. Nothing static could see it, because both rects were individually
 * correct; the gauntlet found it, and only because the harness needs the same
 * click a player does -- its lamp click wrote no flag and the beat waiting on
 * that flag held to its deadline.
 *
 * GATES ARE PART OF IT. `lamp` and `lamp_gone` share a rect exactly -- ruling
 * 19a's pattern, "a state change is two targets over the same rect with
 * opposite gates" -- and are never live together, so they are not a collision.
 * Two targets collide only if some flag assignment satisfies both.
 *
 * THE THIRD CLAUSE IS THE OTHER HALF OF Q63. The only way out of Room 1 is
 * now gated on having spoken to Hob. If the thing that writes that flag ever
 * stops writing it, the game is unfinishable from its first room -- and
 * `pending` exists precisely to let a gate name a writer that is not built
 * yet, which is the right answer for a hotspot and a catastrophe for a door.
 *
 * WHAT IT DOES NOT CHECK: whether a rect sits on the thing it names. A
 * hotspot 200px from the object it describes passes every clause here. That
 * is a picture question and it belongs to a person looking at an overlay.
 */

/** Every rect a target can hit-test as. `targetAt` reads per-state bounds. */
function presentations(target) {
  const out = [{ state: null, rect: target.rect }];
  for (const [state, shown] of Object.entries(target.states ?? {})) {
    if (shown?.bounds) out.push({ state, rect: shown.bounds });
  }
  return out;
}

/**
 * The region a target occupies in EVERY state -- the intersection, not the
 * union. Used for the covering side: a target that covers you in one state
 * and not another has not made you unreachable, it has made you conditional,
 * and conditional is what `when` is for.
 */
function alwaysOccupies(target) {
  let rect = target.rect;
  for (const { rect: other } of presentations(target)) {
    const x = Math.max(rect[0], other[0]);
    const y = Math.max(rect[1], other[1]);
    const w = Math.min(rect[0] + rect[2], other[0] + other[2]) - x;
    const h = Math.min(rect[1] + rect[3], other[1] + other[3]) - y;
    if (w <= 0 || h <= 0) return null;
    rect = [x, y, w, h];
  }
  return rect;
}

function overlap(a, b) {
  const w = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
  const h = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
  return w > 0 && h > 0 ? [w, h] : null;
}

/** True if any flag assignment satisfies both gates at once. */
function bothCanBeLive(one = {}, two = {}) {
  for (const [flag, value] of Object.entries(one)) {
    if (flag in two && two[flag] !== value) return false;
  }
  return true;
}

/**
 * Area of `subject` not covered by any of `covers`, by sweeping the distinct
 * x and y edges. Exact, and small enough to be obviously exact -- rooms hold
 * a dozen targets, so the grid is never bigger than 26x26 cells.
 */
function uncoveredArea(subject, covers) {
  const [sx, sy, sw, sh] = subject;
  const xs = [...new Set([sx, sx + sw, ...covers.flatMap((c) => [c[0], c[0] + c[2]])])]
    .filter((x) => x >= sx && x <= sx + sw).sort((a, b) => a - b);
  const ys = [...new Set([sy, sy + sh, ...covers.flatMap((c) => [c[1], c[1] + c[3]])])]
    .filter((y) => y >= sy && y <= sy + sh).sort((a, b) => a - b);
  let area = 0;
  for (let i = 0; i < xs.length - 1; i += 1) {
    for (let j = 0; j < ys.length - 1; j += 1) {
      const cell = [xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j]];
      if (cell[2] <= 0 || cell[3] <= 0) continue;
      if (!covers.some((c) => overlap(cell, c))) area += cell[2] * cell[3];
    }
  }
  return area;
}

export function check() {
  const report = new Report('Nothing clickable is fully hidden, and no departure shares a rect');
  const manifest = readJson('content/manifest.json');
  const flags = new Map(readJson(manifest.flags).flags.map((flag) => [flag.id, flag]));
  let checked = 0;
  let gated = 0;
  let departures = 0;

  for (const path of manifest.rooms) {
    const room = readJson(path);
    // The engine's own order, from `GameState.targets`. Exits answer first.
    const order = [...(room.exits ?? []), ...(room.hotspots ?? [])];

    order.forEach((target, index) => {
      const earlier = order.slice(0, index)
        .filter((other) => bothCanBeLive(target.when, other.when))
        .map(alwaysOccupies)
        .filter(Boolean);

      for (const { state, rect } of presentations(target)) {
        checked += 1;
        if (uncoveredArea(rect, earlier) > 0) continue;
        const named = state ? `"${target.id}" in state "${state}"` : `"${target.id}"`;
        report.fail(`${room.id}: ${named} has no clickable pixels left. Every part of `
          + `${rect.join(',')} is covered by targets that answer before it, and `
          + '`targetAt` returns the first match, so it can never be reached');
      }
    });

    for (const exit of room.exits ?? []) {
      if (exit.travelWhenTold) {
        departures += 1;
        for (const other of order) {
          if (other === exit) continue;
          if (!bothCanBeLive(exit.when, other.when)) continue;
          const hit = overlap(exit.rect, other.rect);
          if (!hit) continue;
          report.fail(`${room.id}: exit "${exit.id}" declares travelWhenTold and overlaps `
            + `"${other.id}" by ${hit[0]}x${hit[1]}px while both can be live. That exit does not `
            + 'take a door, it starts a scripted departure -- a click meant for the other one '
            + 'begins it');
        }
      }

      // An exit's gate must be openable, and by something that exists.
      for (const [flag, wanted] of Object.entries(exit.when ?? {})) {
        gated += 1;
        const declared = flags.get(flag);
        if (!declared) {
          report.fail(`${room.id}: exit "${exit.id}" is gated on undeclared flag "${flag}"`);
          continue;
        }
        if (wanted === declared.initial) continue;
        const writers = declared.writtenBy ?? [];
        const built = writers.filter((who) => !who.startsWith('unbuilt:'));
        if (declared.pending || built.length === 0) {
          report.fail(`${room.id}: exit "${exit.id}" is gated on "${flag}" and nothing BUILT `
            + `writes it (${writers.join(', ') || 'no writer declared'}). An unopenable exit is a `
            + 'room nobody can leave; `pending` is fine for a hotspot and fatal for a door');
        }
      }
    }
  }
  report.note(`${checked} target presentation(s) checked for total occlusion, `
    + `${departures} travelWhenTold exit(s) for any overlap, ${gated} exit gate(s) for a writer`);
  return report;
}
