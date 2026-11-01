import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { WalkBoxes, heightIn } from '../engine/core/WalkBoxes.ts';
import type { AmbientFile, Condition, RoomFile, WalkBox } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

/**
 * NOBODY STANDS ON ANYBODY. Tyler, 2026-11-01, playing Room 3: "he's
 * standing right in front of the other guy I can talk to which makes it so I
 * kind of stand on Deke when talking to the gold nugget guy", and then, of
 * the fix, "not overlapping the guys behind him". Every one of those
 * placements passed all 56 checks, because nothing measured where people are
 * drawn. These do, on the drawn pixels, in every room the build ledger calls
 * built:
 *
 *   1. Wherever Thad stands to talk to someone, he does not overlap anybody
 *      else who can be in the room at the same time, and does not cover the
 *      person he is talking to.
 *   2. A person who talks does not overlap another figure who can be there
 *      at the same time.
 *
 * Masks, not boxes: a bounding box calls a man's hat brim and his
 * neighbour's elbow a collision. Overlap is counted in opaque pixels, at the
 * size each figure is drawn where it stands, as a share of the smaller.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));

/** A share of the smaller figure's pixels two figures may share; more is one standing on the other. */
const TOUCH = 0.06;
/** How much of the person Thad is talking to he may cover from his stand. */
const COVER = 0.25;

type Mask = { x0: number; y0: number; w: number; h: number; on: Uint8Array };

const sheets = new Map<string, { width: number; height: number; pixels: Uint8Array }>();
const sheet = (path: string) => {
  if (!sheets.has(path)) sheets.set(path, readPng(readFileSync(resolve(ROOT, path))));
  return sheets.get(path)!;
};

/** A frame's opaque pixels, drawn `scale` times, its bottom-centre on (x, y). */
function maskOf(path: string, [sx, sy, sw, sh]: [number, number, number, number], scale: number, x: number, y: number, mirror = false): Mask {
  const image = sheet(path);
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const on = new Uint8Array(w * h);
  for (let row = 0; row < h; row += 1) {
    const srcRow = sy + Math.min(sh - 1, Math.floor(row / scale));
    for (let col = 0; col < w; col += 1) {
      const c = Math.min(sw - 1, Math.floor(col / scale));
      const srcCol = sx + (mirror ? sw - 1 - c : c);
      on[row * w + col] = (image.pixels[(srcRow * image.width + srcCol) * 4 + 3] ?? 0) > 0 ? 1 : 0;
    }
  }
  return { x0: x - Math.floor(w / 2), y0: y - h + 1, w, h, on };
}

const area = (m: Mask) => m.on.reduce((sum, v) => sum + v, 0);
function shared(a: Mask, b: Mask): number {
  const left = Math.max(a.x0, b.x0); const right = Math.min(a.x0 + a.w, b.x0 + b.w);
  const top = Math.max(a.y0, b.y0); const bottom = Math.min(a.y0 + a.h, b.y0 + b.h);
  let n = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      if (a.on[(y - a.y0) * a.w + (x - a.x0)] && b.on[(y - b.y0) * b.w + (x - b.x0)]) n += 1;
    }
  }
  return n;
}

/** Two conditions that can hold at once: no flag both name with different required values. */
function coexist(a?: Condition, b?: Condition): boolean {
  for (const [flag, value] of Object.entries(a ?? {})) {
    if (b && flag in b && typeof value !== 'object' && typeof b[flag] !== 'object' && b[flag] !== value) return false;
  }
  return true;
}

// The rooms the build ledger calls built, by their annotation's room id.
const ledger = read('content/build-ledger.json') as { items: { id: string; kind: string; status: string }[] };
const built = ledger.items
  .filter((item) => item.kind === 'room' && ['built', 'proven', 'accepted'].includes(item.status))
  .map((item) => /^room-(\d\d)-/.exec(item.id)?.[1])
  .filter((n): n is string => Boolean(n))
  .map((n) => `reference/room-${n}/annotation.json`)
  .filter((path) => existsSync(resolve(ROOT, path)))
  .map((path) => read(path).room as string);

