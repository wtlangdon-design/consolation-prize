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
 *
 * AND NO EXTERIOR IS DAY. Tyler, 2026-11-06: "we don't want something flipping
 * from night to day and back to night." The funeral was built by day under a
 * blue sky, between Boot Hill at night and the hill at night after it, because
 * one line said "very blue" (errata 99 K). Every exterior is a night exterior,
 * and its sky -- the top fifth of the plate -- is dark, whatever its label says.
 * The one way past is a `daylight` entry on the room's baseline quoting the ruling
 * that puts it there (Room 36, the dawn the game ends on).
 */
const FLOOR = 28;
const LOWER = 0.55;
const SKY = 0.2;
const SKY_CEILING = 60;

function meanLuma(path, from, to) {
  const image = readPng(readFileSync(resolve(ROOT, path)));
  const y0 = Math.floor(image.height * from);
  const y1 = Math.floor(image.height * to);
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const i = (y * image.width + x) * 4; // readPng hands back RGBA either way
      sum += 0.299 * image.pixels[i] + 0.587 * image.pixels[i + 1] + 0.114 * image.pixels[i + 2];
      count += 1;
    }
  }
  return sum / count;
}

export function check() {
  const report = new Report('Every exterior is night, and as light to see in as the approved ones');
  const baseline = JSON.parse(readFileSync(resolve(ROOT, 'reference/global-baseline.json'), 'utf8'));
  let checked = 0;
  for (const [id, room] of Object.entries(baseline.rooms ?? {})) {
    if (!(room.visualType ?? '').startsWith('exterior')) continue;
    const path = `art/backgrounds/${id}.png`;
    let sky;
    try { sky = meanLuma(path, 0, SKY); } catch { continue; }
    if (room.daylight) {
      report.note(`${id}: daylight by ruling -- ${room.daylight}`);
      continue;
    }
    if (!/night$/.test(room.visualType)) {
      report.fail(`${id}: an exterior that is not a night exterior (${room.visualType}); every exterior is night (Tyler, 2026-11-06, errata 99 K), or its baseline names the ruling in \`daylight\``);
    }
    if (sky > SKY_CEILING) {
      report.fail(`${path}: its sky averages ${sky.toFixed(1)}, over ${SKY_CEILING} -- a day sky in a night game (errata 99 K)`);
    }
    const mean = meanLuma(path, LOWER, 1);
    checked += 1;
    report.note(`${id}: lower half ${mean.toFixed(1)}`);
    if (mean < FLOOR) {
      report.fail(`${path}: the lower half of the frame averages ${mean.toFixed(1)}, under ${FLOOR} -- darker than every approved night room; lift it (tools/art/plate-lift.py)`);
    }
  }
  report.note(`${checked} night exterior plate(s) measured against a floor of ${FLOOR}`);
  return report;
}
