import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

/**
 * ERRATA 205'S FOUR, GRADED (errata 207; Tyler, 2026-11-08: "Fix all five").
 * The check found four figures brighter than Thad where they stand and listed
 * them as known; each is now graded into its room by the room's `figureLight`
 * and the list is empty. Each must pass with some room to spare, and each,
 * with its grade taken away, must be flagged again: the check, not a list,
 * holds them now.
 */
const GRADED = [
  { figure: 'bakehouse_boy', room: 'bakehouse' },
  { figure: 'sheng', room: 'laundry' },
  { figure: 'boundary_b', room: 'claim_row' },
  { figure: 'fiddler', room: 'nugget' },
];
const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const roomFile = (id) => readJson('content/manifest.json').rooms.map(readJson).find((one) => one.id === id);
/** The room's figureLight without this figure: none at all if it named only him. */
const withoutGrade = (room, figure) => {
  const light = room.figureLight;
  const rest = (light?.figures ?? []).filter((id) => id !== figure);
  return { figureLight: rest.length ? { ...light, figures: rest } : undefined };
};

for (const { figure, room } of GRADED) {
  test(`${figure} is graded into the ${room}'s night, and would be too bright without it`, () => {
    const file = roomFile(room);
    assert.ok(file?.figureLight?.figures.includes(figure), `the ${room}'s figureLight names ${figure}`);
    const graded = find(measureCast().measured, figure, room);
    assert.ok(graded && !graded.flagged, `graded, ${figure} measures ${graded?.ratio.toFixed(2)} of Thad there, over the limit ${graded?.limit.toFixed(2)}`);
    assert.ok(graded.ratio <= graded.limit * 0.97, `${figure} passes by a hair (${graded.ratio.toFixed(3)} against ${graded.limit.toFixed(3)}): leave some margin`);
    const bare = find(measureCast({ rooms: { [room]: withoutGrade(file, figure) } }).measured, figure, room);
    assert.ok(bare.flagged, `without its grade ${figure} measures ${bare.ratio.toFixed(2)}, under the limit ${bare.limit.toFixed(2)}: the check would not hold it`);
  });
}
