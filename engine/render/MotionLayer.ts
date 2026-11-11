import type { RoomMotion } from '../core/types.ts';

/**
 * THE ROOM'S OWN SMALL MOTION (errata 273). Tyler, 2026-11-10, of what still worried him before playing: the rooms
 * are still. Monkey Island's screens are never quite still -- smoke goes up, water moves, a sign swings, the stars
 * come and go -- and ours moved only where a person stood or a lamp breathed.
 *
 * Every kind here is made from the plate's own pixels or from a few squares the size of the room's pixel, never a
 * new picture: `shimmer` and `sway` move strips of the plate itself; `twinkle` lifts the stars the plate already
 * has; `smoke` and `motes` are squares, drawn as the room's own pixel is drawn. Which of them shows is a function
 * of the clock and nothing else, so nothing is saved, and a load resumes mid-puff.
 *
 * INVARIANT 9: none of this conveys anything. A motion may wait on which picture of the room is shown (its `plates`)
 * and on nothing else -- never a puzzle's flag, so nothing starts or stops moving because the player did something.
 * Room 33 and Room 32 have none, by invariants 8 and 2.
 */

/** One square to draw: where, how big, what colour, how opaque. */
export interface Puff { x: number; y: number; size: number; alpha: number }

const fract = (v: number) => v - Math.floor(v);
/** A fixed pseudo-random number in [0, 1) for an integer seed, the same every run. */
export const hash = (n: number) => fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453);

/** The squares of a column of smoke at `seconds`: puffs born at the rect's top-centre, rising, drifting, fading. */
export function smokeAt(motion: RoomMotion, seconds: number, block: number): Puff[] {
  const [x, y, w] = motion.rect;
  const count = motion.amount ?? 6;
  const life = 1 / Math.max(0.05, motion.rate ?? 0.25);
  const rise = motion.rise ?? 120;
  const drift = motion.drift ?? 18;
  const out: Puff[] = [];
  for (let n = 0; n < count; n += 1) {
    const born = (n / count) * life;
    const cycle = Math.floor((seconds - born) / life);
    const age = fract((seconds - born) / life);
    const seed = hash(n * 97 + cycle * 13 + (motion.seed ?? 0));
    const px = x + w / 2 + (seed - 0.5) * w + drift * age + Math.sin((age * 2 + seed) * Math.PI) * block;
    const py = y - rise * age;
    // It leaves the pipe small and dense and spreads as it thins.
    const size = block * (2 + Math.floor(age * 4));
    const alpha = (motion.alpha ?? 0.35) * Math.min(1, age * 6) * (1 - age);
    if (alpha > 0.01) out.push({ x: snap(px, block), y: snap(py, block), size, alpha });
  }
  return out;
}

/** Dust in a light: a few squares drifting slowly in the rect, each coming and going. */
export function motesAt(motion: RoomMotion, seconds: number, block: number): Puff[] {
  const [x, y, w, h] = motion.rect;
  const count = motion.amount ?? 8;
  const rate = motion.rate ?? 0.05;
  const out: Puff[] = [];
  for (let n = 0; n < count; n += 1) {
    const a = hash(n * 31 + (motion.seed ?? 0)); const b = hash(n * 17 + 5 + (motion.seed ?? 0));
    const t = seconds * rate + a;
    const px = x + fract(a + 0.13 * Math.sin(t * Math.PI * 2 + b * 6)) * w;
    const py = y + fract(b + t * 0.4) * h;
    const alpha = (motion.alpha ?? 0.3) * Math.max(0, Math.sin((t * 1.7 + b) * Math.PI * 2));
    if (alpha > 0.02) out.push({ x: snap(px, block), y: snap(py, block), size: block, alpha });
  }
  return out;
}

/** How far a row of `shimmer` is shifted at `seconds`: whole blocks, a slow wave down the water. */
export function shimmerShift(motion: RoomMotion, row: number, seconds: number, block: number): number {
  const t = seconds * (motion.rate ?? 0.6);
  const band = Math.floor(row / block);
  const v = Math.sin((t + band * 0.37) * Math.PI * 2) * 0.6 + Math.sin((t * 0.57 + band * 0.11) * Math.PI * 2) * 0.4;
  return Math.round(v * (motion.amount ?? 1)) * block;
}

