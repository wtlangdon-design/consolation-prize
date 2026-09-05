/**
 * Feet crossing boards: doc 25's proud floorboard, and anything else a room
 * declares a `step` on.
 *
 * WHY A SWEEP AND NOT A POINT TEST. The tread is eighteen rows tall and the
 * protagonist crosses it at up to 780 px/s (pace C at Room 5's scale): thirteen
 * pixels a frame at sixty, twice that on a dropped frame, so "is the foot
 * inside the rectangle this frame" can be false on every frame of a crossing.
 * The segment from where the feet were to where they are is clipped against
 * the tread instead; a crossing that never lands a frame inside still cuts
 * the rectangle.
 *
 * WHY IT FIRES ONCE. A board creaks when it is LOADED, not for every frame a
 * foot rests on it. The trigger is armed while the feet are off the tread,
 * fires on the first sweep that touches it, and stays disarmed until the feet
 * are off it again -- so standing on it is silent and walking straight back
 * across it creaks again. There is no cooldown clock; re-arming is physical.
 *
 * WHY WALKING ONLY. A placement is not a step: a load, a resume or a scripted
 * placement that lands on the board does not creak, and the trigger arms
 * itself from wherever the feet are when the room is entered.
 *
 * The engine knows none of this is a floorboard. It knows a rectangle, two
 * state names, a hold, and that a caption and a cue may be handed back to
 * whoever asked.
 */
import type { Interactable, StepTrigger } from './types.ts';

export interface StepEvent {
  target: Interactable;
  step: StepTrigger;
}

interface Armed {
  target: Interactable;
  step: StepTrigger;
  armed: boolean;
  pressedUntil: number | null;
}

/** Does the closed segment a->b intersect the rectangle? Liang-Barsky. */
export function segmentCrossesRect(ax: number, ay: number, bx: number, by: number,
                                   rect: [number, number, number, number]): boolean {
  const [rx, ry, rw, rh] = rect;
  const x0 = rx, x1 = rx + rw, y0 = ry, y1 = ry + rh;
  const dx = bx - ax, dy = by - ay;
  let t0 = 0, t1 = 1;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  return clip(-dx, ax - x0) && clip(dx, x1 - ax) && clip(-dy, ay - y0) && clip(dy, y1 - ay);
}

export function insideRect(x: number, y: number, rect: [number, number, number, number]): boolean {
  const [rx, ry, rw, rh] = rect;
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

export class StepTriggers {
  private readonly boards: Armed[];

  constructor(targets: Interactable[], feetX: number, feetY: number) {
    this.boards = targets
      .filter((target): target is Interactable & { step: StepTrigger } => target.step !== undefined)
      .map((target) => ({
        target, step: target.step,
        // Armed only if the feet start OFF the board: a room entered standing
        // on it does not creak until he steps off and back on.
        armed: !insideRect(feetX, feetY, target.step.tread),
        pressedUntil: null,
      }));
  }

  get any(): boolean {
    return this.boards.length > 0;
  }

  /**
   * One tick. `walking` says the movement between the two positions was a
   * walk rather than a placement. Returns the boards that fired, and whether
   * anything changed state (a fire, or a pressed board returning to rest) so
   * the caller can redraw and set the object states.
   */
  update(nowMs: number, fromX: number, fromY: number, toX: number, toY: number, walking: boolean,
         setState: (target: Interactable, state: string) => void): { fired: StepEvent[]; changed: boolean } {
    const fired: StepEvent[] = [];
    let changed = false;
    for (const board of this.boards) {
      const { step } = board;
      const on = insideRect(toX, toY, step.tread);
      const swept = walking && (fromX !== toX || fromY !== toY)
        && segmentCrossesRect(fromX, fromY, toX, toY, step.tread);
      if (board.armed && (swept || (walking && on))) {
        board.armed = false;
        board.pressedUntil = nowMs + step.holdMs;
        setState(board.target, step.pressed);
        fired.push({ target: board.target, step });
        changed = true;
      }
      if (board.pressedUntil !== null && nowMs >= board.pressedUntil) {
        board.pressedUntil = null;
        setState(board.target, step.rest);
        changed = true;
      }
      // Re-arm when the feet are off the wood. A crossing that tunnelled
      // straight through ends off the wood and re-arms in the same tick,
      // which is right: the next crossing is a new crossing.
      if (!board.armed && !on) board.armed = true;
    }
    return { fired, changed };
  }

  /** For the probe: which boards are armed and which are pressed, by id. */
  report(): Record<string, { armed: boolean; pressed: boolean }> {
    const out: Record<string, { armed: boolean; pressed: boolean }> = {};
    for (const board of this.boards) out[board.target.id] = { armed: board.armed, pressed: board.pressedUntil !== null };
    return out;
  }
}
