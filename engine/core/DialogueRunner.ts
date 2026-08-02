import type { DialogueFile, DialogueNode, DialogueOption } from './types.ts';
import type { FlagStore } from './FlagStore.ts';
import { pureResolution } from './Assertions.ts';
import { commitBundle, flagEffects, localJournals, type DurableWorld, type JournalSource } from './Commit.ts';
import type { DialogueTransaction, DurableEffect, FinishReason } from './runtime-types.ts';

/** An option as the UI should draw it: still visible once exhausted. */
export interface PresentedOption {
  option: DialogueOption;
  exhausted: boolean;
}

export interface SelectionResult {
  /** Response line to show, or null if the option had none. */
  say: string | null;
  /**
   * The remaining lines of a multi-speaker response, in order, when the
   * option carries an exchange rather than a single line. `say` is the first
   * of them; these are shown one at a time after it.
   */
  rest: { speaker: string; line: string }[];
  /** True once the conversation has closed. */
  ended: boolean;
}

/**
 * What selecting an option WOULD do. Produced without touching anything.
 *
 * Doc 34 section 1.2's first defect: "Dialogue option selection immediately
 * writes flags/additions and may end/change node." Everything that used to
 * happen inside select() is described here instead, and none of it has
 * happened yet.
 */
export interface DialogueResolution {
  readonly optionId: string;
  readonly tree: string;
  readonly node: string;
  /** The lines to perform: Thad's echo is the caller's, these are the reply. */
  readonly presentation: SelectionResult;
  /** Where the node moves once the exchange drains, or null to stay put. */
  readonly goto: string | null;
  /** True for an EXIT option: the tree closes after the drain, not before. */
  readonly ends: boolean;
  /** Dialogue counts and flag writes, reserved rather than applied. */
  readonly effects: readonly DurableEffect[];
}

/** Serialised exhaustion state, so a save restores partial trees exactly. */
export type DialogueProgress = Record<string, string[]>;

const EXIT_TAG = 'EXIT';
//: Errata 37: the one tag that is removed once taken rather than greyed.
const SPENT_TAG = 'PROGRESS';

/**
 * One selection, from reservation to settle.
 *
 * Doc 30 section 6.2, which errata 45 adopts: "State writes may be reserved
 * immediately in a DialogueTransaction, but the node must not visibly advance
 * and EXIT must not hand control to the next sequence until the echo, reply,
 * and post-beat finish. This prevents the coach from starting to depart under
 * 'Wasn't for you.'"
 *
 * So the constructor reserves and the phases advance as the presentation
 * plays. `settle()` is the only thing here that changes the world, and it is
 * the last thing that happens.
 */
export class DialogueExchange {
  readonly tx: DialogueTransaction;
  readonly resolution: DialogueResolution;

  private readonly runner: DialogueRunner;
  private finished: FinishReason | null = null;

  constructor(runner: DialogueRunner, resolution: DialogueResolution, tx: DialogueTransaction) {
    this.runner = runner;
    this.resolution = resolution;
    this.tx = tx;
  }

  get presentation(): SelectionResult {
    return this.resolution.presentation;
  }

  get settled(): boolean {
    return this.tx.phase === 'settled';
  }

  /**
   * Records how far the performance has got. Section 9.1's trace wants the
   * line phases in it, and D30's drain is echo, then reply, then post-beat.
   *
   * `echo` marks `line` because Thad's echo is the first utterance of the
   * exchange -- errata 45's first correction is that the selection is spoken
   * over his head before the reply, and that is where the line phase starts.
   */
  advance(phase: 'echo' | 'reply' | 'postBeat'): void {
    if (this.settled) throw new Error(`Exchange already settled: ${this.tx.id}`);
    if (phase === 'echo' && !this.tx.journal.has('line')) this.tx.journal.mark('line');
    if (phase === 'postBeat' && !this.tx.journal.has('lineSettle')) {
      if (!this.tx.journal.has('line')) this.tx.journal.mark('line');
      this.tx.journal.mark('lineSettle');
    }
    this.tx.phase = phase;
  }

