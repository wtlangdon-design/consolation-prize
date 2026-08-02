/**
 * The twenty-one illegal-state assertions.
 *
 * Doc 34 section 4.6 lists fifteen. Doc 34a reconciles that list against a
 * derived one and rules that six more, sourced from sections 4.2, 4.5, 10.4
 * and 10.5, are binding as well, and that two of section 4.6's are superseded
 * by stronger statements elsewhere in the same document. Twenty-one, each with
 * its citation on the guard that enforces it.
 *
 * WHY THEY THROW RATHER THAN LOG. Doc 34's opening severity table calls the
 * first four findings P0 -- "can corrupt a save, double-commit state, or
 * create an unrecoverable hybrid world". A guard that logs and continues has
 * already let the double write happen. Every one of these is a programming
 * error in engine code, never a content error and never something a player can
 * cause, so throwing is the honest response and the stack is the diagnosis.
 *
 * COST IN PRODUCTION. Every guard opens with `if (!checking) return`, one
 * boolean read against a module-scope let. main.ts sets it from
 * import.meta.env.DEV, which Vite folds to a literal, so the production bundle
 * pays one dead branch per call and the guards' bodies are unreachable.
 *
 * REACHABILITY. `firedAssertions()` is not decoration. This project has been
 * bitten by checks that could not fail, so tests/runtime.test.ts constructs
 * the illegal state for all twenty-one and finishes by asserting that every
 * code in ASSERTION_CODES has been seen to fire at least once. A guard nobody
 * has watched fail is not a guard.
 */

import {
  isAtomicRoot,
  type AutosaveReason,
  type ChoreHandle,
  type ClockDomain,
  type FinishOrigin,
  type InputLayer,
  type RootKind,
  type RootOperation,
  type RuntimeParticipant,
  type StableCheckpoint,
} from './runtime-types.ts';

export type AssertionCode =
  /* --- doc 34 section 4.6, in its own order --- */
  | 'ROOT_EXCLUSIVE'
  | 'EFFECT_ONE_OWNER'
  | 'CHECKPOINT_WHILE_UNSTABLE'
  | 'TRANSITION_BEFORE_DRAIN'
  | 'HANDLE_UNSETTLED_AT_DISPOSAL'
  | 'BODY_ONE_OWNER'
  | 'RESOLVER_MUTATED'
  | 'PHASE_ORDER'
  | 'SAVE_CAPTURE_WHILE_UNSTABLE'
  | 'AUTOSAVE_BEFORE_INGRESS'
  | 'QUEUED_SAVE_STALLED'
  | 'INPUT_ONE_LAYER'
  | 'LOAD_MUTATED_LIVE'
  | 'CLIP_FALLBACK'
  | 'OBSOLETE_TOPOLOGY'
  /* --- doc 34a section 2, the six section 4.6 does not express --- */
  | 'STORAGE_SOLE_WRITER'
  | 'SAVE_ARBITRATED_COMMIT'
  | 'DISPOSE_OFF_SWAP'
  | 'WORLD_CANCELLED_COMMITTED'
  | 'WALL_CLOCK_GAMEPLAY'
  | 'CLOCK_POSITION_PERSISTED';

/** The working set, in the order doc 34a lays it out. */
export const ASSERTION_CODES: readonly AssertionCode[] = [
  'ROOT_EXCLUSIVE',
  'EFFECT_ONE_OWNER',
  'CHECKPOINT_WHILE_UNSTABLE',
  'TRANSITION_BEFORE_DRAIN',
  'HANDLE_UNSETTLED_AT_DISPOSAL',
  'BODY_ONE_OWNER',
  'RESOLVER_MUTATED',
  'PHASE_ORDER',
  'SAVE_CAPTURE_WHILE_UNSTABLE',
  'AUTOSAVE_BEFORE_INGRESS',
  'QUEUED_SAVE_STALLED',
  'INPUT_ONE_LAYER',
  'LOAD_MUTATED_LIVE',
  'CLIP_FALLBACK',
  'OBSOLETE_TOPOLOGY',
  'STORAGE_SOLE_WRITER',
  'SAVE_ARBITRATED_COMMIT',
  'DISPOSE_OFF_SWAP',
  'WORLD_CANCELLED_COMMITTED',
  'WALL_CLOCK_GAMEPLAY',
  'CLOCK_POSITION_PERSISTED',
];

