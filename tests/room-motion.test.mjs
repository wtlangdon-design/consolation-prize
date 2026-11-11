import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * THE ROOM'S OWN SMALL MOTION, KEPT TO ITS PLACE (errata 273).
 *
 * Tyler, 2026-11-10, of what still worried him before playing: how still the rooms are. Smoke, water, swinging
 * lanterns, stars and dust were added to the rooms from their own pixels (engine/render/MotionLayer.ts). This holds
 * what that must never do:
 *  - convey anything (invariant 9): no motion waits on a flag, and none moves over a thing that completes a puzzle
 *    (the warm hole at Prosperity, which F1 is about, does not shimmer);
 *  - touch the two rooms whose stillness is the point (invariants 2 and 8: the coffin, the listening chamber);
 *  - move a strip of the plate under a picture laid over it, which would leave the picture standing still on a
 *    swinging thing (the road sign at the stage road has its lettering laid over it, and was taken out for this);
 *  - wait on a picture the room never shows.
 */
const root = new URL('..', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const rooms = read('content/manifest.json').rooms.map(read);
const overlap = ([ax, ay, aw, ah], [bx, by, bw, bh]) => ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
const completes = (o) => o && typeof o === 'object' && (o.completes !== undefined || Object.values(o).some(completes));
const pairs = read('content/combinations.json').pairs;
const PLATE_MOVES = new Set(['sway', 'shimmer', 'scroll']);

test('the coffin and the listening chamber stay still', () => {
  for (const id of ['coffin', 'listening_chamber']) {
    const room = rooms.find((one) => one.id === id);
    assert.ok(!room.motion?.length, `${id} moves: its stillness is the point (invariants 2 and 8)`);
  }
});

test('most rooms move a little by themselves', () => {
  const moving = rooms.filter((room) => room.motion?.length).length;
  assert.ok(moving >= 40, `only ${moving} rooms have any motion of their own`);
});

for (const room of rooms.filter((one) => one.motion?.length)) {
  test(`${room.id}: its motion waits on nothing, marks nothing and moves nothing laid over the plate`, () => {
    const [w, h] = room.size ?? [1920, 864];
    const shown = new Set([room.background, ...(room.plateWhen ?? []).map((one) => one.plate)]);
    const solving = (room.hotspots ?? []).filter((spot) => completes(spot.responses) || completes(spot.reactions)
      || pairs.some((pair) => pair.target === spot.id && (pair.room === undefined || pair.room === room.id) && completes(pair)));
    const laid = (room.hotspots ?? []).filter((spot) => Object.values(spot.states ?? {}).some((state) => state.image || state.imageByState));
    const ids = new Set();
    for (const motion of room.motion) {
      assert.ok(!ids.has(motion.id), `${motion.id} twice`); ids.add(motion.id);
      assert.equal(motion.when, undefined, `${motion.id} waits on a flag (invariant 9)`);
      for (const plate of motion.plates ?? []) assert.ok(shown.has(plate), `${motion.id} waits on ${plate}, which ${room.id} never shows`);
      const [x, y, rw, rh] = motion.rect;
      assert.ok(x >= 0 && y >= 0 && x + rw <= w && y + rh <= h, `${motion.id} is outside the room`);
      if (motion.kind === 'twinkle') continue;
      for (const spot of solving) {
        assert.ok(!overlap(motion.rect, spot.rect), `${motion.id} moves over ${spot.id}, which completes a puzzle: motion would point at it`);
      }
      if (!PLATE_MOVES.has(motion.kind)) continue;
      for (const spot of laid) {
        assert.ok(!overlap(motion.rect, spot.rect), `${motion.id} moves the plate under ${spot.id}, which has a picture laid over it`);
      }
    }
  });
}
