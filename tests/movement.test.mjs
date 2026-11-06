import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ambientFrameAt } from '../engine/render/Renderer.ts';
import { readPng } from '../tools/lib/png.mjs';

/**
 * EVERY VISIBLE PERSON MOVES, AND DELIBERATELY. Errata 35, and errata 77:
 * Tyler, 2026-11-01, after Room 4's back row shipped with a one-pixel breath
 * and nothing else -- "the four men in the back are completely stationary",
 * then "I thought it was written into our production rules that everyone had
 * to have deliberate movement" -- and "How do we ensure future characters all
 * have movement from the start?"
 *
 * Held here, from the frames themselves and from the engine's own schedule
 * (`ambientFrameAt`, sampled over SPAN seconds of play) rather than from what
 * a file says about them, for every figure with a sprite in a shipping room
 * (its own room and every room a placement puts it in):
 *
 *   1. NEVER STILL. As played, no frame is held longer than NEVER_STILL
 *      seconds.
 *   2. A DELIBERATE ACTION. At least one frame changes ACTION of the figure's
 *      pixels against its rest frame. A one-pixel breath changes 5-8% of a
 *      figure (Room 4's first back row, Winnie's and Deke's breaths), so a
 *      breath alone fails; a lean, a gesture, a turned head or a drink passes.
 *   3. OFTEN ENOUGH. As played, no more than ACTION_EVERY seconds pass without
 *      an action frame. 30 s is the slowest pace Tyler has approved (Main
 *      Street's three, 23-29 s between actions).
 *
 * THE SCHEDULE IS SAMPLED, NOT READ. The first version accepted any positive
 * `rate` and any action found in any break pool; the review on #100 showed a
 * rate of 0.01 holding a frame 50 s, and an action in one pool of four playing
 * every 40 s, both passing. Sampling the renderer's own frame function makes
 * either one fail as the gap it really leaves.
 *
 * `identity` figures draw nothing, and a candidate room is not a shipping
 * room. Any other figure that must be still says why in `movementException`,
 * quoting a ruling -- there is no silent way past this.
 */
const NEVER_STILL = 10;
const ACTION = 0.10;
const ACTION_EVERY = 30;
const SPAN = 600;     // seconds of play sampled
const DT = 0.05;

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

/** As played: the longest hold on one frame, and the longest stretch without an action frame. */
export function schedule(sprite, actions) {
  const phase = sprite.phase ?? 0;
  let last = ambientFrameAt(sprite, phase, 0);
  let lastChange = 0;
  let longestStill = 0;
  let lastAction = actions.has(last) ? 0 : null;
  let firstAction = lastAction;
  let longestWithout = 0;
  for (let step = 1; step <= SPAN / DT; step += 1) {
    const clock = step * DT;
    const frame = ambientFrameAt(sprite, phase, clock);
    if (frame === last) continue;
    longestStill = Math.max(longestStill, clock - lastChange);
    lastChange = clock;
    if (actions.has(frame)) {
      if (lastAction !== null) longestWithout = Math.max(longestWithout, clock - lastAction);
      if (firstAction === null) firstAction = clock;
      lastAction = clock;
    }
    last = frame;
  }
  longestStill = Math.max(longestStill, SPAN - lastChange);
  if (firstAction === null) return { longestStill, longestWithout: Infinity };
  longestWithout = Math.max(longestWithout, firstAction, SPAN - lastAction);
  return { longestStill, longestWithout };
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

    const shares = [0];
    for (let i = 1; i < frames; i += 1) shares.push(changeOf(sprite, i));
    const actions = new Set(shares.map((share, i) => (share >= ACTION ? i : -1)).filter((i) => i > 0));
    assert.ok(actions.size > 0,
      `${path}: no frame changes ${ACTION * 100}% of the figure (largest ${(Math.max(...shares) * 100).toFixed(1)}%) `
      + '-- a breath is not a deliberate action');

    const { longestStill, longestWithout } = schedule(sprite, actions);
    assert.ok(longestStill <= NEVER_STILL,
      `${path}: as played, holds one frame for ${longestStill.toFixed(1)} s; something must change at least `
      + `every ${NEVER_STILL} s`);
    assert.ok(longestWithout <= ACTION_EVERY,
      `${path}: as played, goes ${longestWithout.toFixed(1)} s without a deliberate action `
      + `(frames ${[...actions].join(', ')}); one must play at least every ${ACTION_EVERY} s`);
  });
}

