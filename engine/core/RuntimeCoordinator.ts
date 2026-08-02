import {
  assertCaptureStable,
  assertCheckpointStable,
  assertCommittedTransitionSurvives,
  assertDialogueDrained,
  assertDisposeAtSwap,
  assertHandlesFinished,
  assertLiveUnchanged,
  assertNotSaveArbitrated,
  assertQueuedSaveLive,
  assertRootExclusive,
  assertTransitionAutosaveReason,
  assertBodyUnowned,
} from './Assertions.ts';
import { Clocks } from './Clocks.ts';
import { EffectOwnership, TransactionJournal } from './TransactionJournal.ts';
import {
  isAtomicRoot,
  STABLE_ROOT,
  type AutosaveReason,
  type ChoreHandle,
  type DialogueTransaction,
  type FinishOrigin,
  type FinishReason,
  type InputLayer,
  type InputMode,
  type IntentResult,
  type PlayerIntent,
  type QueuedSaveRequest,
  type RootOperation,
  type RuntimeCoordinator as RuntimeCoordinatorContract,
  type RuntimeParticipant,
  type SaveGate,
  type ShellIntent,
  type StableCheckpoint,
  type StableReason,
} from './runtime-types.ts';

/**
 * The one cross-system owner. Doc 34 section 10's directive, in full:
 *
 *   "First implement one cross-system RuntimeCoordinator and make it the only
 *    owner of root operation, input mode, transaction phase and stable-
 *    checkpoint publication."
 *
 * Section 4.2 divides the rest of the world up around it. AnimationController
 * owns body and prop playback and emits markers. SpeechController owns one
 * utterance channel. A dialogue tree owns its counts and node movement.
 * SaveCoordinator is the only storage writer and observes published
 * checkpoints; it never decides whether anything commits. LoadCoordinator
 * builds a candidate and the live session is disposed only at the swap. None
 * of them is a root, and no scene class may start one.
 *
 * WHAT THIS IS NOT. It is not a god object with the game in it. It holds five
 * things -- which root operation is live, who owns each body, which
 * participants are unstable, one queued save request, and the clocks -- and
 * everything else is injected or lives in the systems that own it. It knows no
 * room, no verb, no flag and no line. `worldHash` and `roomId` are functions
 * the host supplies for exactly that reason.
 *
 * SEAMS LEFT DELIBERATELY OPEN:
 *   B  pureResolution() in Assertions.ts, and reserve() on the journal, are
 *      where pure dialogue/verb resolution lands. Nothing here resolves.
 *   C  ChoreHandle is a shape, not an implementation. addParticipant() takes
 *      one; finishParticipants() routes the reason C has to propagate.
 *   D  SaveGate is one method. publishStable() calls it and never writes
 *      storage itself.
 */
export class RuntimeCoordinator implements RuntimeCoordinatorContract {
  readonly clocks: Clocks;
  readonly ownership = new EffectOwnership();

  private rootOperation: RootOperation = STABLE_ROOT;
  private readonly participants = new Map<string, RuntimeParticipant>();
  private readonly bodyOwners = new Map<string, string>();
  /** Every dialogue transaction this coordinator has hosted, for the drain check. */
  private readonly hostedDialogues: DialogueTransaction[] = [];
  private readonly stableListeners: ((checkpoint: StableCheckpoint) => void)[] = [];

  private queuedSave: QueuedSaveRequest | null = null;
  private speechActive = false;
  private choicesActive = false;
  private disposed = false;
  private revision = 0;

  private readonly worldHash: () => string;
  private readonly roomId: () => string;
  private saveGate: SaveGate | null;

  constructor(options: {
    /** Hash of the live durable world. The coordinator never reads content. */
    worldHash: () => string;
    roomId: () => string;
    clocks?: Clocks;
    saveGate?: SaveGate;
  }) {
    this.worldHash = options.worldHash;
    this.roomId = options.roomId;
    this.clocks = options.clocks ?? new Clocks();
    this.saveGate = options.saveGate ?? null;
  }

  /* --------------------------------------------------------------------
   * Root operation
   * ----------------------------------------------------------------- */

  get root(): RootOperation {
    return this.rootOperation;
  }

  /**
   * Takes the root. Assertion 1 refuses a second atomic one, and assertion 4
   * refuses a transition standing up under an exchange that has not drained.
   *
   * The drain check is here rather than at the threshold because section 4.3
   * is explicit about the shape of the mistake: the dialogue's continuation
   * "requests a transition; it does not start under the last line". By the
   * time the threshold commits it is far too late to unwind.
   */
  begin(operation: RootOperation): void {
    assertRootExclusive(this.rootOperation, operation.kind);
    if (operation.kind === 'transition') assertDialogueDrained(this.undrainedDialogue());
    if (operation.kind === 'dialogue') {
      this.undrainedDialogue();
      this.hostedDialogues.push(operation.tx);
    }
    this.rootOperation = operation;
  }

