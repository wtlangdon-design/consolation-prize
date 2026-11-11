import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { departureAt } from '../engine/core/Departure.ts';
import { loopPose } from '../engine/core/Ambient.ts';
import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import { readPng } from '../tools/lib/png.mjs';

/**
 * EVERY WALK HOLDS THE GROUND. Tyler, 2026-11-06, of every walk recorded in
 * the game: "Thad and the racoons are good. Hob could be better generally. Hob
 * at the funeral isn't great. Deke isn't great. Pratt is horrible."
 *
 * Two faults, measured:
 *  - THE LEGS RAN ON A CLOCK, NOT THE GROUND. A departing figure's cycle ran at
 *    `fps` whatever his speed: Pratt a full cycle every 53 px on a man nearly
 *    400 px tall, his legs pumping four times faster than the ground he
 *    covered; Deke every 450 px, gliding. Thad's cycle advances with distance,
 *    and his walk is the one Tyler passed. So every walking PERSON -- an
 *    exit, a loop, an arrival -- declares `strideRatio`, one cycle as a share
 *    of his drawn height, measured from his own frames (R5f), and an actor's
 *    stride lies in the same human range.
 *  - TOO SLOW TO SEE, OR SLOW HERE AND FAST THERE. Pratt walked a fifth of his
 *    height a second ("so slow it's hard to even figure out if his walk could
 *    be good"); the miners at a fixed 55 px/s crawled near the camera and raced
 *    far up the road. A person covers 0.35-1.2 of his own drawn height a
 *    second -- Deke, passed, 0.5; Thad 0.81 -- by `pace`, or by `speed` over
 *    his height where he walks.
 *  - SIDEWAYS UP A HILL. The miners, drawn in profile, slid up and down a road
 *    that climbs into the picture (Tyler: "the ones walking up are walking up
 *    sideways"). Over a walk, its change in depth -- how much a man grows or
 *    shrinks, |ln(h2/h1)| -- against how far he crosses the picture, in his own
 *    heights: a profile walk stays under 0.1 (the flat walks measure 0 to
 *    0.04; the claims road 0.2). Over that, the walk is drawn `away` (he
 *    shrinks along it) or `toward` (he grows).
 *  - GLIDING, AND GHOSTS. Seen from behind or the front, the miners' legs counted
 *    the ground covered on the screen, which a man walking into the picture
 *    barely covers, so they slid up the road (Tyler: "The miners glide. They
 *    don't walk."). A walk drawn `away` or `toward` keeps time instead: 1.0-1.7
 *    strides a second (Thad 1.38). And two crowds on one road walked through
 *    each other ("like ghosts"): two loops in one room are never on screen at
 *    the same moment.
 *  - THROUGH A SHUT DOOR. Pratt walked to the registrar's shut street door and
 *    vanished in front of it (Tyler: "Does Pratt just disappear through a
 *    closed door?"). An exit that ends inside the picture ends at a way out:
 *    it declares the `door` that opens for him, or the opening the plate
 *    already shows (`throughOpening`, Deke's batwing doors).
 *  - STUTTER STEPPING. A crowd is composed from men drawn alone; the miners'
 *    eight frames a man were one wide stride drawn eight times (spread 64-92
 *    against Thad's back walk 18-47), so their legs jittered (Tyler: "still
 *    stutter stepping"). A crowd loop names each man's own cycle (`men`), and
 *    each must pass the feet as a walk does.
 *  - STOMPING. The rig holds a man's crown still and his soles rise ~5% as a
 *    foot steps toward or away (Thad's back walk does too); the crowd stood
 *    each pose on its own lowest pixel and the men bounced twice a stride
 *    (Tyler: "bouncing/stomping up and down the hillside"). In a crowd drawn
 *    `away` or `toward`, each man's crown moves under 2% of the frame over
 *    the cycle.
 *  - THE FEET NEVER CAME TOGETHER. Hob's second drawing held a wide stride in
 *    five frames of six (Tyler: "kind of scooting across air"). In each half
 *    of a cycle the feet pass: their spread at its narrowest is under 60% of
 *    the cycle's widest (Thad 54% and 28%, Deke 47% and 26%, that Hob 53% and
 *    92%).
 *  - THE CYCLE WAS NOT A CYCLE. Hob's and the funeral Hob's walks were four
 *    frames, the same leg leading both strides; Pratt's four were one stride
 *    pumped (consecutive frames sharing 65-74% of the silhouette below the
 *    hem), and his first redraw was the same stride six times (81-90%). A
 *    person's walk is six frames or more and each differs from the next: their
 *    below-the-hem silhouettes share under 60% on average (Thad 21%, the new
 *    Hob 46%, Deke 20%, Pratt 27%).
 *
 * NOT measured, because no measure held: WHICH leg leads. In profile the two
 * contact poses share a silhouette, so an overlap test passes Thad only because
 * his body travels inside its canvas; the near leg's lighter tone switches
 * sides in Thad's and Deke's cycles and does not in Pratt's (the generator lit
 * his front leg in three drawings running) or Hob's (both legs one dark tone).
 * That is Tyler's eye, in the recorded walks (tools/gauntlet/walk-gifs.mjs).
 *
 * Animals keep the clock and their four frames: the raccoons pass as they are.
 * The claims road's miners are crowds on a loop, held to the stride only.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const manifest = read('content/manifest.json');
// A walking stride (two steps) is about 0.8 of a man's height; Thad's 0.588 is short, the miners'
// 0.78 long. Was [0.4, 0.75], which the miners' measured stride exceeded (proofs/check-friction.json).
const STRIDE = [0.4, 0.95];
const HEM = 0.72;

const walks = [];
for (const path of manifest.ambient) {
  const npc = read(path);
  for (const kind of ['exit', 'loop', 'arrive']) {
    const walk = npc[kind];
    if (walk?.frames?.length > 1) walks.push({ id: npc.id, kind, npc, walk });
  }
}

const DISTINCT = 0.6;
const DISTINCT_SKIRT = 0.72;
const PACE = [0.35, 1.2];
const DEPTH = 0.1;
const rooms = new Map(manifest.rooms.map((p) => read(p)).map((r) => [r.id, r]));
/** His drawn height on his walk: its own `heights` where it declares them, else the room's curve at its start. */
function drawnHeight(npc, walk) {
  const stature = npc.sprite?.stature ?? 1;
  if (walk.heights?.length) return (walk.heights.reduce((a, b) => a + b, 0) / walk.heights.length) * stature;
  const room = rooms.get(npc.room);
  const [x, y] = walk.path[0];
  const near = new WalkBoxes(room.walkBoxes, () => true).nearest(x, y);
  return (near ? heightIn(near.box, y) : 0) * stature;
}
const PASSING = 0.6;

