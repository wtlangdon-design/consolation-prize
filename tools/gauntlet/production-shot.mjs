import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

import { browser as launch } from '../lib/chromium.mjs';
import { ROOT } from '../lib/content.mjs';

/**
 * WHAT TYLER ACTUALLY SEES: the BUILT artifact, served the way Pages serves it.
 *
 * THE DEFECT THIS EXISTS FOR. Phase 2A was reviewed off composite sheets and
 * dev-server captures, and both were right; then Tyler opened the deployed
 * page and reported an old street and an empty saloon. The build was correct
 * and he was looking at a stale one -- but nothing in this repository could
 * have told either of us that, because nothing here had ever looked at the
 * production bundle as a picture. `deployed-check.mjs` asks whether the URLs
 * answer and the assets load, which is a different question from whether the
 * room has people in it.
 *
 * It also caught what the sheets could not: the man on the landing was
 * standing on the STRINGER of the staircase with nothing under his boots. A
 * composite drawn from the same numbers as the engine agrees with the engine
 * by construction; only the room itself disagrees.
 *
 *   npm run build   (BASE_PATH=/consolation-prize/)
 *   node tools/gauntlet/production-shot.mjs [room ...]
 */
const DIST = resolve(ROOT, 'dist');
const OUT = 'renders/opening-set-retrofit';
const PORT = 8791;
const SETTLE_MS = 14_000;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.ttf': 'font/ttf',
};

if (!existsSync(DIST)) {
  console.error('no dist/. Build first: BASE_PATH=/consolation-prize/ npm run build');
  process.exit(2);
}

// A SHOT IS `room` or `room@x,y[@x,y...]`: the trailing points are canvas
// positions Thad is walked to before the frame is taken, because "Thad beside
// the cast" is the comparison the owner asked for and an arrival frame does not
// give it. The play area is the top 864 rows of the window, so canvas
// coordinates are room coordinates in a room that does not scroll.
const shots = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['main_street_candidate', 'nugget_candidate'];

const server = createServer((request, response) => {
  let path = decodeURIComponent(request.url.split('?')[0]).replace(/^\/consolation-prize\//, '/');
  if (path === '/' || path === '') path = '/index.html';
  const file = resolve(DIST, `.${path}`);
  if (!existsSync(file) || !file.startsWith(DIST)) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(PORT, done));

mkdirSync(resolve(ROOT, OUT), { recursive: true });
const chrome = await launch();
const problems = [];
for (const shot of shots) {
  const [room, ...walks] = shot.split('@');
  const page = await chrome.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (error) => problems.push(`${room}: page error ${error.message}`));
  // A SHEET THAT 404s IS THE FAILURE MODE, not an aesthetic one: the renderer
  // draws nothing and says nothing, and the room is quietly empty.
  page.on('requestfailed', (request) => {
    // ERR_ABORTED IS NOT A MISSING ASSET. The title score is a 4.4 MB wav that
    // is still streaming when the page is closed after the shot, and closing it
    // aborts the transfer; that is this tool tidying up, not the bundle
    // failing. A file that is genuinely absent answers 404 and is caught by the
    // response handler below, which is the check this exists for.
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    problems.push(`${room}: FAILED ${request.url()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${room}: ${response.status()} ${response.url()}`);
  });
  await page.goto(`http://127.0.0.1:${PORT}/consolation-prize/?room=${encodeURIComponent(room)}`);
  await page.waitForTimeout(SETTLE_MS);
  for (const walk of walks) {
    const [x, y] = walk.split(',').map(Number);
    await page.mouse.click(x, y);
    await page.waitForTimeout(9000);
  }
  const suffix = walks.length ? `-at-${walks.join('-').replace(/,/g, '_')}` : '';
  const out = `${OUT}/phase2a-production-${room.replace(/_/g, '-')}${suffix}.png`;
  await page.screenshot({ path: resolve(ROOT, out) });
  console.log(`  ${shot} -> ${out}`);
  await page.close();
}
await chrome.close();
server.close();

console.log(problems.length
  ? `FAIL  ${problems.length} problem(s) in the production bundle`
  : `PASS  ${shots.length} shot(s) drawn from dist/, no page errors, nothing failed to load`);
for (const problem of problems.slice(0, 20)) console.log(`      x ${problem}`);
process.exit(problems.length ? 1 : 0);
