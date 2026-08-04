import type { DialogueExchange } from './DialogueRunner.ts';

/**
 * A selection, PERFORMED over time instead of resolved in three lines.
 *
 * THE MACHINE WAS ALREADY THERE AND ITS CALLER RAN IT TO COMPLETION.
 * `DialogueRunner.select()` is `beginSelection` then `advance('echo')` then
 * `advance('reply')` then `settle()`, back to back, and `GameScene` called
 * that. So every phase boundary `DialogueExchange` exists to create was
 * crossed inside one statement -- including the one named `echo`, whose own
 * comment cites errata 45's first correction: *the selection is spoken over
 * his head before the reply.* Doc 30 specified it, errata 45 corrected it,
 * the exchange implements it, and nothing ever waited. R5o.
 *
 * SO THIS IS A DRIVER, NOT A SECOND MACHINE. It holds a queue of utterances
 * and a clock, calls `advance` at the boundaries the exchange already names,
 * and calls `settle` ON EXIT FROM THE LAST REPLY rather than on entry to a
 * settling phase. That distinction is errata 45 itself: an exchange settles
 * AFTER its last line, so the coach cannot begin departing underneath the
 * driver's "Wasn't for you."
 *
 * IT LIVES IN THE MODEL, and that is R5m applied before it could bite. The
 * rule is "what a conversation does over time", which is a fact about the
 * game; the scene routes clicks and draws. A driver written in `GameScene`
 * would work and no test could see it -- which is exactly how errata 28b-i
 * shipped behind a wall the suite does not cross.
 */
export type DialoguePhase = 'choosing' | 'thadLine' | 'replies' | 'settled';

export interface Utterance {
  /** Who says it. Null only where content attributes nobody. */
  speaker: string | null;
  line: string;
}

/**
 * Doc 30 section 4.1's binding formula, and section 13's constants.
 *
 * `readingHold = clamp(1.8s, 8.0s, 0.45s + visibleGlyphs x 0.055s)`
 *
 * THE NUMBERS COME FROM CONTENT, not from here. Doc 30 section 4.1 also says
 * "One timing service must own all three" -- scripted lines, dialogue and
 * barks -- and `content/ui/ui.json` already carries the two the sequence
 * runner uses, with a note explaining that they are there so a person can
 * change them after watching the opening and so the unbuilt "Text speed"
 * option has something to scale. These join them rather than starting a
 * second set in a `.ts` file.
 */
export interface HoldTiming {
  base: number;
  perGlyph: number;
  minimum: number;
  maximum: number;
  /** Doc 30 section 4.1: applied AFTER the calculation, then clamped again. */
  speed?: number;
}

/**
 * How long a line stays up before it advances on its own.
 *
 * WHAT COUNTS AS A VISIBLE GLYPH. Doc 30 says "count rendered glyphs, not
 * markup or speaker IDs". Nothing here carries markup, so the only judgement
 * left is the spaces: they are rendered -- they take advance width -- and the
 * eye crosses them, so they count. Only the ends are trimmed. Stated because
 * the alternative reading is defensible and changes every hold by about a
 * seventh.
 */
export function readingHold(line: string, timing: HoldTiming): number {
  const glyphs = line.trim().length;
  const clamp = (value: number) => Math.max(timing.minimum, Math.min(timing.maximum, value));
  const held = clamp(timing.base + glyphs * timing.perGlyph);
  return timing.speed === undefined ? held : clamp(held * timing.speed);
}

/**
 * Doc 30 section 4.2: "After a 150ms input guard, one primary click anywhere
 * in the playfield, Space, or Enter advances exactly one utterance."
 *
 * It exists because the click that CHOSE the option is still in the player's
 * hand when the echo appears. Without it, the same press picks the line and
 * dismisses it.
 */
const INPUT_GUARD = 0.15;

export class DialoguePerformance {
  private readonly queue: Utterance[];
  private readonly timing: HoldTiming;
  private readonly exchange: DialogueExchange;
  private at = 0;
  private shownAt: number;
  private state: DialoguePhase = 'thadLine';

