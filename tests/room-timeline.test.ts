import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { RoomTimeline } from '../engine/core/RoomTimeline.ts';
import type { RoomFile } from '../engine/core/types.ts';

/**
 * Errata 70 G. The coffin's clock is ACTIVE time: doc 45's 180,000 ms are
 * "active, unpaused", so a paused frame adds nothing, and a long frame
 * delivers every step it covered rather than skipping any.
 */
test('steps arrive in order, a long frame delivers all it covered', () => {
  const timeline = new RoomTimeline();
  timeline.start([
    { at: 2, do: 'panel', show: true },
    { at: 1, do: 'plate', plate: 'a' },
    { at: 3, do: 'plate', plate: 'b' },
  ]);
  assert.deepEqual(timeline.advance(999).map((s) => s.at), []);
  assert.deepEqual(timeline.advance(1).map((s) => s.at), [1]);
  assert.deepEqual(timeline.advance(5000).map((s) => s.at), [2, 3]);
  assert.equal(timeline.isRunning, false);
});

test('a paused frame (zero active time) moves nothing', () => {
  const timeline = new RoomTimeline();
  timeline.start([{ at: 1, do: 'plate', plate: 'a' }]);
  for (let i = 0; i < 100; i += 1) assert.deepEqual(timeline.advance(0), []);
  assert.equal(timeline.elapsed, 0);
});

test('Room 32 keeps its contract: no hotspots, no exits, the panel back at 180 s with the score', () => {
  const room = JSON.parse(readFileSync('content/rooms/coffin.json', 'utf8')) as RoomFile;
  assert.equal(room.interface, 'none');
  assert.equal(room.hotspots.length, 0, 'invariant 2: no hotspots');
  assert.equal(room.music, 'suspend');
  const at180 = (room.timeline ?? []).filter((step) => step.at === 180).map((step) => step.do);
  assert.ok(at180.includes('panel') && at180.includes('music'), 'R32-RETURN and the panel, together');
  const last = Math.max(...(room.timeline ?? []).filter((s) => s.do === 'sound' && s.at < 180).map((s) => s.at));
  assert.ok(last <= 90, 'nothing but silence between the last shovelful and the dig');
  const panelSteps = (room.timeline ?? []).filter((step) => step.do === 'panel');
  assert.ok(panelSteps.every((step) => step.at >= 180), 'the panel never returns early');
  for (const step of room.timeline ?? []) {
    if (step.do === 'plate') assert.ok(room.plates?.[step.plate], `plate ${step.plate} is declared`);
  }
});
