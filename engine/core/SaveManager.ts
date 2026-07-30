import type { FlagValue } from './types.ts';
import type { DialogueProgress } from './DialogueRunner.ts';

export const SAVE_KEY = 'consolation.save.v1';
export const SAVE_VERSION = 1;

export interface SaveFile {
  version: number;
  room: string;
  inventory: string[];
  reputation: number;
  flags: Record<string, FlagValue>;
  dialogueProgress: DialogueProgress;
  dialoguePosition: { tree: string | null; node: string | null };
}

/** The subset of the Web Storage API the save system uses. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory storage, so save/load is testable without a browser. */
export class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

/**
 * Serialises the flag store, current room, inventory, reputation and
 * dialogue state. That is the whole save -- it falls straight out of the
 * flag-store design and is small enough to be trivially reliable.
 */
export class SaveManager {
  private readonly storage: StorageLike;
  private readonly key: string;

  constructor(storage: StorageLike, key: string = SAVE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  write(save: Omit<SaveFile, 'version'>): SaveFile {
    const payload: SaveFile = { version: SAVE_VERSION, ...save };
    this.storage.setItem(this.key, JSON.stringify(payload));
    return payload;
  }

  read(): SaveFile | null {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    return this.validate(parsed);
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }

  exists(): boolean {
    return this.storage.getItem(this.key) !== null;
  }

  /** A save that fails any structural check is discarded, never partly applied. */
  private validate(parsed: unknown): SaveFile | null {
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<SaveFile>;
    if (candidate.version !== SAVE_VERSION) return null;
    if (typeof candidate.room !== 'string') return null;
    if (!Array.isArray(candidate.inventory)) return null;
    if (typeof candidate.reputation !== 'number') return null;
    if (typeof candidate.flags !== 'object' || candidate.flags === null) return null;
    if (typeof candidate.dialogueProgress !== 'object' || candidate.dialogueProgress === null) {
      return null;
    }
    if (typeof candidate.dialoguePosition !== 'object' || candidate.dialoguePosition === null) {
      return null;
    }
    return candidate as SaveFile;
  }
}
