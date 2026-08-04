/**
 * Content schema types. The engine knows these shapes and nothing else --
 * no room ids, no verb ids, no character names are named in code.
 */

export type FlagValue = boolean | number;

export interface FlagDefinition {
  id: string;
  type: 'boolean' | 'integer';
  initial: FlagValue;
  /** Provenance, used by the flag-order validator. Not read at runtime. */
  writtenBy?: string[];
}

export interface FlagsFile {
  schema: number;
  flags: FlagDefinition[];
}

/** A numeric comparison against an integer flag. */
export interface NumericTest {
  atLeast?: number;
  atMost?: number;
  equals?: number;
}

export type ConditionValue = boolean | number | NumericTest;

/** Every key must pass for the condition to hold. An absent condition holds. */
export type Condition = Record<string, ConditionValue>;

export type FlagWrites = Record<string, FlagValue>;
export type FlagAdds = Record<string, number>;

/** One branch of a verb response. The first branch whose `when` holds is used. */
export interface ResponseRule {
  when?: Condition;
  /**
   * Move this object to a named state. Doc 22 item 9: a state change drives
   * both what is drawn and what occludes, so it is one field rather than a
   * second overlapping hotspot with the opposite gate.
   */
  setState?: string;
  /**
   * Ownership passes to the actor -- doc 22's `owner`. Taking an item is an
   * ownership change, not a hotspot swap: the object stops being in the room
   * and its `item` appears in the inventory.
   */
  take?: boolean;
  /**
   * A CONTAINER's contents. `take` alone transfers the hotspot's own `item`,
   * which is one item and is right for an object that IS the thing picked up.
   * Room 1's case is not: doc 17 and its own hotspot note say the case is a
   * container, its contents enter the inventory, and Thad never carries it
   * around town. Three items, one pickup, no fourth item for the case itself.
   *
   * This existed in the content before it existed here. case_mud has carried
   * `items` since it was written and nothing read it, so PICK UP granted
   * nothing -- masked entirely by letter, tuning_fork and four_dollars each
   * ALSO carrying startsHeld, which put them in the inventory before the case
   * was lifted. ec553ef removed the duplicate on the strength of the grant
   * existing in the content, without checking anything consumed it, and the
   * inventory went empty. R5o: the grant was written and nothing reached it.
   */
  items?: string[];
  say?: string;
  /**
   * Lines for repeat selections, cycled in order. Doc 05 requires three
   * variants minimum on Room 2 hotspots -- the player will read them
   * hundreds of times and a hotspot that answers identically forever is the
   * fastest way to make a room feel like a menu.
   */
  repeat?: string[];
  set?: FlagWrites;
  add?: FlagAdds;
  dialogue?: string;
  goto?: string;
}

export interface Interactable {
  id: string;
  name: string;
  rect: [number, number, number, number];
  colour: number;
  /**
   * When this target exists at all. An absent condition means always.
   *
   * Errata ruling 19a: an object whose state changes during a scene carries a
   * full line set per state, and "a hotspot that does not exist yet is not a
   * hotspot". The lamp in Room 1 is the case that forced this -- there is no
   * lamp on that road until Hob walks onto it, and a hotspot answering
   * questions about a man who has not arrived is worse than no hotspot.
   *
   * A state CHANGE is two targets over the same rect with opposite gates,
   * because the name changes too: the coach becomes THE ROAD WEST OUT once
   * it has gone, and one target cannot carry two names.
   */
  when?: Condition;
  /**
   * The verb a player would try first. Errata 28b: every object declares one,
   * and it fires on a left click with nothing selected and on any right
   * click. Most are LOOK AT; doors are OPEN and roads are WALK TO.
   *
   * An authoring decision per object rather than an engine default, because
   * "what would you try first" is a question about the object.
   */
  defaultVerb?: string;
  /**
   * Where the actor stands to interact with this, and which way he looks.
   * Doc 22 section 6: the object already knows, which is what makes the
   * interaction staged instead of performed wherever the player happened to
   * be standing.
   */
  walkTo?: { x: number; y: number; facing: Facing };
  responses?: Record<string, ResponseRule[]>;
  /**
   * Object-specific line for a verb this object has no written response to.
   * Fires the SAME line every time for that verb-object pair -- deliberately
   * unlike the global pools, which rotate. Doc 13 note 4.
   */
  overrides?: Record<string, string>;
  /** Per-object rotating pool. Rarely used; the global pools cover most cases. */
  fallback?: string[];
  /**
   * Doc 22 item 9. The object's current state, and what each state looks like.
   *
   * A state carries its own image, its own bounds, and the clip levels it
   * occludes -- so opening a door changes the picture, the hit area and the
   * depth behaviour together, which is what errata 27 says duplicate
   * overlapping hotspots are the wrong tool for.
   *
   * THE DUPLICATE-HOTSPOT PATTERN STAYS where semantic identity genuinely
   * changes. The coach becoming THE ROAD WEST OUT is two objects because the
   * NAME changes, and one object cannot carry two names. A door that opens is
   * the same door.
   */
  state?: string;
  states?: Record<string, {
    note?: string;
    /** Drawn over the background while this state holds. */
    image?: string;
    /** Replaces `rect` for hit-testing while this state holds. */
    bounds?: [number, number, number, number];
    /** Clip levels this state's image masks. Doc 22 section 5, step 5. */
    occludes?: number[];
  }>;
  /** The inventory item this object becomes when taken. */
  item?: string;
  /** State to move to when an exit is transited. */
  stateOnTransit?: string;
  /**
   * Verb id to the id of an actor clip played when that verb lands here.
   *
   * Separate from the line rather than part of it, because the line is
   * written content and the animation is not: a reaction may be re-tuned or
   * dropped without touching a word of the script.
   */
  reactions?: Record<string, string>;
  /**
   * Walking closer to this is meaningless -- the town below, the mountains,
   * the sky. The approach radius does not apply and the verb answers from
   * wherever he stands. Without it a distance rule sends him trudging at the
   * horizon to stop at an arbitrary spot.
   */
  distant?: boolean;
}

