import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import { readPng } from '../tools/lib/png.mjs';

/**
 * A FIGURE ON RAISED BOARDS STANDS ON THEM. Tyler, 2026-11-06, of Duel Three's
 * judges on the hotel porch: "They're floating over the porch." Their feet were
 * at y 572, the foot of the hotel wall, above the boards; the street's walk
 * boxes cover that row, so nothing measured it. Sowerby, the same day, had
 * stood at the porch's very corner, "floating off the edge".
 *
 * A figure that stands on a porch, a step or a platform declares `standsOn`: the
 * surface's outline, measured on the plate. Held here: his feet -- the bottom
 * row of his rest frame, across the middle 60% of its drawn feet -- are inside
 * that outline, wherever he is drawn and at the size he is drawn.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));

/** Point in polygon (even-odd). */
export function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The feet's left and right x in room pixels: the bottom drawn row of the rest frame. */
export function feetSpan(png, [fx, fy, w, h], x, scale) {
  let row = h - 1;
  const opaque = (c, r) => png.pixels[((fy + r) * png.width + fx + c) * 4 + 3] > 128;
  while (row > 0 && ![...Array(w).keys()].some((c) => opaque(c, row))) row -= 1;
  const cols = [...Array(w).keys()].filter((c) => opaque(c, row) || opaque(c, Math.max(0, row - 2)));
  const left = Math.min(...cols); const right = Math.max(...cols);
  const half = (w * scale) / 2;
  return [x - half + left * scale, x - half + right * scale];
}

const manifest = read('content/manifest.json');
const declared = manifest.ambient.map(read).filter((npc) => npc.standsOn);
const rooms = new Map(manifest.rooms.map((p) => { const r = read(p); return [r.id, r]; }));
const manAt = (roomId, x, y) => {
  const near = new WalkBoxes(rooms.get(roomId).walkBoxes, () => true).nearest(x, y);
  return near ? heightIn(near.box, y) : 0;
};

test('figures on raised boards declare them', () => assert.ok(declared.length >= 4));

for (const npc of declared) {
  test(`${npc.id} stands on ${npc.standsOn.surface}`, () => {
    const sp = npc.sprite;
    const png = readPng(readFileSync(resolve(ROOT, sp.sheet)));
    // At the size the engine draws him: the room's man at his feet over figureHeight.
    const scale = sp.figureHeight ? manAt(npc.room, npc.x, npc.y) * (sp.stature ?? 1) / sp.figureHeight : 1;
    const [l, r] = feetSpan(png, sp.frames[0], npc.x, scale);
    const inner = [l + (r - l) * 0.2, (l + r) / 2, r - (r - l) * 0.2];
    for (const fx of inner) {
      assert.ok(inside([fx, npc.y], npc.standsOn.polygon),
        `${npc.id}'s feet at ${Math.round(fx)},${npc.y} are off ${npc.standsOn.surface}`);
    }
  });
}

test('the self-test: feet on the wall above the boards fail', () => {
  const poly = [[0, 584], [100, 588], [100, 606], [0, 604]];
  assert.equal(inside([50, 572], poly), false);
  assert.equal(inside([50, 597], poly), true);
});
