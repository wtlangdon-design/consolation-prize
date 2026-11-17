/**
 * ERRATA 369: THE TUNING FORK READS AS A FORK. The redrawn Room 34 (errata 365) drew it as a silver smudge about 45 px
 * long (Part B's handback). It is now one prop over both plates, twice the size, and the smudge is painted out under it.
 * Fails on main before errata 369: no prop there, and the smudge's silver is in both plates.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readPng } from '../tools/lib/png.mjs';

const ROOT = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));
const png = (path) => readPng(readFileSync(new URL(path, ROOT)));
const room = json('content/rooms/under-prosperity.json');

test('the fork is one prop on the stump, drawn in both states, and long enough to read', () => {
  const [x, y, w, h] = room.hotspots.find((one) => one.id === 'tuning_fork').rect;
  const prop = (room.props ?? []).find((one) => one.x >= x && one.x <= x + w && one.y - one.frame[3] / 2 >= y && one.y - one.frame[3] / 2 <= y + h);
  assert.ok(prop, 'a prop at the fork\'s click area');
  assert.equal(prop.when, undefined, 'drawn whether or not the wall has given');
  const img = png(prop.sheet);
  let left = img.width; let right = 0; let top = img.height; let bottom = 0;
  for (let py = 0; py < img.height; py += 1) for (let px = 0; px < img.width; px += 1) {
    if (img.pixels[(py * img.width + px) * 4 + 3] > 0) { left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py); }
  }
  const length = Math.hypot(right - left, bottom - top);
  assert.ok(length >= 75, `the fork is ${length.toFixed(0)} px tip to tip; the old one was about 45`);
});

for (const plate of ['art/backgrounds/room-34-under-prosperity.png', 'art/backgrounds/room-34-under-prosperity-after.png']) {
  test(`${plate}: the old fork is painted out under the new one`, () => {
    const img = png(plate);
    let silver = 0;
    for (let y = 552; y < 594; y += 1) for (let x = 608; x < 664; x += 1) {
      const i = (y * img.width + x) * 4; const r = img.pixels[i]; const g = img.pixels[i + 1]; const b = img.pixels[i + 2];
      const max = Math.max(r, g, b); const min = Math.min(r, g, b);
      if (max > 70 && (max - min) / max < 0.3) silver += 1;   // the stump is warm brown; the smudge was grey-white steel
    }
    assert.ok(silver < 10, `${silver} grey-steel pixels left where the old fork lay`);
  });
}
