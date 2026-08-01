import type { Facing } from './types.ts';
import type { GameState } from './GameState.ts';

/** Pixels moved per frame at 60fps. Slow enough to read as walking. */
const WALK_SPEED = 0.9;

/**
 * A turn on the spot is a hold, not an instant. Two tenths is long enough to
 * read as a decision and short enough that nobody waits for it -- the dossier
 * lists face-direction-change-without-walking as a required animation for a
 * reason: a character who pivots between frames looks like a sprite, and one
 * who takes a beat looks like a man who thought about it.
 */
const TURN_SECONDS = 0.2;

export const IDLE = 'idle';
export const WALK = 'walk';

/**
 * The player character: where he is, which way he is looking, and which clip
 * is playing.
 *
 * Height is CONTINUOUS now (errata ruling 24). The class no longer snaps it,
 * because the snap moved to the one place ruling 24 puts it: the sprite's
 * threshold, where the drawn far sheet takes over from the decimated near
 * one. Everything above that is its own reduction.
 */
export class Actor {
  x: number;
  y: number;
  height: number;
  facing: Facing = 'front';

  private targetX: number;
  private targetY: number;
  /**
   * Remaining waypoints of a route, destination last. Errata 28a item 1:
   * walking is no longer a straight line to the click, it is a walk through
   * the portals between the boxes the route crosses -- which is what takes
   * him round the trough instead of through it.
   */
  private path: { x: number; y: number }[] = [];
  /** Clip playing instead of idle or walk, with the moment it started. */
  private special: { clip: string; startedAt: number; seconds: number } | null = null;
  private turningUntil = 0;
  private clock = 0;
  private readonly state: GameState;

  constructor(state: GameState, x: number, y: number) {
    this.state = state;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.height = state.actorHeightAt(x, y) ?? state.content.scaling.drawn.near;
  }

  get isWalking(): boolean {
    return this.path.length > 0 || !this.arrived();
  }

  /** At the current leg's end, within half a pixel. */
  private arrived(): boolean {
    return Math.abs(this.targetX - this.x) <= 0.5 && Math.abs(this.targetY - this.y) <= 0.5;
  }

  /** Stops where he stands, abandoning the rest of the route. */
  halt(): void {
    this.path = [];
    this.targetX = this.x;
    this.targetY = this.y;
  }

  /** The clip to draw right now, and how far into it we are. */
  get clip(): string {
    if (this.special) return this.special.clip;
    return this.isWalking ? WALK : IDLE;
  }

  get isBusy(): boolean {
    return this.special !== null || this.isTurning;
  }

  /** Mid-turn. The sequence runner waits on this as well as on walking. */
  get isTurning(): boolean {
    return this.clock < this.turningUntil;
  }

  /** Turns to a named direction. The runner's `face` step. */
  setFacing(facing: Facing): void {
    if (this.facing === facing) return;
    this.facing = facing;
    this.turningUntil = this.clock + TURN_SECONDS;
  }

  /** Which surface he is standing on, for the two walk cycles and the sink. */
  surfaceHere(): string {
    return this.state.surfaceAt(Math.round(this.x), Math.round(this.y));
  }

  /**
   * Walks to a point, routing across the walk boxes if the room has them.
   *
   * A click outside the floor is SNAPPED to the nearest standable point
   * rather than refused -- doc 22 step 1. The old behaviour ignored it, which
   * made the bottom two rows of the street and every pixel of sky a dead
   * click with no feedback at all.
   */
  walkTo(x: number, y: number): boolean {
    const route = this.state.routeTo(this.x, this.y, x, y);
    if (route) {
      this.path = route.waypoints.slice();
      const first = this.path.shift();
      if (!first) return false;
      this.aimAt(first);
      return true;
    }
    if (!this.state.isWalkable(Math.round(x), Math.round(y))) return false;
    this.path = [];
    this.targetX = x;
    this.targetY = y;
    this.faceToward(x);
    return true;
  }

  private aimAt(point: { x: number; y: number }): void {
    this.targetX = point.x;
    this.targetY = point.y;
    this.faceToward(point.x, point.y);
  }

