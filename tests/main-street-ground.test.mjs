// MAIN STREET'S FLOOR IS THE GROUND, MEETING EACH PORCH AT ITS FOOT (errata 300).
//
// Tyler, 2026-11-13, with a screenshot of the hero standing against the Nugget's
// window: "Thad can walk partway up the side of a building. And he just randomly
// walks up the edge of the porch instead of going up the stairs. On every
// building." The floor had a boardwalk strip the width of the street, from the
// street as first drawn, and the street's far band started above the porches'
// feet. The redrawn street has a porch to each building at its own depth, with
// stairs and gaps.
//
// Held against points read off the plate at 2x: on a porch, a stair or a wall
// he cannot stand; at the foot of each stair and in front of each building he can.
// Both streets, night and dawn, which are the same street.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';

const read = (name) => JSON.parse(readFileSync(new URL(`../content/rooms/${name}.json`, import.meta.url), 'utf8'));
const streets = [read('main-street'), read('main-street-dawn')];

const OFF = [
  [300, 575, "the mercantile's porch"], [235, 610, "the mercantile's stairs"],
  [600, 570, "the Company's porch"], [720, 598, "the Company's stairs"],
  [1000, 575, "the Clarion's porch"], [1450, 585, 'the porch west of the trough'], [1700, 570, 'the porch by the false fronts'],
  [1975, 530, 'the porch behind the trough'], [2350, 585, "the Nugget's porch"], [2440, 525, "the Nugget's window (Tyler's screenshot)"],
  [2700, 600, "the hotel's porch"], [2630, 632, "the hotel's stairs"],
  [2880, 610, "the office's porch"], [3080, 625, "the assay office's porch"], [3060, 652, "the assay office's stairs"],
  [3230, 620, 'the barrel'], [1150, 560, "the notice board, behind its legs"],
];
const ON = [
  [260, 640, "the foot of the mercantile's stairs"], [720, 628, "the foot of the Company's stairs"],
  [1060, 615, "the foot of the Clarion's steps"], [1450, 612, "the foot of the row's steps"],
  [1700, 590, 'in front of the false fronts'], [2250, 618, "the foot of the Nugget's step"],
  [2630, 660, "the foot of the hotel's stairs"], [3060, 672, "the foot of the assay office's stairs"],
  [3477, 603, 'the road out to the claims'], [2018, 652, 'in front of the trough'],
];

test('he cannot stand on a porch, a stair or a wall', () => {
  for (const room of streets) {
    const boxes = new WalkBoxes(room.walkBoxes);
    const on = OFF.filter(([x, y]) => boxes.boxAt(x, y)).map(([x, y, what]) => `${what} (${x},${y}) in ${boxes.boxAt(x, y).id}`);
    assert.deepEqual(on, [], `${room.id}: standing where nobody can`);
  }
});

test('he can stand at the foot of every stair and in front of every building', () => {
  for (const room of streets) {
    const boxes = new WalkBoxes(room.walkBoxes);
    const off = ON.filter(([x, y]) => !boxes.boxAt(x, y)).map(([x, y, what]) => `${what} (${x},${y})`);
    assert.deepEqual(off, [], `${room.id}: no floor where there is ground`);
    for (const [x, y, what] of ON) {
      assert.ok(boxes.route(3300, 760, x, y), `${room.id}: no way from the street to ${what}`);
    }
  }
});

test("every door's stand is at the foot of its stairs, on the ground", () => {
  const boxes = new WalkBoxes(streets[0].walkBoxes);
  for (const exit of streets[0].exits ?? []) {
    if (!exit.walkTo) continue;
    assert.ok(boxes.boxAt(exit.walkTo.x, exit.walkTo.y), `${exit.id}: its stand ${exit.walkTo.x},${exit.walkTo.y} is not on the ground`);
    const off = OFF.find(([x, y]) => Math.abs(x - exit.walkTo.x) < 30 && Math.abs(y - exit.walkTo.y) < 12);
    assert.equal(off, undefined, `${exit.id}: its stand is on ${off?.[2]}`);
  }
});
