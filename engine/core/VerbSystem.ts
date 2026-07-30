import type { Interactable, ResponseRule, VerbFallbacksFile, VerbsFile } from './types.ts';
import type { FlagStore } from './FlagStore.ts';

export interface ResolvedAction {
  say: string | null;
  dialogue: string | null;
  goto: string | null;
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
  private selected: string;
  private poolCursor = new Map<string, number>();
  private readonly file: VerbsFile;
  private readonly flags: FlagStore;
  private readonly pools: Record<string, string[]>;

  constructor(file: VerbsFile, flags: FlagStore, fallbacks?: VerbFallbacksFile) {
    this.file = file;
    this.flags = flags;
    this.pools = fallbacks?.pools ?? {};
    for (const verb of file.verbs) {
      this.verbLabels.set(verb.id, verb.label);
    }
    this.verbLabels.set(file.walkVerb.id, file.walkVerb.label);
    this.selected = file.defaultVerb;
  }

  get verbs(): VerbsFile['verbs'] {
    return this.file.verbs;
  }

  get grid(): VerbsFile['grid'] {
    return this.file.grid;
  }

  get selectedVerb(): string {
    return this.selected;
  }

  get walkVerbId(): string {
    return this.file.walkVerb.id;
  }

  selectVerb(id: string): void {
    if (!this.verbLabels.has(id)) {
      throw new Error(`Unknown verb: ${id}`);
    }
    this.selected = id;
  }

  resetToDefault(): void {
    this.selected = this.file.defaultVerb;
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
    const matched = rules?.find((rule: ResponseRule) => this.flags.test(rule.when));

    if (matched) {
      this.flags.applyWrites(matched.set);
      this.flags.applyAdds(matched.add);
      return {
        say: this.nextLine(target.id, verbId, matched),
        dialogue: matched.dialogue ?? null,
        goto: matched.goto ?? null,
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
    const cursor = this.poolCursor.get(verbId) ?? 0;
    this.poolCursor.set(verbId, cursor + 1);
    return pool[cursor % pool.length] ?? null;
  }

  private nextFallback(target: Interactable): string | null {
    const pool = target.fallback;
    if (!pool || pool.length === 0) return null;
    const cursor = this.fallbackCursor.get(target.id) ?? 0;
    this.fallbackCursor.set(target.id, cursor + 1);
    return pool[cursor % pool.length] ?? null;
  }
}
