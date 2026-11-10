import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

/**
 * THE TWO DAWNS ARE ONE DAWN (errata 265; Tyler, 2026-11-10: "Fix the dawn").
 *
 * The game ends on two screens: Main Street at dawn, then the coach stop. Errata 263 relit the street to the very first
 * light and left the coach stop a bright later morning, an hour's jump in one doorway. The coach stop now follows the
 * street (tools/art/coach-stop-first-light.py). This holds the pair together: whichever is relit next, the other has
 * to come with it. And the figures standing in a relit plate are graded with it, which is how the dog on the dim
 * street came to be an orange lamp.
 */
const root = new URL('..', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
function meanLight(path) {
  const image = readPng(readFileSync(new URL(path, root)));
  let sum = 0; let n = 0;
  for (let at = 0; at < image.pixels.length; at += 4 * 53) {
    sum += (image.pixels[at] + image.pixels[at + 1] + image.pixels[at + 2]) / 3; n += 1;
  }
  return sum / n;
}
const street = read('content/rooms/main-street-dawn.json');
const stop = read('content/rooms/coach-stop-dawn.json');

test('the coach stop is the street\'s dawn a little further on, not another hour', () => {
  const a = meanLight(street.background); const b = meanLight(stop.background);
  assert.ok(b >= a - 2, `the coach stop (${b.toFixed(1)}) is darker than the street he has just left (${a.toFixed(1)}): the light goes backwards`);
  assert.ok(b - a <= 16, `the coach stop (${b.toFixed(1)}) is ${(b - a).toFixed(1)} lighter than the street (${a.toFixed(1)}): relight them together`);
});

test('whoever stands in the first light is graded into it, Thad among them', () => {
  for (const room of [street, stop]) {
    const grade = room.figureLight;
    assert.ok(grade?.figures?.includes('thad'), `${room.id}: Thad is drawn as bright as full day on a plate at first light`);
    assert.ok(grade.light && grade.light[2] >= grade.light[0], `${room.id}: the first light is cold`);
    assert.ok((grade.brightness ?? 1) < 1, `${room.id}: and dim`);
  }
  assert.ok(street.figureLight.figures.includes('dawn_dog'), 'the dog on the dim street is not graded with it');
});
