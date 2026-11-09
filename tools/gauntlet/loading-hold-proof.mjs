#!/usr/bin/env node
/**
 * EVERY ARRIVAL WAITS FOR ITS ROOM, PROVEN IN THE RUNNING GAME (errata 223).
 *
 * Errata 221's playthrough left it for Tyler: a map walk skipped by a click
 * could arrive before the next room had loaded, and showed it in pieces. He
 * ruled (2026-11-09): "Yes, and is it possible to have it say "Loading..." On
 * the screen if it's waiting for it to load a room?"
 *
 * Two map arrivals, by real clicks on the dev build:
 *
 * 1. SLOW. A place on the town map that nothing next door has fetched. Its
 *    pictures are held back by the browser for `HOLD_MS`, and the walk there
 *    is skipped by a second click -- errata 221's case. Every frame the
 *    probe reports from the click on is sampled: the room may never be seen
 *    (`black < 1`) while it is not whole, "Loading…" may not be up before
 *    the threshold, must be up after it while the room waits, and must be
 *    gone once the room is whole.
 * 2. ORDINARY. Back to the map and on to a place by its whole walk, with
 *    nothing held back. No frame may be held, black or carry the words.
 *
 *   node --experimental-strip-types tools/gauntlet/loading-hold-proof.mjs
 *
 * Writes renders/proofs/loading-hold/proof.json and contact-sheet.webp; the
 * full frames go to raw-captures-ignored/. It asserts what the probe reports
 * and never whether the picture is good: that is Tyler's.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { planNear, planRoom } from '../../engine/core/BootAssets.ts';
import { loadContent } from '../../engine/core/ContentLoader.ts';
import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { contactSheet, serve } from './proof.mjs';
import { clickScreen, probe, runRoute } from './route.mjs';

const HOLD_MS = 2500;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const outDir = 'renders/proofs/loading-hold';
const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });
const dirty = git('status', '--porcelain') !== '';

const content = await loadContent(async (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')));
const ui = readJson('content/ui/ui.json');
const AFTER = ui.loading?.afterSeconds ?? 0.5;
const PANEL = readJson('content/ui/panel.json');
const START = 'main_street';
const map = [...content.rooms.values()].find((room) => room.kind === 'map');
// A place the street and the map have not fetched: the shape errata 221 found.
const fetched = new Set([...planNear(content, START), ...planNear(content, map.id)].map((asset) => asset.key));
const slow = map.locations.find((location) => content.rooms.has(location.room) && location.room !== START
  && planRoom(content, location.room).some((asset) => !fetched.has(asset.key)));
const slowPaths = new Set(planRoom(content, slow.room).map((asset) => asset.path));
const ordinary = map.locations.find((location) => location.room === START);

const failures = [];
const captures = [];
const panels = [];
const server = await serve();
const engine = await browser();
let page;
try {
  page = await engine.newPage({ viewport: { width: 1920, height: 1080 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message)));
  await page.addInitScript(() => {
    const install = () => { if (!window.__gauntlet) return false; window.__gauntlet.arm({}); return true; };
    if (!install()) { const timer = setInterval(() => { if (install()) clearInterval(timer); }, 4); }
  });
  // THE SLOW CONNECTION: the slow place's pictures wait until released.
  let release;
  const released = new Promise((done) => { release = done; });
  let holding = false;
  const heldBack = [];
  await page.route('**/*', async (request) => {
    const path = decodeURIComponent(new URL(request.request().url()).pathname).replace(/^\//, '');
    if (holding && slowPaths.has(path)) {
      heldBack.push(path);
      await released;
    }
    await request.continue().catch(() => {});
  });
  await page.goto(`${server.url}/?room=${START}`);
  await runRoute(page, { actions: [{ do: 'waitFor', room: START, upTo: 60 }] });
  if (slow.when) await page.evaluate((flags) => window.__gauntlet?.controls.flags(flags), slow.when);
  // His first sight of the street, walked and said, before the panel is his.
  for (let quietFor = 0, deadline = Date.now() + 60_000; quietFor < 4;) {
    const state = await probe(page);
    const busy = state.says || state.pending || state.movers?.thad?.moving || !state.panel || state.dialogueAt?.tree;
    quietFor = busy ? 0 : quietFor + 1;
    if (Date.now() > deadline) throw new Error(`${START} never went quiet: ${JSON.stringify({ says: state.says, pending: state.pending, panel: state.panel, tree: state.dialogueAt?.tree })}`);
    if (state.waiting) await clickScreen(page, 960, 430);
    await page.waitForTimeout(250);
  }

  // Every frame the probe sees, from the page's own clock.
  const record = () => page.evaluate(() => {
    window.__holdSamples = [];
    const tick = () => {
      const p = window.__gauntlet?.probe();
      if (p) window.__holdSamples.push({ t: performance.now(), room: p.room, black: p.black, whole: p.whole,
        holding: p.holding, loading: p.loading, mapWalk: p.mapWalk?.to ?? null });
      window.__holdTimer = requestAnimationFrame(tick);
    };
    tick();
  });
  const stop = () => page.evaluate(() => { cancelAnimationFrame(window.__holdTimer); return window.__holdSamples; });
  const snap = async (name, why) => {
    const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
    if (!url) throw new Error(`no frame for ${name}`);
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    writeFileSync(resolve(ROOT, rawDir, `${name}.png`), bytes);
    captures.push({ name, url });
    const state = await probe(page);
    panels.push({ name, why, hash: sha(bytes), file: `raw-captures-ignored/${name}.png`,
      room: state.room, black: state.black, whole: state.whole, holding: state.holding, loading: state.loading });
  };
  const mapButton = async () => {
    const { cols, rows, width, height } = PANEL.verbs;
    const button = PANEL.mapButton;
    await clickScreen(page, cols[button.col] + width / 2, rows[button.row] + height / 2);
    await page.waitForTimeout(800);
  };

  // 1. SLOW: to the map, click the place, click again to skip the walk.
  await mapButton();
  if ((await probe(page)).room !== map.id) throw new Error(`the MAP button did not open ${map.id}`);
  holding = true;
  await record();
  await clickScreen(page, slow.at[0], slow.at[1]);
  await page.waitForTimeout(120);
  await clickScreen(page, slow.at[0], slow.at[1]);
  await page.waitForTimeout(Math.round(AFTER * 1000) + 400);
  await snap('l01-held-loading', `${slow.room} arrived on before its pictures: held black, "${ui.loading.label}" up`);
  await page.waitForTimeout(Math.max(0, HOLD_MS - Math.round(AFTER * 1000) - 400));
  release();
  holding = false;
  // Until the room is whole and nothing holds it (a build without the hold reports no `holding` at all).
  await page.waitForFunction(() => { const p = window.__gauntlet?.probe(); return p?.whole === true && !p?.holding; },
    null, { timeout: 15_000 });
  await page.waitForTimeout(600);
  await snap('l02-shown-whole', `${slow.room} shown once whole, the words gone`);
  const slowSamples = await stop();

  const arrived = slowSamples.filter((one) => one.room === slow.room);
  if (!arrived.length) failures.push(`never arrived in ${slow.room}`);
  if (!heldBack.length) failures.push(`nothing of ${slow.room} was held back: the slow case was not exercised`);
  const inPieces = arrived.filter((one) => one.black < 1 && !one.whole);
  if (inPieces.length) failures.push(`${slow.room} seen in pieces on ${inPieces.length} frame(s)`);
  const heldFrom = arrived.find((one) => one.holding)?.t;
  if (heldFrom === undefined) failures.push(`the arrival on ${slow.room} was never held`);
  const early = arrived.filter((one) => one.loading && heldFrom !== undefined && one.t - heldFrom < AFTER * 1000 - 20);
  if (early.length) failures.push(`"${ui.loading.label}" up ${Math.round(early[0].t - heldFrom)} ms into the hold, before the threshold`);
  const wordsFrom = arrived.find((one) => one.loading)?.t;
  if (wordsFrom === undefined) failures.push(`"${ui.loading.label}" never came up over a ${HOLD_MS} ms wait`);
  const afterWhole = arrived.filter((one) => one.whole && one.loading);
  if (afterWhole.length) failures.push(`"${ui.loading.label}" still up on ${afterWhole.length} frame(s) of a whole room`);
  const wholeAt = arrived.find((one) => one.whole)?.t;
  const shownAt = arrived.find((one) => one.black < 1)?.t;

  // 2. ORDINARY: back to the map, and home by the whole walk, nothing held back.
  await mapButton();
  await record();
  await clickScreen(page, ordinary.at[0], ordinary.at[1]);
  await page.waitForFunction((room) => window.__gauntlet?.probe()?.room === room, ordinary.room, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await snap('l03-ordinary-arrival', `${ordinary.room} by the map's whole walk: no hold, no words`);
  const ordinarySamples = (await stop()).filter((one) => one.room === ordinary.room);
  if (!ordinarySamples.length) failures.push(`never arrived in ${ordinary.room}`);
  const touched = ordinarySamples.filter((one) => one.holding || one.loading || one.black > 0);
  if (touched.length) failures.push(`the ordinary arrival was held, black or worded on ${touched.length} frame(s)`);

  if (pageErrors.length) failures.push(`page errors: ${pageErrors.join(' | ')}`);
  const sheet = await contactSheet(page, captures);
  if (sheet) writeFileSync(resolve(ROOT, outDir, `contact-sheet.${sheet.ext}`), sheet.bytes);
  writeFileSync(resolve(ROOT, outDir, 'proof.json'), `${JSON.stringify({
    schema: 1,
    what: 'errata 223: an arrival on a room still loading is held black, "Loading…" after the threshold; an ordinary arrival is untouched',
    commit: git('rev-parse', 'HEAD'), branch: git('rev-parse', '--abbrev-ref', 'HEAD'), dirty,
    slow: { location: slow.id, room: slow.room, heldBackMs: HOLD_MS, heldBack: [...new Set(heldBack)],
      frames: arrived.length, framesInPieces: inPieces.length,
      wordsAfterMs: wordsFrom !== undefined && heldFrom !== undefined ? Math.round(wordsFrom - heldFrom) : null,
      wholeAfterMs: wholeAt !== undefined && heldFrom !== undefined ? Math.round(wholeAt - heldFrom) : null,
      shownAfterMs: shownAt !== undefined && heldFrom !== undefined ? Math.round(shownAt - heldFrom) : null },
    ordinary: { location: ordinary.id, room: ordinary.room, frames: ordinarySamples.length, framesHeldBlackOrWorded: touched.length },
    thresholdSeconds: AFTER,
    panels, failures,
  }, null, 1)}\n`);
} finally {
  await page?.close().catch(() => {});
  await engine.close();
  server.stop();
}
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`${panels.length} panels -> ${outDir}; ${failures.length ? `${failures.length} failure(s)` : 'all held'}`);
process.exit(failures.length ? 1 : 0);
