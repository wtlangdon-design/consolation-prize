import type { FontFile } from '../core/types.ts';

type Ctx = CanvasRenderingContext2D;

/**
 * How many screen units one glyph pixel occupies. ERRATA 54 / Q6, PARTIAL.
 *
 * Every lit pixel used to be an exact 1x1 rect, which was right at 320x200
 * and became a bug the moment the frame did not move with it: the play area
 * went to 1920x864 and the text did not, so a line drew at a sixth of the
 * relative size it was designed at and the project owner could not read the
 * game. The ruling is to SCALE THE FACE, not to replace it.
 *
 * This is not a typeface decision and does not close Q6. The 5x7 stays, the
 * glyph data is untouched, and choosing what eventually replaces it -- a face
 * actually drawn for 1920x864, with the prose typography CLAUDE.md requires
 * covered -- is still open. Six is the same integer the geometry migrated by,
 * so a line occupies exactly the fraction of the frame it always did.
 *
 * Kept as whole units on purpose. A glyph pixel is still a rect on integer
 * coordinates and nothing is rasterised or anti-aliased; it is six units wide
 * instead of one.
 */
export const GLYPH_SCALE = 6;

/**
 * 1-bit glyph renderer. Every lit pixel is written as an exact square at
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
    // Scaled ONCE, here. Everything downstream -- measure, wrap, the panel's
    // line heights, the renderer's margins -- reads these and therefore needs
    // no knowledge of the scale at all. A second multiplication anywhere else
    // would double it somewhere and not everywhere.
    this.height = file.height * GLYPH_SCALE;
    this.advance = file.advance * GLYPH_SCALE;
    this.spaceAdvance = file.spaceAdvance * GLYPH_SCALE;
    this.onChar = file.on;
    this.glyphs = new Map(Object.entries(file.glyphs));
    // Per-glyph advance overrides. An em dash has to be wider than the cell
    // to read as an em dash rather than as a hyphen someone leaned on.
    this.advances = new Map(
      Object.entries(file.advances ?? {}).map(([char, width]) => [char, width * GLYPH_SCALE]),
    );
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
    // The trailing inter-glyph gap, which is one glyph pixel and therefore
    // one scale unit -- not one screen unit.
    return width > 0 ? width - GLYPH_SCALE : 0;
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
              ctx.fillRect(cursor + col * GLYPH_SCALE, y + row * GLYPH_SCALE,
                GLYPH_SCALE, GLYPH_SCALE);
            }
          }
        }
      }
      cursor += this.advanceFor(char);
    }
    return cursor - x;
  }

  /**
   * Draws with a hard one-glyph-pixel outline, so text stays legible over any
   * artwork.
   *
   * Speech is drawn straight over the background with no plate, the way SCUMM
   * does it. Without the outline a pale line vanishes against a pale building,
   * which it did over the Improvement Company on the first run.
   */
  drawOutlined(ctx: Ctx, text: string, x: number, y: number, colour: string, outline: string): void {
    // The offsets are in GLYPH pixels, so the outline stays one glyph pixel
    // thick at any scale. At one screen unit it would vanish at this size.
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      this.draw(ctx, text, x + dx * GLYPH_SCALE, y + dy * GLYPH_SCALE, outline);
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
