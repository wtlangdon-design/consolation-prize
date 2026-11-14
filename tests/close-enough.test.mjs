// NO ROOM SO FAR AWAY THAT IT FEELS IMPERSONAL (errata 312).
//
// Tyler, 2026-11-14, of Main Street: "It seems so zoomed out right now, which make it kind of feel impersonal." A man
// at the front of the street was drawn 206 px tall, against 263 on the stage road and 459 in the Nugget. The street is
// now shown through a zoomed camera (RoomFile.zoom), and no room a man walks in shows him smaller than the stage road
// does, nearest the screen.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DIR = new URL('../content/rooms/', import.meta.url);
const rooms = readdirSync(DIR).filter((name) => name.endsWith('.json') && !name.includes('candidate'))
  .map((name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')));
const near = (room) => {
  const curve = (room.walkBoxes ?? []).find((box) => box.scaleMode?.kind === 'curve')?.scaleMode;
  return curve ? curve.nearHeight * (room.zoom ?? 1) : null;
};

test('nearest the screen, a man is drawn at least as large as on the stage road, in every room he walks', () => {
  const floor = near(rooms.find((room) => room.id === 'stage_road'));
  const small = rooms.filter((room) => near(room) !== null && near(room) < floor - 1)
    .map((room) => `${room.id}: ${Math.round(near(room))} px`);
  assert.deepEqual(small, [], `smaller than the stage road's ${floor} px`);
});

test('a zoomed room is zoomed by a whole camera, not by redrawing it: its rects stay the plate\'s', () => {
  for (const room of rooms.filter((one) => (one.zoom ?? 1) !== 1)) {
    assert.ok(room.zoom > 1 && room.zoom <= 2, `${room.id}: zoom ${room.zoom}`);
    assert.equal(room.size?.[1] ?? 864, 864, `${room.id}: the plate is still the play area's height`);
  }
});
