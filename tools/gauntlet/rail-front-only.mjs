import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { serve } from './proof.mjs';

/**
 * THAD WALKS ONLY IN FRONT OF THE HITCHING RAIL. Tyler's ruling, Phase 1.5I.
 *
 * THE DEFECT THIS EXISTS FOR. Phase 1.5G gave the rail walkable ground behind
 * it; 1.5H made the fence uncrossable between its ends. Both passed their own
 * tests and Tyler could still put Thad in the rail, because both answered the
 * wrong question. Neither asked whether he may be BEHIND the rail at all --
 * and the strip behind it, mud_mid_3 at y 690-776, is exactly where the bar is
 * drawn. A man standing there is a man standing in a fence, whatever route he
 * took to get there. So the rule is no longer about crossing. It is about
 * occupancy:
 *
 *   HIS FEET MAY NEVER BE INSIDE THE RAIL'S REAR REGION.
 *
 * Not on arrival, not in passing, not for one sample of one walk. The region
 * is read from the room's own `navigation.frontOnly` -- it is not restated
 * here -- and this test clicks the way a player clicks: on the ground behind
 * the rail, on the bar, on each post, past each end, along the front, and at
 * the trough. Every walk is sampled every 120 ms, start to stop.
 *
 * WHY IT IS NOT A ROUTING TEST. tools/gauntlet/rail-crossing.mjs (1.5H) took
 * the polyline and asked whether it crossed a line. Under this ruling there
 * is nothing to cross: the rear is not ground. That test could only pass
 * vacuously now, so it is retired and this replaces it -- "never behind it"
 * subsumes "never through it", and is the thing a person can see.
 *
 *   node tools/gauntlet/rail-front-only.mjs [--out dir]
 */
const ROOM = 'main_street_candidate';
const SETTLE = 120;
const MAX_WALK_MS = 40_000;

const flag = (name) => (process.argv.includes(name)
  ? process.argv[process.argv.indexOf(name) + 1] : null);

const insideRect = ([rx, ry, rw, rh], x, y) => x > rx && x < rx + rw && y > ry && y < ry + rh;

async function walkTo(page, world, samples) {
  const camera = await page.evaluate(() => window.__gauntlet?.probe?.()?.camera ?? 0);
  const point = await page.evaluate(([nx, ny, w, h]) => {
    const canvas = document.querySelector('canvas');
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(box.width / w, box.height / h);
    return {
      x: box.left + (box.width - w * scale) / 2 + nx * scale,
      y: box.top + (box.height - h * scale) / 2 + ny * scale,
    };
  }, [world[0] - camera, world[1], 1920, 1080]);
  await page.mouse.click(point.x, point.y);
  const started = Date.now();
  let still = 0;
  while (Date.now() - started < MAX_WALK_MS) {
    // eslint-disable-next-line no-await-in-loop
    const frame = await page.evaluate(() => window.__gauntlet?.probe?.());
    const thad = frame?.movers?.thad;
    if (thad?.at) {
      samples.push({
        t: Date.now() - started, x: thad.at[0], y: thad.at[1], moving: Boolean(thad.moving),
      });
    }
    still = thad?.moving ? 0 : still + 1;
    // A TURN LOOKS LIKE A STOP for a couple of samples, so a walk is over only
    // after a second of it: an early break records half a path.
    if (still >= 8 && samples.length > 8) break;
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(SETTLE);
  }
  return samples[samples.length - 1];
}

/** Every way a set of samples breaks the front-only rule. */
function verdict(region, name, samples, landed) {
  const broken = [];
  const trespass = samples.find((one) => insideRect(region.rect, one.x, one.y));
  if (trespass) {
    broken.push(`${name}: his feet were BEHIND THE RAIL at ${trespass.x},${trespass.y}, `
      + `inside the rear region ${region.rect.join(',')}, ${trespass.t}ms into the walk`);
  }
  if (landed && insideRect(region.rect, landed.x, landed.y)) {
    broken.push(`${name}: he STOPPED behind the rail, at ${landed.x},${landed.y}`);
  }
  for (const post of region.posts ?? []) {
    // A POST IS A THING ON THE GROUND, not a column of the whole frame. His
    // feet are on it when they are in its columns AND at its own depth: below
    // the top of the rear region, above its foot plus the clearance. The
    // boardwalk crosses those columns at y 600 -- the pavement, 186 px behind
    // the far post's foot, with no part of him drawn against the rail -- and
    // reading that as standing on a post is how a test starts refusing the
    // street. The bound is the rear region's own top, so the two rules meet
    // at one line rather than two.
    const on = samples.find((one) => one.x >= post.x[0] && one.x <= post.x[1]
      && one.y > region.rect[1] && one.y < post.base + (region.minPostClearance ?? 8));
    if (on) {
      broken.push(`${name}: his feet were on the ${post.id} post at ${on.x},${on.y} -- `
        + `its foot is y ${post.base} and he must clear it by ${region.minPostClearance ?? 8}`);
    }
  }
  return broken;
}

