import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appliedCandidates,
  askedCandidates,
  resetAppliedCandidates,
  resolveAssetPath,
} from '../engine/dev/CandidateArt.ts';

/**
 * THE ENGINE HALF OF THE PRODUCTION MACHINERY: ruling 10's candidate override.
 *
 * Every test here asserts a REFUSAL. The override is almost entirely made of
 * refusals, and a refusal that has never been observed refusing is
 * indistinguishable from a function that returns.
 *
 * The tools half is `tests/production-tools.test.mjs`, separately because the
 * validators and the art pipeline are plain ESM and tsconfig covers `engine`
 * and `tests` -- importing a .mjs from a checked .ts makes it implicitly any,
 * and loosening the compiler to allow that would be a project-wide change
 * bought for one import.
 */

test('a candidate override may only point at a staged file', () => {
  const shipping = 'art/backgrounds/room-01-stage-road.png';
  globalThis.window = {
    location: { search: `?candidate=${encodeURIComponent(`${shipping}=${shipping}`)}` },
  } as unknown as Window & typeof globalThis;
  assert.throws(() => askedCandidates(), /not under art\/staging\//);
  delete (globalThis as { window?: unknown }).window;
});

test('a malformed candidate parameter throws rather than being skipped', () => {
  globalThis.window = {
    location: { search: '?candidate=nonsense' },
  } as unknown as Window & typeof globalThis;
  // Skipping it would draw the SHIPPING plate and file the result as a proof
  // of the candidate, which is the one failure the mechanism exists to stop.
  assert.throws(() => askedCandidates(), /must read from=to/);
  delete (globalThis as { window?: unknown }).window;
});

test('a candidate substitution is reported, so the proof can assert it happened', () => {
  resetAppliedCandidates();
  const swaps = [{ from: 'art/backgrounds/x.png', to: 'art/staging/room-05/plate-03.png' }];
  assert.equal(resolveAssetPath('art/backgrounds/x.png', swaps), 'art/staging/room-05/plate-03.png');
  assert.equal(resolveAssetPath('art/backgrounds/other.png', swaps), 'art/backgrounds/other.png');
  assert.equal(appliedCandidates().length, 1);
  resetAppliedCandidates();
});