  /**
   * The drain is over. Applies the reserved bundle in journal-phase order,
   * then moves the node or closes the tree.
   *
   * Writes before node movement, because doc 30 section 11 step 4 puts them
   * in that order: "After the queue drains, apply or finalize state writes
   * exactly once. If EXIT, end the tree and invoke its continuation now;
   * otherwise move to goto/current node."
   */
  settle(): void {
    if (this.settled) return;
    this.advance('postBeat');
    this.runner.applyExchange(this);
    this.tx.phase = 'settled';
    this.tx.counts = {
      node: this.runner.positionSnapshot().node,
      taken: this.runner.takenIn(this.resolution.tree),
    };
    this.tx.journal.mark('stable');
    this.tx.journal.release();
    this.finished = 'settled';
  }

  /**
   * Drops the exchange without applying it, and hands its effect ids back.
   *
   * A load or a restart abandons the whole unsaved live session -- doc 34
   * section 4.4's LOAD/RESTART row -- and an exchange that merely vanished
   * would keep its ids claimed and make the next identical selection fire
   * assertion 2 for no reason.
   */
  abandon(reason: FinishReason): void {
    if (this.settled || this.finished !== null) return;
    this.runner.dropPending(this);
    this.tx.journal.release();
    this.finished = reason;
  }

  finishedWith(): FinishReason | null {
    return this.finished;
  }
}

/**
 * Reads trees from JSON, evaluates gates against the flag store, RESOLVES a
 * selection without applying it, and tracks exhaustion. Exhausted options are
 * never removed -- they grey out, stay selectable, and answer differently.
 *
 * ERRATA 45 IS NOT DONE HERE. `DialogueOption.repeat` is one string where doc
 * 04's Winnie tree needs five, so the middle three of that arc are
 * unrepresentable. That is errata 45's work and step B leaves the shape
 * exactly as it found it: this class moved WHEN the repeat line is chosen,
 * never WHICH one.
 */
export class DialogueRunner {
  private readonly trees: Map<string, DialogueFile>;
  /** treeId -> set of taken option keys, formatted `${nodeId}:${optionId}`. */
  private taken = new Map<string, Set<string>>();
  private activeTree: DialogueFile | null = null;
  private activeNodeId: string | null = null;
  private readonly flags: FlagStore;
  private readonly journals: JournalSource;
  private pending: DialogueExchange | null = null;
  private serial = 0;

  constructor(trees: Map<string, DialogueFile>, flags: FlagStore, journals?: JournalSource) {
    this.trees = trees;
    this.flags = flags;
    this.journals = journals ?? localJournals();
  }

  get isActive(): boolean {
    return this.activeTree !== null;
  }

  start(treeId: string): void {
    const tree = this.trees.get(treeId);
    if (!tree) {
      throw new Error(`Unknown dialogue tree: ${treeId}`);
    }
    this.activeTree = tree;
    this.activeNodeId = tree.start;
  }

  end(): void {
    // A conversation closed from outside still owes its last selection: the
    // writes were reserved and the player has seen the reply. Settling here
    // rather than abandoning keeps `end()` what it has always been -- the way
    // out of a tree, not a way to lose a commit.
    this.pending?.settle();
    this.pending = null;
    this.activeTree = null;
    this.activeNodeId = null;
  }

  get currentNode(): DialogueNode | null {
    if (!this.activeTree || !this.activeNodeId) return null;
    return this.activeTree.nodes[this.activeNodeId] ?? null;
  }

  /** The selection that has been reserved and not yet drained, if any. */
  get pendingExchange(): DialogueExchange | null {
    return this.pending;
  }

  /** Options whose gate currently holds, in authored order. */
  /**
   * ERRATA 37. An exhausted [PROGRESS] option is REMOVED; every other tag
   * stays, greys, and remains selectable.
   *
   * The two behaviours are both right and they are right for different
   * options. A progress question has been answered and leaving it in the
   * list invites the player to ask it again. A topic or comic option's
   * REPEAT RESPONSES ARE WRITTEN CONTENT -- doc 04's Winnie tree turns on
   * asking her about the raccoon five times until she cracks, and removing
   * exhausted options would delete that arc without a word.
   *
   * EXIT is never removed. It carries no tag exemption of its own here
   * because it is not PROGRESS, but the guarantee is worth stating: the way
   * out of a tree cannot be consumed, and a node whose every option has been
   * taken still lists it.
   *
   * It reads committed state only. An option reserved and not yet drained is
   * not yet taken, which is doc 30's "the node must not visibly advance"
   * applied to the list as well as to the node.
   */
  presentOptions(): PresentedOption[] {
    const node = this.currentNode;
    if (!node || !this.activeTree) return [];
    const treeId = this.activeTree.id;
    const nodeId = this.activeNodeId as string;
    return node.options
      .filter((option) => this.flags.test(option.when))
      .map((option) => ({
        option,
        exhausted: this.hasTaken(treeId, nodeId, option.id),
      }))
      .filter((presented) => !(presented.exhausted && presented.option.tag === SPENT_TAG));
  }

