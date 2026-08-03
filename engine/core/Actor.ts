import type { Facing } from './types.ts';
import type { GameState } from './GameState.ts';
import { GLYPH_SCALE } from '../render/BitmapFont.ts';

/**
 * Pixels moved per frame at 60fps. Slow enough to read as walking.
 *
 * x GLYPH_SCALE FOR THE SAME REASON THE TEXT METRICS WERE. 0.9 was authored
 * against a 320-wide room, where it crosses the screen in about six seconds.
 * The play area went to 1920 and this did not, so the same 0.9 took THIRTY-FIVE
 * seconds to cross Room 1 -- found while trying to walk to a walk-box boundary
 * and watching him not reach it inside a fifteen-second timeout.
 *
 * Multiplied, not re-chosen: 5.4 px/frame covers the same FRACTION of the
 * screen per second that 0.9 covered before, so the authored pace is preserved
 * exactly rather than re-decided. It is a change of units, and if the pace is
 * ever wrong it was wrong at 320 too.
 *
 * Named from the font's constant because there is one migration factor in this
 * project and a second copy of the number would drift from it.
 */
const WALK_SPEED = 0.9 * GLYPH_SCALE;

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
 * Doc 40's twelfth clip. Named here rather than in content because it is a
 * SCHEDULE, not a line: the engine decides when a character has stood still
 * long enough to glance aside, and content decides whether such a clip
 * exists at all.
 *
 * It is not declared in `content/actors/thad.json`, which is open question
 * Q9 and not this task's to answer, so `hasIdleBreak` is false today and the
 * schedule below never fires. NOTHING IS SUBSTITUTED FOR IT. The moment the
 * record declares the clip the timer starts working and no engine change is
 * needed; until then a character simply does not glance aside.
 */
export const IDLE_BREAK = 'idle-break';

/**
 * The size of a graybox for a mover with NO RECORD AT ALL.
 *
 * It was `state.content.actor.height` -- the protagonist's -- and that is the
 * whole shape of the defect the coach found: a thing asked how tall it was,
 * its own record could not answer, and the engine answered with somebody
 * else's number. 240 was right for a man and 62% of a stagecoach, and nothing
 * anywhere was wrong.
 *
 * A LITERAL IS FINE AND ANOTHER ENTITY'S FIELD IS NOT. This says "nobody told
 * me, here is the standard answer"; the old line said "nobody told me, I will
 * use his answer", which is silent by construction because his answer is
 * always plausible. Deliberately not read from any character: the only mover
 * that reaches this has no record, draws a placeholder, and is meant to be
 * seen.
 */
const PLACEHOLDER_HEIGHT = 240;

/** How long a character stands perfectly still before glancing aside. */
/**
 * How much the other axis must beat the current one by before he turns.
 *
 * Doc 32's "directional threshold", as a proportion rather than a pixel count
 * so it holds at any distance: near a target every difference is small, and
 * far from one every difference is large.
 */
const FACING_HYSTERESIS = 0.25;

const IDLE_BREAK_AFTER = 7;

/**
 * How a mover is governed. The player is routed across the room's walk boxes
 * and takes his drawn height from the depth band he is standing in; a coach
 * leaving frame right is neither of those things.
 */
export interface MoverOptions {
  /** Routed across the room's walk boxes. False for anything off the floor. */
  routed?: boolean;
  /** Drawn height, for a mover the room's depth bands do not govern. */
  height?: number;
  /** Whether the character has an `idle-break` clip to play on the timer. */
  hasIdleBreak?: boolean;
}

/**
 * ONE NAMED MOVER: where it is, which way it is looking, and which clip is
 * playing. The player is one of these and is not special.
 *
 * IT USED TO BE ONLY THE PLAYER, and that was issue X4 defect 3: the renderer
 * built its list from the ambient set plus one actor, so Hob, the driver, the
 * horses and the coach had no path to being drawn at all. Nothing here knows
 * which mover is the protagonist; `RoomActors` holds the registry and the
 * scene holds the id, which comes from content.
 *
 * Height is CONTINUOUS (errata ruling 24, and errata 54 kept the continuity
 * while replacing the mechanism that produced it): the class does not snap
 * it, and the sprite now scales to it by ordinary filtered resampling.
 */
