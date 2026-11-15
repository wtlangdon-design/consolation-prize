// A WAY OUT ON THE GROUND STARTS WHERE THE FLOOR ENDS (errata 322).
//
// Tyler, 2026-11-14: "Once you go into the Road to the Claims room, is there a way out? I couldn't figure it out and
// could only leave via the map." There was: a 140 px strip of scrub in the bottom-left corner, 20 px short of the end
// of the road, with no path drawn to it. Claim Row, the creek, Mott's site, the high ridge and Pratt's claim had the
// same strip. A player walks to the end of the floor and clicks there, and nothing happened.
//
// Held here: every way out that comes down to the ground (its rect reaches the bottom of the play area, which a door
// in a wall does not) overlaps the floor that is always open, so the floor's own end is the way out. One is excused
// by name, because its way is drawn: the ledge's zigzag path down to the tents.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DRAWN = { 'ledge/to_tents': 'errata 322: the zigzag path down the cliff is drawn, and the way out is laid on it' };
const GROUND = 850;

const DIR = new URL('../content/rooms/', import.meta.url);
const rooms = readdirSync(DIR).filter((name) => name.endsWith('.json') && !name.includes('candidate'))
  .map((name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')));

const bounds = (box) => {
  const xs = box.points.map((p) => p.x); const ys = box.points.map((p) => p.y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

export function offTheFloor(room) {
  const floor = (room.walkBoxes ?? []).filter((box) => !box.when).map(bounds);
  if (!floor.length) return [];
  return (room.exits ?? []).filter((exit) => {
    if (!exit.rect) return false;
    const [x, y, w, h] = exit.rect;
    if (y + h < GROUND) return false;
    return !floor.some(([x0, y0, x1, y1]) => x <= x1 && x + w >= x0 && y <= y1 && y + h >= y0);
  }).map((exit) => `${room.id}/${exit.id}`);
}

test('every way out on the ground overlaps the floor, so walking to the floor\'s end leaves', () => {
  const bad = rooms.flatMap(offTheFloor).filter((id) => !(id in DRAWN));
  assert.deepEqual(bad, []);
});

test('the check finds the Road to the Claims as it was', () => {
  const road = rooms.find((room) => room.id === 'claims_road');
  const before = { ...road, exits: road.exits.map((exit) => (exit.id === 'to_main_street' ? { ...exit, rect: [0, 640, 140, 224] } : exit)) };
  assert.deepEqual(offTheFloor(before), ['claims_road/to_main_street']);
});

test('each excused way out still is one', () => {
  for (const id of Object.keys(DRAWN)) assert.ok(rooms.flatMap(offTheFloor).includes(id), `${id} no longer needs excusing`);
});
