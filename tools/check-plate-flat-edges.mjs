/**
 * NO ROOM PLATE STOPS SHORT OF ITS FRAME.
 *
 * Room 13's undertaker's shop shipped with its top 38 rows one flat colour
 * (mean 23,23,22, spread about 1) and a near-black line under them: the
 * picture did not reach the top of the frame, and the lamp's chain ended at
 * that line. Nothing caught it -- the plate was the right size and every gate
 * read it as a picture -- and the art audit found it by looking (errata 119).
 *
 * Held here: in every room's plate and every state plate, count the rows at the
 * top and at the bottom whose brightness barely varies across the whole width
 * (a spread under FLAT_SPREAD). FLAT_ROWS or more of them is a band of no
 * picture. Calibrated on every plate in the game (2026-11-06): a drawn ceiling,
 * however dark -- the laundry's -- spreads 3 or more; a few rows of dark border
 * stay under 7; Room 13's band was 38.
 *
 * Room 32 is exempt by name: its dark is drawn by script, and the dark IS the
 * room (CLAUDE.md design invariant 2).
 */
import { readFileSync } from 'node:fs';

import { Report, loadContent, runCheck } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

export const FLAT_SPREAD = 1.6;
export const FLAT_ROWS = 12;
const EXEMPT = {
  coffin: 'Room 32 is drawn by script and its dark is the room: design invariant 2 (CLAUDE.md), errata 70.',
};

/** Rows from the given end whose brightness spread across the width is under FLAT_SPREAD. */
export function flatRows(png, fromBottom) {
  const { width, height, pixels } = png;
  let rows = 0;
  for (let i = 0; i < height; i += 1) {
    const y = fromBottom ? height - 1 - i : i;
    let sum = 0;
    let sq = 0;
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const l = 0.299 * pixels[at] + 0.587 * pixels[at + 1] + 0.114 * pixels[at + 2];
      sum += l;
      sq += l * l;
    }
    const mean = sum / width;
    if (Math.sqrt(Math.max(0, sq / width - mean * mean)) >= FLAT_SPREAD) break;
    rows += 1;
  }
  return rows;
}

export function check() {
  const report = new Report('room plates reach the edges of their frame');
  const content = loadContent();
  let read = 0;
  for (const { data: room } of content.rooms) {
    if (EXEMPT[room.id]) continue;
    const plates = [room.background, ...Object.values(room.plates ?? {})].filter(Boolean);
    for (const path of new Set(plates)) {
      let png;
      try {
        png = readPng(readFileSync(path));
      } catch (error) {
        report.fail(`${room.id}: cannot read ${path} -- ${error.message}`);
        continue;
      }
      read += 1;
      const top = flatRows(png, false);
      const bottom = flatRows(png, true);
      if (top >= FLAT_ROWS) {
        report.fail(`${room.id}: ${path}'s top ${top} rows are one flat colour -- the picture stops short of the frame`);
      }
      if (bottom >= FLAT_ROWS) {
        report.fail(`${room.id}: ${path}'s bottom ${bottom} rows are one flat colour -- the picture stops short of the frame`);
      }
    }
  }
  report.note(`${read} plates read`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
