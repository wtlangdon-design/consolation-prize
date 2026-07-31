import type {
  CombinationsFile, Interactable, ResponseRule, VerbFallbacksFile, VerbsFile,
} from './types.ts';
import type { FlagStore } from './FlagStore.ts';

export interface ResolvedAction {
  say: string | null;
  dialogue: string | null;
  goto: string | null;
  /** Doc 22 item 9: the state this response moves the object to. */
  state?: string;
  /** Ownership passes to the actor. */
  take?: boolean;
}

/**
 * Selected verb + clicked target -> action lookup.
 *
 * An unhandled combination draws from the target's own fallback pool rather
 * than a shared refusal line, per the technical spec. The pool rotates so a
 * repeated combination does not repeat the same line.
 */
export class VerbSystem {
  private readonly verbLabels = new Map<string, string>();
  private fallbackCursor = new Map<string, number>();
  private repeatCursor = new Map<string, number>();
  private selected: string | null;
  private poolCursor = new Map<string, number>();
  private readonly file: VerbsFile;
  private readonly flags: FlagStore;
  private readonly pools: Record<string, string[]>;
  private readonly combinations: CombinationsFile | undefined;

  constructor(
    file: VerbsFile, flags: FlagStore, fallbacks?: VerbFallbacksFile,
    combinations?: CombinationsFile,
  ) {
    this.file = file;
    this.flags = flags;
    this.pools = fallbacks?.pools ?? {};
    this.combinations = combinations;
    for (const verb of file.verbs) {
      this.verbLabels.set(verb.id, verb.label);
    }
    this.verbLabels.set(file.walkVerb.id, file.walkVerb.label);
    // ERRATA 28b: nothing is selected until the player selects something.
    // With a verb always pre-selected there is no "no verb" state, and the
    // ruling's third row -- left click on an object with no verb selected
    // fires the object's own defaultVerb -- could never happen.
    this.selected = null;
  }

  get verbs(): VerbsFile['verbs'] {
    return this.file.verbs;
  }

  get grid(): VerbsFile['grid'] {
    return this.file.grid;
  }

  get selectedVerb(): string | null {
    return this.selected;
  }

  /**
   * The verb a click on this target performs. Errata 28b's table, in one
   * function so the scene cannot implement half of it.
   *
   * `secondary` is the right button: the object's own default, whatever is
   * selected. Otherwise the selection wins, and with nothing selected the
   * object's default answers -- falling back to the verbs file's default for
   * an object that has not declared one, which check-default-verbs reports.
   */
  verbFor(target: Interactable | undefined, secondary = false): string {
    const fallback = target?.defaultVerb ?? this.file.defaultVerb;
    if (secondary) return fallback;
    return this.selected ?? fallback;
  }

  get walkVerbId(): string {
    return this.file.walkVerb.id;
  }

  /** True if this verb goes through a doorway rather than asking about one. */
  isTransit(verbId: string): boolean {
    return (this.file.transitVerbs ?? [this.file.walkVerb.id]).includes(verbId);
  }

  /**
   * True if this verb asks a question about an inventory item rather than
   * picking it up to use. LOOK and LISTEN are the two, and they are named in
   * content because everything else about a verb is.
   */
  examines(verbId: string): boolean {
    return (this.file.examineVerbs ?? []).includes(verbId);
  }

  /**
   * A verb applied WITH an item TO a target. Doc 24's three tiers, resolved
   * most specific first.
   *
   *   1. the authored pair for this item on this target;
   *   2. this item's own pool, rotating;
   *   3. the global pool, rotating.
   *
   * It deliberately never reaches the TARGET's own override. "On what." is
   * written as the answer to USE THE MUD and it is not the answer to USE THE
   * TUNING FORK ON THE MUD -- a held item makes a different sentence, so it
   * gets a different table.
   *
   * RULE 4. A pair that exists with no written line returns NOTHING rather
   * than falling to a pool. Doc 24 note 4: a combination that should do
   * something and has none is reported as unwritten, and a pool line standing
   * in for it is a gap that reads as content. check-combinations fails the
   * build on one, so this branch should be unreachable in a shipped build --
   * it is here so that if it ever is reached, it is obvious.
   */
  resolveWith(
    _verbId: string, itemId: string, target: Interactable, roomId: string,
  ): ResolvedAction {
    const table = this.combinations;
    const pair = table?.pairs.find(
      (candidate) => candidate.item === itemId
        && candidate.room === roomId
        && candidate.target === target.id,
    );
    if (pair) {
      this.flags.applyWrites(pair.set);
      return { say: pair.say ?? null, dialogue: null, goto: null, state: pair.setState };
    }
    const own = table?.itemPools[itemId];
    if (own?.length) return { say: this.rotate(`item:${itemId}`, own), dialogue: null, goto: null };
    const global = table?.globalPool ?? [];
    if (global.length) return { say: this.rotate('combination', global), dialogue: null, goto: null };
    return { say: null, dialogue: null, goto: null };
  }

