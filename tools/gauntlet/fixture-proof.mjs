import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { contactSheet, serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * EVERY PLAYTEST FIXTURE, CONSTRUCTED IN THE EXECUTABLE GAME AND MEASURED.
 * Doc 36 Q111. Automation proves the STATE; Tyler proves whether it plays.
 *
 * For each fixture in the manifest: open `?fixture=<id>` (with the night
 * candidates and the pace the review URLs carry), and record from the probe
 * the room, every flag and counter, the inventory, and then: TALK TO the
 * room's character and the node the tree opens on; the choices drawn (doc
 * 30: exactly the options); a crossing of the floorboard (one creak, back at
 * rest, no flag written); LOOK on the act-gated bench; a street-door round
 * trip with the state compared before and after; and a burst of stills of
 * her work loop for the frame classifier.
 *
 *   node tools/gauntlet/fixture-proof.mjs [--candidate from=to ...] [--state night] [--pace 1.25] [--allow-dirty]
 */
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const flag = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const candidates = [];
for (let at = 0; at < process.argv.length; at += 1) {
  if (process.argv[at] !== '--candidate') continue;
  const raw = process.argv[at + 1]; const split = raw.indexOf('=');
  candidates.push({ from: raw.slice(0, split), to: raw.slice(split + 1) });
}
const outDir = 'renders/proofs/room-05-fixtures'; const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });

const manifest = readJson('content/manifest.json');
const fixtures = (manifest.fixtures ?? []).flatMap((path) => readJson(path).fixtures ?? []);
const LATER = ['T_BORDERS_MOTT', 'T_ASSAY_QUEUE', 'T_NO_MOTT_GOLD', 'T_SECOND_LEDGER', 'T_STRIKE_FOUND', 'T_SWINDLED'];

