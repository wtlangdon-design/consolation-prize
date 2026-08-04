import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

/**
 * A browser, from whichever chromium this machine has.
 *
 * SHARED, because it was written for the gauntlet and the music renderer needed
 * it verbatim. Two copies would be two answers to "where is chromium" that
 * agree today, and the second consumer found the first one's answer by failing
 * without it -- `render-music.mjs` called `chromium.launch()` bare and stopped
 * on the first line it executed, having never been run at all.
 *
 * PLAYWRIGHT'S OWN RESOLUTION IS TRIED FIRST and is what CI uses, because
 * `npx playwright install chromium` puts the build this version expects
 * exactly where it looks. It is tried first and not only: a pre-provisioned
 * image ships whatever build it shipped with, and a package bump then asks
 * for a revision that is not on disk -- which is a fault in nothing, and
 * would otherwise stop the harness on the machine it was written on.
 */
export async function browser() {
  const attempts = [];
  try {
    return await chromium.launch();
  } catch (error) {
    attempts.push(String(error.message).split('\n')[0]);
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  let found = [];
  try {
    found = readdirSync(root)
      .filter((name) => name.startsWith('chromium-'))
      .sort()
      .reverse()
      .map((name) => resolve(root, name, 'chrome-linux/chrome'));
  } catch { /* no such directory: the first attempt's message is the answer */ }
  for (const executablePath of found) {
    try {
      return await chromium.launch({ executablePath });
    } catch (error) {
      attempts.push(String(error.message).split('\n')[0]);
    }
  }
  throw new Error(`no chromium would launch:\n  ${attempts.join('\n  ')}`);
}
