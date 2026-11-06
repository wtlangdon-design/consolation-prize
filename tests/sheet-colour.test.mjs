import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * NO FIGURE IS ONE FLAT COLOUR. Found 2026-11-06 while fixing Tyler's "the man
 * in the blue jacket is a bad cutout" at the funeral: Hob's exit walk had been
 * relit in place by every run of tools/art/room31-night.py until it was solid
 * blue (0, 0, 136) -- and it shipped, because nothing looked at a walk sheet's
 * colour. Every sheet a figure draws (its sprite and its exit walk) must keep
 * some red and green: no more than HALF of its opaque pixels may have both red
 * and green under 12. A night-lit figure keeps its colours (the funeral cast
 * measures under 5%).
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const sheets = new Set();
for (const p of read('content/manifest.json').ambient) {
  const n = read(p);
  for (const sp of [n.sprite, n.exit, ...Object.values(n.placements ?? {}).map((a) => a.sprite)]) if (sp?.sheet) sheets.add(sp.sheet);
}

export function flatShare(png) {
  let opaque = 0; let flat = 0;
  for (let i = 0; i < png.pixels.length; i += 4) {
    if (png.pixels[i + 3] <= 128) continue;
    opaque += 1;
    if (png.pixels[i] < 12 && png.pixels[i + 1] < 12) flat += 1;
  }
  return opaque ? flat / opaque : 0;
}

for (const sheet of sheets) {
  test(`${sheet} keeps its colours`, () => {
    const share = flatShare(readPng(readFileSync(resolve(ROOT, sheet))));
    assert.ok(share <= 0.5, `${(share * 100).toFixed(0)}% of ${sheet} has no red or green -- relit until it is one colour?`);
  });
}
