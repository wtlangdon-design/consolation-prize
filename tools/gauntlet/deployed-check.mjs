/**
 * WHAT DOES THE PUBLIC PLAYTEST URL ACTUALLY LOAD? The agent proxy cannot reach
 * github.io, so this rebuilds the deployed commit exactly as pages.yml does
 * (BASE_PATH=/consolation-prize/ npm run build), serves dist under that base,
 * loads the day and night playtest URLs in headless Chromium, and records
 * every asset response by URL and status, plus a screenshot of each. Run from
 * the repo root with S=<scratch dir holding site/consolation-prize -> dist>,
 * SHA=<deployed sha>, ROOT=<repo>. Evidence, not a proof.
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const S = process.env.S; const port = 8765;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: `${S}/site`, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const base = `http://127.0.0.1:${port}/consolation-prize/`;
const DAY = `${base}?room=assay_office&candidate=art/backgrounds/room-05-assay-office.png=art/staging/room-05/plate-02/candidate-1920x864.png`;
const NIGHT = `${base}?room=assay_office&state=night&candidate=art/backgrounds/room-05-assay-office.png=art/staging/room-05/plate-03-night-lift/candidate-1920x864.png&candidate=art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png=art/staging/room-05/winnie-02-counter/winnie-counter-sheet-night-lamp.png&candidate=art/staging/room-05/winnie-02-counter/inkstand.png=art/staging/room-05/winnie-02-counter/inkstand-night-lamp.png&candidate=art/staging/room-05/floorboard/board-rest.png=art/staging/room-05/floorboard/board-rest-night.png&candidate=art/staging/room-05/floorboard/board-pressed.png=art/staging/room-05/floorboard/board-pressed-night.png`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const out = { deployedSha: process.env.SHA, served: 'dist built with BASE_PATH=/consolation-prize/ exactly as pages.yml, served under /consolation-prize/', runs: [] };
for (const [name, url] of [['day', DAY], ['night', NIGHT]]) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const responses = []; const errors = [];
  page.on('response', (r) => { if (r.request().resourceType() !== 'document') responses.push({ url: r.url().replace(base, ''), status: r.status() }); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url); await page.waitForTimeout(9000);
  await page.screenshot({ path: `${S}/deployed-${name}.png` });
  const interesting = responses.filter((r) => /assay-office|room-05|staging|thad-|winnie|hanging|content\/rooms|index-/.test(r.url));
  const legacy = responses.filter((r) => r.url.endsWith('art/backgrounds/room-05-assay-office.png'));
  const bad = responses.filter((r) => r.status >= 400);
  out.runs.push({ name, url: url.replace(base, 'https://wtlangdon-design.github.io/consolation-prize/'), roomJson: responses.find((r) => r.url.includes('content/rooms/assay-office.json'))?.status ?? 'not requested',
    plate: responses.find((r) => r.url.includes('candidate-1920x864.png'))?.url ?? 'no candidate plate requested', legacyPlateRequested: legacy.length > 0,
    winnieSheet: responses.find((r) => r.url.includes('winnie-counter-sheet'))?.url ?? 'not requested', inkstand: responses.find((r) => r.url.includes('inkstand'))?.url ?? 'not requested',
    lampOverlay: responses.find((r) => r.url.includes('hanging-lamp-overlay'))?.status ?? 'not requested', thadClips: responses.filter((r) => r.url.includes('art/actors/thad-')).length,
    failures: bad.map((r) => `${r.status} ${r.url}`).slice(0, 10), pageErrors: errors.slice(0, 5), responsesSeen: responses.length });
  await page.close();
}
await browser.close(); server.kill();
writeFileSync(`${process.env.ROOT}/proofs/room-05/deployed-check.json`, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out, null, 1));
