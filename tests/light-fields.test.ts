import assert from 'node:assert/strict';
import test from 'node:test';

import { moverTint } from '../engine/render/LightFields.ts';
import type { RoomLamp } from '../engine/core/types.ts';

/**
 * THE MOVER LIGHT FIELD, PURE. Doc 36 Q116: a lamp may declare what it does
 * to a person standing in it; a lamp that declares nothing does nothing.
 */

const plain: RoomLamp = { id: 'plain', at: [500, 700], radius: 300, amount: 0.1, rate: 0.2 };
const warm: RoomLamp = {
  id: 'warm', at: [500, 700], radius: 300, amount: 0.1, rate: 0.2,
  movers: { strength: 0.4, colour: [255, 170, 80] },
};

test('a lamp with no field touches nobody, so a room with none is unchanged', () => {
  assert.equal(moverTint([plain], 500, 700, null), null);
  assert.equal(moverTint([], 500, 700, null), null);
  assert.equal(moverTint(undefined, 500, 700, null), null);
});

test('under the lamp the tint is the field\'s strength and colour; at the edge it is gone', () => {
  const under = moverTint([warm], 500, 700, null);
  assert.ok(under);
  assert.equal(under.alpha, 0.4);
  assert.deepEqual(under.colour, [255, 170, 80]);
  assert.equal(moverTint([warm], 800, 700, null), null, 'on the radius');
  assert.equal(moverTint([warm], 1200, 700, null), null, 'well outside');
});

test('the falloff is square in the distance and measured at the feet', () => {
  const half = moverTint([warm], 650, 700, null);
  assert.ok(half);
  assert.ok(Math.abs(half.alpha - 0.4 * 0.25) < 1e-9, `${half.alpha}`);
  // The same distance vertically counts the same unless `reach` says otherwise.
  const up = moverTint([warm], 500, 550, null);
  assert.ok(up && Math.abs(up.alpha - half.alpha) < 1e-9);
  const tall: RoomLamp = { ...warm, movers: { ...warm.movers!, reach: 2 } };
  const reached = moverTint([tall], 500, 550, null);
  assert.ok(reached && reached.alpha > up.alpha, 'reach shortens vertical distance');
});

test('a state may change the strength; an unnamed state uses the plain one', () => {
  const byState: RoomLamp = { ...warm, movers: { strength: 0.1, strengthByState: { night: 0.5 } } };
  assert.ok(Math.abs(moverTint([byState], 500, 700, 'night')!.alpha - 0.5) < 1e-9);
  assert.ok(Math.abs(moverTint([byState], 500, 700, null)!.alpha - 0.1) < 1e-9);
  assert.ok(Math.abs(moverTint([byState], 500, 700, 'day')!.alpha - 0.1) < 1e-9);
});

test('two lamps add, the colour is weighted, and the sum is clamped', () => {
  const cool: RoomLamp = { id: 'cool', at: [500, 700], radius: 300, amount: 0.1, rate: 0.2,
    movers: { strength: 0.4, colour: [80, 120, 255] } };
  const both = moverTint([warm, cool], 500, 700, null);
  assert.ok(both);
  assert.equal(both.alpha, 0.6, 'clamped at 0.6');
  assert.deepEqual(both.colour, [168, 145, 168]);
  const deterministic = moverTint([warm, cool], 500, 700, null);
  assert.deepEqual(deterministic, both);
});
