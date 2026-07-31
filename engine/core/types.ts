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
}

export interface Exit extends Interactable {
  to: string;
  /** A destination that exists but has no written examine layer yet. */
  stub?: boolean;
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
}

export interface ScalingZone {
  index: number;
  name: string;
  height: number;
}

export interface ScalingFile {
  schema: number;
  zones: ScalingZone[];
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
  /** Background elements that cycle. At most two, per doc 18. */
  cycling?: CyclingElement[];
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
  defaultVerb: string;
  grid: { cols: number; rows: number };
  verbs: VerbDefinition[];
}

export interface UiFile {
  schema: number;
  sentence: { template: string; verbOnly: string; walkTemplate: string };
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
