import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import type { AmbientFile, RoomFile, WalkBox } from '../engine/core/types.ts';

/**
 * SCALE IS CHECKED, NOT EYEBALLED. Tyler, 2026-10-31, after Deke Vessel stood
 * at the Nugget's bar the same height as the man SITTING on the stool beside
 * him: "Make sure matching scales are written into the system of checks that
 * we have." Two things are held here:
 *
 *   1. Tyler's rulings about how tall a standing man is at named spots
 *      (content/scale-anchors.json) -- a curve edit that breaks an earlier
 *      ruling fails here instead of reaching his screen;
 *   2. every STANDING figure in a shipping room is drawn within 5% of the
 *      room curve's man at his feet, and every other visible figure says
 *      which kind of exception it is, so a new character cannot skip this.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json') as { rooms: string[]; ambient: string[] };
const rooms = new Map<string, RoomFile>(manifest.rooms.map((p) => {
  const room = read(p) as RoomFile;
  return [room.id, room];
}));
const curveAt = (room: RoomFile, x: number, y: number): number => {
  const near = new WalkBoxes(room.walkBoxes as WalkBox[], () => true).nearest(x, y);
  assert.ok(near, `${room.id} has floor near ${x},${y}`);
  return heightIn(near.box, y);
};

const { anchors } = read('content/scale-anchors.json') as {
  anchors: { room: string; at: [number, number]; min: number; max: number; ruling: string }[];
};
for (const anchor of anchors) {
  test(`scale ruling holds in ${anchor.room} at ${anchor.at.join(',')}: ${anchor.ruling}`, () => {
    const room = rooms.get(anchor.room);
    assert.ok(room?.walkBoxes, `${anchor.room} is a room with walk boxes`);
    const height = curveAt(room, anchor.at[0], anchor.at[1]);
    assert.ok(height >= anchor.min && height <= anchor.max,
      `a standing man there is ${height}; the ruling needs ${anchor.min}-${anchor.max}`);
  });
}

const shipping = (room: RoomFile | undefined) => room !== undefined
  && (room as RoomFile & { candidateOf?: string }).candidateOf === undefined;

for (const path of manifest.ambient) {
  const npc = read(path) as AmbientFile;
  const room = rooms.get(npc.room);
  if (!npc.sprite?.frames?.length || !shipping(room) || !room?.walkBoxes) continue;
  test(`${npc.id} declares what kind of figure it is`, () => {
    assert.ok(npc.posture, `${path} has a visible sprite and no posture -- say whether it is standing `
      + '(and so held to the curve) or which exception it is');
  });
  if (npc.posture !== 'standing') continue;
  test(`${npc.id} is drawn at the height of a standing man where he stands`, () => {
    const curve = curveAt(room, npc.x, npc.y);
    const drawn = npc.sprite?.figureHeight ? curve * (npc.sprite?.stature ?? 1) : npc.sprite!.frames[0]![3];
    const ratio = drawn / curve;
    assert.ok(Math.abs(ratio - 1) <= 0.05,
      `${npc.id} is drawn ${Math.round(drawn)} tall at ${npc.x},${npc.y}, where the room's man is ${curve} `
      + `(${ratio.toFixed(2)}x) -- recut him at the curve's height or rule an exception`);
  });
}
