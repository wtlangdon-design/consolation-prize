// WHAT A FIGURE PICKS UP COMES OFF WHAT IT STOOD ON (errata 307).
//
// Tyler, 2026-11-14: Deke "holds up a full glass of beer. He doesn't take it off the barrel in front of him so it
// just kind of appears and disappears with the animation." And after the swindle "the beer glass on the barrel is
// just suddenly empty": the drink was never shown. A glass in his hand is the glass off the barrel (RoomProp.heldBy),
// and he is seen to finish it before it stands there empty.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { readPng } from '../tools/lib/png.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const rooms = readdirSync(new URL('../content/rooms/', import.meta.url)).filter((name) => name.endsWith('.json')).map((name) => json(`content/rooms/${name}`));
const ambient = readdirSync(new URL('../content/ambient/', import.meta.url)).filter((name) => name.endsWith('.json')).map((name) => json(`content/ambient/${name}`));
const png = (path) => readPng(readFileSync(new URL(`../${path}`, import.meta.url)));
const directions = json('content/acted-directions.json').directions;

// A figure's frames that hold a room prop's part, and the prop it comes off. Each is drawn in the frames named.
const HELD = [{ figure: 'deke_vessel', prop: 'whiskey_barrel', frames: [6, 7], what: 'his glass', box: [46, 0, 31, 8] }];

test('every held prop names a figure in its room, and sheets the size of its own', () => {
  for (const room of rooms) {
    for (const prop of (room.props ?? []).filter((one) => one.heldBy)) {
      assert.ok(ambient.some((npc) => npc.id === prop.heldBy.figure && npc.room === room.id), `${room.id}: ${prop.id} is held by ${prop.heldBy.figure}, who is not here`);
      const own = png(prop.sheet);
      for (const sheet of Object.values(prop.heldBy.sheets)) {
        assert.ok(existsSync(new URL(`../${sheet}`, import.meta.url)), `${prop.id}: ${sheet}`);
        const other = png(sheet);
        assert.deepEqual([other.width, other.height], [own.width, own.height], `${prop.id}: ${sheet} is not drawn to its size`);
      }
    }
  }
});

test('while a figure holds something, it is gone from where it stood', () => {
  for (const { figure, prop: id, frames, what, box: [x0, y0, w, h] } of HELD) {
    const prop = rooms.flatMap((room) => room.props ?? []).find((one) => one.id === id);
    for (const frame of frames) {
      const sheet = prop.heldBy?.sheets?.[String(frame)];
      assert.ok(sheet, `${figure} holds ${what} in frame ${frame}, and ${id} still shows it`);
      const image = png(sheet);
      let left = 0;
      for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) if (image.pixels[(y * image.width + x) * 4 + 3] > 0) left += 1;
      assert.equal(left, 0, `${sheet}: ${what} is still drawn on ${id}`);
    }
  }
});

test('he is seen to finish his drink before the glass stands empty', () => {
  const finish = directions.find((row) => /finishes his drink/.test(row.words));
  assert.ok(finish.frames.includes(7), 'the drink is shown (frame 7, the glass raised)');
  const prop = rooms.flatMap((room) => room.props ?? []).find((one) => one.id === 'whiskey_barrel');
  const last = finish.frames.at(-1);
  assert.equal(prop.heldBy.sheets[String(last)], 'art/props/room-03-barrel-empty.png', 'it is put back empty');
});
