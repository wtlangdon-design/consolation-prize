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
 * AN ANIMAL IS HELD TO THE MAN BESIDE IT (errata 201). Tyler, 2026-11-08, of
 * Main Street's horses: "it looks like maybe Thad is their height standing
 * next to them ... I just want everything to scale correctly." An `animal` is
 * exempt from the standing man's 5%, so nothing held the horses' size: their
 * stature was taken from ear tips to the foot of the hay under them, and the
 * black's ears stood 1.19 of the man at his hooves. Each ruling here measures
 * the animal as the engine draws it -- the curve where it stands, its stature,
 * its figureHeight and its foot row -- against the room's man AT ITS FEET:
 * its top and feet read from the sheet's own pixels unless declared, the
 * withers declared.
 *
 * THE WHOLE CAST, NOT ONE FIGURE (errata 205; Tyler, 2026-11-08, "Proceed").
 * Every visible animal has an entry, and a new one cannot skip it: the test
 * below fails on an `animal` with no ruling. Where an animal does not stand on
 * the room's floor at its anchor -- a cat on a crate, a mule's head over a
 * half door, a raccoon in a hole in a rise -- the entry says where the floor
 * under it is (`groundY`, `feetY`) and why. A measured failure Tyler has not
 * yet ruled on is recorded in `knownWrong`: printed on every run, and the test
 * fails if it is fixed and the entry is left in, as tests/full-game.test.ts
 * holds its known breaks.
 */
type Range = [number, number];
type AnimalRuling = {
  figure: string; frame?: number; columns: [number, number];
  /** Declared rows, when the sheet's own top or bottom opaque row in `columns` is not the animal's. */
  topRow?: number; feetRow?: number;
  /** A room y: where its feet stand when they are hidden (behind a half door). */
  feetY?: number;
  /** A room y: the floor the man is taken at, when the animal is not standing on the room's floor (a crate). */
  groundY?: number;
  top?: string; feet?: string;
  height?: Range; withersRow?: number; withers?: Range; length?: Range;
  ruling: string;
  knownWrong?: { measured: Record<string, number>; why: string; fix: string };
};
const { animals = [] } = read('content/scale-anchors.json') as { animals?: AnimalRuling[] };
const cast = new Map(manifest.ambient.map((path) => {
  const npc = read(path) as AmbientFile;
  return [npc.id, npc];
}));
/**
 * THE MAN AT A FLOOR POINT, CARRIED PAST THE BAND. The engine clamps a curve
 * at its far edge, which is right for a walker and says nothing about ground
 * the band does not cover: a mule in a stall at the back of the livery is
 * not the size of a man at the front of the mud. A flat floor's man shrinks
 * in a straight line toward the horizon, so beyond the band the curve is
 * carried on in a line (as the church's behind-counter check does), unless
 * the room's own curve says what happens there (`beyondY`).
 */
