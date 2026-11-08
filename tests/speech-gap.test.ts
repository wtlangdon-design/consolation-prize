import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { overlaySpeakerHead, speechTop } from '../engine/render/Renderer.ts';

/**
 * A SPEAKER WHO IS ONLY A HEAD GETS A WHOLE MAN'S GAP (Tyler, 2026-11-07, of the stage driver: "Can the driver's
 * dialogue be a little further above his head?"). Every speaker's words sit above his head by a fraction of his
 * height. The driver is drawn as a head on the coach, and his "height" was the head box's, so his words sat a few
 * pixels off his hat while every standing speaker's sat a man's fraction clear.
 */
test('a head drawn over a body is given the gap of a man standing there, not of the head', () => {
  const driver = JSON.parse(readFileSync(new URL('../content/actors/driver-head.json', import.meta.url), 'utf8')) as
    { rect: [number, number, number, number] };
  const place = { x: 1000, y: 300, scale: 1 };
  const man = 233;
  const head = overlaySpeakerHead(place, driver.rect, man);
  assert.equal(head.headY, place.y + driver.rect[1], 'the words still sit over his own head, not the coach');
  const text = 60;
  const gap = head.headY - (speechTop(head.headY, head.height, text) + text);
  const standing = { headY: 400, height: man };
  const standingGap = standing.headY - (speechTop(standing.headY, standing.height, text) + text);
  assert.ok(gap >= standingGap, `the driver's words clear his head by ${gap.toFixed(1)}px; a man's clear by ${standingGap.toFixed(1)}px`);
  assert.ok(gap >= 20, `the driver's words clear his head by only ${gap.toFixed(1)}px`);
  // Off the depth curve there is no man to measure by, and the head is all there is.
  assert.equal(overlaySpeakerHead(place, driver.rect, null).height, driver.rect[3]);
});

/**
 * THAD'S HOME IS THREE THOUSAND MILES AWAY (Tyler, 2026-11-07: "A line of dialogue says Thad is 1100 miles from
 * home. Is that really the distance between a city in CA and Providence?" -- it is about 2,600 in a straight line,
 * ruled "3000 miles"). Seven lines give the distance and every one said eleven hundred; one ruling, one number.
 */
test('every line that gives the distance home gives three thousand miles', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const root = new URL('../content/', import.meta.url).pathname;
  const lines: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.json')) lines.push(...(readFileSync(path, 'utf8').match(/"[^"]*\bmiles\b[^"]*"/g) ?? []));
    }
  };
  walk(root);
  const home = lines.filter((line) => /eleven hundred|twenty-six hundred|three thousand/i.test(line));
  assert.ok(home.length >= 7, `only ${home.length} lines give the distance home`);
  for (const line of home) assert.match(line, /three thousand miles/i, `${line} gives another distance home`);
});
