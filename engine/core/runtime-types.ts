/**
 * The cross-system operation contract. Doc 34 section 4.1, adopted whole by
 * errata 52.
 *
 * WHY THIS FILE IS SEPARATE FROM types.ts. That file's first line is
 * "Content schema types" and it means it: every shape in it is the shape of
 * something on disk in /content. Nothing here is. These are the runtime
 * ownership shapes -- who owns the moment, who may write durable state, and
 * which clock a thing advances on -- and mixing them into the content schema
 * would make the one architecture rule harder to read, not easier.
 *
 * The types doc 34 gives as code are reproduced verbatim. The ones it names
 * without defining (StableCheckpoint, FinishReason, PlayerIntent, ShellIntent,
 * IntentResult, PresentationLease, ImmutableCommitBundle) are defined here for
 * the first time; each carries a note saying what it was derived from, because
 * an invented shape that looks quoted is worse than one that admits it.
 */

import type { FlagValue } from './types.ts';
import type { JournalPhase, TransactionJournal } from './TransactionJournal.ts';

/* -------------------------------------------------------------------------
 * 4.5: the five clock domains
 * ---------------------------------------------------------------------- */

/**
 * Doc 34 section 4.5 names exactly these five and gives each its own pause
 * semantics. They are a closed set: a sixth clock would be a sixth opinion
 * about what "now" means, which is the thing section 5 lists as undefined and
 * this contract closes.
 */
export type ClockDomain = 'wall' | 'simulation' | 'presentation' | 'ambient' | 'audioTransport';

/** Every domain but `wall`. Section 4.5: the wall clock never drives state. */
export type GameplayClock = Exclude<ClockDomain, 'wall'>;

/* -------------------------------------------------------------------------
 * 4.1, verbatim: one root operation
 * ---------------------------------------------------------------------- */

export type RootOperation =
  | { kind: 'stable' }
  | { kind: 'freeWalk'; cancellable: true }
  | { kind: 'dialogue'; tx: DialogueTransaction }
  | { kind: 'action'; tx: ActionTransaction }
  | { kind: 'transition'; tx: TransitionTransaction }
  | { kind: 'cutscene'; tx: CutsceneTransaction };

export type RootKind = RootOperation['kind'];

/**
 * The eight phases, verbatim. Doc 34 section 4.1.
 *
 * Note they are NOT the journal's phase markers: these are the transaction's
 * own progress, and the journal's ten markers are the durable trace section
 * 9.1 names. An action can be in phase "chore" while the journal has recorded
 * stage and choreContact and not yet sound.
 */
export type ActionPhase =
  | 'reserved' | 'staging' | 'chore' | 'line'
  | 'worldState' | 'flags' | 'inventory' | 'settling';

export interface ActionTransaction {
  id: string;
  phase: ActionPhase;
  effects: ImmutableCommitBundle;
  dialogue?: PresentationLease;   // no durable puzzle writes
  chore?: ChoreHandle;            // child of this action
  journal: TransactionJournal;    // idempotent phase markers
}

/**
 * DERIVED. Doc 34 names DialogueTransaction and never defines it; the phases
 * come from section 1.2's D30 citation -- "reservation and commit only after
 * echo/reply/post-beat drain" -- and `settled` is the state section 4.6's
 * fourth assertion tests for.
 *
 * `counts` is section 4.2's split: a dialogue tree owns dialogue counts and
 * node movement and nothing else. Step B fills it.
 */
export interface DialogueTransaction {
  id: string;
  tree: string;
  phase: 'reserved' | 'echo' | 'reply' | 'postBeat' | 'settled';
  effects: ImmutableCommitBundle;
  journal: TransactionJournal;
  /** Dialogue-owned durable state: taken options, node position. */
  counts?: { node: string | null; taken: readonly string[] };
}

/**
 * DERIVED. Phases follow doc 34 section 4.3's five moments and section 7's
 * exit archetype vocabulary (approach/threshold/egress/settle).
 *
 * `committed` is the one field with teeth: after the threshold commit,
 * player-world cancellation is forbidden (G3, section 10.5).
 */
export interface TransitionTransaction {
  id: string;
  phase: 'approach' | 'egress' | 'threshold' | 'committed' | 'ingress' | 'settled';
  committed: boolean;
  from: string;
  to: string;
  journal: TransactionJournal;
}

