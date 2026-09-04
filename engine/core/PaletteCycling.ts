import type { CyclingElement, PaletteFile } from './types.ts';

/**
 * Palette cycling, doc 18. The only background animation the game has.
 *
 * Rotating entries within a reserved band of the palette while every pixel
 * index stays exactly where it was. No frames, no extra art. This module is
 * the arithmetic only -- which index shows which index's colour at a given
 * moment -- so it can be tested without a canvas.
 *
 * The composition side of this lives in tools/pixelart/cycling.py and the two
 * must agree exactly, because one reserves the bands and the other animates
 * them. Both are driven by the same declarations in room JSON.
 */

/** A band resolved from a family-relative declaration to absolute indices. */
export interface ResolvedElement {
  id: string;
  mode: CyclingElement['mode'];
  rate: number;
  phase: number;
  first: number;
  count: number;
}

/**
 * The elements a room actually animates: everything it declares, less the
 * dormant ones.
 *
 * ONE READER, SO THE TWO HALVES CANNOT DISAGREE. `dormant` was content-only
 * metadata: the validator skipped a dormant element and the runtime did not,
 * so Room 1 went on building a cycler, scanning its plate and cycling one
 * accidental sky pixel while the content file said it did nothing. Both sides
 * now ask this.
 */
export function liveCycling(room: { cycling?: CyclingElement[] }): CyclingElement[] {
  return (room.cycling ?? []).filter((element) => element.dormant !== true);
}

export function resolve(palette: PaletteFile, element: CyclingElement): ResolvedElement {
  const family = palette.families[element.ramp.family];
  if (!family) {
    throw new Error(`Cycling ramp names no such family: ${element.ramp.family}`);
  }
  return {
    id: element.id,
    mode: element.mode,
    rate: element.rate,
    phase: element.phase ?? 0,
    first: family.start + element.ramp.start,
    count: element.ramp.count,
  };
}

/** How many distinct states this element has before it repeats. */
export function stateCount(element: ResolvedElement): number {
  if (element.mode === 'rotate') return element.count;
  if (element.mode === 'pingpong') return Math.max(1, 2 * (element.count - 1));
  return 2;
}

/**
 * How far the band is rotated at whole step `step`.
 *
 * `rotate` and `pingpong` WRAP: they run on a ramp that is a loop, and water
 * and fire come back round.
 *
 * `pulse` CLAMPS, which is not a detail. Hob's lamp reserves four entries
 * spanning luminance 136 to 203, so a wrapping pulse would drop its core to
 * its darkest entry every second beat -- a strobe, not the carried flame in
 * still air doc 18 asks for. Clamped, the element swells by one ramp step and
 * its brightest pixel holds.
 */
export function offsetAt(element: ResolvedElement, step: number): number {
  if (element.mode === 'rotate') return modulo(step, element.count);
  if (element.mode === 'pingpong') {
    const span = Math.max(1, 2 * (element.count - 1));
    const walk = modulo(step, span);
    return walk < element.count ? walk : span - walk;
  }
  return modulo(step, 2);
}

/**
 * index -> the index whose colour it currently shows.
 *
 * Only reserved indices appear, so a caller can treat an absent key as "this
 * index shows its own colour", which is true of 248 of the 256.
 */
export function mappingAt(elements: ResolvedElement[], seconds: number): Map<number, number> {
  const out = new Map<number, number>();
  for (const element of elements) {
    const step = Math.floor(seconds * element.rate + element.phase * stateCount(element));
    const shift = offsetAt(element, step);
    for (let position = 0; position < element.count; position += 1) {
      const shown = element.mode === 'pulse'
        ? Math.min(element.count - 1, position + shift)
        : modulo(position + shift, element.count);
      out.set(element.first + position, element.first + shown);
    }
  }
  return out;
}

/** True when two mappings would draw the same picture. */
export function sameMapping(a: Map<number, number>, b: Map<number, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [index, shown] of a) {
    if (b.get(index) !== shown) return false;
  }
  return true;
}

function modulo(value: number, span: number): number {
  return ((value % span) + span) % span;
}
