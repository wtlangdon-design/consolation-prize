/**
 * THE ROUTE EXECUTOR: the vocabulary `tools/gauntlet/routes/*.json` was already
 * written in, finally given something that runs it.
 *
 * `routes/main-street.json` has existed, complete and authored by hand, with
 * nothing in the repository able to read it. `contact-sheet.mjs` says in its
 * own header that "the next increment is a ROUTE per room" and then waits for
 * whatever room the game hands it, which is Room 1 -- so every later room's
 * contact sheet was a picture of the first one. R5l: a fully specified thing
 * with no reader.
 *
 * WHY A ROUTE IS NOT A GAUNTLET SCRIPT, and why this is a separate file from
 * `run.mjs`. A script ASSERTS what a sequence does: every mark in it is a
 * number a person wrote down and the whole value is in the comparison. A route
 * only GETS SOMEWHERE. It asserts nothing about what it passes through, and
 * that is deliberate -- doc 44's third honesty is that a green run against a
 * wrong script defends the wrong script on every push, and a route that
 * started asserting would become a second script nobody had reviewed.
 *
 * WAITS ARE CONDITIONS, NOT DURATIONS, as the route file's own note says: the
 * first draft was timed in seconds and was stale before it ran twice, because
 * the reading-hold retune (errata 61) lengthened the opening by a fifth and
 * every action after the driver's tree missed.
 *
 * AIM COMES FROM THE CONTENT, NEVER FROM THE RUNNING GAME -- R5k and R5i. A
 * click on `case_mud` reads the rect out of the room's JSON, which is a hand
 * finding the case by looking at it. Asking the engine where its case is would
 * click exactly where the engine believes it to be and pass however wrong that
 * belief was.
 */
import { readJson, roomWidth } from '../lib/content.mjs';

const NATIVE = { width: 1920, height: 1080 };
const PLAY = { width: 1920, height: 864 };

/** Room id -> its content file, built from the manifest rather than guessed. */
function roomFiles() {
  const manifest = readJson('content/manifest.json');
  const out = new Map();
  for (const path of manifest.rooms) {
    const data = readJson(path);
    out.set(data.id, data);
  }
  return out;
}

/**
 * Where a target's rect sits, in the room's own coordinates.
 *
 * A target with STATES has a rect per state (ruling 19a's paired gates), and
 * this takes the first that has one rather than trying to work out which state
 * is live. That is honest for aim -- if the click lands on nothing the route
 * fails loudly at its next `waitFor`, which is a real disagreement worth
 * having -- and it would be dishonest for an assertion, which is why routes
 * make none.
 */
export function targetRect(room, id) {
  const all = [...(room.exits ?? []), ...(room.hotspots ?? [])];
  const found = all.find((one) => one.id === id);
  // AN AMBIENT CHARACTER IS A TARGET. The runtime's own hit test for one is
  // a box around the feet as wide as a fifth of the drawn height each way
  // (Ambient.ts NPC_HALF_WIDTH), and the click a person makes is on the
  // body; aim at the box's middle. Room 5's Winnie is the first ambient a
  // route has needed to talk to.
  if (!found && (room.ambient ?? []).includes(id)) {
    const npc = readJson(`content/ambient/${id.replace(/_/g, '-')}.json`);
    const height = npc.sprite?.frames?.[0]?.[3] ?? 240;
    const half = Math.round(height * 0.2);
    return [npc.x - half, npc.y - height, half * 2, height];
  }
  if (!found) {
    throw new Error(`route: ${room.id} has no target "${id}". It has: `
      + all.map((one) => one.id).join(', '));
  }
  if (found.rect) return found.rect;
  const state = (found.states ?? []).find((one) => one.rect);
  if (state) return state.rect;
  throw new Error(`route: ${room.id}/${id} declares no rect in any state`);
}

