/**
 * A LIFTED FINGER LIGHTS NO OPTION (Tyler, 2026-11-10, on a tablet: an option
 * "was an extra bright color before I clicked on it"). The last tap's place
 * was kept as the pointer's, so the next list lit whatever option fell in that
 * row. Proved against the defect: GameScene assigning its pointer's place
 * directly, as it did, fails the second test.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { restingPoint } from '../engine/core/RestingPointer.ts';

test('a mouse rests where it was left; a finger rests nowhere', () => {
  const at = { x: 10, y: 20 };
  assert.deepEqual(restingPoint({ wasTouch: false }, at), at);
  assert.equal(restingPoint({ wasTouch: true }, at), null);
});

test('the scene keeps the pointer\'s place only through restingPoint', () => {
  const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
  const assignments = [...scene.matchAll(/this\.pointerAt = ([^;]+);/g)].map((m) => m[1] ?? '');
  assert.ok(assignments.length > 0, 'the scene keeps a pointer place');
  for (const value of assignments) assert.match(value, /^restingPoint\(|^null$/, `pointerAt set without restingPoint: ${value}`);
});
