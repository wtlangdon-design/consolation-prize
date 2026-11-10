import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

/**
 * EACH ROOM A COLOUR OF ITS OWN (errata 262). Tyler, 2026-11-10: "a nice way to differentiate different rooms from
 * each other, so they don't all look exactly the same."
 *
 * A graded plate is its untouched original put through one function (tools/art/room-grade.py), by the numbers in
 * reference/room-grades.json. This holds that nothing shipped has drifted from that: a plate regenerated or patched
 * by hand without re-running the tool, or a picture cut from a graded plate and left ungraded beside it, fails here.
 */
const root = new URL('..', import.meta.url);
const grades = JSON.parse(readFileSync(new URL('reference/room-grades.json', root), 'utf8')).rooms;

/** tools/art/room-grade.py's function, here in the test's own words so that CI needs no Python: one pixel in, one out. */
function graded([r, g, b], spec) {
  const a = [r / 255, g / 255, b / 255];
  const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const lum = luma(a);
  const lean = Math.max(0, Math.min(1, 1 - lum * 1.6)) ** 1.2 * spec.strength;
  const t = spec.tint.map((v) => v / 255);
  const mixed = a.map((v, k) => v * (1 - lean) + (lum + 0.02) * (t[k] / luma(t)) * lean);
  const grey = luma(mixed);
  return mixed.map((v) => Math.round(Math.max(0, Math.min(1, grey + (v - grey) * spec.saturate)) * 255));
}
const pictures = (room) => [...new Set([...readFileSync(new URL(room, root), 'utf8').matchAll(/"(art\/[^"]+\.png)"/g)].map((m) => m[1]))]
  .filter((path) => !/^art\/(masks|actors|staging|ui)\//.test(path));

test('every graded picture is its original, graded as the list says', () => {
  const manifest = JSON.parse(readFileSync(new URL('content/manifest.json', root), 'utf8'));
  const rooms = new Map(manifest.rooms.map((path) => [JSON.parse(readFileSync(new URL(path, root), 'utf8')).id, path]));
  const wanted = new Map();
  for (const [room, spec] of Object.entries(grades)) {
    assert.ok(rooms.has(room), `reference/room-grades.json: no room "${room}"`);
    for (const picture of pictures(rooms.get(room))) wanted.set(picture, spec);
  }
  let checked = 0;
  for (const [picture, spec] of wanted) {
    const kept = new URL(`art/staging/room-grade/originals/${picture.replaceAll('/', '__')}`, root);
    assert.ok(existsSync(kept), `${picture} is listed and has no original kept: python3 tools/art/room-grade.py`);
    const original = readPng(readFileSync(kept));
    const shipped = readPng(readFileSync(new URL(picture, root)));
    assert.equal(shipped.width * shipped.height, original.width * original.height, `${picture} is not the size of its original`);
    // Every 97th pixel: a plate is 1.6 million of them, and one function either was applied or was not.
    let off = 0; let worst = 0;
    for (let at = 0; at < original.pixels.length; at += 4 * 97) {
      const want = graded([original.pixels[at], original.pixels[at + 1], original.pixels[at + 2]], spec);
      for (let k = 0; k < 3; k += 1) {
        const by = Math.abs(shipped.pixels[at + k] - want[k]);
        if (by > 1) off += 1;
        worst = Math.max(worst, by);
      }
      assert.equal(shipped.pixels[at + 3], original.pixels[at + 3], `${picture}: the grade changed a pixel's alpha`);
    }
    assert.equal(off, 0, `${picture} is not its original graded as the list says (${off} sampled values off, worst by ${worst}): python3 tools/art/room-grade.py`);
    checked += 1;
  }
  assert.ok(checked >= Object.keys(grades).length);
  // And nothing is kept that is no longer listed: its plate would still be graded.
  for (const name of readdirSync(new URL('art/staging/room-grade/originals/', root))) {
    assert.ok(wanted.has(name.replaceAll('__', '/')), `${name} has an original kept and no grade listed: python3 tools/art/room-grade.py restores it`);
  }
});

test('a grade is a lean, not a repaint, and the warm rooms the others are told apart from are left alone', () => {
  for (const [room, spec] of Object.entries(grades)) {
    assert.ok(spec.strength > 0 && spec.strength <= 0.65, `${room}: strength ${spec.strength} repaints the room`);
    assert.ok(spec.saturate >= 1 && spec.saturate <= 1.15, `${room}: saturate ${spec.saturate}`);
    assert.ok(spec.why, `${room}: says why this colour is its own`);
  }
  for (const warm of ['nugget', 'mercantile', 'livery', 'fanshawe_office', 'company_lobby']) {
    assert.ok(!grades[warm], `${warm} is the warm or the red the graded rooms are told apart from`);
  }
  const tints = Object.values(grades).map((spec) => spec.tint.join(','));
  assert.ok(new Set(tints).size >= tints.length - 1, 'the rooms are leaned to the same colour: that is the brown again');
});
