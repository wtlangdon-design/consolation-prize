import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import { readPng } from '../tools/lib/png.mjs';

/**
 * ONE LEVEL OF PIXELATION THROUGHOUT THE WHOLE GAME (errata 112 G). Tyler,
 * 2026-11-06: "The problem is that the super pixelated face you just gave him
 * is going to look ridiculous next to like the people at the funeral. We need
 * consistency throughout the whole game with the level of pixelation." He chose
 * the cast sheet's finer level for everyone.
 *
 * The rule: a man's height is N = 115 art pixels, wherever he stands. So a
 * figure's art pixel, in its own sheet's pixels, is b = (a man's height in that
 * sheet) / N -- `figureHeight / stature` for a sheet the engine scales, the
 * room's man at its feet for a 1:1 sheet, the rig's figure height for an actor
 * clip. `tools/art/one-level.py` puts every figure on that grid, fitted to its
 * own opaque box.
 *
 * Held here: lay the same grid over every frame and every block must be ONE
 * colour. A drawing finer than the level -- a new figure cut in raw, a redraw
 * not yet snapped -- has many colours per block and fails. (A drawing coarser
 * than the level passes this and is caught by eye in the line-up; it cannot be
 * snapped finer, only redrawn.) Edge pixels are let off a little: the key-colour
 * despill retints a figure's outline, and a counter figure's waist is re-cut on
 * the plate's own edge (`recut`), so a block there may hold two colours.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const N = 115;
const SKIP_ACTORS = new Set(['coach', 'driver']);
// Measured on the snapped game, 472 frames: the worst has 6.0% of its opaque
// pixels off their block's colour (the dog's outline). The same frames before
// the snap: median 18%; 461 of 472 over 8%, and the 11 under it were already
// drawn at or coarser than the level.
const MAX_OFF = 0.08;

const manifest = read('content/manifest.json');
const rooms = new Map(manifest.rooms.map((p) => read(p)).map((r) => [r.id, r]));
function manAt(roomId, x, y) {
  const room = rooms.get(roomId);
  if (!room) return 0;
  const near = new WalkBoxes(room.walkBoxes, () => true).nearest(x, y);
  return near ? heightIn(near.box, y) : 0;
}

/** A man at a depth behind the walk band (`depthY`): the room's curve carried back, not clamped. */
function manAtDepth(roomId, y) {
  const curve = rooms.get(roomId)?.walkBoxes?.[0]?.scaleMode;
  if (!curve || curve.kind !== 'curve') return 0;
  return curve.farHeight + (y - curve.farY) * (curve.nearHeight - curve.farHeight) / (curve.nearY - curve.farY);
}

/** Fraction of a frame's opaque pixels whose colour is not their art-pixel block's. */
export function offGrid(png, frame, b) {
  // A pixel centre exactly on a block edge (a block of exactly 3.5 px) can go to either block: the snap's
  // nearest-neighbour draw-up rounds such ties by floating point, not by rule. Rounded the wrong way the
  // grid drifts a row from the snap's and an evenly snapped frame reads 12% off (Pratt's breath frame,
  // errata 112 K). So both roundings are tried and the better taken.
  return Math.min(offGridTies(png, frame, b, -1e-9), offGridTies(png, frame, b, 1e-9));
}

