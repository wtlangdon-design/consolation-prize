import type { FontFile } from '../core/types.ts';
import { BitmapFont, type Face } from './BitmapFont.ts';

type Ctx = CanvasRenderingContext2D;

/**
 * A CANDIDATE TYPEFACE, DRAWN IN THE REAL UI, SO A DECISION CAN BE LOOKED AT.
 *
 * WHY IT EXISTS. Errata 54 voids the 5x7 face -- "unusable at 1920x1080" --
 * and forbids picking a replacement without a ruling. Doc 36 Q16 is that
 * ruling, still open, and it blocks more than it looks: `check-item-names`
 * measures every inventory label against a 320px sentence line in a font that
 * is void, and the panel layout (Q26, Q35) is provisional until a face exists.
 *
 * A FONT CANNOT BE CHOSEN FROM A SPECIMEN SHEET. It has to be read in the
 * verb panel at the size the panel draws it, over the art, at the scale a
 * Chromebook shows -- which is doc 46 part three's rule in a different
 * costume: render before judging. So this draws candidates through the same
 * calls the game already makes, in the live runtime, and the comparison is
 * full frames of the same UI state.
 *
 * IT IS NOT A CHOICE AND MAKES NONE. Nothing here is canonical, nothing is in
 * the manifest, and the bitmap face is untouched. `?font=` in a DEV build
 * swaps it in for a look; a build with no `?font=` is bit-identical to one
 * without this file. When Tyler rules, this stops being a preview and becomes
 * the text path, and the ruling is the only thing that changes.
 *
 * IT MATCHES BitmapFont's SURFACE EXACTLY, on purpose. Every consumer --
 * wrapping, the sentence line, the panel's line heights, the dialogue block --
 * reads `height`, `measure`, `wrap` and `draw`, and a preview that answered
 * those differently would be showing a layout the game does not have.
 */
export class PreviewFont implements Face {
  readonly height: number;
  /**
   * Kept so the surface matches. A vector face has no glyph pixel, so this is
   * 1 and every caller that multiplies by it gets the size it asked for --
   * which is right: `GLYPH_SCALE` exists because a 5x7 bitmap had to be
   * magnified, and a face drawn at the size it is wanted does not.
   */
  readonly scale = 1;
  private readonly family: string;
  private readonly weight: string;
  private readonly px: number;
  /** The face this stands in for, for glyph coverage. See `unsupported`. */
  private readonly source: BitmapFont;
  private measurer: Ctx | null = null;

  constructor(file: FontFile, family: string, px: number, weight = '400') {
    this.family = family;
    this.px = px;
    this.weight = weight;
    this.height = px;
    this.source = new BitmapFont(file);
  }

  /**
   * QUOTED, BECAUSE A FAMILY NAME HAS SPACES IN IT. `42px IBM Plex Sans` is
   * invalid CSS -- the browser drops the whole declaration and keeps whatever
   * font was set before, which for a fresh context is the default sans. Every
   * candidate then renders identically and the comparison quietly compares
   * nothing.
   */
  private get css(): string {
    return `${this.weight} ${this.px}px '${this.family}'`;
  }

  /**
   * One offscreen context for measuring, made on first use.
   *
   * MEASURED THROUGH THE SAME ENGINE THAT DRAWS. Estimating an advance from a
   * character count is how a wrap and a draw come to disagree, and the
   * disagreement shows as a line that overflows its block by one word on
   * exactly the strings nobody tested.
   */
  private context(): Ctx | null {
    if (this.measurer) return this.measurer;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    const found = canvas.getContext('2d');
    if (!found) return null;
    this.measurer = found;
    return found;
  }

  /**
   * WHETHER THE CANDIDATE HAS THE GLYPH -- which a canvas will not tell you.
   *
   * A browser substitutes a missing glyph from another face silently, so
   * `fillText` always draws SOMETHING and a coverage question asked of the
   * canvas always answers yes. That is precisely the failure CLAUDE.md's
   * typography rule exists to prevent: the documents are written in curly
   * quotes, em dashes and ellipses, and a face that lacks them would show
   * substituted ones that look almost right.
   *
   * So coverage is asked of the FONT FILE, offline, by
   * `tools/font/check-candidates.mjs`, and this defers to the bitmap face's
   * own answer, which is the set the content is already known to need.
   */
  supports(char: string): boolean {
    return this.source.supports(char);
  }

  unsupported(text: string): string[] {
    return this.source.unsupported(text);
  }

  measure(text: string): number {
    const ctx = this.context();
    if (!ctx) return text.length * this.px * 0.5;
    ctx.font = this.css;
    return Math.round(ctx.measureText(text).width);
  }

  draw(ctx: Ctx, text: string, x: number, y: number, colour: string): number {
    ctx.save();
    ctx.font = this.css;
    // TOP, BECAUSE EVERY CALLER PASSES A TOP. `BitmapFont.draw` writes rows
    // downward from `y`, so the whole engine's vertical arithmetic is in
    // top-left coordinates; an alphabetic baseline here would lift every line
    // by its ascent and the panel would look subtly wrong everywhere at once.
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = colour;
    ctx.fillText(text, x, y);
    ctx.restore();
    return this.measure(text);
  }

  /**
   * Doc 30: speech is drawn straight over the art with no plate, so it needs a
   * hard outline or a pale line vanishes against a pale building.
   *
   * STROKED UNDER THE FILL rather than drawn eight times at offsets, which is
   * what the bitmap face does because a 1-bit glyph has no stroke. The joins
   * are rounded so a thin stem does not grow spikes at its corners.
   */
  drawOutlined(ctx: Ctx, text: string, x: number, y: number,
               colour: string, outline: string): void {
    ctx.save();
    ctx.font = this.css;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.lineWidth = Math.max(2, Math.round(this.px / 8));
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = colour;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawCentred(ctx: Ctx, text: string, centreX: number, y: number, colour: string): void {
    this.draw(ctx, text, Math.round(centreX - this.measure(text) / 2), y, colour);
  }

  drawCentredOutlined(ctx: Ctx, text: string, centreX: number, y: number,
                      colour: string, outline: string): void {
    this.drawOutlined(ctx, text, Math.round(centreX - this.measure(text) / 2), y, colour, outline);
  }

  /** Greedy word wrap, the same shape BitmapFont uses, on real advances. */
  wrap(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && this.measure(next) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
}

/**
 * The candidate a DEV build was asked for, or null.
 *
 * `?font=Family&fontPx=42&panelPx=28&fontWeight=500`. Absent, the game builds
 * exactly as it did: this returns null, the bitmap face is constructed, and
 * nothing in the frame changes by a pixel.
 */
export function askedFont(): { family: string; px: number; panelPx: number;
  weight: string } | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const family = params.get('font');
  if (!family) return null;
  return {
    family,
    // Defaults chosen to match what the bitmap face occupies TODAY, so a
    // candidate is compared against the layout the game has rather than
    // against a size that flatters it: the 5x7 at GLYPH_SCALE 6 is 42 units
    // tall in the play area and at PANEL_GLYPH_SCALE 4 is 28 in the panel.
    px: Number(params.get('fontPx') ?? 42),
    panelPx: Number(params.get('panelPx') ?? 28),
    weight: params.get('fontWeight') ?? '400',
  };
}