  /**
   * Section 2.2: "Replace boolean cancel with a reasoned finish(reason) policy
   * routed by the root coordinator."
   *
   * It does NOT set the transaction's own phase. A dialogue transaction
   * settles itself when its echo, reply and post-beat have drained -- that is
   * step B's job and D30's rule -- and a coordinator that stamped `settled` on
   * the way past would make assertion 4 unfireable by construction, which is
   * the same as not having it.
   */
  finish(reason: FinishReason, origin: FinishOrigin = 'runtime'): void {
    assertNotSaveArbitrated(origin);
    const root = this.rootOperation;
    if (root.kind === 'transition') {
      assertCommittedTransitionSurvives(root.tx.committed, reason, origin);
    }
    this.finishParticipants(reason);
    if (root.kind !== 'stable' && root.kind !== 'freeWalk') {
      root.tx.journal.release();
    }
    this.rootOperation = STABLE_ROOT;
    this.speechActive = false;
    this.choicesActive = false;
  }

  /**
   * The tree of the first dialogue transaction still short of `settled`.
   *
   * Drained transactions are dropped as they are found, so a ten-hour session
   * does not accumulate one entry per conversation. Only the undrained ones
   * are evidence of anything.
   */
  private undrainedDialogue(): string | null {
    for (let index = this.hostedDialogues.length - 1; index >= 0; index -= 1) {
      if ((this.hostedDialogues[index] as DialogueTransaction).phase === 'settled') {
        this.hostedDialogues.splice(index, 1);
      }
    }
    return this.hostedDialogues[0]?.tree ?? null;
  }

  /** A journal wired to the one ownership registry. Assertion 2 depends on it. */
  newJournal(transactionId: string): TransactionJournal {
    return new TransactionJournal(transactionId, this.ownership);
  }

  /* --------------------------------------------------------------------
   * Input mode -- the coordinator owns every change to it
   * ----------------------------------------------------------------- */

  get inputMode(): InputMode {
    if (this.disposed) return 'none';
    if (this.clocks.shellOpen) return 'shell';
    if (this.choicesActive) return 'choice';
    if (this.speechActive) return 'speechSkip';
    if (isAtomicRoot(this.rootOperation.kind)) return 'none';
    return 'world';
  }

  beginSpeech(): void {
    this.speechActive = true;
  }

  endSpeech(): void {
    this.speechActive = false;
  }

  setChoices(active: boolean): void {
    this.choicesActive = active;
  }

  openShell(): void {
    this.clocks.openShell();
  }

  /** Closes the shell and resumes the same logical clocks. Section 4.4. */
  closeShell(): void {
    this.clocks.closeShell();
  }

  /* --------------------------------------------------------------------
   * Participants and body ownership
   * ----------------------------------------------------------------- */

