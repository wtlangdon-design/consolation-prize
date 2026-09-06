import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Report, ROOT, runCheck } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * A REBUILT SIGN'S LETTERS SIT ON ONE LINE, AND BOTH ITS STATES SIT ON THE SAME ONE.
 *
 * THE DEFECT THIS EXISTS FOR. The Improvement Company lettering was authored
 * on a board drawn at an angle. Phase 1.5F rotated the whole crop level and
 * reported a residual of 0.05 degrees; Tyler looked at the live room and said
 * it was still crooked, and he was right. A rotation levels the BLOCK and
 * leaves every letter where the old board put it, a pixel up and a pixel down
 * along the line -- and a stepping line is what an eye reads as crooked. No
 * angle measurement can see that, because the angle is fine.
 *
 * WHAT IT ASSERTS, per layer named in a `sign-rebuild.json`:
 *
 *   1. the glyphs fall into the lines the record says they do;
 *   2. no glyph's foot is more than `toleranceRows` from its line's own row;
 *   3. the states of one sign are the same geometry -- same bounding box, same
 *      glyph rows -- so weathered and gilt cannot drift apart.
 *
 * It measures the SHIPPING RASTER, after scaling and placement, which is the
 * thing on the board rather than the thing in the tool.
 */
const TOLERANCE = 1;

function findRecords(dir, found = []) {
  for (const entry of readdirSync(resolve(ROOT, dir))) {
    const path = join(dir, entry);
    if (statSync(resolve(ROOT, path)).isDirectory()) findRecords(path, found);
    else if (entry === 'sign-rebuild.json') found.push(path);
  }
  return found;
}

/** Glyph components of a layer's alpha, and the row each one's foot sits on. */
function glyphs(path) {
  const { width, height, pixels } = readPng(readFileSync(resolve(ROOT, path)));
  const ink = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) ink[i] = pixels[i * 4 + 3] > 60 ? 1 : 0;
  const seen = new Int32Array(width * height).fill(0);
  const out = [];
  let label = 0;
  for (let start = 0; start < ink.length; start += 1) {
    if (!ink[start] || seen[start]) continue;
    label += 1;
    const stack = [start];
    seen[start] = label;
    let count = 0;
    let bottom = 0;
    let sumX = 0;
    while (stack.length) {
      const at = stack.pop();
      const x = at % width;
      const y = Math.floor(at / width);
      count += 1; sumX += x; bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (ink[next] && !seen[next]) { seen[next] = label; stack.push(next); }
        }
      }
    }
    if (count >= 6) out.push({ cx: sumX / count, bottom, px: count });
  }
  return out;
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

export function check() {
  const report = new Report('A rebuilt sign\'s letters sit on one line, in both its states');
  let layers = 0;
  for (const recordPath of existsSync(resolve(ROOT, 'art/staging')) ? findRecords('art/staging') : []) {
    const record = JSON.parse(readFileSync(resolve(ROOT, recordPath), 'utf8'));
    const tolerance = record.toleranceRows ?? TOLERANCE;
    const expected = (record.lines ?? []).length;
    const shapes = [];
    for (const [name, layer] of Object.entries(record.layers ?? {})) {
      if (!existsSync(resolve(ROOT, layer.path))) {
        report.fail(`${recordPath}: ${layer.path} is named and not on disk`);
        continue;
      }
      layers += 1;
      const found = glyphs(layer.path);
      if (found.length === 0) {
        report.fail(`${recordPath}/${name}: no glyphs found in ${layer.path}`);
        continue;
      }
      const bottoms = found.map((glyph) => glyph.bottom);
      const split = (Math.min(...bottoms) + Math.max(...bottoms)) / 2;
      const lines = [found.filter((g) => g.bottom < split), found.filter((g) => g.bottom >= split)];
      if (expected && lines.filter((line) => line.length).length !== expected) {
        report.fail(`${recordPath}/${name}: the record says ${expected} line(s) and the raster `
          + `has ${lines.filter((line) => line.length).length}`);
      }
      const rows = [];
      for (const [index, line] of lines.entries()) {
        if (!line.length) continue;
        const row = median(line.map((glyph) => glyph.bottom));
        const worst = Math.max(...line.map((glyph) => Math.abs(glyph.bottom - row)));
        rows.push(row);
        if (worst > tolerance) {
          report.fail(`${recordPath}/${name} line ${index}: a glyph's foot is ${worst} row(s) off `
            + `the line's own row (${row}), and ${tolerance} is the tolerance. Letters that step `
            + 'read as a crooked line however level the block is.');
        }
        report.note(`${recordPath}/${name} line ${index}: ${line.length} glyph(s) on row ${row}, `
          + `worst foot ${worst} row(s) off`);
      }
      shapes.push({ name, rows, count: found.length });
    }
    for (const shape of shapes.slice(1)) {
      const first = shapes[0];
      if (shape.count !== first.count || shape.rows.join() !== first.rows.join()) {
        report.fail(`${recordPath}: ${shape.name} and ${first.name} are not the same geometry `
          + `(${shape.count} glyphs on ${shape.rows.join('/')} against ${first.count} on `
          + `${first.rows.join('/')}). One sign, one placement, whatever the state paints.`);
      }
    }
  }
  report.note(`${layers} sign layer(s) measured from their shipping rasters`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
