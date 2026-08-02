import type { MenuFile } from './types.ts';
import type { SaveManager, SlotSummary } from './SaveManager.ts';

export type MenuPage = 'closed' | 'root' | 'save' | 'load' | 'options';

export interface MenuRow {
  id: string;
  label: string;
  /** Slot rows carry their index; plain rows do not. */
  slot?: number;
  enabled: boolean;
}

export interface MenuAction {
  kind: 'none' | 'resume' | 'save' | 'load' | 'quit' | 'fullscreen';
  slot?: number;
}

/**
 * The pause menu, as state rather than as drawing.
 *
 * Phaser-free on purpose, like everything else in core/, so the whole menu
 * can be driven and asserted headlessly. The renderer asks it what rows to
 * draw and hands back which row was clicked; it never asks the renderer
 * anything.
 *
 * The one rule this exists to enforce: every route is reachable by mouse.
 * The target machine is a Chromebook, whose top row is browser keys, so
 * there are no F-key bindings anywhere in the engine and the keyboard is
 * never the only way to reach anything.
 */
export class MenuSystem {
  private readonly file: MenuFile;
  private readonly saves: SaveManager;
  private current: MenuPage = 'closed';
  private notice: string | null = null;
  /**
   * Toggle options, by id. Doc 18 note 2: background cycling is decorative
   * and must be disableable, defaulting on. Held here rather than in the save
   * file -- a display preference belongs to the machine, not to the game.
   */
  private readonly toggles = new Map<string, boolean>();

  private readonly roomName: (id: string) => string;

  constructor(file: MenuFile, saves: SaveManager, roomName: (id: string) => string = (id) => id) {
    this.file = file;
    this.saves = saves;
    // Injected rather than looked up: the menu must not know what a room is.
    this.roomName = roomName;
    for (const item of file.options.items) {
      if (item.type === 'toggle') this.toggles.set(item.id, item.default ?? true);
    }
  }

  /** Whether a toggle option is on. Unknown ids are off. */
  toggle(id: string): boolean {
    return this.toggles.get(id) ?? false;
  }

  get page(): MenuPage {
    return this.current;
  }

  get isOpen(): boolean {
    return this.current !== 'closed';
  }

  get buttonLabel(): string {
    return this.file.button.label;
  }

  get pendingNotice(): string | null {
    return this.notice;
  }

  takeNotice(): string | null {
    const held = this.notice;
    this.notice = null;
    return held;
  }

  open(): void {
    this.current = 'root';
  }

  close(): void {
    this.current = 'closed';
  }

  /** ESC steps back one level rather than closing outright from a subpage. */
  escape(): void {
    this.current = this.current === 'closed' ? 'root'
      : this.current === 'root' ? 'closed'
      : 'root';
  }

  title(): string {
    switch (this.current) {
      case 'save': return this.file.save.title;
      case 'load': return this.file.load.title;
      case 'options': return this.file.options.title;
      default: return this.file.root.title;
    }
  }

  /** The rows to draw, in order, for whatever page is open. */
  rows(): MenuRow[] {
    switch (this.current) {
      case 'root':
        return this.file.root.items.map((item) => ({
          id: item.id,
          label: item.label,
          // Load is dead with nothing saved, and says so by being dim
          // rather than by being absent -- a menu that changes length
          // between visits is harder to learn than one that greys out.
          enabled: item.id !== 'load' || this.saves.anySlotUsed(),
        }));
      case 'save':
      case 'load':
        return [
          ...this.slotRows(this.current === 'load'),
          { id: 'back', label: this.file[this.current].back, enabled: true },
        ];
      case 'options':
        return [
          ...this.file.options.items.map((item) => ({
            id: item.id,
            label: item.type === 'toggle'
              ? fill(this.file.options.valueTemplate, {
                label: item.label,
                value: (this.toggle(item.id) ? item.on : item.off) ?? '',
              })
              : item.label,
            enabled: true,
          })),
          { id: 'back', label: this.file.options.back, enabled: true },
        ];
      default:
        return [];
    }
  }

  private slotRows(loading: boolean): MenuRow[] {
    const { slots } = this.file;
    return this.saves.listSlots(slots.count, slots.time).map((summary: SlotSummary) => {
      const name = fill(slots.nameTemplate, { number: String(summary.slot + 1) });
      const detail = summary.used
        ? fill(slots.usedTemplate, { room: this.roomName(summary.room), when: summary.when })
        : slots.emptyLabel;
      return {
        id: `slot:${summary.slot}`,
        label: `${name}  ${detail}`,
        slot: summary.slot,
        // An empty slot cannot be loaded, but can always be saved into.
        enabled: loading ? summary.used : true,
      };
    });
  }

  /** Applies a click on a row and reports what the caller must now do. */
  select(rowId: string): MenuAction {
    if (rowId === 'back') {
      this.current = 'root';
      return { kind: 'none' };
    }
    if (rowId.startsWith('slot:')) {
      const slot = Number(rowId.slice(5));
      if (this.current === 'save') {
        this.notice = this.file.notices.saved;
        this.current = 'closed';
        return { kind: 'save', slot };
      }
      if (!this.saves.listSlots(this.file.slots.count, this.file.slots.time)[slot]?.used) {
        this.notice = this.file.notices.noSave;
        return { kind: 'none' };
      }
      this.notice = this.file.notices.restored;
      this.current = 'closed';
      return { kind: 'load', slot };
    }
    if (this.toggles.has(rowId)) {
      this.toggles.set(rowId, !this.toggles.get(rowId));
      return { kind: 'none' };
    }
    switch (rowId) {
      case 'resume':
        this.current = 'closed';
        return { kind: 'resume' };
      case 'save':
      case 'load':
      case 'options':
        this.current = rowId;
        return { kind: 'none' };
      // ERRATA 39's second place. It does NOT close the menu: the player is
      // looking at the thing that changed size, and closing would make the
      // toggle feel like a command rather than a switch.
      case 'fullscreen':
        return { kind: 'fullscreen' };
      case 'quit':
        this.current = 'closed';
        return { kind: 'quit' };
      default:
        return { kind: 'none' };
    }
  }
}

/** Same substitution the sentence line uses. Kept local to avoid a cycle. */
function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}
