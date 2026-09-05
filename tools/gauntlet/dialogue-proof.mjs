import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { contactSheet, serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * DOC 30's DIALOGUE-CHOICE PRESENTATION, PROVEN IN THE EXECUTABLE GAME.
 *
 * Section 16 binds Room 1's stage driver as the acceptance scene: "the tree
 * opens with four choices in the lower interface. No stale prompt is drawn."
 * Section 14: the greeting is spoken; `node.prompt` is not drawn. This runs
 * that scene from the game's own start, and then Room 5's WIN_A1 -- whose
 * extracted prompt is the last line of its performed opening, so the defect
 * Tyler photographed (the line drawn again over the choices) is visible only
 * there -- and records, at every capture, what the probe counts: options on
 * offer, lines the choice interface draws, who is speaking. A capture with
 * the list open also measures the band of frame directly ABOVE the list,
 * where the prompt used to be drawn: it must be one flat colour.
 *
 *   node tools/gauntlet/dialogue-proof.mjs [--candidate from=to ...] [--state night] [--pace 1.25] [--allow-dirty]
 *
 * Writes renders/proofs/dialogue-prompt/proof.json, a contact sheet, and the
 * raw frames under raw-captures-ignored/.
 */
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const NATIVE_HEIGHT = 1080; const GLYPH = 6; const PANEL_GLYPH = 4;
const LINE = 10 * PANEL_GLYPH; const BOTTOM = NATIVE_HEIGHT - 3 * GLYPH; const PANEL_Y = 864;

const flag = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const candidates = [];
for (let at = 0; at < process.argv.length; at += 1) {
  if (process.argv[at] !== '--candidate') continue;
  const raw = process.argv[at + 1]; const split = raw.indexOf('=');
  candidates.push({ from: raw.slice(0, split), to: raw.slice(split + 1) });
}
const outDir = 'renders/proofs/dialogue-prompt'; const rawDir = `${outDir}/raw-captures-ignored`;
mkdirSync(resolve(ROOT, rawDir), { recursive: true });

/** The band above a list of `count` rows: from the backing's top to the first row. Flat when nothing is drawn there. */
function bandAboveList(png, count) {
  const top = BOTTOM - count * LINE;
  const y0 = Math.min(top - 2 * GLYPH, PANEL_Y) + 2; const y1 = top - 2;
  const seen = new Set();
  for (let y = y0; y < y1; y += 1) {
    for (let x = 0; x < png.width; x += 4) {
      const i = (y * png.width + x) * 4;
      seen.add(`${png.pixels[i]},${png.pixels[i + 1]},${png.pixels[i + 2]}`);
      if (seen.size > 8) return { rows: [y0, y1], colours: seen.size, flat: false };
    }
  }
  return { rows: [y0, y1], colours: seen.size, flat: seen.size <= 1 };
}

async function main() {
  const commit = git('rev-parse', 'HEAD'); const dirty = git('status', '--porcelain');
  const server = await serve(); const chrome = await browser();
  const failures = []; const captures = []; const log = [];
  const t0 = Date.now(); const stamp = () => Number(((Date.now() - t0) / 1000).toFixed(2));
  const query = (extra) => [...extra, ...candidates.map((c) => `candidate=${encodeURIComponent(`${c.from}=${c.to}`)}`),
    ...(flag('--state') ? [`state=${encodeURIComponent(flag('--state'))}`] : []), ...(flag('--pace') ? [`pace=${flag('--pace')}`] : [])].join('&');
  let page = null;
  const capture = async (name, why, assert = {}) => {
    await page.waitForTimeout(250);
    const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
    const f = await page.evaluate(() => window.__gauntlet?.probe?.());
    if (!url || !f) { failures.push(`${name}: no frame`); return; }
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    const file = `${rawDir}/${name}.png`; writeFileSync(resolve(ROOT, file), bytes);
    const record = { name, why, t: stamp(), file, hash: sha(bytes), room: f.room, says: f.says, options: f.options, choiceLines: f.choiceLines, performing: f.performing, pending: f.pending };
    if (assert.options !== undefined && f.options !== assert.options) failures.push(`${name}: ${f.options} option(s), expected ${assert.options}`);
    if (assert.choiceLines !== undefined && f.choiceLines !== assert.choiceLines) failures.push(`${name}: the choice interface draws ${f.choiceLines} line(s), expected ${assert.choiceLines}`);
    if (assert.speaker !== undefined && f.says !== assert.speaker) failures.push(`${name}: speaker ${JSON.stringify(f.says)}, expected ${JSON.stringify(assert.speaker)}`);
    if (assert.listOpen) {
      if (f.choiceLines !== f.options) failures.push(`${name}: ${f.choiceLines} line(s) drawn for ${f.options} option(s) -- something other than the choices is in the interface`);
      const band = bandAboveList(readPng(bytes), f.options);
      record.bandAboveList = band;
      if (!band.flat) failures.push(`${name}: the band above the list (rows ${band.rows.join('-')}) is not flat -- ${band.colours}+ colours: something is drawn where the prompt used to be`);
    }
    captures.push({ ...record, url });
    log.push({ t: stamp(), line: `capture ${name}: room ${f.room}, says ${JSON.stringify(f.says)}, options ${f.options}, choiceLines ${f.choiceLines}` });
  };
  const run = async (actions) => { for (const line of await runRoute(page, { actions })) log.push({ t: stamp(), line }); };
  try {
    // ---- ROOM 1, from the game's own start: doc 30 section 16.
    page = await chrome.newPage();
    await page.goto(`${server.url}/?${query([])}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));
    await run([{ do: 'wait', seconds: 2.5 }, { do: 'click', at: [960, 430] }, { do: 'waitFor', dialogue: true, upTo: 60 }]);
    // THREE ROWS AT THE OPEN, NOT FOUR: the exit is gated on the other three
    // having been asked (35e8c16), so doc 30 section 16's "four choices" is
    // the tree's full set, reached below once the three are spent.
    await capture('r1-01-tree-opens', 'the driver\'s tree opens: its choices in the lower interface, nothing above them', { options: 3, choiceLines: 3, speaker: null, listOpen: true });
    await run([{ do: 'option', option: 'drv2' }, { do: 'waitFor', says: 'thad', upTo: 20 }]);
    await capture('r1-02-thad-echoes-the-choice', 'the selected wording, over Thad, in his colour; the list is hidden', { speaker: 'thad', choiceLines: 0 });
    await run([{ do: 'waitFor', says: 'stage_driver', upTo: 20 }]);
    await capture('r1-03-driver-replies', 'the driver\'s reply over the driver', { speaker: 'stage_driver', choiceLines: 0 });
    await run([{ do: 'waitFor', says: 'thad', upTo: 20 }]);
    await capture('r1-04-thad-again', 'Thad\'s second line', { speaker: 'thad', choiceLines: 0 });
    await run([{ do: 'waitFor', says: 'stage_driver', upTo: 20 }]);
    await capture('r1-05-driver-closes', 'the driver\'s last line of the exchange', { speaker: 'stage_driver', choiceLines: 0 });
    await run([{ do: 'waitFor', dialogue: true, upTo: 30 }]);
    await capture('r1-06-choices-return', 'choices only after the exchange; the used progress row is kept and dimmed (errata 57\'s interim, every option behaves as retain)', { options: 3, choiceLines: 3, speaker: null, listOpen: true });
    await run([{ do: 'option', option: 'drv1' }, { do: 'waitFor', dialogue: true, upTo: 30 }, { do: 'option', option: 'drv3' }, { do: 'waitFor', dialogue: true, upTo: 30 }]);
    await capture('r1-07-four-choices', 'the three asked, the exit opens: four choices, four lines, nothing above them', { options: 4, choiceLines: 4, speaker: null, listOpen: true });
    await run([{ do: 'option', option: 'drv4' }, { do: 'waitFor', says: 'thad', upTo: 20 }, { do: 'waitFor', says: 'stage_driver', upTo: 20 }]);
    await capture('r1-08-wasnt-for-you', 'the exit\'s reply; the tree closes after it', { speaker: 'stage_driver', choiceLines: 0 });
    await run([{ do: 'waitFor', handedOver: true, upTo: 90 }]);
    await page.close();

    // ---- ROOM 5, WIN_A1: the performed opening, then the choices, and nothing else.
    page = await chrome.newPage();
    await page.goto(`${server.url}/?${query(['room=assay_office'])}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));
    await run([{ do: 'wait', seconds: 2 }, { do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'winnie' }, { do: 'waitFor', says: 'winnie', upTo: 40 }]);
    await capture('r5-01-opening-1', 'her first line, over her', { speaker: 'winnie', choiceLines: 0 });
    await run([{ do: 'waitFor', says: 'thad', upTo: 20 }]);
    await capture('r5-02-opening-2', 'his reply, over him', { speaker: 'thad', choiceLines: 0 });
    await run([{ do: 'waitFor', says: 'winnie', upTo: 20 }]);
    await capture('r5-03-opening-3', 'her last line of the opening, over her -- the line the prompt duplicates', { speaker: 'winnie', choiceLines: 0 });
    await run([{ do: 'waitFor', dialogue: true, upTo: 30 }]);
    await capture('r5-04-win-a1-choices', 'WIN_A1: three choices and nothing above them', { options: 3, choiceLines: 3, speaker: null, listOpen: true });
    await run([{ do: 'option', option: 'winnie1' }, { do: 'waitFor', dialogue: true, upTo: 30 }]);
    await capture('r5-05-win-a2-choices', 'WIN_A2 (noPrompt): four rows, unchanged', { options: 4, choiceLines: 4, speaker: null, listOpen: true });
    await run([{ do: 'option', option: 'winnie4' }, { do: 'waitFor', says: null, upTo: 30 }]);
    await capture('r5-06-after', 'control returned', { options: 0, choiceLines: 0 });

    // ---- MAIN STREET, the map seller's micro-tree: its prompt is a stage
    // direction with no opening, so the only change here is that the
    // direction is no longer drawn above the list. Recorded for the owner.
    page = await chrome.newPage();
    await page.goto(`${server.url}/?${query(['room=main_street'])}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));
    await run([{ do: 'wait', seconds: 2 }, { do: 'verb', verb: 'TALK_TO' }, { do: 'click', on: 'map_seller' }, { do: 'waitFor', dialogue: true, upTo: 40 }]);
    await capture('r2-01-map-seller-choices', 'the map seller\'s tree: choices only; the doc 07 stage direction that was drawn above them stays in data', { speaker: null, listOpen: true });
    await run([{ do: 'option', option: 1 }]);
    await page.waitForTimeout(1200);
    await capture('r2-02-map-seller-exchange', 'the first row chosen: the list hidden while the exchange plays', { choiceLines: 0 });

    const sheet = await contactSheet(page, captures.map((c) => ({ name: c.name, url: c.url })));
    if (sheet) writeFileSync(resolve(ROOT, `${outDir}/contact-sheet.${sheet.ext}`), sheet.bytes);
  } catch (error) {
    failures.push(`run: ${error.message}`); for (const line of error.routeLog ?? []) log.push({ t: stamp(), line });
  } finally { await chrome.close(); server.stop(); }
  if (dirty && !process.argv.includes('--allow-dirty')) failures.push('working tree dirty; re-run with --allow-dirty to record it');
  const out = { schema: 1, note: 'DOC 30 DIALOGUE-CHOICE PRESENTATION PROOF: Room 1\'s stage driver (section 16, binding) and Room 5\'s WIN_A1, in the executable game. choiceLines is what the choice interface draws; it must equal options. The band above an open list must be flat.', commit, workingTreeClean: dirty === '', candidates, visualState: flag('--state'), pace: flag('--pace') ? Number(flag('--pace')) : 1, durationSeconds: stamp(), log, captures: captures.map(({ url, ...rest }) => rest), failures, passed: failures.length === 0, at: new Date().toISOString() };
  writeFileSync(resolve(ROOT, `${outDir}/proof.json`), `${JSON.stringify(out, null, 1)}\n`);
  console.log(failures.length ? `FAIL  ${failures.length} failure(s):\n  ${failures.join('\n  ')}` : `PASS  ${captures.length} captures, ${out.durationSeconds}s`);
  return failures.length ? 1 : 0;
}
process.exit(await main());
