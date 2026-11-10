import assert from 'node:assert/strict';
import test from 'node:test';

import { installFrameRate, reading } from '../engine/dev/FrameRate.ts';

/** `?fps` (errata 242): the reading for the Chromebook check. Inert unless asked for; the low is the worst of ten seconds. */
test('nothing is installed where there is no page, or no ?fps', () => {
  assert.equal(installFrameRate(), false);
});

test('the reading is the latest half second, and the lowest of the last ten seconds', () => {
  assert.equal(reading([]), null);
  assert.deepEqual(reading([60, 58, 31, 60]), { now: 60, low: 31 });
  const long = [12, ...Array.from({ length: 20 }, () => 60)];
  assert.deepEqual(reading(long), { now: 60, low: 60 }, 'a dip more than ten seconds old has gone');
});