export class Actor {
  readonly id: string;

  x: number;
  y: number;
  height: number;
  /**
   * Set from the RECORD when it declares exactly one facing, and only then.
   *
   * It was a flat `'front'`, and the coach drew as a graybox for the whole
   * opening because of it. The coach is drawn RIGHT ONLY; `clipOf` correctly
   * refuses a facing the character is not drawn in -- Q20, and the reason Hob
   * asked to face left draws nothing rather than substituting -- so `front`
   * resolved to no clip and the renderer fell back to the placeholder. Its
   * frames were loaded, its record was right, and the branch taken was
   * `frames === 0`.
   *
   * Nothing had ever CHOSEN front for it. `move` places by gliding, and beat
   * 2 places the coach from a point to the same point, so `faceToward` had no
   * direction to take and left the default standing.
   *
   * A CHARACTER DRAWN IN ONE DIRECTION HAS ONE POSSIBLE FACING, so the record
   * answers this and a module default should not. Where a record declares
   * several, `front` stands: that is a real choice among real options.
   * Asking a one-facing character to face elsewhere still draws nothing --
   * this sets the starting value, it substitutes nothing.
   */
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
  /** Errata 38's translation: a constant-rate glide with its own deadline. */
  private glide: { fromX: number; fromY: number; startedAt: number; seconds: number } | null = null;
  private turningUntil = 0;
  private clock = 0;
  /** When the character last became perfectly still, for the idle break. */
  private stillSince = 0;
  private readonly state: GameState;
  private readonly options: MoverOptions;

  constructor(state: GameState, id: string, x: number, y: number, options: MoverOptions = {}) {
    this.state = state;
    this.id = id;
    this.options = options;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    // HIS OWN RECORD, not the protagonist's. The last fallback was
    // `state.content.actor.height`, so every unrouted mover was drawn at the
    // height of a man: the coach's record says 389 and it drew at 240, which
    // is 62% and reads as a stagecoach whose roof reaches Thad's head.
    //
    // AND THE CURVE GOVERNS ANYONE IT IS TRUE OF, routed or not. It used to
    // be sampled only for a routed mover, so a staged crossing held one flat
    // height: Hob walked at 240 sixty pixels behind Thad at 242, two men the
    // same size at different depths, which is precisely what the curve exists
    // to prevent. Choreography does not suspend perspective. The coach is
    // exempt because it says so in its own record, not because of how it moves.
    const facings = state.content.actors.get(id)?.facings;
    if (facings?.length === 1) this.facing = facings[0] as Facing;
    this.height = options.height
      ?? (this.scalesWithDepth ? this.sampleDepth(state, x, y) : null)
      ?? state.content.actors.get(id)?.height
      ?? PLACEHOLDER_HEIGHT;
  }

  /**
   * Whether the room's depth curve decides how tall this mover is drawn.
   *
   * A property of the CHARACTER, read from his record -- not of how he is
   * being moved. A man is a man whether he is walking to a click or crossing
   * on a script.
   */
  private get scalesWithDepth(): boolean {
    return this.state.content.actors.get(this.id)?.scalesWithDepth !== false;
  }

  /**
   * The curve at these feet. A routed mover is inside a box by construction,
   * so a miss means "no floor here" and it keeps what it had; a staged one is
   * routinely outside the boxes and asks the curve by Y regardless.
   */
  private sampleDepth(state: GameState, x: number, y: number): number | null {
    return this.routed
      ? state.actorHeightAt(Math.round(x), Math.round(y))
      : state.stagedHeightAt(Math.round(x), Math.round(y));
  }

  private get routed(): boolean {
    return this.options.routed !== false;
  }

  get isWalking(): boolean {
    return this.glide !== null || this.path.length > 0 || !this.arrived();
  }

