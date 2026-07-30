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
  responses?: Record<string, ResponseRule[]>;
  fallback?: string[];
}

export interface Exit extends Interactable {
  to: string;
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
}

export interface PaletteFile {
  schema: number;
  colours: string[];
}

export interface ManifestFile {
  schema: number;
  font: string;
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
  manifest: ManifestFile;
  font: FontFile;
  palette: PaletteFile;
  ui: UiFile;
  verbs: VerbsFile;
  flags: FlagsFile;
  rooms: Map<string, RoomFile>;
  dialogue: Map<string, DialogueFile>;
}