  addParticipant(participant: RuntimeParticipant): void {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(id: string): void {
    this.participants.delete(id);
  }

  /** Routes the reason to every participant. Never a boolean cancel. */
  finishParticipants(reason: FinishReason): void {
    for (const participant of this.participants.values()) participant.finish(reason);
  }

  /**
   * Section 4.6 row 5, and doc 34a's note that the REASON is the point: a
   * handle that is merely gone "cannot tell a settle from an abandonment at
   * the disposal boundary". Asserted before the map is cleared, so the
   * evidence still exists when it fires.
   */
  unloadParticipants(): void {
    assertHandlesFinished(this.choreHandles());
    this.participants.clear();
    this.bodyOwners.clear();
  }

  private choreHandles(): ChoreHandle[] {
    const handles: ChoreHandle[] = [];
    for (const participant of this.participants.values()) {
      if (participant.kind === 'chore') handles.push(participant as ChoreHandle);
    }
    return handles;
  }

  /** Assertion 6: one body owner. Prop tracks share its clock and claim nothing. */
  claimBody(actor: string, owner: string): void {
    assertBodyUnowned(actor, owner, this.bodyOwners.get(actor));
    this.bodyOwners.set(actor, owner);
  }

  releaseBody(actor: string, owner: string): void {
    if (this.bodyOwners.get(actor) === owner) this.bodyOwners.delete(actor);
  }

  bodyOwner(actor: string): string | undefined {
    return this.bodyOwners.get(actor);
  }

  /* --------------------------------------------------------------------
   * Stable checkpoints
   * ----------------------------------------------------------------- */

  /**
   * Null while anything is live. Section 4.6 row 3 lists the four kinds of
   * live thing -- path, chore, utterance, uncommitted journal -- and an atomic
   * root is a fifth by definition.
   */
  checkpoint(): StableCheckpoint | null {
    if (this.disposed) return null;
    for (const participant of this.stabilityParticipants()) {
      if (!participant.stable()) return null;
    }
    return this.build('idle');
  }

  /**
   * Publishes a checkpoint and releases the queued save behind it.
   *
   * Section 4.1's flow exactly: publishStable -> releaseQueuedRequest ->
   * verified storage write. This function does not write, does not know what a
   * slot is, and does not decide whether the write succeeded.
   *
   * It builds the checkpoint BEFORE asserting rather than reusing
   * checkpoint(), so that a caller publishing one while a participant is still
   * live actually trips assertion 3 instead of quietly publishing nothing.
   */
  publishStable(reason: StableReason): StableCheckpoint {
    const checkpoint = this.build(reason);
    assertCheckpointStable(checkpoint, this.stabilityParticipants());
    this.revision += 1;
    const published: StableCheckpoint = { ...checkpoint, revision: this.revision };
    for (const listener of this.stableListeners) listener(published);
    if (this.queuedSave && this.saveGate) {
      this.queuedSave = null;
      this.saveGate.releaseQueuedRequest(published);
    }
    return published;
  }

  subscribeStable(listener: (checkpoint: StableCheckpoint) => void): void {
    this.stableListeners.push(listener);
  }

  /** Step D hands its SaveCoordinator in here. */
  attachSaveGate(gate: SaveGate): void {
    this.saveGate = gate;
  }

  private build(reason: StableReason): StableCheckpoint {
    return {
      revision: this.revision,
      roomId: this.roomId(),
      reason,
      stateHash: this.worldHash(),
    };
  }

  /**
   * Every participant, plus a synthetic one standing for an atomic root.
   *
   * An action that has reserved its bundle and emitted nothing has no unstable
   * participant of its own, and a checkpoint taken there would look clean and
   * be a story half told. The root is a participant because it is one.
   */
  private *stabilityParticipants(): Generator<RuntimeParticipant> {
    const root = this.rootOperation;
    if (isAtomicRoot(root.kind) && root.kind !== 'stable' && root.kind !== 'freeWalk') {
      yield {
        id: root.tx.id,
        kind: 'journal',
        stable: () => false,
        finish: () => undefined,
      };
    }
    yield* this.participants.values();
  }

  /* --------------------------------------------------------------------
   * Save and load gates
   * ----------------------------------------------------------------- */

  /**
   * Section 4.4's SAVE row: "Queue one slot request, close shell, resume the
   * paused logical clocks, write at next declared stable checkpoint. Never
   * leave a modal waiting screen that prevents progress."
   *
   * One request, not a queue of them -- G4 says one, and a second Save while
   * one is pending replaces it rather than stacking.
   */
  requestSave(request: QueuedSaveRequest): void {
    this.queuedSave = request;
    this.closeShell();
    this.releaseIfStable();
  }

  get pendingSave(): QueuedSaveRequest | null {
    return this.queuedSave;
  }

  cancelQueuedSave(): void {
    this.queuedSave = null;
  }

  /**
   * Assertion 9. A SaveCoordinator that tries to capture rather than queue
   * lands here, and lands on the floor.
   */
  requestCapture(): StableCheckpoint | null {
    const checkpoint = this.checkpoint();
    assertCaptureStable(checkpoint);
    return checkpoint;
  }

  /** Assertion 10: the only accepted reason is destination-settled ingress. */
  requestTransitionAutosave(reason: AutosaveReason, slot: number | null = null): void {
    assertTransitionAutosaveReason(reason);
    this.requestSave({ slot, cancellable: true });
  }

  private releaseIfStable(): void {
    if (!this.queuedSave) return;
    if (this.checkpoint() === null) return;
    this.publishStable('idle');
  }

  /**
   * Runs a candidate validation and proves it left the live session alone.
   * Assertion 13, and section 9.1's "Load/Restart candidate failure leaves the
   * live hash unchanged".
   */
  validateCandidate<T>(validate: () => T): T {
    const before = this.worldHash();
    const value = validate();
    assertLiveUnchanged(before, this.worldHash());
    return value;
  }

  /** Assertion 18: the live coordinator goes only at the atomic swap. */
  dispose(atSwapBoundary: boolean): void {
    assertDisposeAtSwap(atSwapBoundary);
    this.disposed = true;
    this.participants.clear();
    this.bodyOwners.clear();
    this.rootOperation = STABLE_ROOT;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  /* --------------------------------------------------------------------
   * The tick
   * ----------------------------------------------------------------- */

  /**
   * Advances the clocks and checks the one liveness property. Assertion 11,
   * and section 9.1's menu liveness: "No test can remain paused waiting for
   * itself."
   */
  advance(wallDelta: number): void {
    this.clocks.advance(wallDelta);
    assertQueuedSaveLive(
      this.queuedSave !== null,
      this.clocks.shellOpen,
      this.clocks.gameplayPaused,
      this.queuedSave?.cancellable ?? true,
    );
    this.releaseIfStable();
  }

  /* --------------------------------------------------------------------
   * Intents
   * ----------------------------------------------------------------- */

  /**
   * Section 4.1's `request`. The router decides which LAYER an event belongs
   * to; this decides whether the current mode will take it.
   *
   * A refusal is a result, not an exception. Ordinary world input during a
   * committed transition is a thing players do constantly and G3 says it must
   * not cancel anything -- so it comes back refused with a reason, and the
   * assertion is reserved for engine code that tries to force it anyway.
   */
  request(intent: PlayerIntent | ShellIntent): IntentResult {
    if (this.disposed) return { accepted: false, layer: null, refusal: 'disposed' };
    if (isShellIntent(intent)) return this.shellRequest(intent);
    return this.playerRequest(intent);
  }

  private shellRequest(intent: ShellIntent): IntentResult {
    const layer: InputLayer = 'shell';
    switch (intent.kind) {
      case 'openShell':
        this.openShell();
        return { accepted: true, layer };
      case 'closeShell':
      case 'options':
        this.closeShell();
        return { accepted: true, layer };
      case 'save':
        this.requestSave({ slot: intent.slot, cancellable: intent.cancellable ?? true });
        return { accepted: true, layer, queued: true };
      default:
        // Load, restart, new game and quit are session-replacement commands.
        // Section 4.4 confirms first and abandons at the swap; the coordinator
        // accepts the intent and step D owns what happens next.
        return { accepted: true, layer };
    }
  }

  private playerRequest(intent: PlayerIntent): IntentResult {
    const mode = this.inputMode;
    const layer = layerFor(intent);

    if (mode === 'shell') return { accepted: false, layer: null, refusal: 'wrongMode' };

    if (mode === 'none') {
      const root = this.rootOperation;
      const committed = root.kind === 'transition' && root.tx.committed;
      if (intent.kind === 'skipScene' && this.sceneSkippable()) {
        return { accepted: true, layer: 'speechSkip' };
      }
      return {
        accepted: false,
        layer: null,
        refusal: committed ? 'committedTransition' : 'wrongMode',
      };
    }

    if (mode === 'choice') {
      if (intent.kind === 'choose') return { accepted: true, layer: 'choice' };
      if (intent.kind === 'skipLine') return { accepted: true, layer: 'speechSkip' };
      return { accepted: false, layer: null, refusal: 'wrongMode' };
    }

    if (mode === 'speechSkip') {
      // Section 10.7: the playfield is skip-only during speech. Everything
      // else the player might try is refused, not silently reinterpreted.
      if (intent.kind === 'skipLine') return { accepted: true, layer: 'speechSkip' };
      if (intent.kind === 'skipScene' && this.sceneSkippable()) {
        return { accepted: true, layer: 'speechSkip' };
      }
      return { accepted: false, layer: null, refusal: 'wrongMode' };
    }

    // mode === 'world'
    if (intent.kind === 'choose' || intent.kind === 'skipLine' || intent.kind === 'skipScene') {
      return { accepted: false, layer: null, refusal: 'wrongMode' };
    }
    return { accepted: true, layer };
  }

  /** G6: whole-sequence skip belongs to non-interactive cutscenes only. */
  private sceneSkippable(): boolean {
    const root = this.rootOperation;
    return root.kind === 'cutscene' && root.tx.skippable;
  }
}

const SHELL_KINDS: readonly string[] = [
  'openShell', 'closeShell', 'save', 'load', 'restart', 'newGame', 'quitToTitle', 'options',
];

function isShellIntent(intent: PlayerIntent | ShellIntent): intent is ShellIntent {
  return SHELL_KINDS.includes(intent.kind);
}

/** Which layer an intent belongs to, for the one-consumer accounting. */
function layerFor(intent: PlayerIntent): InputLayer {
  switch (intent.kind) {
    case 'choose':
      return 'choice';
    case 'skipLine':
    case 'skipScene':
      return 'speechSkip';
    case 'selectVerb':
    case 'holdItem':
      return 'panel';
    default:
      return 'world';
  }
}
