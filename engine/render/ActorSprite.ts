import type { ActorClip, ActorFile, Facing } from '../core/types.ts';
import { assertRequiredClip } from '../core/Assertions.ts';

/** A loaded frame image, or null while it is still loading. */
export type SheetSource = (path: string) => CanvasImageSource | null;

/**
 * WHAT `draw` PUT ON THE SCREEN: the file it took and the rectangle it landed
 * in, in the same coordinate space the caller handed it.
 *
 * The file path is gate 7's whole subject -- a proof that says a character is
 * on screen and cannot say which asset drew him cannot tell a stale sheet from
 * a current one. The rectangle is gate 8B's: the sprite's bounds as the
 * renderer computed them, rather than as a second copy of the projection
 * arithmetic would recompute them.
 */
export interface DrawnFrame {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where a point on the padded canvas lands on screen, once the figure is drawn
 * with its soles on (feetX, feetY) at `drawn` pixels.
 *
 * ONE FORMULA, TWO CALLERS, ON PURPOSE. `draw` uses it for the frame's own
 * top-left corner and the lantern glow uses it for the lamp. Written out
 * separately in both places it would be two formulas that agree today: the
 * anchor rounding here is not obvious, and a glow that computes its own
 * version drifts a pixel or two the first time either changes, in a way that
 * looks like the light being slightly loose on the lamp rather than like a
 * bug (R5i -- a mechanism agreeing with itself is the failure).
 */
export function projectOnCanvas(
  point: readonly [number, number],
  anchor: readonly [number, number],
  source: { width: number; height: number },
  drawn: { width: number; height: number },
  feetX: number,
  feetY: number,
): { x: number; y: number } {
  const anchorX = Math.round((anchor[0] / source.width) * drawn.width);
  const anchorY = Math.round((anchor[1] / source.height) * drawn.height);
  return {
    x: Math.round(feetX - anchorX + (point[0] / source.width) * drawn.width),
    y: Math.round(feetY - anchorY + (point[1] / source.height) * drawn.height),
  };
}

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
  /**
   * RESAMPLED FRAMES, MOST RECENTLY USED LAST, AND BOUNDED. The key is the
   * frame at one drawn size, and in a room that scales him by depth every row
   * he walks down is another size of every frame he shows on the way: the
   * cache filled with a canvas per (frame, height) pair and never let one go.
   * The Act I pass in Room 5 lost its renderer after seven minutes and sixty
   * captures, and the runs before it never stayed in one scaled room long
   * enough to see it. A bound keeps the working set -- the handful of sizes
   * he is at while standing -- and lets the walk's transients be remade.
   */
  private readonly cache = new Map<string, HTMLCanvasElement>();
  static readonly CACHE_LIMIT = 96;
  /** How many resampled canvases are held right now. For the tests. */
  cached(): number { return this.cache.size; }
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
  frameCount(clip: string, facing: Facing, surface: string, state?: string): number {
    return this.clipOf(clip, facing, surface, state)?.frames.length ?? 0;
  }

