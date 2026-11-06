import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * FURNITURE STAYS STILL WHILE A FIGURE MOVES. Sowerby's church sheet drew the pulpit's reading desk under
 * his hands in every pose, a different desk each time, so the book-rest jumped when he raised a finger
 * (found looking at every frame in the game, after Tyler's "Any other movement in the game we should
 * evaluate?"; errata 112 R). A figure that stands at a piece of the plate's furniture declares it
 * (`sprite.plateFurniture`: the furniture's outline in room pixels, and the row its top begins), and in no
 * frame may the figure draw there anything but skin -- hands may rest on it; the furniture is the plate's.
 * A band one art pixel deep inside the outline is let off: the one-level snap (errata 112 G) quantises
 * the figure's edge where it meets a slanted outline, and puts back a fringe of a few pixels there.
 */
const EDGE = 4;   // one art pixel at this figure's level (block ~3.4 px)
function nearEdge([x, y], poly, below) {
  if (Math.abs(y - below) < EDGE) return true;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [x1, y1] = poly[j]; const [x2, y2] = poly[i];
    const dx = x2 - x1; const dy = y2 - y1; const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L));
    if (Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) < EDGE) return true;
  }
  return false;
}
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const manifest = read('content/manifest.json');

function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const skin = (r, g, b) => r > 150 && g > 90 && r - b > 50 && r > g;

for (const path of manifest.ambient) {
  const npc = read(path);
  const places = [[npc.x, npc.y, npc.sprite], ...Object.values(npc.placements ?? {}).map((p) => [p.x ?? npc.x, p.y ?? npc.y, p.sprite])];
  for (const [px, py, sprite] of places) {
    const furn = sprite?.plateFurniture;
    if (!furn) continue;
    test(`${npc.id}: no frame redraws the plate's furniture`, () => {
      const png = readPng(readFileSync(resolve(ROOT, sprite.sheet)));
      for (const [fx, fy, w, h] of sprite.frames) {
        const left = px - Math.floor(w / 2); const top = py - h + 1;
        let drawn = 0;
        for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
          const i = ((fy + y) * png.width + fx + x) * 4;
          if (png.pixels[i + 3] <= 128) continue;
          const room = [left + x, top + y];
          if (!(inside(room, furn.polygon) || room[1] >= furn.below)) continue;
          if (nearEdge(room, furn.polygon, furn.below)) continue;
          if (!skin(png.pixels[i], png.pixels[i + 1], png.pixels[i + 2])) drawn += 1;
        }
        assert.ok(drawn <= 20, `${npc.id}'s frame at ${fx},${fy} draws ${drawn} px of its own over the plate's furniture: it will jump between poses`);
      }
    });
  }
}
