/**
 * HE STANDS BESIDE WHAT HE LOOKS AT, NOT IN FRONT OF IT (errata 330).
 *
 * Tyler, 2026-11-15: "Thad shouldn't go stand directly in front of the spittoon when he looks at it. He should stay
 * off to the side. The game player needs to be able to see the thing that Thad is looking at and describing. This
 * goes for all other objects/things he looks at as well. Unless there's a very specific reason he needs to be
 * standing directly in front of it."
 *
 * Pure geometry, shared by the scene and its test. His drawn body is a box: his height tall, standing on his feet,
 * BODY_WIDTH of his height wide. If that box hides more than HIDES of a thing he examines, he is moved to one side
 * of it or the other, where his box clears it. A thing much wider than he is (the bar, the street) is not one he can
 * hide, and is left alone.
 */

/** His drawn body's width, as a share of his height: Thad's standing frame is about a third as wide as he is tall. */
export const BODY_WIDTH = 0.34;
/** More of a thing than this hidden behind him, and he moves aside. */
export const HIDES = 0.2;
/** A thing wider than this many of his bodies cannot be hidden by him; he stands where he would have. */
export const TOO_WIDE = 2.5;
/** More of a person in the room than this hidden behind him, and the stand is passed over (errata 337). */
export const COVERS_A_PERSON = 0.25;

export type Rect = readonly [number, number, number, number];
export interface Spot { x: number; y: number }

/** How much of the rect (0..1) his body hides, standing at `at` with his feet there and `height` tall. */
export function hidden(at: Spot, height: number, rect: Rect): number {
  const [rx, ry, rw, rh] = rect;
  if (rw <= 0 || rh <= 0) return 0;
  const half = (height * BODY_WIDTH) / 2;
  const w = Math.max(0, Math.min(at.x + half, rx + rw) - Math.max(at.x - half, rx));
  const h = Math.max(0, Math.min(at.y, ry + rh) - Math.max(at.y - height, ry));
  return (w * h) / (rw * rh);
}

/** Whether his standing at `at` hides this thing enough to move him, and whether moving can help. */
export function inTheWay(at: Spot, height: number, rect: Rect): boolean {
  if (rect[2] > TOO_WIDE * height * BODY_WIDTH) return false;
  return hidden(at, height, rect) > HIDES;
}

/**
 * The two places beside the rect, at the stand's own depth: just clear of its left edge and just clear of its right,
 * the nearer to `from` first. The caller snaps each to the floor and keeps the first that no longer hides it.
 */
export function besides(at: Spot, height: number, rect: Rect, from: Spot): Spot[] {
  const [rx, , rw] = rect;
  const half = (height * BODY_WIDTH) / 2;
  const pad = height * 0.04;
  const left = { x: Math.round(rx - half - pad), y: at.y };
  const right = { x: Math.round(rx + rw + half + pad), y: at.y };
  return Math.abs(left.x - from.x) <= Math.abs(right.x - from.x) ? [left, right] : [right, left];
}
