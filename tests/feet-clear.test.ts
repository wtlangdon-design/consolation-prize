// HIS BOOTS NEVER STAND IN A THING ON THE FLOOR (errata 316).
//
// Tyler, 2026-11-14: "Thad is able to walk through the bag in Room 1. He should have to walk around it. He also can
// walk through the spittoon in [Room 3], and he shouldn't be able to."
//
// The barrel had taught it already (tools/gauntlet/barrel-proof.mjs): the walk boxes say where his CENTRE may be, and
// his feet reach past it, 29 px to the left and 43 to the right in Room 3's barrel row, where he is about 426 tall.
// The spittoon was carved at its own width, so he could stand with a boot in the brass; the case on the stage road was
// not carved at all.
//
// Held here for every thing on a floor that a person reported walking through, and for the barrel that first taught
// it: from every point of every walk box open while the thing is there, at that point's own height, his feet do not
// overlap the thing as drawn -- level with it (a sprite sorted at its feet: he may pass behind it, where it covers his
// legs), or anywhere behind its base too (a thing painted into the plate, which can never cover him).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import type { WalkBox } from '../engine/core/types.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const room = (name: string) => json(`content/rooms/${name}.json`);
// Room 3, by its annotation, so the file is named by the content and not by this test.
const ROOM_3 = String(json('reference/room-03/annotation.json').room).replace(/_/g, '-');

// His reach at the barrel's row, as a share of his height there (barrel-proof: 29 left, 43 right, at about 426).
const LEFT = 29 / 426;
const RIGHT = 43 / 426;
// How near his feet may come to a sprite's own base line, before or behind it, and still read as level with it: nearer
// than this and the sort that puts him in front of it or behind it flips across his boots.
const LEVEL = 4;

type Thing = {
  room: string; what: string; drawn: [number, number, number, number]; painted: boolean;
  flags?: Record<string, boolean>;
};
const THINGS: Thing[] = [
  // Drawn: x 1010-1099, feet at y838 (art/objects/room-01-case-mud.png's own box); a sprite, until he picks it up.
  { room: 'stage-road', what: 'his case in the mud', drawn: [1010, 747, 89, 91], painted: false, flags: { T_CASE_TAKEN: false } },
  // Drawn: x 1364-1454, y 740-818, painted into the plate.
  { room: ROOM_3, what: 'the spittoon', drawn: [1364, 740, 90, 78], painted: true },
  // Drawn 817-962 at 890,812 (reference/room-03/annotation.json); a prop sorted at its feet.
  { room: ROOM_3, what: 'the whiskey barrel', drawn: [817, 700, 145, 112], painted: false },
];

function faults(boxes: WalkBox[], thing: Thing): string[] {
  const [x0, top, w, h] = thing.drawn;
  const x1 = x0 + w;
  const base = top + h;
  const out: string[] = [];
  for (const box of boxes) {
    const xs = box.points.map((p) => p.x);
    const ys = box.points.map((p) => p.y);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += 2) {
      const behind = thing.painted ? y >= top && y < base : Math.abs(y - base) < LEVEL;
      if (!behind) continue;
      const tall = heightIn(box, y);
      for (let x = Math.min(...xs); x <= Math.max(...xs); x += 2) {
        // A pixel's grace: the carve is cut on whole pixels and his reach is a fraction of one past them.
        if (x - tall * LEFT < x1 - 1 && x + tall * RIGHT > x0 + 1) out.push(`${box.id} (${x}, ${y})`);
      }
    }
  }
  return out;
}

for (const thing of THINGS) {
  test(`${thing.room}: from no point of its floor do his boots stand in ${thing.what}`, () => {
    const holds = (when?: Record<string, unknown>) => !when || Object.entries(when)
      .every(([flag, want]) => (thing.flags?.[flag] ?? false) === want);
    const boxes = new WalkBoxes(room(thing.room).walkBoxes, holds as never).all;
    assert.ok(boxes.length > 0, 'the floor is read');
    const bad = faults(boxes, thing);
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} points put a boot in ${thing.what}`);
  });
}

test('the check finds a boot in a thing carved only at its own width', () => {
  // The spittoon as it was carved before errata 316: its own rect, and the floor either side of it running up to it.
  const box = (id: string, x0: number, x1: number): WalkBox => ({
    id, points: [{ x: x0, y: 759 }, { x: x1, y: 759 }, { x: x1, y: 812 }, { x: x0, y: 812 }], neighbours: [], clipPlane: 0,
    surface: 'mud', scaleMode: { kind: 'fixed', height: 426 },
  } as unknown as WalkBox);
  assert.ok(faults([box('left', 1005, 1364), box('right', 1454, 1497)], THINGS[1]!).length > 0);
});