export interface Exit extends Interactable {
  to: string;
  /** A destination that exists but has no written examine layer yet. */
  stub?: boolean;
  /**
   * Flags written when this exit is TAKEN, not when it is asked about.
   *
   * DOC 14'S OWN ARGUMENT, EXTENDED TO A DIFFERENT KIND OF CONSEQUENCE.
   * `stateOnTransit` exists because "a door that has been gone through is a
   * door that is open", and it is reserved in the transit branch rather than
   * through a response rule because transit produces NO LINE and a state
   * change is not a line. A FLAG WRITE IS NOT A LINE EITHER.
   *
   * Without it an exit can write nothing at all: the transit branch returns
   * before the response resolves, with `effects: []`, so `set` on a response
   * never fires for the verb that actually goes through the door.
   */
  setOnTransit?: Record<string, boolean | number>;
  /**
   * This exit does not travel when it is taken. Something else says when.
   *
   * NAMED FOR WHAT IT MEANS. Doc 17's ending is a departure the player
   * WATCHES -- he walks through the gap in the fence and up the road while
   * the title comes up over the mountains -- and an exit that moves you the
   * instant you touch it cannot also be a departure. Taking it writes its
   * flag, the beat that flag releases plays, and the travel happens at the
   * end of the beat through a staged `interact`.
   *
   * THE DESTINATION STAYS HERE, with the exit that goes there. An exit that
   * dropped its `to` and named the room in a beat instead would be the same
   * fact in two files, which is the shape that produced doc 43's stale tables
   * and a rect authored for a coach that had moved.
   */
  travelWhenTold?: boolean;
}

/**
 * Doc 21 gap 7. A named arrival point, one per incoming exit.
 *
 * Without this the actor is placed at the centre of the last walkable
 * rectangle on every room change, so walking out of the Nugget's front door
 * put Thad in the middle of the road with his back to the building he had
 * just left. `from` is the room he arrived out of; `at` is where he stands
 * and `facing` is which way he is looking when the screen appears.
 *
 * It is also doc 20 rule 1's stated route in, which is why an entrance with
 * no coordinates is still legal: thirteen rooms arrive through the town map,
 * which is a screen rather than a doorway, and declaring the route is the
 * point of those.
 */
export interface Entrance {
  from: string;
  note?: string;
  at?: [number, number];
  facing?: Facing;
}

export type Facing = 'front' | 'back' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

/**
 * How an actor's drawn height behaves inside a walk box. Doc 22 section 3,
 * and the field errata 28a insists is built WITH the boxes rather than after.
 *
 * `fixed` pins a box to one drawn size -- the boardwalk is the far sprite and
 * only the far sprite. `curve` interpolates between two rows, which is ruling
 * 24's continuous decimation expressed per box instead of per room.
 */
export type ScaleMode =
  | { kind: 'fixed'; height: number }
  /**
   * `beyondY`/`beyondHeight` are a third sample ABOVE the band, for ground the
   * walk box does not cover. A staged mover may leave the box -- errata 38's
   * own case -- and without them the curve CLAMPS, so a man walking away up a
   * hill holds `farHeight` exactly and never shrinks at all. Optional: a box
   * that has not been asked about ground it does not cover should not invent
   * an answer for it.
   */
  | { kind: 'curve'; farY: number; farHeight: number; nearY: number; nearHeight: number;
      beyondY?: number; beyondHeight?: number };

/** A convex quadrilateral of floor, with adjacency, scale and clip level. */
export interface WalkBox {
  id: string;
  note?: string;
  points: [Point, Point, Point, Point];
  neighbours: string[];
  /**
   * Which foreground plane masks an actor standing here. Carried now and read
   * by nothing yet: per-plane masks and Y-sorting are doc 22 items 4 and 6,
   * deferred until there are several actors at several depths to sort. The
   * field is here because authoring boxes twice is the thing errata 28a is
   * specifically avoiding.
   */
  clipPlane: number;
  scaleMode: ScaleMode;
  /** Walk cycle and standing sink, as WalkableRegion carried it. */
  surface?: string;
  enabledWhen?: Condition;
}

/**
 * Errata ruling 23. A named position a character is placed at for a scripted
 * beat, declared at graybox rather than discovered during a cutscene.
 *
 * The dossier lists these and we did not have them. They exist so step 4 of
 * ruling 22 -- character placement and reach -- has something to check, and
 * the validator asserts every one of them is on floor a person can stand on.
 */
export interface StagingMark {
  id: string;
  note?: string;
  at: [number, number];
  facing?: Facing;
}

export interface AmbientFile {
  schema: number;
  id: string;
  name: string;
  room: string;
  x: number;
  y: number;
  zone: number;
  approachRadius: number;
  tree: string;
  barks: Record<string, string>;
  /**
   * Ruling 20's two-frame idle, for a character who is a sprite rather than
   * part of a drawn crowd. Rate is full cycles per second and phase offsets
   * it, so no two people on a street move on the same beat.
   */
  sprite?: {
    sheet: string;
    rate: number;
    phase?: number;
    frames: [number, number, number, number][];
  };
}

export interface VerbFallbacksFile {
  schema: number;
  pools: Record<string, string[]>;
}

export interface ReputationFile {
  schema: number;
  states: string[];
}

/** One region of floor. Errata ruling 15: a region without a zone fails the build. */
export interface WalkableRegion {
  id: string;
  zone: number;
  rect: [number, number, number, number];
  /**
   * Which walk cycle and standing sink this floor uses. Named in content, not
   * in code: mud and boards are not the same walk and there will be more than
   * two before the game is finished. Absent means the actor sheet's first
   * declared surface.
   */
  surface?: string;
}

export interface ScalingZone {
  index: number;
  name: string;
  height: number;
}

export interface ScalingFile {
  schema: number;
  /**
   * SCHEMA 3, Q9 as ruled. `drawn` and `threshold` are gone: they were ruling
   * 24's two-tier table and the decimation switch between them, and errata 54
   * replaced decimation with filtered resampling, which has nothing to choose.
   *
   * What is left is the depth-zone table the room schema samples by index.
   * Every zone currently holds the same height, which is a placeholder for
   * Q6's per-room scale curve rather than a curve -- see the file's own
   * `provisional` note.
   */
  zones: ScalingZone[];
  provisional?: string;
}

/**
 * One animation, as ONE DIRECTORY OF FRAMES. Schema 2, Q9 and Q14 as ruled.
 *
 * The old shape was a row index and a cell stride into a single sheet, which
 * could not name `art/actors/thad-recoil-left/` at all -- the blocking half
 * of Q14. Frames are now individual RGBA files, listed by path so that
 * check-asset-paths validates every one of the 124 rather than the two sheets
 * that used to stand for them.
 */
