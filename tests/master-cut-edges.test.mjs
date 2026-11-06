import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * NO KEY ON THE EDGE OF A FIGURE CUT FROM THE CAST MASTER. Tyler, 2026-11-06,
 * zoomed on the redrawn Registrar: purple on his hair, pink on his ear and
 * sleeve. The grid snap took each 4x4 block's median before keying, so a block
 * half figure and half #FF00FF became a blended art pixel the keyer kept, and
 * the despill (equal parts out of red and blue) left warm figures a maroon and
 * purple ring. tools/art/cast-unify-cut.py now gives an edge block only its
 * pure figure pixels, or makes it backdrop.
 *
 * Held for every figure whose sheet was cut from the locked master (errata 101:
 * its provenance spec is derivedFrom master-02): within RIM px of transparency,
 * no more than SHARE of the pixels are key -- blue at least 12 over green,
 * (r + b) / 2 - g at least 25, and more magenta by OVER than the figure just
 * inside it (the median of its solid pixels within 4 px that are not edge).
 * Purple needs blue above green, so a warm skin outline is not key; and real
 * purple -- Ozymandia's hair, which falls to her edge -- continues inward, so
 * it is not key either. Measured: Thad 0; the four first cuts 1.5% to 3.3%; recut
 * 0. Older sheets lit purple all over by a night relight are not master cuts
 * and are replaced from the master as it goes.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const RIM = 2;
const SHARE = 0.005;
const OVER = 20;

const fromMaster = (npc) => {
  const spec = npc.sprite?.provenance;
  if (!spec?.endsWith('.spec.json')) return false;
  try { return JSON.parse(readFileSync(resolve(ROOT, spec), 'utf8')).derivedFrom === 'art/staging/cast-master/master-02.png'; } catch { return false; }
};
const figures = readdirSync(resolve(ROOT, 'content/ambient')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(resolve(ROOT, 'content/ambient', f), 'utf8'))).filter(fromMaster);

/** The share of a sheet's edge pixels (within RIM of transparency) that are the key. */
export function keyOnEdge(png) {
  const { width, height, pixels } = png;
  const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && pixels[(y * width + x) * 4 + 3] > 0;
  let rim = 0, key = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!solid(x, y)) continue;
      let edge = false;
      for (let dy = -RIM; dy <= RIM && !edge; dy += 1) for (let dx = -RIM; dx <= RIM; dx += 1) if (!solid(x + dx, y + dy)) { edge = true; break; }
      if (!edge) continue;
      rim += 1;
      const i = (y * width + x) * 4, r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      if (!(b >= g + 12 && (r + b) / 2 - g >= 25)) continue;
      const inner = [];
      for (let dy = -4; dy <= 4; dy += 1) {
        for (let dx = -4; dx <= 4; dx += 1) {
          const xx = x + dx, yy = y + dy;
          if (!solid(xx, yy)) continue;
          let deep = true;
          for (let ey = -RIM; ey <= RIM && deep; ey += 1) for (let ex = -RIM; ex <= RIM; ex += 1) if (!solid(xx + ex, yy + ey)) { deep = false; break; }
          if (!deep) continue;
          const j = (yy * width + xx) * 4;
          inner.push((pixels[j] + pixels[j + 2]) / 2 - pixels[j + 1]);
        }
      }
      inner.sort((p, q) => p - q);
      const within = inner.length ? inner[Math.floor(inner.length / 2)] : -255;
      if ((r + b) / 2 - g - within > OVER) key += 1;
    }
  }
  return rim ? key / rim : 0;
}

test('figures cut from the master are found', () => assert.ok(figures.length >= 4, `${figures.length}`));

for (const npc of figures) {
  test(`${npc.id}: no magenta key on the edge`, () => {
    const share = keyOnEdge(readPng(readFileSync(resolve(ROOT, npc.sprite.sheet))));
    assert.ok(share <= SHARE, `${(share * 100).toFixed(1)}% of ${npc.sprite.sheet}'s edge is the key`);
  });
}
