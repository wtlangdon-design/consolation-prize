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
}

export interface Exit extends Interactable {
  to: string;
  /** A destination that exists but has no written examine layer yet. */
  stub?: boolean;
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
  | { kind: 'curve'; farY: number; farHeight: number; nearY: number; nearHeight: number };

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
  /** Walk-cycle frames per second. */
  walkRate: number;
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
  items: string[];
  /** Verb panel and inventory geometry. Errata ruling 26. */
  panel: string;
  /** Doc 24's item combination table. */
  combinations: string;
  /** Errata 29's inventory icon sheet. */
  itemIcons: string;
}

/** Everything the engine needs, resolved from the manifest. */
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
  items: Map<string, ItemFile>;
  panel: PanelFile;
  combinations: CombinationsFile;
  itemIcons: ItemIconsFile;
  sequences: Map<string, SequenceFile>;
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
   * ERRATA 38. "`move` translates a named object from one position to another
   * over a duration" -- the coach's departure, and the reason the ruling
   * exists. Legal only inside a beat whose control is `none`, the same fence
   * `wait` carries and for the same reason.
   *
   * `from` places the mover before it travels, which is how anything that is
   * not the player gets into the room at all: a coach arriving starts off
   * frame and a coach departing starts on its mark.
   */
  | { do: 'move'; actor: string; from?: [number, number]; to: [number, number]; seconds: number };


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