export interface ActorClip {
  id: string;
  facing: Facing;
  /** Frame image paths, in play order. */
  frames: string[];
  /**
   * The figure's own height in source pixels, shared by every clip of one
   * facing. Scaling is taken against THIS and never against the canvas or a
   * per-frame bounding box: the canvas carries padding for a swinging limb,
   * and a bounding box changes shape every frame, so either would resize him
   * as he walked.
   */
  figureHeight: number;
  /**
   * Where the soles and the centre line sit on the padded canvas, [x, y].
   * Measured by the rig, not inferred: the figure's top is canvas row 0, its
   * soles are at `figureHeight`, and there are 65 rows below them and 260
   * columns either side that a walk frame genuinely uses.
   */
  anchor: [number, number];
  /**
   * ERRATA-RULED: read from the clip's own rig.json rather than inferred from
   * the facing. Present on walk clips only. A validator checks the two agree;
   * nothing derives one from the other.
   */
  walkDx?: number;
  /**
   * WHERE THE LANTERN IS, ONE POINT PER FRAME, in the same padded-canvas space
   * as `anchor`.
   *
   * PER CLIP, WHICH Q81 RULED BEFORE THE GLOW WAS BUILT. Hob's stand holds the
   * lamp at his side and his walk holds it FORWARD, because a man carrying a
   * lamp holds it out to see by. A single anchor per character would pin the
   * light pool to one of those positions and let the lamp walk out of its own
   * light.
   *
   * WRITTEN BY HAND INTO THE RIG, NOT FOUND IN THE PIXELS. The lamp is drawn
   * UNLIT -- there is no bright spot to detect -- so this is the one measurement
   * in the pipeline that cannot be re-derived from the art, which is exactly
   * why it is recorded per frame rather than approximated from one.
   *
   * It is the HANDLE, not the flame. The glow sprite carries its own
   * `flame_anchor` a third of the way down its height, which absorbs the
   * difference: a lantern body is about 5% of the pool's width.
   */
  lanternAnchor?: [number, number][];
  /**
   * WHICH STATE OF THE OBJECT THIS CLIP DRAWS. Q38, as ruled.
   *
   * The same shape as `surface` below and resolved by the same
   * exact-match-then-fall-back lookup, so this adds no mechanism: it adds a
   * second discriminator to a lookup that already discriminates. A clip with
   * no state is what every character has today and what every mover without
   * states resolves to.
   *
   * IT EXISTS BECAUSE THE COACH NEEDS BOTH HALVES OF THE ENGINE. It must MOVE,
   * which made it a mover, and it must show a shut door in beats 1-2 and an
   * open one in 3-6, which is object STATE -- doc 22 item 9's mechanism, which
   * it used while it was a hotspot. `Actor.clip` chooses between walk and idle
   * by whether the thing is moving and nothing selects between two idles.
   *
   * The state itself is not stored here or on the mover: it is read from
   * `objectStates`, keyed "room/object", which is already saved and already
   * the one place object state lives. A resting-clip override on `Actor` would
   * have made a second one.
   */
  state?: string;
  /** Q10's mud and boardwalk variants, if they survive errata 54 at all. */
  surface?: string;
}

/**
 * One authored item-on-target pair. Doc 24 tier 1.
 *
 * A pair with no `say` is a RULE 4 VIOLATION, not a pair that falls through:
 * doc 24 note 4 is explicit that a combination which should do something and
 * has no line is reported as unwritten. check-combinations fails the build on
 * one, and the resolver deliberately returns nothing rather than reaching for
 * a pool -- a pool line standing in for a missing pair is a gap dressed as
 * content.
 */
export interface CombinationPair {
  item: string;
  room: string;
  target: string;
  /** The state this combination moves the target to. Doc 22 item 9. */
  setState?: string;
  /** The doc 02 puzzle this serves, where it serves one. */
  puzzle?: string;
  say?: string;
  /** Why the target does not resolve yet. Reported, never failed. */
  targetPending?: string;
  set?: FlagWrites;
}

/** content/combinations.json -- doc 06's table, written by doc 24. */
export interface CombinationsFile {
  schema: number;
  note?: string;
  rule4?: string;
  pairs: CombinationPair[];
  /** Item id to its own rotating pool. Doc 24 tier 2. */
  itemPools: Record<string, string[]>;
  itemPoolNote?: string;
  /** Anything on anything unhandled. Doc 24 tier 3. */
  globalPool: string[];
}

/** content/ui/item-icons.json -- errata 29's sheet, and where each icon sits in it. */
export interface ItemIconsFile {
  schema: number;
  note?: string;
  sheet: string;
  cell: [number, number];
  icons: Record<string, [number, number, number, number]>;
}

/** content/ui/panel.json -- errata ruling 26's geometry, read by engine and tools. */
export interface PanelFile {
  schema: number;
  note?: string;
  sentence: { x: number; y: number };
  verbs: { cols: number[]; rows: number[]; width: number; height: number; note?: string };
  menuButton: { col: number; row: number };
  /** Doc 20 rule 2. Optional so a panel without one still loads. */
  mapButton?: { note?: string; col: number; row: number };
  /**
   * ERRATA 39's fullscreen toggle. Optional for the same reason the map is,
   * and it takes the verb grid's LAST free cell -- nine verbs fill three rows
   * of three, and the fourth row now holds MENU, MAP and this.
   */
  fullscreenButton?: { note?: string; col: number; row: number };
  inventory: {
    note?: string;
    x: number;
    y: number;
    /** Errata 29: a grid of icons, not a list of rows. */
    cell: [number, number];
    cols: number;
    rows: number;
    arrows: { x: number; width: number; note?: string };
  };
}

/** content/actors/*.json -- where a character's frames are, never how they look. */
export interface ActorFile {
  schema: number;
  id: string;
  note?: string;
  /**
   * ONE DRAWN SIZE. Errata 54 replaced decimation with ordinary filtered
   * resampling, so `threshold` and the near/far pair it switched between are
   * gone rather than migrated -- there is nothing left for a threshold to
   * choose. Q9, as ruled.
   *
   * This is an ANCHOR at one depth and not a fixed height; Q6's per-room
   * scale curve is what will turn it into one. Until that exists he is drawn
   * at this height everywhere. The record's own `heightNote` carries why.
   */
  height: number;
  heightNote?: string;
  /**
   * Whether the room's depth curve governs this mover's drawn height.
   *
   * Absent means yes, because everything that walks is a person until it says
   * otherwise. The coach says otherwise: 389 is its own art at the scale the
   * room was measured for, and the curve -- 222 to 263 -- describes how tall a
   * MAN is at a depth. Handing a coach to it drew it at 590 x 240 with its
   * roof at head height.
   *
   * IT HAS TO BE IN THE RECORD. `tools/build-actor-record.mjs` knew the coach
   * was not a person and the engine could not tell: the generator wrote 389
   * into a field the renderer never consulted for an unrouted mover, and the
   * right value sat there unreachable. A fact about a character belongs to the
   * character, not to the tool that wrote him down.
   */
  scalesWithDepth?: boolean;
  /**
   * The facings this character is DRAWN in, and no others.
   *
   * Hob is right-facing only -- he crosses the road once and never comes back,
   * so four clips is the art being right rather than the art being short.
   * Declared so that asking for a facing he has not got is answered by DATA
   * instead of by a guard firing. Q20 still holds underneath: no silent
   * substitution. A facing he does not have draws nothing; a clip he should
   * have and does not is still named.
   */
  facings?: Facing[];
  ratesNote?: string;
  /** Walk-cycle frames per second. */
  walkRate: number;
  /**
   * How far one full walk cycle carries him, in DRAWN pixels at this record's
   * own `height`. Scaled with the drawn height at use, like everything else.
   *
   * MEASURED FROM THE FRAMES, not chosen: the widest separation between the
   * two ground contacts across the cycle, which is one step heel to heel.
   * Absent keeps the old clock-driven advance, which is right for anything
   * with no gait -- the coach's walk is a single frame.
   */
  strideLength?: number;
  strideNote?: string;
  /**
   * How fast he walks, in pixels per SECOND, on screen.
   *
   * A pace and a stride have to agree or the feet lie about the speed:
   * `walkSpeed / strideLength` is how many strides a second he takes, and a
   * person walks about two. The engine's default was 323 px/s against a
   * measured 102px stride -- 3.2 strides a second, a sprint, invisible only
   * because the gait used to run on a clock.
   *
   * Absent keeps the engine default, so a character nobody has timed walks as
   * everything did before.
   */
  walkSpeed?: number;
  walkSpeedNote?: string;
  /** Reaction frames per second. */
  reactRate: number;
  /** Errata 35b: the idle cycle's rate. Slower than the walk, on purpose. */
  idleRate?: number;
  /** Doc 40's idle-break: played on a timer, never looped, back to stand. */
  idleBreakRate?: number;
  idleBreakNote?: string;
  clips: ActorClip[];
}

