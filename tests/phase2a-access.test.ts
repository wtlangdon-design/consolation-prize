import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';
import type { AmbientFile, RoomFile, WalkBox } from '../engine/core/types.ts';

/**
 * PHASE 2A: THE CAST DID NOT WALL ANYTHING OFF.
 *
 * Nine people were put in a saloon and four in a street, and the question the
 * owner's gate asks is not whether they look right -- that is Tyler's -- but
 * whether the rooms are still playable with them in: every hotspot reachable,
 * every exit reachable, every character Thad has to talk to standing within
 * their own approach radius of ground he may occupy.
 *
 * THE RADIUS IS NOT ALLOWED TO GROW TO FIT A PLACEMENT. That was the fault
 * Phase 1.5I found in the pie woman -- staged 110 px from anywhere legal with
 * a radius of 40 -- and the answer then was to move her, not to widen it. So
 * this asserts the radius each character already declares.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json');
const ambient: AmbientFile[] = manifest.ambient.map((path: string) => read(path));

function floorOf(room: RoomFile) {
  return new WalkBoxes(room.walkBoxes as WalkBox[], () => true, room.navigation?.frontOnly ?? []);
}

/** The nearest point of legal floor to a target, and how far away it is. */
function reach(walk: WalkBoxes, x: number, y: number) {
  const got = walk.nearest(x, y);
  assert.ok(got, `nothing on the floor is near ${x},${y}`);
  return { point: got.point, gap: Math.hypot(got.point.x - x, got.point.y - y) };
}

// THE ROOMS ARE FOUND, NOT NAMED. A test that hard-codes a room's file path
// also hard-codes the fiction into engine-adjacent source, which this project
// forbids; and a room that is renamed should break the test loudly rather than
// have it quietly stop covering anything.
const rooms: RoomFile[] = manifest.rooms.map(read);
const candidates = rooms.filter((one) => one.candidateOf !== undefined);
const street = candidates.find((one) => one.hotspots.some((h) => h.id === 'water_trough'));
const saloon = candidates.find((one) => one.hotspots.some((h) => h.id === 'piano'));
assert.ok(street && saloon, 'both replacement rooms are in the manifest');

for (const [label, room, arrival] of [
  ['the street', street, 'default'],
  ['the saloon', saloon, 'main_street'],
] as const) {
  const walk = floorOf(room);
  const start = room.entrances?.find((one) => one.from === arrival)
    ?? room.entrances?.find((one) => one.from === 'default');

  test(`${label}: every exit is reachable from where the player arrives`, () => {
    assert.ok(start?.at, `${label} declares where the player arrives`);
    const from = walk.nearest(start.at[0] as number, start.at[1] as number);
    assert.ok(from);
    for (const exit of room.exits) {
      const target = exit.walkTo
        ? walk.nearest(exit.walkTo.x, exit.walkTo.y)
        : walk.nearest(exit.rect[0] + exit.rect[2] / 2, exit.rect[1] + exit.rect[3]);
      assert.ok(target, `${exit.id}: no floor near it`);
      assert.ok(walk.path(from.box.id, target.box.id).length > 0,
        `${exit.id} is not reachable from the arrival point`);
    }
  });

  test(`${label}: every hotspot has floor within reach of it`, () => {
    for (const hotspot of room.hotspots) {
      const [hx, hy, hw, hh] = hotspot.rect;
      const at = hotspot.walkTo ?? { x: hx + hw / 2, y: hy + hh };
      const got = reach(walk, at.x, at.y);
      // A hotspot high on a wall is approached from the floor beneath it; the
      // test is that SOME floor is near, not that the rect itself is standable.
      assert.ok(got.gap < 400,
        `${hotspot.id}: the nearest floor to ${at.x},${at.y} is ${Math.round(got.gap)}px away`);
    }
  });

  test(`${label}: nobody in the cast is stranded out of conversational reach`, () => {
    const here = ambient.filter((npc) => (room.ambient ?? []).includes(npc.id));
    assert.ok(here.length > 0, `${label} has a cast`);
    for (const npc of here) {
      const placed = npc.placements?.[room.id];
      const x = placed?.x ?? npc.x;
      const y = placed?.y ?? npc.y;
      // Only a character with a tree is one Thad has to get to. The saloon's
      // nine are population, not conversation, and doc 07 gives them no lines.
      if (!npc.tree) continue;
      const got = reach(walk, x, y);
      assert.ok(got.gap <= npc.approachRadius,
        `${npc.id} stands at ${x},${y} and the nearest legal ground is `
        + `${Math.round(got.gap)}px away, outside their own approach radius of `
        + `${npc.approachRadius}. Move the character, never the radius.`);
    }
  });

  test(`${label}: the cast stands on ground the room actually has`, () => {
    const here = ambient.filter((npc) => (room.ambient ?? []).includes(npc.id));
    for (const npc of here) {
      const placed = npc.placements?.[room.id];
      const sprite = placed?.sprite ?? npc.sprite;
      assert.ok(sprite, `${npc.id} has art in ${room.id}`);
      const y = placed?.y ?? npc.y;
      assert.ok(y > 0 && y <= (room.size?.[1] ?? 864),
        `${npc.id} stands at y ${y}, outside the play area`);
      const frame = sprite.frames[0] as [number, number, number, number];
      const height = sprite.figureHeight ?? frame[3];
      assert.ok(y - height > -1,
        `${npc.id} is ${height}px tall standing at y ${y}: the top of him is cut off by the `
        + 'top of the frame');
    }
  });
}

test('the saloon carries exactly nine patrons, and none of them is at the piano', () => {
  const here = ambient.filter((npc) => (saloon.ambient ?? []).includes(npc.id));
  assert.equal(here.length, 9, 'the owner\'s ruling: nine visible runtime patrons');
  const piano = saloon.hotspots.find((one) => one.id === 'piano');
  assert.ok(piano);
  const [px, py, pw, ph] = piano.rect;
  for (const npc of here) {
    const atIt = npc.x > px - 40 && npc.x < px + pw + 40 && npc.y > py && npc.y < py + ph + 90;
    assert.ok(!atIt, `${npc.id} stands at ${npc.x},${npc.y}, which is at the piano. Nobody plays `
      + 'it, nobody touches it, and that is the joke.');
  }
  // AND THE FIFTH PLACE AT THE TABLE STAYS EMPTY: the abandoned hand lies on
  // the near edge, which is the side with no chair.
  const hand = saloon.hotspots.find((one) => one.id === 'cards');
  assert.ok(hand);
  const [cx, , cw] = hand.rect;
  for (const npc of here) {
    const onTheNearEdge = npc.x > cx - 20 && npc.x < cx + cw + 20 && npc.y > 540 && npc.y < 620;
    assert.ok(!onTheNearEdge,
      `${npc.id} stands at ${npc.x},${npc.y}, on the table's near edge -- the absent player's place`);
  }
});