  /**
   * What this option would say and would write. Changes nothing.
   *
   * Wrapped in pureResolution, so the guard doc 34 section 4.6 row 7 asks for
   * -- "deep state snapshot equal before/after resolve" -- runs against the
   * real trees on every selection in a dev build rather than only in a test.
   */
  resolveSelection(optionId: string): DialogueResolution {
    return pureResolution(() => this.signature(), () => this.resolvePure(optionId));
  }

  private resolvePure(optionId: string): DialogueResolution {
    const node = this.currentNode;
    if (!node || !this.activeTree || !this.activeNodeId) {
      throw new Error(`Selection with no active node: ${optionId}`);
    }
    const option = node.options.find((candidate) => candidate.id === optionId);
    if (!option) {
      throw new Error(`Unknown option: ${optionId}`);
    }
    if (!this.flags.test(option.when)) {
      throw new Error(`Gated option selected: ${optionId}`);
    }

    const treeId = this.activeTree.id;
    const nodeId = this.activeNodeId;
    const firstTime = !this.hasTaken(treeId, nodeId, option.id);
    // An exchange only plays out in full the first time. On a repeat the
    // option answers with its `repeat` line if it has one, and otherwise with
    // the exchange again -- exhausted options stay selectable and must always
    // answer with something.
    const exchange = option.exchange ?? [];
    let say: string | null;
    let rest: { speaker: string; line: string }[] = [];
    if (!firstTime && option.repeat) {
      say = option.repeat;
    } else if (exchange.length > 0) {
      say = exchange[0]!.line;
      rest = exchange.slice(1);
    } else {
      say = option.say ?? null;
    }

    const ends = option.tag === EXIT_TAG;
    const goto = !ends && option.goto ? option.goto : null;
    if (goto && !this.activeTree.nodes[goto]) {
      throw new Error(`Unknown goto target: ${goto}`);
    }

    // State changes apply on every selection, not only the first, so a
    // counter-style option keeps counting.
    const prefix = `dlg/${treeId}/${nodeId}/${option.id}`;
    const effects: DurableEffect[] = [
      { id: `${prefix}#taken`, kind: 'dialogueTaken', tree: treeId, node: nodeId, option: option.id },
      ...flagEffects(prefix, option.set, option.add),
    ];

    return {
      optionId: option.id,
      tree: treeId,
      node: nodeId,
      presentation: { say, rest, ended: ends },
      goto,
      ends,
      effects,
    };
  }

  /**
   * Resolves, reserves, and hands back the live exchange. Nothing durable has
   * happened when this returns.
   *
   * THE SEAM FOR STEP E. A caller that presents the echo, the reply and the
   * post-beat over time calls advance() as it goes and settle() when the queue
   * drains; select() below is the same thing with the drain collapsed to
   * nothing, for the callers that still present synchronously.
   */
  beginSelection(optionId: string): DialogueExchange {
    if (this.pending && !this.pending.settled) {
      throw new Error(`Exchange still open: ${this.pending.tx.id}`);
    }
    const resolution = this.resolveSelection(optionId);
    this.serial += 1;
    const id = `dlg:${resolution.tree}:${resolution.node}:${resolution.optionId}#${this.serial}`;
    const journal = this.journals.newJournal(id);
    const tx: DialogueTransaction = {
      id,
      tree: resolution.tree,
      phase: 'reserved',
      effects: journal.reserve(`${id}/bundle`, resolution.effects),
      journal,
    };
    const exchange = new DialogueExchange(this, resolution, tx);
    this.pending = exchange;
    return exchange;
  }