export class IllegalStateError extends Error {
  readonly code: AssertionCode;

  constructor(code: AssertionCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'IllegalStateError';
    this.code = code;
  }
}

let checking = true;
const fired = new Set<AssertionCode>();

/** main.ts passes import.meta.env.DEV. Off, every guard is one dead branch. */
export function setAssertionChecking(on: boolean): void {
  checking = on;
}

export function assertionChecking(): boolean {
  return checking;
}

/** Which codes have been seen to fail. Reachability evidence, not telemetry. */
export function firedAssertions(): ReadonlySet<AssertionCode> {
  return fired;
}

export function clearFiredAssertions(): void {
  fired.clear();
}

function fail(code: AssertionCode, detail: string): never {
  fired.add(code);
  throw new IllegalStateError(code, detail);
}

/* =========================================================================
 * 1 -- Two atomic roots
 * "rootAtomicCount <= 1"  (doc 34 section 4.6, row 1; section 10.1)
 * ====================================================================== */
export function assertRootExclusive(current: RootOperation, incoming: RootKind): void {
  if (!checking) return;
  if (isAtomicRoot(current.kind) && isAtomicRoot(incoming)) {
    fail('ROOT_EXCLUSIVE', `${current.kind}->${incoming}`);
  }
}

/* =========================================================================
 * 2 -- Puzzle and dialogue both own the same effect
 * "every durable effect id has one transaction owner"  (section 4.6, row 2)
 * ====================================================================== */
export function assertEffectUnowned(
  effectId: string, incomingTx: string, existingTx: string | undefined,
): void {
  if (!checking) return;
  if (existingTx !== undefined && existingTx !== incomingTx) {
    fail('EFFECT_ONE_OWNER', `${effectId}@${existingTx}+${incomingTx}`);
  }
}

/* =========================================================================
 * 3 -- Stable checkpoint with a live path, chore, utterance or uncommitted
 *      journal
 * "checkpoint() returns null while any participant is unstable"
 * (section 4.6, row 3)
 * ====================================================================== */
export function assertCheckpointStable(
  checkpoint: StableCheckpoint | null, participants: Iterable<RuntimeParticipant>,
): void {
  if (!checking) return;
  if (checkpoint === null) return;
  for (const participant of participants) {
    if (!participant.stable()) {
      fail('CHECKPOINT_WHILE_UNSTABLE', `${participant.kind}:${participant.id}`);
    }
  }
}

/* =========================================================================
 * 4 -- Transition active before the interactive exchange drains
 * "no committed transition while DialogueTransaction phase != settled"
 * (section 4.6, row 4; section 4.3's EXIT-exchange row)
 * ====================================================================== */
export function assertDialogueDrained(undrainedTree: string | null): void {
  if (!checking) return;
  if (undrainedTree !== null) fail('TRANSITION_BEFORE_DRAIN', undrainedTree);
}

/* =========================================================================
 * 5 -- Room unload with a live non-transition ChoreHandle
 * "all handles settled/cancelled with explicit reason before participant
 *  disposal"  (section 4.6, row 5; doc 34a section 1 -- the reason is the
 *  point, not the settling)
 * ====================================================================== */
export function assertHandlesFinished(handles: Iterable<ChoreHandle>): void {
  if (!checking) return;
  for (const handle of handles) {
    if (handle.ownedByTransition) continue;
    if (handle.finishedWith() === null) {
      fail('HANDLE_UNSETTLED_AT_DISPOSAL', `${handle.actor}:${handle.id}`);
    }
  }
}

