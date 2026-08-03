/**
 * THE NEGATIVE ASSERTIONS, RECORDED INSIDE THE DRAW LOOP. Doc 44 part two.
 *
 * "Never, at any frame" cannot be established by polling from outside. The
 * black-figure defect lived in the first second and a half of a new game, and
 * the harness that failed to see it was an automated play-through that waited
 * for the game to be ready -- which is exactly the apparatus that cannot
 * observe a first-frame fault. A sample at 20Hz misses fifty frames a second
 * and reports nothing, confidently.
 *
 * So the renderer says what it did as it does it, and the harness drains the
 * list afterwards. What that reports is every frame, not every sampled frame.
 *
 * OFF UNLESS SWITCHED ON, and R5h is why: an instrument can change the system,
 * not only report on it. This costs a few comparisons per mover per frame,
 * which is small and is not nothing. The gauntlet runs the opening twice --
 * once with this on, once with it off -- and a beat whose duration disagrees
 * between the two runs fails the run. A timing that only holds while being
 * measured is not a timing.
 *
 * It holds no content. A mover id is an identifier, a clip id is an
 * identifier, and a violation kind is engineering vocabulary.
 */

/**
 * The six kinds, and they are six rather than one on purpose.
 *
 * `graybox:no-record`, `graybox:no-clip` and `graybox:not-loaded` are three
 * different faults that look identical on screen -- a placeholder figure --
 * and each has cost a session. The coach drawing as a black rectangle was the
 * first: no record at all. The chores throwing CLIP_FALLBACK were the second:
 * a record that does not cover the clip being asked for. The chores drawing a
 * placeholder through the whole of beat 2 were the third: the record covered
 * it, the frames were real, and the texture had not arrived because the boot
 * split had put them in the deferred half. One message reading "graybox"
 * would have merged all three.
 */
export type ViolationKind =
  | 'graybox:no-record'
  | 'graybox:no-clip'
  | 'graybox:not-loaded'
  | 'depth-tie'
  | 'off-band'
  | 'walk-while-still';

export interface Violation {
  kind: ViolationKind;
  /** The mover, or the two movers in a tie, joined by a space. */
  who: string;
  /** The beat playing when it happened, as the runner reports it. */
  beat: string | null;
  frame: number;
  clock: number;
  /** Everything else worth knowing, already formatted. */
  detail: string;
}

/**
 * A ceiling, because a fault that holds for a whole scene produces one per
 * mover per frame and sixty seconds of that is a hundred thousand records
 * nobody will read. The first of each kind is the diagnosis; the count is the
 * severity. Both are kept, the rest are dropped, and `dropped` says how many
 * so the report never implies it saw everything it stored.
 */
const KEEP_PER_KIND = 12;

class Watch {
  private on = false;
  private records: Violation[] = [];
  private counts = new Map<ViolationKind, number>();
  private dropped = 0;

  private frameIndex = 0;
  private clock = 0;
  private beatTag: string | null = null;

  /**
   * THE BAND COMES FROM THE SCRIPT, NOT FROM THE ROOM. Handed in by the
   * harness, which read it out of `tools/gauntlet/*.json`, which a person
   * wrote from doc 43.
   *
   * Deriving it from the room's own walk boxes would be cheaper and would
   * assert nothing: the boxes are what the engine already walks on, so a
   * figure outside them and a band derived from them can never disagree.
   * R5i -- a mechanism agreeing with itself is the failure. The band is a
   * human's independent claim about where the ground is, and it is only worth
   * checking because it is independent.
   */
  private ground: [number, number] | null = null;
  private exempt = new Set<string>();

  get enabled(): boolean {
    return this.on;
  }

  get band(): [number, number] | null {
    return this.ground;
  }

  bandExempt(id: string): boolean {
    return this.exempt.has(id);
  }

  enable(on: boolean): void {
    this.on = on;
    if (!on) this.reset();
  }

  /** The script's claims about the room, handed over before a run starts. */
  arm(config: { band?: [number, number]; bandExempt?: string[] }): void {
    this.ground = config.band ?? null;
    this.exempt = new Set(config.bandExempt ?? []);
    this.on = true;
    this.reset();
  }

  reset(): void {
    this.records = [];
    this.counts = new Map();
    this.dropped = 0;
  }

  /**
   * Called once at the top of each frame, before anything is drawn.
   *
   * The beat comes from the caller rather than being read here, because the
   * watch must not know about sequences, rooms or scenes -- it is a notebook,
   * and a notebook that reached into the engine to work out what to write
   * would be the second mechanism agreeing with the first.
   */
  frame(index: number, clock: number, beat: string | null): void {
    this.frameIndex = index;
    this.clock = clock;
    this.beatTag = beat;
  }

  record(kind: ViolationKind, who: string, detail: string): void {
    if (!this.on) return;
    const seen = (this.counts.get(kind) ?? 0) + 1;
    this.counts.set(kind, seen);
    if (seen > KEEP_PER_KIND) {
      this.dropped += 1;
      return;
    }
    this.records.push({
      kind, who, detail, beat: this.beatTag, frame: this.frameIndex, clock: this.clock,
    });
  }

  /** Everything recorded, plus what was counted and not kept. */
  report(): { violations: Violation[]; counts: Record<string, number>; dropped: number } {
    return {
      violations: [...this.records],
      counts: Object.fromEntries(this.counts),
      dropped: this.dropped,
    };
  }
}

export const watch = new Watch();

/**
 * Doc 44 part two #4: two movers sharing a feet Y with overlapping x.
 *
 * THE THRESHOLD IS ONE PIXEL AND NOT TWENTY. Near-equal feet Y is not a
 * defect -- whoever is lower is nearer and the sort answers correctly.
 * EXACTLY equal is the coin flip: a stable sort keeps insertion order, the
 * protagonist is constructed in `create()` and everyone else is placed by a
 * beat, so he draws first and anything staged later draws over him. That is a
 * fact about construction order and not about the picture, which is what makes
 * it the one ordering genuinely left undefined.
 *
 * Pure, and separate from the class, so it can be tested without a canvas.
 */
export function depthTies(
  figures: { id: string; feetX: number; feetY: number; halfWidth: number }[],
): [string, string][] {
  const out: [string, string][] = [];
  for (let a = 0; a < figures.length; a += 1) {
    for (let b = a + 1; b < figures.length; b += 1) {
      const one = figures[a] as { id: string; feetX: number; feetY: number; halfWidth: number };
      const two = figures[b] as { id: string; feetX: number; feetY: number; halfWidth: number };
      if (Math.abs(one.feetY - two.feetY) >= 1) continue;
      const gap = Math.abs(one.feetX - two.feetX);
      if (gap >= one.halfWidth + two.halfWidth) continue;
      out.push([one.id, two.id]);
    }
  }
  return out;
}
