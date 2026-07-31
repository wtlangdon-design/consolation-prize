import type { IdleFigure, RoomFile } from '../core/types.ts';

/**
 * Two-frame idle sprites for a drawn crowd. Errata ruling 20.
 *
 * Ruling 20 corrects doc 18: sprites are the game's principal source of
 * motion, not palette cycling. A painted crowd against a reference where a
 * comparable room has twelve animating figures reads as a waxwork -- and in
 * the Nugget the cycled stove would have been the only moving thing in a room
 * full of people, pulling the eye to exactly the wrong place.
 *
 * These are the cheapest animation in the engine: two frames, a slow rate, and
 * a phase offset. No state, no interpolation, nothing to save. Which frame is
 * showing is a function of the clock and nothing else, so a load, a room
 * change and a menu close all resume mid-idle without anyone tracking it.
 *
 * They draw BEFORE the actor. They are crowd -- he walks in front of them.
 */
export class IdleLayer {
  private readonly context: CanvasRenderingContext2D;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  draw(room: RoomFile, sheet: CanvasImageSource | null, seconds: number): void {
    if (!sheet || !room.idles?.figures?.length) return;
    for (const figure of room.idles.figures) {
      const frame = figure.frames[this.frameOf(figure, seconds)];
      if (!frame) continue;
      const [sx, sy, width, height] = frame;
      const [x, feet] = figure.at;
      // `at` is the figure's feet, centred -- the same rule the sheet was
      // drawn by, so a cell lands where its declaration says.
      this.context.drawImage(
        sheet, sx, sy, width, height,
        Math.round(x - width / 2), feet - height + 1, width, height,
      );
    }
  }

  /**
   * Which of the two frames is showing.
   *
   * `rate` is full cycles per second, so a figure at 0.34 Hz holds each pose
   * for about a second and a half. Ruling 20 wants 0.3-0.8 Hz and nothing
   * metronomic, which the per-figure phase supplies: three figures on the
   * same beat is worse than none.
   */
  private frameOf(figure: IdleFigure, seconds: number): number {
    const turns = seconds * figure.rate + (figure.phase ?? 0);
    return Math.floor(turns * 2) % 2;
  }

  /** True when any figure has changed frame between two instants. */
  static changed(room: RoomFile, before: number, after: number): boolean {
    for (const figure of room.idles?.figures ?? []) {
      const at = (t: number) => Math.floor((t * figure.rate + (figure.phase ?? 0)) * 2) % 2;
      if (at(before) !== at(after)) return true;
    }
    return false;
  }
}