function manAt(room: RoomFile, x: number, y: number): number {
  const near = new WalkBoxes(room.walkBoxes as WalkBox[], () => true).nearest(x, y);
  assert.ok(near, `${room.id} has floor near ${x},${y}`);
  const mode = near.box.scaleMode as { kind: string; farY: number; farHeight: number; nearY: number; nearHeight: number; beyondY?: number; samples?: unknown[] };
  const outside = y > mode.nearY || (y < mode.farY && mode.beyondY === undefined);
  if (mode.kind === 'curve' && !mode.samples?.length && outside && mode.nearY !== mode.farY) {
    return mode.farHeight + ((y - mode.farY) * (mode.nearHeight - mode.farHeight)) / (mode.nearY - mode.farY);
  }
  return heightIn(near.box, y);
}
/** The animal's measures as shares of the room's man at its feet, as drawn. */
function animalProportion(npc: AmbientFile, room: RoomFile, ruling: AnimalRuling): Record<string, number> {
  const sprite = npc.sprite!;
  const [sx, sy, sw, sh] = sprite.frames[ruling.frame ?? 0]!;
  const png = readPng(readFileSync(resolve(ROOT, sprite.sheet))) as { width: number; pixels: Uint8Array };
  let top = sh; let bottom = -1; let left = sw; let right = -1;
  for (let col = ruling.columns[0]; col <= Math.min(ruling.columns[1], sw - 1); col += 1) {
    for (let row = 0; row < sh; row += 1) {
      if ((png.pixels[((sy + row) * png.width + sx + col) * 4 + 3] ?? 0) === 0) continue;
      top = Math.min(top, row);
      bottom = Math.max(bottom, row);
      left = Math.min(left, col);
      right = Math.max(right, col);
    }
  }
  assert.ok(bottom >= 0, `${npc.id}: frame ${ruling.frame ?? 0} has pixels in columns ${ruling.columns.join('-')}`);
  top = ruling.topRow ?? top;
  const feetRow = ruling.feetRow ?? bottom;
  // Its own scale: the curve at its y times its stature over its figureHeight; a sheet with no
  // figureHeight is drawn 1:1, as the renderer draws it (Renderer.ambientSize).
  const scale = sprite.figureHeight ? (curveAt(room, npc.x, npc.y) * (sprite.stature ?? 1)) / sprite.figureHeight : 1;
  // Where each row is drawn: the foot row is on y, and every other row is a scaled distance from it.
  const rowY = (row: number) => npc.y + (row - (sprite.footRow ?? sh - 1)) * scale;
  const feetY = ruling.feetY ?? rowY(feetRow);
  const man = manAt(room, npc.x, ruling.groundY ?? Math.round(feetY));
  const out: Record<string, number> = { man };
  out.height = (feetY - rowY(top) + scale) / man;
  if (ruling.withersRow !== undefined) {
    assert.ok(feetRow > ruling.withersRow && ruling.withersRow > top, `${npc.id}: the withers lie between the top and the feet`);
    out.withers = (feetY - rowY(ruling.withersRow)) / man;
  }
  out.length = ((right - left + 1) * scale) / man;
  return out;
}
const MEASURES = ['height', 'withers', 'length'] as const;
const misses = (npc: AmbientFile, ruling: AnimalRuling, measured: Record<string, number>): string[] => MEASURES
  .filter((key) => ruling[key] !== undefined)
  .filter((key) => !(measured[key]! >= ruling[key]![0] && measured[key]! <= ruling[key]![1]))
  .map((key) => {
    const what = key === 'height' ? `${ruling.top ?? 'top'} are` : key === 'withers' ? 'withers are' : 'length is';
    return `${npc.id}'s ${what} ${measured[key]!.toFixed(3)} of the man at its ${ruling.feet ?? 'feet'}; the ruling needs ${ruling[key]!.join('-')}`;
  });
for (const ruling of animals) {
  test(`${ruling.figure} is drawn at its true size beside a man: ${ruling.ruling}`, (t) => {
    const npc = cast.get(ruling.figure);
    assert.ok(npc?.sprite?.frames?.length, `${ruling.figure} is an ambient with a drawn sheet`);
    const room = rooms.get(npc.room);
    assert.ok(room?.walkBoxes, `${npc.room} is a room with walk boxes`);
    assert.ok(MEASURES.some((key) => ruling[key] !== undefined), `${ruling.figure}: the ruling holds at least one measure`);
    const measured = animalProportion(npc, room, ruling);
    t.diagnostic(`${npc.id} in ${npc.room}: ${MEASURES.filter((key) => ruling[key]).map((key) => `${key} ${measured[key]!.toFixed(3)} (${ruling[key]!.join('-')})`).join(', ')}; the man there is ${measured.man!.toFixed(0)}`);
    const missed = misses(npc, ruling, measured);
    if (ruling.knownWrong) {
      t.diagnostic(`KNOWN WRONG, for Tyler: ${missed.join('; ')} -- ${ruling.knownWrong.why} Suggested: ${ruling.knownWrong.fix}`);
      assert.ok(missed.length > 0, `${npc.id} now measures inside its ruling: take its knownWrong entry out of content/scale-anchors.json`);
      return;
    }
    assert.deepEqual(missed, [], missed.join('\n'));
  });
}

