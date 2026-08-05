import { NATIVE_WIDTH } from '../render/Screen.ts';

/**
 * How far the view has scrolled, for a room wider than the window.
 *
 * ROOM 1 MUST NOT MOVE BY A PIXEL. It declares no `size`, so its width is the
 * play area's, `roomWidth - NATIVE_WIDTH` is zero, and the clamp pins the
 * camera at zero for every actor position there is. That is not a special
 * case in the code and it is deliberately not one: a room that fits has
 * exactly one legal camera position, and the same arithmetic finds it.
 *
 * THE DEAD ZONE IS THE PART THAT IS NOT OBVIOUS. Following the actor pixel for
 * pixel means the whole street slides under a walk cycle -- every frame of the
 * gait translates the background by a few pixels, and a plate with as much
 * detail as Main Street shimmers. So the camera holds still while he is inside
 * the middle third and only takes up the slack when he leaves it.
 *
 * IT LIVES IN THE MODEL because "where the view is" is a fact about the game
 * that the input router, the renderer and the tests all have to agree on. A
 * camera computed inside the renderer would be a number only the renderer
 * could see, and the hit test would have to derive its own -- which is R5i,
 * two mechanisms agreeing until one of them changes.
 */

/**
 * The fraction of the screen the actor may move within before the view does.
 *
 * A THIRD, CENTRED: he is free between 1/3 and 2/3 of the width. Narrower and
 * the camera starts and stops constantly; wider and he reaches the edge of the
 * frame before it moves at all.
 */
const DEAD_ZONE = 1 / 3;

/** The whole width of a room, from its own declaration or the window's. */
export function roomWidth(size?: [number, number]): number {
  return size?.[0] ?? NATIVE_WIDTH;
}

/**
 * Where the view must be to hold `actorX` inside the dead zone, given where it
 * is now. Clamped to the room.
 *
 * `from` is the current camera. Pass 0 for a room being entered: the clamp is
 * applied BEFORE the first frame draws, which is what stops a room popping --
 * arriving at x=3200 with the camera still at 0 and correcting on frame two is
 * a visible jolt on every entry.
 */
export function cameraFollow(actorX: number, width: number, from = 0): number {
  const span = Math.max(0, width - NATIVE_WIDTH);
  if (span === 0) return 0;
  const held = Math.max(0, Math.min(span, from));
  const left = held + NATIVE_WIDTH * ((1 - DEAD_ZONE) / 2);
  const right = held + NATIVE_WIDTH * ((1 + DEAD_ZONE) / 2);
  // INSIDE THE ZONE, NOTHING MOVES. Outside it, the camera takes up exactly
  // the slack -- it does not centre him, because centring after a dead zone
  // makes the view lurch the moment he crosses the line.
  const wanted = actorX < left ? held - (left - actorX)
    : actorX > right ? held + (actorX - right)
      : held;
  return Math.round(Math.max(0, Math.min(span, wanted)));
}

/**
 * Where the view sits when a room is ENTERED, with no previous position.
 *
 * Centres him and then clamps, which is the only sensible answer with no
 * history: the dead zone needs somewhere to be measured from.
 */
export function cameraAt(actorX: number, width: number): number {
  const span = Math.max(0, width - NATIVE_WIDTH);
  if (span === 0) return 0;
  return Math.round(Math.max(0, Math.min(span, actorX - NATIVE_WIDTH / 2)));
}