  /**
   * The next line of a pool, in order, wrapping.
   *
   * Order rather than random, which is doc 13's rule for the verb pools and
   * doc 24's for the item pools: it gives never-repeat-consecutively for free
   * and it is deterministic, so a save and a test see the same sequence.
   */
  private rotate(key: string, pool: string[]): string | null {
    const cursor = this.poolCursor.get(key) ?? 0;
    this.poolCursor.set(key, cursor + 1);
    return pool[cursor % pool.length] ?? null;
  }

  selectVerb(id: string): void {
    if (!this.verbLabels.has(id)) {
      throw new Error(`Unknown verb: ${id}`);
    }
    this.selected = id;
  }

  /** Back to nothing selected. A verb otherwise persists until changed. */
  resetToDefault(): void {
    this.selected = null;
  }

  labelFor(verbId: string): string {
    const label = this.verbLabels.get(verbId);
    if (label === undefined) {
      throw new Error(`Unknown verb: ${verbId}`);
    }
    return label;
  }

  resolve(verbId: string, target: Interactable): ResolvedAction {
    const rules = target.responses?.[verbId];
    const index = rules?.findIndex((rule: ResponseRule) => this.flags.test(rule.when)) ?? -1;
    const matched = index >= 0 ? rules?.[index] : undefined;

    if (matched) {
      this.flags.applyWrites(matched.set);
      this.flags.applyAdds(matched.add);
      return {
        say: this.nextLine(`${target.id}#${index}`, verbId, matched),
        dialogue: matched.dialogue ?? null,
        goto: matched.goto ?? null,
        state: matched.setState,
        take: matched.take,
      };
    }

    // Nothing written for this combination. Three sources, most specific
    // first. Doc 13 note 4: an object override fires the same line every
    // time; a pool rotates. Two different behaviours, both deliberate.
    const override = target.overrides?.[verbId];
    if (override) {
      return { say: override, dialogue: null, goto: null };
    }
    return {
      say: this.nextFallback(target) ?? this.nextFromPool(verbId),
      dialogue: null,
      goto: null,
    };
  }

  /**
   * The line for this selection: the written one first, then the repeat
   * variants in order, then back round. Doc 05 is explicit that Room 2 needs
   * three minimum, because it is the screen the player reads most.
   */
  private nextLine(targetId: string, verbId: string, rule: ResponseRule): string | null {
    // targetId carries the matched RULE INDEX, so a ruling 19a state change
    // gets its own cursor. Keyed on the target alone, looking at the letter
    // twice before Pike dies and once after handed the player the third
    // after-state line first -- the quiet one about his father, out of order
    // and as a punchline.
    const variants = [rule.say, ...(rule.repeat ?? [])].filter(
      (line): line is string => typeof line === 'string',
    );
    if (variants.length === 0) return null;
    const key = `${targetId}:${verbId}`;
    const cursor = this.repeatCursor.get(key) ?? 0;
    this.repeatCursor.set(key, cursor + 1);
    return variants[Math.min(cursor, variants.length - 1)] ?? null;
  }

  /**
   * Global pool for a verb, rotated in order so a line never follows itself.
   * Order rather than random: repeat-avoidance for free, and deterministic.
   */
  private nextFromPool(verbId: string): string | null {
    const pool = this.pools[verbId];
    if (!pool || pool.length === 0) return null;
    return this.rotate(verbId, pool);
  }

  private nextFallback(target: Interactable): string | null {
    const pool = target.fallback;
    if (!pool || pool.length === 0) return null;
    const cursor = this.fallbackCursor.get(target.id) ?? 0;
    this.fallbackCursor.set(target.id, cursor + 1);
    return pool[cursor % pool.length] ?? null;
  }
}
