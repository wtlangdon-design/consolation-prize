import type { AmbientExit } from './types.ts';

/**
 * WHERE A DEPARTING FIGURE IS, AS A PURE FUNCTION OF ITS WALK AND THE TIME.
 *
 * Tyler, 2026-11-01, on Vessel vanishing when the swindle settled: "it would
 * bother me immensely to have a character just disappear." A character whose
 * condition stops holding while Thad is in the room walks his declared exit
 * path instead (AmbientFile.exit), and is gone when he reaches its end.
 *
 * Derived from the clock and nothing stored, for the same reason the ambient
 * frame is: the same moment always gives the same picture.
 */
export interface DeparturePose {
  x: number;
  y: number;
  /** -1 walking left, 1 walking right. */
  heading: -1 | 1;
  /** Index into the exit's walk frames. */
  frame: number;
  done: boolean;
}

export function departureAt(walk: AmbientExit, elapsed: number): DeparturePose {
  const path = walk.path;
  const frames = Math.max(1, walk.frames.length);
  const frame = Math.floor(Math.max(0, elapsed) * walk.fps) % frames;
  let travelled = Math.max(0, elapsed) * walk.speed;
  for (let index = 1; index < path.length; index += 1) {
    const [ax, ay] = path[index - 1]!;
    const [bx, by] = path[index]!;
    const length = Math.hypot(bx - ax, by - ay);
    const heading: -1 | 1 = bx < ax ? -1 : 1;
    if (travelled <= length || index === path.length - 1) {
      const t = length === 0 ? 1 : Math.min(1, travelled / length);
      return {
        x: Math.round(ax + (bx - ax) * t),
        y: Math.round(ay + (by - ay) * t),
        heading,
        frame,
        done: travelled >= length && index === path.length - 1,
      };
    }
    travelled -= length;
  }
  const [x, y] = path[path.length - 1] ?? [0, 0];
  return { x, y, heading: 1, frame, done: true };
}
