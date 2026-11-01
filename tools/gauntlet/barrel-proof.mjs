#!/usr/bin/env node
/**
 * THE NUGGET'S WHISKEY BARREL, PROVEN IN THE RUNNING GAME.
 *
 * reference/room-03/barrel/brief.md step 7: talk to Deke (Thad on the barrel's
 * far side, nobody overlapping), walk Thad behind the barrel (it covers his
 * legs) and in front of it (he covers it), and talk to the one-strike man and
 * the card sharp (still clear). Every walk is sampled, and a foot inside the
 * barrel's obstacle rect fails the run: the barrel is something he walks
 * ROUND, which a picture of where he ended up cannot show.
 *
 * It asserts geometry the probe reports -- where Thad's feet are, which of
 * him and the barrel draws first, whose bounds overlap -- and never whether
 * the picture is good. That is Tyler's, at game size.
 *
 *   node tools/gauntlet/barrel-proof.mjs
 *
 * Writes renders/proofs/room-03-barrel/proof.json and contact-sheet.webp; the
 * full frames go to raw-captures-ignored/.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { contactSheet, serve } from './proof.mjs';
import { runRoute } from './route.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const outDir = 'renders/proofs/room-03-barrel';
const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });

const room = readJson('content/rooms/nugget.json');
const barrel = room.props.find((prop) => prop.id === 'whiskey_barrel');
const obstacle = readJson('reference/room-03/annotation.json').obstacles.find((one) => one.id === 'whiskey_barrel');
const [bw, bh] = barrel.frame.slice(2);
const barrelBox = [barrel.x - Math.floor(bw / 2), barrel.y - bh + 1, bw, bh];
// Strictly inside: the walk boxes either side adjoin ON the rect's edge, so a
// path round it runs along that edge.
const inside = ([x, y], [rx, ry, rw, rh]) => x > rx && x < rx + rw && y > ry && y < ry + rh;

/**
 * THE PIXELS A FIGURE COVERS, in room coordinates: a set of "x,y". A sprite's
 * frame is padded, so two frames' boxes overlap long before the people in
 * them do; overlap is asked of opaque pixels. A mirrored draw is covered by
 * taking the frame and its mirror together, which can only over-report.
 */
const pngs = new Map();
const png = (path) => { if (!pngs.has(path)) pngs.set(path, readPng(readFileSync(resolve(ROOT, path)))); return pngs.get(path); };
function covered(path, [sx, sy, sw, sh], [dx, dy, dw, dh], mirror = false) {
  const image = png(path);
  const out = new Set();
  for (let y = 0; y < dh; y += 1) {
    for (let x = 0; x < dw; x += 1) {
      const u = sx + Math.floor((x * sw) / dw); const v = sy + Math.floor((y * sh) / dh);
      const um = sx + sw - 1 - (u - sx);
      const solid = (uu) => image.pixels[(v * image.width + uu) * 4 + 3] > 0;
      if (solid(u) || (mirror && solid(um))) out.add(`${Math.round(dx + x)},${Math.round(dy + y)}`);
    }
  }
  return out;
}
const shared = (a, b) => { let n = 0; for (const k of a) if (b.has(k)) n += 1; return n; };
const barrelPixels = covered(barrel.sheet, barrel.frame, barrelBox);
const deke = readJson('content/ambient/deke-vessel.json');
const dekePixels = new Set(deke.sprite.frames.flatMap((frame) => [...covered(deke.sprite.sheet, frame,
  [deke.x - Math.floor(frame[2] / 2), deke.y - frame[3] + 1, frame[2], frame[3]])]));
