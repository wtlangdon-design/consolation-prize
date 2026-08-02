import { assertGameplayClock, assertNoClockPositions } from './Assertions.ts';
import type { ClockDomain, GameplayClock } from './runtime-types.ts';

/**
 * The five logical clocks. Doc 34 section 4.5, adopted by errata 52.
 *
 * Section 5 lists "Logical clocks" as one of the undefined contracts: "Pause,
 * manual text, hidden coffin transport, palette cycling and save age require
 * different time semantics. Name clocks and define pause ownership; forbid raw
 * wall time in gameplay." Section 4.5 names them. This holds them.
 *
 * ONE ADVANCE, FIVE POSITIONS. Everything is driven from a single wall delta,
 * so the domains cannot drift relative to one another, and each decides for
 * itself whether that delta lands. GameScene today reads `this.time.now` in
 * seven places -- idles, cycling, sequence, actor, ambient, barks, notices --
 * which is doc 34a's "cheapest of the six and the easiest to violate
 * accidentally" happening seven times over.
 *
 * WHAT SECTION 4.5 SAYS, LINE BY LINE:
 *
 *   wall            timestamps and relative save age only; never gameplay.
 *   simulation      walking, transitions, authored sequence timing. Pauses
 *                   under shell.
 *   presentation    speech holds, comedy pauses, chore timelines. Pauses
 *                   under shell; text speed scales reading holds only.
 *   ambient         idles and palette cycling. Pauses under shell, never
 *                   changes story state.
 *   audioTransport  room/grid position. Usually pauses under shell. During
 *                   the coffin it continues silently so the score can resume
 *                   mid-phrase; the entire coffin sequence and hidden
 *                   transport pause together if the shell overlay is invoked.
 *
 * THE COFFIN EXCEPTION, AND THE READING IT REQUIRED. That last sentence looks
 * self-contradicting -- "continues" and then "pauses ... if the shell overlay
 * is invoked" -- and section 10.10 settles it: "Hidden score transport
 * continues silently and pauses with the scene if the shell opens." So
 * "continues silently" is about AUDIBILITY, not about the shell. The exception
 * is that the transport keeps running while the scene presents nothing and the
 * score is inaudible, which is what lets it resume mid-phrase. The shell still
 * stops it, along with everything else. `setSilentTransport` is that state and
 * `paused('audioTransport')` still returns true whenever the shell is open.
 *
 * NOTHING HERE IS SAVED. Section 4.5's last line, and assertion 21: save files
 * persist no live clock position. `persistable()` returns an empty object and
 * is checked, rather than simply omitting the clocks and trusting nobody to
 * add them back.
 */
/**
 * One row per domain, so a future rule about one clock has somewhere to go
 * that is not an `if` in the middle of `paused`.
 *
 * All four gameplay clocks currently pause on the same trigger, which is what
 * section 4.5 says and not an accident of implementation -- the differences
 * between them are in what drives them and in what they are allowed to touch,
 * both of which are stated per row.
 */
interface ClockPolicy {
  readonly pausesUnderShell: boolean;
  /** Whether text-speed settings may scale a hold on this clock. */
  readonly scalesWithReadingSpeed: boolean;
}

const POLICY: Readonly<Record<ClockDomain, ClockPolicy>> = {
  // Timestamps and relative save age. Never pauses, never drives gameplay.
  wall: { pausesUnderShell: false, scalesWithReadingSpeed: false },
  // Walking, transitions, authored sequence timing.
  simulation: { pausesUnderShell: true, scalesWithReadingSpeed: false },
  // Speech holds, comedy pauses, chore timelines.
  presentation: { pausesUnderShell: true, scalesWithReadingSpeed: true },
  // Idles and palette cycling. Never changes story state -- invariant 9.
  ambient: { pausesUnderShell: true, scalesWithReadingSpeed: false },
  // Room and grid position. See the coffin note above.
  audioTransport: { pausesUnderShell: true, scalesWithReadingSpeed: false },
};

export class Clocks {
  private readonly positions = new Map<ClockDomain, number>([
    ['wall', 0], ['simulation', 0], ['presentation', 0], ['ambient', 0], ['audioTransport', 0],
  ]);

  private shell = false;
  private silentTransport = false;

  /** Advances every domain that is not paused by the same wall delta. */
  advance(wallDelta: number): void {
    if (wallDelta <= 0) return;
    for (const domain of this.positions.keys()) {
      if (this.paused(domain)) continue;
      this.positions.set(domain, (this.positions.get(domain) ?? 0) + wallDelta);
    }
  }

  /**
   * A domain's position. Legal for `wall` -- a timestamp is a legitimate use
   * and section 4.5 keeps it -- so anything that drives the world asks
   * `gameplay()` instead and gets the assertion for free.
   */
  now(domain: ClockDomain): number {
    return this.positions.get(domain) ?? 0;
  }

  /** Assertion 20: the wall clock never drives gameplay state. */
  gameplay(domain: GameplayClock): number {
    assertGameplayClock(domain);
    return this.now(domain);
  }

  paused(domain: ClockDomain): boolean {
    return POLICY[domain].pausesUnderShell && this.shell;
  }

  /**
   * A hold, with the text-speed setting applied only where it is allowed.
   *
   * Section 4.5: "text speed scales reading holds only". Section 3.1's last
   * row is the reason it matters -- "Authored story timing wins; reading-speed
   * settings never scale declared non-reading beats unless a future
   * accessibility ruling explicitly says so". Hob's four-second beat is four
   * seconds at every text speed, and the line that follows it is not.
   */
  hold(domain: ClockDomain, seconds: number, options: {
    readingSpeed?: number; reading?: boolean;
  } = {}): number {
    const scales = POLICY[domain].scalesWithReadingSpeed && options.reading === true;
    if (!scales) return seconds;
    return seconds * (options.readingSpeed ?? 1);
  }

  /** True when anything that drives the world has stopped. G4's deadlock. */
  get gameplayPaused(): boolean {
    return this.paused('simulation');
  }

  get shellOpen(): boolean {
    return this.shell;
  }

  openShell(): void {
    this.shell = true;
  }

  closeShell(): void {
    this.shell = false;
  }

  /**
   * The coffin. The transport advances while the scene is silent, so the score
   * resumes mid-phrase; the shell still pauses it with everything else.
   */
  setSilentTransport(on: boolean): void {
    this.silentTransport = on;
  }

  /** Whether the transport is currently running without being heard. */
  get transportSilent(): boolean {
    return this.silentTransport;
  }

  /** Assertion 21, as a shape rather than as a promise. Always empty. */
  persistable(): Record<string, never> {
    const empty: Record<string, never> = {};
    assertNoClockPositions(empty);
    return empty;
  }
}
