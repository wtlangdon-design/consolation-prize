import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';
import type { FrontOnlyRegion, RoomFile, WalkBox } from '../engine/core/types.ts';

/**
 * MAIN STREET'S EAST HITCHING RAIL: THERE IS NO GROUND BEHIND IT. Phase 1.5I.
 *
 * THE HISTORY THIS EXISTS FOR. Three phases tried to make the rail behave with
 * walkable ground on both sides of it. 1.5F gave the rear ground back; 1.5G
 * put the obstacle on the fence's own line; 1.5H made the fence uncrossable
 * between its ends and proved it with a live sampling test. Every one of them
 * passed its own proof and Tyler could still put Thad in the rail, because the
 * question they asked -- can he CROSS it -- was not the question. Standing on
 * the strip behind it is standing in it, whatever route he took.
 *
 * So Tyler retired dual-side navigation for this rail, and the rule became
 * occupancy: he walks in FRONT of it and nowhere else. That is a statement
 * about the room's geometry, and geometry can be asserted without a browser --
 * which is the point of putting it here rather than only in the gauntlet. The
 * live click test (tools/gauntlet/rail-front-only.mjs) proves the player
 * cannot get there; this proves the ground is not there to get to.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const room = JSON.parse(
  readFileSync(resolve(ROOT, 'content/rooms/main-street-candidate.json'), 'utf8'),
) as RoomFile;

const region = (room.navigation?.frontOnly ?? [])[0] as FrontOnlyRegion;
const boxes = room.walkBoxes as WalkBox[];
const bounds = (box: WalkBox) => {
  const xs = box.points.map((point) => point.x);
  const ys = box.points.map((point) => point.y);
  return {
    id: box.id,
    left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys),
  };
};

test('the room states the front-only rule as data, not as a comment', () => {
  assert.ok(region, 'main_street_candidate declares navigation.frontOnly');
  assert.equal(region.id, 'rail_east');
  // The rear of the rail's span, from the top of the far mud to the top of the
  // front band. If this rect ever shrinks, the assertions below shrink with it
  // silently, so it is pinned.
  assert.deepEqual(region.rect, [2236, 600, 416, 216]);
  assert.equal(region.resolveBelowY, 816);
});

test('no walk box lies behind the hitching rail', () => {
  const [rx, ry, rw, rh] = region.rect;
  const trespassers = boxes.filter((box) => {
    const b = bounds(box);
    return b.left < rx + rw && b.right > rx && b.top < ry + rh && b.bottom > ry;
  });
  assert.deepEqual(trespassers.map((box) => box.id), [],
    'the ground behind the rail is carved out, so there is nothing to route onto');
});

test('the ground in front of the rail is unbroken along its whole length', () => {
  const walk = new WalkBoxes(boxes, () => true, room.navigation?.frontOnly ?? []);
  const [rx, , rw] = region.rect;
  const west = walk.nearest(rx - 200, region.frontY as number);
  assert.ok(west);
  for (let x = rx + 4; x < rx + rw; x += 8) {
    const here = walk.nearest(x, region.frontY as number);
    assert.ok(here, `no floor in front of the rail at x ${x}`);
    assert.ok(walk.path(west.box.id, here.box.id).length > 0,
      `the front ground at x ${x} is not reachable from west of the rail`);
    assert.ok(here.point.y >= region.resolveBelowY,
      `the floor at x ${x} is at y ${here.point.y}, above the rail's front line`);
  }
});

test('his feet clear both posts', () => {
  const walk = new WalkBoxes(boxes, () => true, room.navigation?.frontOnly ?? []);
  const clearance = region.minPostClearance ?? 8;
  for (const post of region.posts ?? []) {
    // ASK FOR THE POST ITSELF, column by column, and check where the room puts
    // him. Overlapping means his feet are in the post's own columns AND above
    // its foot; being pushed sideways off the post is a pass, and is what the
    // near post's own ground does.
    for (let x = post.x[0]; x <= post.x[1]; x += 2) {
      const landing = walk.target(x, post.base);
      assert.ok(landing);
      const on = landing.point.x >= post.x[0] && landing.point.x <= post.x[1]
        && landing.point.y < post.base + clearance;
      assert.ok(!on, `asked for the ${post.id} post at x ${x} and he stands at `
        + `${landing.point.x},${landing.point.y} -- its foot is y ${post.base} and he must be `
        + `${clearance} clear of it or beside it`);
    }
    // AND NO SUCH PLACE EXISTS AT ALL. The loop above is about where a click
    // lands; this is about whether the floor offers the post's own pixels to
    // anybody. The boardwalk is exempt because it is the town's far pavement,
    // 200 px behind the rail and drawn against no part of it.
    for (const box of boxes) {
      const b = bounds(box);
      if (b.id === 'boardwalk' || b.bottom <= 600) continue;
      if (b.right < post.x[0] || b.left > post.x[1]) continue;
      assert.ok(b.top >= post.base + clearance,
        `${box.id} covers the ${post.id} post's columns and starts at y ${b.top} -- its foot `
        + `is ${post.base} and the floor must start ${clearance} below that`);
    }
  }
});

test('a click behind the rail resolves to the ground in front of it', () => {
  const walk = new WalkBoxes(boxes, () => true, room.navigation?.frontOnly ?? []);
  const [rx, ry, rw, rh] = region.rect;
  for (let x = rx + 8; x < rx + rw; x += 16) {
    for (let y = ry + 8; y < ry + rh; y += 16) {
      const landing = walk.target(x, y);
      assert.ok(landing, `a click at ${x},${y} resolves to nothing`);
      assert.ok(landing.point.y >= region.resolveBelowY,
        `a click at ${x},${y} landed at ${landing.point.x},${landing.point.y}, which is not in `
        + 'front of the rail');
      // AND NOT ON THE BOARDWALK, which is the near miss this rule exists for:
      // the town's far pavement is closer in pixels than the front mud is.
      assert.notEqual(landing.box.id, 'boardwalk',
        `a click at ${x},${y} sent him round the block to the boardwalk`);
    }
  }
});

test('nearest is left alone, so a figure behind the rail is still drawn behind it', () => {
  const walk = new WalkBoxes(boxes, () => true, room.navigation?.frontOnly ?? []);
  // The pie woman's position. `target` moves a DESTINATION to the front;
  // `nearest` answers what plane a figure standing here is drawn at, and must
  // not have been changed with it.
  const asDestination = walk.target(2470, 706);
  const asFigure = walk.nearest(2470, 706);
  assert.ok(asDestination && asFigure);
  assert.ok(asDestination.point.y >= region.resolveBelowY);
  assert.notEqual(asFigure.box.id, asDestination.box.id);
});

test('the water trough is still reachable, and from the front', () => {
  const walk = new WalkBoxes(boxes, () => true, room.navigation?.frontOnly ?? []);
  const trough = room.hotspots.find((one) => one.id === 'water_trough');
  assert.ok(trough?.walkTo, 'the trough declares where a man stands to use it');
  const stand = walk.boxAt(trough.walkTo.x, trough.walkTo.y);
  assert.ok(stand, 'the trough\'s approach point is on a walk box');
  const entrance = room.entrances?.find((one) => one.from === 'default');
  assert.ok(entrance?.at);
  const from = walk.nearest(entrance.at[0] as number, entrance.at[1] as number);
  assert.ok(from);
  assert.ok(walk.path(from.box.id, stand.id).length > 0,
    'the trough is reachable from the room\'s own arrival point');
});

test('the doorway standing behind this rail is still usable', () => {
  const walk = new WalkBoxes(boxes, () => true, room.navigation?.frontOnly ?? []);
  // DERIVED, NOT NAMED. The exit at risk is whichever one's approach point
  // stands within the rail's span -- the door the rail is drawn in front of.
  // Asking the room which one that is means this test still means something if
  // the room is ever re-blocked.
  const [sx0, sx1] = region.span as [number, number];
  const doorway = room.exits.find((one) => one.walkTo
    && one.walkTo.x > sx0 && one.walkTo.x < sx1);
  assert.ok(doorway?.walkTo, 'one exit stands within the rail\'s span');
  assert.ok(walk.boxAt(doorway.walkTo.x, doorway.walkTo.y),
    `${doorway.id}: its approach point ${doorway.walkTo.x},${doorway.walkTo.y} is on a walk box`);
  const arrival = room.entrances?.find((one) => one.from === doorway.to);
  assert.ok(arrival?.at, `${doorway.id}: the room declares where he arrives back from it`);
  assert.ok(walk.boxAt(arrival.at[0] as number, arrival.at[1] as number),
    `${doorway.id}: he arrives back at ${arrival.at.join(',')}, which is floor`);
});