/**
 * DERIVED. Section 5 asks for a per-cutscene start/final checkpoint bundle and
 * G6 reserves whole-sequence skip for non-interactive cutscenes, so those are
 * the two fields it needs and there is no third.
 */
export interface CutsceneTransaction {
  id: string;
  phase: 'running' | 'skipping' | 'settled';
  /** G6: only a non-interactive cutscene may expose whole-scene skip. */
  skippable: boolean;
  journal: TransactionJournal;
  /** The checkpoint both watching and skipping must land on. */
  finalCheckpoint: string | null;
}

/* -------------------------------------------------------------------------
 * The durable commit bundle
 * ---------------------------------------------------------------------- */

/**
 * DERIVED. Section 4.2 gives TransactionJournal "the immutable durable commit
 * bundle" without saying what a durable effect is. It is exactly the set of
 * things the current save file round-trips -- flags, object state, ownership,
 * room, dialogue counts -- because a thing that is not saved is not durable.
 *
 * Every member carries an `id`, which is what section 4.6's second assertion
 * is about: one owner per effect id, game-wide, while it is reserved.
 */
export type DurableEffect =
  | { id: string; kind: 'flag'; flag: string; value: FlagValue }
  | { id: string; kind: 'flagAdd'; flag: string; delta: number }
  | { id: string; kind: 'objectState'; object: string; state: string }
  | { id: string; kind: 'inventoryAdd'; item: string }
  | { id: string; kind: 'inventoryRemove'; item: string }
  | { id: string; kind: 'room'; room: string }
  | { id: string; kind: 'dialogueTaken'; tree: string; node: string; option: string };

/** Which journal phase applies an effect. Section 9.1's tail, as a lookup. */
export type EffectPhase = Extract<JournalPhase, 'worldState' | 'flags' | 'inventory'>;

export interface ImmutableCommitBundle {
  readonly id: string;
  readonly effects: readonly DurableEffect[];
}

/* -------------------------------------------------------------------------
 * Children: leases and handles
 * ---------------------------------------------------------------------- */

export type FinishReason =
  /** Ran to completion. */
  | 'settled'
  /** Per-line skip, or a cutscene's whole-sequence skip. */
  | 'skipped'
  /** Ordinary world input on a cancellable root. Illegal after commit. */
  | 'playerCancelled'
  /** Participant disposal on room unload. */
  | 'roomUnloaded'
  /** Load, restart, new game, quit: the whole unsaved live session goes. */
  | 'sessionAbandoned'
  /** Runtime or content error; recovery is to the last stable snapshot. */
  | 'faulted';

/**
 * Who asked for the finish. Section 4.2: SaveCoordinator "never decides
 * whether a transaction commits or cancels", so `save` is an illegal origin
 * and the assertion module says so out loud.
 */
export type FinishOrigin = 'runtime' | 'player' | 'shell' | 'save' | 'load';

export type ParticipantKind = 'path' | 'chore' | 'utterance' | 'journal' | 'transition';

/**
 * Anything that can be mid-something when a checkpoint is asked for. Section
 * 4.6: "checkpoint() returns null while any participant is unstable".
 */
export interface RuntimeParticipant {
  readonly id: string;
  readonly kind: ParticipantKind;
  /** True when this participant has nothing live. */
  stable(): boolean;
  /** Section 2.2: a reasoned finish, never a boolean cancel. */
  finish(reason: FinishReason): void;
}

/**
 * SEAM FOR STEP C. The handle itself -- markers, final pose, propagated
 * settle -- is step C's job; what step A needs is the shape the coordinator
 * disposes against, and the one field section 4.6 insists on: a handle at
 * disposal must carry the reason it ended, not merely be gone.
 */
export interface ChoreHandle extends RuntimeParticipant {
  readonly kind: 'chore';
  readonly actor: string;
  /** The reason this handle ended, or null while it is live. */
  finishedWith(): FinishReason | null;
  /** True for a handle owned by a transition, which settles before unload. */
  readonly ownedByTransition: boolean;
}

/**
 * DERIVED. Section 4.2: "When speech presents a puzzle action, it is a child
 * lease and does not also own the puzzle effects." The `false` literal type is
 * the whole point -- a lease that tried to declare itself a writer would not
 * compile.
 */
export interface PresentationLease {
  readonly id: string;
  /** The root transaction this lease hangs off. */
  readonly owner: string;
  readonly kind: 'dialogue' | 'speech' | 'chore';
  readonly durableWrites: false;
  release(reason: FinishReason): void;
}

