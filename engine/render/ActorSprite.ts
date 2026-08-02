import type { ActorClip, ActorFile, Facing } from '../core/types.ts';
import { assertRequiredClip } from '../core/Assertions.ts';

/** A loaded frame image, or null while it is still loading. */
export type SheetSource = (path: string) => CanvasImageSource | null;

/**
 * Draws a character. ERRATA 54 lives here, and ruling 24 does not.
 *
 * WHAT CHANGED, TWICE. Ruling 24 scaled by DECIMATION -- whole rows and
 * columns dropped, nothing blended -- because a 40px figure quantised to a
 * locked 256-entry palette cannot survive an interpolating filter. Errata 54
 * removed both the 40px figure and the locked palette, and replaced the
 * scaler with "ordinary filtered resampling" in as many words.
 *
 * THE TWO DRAWN SIZES ARE GONE TOO, which is the part this file was waiting
 * on. They survived here as a source choice while `thad.json` still declared
 * two and rewriting it was open question Q9. Q9 is ruled: one drawn size, and
 * frames come from the twenty per-clip directories the old sheet-and-cell
 * schema could not name. `sizeFor` and the threshold it consulted are gone
 * rather than kept as a branch nothing takes.
 *
 * ANCHORING IS THE DELICATE PART AND IT IS DATA, NOT MEASUREMENT. Each frame
 * is a padded RGBA canvas: 260 columns either side and 65 rows below the
 * soles, so a swung arm or a trailing leg is not clipped. A walk frame's
 * alpha genuinely runs from x=79 to x=1146 in a 1229-wide canvas. So the
 * renderer must NOT take a bounding box -- that box changes every frame and
 * he would jitter and resize as he walked. The record carries one anchor and
 * one figure height per clip, both measured off the rig, and every frame of
 * a facing shares them.
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

  /** Whether the record declares a clip at all. Never a substitution. */
  declares(clip: string): boolean {
    return this.table.clips.some((candidate) => candidate.id === clip);
  }

  /** Every frame path the record names, for a loader to fetch up front. */
  framePaths(): string[] {
    return this.table.clips.flatMap((clip) => clip.frames);
  }

  /**
   * Frames in a clip, so the caller can pick one without knowing the record.
   *
   * Returns 0 for a clip that is not declared, rather than 1: a caller that
   * gets 1 draws frame 0 of something, which is the fallback this file has
   * stopped doing.
   */
  frameCount(clip: string, facing: Facing, surface: string): number {
    return this.clipOf(clip, facing, surface)?.frames.length ?? 0;
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
   * the clip -- he does not have two footfall treatments. Today no clip
   * declares a surface, so this only ever takes the second branch.
   */
  private clipOf(clip: string, facing: Facing, surface: string): ActorClip | undefined {
    const found = this.table.clips.find(
      (candidate) => candidate.id === clip && candidate.facing === facing
        && candidate.surface === surface,
    ) ?? this.table.clips.find(
      (candidate) => candidate.id === clip && candidate.facing === facing,
    );
    assertRequiredClip(found, clip, facing, surface);
    return found;
  }

  /**
   * Draws the figure with its soles on (feetX, feetY) at a drawn height.
   *
   * Returns false if the frame has not loaded or the clip is not declared, so
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
    const found = this.clipOf(clip, facing, surface);
    if (!found) return false;
    const count = found.frames.length;
    if (count === 0) return false;
    const index = ((frame % count) + count) % count;
    const path = found.frames[index] as string;
    const image = this.sheets(path);
    if (!image) return false;

    // Scale is taken against the FIGURE, not the canvas: the canvas is padded
    // and scaling to it would draw him short by the padding's share.
    const scale = height / found.figureHeight;
    const source = sizeOf(image);
    if (!source) return false;
    const drawnW = Math.max(1, Math.round(source.width * scale));
    const drawnH = Math.max(1, Math.round(source.height * scale));

    // The anchor is a point ON the padded canvas. Scaled by the same factor,
    // it says how far the soles sit from that canvas's top-left -- so the
    // figure lands with its soles on (feetX, feetY) and the padding hangs off
    // wherever it needs to, rather than the canvas being centred and the man
    // drifting inside it.
    const anchorX = Math.round((found.anchor[0] / source.width) * drawnW);
    const anchorY = Math.round((found.anchor[1] / source.height) * drawnH);
    const destX = Math.round(feetX - anchorX);
    const destY = Math.round(feetY - anchorY);

    if (drawnW === source.width && drawnH === source.height) {
      context.drawImage(image, destX, destY);
      return true;
    }

    const key = `${path}:${drawnW}x${drawnH}`;
    let scaled = this.cache.get(key);
    if (!scaled) {
      const made = this.resample(image, source.width, source.height, drawnW, drawnH);
      if (!made) return false;
      scaled = made;
      this.cache.set(key, scaled);
    }
    context.drawImage(scaled, destX, destY);
    return true;
  }

  /**
   * Errata 54's ordinary filtered resampling, into its own canvas.
   *
   * Smoothing is turned on HERE and nowhere else. The screen context and the
   * occlusion scratch both keep it off, so nothing else in the frame is
   * filtered; this is one offscreen canvas per (frame, drawn size), made once
   * and blitted thereafter. A 1105x1702 source down to a 205px figure is an
   * 8x reduction, which is precisely the case a filter exists for and
   * nearest-neighbour would shred.
   */
  private resample(
    image: CanvasImageSource, sw: number, sh: number, width: number, height: number,
  ): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, sw, sh, 0, 0, width, height);
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

/** Width and height of anything canvas can draw, or null if it has none. */
function sizeOf(image: CanvasImageSource): { width: number; height: number } | null {
  const source = image as { width?: number; height?: number };
  if (typeof source.width !== 'number' || typeof source.height !== 'number') return null;
  if (source.width === 0 || source.height === 0) return null;
  return { width: source.width, height: source.height };
}