/* =========================================================================
 * 6 -- One body with walk and talk/chore/idle advancing together
 * "one body owner; prop tracks share its clock only"  (section 4.6, row 6)
 * ====================================================================== */
export function assertBodyUnowned(
  actor: string, incomingOwner: string, existingOwner: string | undefined,
): void {
  if (!checking) return;
  if (existingOwner !== undefined && existingOwner !== incomingOwner) {
    fail('BODY_ONE_OWNER', `${actor}@${existingOwner}+${incomingOwner}`);
  }
}

/* =========================================================================
 * 7 -- The resolver changed flags, state or inventory
 * "deep state snapshot equal before/after resolve"  (section 4.6, row 7;
 *  section 1.2's first three defect rows; section 9.1 resolver purity)
 *
 * SEAM FOR STEP B. Step B wraps DialogueRunner.select and VerbSystem.resolve
 * in pureResolution(); this is the guard it will land on.
 * ====================================================================== */
export function assertPureResolution(before: string, after: string): void {
  if (!checking) return;
  if (before !== after) fail('RESOLVER_MUTATED', `${before.length}!=${after.length}`);
}

/** Runs a resolution and proves it wrote nothing. Returns whatever it returns. */
export function pureResolution<T>(snapshot: () => string, run: () => T): T {
  if (!checking) return run();
  const before = snapshot();
  const value = run();
  assertPureResolution(before, snapshot());
  return value;
}

/* =========================================================================
 * 8 -- A state, flag or inventory phase emitted twice
 * "journal phase marker unique and monotonic"  (section 4.6, row 8)
 * STRENGTHENED per doc 34a section 2: unique AND in section 9.1's named
 * order -- stage, chore/contact, sound, chore settle, line, line settle/skip,
 * world state, flags, inventory, stable. Monotonic does not imply correct.
 * ====================================================================== */
export function assertPhaseOrder(
  transactionId: string, phase: string, alreadyMarked: boolean, previousOrdinal: number,
  incomingOrdinal: number,
): void {
  if (!checking) return;
  if (alreadyMarked) fail('PHASE_ORDER', `${transactionId}/${phase}#twice`);
  if (incomingOrdinal <= previousOrdinal) {
    fail('PHASE_ORDER', `${transactionId}/${phase}#${previousOrdinal}>=${incomingOrdinal}`);
  }
}

/* =========================================================================
 * 9 -- Save while the checkpoint is null
 * "SaveCoordinator may queue, never capture"  (section 4.6, row 9;
 *  section 4.4's SAVE row)
 * ====================================================================== */
export function assertCaptureStable(checkpoint: StableCheckpoint | null): void {
  if (!checking) return;
  if (checkpoint === null) fail('SAVE_CAPTURE_WHILE_UNSTABLE', 'null');
}

/* =========================================================================
 * 10 -- Autosave on a room id change before ingress
 * "transition autosave reason accepted only from destination-settled event"
 * (section 4.6, row 10; section 1.2's enterRoom() defect row)
 * ====================================================================== */
export function assertTransitionAutosaveReason(reason: AutosaveReason): void {
  if (!checking) return;
  if (reason !== 'destinationSettled') fail('AUTOSAVE_BEFORE_INGRESS', reason);
}

/* =========================================================================
 * 11 -- The menu waits for a checkpoint while the clocks stay paused
 * "queued Save must close shell/resume or be cancellable"  (section 4.6,
 *  row 11; G4; section 9.1 menu liveness -- "no test can remain paused
 *  waiting for itself")
 * ====================================================================== */
export function assertQueuedSaveLive(
  queued: boolean, shellOpen: boolean, clocksPaused: boolean, cancellable: boolean,
): void {
  if (!checking) return;
  if (queued && shellOpen && clocksPaused && !cancellable) {
    fail('QUEUED_SAVE_STALLED', 'shell+paused');
  }
}

