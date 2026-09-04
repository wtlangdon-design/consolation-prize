import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { contactSheet, serve } from './proof.mjs';
import { runRoute } from './route.mjs';

/**
 * A DETERMINISTIC ROOM-LIFE PROOF. Tyler's ruling 47: no video subsystem.
 *
 * The four-panel proof answers "is this room technically admissible" at four
 * instants. This answers "does it stay coherent and alive for about a minute
 * of play": the same runtime, the same probe, the same route vocabulary, and
 * full-frame stills at NAMED STEPS of a route -- a `capture` action, which is
 * the one word the gauntlet's vocabulary lacked and the smallest addition
 * that could express the requirement.
 *
 *   node tools/gauntlet/life.mjs <room id> --candidate from=to [--allow-dirty]
 *
 * Reads proofs/spec/<room>.json for the ENTRY route and
 * tools/gauntlet/routes/<room>-life.json for the life route. Writes
 * renders/proofs/<room>/life/ -- life.json (tracked), contact-sheet (tracked),
 * raw-captures-ignored/ (not).
 *
 * FAILS on: the wrong room at a capture; a requested candidate not drawn; any
 * declared asset not loaded; a mover drawn as a stub or fallback; a page
 * error; a route step that times out; an assertion a capture declares.
 */

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

