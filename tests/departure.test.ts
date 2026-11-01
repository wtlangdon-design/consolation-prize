import assert from 'node:assert/strict';
import test from 'node:test';

import { departureAt } from '../engine/core/Departure.ts';
import type { AmbientExit } from '../engine/core/types.ts';

/**
 * A CHARACTER NEVER JUST DISAPPEARS (Tyler, 2026-11-01). A departing figure's
 * place and frame are a pure function of his exit and the time.
 */
const walk: AmbientExit = {
  path: [[100, 100], [0, 100], [0, 50]],
  speed: 50,
  sheet: 'x.png',
  frames: [[0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1]],
  fps: 6,
  drawnFacing: 'left',
  figureHeight: 10,
};

test('he walks the path at its speed, leg by leg, and is done only at its end', () => {
  assert.deepEqual(departureAt(walk, 0), { x: 100, y: 100, heading: -1, frame: 0, done: false });
  const mid = departureAt(walk, 1);
  assert.equal(mid.x, 50);
  assert.equal(mid.heading, -1, 'walking left along the first leg');
  assert.equal(departureAt(walk, 2).x, 0, 'the corner after 100 px');
  assert.equal(departureAt(walk, 2.5).y, 75, 'and on along the second leg');
  assert.equal(departureAt(walk, 2.9).done, false);
  assert.equal(departureAt(walk, 3).done, true, '150 px at 50 px/s');
});

test('the walk cycle advances at its fps and wraps', () => {
  assert.equal(departureAt(walk, 0.1).frame, 0);
  assert.equal(departureAt(walk, 0.2).frame, 1);
  assert.equal(departureAt(walk, 0.5).frame, 0, 'three frames at 6 fps wrap after half a second');
});
