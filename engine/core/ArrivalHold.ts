/**
 * EVERY ARRIVAL WAITS FOR ITS ROOM (errata 223; Tyler, 2026-11-09, asked
 * whether every arrival should hold black until the room is ready: "Yes, and
 * is it possible to have it say "Loading..." On the screen if it's waiting for
 * it to load a room?").
 *
 * NEW GAME, the fades and the cut-aways already held black until the room was
 * whole (errata 157, 158). An exit, the map, a `goto` and a load did not: they
 * cut straight to the room, and a room whose pictures were still on their way
 * was seen in pieces (errata 221, "Left for Tyler"). This is the same hold for
 * them, and the one rule for the words over any black that is waiting on a
 * room.
 *
 * Two halves, and both are clocks the scene asks once a frame:
 *
 * - THE HOLD. An arrival on a room that is already whole -- the usual case,
 *   since the rooms next door are fetched before he gets there -- is not held
 *   at all: no added frame, nothing drawn differently. An arrival on a room
 *   that is not whole holds black until it is, or until the limit (errata
 *   157's `roomReadyLimitSeconds`), so a load that stalls never strands him.
 *   While it holds the room does not run (GameScene freezes it), so nothing
 *   is said, walked or timed in the dark, and it begins as it is seen.
 * - THE WORDS. Over any black that is waiting on a room -- this hold,
 *   NEW GAME's, a fade's, a cut-away's -- once the wait has lasted the
 *   threshold. Never before it, so an ordinary arrival never flashes them, and
 *   gone on the frame the room is whole.
 *
 * Nothing here knows a room, a picture or a word: the scene says whether the
 * room is whole, and the words and the threshold are content (`ui.json`).
 */
export class ArrivalHold {
  private heldAt: number | null = null;
  private waitingSince: number | null = null;

  /** Whether an arrival is being held in black now. */
  get holding(): boolean {
    return this.heldAt !== null;
  }

  /**
   * A ROOM ARRIVED IN. Held only when the room is not whole and no other
   * transition is already holding the black for it (NEW GAME, a fade): those
   * wait for the room themselves. Returns whether this arrival is held.
   */
  arrive(now: number, whole: boolean, alreadyHeld = false): boolean {
    this.heldAt = whole || alreadyHeld ? null : now;
    return this.heldAt !== null;
  }

  /**
   * One frame of a hold. `null` when nothing is held; otherwise whether it
   * lets go on this frame -- the room is whole, or the limit has passed -- and
   * how long it held, so the scene can begin the room's clocks from the frame
   * the room is seen rather than the frame it was entered.
   */
  tick(now: number, whole: boolean, limitSeconds: number): { released: boolean; heldFor: number } | null {
    if (this.heldAt === null) return null;
    const heldFor = Math.max(0, now - this.heldAt);
    if (!whole && heldFor < limitSeconds) return { released: false, heldFor };
    this.heldAt = null;
    return { released: true, heldFor };
  }

  /**
   * WHETHER "LOADING…" IS UP this frame. The screen is wholly black, the room
   * it is waiting on is not whole, and it has been waiting `afterSeconds`.
   * The wait is timed from the first such frame and forgotten the moment
   * either stops being true, so the words go as the room comes.
   */
  label(now: number, black: number, whole: boolean, afterSeconds: number): boolean {
    if (black < 1 || whole) {
      this.waitingSince = null;
      return false;
    }
    if (this.waitingSince === null) this.waitingSince = now;
    return now - this.waitingSince >= afterSeconds;
  }

  /** Let go without waiting (the title, a new game): nothing is held and nothing has been waited for. */
  cancel(): void {
    this.heldAt = null;
    this.waitingSince = null;
  }
}
