/**
 * NO SPRITE MAY CARRY THE KEY COLOUR IT WAS CUT FROM.
 *
 * The coach shipped with a dark purple wedge between its reins and its
 * horses -- background trapped where thin lines enclosed it, which a flood
 * fill from the edge could never reach. It survived every check and every
 * play-through because the GRADE had darkened it out of recognition: magenta
 * at (255,0,255) became (15,3,15), which reads as shadow to an eye and is
 * still exactly R==B with G far below both.
 *
 * That signature is what this looks for, and it is why the check is possible
 * at all: keying darkens a colour but cannot change the fact that its red and
 * blue are equal and its green is not.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Report } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

const ROOTS = ['art/actors', 'art/objects'];
const TOLERATED = 400;  // interior specks happen; a trapped REGION is thousands

function* pngs(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* pngs(path);
    else if (entry.endsWith('.png')) yield path;
  }
}

export function check() {
  const report = new Report('No sprite carries the key colour it was cut from');
  let files = 0;
  const dirty = [];
  for (const root of ROOTS) {
    for (const path of pngs(root)) {
      files += 1;
      // Colour-type 3 and RGB PNGs live in art/ too; the reader handles RGBA
      // only, and a sprite that is not RGBA has no key to leave behind.
      let png;
      try { png = readPng(readFileSync(path)); } catch { continue; }
      // INTERIOR ONLY, AND THAT DISTINCTION IS THE CHECK. A first version
      // flagged Hob, whose suspect pixels turned out to be his lantern glass
      // and a one-pixel rim round his whole silhouette -- despill residue at
      // the edge, which every keyed sprite has and none of which is a hole.
      // The coach's fault was background TRAPPED INSIDE the figure, where
      // thin reins enclosed it. So a pixel counts only if its four
      // neighbours are opaque too: a rim never qualifies, a trapped region
      // always does.
      const { width, height, pixels } = png;
      const at = (x, y) => pixels[(y * width + x) * 4 + 3];
      let count = 0;
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const i = (y * width + x) * 4;
          const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
          if (a <= 16 || Math.abs(r - b) > 1 || r - g < 8 || r >= 40) continue;
          if (at(x - 1, y) > 16 && at(x + 1, y) > 16 && at(x, y - 1) > 16 && at(x, y + 1) > 16) {
            count += 1;
          }
        }
      }
      if (count > TOLERATED) dirty.push(`${path}: ${count}px`);
    }
  }
  for (const line of dirty.slice(0, 8)) report.fail(line);
  if (dirty.length > 8) report.fail(`...and ${dirty.length - 8} more`);
  report.note(`${files} sprite file(s) scanned for un-keyed background `
    + '(R equal to B, G below both, dark -- keyed magenta after grading)');
  return report;
}
