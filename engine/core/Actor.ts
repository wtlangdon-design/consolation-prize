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
/**
 * How fast a mover walks, in pixels per TICK, when its record does not say.
 *
 * IT DISAGREED WITH THE STRIDE BY A FACTOR OF THREE and nothing could see it
 * until the gait started advancing from distance. 0.9 x 6 is 5.4px a tick,
 * which at 60fps is 323 px/s; against a measured stride of 102px that is 3.2
 * strides a second, and a person walks about two. Under the old clock-driven
 * phase the legs ran at the record's 8 frames/s -- one cycle a second -- while
 * he covered 323px, which implies a 323px stride, or 1.35 times his own
 * height per step. Slow legs and fast travel is a glide, and it read as one.
 *
 * The legs now tell the truth about the speed, and the speed is a sprint.
 */
const WALK_SPEED = 0.9 * GLYPH_SCALE;

/**
 * The fastest the legs may cycle, in strides a second.
 *
 * WALKING AWAY MADE HIM SCISSOR. `walkSpeed` is constant in screen pixels
 * while `stride` is scaled to his DRAWN height, so a figure at the back of
 * the band covers the same screen distance per second on strides less than
 * half as long. Measured on Thad, whose declared pace is 245px/s over a 102px
 * stride: 2.6 strides a second at the front of the walkable band, 4.1 halfway
 * up, and 5.9 at a drawn height of 98. A walking man does about 1.9.
 *
 * THE CADENCE WAS NOT LYING. It was animating a man who really was sprinting
 * -- he shrinks without slowing, so he covers ever more of his own body
 * lengths per second. The honest fix is to scale his SPEED with depth the way
 * his stride already is, which is also the rule beat 11's path uses. That
 * retimes every walk in the game, and the pace was calibrated deliberately
 * after a crossing that took thirty-five seconds, so it is a ruling rather
 * than a repair.
 *
 * Tyler ruled for the cheap fix: cap the cadence and leave the movement
 * alone. 2.6 is the value at the front of the walkable band, where the pace
 * was authored and reads correctly, so nothing visible today changes and only
 * the receding case is caught.
 *
 * THE COST IS FOOT SLIDE, and it is paid where it is least visible. Above the
 * cap the feet no longer travel exactly one stride per cycle; at a drawn
 * height of 98 the figure is 40% of full size and the slip is a fraction of a
 * pixel per frame.
 */
const MAX_STRIDES_PER_SECOND = 2.6;

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
 * DECLARED NOW, BY THREE RECORDS -- thad, hob and the coach -- and this
 * comment said it was declared by none of them. Q9 was answered by whoever
 * added the clips, and nothing that read this file afterwards was told. A
 * comment describing a record that has changed is R5k with prose instead of
 * a coordinate: still a copy, still silently wrong.
 *
 * NOTHING IS SUBSTITUTED WHERE A RECORD DOES NOT DECLARE IT. A character with
 * no `idle-break` clip simply does not glance aside.
 */
export const IDLE_BREAK = 'idle-break';

/**
 * The far-distance clip a traced path hands off to. Doc 36 Q91.
 *
 * Named here for the same reason `IDLE_BREAK` is: WHEN to use it is a schedule
 * the engine keeps -- below the path's declared handoff height -- and WHETHER
 * such a clip exists at all is content's. A character without it never hands
 * off, however small he gets.
 */
export const FAR_WALK = 'farwalk';

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

/**
 * How much the other axis must beat the current one by before he turns.
 *
 * Doc 32's "directional threshold", as a proportion rather than a pixel count
 * so it holds at any distance: near a target every difference is small, and
 * far from one every difference is large.
 */
const FACING_HYSTERESIS = 0.25;