  /**
   * @param echo    Thad speaking the wording he was made to choose. Doc 30
   *                section 6.2: "On selection, hide the list and enqueue a
   *                Thad utterance using option.echo when present, otherwise
   *                option.text."
   * @param replies The response, in order. The first owns the channel first.
   */
  constructor(exchange: DialogueExchange, echo: Utterance | null,
              replies: Utterance[], timing: HoldTiming, now: number) {
    this.exchange = exchange;
    this.timing = timing;
    this.queue = echo ? [echo, ...replies] : [...replies];
    this.shownAt = now;
    // AN EXCHANGE WITH NOTHING TO SAY STILL HAS TO SETTLE. A silent option is
    // rare and legal -- doc 30 allows `echo: false` for a nonverbal beat --
    // and one that never committed would strand the whole tree.
    if (this.queue.length === 0) {
      this.state = 'replies';
      this.finish();
      return;
    }
    this.exchange.advance('echo');
  }

  get phase(): DialoguePhase { return this.state; }
  get done(): boolean { return this.state === 'settled'; }

  /** The utterance owning the speech channel, or null once it is over. */
  get current(): Utterance | null {
    return this.state === 'settled' ? null : this.queue[this.at] ?? null;
  }

  /** When the current line will clear itself. Doc 30 section 4.1. */
  get holdUntil(): number {
    const line = this.current;
    return line === null ? this.shownAt : this.shownAt + readingHold(line.line, this.timing);
  }

  /** Whether input may dismiss the current line yet. Doc 30 section 4.2. */
  acceptsInput(now: number): boolean {
    return !this.done && now >= this.shownAt + INPUT_GUARD;
  }

  /**
   * The clock moved. Returns true if the frame needs redrawing.
   *
   * A LINE IS NEVER LEFT WAITING FOR A CLICK. Doc 30 section 1: reading
   * duration is data, and the build had none -- interactive dialogue "can
   * remain indefinitely", which is what made it read as a menu rather than a
   * conversation.
   */
  tick(now: number): boolean {
    if (this.done) return false;
    if (now < this.holdUntil) return false;
    return this.next(now);
  }

  /**
   * A click, Space or Enter. Advances EXACTLY ONE utterance.
   *
   * Doc 30 section 4.2: "Skipping an utterance preserves its state writes and
   * proceeds to the next authored pause or utterance. It does not jump to the
   * end of the exchange." So this is `next`, not `finish`.
   */
  skip(now: number): boolean {
    if (!this.acceptsInput(now)) return false;
    return this.next(now);
  }

  /**
   * Escape, or the cutscene-skip action: to the end, with the same final
   * state as watching it. Doc 30 section 4.2's last paragraph.
   */
  skipAll(now: number): boolean {
    if (this.done) return false;
    this.at = this.queue.length;
    this.shownAt = now;
    this.finish();
    return true;
  }

  private next(now: number): boolean {
    this.at += 1;
    this.shownAt = now;
    if (this.at >= this.queue.length) {
      this.finish();
      return true;
    }
    // THE PHASE TURNS WHEN THE ECHO IS OVER, which is the boundary the
    // exchange was built to have. `advance('reply')` is idempotent in effect
    // -- it marks nothing new -- but it is what a trace reads to say the
    // performance got past Thad's own line.
    if (this.at === 1 && this.state === 'thadLine') {
      this.state = 'replies';
      this.exchange.advance('reply');
    }
    return true;
  }

  /**
   * ERRATA 45, AND THE ONE THING A PHASE DRIVER MUST NOT GET WRONG.
   *
   * The settle happens ON EXIT FROM THE LAST REPLY -- when the final line has
   * been read and dismissed -- and not on entry to a settling phase. Commit on
   * entry would put the writes underneath the last line, which is precisely
   * the coach departing under "Wasn't for you." that doc 30 section 6.2 names
   * and that `tests/resolution.test.ts` has a test for by name.
   */
  private finish(): void {
    this.state = 'settled';
    this.exchange.settle();
  }
}
