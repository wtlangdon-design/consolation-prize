import type { FlagValue } from './types.ts';

/**
 * THE LIAR'S ASSAY, AS A MACHINE (doc 03, errata 73, errata 74 A).
 *
 * Everything said in a duel comes from content/assay/assay.json, which
 * tools/extract-content.mjs parses out of docs/03-liars-assay.md. This file
 * holds the rules that the errata state as mechanism -- who throws what, what
 * the player is offered, when it ends -- and no line of the fiction.
 *
 * PURE AND DETERMINISTIC. A session is built from the assay file, a duel id
 * and the pairs the player knows when it starts, and every later state is a function
 * of the choices made. `resolve` describes a choice without changing anything;
 * `commit` makes it so. That split is the dialogue runner's own (doc 34
 * section 1.2): the duel's choices are reserved and performed like any
 * other selection and land only when the lines have played.
 *
 * WHAT THE PLAYER KNOWS DOES NOT CHANGE DURING A DUEL. Errata 73 D: Duel One's
 * notebook "joins his repertoire when the duel is over, not during it". So the
 * knowledge is a snapshot at the start, and the order Vessel throws in is
 * fixed at the start too.
 */

export interface AssayLine {
  speaker: string;
  line: string;
}

export interface AssayWrong {
  text: string;
  reply: string;
  by: string;
}

export interface AssayPair {
  n: number;
  tier: number;
  boast: string;
  counter: string;
  wrong: AssayWrong[];
  /** The flag that holds whether the player has learned this pair. Absent on the final duel's opponent's. */
  flag?: string;
}

export interface DuelDefinition {
  puzzle: string;
  opponent: string;
  opening?: AssayLine[];
  /** A fixed order (Duel One, errata 73 D). */
  sequence?: number[];
  /** A pool and a threshold (Duel Two, errata 73 E / 74 A). */
  pool?: number[];
  threshold?: number;
  notebook?: Record<string, AssayLine>;
  learns?: number[];
  sets?: Record<string, FlagValue>;
  setsOnWin?: Record<string, FlagValue>;
  loss?: AssayLine[];
  win?: AssayLine[];
  winnable?: boolean;
  yields?: string[];
}

export interface AssayFile {
  schema: number;
  id: string;
  exchangesToWin: number;
  bystander: string;
  pairs: AssayPair[];
  mockery: string[];
  duels: Record<string, DuelDefinition>;
}

export interface DuelOffer {
  id: string;
  text: string;
}

export type DuelOutcome = 'won' | 'lost';

/** What a choice would do. Nothing has happened when this exists. */
export interface DuelChoice {
  optionId: string;
  correct: boolean;
  /** Everything said after the player's echo, in order: reply, mutter, notebook, then the next boast or the ending. */
  lines: AssayLine[];
  ended: boolean;
  outcome: DuelOutcome | null;
  /** Flag writes that land when this choice settles. Empty until the duel ends. */
  sets: Record<string, FlagValue>;
  /** Items that land when this choice settles. Empty unless the duel is won. */
  yields: string[];
}

/** The part of a session the save file carries. */
export interface DuelSnapshot {
  duel: string;
  sequence: number[];
  known: number[];
  index: number;
  player: number;
  opponent: number;
  muttered: number[];
}

const RIGHT = 'right';

/**
 * Where the right counter sits among the four. Errata 73 C: "Its position
 * among the four varies by pair and is never always the same slot."
 */
export function rightSlot(pair: number): number {
  return (pair * 3 + 1) % 4;
}

/**
 * The order of boasts for a duel, given what the player knows when it starts.
 *
 * Duel One plays its fixed sequence. Duel Two (errata 73 E, ruled in errata
 * 74 A): with the threshold met, Tier 1 first ("Vessel escalates"), then the
 * pairs the player has learned, then the rest, each run ascending; short of it,
 * Vessel leads with the boasts the player cannot answer. Doc 02 B6's ">=14 pairs"
 * is therefore a property of the duel and not a gate in front of it: EVERY
 * player holding fourteen can win and no player holding thirteen can.
 *
 * WHY THE ORDER READS WHAT HE KNOWS. A fixed order cannot keep that promise
 * for every fourteen: Tier 1 then ascending sends five unanswerable boasts in
 * a row at a player who lacks pairs 5-11, and Tier 4 is "optional, missable"
 * (doc 03), so he may never find a fifteenth. That is invariant 6, and
 * tests/assay.test.ts walks every set of pairs to hold it. Losing closes
 * nothing either way (errata 73 H).
 */
export function duelOrder(file: AssayFile, duelId: string, known: ReadonlySet<number>): number[] {
  const duel = file.duels[duelId];
  if (!duel) throw new Error(`Unknown duel: ${duelId}`);
  if (duel.sequence) return [...duel.sequence];
  const pool = [...(duel.pool ?? [])].sort((a, b) => a - b);
  const tierOf = (n: number) => file.pairs.find((p) => p.n === n)?.tier ?? 0;
  const held = pool.filter((n) => known.has(n)).length;
  if (held >= (duel.threshold ?? 0)) {
    const later = pool.filter((n) => tierOf(n) !== 1);
    return [...pool.filter((n) => tierOf(n) === 1),
      ...later.filter((n) => known.has(n)), ...later.filter((n) => !known.has(n))];
  }
  return [...pool.filter((n) => !known.has(n)), ...pool.filter((n) => known.has(n))];
}

/** The pairs the player knows, read from the knowledge flags. */
export function knownPairs(file: AssayFile, isTrue: (flag: string) => boolean): Set<number> {
  return new Set(file.pairs.filter((p) => p.flag && isTrue(p.flag)).map((p) => p.n));
}