/**
 * How far a row of `sway` is shifted: a pendulum from its hook. The rect's top row is the hook and never moves; each
 * row below swings in proportion to its distance from it, in whole screen pixels, so the thing turns about the hook
 * instead of shaking in the middle (Tyler, 2026-11-10: "why isn't the lantern swinging from its hook?"). `amount` is
 * the swing at the bottom row, in screen pixels.
 */
export function swayShift(motion: RoomMotion, row: number, seconds: number): number {
  const [, y, , h] = motion.rect;
  const from = motion.hinge === 'bottom' ? (y + h - row) / h : (row - y) / h;
  const swing = Math.sin(seconds * (motion.rate ?? 0.3) * Math.PI * 2);
  return Math.round(swing * (motion.amount ?? 4) * Math.max(0, Math.min(1, from)));
}

/** How bright a star is now, 0-1: most of the time itself, now and then brighter or nearly gone. */
export function twinkleOf(star: number, seconds: number, rate: number): number {
  const t = seconds * rate * (0.6 + hash(star) * 0.8) + hash(star + 1);
  const s = Math.sin(t * Math.PI * 2);
  return s > 0.7 ? 1 : s < -0.85 ? 0 : 0.5;
}

/** How far a `scroll` has run, in whole rows, within its repeat: `rate` rows a second. */
export function scrollOffset(motion: RoomMotion, seconds: number, period: number): number {
  return Math.floor(seconds * (motion.rate ?? 8)) % period;
}

export const snap = (v: number, block: number) => Math.round(v / block) * block;

/** True when anything this room moves has changed between two instants at the room's tick. */
export function motionTicks(motions: readonly RoomMotion[] | undefined): boolean {
  return (motions?.length ?? 0) > 0;
}

/**
 * Draws a room's motion over its plate: after the plate and the object states, before the people. `plate` is the
 * picture the room is showing, in room pixels; `stars` is found on it once, by `findStars`.
 */
export class MotionLayer {
  private readonly stars = new Map<string, [number, number][]>();