  /**
   * Selects an option and drains it immediately.
   *
   * The synchronous callers -- the scene's dialogue click, and the tests that
   * drive a tree without a screen -- present the reply the instant they are
   * handed it, so their drain is empty and the settle follows in the same
   * call. What changed underneath them is the ORDER: resolution no longer
   * writes, the writes are reserved, and they land after the line phase in
   * section 9.1's order rather than before it.
   */
  select(optionId: string): SelectionResult {
    const exchange = this.beginSelection(optionId);
    exchange.advance('echo');
    exchange.advance('reply');
    exchange.settle();
    return exchange.presentation;
  }

  /**
   * Applies a settled exchange. Called by DialogueExchange.settle() and by
   * nothing else.
   *
   * The world it commits into refuses five of the seven durable effects. Doc
   * 34 section 4.2: "A dialogue tree transaction owns dialogue counts/node
   * movement", and G1's collision -- "a puzzle response presented as dialogue
   * would have two commit owners" -- is exactly what a tree quietly writing
   * inventory would be.
   */
  applyExchange(exchange: DialogueExchange): void {
    this.dropPending(exchange);
    commitBundle(exchange.tx.effects, this.dialogueWorld(), exchange.tx.journal);

    const { resolution } = exchange;
    if (resolution.ends) {
      this.activeTree = null;
      this.activeNodeId = null;
      return;
    }
    if (resolution.goto) this.activeNodeId = resolution.goto;
  }

  /** Forgets an exchange, settled or abandoned. Called by the exchange itself. */
  dropPending(exchange: DialogueExchange): void {
    if (this.pending === exchange) this.pending = null;
  }

  private dialogueWorld(): DurableWorld {
    const refuse = (kind: string) => (): never => {
      throw new Error(`Dialogue may not write ${kind}`);
    };
    return {
      setFlag: (flag, value) => { this.flags.set(flag, value); },
      addFlag: (flag, delta) => { this.flags.set(flag, this.flags.getNumber(flag) + delta); },
      markDialogueTaken: (tree, node, option) => { this.markTaken(tree, node, option); },
      setObjectState: refuse('object state'),
      addInventory: refuse('inventory'),
      removeInventory: refuse('inventory'),
      enterRoom: refuse('the room'),
    };
  }

  /**
   * The deep snapshot assertion 7 compares. Flags, position and counts -- the
   * three things a tree can change and the three things its save carries.
   */
  private signature(): string {
    return JSON.stringify({
      flags: this.flags.snapshot(),
      tree: this.activeTree?.id ?? null,
      node: this.activeNodeId,
      taken: this.progressSnapshot(),
    });
  }

  private hasTaken(treeId: string, nodeId: string, optionId: string): boolean {
    return this.taken.get(treeId)?.has(`${nodeId}:${optionId}`) ?? false;
  }

  private markTaken(treeId: string, nodeId: string, optionId: string): void {
    let set = this.taken.get(treeId);
    if (!set) {
      set = new Set<string>();
      this.taken.set(treeId, set);
    }
    set.add(`${nodeId}:${optionId}`);
  }

  /** The committed option keys for one tree. DialogueTransaction.counts. */
  takenIn(treeId: string): readonly string[] {
    return [...(this.taken.get(treeId) ?? [])].sort();
  }

  /** Where the conversation currently sits, for the save file. */
  positionSnapshot(): { tree: string | null; node: string | null } {
    return { tree: this.activeTree?.id ?? null, node: this.activeNodeId };
  }

  progressSnapshot(): DialogueProgress {
    const out: DialogueProgress = {};
    for (const [treeId, set] of this.taken) {
      out[treeId] = [...set].sort();
    }
    return out;
  }

  restore(progress: DialogueProgress, position: { tree: string | null; node: string | null }): void {
    // A load abandons the unsaved live session whole. An exchange reserved
    // against the world being replaced is part of what is abandoned.
    this.pending?.abandon('sessionAbandoned');
    this.pending = null;
    this.taken = new Map();
    for (const [treeId, keys] of Object.entries(progress)) {
      if (this.trees.has(treeId)) {
        this.taken.set(treeId, new Set(keys));
      }
    }
    this.activeTree = position.tree ? (this.trees.get(position.tree) ?? null) : null;
    this.activeNodeId =
      this.activeTree && position.node && this.activeTree.nodes[position.node] ? position.node : null;
    if (this.activeTree && !this.activeNodeId) {
      this.activeTree = null;
    }
  }
}
