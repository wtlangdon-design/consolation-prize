import { Actor, type MoverOptions } from './Actor.ts';
import type { GameState } from './GameState.ts';

/**
 * EVERY NAMED MOVER IN THE ROOM, the player among them.
 *
 * Issue X4 defect 3: "there is no general room mover". `Renderer.drawPeople`
 * built its list from the ambient NPC set plus the single player actor, so
 * there was no path by which Hob, the driver, the horses or the coach could
 * be drawn, positioned, depth-sorted or animated. A sequence could name them
 * -- `Sequence.ts` has carried an actor id on every step since it was written
 * -- and nothing on the other side could answer.
 *
 * THE PLAYER IS NOT SPECIAL HERE. He is the mover whose id content declares,
 * he is routed across the walk boxes where a coach is not, and that is the
 * whole difference. Nothing in this file knows which one he is beyond holding
 * the id it was given.
 *
 * LIFETIME IS THE ROOM'S. Everything except the player is dropped on a room
 * change: a mover belongs to the scene it was staged in, and one surviving a
 * transition would be a coach standing in an assay office.
 */
export class RoomActors {
  private readonly state: GameState;
  private readonly player: Actor;
  private readonly movers = new Map<string, Actor>();
  /**
   * The clock every mover was last advanced to, so a NEW ONE STARTS NOW.
   *
   * An Actor's clock begins at zero and only moves in `update`. A mover
   * placed mid-scene and given a glide on the same tick therefore recorded
   * `startedAt: 0` against a scene clock already twenty-five seconds old, and
   * its first update found the glide long finished: the coach and Hob
   * TELEPORTED to their destinations instead of crossing. Nothing threw and
   * nothing looked broken in a still frame -- they were simply never seen to
   * move. The same zero would have made a chore on a freshly placed mover
   * finish before its first frame.
   */
  private now = 0;

  constructor(state: GameState, player: Actor) {
    this.state = state;
    this.player = player;
    this.movers.set(player.id, player);
  }

  get playerId(): string {
    return this.player.id;
  }

  /** The protagonist. Held separately only so a room change cannot drop him. */
  get playerActor(): Actor {
    return this.player;
  }

  get(id: string): Actor | undefined {
    return this.movers.get(id);
  }

  /**
   * The mover a step named, or a hard error naming the one it asked for.
   *
   * NEVER A FALLBACK TO THE PLAYER. That fallback is exactly issue X4 defect
   * 1 -- `(_actor, x, y) => { this.actor... }` -- and it was invisible
   * precisely because it did something plausible: a driver's chore animated
   * Thad and the screen still showed a man moving.
   */
  require(id: string): Actor {
    const found = this.movers.get(id);
    if (!found) {
      throw new Error(`Sequence step names an actor with no mover in this room: ${id}`);
    }
    return found;
  }

  /**
   * Puts a named mover on the stage, or moves one already there.
   *
   * Movers other than the player are UNROUTED by default. A coach crosses no
   * walk box, and a character crossing the road in front of the camera --
   * doc 17 note 0, "he does not stop walking" -- is following a staged path,
   * not pathfinding to a click.
   */
  place(id: string, x: number, y: number, options: MoverOptions = {}): Actor {
    const existing = this.movers.get(id);
    if (existing) {
      existing.placeAt(x, y);
      return existing;
    }
    const mover = new Actor(this.state, id, x, y, { routed: false, ...options });
    // Its clock starts where everyone else's already is. A glide or a chore
    // issued on this same tick then measures from now rather than from zero.
    mover.update(this.now);
    this.movers.set(id, mover);
    return mover;
  }

  remove(id: string): void {
    if (id === this.player.id) return;
    this.movers.delete(id);
  }

  /** Drops every mover but the player. Called on a room change. */
  clearRoom(): void {
    this.movers.clear();
    this.movers.set(this.player.id, this.player);
  }

  /** Everyone on stage, in insertion order. The renderer sorts by feet. */
  /**
   * Doc 22 item 9's state for a mover. Written by a cutscene, read by the
   * renderer through `GameState.moverState`.
   *
   * Routed through `GameState` rather than held on the Actor: object state is
   * SAVED, and a resting field on a mover would be a second home for a fact
   * that already has one. The renderer asks GameState; so does this.
   */
  setMoverState(id: string, state: string | undefined): void {
    this.state.setMoverState(id, state);
  }

  all(): Actor[] {
    return [...this.movers.values()];
  }

  /** Advances every mover, and reports whether any drawn frame changed. */
  update(seconds: number): boolean {
    this.now = seconds;
    let changed = false;
    for (const mover of this.movers.values()) {
      if (mover.update(seconds)) changed = true;
    }
    return changed;
  }
}