/**
 * The idle break's schedule. Doc 40: "played occasionally", "plays on a timer
 * while idle and returns to it".
 *
 * IT WAS A LATCH, NOT A TIMER, and that is the whole of the fault. `clip`
 * returned `idle-break` once `clock - stillSince >= 7` and never again
 * returned anything else, so a character who stood still for seven seconds
 * switched permanently into the glance and looped it at his BREATHING rate
 * until something moved him. Doc 40 calls it an occasional one-shot. Nothing
 * about that was occasional and nothing about it was a shot.
 *
 * A FIXED INTERVAL WOULD HAVE BEEN THE OTHER WRONG ANSWER. The same lesson as
 * the horse pawing on a loop: a body doing a thing every N seconds exactly
 * reads as a tic, which is worse than standing still, because standing still
 * at least reads as a person waiting. So the gap is randomised above a floor.
 *
 * DETERMINISTICALLY RANDOM, from the mover's id. `Math.random()` would make
 * two play-throughs of the same save differ, and it would make any clip a
 * script asserts a coin toss -- which is Q68's flaky red, arriving by a
 * different road. The sequence is a plain LCG seeded by the id, so two
 * characters standing together never sync up and the same run always plays
 * the same way.
 */
const IDLE_BREAK_MIN_GAP = 7;
const IDLE_BREAK_SPREAD = 11;

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
  /**
   * A TRACED PATH, walked in w rather than in screen pixels.
   *
   * `samples` carries the waypoints densified along each leg, each with the
   * drawn height traced for it and the cumulative parameter w at which it is
   * reached, normalised so the last is 1.
   */
  private route: {
    samples: { x: number; y: number; height: number; w: number }[];
    startedAt: number;
    seconds: number;
    handoff: number;
  } | null = null;
  private turningUntil = 0;
  private clock = 0;
  /** The idle break in flight: when it started, and when it is over. */
  private breakStartedAt = 0;
  private breakEndsAt = 0;
  /** When the next one is due. Infinity while he is moving. */
  private nextBreakAt = Infinity;
  /** The LCG's state, seeded from the id so two movers never march together. */
  private breakSeed = 0;
  /** Whether this mover's own record declares an `idle-break` clip. */
  private readonly breakClip: boolean;
  /** How long one break lasts: its frame count over its own rate. */
  private readonly breakSeconds: number;
  /**
   * How far he has actually moved, in world pixels, ever.
   *
   * DOC 43 AND DOC 40 BOTH SAY THE GAIT ADVANCES FROM DISTANCE TRAVELLED, NOT
   * TIME, and doc 40 says it twice -- "one full cycle corresponds to one
   * declared stride length". It advanced from the clock, which at walking
   * speed nobody notices and on a slow glide is moonwalking: the feet cycle
   * at full rate while the man barely moves. It would have been the most
   * visible thing in a shot of him walking away into the distance.
   *
   * Cumulative and never reset, which is doc 43's other half: the phase is
   * PRESERVED across a facing change, so he does not restart mid-stride at a
   * corner. A placement does not add to it -- being put somewhere is not
   * walking there.
   */
  private gaitPhase = 0;
  /** The clock the previous update ran at, so an increment has a duration. */
  private lastGaitClock: number | null = null;
  private readonly state: GameState;
  private readonly options: MoverOptions;
  /** Pixels per tick. From the record where it declares one. */
  private readonly speed: number;
  /**
   * One full walk cycle, as a fraction of the character's DRAWN height.
   *
   * THE STRIDE HAS TO LIVE HERE, and the alternative was the renderer passing
   * it in. It read `record.strideLength * (mover.height / record.height)` and
   * handed the answer to `frameAt` -- which was workable while the gait was a
   * pure function of total distance, and is not once the gait is INTEGRATED:
   * the increment has to be divided at the moment the displacement happens,
   * inside `update`, and a caller cannot reach that moment.
   *
   * A RATIO RATHER THAN A LENGTH, so it needs no height passed with it: the
   * actor already knows its own drawn height and the stride is
   * `strideRatio * height` at any instant. Doc 40 measured the same number
   * from the other end -- 102px on a 240px man, "0.42 of his height", against
   * a human step length of about 0.42 of stature.
   *
   * READ FROM THE RECORD IN THE CONSTRUCTOR, which is what the three fields
   * above it already do: `walkSpeed`, the idle-break clip and
   * `idleBreakRate`. The comment beside those says why, and it is R5f -- an
   * engine decision traces to a field on the thing it is deciding about.
   */
  private readonly strideRatio: number;

  constructor(state: GameState, id: string, x: number, y: number, options: MoverOptions = {}) {
    this.state = state;
    this.id = id;
    this.options = options;
    // A CHARACTER'S OWN PACE, where the record states one. Hob is a slow old
    // man who has walked this street for years and Thad has just got off a
    // coach; that is a fact about each of them, like a stride or a height.
    //
    // AND LOWERING HOB'S `walkRate` DID NOT DO IT. That is the frame rate of
    // his cycle, not his speed -- so he moved exactly as fast as Thad with
    // slower legs, which is a man skating. Since the gait advances from
    // distance, `walkRate` no longer governs walking at all and the change
    // does nothing whatever.
    const declared = state.content.actors.get(id)?.walkSpeed;
    this.speed = declared !== undefined ? declared / 60 : WALK_SPEED;
    // A CHARACTER WITH NO DECLARED STRIDE KEEPS THE CLOCK, and that is the
    // conservative answer rather than a guessed distance: the coach's walk is
    // one frame and has no gait at all, so inventing a stride for it would be
    // inventing a fact about a vehicle.
    const paces = state.content.actors.get(id);
    this.strideRatio = paces?.strideLength && paces.height
      ? paces.strideLength / paces.height
      : 0;
    // FROM HIS OWN RECORD, WHICH IS WHY HOB AND THE COACH NEVER BROKE. This
    // was `MoverOptions.hasIdleBreak`, and GameScene set it in exactly one
    // place: on the protagonist, from `content.actor.clips`. Every other mover
    // arrives through `RoomActors.place()`, which passes no options at all, so
    // Hob's declared idle-break and the coach's were unreachable BY
    // CONSTRUCTION -- the records were right, the art was on disk, and no
    // code path existed that could ask for them. R5f: an engine decision
    // traces to a field on the thing it is deciding about.
    this.breakClip = (state.content.actors.get(id)?.clips ?? [])
      .some((clip) => clip.id === IDLE_BREAK);
    // Doc 40's own numbers, not new ones: 12 frames at ~2/s. Both are on the
    // record already -- `idleBreakRate` has been generated into every actor
    // by build-actor-record.mjs and read by NOTHING until now.
    const record = state.content.actors.get(id);
    const shot = (record?.clips ?? []).find((clip) => clip.id === IDLE_BREAK);
    this.breakSeconds = shot && record?.idleBreakRate
      ? shot.frames.length / record.idleBreakRate
      : 0;
    for (const letter of id) this.breakSeed = (this.breakSeed * 31 + letter.charCodeAt(0)) >>> 0;
    // THE SCHEDULE IS ARMED ON THE FIRST UPDATE, NOT HERE. Arming it in the
    // constructor sets an ABSOLUTE time about twelve seconds after zero -- and
    // a mover created later than that is already overdue, so it glances the
    // instant it appears. Hob is placed at beat 7, a minute in, and would have
    // broken on his first drawn frame every time. Same family as R5g: a
    // quantity that means "twelve seconds from the start" used where the
    // meaning needed was "twelve seconds from now".
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
    // A GLIDE IS STAGED BY DEFINITION, WHOEVER IS GLIDING, and that is the
    // whole of beat 11's fault. `actorHeightAt` asks `boxAt`, which answers
    // only inside the walkable band; `stagedHeightAt` falls back to the
    // NEAREST box, which is what lets `heightIn` extrapolate above it.
    //
    // Choosing between them by `routed` was right for every case that existed
    // when it was written -- the player walks, everything else is staged --
    // and wrong the moment errata 38's `move` translated the PLAYER outside
    // the boxes. Thad walks away up the road in beat 11, leaves the band, and
    // from that pixel on `boxAt` returns nothing, `sampleDepth` returns null,
    // and his height simply stops changing: he floats into the town at the
    // size of a man standing at the back of the band.
    //
    // `heightIn`'s own comment describes this exact picture and fixed the
    // clamp one layer down. The clamp was gone and nothing reached it.
    const staged = this.glide !== null || !this.routed;
    return staged
      ? state.stagedHeightAt(Math.round(x), Math.round(y))
      : state.actorHeightAt(Math.round(x), Math.round(y));
  }

  private get routed(): boolean {
    return this.options.routed !== false;
  }

  get isWalking(): boolean {
    return this.route !== null || this.glide !== null
      || this.path.length > 0 || !this.arrived();
  }

  /**
   * How far through a traced path he is, 0..1, or null when none is running.
   *
   * THE TITLE KEYS OFF THIS, which is what followPath's own note asks for:
   * derive the beat's length from the path and every later tweak to the trace
   * silently changes how long the title sits over the mountains. It is the
   * clock fraction rather than distance, so it is exactly `beatSeconds` and
   * moves at a steady rate whatever the trace does.
   */
  get pathProgress(): number | null {
    const route = this.route;
    if (!route) return null;
    return Math.max(0, Math.min(1, (this.clock - route.startedAt) / route.seconds));
  }

  /**
   * True while a traced path is being walked BELOW its handoff height.
   *
   * The renderer asks this to swap to the derived far-distance clip. It is a
   * question about the PATH rather than about the height, because the handoff
   * is a property the trace declares -- a path whose `farClipHandoff` is -1
   * never answers true however small he gets, which is Tyler's call and not
   * a threshold the engine may apply on its own.
   */
  get isFarAway(): boolean {
    return this.route !== null && this.route.handoff >= 0
      && this.height < this.route.handoff;
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
    // Doc 40: idle-break plays on a timer WHILE IDLE and RETURNS TO IT. The
    // window is closed by `breakEndsAt`, which is what makes it a one-shot
    // rather than the state change it used to be.
    if (this.clock < this.breakEndsAt) return IDLE_BREAK;
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
    // BOTH AXES, like every other branch. This one passed X alone, so a walk
    // that got here would face left or right however vertical the path was.
    //
    // AND THE SYMPTOM ATTRIBUTED TO IT IS NOT ITS SYMPTOM. This is the
    // fallback after ROUTING FAILS -- reached only when `routeTo` returns
    // undefined and the destination is still walkable -- and `WalkBoxes.route`
    // returns a route whenever `nearest()` finds a box at both ends, so in a
    // room with one walk box it is likely unreachable. The unrouted branch
    // above already passes both. Fixed because it is wrong and free, not
    // because it explains anything.
    this.faceToward(x, y);
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

  /**
   * Which way he would face to look at a point. Public because the scene
   * needs it for an approach it computed: he walks straight at the thing, so
   * the direction from where he stands now is the direction from where he will
   * stand, and this is the only place the dominant-axis rule lives.
   */
  facingToward(x: number, y?: number): Facing {
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
    // AN IDLE BREAK RUNS ONCE, FROM ITS OWN START, AND HOLDS ITS LAST FRAME.
    // The branch below loops on the wall clock, which for a 12-frame glance
    // means it restarts halfway through and glances again -- and the caller
    // hands it this clip's own rate, so the loop would run at the break's
    // speed rather than the breathing one. `seconds - breakStartedAt` is what
    // makes it a shot: a clip that begins when it begins.
    if (seconds < this.breakEndsAt) {
      if (idleRate <= 0 || frames <= 1) return 0;
      return Math.min(frames - 1, Math.floor((seconds - this.breakStartedAt) * idleRate));
    }
    if (!this.isWalking) {
      if (idleRate <= 0 || frames <= 1) return 0;
      return Math.floor(seconds * idleRate) % frames;
    }
    // THE WALK CYCLE ADVANCES FROM DISTANCE. `stride` is how far one full
    // cycle carries him, already scaled to his drawn height by the caller, so
    // one frame is one stride divided by the frame count.
    //
    // AN IDLE STILL BREATHES ON A CLOCK, correctly, and so does a chore: those
    // are timed animations and the branches above are untouched. This is the
    // walk cycle specifically.
    //
    // A CHARACTER WITH NO DECLARED STRIDE KEEPS THE CLOCK. That is the
    // conservative default rather than a guessed distance -- the coach's walk
    // is one frame and has no gait at all, and inventing a stride for it would
    // be inventing a fact about a vehicle.
    const count = Math.max(1, frames);
    // THE PHASE IS ALREADY IN CYCLES, so a frame is a fraction of one. Nothing
    // is divided here: the division happened once, per update, against the
    // stride that was true while that displacement occurred.
    if (this.strideRatio > 0) {
      const cycles = this.gaitPhase % 1;
      return Math.floor((cycles < 0 ? cycles + 1 : cycles) * count) % count;
    }
    return Math.floor(seconds * walkRate) % count;
  }

  /**
   * Advance the walk cycle by one update's worth of walking.
   *
   * THIS REPLACES A CALCULATION THAT WAS NOT AN INTEGRAL. The frame used to be
   * `floor(travelled / (paced / count))` -- TOTAL HISTORICAL DISTANCE over the
   * CURRENT depth-scaled stride. `travelled` is every pixel he has ever
   * walked and `paced` changes whenever his drawn height does, so the moment
   * he moved toward or away from the camera EVERY PIXEL HE HAD EVER WALKED
   * WAS RETROACTIVELY RE-DIVIDED and the frame index jumped several positions
   * in one update. Reported from playing as the legs scissoring on a diagonal.
   *
   * THE 2.6 STRIDES/SECOND CEILING DID NOT FIX IT, and reading why is the
   * whole of this change. It floored the DENOMINATOR at `speed*60/2.6`, which
   * happens to hold it constant for every drawn height below 222 -- so it hid
   * the jump across most of the band instead of removing it, and above 222 the
   * denominator still moved and the quotient still jumped. A lid on a symptom.
   *
   * SO THE PHASE IS ACCUMULATED, not recomputed: each update contributes its
   * own displacement divided by the stride that was true for it, and nothing
   * ever revisits an earlier contribution. The ceiling survives, applied to
   * the INCREMENT rather than the denominator, which bounds the rate without
   * distorting the distance-to-frame relationship -- so the foot-slide is paid
   * only where the cap actually bites.
   *
   * ONE PHASE FOR ALL FOUR CARDINAL WALKS. Not one per axis and not one per
   * facing: turning a corner must not restart the cycle, so a facing change, a
   * new waypoint and a switch between left/right/front/back all leave it
   * exactly where it was. A placement does not advance it either -- being put
   * somewhere is not walking there -- which falls out for free, because this
   * measures what THIS update moved and `placeAt` happens between updates.
   */
  private advanceGait(distance: number, fromHeight: number, elapsed: number): void {
    if (this.strideRatio <= 0 || distance <= 0) return;
    // THE AVERAGE OF THE TWO HEIGHTS, so crossing a depth boundary is
    // continuous. Dividing by the height he ended at would credit the whole
    // step to the far end of it.
    const height = (fromHeight + this.height) / 2;
    const stride = this.strideRatio * height;
    if (stride <= 0) return;
    const raw = distance / stride;
    // A ceiling in strides per second needs a duration to bound; without one
    // -- the first update, or a clock that has not moved -- there is nothing
    // to cap against and the raw advance stands.
    const advance = elapsed > 0
      ? Math.min(raw, MAX_STRIDES_PER_SECOND * elapsed)
      : raw;
    this.gaitPhase += advance;
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
    let moved = 0;
    if (!this.special) {
      const wasX = this.x;
      const wasY = this.y;
      if (this.route) this.advancePath(seconds);
      else if (this.glide) this.advanceGlide(seconds);
      else this.advanceWalk();
      moved = Math.hypot(this.x - wasX, this.y - wasY);
    }
    // A PATH SETS ITS OWN HEIGHT, so the depth sampler must not overwrite it
    // the instant he leaves the band. `route` is cleared on the last update,
    // and from the next one the curve takes him back -- which is right: he has
    // arrived and is a mover in a room again.
    if (this.route === null && this.options.height === undefined && this.scalesWithDepth) {
      const here = this.sampleDepth(this.state, this.x, this.y);
      if (here !== null) this.height = here;
    }
    // AFTER THE HEIGHT RESOLVES, so the stride can be averaged across the step
    // rather than taken from either end of it. `wasHeight` is the height he
    // set off at and `this.height` is where he arrived.
    //
    // A HEIGHT THAT CHANGES WITHOUT MOVEMENT CHANGES NOTHING. `moved` is zero
    // then, and zero displacement advances zero -- which is also what a
    // blocked actor gets, so nobody walks on the spot.
    // A FIRST UPDATE WITH NO PREVIOUS CLOCK IS ASSUMED TO BE ONE TICK, not
    // zero. Zero meant "no duration to bound a rate against", so the ceiling
    // could not apply and the very first update took its RAW advance -- which
    // for a figure drawn at 96px is 0.100 cycles against a capped 0.043, and
    // it is what made a one-second march measure 2.657 cycles against a
    // ceiling of 2.6. `RoomActors.place` happens to update once on arrival, so
    // in the running game that tick was spent standing still and nobody saw
    // it; an Actor built and marched directly does see it. Sixty is already
    // this file's unit -- `speed` is pixels per tick at sixty.
    const elapsed = this.lastGaitClock === null
      ? 1 / 60
      : seconds - this.lastGaitClock;
    this.lastGaitClock = seconds;
    this.advanceGait(moved, wasHeight, elapsed);
    // The idle break is measured from the moment everything stopped, so a
    // character who has just arrived breathes for a while before glancing
    // aside rather than glancing the instant his feet land.
    //
    // `stillSince` used to be kept here and read by `clip`. The schedule
    // replaced it: the question is no longer "how long has he been still",
    // which only ever supported a latch, but "when is the next one due".
    if (this.nextBreakAt === Infinity) this.nextBreakAt = seconds + this.breakGap();
    if (this.isWalking || this.isBusy) {
      // MOVING CANCELS IT AND RE-ARMS IT. A break interrupted mid-glance is
      // not resumed -- he did the thing that mattered more -- and the next one
      // is a fresh gap from now, so a character who is walked about
      // constantly never glances aside at all, which is correct.
      this.breakEndsAt = 0;
      this.nextBreakAt = seconds + this.breakGap();
    } else if (this.breakClip && this.breakSeconds > 0 && seconds >= this.nextBreakAt) {
      this.breakStartedAt = seconds;
      this.breakEndsAt = seconds + this.breakSeconds;
      this.nextBreakAt = this.breakEndsAt + this.breakGap();
    }
    return this.height !== wasHeight || this.isWalking !== wasWalking || this.isBusy
      || this.glide !== null;
  }

  /**
   * Seconds until the next idle break: a floor plus a spread.
   *
   * THE FLOOR IS THE POINT. Without one, two draws in a row can be short and
   * the character glances twice in three seconds, which reads as a nervous
   * tic rather than as a man waiting -- the failure a fixed interval produces
   * every time, arrived at by accident.
   */
  private breakGap(): number {
    this.breakSeed = (this.breakSeed * 1664525 + 1013904223) >>> 0;
    return IDLE_BREAK_MIN_GAP + (this.breakSeed / 4294967296) * IDLE_BREAK_SPREAD;
  }

  /** Errata 38's translation: a fraction of the way there, by the clock. */
  /**
   * Walk a traced path over a stated duration. Doc 17 beat 11.
   *
   * PROGRESS IS LINEAR IN w, NOT IN SCREEN PIXELS, and that is the whole
   * reason the path carries a height per waypoint. A receding figure covers
   * less screen ground per second for the same world speed, so advancing at a
   * constant rate in pixels reads as him ACCELERATING away. `dw = ds / height`
   * is screen arc length over scale -- world distance in units of his own
   * body -- and moving linearly in it is moving at a steady walk.
   *
   * NORMALISED TO [0,1], so `seconds` alone sets the rate and the path can be
   * re-traced without retiming. The title keys off the same clock for the same
   * reason: derive the beat's length from the path and every later tweak to
   * the trace silently changes how long the title sits over the mountains.
   *
   * AND THE CADENCE COMES OUT CONSTANT FOR FREE. Screen speed is
   * `height * W / seconds`, and the gait divides displacement by
   * `strideRatio * height` -- the heights cancel, so the legs cycle at
   * `W / (seconds * strideRatio)` strides a second from the first step to the
   * last. Nothing here touches the animation clock, and nothing should: a beat
   * with its own animation clock is a beat whose legs disagree with its feet.
   */
  followPath(points: { x: number; y: number; figureHeight: number }[],
             seconds: number, handoff = -1): number {
    this.path = [];
    this.glide = null;
    if (points.length < 2 || seconds <= 0) {
      const last = points[points.length - 1];
      if (last) this.placeAt(last.x, last.y);
      return 0;
    }
    const samples: { x: number; y: number; height: number; w: number }[] = [
      { x: points[0]!.x, y: points[0]!.y, height: points[0]!.figureHeight, w: 0 },
    ];
    let w = 0;
    for (let leg = 0; leg < points.length - 1; leg += 1) {
      const a = points[leg]!;
      const b = points[leg + 1]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(length / 2));
      const ds = length / steps;
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        // THE HEIGHT AT THE STEP'S MIDPOINT divides it. Taking either end
        // biases every segment toward that end, which over a path that halves
        // in scale is not a rounding difference.
        const mid = t - 0.5 / steps;
        const middle = a.figureHeight + (b.figureHeight - a.figureHeight) * mid;
        w += ds / Math.max(1, middle);
        samples.push({
          x: a.x + dx * t,
          y: a.y + dy * t,
          height: a.figureHeight + (b.figureHeight - a.figureHeight) * t,
          w,
        });
      }
    }
    if (w > 0) for (const sample of samples) sample.w /= w;
    this.route = { samples, startedAt: this.clock, seconds, handoff };
    this.targetX = samples[samples.length - 1]!.x;
    this.targetY = samples[samples.length - 1]!.y;
    return seconds;
  }

  private advancePath(seconds: number): void {
    const route = this.route;
    if (!route) return;
    const at = Math.max(0, Math.min(1, (seconds - route.startedAt) / route.seconds));
    const samples = route.samples;
    let low = 0;
    let high = samples.length - 1;
    while (low < high - 1) {
      const mid = (low + high) >> 1;
      if (samples[mid]!.w <= at) low = mid; else high = mid;
    }
    const a = samples[low]!;
    const b = samples[high]!;
    const span = b.w - a.w;
    const t = span > 0 ? (at - a.w) / span : 0;
    this.x = a.x + (b.x - a.x) * t;
    this.y = a.y + (b.y - a.y) * t;
    // THE HEIGHT COMES FROM THE PATH AND NOT FROM THE DEPTH CURVE. That is why
    // it was traced: the curve is calibrated for the walkable band and this
    // beat goes far above it, where the curve's third sample is provisional
    // and nobody has ruled on it.
    this.height = a.height + (b.height - a.height) * t;
    if (at >= 1) this.route = null;
  }

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
    const step = Math.min(this.speed, distance);
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
  }
}
