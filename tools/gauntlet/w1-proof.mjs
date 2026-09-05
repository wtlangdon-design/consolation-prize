import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { browser } from '../lib/chromium.mjs';
import { ROOT } from '../lib/content.mjs';
import { contactSheet, serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * W1 IN THE EXECUTABLE GAME. Doc 36 Q112. Errata 57's aftermath and doc 30's
 * selection counts, measured by the probe (counts and ids, never words):
 *
 *   Room 1  the driver's tree, from the game's start: unchanged -- three rows
 *           then four, the used rows kept and dimmed (retain, the interim).
 *   WIN_A1  the soil-assay row (remove) is gone after its selection and stays
 *           gone on re-entry; the list is its two survivors and the exit.
 *   piano   with T_TUNES_PIANOS (fixture w1-piano) the counted-repeat row is
 *           offered every time, its count advances 1, 2, 3, 4 and survives a
 *           street-door round trip.
 *   WIN_A2  the wait question's rephrase does not fire: no puzzle is complete.
 *
 *   node tools/gauntlet/w1-proof.mjs [--candidate from=to ...] [--state night] [--pace 1.25] [--allow-dirty]
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
const outDir = 'renders/proofs/w1-aftermath'; const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });

async function main() {
  const commit = git('rev-parse', 'HEAD'); const dirty = git('status', '--porcelain');
  const server = await serve(); const chrome = await browser();
  const failures = []; const captures = []; const log = [];
  const t0 = Date.now(); const stamp = () => Number(((Date.now() - t0) / 1000).toFixed(2));
  const query = (extra) => [...extra, ...candidates.map((c) => `candidate=${encodeURIComponent(`${c.from}=${c.to}`)}`),
    ...(flag('--state') ? [`state=${encodeURIComponent(flag('--state'))}`] : []), ...(flag('--pace') ? [`pace=${flag('--pace')}`] : [])].join('&');
  let page = null;
  const probe = () => page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
  const capture = async (name, why) => {
    await page.waitForTimeout(250);
    const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
    const f = await probe();
    if (!url || !f) { failures.push(`${name}: no frame`); return null; }
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    const file = `${rawDir}/${name}.png`; writeFileSync(resolve(ROOT, file), bytes);
    captures.push({ name, why, t: stamp(), file, hash: sha(bytes), url, room: f.room, says: f.says, options: f.options, choiceLines: f.choiceLines, dialogueAt: f.dialogueAt, selections: f.selections, puzzlesComplete: f.puzzlesComplete });
    log.push({ t: stamp(), line: `capture ${name}: node ${f.dialogueAt?.node}, options ${f.options}, selections ${JSON.stringify(f.selections)}` });
    return f;
  };
  const run = async (actions) => { for (const line of await runRoute(page, { actions })) log.push({ t: stamp(), line }); };
  const rows = () => page.evaluate(() => { const out = []; for (let i = 1; i <= 12; i += 1) { const r = window.__gauntlet?.optionRow(i); if (r) out.push(r.id); } return out; });
  const open = async (extra) => {
    page = await chrome.newPage();
    await page.goto(`${server.url}/?${query(extra)}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));
  };
  const talk = async () => run([{ do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'winnie' }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
  const choose = async (id) => run([{ do: 'option', option: id }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
  const leave = async (exitId) => run([{ do: 'option', option: exitId }, { do: 'waitFor', says: null, upTo: 40 }, { do: 'wait', seconds: 1 }]);
  try {
    // ---- ROOM 1: the driver, unchanged
    await open([]);
    await run([{ do: 'wait', seconds: 2.5 }, { do: 'click', at: [960, 430] }, { do: 'waitFor', dialogue: true, upTo: 60 }]);
    let f = await capture('r1-01-open', 'three rows at the open');
    if (f.options !== 3) failures.push(`Room 1: ${f.options} rows at the open, expected 3`);
    await choose('drv2');
    f = await capture('r1-02-after-drv2', 'the used progress row kept (retain, the interim) and counted once');
    if (!(await rows()).includes('drv2')) failures.push('Room 1: the used row vanished; the driver\'s tree has no authored aftermath and behaves as retain');
    if (f.selections?.drv2 !== 1) failures.push(`Room 1: drv2 counted ${f.selections?.drv2}, expected 1`);
    await choose('drv1'); await choose('drv3');
    f = await capture('r1-03-four', 'four rows once the three are asked');
    if (f.options !== 4) failures.push(`Room 1: ${f.options} rows after the three, expected 4`);
    await run([{ do: 'option', option: 'drv4' }, { do: 'waitFor', handedOver: true, upTo: 90 }]);
    await page.close();

    // ---- WIN_A1: remove
    await open(['fixture=r5-a']);
    await run([{ do: 'wait', seconds: 2 }]);
    await talk();
    f = await capture('r5-01-win-a1', 'the first visit: three rows');
    if (!(await rows()).includes('winnie1')) failures.push('WIN_A1: the soil-assay row is not offered on the first visit');
    await choose('winnie1');
    f = await capture('r5-02-win-a2', 'the row opened WIN_A2');
    if (f.dialogueAt?.node !== 'WIN_A2') failures.push(`WIN_A1: winnie1 led to ${f.dialogueAt?.node}, expected WIN_A2`);
    await leave('winnie4');
    await talk();
    f = await capture('r5-03-win-a1-again', 'WIN_A1 again: the removed row is gone');
    const again = await rows();
    if (again.includes('winnie1')) failures.push('WIN_A1: the remove row is still offered on re-entry');
    if (f.options !== 2) failures.push(`WIN_A1 on re-entry: ${f.options} rows, expected 2 (the topic and the exit)`);
    if (f.choiceLines !== f.options) failures.push('WIN_A1 on re-entry: lines drawn differ from the rows');
    await leave('winnie5');
    // a street-door round trip, then the row is still gone
    await run([{ do: 'verb', verb: 'OPEN' }, { do: 'click', on: 'back_to_street' }, { do: 'waitFor', room: 'main_street', upTo: 40 }, { do: 'wait', seconds: 1.5 },
      { do: 'click', on: 'to_assay_office' }, { do: 'waitFor', room: 'assay_office', upTo: 40 }, { do: 'wait', seconds: 2 }]);
    await talk();
    f = await capture('r5-04-win-a1-after-round-trip', 'after leaving the room: still gone');
    if ((await rows()).includes('winnie1')) failures.push('WIN_A1: the removed row came back after a room round trip');
    await leave('winnie5');
    await page.close();

    // ---- piano: counted-repeat
    await open(['fixture=w1-piano']);
    await run([{ do: 'wait', seconds: 2 }]);
    await talk();
    f = await capture('p-01-with-piano', 'the piano row is offered');
    if (!(await rows()).includes('winnie3')) failures.push('piano: the counted-repeat row is not offered with T_TUNES_PIANOS');
    for (let n = 1; n <= 4; n += 1) {
      await choose('winnie3');
      f = await capture(`p-0${n + 1}-selection-${n}`, `selection ${n} made; the row still offered, counted ${n}`);
      if (!(await rows()).includes('winnie3')) failures.push(`piano: the row vanished after selection ${n}`);
      if (f.selections?.winnie3 !== n) failures.push(`piano: counted ${f.selections?.winnie3} after selection ${n}`);
    }
    await leave('winnie5');
    await run([{ do: 'verb', verb: 'OPEN' }, { do: 'click', on: 'back_to_street' }, { do: 'waitFor', room: 'main_street', upTo: 40 }, { do: 'wait', seconds: 1.5 },
      { do: 'click', on: 'to_assay_office' }, { do: 'waitFor', room: 'assay_office', upTo: 40 }, { do: 'wait', seconds: 2 }]);
    await talk();
    f = await capture('p-06-after-round-trip', 'the count survives leaving the room');
    if (f.selections?.winnie3 !== 4) failures.push(`piano: the count after a round trip is ${f.selections?.winnie3}, expected 4`);
    // ---- WIN_A2: rephrase held back
    await choose('winnie1');
    f = await capture('p-07-win-a2', 'WIN_A2: no puzzle complete, so the wait question keeps its first wording');
    if ((f.puzzlesComplete ?? []).length) failures.push(`puzzles complete in a fresh state: ${f.puzzlesComplete}`);
    if (f.dialogueAt?.node !== 'WIN_A2') failures.push('WIN_A2 not reached');
    await leave('winnie4');
    const sheet = await contactSheet(page, captures.map((c) => ({ name: c.name, url: c.url })));
    if (sheet) writeFileSync(resolve(ROOT, `${outDir}/contact-sheet.${sheet.ext}`), sheet.bytes);
    await page.close();
  } catch (error) {
    failures.push(`run: ${error.message}`); for (const line of error.routeLog ?? []) log.push({ t: stamp(), line });
  } finally { await chrome.close(); server.stop(); }
  if (dirty && !process.argv.includes('--allow-dirty')) failures.push('working tree dirty; re-run with --allow-dirty to record it');
  const out = { schema: 1, note: 'W1 AFTERMATH PROOF (doc 36 Q112): counts and ids from the probe, never the words. Room 1 unchanged; WIN_A1 remove; the piano counted-repeat; WIN_A2 rephrase held back.', commit, workingTreeClean: dirty === '', candidates, visualState: flag('--state'), pace: flag('--pace') ? Number(flag('--pace')) : 1, durationSeconds: stamp(), log, captures: captures.map(({ url, ...rest }) => rest), failures, passed: failures.length === 0, at: new Date().toISOString() };
  writeFileSync(resolve(ROOT, `${outDir}/proof.json`), `${JSON.stringify(out, null, 1)}\n`);
  console.log(failures.length ? `FAIL  ${failures.length} failure(s):\n  ${failures.join('\n  ')}` : `PASS  ${captures.length} captures, ${out.durationSeconds}s`);
  return failures.length ? 1 : 0;
}
process.exit(await main());
