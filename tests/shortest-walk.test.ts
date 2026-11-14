// THE SHORTEST WALK, NOT THE FEWEST BOXES.
//
// Tyler, 2026-11-11, playing Main Street: "[the hero] took a very weird walk to get to
// the map salesman. Instead of going straight to him, he walked over by the dog
// and back around." The router chose the chain with the fewest walk boxes, and
// from the front of the street that chain went up through the box beside the dog
// and back along the far band: 7.6 times the distance. It now walks every chain
// up to two boxes longer on paper and takes the shortest (engine/core/WalkBoxes.ts).

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';
import type { Point, WalkBox } from '../engine/core/types.ts';

const DIR = new URL('../content/rooms/', import.meta.url);
const rooms = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => ({ name, room: JSON.parse(readFileSync(new URL(name, DIR), 'utf8')) as { walkBoxes?: WalkBox[]; x?: number } }))
  .filter(({ room }) => (room.walkBoxes?.length ?? 0) > 0);

function walked(from: Point, waypoints: Point[]): number {
  let length = 0;
  let at = from;
  for (const point of waypoints) {
    length += Math.hypot(point.x - at.x, point.y - at.y);
    at = point;
  }
  return length;
}

test('the hero walks straight to a person ahead of him, not round an obstacle behind him', () => {
  const room = JSON.parse(readFileSync(new URL('main-street.json', DIR), 'utf8')) as { walkBoxes: WalkBox[] };
  const seller = JSON.parse(readFileSync(new URL('../content/ambient/map-seller.json', import.meta.url), 'utf8')) as Point;
  const boxes = new WalkBoxes(room.walkBoxes);
  const stand = { x: seller.x - 150, y: seller.y };
  for (const from of [{ x: 3100, y: 800 }, { x: 2950, y: 840 }, { x: 3400, y: 800 }]) {
    const route = boxes.route(from.x, from.y, stand.x, stand.y);
    assert.ok(route, 'there is a way');
    const straight = Math.hypot(stand.x - from.x, stand.y - from.y);
    assert.ok(walked(from, route.waypoints) < straight * 1.6,
      `from ${from.x},${from.y} he walks ${Math.round(walked(from, route.waypoints))} px for ${Math.round(straight)} px: ${route.boxes.join(' > ')}`);
    assert.ok(!route.boxes.includes('mud_mid_1'), 'and not by way of the box behind');
  }
});

test('in every room, no walk goes far out of its way', () => {
  // Every pair of sample points across every room's boxes. An obstacle between two points makes a fair detour
  // (round the hitching rail and its horses is about twice the distance plus a step), so the bound is generous; the dog's detour was 3.
  for (const { name, room } of rooms) {
    const boxes = new WalkBoxes(room.walkBoxes as WalkBox[]);
    const points: Point[] = [];
    for (const box of room.walkBoxes as WalkBox[]) {
      const xs = box.points.map((point) => point.x);
      const ys = box.points.map((point) => point.y);
      for (const fx of [0.25, 0.75]) {
        for (const fy of [0.5]) {
          const point = { x: Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * fx, y: Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * fy };
          if (boxes.boxAt(point.x, point.y)) points.push(point);
        }
      }
    }
    // At most twenty points a room, spread across its boxes: the bound is about detours between regions, and the
    // check has a time budget (CI's 180 s).
    const step = Math.max(1, Math.ceil(points.length / 20));
    const sample = points.filter((_, index) => index % step === 0);
    for (const from of sample) {
      for (const to of sample) {
        const straight = Math.hypot(to.x - from.x, to.y - from.y);
        if (straight < 50) continue;
        const route = boxes.route(from.x, from.y, to.x, to.y);
        if (!route) continue;
        // ONTO A PORCH IS UP ITS STAIRS (errata 301), however near the porch's front he starts: a fair detour.
        if (route.boxes.some((id) => id.startsWith('stairs_'))) continue;
        const ratio = walked(from, route.waypoints) / (straight + 150);
        assert.ok(ratio <= 2.2, `${name}: ${Math.round(from.x)},${Math.round(from.y)} to ${Math.round(to.x)},${Math.round(to.y)} `
          + `walks ${ratio.toFixed(2)} times the way, by ${route.boxes.join(' > ')}`);
      }
    }
  }
});
