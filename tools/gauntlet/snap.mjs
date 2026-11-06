// One frame of the running game, for a brief or a look: `node tools/gauntlet/snap.mjs <query> <out.png> [wait ms]`.
// The query is the page's own (`fixture=r33-a&room=listening_chamber`); the frame is the full 1920x1080 window.
import { browser } from '../lib/chromium.mjs';
import { serve } from './proof.mjs';

const [query, out, wait = '1500'] = process.argv.slice(2);
const server = await serve();
const b = await browser();
try {
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${server.url}/?${query}`);
  await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
  await page.waitForTimeout(Number(wait));
  await page.screenshot({ path: out });
} finally {
  await b.close();
  server.stop();
}
