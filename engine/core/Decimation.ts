/**
 * SCUMM's actor scaling, in the engine. Errata ruling 24.
 *
 * `smallCostumeScaleTable` is an eight-bit reversal -- 0, 128, 64, 192, 32,
 * ... -- walked one entry per source row and column. A line is drawn when its
 * entry is under the scale and skipped when it is over. NOTHING IS BLENDED,
 * which is the whole reason this stays crisp where a resample smears: every
 * drawn row is still exactly one source row.
 *
 * The distribution is what makes it work. Consecutive entries are as far
 * apart in value as possible, so the lines dropped at any scale are spread
 * evenly through the figure instead of clumping. It is an ordered dither
 * applied to a sequence rather than a plane.
 *
 * This file is the exact counterpart of tools/pixelart/decimation.py. If the
 * two ever disagree the sprite in the room stops matching the sprite that was
 * measured, and the measured threshold stops meaning anything.
 */

const TABLE_SIZE = 256;

function bitReversalTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < TABLE_SIZE; n += 1) {
    let bits = 0;
    for (let shift = 0; shift < 8; shift += 1) {
      if (n & (1 << shift)) bits |= 1 << (7 - shift);
    }
    table.push(bits);
  }
  return table;
}

export const SCALE_TABLE = bitReversalTable();

/** Which of `count` source lines survive at `scale` (0-255). */
export function kept(count: number, scale: number): number[] {
  const lines: number[] = [];
  for (let index = 0; index < count; index += 1) {
    if ((SCALE_TABLE[index % TABLE_SIZE] as number) < scale) lines.push(index);
  }
  return lines;
}

/**
 * The scale whose decimation is closest to `wanted` lines.
 *
 * Searched, not computed. The table is not linear over short runs -- forty
 * rows sample only its first forty entries, whose distribution is coarse --
 * so the scale that yields 26 rows out of 40 is not 26/40 of 255.
 */
export function scaleFor(count: number, wanted: number): number {
  let best = 255;
  let bestGap = Number.POSITIVE_INFINITY;
  for (let scale = 1; scale < TABLE_SIZE; scale += 1) {
    const gap = Math.abs(kept(count, scale).length - wanted);
    if (gap < bestGap) {
      best = scale;
      bestGap = gap;
    }
    if (bestGap === 0 && gap > 0) break;
  }
  return best;
}

/**
 * Decimates a region of `source` into a new canvas of the kept lines.
 *
 * Pixels are copied through ImageData rather than drawn with drawImage, so
 * there is no filtering step to disable and no chance of a browser deciding
 * to be helpful. Rows and columns walk the table independently, which is what
 * keeps a figure's proportions from shearing.
 */
export function decimate(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  width: number,
  height: number,
  scale: number,
): HTMLCanvasElement {
  const rows = kept(height, scale);
  const columns = kept(width, scale);
  const cut = document.createElement('canvas');
  cut.width = Math.max(1, columns.length);
  cut.height = Math.max(1, rows.length);
  const target = cut.getContext('2d');
  if (!target) return cut;
  target.imageSmoothingEnabled = false;

  const whole = document.createElement('canvas');
  whole.width = width;
  whole.height = height;
  const from = whole.getContext('2d');
  if (!from) return cut;
  from.imageSmoothingEnabled = false;
  from.drawImage(source, sx, sy, width, height, 0, 0, width, height);

  const read = from.getImageData(0, 0, width, height);
  const write = target.createImageData(cut.width, cut.height);
  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < columns.length; x += 1) {
      const at = (((rows[y] as number) * width) + (columns[x] as number)) * 4;
      const to = ((y * cut.width) + x) * 4;
      write.data[to] = read.data[at] as number;
      write.data[to + 1] = read.data[at + 1] as number;
      write.data[to + 2] = read.data[at + 2] as number;
      write.data[to + 3] = read.data[at + 3] as number;
    }
  }
  target.putImageData(write, 0, 0);
  return cut;
}
