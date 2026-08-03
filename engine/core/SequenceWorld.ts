import { assertBodyUnowned } from './Assertions.ts';
import type { Actor } from './Actor.ts';
import type { RoomActors } from './RoomActors.ts';
import type { SequenceHost, SequenceStep } from './Sequence.ts';
import type { Facing } from './types.ts';

/**
 * Doc 34 section 4.6 row 6: "one body owner; prop tracks share its clock
 * only". `RuntimeCoordinator` satisfies this interface exactly, and step E
 * hands one in here with no change to this file; until it does, the guard
 * itself is what matters and it is the same guard either way.
 */
export interface BodyOwnership {
  claimBody(actor: string, owner: string): void;
  releaseBody(actor: string, owner: string): void;
  bodyOwner(actor: string): string | undefined;
}

/** The two things that can drive a body, and they are exclusive. */
export const WALK_OWNER = 'walk';
export const CHORE_OWNER = 'chore';

/**
 * Minimal body-ownership register, for use until the scene stands a
 * `RuntimeCoordinator` up. Same map, same assertion, same failure.
 */
export class BodyOwners implements BodyOwnership {
  private readonly owners = new Map<string, string>();

  claimBody(actor: string, owner: string): void {
    assertBodyUnowned(actor, owner, this.owners.get(actor));
    this.owners.set(actor, owner);
  }

  releaseBody(actor: string, owner: string): void {
    if (this.owners.get(actor) === owner) this.owners.delete(actor);
  }

  bodyOwner(actor: string): string | undefined {
    return this.owners.get(actor);
  }

  releaseAll(): void {
    this.owners.clear();
  }
}

export interface SequenceWorldParts {
  actors: RoomActors;
  bodies: BodyOwnership;
  /**
   * How long a one-shot clip runs on this mover, in seconds.
   *
   * IT MUST THROW FOR A CLIP NOBODY HAS DRAWN, naming it. Doc 34 step C
   * removes the last required-clip fallback and this must not build a new
   * one: a chore that quietly plays a nearby clip, or frame 0, or nothing at
   * all, hides missing coverage behind something that looks like it works.
   * `Assertions.assertRequiredClip` is the guard shipped for exactly this.
   */
  choreSeconds: (mover: Actor, clip: string) => number;
  /** Shows a line and returns how long it holds. See `SequenceHost.say`. */
  say: (step: Extract<SequenceStep, { kind: 'say' }>) => number;
}

/**
 * THE HOST, AND IT HONOURS THE ACTOR ARGUMENT. Issue X4 defect 1.
 *
 * What was there:
 *
 *     walk:  (_actor, x, y) => { this.actor.walkTo(x, y); }
 *     face:  (_actor, facing) => { this.actor.setFacing(facing); }
 *     chore: (_actor, clip) => { this.actor.react(clip, seconds); }
 *
 * The id arrived on every step, was renamed to `_actor` to silence the
 * linter, and was thrown away. Every `walk`, `face` and `chore` drove the
 * protagonist whichever actor the step named -- a driver's chore animated
 * Thad, and it looked like it was working, because a man did move.
 *
 * It lives in its own file rather than inside the scene because a scene
 * cannot be constructed without a browser, and a defect that shipped for want
 * of a test deserves one that runs.
 */
export class SequenceWorld implements SequenceHost {
  private readonly actors: RoomActors;
  private readonly bodies: BodyOwnership;
  private readonly choreSecondsFor: (mover: Actor, clip: string) => number;
  private readonly speak: (step: Extract<SequenceStep, { kind: 'say' }>) => number;

  constructor(parts: SequenceWorldParts) {
    this.actors = parts.actors;
    this.bodies = parts.bodies;
    this.choreSecondsFor = parts.choreSeconds;
    this.speak = parts.say;
  }

  walk(actor: string, x: number, y: number): void {
    const mover = this.actors.require(actor);
    this.bodies.claimBody(actor, WALK_OWNER);
    mover.walkTo(x, y);
  }