export class DuelSession {
  readonly id: string;
  private readonly file: AssayFile;
  private readonly duel: DuelDefinition;
  private readonly sequence: number[];
  private readonly known: Set<number>;
  private index = 0;
  private player = 0;
  private opponent = 0;
  private muttered = new Set<number>();

  constructor(file: AssayFile, duelId: string, known: ReadonlySet<number>, from?: DuelSnapshot) {
    const duel = file.duels[duelId];
    if (!duel) throw new Error(`Unknown duel: ${duelId}`);
    this.id = duelId;
    this.file = file;
    this.duel = duel;
    if (from) {
      if (from.duel !== duelId) throw new Error(`Snapshot is for ${from.duel}, not ${duelId}`);
      this.known = new Set(from.known);
      this.sequence = [...from.sequence];
      this.index = from.index;
      this.player = from.player;
      this.opponent = from.opponent;
      this.muttered = new Set(from.muttered);
    } else {
      this.known = new Set(known);
      this.sequence = duelOrder(file, duelId, this.known);
    }
    if (this.sequence.length === 0) throw new Error(`Duel ${duelId} has nothing to throw`);
  }

  private pair(n: number): AssayPair {
    const found = this.file.pairs.find((p) => p.n === n);
    if (!found) throw new Error(`The assay has no pair ${n}`);
    return found;
  }

  /** The boast now standing. */
  get currentPair(): number {
    return this.sequence[this.index] as number;
  }

  get score(): { player: number; opponent: number } {
    return { player: this.player, opponent: this.opponent };
  }

  /** The opening scene (if any) and the first boast: played when the duel starts. */
  intro(): AssayLine[] {
    return [...(this.duel.opening ?? []), this.boastLine(this.currentPair)];
  }

  private boastLine(n: number): AssayLine {
    return { speaker: this.duel.opponent, line: this.pair(n).boast };
  }

  /** Errata 73 C: three wrong answers, and the right one only once it is learned. */
  offered(): DuelOffer[] {
    const pair = this.pair(this.currentPair);
    const offers: DuelOffer[] = pair.wrong.map((w, i) => ({ id: `w${i}`, text: w.text }));
    if (this.known.has(pair.n)) {
      offers.splice(Math.min(rightSlot(pair.n), offers.length), 0, { id: RIGHT, text: pair.counter });
    }
    return offers;
  }

  /** What choosing `optionId` would do. Changes nothing. */
  resolve(optionId: string): DuelChoice {
    return this.step(optionId).choice;
  }

  /** Applies a choice previously resolved. */
  commit(optionId: string): DuelChoice {
    const { choice, next } = this.step(optionId);
    this.index = next.index;
    this.player = next.player;
    this.opponent = next.opponent;
    this.muttered = next.muttered;
    return choice;
  }

  private step(optionId: string): {
    choice: DuelChoice;
    next: { index: number; player: number; opponent: number; muttered: Set<number> };
  } {
    const pair = this.pair(this.currentPair);
    const offers = this.offered();
    if (!offers.some((o) => o.id === optionId)) throw new Error(`Not offered: ${optionId} on pair ${pair.n}`);
    const correct = optionId === RIGHT;
    const lines: AssayLine[] = [];
    let { player, opponent } = this;
    const muttered = new Set(this.muttered);
    if (correct) {
      player += 1;
    } else {
      opponent += 1;
      const wrong = pair.wrong[Number(optionId.slice(1))];
      if (!wrong) throw new Error(`No wrong answer ${optionId} on pair ${pair.n}`);
      lines.push({ speaker: wrong.by, line: wrong.reply });
      // Errata 73 D and F: in Duel One, a voice from the ring mutters the
      // right counter the first time each pair is thrown; the player writes it down.
      if ((this.duel.learns ?? []).includes(pair.n) && !muttered.has(pair.n)) {
        muttered.add(pair.n);
        lines.push({ speaker: this.file.bystander, line: pair.counter });
        const note = this.duel.notebook?.[String(pair.n)];
        if (note) lines.push(note);
      }
    }
    const index = this.index + 1;
    const toWin = this.file.exchangesToWin;
    const ended = player >= toWin || opponent >= toWin || index >= this.sequence.length;
    const outcome: DuelOutcome | null = !ended ? null : (player >= toWin ? 'won' : 'lost');
    const sets: Record<string, FlagValue> = {};
    let yields: string[] = [];
    if (ended) {
      for (const n of this.duel.learns ?? []) {
        const flag = this.pair(n).flag;
        if (flag) sets[flag] = true;
      }
      Object.assign(sets, this.duel.sets ?? {});
      if (outcome === 'won') {
        Object.assign(sets, this.duel.setsOnWin ?? {});
        yields = [...(this.duel.yields ?? [])];
        lines.push(...(this.duel.win ?? []));
      } else {
        // Errata 73 H: a lost Duel Two ends on the reply that lost it. Duel
        // One's loss has its own scene.
        lines.push(...(this.duel.loss ?? []));
      }
    } else {
      lines.push(this.boastLine(this.sequence[index] as number));
    }
    return {
      choice: { optionId, correct, lines, ended, outcome, sets, yields },
      next: { index, player, opponent, muttered },
    };
  }

  snapshot(): DuelSnapshot {
    return {
      duel: this.id,
      sequence: [...this.sequence],
      known: [...this.known].sort((a, b) => a - b),
      index: this.index,
      player: this.player,
      opponent: this.opponent,
      muttered: [...this.muttered].sort((a, b) => a - b),
    };
  }
}
