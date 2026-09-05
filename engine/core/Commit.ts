import { EffectOwnership, TransactionJournal } from './TransactionJournal.ts';
import type { DurableEffect, EffectPhase, ImmutableCommitBundle } from './runtime-types.ts';
import type { FlagValue } from './types.ts';

/**
 * Step B's applier: the one place a reserved commit bundle becomes a change
 * to the world, and the only place that decides WHEN each kind of change
 * lands.
 *
 * Doc 34 section 4.2 gives the journal "the immutable durable commit bundle
 * and exactly-once phase markers" and says "resolver code is pure". Step A
 * built the journal and the bundle; this is the half that spends one.
 *
 * WHY IT IS A SEPARATE FILE. Dialogue and verb resolution both produce
 * bundles, and both must apply them in the same order or the ordering
 * contract is two implementations that agree today. Errata 48's finding was
 * that the visible order was backwards in ONE of the two paths; a second
 * copy of the order is how that happens again.
 *
 * WHAT IT DOES NOT DO. It does not decide the bundle's contents, does not
 * know a room from a flag, and does not present anything. The caller has
 * already marked `line` by the time it runs -- that is the whole point of
 * section 9.1's order, and this function asserting its own place in it is
 * what makes a caller that skips the line phase fail loudly.
 */

/**
 * Which journal phase applies which kind of effect. Section 9.1's tail --
 * world state, then flags, then inventory -- and errata 48's canonical
 * order, which names the same three after the line.
 *
 * `room` is world state because a room change IS world state; that it also
 * begins a transition is step E's problem and not this table's. `dialogueTaken`
 * is world state because doc 34 section 4.2 makes dialogue counts durable
 * state owned by the tree, and the save file round-trips them.
 */
export const EFFECT_PHASE: Readonly<Record<DurableEffect['kind'], EffectPhase>> = {
  objectState: 'worldState',
  room: 'worldState',
  dialogueTaken: 'worldState',
  puzzleProgress: 'worldState',
  flag: 'flags',
  flagAdd: 'flags',
  inventoryAdd: 'inventory',
  inventoryRemove: 'inventory',
};

/** The three commit phases, in section 9.1's order. */
export const COMMIT_PHASES: readonly EffectPhase[] = ['worldState', 'flags', 'inventory'];

/**
 * Everything a durable effect can do to the world.
 *
 * Every method is required, so a world that may not perform one has to say
 * so out loud rather than silently ignore it. DialogueRunner's adapter
 * throws on five of the seven, which is doc 34 section 4.2's "a dialogue
 * tree transaction owns dialogue counts/node movement" written as code
 * instead of as a comment.
 */
export interface DurableWorld {
  setFlag(flag: string, value: FlagValue): void;
  addFlag(flag: string, delta: number): void;
  setObjectState(object: string, state: string): void;
  addInventory(item: string): void;
  removeInventory(item: string): void;
  enterRoom(room: string): void;
  markDialogueTaken(tree: string, node: string, option: string): void;
  /** Doc 53: a canonical puzzle's progress. Written by a puzzle action, or by a dialogue row doc 04 gives that job. */
  setPuzzle(puzzle: string, status: 'pending' | 'complete'): void;
}

/**
 * Applies a reserved bundle in phase order, marking each phase it uses.
 *
 * A phase with no effects in the bundle is SKIPPED rather than marked: a
 * marker means the phase happened, and an action that changes no flags did
 * not have a flags phase. The journal's own assertion 8 then does the rest --
 * calling this twice on one journal fires PHASE_ORDER rather than applying
 * anything twice, which is section 15.2's "state, flags, and inventory occur
 * once" enforced by construction.
 */
export function commitBundle(
  bundle: ImmutableCommitBundle, world: DurableWorld, journal: TransactionJournal,
): void {
  for (const phase of COMMIT_PHASES) {
    const due = bundle.effects.filter((effect) => EFFECT_PHASE[effect.kind] === phase);
    if (due.length === 0) continue;
    journal.mark(phase);
    for (const effect of due) applyEffect(effect, world);
  }
}

function applyEffect(effect: DurableEffect, world: DurableWorld): void {
  switch (effect.kind) {
    case 'flag':
      world.setFlag(effect.flag, effect.value);
      return;
    case 'flagAdd':
      world.addFlag(effect.flag, effect.delta);
      return;
    case 'objectState':
      world.setObjectState(effect.object, effect.state);
      return;
    case 'inventoryAdd':
      world.addInventory(effect.item);
      return;
    case 'inventoryRemove':
      world.removeInventory(effect.item);
      return;
    case 'room':
      world.enterRoom(effect.room);
      return;
    case 'dialogueTaken':
      world.markDialogueTaken(effect.tree, effect.node, effect.option);
      return;
    case 'puzzleProgress':
      world.setPuzzle(effect.puzzle, effect.status);
      return;
  }
}

/**
 * Where a transaction gets its journal.
 *
 * RuntimeCoordinator satisfies this structurally, which is the seam: step D
 * hands the live coordinator in and every journal in the game then shares one
 * EffectOwnership registry, which is what assertion 2 needs to be able to
 * fire at all. Until then each GameState carries its own registry, so the
 * assertion still guards everything inside one session.
 */
export interface JournalSource {
  newJournal(transactionId: string): TransactionJournal;
}

export function localJournals(): JournalSource {
  const ownership = new EffectOwnership();
  return { newJournal: (transactionId) => new TransactionJournal(transactionId, ownership) };
}

/** Flag writes as reserved effects. Shared by dialogue options and response rules. */
export function flagEffects(
  prefix: string, set?: Record<string, FlagValue>, add?: Record<string, number>,
): DurableEffect[] {
  const effects: DurableEffect[] = [];
  for (const [flag, value] of Object.entries(set ?? {})) {
    effects.push({ id: `${prefix}#set:${flag}`, kind: 'flag', flag, value });
  }
  for (const [flag, delta] of Object.entries(add ?? {})) {
    effects.push({ id: `${prefix}#add:${flag}`, kind: 'flagAdd', flag, delta });
  }
  return effects;
}