async function main() {
  const commit = git('rev-parse', 'HEAD'); const dirty = git('status', '--porcelain');
  const server = await serve(); const chrome = await browser();
  const failures = []; const results = []; const sheetFrames = [];
  const t0 = Date.now(); const stamp = () => Number(((Date.now() - t0) / 1000).toFixed(2));
  const query = (extra) => [...extra, ...candidates.map((c) => `candidate=${encodeURIComponent(`${c.from}=${c.to}`)}`),
    ...(flag('--state') ? [`state=${encodeURIComponent(flag('--state'))}`] : []), ...(flag('--pace') ? [`pace=${flag('--pace')}`] : [])].join('&');
  try {
    for (const fixture of fixtures) {
      const page = await chrome.newPage();
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(String(e.message)));
      page.on('console', (m) => { if (m.type() === 'warning' && /fixture/.test(m.text())) pageErrors.push(m.text()); });
      const log = []; const captures = [];
      const fail = (line) => failures.push(`${fixture.id}: ${line}`);
      const probe = () => page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
      const capture = async (name, why) => {
        await page.waitForTimeout(250);
        const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
        const f = await probe();
        if (!url || !f) { fail(`${name}: no frame`); return null; }
        const bytes = Buffer.from(url.split(',')[1], 'base64');
        const file = `${rawDir}/${fixture.id}-${name}.png`; writeFileSync(resolve(ROOT, file), bytes);
        captures.push({ name, why, t: stamp(), file, hash: sha(bytes), room: f.room, says: f.says, options: f.options, choiceLines: f.choiceLines, dialogueAt: f.dialogueAt, cues: f.cues?.count ?? 0, board: f.states?.floorboard ?? null, thad: f.movers?.thad ? [f.movers.thad.at, f.movers.thad.facing, f.movers.thad.clip] : null });
        sheetFrames.push({ name: `${fixture.id} ${name}`, url });
        return f;
      };
      const run = async (actions) => { for (const line of await runRoute(page, { actions })) log.push({ t: stamp(), line }); };
      const stateOf = (f) => ({ room: f.room, flags: [...f.flags].sort(), counters: f.counters, inventory: [...f.inventory].sort() });

      await page.goto(`${server.url}/?${query([`fixture=${fixture.id}`])}`);
      await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
      await page.evaluate(() => window.__gauntlet?.arm?.({}));
      await page.waitForTimeout(2500);
      const start = await capture('01-start', 'the fixture applied, at the room\'s entrance');
      if (!start) { await page.close(); continue; }
      const initial = stateOf(start);
      // ---- the state itself, against the fixture
      if (start.room !== fixture.room) fail(`room is ${start.room}, expected ${fixture.room}`);
      for (const [id, value] of Object.entries(fixture.flags)) {
        const has = typeof value === 'number' ? start.counters[id] === value : start.flags.includes(id) === value;
        if (!has) fail(`flag ${id} is not ${JSON.stringify(value)}`);
      }
      for (const id of LATER) if (!(id in fixture.flags) && start.flags.includes(id)) fail(`flag ${id} is set and the fixture does not set it`);
      for (const id of fixture.inventory ?? []) if (!start.inventory.includes(id)) fail(`${id} is not held`);
      const bench = start.assets ? null : null; void bench;
      // ---- her work loop, before anything: a burst for the classifier
      const burst = [];
      for (let n = 0; n < 8; n += 1) {
        const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
        if (url) { const bytes = Buffer.from(url.split(',')[1], 'base64'); const file = `${rawDir}/${fixture.id}-loop-${String(n).padStart(2, '0')}.png`; writeFileSync(resolve(ROOT, file), bytes); burst.push({ file, hash: sha(bytes), t: stamp() }); }
        await page.waitForTimeout(700);
      }
      // ---- the floorboard: one crossing, one creak, back at rest, nothing written
      await run([{ do: 'click', at: [1100, 765] }, { do: 'wait', seconds: 6 }]);
      const crossed = await capture('02-crossed-board', 'walked across the board from the door');
      if (crossed) {
        if ((crossed.cues?.count ?? 0) !== (start.cues?.count ?? 0) + 1) fail(`crossing the board fired ${crossed.cues?.count} cue(s) in total, expected one more than ${start.cues?.count}`);
        if (crossed.states?.floorboard !== 'rest') fail(`the board is ${crossed.states?.floorboard} after the crossing, not at rest`);
        if (JSON.stringify(stateOf(crossed).flags) !== JSON.stringify(initial.flags)) fail('crossing the board changed a flag');
      }
      // ---- the bench: a target in acts 2-4 only
      const benchLive = (fixture.expect?.interactables ?? []).includes('queue_bench');
      // A LIVE BENCH IS WALKED TO AND THEN SPOKEN ABOUT, so the capture waits
      // for the line by speaker; a bench that is floor never produces one, so
      // that case waits a fixed few seconds and expects silence.
      await run([{ do: 'verb', verb: 'LOOK_AT' }, { do: 'click', on: 'queue_bench' },
        benchLive ? { do: 'waitFor', says: 'thad', upTo: 20 } : { do: 'wait', seconds: 6 }]);
      const benchLook = await capture('03-look-bench', 'LOOK at the queue bench');
      if (benchLook && benchLive && benchLook.says !== 'thad') fail('the bench should be a target here and LOOK produced no line');
      if (benchLook && !benchLive && benchLook.says !== null) fail('the bench should not be a target here and LOOK produced a line');
      await run([{ do: 'waitFor', says: null, upTo: 20 }]);
      // ---- the conversation: the node the tree opens on, the choices drawn
      await run([{ do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'winnie' }, { do: 'waitFor', says: 'winnie', upTo: 40 }]);
      await capture('04-opening', 'she speaks first, at the dialogue point');
      await run([{ do: 'waitFor', dialogue: true, upTo: 40 }]);
      const list = await capture('05-choices', 'the tree open: its choices and nothing else');
      if (list) {
        if (fixture.expect?.opensOn && list.dialogueAt?.node !== fixture.expect.opensOn) fail(`the tree opened on ${list.dialogueAt?.node}, expected ${fixture.expect.opensOn}`);
        if (list.choiceLines !== list.options) fail(`${list.choiceLines} line(s) drawn for ${list.options} option(s)`);
        if (list.options < 3) fail(`only ${list.options} option(s) offered`);
      }
      // the universal exit, by tag: the last row
      const exitRow = await page.evaluate(() => { for (let i = 12; i >= 1; i -= 1) { const r = window.__gauntlet?.optionRow(i); if (r) return r.id; } return null; });
      if (exitRow) await run([{ do: 'option', option: exitRow }, { do: 'waitFor', says: null, upTo: 40 }]);
      await page.waitForTimeout(1500);
      const after = await capture('06-after-talk', 'control returned; she is back at work');
      if (after && after.options !== 0) fail('the list is still up after the exit');
      // ---- a street-door round trip: the state survives leaving and returning
      await run([{ do: 'verb', verb: 'OPEN' }, { do: 'click', on: 'back_to_street' }, { do: 'waitFor', room: 'main_street', upTo: 40 }, { do: 'wait', seconds: 1.5 },
        { do: 'click', on: 'to_assay_office' }, { do: 'waitFor', room: 'assay_office', upTo: 40 }, { do: 'wait', seconds: 2 }]);
      const back = await capture('07-re-entered', 'out by the street door and back in');
      if (back) {
        const now = stateOf(back);
        const flagsThen = initial.flags.filter((id) => id !== 'T_SEEN_MAIN_STREET');
        const flagsNow = now.flags.filter((id) => id !== 'T_SEEN_MAIN_STREET');
        if (JSON.stringify(flagsNow) !== JSON.stringify(flagsThen)) fail(`flags changed across the round trip: ${JSON.stringify(flagsThen)} -> ${JSON.stringify(flagsNow)}`);
        if (JSON.stringify(now.counters) !== JSON.stringify(initial.counters)) fail('counters changed across the round trip');
        if (JSON.stringify(now.inventory) !== JSON.stringify(initial.inventory)) fail('the inventory changed across the round trip');
        if (back.room !== 'assay_office') fail(`re-entry landed in ${back.room}`);
      }
      for (const e of pageErrors) fail(`page: ${e}`);
      results.push({ fixture: fixture.id, label: fixture.label, room: start.room, flags: start.flags, counters: start.counters, inventory: start.inventory, opensOn: list?.dialogueAt ?? null, optionsOffered: list?.options ?? null, choiceLines: list?.choiceLines ?? null, benchIsTarget: benchLook ? benchLook.says === 'thad' : null, boardCuesAfterCrossing: crossed?.cues?.count ?? null, boardAfterCrossing: crossed?.states?.floorboard ?? null, roundTripPreserved: back ? JSON.stringify(stateOf(back).counters) === JSON.stringify(initial.counters) : null, thadHeightAtDialoguePoint: list?.thad ? list.thad : null, loopBurst: burst, captures, log });
      await page.close();
    }
    const page = await chrome.newPage();
    const sheet = await contactSheet(page, sheetFrames);
    if (sheet) writeFileSync(resolve(ROOT, `${outDir}/contact-sheet.${sheet.ext}`), sheet.bytes);
    await page.close();
  } catch (error) {
    failures.push(`run: ${error.message}`);
  } finally { await chrome.close(); server.stop(); }
  if (dirty && !process.argv.includes('--allow-dirty')) failures.push('working tree dirty; re-run with --allow-dirty to record it');
  const out = { schema: 1, note: 'ROOM 5 PLAYTEST FIXTURES, CONSTRUCTED AND MEASURED (doc 36 Q111). Automation proves the state; Tyler proves whether it plays.', commit, workingTreeClean: dirty === '', candidates, visualState: flag('--state'), pace: flag('--pace') ? Number(flag('--pace')) : 1, durationSeconds: stamp(), fixtures: results, failures, passed: failures.length === 0, at: new Date().toISOString() };
  writeFileSync(resolve(ROOT, `${outDir}/proof.json`), `${JSON.stringify(out, null, 1)}\n`);
  console.log(failures.length ? `FAIL  ${failures.length} failure(s):\n  ${failures.join('\n  ')}` : `PASS  ${results.length} fixture(s), ${out.durationSeconds}s`);
  return failures.length ? 1 : 0;
}
process.exit(await main());
