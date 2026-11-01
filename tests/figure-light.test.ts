import assert from 'node:assert/strict';
import { test } from 'node:test';

import { conversationFrameAt, gradeFilter } from '../engine/render/Renderer.ts';

const sprite = { sheet: 's.png', frames: [[0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1], [3, 0, 1, 1]], rate: 0.5, talkFrame: 2,
  breakEvery: 5, breaks: [[3, 3]] } as never;

test('in conversation a figure breathes on its idle frames, and shows its talk frame only while speaking', () => {
  const seen = new Set<number>();
  for (let t = 0; t < 20; t += 0.1) seen.add(conversationFrameAt(sprite, 0, t, false));
  assert.deepEqual([...seen].sort(), [0, 1], 'breathing only: no talk frame, no breaks, while listening');
  for (let t = 0; t < 5; t += 0.5) assert.equal(conversationFrameAt(sprite, 0, t, true), 2);
});

test('the grade filter carries only what the room declares', () => {
  assert.equal(gradeFilter({ figures: [] }), 'none');
  assert.equal(gradeFilter({ figures: [], brightness: 0.88, saturate: 1.05 }), 'brightness(0.88) saturate(1.05)');
});
