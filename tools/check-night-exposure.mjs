import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Report, ROOT } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * EVERY NIGHT EXTERIOR CAN BE SEEN IN, AS THE APPROVED ONES CAN.
 *
 * Tyler, 2026-11-05: relit to night, Pratt's claim was the darkest room in
 * the game -- the lower half of the frame, where people stand and things are
 * clicked, averaged 23 against 30-37 in the night road, Boot Hill and the
 * back alley -- and Prosperity was a step darker than those. Both were lifted
 * (tools/art/plate-lift.py). A plate is not a number, so this asserts only a
 * floor: no night exterior's lower half averages darker than the darkest
 * approved one, less a margin. Light enough is Tyler's to say; too dark to
 * see is this check's.
 */
const FLOOR = 28;
const LOWER = 0.55;

function lowerHalfMean(path) {
  const image = readPng(readFileSync(resolve(ROOT, path)));
  const from = Math.floor(image.height * LOWER);
  let sum = 0;
  let count = 0;
  for (let y = from; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const i = (y * image.width + x) * 4; // readPng hands back RGBA either way
      sum += 0.299 * image.pixels[i] + 0.587 * image.pixels[i + 1] + 0.114 * image.pixels[i + 2];
      count += 1;
    }
  }
  return sum / count;
}

export function check() {
  const report = new Report('Every night exterior is as light to see in as the approved ones');
  const baseline = JSON.parse(readFileSync(resolve(ROOT, 'reference/global-baseline.json'), 'utf8'));
  let checked = 0;
  for (const [id, room] of Object.entries(baseline.rooms ?? {})) {
    if (!/^exterior.*night$/.test(room.visualType ?? '')) continue;
    const path = `art/backgrounds/${id}.png`;
    let mean;
    try { mean = lowerHalfMean(path); } catch { continue; }
    checked += 1;
    report.note(`${id}: lower half ${mean.toFixed(1)}`);
    if (mean < FLOOR) {
      report.fail(`${path}: the lower half of the frame averages ${mean.toFixed(1)}, under ${FLOOR} -- darker than every approved night room; lift it (tools/art/plate-lift.py)`);
    }
  }
  report.note(`${checked} night exterior plate(s) measured against a floor of ${FLOOR}`);
  return report;
}