/**
 * One inventory item. Doc 06: an array of ids, LOOK and LISTEN per item, and
 * combination as a lookup table of pairs.
 *
 * `responses` is the same shape a hotspot carries, because an item in the
 * inventory is examined by exactly the same route as a thing in the room --
 * one verb system, one response resolver, no second path to maintain.
 */
export interface ItemFile {
  schema: number;
  id: string;
  name: string;
  note?: string;
  /**
   * Panel name, when the full name will not fit. Errata ruling 26 point 2.
   *
   * AUTHORED, never computed. Form 12-C, Form 12-C (Amended) and Form 12-C
   * (Amended, Void) are three separate items and the joke in Act II is that
   * they are TELLABLE APART; a truncation rule renders the second and third
   * identically at the panel width and kills the gag. So the rule is: if the
   * name does not fit, the item carries a short one somebody wrote, and
   * check-item-names fails the build if two items would draw the same row.
   */
  short?: string;
  /** In the inventory from a new game. The fork never leaves it. */
  startsHeld?: boolean;
  /** No LOOK or LISTEN written yet. Doc 15 lists ~40 of these as unwritten. */
  linesPending?: boolean;
  responses?: Record<string, ResponseRule[]>;
  overrides?: Record<string, string>;
}

/**
 * One background element that animates by palette cycling. Doc 18.
 *
 * The band is family-relative so a room never names an absolute palette
 * index, and `bounds` is the reservation: those indices may be drawn only
 * inside that rectangle. tools/pixelart/cycling.py enforces it at composition
 * time, because a lamp's band reused on a window frame makes the window
 * frame flicker.
 */
export interface CyclingElement {
  id: string;
  note?: string;
  mode: 'rotate' | 'pingpong' | 'pulse';
  /** Steps per second. Doc 18 discipline rule 4: nothing above about 4 Hz. */
  rate: number;
  /** Offset in whole states, so two elements on one ramp are not in lockstep. */
  phase?: number;
  ramp: { family: string; start: number; count: number };
  bounds: [number, number, number, number];
}

/**
 * One two-frame idle sprite in a drawn crowd. Errata ruling 20.
 *
 * `at` is the figure's feet, centred. `frames` are source rects in the room's
 * idle sheet -- declared rather than computed, so the sheet builder and the
 * engine read the same numbers and cannot disagree about where a frame is.
 */
export interface IdleFigure {
  id: string;
  note?: string;
  at: [number, number];
  height: number;
  kind: 'standing' | 'seated';
  /** Full cycles per second. Ruling 20: roughly 0.3-0.8, varied per figure. */
  rate: number;
  /** Offset in cycles, so no two figures move on the same beat. */
  phase?: number;
  glass?: boolean;
  frames: [number, number, number, number][];
}

/**
 * One clickable destination on the town map. Doc 20.
 *
 * `label` is a LAST RESORT and only legitimate while `unbuilt` is set: the
 * name a location draws is its destination room's own `name`, so doc 20's
 * requirement that nothing needs redrawing when a name changes holds without
 * anyone having to remember it. A built room with a label on its location is
 * two names for one place waiting to disagree, and the build refuses it.
 */
export interface MapLocation {
  id: string;
  room: string;
  at: [number, number];
  label?: string;
  unbuilt?: boolean;
  when?: Condition;
  note?: string;
}

export interface RoomFile {
  schema: number;
  id: string;
  name: string;
  note?: string;
  /**
   * `map` is Room 0 and nothing else: no floor, no actor, no hotspots, and
   * exempt from every check that reasons about somewhere a person stands.
   * Absent means an ordinary room, which is the only other kind there is.
   */
  kind?: 'map';
  /** Doc 20's travel destinations. Only a `map` room has these. */
  locations?: MapLocation[];
  /**
   * Flags set the first time the player stands in this room.
   *
   * Errata 31c is the case that needs it: everything visible from Main
   * Street goes on the map the first time Thad is on Main Street, and
   * "being here" is not something a hotspot response can observe. Applied
   * on entry and idempotent -- a flag already true stays true, so walking
   * in and out does not re-fire anything downstream.
   */
  onEnter?: { note?: string; set?: FlagWrites };
  /** Destinations doc 20 names but whose appearance rule nobody has stated. */
  pendingLocations?: { room: number | null; name: string; doc: string; missing: string }[];
  colours: { sky: number; ground: number };
  horizon: number;
  hotspots: Interactable[];
  exits: Exit[];
  /** Floor regions, each carrying a depth zone. Absent in rooms with no floor. */
  walkable?: WalkableRegion[];
  /**
   * Errata 28a item 1. Where a room declares these they REPLACE `walkable`:
   * the boxes carry their own scale behaviour, so the zone table does not
   * apply. Main Street is converted; the rest convert when they are
   * re-blocked at ruling 22 step 2, and until then both models are live.
   */
  walkBoxes?: WalkBox[];
  /** Composed background, relative to the manifest. */
  background?: string;
  /**
   * Ruling 21a's near plane: an RGBA overlay drawn after the actor. Kept for
   * rooms not yet converted to z-planes; a room declaring `occlusionPlanes`
   * does not use it.
   */
  foreground?: string;
  /**
   * Doc 22 section 5. One 1-bit mask per clip level, and an actor is masked
   * by ITS OWN plane rather than by a union of every plane -- so each plane
   * carries everything nearer than the actors assigned to it, and plane 2
   * contains plane 1.
   *
   * The masks are not drawn. That geometry is already in the background; a
   * plane only says which of those pixels are in front of an actor at that
   * level. `clipPlane: 0` on a walk box means masked by nothing.
   */
  occlusionPlanes?: { level: number; note?: string; mask: string }[];
  /**
   * Ruling 20: a drawn crowd of four or more needs at least three animated
   * members. The rest stay painted into the background and the eye gives them
   * the credit.
   */
  idles?: { note?: string; sheet: string; figures: IdleFigure[] };
  /** Background elements that cycle. At most two, per doc 18. */
  cycling?: CyclingElement[];
  /**
   * Arrival points, one per incoming exit, and doc 20 rule 1's stated routes
   * in. An entrance carrying `at` places the actor; one carrying only `from`
   * still declares the route, which is what check-room-entries reads.
   */
  entrances?: Entrance[];
  /** Ruling 23's named positions for scripted beats. */
  staging?: StagingMark[];
  /** Ambient NPC ids placed in this room. */
  ambient?: string[];
  /** An engine test fixture rather than shipped content. */
  fixture?: boolean;
  /** A destination that exists so an exit works, with its content pending. */
  stub?: boolean;
}

