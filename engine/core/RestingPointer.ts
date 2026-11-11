/**
 * WHERE A POINTER RESTS, if it rests anywhere (Tyler, 2026-11-10, playing on
 * a tablet: an option "was an extra bright color before I clicked on it").
 *
 * A mouse rests where it was left, so the option under it lights, as in
 * Monkey Island. A finger does not: once lifted, it is nowhere. Kept as a
 * resting place, the last tap lit whatever option the next list put in that
 * row -- one option drawn brighter than the others before it was chosen,
 * which reads as the game pointing at it (invariant 7's rule that no option
 * looks different from its neighbours by what it does).
 */
export interface PointerLike {
  /** Phaser's `Pointer.wasTouch`: the last event came from a touch. */
  wasTouch: boolean;
}

export function restingPoint<P>(pointer: PointerLike, at: P): P | null {
  return pointer.wasTouch ? null : at;
}
