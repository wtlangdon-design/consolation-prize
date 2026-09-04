import type { Condition, FlagAdds, FlagsFile, FlagValue, FlagWrites, NumericTest } from './types.ts';

/**
 * Flat key-value state: booleans and integers. Dialogue gates, hotspot
 * variants and puzzle state all read from this one store, and it is also
 * the entire save file.
 */
export class FlagStore {
  private values = new Map<string, FlagValue>();
  private readonly definitions = new Map<string, FlagsFile['flags'][number]>();

  constructor(file: FlagsFile) {
    for (const def of file.flags) {
      this.definitions.set(def.id, def);
    }
    this.reset();
  }

  reset(): void {
    this.values.clear();
    for (const [id, def] of this.definitions) {
      this.values.set(id, def.initial);
    }
  }

  isDefined(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Every flag id the registry declares.
   *
   * The gauntlet's `flags` control refuses anything not in here, which is what
   * keeps it a NARROW control rather than a general state setter: an id no
   * content gates on cannot put the game into a state a player could reach, so
   * writing one would produce a panel of a state that does not exist.
   */
  declaredIds(): string[] {
    return [...this.definitions.keys()];
  }

  /** The ids currently true. Identifiers, for the probe. Never content. */
  trueIds(): string[] {
    return [...this.values.entries()].filter(([, value]) => value === true).map(([id]) => id);
  }

  get(id: string): FlagValue {
    const value = this.values.get(id);
    if (value === undefined) {
      throw new Error(`Undefined flag read: ${id}`);
    }
    return value;
  }

  getBoolean(id: string): boolean {
    return this.get(id) === true;
  }

  getNumber(id: string): number {
    const value = this.get(id);
    return typeof value === 'number' ? value : 0;
  }

  set(id: string, value: FlagValue): void {
    if (!this.definitions.has(id)) {
      throw new Error(`Undefined flag write: ${id}`);
    }
    this.values.set(id, value);
  }

  applyWrites(writes?: FlagWrites): void {
    if (!writes) return;
    for (const [id, value] of Object.entries(writes)) {
      this.set(id, value);
    }
  }

  applyAdds(adds?: FlagAdds): void {
    if (!adds) return;
    for (const [id, delta] of Object.entries(adds)) {
      this.set(id, this.getNumber(id) + delta);
    }
  }

  /** Every key must pass. An absent or empty condition holds. */
  test(condition?: Condition): boolean {
    if (!condition) return true;
    for (const [id, expected] of Object.entries(condition)) {
      if (!this.testOne(id, expected)) return false;
    }
    return true;
  }

  private testOne(id: string, expected: Condition[string]): boolean {
    const actual = this.get(id);
    if (typeof expected === 'boolean') return actual === expected;
    if (typeof expected === 'number') return actual === expected;
    return this.testNumeric(typeof actual === 'number' ? actual : 0, expected);
  }

  private testNumeric(actual: number, test: NumericTest): boolean {
    if (test.atLeast !== undefined && actual < test.atLeast) return false;
    if (test.atMost !== undefined && actual > test.atMost) return false;
    if (test.equals !== undefined && actual !== test.equals) return false;
    return true;
  }

  snapshot(): Record<string, FlagValue> {
    return Object.fromEntries(this.values);
  }

  /**
   * Restores a snapshot. Flags absent from the snapshot fall back to their
   * declared initial value, so a save written before a flag existed still
   * loads cleanly. Unknown keys are dropped rather than trusted.
   */
  restore(snapshot: Record<string, FlagValue>): void {
    this.reset();
    for (const [id, value] of Object.entries(snapshot)) {
      if (this.definitions.has(id)) {
        this.values.set(id, value);
      }
    }
  }
}
