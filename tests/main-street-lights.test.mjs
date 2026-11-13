// MAIN STREET'S LAMPS AND WINDOWS GLOW AND PULSE, EACH IN ITS OWN TIME (errata 297).
//
// Tyler, 2026-11-13: "Is it possible to make the lamps and windows on main street
// glow and pulse at different intervals? Anything else you can do to make main
// street feel more alive? I thought you were doing that treatment to every room
// already." Errata 273 had given the street stars and the trough, and three lamp
// halos breathing by five to eleven per cent: not enough to be seen. Every lit
// lamp and window now swells and sinks (`glow`, engine/render/MotionLayer.ts), on
// its own period and at its own place in it.
//
// This holds it: every lit window and lamp on the plate has a glow over it; no two
// share a period; a glow never moves in step with another; and the wave stays a
// wave (-1 to 1, the same at the same instant).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { glowOf, litWarm } from '../engine/render/MotionLayer.ts';
import { readPng } from '../tools/lib/png.mjs';

const room = JSON.parse(readFileSync(new URL('../content/rooms/main-street.json', import.meta.url), 'utf8'));
const glows = room.motion.filter((motion) => motion.kind === 'glow');

/** The plate's lit patches: 4-connected runs of warm-lit pixels, grown by a pixel so a window's panes are one. */
function litPatches() {
  const image = readPng(readFileSync(new URL(`../${room.background}`, import.meta.url)));
  const { width, height, pixels } = image;
  const lit = new Uint8Array(width * height);
  // The buildings' band: below the sky, above the ground's reflections.
  for (let y = 240; y < 540; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      if (litWarm(pixels[at], pixels[at + 1], pixels[at + 2])) lit[y * width + x] = 1;
    }
  }
  const seen = new Uint8Array(width * height);
  const patches = [];
  for (let start = 0; start < lit.length; start += 1) {
    if (!lit[start] || seen[start]) continue;
    let count = 0; let x0 = Infinity; let y0 = Infinity; let x1 = -1; let y1 = -1;
    const stack = [start]; seen[start] = 1;
    while (stack.length) {
      const at = stack.pop(); const x = at % width; const y = (at - x) / width;
      count += 1; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (lit[next] && !seen[next]) { seen[next] = 1; stack.push(next); }
        }
      }
    }
    patches.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, count });
  }
  return patches;
}

test('every lit window and lamp on the street has a glow over it', () => {
  // A window or a lamp: a patch at least a dozen pixels each way with fifty lit pixels in it. A lit post or a frame
  // edge, a few pixels wide, is light falling on wood, not a light.
  const lights = litPatches().filter((patch) => patch.count >= 50 && patch.w >= 12 && patch.h >= 12);
  assert.ok(lights.length >= 12, `the plate shows ${lights.length} lights; is this still the night street?`);
  const missed = lights.filter((patch) => !glows.some(({ rect: [x, y, w, h] }) => {
    const cx = patch.x + patch.w / 2; const cy = patch.y + patch.h / 2;
    return cx >= x && cx <= x + w && cy >= y && cy <= y + h;
  }));
  assert.deepEqual(missed.map((patch) => `${patch.x},${patch.y} ${patch.w}x${patch.h}`), [],
    'lit and not glowing');
});

test('no two lights share a period', () => {
  const rates = glows.map((glow) => glow.rate);
  assert.equal(new Set(rates).size, rates.length, `periods shared: ${rates.join(', ')}`);
  assert.equal(new Set(glows.map((glow) => glow.seed)).size, glows.length, 'each light its own place in its cycle');
});

test('no two lights rise and fall together', () => {
  const sampled = glows.map((glow) => Array.from({ length: 600 }, (_, i) => glowOf(glow, i * 0.2)));
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  for (let i = 0; i < sampled.length; i += 1) {
    for (let j = i + 1; j < sampled.length; j += 1) {
      const a = sampled[i]; const b = sampled[j]; const ma = mean(a); const mb = mean(b);
      let sab = 0; let saa = 0; let sbb = 0;
      for (let k = 0; k < a.length; k += 1) { sab += (a[k] - ma) * (b[k] - mb); saa += (a[k] - ma) ** 2; sbb += (b[k] - mb) ** 2; }
      const r = sab / Math.sqrt(saa * sbb);
      assert.ok(r < 0.6, `${glows[i].id} and ${glows[j].id} move together (r = ${r.toFixed(2)})`);
    }
  }
});

test('a glow is a wave: between -1 and 1, and the same at the same instant', () => {
  for (const glow of glows) {
    for (let t = 0; t < 120; t += 0.37) {
      const v = glowOf(glow, t);
      assert.ok(v >= -1 && v <= 1, `${glow.id} at ${t}: ${v}`);
      assert.equal(glowOf(glow, t), v);
    }
    const values = Array.from({ length: 400 }, (_, i) => glowOf(glow, i * 0.3));
    assert.ok(Math.max(...values) - Math.min(...values) > 1, `${glow.id} hardly moves`);
  }
});

// EVERY ROOM'S LIGHTS (errata 298). Tyler, of Main Street's: "I thought you were doing that treatment to every room
// already." tools/art/place-glows.py found every dark room's lamps, fires and lit windows from its plate. Held here:
// the rooms that have lights glow; within a room no two share a period or move together; and no glow lies over a
// strip that swings or runs, where the two would draw the lantern twice.
import { readdirSync } from 'node:fs';

const ROOMS = new URL('../content/rooms/', import.meta.url);
const all = readdirSync(ROOMS).filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(new URL(name, ROOMS), 'utf8')));

test('the dark rooms with lights glow', () => {
  const glowing = all.filter((one) => (one.motion ?? []).some((motion) => motion.kind === 'glow')).map((one) => one.id);
  for (const id of ['nugget', 'hotel_lobby', 'lower_street', 'the_lane', 'church', 'boarding_house_parlour', 'thads_room',
    'mercantile', 'clarion', 'claims_registrar', 'watchmans_shack', 'bakehouse', 'ozymandias_tent']) {
    assert.ok(glowing.includes(id), `${id} has lights and none glows`);
  }
  for (const id of ['coffin', 'listening_chamber']) assert.ok(!glowing.includes(id), `${id} is still by invariant`);
});

test('in every room, each light keeps its own time, and none is drawn twice', () => {
  const overlaps = (a, b) => !(a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1]);
  for (const one of all) {
    const own = (one.motion ?? []).filter((motion) => motion.kind === 'glow');
    if (own.length === 0) continue;
    assert.equal(new Set(own.map((glow) => glow.rate)).size, own.length, `${one.id}: two lights share a period`);
    assert.equal(new Set(own.map((glow) => glow.seed)).size, own.length, `${one.id}: two lights share a seed`);
    const moving = (one.motion ?? []).filter((motion) => ['sway', 'shimmer', 'scroll'].includes(motion.kind));
    for (const glow of own) {
      const under = moving.filter((motion) => overlaps(glow.rect, motion.rect)).map((motion) => motion.id);
      assert.deepEqual(under, [], `${one.id}: ${glow.id} lies over ${under.join(', ')}`);
    }
  }
});