/** The verb grid cell for a verb id, from the panel and verb content files. */
export function verbRect(verbId) {
  const verbs = readJson('content/ui/verbs.json');
  const panel = readJson('content/ui/panel.json');
  const verb = verbs.verbs.find((one) => one.id === verbId);
  if (!verb) {
    throw new Error(`route: no verb "${verbId}". Declared: `
      + verbs.verbs.map((one) => one.id).join(', '));
  }
  const { cols, rows, width, height } = panel.verbs;
  return {
    x: cols[verb.col] ?? cols[0],
    y: rows[verb.row] ?? rows[0],
    width,
    height,
  };
}

/** Where a native point lands on the letterboxed canvas. */
async function toScreen(page, x, y) {
  return page.evaluate(([nx, ny, w, h]) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(box.width / w, box.height / h);
    return {
      x: box.left + (box.width - w * scale) / 2 + nx * scale,
      y: box.top + (box.height - h * scale) / 2 + ny * scale,
    };
  }, [x, y, NATIVE.width, NATIVE.height]);
}

/**
 * A click in PLAY-AREA coordinates, converted through the camera.
 *
 * THE CAMERA IS THE PART THAT BITES ON A WIDE ROOM. Main Street is 3700 across
 * with the view following, so a hotspot at world x2900 is not at screen x2900
 * and is very often not on screen at all. The route asks the probe where the
 * camera is, walks the actor into range if it must, and only then clicks.
 */
async function clickWorld(page, wx, wy) {
  const cameraX = await page.evaluate(() => window.__gauntlet?.probe()?.camera ?? 0);
  const point = await toScreen(page, wx - cameraX, wy);
  if (!point) throw new Error('route: no canvas to click on');
  await page.mouse.click(point.x, point.y);
}

async function clickScreen(page, x, y) {
  const point = await toScreen(page, x, y);
  if (!point) throw new Error('route: no canvas to click on');
  await page.mouse.click(point.x, point.y);
}

const probe = (page) => page.evaluate(() => window.__gauntlet?.probe() ?? null);

/**
 * Waits for a CONDITION, and says what it saw when it gives up.
 *
 * A TIMEOUT REPORTS THE STATE, NOT JUST THE DEADLINE. "waitFor room=main_street
 * timed out after 60s" sends whoever reads it back to the browser; "...still in
 * stage_road, control none, beat 3, no dialogue" is most of a diagnosis.
 */
async function waitFor(page, want, upTo, why) {
  const deadline = Date.now() + upTo * 1000;
  let last = null;
  for (;;) {
    last = await probe(page);
    if (last) {
      if (want.room !== undefined && last.room === want.room) return last;
      if (want.control !== undefined && last.control === want.control) return last;
      if (want.dialogue === true && last.options > 0 && !last.performing) return last;
      if (want.handedOver === true && last.handedOver) return last;
      if (want.flag !== undefined && last.flags.includes(want.flag)) return last;
      // A LINE BY A SPEAKER IS UP. `says` is the probe's speaker id, never the
      // words. A capture that wants to land INSIDE a reading hold waits on
      // this instead of guessing seconds, which the first life route did and
      // missed the hold twice.
      if (want.says !== undefined && last.says === want.says) return last;
    }
    if (Date.now() > deadline) {
      const saw = last
        ? `room ${last.room}, control ${last.control}, beat ${last.beat ?? '-'}, `
          + `${last.options} option(s)${last.performing ? ', performing' : ''}, `
          + `handedOver ${last.handedOver}`
        : 'the probe answered nothing at all -- the scene never came up';
      throw new Error(`route: waitFor ${JSON.stringify(want)} timed out after ${upTo}s`
        + `${why ? ` (${why})` : ''}. It saw: ${saw}`);
    }
    await page.waitForTimeout(120);
  }
}

/** Flushes queued lines, so a click meant for an option is not eaten by one. */
async function flush(page) {
  for (let guard = 0; guard < 20; guard += 1) {
    const state = await probe(page);
    if (!state || state.pending === 0) return;
    await clickScreen(page, NATIVE.width / 2, PLAY.height / 2);
    await page.waitForTimeout(140);
  }
}

/** Waits out a performing exchange rather than clicking through it. */
async function settle(page, upTo = 60) {
  const deadline = Date.now() + upTo * 1000;
  for (;;) {
    const state = await probe(page);
    if (!state?.performing) return;
    if (Date.now() > deadline) throw new Error(`route: an exchange has been performing for ${upTo}s`);
    await page.waitForTimeout(120);
  }
}

