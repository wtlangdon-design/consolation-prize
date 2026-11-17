/**
 * ERRATA 367: THE COLONEL AT HIS DESK IS DRAWN 15% BIGGER (Tyler, 2026-11-16: "too short behind the desk"). Fails on main before errata 367: the frames there are the ones kept in
 * art/staging/desk-figures-bigger/frames.json.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readPng } from '../tools/lib/png.mjs';

const ROOT = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));
const before = json('art/staging/desk-figures-bigger/frames.json');

/** The rows of a frame that hold any drawn pixel. */
function drawnRows(sheet, [x, y, w, h]) {
  const img = readPng(readFileSync(new URL(sheet, ROOT)));
  let top = h; let bottom = -1;
  for (let row = 0; row < h; row += 1) for (let col = 0; col < w; col += 1) {
    if (img.pixels[((y + row) * img.width + x + col) * 4 + 3] > 0) { top = Math.min(top, row); bottom = Math.max(bottom, row); }
  }
  return bottom - top + 1;
}

for (const key of Object.keys(before)) {
  const [name, when] = key.split('#');
  test(`${key} behind the desk is drawn at least 14% taller than before errata 367`, () => {
    const record = json(`content/ambient/${name}.json`);
    assert.equal(record.posture, 'behind-counter');
    const sprite = when === undefined ? record.sprite : record.spriteWhen[Number(when)].sprite;
    const kept = `art/staging/desk-figures-bigger/${sprite.sheet.split('/').pop()}`;
    assert.equal(sprite.frames.length, before[key].length);
    for (const [index, frame] of sprite.frames.entries()) {
      assert.ok(frame[3] >= 1.14 * before[key][index][3], `frame ${index} is ${frame[3]}px, was ${before[key][index][3]}px`);
      const drawn = drawnRows(sprite.sheet, frame); const was = drawnRows(kept, before[key][index]);
      assert.ok(was > 0 && drawn >= 1.14 * was, `${sprite.sheet} frame ${index}: ${drawn} drawn rows, was ${was}`);
    }
  });
}
