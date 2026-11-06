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
  /** The path leg he is on (1-based: the leg from point index-1 to index) and how far along it, 0-1. */
  leg?: number;
  along?: number;
}

/**
 * `heightAt` is the drawn height of a man at a floor point (the room's curve
 * times his stature). With it and the walk's `strideRatio`, the cycle is the
 * distance walked over the local stride, summed along the path, so his feet
 * hold the ground as he nears or leaves the camera; without, it is the clock.
 */
export function departureAt(walk: AmbientExit, elapsed: number,
                            heightAt?: (x: number, y: number) => number): DeparturePose {
  const path = walk.path;
  const frames = Math.max(1, walk.frames.length);
  const strided = walk.strideRatio !== undefined && walk.strideRatio > 0 && heightAt !== undefined;
  const frame = strided
    ? Math.floor(cyclesWalked(walk, Math.max(0, elapsed) * walk.speed, heightAt!) * frames) % frames
    : Math.floor(Math.max(0, elapsed) * walk.fps) % frames;
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
        leg: index,
        along: t,
      };
    }
    travelled -= length;
  }
  const [x, y] = path[path.length - 1] ?? [0, 0];
  return { x, y, heading: 1, frame, done: true };
}

/** Walk cycles completed over the first `distance` pixels of the path, at the stride where each step was taken. */
function cyclesWalked(walk: AmbientExit, distance: number, heightAt: (x: number, y: number) => number): number {
  const STEP = 8;
  let cycles = 0;
  let left = distance;
  for (let index = 1; index < walk.path.length && left > 0; index += 1) {
    const [ax, ay] = walk.path[index - 1]!;
    const [bx, by] = walk.path[index]!;
    const length = Math.hypot(bx - ax, by - ay);
    const span = index === walk.path.length - 1 ? Math.min(left, length) : Math.min(left, length);
    for (let done = 0; done < span; done += STEP) {
      const run = Math.min(STEP, span - done);
      const t = length === 0 ? 0 : (done + run / 2) / length;
      const height = heightAt(ax + (bx - ax) * t, ay + (by - ay) * t);
      if (height > 0) cycles += run / (walk.strideRatio! * height);
    }
    left -= span;
  }
  return cycles;
}
