import type { RoomTimelineStep } from './types.ts';

/**
 * A ROOM THAT IS ITS OWN CUTSCENE, RUN AGAINST ACTIVE TIME.
 *
 * Room 32, inside the coffin (doc 05, invariant 2, errata 70 A and B): no
 * verb panel, no hotspots, no lines, and three minutes of dirt and silence
 * that the player cannot touch. Doc 45 measures the interval in "active,
 * unpaused game time" -- 180,000 ms -- so it is a clock that stops when the
 * menu is open, not a timer that keeps going while the player makes tea.
 *
 * WHY NOT THE SEQUENCE RUNNER. The runner is doc 22's interaction chain
 * (walk, wait for the actor, face, chore, say) and its kinds are fenced one
 * errata at a time. A room with no actor on screen, no interaction and
 * nothing but timed events is not that chain, and threading it through the
 * runner would mean four new step kinds for one room. Errata 70 G rules it a
 * timeline instead: a list of `{ at, do }` events, data in the room's file,
 * fenced to rooms that hide the verb panel -- so it can never become a way to
 * stage ordinary play, which is what errata 28a was afraid of.
 *
 * PURE. It knows nothing about audio, pictures or panels; it says which
 * steps came due and the scene does them. Elapsed time is an integer number
 * of milliseconds so a save can hold it exactly.
 */
export class RoomTimeline {
  private steps: RoomTimelineStep[] = [];
  private elapsedMs = 0;
  private next = 0;

  start(steps: RoomTimelineStep[], fromMs = 0): void {
    this.steps = [...steps].sort((a, b) => a.at - b.at);
    this.elapsedMs = fromMs;
    this.next = 0;
    while (this.next < this.steps.length && this.steps[this.next]!.at * 1000 < fromMs) this.next += 1;
  }

  stop(): void {
    this.steps = [];
    this.next = 0;
    this.elapsedMs = 0;
  }

  get isRunning(): boolean {
    return this.next < this.steps.length;
  }

  /** Active milliseconds since the timeline started. */
  get elapsed(): number {
    return this.elapsedMs;
  }

  /** The checkpoint step, if the timeline declares one. */
  get checkpoint(): RoomTimelineStep | null {
    return this.steps.find((step) => step.checkpoint) ?? null;
  }

  /**
   * SKIP SCENE (errata 71 B): jumps to the checkpoint and returns every step
   * from here up to and including it, in order, so the caller can apply
   * their state without performing them. Nothing if there is no checkpoint
   * ahead.
   */
  skipToCheckpoint(): RoomTimelineStep[] {
    const target = this.steps.findIndex((step, index) => index >= this.next && step.checkpoint);
    if (target < 0) return [];
    const passed = this.steps.slice(this.next, target + 1);
    this.next = target + 1;
    this.elapsedMs = Math.max(this.elapsedMs, Math.round(this.steps[target]!.at * 1000));
    return passed;
  }

  /**
   * Advances by `activeMs` -- zero while paused -- and returns every step
   * whose time has come, in order. A long frame returns several at once
   * rather than skipping any.
   */
  advance(activeMs: number): RoomTimelineStep[] {
    if (!this.isRunning) return [];
    this.elapsedMs += Math.max(0, Math.round(activeMs));
    const due: RoomTimelineStep[] = [];
    while (this.next < this.steps.length && this.steps[this.next]!.at * 1000 <= this.elapsedMs) {
      due.push(this.steps[this.next]!);
      this.next += 1;
    }
    return due;
  }
}
