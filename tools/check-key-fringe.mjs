import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT, Report } from './lib/content.mjs';

/**
 * No visible pixel in any actor frame still carries the magenta key.
 *
 * THE RIG KEYS ON #FF00FF and every character in dark or cool clothing is
 * generated against it -- doc 38 part one rule 3, because green sits too close
 * to the shadows in navy wool. Keying leaves a FRINGE: pixels along a soft
 * edge that blended toward the backdrop before the alpha was cut, so they keep
 * a little of it. It is invisible on a 1105px source, and at a 240px drawn
 * height the filter that resamples them concentrates it.
 *
 * IT HAD BEEN THERE SINCE THE FIRST FRAME THE RIG EVER PRODUCED and nothing
 * measured it. It was found as PINK ON A MAN CLIMBING OUT OF A COACH -- 444
 * visible pixels on `aboard-coach`, 21 on `alight-coach`, 4 on `stand` -- and
 * fixed across 193 frames by pulling red and blue down to the green beside
 * them rather than deleting the pixel, which would tear the edge.
 *
 * THE MEASURE IS MAGENTA-NESS: `(r + b) / 2 - g`. Magenta is red and blue
 * without green, so the gap between the two is the key showing through, and it
 * says nothing about a pixel being merely warm or merely cool. Skin, rust,
 * lamplight and navy all sit far below it.
 *
 * THE THRESHOLD SITS IN A MEASURED GAP, not at a round number that felt safe:
 *
 *   real art, worst          22   the coach's maroon paintwork
 *   THRESHOLD                30
 *   key fringe, worst       127   the pixels the despill removed
 *
 * `min(r, b) - g` was tried as a tighter alternative -- magenta needs BOTH red
 * and blue -- and separates worse: 96 against the same 22, so it gives up
 * thirty points of headroom for nothing. The average is kept.
 *
 * IT DECODES THE PNGs ITSELF, with `zlib` and nothing else. Pillow is not
 * installable on a CI runner by this check's authority, and a check that only
 * runs on the machine that happens to have a library is the kind that stops
 * running. Forty megapixels across 195 frames.
 */
const FRINGE = 30;
/**
 * VISIBLE, and this number is the arguable part of the check.
 *
 * MEASURED BEFORE IT WAS CHOSEN. After the despill, every fringe pixel left in
 * the repository sits at alpha 8-32 and there are NONE above it -- 1,298 in
 * that band across 187 frames, zero in every band from 32 up. So 32 is where
 * the despill's own line already is, and this holds it there rather than
 * inventing one.
 *
 * It is defensible on its own terms too: at alpha 32 a pixel contributes an
 * eighth of its colour, and the frames are drawn at roughly 0.44 of source, so
 * one such pixel reaches under 6% of one screen pixel against a textured
 * plate. Below the line the check reports the worst it can see anyway -- a
 * number somebody can disagree with is better than one that is hidden.
 *
 * At alpha 8 the same scan reports a worst of 127, which is why the first run
 * of this check looked like the despill had missed Hob and Thad entirely. It
 * had not. The threshold was mine.
 */
const VISIBLE = 32;
/** Reported, never asserted: what sits below the line, so the line is visible. */
const FAINT = 8;

/** RGBA8 pixels from a non-interlaced 8-bit colour-type-6 PNG. */
function decode(buffer) {
  let at = 8;
  let head = null;
  const parts = [];
  while (at < buffer.length) {
    const length = buffer.readUInt32BE(at);
    const type = buffer.toString('latin1', at + 4, at + 8);
    const body = buffer.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') {
      head = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colour: body[9],
        interlace: body[12],
      };
    } else if (type === 'IDAT') parts.push(body);
    else if (type === 'IEND') break;
    at += 12 + length;
  }
  if (!head || head.depth !== 8 || head.colour !== 6 || head.interlace !== 0) return null;

  const { width, height } = head;
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * 4;
  const out = Buffer.alloc(stride * height);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[src];
    src += 1;
    const row = y * stride;
    const prior = row - stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[src + x];
      const a = x >= 4 ? out[row + x - 4] : 0;
      const b = y > 0 ? out[prior + x] : 0;
      const c = x >= 4 && y > 0 ? out[prior + x - 4] : 0;
      let recon;
      if (filter === 0) recon = value;
      else if (filter === 1) recon = value + a;
      else if (filter === 2) recon = value + b;
      else if (filter === 3) recon = value + ((a + b) >> 1);
      else {
        // Paeth.
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        recon = value + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c));
      }
      out[row + x] = recon & 0xff;
    }
    src += stride;
  }
  return { width, height, data: out };
}

export function check() {
  const report = new Report('No actor frame carries visible magenta key fringe');
  const files = globSync('art/actors/*/*.png', { cwd: ROOT }).sort();

  let worst = 0;
  let worstAt = '';
  let scanned = 0;
  let faint = 0;
  let faintWorst = 0;
  const bad = [];
  for (const relative of files) {
    const image = decode(readFileSync(resolve(ROOT, relative)));
    if (!image) {
      report.fail(`${relative} is not the 8-bit RGBA the rig writes -- this cannot read it`);
      continue;
    }
    scanned += 1;
    let count = 0;
    let peak = 0;
    for (let i = 0; i < image.data.length; i += 4) {
      const alpha = image.data[i + 3];
      if (alpha < FAINT) continue;
      const magenta = (image.data[i] + image.data[i + 2]) / 2 - image.data[i + 1];
      if (alpha < VISIBLE) {
        if (magenta > FRINGE) faint += 1;
        if (magenta > faintWorst) faintWorst = magenta;
        continue;
      }
      if (magenta > peak) peak = magenta;
      if (magenta > FRINGE) count += 1;
    }
    if (peak > worst) { worst = peak; worstAt = relative; }
    if (count > 0) bad.push({ relative, count, peak });
  }

  for (const { relative, count, peak } of bad.slice(0, 12)) {
    report.fail(
      `${relative}: ${count} visible pixel(s) with (r+b)/2 - g up to ${peak.toFixed(0)}, over `
      + `${FRINGE}. That is the #FF00FF backdrop showing through a soft edge. Despill it -- pull `
      + `red and blue down to the green beside them; deleting the pixel tears the edge.`,
    );
  }
  if (bad.length > 12) report.fail(`...and ${bad.length - 12} more frame(s)`);

  report.note(`${scanned} frame(s) decoded, worst magenta ${worst.toFixed(0)} of ${FRINGE} allowed`
    + (worst > 0 ? ` (${worstAt})` : ''));
  report.note(`below the line: ${faint} pixel(s) over ${FRINGE} at alpha ${FAINT}-${VISIBLE}, `
    + `worst ${faintWorst.toFixed(0)} -- reported, not asserted`);
  return report;
}
