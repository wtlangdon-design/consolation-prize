/**
 * THE ACTED DIRECTIONS, PLAYED (doc 95; errata 141). Each scenario opens a
 * fixture, gets to the line, and keeps a frame every 0.3 s through the beat,
 * so a person can see the figure act it and nothing printed. A line waiting
 * for its click is clicked after 1.2 s, as a reader would. It asserts nothing:
 * `tests/acted-directions.test.ts` holds the rules; this is the look.
 *
 *   node tools/gauntlet/acted-proof.mjs <out-dir> [scenario ...]
 *
 * Writes <scenario>-NNN.png and log.txt (what the probe said at each frame).
 * A new A row in doc 95 gets a scenario here when it is wired.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { serve } from './proof.mjs';
import { runRoute } from './route.mjs';

const OUT = resolve(process.argv[2] ?? 'renders/proofs/acted-directions/raw-captures-ignored');
const only = process.argv.slice(3);
mkdirSync(OUT, { recursive: true });

const scenarios = {
  'filing-deed': { fixture: 'r7-f5', steps: [{ use: 'deed', world: [1000, 520] }], burst: 9 },
  'notarize': { fixture: 'r7-e', steps: [{ enter: 'claims_registrar' }], burst: 40 },
  'ozymandia': { fixture: 'r16-a', steps: [{ talk: 'ozymandia' }, { option: 'ozymandia5' }], burst: 18 },
  'sheng': { fixture: 'r28-a', steps: [{ talk: 'sheng' }, { option: 'sheng3' }], burst: 12 },
  'pratt': { fixture: 'r25-a', steps: [{ talk: 'pratt' }, { option: 'pratt3' }], burst: 10 },
  'frame': { fixture: 'r9-b', steps: [{ talk: 'frame' }, { option: 'frame3' }], burst: 10 },
  // Errata 193: the boundary men stand on the claim row now, not Main Street.
  'boundary': { fixture: 'r5-a', steps: [{ enter: 'claim_row' }, { wait: 4 }, { talk: 'boundary_a', world: [470, 520] }, { option: 'boundary2' }], burst: 16 },
  'winnie': { fixture: 'r5-a', steps: [{ flags: { T_FUNERAL_BOOKED: true } }, { talk: 'winnie' }, { option: 'winnie4' }], burst: 22 },
  // Errata 148's poses: the filing's stamp, signature and blot, the filing under glass, Pratt's hat and
  // boots, and Thad fitting the Mercantile's pickaxe back together in the dark.
  'filing-sample': { fixture: 'r7-f5', steps: [{ use: 'sample', world: [1000, 520] }], burst: 12 },
  'filing-sump': { fixture: 'r7-f5', steps: [{ flags: { F5_LAID: 4 } }, { talk: 'sump' }, { option: 'sump1' }], burst: 48 },
  // Documents A, B and D in hand (the held filing save), Act II's tree: About Document C.
  'sump-glass': { fixture: 'r7-f5-held', steps: [{ flags: { ACT: 2, F5_LAID: 0, T_DEATH_CERTIFIED: false, T_FILED: false } }, { talk: 'sump' }, { option: 'sump1c' }], burst: 12 },
  'pratt-hat': { fixture: 'r25-b', steps: [{ talk: 'pratt' }, { option: 'pratt7' }, { option: 'pratt5' }], burst: 14 },
  'pratt-boots': { fixture: 'r25-c', steps: [{ enter: 'prosperity' }, { talk: 'pratt_jump' }, { option: 'pratt3' }], burst: 12 },
  'pick-fit': { fixture: 'r33-b', steps: [{ use: 'pickaxe', on: 'every_rock_surface' }], burst: 24 },
  'deke-watch': { fixture: 'r5-a', steps: [{ enter: 'nugget' }, { talk: 'deke_vessel' }, { option: 'deke_vessel2' }, { option: 'deke_vessel3' }, { option: 'deke_vessel4' }], burst: 12 },
  'deke': { fixture: 'r5-a', steps: [{ enter: 'nugget' }, { talk: 'deke_vessel' }, { option: 'deke_vessel2' }, { option: 'deke_vessel3' }, { option: 'deke_vessel4' }, { option: 'deke_vessel6' }], burst: 20 },
  // Errata 311, acted-directions-3 wired: the street people's poses.
  'a3-letter': { fixture: 'r5-a', steps: [{ enter: 'lower_street' }, { wait: 3 }, { talk: 'letter_writer' }, { option: 'letter_writer7' }], burst: 12 },
  'a3-bottle': { fixture: 'r5-a', steps: [{ enter: 'lower_street' }, { wait: 3 }, { talk: 'bell_ringer' }, { option: 'bell_ringer6' }], burst: 12 },
  'a3-bell': { fixture: 'r5-a', steps: [{ enter: 'lower_street' }, { wait: 3 }, { talk: 'bell_ringer' }, { option: 'bell_ringer7' }], burst: 6 },
  'a3-bag': { fixture: 'r5-a', steps: [{ enter: 'main_street' }, { wait: 3 }, { talk: 'man_leaving_tomorrow' }, { option: 'leaving6' }], burst: 10 },
  'a3-map': { fixture: 'r5-a', steps: [{ enter: 'main_street' }, { wait: 3 }, { talk: 'map_seller' }, { option: 'map_seller6' }], burst: 6 },
  // Errata 308, the no-parentheticals sample: Act I from the swindle to the claim.
  'np-fanshawe-map': { fixture: 'r11-a', steps: [{ enter: 'fanshawe_office' }, { wait: 3 }, { talk: 'fanshawe' }, { option: 'fanshawe1' }], burst: 10 },
  'np-pratt': { fixture: 'r25-a', steps: [{ enter: 'pratts_claim' }, { wait: 3 }, { talk: 'pratt' }, { option: 'pratt1' }], burst: 10 },
  'np-raccoon': { fixture: 'r23-a', steps: [{ enter: 'prosperity' }, { wait: 3 }, { talk: 'raccoon' }, { option: 'raccoon1' }], burst: 8 },
  'np-egg': { fixture: 'r23-a', steps: [{ enter: 'prosperity' }, { wait: 3 }, { flags: { T_EGGS_IMPROVED: true } }, { use: 'eggs', on: 'hole' }], burst: 16 },
  // Errata 307: the toast takes the glass off the barrel, and puts it back.
  'deke-toast': { fixture: 'r5-a', steps: [{ enter: 'nugget' }, { flags: { T_PIKE_DEAD: false } }, { talk: 'deke_vessel' }, { option: 'deke_vessel9' }], burst: 6 },
};

const server = await serve();
const chrome = await browser();
const report = [];
try {
  for (const [name, sc] of Object.entries(scenarios)) {
    if (only.length && !only.includes(name)) continue;
    const page = await chrome.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto(`${server.url}/?fixture=${sc.fixture}`);
    await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
    await page.waitForTimeout(2500);
    const probe = () => page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
    const run = (actions) => runRoute(page, { actions });
    const clickItem = async (id) => {
      const slot = await page.evaluate((wanted) => (window.__gauntlet?.inventorySlot?.(wanted) ?? null), id);
      if (!slot) throw new Error(`no inventory slot for ${id}`);
      await run([{ do: 'click', at: [slot.x + slot.width / 2, slot.y + slot.height / 2] }]);
    };
    try {
      const last = sc.steps[sc.steps.length - 1];
      for (const step of sc.steps) {
        if (step.enter) await run([{ do: 'enter', room: step.enter }]);
        if (step.wait) await page.waitForTimeout(step.wait * 1000);
        if (step.flags) await run([{ do: 'flags', flags: step.flags }]);
        if (step.walk) { await run([{ do: 'click', at: step.walk }]); await page.waitForTimeout(14000); }
        if (step.talk) {
          await run([{ do: 'verb', verb: 'TALK_TO' }, step.world ? { do: 'click', world: step.world } : { do: 'click', on: step.talk }]);
          // A greeting waits for its clicks before the list opens.
          const until = Date.now() + 60_000;
          for (;;) {
            const f = await probe();
            if (f?.options > 0) break;
            if (Date.now() > until) { const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null); if (url) writeFileSync(resolve(OUT, `${name}-stuck.png`), Buffer.from(url.split(',')[1], 'base64')); throw new Error(`no list after TALK TO ${step.talk}: ${JSON.stringify(f).slice(0, 300)}`); }
            if (f?.waiting) await page.mouse.click(960, 300);
            await page.waitForTimeout(900);
          }
        }
        if (step.use) { await run([{ do: 'verb', verb: 'USE' }]); await clickItem(step.use); await run([step.world ? { do: 'click', world: step.world } : { do: 'click', on: step.on }]); }
        if (step.option) {
          await run([{ do: 'option', option: step.option }]);
          if (step !== last) await run([{ do: 'waitFor', dialogue: true, upTo: 60 }]);
        }
      }
      // THE BURST: a frame every 0.3 s; a line waiting for its click is clicked after 1.2 s, as a reader would.
      let waitingSince = null;
      const t0 = Date.now();
      let n = 0;
      while (Date.now() - t0 < sc.burst * 1000) {
        const f = await probe();
        const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
        const file = `${name}-${String(n).padStart(3, '0')}.png`;
        if (url) writeFileSync(resolve(OUT, file), Buffer.from(url.split(',')[1], 'base64'));
        report.push(`${name} ${file} t=${((Date.now() - t0) / 1000).toFixed(1)} says=${JSON.stringify(f?.says)} waiting=${f?.waiting} performing=${f?.performing} room=${f?.room}`);
        n += 1;
        if (f?.waiting) {
          waitingSince ??= Date.now();
          if (Date.now() - waitingSince > 1200) {
            await page.mouse.click(960, 300);
            waitingSince = null;
          }
        } else waitingSince = null;
        await page.waitForTimeout(300);
      }
    } catch (error) {
      report.push(`${name} FAILED: ${error.message.split('\n')[0]}`);
    }
    if (errors.length) report.push(`${name} page errors: ${errors.join(' | ')}`);
    await page.close();
  }
} finally {
  await chrome.close();
  server.stop();
}
writeFileSync(resolve(OUT, 'log.txt'), report.join('\n') + '\n');
console.log(report.filter((l) => /FAILED|errors/.test(l)).join('\n') || 'all scenarios ran');
process.exit(0);