const thadPixels = (thad) => {
  const image = png(thad.from);
  return covered(thad.from, [0, 0, image.width, image.height], thad.bounds, true);
};

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
  await page.goto(`${server.url}/?room=nugget`);
  const probe = () => page.evaluate(() => window.__gauntlet?.probe() ?? null);
  const route = (actions) => runRoute(page, { actions });
  // Lines wait for a click (content/ui), so a list arrives only once they are
  // read through: click the play area while a line is up and no list is.
  const choices = async (why) => {
    const deadline = Date.now() + 40_000;
    for (;;) {
      const state = await probe();
      if (state && state.options > 0 && !state.performing) return state;
      if (Date.now() > deadline) throw new Error(`no choice list (${why}): ${JSON.stringify({ says: state?.says, options: state?.options, performing: state?.performing })}`);
      if (state?.says || state?.pending) await page.mouse.click(960, 430);
      await page.waitForTimeout(300);
    }
  };
  // An EXIT, then its parting line read through, until Thad is free again.
  const leave = async (option) => {
    await route([{ do: 'option', option }]);
    const deadline = Date.now() + 40_000;
    for (;;) {
      await page.waitForTimeout(300);
      const state = await probe();
      if (state && !state.says && !state.options && !state.pending && !state.dialogueAt?.tree) return;
      if (Date.now() > deadline) throw new Error(`the conversation did not end after ${option}`);
      if (state?.says || state?.pending) await page.mouse.click(960, 430);
    }
  };

  await route([{ do: 'waitFor', room: 'nugget', upTo: 60 }]);
  // Deke opens on Thad as he enters (doc 35) and Thad does not walk to him
  // then, so his talking place is only exercised by a TALK TO after that.
  // The opening is let run and left by the tree's own EXIT.
  await choices('Deke opens on entry');
  await leave('deke_vessel7');

  /** Walks by clicking the floor, sampling Thad's feet until he stops. */
  const walk = async (x, y, label) => {
    await route([{ do: 'click', world: [x, y], why: label }]);
    const path = [];
    const deadline = Date.now() + 20_000;
    await page.waitForTimeout(150);
    for (;;) {
      const state = await probe();
      const thad = state?.movers?.thad;
      if (thad) path.push(thad.at.map(Math.round));
      if (thad && !thad.moving && path.length > 3) break;
      if (Date.now() > deadline) { failures.push(`${label}: Thad still moving after 20s`); break; }
      await page.waitForTimeout(60);
    }
    const through = path.filter((at) => inside(at, obstacle.rect));
    if (through.length) failures.push(`${label}: Thad's feet entered the barrel's footprint at ${through[0]}`);
    return path;
  };

  const snap = async (name, why, check) => {
    await page.waitForTimeout(250);
    const state = await probe();
    const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
    if (!url) throw new Error(`no frame for ${name}`);
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    writeFileSync(resolve(ROOT, rawDir, `${name}.png`), bytes);
    captures.push({ name, url });
    const thad = state.movers.thad;
    const result = check ? check(state) : null;
    if (result && result.fail) failures.push(`${name}: ${result.fail}`);
    panels.push({ name, why, hash: sha(bytes), file: `raw-captures-ignored/${name}.png`,
      thad: { at: thad.at.map(Math.round), bounds: thad.bounds, order: thad.order, from: thad.from, fallback: thad.fallback },
      says: state.says, options: state.options, dialogueAt: state.dialogueAt, ...(result ? { measured: result } : {}) });
  };

  /** Opaque pixels Thad shares with the barrel and, where asked, with Deke. */
  const clearOf = (state, withDeke) => {
    const thad = thadPixels(state.movers.thad);
    const hits = {};
    const b = shared(thad, barrelPixels); if (b) hits.whiskey_barrel = b;
    if (withDeke) { const d = shared(thad, dekePixels); if (d) hits.deke_vessel = d; }
    return hits;
  };

  await snap('b01-room-with-barrel', 'the room with the barrel at Deke\'s left, after his opening is left');

  // BEHIND: from the arrival side to the floor behind the barrel.
  const behindPath = await walk(890, 770, 'behind the barrel');
  await snap('b02-thad-behind-barrel', 'Thad behind the barrel: it draws after him and covers his legs', (state) => {
    const thad = state.movers.thad;
    const shares = shared(thadPixels(thad), barrelPixels);
    const behind = shares > 0 && thad.at[1] < barrel.y;
    return { feet: thad.at.map(Math.round), barrelBox, sharedPixels: shares, behind,
      ...(behind ? {} : { fail: 'Thad is not behind the barrel (no shared pixels, or feet not above its base line)' }) };
  });

  // IN FRONT: from behind to in front, which has to go round.
  const frontPath = await walk(890, 852, 'in front of the barrel');
  await snap('b03-thad-in-front-of-barrel', 'Thad in front of the barrel: he draws after it and covers it', (state) => {
    const thad = state.movers.thad;
    const shares = shared(thadPixels(thad), barrelPixels);
    const covers = shares > 0 && thad.at[1] > barrel.y;
    return { feet: thad.at.map(Math.round), sharedPixels: shares, covers, wentRound: frontPath.some(([x, y]) => y > obstacle.rect[1] && y < obstacle.rect[1] + obstacle.rect[3] && (x <= obstacle.rect[0] || x >= obstacle.rect[0] + obstacle.rect[2])),
      ...(covers ? {} : { fail: 'Thad is not in front of the barrel' }) };
  });

  // DEKE: TALK TO walks him to the barrel's far side.
  await route([
    { do: 'verb', verb: 'TALK_TO' },
    { do: 'click', on: 'deke_vessel' },
  ]);
  await choices('TALK TO Deke');
  await snap('b04-talking-to-deke', 'TALK TO Deke: Thad across the barrel from him, nobody overlapping', (state) => {
    const thad = state.movers.thad;
    const hits = Object.keys(clearOf(state, true));
    const want = readJson('content/ambient/deke-vessel.json').walkTo;
    const at = thad.at.map(Math.round);
    const there = Math.abs(at[0] - want.x) <= 4 && Math.abs(at[1] - want.y) <= 4;
    return { feet: at, walkTo: want, overlapping: hits, facing: thad.facing,
      ...(hits.length || !there ? { fail: `overlapping ${hits.join(', ') || 'nothing'}, feet ${at} against ${want.x},${want.y}` } : {}) };
  });
  await leave('deke_vessel7');

  for (const [id, exit, name] of [['one_strike_man', 'exit', 'b05-talking-to-one-strike-man'], ['card_sharp', 'exit', 'b06-talking-to-card-sharp']]) {
    await route([
      { do: 'verb', verb: 'TALK_TO' },
      { do: 'click', on: id },
    ]);
    await choices(`TALK TO ${id}`);
    // These two are painted into the plate (their AmbientFiles carry identity
    // sprites only), so what can have changed for them is the barrel.
    await snap(name, `TALK TO ${id}: Thad at his unchanged place, clear of the barrel`, (state) => {
      const hits = Object.keys(clearOf(state, false));
      return { feet: state.movers.thad.at.map(Math.round), overlapping: hits,
        ...(hits.length ? { fail: `overlapping ${hits.join(', ')}` } : {}) };
    });
    await leave(exit);
  }

  if (pageErrors.length) failures.push(`page errors: ${pageErrors.join(' | ')}`);
  const sheet = await contactSheet(page, captures);
  if (sheet) writeFileSync(resolve(ROOT, outDir, `contact-sheet.${sheet.ext}`), sheet.bytes);
  writeFileSync(resolve(ROOT, outDir, 'proof.json'), `${JSON.stringify({
    schema: 1,
    what: 'reference/room-03/barrel/brief.md step 7, in the running game',
    commit: git('rev-parse', 'HEAD'), branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    dirty: git('status', '--porcelain') !== '',
    barrel: { ...barrel, drawnBox: barrelBox, obstacle: obstacle.rect,
      sheetHash: sha(Buffer.from(execFileSync('cat', [resolve(ROOT, barrel.sheet)]))) },
    paths: { behind: behindPath, front: frontPath },
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