function offGridTies(png, [x0, y0, w, h], b, eps) {
  const at = (x, y) => ((y0 + y) * png.width + x0 + x) * 4;
  let top = -1; let bottom = -1; let left = w;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (png.pixels[at(x, y) + 3] > 128) { if (top < 0) top = y; bottom = y; if (x < left) left = x; }
    }
  }
  if (top < 0) return 0;
  const H = bottom - top + 1;
  const nh = Math.max(1, Math.round(H / b)); const bb = H / nh;
  const nw = Math.ceil((w - left) / bb); const W = Math.round(nw * bb);
  const first = new Map(); let opaque = 0; let off = 0;
  for (let y = top; y <= bottom; y += 1) {
    const by = Math.floor(((y - top) + 0.5) * nh / H + eps);
    for (let x = left; x < w; x += 1) {
      const i = at(x, y);
      if (png.pixels[i + 3] <= 128) continue;
      opaque += 1;
      const key = by * 100000 + Math.floor(((x - left) + 0.5) * nw / W + eps);
      const c = [png.pixels[i], png.pixels[i + 1], png.pixels[i + 2]];
      const seen = first.get(key);
      if (!seen) { first.set(key, c); continue; }
      if (Math.max(...c.map((v, k) => Math.abs(v - seen[k]))) > 24) off += 1;
    }
  }
  return off / Math.max(opaque, 1);
}

const jobs = new Map();
for (const path of manifest.ambient) {
  const npc = read(path);
  const places = [[npc.room, npc.x, npc.y, npc.sprite]];
  for (const [room, at] of Object.entries(npc.placements ?? {})) {
    places.push([room, at.x ?? npc.x, at.y ?? npc.y, at.sprite ?? npc.sprite]);
  }
  if (npc.exit?.sheet) places.push([npc.room, npc.exit.path[0][0], npc.exit.path[0][1], npc.exit]);
  for (const kind of ['loop', 'arrive']) {
    if (npc[kind]?.sheet) places.push([npc.room, npc[kind].path[0][0], npc[kind].path[0][1], npc[kind]]);
  }
  for (const [room, x, y, sprite] of places) {
    if (!sprite?.frames || npc.posture === 'identity') continue;
    const man = sprite.figureHeight ? sprite.figureHeight / (sprite.stature || 1)
      : sprite.depthY !== undefined ? manAtDepth(room, sprite.depthY) : manAt(room, x, y);
    if (man <= 0) continue;
    for (const frame of sprite.frames) {
      const key = `${sprite.sheet}|${frame.join(',')}`;
      if (!jobs.has(key)) jobs.set(key, { who: npc.id, sheet: sprite.sheet, frame, b: man / N });
    }
  }
}
for (const dir of readdirSync(resolve(ROOT, 'art/actors')).sort()) {
  const rigPath = resolve(ROOT, 'art/actors', dir, 'rig.json');
  if (!existsSync(rigPath) || SKIP_ACTORS.has(dir.split('-')[0])) continue;
  const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
  if (rig.kind === 'head-overlay' || rig.overlay_rect !== undefined || !Array.isArray(rig.figure)) continue;
  for (const f of readdirSync(resolve(ROOT, 'art/actors', dir)).filter((n) => n.endsWith('.png'))) {
    jobs.set(`art/actors/${dir}/${f}`, { who: dir, sheet: `art/actors/${dir}/${f}`, frame: null, b: rig.figure[1] / N });
  }
}

const pngs = new Map();
const png = (p) => { if (!pngs.has(p)) pngs.set(p, readPng(readFileSync(resolve(ROOT, p)))); return pngs.get(p); };

test('every figure is drawn at one level: a man is 115 art pixels tall', () => {
  const misses = []; let worst = 0; let measured = 0;
  for (const job of jobs.values()) {
    if (job.b <= 1.05) continue;
    const image = png(job.sheet);
    const frame = job.frame ?? [0, 0, image.width, image.height];
    if (frame[0] + frame[2] > image.width || frame[1] + frame[3] > image.height) continue;
    const off = offGrid(image, frame, job.b);
    measured += 1; worst = Math.max(worst, off);
    if (off > MAX_OFF) misses.push(`${job.who} (${job.sheet} ${job.frame ?? ''}): ${(off * 100).toFixed(1)}% of its pixels are finer than the level`);
  }
  assert.ok(measured > 300, `only ${measured} frames measured`);
  assert.deepEqual(misses, [], `${misses.length} frame(s) drawn finer than one level; run tools/art/one-level.py:\n${misses.slice(0, 20).join('\n')}`);
});