/** How far apart the feet are: the width of the figure's lowest 4% of rows. */
function footSpread(f) {
  let top = -1; let bottom = -1;
  for (let y = 0; y < f.height; y += 1) for (let x = 0; x < f.width; x += 1) if (f.alpha(x, y)) { if (top < 0) top = y; bottom = y; break; }
  const from = bottom - Math.floor((bottom - top + 1) * 0.04);
  let left = f.width; let right = -1;
  for (let y = from; y <= bottom; y += 1) for (let x = 0; x < f.width; x += 1) {
    if (f.alpha(x, y)) { if (x < left) left = x; if (x > right) right = x; }
  }
  return right - left;
}

/** Below-the-hem overlap of two frames, as tools/check-clip-agreement.mjs measures it. */
function legOverlap(a, b) {
  const rows = (f) => {
    let top = f.height; let bottom = -1;
    for (let y = 0; y < f.height; y += 1) for (let x = 0; x < f.width; x += 1) {
      if (f.alpha(x, y)) { if (y < top) top = y; bottom = y; break; }
    }
    return [top, bottom];
  };
  const [ta, ba] = rows(a); const [tb, bb] = rows(b);
  const top = Math.min(ta, tb); const bottom = Math.max(ba, bb);
  const hem = top + Math.round(HEM * (bottom - top + 1));
  let both = 0; let either = 0;
  for (let y = hem; y <= bottom; y += 1) for (let x = 0; x < Math.min(a.width, b.width); x += 1) {
    const p = a.alpha(x, y); const q = b.alpha(x, y);
    if (p && q) both += 1;
    if (p || q) either += 1;
  }
  return either ? both / either : 1;
}
function cycle(who, frames, skirt = false) {
  assert.ok(frames.length >= 6, `${who} is ${frames.length} frames: a walk needs six to show both strides and both passing poses`);
  const spreads = frames.map(footSpread);
  const widest = Math.max(...spreads);
  const half = frames.length / 2;
  for (const [from, to] of [[0, half], [half, frames.length]]) {
    const narrowest = Math.min(...spreads.slice(from, to));
    assert.ok(narrowest < PASSING * widest, `${who}'s feet never pass in frames ${from}-${to - 1}: `
      + `their spread is at least ${(narrowest / widest * 100).toFixed(0)}% of the widest -- a stride held, so he slides`);
  }
  const shares = frames.map((f, i) => legOverlap(f, frames[(i + 1) % frames.length]));
  const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
  // A LONG SKIRT (errata 270): Winnie's hem is at her boots, so below the hem line is skirt in every frame and a
  // true cycle shares more of it (her walk 68%; the same stride held six times would share 85-90%).
  assert.ok(mean < (skirt ? DISTINCT_SKIRT : DISTINCT), `${who}'s consecutive frames share ${(mean * 100).toFixed(0)}% of their silhouette below the hem on average: one pose pumped, not a cycle`);
}
const cell = (png, [x0, y0, w, h]) => ({
  width: w, height: h, alpha: (x, y) => png.pixels[((y0 + y) * png.width + x0 + x) * 4 + 3] > 128,
});
const file = (p) => { const png = readPng(readFileSync(resolve(ROOT, p))); return cell(png, [0, 0, png.width, png.height]); };

