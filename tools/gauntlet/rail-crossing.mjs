import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { serve } from './proof.mjs';

/**
 * THE HITCHING RAIL IS A FENCE: NOBODY CROSSES IT BETWEEN ITS ENDS.
 *
 * THE DEFECT THIS EXISTS FOR. Phase 1.5G proved the rail with a scripted
 * route and start/end screenshots, and Tyler could still walk Thad through it.
 * A screenshot at each end of a walk cannot see the walk: the actor moves
 * along the waypoints the router hands him, and the question is whether that
 * POLYLINE crosses the fence, not whether the two ends look right.
 *
 * WHAT THIS DOES. Drives the live candidate like a player -- put him clearly
 * on one side, click clearly on the other at the same x -- and SAMPLES his
 * feet every 120ms for the whole walk. Then it asserts the topology:
 *
 *   while his x is inside the rail's span, his feet may never cross the
 *   barrier line; the side he is on may only change outside the span.
 *
 * The barrier is read from the room's own navigation, not restated here:
 * `navigation.barriers` in the compiled room, which the compiler writes from
 * the annotation. The record is renders/proofs/candidates/rail-crossing/
 * crossings.json, and every sampled path is drawn over the plate.
 *
 *   node tools/gauntlet/rail-crossing.mjs [--out dir]
 */
const ROOM = 'main_street_candidate';
const SETTLE = 120;
const MAX_WALK_MS = 40_000;

const flag = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);

/** The side of the barrier a point is on: -1 behind (above), +1 in front. */
function sideOf(barrier, x, y) {
  const [[x0, y0], [x1, y1]] = barrier.line;
  const at = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  return y < at ? -1 : 1;
}

/**
 * STRICTLY between the ends. Crossing AT an end is the way round the fence --
 * that is the route the barrier is there to force -- so the assertion is about
 * the ground between the ends, not the ends themselves.
 */
const insideSpan = (barrier, x) => x > barrier.span[0] && x < barrier.span[1];

async function walkTo(page, world, samples) {
  const camera = await page.evaluate(() => window.__gauntlet?.probe?.()?.camera ?? 0);
  const point = await page.evaluate(([nx, ny, w, h]) => {
    const canvas = document.querySelector('canvas');
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(box.width / w, box.height / h);
    return { x: box.left + (box.width - w * scale) / 2 + nx * scale, y: box.top + (box.height - h * scale) / 2 + ny * scale };
  }, [world[0] - camera, world[1], 1920, 1080]);
  await page.mouse.click(point.x, point.y);
  const started = Date.now();
  let still = 0;
  while (Date.now() - started < MAX_WALK_MS) {
    // eslint-disable-next-line no-await-in-loop
    const frame = await page.evaluate(() => window.__gauntlet?.probe?.());
    const thad = frame?.movers?.thad;
    if (thad?.at) samples.push({ t: Date.now() - started, x: thad.at[0], y: thad.at[1], moving: Boolean(thad.moving) });
    still = thad?.moving ? 0 : still + 1;
    // A TURN LOOKS LIKE A STOP for a couple of samples, so a walk is over
    // only after a second of it: an early break records half a path.
    if (still >= 8 && samples.length > 8) break;
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(SETTLE);
  }
  return samples[samples.length - 1];
}