export type OptionTag = 'PROGRESS' | 'TOPIC' | 'COMIC' | 'ASSAY' | 'EXIT';

export interface DialogueOption {
  id: string;
  text: string;
  tag: OptionTag;
  when?: Condition;
  say?: string;
  /**
   * A response with more than one speaker in it, in order.
   *
   * Doc 17 v3.1's second option is "Hotel's five." — "I have four." — "You've
   * all got four.", three lines across two people. The v2 file carried that
   * as one `say` with dashes standing in for the speaker changes, which reads
   * on screen as one man saying all of it and loses the joke's timing. An
   * option has either `say` or `exchange`, never both.
   */
  exchange?: { speaker: string; line: string }[];
  /** Shown instead of `say` once the option has already been taken. */
  repeat?: string;
  /**
   * The option's response is a SCENE, not a line, and the scene is not built.
   *
   * Doc 27 writes Vessel's sixth option as "(The swindle. Four dollars and
   * the watch for the deed.)" -- a stage direction with no speech in it,
   * because nobody says anything: four dollars and a watch go one way and a
   * deed comes back. The direction is carried here verbatim rather than
   * dropped, and check-content-schema lists every one of these on every run.
   *
   * The runner shows nothing for it, which is correct and temporary. An
   * option carrying a beat must never be given an invented line to fill the
   * silence -- when the machinery exists, the beat plays.
   */
  beat?: string;
  set?: FlagWrites;
  add?: FlagAdds;
  goto?: string;
  /**
   * Marks an option that changes state without presenting as progress.
   * Invariant 7: the player must not be able to tell. Purely documentary --
   * the runner treats it identically to any other option.
   */
  silentState?: boolean;
}

export interface DialogueNode {
  /**
   * What the other party says before the options are offered.
   *
   * Optional, and its absence must be declared. Doc 17 v3.1's driver has no
   * opening line of his own -- beat 3 is automatic and the tree opens on what
   * the player asks next -- and a node with neither a prompt nor a
   * declaration used to reach the font as `undefined` and take the frame down
   * with it. `noPrompt` makes silence a thing somebody chose.
   */
  prompt?: string;
  noPrompt?: boolean;
  options: DialogueOption[];
}