for (const { id, kind, npc, walk } of walks) {
  if (npc.posture === 'animal') continue;
  if (/^(away|toward)/.test(walk.view ?? '')) {
    test(`${id}'s ${kind} walk, seen ${walk.view.startsWith('away') ? 'from behind' : 'from the front'}, keeps a walking time`, () => {
      assert.equal(walk.strideRatio, undefined, `${id}'s ${kind} counts strides by screen distance, which a walk into the picture barely covers: he glides`);
      const strides = walk.fps / walk.frames.length;
      assert.ok(strides >= 1.0 && strides <= 1.7, `${id}'s ${kind} takes ${strides.toFixed(2)} strides a second`);
    });
  } else test(`${id}'s ${kind} walk advances with the ground he covers`, () => {
    assert.ok(typeof walk.strideRatio === 'number',
      `${id}'s ${kind} declares no strideRatio, so his legs run at ${walk.fps} frames a second whatever his speed`);
    assert.ok(walk.strideRatio >= STRIDE[0] && walk.strideRatio <= STRIDE[1],
      `${id}'s ${kind} strideRatio ${walk.strideRatio} is outside a walking man's ${STRIDE.join('-')} of his height`);
  });
  if (kind === 'exit') {
    test(`${id}'s exit ends where he can leave`, () => {
      const room = rooms.get(npc.room);
      const [w, h] = room.size ?? [1920, 864];
      const [x, y] = walk.path[walk.path.length - 1];
      if (x < 0 || x > w || y < 0 || y > h) return;   // off the edge of the picture
      assert.ok(walk.door || walk.throughOpening, `${id}'s exit ends inside the picture at ${x},${y} with no door to open and no opening: he vanishes there`);
      if (walk.door) {
        const [dx, dy] = [walk.door.x, walk.door.y];
        const [, , dw, dh] = walk.door.frame;
        assert.ok(x >= dx && x <= dx + dw && y >= dy && y <= dy + dh + 60, `${id}'s exit ends at ${x},${y}, not in the doorway (${dx},${dy} ${dw}x${dh})`);
      }
    });
  }
  test(`${id}'s ${kind} walk faces the way it goes`, () => {
    const room = rooms.get(npc.room);
    const boxes = new WalkBoxes(room.walkBoxes, () => true);
    const h = (i) => walk.heights?.[i] ?? (() => {
      const [x, y] = walk.path[i]; const near = boxes.nearest(x, y); return near ? heightIn(near.box, y) : 0;
    })();
    let across = 0; let depth = 0; let signed = 0; let sideways = 0;
    for (let i = 1; i < walk.path.length; i += 1) {
      const a = h(i - 1); const b = h(i);
      if (a <= 0 || b <= 0) continue;
      across += Math.abs(walk.path[i][0] - walk.path[i - 1][0]) / ((a + b) / 2);
      sideways += (walk.path[i][0] - walk.path[i - 1][0]) / ((a + b) / 2);
      depth += Math.abs(Math.log(b / a)); signed += Math.log(b / a);
    }
    const ratio = depth / Math.max(across, 1e-6);
    const view = walk.view ?? 'profile';
    if (ratio < DEPTH) {
      assert.equal(view, 'profile', `${id}'s ${kind} crosses the picture (depth ${ratio.toFixed(2)} of its width) and is drawn ${view}`);
    } else {
      assert.ok(view !== 'profile', `${id}'s ${kind} goes into the picture (depth ${ratio.toFixed(2)} of its width) and is drawn in profile: he will slide sideways`);
      // Into the picture AND across it (more than two of his heights sideways): turned the way he crosses.
      const turn = Math.abs(sideways) > 2 ? (sideways > 0 ? '-right' : '-left') : '';
      const want = (signed < 0 ? 'away' : 'toward') + turn;
      assert.equal(view, want, `${id}'s ${kind} ${signed < 0 ? 'goes away' : 'comes toward us'}${turn ? ` and ${sideways > 0 ? 'right' : 'left'} across the picture (${Math.abs(sideways).toFixed(1)} of his heights)` : ''} and is drawn ${view}: his legs walk one way while he moves another`);
    }
  });
  test(`${id}'s ${kind} walk is at a walking pace`, () => {
    const pace = walk.pace ?? walk.speed / drawnHeight(npc, walk);
    assert.ok(pace >= PACE[0] && pace <= PACE[1], `${id}'s ${kind} covers ${pace.toFixed(2)} of his height a second`);
    if (walk.heights && walk.heights.length > 1 && Math.max(...walk.heights) > 2 * Math.min(...walk.heights)) {
      assert.ok(walk.pace, `${id}'s ${kind} climbs a road from ${Math.max(...walk.heights)} px to ${Math.min(...walk.heights)} px tall at a fixed speed: give it a pace`);
    }
  });
  if (npc.posture === 'walking' && (/^(away|toward)/.test(walk.view ?? ''))) {
    test(`${id}'s ${kind}: no man in the crowd bobs up and down`, () => {
      // Each man's own cycle holds his height within 1% (Thad's side walk 0.3%), and in the crowd the
      // heads-and-shoulders band (top 40%) of each quarter keeps its centre of mass within 1% of the
      // frame: the stomping crowd moved 1.05-2.37%, the steady ones 0.03-0.76%. Legs are left out
      // because their shape changes with the stride, which is walking, not bouncing.
      for (const dir of walk.men ?? []) {
        const hs = readdirSync(resolve(ROOT, dir)).filter((f) => f.endsWith('.png')).sort().map((f) => {
          const c = file(`${dir}/${f}`); let top = -1; let bottom = -1;
          for (let y = 0; y < c.height; y += 1) for (let x = 0; x < c.width; x += 1) if (c.alpha(x, y)) { if (top < 0) top = y; bottom = y; break; }
          return bottom - top + 1;
        });
        assert.ok((Math.max(...hs) - Math.min(...hs)) / Math.max(...hs) <= 0.01, `${dir}: his height runs ${Math.min(...hs)}-${Math.max(...hs)} over the cycle: he bobs`);
      }
      const png = readPng(readFileSync(resolve(ROOT, walk.sheet)));
      const men = walk.men?.length ?? 4;
      const ranges = Array.from({ length: men }, () => [Infinity, -Infinity]);
      for (const f of walk.frames) {
        const c = cell(png, f); const q = Math.floor(c.width / men);
        for (let m = 0; m < men; m += 1) {
          let sum = 0; let n = 0;
          for (let y = 0; y < Math.floor(c.height * 0.4); y += 1) for (let x = m * q; x < (m + 1) * q; x += 1) if (c.alpha(x, y)) { sum += y; n += 1; }
          if (n) { const cy = sum / n; ranges[m][0] = Math.min(ranges[m][0], cy); ranges[m][1] = Math.max(ranges[m][1], cy); }
        }
      }
      const h = walk.frames[0][3];
      ranges.forEach(([lo, hi], m) => assert.ok(hi - lo <= 0.01 * h, `${id}'s ${kind}: man ${m + 1} moves ${(hi - lo).toFixed(1)} px up and down over the cycle (frame ${h} tall): he bounces`));
    });
  }
  if (npc.posture === 'walking') {
    test(`${id}'s ${kind}: every man in the crowd walks a real cycle`, () => {
      assert.ok(Array.isArray(walk.men) && walk.men.length > 0, `${id}'s ${kind} is a crowd and names no man's own cycle (\`men\`): nothing shows his feet pass`);
      for (const dir of walk.men) {
        const frames = readdirSync(resolve(ROOT, dir)).filter((f) => f.endsWith('.png')).sort().map((f) => file(`${dir}/${f}`));
        const spreads = frames.map(footSpread);
        const widest = Math.max(...spreads);
        assert.ok(frames.length >= 6, `${dir} is ${frames.length} frames`);
        assert.ok(Math.min(...spreads) < PASSING * widest, `${dir}: the feet never come together (narrowest ${Math.min(...spreads)} of ${widest}): a stride held, so he stutters`);
      }
    });
  }
  if (npc.posture !== 'walking') {
    test(`${id}'s ${kind} walk is a cycle of six different poses`, () => {
      const png = readPng(readFileSync(resolve(ROOT, walk.sheet)));
      cycle(`${id}'s ${kind}`, walk.frames.map((f) => cell(png, f)), walk.skirt === true);
    });
  }
}

