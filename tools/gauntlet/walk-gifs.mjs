import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT } from '../lib/content.mjs';
import { serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * EVERY WALK IN THE GAME, RECORDED IN THE GAME. Tyler, 2026-11-06: "give me
 * gifs of all the characters who walk, walking in the game. I want to make
 * sure they look right since we'd struggled with walking looking natural in
 * the past."
 *
 * Each scene starts the live game where a walk happens (a fixture and a room,
 * or the opening from a new game), sets off the walk the way play does (a
 * click on the floor, or the declared flag that sends a character out through
 * the harness's flag control), and records every painted frame with Chrome's
 * screencast while the probe is read alongside for where the movers are. The
 * frames go to a scratch directory; tools/gauntlet/walk-gifs.py cuts each
 * walker out, following him, into renders/walks/<scene>.gif.
 *
 *   node tools/gauntlet/walk-gifs.mjs [scene ...] [--raw <dir>]
 */
const args = process.argv.slice(2);
const rawRoot = args.includes('--raw') ? args[args.indexOf('--raw') + 1] : resolve(ROOT, '.walk-raw');
const wanted = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--raw');

const probe = (page) => page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
const controls = (page, name, value) => page.evaluate(([n, v]) => window.__gauntlet?.controls?.[n](v), [name, value]);

/** Clicks through any line on screen (lines wait for a click) until `done` or the deadline. */
async function pump(page, done, ms, why) {
  const deadline = Date.now() + ms;
  let lineSince = null;
  for (;;) {
    const state = await probe(page);
    if (state && await done(state)) return state;
    if (Date.now() > deadline) throw new Error(`timed out: ${why} -- last saw room ${state?.room}, beat ${state?.beat}, waiting ${state?.waitingBeat}, control ${state?.control}, handedOver ${state?.handedOver}, says ${Boolean(state?.says)}, options ${state?.options}`);
    if (state?.says || state?.pending) {
      lineSince ??= Date.now();
      if (Date.now() - lineSince > 1200) { await page.mouse.click(960, 430); lineSince = null; }
    } else lineSince = null;
    await page.waitForTimeout(150);
  }
}

/** Screencast while `body` runs; probe samples alongside. Returns once body resolves. */
async function record(page, dir, body) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const samples = [];
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const name = `${String(frames.length).padStart(5, '0')}.png`;
    writeFileSync(resolve(dir, name), Buffer.from(data, 'base64'));
    // Stamped on the same clock as the probe samples: the screencast's own
    // timestamp is on another, and a crop that followed it lagged the walker.
    frames.push({ name, t: Date.now() / 1000, painted: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  let sampling = true;
  const sampler = (async () => {
    while (sampling) {
      const s = await probe(page).catch(() => null);
      if (s) {
        samples.push({ t: Date.now() / 1000, camera: s.camera, room: s.room, beat: s.beat,
          movers: Object.fromEntries(Object.entries(s.movers ?? {}).map(([id, m]) => [id,
            { bounds: m.bounds, clip: m.clip, moving: m.moving, at: m.at }])) });
      }
      await page.waitForTimeout(60);
    }
  })();
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  try {
    await body();
  } finally {
    await cdp.send('Page.stopScreencast').catch(() => {});
    sampling = false;
    await sampler;
  }
  return { frames, samples };
}

async function open(page, server, query) {
  await page.goto(`${server.url}/?${query}`);
  await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
}

const idle = (s) => !s.says && !s.pending && !(s.options > 0) && !s.dialogueAt?.tree;

/** A walk sent by flags: start where the walker stands, set the flags, record until he is gone. */
function departure(fixture, room, setup, go, seconds, walker) {
  return async (page, server, dir) => {
    await open(page, server, `fixture=${fixture}&room=${room}`);
    await pump(page, (s) => s.room === room && s.handedOver !== false, 60_000, `reach ${room}`);
    await page.waitForTimeout(1500);
    // Thad's own entry walk and any arrival line finish first, so the recording holds one walker.
    await pump(page, (s) => idle(s) && !s.movers?.thad?.moving, 30_000, 'arrival');
    await page.waitForTimeout(1500);
    if (setup) {
      await controls(page, 'flags', setup);
      await controls(page, 'enter', room);
      await page.waitForTimeout(2500);
      await pump(page, idle, 30_000, 'arrival lines');
    }
    let goAt = null;
    const rec = await record(page, dir, async () => {
      await page.waitForTimeout(600);
      goAt = Date.now() / 1000;
      const answer = await controls(page, 'flags', go);
      if (!answer?.ok) throw new Error(`flags refused: ${answer?.refused}`);
      await page.waitForTimeout(seconds * 1000);
    });
    return { ...rec, track: 'path', walker, goAt };
  };
}

/** Thad walks between floor points, clicked the way a player clicks. */
function thadWalk(fixture, room, points, track = 'thad') {
  return async (page, server, dir) => {
    await open(page, server, fixture ? `fixture=${fixture}&room=${room}` : `room=${room}`);
    await pump(page, (s) => s.room === room, 60_000, `reach ${room}`);
    await page.waitForTimeout(1500);
    await pump(page, idle, 30_000, 'arrival lines');
    await runRoute(page, { actions: [{ do: 'click', world: points[0] }] });
    await pump(page, (s) => !s.movers?.thad?.moving, 30_000, 'walk to the start');
    await page.waitForTimeout(800);
    const rec = await record(page, dir, async () => {
      for (const p of points.slice(1)) {
        await runRoute(page, { actions: [{ do: 'click', world: p }] });
        await page.waitForTimeout(400);
        await pump(page, (s) => !s.movers?.thad?.moving, 30_000, `walk to ${p}`);
        await page.waitForTimeout(500);
      }
    });
    return { ...rec, track };
  };
}

const scenes = {
  // Thad on Main Street: across both ways, then away from and toward the camera.
  'thad-side': thadWalk(null, 'main_street', [[1500, 800], [2300, 800], [1500, 800]]),
  'thad-back-front': thadWalk(null, 'main_street', [[1900, 845], [1960, 700], [1900, 845]]),
  // The opening: the coach drawn up the road, Hob walking off, and Thad's walk up the road into the far distance.
  opening: async (page, server, dir) => {
    await open(page, server, '');
    const rec = await record(page, dir, async () => {
      await runRoute(page, { actions: [{ do: 'wait', seconds: 2.5 }, { do: 'click', at: [960, 430] }] });
      const asked = [];
      let lamp = false;
      let sawEleven = false;
      // Control is handed over at beat 9, which waits for the player to click the lamp
      // (tools/gauntlet/opening.json); then Hob walks off and Thad walks up the road.
      await pump(page, async (s) => {
        if (s.room !== 'stage_road') return true;
        if (s.beat === '11') sawEleven = true;
        if (sawEleven && s.beat !== '11') return true;
        if (s.options > 0 && !s.performing) {
          const next = ['drv1', 'drv2', 'drv3', 'drv4'].find((id) => !asked.includes(id));
          if (next) { asked.push(next); await runRoute(page, { actions: [{ do: 'option', option: next }] }).catch(() => asked.pop()); }
        }
        if ((s.beat === '9' || s.waitingBeat === '9' || s.handedOver) && !lamp && !s.says && !s.pending) {
          lamp = true;
          await page.waitForTimeout(1000);
          await runRoute(page, { actions: [{ do: 'click', on: 'lamp' }] }).catch(() => { lamp = false; });
        }
        // Beat 11 waits for the player to take the road (road_west writes T_THAD_LEAVING), which
        // opens only once the case is taken -- Room 1's puzzle, not a walk. The flag is set
        // through the harness's own control instead, which writes only declared flags.
        if (s.waitingBeat === '11' && !s.says && !s.pending && !(s.movers?.thad?.moving)) {
          await controls(page, 'flags', { T_THAD_LEAVING: true });
          await page.waitForTimeout(1500);
        }
        return false;
      }, 150_000, 'the opening');
      await page.waitForTimeout(4000);
    });
    return { ...rec, track: 'movers' };
  },
  'deke-walks-out': async (page, server, dir) => {
    await open(page, server, 'fixture=w1-piano&room=nugget');
    await pump(page, (s) => s.options > 0 && !s.performing, 60_000, 'Deke opens on entry');
    await runRoute(page, { actions: [{ do: 'option', option: 'deke_vessel7' }] });
    await pump(page, idle, 40_000, 'his opening ends');
    await page.waitForTimeout(1000);
    let goAt = null;
    const rec = await record(page, dir, async () => {
      await page.waitForTimeout(600);
      goAt = Date.now() / 1000;
      await controls(page, 'flags', { T_SWINDLED: true });
      await page.waitForTimeout(9000);
    });
    return { ...rec, track: 'path', walker: 'deke_vessel', goAt };
  },
  'hob-leaves-funeral': departure('r31-a', 'funeral', null, { T_GOOD_TURNOUT: true }, 8, 'funeral_hob'),
  'pratt-leaves-registrar': departure('r7-e', 'claims_registrar', null, { T_ATTESTED: true }, 22, 'pratt_registrar'),
  'pratt-leaves-prosperity': departure('r7-c', 'prosperity', null, { T_PRATT_STAKE: true }, 18, 'pratt_jump'),
  // The claims road's miners: two crowds on loops (out to the diggings, back), always walking.
  miners: async (page, server, dir) => {
    await open(page, server, 'room=claims_road');
    await pump(page, (s) => s.room === 'claims_road', 60_000, 'reach the claims road');
    await page.waitForTimeout(1500);
    await pump(page, (s) => idle(s) && !s.movers?.thad?.moving, 30_000, 'arrival');
    const rec = await record(page, dir, async () => { await page.waitForTimeout(45_000); });
    return { ...rec, track: 'path', walkers: ['miners_out', 'miners_back'], loop: true };
  },
  'raccoon-leaves': departure('r23-a', 'prosperity', null, { T_WARM_HOLE: true }, 11, 'raccoon'),
  'raccoons-meeting-leave': departure('r23-a', 'prosperity', { T_RACCOON_MEETING: true }, { T_WARM_HOLE: true }, 11, 'raccoon_meeting'),
};

const server = await serve();
const chrome = await browser();
let failed = 0;
try {
  for (const [name, play] of Object.entries(scenes)) {
    if (wanted.length && !wanted.includes(name)) continue;
    const page = await chrome.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.addInitScript(() => {
      const install = () => { if (!window.__gauntlet) return false; window.__gauntlet.arm({}); return true; };
      if (!install()) { const timer = setInterval(() => { if (install()) clearInterval(timer); }, 4); }
    });
    const dir = resolve(rawRoot, name);
    try {
      const rec = await play(page, server, dir);
      writeFileSync(resolve(dir, 'record.json'), JSON.stringify(rec));
      console.log(`${name}: ${rec.frames.length} frames over ${(rec.frames.at(-1).t - rec.frames[0].t).toFixed(1)}s`);
    } catch (error) {
      failed += 1;
      console.error(`${name}: FAILED -- ${error.message}`);
    }
    await page.close();
  }
} finally {
  await chrome.close();
  server.stop?.();
  server.close?.();
}
process.exit(failed ? 1 : 0);