async function main() {
  const roomId = process.argv[2];
  if (!roomId) { console.error('usage: life.mjs <room id> [--candidate from=to] [--allow-dirty]'); return 2; }
  const slug = roomId.replace(/_/g, '-');
  const outDir = `renders/proofs/${slug}/life`;
  const rawDir = `${outDir}/raw-captures-ignored`;
  mkdirSync(resolve(ROOT, rawDir), { recursive: true });

  const candidates = [];
  for (let at = 0; at < process.argv.length; at += 1) {
    if (process.argv[at] !== '--candidate') continue;
    const raw = process.argv[at + 1];
    const split = raw.indexOf('=');
    const from = raw.slice(0, split); const to = raw.slice(split + 1);
    if (!to.startsWith('art/staging/')) { console.error(`--candidate ${to} is not staged`); return 2; }
    candidates.push({ from, to, hash: sha(readFileSync(resolve(ROOT, to))) });
  }
  const spec = readJson(`proofs/spec/${slug}.json`);
  const entry = readJson(`tools/gauntlet/routes/${spec.route}.json`);
  const life = readJson(`tools/gauntlet/routes/${slug}-life.json`);
  const room = readJson('content/manifest.json').rooms.map((p) => readJson(p)).find((r) => r.id === roomId);
  const commit = git('rev-parse', 'HEAD');
  const dirty = git('status', '--porcelain');
  const allowDirty = process.argv.includes('--allow-dirty');

  const server = await serve();
  const chrome = await browser();
  const failures = [];
  const events = [];
  const captures = [];
  const pageErrors = [];
  const t0 = Date.now();
  const stamp = () => Number(((Date.now() - t0) / 1000).toFixed(2));
  const log = (line) => { events.push({ t: stamp(), line }); console.log(`    [${stamp().toFixed(1).padStart(6)}s] ${line}`); };
  try {
    const page = await chrome.newPage();
    page.on('pageerror', (error) => pageErrors.push(String(error.message ?? error)));
    const query = candidates.map((c) => `candidate=${encodeURIComponent(`${c.from}=${c.to}`)}`).join('&');
    await page.goto(query ? `${server.url}/?${query}` : server.url);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));

    log(`entry route ${spec.route}: ${entry.actions.length} action(s)`);
    for (const line of await runRoute(page, entry)) events.push({ t: stamp(), line });
    const arrived = await page.evaluate(() => window.__gauntlet?.probe?.());
    if (arrived?.room !== roomId) failures.push(`entry route ended in ${arrived?.room}, not ${roomId}`);
    log(`in ${arrived?.room}; life route: ${life.actions.length} action(s)`);


    for (const [index, action] of life.actions.entries()) {
      if (action.do !== 'capture') {
        // A ONE-SECOND TRACE DURING WAITS. The event log is the life proof's
        // spine, and a wait that records nothing is a minute of the room
        // nobody can read afterwards: which line was up, who owned the body,
        // where Thad was. Sampled, not streamed -- no video subsystem.
        let tracing = null;
        if (action.do === 'wait' || action.do === 'waitFor') {
          tracing = setInterval(async () => {
            try {
              const f = await page.evaluate(() => window.__gauntlet?.probe?.());
              if (f) events.push({ t: stamp(), trace: { says: f.says, control: f.control, beat: f.beat,
                performing: f.performing ?? null, options: f.options, thad: f.movers.thad?.at ?? null,
                moving: f.movers.thad?.moving ?? null } });
            } catch { /* page busy */ }
          }, 1000);
        }
        try {
          for (const line of await runRoute(page, { actions: [action] })) log(line);
        } catch (error) {
          if (tracing) clearInterval(tracing);
          failures.push(`life action ${index + 1} (${action.do}): ${error.message}`);
          for (const line of error.routeLog ?? []) log(line);
          break;
        }
        if (tracing) clearInterval(tracing);
        continue;
      }
      await page.waitForTimeout(300);
      const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
      const frame = await page.evaluate(() => window.__gauntlet?.probe?.());
      if (!url || !frame) { failures.push(`capture ${action.name}: no frame`); continue; }
      const bytes = Buffer.from(url.split(',')[1], 'base64');
      const file = `${rawDir}/${action.name}.png`;
      writeFileSync(resolve(ROOT, file), bytes);
      const stubs = Object.entries(frame.movers).filter(([, m]) => m.drawn !== 'sprite' || m.fallback).map(([id, m]) => `${id}:${m.drawn}`);
      const missing = frame.assets.filter((a) => !a.loaded).map((a) => a.path);
      const record = {
        name: action.name, why: action.why ?? null, t: stamp(), file, hash: sha(bytes),
        room: frame.room, clock: frame.clock, control: frame.control, says: frame.says, options: frame.options,
        flags: frame.flags, counters: frame.counters, camera: frame.camera,
        movers: frame.movers,
        assets: frame.assets.map((a) => ({ ...a, hash: existsSync(resolve(ROOT, a.drawn ?? a.path)) ? sha(readFileSync(resolve(ROOT, a.drawn ?? a.path))) : null })),
        stubs, missingAssets: missing,
      };
      captures.push({ ...record, url });
      log(`capture ${action.name}: room ${frame.room}, says ${JSON.stringify(frame.says)}, options ${frame.options}, control ${frame.control}`);

      const expectRoom = action.name.includes('records') ? 'stub_assay_records' : roomId;
      if (frame.room !== expectRoom) failures.push(`capture ${action.name}: room is ${frame.room}, expected ${expectRoom}`);
      if (stubs.length) failures.push(`capture ${action.name}: stub or fallback drew -- ${stubs.join(', ')}`);
      if (missing.length) failures.push(`capture ${action.name}: asset(s) never loaded -- ${missing.join(', ')}`);
      if (frame.room === roomId) {
        for (const wanted of candidates) {
          const asset = frame.assets.find((a) => a.path === wanted.from);
          if (!asset || !asset.candidate || asset.drawn !== wanted.to || !asset.loaded) {
            failures.push(`capture ${action.name}: candidate ${wanted.to} not drawn for ${wanted.from}`);
          } else if (record.assets.find((a) => a.path === wanted.from)?.hash !== wanted.hash) {
            failures.push(`capture ${action.name}: candidate ${wanted.to} changed hash mid-run`);
          }
        }
        for (const npcId of room.ambient ?? []) {
          const npc = readJson(`content/ambient/${npcId.replace(/_/g, '-')}.json`);
          const sheet = frame.assets.find((a) => a.path === npc.sprite?.sheet);
          if (!sheet?.loaded) failures.push(`capture ${action.name}: ${npcId}'s sheet is not loaded -- she is absent`);
          for (const prop of npc.sprite?.props ?? []) {
            const propSheet = frame.assets.find((a) => a.path === prop.sheet);
            if (!propSheet?.loaded) failures.push(`capture ${action.name}: ${npcId}'s prop ${prop.sheet} is not loaded`);
          }
        }
      }
      // `says` is the SPEAKER of the line on screen, never the words (Probe.ts).
      if (action.assert?.noSpeaker && frame.says !== null) {
        failures.push(`capture ${action.name}: a line by ${frame.says} is up, and none should be -- `
          + `at ACT ${frame.counters.ACT ?? 1} the bench is not a target and the click was floor`);
      }
      if (action.assert?.speaker && frame.says !== action.assert.speaker) {
        failures.push(`capture ${action.name}: expected a line by ${action.assert.speaker} to be up, `
          + `and the speaker is ${JSON.stringify(frame.says)} -- the action produced no line, or the capture missed its hold`);
      }
      if (action.name === '08-dialogue-open' && !(frame.options > 0)) failures.push('capture 08: no dialogue options on offer');
    }
    for (const error of pageErrors) failures.push(`page error: ${error}`);
    if (dirty && !allowDirty) failures.push('working tree dirty; re-run with --allow-dirty to record it');

    const sheet = await contactSheet(page, captures.map((c) => ({ name: c.name, url: c.url })));
    writeFileSync(resolve(ROOT, `${outDir}/contact-sheet.${sheet.ext}`), sheet.bytes);
    const result = {
      schema: 1,
      note: 'ROOM LIFE PROOF: full-frame stills at named steps of a deterministic route, with the probe state at each. Technical coherence only -- says nothing about whether the room is any good.',
      room: roomId, commit, workingTreeClean: dirty === '', dirtyAllowed: allowDirty,
      candidates: candidates.map((c) => ({ declared: c.from, rendered: c.to, hash: c.hash })),
      entryRoute: spec.route, lifeRoute: `${slug}-life`, durationSeconds: stamp(),
      events, captures: captures.map(({ url, ...rest }) => rest), failures, passed: failures.length === 0,
      at: new Date().toISOString(),
    };
    writeFileSync(resolve(ROOT, `${outDir}/life.json`), `${JSON.stringify(result, null, 1)}\n`);
    console.log(`\nlife proof: ${outDir}/life.json  (${captures.length} capture(s), ${result.durationSeconds}s)`);
    console.log(failures.length ? `FAIL  ${failures.length} failure(s):\n  ${failures.join('\n  ')}` : `PASS  ${roomId} stayed coherent for ${result.durationSeconds}s`);
    return failures.length ? 1 : 0;
  } finally {
    await chrome.close();
    server.stop();
  }
}
process.exit(await main());