  /**
   * ERRATA 38. Places the mover first when the step says where from, which is
   * how anything that is not the player arrives in the room at all.
   */
  move(actor: string, from: { x: number; y: number } | undefined,
       x: number, y: number, seconds: number): void {
    const mover = from
      ? this.actors.place(actor, from.x, from.y)
      : this.actors.require(actor);
    this.bodies.claimBody(actor, WALK_OWNER);
    mover.glideTo(x, y, seconds);
  }

  isWalking(actor: string): boolean {
    return this.actors.require(actor).isWalking;
  }

  face(actor: string, facing: Facing): void {
    // A turn claims nothing. It does not advance a clip; it chooses which
    // clip's frames are drawn, and a claim per turn would make the guard
    // noisy without making it stronger.
    this.actors.require(actor).setFacing(facing);
  }

  isTurning(actor: string): boolean {
    return this.actors.require(actor).isTurning;
  }

  isChoring(actor: string): boolean {
    return this.actors.require(actor).isChoring;
  }

  chore(actor: string, clip: string): number {
    const mover = this.actors.require(actor);
    // The duration is asked for BEFORE the claim, so a clip nobody has drawn
    // throws without leaving a body owned by a chore that never started.
    const seconds = this.choreSecondsFor(mover, clip);
    this.bodies.claimBody(actor, CHORE_OWNER);
    mover.react(clip, seconds);
    return seconds;
  }

  say(step: Extract<SequenceStep, { kind: 'say' }>): number {
    return this.speak(step);
  }

  /**
   * Hands each body back when the thing that claimed it has finished.
   *
   * Called once a tick, after the movers have advanced. Without it the first
   * walk of the game owns the protagonist forever and the first chore after
   * it trips BODY_ONE_OWNER -- which is the guard reporting, correctly, that
   * nobody ever let go.
   */
  settleBodies(): void {
    for (const mover of this.actors.all()) {
      const owner = this.bodies.bodyOwner(mover.id);
      if (owner === WALK_OWNER && !mover.isWalking) {
        this.bodies.releaseBody(mover.id, WALK_OWNER);
      }
      if (owner === CHORE_OWNER && !mover.isChoring) {
        this.bodies.releaseBody(mover.id, CHORE_OWNER);
      }
    }
  }

  /**
   * Doc 22's deterministic cancellation, applied to bodies as well as feet.
   *
   * A performance abandoned mid-chore leaves the clip running and the claim
   * standing, and the next claim then trips the guard on a scene that ended
   * seconds ago. Settling the mover and releasing the claim together is the
   * fix; suppressing the assertion would have been the bug.
   */
  abandon(): void {
    for (const mover of this.actors.all()) this.abandonActor(mover.id);
  }

  /**
   * The same, for one mover.
   *
   * A click in the play area abandons the interaction the player has changed
   * their mind about -- and ONLY that. Hob is crossing the road on his own
   * runner while the player is in charge, and a click meant to stop Thad
   * walking to a trough must not stop Hob.
   */
  abandonActor(id: string): void {
    const mover = this.actors.get(id);
    if (!mover) return;
    mover.settle();
    this.bodies.releaseBody(id, WALK_OWNER);
    this.bodies.releaseBody(id, CHORE_OWNER);
  }

  /** A player-driven walk, claiming the body the same way a scripted one does. */
  walkPlayer(x: number, y: number): boolean {
    const player = this.actors.playerActor;
    // The player clicking during his own chore is ordinary play, not an
    // engine error: the performance is abandoned first, which releases the
    // claim, and only then does the walk take the body.
    if (this.bodies.bodyOwner(player.id) === CHORE_OWNER) {
      player.settle();
      this.bodies.releaseBody(player.id, CHORE_OWNER);
    }
    const walking = player.walkTo(x, y);
    if (walking) this.bodies.claimBody(player.id, WALK_OWNER);
    return walking;
  }
}