  /**
   * Where this mover's lamp is on screen, or null if this clip has no lamp.
   *
   * NULL IS THE ANSWER FOR MOST CLIPS AND MOST CHARACTERS, and it is not a
   * failure: Thad carries no lantern, Hob's `stand` has no anchor recorded
   * yet, and both should draw no light rather than a light in a guessed place.
   * A lamp whose position was inferred would be a lamp somewhere plausible,
   * which is worse than none -- the pool would sit near his hand and never
   * quite on it, and nothing would ever say why.
   *
   * The frame index is taken the same way `draw` takes it, so the light is on
   * the lamp in the frame being drawn rather than in the one before it.
   */
  lanternAt(
    clip: string, facing: Facing, surface: string, frame: number,
    feetX: number, feetY: number, height: number, state?: string,
  ): { x: number; y: number } | null {
    const found = this.clipOf(clip, facing, surface, state);
    const anchors = found?.lanternAnchor;
    if (!found || !anchors || anchors.length === 0) return null;
    const count = found.frames.length;
    if (count === 0) return null;
    const index = ((frame % count) + count) % count;
    const point = anchors[Math.min(index, anchors.length - 1)];
    if (!point) return null;
    const image = this.sheets(found.frames[index] as string);
    const source = image ? sizeOf(image) : null;
    // NO LIGHT UNTIL THE FRAME HAS ARRIVED. The projection needs the image's
    // own pixel size, and guessing it from `figureHeight` would put the pool
    // in the wrong place for exactly as long as the sprite was a placeholder
    // -- a glow under a graybox, which is the one combination that reads as
    // the renderer having lost track of who is where.
    if (!source) return null;
    const scale = height / found.figureHeight;
    return projectOnCanvas(point, found.anchor, source, {
      width: Math.max(1, Math.round(source.width * scale)),
      height: Math.max(1, Math.round(source.height * scale)),
    }, feetX, feetY);
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
  private clipOf(clip: string, facing: Facing, surface: string,
                 state?: string): ActorClip | undefined {
    // A FACING THE CHARACTER IS NOT DRAWN IN IS DATA, NOT A GAP. Hob is
    // right-facing only, and asking him to face left must neither substitute
    // another facing nor fail -- it draws nothing, and the caller falls back
    // to a visible placeholder. Declared in the record rather than inferred
    // from what happens to be missing, so a character who SHOULD have four
    // facings and has three still trips the guard below.
    const facings = this.table.facings;
    if (facings && !facings.includes(facing)) return undefined;

    // TWO DISCRIMINATORS, ONE LOOKUP. State first, because it is the coarser
    // fact -- a shut door and an open one are different pictures of the same
    // clip -- then surface, then neither. Each step is the same
    // exact-match-then-fall-back the surface variant already used, so a record
    // that declares no state behaves exactly as it did.
    const of = (id: string, want: string | undefined, wantSurface: boolean) => this.table.clips
      .find((candidate) => candidate.id === id && candidate.facing === facing
        && candidate.state === want
        && (!wantSurface || candidate.surface === surface));
    const found = of(clip, state, true) ?? of(clip, state, false)
      ?? of(clip, undefined, true) ?? of(clip, undefined, false);
    assertRequiredClip(found, clip, facing, surface);
    return found;
  }

  /**
   * Draws the figure with its soles on (feetX, feetY) at a drawn height.
   *
   * Returns null if the frame has not loaded or the clip is not declared, so
   * the caller can fall back to a graybox rather than leave a hole where a
   * character should be. That is a fallback to a VISIBLE PLACEHOLDER, which
   * is the opposite of substituting a clip nobody asked for.
   *
   * IT RETURNS THE DRAW RATHER THAN A BOOLEAN, and the difference is the whole
   * of gate 7 and gate 8B. A boolean says a figure was drawn; it cannot say
   * WHICH FILE was drawn or WHERE the rectangle landed, and both of those are
   * things a proof has to establish rather than infer. Inferring them means
   * recomputing `projectOnCanvas` outside this file and comparing the answer
   * with itself, which is R5i. The truthiness is unchanged, so every existing
   * caller reads the same as it did.
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
    state?: string,
  ): DrawnFrame | null {
    const found = this.clipOf(clip, facing, surface, state);
    if (!found) return null;
    const count = found.frames.length;
    if (count === 0) return null;
    const index = ((frame % count) + count) % count;
    const path = found.frames[index] as string;
    const image = this.sheets(path);
    if (!image) return null;

    // Scale is taken against the FIGURE, not the canvas: the canvas is padded
    // and scaling to it would draw him short by the padding's share.
    const scale = height / found.figureHeight;
    const source = sizeOf(image);
    if (!source) return null;
    const drawnW = Math.max(1, Math.round(source.width * scale));
    const drawnH = Math.max(1, Math.round(source.height * scale));

    // The anchor is a point ON the padded canvas. Scaled by the same factor,
    // it says how far the soles sit from that canvas's top-left -- so the
    // figure lands with its soles on (feetX, feetY) and the padding hangs off
    // wherever it needs to, rather than the canvas being centred and the man
    // drifting inside it.
    const dest = projectOnCanvas([0, 0], found.anchor, source,
      { width: drawnW, height: drawnH }, feetX, feetY);
    const destX = dest.x;
    const destY = dest.y;

    const landed = { path, x: destX, y: destY, width: drawnW, height: drawnH };
    if (drawnW === source.width && drawnH === source.height) {
      context.drawImage(image, destX, destY);
      return landed;
    }

    const key = `${path}:${drawnW}x${drawnH}`;
    let scaled = this.cache.get(key);
    if (scaled) {
      // Re-inserting moves the key to the end: Map keeps insertion order, so
      // the first key is always the least recently drawn.
      this.cache.delete(key);
    } else {
      const made = this.resample(image, source.width, source.height, drawnW, drawnH);
      if (!made) return null;
      scaled = made;
    }
    this.cache.set(key, scaled);
    while (this.cache.size > ActorSprite.CACHE_LIMIT) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      const gone = this.cache.get(oldest);
      this.cache.delete(oldest);
      // Release the bitmap's memory now rather than when the collector gets
      // to it: a zero-size canvas holds no backing store.
      if (gone) { gone.width = 0; gone.height = 0; }
    }
    context.drawImage(scaled, destX, destY);
    return landed;
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

  /**
   * Where a clip's canvas lands on screen, and at what scale.
   *
   * THE OVERLAY MUST USE THE BODY'S OWN ARITHMETIC, not a copy of it. A head
   * composited a pixel off its neck is a head that twitches when the body
   * does, and the two would drift the moment either anchor changed. This
   * returns exactly what `draw` computes and nothing else does the sum twice.
   *
   * Null when the clip does not resolve or its frame has not loaded -- there
   * is then no body to composite onto, which is the right answer rather than
   * an overlay floating where a character is not.
   */
  placement(clip: string, facing: Facing, surface: string, feetX: number, feetY: number,
            height: number, state?: string): { x: number; y: number; scale: number } | null {
    const found = this.clipOf(clip, facing, surface, state);
    if (!found || found.frames.length === 0) return null;
    const image = this.sheets(found.frames[0] as string);
    if (!image) return null;
    const source = sizeOf(image);
    if (!source) return null;
    const scale = height / found.figureHeight;
    const drawnW = Math.max(1, Math.round(source.width * scale));
    const drawnH = Math.max(1, Math.round(source.height * scale));
    return {
      x: Math.round(feetX - Math.round((found.anchor[0] / source.width) * drawnW)),
      y: Math.round(feetY - Math.round((found.anchor[1] / source.height) * drawnH)),
      scale,
    };
  }

  /**
   * Half the drawn width of the canvas this clip lands on, or null.
   *
   * Doc 44 part two #4 asks whether two figures at one feet-Y overlap in x,
   * and that question needs a real extent: the coach is 956 wide at 389 tall
   * and a person is roughly a third as wide as tall, so any single ratio is
   * wrong for one of them by a factor of three.
   *
   * IT IS THE PADDED CANVAS, NOT THE FIGURE. That over-reports -- the frames
   * carry 260 columns of padding either side so a swung arm is not clipped --
   * and over-reporting is the right direction for an overlap test whose whole
   * purpose is to catch a pair that MIGHT be ambiguous. A bounding box of the
   * alpha would be tighter and would change every frame, which is the thing
   * `draw` is careful never to do.
   *
   * Null when the clip is not declared or its frame has not loaded, because
   * then there is nothing drawn to overlap with.
   */
  drawnHalfWidth(clip: string, facing: Facing, surface: string, height: number,
                 state?: string): number | null {
    const found = this.clipOf(clip, facing, surface, state);
    if (!found || found.frames.length === 0) return null;
    const image = this.sheets(found.frames[0] as string);
    if (!image) return null;
    const source = sizeOf(image);
    if (!source) return null;
    return (source.width * (height / found.figureHeight)) / 2;
  }
}

/** Width and height of anything canvas can draw, or null if it has none. */
function sizeOf(image: CanvasImageSource): { width: number; height: number } | null {
  const source = image as { width?: number; height?: number };
  if (typeof source.width !== 'number' || typeof source.height !== 'number') return null;
  if (source.width === 0 || source.height === 0) return null;
  return { width: source.width, height: source.height };
}