async function main() {
  const outDir = flag('--out') ?? 'renders/proofs/candidates/rail-crossing';
  mkdirSync(resolve(ROOT, outDir), { recursive: true });
  const room = readJson('content/manifest.json').rooms.map((p) => readJson(p)).find((r) => r.id === ROOM);
  const barrier = (room.navigation?.barriers ?? [])[0];
  if (!barrier) {
    console.error(`${ROOM} declares no navigation barrier, so there is nothing to hold it to`);
    return 2;
  }
  const server = await serve();
  const chrome = await browser();
  const failures = [];
  const runs = [];
  const clicks = [];
  try {
    const page = await chrome.newPage();
    page.on('pageerror', (error) => failures.push(`page error: ${error.message ?? error}`));
    await page.goto(`${server.url}/?room=${encodeURIComponent(ROOM)}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));

    const [sx0, sx1] = barrier.span;
    const xs = [0.15, 0.35, 0.5, 0.65, 0.85].map((f) => Math.round(sx0 + (sx1 - sx0) * f));
    const front = (x) => [x, barrier.frontY];
    const back = (x) => [x, barrier.backY];
    for (const direction of ['front-to-back', 'back-to-front']) {
      for (const x of xs) {
        const from = direction === 'front-to-back' ? front(x) : back(x);
        const to = direction === 'front-to-back' ? back(x) : front(x);
        await walkTo(page, from, []);                       // get into position
        const samples = [];
        const landed = await walkTo(page, to, samples);
        // THE ASSERTION: the side may only change outside the rail's span.
        let crossed = null;
        for (let i = 1; i < samples.length; i += 1) {
          const a = samples[i - 1];
          const b = samples[i];
          if (sideOf(barrier, a.x, a.y) === sideOf(barrier, b.x, b.y)) continue;
          if (insideSpan(barrier, a.x) && insideSpan(barrier, b.x)) { crossed = { a, b }; break; }
        }
        const name = `${direction}-x${x}`;
        if (crossed) {
          failures.push(`${name}: crossed the rail at x ${crossed.a.x},${crossed.a.y} -> ${crossed.b.x},${crossed.b.y}, `
            + `inside the span ${sx0}-${sx1}. The fence is not a fence.`);
        }
        if (landed && sideOf(barrier, landed.x, landed.y) !== sideOf(barrier, to[0], to[1])) {
          failures.push(`${name}: asked for the ${direction.split('-to-')[1]} side and stopped on the other, at ${landed.x},${landed.y}`);
        }
        runs.push({ name, direction, x, from, to, landed, samples, crossedInsideSpan: Boolean(crossed) });
        console.log(`  ${name}: ${samples.length} sample(s), landed ${landed?.x},${landed?.y}`
          + `${crossed ? '  x CROSSED INSIDE THE SPAN' : ''}`);
      }
    }

    // DIRECT CLICKS ON THE FENCE ITSELF. Every one of these is a place a
    // player will click: the bar, the ground under it, the ground just over
    // it, and each post. None of them may take him THROUGH -- going round is
    // allowed and is the point.
    const targets = [
      { name: 'on-the-bar', at: [2440, 660] },
      { name: 'just-under-the-bar', at: [2440, 700] },
      { name: 'just-over-the-bar', at: [2440, 620] },
      { name: 'in-the-gap-beneath', at: [2440, 796] },
      { name: 'on-the-near-post', at: [2305, 700] },
      { name: 'on-the-far-post', at: [2569, 770] },
    ];
    for (const target of targets) {
      await walkTo(page, [2440, barrier.frontY], []);
      const samples = [];
      const landed = await walkTo(page, target.at, samples);
      let crossed = null;
      for (let i = 1; i < samples.length; i += 1) {
        const a = samples[i - 1];
        const b = samples[i];
        if (sideOf(barrier, a.x, a.y) === sideOf(barrier, b.x, b.y)) continue;
        if (insideSpan(barrier, a.x) && insideSpan(barrier, b.x)) { crossed = { a, b }; break; }
      }
      if (crossed) {
        failures.push(`click ${target.name}: went through the rail at x ${crossed.a.x},${crossed.a.y} -> `
          + `${crossed.b.x},${crossed.b.y}`);
      }
      const inStrip = landed && landed.x > barrier.span[0] && landed.x < barrier.span[1]
        && landed.y > barrier.strip[1] && landed.y < barrier.strip[1] + barrier.strip[3];
      if (inStrip) failures.push(`click ${target.name}: he stopped INSIDE the fence's footing, at ${landed.x},${landed.y}`);
      clicks.push({ ...target, landed, samples, crossedInsideSpan: Boolean(crossed), stoppedInStrip: Boolean(inStrip) });
      console.log(`  click ${target.name}: landed ${landed?.x},${landed?.y}`
        + `${crossed ? '  x WENT THROUGH' : ''}${inStrip ? '  x STOPPED IN THE FENCE' : ''}`);
    }
  } finally {
    await chrome.close();
    server.stop();
  }
  const record = { schema: 1, room: ROOM, barrier, at: new Date().toISOString(), runs, clicks, failures };
  writeFileSync(resolve(ROOT, `${outDir}/crossings.json`), `${JSON.stringify(record, null, 1)}\n`);
  console.log(failures.length
    ? `FAIL  ${failures.length} attempt(s) went through the rail or stopped in it`
    : `PASS  ${runs.length} crossing attempt(s) and ${clicks.length} direct click(s), none through the rail`);
  for (const failure of failures) console.log(`      x ${failure}`);
  return failures.length ? 1 : 0;
}

process.exit(await main());