const manifest = read('content/manifest.json') as { rooms: string[]; ambient: string[]; actor: string };
const rooms = new Map<string, RoomFile>(manifest.rooms.map((p) => { const r = read(p) as RoomFile; return [r.id, r]; }));
const cast = manifest.ambient.map((p) => read(p) as AmbientFile);
const player = read(manifest.actor) as { clips: { id: string; facing: string; frames: string[] }[] };
const playerStand = player.clips.find((clip) => clip.id === 'stand' && clip.facing === 'right')!.frames[0]!;
const playerBox = (() => {
  const image = sheet(playerStand);
  let top = image.height; let bottom = 0;
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    if ((image.pixels[(y * image.width + x) * 4 + 3] ?? 0) > 0) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  return { top, bottom };
})();

/** Everyone placed in a room, at their place there. */
function placed(roomId: string) {
  return cast.flatMap((npc) => {
    const at = npc.placements?.[roomId];
    if (npc.room !== roomId && !at) return [];
    const sprite = at?.sprite ?? npc.sprite;
    if (!sprite?.frames?.length) return [];
    return [{ npc, x: at?.x ?? npc.x, y: at?.y ?? npc.y, when: at?.when ?? npc.when, sprite,
      posture: at?.posture ?? npc.posture, walkTo: at?.walkTo ?? npc.walkTo }];
  });
}

for (const roomId of built) {
  const room = rooms.get(roomId);
  if (!room?.walkBoxes) continue;
  const boxes = new WalkBoxes(room.walkBoxes as WalkBox[], () => true);
  const man = (x: number, y: number) => {
    const near = boxes.nearest(x, y);
    return near ? heightIn(near.box, y) : 0;
  };
  const people = placed(roomId).map((one) => {
    const drawn = one.sprite.figureHeight;
    const scale = drawn ? (man(one.x, one.y) * (one.sprite.stature ?? 1)) / drawn : 1;
    // Every pose, merged: a man is where any of his frames puts him.
    const masks = one.sprite.frames.map((frame) => maskOf(one.sprite.sheet, frame as [number, number, number, number], scale, one.x, one.y));
    return { ...one, masks };
  });
  const most = (a: Mask[], b: Mask[]) => Math.max(...a.flatMap((ma) => b.map((mb) => shared(ma, mb) / Math.max(1, Math.min(area(ma), area(mb))))));

  test(`${roomId}: wherever the player stands to talk, he stands on nobody`, () => {
    const faults: string[] = [];
    for (const talker of people.filter((one) => one.npc.tree && one.walkTo)) {
      const stand = talker.walkTo!;
      const height = man(stand.x, stand.y);
      const image = sheet(playerStand);
      const scale = height / (playerBox.bottom - playerBox.top + 1);
      const mirror = stand.facing === 'left';
      const body = maskOf(playerStand, [0, playerBox.top, image.width, playerBox.bottom - playerBox.top + 1], scale, stand.x, stand.y, mirror);
      for (const other of people) {
        if (other.npc.id === talker.npc.id || !coexist(talker.when, other.when)) continue;
        if (other.posture === 'band') continue; // painted crowd, cut from the plate behind everyone
        const share = most([body], other.masks);
        if (share > TOUCH) faults.push(`talking to ${talker.npc.id} from ${stand.x},${stand.y}, the player overlaps `
          + `${other.npc.id} by ${(share * 100).toFixed(0)}% (allowed ${TOUCH * 100}%)`);
      }
      const covers = most([body], talker.masks);
      if (covers > COVER) faults.push(`the player at ${stand.x},${stand.y} covers ${talker.npc.id} by ${(covers * 100).toFixed(0)}%`);
    }
    assert.deepEqual(faults, [], `${roomId}: move the stand or the figure`);
  });

  test(`${roomId}: no one who talks is drawn over another figure`, () => {
    const faults: string[] = [];
    for (const one of people.filter((p) => p.npc.tree && p.posture === 'standing')) {
      for (const other of people) {
        if (other.npc.id === one.npc.id || !coexist(one.when, other.when)) continue;
        const share = most(one.masks, other.masks);
        if (share > TOUCH) faults.push(`${one.npc.id} at ${one.x},${one.y} overlaps ${other.npc.id} by `
          + `${(share * 100).toFixed(0)}% (allowed ${TOUCH * 100}%)`);
      }
    }
    assert.deepEqual(faults, [], `${roomId}: move a figure`);
  });
}
