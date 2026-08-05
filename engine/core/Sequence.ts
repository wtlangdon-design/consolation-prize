import type { Facing } from './types.ts';

/**
 * SCUMM choreography: a script that sleeps and waits. Doc 22 section 7,
 * errata 28a item 3.
 *
 * SEVEN STEP KINDS AND NO MORE. Errata 28a strikes `parallel`, `sound`,
 * `musicTransition` and `setObjectState` from the first cut, and errata 27c
 * strikes `camera` entirely. What is left is exactly the chain doc 22 section
 * 6 describes, plus errata 30a's timed wait and errata 38's `move`, and
 * nothing speculative:
 *
 *     walk -> waitForActor -> face -> waitForActor -> chore -> say
 *
 * ERRATA 38 granted the seventh, `move`, for the coach's departure: "a coach
 * that vanishes on a click is not a coach leaving". It is fenced exactly as
 * `wait` is -- legal only inside a beat whose control is `none` -- because in
 * a cutscene the movement IS the content, and in ordinary interaction `walk`
 * and `waitForActor` already do this properly.
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
   * ERRATA 38. Translates a named mover from where it is -- or from `from`,
   * which places it first -- to a point, over a stated duration.
   *
   * It is NOT a walk. A walk is routed across the room's boxes and belongs to
   * somebody standing on the floor; a coach leaving frame right crosses no
   * walk box at all and the last thing it should do is take the long way
   * round a trough.
   */
  | { kind: 'move'; actor: string; from?: { x: number; y: number };
      x: number; y: number; seconds: number }
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
  | { kind: 'wait'; seconds: number }
  /**
   * ERRATA 28a STRUCK `setObjectState` FROM THE FIRST CUT, AND THIS IS IT
   * BACK. Flagged rather than slipped in: it is an EIGHTH kind and the
   * decision is not the engine's.
   *
   * The shape is errata 38's exactly. A cutscene has to be able to change
   * what an object IS, not only where it stands: the coach's door is open
   * while Thad climbs out of it and shut while he stands beside it, and no
   * player action opens or closes it. Nothing else in the vocabulary can say
   * so -- `set` on a beat writes flags, and object state is not a flag; a
   * response rule's `state` needs a verb and a target, which would mean
   * inventing a hotspot nobody may click purely to hold a state change.
   *
   * FENCED LIKE `wait` AND `move`, to beats whose control is `none`. In
   * ordinary interaction a state change belongs to the verb that caused it,
   * which is where doc 22 item 9 already puts it. In a cutscene there is no
   * verb, and the change is the content.
   *
   * `state` ABSENT MEANS BACK TO THE DECLARED DEFAULT -- shut, in the coach's
   * case. Absent rather than null for the reason `ActorClip.state` gives:
   * `clipOf` is exact-match-then-fall-back and a null is a state nobody can
   * ask for.
   */
  | { kind: 'setState'; object: string; state?: string }
  /**
   * Doc 17 beat 11. Walk a mover along a TRACED path over its own duration.
   *
   * NOT A `move` AND NOT A `walk`. A walk is routed across the room's boxes
   * and this leaves them entirely; a move is a straight glide to one point at
   * a constant rate in SCREEN pixels, and a receding figure covered at a
   * constant screen rate reads as accelerating away. The path carries a drawn
   * height per waypoint because it goes far above the band the depth curve was
   * calibrated for, and the engine progresses linearly in `ds / height` so the
   * walk is steady in the world rather than on the glass.
   *
   * `path` names a file, not coordinates. The trace is content -- it was made
   * by eye against the plate, and re-tracing it must not need an engine
   * change.
   */
  | { kind: 'path'; actor: string; path: string }
  /**
   * The travel an exit declined to do for itself.
   *
   * `road_west` declares `travelWhenTold` precisely so the beat owns the
   * departure -- an exit that moves you the instant you touch it cannot also
   * be one you watch. It used to be spelled `interact road_west WALK_TO`,
   * which resolves the verb where it stands and therefore WALKS HIM TO THE
   * EXIT'S walkTo FIRST: back down the field to y710, after the beat had just
   * spent forty seconds taking him up it.
   *
   * NAMES THE EXIT, NOT THE ROOM. Where road_west goes is on road_west, and a
   * destination repeated in the staging is a second copy of a fact that can
   * disagree with the first (R5k).
   */
  | { kind: 'travel'; through: string }
  /**
   * Where the view looks. See `SequenceStagingStep`'s note for why errata 27c
   * no longer strikes this and what the two forms mean.
   *
   * INSTANT, AND IT HOLDS NOTHING. A `to` is a cut, not a pan, so there is no
   * duration for the runner to wait out and no `waitForActor` after it.
   */
  | { kind: 'camera'; to?: number; follow?: string };

