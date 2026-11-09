import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import type { AmbientFile, RoomFile, WalkBox } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

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

/**
 * AN ANIMAL IS HELD TO THE MAN BESIDE IT (errata 199). Tyler, 2026-11-08, of
 * Main Street's horses: "it looks like maybe Thad is their height standing
 * next to them ... I just want everything to scale correctly." An `animal` is
 * exempt from the standing man's 5%, so nothing held the horses' size: their
 * stature was taken from ear tips to the foot of the hay under them, and the
 * black's ears stood 1.19 of the man at his hooves. Each ruling here measures
 * the animal as the engine draws it -- the curve where it stands, its stature,
 * its figureHeight and its foot row -- against the room's man AT ITS HOOVES:
 * ear tips and hooves read from the sheet's own pixels, the withers declared.
 */
type AnimalRuling = {
  figure: string; frame?: number; columns: [number, number]; withersRow: number;
  withers: [number, number]; ears: [number, number]; ruling: string;
};
const { animals = [] } = read('content/scale-anchors.json') as { animals?: AnimalRuling[] };
const cast = new Map(manifest.ambient.map((path) => {
  const npc = read(path) as AmbientFile;
  return [npc.id, npc];
}));
/** The animal's ear tips and withers as shares of the room's man at its hooves, as drawn. */
function animalProportion(npc: AmbientFile, room: RoomFile, ruling: AnimalRuling): { ears: number; withers: number } {
  const sprite = npc.sprite!;
  const [sx, sy, sw, sh] = sprite.frames[ruling.frame ?? 0]!;
  const png = readPng(readFileSync(resolve(ROOT, sprite.sheet))) as { width: number; pixels: Uint8Array };
  let ears = sh; let hooves = -1;
  for (let col = ruling.columns[0]; col <= Math.min(ruling.columns[1], sw - 1); col += 1) {
    for (let row = 0; row < sh; row += 1) {
      if ((png.pixels[((sy + row) * png.width + sx + col) * 4 + 3] ?? 0) === 0) continue;
      ears = Math.min(ears, row);
      hooves = Math.max(hooves, row);
    }
  }
  assert.ok(hooves > ruling.withersRow && ruling.withersRow > ears, `${npc.id}: the withers lie between the ears and the hooves`);
  const scale = (curveAt(room, npc.x, npc.y) * (sprite.stature ?? 1)) / sprite.figureHeight!;
  // Where the hooves are drawn: the foot row is on y, and every other row is a scaled distance from it.
  const hoofY = npc.y + (hooves - (sprite.footRow ?? sh - 1)) * scale;
  const man = curveAt(room, npc.x, Math.round(hoofY));
  return { ears: ((hooves - ears + 1) * scale) / man, withers: ((hooves - ruling.withersRow) * scale) / man };
}
for (const ruling of animals) {
  test(`${ruling.figure} is drawn at its true size beside a man: ${ruling.ruling}`, () => {
    const npc = cast.get(ruling.figure);
    assert.ok(npc?.sprite?.figureHeight, `${ruling.figure} is an ambient drawn on the room's curve`);
    const room = rooms.get(npc.room);
    assert.ok(room?.walkBoxes, `${npc.room} is a room with walk boxes`);
    const { ears, withers } = animalProportion(npc, room, ruling);
    assert.ok(withers >= ruling.withers[0] && withers <= ruling.withers[1],
      `${npc.id}'s withers are ${withers.toFixed(3)} of the man at its hooves; the ruling needs ${ruling.withers.join('-')}`);
    assert.ok(ears >= ruling.ears[0] && ears <= ruling.ears[1],
      `${npc.id}'s ear tips are ${ears.toFixed(3)} of the man at its hooves; the ruling needs ${ruling.ears.join('-')}`);
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
  // A CHILD (errata 110: doc 07's message boy "is nine") is held to the
  // curve too, at a child's share of it, which he must declare.
  if (npc.posture === 'child') {
    test(`${npc.id} is drawn at a child's height where he stands`, () => {
      const stature = npc.sprite?.stature;
      assert.ok(npc.sprite?.figureHeight && stature !== undefined && stature >= 0.55 && stature <= 0.8,
        `${npc.id} is a child: declare sprite.figureHeight and a stature between 0.55 and 0.8 of the room's man`);
    });
    continue;
  }
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