async function main() {
  const outDir = flag('--out') ?? 'renders/proofs/candidates/rail-front-only';
  mkdirSync(resolve(ROOT, outDir), { recursive: true });
  const room = readJson('content/manifest.json').rooms.map((p) => readJson(p))
    .find((one) => one.id === ROOM);
  const region = (room.navigation?.frontOnly ?? [])[0];
  if (!region) {
    console.error(`${ROOM} declares no navigation.frontOnly region, so there is nothing to hold `
      + 'it to. The rule is data or it is nothing.');
    return 2;
  }
  const trough = (room.hotspots ?? []).find((one) => one.id === 'water_trough');
  const [sx0, sx1] = region.span;
  const failures = [];
  const runs = [];
  const server = await serve();
  const chrome = await browser();
  try {
    const page = await chrome.newPage();
    page.on('pageerror', (error) => failures.push(`page error: ${error.message ?? error}`));
    await page.goto(`${server.url}/?room=${encodeURIComponent(ROOM)}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));

    const quarter = (f) => Math.round(sx0 + (sx1 - sx0) * f);
    const home = [quarter(0.5), region.frontY];
    // A: THE GROUND BEHIND THE RAIL, clicked repeatedly, the way Tyler clicks.
    // Twice each, because the second click starts from wherever the first left
    // him and that is the click a one-shot test never makes.
    const behind = [
      { name: 'behind-left-quarter', at: [quarter(0.25), 730] },
      { name: 'behind-centre', at: [quarter(0.5), 730] },
      { name: 'behind-right-quarter', at: [quarter(0.75), 730] },
      { name: 'behind-centre-again', at: [quarter(0.5), 700] },
      { name: 'behind-left-again', at: [quarter(0.25), 760] },
      { name: 'behind-right-again', at: [quarter(0.75), 700] },
    ];
    // B: THE RAIL ITSELF -- the bar and both posts.
    const onTheRail = [
      { name: 'on-the-bar', at: [quarter(0.5), 660] },
      { name: 'on-the-near-post', at: [2305, 700] },
      { name: 'on-the-far-post', at: [2569, 770] },
    ];
    // C: PAST EACH END, where the street is genuinely open. He MAY go round --
    // that is what an end is for -- and the ground at MID DEPTH beyond each end
    // must still be his, or the ruling would have walled off the street rather
    // than the rail. Both points are clear of every hotspot: 2150,720 is inside
    // the trough's rect and 2740,720 inside the dog's, so clicking either is a
    // click on an OBJECT and proves nothing about the floor.
    const pastTheEnds = [
      { name: 'past-the-west-end', at: [1900, 720], reachesDepth: true },
      { name: 'past-the-east-end', at: [2900, 720], reachesDepth: true },
    ];
    // D: ALONG THE FRONT, end to end, which must stay ordinary walking.
    const alongTheFront = [0.05, 0.3, 0.55, 0.8, 0.95].map((f) => ({
      name: `along-the-front-${Math.round(f * 100)}`, at: [quarter(f), region.frontY],
    }));
    // E: THE TROUGH, which the front-only rule must not put out of reach.
    const atTheTrough = [
      { name: 'trough-body', at: [trough.rect[0] + trough.rect[2] / 2, trough.rect[1] + 40] },
      { name: 'trough-walk-to', at: [trough.walkTo.x, trough.walkTo.y] },
    ];

    const groups = [
      ['behind the rail', behind, true],
      ['on the rail', onTheRail, true],
      ['past the ends', pastTheEnds, false],
      ['along the front', alongTheFront, false],
      ['the trough', atTheTrough, false],
    ];
    for (const [group, targets, fromHome] of groups) {
      for (const target of targets) {
        // The "behind" and "rail" clicks are made from the front, because that
        // is where a player stands when he makes them.
        if (fromHome) await walkTo(page, home, []);
        const samples = [];
        const landed = await walkTo(page, target.at.map(Math.round), samples);
        const broken = verdict(region, target.name, samples, landed);
        // BEYOND THE ENDS THE STREET IS STILL THE STREET. A front-only rail
        // that also took the mud away either side of itself would be a wall.
        if (target.reachesDepth && landed && landed.y >= region.resolveBelowY) {
          broken.push(`${target.name}: asked for the mud at depth ${target.at[1]} beyond the `
            + `rail's end and he stopped at ${landed.x},${landed.y}, out in front. The street `
            + 'past the end is supposed to be ordinary street.');
        }
        failures.push(...broken);
        runs.push({
          group, ...target, landed, samples, broke: broken,
        });
        console.log(`  ${target.name}: ${samples.length} sample(s), landed ${landed?.x},${landed?.y}`
          + `${broken.length ? '  x BEHIND THE RAIL' : ''}`);
      }
    }

    // THE TROUGH MUST STILL BE REACHABLE. Its authored approach point is in
    // front of it and west of the rail, and a front-only rail that made the
    // trough unusable would have traded one defect for another.
    const atTrough = runs.find((one) => one.name === 'trough-walk-to');
    const gap = atTrough?.landed
      ? Math.hypot(atTrough.landed.x - trough.walkTo.x, atTrough.landed.y - trough.walkTo.y)
      : Number.POSITIVE_INFINITY;
    if (gap > 40) {
      failures.push(`the trough: asked for its own approach point ${trough.walkTo.x},${trough.walkTo.y} `
        + `and stopped ${Math.round(gap)}px away, at ${atTrough?.landed?.x},${atTrough?.landed?.y}`);
    }
  } finally {
    await chrome.close();
    server.stop();
  }
  const record = {
    schema: 1, room: ROOM, region, at: new Date().toISOString(), runs, failures,
  };
  writeFileSync(resolve(ROOT, `${outDir}/front-only.json`), `${JSON.stringify(record, null, 1)}\n`);
  console.log(failures.length
    ? `FAIL  ${failures.length} thing(s) put him behind the rail or out of reach of the trough`
    : `PASS  ${runs.length} click(s): never behind the rail, never on a post, trough reachable`);
  for (const failure of failures) console.log(`      x ${failure}`);
  return failures.length ? 1 : 0;
}

process.exit(await main());
