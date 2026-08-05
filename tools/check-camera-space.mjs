import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Report } from './lib/content.mjs';

/**
 * A HOTSPOT MUST BE CLICKABLE WHERE IT IS DRAWN.
 *
 * The renderer shifts the whole world pass by `-cameraX` in one place, so
 * every world drawing is already correct and none of them can forget. The hit
 * test has no such single place: it is a pointer handler that consults the
 * panel, the inventory and the map in SCREEN coordinates and then the street
 * in WORLD ones, and the two spaces differ by exactly the camera.
 *
 * WHEN IT GOES WRONG IT DOES NOT LOOK LIKE A CAMERA BUG. In Room 1 -- and in
 * every room that fits the window -- the camera is zero and the two spaces are
 * identical, so a screen x handed to a world hit test is correct in eleven
 * rooms out of twelve and every existing test stays green. On Main Street the
 * names in the sentence line drift sideways from the things they name, the
 * trough answers to a click on the boardwalk, and the report that comes back
 * is "the hotspot rects are wrong" -- filed as a content bug, against an
 * annotation that is right.
 *
 * So the rule is a NAME, and this checks it:
 *
 *   a world x is called `wx`, and it comes from `state.toWorld(...)`
 *
 * Every call to a world-space hit test must be handed one. The check is
 * deliberately about the identifier rather than about the arithmetic: a sixth
 * call site added next year is caught by the same rule that caught the first
 * five, and the fix is legible from the failure alone.
 *
 * WHY NOT A TYPE. A branded `WorldX` would let the compiler say it, and it was
 * the first plan. It brands nothing in the tests -- every authored coordinate
 * in `/content` is already a world coordinate -- so it spreads casts through
 * the suite, and a cast is how a brand gets defeated without anybody noticing.
 * A name that is checked cannot be cast away.
 */

/**
 * The functions that take a point in the ROOM.
 *
 * All three are asked "what is at this point" about the composed street: the
 * hotspot roster, the ambient cast standing in front of it, and the walkable
 * band under both. None of them has ever heard of the window.
 */
const WORLD_TAKERS = ['targetAt', 'npcAt', 'walkPlayer'];

/** The one legal source of a world x, and the name it must be given. */
const WORLD_NAME = 'wx';
const CONVERSION = /\btoWorld\s*\(/;

function sources(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (path.endsWith('.ts')) out.push(path);
  }
  return out;
}

export function check() {
  const report = new Report('A hotspot is clickable where it is drawn');
  let calls = 0;

  for (const file of sources('engine')) {
    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, index) => {
      for (const taker of WORLD_TAKERS) {
        // The declaration, not a call: `walkPlayer(x: number, ...)`.
        if (new RegExp(`\\b${taker}\\s*\\([a-z]+\\s*:`).test(line)) continue;
        const call = new RegExp(`\\.${taker}\\s*\\(\\s*([A-Za-z_$][\\w$]*)`).exec(line);
        if (!call) continue;
        calls += 1;
        if (call[1] === WORLD_NAME) continue;
        report.fail(
          `${file}:${index + 1}: ${taker}() takes a point in the ROOM and was handed `
          + `\`${call[1]}\`, which is a point in the window. `
          + `Convert it: \`const ${WORLD_NAME} = this.state.toWorld(${call[1]});\``,
        );
      }
    });

    // The name has to mean what it says. A `wx` bound from anything but the
    // conversion satisfies the rule above while doing nothing, which is worse
    // than failing it -- the check would then be the thing agreeing with itself.
    lines.forEach((line, index) => {
      const bound = new RegExp(`\\b(?:const|let|var)\\s+${WORLD_NAME}\\b\\s*=\\s*(.*)$`).exec(line);
      if (!bound || CONVERSION.test(bound[1])) return;
      report.fail(
        `${file}:${index + 1}: \`${WORLD_NAME}\` is the name for a world x and must come `
        + 'from `toWorld(...)`. Naming a screen x `wx` passes every other rule here.',
      );
    });
  }

  // AND THE CONVERSION MUST EXIST, or the rule is satisfied by a codebase that
  // deleted it. `toWorld` is the single place the two spaces meet; if it goes,
  // the camera has been reverted and this check should go with it -- loudly,
  // rather than passing in silence on a codebase it no longer describes.
  const state = readFileSync('engine/core/GameState.ts', 'utf8');
  if (!/\btoWorld\s*\(\s*screenX/.test(state)) {
    report.fail(
      'engine/core/GameState.ts has no `toWorld(screenX)`. The screen-to-world '
      + 'conversion this check enforces the use of does not exist.',
    );
  }

  report.note(`${calls} world hit test(s) across engine/, each handed a \`${WORLD_NAME}\``);
  return report;
}
