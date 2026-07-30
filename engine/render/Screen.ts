import type { PaletteFile } from '../core/types.ts';

/** Native SCUMM-style geometry. Play area on top, verb panel below. */
export const NATIVE_WIDTH = 320;
export const NATIVE_HEIGHT = 200;
export const PLAY_HEIGHT = 144;
export const PANEL_Y = PLAY_HEIGHT;
export const PANEL_HEIGHT = NATIVE_HEIGHT - PLAY_HEIGHT;

export const SENTENCE_Y = 146;
export const VERB_MARGIN = 4;
export const VERB_WIDTH = 104;
export const VERB_HEIGHT = 11;
export const VERB_ROW_Y = [156, 168, 180] as const;
export const HUD_Y = 192;

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
  private readonly ctx: CanvasRenderingContext2D;
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

export interface VerbButtonRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function verbButtonRect(col: number, row: number): VerbButtonRect {
  return {
    x: VERB_MARGIN + col * VERB_WIDTH,
    y: VERB_ROW_Y[row] ?? (VERB_ROW_Y[0] as number),
    width: VERB_WIDTH - VERB_MARGIN,
    height: VERB_HEIGHT,
  };
}

export function pointInRect(x: number, y: number, rect: VerbButtonRect): boolean {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}