/* =========================================================================
 * 12 -- A shell click that also advances speech or the world
 * "input route consumes event at exactly one layer"  (section 4.6, row 12)
 * STRENGTHENED per doc 34a section 2: section 10.7 and section 9.2 add which
 * layer -- the playfield is skip-only during speech -- and that a
 * mouse-visible shell control stays reachable throughout. G5 notes the
 * current GameScene has the order backwards.
 * ====================================================================== */
export function assertOneConsumer(layers: readonly InputLayer[]): void {
  if (!checking) return;
  if (layers.length > 1) fail('INPUT_ONE_LAYER', layers.join('+'));
}

/** The other half of row 12: the shell control never becomes unreachable. */
export function assertShellReachable(shellControlPresent: boolean): void {
  if (!checking) return;
  if (!shellControlPresent) fail('INPUT_ONE_LAYER', 'shell#unreachable');
}

/* =========================================================================
 * 13 -- Load validation mutated the live session
 * "live revision/state hash unchanged on every pre-swap failure"
 * (section 4.6, row 13; section 9.1 command policy)
 * ====================================================================== */
export function assertLiveUnchanged(before: string, after: string): void {
  if (!checking) return;
  if (before !== after) fail('LOAD_MUTATED_LIVE', `${before.length}!=${after.length}`);
}

/* =========================================================================
 * 14 -- A clip fallback hiding missing coverage
 * "required ChoreVariant lookup fails explicitly"  (section 4.6, row 14;
 *  section 1.2's ActorSprite.clipOf row; errata 50)
 *
 * SEAM FOR STEP C. Step C removes the size.clips[0] fallback and calls this
 * instead. Wiring it here would fail the current build on coverage step C is
 * commissioned to fix, which is not step A's call to make.
 * ====================================================================== */
export function assertRequiredClip(
  found: unknown, clip: string, facing: string, surface: string,
): void {
  if (!checking) return;
  if (found === undefined) fail('CLIP_FALLBACK', `${clip}/${facing}/${surface}`);
}

/* =========================================================================
 * 15 -- A map or exit pointing at pre-errata-43 topology
 * "canonical route validator rejects direct Main Street -> claims and missing
 *  2b/2c"  (section 4.6, row 15; section 10.8; errata 43)
 *
 * SEAM FOR STEP F. Content-free on purpose: the contract is passed in, so no
 * .ts file learns a room id. Step F supplies the real contract from content
 * and wires this into the map validator.
 * ====================================================================== */
export interface TopologyContract {
  /** Pairs that must exist in both directions. */
  readonly reciprocal: readonly (readonly [string, string])[];
  /** Direct edges that must not exist at all. */
  readonly forbidden: readonly (readonly [string, string])[];
}

export function assertCanonicalTopology(
  edges: Iterable<readonly [string, string]>, contract: TopologyContract,
): void {
  if (!checking) return;
  const present = new Set<string>();
  for (const [from, to] of edges) present.add(`${from}>${to}`);
  for (const [from, to] of contract.forbidden) {
    if (present.has(`${from}>${to}`)) fail('OBSOLETE_TOPOLOGY', `${from}>${to}#forbidden`);
  }
  for (const [a, b] of contract.reciprocal) {
    if (!present.has(`${a}>${b}`)) fail('OBSOLETE_TOPOLOGY', `${a}>${b}#missing`);
    if (!present.has(`${b}>${a}`)) fail('OBSOLETE_TOPOLOGY', `${b}>${a}#missing`);
  }
}

/* =========================================================================
 * 16 -- Something other than SaveCoordinator wrote storage
 * Doc 34a section 2, from section 10.4: "SaveCoordinator is the only storage
 * writer ... enterRoom(), dialogue, puzzle, sequence and menu code never
 * write storage directly." Section 4.6 asserts WHEN a write may happen and
 * never WHO may write, so a direct write from enterRoom() passes every one of
 * its fifteen.
 *
 * SEAM FOR STEP D.
 * ====================================================================== */
