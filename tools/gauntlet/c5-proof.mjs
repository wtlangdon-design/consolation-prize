import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT } from '../lib/content.mjs';
import { serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * C5 AND WIN_B2 IN THE EXECUTABLE GAME. Doc 36 Q113; errata 66 A-C.
 *
 * From fixture r5-c (the log in hand, C5 not done): LOOK and LISTEN at the
 * log; the log on the wrong object and the wrong item on Winnie (pool lines,
 * nothing written); a cancelled approach (a floor click during the walk:
 * nothing written, the log still held); then the action -- USE the log on
 * Winnie, the walk to her dialogue point, the beat at contact with her
 * looking up, C5 landing, WIN_B2's four-line opening over its speakers, the
 * list of five; each row and what it writes; the exit; TALK TO again (the
 * list, no replay); a street-door round trip; TALK TO again; the log on
 * Winnie once more after C5 (a pool line, nothing re-written). Every
 * assertion is on ids, counts and state -- never words.
 *
 *   node tools/gauntlet/c5-proof.mjs [--candidate from=to ...] [--state night] [--pace 1.25] [--allow-dirty]
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
const outDir = 'renders/proofs/room-05-c5'; const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });
const LOG = 'padded_log';

async function main() {
  const commit = git('rev-parse', 'HEAD'); const dirty = git('status', '--porcelain');
  const server = await serve(); const chrome = await browser();
  const failures = []; const captures = []; const log = [];
  const t0 = Date.now(); const stamp = () => Number(((Date.now() - t0) / 1000).toFixed(2));
  const query = (extra) => [...extra, ...candidates.map((c) => `candidate=${encodeURIComponent(`${c.from}=${c.to}`)}`),
    ...(flag('--state') ? [`state=${encodeURIComponent(flag('--state'))}`] : []), ...(flag('--pace') ? [`pace=${flag('--pace')}`] : [])].join('&');
  let page = null;
  const probe = () => page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
  const fail = (line) => failures.push(line);
  const capture = async (name, why) => {
    await page.waitForTimeout(200);
    const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
    const f = await probe();
    if (!url || !f) { fail(`${name}: no frame`); return null; }
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    const file = `${rawDir}/${name}.png`; writeFileSync(resolve(ROOT, file), bytes);
    const t = f.movers?.thad;
    captures.push({ name, why, t: stamp(), file, hash: sha(bytes), room: f.room, says: f.says, options: f.options, choiceLines: f.choiceLines, dialogueAt: f.dialogueAt, selections: f.selections, puzzles: f.puzzles, flags: f.flags.filter((x) => /MOTT|LEDGER|QUEUE|SWINDLED/.test(x)), inventory: f.inventory, thad: t ? [t.at, t.facing, t.clip] : null, board: f.states?.floorboard ?? null, cues: f.cues?.count ?? 0, held: f.held ?? null });
    log.push({ t: stamp(), line: `capture ${name}: room ${f.room}, node ${f.dialogueAt?.node}, options ${f.options}, puzzles ${JSON.stringify(f.puzzles)}, says ${JSON.stringify(f.says)}` });
    return f;
  };
  const run = async (actions) => { for (const line of await runRoute(page, { actions })) log.push({ t: stamp(), line }); };
  const rows = () => page.evaluate(() => { const out = []; for (let i = 1; i <= 12; i += 1) { const r = window.__gauntlet?.optionRow(i); if (r) out.push(r.id); } return out; });
  // The inventory slot of the log, by id, through the probe's panel geometry.
  const clickItem = async (id) => {
    const slot = await page.evaluate((wanted) => (window.__gauntlet?.inventorySlot?.(wanted) ?? null), id);
    if (!slot) throw new Error(`no inventory slot for ${id}`);
    await run([{ do: 'click', at: [slot.x + slot.width / 2, slot.y + slot.height / 2] }]);
  };
  const open = async (extra) => {
    page = await chrome.newPage();
    page.on('pageerror', (e) => fail(`page error: ${String(e.message)}`));
    await page.goto(`${server.url}/?${query(extra)}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));
    await page.waitForTimeout(2000);
  };
  const talk = async () => run([{ do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'winnie' }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
  const choose = async (id) => run([{ do: 'option', option: id }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
  const leave = async (exitId) => run([{ do: 'option', option: exitId }, { do: 'waitFor', says: null, upTo: 40 }, { do: 'wait', seconds: 1 }]);
  const useLogOn = async (target) => { await run([{ do: 'verb', verb: 'USE' }]); await clickItem(LOG); await run([{ do: 'click', on: target }]); };
  try {
    await open(['fixture=r5-c']);
    let f = await capture('c01-ready', 'the ready state: the log held, C5 not complete');
    if (!f.inventory.includes(LOG)) fail('the log is not held in r5-c');
    if (f.puzzles?.C5) fail('C5 already has progress in r5-c');
    // ---- the item, examined
    await run([{ do: 'verb', verb: 'LOOK_AT' }]); await clickItem(LOG); await run([{ do: 'waitFor', says: 'thad', upTo: 10 }]);
    await capture('c02-look-log', 'LOOK at the submission log');
    await run([{ do: 'waitFor', says: null, upTo: 20 }, { do: 'verb', verb: 'LISTEN_TO' }]); await clickItem(LOG); await run([{ do: 'waitFor', says: 'thad', upTo: 10 }]);
    await capture('c03-listen-log', 'LISTEN to it');
    await run([{ do: 'waitFor', says: null, upTo: 20 }]);
    // ---- wrong: the log on the scales
    await useLogOn('scales'); await run([{ do: 'waitFor', says: 'thad', upTo: 20 }]);
    f = await capture('c04-log-on-scales', 'the log on the wrong object: a pool line');
    if (f.puzzles?.C5) fail('the log on the scales wrote C5');
    await run([{ do: 'waitFor', says: null, upTo: 20 }]);
    // ---- wrong: the deed on Winnie
    await run([{ do: 'verb', verb: 'USE' }]); await clickItem('deed'); await run([{ do: 'click', on: 'winnie' }, { do: 'waitFor', says: 'thad', upTo: 20 }]);
    f = await capture('c05-deed-on-winnie', 'an unrelated item on Winnie: the people pool');
    if (f.puzzles?.C5) fail('the deed on Winnie wrote C5');
    if (f.dialogueAt?.tree) fail('the deed on Winnie opened a tree');
    await run([{ do: 'waitFor', says: null, upTo: 20 }]);
    // ---- the cancelled approach: start far, use the log, click the floor mid-walk
    await run([{ do: 'click', at: [1750, 770] }, { do: 'wait', seconds: 6 }]);
    await useLogOn('winnie'); await run([{ do: 'wait', seconds: 0.4 }, { do: 'click', at: [1500, 820] }, { do: 'wait', seconds: 5 }]);
    f = await capture('c06-cancelled', 'a change of mind mid-walk: nothing written, no tree, the log still held');
    if (f.puzzles?.C5) fail('a cancelled approach wrote C5');
    if (f.dialogueAt?.tree || f.options) fail('a cancelled approach opened a tree');
    if (!f.inventory.includes(LOG)) fail('a cancelled approach lost the log');
    // ---- THE ACTION
    await useLogOn('winnie');
    await run([{ do: 'wait', seconds: 0.8 }]);
    await capture('c07-approach', 'the walk to her dialogue point with the evidence');
    await run([{ do: 'waitFor', says: 'thad', upTo: 40 }]);
    f = await capture('c08-contact-first-line', 'contact: C5 landed at the beat, then his first line of WIN_B2 over him');
    if (f.puzzles?.C5 !== 'complete') fail(`at his first line C5 is ${f.puzzles?.C5}, expected complete`);
    if (!f.inventory.includes(LOG)) fail('the log was consumed');
    if (f.thad && (Math.abs(f.thad[0][0] - 930) > 6 || Math.abs(f.thad[0][1] - 760) > 6)) fail(`contact at ${f.thad[0]}, expected the dialogue point (930,760)`);
    await run([{ do: 'waitFor', says: 'winnie', upTo: 20 }]);
    await capture('c09-nine-years', 'her second line, over her, the ledger stopped');
    await run([{ do: 'waitFor', says: 'thad', upTo: 20 }]);
    await capture('c10-sorry', 'his third line');
    await run([{ do: 'waitFor', says: 'winnie', upTo: 20 }]);
    await capture('c11-counting', 'her fourth line');
    await run([{ do: 'waitFor', dialogue: true, upTo: 40 }]);
    f = await capture('c12-win-b2-list', 'WIN_B2: four rows and the exit, nothing above them');
    if (f.dialogueAt?.node !== 'WIN_B2') fail(`the tree opened on ${f.dialogueAt?.node}, expected WIN_B2`);
    if (f.options !== 5 || f.choiceLines !== 5) fail(`WIN_B2 offers ${f.options} rows and draws ${f.choiceLines}`);
    if (JSON.stringify(await rows()) !== JSON.stringify(['winnie1', 'winnie2', 'winnie3', 'winnie4', 'winniex'])) fail(`WIN_B2 rows out of authored order: ${await rows()}`);
    // ---- the rows, in the owner's order: comic, Mott, ledger, assay
    await choose('winnie4');
    f = await capture('c13-after-comic', 'the comic asked: retained, greyed');
    if (!(await rows()).includes('winnie4')) fail('the comic row vanished');
    await choose('winnie2');
    f = await capture('c14-after-mott', 'the Mott row asked: removed; T_NO_MOTT_GOLD');
    if ((await rows()).includes('winnie2')) fail('the Mott row is still offered');
    if (!f.flags.includes('T_NO_MOTT_GOLD')) fail('T_NO_MOTT_GOLD not written');
    await choose('winnie3');
    f = await capture('c15-after-ledger', 'the ledger row asked: removed; T_SECOND_LEDGER; the board untouched');
    if ((await rows()).includes('winnie3')) fail('the ledger row is still offered');
    if (!f.flags.includes('T_SECOND_LEDGER')) fail('T_SECOND_LEDGER not written');
    if (f.states?.floorboard !== 'rest') fail(`the floorboard is ${f.states?.floorboard} after the ledger row`);
    await choose('winnie1');
    f = await capture('c16-after-assay', 'the assay row asked: removed; C6 pending; no item');
    if ((await rows()).includes('winnie1')) fail('the assay row is still offered');
    if (f.puzzles?.C6 !== 'pending') fail(`C6 is ${f.puzzles?.C6}, expected pending`);
    if (f.inventory.includes('document_b')) fail('Document B appeared');
    if (JSON.stringify(await rows()) !== JSON.stringify(['winnie4', 'winniex'])) fail(`after the three: ${await rows()}`);
    await leave('winniex');
    f = await capture('c17-after-exit', 'control returned; she is back at work');
    if (f.options) fail('the list is still up after the exit');
    // ---- TALK TO again: the list, no replay
    await run([{ do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'winnie' }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
    f = await capture('c18-talk-again', 'TALK TO again: WIN_B2\'s list at once, the confrontation not replayed');
    if (f.dialogueAt?.node !== 'WIN_B2') fail(`TALK TO after C5 opened ${f.dialogueAt?.node}`);
    if (JSON.stringify(await rows()) !== JSON.stringify(['winnie4', 'winniex'])) fail(`rows on re-talk: ${await rows()}`);
    const spoke = log.filter((l) => l.t > (captures.at(-2)?.t ?? 0) && /reached \{"says":"winnie"\}/.test(l.line)).length;
    if (spoke) fail('a Winnie line played before the list on TALK TO after C5');
    await leave('winniex');
    // ---- a street-door round trip, then TALK TO
    await run([{ do: 'verb', verb: 'OPEN' }, { do: 'click', on: 'back_to_street' }, { do: 'waitFor', room: 'main_street', upTo: 40 }, { do: 'wait', seconds: 1.5 },
      { do: 'click', on: 'to_assay_office' }, { do: 'waitFor', room: 'assay_office', upTo: 40 }, { do: 'wait', seconds: 2 }]);
    await run([{ do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'winnie' }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
    f = await capture('c19-after-round-trip', 'after leaving and returning: the same list, the same state');
    if (f.dialogueAt?.node !== 'WIN_B2' || JSON.stringify(await rows()) !== JSON.stringify(['winnie4', 'winniex'])) fail('the round trip changed the list');
    if (f.puzzles?.C5 !== 'complete' || f.puzzles?.C6 !== 'pending') fail('the round trip changed the puzzles');
    if (!f.flags.includes('T_SECOND_LEDGER') || !f.flags.includes('T_NO_MOTT_GOLD')) fail('the round trip lost a topic');
    await leave('winniex');
    // ---- the log on Winnie again: a pool line, nothing re-written
    const before = JSON.stringify(f.puzzles);
    await useLogOn('winnie'); await run([{ do: 'waitFor', says: 'thad', upTo: 20 }]);
    f = await capture('c20-log-again', 'the log on Winnie after C5: the people pool, no second confrontation');
    if (JSON.stringify(f.puzzles) !== before) fail('using the log again changed the puzzles');
    if (f.dialogueAt?.tree) fail('using the log again opened a tree');
    await run([{ do: 'waitFor', says: null, upTo: 20 }]);
    await page.close();
  } catch (error) {
    fail(`run: ${error.message}`); for (const line of error.routeLog ?? []) log.push({ t: stamp(), line });
  } finally { await chrome.close(); server.stop(); }
  if (dirty && !process.argv.includes('--allow-dirty')) failures.push('working tree dirty; re-run with --allow-dirty to record it');
  const out = { schema: 1, note: 'C5 + WIN_B2 PROOF (doc 36 Q113): ids, counts and state from the probe, never words. Individual frames under raw-captures-ignored; no contact sheet, the frames are the record.', commit, workingTreeClean: dirty === '', candidates, visualState: flag('--state'), pace: flag('--pace') ? Number(flag('--pace')) : 1, durationSeconds: stamp(), log, captures, failures, passed: failures.length === 0, at: new Date().toISOString() };
  writeFileSync(resolve(ROOT, `${outDir}/proof.json`), `${JSON.stringify(out, null, 1)}\n`);
  console.log(failures.length ? `FAIL  ${failures.length} failure(s):\n  ${failures.join('\n  ')}` : `PASS  ${captures.length} captures, ${out.durationSeconds}s`);
  return failures.length ? 1 : 0;
}
process.exit(await main());
