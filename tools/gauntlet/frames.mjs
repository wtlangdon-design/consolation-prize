/**
 * EVERY FRAME CHANGE, LOGGED. Tyler's global Thad audit (2026-09-04).
 *
 * `life.mjs` samples the probe once a second during waits, which is enough to
 * say where he was and not enough to say what he was DRAWN AS: a six-second
 * idle break falls between samples often enough, and a one-frame flash always
 * does. This runs a route with the probe polled every 100 ms throughout and
 * writes every change of clip, frame, position, facing or motion, so a claim
 * like "no locomotion frame while stationary for 60 seconds" is a count over
 * a log rather than an impression.
 *
 *   node tools/gauntlet/frames.mjs <room id> --route <name> --out <dir> [--state s] [--candidate from=to] [--allow-dirty]
 *
 * The route is the life vocabulary plus one action, `burst`: screenshots every
 * `every` seconds for `seconds`, so an idle -> walk -> idle transition can be
 * looked at frame by frame at gameplay scale. Writes frames.json (tracked) and
 * the burst stills under raw-captures-ignored/.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson } from '../lib/content.mjs';
import { serve } from './proof.mjs';
import { runRoute } from './route.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

async function main() {
  const roomId = process.argv[2];
  const flag = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
  const routeName = flag('--route'); const outDir = flag('--out');
  if (!roomId || !routeName || !outDir) { console.error('usage: frames.mjs <room id> --route <name> --out <dir>'); return 2; }
  const slug = roomId.replace(/_/g, '-');
  const rawDir = `${outDir}/raw-captures-ignored`; mkdirSync(resolve(ROOT, rawDir), { recursive: true });
  const candidates = [];
  for (let at = 0; at < process.argv.length; at += 1) {
    if (process.argv[at] !== '--candidate') continue;
    const raw = process.argv[at + 1]; const split = raw.indexOf('=');
    candidates.push({ from: raw.slice(0, split), to: raw.slice(split + 1) });
  }
  const spec = readJson(`proofs/spec/${slug}.json`);
  const entry = readJson(`tools/gauntlet/routes/${spec.route}.json`);
  const route = readJson(`tools/gauntlet/routes/${routeName}.json`);
  const record = readJson('content/actors/thad.json');
  const walkDirs = new Set(record.clips.filter((c) => c.id === 'walk' || c.id === 'farwalk').flatMap((c) => c.frames.map((f) => f.replace(/\/[^/]+$/, ''))));
  const commit = git('rev-parse', 'HEAD'); const dirty = git('status', '--porcelain');
  const pace = flag('--pace');
  const server = await serve(); const chrome = await browser();
  const t0 = Date.now(); const stamp = () => Number(((Date.now() - t0) / 1000).toFixed(3));
  const changes = []; const bursts = []; const log = []; let last = null; let polling = false; let samples = 0;
  try {
    const page = await chrome.newPage();
    const visualState = flag('--state');
    const query = [...candidates.map((c) => `candidate=${encodeURIComponent(`${c.from}=${c.to}`)}`), ...(visualState ? [`state=${encodeURIComponent(visualState)}`] : []), ...(pace ? [`pace=${encodeURIComponent(pace)}`] : [])].join('&');
    await page.goto(query ? `${server.url}/?${query}` : server.url);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.evaluate(() => window.__gauntlet?.arm?.({}));
    for (const line of await runRoute(page, entry)) log.push({ t: stamp(), line });
    const arrived = await page.evaluate(() => window.__gauntlet?.probe?.());
    if (arrived?.room !== roomId) throw new Error(`entry route ended in ${arrived?.room}, not ${roomId}`);
    log.push({ t: stamp(), line: `in ${roomId}; route ${routeName}: ${route.actions.length} action(s); polling every 100 ms` });
    const poll = async () => {
      if (polling) return; polling = true;
      try {
        const f = await page.evaluate(() => window.__gauntlet?.probe?.());
        const m = f?.movers?.thad; if (!m) return;
        samples += 1;
        // BOARDS, CAPTIONS AND CUES ARE LOGGED TOO (Room 5's floorboard, 2026-09-05): the
        // object states the probe reports, whether a world caption is up, and how
        // many doc 45 cues have fired -- so 'one creak per crossing' is a count.
        const now = { clip: m.clip, frame: String(m.from ?? '').split('/').pop(), dir: String(m.from ?? '').replace(/\/[^/]+$/, ''), at: m.at, facing: m.facing, moving: m.moving, height: m.height, says: f.says, options: f.options, states: JSON.stringify(f.states ?? {}), caption: Boolean(f.caption), cues: f.cues?.count ?? 0, lastCue: f.cues?.last ?? null };
        const changed = !last || ['clip', 'frame', 'facing', 'moving', 'states', 'caption', 'cues', 'says'].some((k) => last[k] !== now[k]) || last.at[0] !== now.at[0] || last.at[1] !== now.at[1];
        if (changed) changes.push({ t: stamp(), ...now, locomotionWhileStill: !now.moving && walkDirs.has(now.dir) });
        last = now;
      } catch { /* page busy */ } finally { polling = false; }
    };
    const timer = setInterval(poll, 100);
    for (const [index, action] of route.actions.entries()) {
      if (action.do === 'burst') {
        const every = Math.max(0.1, action.every ?? 0.4); const until = Date.now() + (action.seconds ?? 5) * 1000; let n = 0;
        while (Date.now() < until) {
          const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
          const f = await page.evaluate(() => window.__gauntlet?.probe?.());
          if (url) {
            const bytes = Buffer.from(url.split(',')[1], 'base64'); const file = `${rawDir}/${action.name}-${String(n).padStart(2, '0')}.png`;
            writeFileSync(resolve(ROOT, file), bytes); const m = f?.movers?.thad ?? {};
            bursts.push({ burst: action.name, n, t: stamp(), file, hash: sha(bytes), clip: m.clip, frame: String(m.from ?? '').split('/').pop(), at: m.at, moving: m.moving, height: m.height, facing: m.facing, states: f?.states ?? {}, caption: Boolean(f?.caption), cues: f?.cues?.count ?? 0 }); n += 1;
          }
          await page.waitForTimeout(every * 1000);
        }
        log.push({ t: stamp(), line: `burst ${action.name}: ${n} stills` });
        continue;
      }
      try { for (const line of await runRoute(page, { actions: [action] })) log.push({ t: stamp(), line }); }
      catch (error) { log.push({ t: stamp(), line: `FAILED action ${index + 1} (${action.do}): ${error.message}` }); break; }
    }
    clearInterval(timer);
  } finally { await chrome.close(); server.stop(); }
  const still = changes.filter((c) => !c.moving);
  const offences = changes.filter((c) => c.locomotionWhileStill);
  const clipsSeen = [...new Set(changes.map((c) => c.clip))];
  const out = { schema: 1, room: roomId, route: routeName, commit, workingTreeClean: dirty === '', candidates, visualState: flag('--state'), pace: pace ? Number(pace) : 1, durationSeconds: stamp(), samples,
    summary: { changes: changes.length, clipsSeen, locomotionFramesWhileStationary: offences.length, idleBreaks: changes.filter((c, i) => c.clip === 'idle-break' && changes[i - 1]?.clip !== 'idle-break').length },
    changes, bursts, log, at: new Date().toISOString() };
  mkdirSync(resolve(ROOT, outDir), { recursive: true });
  writeFileSync(resolve(ROOT, `${outDir}/frames.json`), `${JSON.stringify(out, null, 1)}\n`);
  console.log(`${offences.length === 0 ? 'PASS' : 'FAIL'}  ${roomId} ${routeName}: ${changes.length} changes over ${stamp()}s, ${samples} samples, clips ${clipsSeen.join('/')}, locomotion-while-still ${offences.length}`);
  return offences.length === 0 ? 0 : 1;
}
process.exit(await main());