export function assertSoleStorageWriter(writerId: string, allowedId: string): void {
  if (!checking) return;
  if (writerId !== allowedId) fail('STORAGE_SOLE_WRITER', `${writerId}!=${allowedId}`);
}

/* =========================================================================
 * 17 -- SaveCoordinator decided whether a transaction commits
 * Doc 34a section 2, from section 4.2: "It never decides whether a
 * transaction commits or cancels; it waits for RuntimeCoordinator to publish
 * a stable checkpoint." This guards the arbitration boundary; 16 guards the
 * write boundary.
 * ====================================================================== */
export function assertNotSaveArbitrated(origin: FinishOrigin): void {
  if (!checking) return;
  if (origin === 'save') fail('SAVE_ARBITRATED_COMMIT', origin);
}

/* =========================================================================
 * 18 -- The live coordinator was disposed away from the swap boundary
 * Doc 34a section 2, from section 4.2: "LoadCoordinator constructs and
 * validates a candidate session. The live coordinator is disposed only at the
 * atomic swap boundary." Assertion 13 covers the live hash; this covers the
 * live object.
 * ====================================================================== */
export function assertDisposeAtSwap(atSwapBoundary: boolean): void {
  if (!checking) return;
  if (!atSwapBoundary) fail('DISPOSE_OFF_SWAP', 'preSwap');
}

/* =========================================================================
 * 19 -- Ordinary world input cancelled a transition after threshold commit
 * Doc 34a section 2, from section 10.5: "Ordinary world input cannot cancel a
 * transition after threshold commit." G3 adds that session-replacement
 * commands MAY abandon the whole unsaved live world, which is why the reason
 * and not merely the fact of the finish is what this tests.
 * ====================================================================== */
export function assertCommittedTransitionSurvives(
  committed: boolean, reason: string, origin: FinishOrigin,
): void {
  if (!checking) return;
  if (!committed) return;
  const sessionReplacement = reason === 'sessionAbandoned' || reason === 'faulted';
  if (sessionReplacement) return;
  if (reason === 'playerCancelled' || origin === 'player') {
    fail('WORLD_CANCELLED_COMMITTED', `${reason}/${origin}`);
  }
}

/* =========================================================================
 * 20 -- The wall clock drove gameplay state
 * Doc 34a section 2, from section 4.5: "Wall clock: timestamps/relative save
 * age only. Never drives gameplay state." Doc 34a calls it the cheapest of
 * the six and the easiest to violate accidentally, which is exactly what
 * GameScene does today with this.time.now.
 * ====================================================================== */
export function assertGameplayClock(domain: ClockDomain): void {
  if (!checking) return;
  if (domain === 'wall') fail('WALL_CLOCK_GAMEPLAY', domain);
}

/* =========================================================================
 * 21 -- A live clock position was persisted
 * Doc 34a section 2, from section 4.5: "Save files persist none of these live
 * clock positions unless a future named checkpoint explicitly requires a
 * semantic phase." Otherwise a save silently carries a presentation phase and
 * load reproduces a paused utterance.
 *
 * A wall-clock TIMESTAMP is not a clock position -- section 4.5 keeps
 * timestamps and relative save age -- so this matches on the domain names and
 * not on "any number that looks like time".
 * ====================================================================== */
const CLOCK_KEYS: readonly string[] = [
  'wall', 'simulation', 'presentation', 'ambient', 'audioTransport',
];

export function assertNoClockPositions(payload: unknown, path = '$'): void {
  if (!checking) return;
  if (payload === null || typeof payload !== 'object') return;
  if (Array.isArray(payload)) {
    payload.forEach((entry, index) => assertNoClockPositions(entry, `${path}.${index}`));
    return;
  }
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (CLOCK_KEYS.includes(key) && typeof value === 'number') {
      fail('CLOCK_POSITION_PERSISTED', `${path}.${key}`);
    }
    assertNoClockPositions(value, `${path}.${key}`);
  }
}