  /** At the current leg's end, within half a pixel. */
  private arrived(): boolean {
    return Math.abs(this.targetX - this.x) <= 0.5 && Math.abs(this.targetY - this.y) <= 0.5;
  }

  /** Stops where he stands, abandoning the rest of the route. */
  halt(): void {
    this.path = [];
    this.glide = null;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  /**
   * Deterministic cancellation, doc 22's list, applied to the body.
   *
   * `halt` stops the feet and leaves a one-shot clip running, which is right
   * when a route is abandoned and wrong when the whole performance is. A
   * chore that outlives the sequence that started it also outlives the body
   * claim that went with it, and the next claim then trips BODY_ONE_OWNER on
   * a performance that was cancelled seconds earlier.
   */
  settle(): void {
    this.halt();
    this.special = null;
  }

  /** The clip to draw right now, and how far into it we are. */
  get clip(): string {
    if (this.special) return this.special.clip;
    if (this.isWalking) return WALK;
    // Doc 40: idle-break plays on a timer WHILE IDLE and returns to it. It is
    // offered only where the record declares it -- see IDLE_BREAK.
    if (this.options.hasIdleBreak && this.clock - this.stillSince >= IDLE_BREAK_AFTER) {
      return IDLE_BREAK;
    }
    return IDLE;
  }

  get isBusy(): boolean {
    return this.special !== null || this.isTurning;
  }

  /** A one-shot clip is running. The body-ownership guard asks this. */
  get isChoring(): boolean {
    return this.special !== null;
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
    // An unrouted mover is not on the floor and has no boxes to cross. It
    // still walks -- Hob crossing the road plays his walk cycle -- it simply
    // goes where it was sent.
    if (!this.routed) {
      this.path = [];
      this.glide = null;
      this.targetX = x;
      this.targetY = y;
      this.faceToward(x, y);
      return true;
    }
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

  /**
   * ERRATA 38's `move`: translate to a point over a stated duration.
   *
   * The duration is the content -- beat 6b's coach leaves frame right "over
   * two or three seconds" -- so this is rate-controlled rather than
   * speed-controlled, and it crosses no walk box on the way.
   */
  glideTo(x: number, y: number, seconds: number): void {
    this.path = [];
    this.faceToward(x, y);
    this.targetX = x;
    this.targetY = y;
    // A MOVE TO WHERE HE ALREADY IS PLACES HIM. It does not walk.
    //
    // Staging places a mover with `move` from a point to the SAME point, and
    // a glide -- however short -- makes `isWalking` true, so `clip` returned
    // `walk`. The opening's first tenth of a second was Thad walking on the
    // spot facing the camera before he turned side-on to climb down. Nothing
    // was moving and a walk cycle was playing.
    if (seconds <= 0
      || (Math.abs(x - this.x) < 4 && Math.abs(y - this.y) < 4)) {
      this.glide = null;
      this.placeAt(x, y);
      return;
    }
    this.glide = { fromX: this.x, fromY: this.y, startedAt: this.clock, seconds };
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
    // A POINT HE IS ALREADY STANDING ON NAMES NO DIRECTION, so it changes
    // nothing. Without this the vertical branch below fired -- dx of zero is
    // inside its dead band, dy of zero is not above him -- and answered
    // `front`.
    //
    // THAT IS HOW THE COACH BECAME A BLACK RECTANGLE. Staging places a mover
    // with `move` from a point to the SAME point, so `glideTo` asked which way
    // to face and was told to turn and look at the camera. The coach is drawn
    // right-only; `clipOf` refuses a facing a character is not drawn in, by
    // design, so `front` resolved to no clip and the renderer drew the
    // placeholder. Thad survived the same call only because beat 2 follows it
    // with an explicit `face right`.
    if (Math.abs(x - this.x) < 4 && (y === undefined || Math.abs(y - this.y) < 4)) {
      return this.facing;
    }
    const dx = x - this.x;
    if (y === undefined) return dx < 0 ? 'left' : 'right';
    const dy = y - this.y;

    // THE DOMINANT SCREEN AXIS, WITH HYSTERESIS. Doc 40 line 163 -- "diagonals
    // use the dominant screen axis. No diagonal art exists." -- doc 32 line
    // 112, which adds that the cardinal facing is RETAINED "until the movement
    // logic crosses its directional threshold", and doc 29 line 35, which says
    // the route may be diagonal while the animation resolves to a cardinal.
    //
    // WHAT WAS HERE INSTEAD was an 8px dead band on the horizontal alone: any
    // target more than eight pixels to the side was a side view, whatever the
    // vertical. A walk of dx 20 and dy 200 -- almost straight up the road --
    // drew him in profile walking away from the camera, and a path that
    // wandered either side of that band flipped him left and right as he went.
    // That is the unnatural diagonal: not the route, the facing.
    //
    // THE THRESHOLD IS A MARGIN, NOT A DEAD BAND. A path at almost exactly 45
    // degrees is the case that flickers, and a dead band cannot help there --
    // both axes are large. What helps is making the OTHER axis win by a
    // margin before he turns, so the facing he already has is the one he
    // keeps. 25% is wide enough that ordinary path noise cannot cross it and
    // narrow enough that a genuine change of direction still reads.
    const facingSideways = this.facing === 'left' || this.facing === 'right';
    const sideways = facingSideways
      ? Math.abs(dx) * (1 + FACING_HYSTERESIS) >= Math.abs(dy)
      : Math.abs(dx) >= Math.abs(dy) * (1 + FACING_HYSTERESIS);
    if (sideways) {
      if (Math.abs(dx) < 4) return this.facing;
      return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'back' : 'front';
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
      this.placeAt(x, y);
      if (entrance.facing) this.facing = entrance.facing;
      return;
    }
    const regions = this.state.content.rooms.get(roomId)?.walkable ?? [];
    const region = regions[regions.length - 1] ?? regions[0];
    if (!region) return;
    const [rx, ry, rw, rh] = region.rect;
    this.placeAt(rx + rw / 2, ry + rh - 1);
  }

  /** Sets him down at a point, cancelling everything in flight. */
  placeAt(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.path = [];
    this.glide = null;
    this.special = null;
    if (this.options.height !== undefined) return;
    if (!this.scalesWithDepth) return;
    this.height = this.sampleDepth(this.state, x, y) ?? this.height;
  }

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
      if (this.glide) this.advanceGlide(seconds);
      else this.advanceWalk();
    }
    if (this.options.height === undefined && this.scalesWithDepth) {
      const here = this.sampleDepth(this.state, this.x, this.y);
      if (here !== null) this.height = here;
    }
    // The idle break is measured from the moment everything stopped, so a
    // character who has just arrived breathes for a while before glancing
    // aside rather than glancing the instant his feet land.
    if (this.isWalking || this.isBusy) this.stillSince = seconds;
    return this.height !== wasHeight || this.isWalking !== wasWalking || this.isBusy
      || this.glide !== null;
  }

  /** Errata 38's translation: a fraction of the way there, by the clock. */
  private advanceGlide(seconds: number): void {
    const glide = this.glide;
    if (!glide) return;
    const walked = Math.min(1, (seconds - glide.startedAt) / glide.seconds);
    this.x = glide.fromX + (this.targetX - glide.fromX) * walked;
    this.y = glide.fromY + (this.targetY - glide.fromY) * walked;
    if (walked >= 1) this.glide = null;
  }

  private advanceWalk(): void {
    // The leg is taken FIRST, before any movement. Moving first meant that
    // on the frame a leg completed, `isWalking` was still true because the
    // path was not empty, so the step ran with a distance of zero and put
    // NaN into both coordinates -- the actor vanished mid-route and every
    // sequence waiting on him waited forever.
    if (this.arrived() && this.path.length > 0) {
      const next = this.path.shift();
      if (next) this.aimAt(next);
    }
    if (this.arrived()) return;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(WALK_SPEED, distance);
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
  }
}