  /**
   * Turns to look at a point WITHOUT walking. The dossier's required
   * animation, and the thing that makes examining feel like looking: a man
   * who describes a trough while facing away from it is reading a label.
   */
  faceToward(x: number, y?: number): boolean {
    const wanted = this.facingToward(x, y);
    if (wanted === this.facing) return false;
    this.facing = wanted;
    this.turningUntil = this.clock + TURN_SECONDS;
    return true;
  }

  private facingToward(x: number, y?: number): Facing {
    // A target directly above him at close range is something he turns his
    // back to the camera for; anything to either side is a side view. The
    // dead band is deliberately wide, because a one-pixel horizontal
    // difference flipping him round is worse than not turning at all.
    if (y !== undefined && Math.abs(x - this.x) < 8) {
      return y < this.y - 8 ? 'back' : 'front';
    }
    if (Math.abs(x - this.x) < 4) return this.facing;
    return x < this.x ? 'left' : 'right';
  }

  /** Plays a one-shot clip. Returns false if the character is already busy. */
  react(clip: string, seconds: number): boolean {
    if (this.special) return false;
    this.special = { clip, startedAt: this.clock, seconds };
    return true;
  }

  /**
   * Puts him at the declared arrival point for this room, per doc 21 gap 7.
   *
   * The fallback is the old behaviour -- the centre of the last walkable
   * rectangle -- and it is kept rather than made an error, because a room
   * reached by a route nobody has declared yet should still be playable. What
   * reports the gap is check-room-entries, not a crash at the door.
   */
  placeIn(roomId: string, from: string | null = null): void {
    const entrance = this.state.entranceInto(roomId, from);
    if (entrance?.at) {
      const [x, y] = entrance.at;
      this.moveTo(x, y);
      if (entrance.facing) this.facing = entrance.facing;
      return;
    }
    const regions = this.state.content.rooms.get(roomId)?.walkable ?? [];
    const region = regions[regions.length - 1] ?? regions[0];
    if (!region) return;
    const [rx, ry, rw, rh] = region.rect;
    this.moveTo(rx + rw / 2, ry + rh - 1);
  }

  private moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.path = [];
    this.special = null;
    this.height = this.state.actorHeightAt(Math.round(x), Math.round(y)) ?? this.height;
  }

  /** Frame index within the current clip at the given time. */
  /**
   * Frame index within the current clip at the given time.
   *
   * ERRATA 35b. `if (!this.isWalking) return 0` was the whole of the
   * protagonist's stillness: the idle clip could have had any number of
   * frames and the engine would have drawn the first one forever. It now runs
   * the idle at its own rate, which is slower than the walk by a factor of
   * three and comes from content.
   */
  frameAt(seconds: number, walkRate: number, reactRate: number, frames: number,
          idleRate = 0): number {
    if (this.special) {
      const elapsed = seconds - this.special.startedAt;
      return Math.min(frames - 1, Math.floor(elapsed * reactRate));
    }
    if (!this.isWalking) {
      if (idleRate <= 0 || frames <= 1) return 0;
      return Math.floor(seconds * idleRate) % frames;
    }
    return Math.floor(seconds * walkRate) % Math.max(1, frames);
  }

  /** Returns true if anything that affects the drawn frame changed. */
  update(seconds: number): boolean {
    const wasHeight = this.height;
    const wasWalking = this.isWalking;
    this.clock = seconds;

    if (this.special && seconds - this.special.startedAt >= this.special.seconds) {
      this.special = null;
    }
    // A one-shot clip owns the body until it is done. Walking through a
    // reaction would play the recoil sliding down the street.
    if (!this.special) {
      // The leg is taken FIRST, before any movement. Moving first meant that
      // on the frame a leg completed, `isWalking` was still true because the
      // path was not empty, so the step ran with a distance of zero and put
      // NaN into both coordinates -- the actor vanished mid-route and every
      // sequence waiting on him waited forever.
      if (this.arrived() && this.path.length > 0) {
        const next = this.path.shift();
        if (next) this.aimAt(next);
      }
      if (!this.arrived()) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const step = Math.min(WALK_SPEED, distance);
        this.x += (dx / distance) * step;
        this.y += (dy / distance) * step;
      }
    }
    const here = this.state.actorHeightAt(Math.round(this.x), Math.round(this.y));
    if (here !== null) this.height = here;
    return this.height !== wasHeight || this.isWalking !== wasWalking || this.isBusy;
  }
}
