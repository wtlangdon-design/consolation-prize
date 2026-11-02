/**
 * TOO SHARP IS THE USUAL MISS (CLAUDE.md, character style gate step 1).
 *
 * Tyler, 2026-11-02, of Fanshawe: "is his quality too high compared to
 * the player?" It was: the texture metric -- mean absolute luminance difference
 * between 4-neighbours over the figure's interior -- read 10.4 against the player's
 * 4.45 at game size, and the full build's other three figures (Sump, Frame,
 * the lobby clerk) read 8.4 to 12.3. Each cut script now softens its figure
 * (errata 84 J). This holds every figure the full build cuts from a sheet
 * (a sprite whose provenance is under art/staging/room-06 and later) to at
 * most RATIO times the player's texture at that room's own height.
 *
 * It FLAGS, it does not decide: the metric once ranked the cast backwards
 * against Tyler's eye, so passing here is not acceptance -- he sees each figure
 * in the playthrough. It only stops a figure as sharp as these four were from
 * shipping unnoticed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import type { AmbientFile, RoomFile } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const json = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
// The four this was written for read 2.1x to 3.1x the player here; corrected, they
// read 1.0x to 1.6x (the lobby clerk is drawn small, and his face keeps its
// detail). 1.75 catches every one of the four and passes all of them softened.
const RATIO = 1.75;

interface Image { width: number; height: number; pixels: Uint8Array }

const crop = (image: Image, rect: number[]): Image => {
  const [x = 0, y = 0, w = 0, h = 0] = rect;
  const pixels = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row += 1) {
    pixels.set(image.pixels.subarray(((y + row) * image.width + x) * 4, ((y + row) * image.width + x + w) * 4), row * w * 4);
  }
  return { width: w, height: h, pixels };
};

/** The opaque bounding box, as PIL's getbbox would give it. */
const trim = (image: Image): Image => {
  let x0 = image.width; let y0 = image.height; let x1 = -1; let y1 = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3]! > 0) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
  }
  return crop(image, [x0, y0, x1 - x0 + 1, y1 - y0 + 1]);
};

/** Area-average downscale to `height`, the box filter the game's sizes come from. */
const boxTo = (image: Image, height: number): Image => {
  const width = Math.max(1, Math.round(image.width * height / image.height));
  const sx = image.width / width; const sy = image.height / height;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const acc = [0, 0, 0, 0]; let n = 0;
      for (let v = Math.floor(y * sy); v < Math.ceil((y + 1) * sy); v += 1) {
        for (let u = Math.floor(x * sx); u < Math.ceil((x + 1) * sx); u += 1) {
          const at = (v * image.width + u) * 4;
          for (let c = 0; c < 4; c += 1) acc[c]! += image.pixels[at + c]!;
          n += 1;
        }
      }
      for (let c = 0; c < 4; c += 1) pixels[(y * width + x) * 4 + c] = Math.round(acc[c]! / n);
    }
  }
  return { width, height, pixels };
};

/** Mean absolute 4-neighbour luminance difference over the interior (alpha eroded twice). */
const texture = (image: Image): number => {
  const { width, height, pixels } = image;
  let mask = Array.from({ length: width * height }, (_, i) => pixels[i * 4 + 3]! >= 128);
  for (let pass = 0; pass < 2; pass += 1) {
    mask = mask.map((on, i) => {
      if (!on) return false;
      const x = i % width; const y = Math.floor(i / width);
      return x > 0 && x < width - 1 && y > 0 && y < height - 1
        && mask[i - 1]! && mask[i + 1]! && mask[i - width]! && mask[i + width]!;
    });
  }
  const lum = (i: number) => 0.299 * pixels[i * 4]! + 0.587 * pixels[i * 4 + 1]! + 0.114 * pixels[i * 4 + 2]!;
  let sx = 0; let nx = 0; let sy = 0; let ny = 0;
  for (let i = 0; i < width * height; i += 1) {
    if (!mask[i]) continue;
    if ((i % width) < width - 1 && mask[i + 1]) { sx += Math.abs(lum(i + 1) - lum(i)); nx += 1; }
    if (i + width < width * height && mask[i + width]) { sy += Math.abs(lum(i + width) - lum(i)); ny += 1; }
  }
  return (sx / nx + sy / ny) / 2;
};

const manifest = json('content/manifest.json');
// The player's standing frame, by what the actor record says -- the idle clip, facing right.
const idle = (json(manifest.actor).clips as { id: string; facing: string; frames: string[] }[])
  .find((clip) => clip.id === 'idle' && clip.facing === 'right');
assert.ok(idle, 'the actor record has a right-facing idle');
const player = trim(readPng(readFileSync(resolve(ROOT, idle.frames[0]!))) as Image);
const rooms = new Map<string, RoomFile>((manifest.rooms as string[]).map((path) => {
  const room = json(path) as RoomFile;
  return [room.id, room];
}));
const cast = (manifest.ambient as string[]).map((path) => json(path) as AmbientFile & { sprite?: { sheet: string; frames: number[][]; provenance?: string } })
  .filter((npc) => /^art\/staging\/room-(0[6-9]|[1-3]\d)\//.test(npc.sprite?.provenance ?? ''));

test('the full build cuts figures from sheets, and this test sees them', () => {
  assert.ok(cast.length >= 4, `found ${cast.map((npc) => npc.id).join(', ')}`);
});

for (const npc of cast) {
  test(`${npc.id} is no sharper than ${RATIO}x the player at this room's height`, () => {
    const room = rooms.get(npc.room);
    const scale = room?.walkBoxes?.[0]?.scaleMode;
    assert.ok(scale && scale.kind === 'curve', `${npc.room} has a depth curve`);
    const sheet = readPng(readFileSync(resolve(ROOT, npc.sprite!.sheet))) as Image;
    const figure = texture(crop(sheet, npc.sprite!.frames[0]!));
    const standard = texture(boxTo(player, Math.round((scale.farHeight + scale.nearHeight) / 2)));
    assert.ok(figure <= standard * RATIO,
      `${npc.id}: texture ${figure.toFixed(2)} against the player's ${standard.toFixed(2)} -- too sharp beside him (CLAUDE.md style gate)`);
  });
}
