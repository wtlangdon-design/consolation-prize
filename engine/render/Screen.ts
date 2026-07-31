import type { PaletteFile, PanelFile } from '../core/types.ts';

/** Native SCUMM-style geometry. Play area on top, verb panel below. */
export const NATIVE_WIDTH = 320;
export const NATIVE_HEIGHT = 200;
export const PLAY_HEIGHT = 144;
export const PANEL_Y = PLAY_HEIGHT;
export const PANEL_HEIGHT = NATIVE_HEIGHT - PLAY_HEIGHT;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Errata ruling 26's panel, resolved from content/ui/panel.json.
 *
 * Verbs left in three columns, inventory right as a scrollable list of item
 * names in text, sentence line full width above both. Nothing here is a
 * constant in this file any more: the same JSON is read by the Python that
 * renders the panel for review, so the picture Tyler looks at and the panel
 * the game draws cannot drift apart.
 *
 * The menu button lives in the verb grid's fourth row. SCUMM had twelve verbs
 * in three columns of four and we have nine, so the row that would have held
 * the last three carries the button instead -- which is also how the button
 * stopped overlapping LISTEN TO, where it had been sitting since it was put
 * in a corner to keep the keyboard optional.
 */
export class PanelLayout {
  // Not a constructor parameter property: the tests run under
  // node --experimental-strip-types, which refuses anything needing emit.
  private readonly file: PanelFile;

  constructor(file: PanelFile) {
    this.file = file;
  }

  get sentence(): { x: number; y: number } {
    return this.file.sentence;
  }

  verbButton(col: number, row: number): Rect {
    const { cols, rows, width, height } = this.file.verbs;
    return {
      x: cols[col] ?? (cols[0] as number),
      y: rows[row] ?? (rows[0] as number),
      width,
      height,
    };
  }

  get menuButton(): Rect {
    const { col, row } = this.file.menuButton;
    return this.verbButton(col, row);
  }

  /**
   * Doc 20 rule 2's always-reachable map, in the verb grid's fourth row.
   *
   * Nine verbs fill three rows of three and the fourth row had one cell used
   * by MENU and two spare, so this costs no geometry. It is a panel button
   * rather than a hotspot because "always reachable" is a claim about every
   * room, and a hotspot is a claim about one.
   */
  get mapButton(): Rect | null {
    if (!this.file.mapButton) return null;
    const { col, row } = this.file.mapButton;
    return this.verbButton(col, row);
  }

  /** Icons visible at once. Errata 29: six to eight, and this is eight. */
  get visibleRows(): number {
    const { cols, rows } = this.file.inventory;
    return cols * rows;
  }

  /** The nth visible icon cell, filling left to right then down. */
  inventoryRow(index: number): Rect {
    const { x, y, cell, cols } = this.file.inventory;
    const [width, height] = cell;
    return {
      x: x + (index % cols) * width,
      y: y + Math.floor(index / cols) * height,
      width,
      height,
    };
  }

  /** Up and down, stacked over the height of the list. */
  arrow(direction: 'up' | 'down'): Rect {
    const { y, cell, rows, arrows } = this.file.inventory;
    const half = Math.floor((cell[1] * rows) / 2);
    return {
      x: arrows.x,
      y: direction === 'up' ? y : y + half,
      width: arrows.width,
      height: half,
    };
  }
}

/**
 * Interface colours are looked up by role name, never by index. The locked
 * palette owns the numbers; changing a chrome colour is a palette edit, not
 * a code edit.
 */
export type UiRole =
  | 'overlayBg'
  | 'panelBg'
  | 'buttonBg'
  | 'buttonBgActive'
  | 'outline'
  | 'inkDim'
  | 'ink'
  | 'inkBright';

/**
 * Owns the single 320x200 canvas everything is drawn into. Redrawing the
 * whole frame at this size is cheap, so the renderer stays stateless.
 */
export class Screen {
  private readonly swatches: string[];
  private ctx: CanvasRenderingContext2D;
  private readonly roles: Record<string, number>;

  constructor(ctx: CanvasRenderingContext2D, palette: PaletteFile) {
    if (!palette.locked) {
      throw new Error(`Palette ${palette.id} is not locked`);
    }
    this.ctx = ctx;
    this.swatches = palette.colours;
    this.roles = palette.roles;
  }

  /** Palette index for a named interface role. */
  role(name: UiRole): number {
    const index = this.roles[name];
    if (index === undefined) {
      throw new Error(`Palette has no role: ${name}`);
    }
    return index;
  }

  /** Convenience: the colour string for a named role. */
  roleColour(name: UiRole): string {
    return this.colour(this.role(name));
  }

  get context(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Redirects everything Screen draws to another context, and returns the one
   * it was using.
   *
   * Doc 22 section 5 needs a figure drawn to a scratch canvas so its own
   * occlusion mask can be punched out of it before it reaches the screen.
   * Swapping the target here rather than threading a context through every
   * draw call keeps the drawing code identical whether it is going to the
   * screen or to a mask buffer -- and the figure has to be drawn exactly the
   * same way in both cases or the mask lines up with the wrong pixels.
   */
  borrow(context: CanvasRenderingContext2D): CanvasRenderingContext2D {
    const previous = this.ctx;
    this.ctx = context;
    return previous;
  }

  colour(index: number): string {
    return this.swatches[index % this.swatches.length] ?? (this.swatches[0] as string);
  }

  clear(index: number): void {
    this.fill(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT, index);
  }

  fill(x: number, y: number, width: number, height: number, index: number): void {
    this.ctx.fillStyle = this.colour(index);
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  outline(x: number, y: number, width: number, height: number, index: number): void {
    this.fill(x, y, width, 1, index);
    this.fill(x, y + height - 1, width, 1, index);
    this.fill(x, y, 1, height, index);
    this.fill(x + width - 1, y, 1, height, index);
  }
}

export function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}
