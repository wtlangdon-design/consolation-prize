import assert from 'node:assert/strict';
import test from 'node:test';

import { buildModel, loadModelContent, reach, winReached } from '../tools/lib/puzzle-model.mjs';

/**
 * THE ROOM CAN'T BE SKIPPED (errata 220). Act IV opens in Room 19, Thad's hotel room, which A2 grants. The
 * traversal of errata 219 found A2 was not needed for the win: a player could skip the room and wake in Act IV
 * in a room he never got. The office door now waits for it (doc 57 A10). This holds it: with A2's completing
 * site barred, the win must be out of reach.
 */
test('the win needs A2, the hotel room', () => {
  const model = buildModel(loadModelContent());
  assert.ok(winReached(model, reach(model)), 'the win is not reachable at all');
  const exclude = new Set(model.sites.filter((site) => site.yields.includes('p:A2')).map((site) => site.index));
  assert.ok(exclude.size > 0, "no site completes A2, so the test would pass on anything");
  assert.equal(winReached(model, reach(model, { exclude })), false, 'the win is reachable without the hotel room');
});
