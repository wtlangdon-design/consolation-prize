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
   * Ruling 24's two drawn sizes. Zone heights are depth samples the drawn
   * height interpolates between; only these two are ever drawn.
   */
  drawn: { near: number; far: number };
  /** The measured height at which decimation stops leaving eyes. */
  threshold: number;
  zones: ScalingZone[];
}

/** One animation in an actor sheet: a row of frames at a constant stride. */
export interface ActorClip {
  id: string;
  facing: Facing;
  surface: string;
  row: number;
  frames: number;
}

export interface ActorSize {
  sheet: string;
  height: number;
  /** Cell width and height. Frames stride by these; the anchor is bottom centre. */
  cell: [number, number];
  clips: ActorClip[];
}

/** content/ui/panel.json -- errata ruling 26's geometry, read by engine and tools. */
export interface PanelFile {
  schema: number;
  note?: string;
  sentence: { x: number; y: number };
  verbs: { cols: number[]; rows: number[]; width: number; height: number; note?: string };
  menuButton: { col: number; row: number };
  inventory: {
    note?: string;
    x: number;
    y: number;
    width: number;
    rowHeight: number;
    rows: number;
    arrows: { x: number; width: number; note?: string };
  };
}

/** content/actors/*.json -- where a character's frames are, never how they look. */
export interface ActorFile {
  schema: number;
  id: string;
  note?: string;
  threshold: number;
  /** Walk-cycle frames per second. */
  walkRate: number;
  /** Reaction frames per second. */
  reactRate: number;
  sizes: { near: ActorSize; far: ActorSize };
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

export interface RoomFile {
  schema: number;
  id: string;
  name: string;
  note?: string;
  colours: { sky: number; ground: number };
  horizon: number;
  hotspots: Interactable[];
  exits: Exit[];
  /** Floor regions, each carrying a depth zone. Absent in rooms with no floor. */
  walkable?: WalkableRegion[];
  /** Composed background, relative to the manifest. */
  background?: string;
  /**
   * Ruling 21a's near plane: an RGBA overlay drawn after the actor. Every
   * room carries one. The walkable mask is unchanged -- this is draw order
   * and nothing else.
   */
  foreground?: string;
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
  /** Shown instead of `say` once the option has already been taken. */
  repeat?: string;
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
  prompt: string;
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
  /** The player character's sheet and clip table. */
  actor: string;
  items: string[];
  /** Verb panel and inventory geometry. Errata ruling 26. */
  panel: string;
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
}


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
