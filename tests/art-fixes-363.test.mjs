/**
 * ERRATA 363: PICTURE FAULTS FIXED BY SCRIPT, EACH HELD (Tyler, 2026-11-16: "Go"). Every assertion here fails on main
 * before errata 363. The faults are the Acts II to IV art reviews' (claude/review-act*-2026-11-15.md, art sections).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readPng } from '../tools/lib/png.mjs';

const ROOT = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));
const png = (path) => readPng(readFileSync(new URL(path, ROOT)));
const room = (id) => json(json('content/manifest.json').rooms.find((path) => json(path).id === id));
const at = (img, x, y) => img.pixels.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4);

test('a lamp taken is not still on the desk', () => {
  const thads = room('thads_room');
  assert.ok((thads.props ?? []).some((prop) => prop.when?.T_LAMP_TAKEN === true), 'a prop covers the lamp once it is taken');
  assert.equal(thads.hotspots.find((one) => one.id === 'lamp').when?.T_LAMP_TAKEN, false, 'and the lamp is not clickable');
});

test('the morning is not lit by a lamp that is out', () => {
  const thads = room('thads_room');
  const glow = thads.motion.find((one) => one.id === 'glow_1');
  assert.deepEqual(glow.plates, [thads.background], 'the lamp glows on the night plate only');
  assert.ok(thads.figureLightWhen?.some((entry) => entry.when?.ACT?.atLeast === 4), 'Thad has the morning grade in Act IV');
});

test('where the panner stands in the river, water is drawn over the cut', () => {
  const river = room('gulch_river');
  const panner = json('content/ambient/gulch-panner.json');
  const ring = (river.props ?? []).find((prop) => prop.y > panner.y && Math.abs(prop.x - panner.x) < 40);
  assert.ok(ring, 'a prop drawn in front of him at his place');
});

test('the dawn ridge is not an emerald band', () => {
  const img = png('art/backgrounds/room-36-main-street-dawn.png');
  const sats = [];
  for (let y = 0; y < 420; y += 2) for (let x = 0; x < img.width; x += 3) {
    const [r, g, b] = at(img, x, y);
    const max = Math.max(r, g, b); const min = Math.min(r, g, b);
    if (max < 30 || g < r || b < r) continue;          // the ridge's cool pixels; the sky and the wood are warm
    sats.push((max - min) / max);
  }
  sats.sort((a, b) => a - b);
  const p90 = sats[Math.floor(sats.length * 0.9)];
  assert.ok(p90 < 0.62, `the ridge's 90th-percentile saturation is ${p90.toFixed(2)} (the street's own is about 0.6)`);
});

test('the dawn steeple is whole on both sides', () => {
  const img = png('art/backgrounds/room-36-main-street-dawn.png');
  const axis = 1577 / 2;
  let ragged = 0;
  for (let y = 50; y < 125; y += 1) {
    const sky = at(img, 700, y);
    const off = [];
    for (let x = 740; x < 840; x += 1) {
      const p = at(img, x, y);
      if (Math.abs(p[0] - sky[0]) + Math.abs(p[1] - sky[1]) + Math.abs(p[2] - sky[2]) > 60) off.push(x);
    }
    if (!off.length) continue;
    if (Math.abs((axis - off[0]) - (off[off.length - 1] - axis)) > 3) ragged += 1;
  }
  assert.ok(ragged <= 3, `${ragged} rows of the spire are not as wide right of its axis as left`);
});

test('the wreath laid on the coffin is drawn', () => {
  assert.ok((room('funeral').props ?? []).some((prop) => prop.when?.T_WREATH_LAID === true));
});

test('one headboard for one grave, and the peg on it', () => {
  // The graveside's board (the tall rounded one, with its plaque) is the hill's: the hill's own plot is taller
  // than it is wide, as the graveside's is, where the old carved board was nearly square.
  const own = png('art/props/room-14-own-plot.png');
  const opaque = (x, y) => at(own, x, y)[3] > 0;
  let top = own.height; let left = own.width; let right = 0; let bottom = 0;
  for (let y = 0; y < own.height; y += 1) for (let x = 110; x < 195; x += 1) {
    if (opaque(x, y) && at(own, x, y)[0] > 70) { top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x); }
  }
  assert.ok(bottom - top > 2 * (right - left), 'the board on his own plot is the graveside\'s tall one');
  // The peg sits on it: no transparent row between the topmost pixels and the board below.
  for (let y = top; y < top + 40; y += 1) {
    let any = false;
    for (let x = left - 10; x <= right + 10; x += 1) if (opaque(x, y)) any = true;
    assert.ok(any, `row ${y} under the peg is empty: the peg floats above the board`);
  }
});
