import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { heldTo, measureCast, thadAgainstCurves, TOLERANCE } from '../tools/audit-scale-vs-thad.mjs';

/**
 * EVERY FIGURE BESIDE THAD, AS DRAWN (errata 234). Tyler, 2026-11-09, of Room 14
 * with the funeral cast at the gate: "the screenshot you sent shows Thad looking
 * much smaller than everyone else. It all needs to be scaled correctly.
 * Similarly through the whole game."
 *
 * tests/scale.test.ts held a standing figure to the curve on what its file
 * DECLARED -- the curve times `stature`, or a 1:1 sheet's frame height -- so a
 * sheet whose crown-to-sole is not its `figureHeight` passed while drawn off
 * Thad, and a group (`band`) was not measured at all. This measures the drawn
 * pixels: each figure's crown-to-sole on screen through the engine's own
 * arithmetic, against Thad's at the same soles (tools/audit-scale-vs-thad.mjs).
 * A standing adult is held to 1 +/- TOLERANCE of Thad; content/scale-anchors.json
 * `figures` says how to read what the pixels cannot (a hatted head, a group's
 * tallest adult, a man up a ladder), and any other range there cites a ruling.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const scale = read('content/scale-anchors.json');
const figures = scale.figures ?? [];
const measured = measureCast();
const key = (one) => `${one.figure}@${one.room}`;

test('Thad is drawn at the curve in every room: each standing clip is its own figureHeight, crown to sole', () => {
  const thad = thadAgainstCurves();
  assert.ok(thad.scalesWithDepth, 'content/actors/thad.json scales with depth');
  for (const clip of thad.clips) {
    assert.ok(Math.abs(clip.ratio - 1) <= 0.005, `${clip.clip}: crown to sole ${clip.rows} against figureHeight ${clip.figureHeight}`);
  }
});

for (const one of measured) {
  const range = heldTo(one);
  if (!range) continue;
  test(`${one.figure} in ${one.room} is drawn ${range.map((v) => v.toFixed(2)).join('-')} of Thad at the same feet`, (t) => {
    t.diagnostic(`${one.height.toFixed(0)} px crown to sole (${one.how}) against Thad's ${one.thad.toFixed(0)} at ${one.soleX},${one.soleY}: ${one.ratio.toFixed(3)}`);
    const inside = one.ratio >= range[0] && one.ratio <= range[1];
    const wrong = one.declared?.knownWrong;
    if (wrong) {
      t.diagnostic(`KNOWN WRONG, for Tyler: ${wrong.why} Suggested: ${wrong.fix}`);
      assert.ok(!inside, `${key(one)} now measures inside its range: take its knownWrong entry out of content/scale-anchors.json`);
      return;
    }
    assert.ok(inside, `${one.figure} in ${one.room} is ${one.height.toFixed(0)} px crown to sole where Thad would be `
      + `${one.thad.toFixed(0)} (${one.ratio.toFixed(3)}x; held to ${range.join('-')}). Fix its figureHeight or stature `
      + '(node tools/solve-figure-height.mjs), or rule an exception in content/scale-anchors.json `figures`');
  });
}

test('every scale-anchors `figures` entry names a placed figure, and any range of its own cites a ruling', () => {
  const placed = new Set(measured.map(key));
  const ids = new Set(measured.map((one) => one.figure));
  for (const entry of figures) {
    assert.ok(entry.room ? placed.has(`${entry.figure}@${entry.room}`) : ids.has(entry.figure),
      `${entry.figure}${entry.room ? ` in ${entry.room}` : ''} is not a visible figure in a shipping room`);
    if (entry.expect) {
      assert.ok(entry.ruling && entry.by, `${entry.figure}: an \`expect\` range needs the ruling it comes from (\`ruling\`, \`by\`)`);
      assert.ok(entry.expect[0] < entry.expect[1], `${entry.figure}: expect is [min, max]`);
    }
    if (entry.columns) assert.ok(entry.held || measured.some((one) => one.figure === entry.figure && one.posture === 'standing'),
      `${entry.figure}: a group measured by its tallest adult says it is \`held\``);
    if (entry.eyeRow !== undefined || entry.chinRow !== undefined) {
      assert.ok(entry.eyeRow !== undefined && entry.chinRow !== undefined && entry.chinRow > entry.eyeRow,
        `${entry.figure}: a hatted head declares both its eye row and, below it, its chin row`);
    }
  }
});

/**
 * THE DEFECT, PUT BACK. Each of these is a figure errata 234 corrected, with its
 * old data. tests/scale.test.ts passed every one -- it read the declared size,
 * and did not measure the groups -- and each must fail here.
 */
const DEFECTS = {
  prosperity_ozymandia: { sprite: { figureHeight: 368 } },
  gulch_panner: { sprite: { figureHeight: 377 } },
  duel_town_left: { sprite: { figureHeight: undefined, stature: undefined } },
};
test('the defects errata 234 corrected fail when put back', () => {
  const back = measureCast({ ambient: DEFECTS });
  for (const id of Object.keys(DEFECTS)) {
    const one = back.find((m) => m.figure === id);
    const [min, max] = heldTo(one);
    assert.ok(one.ratio < min || one.ratio > max, `${id} with its old data measures ${one.ratio.toFixed(3)}, inside ${min}-${max}: the check no longer catches it`);
  }
});

test('the tolerance is the standing man\'s 5%', () => {
  assert.equal(TOLERANCE, 0.05);
});