/* -------------------------------------------------------------------------
 * Checkpoints, input, intents
 * ---------------------------------------------------------------------- */

/**
 * DERIVED. Section 2.2: stable checkpoint "is named in D29, D30, D31, D32 and
 * D33 but has no shared type or publisher. Define it once."
 *
 * `stateHash` is what section 4.6's load assertion compares and what section
 * 9.1's watch/skip equivalence check compares. It is supplied by the host, so
 * the coordinator never learns what a room or a flag is.
 */
export interface StableCheckpoint {
  readonly revision: number;
  readonly roomId: string;
  readonly reason: StableReason;
  readonly stateHash: string;
}

export type StableReason =
  | 'idle'
  | 'actionSettled'
  | 'dialogueSettled'
  | 'destinationSettled'
  | 'cutsceneSettled';

/** Section 4.1, verbatim. */
export type InputMode = 'world' | 'speechSkip' | 'choice' | 'shell' | 'none';

/** Section 10.7's five layers, in the order they are offered the event. */
export type InputLayer = 'shell' | 'choice' | 'speechSkip' | 'panel' | 'world';

export type PlayerIntent =
  | { kind: 'walk'; x: number; y: number }
  | { kind: 'interact'; target: string; verb: string }
  | { kind: 'choose'; option: string }
  | { kind: 'skipLine' }
  | { kind: 'skipScene' }
  | { kind: 'selectVerb'; verb: string }
  | { kind: 'holdItem'; item: string | null };

export type ShellIntent =
  | { kind: 'openShell' }
  | { kind: 'closeShell' }
  | { kind: 'save'; slot: number | null; cancellable?: boolean }
  | { kind: 'load'; slot: number }
  | { kind: 'restart' }
  | { kind: 'newGame' }
  | { kind: 'quitToTitle' }
  | { kind: 'options' };

export type RefusalReason =
  | 'notCancellable'
  | 'wrongMode'
  | 'committedTransition'
  | 'unstable'
  | 'disposed';

export interface IntentResult {
  accepted: boolean;
  /** Which layer consumed it. Exactly one, or none. */
  layer: InputLayer | null;
  refusal?: RefusalReason;
  /** True when the intent was banked for the next checkpoint rather than run. */
  queued?: boolean;
}

/* -------------------------------------------------------------------------
 * Save and load seams
 * ---------------------------------------------------------------------- */

/**
 * Why a transition-time autosave fired. Section 4.6: only the last of these
 * is an accepted reason, and the other two exist so the assertion has
 * something to reject -- `roomIdChanged` is what enterRoom() does today.
 */
export type AutosaveReason = 'roomIdChanged' | 'onEnterApplied' | 'destinationSettled';

/**
 * SEAM FOR STEP D. Section 4.1's flow, as an interface:
 *
 *   RuntimeCoordinator.publishStable(checkpoint)
 *     -> SaveCoordinator.releaseQueuedRequest(checkpoint)
 *     -> verified storage write
 *
 * The coordinator calls it and never writes storage itself. Step D implements
 * it over SaveManager; until then a test double stands in and the coordinator
 * cannot tell the difference, which is the point of the seam.
 */
export interface SaveGate {
  releaseQueuedRequest(checkpoint: StableCheckpoint): void;
}

/** A save asked for during atomic work. Section 4.4's SAVE row. */
export interface QueuedSaveRequest {
  readonly slot: number | null;
  /**
   * Section 4.4: a queued Save "must close shell/resume or be cancellable".
   * A request that is neither is the illegal state assertion 11 catches.
   */
  readonly cancellable: boolean;
}

/* -------------------------------------------------------------------------
 * 4.1, verbatim: the coordinator's own interface
 * ---------------------------------------------------------------------- */

export interface RuntimeCoordinator {
  root: RootOperation;
  inputMode: InputMode;
  checkpoint(): StableCheckpoint | null;
  request(intent: PlayerIntent | ShellIntent): IntentResult;
  finish(reason: FinishReason): void;
}

/** The one shared value in this file: the root nothing is happening under. */
export const STABLE_ROOT: RootOperation = { kind: 'stable' };

/** freeWalk and stable are not atomic. The other four are. */
export function isAtomicRoot(kind: RootKind): boolean {
  return kind === 'dialogue' || kind === 'action' || kind === 'transition' || kind === 'cutscene';
}