  draw(ctx: CanvasRenderingContext2D, motions: readonly RoomMotion[], plate: CanvasImageSource | null,
    plateKey: string, seconds: number, block: number, shown: (motion: RoomMotion) => boolean): void {
    for (const motion of motions) {
      if (!shown(motion)) continue;
      const size = motion.block ?? block;
      if (motion.kind === 'smoke' || motion.kind === 'motes') {
        const puffs = motion.kind === 'smoke' ? smokeAt(motion, seconds, size) : motesAt(motion, seconds, size);
        const [r, g, b] = motion.colour ?? (motion.kind === 'smoke' ? [150, 150, 160] : [255, 220, 160]);
        for (const puff of puffs) {
          ctx.fillStyle = ['rgba(', r, ',', g, ',', b, ',', puff.alpha.toFixed(3), ')'].join('');
          ctx.fillRect(puff.x - puff.size / 2, puff.y - puff.size / 2, puff.size, puff.size);
          if (motion.kind !== 'smoke' || puff.size <= size) continue;
          // A puff is a little cloud, not a tile: its edges at half strength, one square out.
          ctx.fillStyle = ['rgba(', r, ',', g, ',', b, ',', (puff.alpha * 0.45).toFixed(3), ')'].join('');
          ctx.fillRect(puff.x - puff.size / 2 - size, puff.y - puff.size / 2 + size, size, puff.size - 2 * size);
          ctx.fillRect(puff.x + puff.size / 2, puff.y - puff.size / 2 + size, size, puff.size - 2 * size);
          ctx.fillRect(puff.x - puff.size / 2 + size, puff.y - puff.size / 2 - size, puff.size - 2 * size, size);
        }
        continue;
      }
      if (!plate) continue;
      const [x, y, w, h] = motion.rect;
      if (motion.kind === 'shimmer' || motion.kind === 'sway') {
        // Water moves in bands of the room's pixel; a hanging thing turns row by row about its hook.
        const step = motion.kind === 'shimmer' ? size : 1;
        // Rows that move by the same amount are one draw: a long bell rope is a handful of draws, not hundreds.
        let from = y; let shiftFrom = Number.NaN;
        const flush = (to: number) => {
          if (shiftFrom && to > from) ctx.drawImage(plate, x, from, w, to - from, x + shiftFrom, from, w, to - from);
        };
        for (let row = y; row < y + h; row += step) {
          const shift = motion.kind === 'shimmer' ? shimmerShift(motion, row, seconds, size) : swayShift(motion, row, seconds);
          if (shift === shiftFrom) continue;
          flush(row);
          from = row; shiftFrom = shift;
        }
        flush(y + h);
        continue;
      }
      if (motion.kind === 'scroll') {
        // A pattern that runs along itself: a barber's pole turning, a fall of water. `amount` is the pattern's repeat
        // in rows; the rect is drawn from itself shifted by `scrollOffset` rows, wrapping by that repeat.
        const period = Math.min(h, Math.max(1, motion.amount ?? h));
        const off = scrollOffset(motion, seconds, period);
        // The rect is filled with its first `period` rows, repeated and run along by `off`: one repeat of the pattern
        // drawn again and again, so the pattern never tears where it wraps.
        const sign = motion.hinge === 'top' ? -1 : 1;   // 'top' runs downward, as water falls; otherwise up the pole
        for (let d = 0; d < h;) {
          const src = (((d + sign * off) % period) + period) % period;
          const rows = Math.min(period - src, h - d);
          ctx.drawImage(plate, x, y + src, w, rows, x, y + d, w, rows);
          d += rows;
        }
        continue;
      }
      if (motion.kind === 'twinkle') {
        const key = `${plateKey}|${motion.id}`;
        let stars = this.stars.get(key);
        if (!stars) {
          stars = findStars(plate, motion.rect, motion.amount ?? 40);
          if (!stars.length) continue;
          this.stars.set(key, stars);
        }
        const rate = motion.rate ?? 0.2;
        ctx.save();
        for (const [index, [sx, sy]] of stars.entries()) {
          const level = twinkleOf(index, seconds, rate);
          if (level === 0.5) continue;
          if (level === 1) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.6;
            ctx.drawImage(plate, sx - size, sy - size, size * 2, size * 2, sx - size, sy - size, size * 2, size * 2);
          } else {
            // Gone for a moment: the sky beside it laid over it.
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.85;
            ctx.drawImage(plate, sx - size * 3, sy - size, size * 2, size * 2, sx - size, sy - size, size * 2, size * 2);
          }
        }
        ctx.restore();
      }
    }
  }
}

/** The brightest small points in a rect of the plate: its stars. Read once per plate and kept. */
export function findStars(plate: CanvasImageSource, rect: [number, number, number, number], most: number): [number, number][] {
  if (typeof document === 'undefined') return [];
  const [x, y, w, h] = rect;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(plate, x, y, w, h, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const lum = (i: number) => (data[i]! * 0.3 + data[i + 1]! * 0.59 + data[i + 2]! * 0.11);
  const found: [number, number, number][] = [];
  for (let row = 2; row < h - 2; row += 2) {
    for (let col = 2; col < w - 2; col += 2) {
      const at = (row * w + col) * 4;
      const here = lum(at);
      if (here < 120) continue;
      // A star: bright, with dark sky round it.
      const round = (lum(at - 8) + lum(at + 8) + lum(at - w * 8) + lum(at + w * 8)) / 4;
      if (here - round > 50) found.push([x + col, y + row, here]);
    }
  }
  found.sort((a, b) => b[2] - a[2]);
  const kept: [number, number][] = [];
  for (const [sx, sy] of found) {
    if (kept.some(([kx, ky]) => Math.abs(kx - sx) < 12 && Math.abs(ky - sy) < 12)) continue;
    kept.push([sx, sy]);
    if (kept.length >= most) break;
  }
  return kept;
}
