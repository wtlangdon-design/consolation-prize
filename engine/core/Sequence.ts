import type { Facing } from './types.ts';

/**
 * SCUMM choreography: a script that sleeps and waits. Doc 22 section 7,
 * errata 28a item 3.
 *
 * FIVE STEP KINDS AND NO MORE. Errata 28a strikes `parallel`, `sound`,
 * `musicTransition` and `setObjectState` from the first cut, and errata 27c
 * strikes `camera` entirely. What is left is exactly the chain doc 22 section
 * 6 describes and nothing speculative:
 *
 *     walk -> waitForActor -> face -> waitForActor -> chore -> say
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
  | { kind: 'say'; actor?: string; line?: string; interact?: { target: string; verb: string } };

/** What the runner needs the world to be able to do. */
export interface SequenceHost {
  walk(actor: string, x: number, y: number): void;
  isWalking(actor: string): boolean;
  face(actor: string, facing: Facing): void;
  isTurning(actor: string): boolean;
  /** Starts a one-shot clip and returns how long it runs, in seconds. */
  chore(actor: string, chore: string): number;
  say(step: Extract<SequenceStep, { kind: 'say' }>): void;
}

export class SequenceRunner {
  private steps: SequenceStep[] = [];
  private index = 0;
  private waitUntil = 0;
  private started = false;

  get isRunning(): boolean {
    return this.started && this.index < this.steps.length;
  }

  /** Replaces anything already running. One performance at a time. */
  start(steps: SequenceStep[]): void {
    this.steps = steps;
    this.index = 0;
    this.waitUntil = 0;
    this.started = true;
  }

  /** Deterministic cancellation, per doc 22's list. Used on room change. */
  cancel(): void {
    this.steps = [];
    this.index = 0;
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

    // Guarded rather than while(true): a host that never reports an actor
    // finished would otherwise hang the frame instead of the sequence.
    for (let guard = 0; guard < this.steps.length + 1; guard += 1) {
      if (!this.isRunning) break;
      if (seconds < this.waitUntil) break;
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
        this.index += 1;
        moved = true;
        continue;
      }
      host.say(step);
      this.index += 1;
      moved = true;
    }
    return moved;
  }
}
