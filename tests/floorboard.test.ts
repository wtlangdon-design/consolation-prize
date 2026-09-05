import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { StepTriggers, segmentCrossesRect, insideRect } from '../engine/core/StepTriggers.ts';
import type { Interactable } from '../engine/core/types.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * A BOARD THAT ANSWERS A FOOT, exercised through movement geometry.
 *
 * The room, its board and its tread are read from the shipped content, not
 * spelled here: the engine does not know which board is loose. What is
 * asserted is the mechanism -- a walk across the tread presses it once, a
 * walk that tunnels through it at pace C presses it once, standing on it
 * presses it no more, stepping off re-arms it, and a path beside it presses
 * nothing.
 */
async function board(): Promise<Interactable & { step: NonNullable<Interactable['step']> }> {
  const manifest = JSON.parse(await readFile(resolve(ROOT, 'content/manifest.json'), 'utf8'));
  for (const path of manifest.rooms as string[]) {
    const room = JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
    for (const target of room.hotspots ?? []) {
      if (target.step) return target;
    }
  }
  throw new Error('no room declares a hotspot with a step');
}

/** Walk the feet from a to b in steps of `stride` pixels, ticking the boards each step. */
function walk(steps: StepTriggers, from: [number, number], to: [number, number], stride: number,
              states: string[], startMs = 0, msPerStep = 16): number {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const n = Math.max(1, Math.ceil(length / stride));
  let fired = 0;
  let [x, y] = from;
  for (let i = 1; i <= n; i += 1) {
    const nx = from[0] + dx * (i / n), ny = from[1] + dy * (i / n);
    const out = steps.update(startMs + i * msPerStep, x, y, nx, ny, true, (_t, s) => states.push(s));
    fired += out.fired.length;
    x = nx; y = ny;
  }
  return fired;
}

test('the segment clip sees a crossing that never lands a frame inside the tread', () => {
  const tread: [number, number, number, number] = [960, 707, 138, 18];
  assert.equal(segmentCrossesRect(1000, 700, 1000, 740, tread), true);
  assert.equal(segmentCrossesRect(900, 730, 1150, 700, tread), true);
  assert.equal(segmentCrossesRect(900, 760, 1150, 760, tread), false);
  assert.equal(segmentCrossesRect(940, 700, 940, 740, tread), false);
  assert.equal(insideRect(1000, 712, tread), true);
  assert.equal(insideRect(1000, 730, tread), false);
});

test('a walk across the board presses it once, standing on it presses it no more, stepping off re-arms it', async () => {
  const target = await board();
  const [tx, ty, tw, th] = target.step.tread;
  const cx = tx + tw / 2;
  const states: string[] = [];
  const steps = new StepTriggers([target], cx, ty + th + 60);
  // up onto the board in 4 px strides (a slow walk), stopping on it
  assert.equal(walk(steps, [cx, ty + th + 60], [cx, ty + th / 2], 4, states), 1);
  assert.deepEqual(states, [target.step.pressed]);
  // standing still on it for a while: no new press, and the board comes back up after its hold
  let now = 2000;
  for (let i = 0; i < 60; i += 1) {
    const out = steps.update(now += 16, cx, ty + th / 2, cx, ty + th / 2, false, (_t, s) => states.push(s));
    assert.equal(out.fired.length, 0);
  }
  assert.deepEqual(states, [target.step.pressed, target.step.rest]);
  // shuffling on the board while walking, still on it: silent
  assert.equal(walk(steps, [cx, ty + th / 2], [cx + 20, ty + th / 2], 4, states, 4000), 0);
  // off it, and straight back on: one more press
  assert.equal(walk(steps, [cx + 20, ty + th / 2], [cx + 20, ty + th + 60], 4, states, 5000), 0);
  assert.equal(walk(steps, [cx + 20, ty + th + 60], [cx + 20, ty + th / 2], 4, states, 6000), 1);
});

test('a pace-C crossing that tunnels through the tread in one stride still presses it exactly once', async () => {
  const target = await board();
  const [tx, ty, tw, th] = target.step.tread;
  const cx = tx + tw / 2;
  const states: string[] = [];
  const steps = new StepTriggers([target], cx, ty - 40);
  // 30 px strides across an 18 px tread: no frame lands inside it
  assert.equal(walk(steps, [cx, ty - 40], [cx, ty + th + 40], 30, states), 1);
  // and back, five times each way, one press per crossing
  let fired = 0; let t = 1000;
  for (let i = 0; i < 5; i += 1) {
    fired += walk(steps, [cx, ty + th + 40], [cx, ty - 40], 30, states, t += 1000);
    fired += walk(steps, [cx, ty - 40], [cx, ty + th + 40], 30, states, t += 1000);
  }
  assert.equal(fired, 10);
});

test('a path beside the board presses nothing, and a placement onto it is not a step', async () => {
  const target = await board();
  const [tx, ty, tw, th] = target.step.tread;
  const states: string[] = [];
  const steps = new StepTriggers([target], tx - 200, ty + th + 40);
  // along the floor below the board, its whole length
  assert.equal(walk(steps, [tx - 200, ty + th + 40], [tx + tw + 200, ty + th + 40], 8, states), 0);
  // along the board's own row but past its end
  assert.equal(walk(steps, [tx + tw + 200, ty + th / 2], [tx + tw + 20, ty + th / 2], 8, states), 0);
  // a placement (not walking) onto the board: silent, and it arms from there
  const placed = steps.update(100, tx + tw + 20, ty + th / 2, tx + tw / 2, ty + th / 2, false, (_t, s) => states.push(s));
  assert.equal(placed.fired.length, 0);
  assert.deepEqual(states, []);
});

test('the board declares both state images and they exist on disk', async () => {
  const target = await board();
  for (const name of [target.step.rest, target.step.pressed]) {
    const image = target.states?.[name]?.image;
    assert.ok(image, `state ${name} has an image`);
    assert.ok(existsSync(resolve(ROOT, image)), `${image} exists`);
  }
  assert.equal(target.state, target.step.rest);
});
