import assert from 'node:assert/strict';
import test from 'node:test';

import { check, stopsOf, talkRuns } from '../tools/check-pacing.mjs';

/** Doc 114's pace, held (errata 243): the arithmetic, and that the real route fails nothing it is not listed as failing. */
const go = (room) => ({ id: `go.${room}`, do: 'go', room });
const talk = { id: 't', do: 'talk' };
const use = { id: 'u', do: 'use', item: 'x', on: 'y' };

test('four stops of nothing but talk in a row is a run; three is not; hands anywhere break it', () => {
  const four = [go('a'), talk, go('b'), talk, go('c'), talk, go('d'), talk];
  assert.equal(talkRuns(stopsOf(four)).length, 1);
  assert.equal(talkRuns(stopsOf(four.slice(0, 6))).length, 0);
  const broken = [go('a'), talk, go('b'), talk, use, go('c'), talk, go('d'), talk];
  assert.equal(talkRuns(stopsOf(broken)).length, 0);
});

test('a room only walked through is not a stop, and TALK TO chosen from the panel is still talk', () => {
  const steps = [go('a'), talk, go('through'), go('b'), { id: 'v', do: 'verb', verb: 'TALK_TO', on: 'z' }];
  const stops = stopsOf(steps);
  assert.deepEqual(stops.map((stop) => stop.room), ['a', 'b']);
  assert.equal(stops.some((stop) => stop.hands), false);
});

test('the played route fails nothing that proofs/pacing.json does not list, and lists nothing that no longer fails', () => {
  const report = check();
  assert.deepEqual(report.failures, []);
});