export interface DialogueFile {
  schema: number;
  id: string;
  note?: string;
  /**
   * Who answers, by speaker id.
   *
   * An option's `exchange` names a speaker per line and an option's own `say`
   * or `repeat` does not -- so those reported null, and null meant BOTH
   * "nobody said this" and "the speaker is the tree's owner". Two different
   * facts down one wire: every line in the driver's tree drew as though Thad
   * had said it, because the fallback ink is the colour Thad speaks in.
   */
  speaker?: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export interface VerbDefinition {
  id: string;
  label: string;
  col: number;
  row: number;
}

export interface VerbsFile {
  schema: number;
  walkVerb: { id: string; label: string };
  /**
   * Verbs that walk the player through an exit instead of examining it, and
   * deliberately produce no line. Doc 14 engine note: OPEN and USE on a
   * doorway are ways of going through it, not questions about it.
   */
  transitVerbs?: string[];
  /** Verbs that ask about a held item rather than picking it up to use with. */
  examineVerbs?: string[];
  /**
   * How close he must get before a verb answers, IN HIS OWN BODY HEIGHTS.
   *
   * Body heights rather than pixels because a pixel is a third of an inch at
   * the front of the walkable band and nearly an inch at the back of it. A
   * fixed radius would mean arm's reach near the camera and across the yard up
   * the road. Stride already scales this way.
   */
  approach?: {
    /** LOOK AT, LISTEN TO and the conversation verbs. About eleven feet. */
    examineHeights: number;
    /** Everything hands-on. About three feet -- arm's reach. */
    handsOnHeights: number;
    /** Verbs that want a talking distance rather than a touching one. */
    conversationVerbs?: string[];
  };
  approachNote?: string;
  /** Verbs that pick an item up to use on something else. Doc 24's USE. */
  carryVerbs?: string[];
  carryVerbsNote?: string;
  /** What a click on an ambient character performs. */
  npcVerb?: string;
  defaultVerb: string;
  grid: { cols: number; rows: number };
  verbs: VerbDefinition[];
}

export interface UiFile {
  schema: number;
  sentence: {
    template: string;
    verbOnly: string;
    walkTemplate: string;
    /** With an item held: verb, item, target. */
    itemTemplate: string;
    /** With an item held and nothing under the pointer. */
    itemOnly: string;
  };
  dialogue: {
    optionPrefix: string;
    optionPrefixSelected: string;
    exhaustedPrefix: string;
  };
  notices: Record<string, string>;
  keys: Record<string, string>;
  hud: { hintTemplate: string };
  /** Doc 20's map screen. Interface grammar, of a class with the templates. */
  map?: { note?: string; button: string; back: string; travelTemplate: string };
  /**
   * ERRATA 39's fullscreen toggle. Two words rather than one because the
   * button says which way it goes -- FULL while windowed, WINDOW while full --
   * and a control that only names itself leaves the player guessing which
   * state they are in.
   */
  fullscreen?: { note?: string; button: string; back: string };
  /**
   * How long a line stays up. Not written content and not in any document:
   * doc 17 states seconds for BEATS, and a line's duration is a property of
   * the line rather than of the beat that contains it.
   */
  timing?: {
    note?: string;
    lineSecondsPerGlyph: number;
    lineSecondsMinimum: number;
    actCardExtraSeconds: number;
    actCardNote?: string;
    /**
     * Doc 30 section 4.1's binding formula for a DIALOGUE line:
     * `clamp(1.8s, 8.0s, 0.45s + visibleGlyphs x 0.055s)`.
     *
     * Optional so a bundle without them performs at the defaults rather than
     * failing to load -- but they are declared in `content/ui/ui.json`, and
     * the note there says why they are content: the unbuilt "Text speed"
     * option scales exactly these.
     */
    holdBaseSeconds?: number;
    holdPerGlyphSeconds?: number;
    holdMinimumSeconds?: number;
    holdMaximumSeconds?: number;
    holdNote?: string;
  };
}

export interface FontFile {
  id: string;
  width: number;
  height: number;
  advance: number;
  spaceAdvance: number;
  on: string;
  glyphs: Record<string, string[]>;
  /** Per-glyph advance overrides, for dashes and the ellipsis. */
  advances?: Record<string, number>;
}

export interface PaletteFile {
  schema: number;
  id: string;
  /** The locked palette may not be edited. The engine refuses an unlocked one. */
  locked: boolean;
  channelBits: number;
  families: Record<string, { start: number; count: number }>;
  /** Named interface colours, so no .ts file hard-codes a palette index. */
  roles: Record<string, number>;
  colours: string[];
}

export interface ManifestFile {
  menu: string;
  schema: number;
  font: string;
  scaling: string;
  reputation: string;
  verbFallbacks: string;
  ambient: string[];
  palette: string;
  ui: string;
  verbs: string;
  flags: string;
  startRoom: string;
  rooms: string[];
  dialogue: string[];
  puzzles: string[];
  /** Doc 17's opening and anything else authored as beats rather than a tree. */
  sequences: string[];
  /** Which sequence plays on a new game, by id. */
  openingSequence?: string;
  /** The player character's sheet and clip table. */
  actor: string;
  /** Every actor record, named explicitly. Never discovered from a directory. */
  actors?: string[];
  actorsNote?: string;
  /** Head overlays -- a head composited over a body that never swaps. */
  overlays?: string[];
  /** Traced walk paths, named so a `path` step can ask for one. */
  paths?: string[];
  /**
   * Light a mover carries and leaves with, drawn on the ground beneath it.
   *
   * Named here rather than discovered, like every other record. Optional: a
   * game with no glow declared draws no glow, which is what it did before this
   * existed.
   */
  carriedLight?: string;
  /** A colour per speaker for spoken lines. Absent draws in the default ink. */
  speechColours?: string;
  speechColoursNote?: string;
  items: string[];
  /** Verb panel and inventory geometry. Errata ruling 26. */
  panel: string;
  /** Doc 24's item combination table. */
  combinations: string;
  /** Errata 29's inventory icon sheet. */
  itemIcons: string;
  /**
   * Doc 45's music beds. `title` is O-01-M; `rooms` maps a room id to its
   * own bed. Absent or unnamed is silence, not an error -- no music has been
   * written yet, and the game has to run without it.
   */
  music?: {
    title?: { src: string; gain?: number };
    rooms?: Record<string, { src: string; gain?: number }>;
  };
  musicNote?: string;
}

/** Everything the engine needs, resolved from the manifest. */
/**
 * content/actors/<id>-head.json -- A HEAD COMPOSITED OVER A BODY THAT DOES NOT
 * MOVE. Doc 43 part two's draw order step 4, and Q55.
 *
 * IT IS NOT A MOVER AND MUST NOT BECOME ONE. The stage driver is drawn inside
 * the coach's own frames: only 55% of him separates, and below 27% of the
 * assembly he is fused into the seat, footboard and reins. Splitting him out
 * as a character would put a seam down the harness, which is errata 31d's
 * ruling about the team and holds for him for the same reason.
 *
 * IT IS NOT A CLIP EITHER, and `tools/check-actor-clips.mjs` exists to keep
 * the two apart: an overlay carries a `figure` because the rig records the
 * body it belongs to, and a record that declared it as a body clip would scale
 * it to that figure and draw a sprite four to eight pixels tall. Absurd,
 * silent, and produced by code that did nothing obviously wrong.
 */
export interface OverlayState {
  image: string;
  /**
   * The speaker that selects this state, if one does.
   *
   * DOC 43 LINE 97 IS CONTENT, NOT A RULE IN THE ENGINE: `looking-down` while
   * Thad speaks up at him, `speaking` on the driver's own lines, `neutral`
   * otherwise. A fact about one character in one scene, and nothing general
   * follows from it -- so it is authored per state rather than inferred from
   * who is talking to whom.
   */
  whenSpeaker?: string;
}

/**
 * A light one mover carries: an additive sprite on the ground, under its flame.
 *
 * ERRATA D8. It is drawn AFTER the plate and BEFORE the characters, and it is
 * neither baked into the carrier's sprite nor painted into the plate. Baked in,
 * it would travel as a hard-edged patch of lit ground moving with him; painted
 * into the plate, it would stay after he had gone. **Light that belongs to a
 * mover leaves with the mover.**
 */
export interface CarriedLightFile {
  /** The additive sprite. RGB carries the intensity; alpha stays 255. */
  sprite: string;
  /** Its own pixel size, which is what `flameAnchor` is measured against. */
  size: [number, number];
  /**
   * Where the flame sits IN THE SPRITE. The pool hangs below it, so this is
   * well above the sprite's centre and the rest falls on the ground.
   */
  flameAnchor: [number, number];
  /** Pool width as a multiple of the carrier's DRAWN height. */
  widthPerHeight: number;
  /** 0..1 multiplier on the additive blend. Doc's own value is a judgement. */
  intensity: number;
  note?: string;
}

/**
 * A path traced by eye against the plate, for a mover to walk. Doc 17 beat 11.
 *
 * THE HEIGHTS ARE THE POINT. The room's depth curve is calibrated for the
 * walkable band and this path goes far above it, where the curve's third
 * sample is provisional and nobody has ruled on it -- so the recession is
 * traced rather than computed, and the trace is what the engine follows.
 */
export interface PathFile {
  room: string;
  beat: number;
  playArea: [number, number];
  /** Sets the rate AND the length of the title. One clock, both. */
  beatSeconds: number;
  waypoints: { x: number; y: number; figureHeight: number }[];
  /**
   * The waypoint index at which the derived far-distance clip takes over, or
   * -1 when this trace never gets small enough to need it. Not a threshold the
   * engine may apply on its own: whether a figure becomes a dot is a look
   * decision.
   */
  farClipHandoff?: number;
  note?: string;
}

export interface OverlayFile {
  schema: number;
  /** The overlay's own name, which is what the probe and the gauntlet call it. */
  id: string;
  /** The mover whose body it composites onto. */
  over: string;
  note?: string;
  rectNote?: string;
  statesNote?: string;
  /** [x, y, w, h] in the BODY FRAME'S OWN PIXELS, scaled with the drawn height. */
  rect: [number, number, number, number];
  /**
   * The body clips this overlay composites onto. Absent means all of them.
   *
   * SOME CLIPS ALREADY CARRY THE HEAD. The coach's `walk` frame is one drawn
   * picture of a departing coach WITH ITS DRIVER IN IT, so compositing over it
   * paints a second head on a man who has one -- reported as the driver's head
   * reappearing and stuttering as he drove off. Whether a piece of art already
   * contains the thing an overlay draws is not a question code can ask, so it
   * is declared.
   */
  clips?: string[];
  /**
   * A rect for a particular body clip, keyed `clip` or `clip/state`.
   *
   * ONE RECT CANNOT SERVE EVERY FRAME. The coach's door-open frame is a
   * separate generation, not the same picture with a door swapped -- it
   * differs from the plain idle on 162,227 pixels across the whole 956x389
   * canvas -- and its driver sits twelve pixels right and nine pixels up. The
   * overlay drew at the shut-door position over the open-door art for the
   * whole of beats 2 to 6, which is the entire conversation, and that is two
   * heads side by side.
   *
   * Resolved `clip/state` first, then `clip`, then `rect` -- the same
   * exact-match-then-fall-back `clipOf` uses, for the same reason.
   */
  rectFor?: Record<string, [number, number, number, number]>;
  /** The body's figure height, so the rect scales exactly as the body does. */
  /**
   * VOID. Removed from the data and read by nothing. A body's figure height
   * is PER CLIP -- the coach is 447 standing and 224 walking -- so a single
   * number here could never follow it, and four separate fixes were computed
   * inside it before that was noticed. drawOverlays uses the drawn clip's own
   * scale. Kept optional so an old file still loads.
   */
  figureHeight?: number;
  /** The state drawn when no speaker selects another. */
  default: string;
  states: Record<string, OverlayState>;
}

/**
 * content/ui/speech-colours.json -- who is speaking, in colour.
 *
 * FULL RGB, NOT A PALETTE INDEX. Errata 54 removed the locked palette and
 * `art/palette/consolation-256.json` is reference only, so a speaker's colour
 * is the colour and not a number that has to be looked up in a table nobody
 * is bound by any more.
 *
 * NOT KEYED BY NAME. A name is content and changes; an id is structure and
 * does not, and the same id already identifies a speaker in the sequence's
 * table and in a dialogue exchange.
 */
export interface SpeechColoursFile {
  schema: number;
  note?: string;
  whyNotInTheSpeakersTable?: string;
  keyedBy?: string;
  fallback?: string;
  provisional?: string;
  speakers: Record<string, { colour: string; note?: string }>;
}

export interface ContentBundle {
  menu: MenuFile;
  manifest: ManifestFile;
  font: FontFile;
  palette: PaletteFile;
  ui: UiFile;
  verbs: VerbsFile;
  flags: FlagsFile;
  scaling: ScalingFile;
  reputation: ReputationFile;
  verbFallbacks: VerbFallbacksFile;
  ambient: Map<string, AmbientFile>;
  rooms: Map<string, RoomFile>;
  dialogue: Map<string, DialogueFile>;
  actor: ActorFile;
  /** Every declared record by id, the protagonist among them. */
  actors: Map<string, ActorFile>;
  items: Map<string, ItemFile>;
  panel: PanelFile;
  combinations: CombinationsFile;
  itemIcons: ItemIconsFile;
  sequences: Map<string, SequenceFile>;
  /** Head overlays by id. Empty until something declares one. */
  overlays: Map<string, OverlayFile>;
  /** The lamp's ground light, or null when the manifest declares none. */
  carriedLight: CarriedLightFile | null;
  /** Traced paths, keyed by the content path that names them. */
  paths: Map<string, PathFile>;
  /** A colour per speaker, or null where none is declared. */
  speechColours: SpeechColoursFile | null;
}

/**
 * content/sequences/*.json -- a scene authored as beats rather than as a
 * dialogue tree, extracted from the doc that writes it.
 *
 * Deliberately NOT the same shape as errata 28a's SequenceStep. That runner
 * has five step kinds and no timed wait, and doc 17's beats are timed; a beat
 * is what the document says happens, and lowering it into steps the runner
 * can execute is a separate job that has not been done. Loading them now
 * means the lines are content the validators can see rather than prose in a
 * markdown file that nothing checks.
 */
export interface SequenceFile {
  schema: number;
  id: string;
  note?: string;
  /** Rulings applied to the document on the way in. */
  corrections?: string[];
  /** The flag set when this sequence hands over control. */
  doneFlag?: string;
  /** Lines the doc carries that have no home in content yet. */
  unwritten?: string[];
  speakers: Record<string, { name: string; note?: string }>;
  beats: SequenceBeat[];
}

export interface SequenceBeat {
  /**
   * The beat's id, as the DOCUMENT writes it -- a string, because doc 17's
   * beat 6b exists. It was a number, and the extractor's row pattern demanded
   * digits, so the beat the player audit asked for was dropped in silence.
   */
  beat: string;
  description: string;
  /** 'menu' is the title screen, 'none' is a cutscene, 'player' has control. */
  control: 'menu' | 'none' | 'player';
  seconds?: number;
  note?: string;
  actCard?: string;
  lines?: { speaker: string; line: string }[];
  set?: Record<string, boolean | number>;
  /** The dialogue tree that carries this beat's lines. Errata 30b. */
  carriedBy?: string;
  /**
   * WHAT THE BEAT DOES, as opposed to what it says. Issue X4 defect 2.
   *
   * A beat's `description` is prose out of doc 17 -- "The coach arrives and
   * halts with Thad visibly aboard" -- and prose does not execute. Before
   * this field existed the lowering emitted `say` and `wait` and nothing
   * else, so the runtime held for eight seconds while a beat announced an
   * arrival and not one thing on screen moved.
   *
   * THIS IS DECLARED, NEVER PARSED. Reading a mark out of an English sentence
   * would be guessing at the geometry, and Q4 has already ruled that Room 1's
   * numbers are not a specification until they are re-derived from the new
   * plate. So the marks are data an author supplies, the engine lowers them,
   * and a beat that declares none stages nothing -- visibly, rather than by
   * appearing to work.
   */
  staging?: SequenceStagingStep[];
  /**
   * A flag this beat waits for before it begins.
   *
   * Doc 17 beat 9 is Hob's exchange. He no longer crosses the road saying it
   * at whoever is standing there: he waits at the roadside and speaks when he
   * is SPOKEN TO, so the beat is a response rather than a moment on a clock.
   *
   * ONLY THE CARRIER HONOURS THIS, and only it can: an automatic segment plays
   * instead of the player, so a cutscene beat waiting on a player action would
   * wait forever with no way to act. The carrier plays ALONGSIDE the player,
   * after control has been handed over, which is the only place a beat can
   * sensibly wait for one.
   */
  awaitFlag?: string;
}

/**
 * One staged action inside a beat. Lowered by `Opening.stepsFor` into the
 * runner's own step kinds, in doc 22 section 6's order.
 *
 * The vocabulary is deliberately the runner's and nothing more: errata 28a
 * cut the step kinds to five, 30a added `wait` and 38 added `move`, and
 * anything outside that set would be a seventh kind arriving through a side
 * door. `walk` and `move` are followed by a `waitForActor` when they are
 * lowered, so an author never writes the wait and can never forget it.
 */
export type SequenceStagingStep =
  /** Routed across the room's walk boxes, like a click. Characters only. */
  | { do: 'walk'; actor: string; to: [number, number] }
  | { do: 'face'; actor: string; facing: Facing }
  /**
   * A named one-shot clip. There is NO fallback for a clip that does not
   * exist: doc 34 step C removes the last one, and a substitution here would
   * hide missing coverage behind something that looks like it works.
   */
  | { do: 'chore'; actor: string; clip: string }
  /**
   * ERRATA 28a's STRUCK `setObjectState`, BACK AS AN EIGHTH KIND. Doc 22 item
   * 9's state, changed by a cutscene rather than by a verb. `state` absent
   * means back to the declared default -- shut, for the coach's door.
   */
  | { do: 'setState'; object: string; state?: string }
  /**
   * Doc 17 beat 11. Walk a mover along a TRACED path over its own duration.
   *
   * A NINTH KIND, and it earns one for the reason `setState` did: nothing in
   * the existing vocabulary can say it. A `walk` is routed across the room's
   * boxes and this leaves them; a `move` is a straight glide at a constant
   * rate in SCREEN pixels, and a receding figure moved at a constant screen
   * rate reads as accelerating away.
   *
   * It names a FILE. The waypoints and their drawn heights were traced by eye
   * against the plate, so re-tracing must not need an engine change -- and the
   * duration comes from the trace too, because the title is keyed to the same
   * number.
   */
  | { do: 'path'; actor: string; path: string }
  /**
   * The travel an exit declined to do for itself, when the beat says so.
   *
   * `travelWhenTold` exists so a departure can be WATCHED, and something has
   * to do the travelling at the end. This used to be `interact <exit> WALK_TO`,
   * which resolves the verb where it stands and therefore walks him to the
   * exit's own `walkTo` first -- back down the road the beat had just spent
   * forty seconds taking him up.
   *
   * Names the exit rather than the room: where it goes is on the exit, and a
   * destination repeated in the staging is a second copy that can disagree.
   */
  | { do: 'travel'; through: string }
  /**
   * A verb applied to a target, from a beat. NOT A NEW STEP KIND.
   *
   * `SequenceStep.say` has carried `interact` since errata 28a -- "a line, or
   * the interaction that produces one" -- and `saySequenceStep` resolves it
   * through the ordinary interaction path, effects and room change included.
   * THE RUNNER COULD ALWAYS TRAVEL; the staging vocabulary could not reach it,
   * because `do: 'say'` takes a line index and nothing else.
   *
   * This exposes a capability rather than adding one, which is the third time
   * that has been the answer -- `state` on ActorClip, `setState`, and now
   * this. Worth noticing as a pattern: the engine is usually further along
   * than the vocabulary that addresses it.
   */
  | { do: 'interact'; target: string; verb: string }
  /**
   * A PAUSE BETWEEN TWO STEPS OF ONE BEAT, distinct from the beats own
   * stated seconds -- that is one duration for the whole beat, and this is a
   * gap inside it. Doc 17 beat 3 wants a moment after Thad says who he is
   * before he crosses to the driver.
   *
   * Fenced exactly as the beats own wait is: errata 30a excluded it to stop
   * a bare timed sleep replacing waitForActor in ordinary interaction, and
   * that reasoning holds there and not in a cutscene where the duration IS
   * the content. stepsFor is reached only for automatic segments.
   *
   * ADDED AFTER IT WAS ALREADY IN USE. It was authored into beat 3; the
   * drawer check caught that nothing DREW it; nothing caught that nothing
   * LOWERED it. It fell through stepsFor default branch to chore, became a
   * chore with an undefined actor, and killed the opening at beat 3 with a
   * missing-mover error about a step that never named one.
   */
  | { do: 'wait'; seconds: number }
  /**
   * ERRATA 38. "`move` translates a named object from one position to another
   * over a duration" -- the coach's departure, and the reason the ruling
   * exists. Legal only inside a beat whose control is `none`, the same fence
   * `wait` carries and for the same reason.
   *
   * `from` places the mover before it travels, which is how anything that is
   * not the player gets into the room at all: a coach arriving starts off
   * frame and a coach departing starts on its mark.
   */
  | { do: 'move'; actor: string; from?: [number, number]; to: [number, number]; seconds: number }
  /**
   * ONE OF THE BEAT'S OWN LINES, BY INDEX. It carries no text.
   *
   * NOT A NEW STEP KIND. `SequenceStep` has had `say` since it was written;
   * this exposes it to authors. Errata 28a cut the kinds to five, 30a added
   * `wait`, 38 added `move` -- this adds none. What it adds is the ability to
   * PLACE one, which is the gap: doc 22 section 6's chain is
   * `walk -> waitForActor -> face -> waitForActor -> chore -> say`, and a
   * line was the only thing in it an author could not put anywhere. A beat's
   * lines were appended after all of its staging, so "walk here, speak, walk
   * on" was inexpressible -- Hob touched his mark for one tick and spoke his
   * three lines 180px past the right edge of the frame.
   *
   * THE INDEX IS THE WHOLE POINT. A `say` carrying a string would put
   * dialogue in `tools/extract-content.mjs`, where the staging table lives so
   * that no `.ts` holds a coordinate and no prose document holds a pixel. The
   * words stay in doc 17; this says only WHEN one of them lands. An index with
   * no line behind it fails at extraction, which is checkable in a way a
   * string is not.
   *
   * A beat that places any of its lines places ALL of them: its lines are no
   * longer appended, so a beat cannot half-schedule itself and play the
   * remainder twice.
   */
  | { do: 'say'; line: number };


/** content/ui/menu.json -- every string the pause menu can draw. */
export interface MenuFile {
  schema: number;
  button: { label: string };
  root: { title: string; items: { id: string; label: string }[] };
  save: { title: string; back: string };
  load: { title: string; back: string };
  options: {
    title: string;
    back: string;
    /** How a toggle draws its label and its current value. */
    valueTemplate: string;
    items: {
      id: string;
      label: string;
      type?: 'toggle';
      on?: string;
      off?: string;
      default?: boolean;
    }[];
  };
  slots: {
    count: number;
    nameTemplate: string;
    emptyLabel: string;
    usedTemplate: string;
    overwriteNote: string;
    time: { justNow: string; minutes: string; hours: string; days: string };
  };
  notices: { saved: string; restored: string; noSave: string };
}
