import type { StorageLike } from './SaveManager.ts';

/**
 * THE MACHINE'S SETTINGS, KEPT APART FROM THE GAME'S (doc 33 section 7.3;
 * errata 154 A).
 *
 * "Settings are a separate schema ... Do not place settings in a save
 * envelope, and do not clear them on NEW GAME, restart, slot overwrite, or
 * return to title." And table 2: text speed is "read separately from
 * versioned machine settings; one slot never changes another player's
 * reading/display preference." So it lives under its own storage key, and
 * nothing in GameState's save or load reads or writes it.
 *
 * "Settings load before title and apply field-by-field with safe defaults. A
 * corrupt setting must not block any save or game start." So every read is
 * a single field, anything unreadable is `undefined` (the caller's default),
 * and a storage that throws -- a private window, a full quota -- is the same
 * as one that is empty.
 *
 * Only the fields a built option writes are here today: `textMode`. Doc 33's
 * others (paletteCycling, fullscreenPreferred) join it when they are built.
 */
export const SETTINGS_KEY = 'consolation.settings.v1';
const FORMAT = 'the-last-claim-settings';
const SCHEMA_VERSION = 1;

type Fields = Record<string, string | boolean>;

export class MachineSettings {
  private readonly storage: StorageLike | null;

  constructor(storage: StorageLike | null) {
    this.storage = storage;
  }

  /** One field, or undefined when it is absent or anything about it is unreadable. */
  read(field: string): string | boolean | undefined {
    return this.fields()[field];
  }

  /** Writes one field and keeps the rest. A storage that refuses is not an error the player sees. */
  write(field: string, value: string | boolean): void {
    if (!this.storage) return;
    const next = { ...this.fields(), [field]: value };
    try {
      this.storage.setItem(SETTINGS_KEY, JSON.stringify({ format: FORMAT, schemaVersion: SCHEMA_VERSION, ...next }));
    } catch {
      // Quota or security: the setting holds for this session and is not kept.
    }
  }

  private fields(): Fields {
    if (!this.storage) return {};
    let raw: string | null;
    try {
      raw = this.storage.getItem(SETTINGS_KEY);
    } catch {
      return {};
    }
    if (raw === null) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object' || parsed.format !== FORMAT
        || parsed.schemaVersion !== SCHEMA_VERSION) return {};
      const out: Fields = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (key === 'format' || key === 'schemaVersion') continue;
        if (typeof value === 'string' || typeof value === 'boolean') out[key] = value;
      }
      return out;
    } catch {
      return {};
    }
  }
}
