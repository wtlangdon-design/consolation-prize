import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * EVERYONE LOOKS WHERE THEY ARE SUPPOSED TO. Tyler, 2026-11-06, of Duel Three:
 * "As long as everyone is supposed to be looking where they're looking it
 * should be good." They were not: the generator drew all eleven townspeople
 * looking left whatever the brief asked, so the crowd on the left stared away
 * from the duel, and one judge looked away from both duellists.
 *
 * A figure that must look somewhere declares `faces` -- "left", "right" or
 * "front" -- and the rest frame is measured: in the top 16% of the figure, the
 * face's skin centroid against the whole head's. Measured: Fanshawe turned
 * right +11.6; the townspeople as drawn -2 to -9; a face to the front within 3.
 * (tools/art/room02-duel-town.py holds the crowds' people to the same measure.)
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));

export function facing(png, [fx, fy, w, h]) {
  const px = (x, y) => { const i = ((fy + y) * png.width + fx + x) * 4; return png.pixels.slice(i, i + 4); };
  let top = -1; let bottom = -1;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (px(x, y)[3] > 128) { if (top < 0) top = y; bottom = y; }
  const rows = Math.max(4, Math.floor((bottom - top) * 0.16));
  let hx = 0; let hn = 0; let sx = 0; let sn = 0;
  for (let y = top; y < top + rows; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b, a] = px(x, y);
      if (a <= 128) continue;
      hx += x; hn += 1;
      if (r > 150 && g > 95 && r - b > 45) { sx += x; sn += 1; }
    }
  }
  return sn ? sx / sn - hx / hn : 0;
}

const figures = read('content/manifest.json').ambient.map(read).filter((npc) => npc.faces);
test('figures that must look somewhere say where', () => assert.ok(figures.length >= 5));
for (const npc of figures) {
  test(`${npc.id} faces ${npc.faces}`, () => {
    const off = facing(readPng(readFileSync(resolve(ROOT, npc.sprite.sheet))), npc.sprite.frames[0]);
    if (npc.faces === 'right') assert.ok(off > 1, `${npc.id} looks ${off.toFixed(1)} (left of front), not right`);
    else if (npc.faces === 'left') assert.ok(off < -1, `${npc.id} looks ${off.toFixed(1)}, not left`);
    else assert.ok(Math.abs(off) <= 3, `${npc.id} looks ${off.toFixed(1)}, not to the front`);
  });
}