for (const name of manifest.actors ?? []) {
  const record = read(name);
  const walk = record.clips?.find((c) => c.id === 'walk' && (c.facing === 'right' || c.facing === 'left'));
  if (!walk || !record.strideLength) continue;
  test(`${record.id}'s stride is a walking man's`, () => {
    const ratio = record.strideLength / record.height;
    assert.ok(ratio >= STRIDE[0] && ratio <= STRIDE[1], `${record.id}'s stride is ${ratio.toFixed(2)} of his height`);
  });
  test(`${record.id}'s side walk is a cycle of six different poses`, () => {
    cycle(`${record.id}'s walk`, walk.frames.map(file));
  });
}

test('with a stride, the cycle is the ground covered, not the time taken', () => {
  const walk = { path: [[0, 500], [2000, 500]], speed: 100, sheet: '', frames: Array(6).fill([0, 0, 1, 1]), fps: 6,
    drawnFacing: 'right', figureHeight: 300, strideRatio: 0.6 };
  const man = () => 300;   // one cycle = 180 px
  const slow = departureAt(walk, 0.9, man);            // 90 px: half a cycle
  const fast = departureAt({ ...walk, speed: 300 }, 0.3, man);   // the same 90 px, three times as fast
  assert.equal(slow.frame, 3);
  assert.equal(fast.frame, slow.frame);
  // Without a stride (an animal), the clock: 0.9 s at 6 fps.
  assert.equal(departureAt({ ...walk, strideRatio: undefined }, 0.9, man).frame, 5);
});

for (const room of new Set(walks.filter((w) => w.kind === 'loop').map((w) => w.npc.room))) {
  const loops = walks.filter((w) => w.kind === 'loop' && w.npc.room === room);
  if (loops.length < 2) continue;
  test(`${room}: its walking crowds are never on screen together`, () => {
    for (let t = 0; t < 600; t += 0.25) {
      const on = loops.filter((w) => loopPose(w.npc, t, (x, y, d) => d ?? 300));
      assert.ok(on.length < 2, `at ${t}s ${on.map((w) => w.id).join(' and ')} are both on the road: they walk through each other`);
    }
  });
}

test('every walking person was found', () => {
  const people = walks.filter((w) => w.npc.posture !== 'animal').map((w) => w.id);
  assert.ok(people.length >= 6, `only ${people.join(', ')}`);
  assert.ok(readdirSync(resolve(ROOT, 'art/actors/hob-walk-right')).filter((f) => f.endsWith('.png')).length >= 6);
});
