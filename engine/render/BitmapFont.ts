import type { FontFile } from '../core/types.ts';

type Ctx = CanvasRenderingContext2D;

/**
 * 1-bit glyph renderer. Every lit pixel is written as an exact 1x1 rect at
 * integer coordinates, so nothing is ever rasterised through a system font
 * and nothing is ever anti-aliased.
 */
export class BitmapFont {
  readonly height: number;
  private readonly advance: number;
  private readonly spaceAdvance: number;
  private readonly onChar: string;
  private readonly glyphs: Map<string, string[]>;
  private readonly advances: Map<string, number>;

  constructor(file: FontFile) {
    this.height = file.height;
    this.advance = file.advance;
    this.spaceAdvance = file.spaceAdvance;
    this.onChar = file.on;
    this.glyphs = new Map(Object.entries(file.glyphs));
    // Per-glyph advance overrides. An em dash has to be wider than the cell
    // to read as an em dash rather than as a hyphen someone leaned on.
    this.advances = new Map(Object.entries(file.advances ?? {}));
  }

  supports(char: string): boolean {
    return this.glyphs.has(char);
  }

  /** Characters in `text` that have no glyph. */
  unsupported(text: string): string[] {
    const missing = new Set<string>();
    for (const char of text) {
      if (!this.glyphs.has(char)) missing.add(char);
    }
    return [...missing];
  }

  private advanceFor(char: string): number {
    const override = this.advances.get(char);
    if (override !== undefined) return override;
    return char === ' ' ? this.spaceAdvance : this.advance;
  }

  measure(text: string): number {
    let width = 0;
    for (const char of text) {
      width += this.advanceFor(char);
    }
    return width > 0 ? width - 1 : 0;
  }

  draw(ctx: Ctx, text: string, x: number, y: number, colour: string): number {
    ctx.fillStyle = colour;
    let cursor = x;
    for (const char of text) {
      const rows = this.glyphs.get(char);
      if (rows) {
        for (let row = 0; row < rows.length; row += 1) {
          const line = rows[row] as string;
          for (let col = 0; col < line.length; col += 1) {
            if (line[col] === this.onChar) {
              ctx.fillRect(cursor + col, y + row, 1, 1);
            }
          }
        }
      }
      cursor += this.advanceFor(char);
    }
    return cursor - x;
  }

  /**
   * Draws with a hard 1px outline, so text stays legible over any artwork.
   *
   * Speech is drawn straight over the background with no plate, the way SCUMM
   * does it. Without the outline a pale line vanishes against a pale building,
   * which it did over the Improvement Company on the first run.
   */
  drawOutlined(ctx: Ctx, text: string, x: number, y: number, colour: string, outline: string): void {
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      this.draw(ctx, text, x + dx, y + dy, outline);
    }
    this.draw(ctx, text, x, y, colour);
  }

  drawCentredOutlined(ctx: Ctx, text: string, centreX: number, y: number, colour: string, outline: string): void {
    const x = Math.round(centreX - this.measure(text) / 2);
    this.drawOutlined(ctx, text, x, y, colour, outline);
  }

  /** Draws centred on `centreX`, snapped to whole pixels. */
  drawCentred(ctx: Ctx, text: string, centreX: number, y: number, colour: string): void {
    const x = Math.round(centreX - this.measure(text) / 2);
    this.draw(ctx, text, x, y, colour);
  }

  /** Greedy word wrap. Words longer than `maxWidth` are emitted unbroken. */
  wrap(text: string, maxWidth: number): string[] {
    const words = text.split(' ').filter((word) => word.length > 0);
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const candidate = line.length === 0 ? word : `${line} ${word}`;
      if (this.measure(candidate) <= maxWidth || line.length === 0) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line.length > 0) lines.push(line);
    return lines;
  }
}
