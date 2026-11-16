/**
 * PICTURES THE ACTS II TO IV REVIEW FOUND WRONG, FIXED BY SCRIPT (errata 358; Tyler, 2026-11-16: "Go"):
 *
 * 1. No cyan-blue key fringe on the graveside hearse.
 * 2. The fresh grave does not draw through the Colonel's wreath.
 * 3. The Colonel behind his wreath stands on the porch, not 22 px above it.
 * 4. Sump and Pratt at the counter take the Registrar's light.
 *
 * Proved against the defect: each assertion below failed on main before errata 358.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const png = (path) => readPng(readFileSync(new URL(`../${path}`, import.meta.url)));
const at = (sheet, x, y) => { const i = (y * sheet.width + x) * 4; return [...sheet.pixels.slice(i, i + 4)]; };

test('no blue key fringe on the hearse', () => {
  // The mule's own fringe is most of her plume's toss; it waits for the toss to be redrawn (errata 358).
  for (const path of ['art/props/room-31-hearse.png']) {
    const sheet = png(path);
    let edge = 0;
    let blue = 0;
    for (let y = 1; y < sheet.height - 1; y += 1) for (let x = 1; x < sheet.width - 1; x += 1) {
      const [r, g, b, a] = at(sheet, x, y);
      if (!a) continue;
      if (![[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) => at(sheet, nx, ny)[3] === 0)) continue;
      edge += 1;
      if (b - r > 60 && b > 120 && g > r) blue += 1;
    }
    assert.ok(blue / edge < 0.01, `${path}: ${blue} of ${edge} edge pixels are blue`);
  }
});

test('the fresh grave is not drawn through the wreath', () => {
  const props = Object.fromEntries(json('content/rooms/boot-hill.json').props.map((one) => [one.id, one]));
  const box = (prop) => [prop.x - Math.floor(prop.frame[2] / 2), prop.y - prop.frame[3] + 1];
  const plot = png(props.fresh_plot.sheet);
  const wreath = png(props.colonel_s_wreath.sheet);
  const [px, py] = box(props.fresh_plot);
  const [wx, wy] = box(props.colonel_s_wreath);
  let through = 0;
  for (let y = 0; y < props.colonel_s_wreath.frame[3]; y += 1) for (let x = 0; x < props.colonel_s_wreath.frame[2]; x += 1) {
    if (!at(wreath, x, y)[3]) continue;
    const sx = wx + x - px;
    const sy = wy + y - py;
    if (sx >= 0 && sy >= 0 && sx < plot.width && sy < plot.height && at(plot, sx, sy)[3]) through += 1;
  }
  assert.equal(through, 0);
});

test('the Colonel stands on his porch, and the counter is in one light', () => {
  assert.ok(json('content/ambient/wreath-fanshawe.json').y >= 548);
  const light = json('content/rooms/claims-registrar.json').figureLight;
  for (const one of ['sump', 'pratt_registrar']) assert.ok(light.figures.includes(one), one);
});
