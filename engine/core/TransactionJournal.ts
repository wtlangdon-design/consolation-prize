import { assertEffectUnowned, assertPhaseOrder } from './Assertions.ts';
import type { DurableEffect, ImmutableCommitBundle } from './runtime-types.ts';

/**
 * The durable commit trace. Doc 34 section 4.2:
 *
 *   "TransactionJournal owns the immutable durable commit bundle and
 *    exactly-once phase markers. Resolver code is pure. Animation, dialogue
 *    and audio receive presentation commands and cannot write story state."
 *
 * THE ORDER IS THE CONTRACT. Section 4.6 asks only for markers "unique and
 * monotonic". Doc 34a section 2 rules that too weak and replaces it with
 * section 9.1's named order, on the grounds that monotonic does not imply
 * correct. The ten below are section 9.1's exactly-once trace:
 *
 *   stage -> chore/contact -> sound -> chore settle -> line -> line
 *   settle/skip -> world state -> flags -> inventory -> stable
 *
 * Section 10.2 gives a nine-item version of the same list with "line
 * settle/skip" missing. Section 9.1's is the automated acceptance check, so
 * section 9.1's is the one implemented and the extra marker is optional like
 * every other -- a phase may be SKIPPED, and a silent action legitimately
 * emits neither chore nor sound. What may not happen is a phase arriving
 * twice, or arriving after a later one.
 *
 * WHY THAT ORDER AND NOT ANOTHER. It is section 3.1's ruling that D31 and
 * errata 48 beat doc 22's older interaction order: "pure resolve first;
 * visible chore/sound/line; then state/flags/inventory". The visible
 * performance happens before the world changes, so a skip, an error or a save
 * never sees half a story -- section 1.2's third defect, which GameState
 * interact() has today.
 */

export const JOURNAL_PHASES = [
  'stage',
  'choreContact',
  'sound',
  'choreSettle',
  'line',
  'lineSettle',
  'worldState',
  'flags',
  'inventory',
  'stable',
] as const;

export type JournalPhase = typeof JOURNAL_PHASES[number];

/** Position in the canonical order. -1 for anything not in it. */
export function phaseOrdinal(phase: JournalPhase): number {
  return JOURNAL_PHASES.indexOf(phase);
}

/**
 * Who owns which durable effect id, across every live transaction.
 *
 * Assertion 2 exists because G1 is real: "A puzzle response presented as
 * dialogue would have two commit owners." One registry, held by the
 * coordinator, and a journal claims into it when it reserves.
 */
export class EffectOwnership {
  private readonly owners = new Map<string, string>();

  claim(effectId: string, transactionId: string): void {
    assertEffectUnowned(effectId, transactionId, this.owners.get(effectId));
    this.owners.set(effectId, transactionId);
  }

  ownerOf(effectId: string): string | undefined {
    return this.owners.get(effectId);
  }

  /** Releases everything a transaction held, on settle or on abandon. */
  release(transactionId: string): void {
    for (const [effectId, owner] of [...this.owners]) {
      if (owner === transactionId) this.owners.delete(effectId);
    }
  }

  get size(): number {
    return this.owners.size;
  }
}

export class TransactionJournal {
  readonly transactionId: string;

  private readonly ownership: EffectOwnership;
  private readonly marks = new Set<JournalPhase>();
  private readonly sequence: JournalPhase[] = [];
  private lastOrdinal = -1;
  private bundle: ImmutableCommitBundle | null = null;

  constructor(transactionId: string, ownership: EffectOwnership) {
    this.transactionId = transactionId;
    this.ownership = ownership;
  }

  /**
   * Reserves the durable effects and freezes them.
   *
   * Reserved, not applied. Section 1.2's first three defects are all the same
   * mistake -- writing during resolution -- and the fix is that resolution
   * produces this bundle and the journal's phases apply it later. Frozen
   * because "immutable" in section 4.2 has to mean something a test can check.
   */
  reserve(id: string, effects: readonly DurableEffect[]): ImmutableCommitBundle {
    if (this.bundle) {
      throw new Error(`Journal already reserved: ${this.transactionId}`);
    }
    for (const effect of effects) this.ownership.claim(effect.id, this.transactionId);
    const frozen: ImmutableCommitBundle = Object.freeze({
      id,
      effects: Object.freeze(effects.map((effect) => Object.freeze({ ...effect }))),
    });
    this.bundle = frozen;
    return frozen;
  }

  get effects(): ImmutableCommitBundle | null {
    return this.bundle;
  }

  /** Assertion 8: unique, and in section 9.1's order. */
  mark(phase: JournalPhase): void {
    const ordinal = phaseOrdinal(phase);
    assertPhaseOrder(this.transactionId, phase, this.marks.has(phase), this.lastOrdinal, ordinal);
    this.marks.add(phase);
    this.sequence.push(phase);
    this.lastOrdinal = ordinal;
  }

  has(phase: JournalPhase): boolean {
    return this.marks.has(phase);
  }

  /** The trace, in the order it was emitted. Section 9.1's exactly-once check. */
  get trace(): readonly JournalPhase[] {
    return [...this.sequence];
  }

  /** True once `stable` has been marked. */
  get committed(): boolean {
    return this.marks.has('stable');
  }

  /**
   * Section 4.6 row 3's fourth participant: an "uncommitted journal". A
   * journal that has started emitting and has not reached stable is exactly
   * the half-written story a checkpoint must not capture.
   */
  get uncommitted(): boolean {
    return this.sequence.length > 0 && !this.committed;
  }

  /** Hands the effect ids back. Called at settle and at abandon alike. */
  release(): void {
    this.ownership.release(this.transactionId);
  }
}
