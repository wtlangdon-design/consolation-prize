// THE TROUGH IS WHERE IT IS DRAWN, AND NOBODY WALKS THROUGH IT (errata 299).
//
// Tyler, 2026-11-13, with a screenshot of the hero standing in the water: "He's
// walking through the water trough. I thought we made sure that couldn't happen?"
// It had been made so, on the street as first drawn. When the plate was redrawn the
// trough moved 45 px to the right and its rect, shared by the hotspot and the
// obstacle ("one truth, not two"), stayed where it was. The walk boxes were cut
// round an empty patch of mud, and the trough's right half and its front were floor.
// The dawn street (the same street) carried the same rect.
//
// Held here against the plate itself: the trough's drawn landmarks lie inside its
// obstacle; no walk box takes in any of it; a walk from one side of the street to
// the other never crosses it; and the two streets agree.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';
import { readPng } from '../tools/lib/png.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const streets = [
  { room: read('content/rooms/main-street.json'), annotation: read('reference/room-02/annotation.json') },
  { room: read('content/rooms/main-street-dawn.json'), annotation: read('reference/room-36/annotation.json') },
];
const trough = (annotation) => annotation.obstacles.find((one) => one.id === 'water_trough')?.rect;
const inside = ([x, y, w, h], point) => point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;

// What the plate shows, read off it at 3x: the left leg, the front leg's foot, the right-hand corner, the rim; and
// the trough as drawn, rim to feet. Held as numbers, not as the annotation's rect, because the annotation's rect is
// what went wrong.
const LANDMARKS = [{ x: 1915, y: 620 }, { x: 2052, y: 636 }, { x: 2118, y: 600 }, { x: 1960, y: 558 }];
const DRAWN = [1910, 556, 214, 84];

test('the trough\'s obstacle covers the trough as drawn, water and legs', () => {
  for (const { room, annotation } of streets) {
    const rect = trough(annotation);
    for (const point of LANDMARKS) assert.ok(inside(rect, point), `${room.id}: ${point.x},${point.y} is trough and outside ${rect}`);
    // And the water: every blue pixel in the trough's neighbourhood is inside the rect.
    const image = readPng(readFileSync(new URL(`../${room.background}`, import.meta.url)));
    let water = 0;
    for (let y = 545; y < 600; y += 1) {
      for (let x = 1900; x < 2135; x += 1) {
        const at = (y * image.width + x) * 4;
        const [r, b] = [image.pixels[at], image.pixels[at + 2]];
        if (b > r + 40 && b > 60) {
          water += 1;
          assert.ok(inside(rect, { x, y }), `${room.id}: water at ${x},${y} lies outside the trough's obstacle`);
        }
      }
    }
    assert.ok(water > 100, `${room.id}: found ${water} pixels of water; is the trough still here?`);
    assert.deepEqual(annotation.hotspots.water_trough, rect, `${room.id}: the hotspot and the obstacle are one rect`);
  }
});

test('no walk box takes in the trough, and no walk crosses it', () => {
  for (const { room, annotation } of streets) {
    const [tx, ty, tw, th] = DRAWN;
    void annotation;
    for (const box of room.walkBoxes) {
      const xs = box.points.map((point) => point.x); const ys = box.points.map((point) => point.y);
      const overlaps = Math.min(...xs) < tx + tw && Math.max(...xs) > tx && Math.min(...ys) < ty + th && Math.max(...ys) > ty;
      assert.ok(!overlaps, `${room.id}: walk box ${box.id} takes in the trough`);
    }
    // Walks across the street past it, every way round: none of their legs passes through it.
    const boxes = new WalkBoxes(room.walkBoxes);
    const ends = [{ x: 1700, y: 600 }, { x: 2300, y: 600 }, { x: 2018, y: 700 }, { x: 1850, y: 800 }, { x: 2200, y: 800 }];
    for (const from of ends) {
      for (const to of ends) {
        if (from === to) continue;
        const route = boxes.route(from.x, from.y, to.x, to.y);
        assert.ok(route, `${room.id}: no way from ${from.x},${from.y} to ${to.x},${to.y}`);
        let at = from;
        for (const point of route.waypoints) {
          for (let step = 0; step <= 40; step += 1) {
            const probe = { x: at.x + ((point.x - at.x) * step) / 40, y: at.y + ((point.y - at.y) * step) / 40 };
            assert.ok(!inside([tx + 1, ty + 1, tw - 2, th - 2], probe),
              `${room.id}: the walk from ${from.x},${from.y} to ${to.x},${to.y} goes through the trough at ${Math.round(probe.x)},${Math.round(probe.y)}`);
          }
          at = point;
        }
      }
    }
  }
});
