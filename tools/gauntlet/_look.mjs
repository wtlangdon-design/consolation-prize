import { writeFileSync } from 'node:fs';
import { browser } from '../lib/chromium.mjs';
import { serve } from './proof.mjs';
import { runRoute } from './route.mjs';
const [out, fixture, room] = process.argv.slice(2);
const server = await serve(); const chrome = await browser();
try {
  const page = await chrome.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${server.url}/?fixture=${fixture}`);
  await page.waitForFunction(() => Boolean(window.__gauntlet?.probe?.()), { timeout: 60_000 });
  await page.waitForTimeout(2500);
  await runRoute(page, { actions: [{ do: 'enter', room }] });
  await page.waitForTimeout(4000);
  const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
  writeFileSync(`${out}/${room}-cast.png`, Buffer.from(url.split(',')[1], 'base64'));
} finally { await chrome.close(); server.stop(); }
