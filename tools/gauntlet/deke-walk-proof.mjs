import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT } from '../lib/content.mjs';
import { serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * DEKE VESSEL WALKS OUT. Room 3, A3 (reference/room-03/deke-walk/brief.md).
 *
 * Plays the deal from the w1-piano fixture in the Nugget -- TALK TO Vessel,
 * options 2, 3, 4 and then 6, "All right." -- and photographs the room
 * every fraction of a second while he walks his exit path to the batwing
 * doors, until he is gone. The frames go to raw-captures-ignored/; the strip
 * Tyler looks at is made from them by tools/gauntlet/deke-walk-strip.py.
 *
 *   node tools/gauntlet/deke-walk-proof.mjs
 */
const outDir = 'renders/proofs/room-03-deke-walk';
const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });

const server = await serve();
const chrome = await browser();
const page = await chrome.newPage({ viewport: { width: 1920, height: 1080 } });
const log = [];
const run = async (actions) => { for (const line of await runRoute(page, { actions })) log.push(line); };
const probe = () => page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
try {
  await page.addInitScript(() => {
    const install = () => { if (!window.__gauntlet) return false; window.__gauntlet.arm({}); return true; };
    if (!install()) { const timer = setInterval(() => { if (install()) clearInterval(timer); }, 4); }
  });
  await page.goto(`${server.url}/?fixture=w1-piano&room=nugget`);
  await run([{ do: 'waitFor', room: 'nugget', upTo: 60 }]);
  // Lines wait for a click (content/ui), so a list arrives only once they are
  // read through -- barrel-proof.mjs's helper.
  const choices = async (why) => {
    const deadline = Date.now() + 40_000;
    for (;;) {
      const state = await probe();
      if (state && state.options > 0 && !state.performing) return state;
      if (Date.now() > deadline) throw new Error(`no choice list (${why})`);
      if (state?.says || state?.pending) await page.mouse.click(960, 430);
      await page.waitForTimeout(300);
    }
  };
  // Deke opens on Thad as he enters (doc 35); that opening is his tree's
  // root, so the deal is played from it.
  await choices('Deke opens on entry');
  // Left by his tree's own EXIT, then TALK TO: Thad walks to his talking
  // place across the barrel, and the walk out passes in front of him.
  await run([{ do: 'option', option: 'deke_vessel7' }]);
  for (const deadline = Date.now() + 40_000; ;) {
    await page.waitForTimeout(300);
    const state = await probe();
    if (state && !state.says && !state.options && !state.pending && !state.dialogueAt?.tree) break;
    if (Date.now() > deadline) throw new Error('his opening did not end');
    if (state?.says || state?.pending) await page.mouse.click(960, 430);
  }
  await run([{ do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'deke_vessel' }]);
  await choices('TALK TO Deke');
  for (const option of ['deke_vessel2', 'deke_vessel3', 'deke_vessel4']) {
    await run([{ do: 'option', option }]);
    await choices(option);
  }
  await run([{ do: 'option', option: 'deke_vessel6', why: '"All right." -- the deal' }]);
  // CHROME'S SCREENCAST, NOT SCREENSHOTS: a full screenshot here takes over
  // a second, which is two or three frames of his whole walk; the screencast
  // hands over every frame the page paints, with its own timestamp.
  const frames = [];
  const cdp = await page.context().newCDPSession(page);
  let t0 = null;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    t0 ??= metadata.timestamp;
    const name = `${String(frames.length).padStart(4, '0')}.jpg`;
    writeFileSync(resolve(ROOT, rawDir, name), Buffer.from(data, 'base64'));
    frames.push({ name, t: Number((metadata.timestamp - t0).toFixed(3)) });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  const started = Date.now();
  while (Date.now() - started < 14_000) {
    const f = await probe();
    if (f?.says || f?.pending) await page.mouse.click(960, 430);
    await page.waitForTimeout(400);
  }
  await cdp.send('Page.stopScreencast');
  const end = await probe();
  writeFileSync(resolve(ROOT, rawDir, 'frames.json'), JSON.stringify({ frames, log, end: {
    room: end?.room, swindled: end?.flags?.T_SWINDLED ?? null } }, null, 1));
  console.log(`${frames.length} frames in ${rawDir}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await chrome.close();
  server.stop?.();
  server.close?.();
  process.exit(process.exitCode ?? 0);
}