test('every visible animal in a shipping room has a size ruling', () => {
  const ruled = new Set(animals.map((ruling) => ruling.figure));
  const unruled = manifest.ambient.map((path) => read(path) as AmbientFile)
    .filter((npc) => npc.posture === 'animal' && npc.sprite?.frames?.length)
    .filter((npc) => {
      const room = rooms.get(npc.room);
      return room !== undefined && (room as RoomFile & { candidateOf?: string }).candidateOf === undefined;
    })
    .map((npc) => npc.id)
    .filter((id) => !ruled.has(id));
  assert.deepEqual(unruled, [], 'animals with no entry in content/scale-anchors.json `animals`: measure each against the man where it stands (errata 205)');
});

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

// A FIGURE BEHIND A COUNTER IS A MAN'S WAIST-UP FOR WHERE HE STANDS (Tyler, 2026-11-08, of the
// church: "he looks enormous behind the podium"). The standing check above never saw him: he is
// cut at the pulpit's top and drawn 1:1, and nothing measured him. From crown to the cut he was 203
// px, the waist-up of a man of nearly 500, at the back of a room whose man is 285 there. A
// behind-counter figure's crown-to-cut is at most WAIST_UP of a man at its depth: its own `depthY`
// (the room's curve carried back to that floor), else the stand where it is talked to.
const WAIST_UP = 0.45;
const unclamped = (room: RoomFile, y: number): number => {
  const curve = (room.walkBoxes?.[0] as WalkBox | undefined)?.scaleMode as { kind: string; farY: number; farHeight: number; nearY: number; nearHeight: number } | undefined;
  return curve?.kind === 'curve' ? curve.farHeight + (y - curve.farY) * (curve.nearHeight - curve.farHeight) / (curve.nearY - curve.farY) : 0;
};
for (const path of manifest.ambient) {
  const npc = read(path) as AmbientFile;
  const places = [{ room: npc.room, at: npc as Partial<AmbientFile> }]
    .concat(Object.entries(npc.placements ?? {}).map(([room, at]) => ({ room, at: at as Partial<AmbientFile> })));
  for (const { room: roomId, at } of places) {
    const posture = at.posture ?? npc.posture;
    const sprite = (at.sprite ?? npc.sprite) as (AmbientFile['sprite'] & { depthY?: number }) | undefined;
    const room = rooms.get(roomId);
    const stand = at.walkTo ?? npc.walkTo;
    if (posture !== 'behind-counter' || !sprite?.frames?.length || !shipping(room) || !room?.walkBoxes) continue;
    if (sprite.figureHeight || (sprite.depthY === undefined && !stand)) continue;
    test(`${npc.id} in ${roomId}: behind the counter, a man's waist-up for where it stands`, () => {
      const man = sprite.depthY !== undefined ? unclamped(room, sprite.depthY) : curveAt(room, stand!.x, stand!.y);
      const png = readPng(readFileSync(resolve(ROOT, sprite.sheet)));
      const [fx, fy, fw, fh] = sprite.frames[0]!;
      let top = -1; let bottom = -1;
      for (let y = 0; y < fh; y += 1) for (let x = 0; x < fw; x += 1) {
        if (png.pixels[((fy + y) * png.width + fx + x) * 4 + 3]! > 128) { if (top < 0) top = y; bottom = y; }
      }
      const drawn = bottom - top + 1;
      assert.ok(drawn <= WAIST_UP * man, `${npc.id} in ${roomId} is ${drawn} px from crown to the counter, where a man is ${Math.round(man)} `
        + `(${(drawn / man).toFixed(2)} of him); a waist-up is at most ${WAIST_UP}`);
    });
  }
}