/** What the runner needs the world to be able to do. */
/**
 * WHICH BEAT A STEP CAME FROM. Set by the lowering, read by anything that has
 * to say where in a scene something happened.
 *
 * Every diagnosis tonight had to reconstruct this from timings and positions:
 * the coach facing front, the chore clips arriving late, two movers at one
 * depth. The runner knew which beat it was playing and threw the fact away at
 * the moment it flattened beats into steps.
 *
 * It is not content -- a beat number is structure, and doc 17 authored it.
 */
export type BeatTag = string | undefined;

export interface SequenceHost {
  walk(actor: string, x: number, y: number): void;
  /**
   * ERRATA 38. Translates a named mover, placing it at `from` first when the
   * step says where from. `isWalking` reports on it, so a `waitForActor`
   * after a `move` waits for the arrival exactly as it does after a walk.
   */
  /** Walk a mover along a traced path. Returns how long it will take. */
  followPath(actor: string, path: string): number;
  /** Take the exit that declined to travel when it was used. */
  travel(through: string): void;
  move(actor: string, from: { x: number; y: number } | undefined,
       x: number, y: number, seconds: number): void;
  isWalking(actor: string): boolean;
  face(actor: string, facing: Facing): void;
  isTurning(actor: string): boolean;
  /**
   * Whether a one-shot clip is still running, and therefore still owns the
   * body. THE ACTOR IS THE AUTHORITY ON HIS OWN CHORE, not a deadline the
   * runner computed when it started one.
   */
  isChoring(actor: string): boolean;
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
  /** Doc 22 item 9's state, set from a cutscene. See the step's own note. */
  setState(object: string, state: string | undefined): void;
  /**
   * Points the view at a world x, or hands it back to a named mover.
   *
   * Returns nothing and holds nothing: a cut is over by the time the next step
   * dispatches, and a hand-back takes effect on the following tick's follow.
   */
  camera(to: number | undefined, follow: string | undefined): void;
}

export class SequenceRunner {
  private steps: SequenceStep[] = [];
  private index = 0;
  /**
   * The beat the step now playing came from.
   *
   * THE LAST STEP DISPATCHED, NOT `steps[index]`. A chore, a wait and a say
   * all advance the index BEFORE they hold, so for the whole of the hold --
   * which is nearly all of a cutscene's wall-clock -- `steps[index]` is the
   * step that has not started yet, and at a beat boundary that is the NEXT
   * beat. Reading it would have reported beat 3 for the seven seconds of beat
   * 2 that anybody could see.
   */
  private playing: BeatTag;

  /**
   * AND IT IS UNDEFINED WHEN NOTHING IS RUNNING, which is not a detail.
   *
   * `playing` is cleared by `cancel` and replaced by `start`, and neither
   * happens when a sequence simply reaches its end -- so a runner that had
   * finished beat 3 went on answering "3" for as long as it sat idle. The
   * gauntlet read that as beat 3 never ending, waited for a boundary that
   * could not arrive, and timed out through the driver's whole conversation
   * and everything after it.
   *
   * The stale answer was ALSO the plausible one, which is why it survived a
   * reading: 3 is the last beat that played, and "the last beat that played"
   * is a defensible thing for a field called `beat` to mean, right up until
   * something asks it what is on screen now.
   */
  get beat(): BeatTag {
    return this.isRunning ? this.playing : undefined;
  }

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
    // Before the first tick, the beat about to play is the one that owns the
    // first step -- otherwise anything sampling on the frame a segment starts
    // sees no beat at all.
    this.playing = (steps[0] as { beat?: string } | undefined)?.beat;
  }

  /** Deterministic cancellation, per doc 22's list. Used on room change. */
  cancel(): void {
    this.steps = [];
    this.index = 0;
    this.waitUntil = 0;
    this.waiting = false;
    this.started = false;
    this.playing = undefined;
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
      // Recorded on dispatch, not on completion: a step that holds is the one
      // on screen for the length of its hold.
      this.playing = (step as { beat?: string }).beat;

      if (step.kind === 'walk') {
        host.walk(step.actor, step.x, step.y);
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'move') {
        host.move(step.actor, step.from, step.x, step.y, step.seconds);
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'path') {
        // HELD FOR ITS OWN DURATION, the way a chore is. The path knows how
        // long it takes -- that is `beatSeconds`, and the title is keyed to
        // the same number -- so there is nothing for a `waitForActor` to add.
        this.waitUntil = seconds + host.followPath(step.actor, step.path);
        this.waiting = true;
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'travel') {
        host.travel(step.through);
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'camera') {
        host.camera(step.to, step.follow);
        this.index += 1;
        moved = true;
        continue;
      }
      if (step.kind === 'waitForActor') {
        if (host.isWalking(step.actor) || host.isTurning(step.actor)
          || host.isChoring(step.actor)) break;
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
      if (step.kind === 'setState') {
        host.setState(step.object, step.state);
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
