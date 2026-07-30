import type { DialogueFile, DialogueNode, DialogueOption } from './types.ts';
import type { FlagStore } from './FlagStore.ts';

/** An option as the UI should draw it: still visible once exhausted. */
export interface PresentedOption {
  option: DialogueOption;
  exhausted: boolean;
}

export interface SelectionResult {
  /** Response line to show, or null if the option had none. */
  say: string | null;
  /** True once the conversation has closed. */
  ended: boolean;
}

/** Serialised exhaustion state, so a save restores partial trees exactly. */
export type DialogueProgress = Record<string, string[]>;

const EXIT_TAG = 'EXIT';

/**
 * Reads trees from JSON, evaluates gates against the flag store, applies
 * state changes on selection, and tracks exhaustion. Exhausted options are
 * never removed -- they grey out, stay selectable, and answer differently.
 */
export class DialogueRunner {
  private readonly trees: Map<string, DialogueFile>;
  /** treeId -> set of taken option keys, formatted `${nodeId}:${optionId}`. */
  private taken = new Map<string, Set<string>>();
  private activeTree: DialogueFile | null = null;
  private activeNodeId: string | null = null;
  private readonly flags: FlagStore;

  constructor(trees: Map<string, DialogueFile>, flags: FlagStore) {
    this.trees = trees;
    this.flags = flags;
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
    this.activeTree = null;
    this.activeNodeId = null;
  }

  get currentNode(): DialogueNode | null {
    if (!this.activeTree || !this.activeNodeId) return null;
    return this.activeTree.nodes[this.activeNodeId] ?? null;
  }

  /** Options whose gate currently holds, in authored order. */
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
      }));
  }

  select(optionId: string): SelectionResult {
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

    const firstTime = !this.hasTaken(this.activeTree.id, this.activeNodeId, option.id);
    const say = firstTime ? (option.say ?? null) : (option.repeat ?? option.say ?? null);

    this.markTaken(this.activeTree.id, this.activeNodeId, option.id);

    // State changes apply on every selection, not only the first, so a
    // counter-style option keeps counting.
    this.flags.applyWrites(option.set);
    this.flags.applyAdds(option.add);

    if (option.tag === EXIT_TAG) {
      this.end();
      return { say, ended: true };
    }

    if (option.goto) {
      if (!this.activeTree.nodes[option.goto]) {
        throw new Error(`Unknown goto target: ${option.goto}`);
      }
      this.activeNodeId = option.goto;
    }

    return { say, ended: false };
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
