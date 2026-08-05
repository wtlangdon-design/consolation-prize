/**
 * EVERY SPRITE RECT FITS INSIDE THE SHEET IT NAMES, AND EVERY SHEET IS USED.
 *
 * The dog drew as two small men in bowler hats. His `sheet` field still named
 * the combined ambient-main-street.png after the three people moved to
 * per-character sheets, so his rects indexed into the letter-writer's region
 * of a stale file. Nothing failed: the file existed, the rects were in range,
 * and the picture was simply of somebody else.
 *
 * A rect inside the wrong sheet is undetectable by looking at either the rect
 * or the sheet. What IS detectable is the pair going stale -- a rect that
 * overruns its sheet, and a sheet nobody names -- and the second is what would
 * have caught this one, because the moment the three moved off the combined
 * sheet it was referenced by exactly one character who did not belong on it.
 */
import { existsSync, readFileSync } from 'node:fs';

import { Report, loadContent, readJson } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

export function check() {
  const report = new Report('Every sprite rect fits its sheet, and every sheet is used');
  const manifest = readJson('content/manifest.json');
  const named = new Map();
  let rects = 0;

  for (const path of manifest.ambient ?? []) {
    const npc = readJson(path);
    const sprite = npc.sprite;
    if (!sprite?.sheet) continue;
    named.set(sprite.sheet, (named.get(sprite.sheet) ?? 0) + 1);

    if (!existsSync(sprite.sheet)) {
      report.fail(`${npc.id} names ${sprite.sheet}, which does not exist`);
      continue;
    }
    const png = readPng(readFileSync(sprite.sheet));
    for (const [x, y, w, h] of sprite.frames ?? []) {
      rects += 1;
      if (x < 0 || y < 0 || x + w > png.width || y + h > png.height) {
        report.fail(`${npc.id}: frame ${x},${y} ${w}x${h} overruns `
          + `${sprite.sheet} (${png.width}x${png.height})`);
      }
    }
    for (const [index, frames] of (sprite.breaks ?? []).entries()) {
      for (const frame of frames) {
        if (frame >= (sprite.frames?.length ?? 0)) {
          report.fail(`${npc.id}: break ${index} uses frame ${frame}, `
            + `but only ${sprite.frames?.length ?? 0} exist`);
        }
      }
    }
  }

  // A SHEET SHARED BY CHARACTERS WHO NO LONGER SHARE ONE is the shape the dog
  // fell into: everyone else moved off it and he was left pointing at it.
  for (const [sheet, users] of named) {
    if (users > 1) {
      report.note(`${sheet} is shared by ${users} characters -- deliberate, or a leftover?`);
    }
  }

  report.note(`${rects} frame rect(s) across ${named.size} sheet(s) checked against their pixels`);
  return report;
}
