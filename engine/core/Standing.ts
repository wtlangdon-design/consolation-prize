/**
 * NOBODY IS WALKED ONTO ANYBODY (the bookends audit, finding 4).
 *
 * At control in Room 1, Hob stands in front of the only way out. A click on
 * the gap behind him walked Thad to the floor point under it -- which is where
 * Hob is standing -- and left the two figures overlapping, silently: CLAUDE.md's
 * "nobody stands on anybody", broken by the first free click of the game.
 *
 * A walk's destination that falls inside a standing figure's footprint is
 * moved to the side of it Thad is coming from, a body's width clear. The
 * footprint is in feet space: a share of the figure's drawn height either
 * side of his feet, and a shallow band in depth, because two men at very
 * different depths do not stand on each other however their pictures overlap.
 */

export interface StandingFigure {
  x: number;
  y: number;
  /** The figure's drawn height at his feet, in room pixels. */
  height: number;
}

/** Half a figure's footprint, as a share of his drawn height: a little over a shoulder's width. */
export const FOOTPRINT_HALF_WIDTH = 0.22;
/** How near in depth two sets of feet must be to share the ground, as a share of height. */
export const FOOTPRINT_DEPTH = 0.12;
/** Where he is put instead: this far from the figure's feet, as a share of height. */
export const STAND_CLEAR = 0.45;

/**
 * Where to walk instead of `to`, or `to` itself when it is clear. `from` is
 * where the walker is now, which picks the side; `walkerHeight` is his own
 * drawn height, so his footprint counts as well as theirs.
 */
export function clearOfFigures(
  to: { x: number; y: number },
  from: { x: number; y: number },
  figures: readonly StandingFigure[],
  walkerHeight: number,
): { x: number; y: number } {
  let at = { ...to };
  for (const figure of figures) {
    const reach = (figure.height + walkerHeight) * FOOTPRINT_HALF_WIDTH;
    const depth = Math.max(figure.height, walkerHeight) * FOOTPRINT_DEPTH;
    if (Math.abs(at.x - figure.x) >= reach || Math.abs(at.y - figure.y) >= depth) continue;
    const side = from.x <= figure.x ? -1 : 1;
    at = { x: Math.round(figure.x + side * Math.max(reach, figure.height * STAND_CLEAR)), y: at.y };
  }
  return at;
}

/**
 * A CLICK WHILE THE PLAYER IS HIDDEN (RoomFile.actorHiddenWhen; errata 239). He is under a table's cloth and there is
 * no art of him there, so he is not drawn; and a man nobody can see must not be walked about the room, or he would
 * reappear somewhere he never went. So while it holds:
 *
 *   - a click on the floor, or a walk to anything, does nothing (`stay`);
 *   - a door is not gone through (`stay`): he comes out from under the cloth first;
 *   - a person is not walked up to and talked to (`stay`);
 *   - a verb on a subject is answered from where he is, with no walk to it (`answer`). That is what keeps the state
 *     leavable: the subject that put him there answers, and its conversation lets him out.
 *
 * Phaser-free and named, so the rule has a test (tests/seance-polish.test.ts), as `playfieldClick` has.
 */
export function hiddenClick(click: { target: boolean; walk: boolean; transit: boolean; person: boolean }): 'stay' | 'answer' {
  if (click.person || !click.target || click.walk || click.transit) return 'stay';
  return 'answer';
}
