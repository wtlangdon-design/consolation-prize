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

/** A man's drawn height at a floor point, given the walk's own height there when it declares one. */
export type HeightAt = (x: number, y: number, declared?: number) => number;

const STEP = 8;

/** Each short run of the path, in order, with the drawn height of a man where it is walked. */
function* runs(walk: AmbientExit, heightAt?: HeightAt): Generator<{ length: number; height: number }> {
  for (let index = 1; index < walk.path.length; index += 1) {
    const [ax, ay] = walk.path[index - 1]!;
    const [bx, by] = walk.path[index]!;
    const length = Math.hypot(bx - ax, by - ay);
    for (let done = 0; done < length; done += STEP) {
      const run = Math.min(STEP, length - done);
      const t = length === 0 ? 0 : (done + run / 2) / length;
      const listed = walk.heights?.[index - 1] !== undefined && walk.heights?.[index] !== undefined
        ? walk.heights[index - 1]! + (walk.heights[index]! - walk.heights[index - 1]!) * t : undefined;
      const height = heightAt ? heightAt(ax + (bx - ax) * t, ay + (by - ay) * t, listed) : (listed ?? 0);
      yield { length: run, height };
    }
  }
}

/** How long the whole walk takes: its length over `speed`, or, with a `pace`, each run over that pace of the height there. */
export function walkDuration(walk: AmbientExit, heightAt?: HeightAt): number {
  if (!(walk.pace && walk.pace > 0)) {
    let length = 0;
    for (let index = 1; index < walk.path.length; index += 1) {
      const [ax, ay] = walk.path[index - 1]!;
      const [bx, by] = walk.path[index]!;
      length += Math.hypot(bx - ax, by - ay);
    }
    return walk.speed > 0 ? length / walk.speed : 0;
  }
  let seconds = 0;
  for (const { length, height } of runs(walk, heightAt)) seconds += length / (walk.pace * Math.max(height, 1));
  return seconds;
}

/**
 * `heightAt` is the drawn height of a man at a floor point (the room's curve
 * times his stature, or the walk's own `heights` there). With it and the walk's
 * `strideRatio`, the cycle is the distance walked over the local stride, so his
 * feet hold the ground as he nears or leaves the camera; with a `pace`, how far
 * he has walked is the time spent at that share of his height a second.
 * Without them, the clock and `speed`.
 */
export function departureAt(walk: AmbientExit, elapsed: number, heightAt?: HeightAt): DeparturePose {
  const path = walk.path;
  const frames = Math.max(1, walk.frames.length);
  const time = Math.max(0, elapsed);
  let travelled = time * walk.speed;
  let cycles = 0;
  const paced = walk.pace !== undefined && walk.pace > 0;
  const strided = walk.strideRatio !== undefined && walk.strideRatio > 0 && heightAt !== undefined;
  if (paced || strided) {
    // Walk the path run by run: how far the time carries him (at his pace, or at `speed`), and how
    // many strides that is at the height where each run is walked.
    let left = paced ? time : time * walk.speed;
    travelled = 0;
    for (const { length, height } of runs(walk, heightAt)) {
      if (left <= 0) break;
      const cost = paced ? length / (walk.pace! * Math.max(height, 1)) : length;
      const part = Math.min(1, left / cost);
      travelled += length * part;
      if (strided && height > 0) cycles += (length * part) / (walk.strideRatio! * height);
      left -= cost * part;
    }
    if (left > 0) travelled += paced ? 1e9 : left;   // past the end: done
  }
  const frame = strided
    ? Math.floor(cycles * frames) % frames
    : Math.floor(time * walk.fps) % frames;
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

