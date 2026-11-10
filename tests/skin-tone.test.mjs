import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { ROOT, loadContent, readJson } from '../tools/lib/content.mjs';
import { readPng } from '../tools/lib/png.mjs';

/**
 * A ROOM'S GRADE DOES NOT TAKE THE COLOUR OUT OF A FACE (errata 255).
 *
 * Tyler, 2026-11-10, of the Colonel on Boot Hill: "a very different skin tone than everyone else in the scene and it
 * makes him look sickly." The room's `figureLight` cooled him into the hill's night and took half his colour with it;
 * that was set for an earlier sheet, and on the sheet that replaced it his face came out grey beside the town's.
 *
 * So: every person a room grades is compared with the people it does not grade. The colour left in his face after the
 * grade (the saturation of the skin in his head) must be within 30% of theirs. A grade may cool and dim a man; it may
 * not leave him the one grey face in a warm crowd, or the one flushed face in a pale one.
 *
 * Only people: a figure wider than it is tall (horses, a crowd) is not a subject, though a crowd is a fair reference.
 */
const content = loadContent();
const NEAR = 0.3;
const sheets = new Map();
const sheet = (path) => {
  if (!sheets.has(path)) sheets.set(path, readPng(readFileSync(resolve(ROOT, path))));
  return sheets.get(path);
};
/** The room's grade as the renderer applies it: the light's multiply, then brightness, contrast and saturate. */
function graded([r, g, b], grade, own = {}) {
  const light = grade?.light ?? [1, 1, 1];
  const brightness = own.brightness ?? grade?.brightness ?? 1;
  const contrast = own.contrast ?? grade?.contrast ?? 1;
  const s = own.saturate ?? grade?.saturate ?? 1;
  let c = [r * light[0], g * light[1], b * light[2]].map((v) => v * brightness).map((v) => (v - 127.5) * contrast + 127.5);
  c = [
    (0.213 + 0.787 * s) * c[0] + (0.715 - 0.715 * s) * c[1] + (0.072 - 0.072 * s) * c[2],
    (0.213 - 0.213 * s) * c[0] + (0.715 + 0.285 * s) * c[1] + (0.072 - 0.072 * s) * c[2],
    (0.213 - 0.213 * s) * c[0] + (0.715 - 0.715 * s) * c[1] + (0.072 + 0.928 * s) * c[2],
  ];
  return c.map((v) => Math.max(0, Math.min(255, v)));
}
/** Is this drawn pixel skin: a warm hue, lit, with some colour in it. */
function isSkin(r, g, b) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  if (max / 255 <= 0.35 || (max - min) / max <= 0.12) return false;
  if (max !== r) return false;
  const hue = ((g - b) / (max - min)) / 6;
  return hue < 0.14 && hue > 0.03; // a red shirt (hue near 0) is not a face
}
/** The mean skin colour in the top fifth of a figure's rest frame (its head, or a crowd's heads), after the grade. */
function face(npc, grade) {
  const frame = npc.sprite?.frames?.[0];
  if (!frame || !npc.sprite.sheet) return null;
  const image = sheet(npc.sprite.sheet);
  const [x, y, w, h] = frame;
  const sum = [0, 0, 0]; let n = 0;
  for (let row = y; row < y + Math.round(h * 0.2); row += 1) {
    for (let column = x; column < x + w; column += 1) {
      const at = (row * image.width + column) * 4;
      if (image.pixels[at + 3] < 200) continue;
      const rgb = [image.pixels[at], image.pixels[at + 1], image.pixels[at + 2]];
      if (!isSkin(...rgb)) continue;
      const out = grade ? graded(rgb, grade, grade.perFigure?.[npc.id]) : rgb;
      sum[0] += out[0]; sum[1] += out[1]; sum[2] += out[2]; n += 1;
    }
  }
  if (n < 60) return null;
  const mean = sum.map((v) => v / n);
  const max = Math.max(...mean); const min = Math.min(...mean);
  return { mean, saturation: (max - min) / max, wide: w > h };
}

const rooms = content.manifest.rooms.map((path) => readJson(path));
const cast = content.ambient.map((one) => one.data);
let compared = 0;
for (const room of rooms) {
  const grades = [room.figureLight, ...(room.figureLightWhen ?? []).map((entry) => entry.light)].filter(Boolean);
  for (const grade of grades) {
    const here = cast.filter((npc) => npc.room === room.id);
    const named = (npc) => grade.figures?.includes(npc.id) || grade.sheets?.includes(npc.sprite?.sheet);
    const others = here.filter((npc) => !named(npc)).map((npc) => face(npc, null)).filter(Boolean);
    if (!others.length) continue;
    const theirs = others.reduce((sum, one) => sum + one.saturation, 0) / others.length;
    for (const npc of here.filter(named)) {
      const his = face(npc, grade);
      if (!his || his.wide) continue;
      compared += 1;
      test(`${npc.id} in ${room.id}: the room's grade leaves his face the colour of the faces round him`, () => {
        const ratio = his.saturation / theirs;
        assert.ok(Math.abs(ratio - 1) <= NEAR,
          `his face keeps ${his.saturation.toFixed(2)} of its colour after the grade (${his.mean.map((v) => Math.round(v)).join('/')}); the ungraded faces in the room keep ${theirs.toFixed(2)}`);
      });
    }
  }
}
test('the check has someone to look at', () => {
  assert.ok(compared >= 1, 'no graded person stands with ungraded people: the Colonel on Boot Hill should be one');
});
