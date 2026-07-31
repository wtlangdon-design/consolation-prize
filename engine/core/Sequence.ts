import type { Facing } from './types.ts';

/**
 * SCUMM choreography: a script that sleeps and waits. Doc 22 section 7,
 * errata 28a item 3.
 *
 * SIX STEP KINDS AND NO MORE. Errata 28a strikes `parallel`, `sound`,
 * `musicTransition` and `setObjectState` from the first cut, and errata 27c
 * strikes `camera` entirely. What is left is exactly the chain doc 22 section
 * 6 describes, plus errata 30a's timed wait, and nothing speculative:
 *
 *     walk -> waitForActor -> face -> waitForActor -> chore -> say
 *
 * ERRATA 30a. `wait` was excluded from the first cut to stop "sleep 400ms and
 * hope" becoming a substitute for `waitForActor` in ordinary interaction.
 * That reasoning holds for interaction and does not hold for a cutscene,
 * where the duration IS the content -- doc 17's beats state ~6s, ~3s and a
 * ~60-70 second total, and without a timed wait the opening cannot run at
 * all. So it is granted, and fenced: `wait` is legal ONLY inside a beat whose
 * control is `none`. Anywhere else it fails the build.
 *
 * TICKED, NOT PROMISED. The runner is advanced by the scene's clock and holds
 * its position in an integer, which is what makes it deterministic, testable
 * by hand-advancing time, and cancellable the instant a room changes. A chain
 * of callbacks or a timer per beat is the thing doc 22 warns becomes brittle,
 * and it cannot be saved.
 *
 * The runner knows nothing about Consolation, actors or content. It asks the
 * host to do things and to say when they are finished.
 */

export type SequenceStep =
  | { kind: 'walk'; actor: string; x: number; y: number }
  | { kind: 'waitForActor'; actor: string }
  | { kind: 'face'; actor: string; facing: Facing }
  | { kind: 'chore'; actor: string; chore: string }
  /**
   * A line, or the interaction that produces one.
   *
   * `interact` defers resolution to the moment the step runs, which matters:
   * doc 22 section 6 puts "run verb script" AFTER the walk and the chore, so
   * resolving up front would apply an object's flag writes before the actor
   * had crossed the room to it.
   */
  | { kind: 'say'; actor?: string; line?: string; interact?: { target: string; verb: string } }
  /**
   * Errata 30a. Holds for a stated number of seconds.
   *
   * The runner cannot tell where a step came from, so it cannot enforce the
   * restriction itself -- that is done where the beats are lowered into
   * steps, and again by the build check, which is the only place that can see
   * a beat's `control` at all.
   */
  | { kind: 'wait'; seconds: number };

/** What the runner needs the world to be able to do. */
export interface SequenceHost {
  walk(actor: string, x: number, y: number): void;
  isWalking(actor: string): boolean;
  face(actor: string, facing: Facing): void;
  isTurning(actor: string): boolean;
  /** Starts a one-shot clip and returns how long it runs, in seconds. */
  chore(actor: string, chore: string): number;
  /**
   * Shows a line, and returns how long it stays up, in seconds.
   *
   * IT RETURNS A DURATION FOR THE SAME REASON `chore` DOES. This used to
   * return void, and the runner treated a line as instantaneous: it called
   * say, advanced, and went round the loop again in the SAME TICK. Beat 3 is
   * two lines -- Thad's "My name is Thaddeus Grubb..." and the driver's
   * "Course you have." -- so the first was drawn over by the second before a
   * frame was ever presented, and the opening appeared to start halfway
   * through its own joke.
   *
   * The runner does not decide how long; a duration is a property of the
   * line and of whoever is reading it, and neither is the runner's business.
   */
  say(step: Extract<SequenceStep, { kind: 'say' }>): number;
}

export class SequenceRunner {
  private steps: SequenceStep[] = [];
  private index = 0;
  private waitUntil = 0;
  private started = false;
  /**
   * True while the clock is being waited on.
   *
   * Held separately from `waitUntil` because `isRunning` has no clock. A
   * runner whose last step is a wait consumes it, reaches the end of the
   * list, and reports itself finished on the same frame -- so a three-second
   * act card lasted one frame and the caller moved straight on. It was
   * invisible in the unit tests, which advance the clock by hand and so never
   * ask the question between two ticks, and obvious the first time anyone
   * watched the screen. A trailing `chore` had the same fault.
   */
  private waiting = false;

  get isRunning(): boolean {
    return this.started && (this.index < this.steps.length || this.waiting);
  }

  /** Replaces anything already running. One performance at a time. */
  start(steps: SequenceStep[]): void {
    this.steps = steps;
    this.index = 0;
    this.waitUntil = 0;
    this.waiting = false;
    this.started = true;
  }

  /** Deterministic cancellation, per doc 22's list. Used on room change. */
  cancel(): void {
    this.steps = [];
    this.index = 0;
    this.waitUntil = 0;
    this.waiting = false;
    this.started = false;
  }

  /**
   * Advances as far as it can this tick, and returns true if anything
   * happened -- so the scene can redraw only when the performance moved.
   *
   * Loops rather than doing one step per frame: `face` on a direction the
   * actor already has completes instantly, and a runner that spent a frame on
   * each no-op made a four-step chain take four frames to do nothing.
   */
  update(seconds: number, host: SequenceHost): boolean {
    if (!this.isRunning) return false;
    let moved = false;

    // A wait in progress blocks everything, including finishing. Cleared
    // here rather than tested inside the loop so that the last step being a
    // wait still takes its stated time.
    if (this.waiting) {
      if (seconds < this.waitUntil) return false;
      this.waiting = false;
      moved = true;
    }

    // Guarded rather than while(true): a host that never reports an actor
    // finished would otherwise hang the frame instead of the sequence.
    for (let guard = 0; guard < this.steps.length + 1; guard += 1) {
      if (this.waiting || this.index >= this.steps.length) break;
      const step = this.steps[this.index] as SequenceStep;

      if (step.kind === 'walk') {
        host.walk(step.actor, step.x, step.y);
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'waitForActor') {
        if (host.isWalking(step.actor) || host.isTurning(step.actor)) break;
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'face') {
        host.face(step.actor, step.facing);
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'chore') {
        this.waitUntil = seconds + host.chore(step.actor, step.chore);
        this.waiting = true;
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'wait') {
        this.waitUntil = seconds + step.seconds;
        this.waiting = true;
        this.index += 1;
        moved = true;
        continue;
      }
      // A line holds. See SequenceHost.say -- without this, every line in a
      // beat but the last is drawn and overwritten within one tick.
      //
      // A hold of ZERO does not block. An `interact` say produces no line and
      // returns 0, and so does a host that does not care about timing; making
      // those wait a frame would put a frame's delay into every scripted
      // interaction for no reason.
      const hold = host.say(step);
      if (hold > 0) {
        this.waitUntil = seconds + hold;
        this.waiting = true;
      }
      this.index += 1;
      moved = true;
    }
    return moved;
  }
}
