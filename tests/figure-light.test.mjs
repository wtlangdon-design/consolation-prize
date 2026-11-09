import assert from 'node:assert/strict';
import test from 'node:test';

import { LIMIT, measureCast } from '../tools/check-figure-light.mjs';

/**
 * NO FIGURE BRIGHTER THAN ITS NIGHT, CALIBRATED ON THE CASES THAT ARE KNOWN
 * (errata 205). tools/check-figure-light.mjs holds every placed figure to
 * Thad's brightness where it stands; this proves it catches what it is named
 * after and does not cry wolf at a lamp, by putting the known cases back.
 *
 *   errata 198's horses, as they were before the grade -- at 1545,850, with no
 *   `figureLight` on Main Street -- must be flagged (Tyler: "lit a little too
 *   bright"), and the horses as they are must not;
 *   the map seller, painted in the office lantern's light, must pass in the
 *   lantern's pool, and must fail if the lamps are taken away: the room's own
 *   light is what passes him, not a loose limit.
 */
const find = (measured, figure, room) => measured.find((one) => one.figure === figure && one.room === room);

test("errata 198's horses before the grade are brighter than their night", () => {
  const { measured } = measureCast({
    ambient: { hitching_horses: { x: 1545, y: 850 } },
    rooms: { main_street: { figureLight: undefined } },
  });
  const horses = find(measured, 'hitching_horses', 'main_street');
  assert.ok(horses, 'the horses are measured');
  assert.ok(horses.flagged, `ungraded, the horses measure ${horses.ratio.toFixed(2)} of Thad there, under the limit ${horses.limit.toFixed(2)}`);
});

test('the horses as errata 198 graded them are in the same night as Thad', () => {
  const horses = find(measureCast().measured, 'hitching_horses', 'main_street');
  assert.ok(horses && !horses.flagged, `graded, the horses measure ${horses?.ratio.toFixed(2)} of Thad there, over the limit ${horses?.limit.toFixed(2)}`);
  assert.ok(horses.ratio < 1, 'and no brighter than him');
});

test('the pie woman, errata 198\'s measure of the street\'s night, passes', () => {
  const pie = find(measureCast().measured, 'pie_woman', 'main_street');
  assert.ok(pie && !pie.flagged, `the pie woman measures ${pie?.ratio.toFixed(2)}`);
});

test("the map seller is lit by the office lantern, and passes only because he stands in its pool", () => {
  const lit = find(measureCast().measured, 'map_seller', 'main_street');
  assert.ok(lit && !lit.flagged, `in the lantern's pool the map seller measures ${lit?.ratio.toFixed(2)}, over ${lit?.limit.toFixed(2)}`);
  assert.ok(lit.allowance > 1, 'the lantern raises his limit');
  const dark = find(measureCast({ rooms: { main_street: { lamps: [] } } }).measured, 'map_seller', 'main_street');
  assert.ok(dark.flagged, `with no lamp the map seller (${dark.ratio.toFixed(2)}) would be over the night's limit ${LIMIT}`);
});
