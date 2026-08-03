import type { FlagValue } from './types.ts';
import type { DialogueProgress } from './DialogueRunner.ts';

export const SAVE_KEY = 'consolation.save.v1';
/**
 * BUMPED TO 2 FOR `position`. A v1 save is rejected outright by `validate`,
 * which is the right cost: every save in existence was written while testing
 * in the hours before the field was added, so weighing the format against
 * them was weighing it against nothing -- and CLAUDE.md's own criterion,
 * "save/load restores exact state", was false in the document that states it.
 */
export const SAVE_VERSION = 2;

export interface SaveFile {
  version: number;
  room: string;
  /** Epoch millis, for the slot list. Written by the engine, never by hand. */
  savedAt?: number;
  inventory: string[];
  reputation: number;
  /**
   * Doc 22 item 9's runtime object state, keyed "room/object", and the
   * objects whose ownership has passed to the actor.
   *
   * Optional so a save written before states existed still loads: an absent
   * map means every object is at its declared initial state, which is what a
   * save from before the feature meant.
   */
  objectStates?: Record<string, string>;
  taken?: string[];
  flags: Record<string, FlagValue>;
  dialogueProgress: DialogueProgress;
  dialoguePosition: { tree: string | null; node: string | null };
  /**
   * Where he was standing, in the room named above.
   *
   * OPTIONAL, and the absence is meaningful rather than legacy: a save taken
   * by the autosave at the instant of arrival is written before the scene has
   * placed him, so there is nothing to record and the entrance is where he is
   * anyway. Loading one falls through to the entrance, which is the behaviour
   * this field was added to stop being the ONLY behaviour.
   */
  position?: [number, number];
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
export interface SlotSummary {
  slot: number;
  used: boolean;
  /** Room id as stored. */
  room: string;
  /** Human-facing room name; filled in by the caller that knows the rooms. */
  roomName: string;
  when: string;
}

export class SaveManager {
  private readonly storage: StorageLike;
  private readonly key: string;
  private readonly clock: () => number;

  constructor(storage: StorageLike, key: string = SAVE_KEY, clock: () => number = Date.now) {
    this.storage = storage;
    this.key = key;
    // Injected so slot listings are assertable without freezing real time.
    this.clock = clock;
  }

  write(save: Omit<SaveFile, 'version'>, slot: number | null = null): SaveFile {
    const payload: SaveFile = { version: SAVE_VERSION, savedAt: this.now(), ...save };
    this.storage.setItem(this.keyFor(slot), JSON.stringify(payload));
    return payload;
  }

  /** Slot 0..n-1 are the player's named slots; null is the autosave. */
  keyFor(slot: number | null): string {
    return slot === null ? this.key : `${this.key}.slot${slot}`;
  }

  readSlot(slot: number): SaveFile | null {
    const raw = this.storage.getItem(this.keyFor(slot));
    if (raw === null) return null;
    try {
      return this.validate(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  anySlotUsed(count = 3): boolean {
    if (this.exists()) return true;
    for (let slot = 0; slot < count; slot += 1) {
      if (this.readSlot(slot) !== null) return true;
    }
    return false;
  }

  /**
   * One row per slot, whether used or not.
   *
   * Room and time are resolved here rather than at draw time so the menu
   * can stay a pure list of strings -- and so an unreadable save shows as
   * empty instead of throwing in the middle of a frame.
   */
  listSlots(count = 3, labels?: TimeLabels): SlotSummary[] {
    const rows: SlotSummary[] = [];
    for (let slot = 0; slot < count; slot += 1) {
      const save = this.readSlot(slot);
      rows.push({
        slot,
        used: save !== null,
        room: save?.room ?? '',
        roomName: save?.room ?? '',
        when: save?.savedAt && labels ? formatWhen(save.savedAt, labels, this.clock()) : '',
      });
    }
    return rows;
  }

  private now(): number {
    return this.clock();
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

  clear(slot: number | null = null): void {
    this.storage.removeItem(this.keyFor(slot));
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
    if (candidate.position !== undefined
      && !(Array.isArray(candidate.position) && candidate.position.length === 2
        && candidate.position.every((n) => typeof n === 'number' && Number.isFinite(n)))) {
      return null;
    }
    return candidate as SaveFile;
  }
}


/** The four templates a save's age can be rendered with. */
export interface TimeLabels {
  justNow: string;
  minutes: string;
  hours: string;
  days: string;
}

/**
 * A save's age, as short text.
 *
 * Relative rather than a clock time: a player who saved twenty minutes ago
 * knows what "20m ago" means without doing arithmetic against a timestamp,
 * and it sidesteps locale formatting entirely -- which matters when every
 * glyph has to exist in a hand-authored 5x7 font.
 *
 * The words come in from content. An earlier version had them as literals
 * here and check-no-content-in-code was right to reject it: "just now" is
 * something the player reads, and the one architecture rule is that nothing
 * the player reads lives in a .ts file.
 */
export function formatWhen(savedAt: number, labels: TimeLabels, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - savedAt) / 1000));
  if (seconds < 60) return labels.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return labels.minutes.replace('{n}', String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return labels.hours.replace('{n}', String(hours));
  return labels.days.replace('{n}', String(Math.floor(hours / 24)));
}
