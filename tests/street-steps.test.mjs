// LOWER STREET AND THE LANE: UP TO THE DOORS, UP THE STEPS, AND NEVER TALLER THAN A DOOR (errata 303).
//
// Tyler, 2026-11-13: "I would like him to actually walk up steps onto porches. Check the other rooms you mentioned
// as well." and then "Make those fixes". Both streets' floors were the graybox's, laid where its fronts met the street
// at y690-705; the plates put them at y605-632, so he stood eighty pixels out in the road and went through every door
// from there. Lower Street's buildings came back drawn smaller than the depth they were planned at, so a man walking
// up to the church would have stood taller than its door; and both curves held a man at full size above their old
// far row, so at the lane's doors he came out as tall as they are.
//
// Held against the plates: the floor reaches each door; a porch is reached by its steps and nothing else; a man at a
// door is shorter than the door; the curve runs as far back as the floor does; and the walls are never floor.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';

const read = (name) => JSON.parse(readFileSync(new URL(`../content/rooms/${name}.json`, import.meta.url), 'utf8'));
const rooms = { lower_street: read('lower-street'), the_lane: read('the-lane') };

// Doors, read off the plates at 2x: the exit, and the door's own drawn height in px.
const DOORS = {
  lower_street: { to_claims_registrar: 160, to_church: 180, to_livery: 240 },
  the_lane: { to_undertaker: 235, to_photographers_studio: 260, to_ozymandias_tent: 230, to_barbers: 250, to_empty_storefront: 240 },
};
const WALLS = {
  lower_street: [[420, 560, "the registrar's window wall"], [700, 600, "the church's front"], [1300, 580, "the livery's door"], [1620, 600, 'the trough'], [600, 560, 'the alley wall']],
  the_lane: [[440, 560, 'the coffin'], [620, 580, "the photographer's wall"], [1400, 580, "the barber's wall"], [1520, 590, "the storefront's wall"], [880, 560, 'the tent']],
};

const heightAt = (room, x, y) => {
  const box = new WalkBoxes(room.walkBoxes).boxAt(x, y);
  if (!box) return null;
  const mode = box.scaleMode;
  if (mode.kind === 'fixed') return mode.height;
  // As the engine reads it: above the far row the curve holds its far height (WalkBoxes heightIn).
  return mode.farHeight + ((Math.max(y, mode.farY) - mode.farY) * (mode.nearHeight - mode.farHeight)) / (mode.nearY - mode.farY);
};

test('the floor reaches every door, and he is shorter than the door he walks through', () => {
  for (const [id, doors] of Object.entries(DOORS)) {
    const room = rooms[id];
    for (const [exitId, door] of Object.entries(doors)) {
      const exit = room.exits.find((one) => one.id === exitId);
      const { x, y } = exit.walkTo;
      const [rx, ry, rw, rh] = exit.rect;
      assert.ok(y - (ry + rh) < 30, `${id}: the stand for ${exitId} is ${y - (ry + rh)} px out from its door`);
      assert.ok(x >= rx - 10 && x <= rx + rw + 10, `${id}: the stand for ${exitId} is not in front of its door`);
      const height = heightAt(room, x, y);
      assert.ok(height !== null, `${id}: the stand for ${exitId} is not on the floor`);
      assert.ok(height <= door * 0.95, `${id}: at ${exitId} he is ${Math.round(height)} tall against a door of ${door}`);
    }
  }
});

test('a porch or a doorstep is reached by its steps, and nothing else', () => {
  for (const [id, room] of Object.entries(rooms)) {
    const boxes = new WalkBoxes(room.walkBoxes);
    for (const deck of room.walkBoxes.filter((box) => box.id.startsWith('deck_'))) {
      const name = deck.id.slice('deck_'.length);
      assert.deepEqual(deck.neighbours, [`stairs_${name}`], `${id}: ${deck.id} is joined to ${deck.neighbours}`);
      const xs = deck.points.map((point) => point.x); const ys = deck.points.map((point) => point.y);
      const route = boxes.route(960, 800, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
      assert.ok(route?.boxes.includes(`stairs_${name}`), `${id}: onto ${deck.id} without its steps`);
    }
    const stairs = room.walkBoxes.filter((box) => box.id.startsWith('stairs_'));
    assert.ok(stairs.length >= 2, `${id}: ${stairs.length} flights of steps`);
  }
});

test('the walls are never floor, and the size curve runs as far back as the floor', () => {
  for (const [id, room] of Object.entries(rooms)) {
    const boxes = new WalkBoxes(room.walkBoxes);
    const on = WALLS[id].filter(([x, y]) => boxes.boxAt(x, y)).map(([x, y, what]) => `${what} (${x},${y})`);
    assert.deepEqual(on, [], `${id}: standing in a wall`);
    const curve = room.walkBoxes.find((box) => box.scaleMode.kind === 'curve').scaleMode;
    const top = Math.min(...room.walkBoxes.filter((box) => box.scaleMode.kind === 'curve').flatMap((box) => box.points.map((point) => point.y)));
    assert.ok(curve.farY <= top, `${id}: the floor starts at y${top} and the curve at y${curve.farY}, so a man there is held at full size`);
  }
});
