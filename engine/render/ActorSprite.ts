import type { ActorFile, ActorSize, Facing } from '../core/types.ts';
import { decimate, kept, scaleFor } from '../core/Decimation.ts';

/** A loaded sheet, or null while it is still loading. */
export type SheetSource = (path: string) => CanvasImageSource | null;

/**
 * Draws the player character. Errata ruling 24 lives here.
 *
 * Two sheets are drawn art. Above the measured threshold the near sheet is
 * DECIMATED to the wanted height -- whole rows and columns dropped, nothing
 * blended -- and at or below it the far sheet is used, snapped. That is one
 * source swap per character per room instead of ruling 15's three, and every
 * height in between is its own crisp reduction rather than the nearest of
 * three drawn sizes.
 *
 * Decimated frames are cached by (sheet, clip, frame, height). A walk across
 * Room 2's band visits fifteen heights, so the cache tops out at a few dozen
 * small canvases and every frame after the first is a plain blit.
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

  /** Frames in a clip, so the caller can pick one without knowing the sheet. */
  frameCount(clip: string, facing: Facing, surface: string, height: number): number {
    return this.clipOf(this.sizeFor(height), clip, facing, surface)?.frames ?? 1;
  }

  private clipOf(size: ActorSize, clip: string, facing: Facing, surface: string) {
    return (
      size.clips.find(
        (candidate) =>
          candidate.id === clip && candidate.facing === facing && candidate.surface === surface,
      )
      // A sheet that lacks the asked-for surface still has the character on
      // it, so drop the surface before dropping anything else.
      ?? size.clips.find((candidate) => candidate.id === clip && candidate.facing === facing)
      // Then keep the FACING and give up the clip, never the other way round.
      // The first version fell through to clips[0] and drew a front-on
      // standing frame whenever a clip was missing a facing, which is how a
      // reaction that had only been exported front-on appeared to work: he
      // played it facing the camera and nothing looked broken.
      ?? size.clips.find((candidate) => candidate.facing === facing && candidate.surface === surface)
      ?? size.clips[0]
    );
  }

  /**
   * Draws the figure with its soles on (feetX, feetY) at a drawn height.
   *
   * Returns false if the sheet has not loaded, so the caller can fall back
   * rather than leave a hole where the protagonist should be.
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

    // At or below the threshold the far sheet is drawn as it is. Above it,
    // the near sheet is decimated to the wanted height.
    if (size === this.table.sizes.far || height >= size.height) {
      context.drawImage(image, sx, sy, cellW, cellH,
        Math.round(feetX - cellW / 2), Math.round(feetY - cellH + 1), cellW, cellH);
      return true;
    }

    const key = `${size.sheet}:${found.row}:${column}:${height}`;
    let cut = this.cache.get(key);
    if (!cut) {
      // The cell is cellH tall and the figure occupies all of it, so the
      // scale is picked against the CELL rather than against the nominal
      // height -- decimating to `height` rows would silently crop him by the
      // two rows of keyline and headroom the exporter allows.
      const wanted = Math.max(1, Math.round((height / size.height) * cellH));
      cut = decimate(image, sx, sy, cellW, cellH, scaleFor(cellH, wanted));
      this.cache.set(key, cut);
    }
    context.drawImage(cut,
      Math.round(feetX - cut.width / 2), Math.round(feetY - cut.height + 1));
    return true;
  }

  /**
   * How tall the figure will actually be drawn at a wanted height.
   *
   * The decimation table is not linear over short runs, so asking for 34 can
   * give 33. Anything that has to agree with what is on screen -- a legibility
   * probe, a staging check -- has to ask rather than assume.
   */
  drawnHeight(height: number): number {
    const size = this.sizeFor(height);
    if (size === this.table.sizes.far || height >= size.height) return size.height;
    const [, cellH] = size.cell;
    const wanted = Math.max(1, Math.round((height / size.height) * cellH));
    return kept(cellH, scaleFor(cellH, wanted)).length;
  }
}
