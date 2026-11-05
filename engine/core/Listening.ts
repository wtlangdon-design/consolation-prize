/**
 * ROOM 33, THE LISTENING (F2): what a LISTEN on the rock returns, and where the
 * score is in its ninety seconds. Pure, so it can be tested without a scene.
 *
 * Doc 28 Part Five: "Solid rock returns a dull, high, damped knock. The void
 * returns a lower note with a long tail ... Taps nearer the void ring longer."
 * Doc 45: R33-TAP is the knock, R33-RIPPLE its drawing, "duration equals audible
 * tail exactly", R33-VOID the void's answer, R33-TUNE the score from -35 cents
 * to 0 across "exactly 90 active, unpaused seconds" from the confirmed void
 * (errata 52, 71 E). Errata 70 C3: "The void is never gated and the tuning never
 * snaps. The correct spot answers from the first tap."
 *
 * THE GRADIENT IS THE ROOM'S DATA, NOT THIS FILE'S: the void's position, its
 * radius and the distance over which the tail falls away are tuning (doc 57 F2,
 * "judged by Tyler's ear"), and the taps are rendered files with measured tails
 * (tools/audio/render-r33-sfx.py). Nothing here is visible: the void is never
 * drawn and never named on hover (doc 54: "No line here says where the void is").
 */
import type { ListeningRoom } from './types.ts';

export interface TapAnswer {
  /** The rendered one-shot to play. */
  src: string;
  /** Its audible tail in seconds: the ripple lasts exactly this long. */
  tail: number;
  /** True when the tap landed on the void. */
  void: boolean;
}

/** Where a tap at (x, y) falls: the void, or a step along the rock's gradient. */
export function tapAt(listening: ListeningRoom, x: number, y: number): TapAnswer {
  const [vx, vy] = listening.void.at;
  const distance = Math.hypot(x - vx, y - vy);
  if (distance <= listening.void.radius) {
    return { src: listening.voidSound.src, tail: listening.voidSound.tail, void: true };
  }
  const taps = listening.taps;
  // 0 at the void's edge, 1 at `reach` and beyond: the far rock's dull knock.
  const span = Math.max(1, listening.void.reach - listening.void.radius);
  const away = Math.min(1, (distance - listening.void.radius) / span);
  const step = Math.round((1 - away) * (taps.length - 1));
  const tap = taps[Math.max(0, Math.min(taps.length - 1, step))]!;
  return { src: tap.src, tail: tap.tail, void: false };
}

/**
 * How far into tune the score is, 0 (-35 cents) to 1 (0 cents), `elapsedMs`
 * of active time after the confirmed void. Linear: doc 45 asks for an
 * automation from one value to the other "without a jump", and nothing more.
 */
export function tuneAt(listening: ListeningRoom, elapsedMs: number): number {
  return Math.max(0, Math.min(1, elapsedMs / (listening.tune.seconds * 1000)));
}

/** The score's playback rate for a tune fraction: -35 cents is baked into the beds. */
export function rateForTune(fraction: number, detuneCents = 35): number {
  return 2 ** ((detuneCents * Math.max(0, Math.min(1, fraction))) / 1200);
}
