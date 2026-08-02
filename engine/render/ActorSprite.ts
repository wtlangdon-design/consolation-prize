import type { ActorClip, ActorFile, ActorSize, Facing } from '../core/types.ts';
import { assertRequiredClip } from '../core/Assertions.ts';

/** A loaded sheet, or null while it is still loading. */
export type SheetSource = (path: string) => CanvasImageSource | null;

/**
 * Draws a character. ERRATA 54 lives here now, and ruling 24 does not.
 *
 * WHAT CHANGED. Ruling 24 scaled by DECIMATION -- whole rows and columns
 * dropped, nothing blended -- because a 40px figure quantised to a locked
 * 256-entry palette cannot survive an interpolating filter. Errata 54 removed
 * both the 40px figure and the locked palette: characters are ~233px at
 * mid-depth in full RGB, and its table replaces "decimation, errata 24" with
 * "ordinary filtered resampling" in as many words. `Decimation.ts` implements
 * a voided spec and is no longer imported here.
 *
 * Scaled frames are cached by (sheet, clip, frame, height), so a walk across
 * a depth band resamples each height once and every frame after the first is
 * a plain blit. That was worth doing when the scale was a decimation table
 * and it is still worth doing when it is a filter.
 *
 * TWO DRAWN SIZES SURVIVE HERE AS A SOURCE CHOICE, NOT AS A SCALER. Errata 54
 * says one drawn size; `content/actors/thad.json` still declares two, and
 * rewriting it is open question Q9 and not this file's to answer. So the
 * threshold still picks WHICH sheet to sample and no longer decides how the
 * sampling is done. When Q9 lands with one size the branch stops being taken
 * and nothing else here changes.
 */
export class ActorSprite {
  private readonly cache = new Map<string, HTMLCanvasElement>();
  // Written out rather than declared as constructor parameter properties:
  // the tests run under node --experimental-strip-types, which erases types
  // and refuses anything that would need emitting.
  private readonly table: ActorFile;
  private readonly sheets: SheetSource;

  constructor(table: ActorFile, sheets: SheetSource) {
    this.table = table;
    this.sheets = sheets;
  }

  /** Which drawn sheet serves a height, per the measured threshold. */
  private sizeFor(height: number): ActorSize {
    return height > this.table.threshold ? this.table.sizes.near : this.table.sizes.far;
  }

  /** Whether the record declares a clip at all. Never a substitution. */
  declares(clip: string): boolean {
    return this.table.sizes.near.clips.some((candidate) => candidate.id === clip);
  }

  /**
   * Frames in a clip, so the caller can pick one without knowing the sheet.
   *
   * Returns 0 for a clip that is not declared, rather than 1: a caller that
   * gets 1 draws frame 0 of something, which is the fallback this file has
   * just stopped doing.
   */
  frameCount(clip: string, facing: Facing, surface: string, height: number): number {
    return this.clipOf(this.sizeFor(height), clip, facing, surface)?.frames ?? 0;
  }

  /**
   * The declared clip, or undefined. THERE IS NO FALLBACK.
   *
   * There were two, and both hid missing coverage behind something that
   * looked like it worked:
   *
   *   - keep the facing, give up the clip -- a reaction exported front-on
   *     only "worked" everywhere, because he played a front-on standing frame
   *     and nothing looked broken;
   *   - fall through to `clips[0]` -- every missing clip in the game drew the
   *     protagonist's first idle frame.
   *
   * Doc 34 step C is "remove required-chore-variant fallback", assertion 14
   * is the guard shipped for it, and a fallback added now would be the exact
   * thing that step is commissioned to delete. A missing clip is named.
   *
   * DROPPING THE SURFACE IS NOT A FALLBACK OF THE SAME KIND and is kept: doc
   * 40's Q10 asks whether the mud and boardwalk variants survive errata 54 at
   * all, and until that is answered a character with one surface variant has
   * the clip -- he does not have two footfall treatments. The clip asked for
   * is the clip drawn either way.
   */
  private clipOf(size: ActorSize, clip: string, facing: Facing, surface: string):
  ActorClip | undefined {
    const found = size.clips.find(
      (candidate) => candidate.id === clip && candidate.facing === facing
        && candidate.surface === surface,
    ) ?? size.clips.find(
      (candidate) => candidate.id === clip && candidate.facing === facing,
    );
    assertRequiredClip(found, clip, facing, surface);
    return found;
  }

  /**
   * Draws the figure with its soles on (feetX, feetY) at a drawn height.
   *
   * Returns false if the sheet has not loaded or the clip is not declared, so
   * the caller can fall back to a graybox rather than leave a hole where a
   * character should be. That is a fallback to a VISIBLE PLACEHOLDER, which
   * is the opposite of substituting a clip nobody asked for.
   */
  draw(
    context: CanvasRenderingContext2D,
    clip: string,
    facing: Facing,
    surface: string,
    frame: number,
    feetX: number,
    feetY: number,
    height: number,
  ): boolean {
    const size = this.sizeFor(height);
    const image = this.sheets(size.sheet);
    if (!image) return false;
    const found = this.clipOf(size, clip, facing, surface);
    if (!found) return false;

    const [cellW, cellH] = size.cell;
    const column = ((frame % found.frames) + found.frames) % found.frames;
    const sx = column * cellW;
    const sy = found.row * cellH;

    // The cell is cellH tall and the figure occupies all of it, so the scale
    // is taken against the CELL rather than against the nominal height --
    // scaling to `height` rows would silently crop the keyline and headroom
    // the exporter allows above the figure.
    const scale = height / size.height;
    const drawnH = Math.max(1, Math.round(cellH * scale));
    const drawnW = Math.max(1, Math.round(cellW * scale));

    // Drawn at its own size, which is the common case once one drawn size
    // exists: no resample at all, so nothing is filtered that need not be.
    if (drawnH === cellH && drawnW === cellW) {
      context.drawImage(image, sx, sy, cellW, cellH,
        Math.round(feetX - cellW / 2), Math.round(feetY - cellH + 1), cellW, cellH);
      return true;
    }

    const key = `${size.sheet}:${found.row}:${column}:${drawnW}x${drawnH}`;
    let scaled = this.cache.get(key);
    if (!scaled) {
      const made = this.resample(image, sx, sy, cellW, cellH, drawnW, drawnH);
      if (!made) return false;
      scaled = made;
      this.cache.set(key, scaled);
    }
    // ANCHORED AT THE FEET, always: the soles land on (feetX, feetY) whatever
    // the figure is scaled to, which is what keeps a character standing on
    // the road rather than hovering over it as he walks up it.
    context.drawImage(scaled,
      Math.round(feetX - scaled.width / 2), Math.round(feetY - scaled.height + 1));
    return true;
  }

  /**
   * Errata 54's ordinary filtered resampling, into its own canvas.
   *
   * Smoothing is turned on HERE and nowhere else. The screen context and the
   * occlusion scratch both keep it off, so nothing else in the frame is
   * filtered; this is one offscreen canvas per (frame, drawn size), made once
   * and blitted thereafter.
   */
  private resample(
    image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number,
    width: number, height: number,
  ): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
    return canvas;
  }

  /**
   * How tall the figure will actually be drawn at a wanted height.
   *
   * Under decimation this could not be assumed -- the table was not linear
   * over short runs, so asking for 34 could give 33. A filter gives what it
   * is asked for and this is now exact; it is kept because a legibility probe
   * or a staging check should still ASK rather than assume, and because the
   * answer stops being trivial the moment a room's scale curve exists.
   */
  drawnHeight(height: number): number {
    return Math.max(1, Math.round(height));
  }
}
