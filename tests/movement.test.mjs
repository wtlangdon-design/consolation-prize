import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * EVERY VISIBLE PERSON MOVES, AND DELIBERATELY. Errata 35, and errata 77:
 * Tyler, 2026-11-01, after Room 4's back row shipped with a one-pixel breath
 * and nothing else -- "the four men in the back are completely stationary",
 * then "I thought it was written into our production rules that everyone had
 * to have deliberate movement" -- and "How do we ensure future characters all
 * have movement from the start?"
 *
 * Held here, from the frames themselves rather than from what a file says
 * about them, for every figure with a sprite in a shipping room (its own room
 * and every room a placement puts it in):
 *
 *   1. NEVER STILL. Something on it changes at least every NEVER_STILL
 *      seconds: a running idle (`rate`) or a beat (`beatEvery`).
 *   2. A DELIBERATE ACTION. At least one frame changes ACTION of the figure's
 *      pixels against its rest frame. A one-pixel breath changes 5-8% of a
 *      figure (Room 4's first back row, Winnie's and Deke's breaths), so a
 *      breath alone fails; a lean, a gesture, a turned head or a drink passes.
 *   3. OFTEN ENOUGH. That action is played at least every ACTION_EVERY
 *      seconds: in the beat, in a break from the pool, or in the running idle
 *      itself. 30 s is the slowest pace Tyler has approved (Main Street's
 *      three, 23-29 s between actions).
 *
 * `identity` figures draw nothing, and a candidate room is not a shipping
 * room. Any other figure that must be still says why in `movementException`,
 * quoting a ruling -- there is no silent way past this.
 */
const NEVER_STILL = 10;
const ACTION = 0.10;
const ACTION_EVERY = 30;

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json');
const rooms = new Map(manifest.rooms.map((path) => {
  const room = read(path);
  return [room.id, room];
}));
const shipping = (id) => rooms.has(id) && rooms.get(id).candidateOf === undefined;

const sheets = new Map();
function sheet(path) {
  if (!sheets.has(path)) sheets.set(path, readPng(readFileSync(resolve(ROOT, path))));
  return sheets.get(path);
}

/** The share of the rest frame's figure that frame `i` changes. */
function changeOf(sprite, i) {
  const png = sheet(sprite.sheet);
  const [x0, y0, w, h] = sprite.frames[0];
  const [x1, y1, w1, h1] = sprite.frames[i];
  if (w1 !== w || h1 !== h) return 1;
  let figure = 0;
  let changed = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const a = ((y0 + y) * png.width + x0 + x) * 4;
      const b = ((y1 + y) * png.width + x1 + x) * 4;
      const p = png.pixels;
      if (p[a + 3] > 0) figure += 1;
      if (p[a + 3] === 0 && p[b + 3] === 0) continue;
      const d = Math.abs(p[a] - p[b]) + Math.abs(p[a + 1] - p[b + 1]) + Math.abs(p[a + 2] - p[b + 2])
        + Math.abs(p[a + 3] - p[b + 3]);
      if (d > 40) changed += 1;
    }
  }
  return changed / Math.max(1, figure);
}

const cases = [];
for (const path of manifest.ambient) {
  const npc = read(path);
  if (npc.sprite?.frames?.length && shipping(npc.room)) cases.push({ path, npc, room: npc.room, sprite: npc.sprite,
    posture: npc.posture });
  for (const [room, placed] of Object.entries(npc.placements ?? {})) {
    if (placed.sprite?.frames?.length && shipping(room)) cases.push({ path, npc, room, sprite: placed.sprite,
      posture: placed.posture ?? npc.posture });
  }
}

for (const { path, npc, room, sprite, posture } of cases) {
  if (posture === 'identity') continue;
  test(`${npc.id} in ${room} moves, and deliberately (errata 35, 77)`, () => {
    if (npc.movementException) {
      assert.match(npc.movementException, /Tyler|errata|ruling/i,
        `${path}: a movementException quotes the ruling that allows it`);
      return;
    }
    const frames = sprite.frames.length;
    assert.ok(frames >= 2, `${path}: one frame in ${room} -- nothing on this figure ever moves`);

    const rate = sprite.rate ?? 0;
    const beat = sprite.beatEvery;
    assert.ok(rate > 0 || (beat !== undefined && beat <= NEVER_STILL),
      `${path}: nothing moves for ${beat ?? 'ever'} s at a time; something must change at least every `
      + `${NEVER_STILL} s (a running idle, or a beat)`);

    const shares = [0];
    for (let i = 1; i < frames; i += 1) shares.push(changeOf(sprite, i));
    const actions = shares.map((share, i) => (share >= ACTION ? i : -1)).filter((i) => i > 0);
    assert.ok(actions.length > 0,
      `${path}: no frame changes ${ACTION * 100}% of the figure (largest ${(Math.max(...shares) * 100).toFixed(1)}%) `
      + '-- a breath is not a deliberate action');

    // Where each action frame is actually played, and how often.
    const played = new Set();
    if (beat !== undefined) {
      if (beat <= ACTION_EVERY) for (let i = 1; i < frames; i += 1) played.add(i);
    } else {
      const breaks = sprite.breaks ?? [];
      const sway = breaks.length ? Math.min(2, frames) : frames;
      if (rate > 0) for (let i = 1; i < sway; i += 1) played.add(i);
      if (breaks.length && (sprite.breakEvery ?? 26) <= ACTION_EVERY) {
        for (const pool of breaks) for (const i of pool) played.add(i);
      }
    }
    assert.ok(actions.some((i) => played.has(i)),
      `${path}: its action frame(s) ${actions.join(', ')} are not played at least every ${ACTION_EVERY} s `
      + `(beatEvery ${beat ?? '-'}, breakEvery ${sprite.breakEvery ?? '-'}, rate ${rate})`);
  });
}