// THE CHECK CATCHES WHAT IT IS FOR. The two schedules the review on #100 named,
// built from Room 4's own judge 2 so they are real sheets: a rate too slow to
// count as moving, and a break interval that leaves the only action 40 s apart.
test('the movement check fails a crawling idle and a rare action (review on #100)', () => {
  const judge = read('content/ambient/room-04-judge-2.json').sprite;
  const shares = [0];
  for (let i = 1; i < judge.frames.length; i += 1) shares.push(changeOf(judge, i));
  const actions = new Set(shares.map((share, i) => (share >= ACTION ? i : -1)).filter((i) => i > 0));
  assert.ok(schedule({ ...judge, rate: 0.01, breaks: undefined }, actions).longestStill > NEVER_STILL,
    'a rate of 0.01 holds a frame for 50 s');
  // THE SCHEDULER'S HALF, INDEPENDENT OF THE ART: only the confer (frame 2)
  // counts as an action here, and three of four pools are the rest frame. The
  // judges were redrawn on 2026-11-06 and which of their frames measure as
  // actions changed; what this proves is the arithmetic of a rare break.
  const onlyConfer = new Set([2]);
  const rare = { ...judge, breakEvery: 40, breaks: [[2, 2, 2, 0], [0, 0], [0, 0], [0, 0]] };
  assert.ok(schedule(rare, onlyConfer).longestWithout > ACTION_EVERY,
    'an action in one pool of four, every 40 s, leaves more than 30 s between actions');
});

// A FIGURE THAT WALKS A LOOP (AmbientFile.loop, errata 95 E) moves by walking,
// and is never seen to appear or vanish: it has a walk cycle and a speed, and
// both ends of its path lie off the frame, so it walks on and walks off.
for (const path of manifest.ambient) {
  const npc = read(path);
  if (!npc.loop) continue;
  test(`${npc.id} walks its loop on and off the frame (errata 95 E)`, () => {
    const walk = npc.loop;
    assert.ok((walk.frames ?? []).length >= 2, `${path}: a walk cycle needs at least two frames`);
    assert.ok(walk.speed > 0, `${path}: a walk needs a speed`);
    const room = read(manifest.rooms.find((file) => read(file).id === npc.room));
    const width = room.size?.[0] ?? 1920;
    const height = room.size?.[1] ?? 864;
    const off = ([x, y]) => x < 0 || x > width || y > height;
    // OR BEHIND SOMETHING (errata 112 P: the claims road's miners go behind the cabin at the top of the
    // road): the end is hidden if the prop the loop names covers the whole walker there and is drawn in
    // front of him (its base lower than his feet).
    const hidden = (i) => {
      const prop = (room.props ?? []).find((one) => one.id === walk.hiddenBehind);
      if (!prop || !walk.heights) return false;
      const [x, y] = walk.path[i];
      const [, , fw, fh] = walk.frames[0];
      const k = walk.heights[i] / walk.figureHeight;
      const [, , pw, ph] = prop.frame;
      const box = [x - (fw * k) / 2, y - fh * k + 1, x + (fw * k) / 2, y];
      const cover = [prop.x - Math.floor(pw / 2), prop.y - ph + 1, prop.x - Math.floor(pw / 2) + pw, prop.y];
      return prop.y > y && box[0] >= cover[0] && box[1] >= cover[1] && box[2] <= cover[2] && box[3] <= cover[3];
    };
    const last = walk.path.length - 1;
    assert.ok(off(walk.path[0]) || hidden(0), `${path}: the walk starts at ${walk.path[0]}, on the frame and in the open -- it would pop in`);
    assert.ok(off(walk.path[last]) || hidden(last), `${path}: the walk ends on the frame and in the open -- it would vanish`);
    if (walk.heights) assert.equal(walk.heights.length, walk.path.length, `${path}: one height per path point`);
  });
}