/**
 * Runs a route. Returns the log of what it did, for the proof manifest.
 *
 * EVERY ACTION IS LOGGED WITH WHAT IT SAW. A proof whose route "worked" and
 * cannot say what it clicked is a proof that cannot be re-derived, and the
 * first question about any surprising panel is which of these steps went
 * somewhere unexpected.
 */
export async function runRoute(page, route) {
  const rooms = roomFiles();
  const log = [];
  for (const [index, action] of route.actions.entries()) {
    const where = `action ${index + 1} (${action.do})`;
    try {
      if (action.do === 'wait') {
        await page.waitForTimeout(action.seconds * 1000);
        log.push(`${where}: waited ${action.seconds}s`);
        continue;
      }
      if (action.do === 'waitFor') {
        const seen = await waitFor(page, action, action.upTo ?? 60, action.why);
        log.push(`${where}: reached ${JSON.stringify(
          Object.fromEntries(Object.entries(action)
            .filter(([key]) => ['room', 'control', 'dialogue', 'handedOver', 'flag', 'says'].includes(key))),
        )} in room ${seen.room}`);
        continue;
      }
      if (action.do === 'click') {
        await flush(page);
        if (action.at) {
          await clickScreen(page, action.at[0], action.at[1]);
          log.push(`${where}: clicked screen ${action.at.join(',')} -- ${action.why ?? ''}`);
        } else {
          const state = await probe(page);
          const room = rooms.get(state?.room);
          if (!room) throw new Error(`the game is in room "${state?.room}", which no manifest `
            + 'entry names, so a target id cannot be resolved against it');
          const [x, y, w, h] = targetRect(room, action.on);
          const width = roomWidth(room);
          if (x + w / 2 > width) throw new Error(`${action.on}'s rect centre is outside the `
            + `room's own ${width}px width`);
          await clickWorld(page, x + w / 2, y + h / 2);
          log.push(`${where}: clicked ${state.room}/${action.on} at world `
            + `${Math.round(x + w / 2)},${Math.round(y + h / 2)} -- ${action.why ?? ''}`);
        }
        continue;
      }
      if (action.do === 'verb') {
        const rect = verbRect(action.verb);
        await clickScreen(page, rect.x + rect.width / 2, rect.y + rect.height / 2);
        log.push(`${where}: chose verb ${action.verb} -- ${action.why ?? ''}`);
        continue;
      }
      if (action.do === 'option') {
        await flush(page);
        await settle(page);
        // BY ID WHERE THE ROUTE GIVES ONE, and the id is why the route survives
        // a list that changes shape. The stage driver's exit is gated on the
        // other three having been asked, so his list is three rows and then
        // four; an index means a different question before and after, and a
        // text match would put dialogue in this file.
        const row = await page.evaluate((wanted) => {
          for (let index = 1; index <= 12; index += 1) {
            const found = window.__gauntlet?.optionRow(index);
            if (!found) continue;
            if (typeof wanted === 'number' ? index === wanted : found.id === wanted) return found;
          }
          return null;
        }, action.option);
        if (!row) {
          const state = await probe(page);
          throw new Error(`option "${action.option}" is not on the list. `
            + `${state?.options ?? 0} option(s) are offered`
            + `${state?.performing ? ' but an exchange is performing' : ''}. A gated option `
            + 'needs the ones that open it asked first, and the route\'s order is load-bearing.');
        }
        await clickScreen(page, NATIVE.width / 2, row.y + row.height / 2);
        log.push(`${where}: chose option ${row.id} -- ${action.why ?? ''}`);
        continue;
      }
      throw new Error(`unknown route action "${action.do}"`);
    } catch (error) {
      // THE LOG TRAVELS WITH THE FAILURE. A route that dies at action 11 and
      // reports only action 11 makes whoever reads it replay the first ten in
      // their head.
      error.routeLog = log;
      throw error;
    }
  }
  return log;
}
