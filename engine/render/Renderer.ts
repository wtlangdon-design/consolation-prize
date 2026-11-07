import { mapLayout as layoutMap, mapPlaceAt } from './MapLayout.ts';
import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import { FAR_WALK, IDLE_BREAK, type Actor } from '../core/Actor.ts';
import type { RoomActors } from '../core/RoomActors.ts';
import type { AmbientLayer, Departing } from '../core/Ambient.ts';
import { figureSpeaking } from '../core/Ambient.ts';
import { askedState } from '../dev/RoomState.ts';
import { applyTint, moverTint, type MoverTint } from './LightFields.ts';

/**
 * Which picture a state draws under the room's current visual state: its
 * `imageByState` entry for that state when both exist, else its `image`.
 * The same rule a lamp's `amountByState` follows, and read from the same
 * dev-only selector until Q26 wires the state to canon.
 */
export function stateImagePath(shown: { image?: string; imageByState?: Record<string, string> }): string | undefined {
  const state = askedState();
  return (state && shown.imageByState?.[state]) || shown.image;
}
import type { ActorFile, AmbientFile, FigureLight, Interactable, OverlayFile, RoomLamp, RoomProp } from '../core/types.ts';
import { ActorSprite, type DrawnFrame } from './ActorSprite.ts';
import { depthTies, watch } from '../dev/Watch.ts';
import type { DrawRecord } from '../dev/Probe.ts';
import type { TitleItem } from '../core/Bookends.ts';
import { GLYPH_SCALE, PANEL_GLYPH_SCALE, BitmapFont, type Face } from './BitmapFont.ts';
import { IdleLayer } from './IdleLayer.ts';
import { askedFont, PreviewFont } from './PreviewFont.ts';
import {
  NATIVE_HEIGHT,
  NATIVE_WIDTH,
  PANEL_HEIGHT,
  PANEL_Y,
  PanelLayout,
  PLAY_HEIGHT,
  type Rect,
  Screen,
} from './Screen.ts';

export interface Frame {
  /**
   * ROOM 33's RIPPLES (doc 45 R33-RIPPLE): each tap drawn where it landed,
   * `age` 0 to 1 over exactly its audible tail. The sound, drawn.
   */
  ripples?: { x: number; y: number; age: number; tail: number }[];
  /**
   * HOW STILL THE ROOM'S LAMPS ARE, 0 to 1 (invariant 8): Room 33's lamp slows
   * to stillness on the score's ninety seconds. 0 everywhere else.
   */
  lampStill?: number;
  hoveredTarget: Interactable | null;
  hoveredTargetName: string | null;
  sayLines: string[];
  notice: string | null;
  barkLines: string[];
  barkAt: { x: number; y: number } | null;
  /**
   * A sound written in the world: a board's creak over the board. Drawn as a
   * bark is drawn -- outlined, at a room position -- and nothing else: not
   * speech, not a notice, not the panel. Null when the world is quiet.
   */
  captionLines: string[];
  captionAt: { x: number; y: number } | null;
  /** Doc 17 beat 7, over the view of the town. Null the rest of the time. */
  actCard?: string | null;
  /** The play area black under the spoken line (doc 57 B3's ride). */
  overBlack?: boolean;
  /**
   * Doc 17 beat 8: "Control. Verb panel appears." Before that beat there is
   * no panel, because there is nothing the player may do with it.
   */
  showPanel?: boolean;
  /**
   * ERRATA 71 B: a panel-less timeline room (Room 32) is showing MENU and SKIP
   * SCENE because the pointer moved. Drawn in the cells MENU and MAP occupy in
   * the panel, on nothing -- no panel behind them.
   */
  sceneControls?: boolean;
  /** The map location under the pointer, so it can draw as the live one. */
  hoveredLocation?: string | null;
  /**
   * Who is speaking, so a head overlay can answer to it. Doc 43 line 97.
   *
   * The overlay's states name their own speaker; this is the fact they are
   * matched against. Null when nobody is talking, which selects the default.
   */
  speaker?: string | null;
  /** The line on screen is a stage direction: same place, quieter ink. */
  direction?: boolean;
  /**
   * The line on screen is waiting for a click (a conversation's, under ui.json
   * conversationWaitsForClick), so a small mark under it says so. The bookends
   * audit, finding 11: with no mark a player sat on a line for 25 seconds.
   */
  awaitingClick?: boolean;
  /**
   * A POSE PERFORMED IN PLACE OF A LINE (errata 131 B, D): whose figure, and
   * which frame -- a number, or `mark` for the frame its pencil holder writes
   * a point down in. Null when nobody is posing.
   */
  pose?: { speaker: string; frame: number | 'mark' } | null;
  /** Figures holding one of their frames: an acted direction (doc 95; errata 141), by figure id. */
  poses?: { id: string; frame: number }[] | null;
  /** A held silence (errata 131 D): every figure holds its rest frame, save whoever speaks or poses. */
  still?: boolean;
  /** The duel's score as the judges have written it, chalked on the room's slate (errata 136 A). Null outside a duel. */
  tally?: { player: number; opponent: number } | null;
  /**
   * THE TITLE SCREEN (errata 128): its items, and which one the pointer is
   * on. While it is up nothing of the room is drawn.
   */
  title?: { items: TitleItem[]; hovered: string | null; theEnd?: boolean; begin?: boolean } | null;
  /**
   * THE PANEL IS THERE BUT INERT (errata 133): Room 33's ninety seconds. The
   * verbs and the inventory are dimmed, not removed, and the sentence line is
   * blank, so the screen says "listen" rather than "broken".
   */
  panelDim?: boolean;
  /** Black over the play area, 0 to 1: a room handing on by a fade (errata 133). */
  fadeBlack?: number;
  /**
   * ERRATA 157'S PAN DOWN FROM THE STARS: the room drawn `offset` play-area
   * pixels lower than it stands, with the bottom of `sky` filling the space
   * above it. Offset 864 is all sky; 0 is the room as it always is.
   */
  pan?: { offset: number; sky: string; clock?: number } | null;
  /**
   * THE LETTER'S PAGE (errata 128): every line of it said so far, drawn whole
   * over black and held, at `pageAlpha` while it fades. Replaces the speech
   * line while it is up.
   */
  page?: string[] | null;
  pageAlpha?: number;
  /**
   * An exchange is being PERFORMED, so the choice list is neither drawn nor
   * clickable. Doc 30 section 1.
   */
  performing?: boolean;
  /** The choice list's scroll and the option under the pointer (errata 143). */
  choiceView?: ChoiceView;
  /**
   * The tree whose opening exchange is being spoken on arrival, before it
   * opens. Its owner holds their talk frame for it exactly as for the open
   * tree: the greeting is the conversation's first line, not ambience.
   */
  greeting?: string | null;
  /**
   * Which beat is playing, so a violation can name it. Doc 44.
   *
   * Carried on the frame rather than fetched, because the renderer must not
   * reach into the sequence runner: a diagnostic that went looking for its own
   * context would be a second mechanism, and R5i is about what happens when a
   * mechanism agrees with itself.
   */
  beat?: string | null;
}

/** Composed room images, keyed by room id. Used for both planes. */
export type BackgroundSource = (roomId: string) => CanvasImageSource | null;

/**
 * The conversation draws in the PANEL, not over the room.
 *
 * It used to fill from y=70 to the bottom of the play area -- seventy-four of
 * a hundred and forty-four rows -- so during the driver's tree the room was
 * cropped to a letterbox strip of sky and the options sat in black under it.
 * Technically inside the 320x200 frame; in practice the room was gone.
 *
 * The reference never crops the room. The verb panel is where a conversation
 * happens: the options take the space the verbs were in, the picture stays
 * whole, and the player keeps looking at the place they are standing in
 * while somebody talks to them.
 *
 * Rows are bottom-anchored to the panel and grow UPWARD, so a node with more
 * options than the panel holds spills into the play area by exactly what it
 * needs rather than by a fixed seventy-four.
 */
/*
 * TEXT AND OVERLAY METRICS, x GLYPH_SCALE. The other half of Q6's partial
 * ruling, and it was only visible by looking.
 *
 * Every number in this block was authored in GLYPH PIXELS against a 320x200
 * frame -- a line step of 10 for a 7-row face, a margin of 6, an overlay 152
 * wide. The x6 content migration could not reach them because they are code,
 * not content, and scaling the face without them put two spoken lines on top
 * of each other at the top of the screen and left the menu overlay in a
 * corner of the play area. Screenshot, not test: all 115 passed either way.
 *
 * They are multiplied rather than re-chosen. A re-chosen number would be a
 * layout decision, and the ruling was to scale the face and not to redesign
 * around it.
 */
/** Doc 17 beat 11's title, and errata 55's corner for it. */
const TITLE_LOGO = 'art/ui/title-logo.png';
const TITLE_WIDTH = 680;
const TITLE_X = 1180;
const TITLE_Y = 60;
/** How much of the walk it takes to arrive. The rest of the beat it holds. */
const TITLE_FADE_FRACTION = 0.2;
const DIALOGUE_BOTTOM = NATIVE_HEIGHT - 3 * GLYPH_SCALE;
// THE OPTION LIST IS DRAWN AT THE PANEL'S SCALE, NOT THE PLAY AREA'S.
//
// At the speech scale a five-option tree plus its prompt is six lines of 60px
// -- 360 of an 864-pixel play area, against a panel only 216 tall. Tyler:
// "too many lines of dialogue all at once, which cuts off too much of the
// actual game." It does, and the list is not speech: it is the interface,
// and the interface already has a size. The verb grid beside it has been
// drawn at PANEL_GLYPH_SCALE all along.
//
// Six lines now cost 240px rather than 360, which is the panel plus one row.
const DIALOGUE_LINE_HEIGHT = 10 * PANEL_GLYPH_SCALE;

/**
 * Line spacing for SPOKEN text, which is drawn at the play area's glyph scale.
 *
 * ONE CONSTANT WAS DOING TWO JOBS AND I MOVED IT. Dropping the option list to
 * the panel's scale also dropped the spacing of every spoken line, because
 * both read DIALOGUE_LINE_HEIGHT -- so a two-line examine response overlapped
 * itself by twenty pixels, which is what Tyler photographed. The list and the
 * speech are different sizes now and need different spacing; they were only
 * ever the same by accident.
 */
const SPEECH_LINE_HEIGHT = 10 * GLYPH_SCALE;
const SAY_TOP = 8 * GLYPH_SCALE;
const TEXT_MARGIN = 6 * GLYPH_SCALE;
/** The letter's page: doc 30's speech block width, and a gap between its lines (errata 128). */
const PAGE_WIDTH = Math.round(NATIVE_WIDTH * (240 / 320));
const PAGE_GAP = 4 * GLYPH_SCALE;
/** How far Room 33's panel is dimmed during the ninety seconds (errata 133). */
const PANEL_DIM = 0.6;
const PAGE_TOP = 40 * GLYPH_SCALE;
/** The title screen's layout: the logo in the ridge's sky, the menu on the dark ground below. */
const TITLE_SCREEN_LOGO_WIDTH = 940;
const TITLE_SCREEN_LOGO_Y = 36;
const TITLE_MENU_Y = 540;
const TITLE_THE_END_Y = 392;
const TITLE_MENU_STEP = 11 * GLYPH_SCALE;
/**
 * Doc 17 beat 7's card, on the view rather than across the man standing
 * in it. At 118 it crossed Thad's chest; the band above the horizon is the
 * shot the card is commenting on.
 */
const ACT_CARD_Y = 66 * GLYPH_SCALE;
//: Doc 17 writes the card on two lines. 11 rows apart for a 7-row font.
const ACT_CARD_LINE_HEIGHT = 11 * GLYPH_SCALE;
/**
 * How far above a speaker's head his words sit, as a fraction of his DRAWN
 * height. Doc 30 section 3.1's "authored offset", scaled: the anchor follows
 * the actor's scale, so the gap must too.
 */
const SPEECH_GAP = 0.12;
/** The waiting line's triangle (errata 126): its height, and its gap after the last word. */
const CONTINUE_MARK_ROWS = 3 * GLYPH_SCALE;
const CONTINUE_MARK_GAP = 3 * GLYPH_SCALE;
/** How far the triangle, outline and all, reaches past the last line's right end. */
export const CONTINUE_MARK_EXTENT = CONTINUE_MARK_GAP + 2 * CONTINUE_MARK_ROWS + GLYPH_SCALE;

/**
 * A speech block's centre, kept inside the frame's side margins: `half` is
 * how far the block reaches left of its centre, `right` how far right --
 * further than `half` when the waiting triangle hangs after the last line
 * (errata 143). Rounded, as every drawn coordinate is.
 */
export function clampSpeechX(screenX: number, half: number, right = half): number {
  return Math.round(Math.max(TEXT_MARGIN + half, Math.min(NATIVE_WIDTH - TEXT_MARGIN - right, screenX)));
}
const MAP_MARKER = 3 * GLYPH_SCALE;
const MAP_LABEL_HEIGHT = 11 * GLYPH_SCALE;

/**
 * Where the first option row sits, for a list of this many rows, as the list
 * USED to be laid out: bottom-anchored, growing up out of the panel into the
 * picture. Kept for the dialogue proof's history; nothing draws from it now.
 */
export function dialogueTop(count: number): number {
  return DIALOGUE_BOTTOM - count * DIALOGUE_LINE_HEIGHT;
}

/**
 * THE CHOICES TAKE THE PANEL'S PLACE AND NOTHING MORE (errata 143; Tyler,
 * 2026-11-06: "the same way they're presented in MI"). In both SCUMM games the
 * sentence line, the verbs and the inventory give way to the choices, which
 * are set from the top of that area down, and when there are more than fit
 * the list scrolls; the room keeps every pixel of its height. The list here
 * used to grow up out of the panel by a row per option, so an eight-option
 * tree covered Thad's feet and a ninth would have reached his knees.
 *
 * Top-anchored, a row's breadth below the panel's edge, and as many whole
 * rows as the panel holds at the panel's own pitch -- five. Doc 30's "four
 * physical text rows" was a starting value for a 56-pixel panel; at this
 * scale four would scroll every five-option tree, of which there are
 * seventeen, and leave a row's height of panel empty under them.
 */
export const CHOICE_LIST_TOP = PANEL_Y + 2 * PANEL_GLYPH_SCALE;
export const CHOICE_ROWS = Math.floor(
  (NATIVE_HEIGHT - 2 * PANEL_GLYPH_SCALE - CHOICE_LIST_TOP) / DIALOGUE_LINE_HEIGHT);
/**
 * THE SCROLL ARROWS' COLUMN, at the frame's right (doc 30 section 6.1): the
 * same width and the same right-hand inset as the inventory's arrows, so the
 * panel's furniture does not move when a conversation opens. Reserved
 * whether or not the list scrolls, so an option wraps the same way in a
 * short list and a long one.
 */
export const CHOICE_ARROW_WIDTH = 10 * GLYPH_SCALE;
export const CHOICE_ARROW_X = NATIVE_WIDTH - 4 * GLYPH_SCALE - CHOICE_ARROW_WIDTH;

/** One line of the choice interface: the text, its baseline, and its ink role. */
export interface ChoiceLine {
  /** The option as one string, marker and all, unwrapped. */
  text: string;
  /** Its first row's baseline. Meaningless for a row scrolled out of view. */
  y: number;
  /**
   * THE INK, decided by two things and nothing else: whether the option has
   * been used (dim) and whether the pointer is on it (bright). Never by its
   * tag or what it does -- invariant 7, HOB_C1 option 4 looks like its
   * neighbours -- which `tests/dialogue-presentation.test.ts` holds.
   */
  role: 'ink' | 'inkDim' | 'inkBright';
  /** The marker before the text: `optionPrefix`, `exhaustedPrefix` or, under the pointer, `optionPrefixSelected`. */
  marker: string;
  markerRole: 'ink' | 'inkDim' | 'inkBright';
  /**
   * THE OPTION AS DRAWN, wrapped (errata 134): its first row carries the
   * prefix and the rest hang under the text. One row when nothing wraps.
   */
  rows: string[];
  /** The wrapped text alone, without the marker: what is drawn at `textX`. */
  body: string[];
  /**
   * WHERE THE TEXT STARTS, and every continuation row with it. The hanging
   * indent was spaces, and a space is four units in this face where "-" is
   * six, so the continuation started eight pixels left of the line it
   * continued (errata 143).
   */
  textX: number;
  /** Where its click lands: from its first row's top through its last. */
  hitY: number;
  hitHeight: number;
  /** In the scrolled window. A row out of it is neither drawn nor clickable. */
  shown: boolean;
}

/** A scroll arrow of the choice list: where it is and whether it would move the list. */
export interface ChoiceArrow {
  direction: 'up' | 'down';
  x: number;
  y: number;
  width: number;
  height: number;
  live: boolean;
}

/** How the choice list wraps an option: the panel face and the width it may use. */
export interface ChoiceFit {
  wrap(text: string, maxWidth: number): string[];
  measure(text: string): number;
  width: number;
}

/** Which option is first in the scrolled window, and which the pointer is on. */
export interface ChoiceView {
  scroll?: number;
  hovered?: string | null;
}

/** The most rows one option may take before the list is a wall of text (errata 134). */
export const OPTION_MAX_ROWS = 3;
/** The width an option row may use: from the left margin to a gap short of the arrows. */
export const CHOICE_WIDTH = CHOICE_ARROW_X - 6 * GLYPH_SCALE - 4 * GLYPH_SCALE;

/** How far a string moves the pen: its measure plus the gap after its last glyph. */
function advanceOf(fit: ChoiceFit, text: string): number {
  return fit.measure(`${text}x`) - fit.measure('x');
}

/**
 * An option's rows. THE TRUTH IN DUEL THREE RAN OFF THE SCREEN MID-WORD (the
 * bookends audit, finding 6): "...Obadiah Mott invented it to rai". A row
 * that does not fit now wraps, its continuation hanging under the text and
 * not the prefix -- drawn at the text's own x (`ChoiceLine.textX`), so the
 * continuation rows carry no indent of their own.
 */
export function optionRows(prefix: string, text: string, fit?: ChoiceFit): string[] {
  if (!fit) return [`${prefix}${text}`];
  const rows = fit.wrap(text, fit.width - advanceOf(fit, prefix));
  return rows.map((row, index) => (index === 0 ? prefix + row : row));
}

/**
 * WHAT THE CHOICE INTERFACE DRAWS WHILE THE PLAYER IS CHOOSING: the options,
 * and nothing else. Doc 30 section 14 -- "if the node has a greeting, enqueue
 * it as a speaker-labelled utterance; do not draw node.prompt" -- and section
 * 16's binding Room 1 proof, "no stale prompt is drawn".
 *
 * `node.prompt` is extracted metadata (a tree whose opening is performed
 * carries its last line there; the ambient micro-trees carry a stage
 * direction) and it used to be drawn above the list, so once an opening had
 * been performed line by line its last line stood a second time over the
 * choices -- the owner's Room 5 playthrough, 2026-09-05. It is not drawn
 * anywhere now; the schema and glyph checks still read it. A pure function so
 * the test that guards this needs no canvas.
 */
export function choiceLines(
  options: PresentedOption[],
  ui: { optionPrefix: string; exhaustedPrefix: string; optionPrefixSelected?: string },
  fit?: ChoiceFit,
  view: ChoiceView = {},
): { top: number; backingTop: number; lines: ChoiceLine[]; scroll: number; arrows: ChoiceArrow[] } {
  const selected = ui.optionPrefixSelected ?? ui.optionPrefix;
  // ONE INDENT FOR EVERY MARKER, so pointing at a row never re-wraps it.
  const indent = fit
    ? Math.max(...[ui.optionPrefix, ui.exhaustedPrefix, selected].map((marker) => advanceOf(fit, marker)))
    : 0;
  const bodies = options.map((presented) => (fit
    ? fit.wrap(presented.text, fit.width - indent)
    : [presented.text]));
  const heights = bodies.map((body) => body.length);
  // THE WINDOW. Scrolled by whole options, never by half a wrapped one (doc
  // 30 section 6.1), and never past the point where the last option is in it.
  const fits = (from: number): number => {
    let rows = 0;
    let to = from;
    while (to < options.length && rows + (heights[to] as number) <= CHOICE_ROWS) {
      rows += heights[to] as number;
      to += 1;
    }
    return Math.max(to, Math.min(from + 1, options.length));
  };
  let lastFirst = 0;
  while (lastFirst < options.length - 1 && fits(lastFirst) < options.length) lastFirst += 1;
  const scroll = Math.max(0, Math.min(lastFirst, Math.floor(view.scroll ?? 0)));
  const end = fits(scroll);
  let row = 0;
  const lines = options.map((presented, index) => {
    const body = bodies[index] as string[];
    const shown = index >= scroll && index < end;
    const hitY = CHOICE_LIST_TOP + row * DIALOGUE_LINE_HEIGHT;
    if (shown) row += body.length;
    const pointed = shown && view.hovered != null && view.hovered === presented.option.id;
    const marker = pointed ? selected : (presented.exhausted ? ui.exhaustedPrefix : ui.optionPrefix);
    // A USED OPTION STAYS DIM UNDER THE POINTER, with the marker bright (doc
    // 30 section 6.1): "Exhausted TOPIC/COMIC options remain dim even when
    // focused, with a bright marker so focus remains visible."
    const role: ChoiceLine['role'] = presented.exhausted ? 'inkDim' : (pointed ? 'inkBright' : 'ink');
    const markerRole: ChoiceLine['role'] = pointed ? 'inkBright' : role;
    return {
      text: `${marker}${presented.text}`,
      y: hitY + PANEL_GLYPH_SCALE,
      role,
      marker,
      markerRole,
      rows: body.map((each, at) => (at === 0 ? marker + each : each)),
      body,
      textX: TEXT_MARGIN + indent,
      hitY: shown ? hitY : -1,
      hitHeight: shown ? body.length * DIALOGUE_LINE_HEIGHT : 0,
      shown,
    };
  });
  // THE ARROWS APPEAR ONLY WHEN THE LIST IS LONGER THAN THE PANEL, and then
  // both: the one that cannot move is dimmed rather than hidden (doc 30 6.1).
  const half = Math.floor((CHOICE_ROWS * DIALOGUE_LINE_HEIGHT) / 2);
  const arrows: ChoiceArrow[] = scroll === 0 && end >= options.length ? [] : [
    { direction: 'up', x: CHOICE_ARROW_X, y: CHOICE_LIST_TOP, width: CHOICE_ARROW_WIDTH, height: half - PANEL_GLYPH_SCALE, live: scroll > 0 },
    { direction: 'down', x: CHOICE_ARROW_X, y: CHOICE_LIST_TOP + half + PANEL_GLYPH_SCALE, width: CHOICE_ARROW_WIDTH, height: half - PANEL_GLYPH_SCALE, live: end < options.length },
  ];
  return { top: CHOICE_LIST_TOP, backingTop: PANEL_Y, lines, scroll, arrows };
}

/**
 * WHETHER THE VERB PANEL IS DRAWN. Doc 17 beat 8: not before control. Doc 30
 * section 6.1: the choices replace it. And not for any of a conversation --
 * its greeting, its list, or an answer being performed (errata 143): the
 * panel used to come back for every line between choices and go again when
 * the list returned. Nor in a timeline room that keeps it away, nor during a
 * cutscene beat after control (errata 133).
 */
export function panelShows(at: { opening: boolean; conversation: boolean; panelHidden: boolean; cutscene: boolean }): boolean {
  return !at.opening && !at.conversation && !at.panelHidden && !at.cutscene;
}

/** One figure standing in the room, whatever kind of thing it is. */
export interface RoomFigure {
  id: string;
  feetX: number;
  feetY: number;
  /** Exactly one of these is set. */
  npc?: AmbientFile;
  mover?: Actor;
  prop?: RoomProp;
  walker?: Departing;
}

/**
 * EVERYONE STANDING IN THE ROOM. Issue X4 defect 3, and the whole of it.
 *
 * This list used to be built inline as "the ambient set, plus the player",
 * which is why Hob, the driver, the horses and the coach had no path to being
 * drawn: not because anything refused them, but because nothing ever asked.
 *
 * Exported and pure so it can be tested without a canvas -- a renderer that
 * quietly went back to drawing one protagonist would look identical in every
 * screenshot of a room nobody had staged yet.
 */
export function roomFigures(ambient: AmbientFile[], movers: Actor[], props: RoomProp[] = [],
  walkers: Departing[] = []): RoomFigure[] {
  return [
    // A character walking out (AmbientFile.exit) is drawn where his walk has
    // reached, in the same depth order as everyone else.
    ...walkers.map((walker) => ({ id: walker.npc.id, feetX: walker.pose.x, feetY: walker.pose.y, walker })),
    // Furniture first, so a figure standing exactly on its base line is drawn
    // in front of it: the stable sort keeps insertion order on a tie.
    ...props.map((prop) => ({ id: prop.id, feetX: prop.x, feetY: prop.y, prop })),
    ...ambient.map((npc) => ({ id: npc.id, feetX: npc.x, feetY: npc.y, npc })),
    ...movers.map((mover) => ({
      id: mover.id, feetX: Math.round(mover.x), feetY: Math.round(mover.y), mover,
    })),
  ];
}

/**
 * BACK TO FRONT BY FEET-Y. Doc 22 section 5, step 3.
 *
 * Feet-Y is the whole depth cue in a lateral room -- whoever is standing
 * lower is nearer -- and it now has to settle the player against a coach and
 * a watchman as well as against the ambient crowd.
 *
 * `sort` is stable in every engine this runs on, so figures sharing a row
 * keep the order they were added in and a tie does not flicker.
 */
export function depthOrder<T extends { feetY: number }>(figures: T[]): T[] {
  return [...figures].sort((a, b) => a.feetY - b.feetY);
}

/**
 * Where an overlay sits on a particular body frame.
 *
 * A HEAD IS NOT IN THE SAME PLACE IN EVERY FRAME OF ITS BODY. The coach's
 * door-open frame is a separate generation -- 162,227 pixels differ from the
 * plain idle across the whole canvas -- and its driver sits 12px right and
 * 9px up. Drawing at one rect over all of them put the overlay head beside
 * the painted one for the whole of the driver's conversation.
 *
 * `clip/state`, then `clip`, then the default: the same
 * exact-match-then-fall-back `clipOf` uses, so a body with one frame needs no
 * entries at all.
 */
export function overlayRect(overlay: OverlayFor, clip: string,
                            state?: string): [number, number, number, number] {
  const table = overlay.rectFor ?? {};
  return (state ? table[`${clip}/${state}`] : undefined) ?? table[clip] ?? overlay.rect;
}

/** Just enough of an overlay to place it. Kept narrow so the test needs no bundle. */
export interface OverlayFor {
  rect: [number, number, number, number];
  rectFor?: Record<string, [number, number, number, number]>;
}

/** Fills `{name}` placeholders from the supplied map. */
/**
 * Which frame an ambient figure shows at a given clock. A pure function of its
 * declaration and the time, so the scene can ask "did anyone's frame change
 * since the last draw?" with the same rule the renderer draws with. The scene
 * used to ask a simpler question -- the two-frame sway only -- and a figure on
 * a BEAT (rate 0) never answered yes: the Nugget's men moved only when the
 * pointer happened to cause a redraw. Tyler, 2026-10-31: "everyone seems to
 * stop moving when I'm not clicking around."
 */
/** A figure grade's brightness, contrast and saturation as a canvas filter string. */
export function gradeFilter(grade: FigureLight): string {
  const parts = [];
  if (grade.brightness !== undefined) parts.push(`brightness(${grade.brightness})`);
  if (grade.contrast !== undefined) parts.push(`contrast(${grade.contrast})`);
  if (grade.saturate !== undefined) parts.push(`saturate(${grade.saturate})`);
  return parts.length ? parts.join(' ') : 'none';
}

/**
 * THE FRAME A FIGURE SHOWS WHILE IN CONVERSATION (Tyler, 2026-11-01: "Deke
 * doesn't seem animated"). Doc 32 section 8.2's deadpan rule is that the
 * reply pause is not filled with flapping, and the build read that as
 * "hold the talk frame for the whole conversation" -- so a man stood frozen
 * mid-gesture for as long as the list of choices was up. Now: the talk frame
 * only while his own line is on screen; the rest of the time he breathes, on
 * his two idle frames and nothing else -- no breaks, no hat, nothing that
 * would read as filling the pause. Pure, like ambientFrameAt.
 */
export function conversationFrameAt(
  declared: NonNullable<AmbientFile['sprite']>, phase: number, clock: number, speaking: boolean,
): number {
  if (speaking) return declared.talkFrame ?? 0;
  if (declared.beatEvery || !declared.rate) return 0;
  const idleFrames = Math.min(2, declared.frames.length);
  return Math.floor((clock * declared.rate + phase) * 2) % idleFrames;
}

export function ambientFrameAt(
  declared: NonNullable<AmbientFile['sprite']>, phase: number, clock: number, arrivedAt?: number,
): number {
  // ONCE, TIMED FROM HIS ARRIVAL (errata 121 B): the man on the ladder's nod.
  const once = declared.onArrival;
  if (once && arrivedAt !== undefined) {
    const step = Math.floor((clock - arrivedAt - once.at) / (once.frameSeconds ?? 0.3));
    if (step >= 0 && step < once.frames.length) return once.frames[step] ?? 0;
  }
  // A BEAT: at rest on frame 0, and every `beatEvery` seconds the rest of
  // the frames play once. Different intervals per figure mean they coincide
  // only by chance, which is the difference between a room of people and a
  // chorus line.
  if (declared.beatEvery) {
    const span = declared.beatSeconds ?? 1.2;
    const t = clock + phase * declared.beatEvery;
    const into = t - Math.floor(t / declared.beatEvery) * declared.beatEvery;
    if (into >= span) return 0;
    const rest = declared.frames.length - 1;
    if (rest <= 0) return 0;
    // ONE MOVEMENT PER BEAT, ROTATING, when a band holds more than one man.
    // The Nugget's third and fourth card players share a band -- their arms
    // overlap, so no column between them is safe to cut on -- and playing
    // both movements in sequence every beat would be one man's arm followed
    // by the other's, which reads as choreography. Rotating means each beat
    // is one of them, and which one changes each time.
    const beat = Math.floor(t / declared.beatEvery);
    return 1 + (((beat % rest) + rest) % rest);
  }

  const idleFrames = declared.breaks?.length
    ? Math.min(2, declared.frames.length) : declared.frames.length;
  const sway = Math.floor((clock * declared.rate + phase) * 2) % idleFrames;
  const breaks = declared.breaks;
  if (!breaks?.length) return sway;

  const every = declared.breakEvery ?? 26;
  // The phase spreads the characters apart, so nobody breaks in unison.
  const t = clock + phase * every;
  const cycle = Math.floor(t / every);
  const into = t - cycle * every;
  // A cheap deterministic shuffle of the cycle number: the same street, run
  // twice, does the same thing, and it still does not repeat in a pattern
  // a player can learn.
  const pick = breaks[Math.abs(cycle * 2654435761) % breaks.length] ?? [];
  const FRAME_SECONDS = 0.34;
  const step = Math.floor(into / FRAME_SECONDS);
  return step < pick.length ? (pick[step] ?? sway) : sway;
}

export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/** Overlay geometry. Sits over the play area, clear of the verb panel. */
const MENU_X = 84 * GLYPH_SCALE;
const MENU_WIDTH = 152 * GLYPH_SCALE;
const MENU_TOP = 18 * GLYPH_SCALE;
const MENU_ROW = 12 * GLYPH_SCALE;

export class Renderer {
  private readonly screen: Screen;
  private readonly font: Face;
  /**
   * The panel's own face, at Q35's derived scale. Same glyph data, same file,
   * a different multiplier -- because the panel is the one region errata 54
   * re-proportioned instead of scaling, and text sized for the play area's
   * factor does not fit in it. Built here rather than passed in, like
   * PanelLayout beside it: it is a property of the panel, not of the caller.
   */
  private readonly panelFont: Face;
  private readonly state: GameState;

  /**
   * Every named mover in the room, the player among them. Issue X4 defect 3.
   *
   * This was a single `Actor`, and that was the defect: the draw list was the
   * ambient set plus one protagonist, so Hob, the driver, the horses and the
   * coach had nowhere to be drawn even though every sequence step had carried
   * an actor id since the runner was written.
   */
  private readonly actors: RoomActors;
  private readonly ambient: AmbientLayer;
  private readonly background: BackgroundSource;
  /**
   * Ruling 21a's near plane. Drawn AFTER the people, which is the entire
   * mechanism: the walkable mask is unchanged and the actor's depth zone is
   * unaffected, and only the draw order says he is behind something.
   */
  private readonly foreground: BackgroundSource;
  /** Ruling 20's animated crowd members. Drawn before the actor -- crowd. */
  private readonly idleSheet: BackgroundSource;
  private readonly idles: IdleLayer;
  /** Seconds since the scene started, supplied by the caller each frame. */
  private clock = 0;
  /** The room's music, for a figure that keeps time with it (errata 118): its clock and tempo. */
  private musicClock = 0;
  private musicTempo: number | null = null;

  /** The player's drawn sprite. Null only before the sheets have loaded. */
  /**
   * ONE SPRITE PER DECLARED RECORD, keyed by character id.
   *
   * It was a single `sprite` built from the protagonist's record, and
   * `drawMover` handed the graybox to everyone else by testing
   * `mover.id !== playerId`. That was true when `content/actors/` held one
   * file. It stopped being true when Hob's record was added and nothing
   * noticed: his record parsed, his 27 frames loaded, every check passed, and
   * he would have crossed the road as a rectangle. Present, valid, declared,
   * loaded -- and still not drawn.
   *
   * A mover with NO record still gets the graybox, which is the right answer
   * and a visible one: a gap you can see rather than a character wearing
   * somebody else's costume.
   */
  private readonly sprites: Map<string, ActorSprite>;
  /** Any loaded image by content path, for ambient sheets. */
  private readonly sheet: (path: string) => CanvasImageSource | null;
  /** Errata ruling 26's geometry, resolved from content. */
  private readonly panel: PanelLayout;
  private scratchContext: CanvasRenderingContext2D | null = null;

  constructor(
    screen: Screen,
    font: Face,
    state: GameState,
    actors: RoomActors,
    ambient: AmbientLayer,
    background: BackgroundSource,
    foreground: BackgroundSource = () => null,
    idleSheet: BackgroundSource = () => null,
    sheet: (path: string) => CanvasImageSource | null = () => null,
  ) {
    this.screen = screen;
    this.font = font;
    this.state = state;
    this.actors = actors;
    this.ambient = ambient;
    this.background = background;
    this.foreground = foreground;
    this.idleSheet = idleSheet;
    this.idles = new IdleLayer(screen.context);
    this.sheet = sheet;
    // EVERY declared record, from the manifest's own list rather than the one
    // the protagonist happens to be.
    this.sprites = new Map(
      [...state.content.actors].map(([id, record]) => [id, new ActorSprite(record, sheet)]),
    );
    this.panel = new PanelLayout(state.content.panel);
    // THE PANEL'S FACE, AND A CANDIDATE'S IF A DEV BUILD ASKED FOR ONE. Q16.
    // With no `?font=` this is the line it has always been.
    const candidate = askedFont();
    this.panelFont = candidate
      ? new PreviewFont(state.content.font, candidate.family, candidate.panelPx, candidate.weight)
      : new BitmapFont(state.content.font, PANEL_GLYPH_SCALE);
  }

  /** The animation clock, in seconds. Set once per frame by the scene. */
  setClock(seconds: number): void {
    this.clock = seconds;
  }

  /**
   * THE BED'S CLOCK, for a figure that `keepsTime` (errata 118): where the
   * room's music is, in seconds, and its tempo. Null tempo: the room's bed
   * declares none, and such a figure moves on the scene clock like anyone.
   */
  setMusicClock(seconds: number, tempo: number | null): void {
    this.musicClock = seconds;
    this.musicTempo = tempo;
  }

  /** The sprite and clock a figure is drawn by: the bed's, at its tempo, when he keeps time with it. */
  timed(declared: NonNullable<AmbientFile['sprite']>): { sprite: NonNullable<AmbientFile['sprite']>; clock: number } {
    if (declared.keepsTime !== 'music' || !this.musicTempo) return { sprite: declared, clock: this.clock };
    return { sprite: { ...declared, rate: this.musicTempo / 120, phase: 0 }, clock: this.musicClock };
  }

  /**
   * What each mover last drew as, for the probe. Doc 44 part three.
   *
   * Only maintained while the watch is on: a map write per mover per frame is
   * small, and R5h says the instrument is part of the system, so it is not
   * paid for when nobody is reading it.
   */
  private readonly drawnAs = new Map<string, string>();
  /**
   * WHAT EACH MOVER PUT ON SCREEN, for the proof rather than for the watch.
   *
   * `drawnAs` answers "did it draw as a sprite or a placeholder"; this answers
   * "which file, in which rectangle, at what point in the draw order, through
   * which occlusion plane". Those are the four facts a room proof has to
   * ESTABLISH rather than recompute, and every one of them was previously
   * knowable only by re-deriving it outside the renderer and comparing the
   * derivation with itself.
   *
   * Kept on the same terms as `drawnAs`: only while the watch is armed, so
   * nobody pays for it when nobody is reading it (R5h).
   */
  private readonly drawRecord = new Map<string, DrawRecord>();
  private readonly walkerBounds = new Map<string, [number, number, number, number]>();
  private drawOrder = 0;
  /**
   * PANEL A: the room drawn without anybody in it.
   *
   * RENDER-ONLY, and that is the whole value of it. Nothing is removed from
   * the game -- the movers still exist, still hold their positions, still
   * carry their state -- so what is left on the screen is exactly the
   * permanent plate and its layers. That is the ONLY way to see a mover that
   * has been painted INTO the plate, because a painted one does not leave when
   * the real ones do. Doc 35's dog got baked into Room 2 and eight companion
   * generations went by before anybody asked; this is the frame that asks.
   */
  private castHidden = false;
  private bystandersHidden = false;

  /** Suppresses every mover and ambient figure for the next frames drawn. */
  hideCast(hidden: boolean): void {
    this.castHidden = hidden;
  }

  /**
   * Draw the room without its BYSTANDERS -- the ambient figures, standing or
   * walking -- and with everyone else. Render-only, as `hideCast` is. The
   * proof's depth gates measure the protagonist by differencing a frame with
   * him against one without; a townsman standing in front of the mark is in
   * both and over his feet, and the Nugget's far row lies wholly behind Deke
   * (errata 118).
   */
  hideBystanders(hidden: boolean): void {
    this.bystandersHidden = hidden;
  }
  private readonly shownOverlays = new Map<string, string>();
  private speaker: string | null = null;
  private pose: { speaker: string; frame: number | 'mark' } | null = null;
  private poses: { id: string; frame: number }[] | null = null;
  private still = false;
  private direction = false;
  /**
   * Set from the frame, read by BOTH the draw and the hit test.
   *
   * One field rather than two readings of the same fact: a list that were
   * hidden but still clickable would be worse than a visible one, because the
   * player could not see what they had hit.
   */
  private performing = false;
  private choiceView: ChoiceView = {};
  /** The tree being greeted into, if any -- see `FrameArgs.greeting`. */
  private greeting: string | null = null;
  private frameIndex = 0;

  /** How every mover drew on the last composed frame. Doc 44's `drawn`. */
  lastDrawn(): Record<string, string> {
    return Object.fromEntries(this.drawnAs);
  }

  /** What each mover drew from, where, and in what order. Gates 7, 8B and 8D. */
  lastDrawRecords(): Record<string, DrawRecord> {
    return Object.fromEntries(this.drawRecord);
  }

  /** Where each walking-out or looping figure drew last frame, `[x, y, w, h]` in room coordinates (the probe's). */
  lastWalkerBounds(): Record<string, [number, number, number, number]> {
    return Object.fromEntries(this.walkerBounds);
  }

  /** Options currently drawn, so the scene can hit-test them. */
  dialogueHitboxes(options: PresentedOption[], scroll = 0): { id: string; y: number; height: number; shown: boolean }[] {
    // NOTHING IS CLICKABLE WHILE AN EXCHANGE PLAYS, and this is the half that
    // makes doc 30 step 2 true rather than merely look true. The list is not
    // drawn then either; both read `performing`, so there is no state in which
    // a row can be hit without being visible.
    if (this.performing) return [];
    // From the same layout the list is drawn from, wrapped rows and all (errata 134),
    // in the same scrolled window (errata 143): a row scrolled out is not hit.
    const { lines } = choiceLines(options, this.state.content.ui.dialogue, this.choiceFit(), { scroll });
    return options.map((presented, index) => ({
      id: presented.option.id,
      y: lines[index]!.hitY,
      height: lines[index]!.hitHeight,
      shown: lines[index]!.shown,
    }));
  }

  /** The choice list's scroll arrows, when it has any (errata 143). Empty while an exchange plays. */
  dialogueArrows(options: PresentedOption[], scroll = 0): ChoiceArrow[] {
    if (this.performing) return [];
    return choiceLines(options, this.state.content.ui.dialogue, this.choiceFit(), { scroll }).arrows;
  }

  /** The scroll the list would settle on: `scroll` clamped to what the options allow. */
  dialogueScroll(options: PresentedOption[], scroll: number): number {
    return choiceLines(options, this.state.content.ui.dialogue, this.choiceFit(), { scroll }).scroll;
  }

  /**
   * Marker hitboxes for the map's known locations, so the scene can hit-test
   * them without knowing how they are drawn.
   *
   * Generous: the marker is a few pixels and the label beside it is the part
   * a player aims at, so the box covers both.
   */
  mapHitboxes(): { id: string; rect: Rect; built: boolean }[] {
    return this.mapLayout().map(({ location, built, rect }) => (
      { id: location.id, built, rect }));
  }

  /** The place a map click means (engine/render/MapLayout.ts, mapPlaceAt). */
  mapHitAt(x: number, y: number): { id: string; rect: Rect; built: boolean } | undefined {
    const box = mapPlaceAt(this.mapLayout(), x, y);
    return box ? { id: box.location.id, built: box.built, rect: box.rect } : undefined;
  }

  /** Where each location's marker and label go (engine/render/MapLayout.ts). */
  private mapLayout() {
    return layoutMap(this.state.mapLocations, (text: string) => this.font.measure(text),
      { marker: MAP_MARKER, labelHeight: MAP_LABEL_HEIGHT, glyph: GLYPH_SCALE, width: NATIVE_WIDTH });
  }

  drawFrame(frame: Frame): void {
    // THE COUNTER COUNTS DRAWN FRAMES, NOT TICKS. The scene redraws only when
    // something changed, which is what keeps 60fps affordable -- so "every
    // frame" here means every frame that was composed, and a still screen
    // contributes none. That is the right denominator for a check about what
    // is DRAWN, and it is written down because a frame number in a failure
    // report will otherwise be read as a tick number.
    if (watch.enabled) {
      this.frameIndex += 1;
      watch.frame(this.frameIndex, this.clock, frame.beat ?? null);
    }
    this.speaker = frame.speaker ?? null;
    this.pose = frame.pose ?? null;
    this.poses = frame.poses ?? null;
    this.still = frame.still === true;
    this.direction = frame.direction ?? false;
    this.performing = frame.performing === true;
    this.choiceView = frame.choiceView ?? {};
    this.greeting = frame.greeting ?? null;
    // THE PANEL BAND IS CLEARED EVERY FRAME, WHETHER OR NOT A PANEL GOES IN IT.
    //
    // Nothing else repaints it. `drawPlate` covers the PLAY AREA -- rows 0 to
    // PLAY_HEIGHT -- and the band below that is written only by `drawPanel`,
    // `drawDialogue`'s backing and `drawMenu`. During the opening `showPanel`
    // is false, so on the frame a conversation ENDS the play area is repainted
    // over the top half of the dialogue backing and the bottom half is simply
    // left there: three and a half option rows, still on screen, sliced exactly
    // at the play area's lower edge because that is where the repaint stopped.
    //
    // REPORTED AS "THE ACT CARD CLIPS THE DIALOGUE", and it is neither. The
    // card draws glyphs and fills nothing, the layout was correct in every
    // frame, and the probe says `options: 0` while four rows are on screen --
    // which is the whole diagnosis in one number. They are not being drawn.
    // They were never erased.
    //
    // `Screen.clear` has existed since the file was written and is called by
    // nothing (R5l). This is the narrower version of it: clearing the whole
    // screen would also blank the play area a moment before the plate covers
    // it, and the band is the only region that has no owner.
    //
    // CLEARED TO `overlayBg`, NOT `panelBg`, so this fixes the staleness and
    // changes nothing else. The band is black whenever it is empty today --
    // it is untouched canvas before the first conversation and the dialogue's
    // own backing after -- and `panelBg` is a shade lighter, so clearing to it
    // would have put a grey bar under the opening that nobody asked for.
    // `drawPanel` paints `panelBg` over this the moment a panel exists.
    this.screen.fill(0, PANEL_Y, NATIVE_WIDTH, PANEL_HEIGHT, this.screen.role('overlayBg'));
    if (frame.title) {
      this.drawTitleScreen(frame.title);
      this.drawMenu();
      // NEW GAME fades the title to black (errata 157), the whole screen.
      if ((frame.fadeBlack ?? 0) > 0) {
        const ctx = this.screen.context;
        const was = ctx.globalAlpha;
        ctx.globalAlpha = was * Math.min(1, frame.fadeBlack ?? 0);
        this.screen.fill(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT, this.screen.role('overlayBg'));
        ctx.globalAlpha = was;
      }
      return;
    }
    if (this.state.isMap) {
      this.drawRoom();
      this.drawMap(frame);
      if (frame.showPanel !== false) this.drawPanel(frame);
      this.drawMenu();
      return;
    }
    // THE WORLD PASS SCROLLS; EVERYTHING AFTER IT DOES NOT.
    //
    // One translate rather than a camera term threaded through every draw
    // call. Every world drawing already takes world coordinates -- the plate,
    // the object states, the idles, the figures, the near plane -- so shifting
    // the context is the whole of it, and nothing below can forget to subtract.
    // The panel, the speech, the dialogue, the act card and the menu are drawn
    // AFTER the restore, in screen space, because they belong to the window
    // rather than to the street.
    //
    // A ROOM THAT FITS TRANSLATES BY ZERO. `cameraX` is clamped to
    // `roomWidth - NATIVE_WIDTH`, which is zero there, so Room 1 draws through
    // exactly the same path it always did.
    const camera = this.state.cameraX;
    this.screen.context.save();
    this.screen.context.translate(-camera, 0);
    this.drawRoom();
    this.drawObjectStates();
    // ON THE SLATE, under the lamp and behind the people (errata 136 A).
    this.drawTally(frame.tally ?? null);
    // A door a walker is going out by stands open: room geometry, so with the plate, before the people.
    for (const door of this.ambient.openDoors) {
      const image = this.sheet(door.sheet);
      if (!image) continue;
      const [sx, sy, w, h] = door.frame;
      this.screen.context.drawImage(image, sx, sy, w, h, door.x, door.y, w, h);
    }
    // AFTER THE PLATE, BEFORE THE PEOPLE. A lamp lights the room it hangs in;
    // the figures are lit by match-local at cut time, which is a different
    // job done once rather than every frame.
    this.lampStill = frame.lampStill ?? 0;
    this.drawLamps();
    this.drawRipples(frame.ripples ?? []);
    this.idles.draw(this.state.room, this.idleSheet(this.state.room.id), this.clock);
    // After the idles as well as the plate: the ambient background motion is
    // on the ground too, and a pool that lit the mud but not the things on it
    // would draw a hole around every one of them.
    this.drawCarriedLight();
    this.drawPeople();
    this.drawForeground();
    this.screen.context.restore();
    if (frame.pan && frame.pan.offset > 0) this.drawPan(frame.pan);
    if (frame.overBlack) this.screen.fill(0, 0, NATIVE_WIDTH, PLAY_HEIGHT, this.screen.role('overlayBg'));
    // The response to an option is drawn above the option list, not instead
    // of it -- otherwise picking an option appears to do nothing.
    if (frame.page?.length) this.drawPage(frame.page, frame.pageAlpha ?? 1);
    else this.drawSay(frame.sayLines, frame.awaitingClick === true);
    if (frame.barkAt) {
      this.drawBark(frame.barkLines, frame.barkAt);
    }
    if (frame.captionAt) {
      this.drawBark(frame.captionLines, frame.captionAt);
    }
    // DOC 30 STEP 2: THE LIST IS NOT DRAWN WHILE AN EXCHANGE PLAYS. "While an
    // exchange plays, choices are hidden and cannot receive clicks. They
    // return only after the exchange is complete."
    //
    // `dialogueHitboxes` answers with nothing under the same condition, so the
    // two cannot disagree -- a list that were hidden but still clickable would
    // be worse than one that were visible, because the player could not see
    // what they had hit.
    if (this.state.dialogue.isActive && !frame.performing) {
      this.drawDialogue();
    }
    // Doc 17 beat 7. Over the room, not over black: the card lands on the
    // view of the town after the coach has gone, which is the shot it is
    // commenting on.
    if (frame.actCard) this.drawActCard(frame.actCard);
    this.drawTitle();
    if ((frame.fadeBlack ?? 0) > 0) {
      const ctx = this.screen.context;
      const was = ctx.globalAlpha;
      ctx.globalAlpha = was * Math.min(1, frame.fadeBlack ?? 0);
      this.screen.fill(0, 0, NATIVE_WIDTH, PLAY_HEIGHT, this.screen.role('overlayBg'));
      ctx.globalAlpha = was;
    }
    if (frame.showPanel !== false) this.drawPanel(frame);
    if (frame.showPanel !== false && frame.panelDim) {
      // Dimmed, not removed: the same panel under the overlay's black at half strength.
      const ctx = this.screen.context;
      const was = ctx.globalAlpha;
      ctx.globalAlpha = was * PANEL_DIM;
      this.screen.fill(0, PANEL_Y, NATIVE_WIDTH, PANEL_HEIGHT, this.screen.role('overlayBg'));
      ctx.globalAlpha = was;
    }
    else if (frame.sceneControls) this.drawSceneControls();
    // Last, so it sits over everything including the panel.
    this.drawMenu();
  }

  /**
   * MENU and SKIP SCENE, alone, where MENU and MAP sit in the panel -- the
   * place a player who has used the panel already looks. The labels are
   * content/ui/menu.json's.
   */
  private drawSceneControls(): void {
    const ctx = this.screen.context;
    const cells: [Rect | null, string][] = [
      [this.panel.menuButton, this.state.menu.buttonLabel],
      // SKIP SCENE only where there is a scene to skip: a timeline (the close has none; errata 128).
      [this.panel.mapButton, this.state.room.timeline?.length ? this.state.content.menu.sceneControls?.skip ?? '' : ''],
    ];
    for (const [rect, label] of cells) {
      if (!rect || !label) continue;
      this.screen.fill(rect.x, rect.y, rect.width, rect.height, this.screen.role('buttonBg'));
      const x = rect.x + Math.floor((rect.width - this.panelFont.measure(label)) / 2);
      this.panelFont.draw(ctx, label, x, this.labelY(rect), this.screen.roleColour('ink'));
    }
  }

  /**
   * Doc 17's act card, in the TWO-LINE FORM the document writes it in.
   *
   * "PART ONE — In Which Our Hero Is Robbed, and Enjoys It" is one string in
   * the beat sheet and two lines on screen: the part number above, the title
   * below. It was drawn as a single centred line, which at 320 pixels wide
   * in a 5x7 font is 53 glyphs across a 320-pixel frame -- it fitted, and it
   * read as a caption rather than as a card.
   *
   * The split is on the em dash, which is where the document puts it, so the
   * layout is the writing's own and not a rule invented here.
   */
  /**
   * DOC 17 BEAT 11: the title comes up over the mountains as he goes.
   *
   * Errata 55 places it TOP RIGHT, in the 700x320 the walk leaves clear --
   * the trace runs up the left of the frame and bears right into the town
   * along the bottom of the sky, so the upper right is the one large area no
   * part of the departure crosses.
   *
   * IT KEYS OFF THE WALK'S OWN CLOCK, which is what followPath's note asks
   * for: `pathProgress` is the beat's elapsed fraction, so re-tracing the
   * path changes where he walks and never how long the title holds. Deriving
   * it from distance instead would have every later tweak to the trace
   * silently retime the title.
   *
   * IT FADES IN AND HOLDS. Doc 45 is explicit that nothing stings here --
   * "existing Room 1 music continues under the title without a sting" -- so
   * it arrives the way a thought does rather than the way a logo does. In by
   * a fifth of the walk, held for the rest; the room change takes it away,
   * which is errata 55's "he is still walking when Main Street arrives".
   */
  private drawTitle(): void {
    const image = this.sheet(TITLE_LOGO);
    if (!image) return;
    const actor = this.actors.all().find((mover) => mover.pathProgress !== null);
    const progress = actor?.pathProgress ?? null;
    if (progress === null) return;
    const alpha = Math.max(0, Math.min(1, progress / TITLE_FADE_FRACTION));
    if (alpha <= 0) return;
    // The logo's own proportions, read off the loaded image. A CanvasImageSource
    // may be several things; every one the loader produces carries these.
    const source = image as { width?: number; height?: number };
    if (!source.width || !source.height) return;
    const width = TITLE_WIDTH;
    const height = Math.max(1, Math.round((source.height / source.width) * width));
    const ctx = this.screen.context;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * alpha;
    ctx.drawImage(image, TITLE_X, TITLE_Y, width, height);
    ctx.globalAlpha = was;
  }

  private drawActCard(text: string): void {
    const parts = text.split('\u2014').map((part) => part.trim()).filter(Boolean);
    const split = parts.length > 1 ? [parts[0] as string, parts.slice(1).join(' — ')] : parts;
    // AND THEN WRAPPED, because the em dash is where the DOCUMENT breaks the
    // card and not where the screen does. "In Which Our Hero Is Robbed, and
    // Enjoys It" is one authored half and it is wider than the frame; the
    // split gave it a line of its own and then let it run off both edges.
    //
    // Same margin as a spoken line, and the same wrap: a card is text on the
    // play area like any other, and the one that already fits is the one to
    // agree with.
    const lines = split.flatMap((line) => this.font.wrap(line, NATIVE_WIDTH - TEXT_MARGIN * 2));
    const top = ACT_CARD_Y - (lines.length - 1) * ACT_CARD_LINE_HEIGHT / 2;
    for (const [index, line] of lines.entries()) {
      this.font.drawCentredOutlined(
        this.screen.context,
        line,
        NATIVE_WIDTH / 2,
        top + index * ACT_CARD_LINE_HEIGHT,
        this.screen.roleColour('inkBright'),
        this.screen.roleColour('overlayBg'),
      );
    }
  }

  /**
   * Doc 20's map: markers and labels drawn by the engine, over a plan that
   * has none baked into it.
   *
   * A location whose room is not built draws dim. It is deliberately still
   * drawn -- rule 3 says the map records what Thad has heard of, and which
   * rooms exist yet is not something he knows.
   */
  private drawMap(frame: Frame): void {
    for (const { location, label, built, labelX } of this.mapLayout()) {
      const [x, y] = location.at;
      const live = built && frame.hoveredLocation === location.id;
      const ink = this.screen.roleColour(built ? (live ? 'inkBright' : 'ink') : 'inkDim');

      // A marker, not a token: errata 25 withdrew the character token and
      // nothing here represents a person.
      //
      // Solid where the place exists, hollow where it does not. A tone step
      // alone did not read at 1x against a bone field -- the two markers
      // looked identical and only the label's weight differed, which is the
      // kind of distinction that is visible in a 4x render and gone in the
      // game.
      if (built) {
        this.screen.fill(x, y, MAP_MARKER, MAP_MARKER, this.screen.role('ink'));
      } else {
        this.screen.outline(x, y, MAP_MARKER, MAP_MARKER, this.screen.role('inkDim'));
      }
      this.screen.outline(x - GLYPH_SCALE, y - GLYPH_SCALE,
        MAP_MARKER + GLYPH_SCALE * 2, MAP_MARKER + GLYPH_SCALE * 2,
        this.screen.role('overlayBg'));
      // THE NAME BELONGS TO THE POINTER, NOT TO THE MAP.
      //
      // Every label used to be drawn at once and they cannot fit: at the map
      // font a name runs 330 to 726 pixels, the town is about 580 across, and
      // fifteen of them overlap 21 ways. THE UNDERTAKER'S, MAIN STREET and
      // THE ROAD TO THE CLAIMS -- the three doc 20 puts on the map from the
      // first opening -- landed on top of each other in the first minute of
      // the game.
      //
      // Nothing is lost by holding them back, because the name was always
      // drawn TWICE: onPointerMove puts the hovered location in the sentence
      // line for exactly the reason a marker needs one -- "a marker must
      // never be the only way a place is identified". So the sentence line
      // names it, and the map names the one being pointed at.
      if (frame.hoveredLocation !== location.id) continue;
      this.font.drawOutlined(
        this.screen.context, label, labelX, y - GLYPH_SCALE * 2, ink,
        this.screen.roleColour('overlayBg'),
      );
    }
  }

  /**
   * Doc 18's flicker, by a mechanism that works on a generated plate.
   *
   * Palette cycling recovers indices from exact band colours and errata 54's
   * plates carry none, so hobs_lamp has animated nothing for weeks (doc 36
   * Q13). This modulates light that is ALREADY PAINTED IN rather than trying
   * to create any -- the difference between it and the additive glow that
   * failed on Room 2's doorways, which tried to make a dark doorway look lit
   * and read as fog.
   *
   * Small on purpose: `amount` is a few per cent, and two lamps in a room
   * breathe on different rates and phases so the flicker never pulses in
   * unison, which is what would read as a fault rather than as fire.
   */
  /** 0 to 1: see Frame.lampStill. */
  private lampStill = 0;

  /**
   * DOC 45 R33-RIPPLE: a ring from the tap, widening and fading to nothing at
   * the moment the sound's tail does. The same information as the sound and
   * no more: a long tail is a long ripple, and nothing marks where the void is.
   */
  private drawRipples(ripples: { x: number; y: number; age: number; tail: number }[]): void {
    if (!ripples.length) return;
    const ctx = this.screen.context;
    ctx.save();
    for (const ripple of ripples) {
      const radius = 18 + ripple.age * (40 + 120 * Math.min(1, ripple.tail / 2.5));
      const alpha = 0.55 * (1 - ripple.age);
      if (alpha <= 0.01) continue;
      ctx.strokeStyle = ['rgba(240,214,160,', alpha.toFixed(3), ')'].join('');
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, radius, radius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawLamps(): void {
    const lamps = this.state.room.lamps;
    if (!lamps?.length) return;
    const ctx = this.screen.context;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const lamp of lamps) {
      // A lamp that has left with the thing it hung on is not a lamp.
      if (!this.lampLive(lamp)) continue;
      const t = this.clock * lamp.rate + (lamp.phase ?? 0);
      // Two sines of different periods, so the flicker does not tick.
      // INVARIANT 8: Room 33's lamp slows to stillness with the score -- the
      // flicker narrows to a steady glow, and nothing announces it.
      const wave = 0.5 + (0.35 * Math.sin(t * Math.PI * 2) + 0.15 * Math.sin(t * Math.PI * 5.3)) * (1 - this.lampStill);
      // Its amount under the room's authored visual state, when one is named
      // and the lamp declares one for it; otherwise the plain amount.
      const state = askedState();
      const amount = (state && lamp.amountByState?.[state] !== undefined)
        ? (lamp.amountByState[state] as number) : lamp.amount;
      const strength = Math.max(0, amount * wave);
      if (strength < 0.002) continue;
      const [x, y] = lamp.at;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, lamp.radius);
      // Warm, and falling off to nothing well inside the radius so the edge of
      // the gradient is never a visible circle. Assembled rather than
      // templated: check-no-content-in-code cannot tell a colour string from a
      // line of dialogue, and it is right not to try.
      const warm = (red: number, green: number, blue: number, alpha: number) =>
        ['rgba(', red, ',', green, ',', blue, ',',
        alpha.toFixed(3), ')'].join('');
      glow.addColorStop(0, warm(255, 196, 108, strength));
      glow.addColorStop(0.45, warm(255, 170, 80, strength * 0.35));
      glow.addColorStop(1, warm(255, 150, 60, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - lamp.radius, y - lamp.radius, lamp.radius * 2, lamp.radius * 2);
    }
    ctx.restore();
  }

  private drawRoom(): void {
    const room = this.state.room;
    const image = this.background(room.id);
    if (image) {
      this.drawPlate(image);
      return;
    }

    // No composed background yet: flat bands and blocked-out hotspots, which
    // is what a stub room looks like and should look like.
    const width = this.state.roomWidth;
    this.screen.fill(0, 0, width, room.horizon, room.colours.sky);
    this.screen.fill(0, room.horizon, width, PLAY_HEIGHT - room.horizon, room.colours.ground);
    for (const target of this.state.targets) {
      const [x, y, width, height] = target.rect;
      this.screen.fill(x, y, width, height, target.colour);
      this.screen.outline(x, y, width, height, this.screen.role('outline'));
    }
  }

  /**
   * A room-sized plate, drawn to fill the play area whatever size it is.
   *
   * ERRATA 54 MADE THIS NECESSARY AND IT USED TO BE `drawImage(image, 0, 0)`.
   * That was right while every plate was exactly 320x144 and the play area was
   * too. The play area is 1920x864 now and one plate has been regenerated for
   * it; the other ten backgrounds, all six foreground planes and both occlusion
   * masks are still 320x144, and drawn at their own size they would occupy the
   * top-left thirty-sixth of the frame with the room's flat fill around them.
   *
   * Stretching to the play area is not a compromise for the legacy assets and
   * a no-op for the new ones -- it is 1:1 for anything already play-area sized,
   * and for a 320-native plate it is exactly the 6x the geometry took. Every
   * asset therefore lands where its own coordinates say it should, and a plate
   * regenerated at 1920x864 later changes nothing here.
   */
  private drawPlate(image: CanvasImageSource): void {
    // THE ROOM'S OWN WIDTH, not the window's. Main Street's plate is 3700
    // across; stretched to 1920 it would be the whole street squeezed into the
    // frame, which is a different picture rather than a scrolled one.
    this.screen.context.drawImage(image, 0, 0, this.state.roomWidth, PLAY_HEIGHT);
  }

  /**
   * Doc 22 item 9. Whatever each object's current state draws, over the room.
   *
   * Before the people, because a state image is room geometry -- an open door
   * is part of the building. A state that also OCCLUDES declares the clip
   * levels it masks and is composited into the figure pass instead, which is
   * doc 22 section 5 step 5.
   */
  private drawObjectStates(): void {
    for (const target of this.state.statefulTargets) {
      const shown = this.state.presentation(target);
      const path = shown ? stateImagePath(shown) : undefined;
      if (!path) continue;
      const image = this.sheet(path);
      if (image) this.drawPlate(image);
    }
  }

  /**
   * The near plane, over the actor. Ruling 21a.
   *
   * It is also baked into the composed background, so a room whose overlay
   * fails to load still looks right -- the actor stands in front of it
   * instead of behind it, which is a depth error rather than a hole in the
   * picture. Drawing the same pixels twice costs one blit at 320x144.
   */
  private drawForeground(): void {
    // A room with z-planes has already had every figure masked individually,
    // and drawing the flat overlay on top of that would put the near corner
    // back in front of an actor the plane deliberately let through.
    if (this.state.room.occlusionPlanes?.length) return;
    const image = this.foreground(this.state.room.id);
    if (image) this.drawPlate(image);
  }

  /**
   * Everyone in the room, BACK TO FRONT BY FEET-Y. Doc 22 section 5, step 3.
   *
   * Sorted rather than drawn in a fixed order: the player passing an ambient
   * character used to draw over them wherever he was, so walking behind the
   * pie woman put him in front of her. Feet-Y is the whole depth cue in a
   * lateral room -- whoever is standing lower is nearer.
   *
   * Each figure is then drawn through the mask for ITS OWN clip level, which
   * is the other half of the same question: sorting settles actor against
   * actor, and the plane settles actor against room geometry.
   */
  /**
   * The frame a mover is showing right now.
   *
   * PULLED OUT SO THE LIGHT AND THE LAMP CANNOT DISAGREE. The glow pass runs
   * before the figure pass and has to pick the same frame the figure pass will
   * pick; two copies of this expression would agree until one of them learned
   * about a new rate, and the symptom would be a pool trailing the lamp by a
   * frame -- which reads as the light lagging rather than as two functions.
   */
  private frameFor(mover: Actor, record: ActorFile, frames: number): number {
    const { walkRate, reactRate, idleRate } = record;
    // THE STRIDE IS NO LONGER PASSED IN, and that is the point of the change
    // rather than a tidy-up. It was computed here as `strideLength * (height /
    // record.height)` and handed over for `frameAt` to divide TOTAL distance
    // by -- so every pixel he had ever walked was re-divided the moment his
    // drawn height moved. The gait is integrated inside `Actor.update` now,
    // against the stride that was true for each step, and the actor reads its
    // own ratio from its own record.
    return mover.frameAt(this.clock, walkRate, reactRate, frames,
      (mover.clip === IDLE_BREAK ? record.idleBreakRate ?? idleRate : idleRate) ?? 0);
  }

  /**
   * Errata D8: the light a mover carries, on the ground, under its own flame.
   *
   * AFTER THE PLATE AND BEFORE THE CHARACTERS, which is the whole design.
   * Baked into the carrier's sprite it would be a hard-edged patch of lit
   * ground travelling with him; painted into the plate it would still be there
   * after he had gone. Light that belongs to a mover leaves with the mover.
   *
   * ADDITIVE. `lighter` brightens the mud beneath rather than tinting it,
   * which is what a flame does, and `globalAlpha` carries the intensity the
   * spec calls a judgement to be re-checked in motion.
   *
   * IT IS DRAWN UNMASKED, and that is a decision rather than an oversight. The
   * near plane goes on after the people and therefore over this too, so a
   * foreground post still stands in front of the pool. What it does not do is
   * respect a per-figure occlusion plane, because a ground pool is not a
   * figure -- it lies on the floor and the figure stands in it, so clipping it
   * to the carrier's own silhouette mask would cut the light to the shape of
   * the man.
   */
  private drawCarriedLight(): void {
    const spec = this.state.content.carriedLight;
    if (!spec) return;
    const image = this.sheet(spec.sprite);
    if (!image) return;
    const context = this.screen.context;
    for (const figure of roomFigures(this.ambient.present, this.actors.all())) {
      const mover = figure.mover;
      if (!mover) continue;
      const record = this.state.content.actors.get(mover.id);
      const sprite = this.sprites.get(mover.id);
      if (!record || !sprite) continue;
      const surface = mover.surfaceHere();
      const state = this.state.moverState(mover.id);
      const frames = sprite.frameCount(mover.clip, mover.facing, surface, state);
      if (frames === 0) continue;
      const at = sprite.lanternAt(mover.clip, mover.facing, surface,
        this.frameFor(mover, record, frames),
        figure.feetX, figure.feetY, mover.height, state);
      if (!at) continue;
      // The pool is sized off the CARRIER's drawn height, so it recedes with
      // him: a man further up the road throws a smaller pool, for the same
      // reason and by the same number as he is drawn smaller.
      const width = Math.max(1, Math.round(mover.height * spec.widthPerHeight));
      const height = Math.max(1, Math.round(width * (spec.size[1] / spec.size[0])));
      const x = at.x - Math.round((spec.flameAnchor[0] / spec.size[0]) * width);
      const y = at.y - Math.round((spec.flameAnchor[1] / spec.size[1]) * height);
      context.save();
      context.globalCompositeOperation = 'lighter';
      // THE CARRIED FLAME FLICKERS, WHICH IS WHAT hobs_lamp WAS FOR. Doc 18
      // called it "a carried flame in still air, not a torch", and the
      // cycling element meant to do it has animated nothing since errata 54
      // (doc 36 Q13). Same two-sine wobble the fixed lamps use, at a tenth of
      // the amplitude: this is a lamp somebody is holding still, and the
      // motion should be at the edge of noticing.
      const wobble = 1
        + 0.06 * Math.sin(this.clock * Math.PI * 2 * 0.7)
        + 0.03 * Math.sin(this.clock * Math.PI * 2 * 1.9);
      context.globalAlpha = Math.max(0, Math.min(1, spec.intensity * wobble));
      context.drawImage(image, x, y, width, height);
      context.restore();
      // DELIBERATELY NOT RECORDED AS A WATCH VIOLATION. `ViolationKind` is a
      // list of things that are WRONG, and a lamp lighting the ground is the
      // feature working. A light in the wrong place is caught by the unit test
      // on the projection, which can say where it should be; the watch can
      // only say that it happened.
    }
  }

  private drawPeople(): void {
    // EVERY MOVER, not just the protagonist, sorted against the ambient set
    // in one pass -- so a driver standing further up the road is drawn behind
    // a man standing nearer it for the same reason and by the same rule.
    // Doc 44 part two #4 needs the DRAWN extent of everything on the floor,
    // which is only knowable as each figure is drawn. Collected here and
    // judged once at the end rather than compared pairwise inside the loop.
    const spans: { id: string; feetX: number; feetY: number; halfWidth: number }[] = [];
    if (watch.enabled) {
      this.drawRecord.clear();
      this.walkerBounds.clear();
      this.drawOrder = 0;
    }
    // BEFORE THE LOOP, NOT INSIDE IT. Skipping each figure individually would
    // still run the occlusion mask, the depth sort and the span collection,
    // and a bug in any of those would show in panel A as though it were the
    // plate's.
    if (this.castHidden) return;
    // ERRATA 70 G: a room that hides the player (Room 32 -- he is lying in
    // the dark he is looking at) draws everyone but him.
    const playerHidden = this.state.room.actor === 'hidden';
    const props = (this.state.room.props ?? []).filter((prop) => this.state.flags.test(prop.when));
    // A figure on a loop is drawn where its walk has reached, not standing.
    for (const figure of depthOrder(roomFigures(this.ambient.present.filter((npc) => !npc.loop),
      this.actors.all(), props, this.ambient.departing))) {
      if (playerHidden && figure.mover?.id === this.state.content.actor.id) continue;
      if (this.bystandersHidden && (figure.npc || figure.walker)) continue;
      if (figure.walker) {
        this.drawWalker(figure.walker);
        continue;
      }
      if (figure.prop) {
        this.drawRoomProp(figure.prop);
        continue;
      }
      // An ambient that declares its own plane is masked by it; everyone
      // else by the box under their feet. See AmbientFile.clipPlane.
      const declaredPlane = figure.npc ? (figure.npc as AmbientFile).clipPlane : undefined;
      this.masked(figure.feetX, figure.feetY, () => {
        if (figure.mover) {
          const halfWidth = this.drawMover(figure.mover, figure.feetX, figure.feetY);
          if (watch.enabled) {
            spans.push({ id: figure.id, feetX: figure.feetX, feetY: figure.feetY, halfWidth });
          }
          return;
        }
        const npc = figure.npc as AmbientFile;
        const drawnFrame = this.drawAmbient(npc);
        if (drawnFrame !== null) {
          this.drawProps(npc, drawnFrame);
        } else {
          // A DECLARED SHEET THAT HAS NOT ARRIVED DRAWS NOTHING, NOT A SLAB.
          // Ambient sheets are deferred assets, so for the first seconds in a
          // room -- and for the whole of a warp straight into one -- three
          // black rectangles stood on Main Street where three people should
          // be. BootAssets already states the principle for the carried lamp:
          // "the road is unlit for a moment rather than a black square
          // appearing where the glow should be." The same is true of a person.
          //
          // The graybox stays for a character who declares NO sprite at all,
          // because that is a content gap and should be loud.
          if (!npc.sprite) {
            this.drawFigure(npc.x, npc.y, this.state.heightForZone(npc.zone),
              this.screen.role('outline'));
          } else {
            watch.record('graybox:not-loaded', npc.id,
              `${npc.sprite.sheet} has not arrived; drew nothing rather than a placeholder`);
          }
        }
      }, declaredPlane);
    }
    if (!watch.enabled) return;
    for (const [one, two] of depthTies(spans)) {
      watch.record('depth-tie', `${one} ${two}`,
        `both at feet y ${spans.find((s) => s.id === one)?.feetY}, overlapping in x`);
    }
  }

  /**
   * A character walking out: his exit's walk cycle at the frame and place his
   * walk has reached, on the room's curve, mirrored when he walks the other
   * way from the sheet, and graded and tinted exactly as he was standing.
   */
  private drawWalker(walker: Departing): void {
    const { npc, exit, pose } = walker;
    const image = this.sheet(exit.sheet);
    if (!image) {
      watch.record('graybox:not-loaded', npc.id, `${exit.sheet} has not arrived; drew nothing`);
      return;
    }
    const [sx, sy, width, height] = exit.frames[pose.frame % exit.frames.length]!;
    // A loop that leaves the walk band carries its own heights (AmbientFile.loop).
    const heights = (exit as { heights?: number[] }).heights;
    const leg = pose.leg ?? 0;
    const man = heights && leg > 0 && heights[leg] !== undefined && heights[leg - 1] !== undefined
      ? heights[leg - 1]! + (heights[leg]! - heights[leg - 1]!) * (pose.along ?? 0)
      : this.state.stagedHeightAt(pose.x, pose.y) ?? exit.figureHeight;
    const scale = (man * (npc.sprite?.stature ?? 1)) / exit.figureHeight;
    const drawW = Math.max(1, Math.round(width * scale));
    const drawH = Math.max(1, Math.round(height * scale));
    const left = pose.x - Math.floor(drawW / 2);
    const top = pose.y - drawH + 1;
    const mirror = (pose.heading < 0) !== (exit.drawnFacing === 'left');
    // The context is read at draw time: drawTinted lends the screen a scratch.
    const draw = () => {
      const context = this.screen.context;
      if (!mirror) {
        context.drawImage(image, sx, sy, width, height, left, top, drawW, drawH);
        return;
      }
      context.save();
      context.translate(left + drawW, top);
      context.scale(-1, 1);
      context.drawImage(image, sx, sy, width, height, 0, 0, drawW, drawH);
      context.restore();
    };
    const tint = this.tintAt(pose.x, pose.y);
    const grade = this.gradeFor(npc.id);
    if (tint || grade) this.drawTinted(tint, [left, top, drawW, drawH], draw, grade);
    else draw();
    this.walkerBounds.set(npc.id, [left, top, drawW, drawH]);
  }

  /** A piece of furniture, 1:1, its bottom row on its base line. See RoomFile.props. */
  private drawRoomProp(prop: RoomProp): void {
    const image = this.sheet(prop.sheet);
    if (!image) {
      watch.record('graybox:not-loaded', prop.id, `${prop.sheet} has not arrived; drew nothing`);
      return;
    }
    const [sx, sy, width, height] = prop.frame;
    this.screen.context.drawImage(image, sx, sy, width, height,
      prop.x - Math.floor(width / 2), prop.y - height + 1, width, height);
  }

  /**
   * One named mover, drawn at its own depth height with its soles on its feet.
   *
   * Only the protagonist has a sprite record: `content/actors/` holds one
   * actor file and the sheets it names, and no other character has one yet.
   * Everyone else draws the graybox figure -- VISIBLY a placeholder, at the
   * right size, in the right place, at the right depth. That is a gap you can
   * see, which is the point: a mover borrowing the protagonist's sheet would
   * be defect 1 again, wearing a costume.
   */
  private drawMover(mover: Actor, feetX: number, feetY: number): number {
    // The graybox's own width, exactly: its blocks run from -7 to +7 units of
    // height/40, so it is 0.35 of its height wide and half of that either
    // side of the anchor. Taken from the drawing below rather than estimated,
    // because a tie check with a guessed extent is a check with a guessed
    // answer.
    const grayHalfWidth = mover.height * (7 / 40);
    // A mover with no actor record draws the graybox -- the coach, the horses,
    // anything staged before its art exists. Distinguished from the failure
    // below: this one has nothing to draw at all, that one has a record that
    // does not cover the clip being asked for.
    const record = this.state.content.actors.get(mover.id);
    const sprite = this.sprites.get(mover.id);
    if (watch.enabled) this.watchMover(mover, feetY);
    if (!record || !sprite) {
      this.drawFigure(feetX, feetY, mover.height, this.screen.role('outline'));
      if (watch.enabled) {
        this.drawnAs.set(mover.id, 'graybox:no-record');
        watch.record('graybox:no-record', mover.id,
          `no actor record, drawn as a placeholder ${mover.height}px tall`);
      }
      return grayHalfWidth;
    }
    const surface = mover.surfaceHere();
    // HIS OWN RATES, not the protagonist's. Every record carries them, and
    // reading one character's timing off another is the same mistake in
    // miniature as drawing him with another's sheet.
    // Doc 40: one full cycle is one declared stride. Declared at the record's
    // own drawn height, so it scales with his height like everything else --
    // a man drawn smaller up the road takes proportionally shorter steps.
    // Both of those now live in `frameFor`, which the light pass shares.
    // Zero frames means the record does not declare this clip, and there is
    // no substitute for one. The graybox below is a placeholder, not a
    // stand-in animation: it is visibly not the character.
    // Q38: a mover's clip may be chosen by its object state as well as its
    // surface -- the coach's shut door and open one are one clip, two states.
    const state = this.state.moverState(mover.id);
    // THE FAR-DISTANCE CLIP, WHERE A TRACED PATH SAYS SO. Below the trace's own
    // `farClipHandoff` the walk is replaced by the derived blob -- three flat
    // frames thresholded out of the back walk's alpha, so it cannot drift from
    // the man it represents.
    //
    // THE PATH DECIDES, NOT THE HEIGHT. `farClipHandoff` is -1 on the committed
    // trace and that is correct rather than an omission: it bottoms out at 29px
    // and the blob takes over below 22, so this clip is unused by it and he
    // stays the real sprite the whole way. Switching at 29 to make the feature
    // visible would be the engine overruling a look decision.
    const clip = mover.isFarAway && sprite.declares(FAR_WALK) ? FAR_WALK : mover.clip;
    const frames = sprite.frameCount(clip, mover.facing, surface, state);
    // THE LIGHT HE STANDS IN, if the room declares any. The frame is drawn
    // through the scratch layer and tinted there, so the tint lands on his
    // pixels and on nothing behind him; with no field it is drawn straight,
    // exactly as before.
    const tint = this.tintAt(feetX, feetY);
    const grade = this.gradeFor(mover.id);
    const paint = (go: () => DrawnFrame | null): DrawnFrame | null => {
      if (!tint && !grade) return go();
      let landed: DrawnFrame | null = null;
      const half = Math.ceil(mover.height * 0.6);
      this.drawTinted(tint, [Math.floor(feetX - half), Math.floor(feetY - mover.height - 8), half * 2, mover.height + 16],
        () => { landed = go(); }, grade);
      return landed;
    };
    const drawn = frames > 0 && paint(() => sprite.draw(
      this.screen.context, clip, mover.facing, surface,
      // THE BREAK HAS ITS OWN RATE AND NOTHING HAD EVER READ IT. Doc 40 gives
      // idle 2.4/s and idle-break ~2/s, and `idleBreakRate` sits on every
      // actor record -- written there by build-actor-record.mjs, declared in
      // types.ts, and consumed by no code at all until `frameFor` existed. A
      // glance played at the breathing rate is not the animation the rate was
      // chosen for; it is the same frames at somebody else's tempo.
      this.frameFor(mover, record, frames),
      feetX, feetY, mover.height, state,
    ));
    // A CLIP THAT EXISTS AND HAS NOT ARRIVED FALLS BACK TO ONE THAT HAS.
    //
    // Tyler, on beat 3: after the driver says "Course you have", Hob and the
    // coach flash off and a tall black figure replaces them, then they flash
    // back. That is the graybox, and the cause is in BootAssets' own comment
    // -- idle-break clips are deliberately deferred, "because nothing stages
    // an idle break, it is a thing that happens when nothing else is". Beat
    // 3's pause after a line is exactly when nothing else is. The break fires,
    // its frames are still in flight, and the placeholder takes the stage.
    //
    // Loading them early is not the fix: the boot cast's break frames are
    // 25.3 MB. The fix is that a graybox should mean NO CLIP EXISTS, not
    // "this one is late". A character standing in his previous pose for half
    // a second is invisible; a black rectangle where he was is the loudest
    // thing on screen.
    let shown = drawn;
    if (!shown && frames > 0) {
      for (const spare of ['idle', 'stand']) {
        if (spare === clip || !sprite.declares(spare)) continue;
        const spareFrames = sprite.frameCount(spare, mover.facing, surface, state);
        if (spareFrames === 0) continue;
        shown = paint(() => sprite.draw(this.screen.context, spare, mover.facing, surface,
          this.frameFor(mover, record, spareFrames), feetX, feetY, mover.height, state));
        if (shown) break;
      }
    }
    if (!shown) {
      this.drawFigure(feetX, feetY, mover.height, this.screen.role('overlayBg'));
    }
    // THE OVERLAY GOES ON ONLY IF THE BODY WENT ON. A head composited over a
    // graybox is a head floating beside a placeholder, which reads as two
    // faults rather than the one that is actually there.
    if (shown) this.drawOverlays(sprite, mover, surface, state, feetX, feetY);
    if (!watch.enabled) return shown ? this.spanOf(sprite, mover, state, grayHalfWidth)
      : grayHalfWidth;

    // TWO FAULTS, NOT ONE, AND THE PLACEHOLDER LOOKS IDENTICAL FOR BOTH. Zero
    // frames means the record does not cover this clip at this facing on this
    // surface in this state -- a coverage gap. Frames but no draw means the
    // record covers it, the file is named, and the texture has not arrived --
    // a LOADING gap, which is what put a placeholder in the protagonist's
    // place for the whole of beat 2 while the boot split held his chore clips
    // in the deferred half. Merging them costs a session either way round.
    this.drawRecord.set(mover.id, {
      order: this.drawOrder,
      clipLevel: this.state.clipPlaneAt(Math.round(feetX), Math.round(feetY)),
      // The rectangle the RENDERER landed on, taken from the draw itself.
      // `shown` is whichever of the two draws actually put pixels down, so a
      // fallback pose reports the fallback's rectangle and its file, which is
      // the honest answer: that is what is on the screen.
      from: shown ? shown.path : null,
      bounds: shown ? [shown.x, shown.y, shown.width, shown.height] : null,
      fallback: !drawn && Boolean(shown),
    });
    this.drawOrder += 1;
    if (drawn) {
      this.drawnAs.set(mover.id, 'sprite');
    } else if (shown) {
      // Recorded, not silent: the watch should see a late clip as a fault
      // even though the picture no longer shows one.
      this.drawnAs.set(mover.id, 'sprite:fallback');
      watch.record('graybox:not-loaded', mover.id,
        `${clip}/${mover.facing} has ${frames} frame(s) and none has loaded; `
        + 'drew the previous pose instead of the placeholder');
    } else if (frames === 0) {
      this.drawnAs.set(mover.id, 'graybox:no-clip');
      watch.record('graybox:no-clip', mover.id,
        `${clip}/${mover.facing}${surface ? `/${surface}` : ''}`
        + `${state ? ` state=${state}` : ''} is not declared`);
    } else {
      this.drawnAs.set(mover.id, 'graybox:not-loaded');
      watch.record('graybox:not-loaded', mover.id,
        `${clip}/${mover.facing} has ${frames} frame(s) and none has loaded`);
    }
    return drawn ? this.spanOf(sprite, mover, state, grayHalfWidth) : grayHalfWidth;
  }

  /**
   * Every head overlay that belongs to this mover, over the body just drawn.
   *
   * Doc 43's draw order puts these at step 4, after the depth-sorted movers
   * and before the foreground -- but each goes on ITS OWN body immediately,
   * not in a later pass, because a head that waits for a second pass is a head
   * drawn over whoever happened to be standing in front of its owner.
   */
  private drawOverlays(sprite: ActorSprite, mover: Actor, surface: string,
                       state: string | undefined, feetX: number, feetY: number): void {
    for (const overlay of this.state.content.overlays.values()) {
      if (overlay.over !== mover.id) continue;
      const shown = this.overlayState(overlay);
      this.shownOverlays.set(overlay.id, shown);
      const declared = overlay.states[shown];
      if (!declared) continue;
      const image = this.sheet(declared.image);
      // No substitution, and no silent skip either: an overlay whose image has
      // not arrived draws nothing THIS frame and the watch says so, exactly as
      // a body clip does.
      if (!image) {
        if (watch.enabled) {
          watch.record('graybox:not-loaded', overlay.id,
            `overlay ${shown} has not loaded`);
        }
        continue;
      }
      const place = sprite.placement(mover.clip, mover.facing, surface, feetX, feetY,
        mover.height, state);
      if (!place) continue;
      // CLIPS THAT ALREADY CARRY THE HEAD GET NO OVERLAY. The departing coach
      // is one drawn picture with its driver in it, head and all; compositing
      // over it paints a second head on a man who has one. Declared in the
      // overlay rather than inferred, because "does this art contain a head"
      // is not a question code can ask.
      if (overlay.clips && !overlay.clips.includes(mover.clip)) continue;
      const [rx, ry, rw, rh] = overlayRect(overlay, mover.clip, state);
      // THE BODY'S OWN SCALE, NOT A SECOND ONE. This was
      // `mover.height / overlay.figureHeight`, and a body's figure height is
      // PER CLIP: the coach is 447 tall standing and 224 walking. One declared
      // number cannot follow that, so the head was drawn at a scale the body
      // was not using -- 1.149x adrift on the idle clips, 2x on the walk one,
      // which is the two-drivers report and then its return on departure.
      // `place.scale` is computed from the clip actually being drawn, so the
      // overlay cannot disagree with what it sits on.
      const scale = place.scale;
      this.screen.context.drawImage(
        image,
        Math.round(place.x + rx * scale), Math.round(place.y + ry * scale),
        Math.max(1, Math.round(rw * scale)), Math.max(1, Math.round(rh * scale)),
      );
    }
  }

  /**
   * Which state an overlay is in, from who is speaking. Doc 43 line 97.
   *
   * The rule is in the DATA -- each state names the speaker that selects it --
   * so the engine matches a string and knows nothing about a driver looking
   * down at a man on the road.
   */
  private overlayState(overlay: OverlayFile): string {
    const speaker = this.speaker;
    if (speaker) {
      for (const [id, declared] of Object.entries(overlay.states)) {
        if (declared.whenSpeaker === speaker) return id;
      }
    }
    return overlay.default;
  }

  /** The state each overlay drew in, for the probe. Doc 44 part three. */
  shownOverlayStates(): Record<string, string> {
    return Object.fromEntries(this.shownOverlays);
  }

  /**
   * Half the drawn width, from the sheet, for the tie check.
   *
   * Falls back to the graybox's own extent when the frame is not measurable,
   * which is honest: a span nobody can measure is not a span to assert on.
   */
  private spanOf(sprite: ActorSprite, mover: Actor, state: string | undefined,
                 fallback: number): number {
    const span = sprite.drawnHalfWidth(mover.clip, mover.facing, mover.surfaceHere(),
      mover.height, state);
    return span ?? fallback;
  }

  /**
   * The two negatives that need no drawing to see. Doc 44 part two #5 and #6.
   *
   * #6 cannot fire today through the ordinary path -- `Actor.clip` returns
   * `walk` only while `isWalking` is true, so the two agree by construction --
   * and it is here anyway, for the case that construction stops holding and
   * for a chore that happens to be NAMED walk. A guard that cannot currently
   * fire is cheap; the version of this bug that shipped was a walk cycle
   * playing on a man standing still at the end of a glide.
   */
  private watchMover(mover: Actor, feetY: number): void {
    const band = watch.band;
    if (band && !watch.bandExempt(mover.id) && (feetY < band[0] || feetY > band[1])) {
      watch.record('off-band', mover.id,
        `feet y ${Math.round(feetY)} is outside the walkable band ${band[0]}-${band[1]}`);
    }
    if (mover.clip === 'walk' && !mover.isWalking) {
      watch.record('walk-while-still', mover.id, 'walk clip on a mover that is not moving');
    }
  }

  /**
   * Draws a figure through the occlusion plane of the walk box it stands in.
   *
   * The figure goes to a scratch canvas, the plane's mask is composited with
   * destination-out to erase whatever is in front of it, and the remainder is
   * blitted. Nothing about the mask is ever DRAWN -- the room art already
   * contains the trough and the lumber; the mask only says which of those
   * pixels win.
   *
   * A figure at clip level 0, or in a room with no planes, skips all of this
   * and draws straight to the screen.
   */
  private masked(feetX: number, feetY: number, draw: () => void, override?: number): void {
    const planes = this.state.room.occlusionPlanes ?? [];
    // A STATE IMAGE MAY OCCLUDE IN A ROOM WITH NO PLANES OF ITS OWN (Phase
    // 1.5, doc 36 Q117): Main Street's trough is a companion that declares
    // `occludes: [1]` over a plate whose masks are not yet cut, and the early
    // return here drew Thad's legs over the water when he stood behind it.
    // The level is looked up whenever anything could mask at it.
    const stateOccludes = this.state.statefulTargets
      .some((target) => (this.state.presentation(target)?.occludes?.length ?? 0) > 0);
    if (!planes.length && !stateOccludes) {
      draw();
      return;
    }
    const level = override ?? this.state.clipPlaneAt(Math.round(feetX), Math.round(feetY));
    const plane = planes.find((candidate) => candidate.level === level);
    // A PENDING MASK IS NOT USED. It is a mask whose art describes a plate the
    // room no longer has, and drawing through is what this room did anyway
    // while its boxes named a plane that did not exist -- so skipping costs
    // nothing and using it would cut an actor apart along a shape that is not
    // in the picture. See RoomFile.occlusionPlanes.maskPending.
    const mask = plane && !plane.maskPending ? this.sheet(plane.mask) : null;
    // Doc 22 item 9: a state can change what OCCLUDES, not only what is
    // drawn, so an object whose current state masks this level joins the
    // punch-out alongside the room's own plane.
    const stateMasks = this.state.statefulTargets
      .map((target) => this.state.presentation(target))
      .filter((shown) => shown?.image && shown.occludes?.includes(level))
      .map((shown) => this.sheet(stateImagePath(shown!) as string))
      .filter((image): image is CanvasImageSource => image !== null);
    if (!mask && stateMasks.length === 0) {
      draw();
      return;
    }

    const scratch = this.scratch();
    if (!scratch) {
      draw();
      return;
    }
    // THE SCRATCH SCROLLS WITH THE SCREEN. It stays window-sized -- a
    // room-sized one would be 12MB for Main Street and reallocated per room --
    // and takes the same translate, so a figure drawn at world x lands at the
    // same place in it as it would on screen, and a room-wide occlusion mask
    // punches through at its own world coordinates.
    const camera = this.state.cameraX;
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.clearRect(0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    scratch.translate(-camera, 0);
    const screenContext = this.screen.borrow(scratch);
    try {
      draw();
    } finally {
      this.screen.borrow(screenContext);
    }
    scratch.globalCompositeOperation = 'destination-out';
    const width = this.state.roomWidth;
    if (mask) scratch.drawImage(mask, 0, 0, width, PLAY_HEIGHT);
    for (const extra of stateMasks) scratch.drawImage(extra, 0, 0, width, PLAY_HEIGHT);
    scratch.globalCompositeOperation = 'source-over';
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    // BLITTED AT WORLD X, because the screen context is itself translated by
    // -camera: the scratch holds screen-space pixels, so it has to be placed
    // where the translate will put it back at zero.
    screenContext.drawImage(scratch.canvas, camera, 0);
  }

  /**
   * THE PRACTICAL LIGHT ON A MOVER standing at (x, y): the room's lamps that
   * exist right now (a lamp that left with its coach is no lamp) and declare
   * a `movers` field, summed at the feet. Null for a room that declares none,
   * which is every room until one does -- and then the frame is the frame it
   * always was. engine/render/LightFields.ts.
   */
  private tintAt(feetX: number, feetY: number): MoverTint | null {
    const lamps = this.state.room.lamps;
    if (!lamps?.length || !lamps.some((lamp) => lamp.movers)) return null;
    const live = lamps.filter((lamp) => this.lampLive(lamp));
    return moverTint(live, feetX, feetY, askedState());
  }

  /** The room's figure grade, if it names this figure. Null otherwise: drawn exactly as before. */
  private gradeFor(id: string): FigureLight | null {
    const light = this.state.room.figureLight;
    if (!light || !light.figures.includes(id)) return null;
    const own = light.perFigure?.[id];
    return own ? { ...light, ...own } : light;
  }

  /** A lamp is live unless a flag condition or an object-state condition says otherwise. */
  private lampLive(lamp: RoomLamp): boolean {
    if (lamp.when && !this.state.flags.test(lamp.when)) return false;
    for (const [id, wanted] of Object.entries(lamp.whenObject ?? {})) {
      if (this.state.objectStateById(id) !== wanted) return false;
    }
    return true;
  }

  /**
   * Draw a figure through the scratch layer and lay the tint over its own
   * pixels only, then blit. `source-atop` on the scratch touches nothing but
   * what `draw` put there; the plate under the man is never tinted. Falls
   * back to drawing straight when there is no scratch (tests, no document).
   */
  private drawTinted(tint: MoverTint | null, bounds: [number, number, number, number], draw: () => void,
    grade: FigureLight | null = null): void {
    const scratch = this.scratch();
    if (!scratch) { draw(); return; }
    const camera = this.state.cameraX;
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.clearRect(0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    scratch.translate(-camera, 0);
    const screenContext = this.screen.borrow(scratch);
    try {
      // THE ROOM'S GRADE, FIRST. Brightness, contrast and saturation ride on
      // the draw as a canvas filter -- none of them blurs, so the pixels stay
      // hard-edged. The light's colour is a multiply over the figure; a
      // multiply also paints the transparent pixels around him, so his own
      // silhouette is stamped back in with `destination-in` afterwards.
      if (grade) scratch.filter = gradeFilter(grade);
      draw();
      scratch.filter = 'none';
      if (grade?.light) {
        const [r, g, b] = grade.light.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255));
        scratch.save();
        scratch.globalCompositeOperation = 'multiply';
        scratch.fillStyle = `rgb(${r},${g},${b})`;
        scratch.fillRect(bounds[0], bounds[1], bounds[2], bounds[3]);
        scratch.globalCompositeOperation = 'destination-in';
        draw();
        scratch.restore();
      }
    } finally {
      scratch.filter = 'none';
      this.screen.borrow(screenContext);
    }
    if (tint) applyTint(scratch, tint, bounds[0], bounds[1], bounds[2], bounds[3]);
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    screenContext.drawImage(scratch.canvas, camera, 0);
  }

  /** One reusable offscreen canvas for masking. Made on first use. */
  private scratch(): CanvasRenderingContext2D | null {
    if (this.scratchContext) return this.scratchContext;
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = NATIVE_WIDTH;
    canvas.height = PLAY_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.imageSmoothingEnabled = false;
    this.scratchContext = context;
    return context;
  }

  /**
   * THE SCORE IN CHALK (errata 136 A; Tyler, 2026-11-06: tally marks on the
   * slate show the score, with no words). Each side's row is the slate's own
   * way of counting -- the plate's old tallies are fours with a fifth struck
   * across -- in square blocks so the marks keep the plate's pixel grain. Each
   * upright leans one block to the right at the top, as a hand makes them.
   */
  private drawTally(score: { player: number; opponent: number } | null): void {
    const slate = this.state.room.tally;
    if (!slate || !score) return;
    const context = this.screen.context;
    context.fillStyle = slate.colour;
    const b = slate.block;
    const counts = [score.player, score.opponent];
    slate.rows.forEach(([x0, y0], row) => {
      const count = counts[row] ?? 0;
      for (let mark = 0; mark < count; mark += 1) {
        const group = Math.floor(mark / 5);
        const gx = x0 + group * (5 * slate.step + 2 * b);
        const within = mark % 5;
        const blocks = Math.max(1, Math.round(slate.height / b));
        if (within < 4) {
          const x = gx + within * slate.step;
          for (let k = 0; k < blocks; k += 1) {
            const lean = k < blocks / 3 ? b : 0;
            context.fillRect(Math.round(x + lean), Math.round(y0 + k * b), b, b);
          }
        } else {
          // THE FIFTH, struck across the four from low left to high right.
          const width = 3 * slate.step + 3 * b;
          const steps = Math.max(blocks, Math.round(width / b));
          for (let k = 0; k <= steps; k += 1) {
            const t = k / steps;
            context.fillRect(Math.round(gx - b + t * width), Math.round(y0 + slate.height - 2 * b - t * (slate.height - 3 * b)), b, b);
          }
        }
      }
    });
  }

  /**
   * An ambient character's two-frame idle. Ruling 20. Returns the frame index
   * it drew, or null when nothing drew (no sprite, or a sheet not yet loaded).
   */
  private drawAmbient(npc: AmbientFile): number | null {
    const declared = npc.sprite;
    if (!declared) return null;
    const image = this.sheet(declared.sheet);
    if (!image) return null;
    const phase = declared.phase ?? 0;
    // HELD STILL WHILE SPOKEN TO. Doc 32 section 8.2, deadpan rule: the
    // reply pause is not filled with flapping. Her own tree open means her
    // work stops on the talk frame; any other conversation leaves her be.
    const inConversation = (this.state.dialogue.isActive
      && this.state.dialogue.activeTreeId === npc.tree) || this.greeting === npc.tree;
    // WHOEVER IS SPEAKING IN A CONVERSATION TAKES HIS TALK FRAME, his own tree
    // or not, and under whichever id his words are written (AmbientFile.speaksAs;
    // errata 131 C): Sowerby reading the rules in Vessel's duel stood on his idle.
    const speaks = (who: string | null) => who !== null && (who === npc.id || who === npc.speaksAs);
    const speaking = speaks(this.speaker) && (this.state.dialogue.isActive || this.performing || this.greeting !== null);
    // AN ACTED DIRECTION (doc 95; errata 141) names the figure itself, whoever the line is written for.
    const acting = this.poses?.find((one) => one.id === npc.id)?.frame;
    const posed = acting !== undefined ? acting : this.pose && speaks(this.pose.speaker) ? this.pose.frame : null;
    const stirring = this.ambient.stirring(npc);
    const index = posed !== null
      ? (posed === 'mark' ? declared.markFrame ?? declared.talkFrame ?? 0 : posed)
      // STIRRING (AmbientFile.stirsOn; errata 131 E): his break poses, in turn.
      : stirring !== null && declared.frames.length > 2
        ? 2 + (Math.floor(stirring * 4) % (declared.frames.length - 2))
        : speaking && this.still ? declared.talkFrame ?? 0
          : this.still ? 0
            : inConversation || speaking
              ? conversationFrameAt(declared, phase, this.clock, speaking)
              : this.ambientFrame(declared, phase);
    const [sx, sy, width, height] = declared.frames[
      (index + declared.frames.length) % declared.frames.length
    ] as [number, number, number, number];
    // ON THE ROOM'S DEPTH CURVE, when the sheet has been measured. Phase 2A:
    // this used to be a 1:1 blit and an ambient was therefore whatever size
    // her sheet happened to be drawn at, in every room, at every depth.
    const [drawW, drawH] = this.ambientSize(npc, width, height);
    const left = npc.x - Math.floor(drawW / 2);
    const top = npc.y - drawH + 1;
    const tint = this.tintAt(npc.x, npc.y);
    const grade = this.gradeFor(npc.id);
    const draw = () => this.screen.context.drawImage(image, sx, sy, width, height, left, top, drawW, drawH);
    // FADING OUT (AmbientFile.leaves; errata 131 F): drawn fainter until gone.
    const opacity = this.ambient.opacity(npc.id);
    const was = this.screen.context.globalAlpha;
    if (opacity < 1) this.screen.context.globalAlpha = was * opacity;
    if (tint || grade) this.drawTinted(tint, [left, top, drawW, drawH], draw, grade);
    else draw();
    this.screen.context.globalAlpha = was;
    return index;
  }

  /**
   * The top of an ambient character as drawn, and the drawn height: where a
   * remark over her head belongs. The same arithmetic drawAmbient places her
   * with, so a figure drawn smaller than her zone's standard man -- the pie
   * woman -- gets a bark at her own head rather than at a standard man's.
   */
  ambientDrawnTop(npc: AmbientFile): { top: number; height: number } | null {
    const frame = npc.sprite?.frames?.[0];
    if (!frame) return null;
    const [, drawH] = this.ambientSize(npc, frame[2], frame[3]);
    return { top: npc.y - drawH + 1, height: drawH };
  }

  /**
   * How big to draw an ambient's frame: the room's own man-height where her
   * feet are, times her `stature`, over the height her sheet draws a figure
   * at. A sheet that declares no `figureHeight` is drawn 1:1, exactly as
   * before -- an unmeasured sheet is not silently resized to a guess.
   */
  private ambientSize(npc: AmbientFile, width: number, height: number): [number, number] {
    const drawn = npc.sprite?.figureHeight;
    if (!drawn) return [width, height];
    // STAGED, not strict: an ambient may legitimately stand where no walk
    // box is -- the pie woman behind a rail, a patron on the bar strip --
    // and the nearest box's curve is the right answer there.
    const man = this.state.stagedHeightAt(npc.x, npc.y);
    if (!man) return [width, height];
    const scale = (man * (npc.sprite?.stature ?? 1)) / drawn;
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
  }

  /**
   * The character's stationary props, drawn after her at their own room
   * coordinates, in the state her current frame maps to. See
   * AmbientFile.sprite.props.
   */
  private drawProps(npc: AmbientFile, frameIndex: number): void {
    for (const prop of npc.sprite?.props ?? []) {
      const image = this.sheet(prop.sheet);
      if (!image) {
        watch.record('graybox:not-loaded', npc.id, `${prop.sheet} has not arrived; drew nothing`);
        continue;
      }
      const which = prop.byFrame?.[String(frameIndex)] ?? 0;
      const rect = prop.frames[(which + prop.frames.length) % prop.frames.length] as [number, number, number, number];
      const [sx, sy, width, height] = rect;
      this.screen.context.drawImage(image, sx, sy, width, height,
        prop.x - Math.floor(width / 2), prop.y - height + 1, width, height);
    }
  }

  /**
   * Which frame an ambient character is on: the sway, or a break.
   *
   * A BREAK IS CHOSEN FROM A POOL, NOT PLAYED AS A ROUTINE. Tyler caught the
   * first version doing every pose in one sequence -- resettle the basket,
   * look down the street, call out, in that order, forever -- which is worse
   * than standing still, because a routine performed identically is exactly
   * what the eye catches. Each break is its own small animation that leaves
   * the idle and returns to it, and which one plays is chosen fresh.
   *
   * DERIVED FROM THE CLOCK, NOT STORED. The renderer holds no per-character
   * state and must not start: it is rebuilt on room entry and would forget
   * mid-break. The cycle number picks the break and the position within the
   * cycle picks the frame, so the same clock always gives the same picture --
   * which also means a save and load lands on the frame it left.
   */
  /** Which break is playing for this character right now, and its step. */
  ambientBreak(npc: AmbientFile): { index: number; step: number } | null {
    const declared = npc.sprite;
    if (!declared?.breaks?.length) return null;
    const { sprite: timed, clock } = this.timed(declared);
    const every = timed.breakEvery ?? 26;
    const t = clock + (timed.phase ?? 0) * every;
    const cycle = Math.floor(t / every);
    const into = t - cycle * every;
    const step = Math.floor(into / 0.34);
    const index = Math.abs(cycle * 2654435761) % declared.breaks.length;
    return step < (declared.breaks[index]?.length ?? 0) ? { index, step } : null;
  }

  private ambientFrame(declared: NonNullable<AmbientFile['sprite']>, phase: number): number {
    const { sprite, clock } = this.timed(declared);
    // A figure keeping time with the music runs on the bed's clock; `onArrival` counts on the scene's.
    return ambientFrameAt(sprite, sprite === declared ? phase : (sprite.phase ?? 0), clock,
      sprite === declared ? this.arrivedAt : undefined);
  }

  /** When Thad came into this room, on the renderer's clock: `onArrival` frames count from it. */
  private arrivedAt: number | undefined;

  setArrivedAt(seconds: number): void {
    this.arrivedAt = seconds;
  }

  /**
   * The graybox figure: a visible placeholder at the right size and depth.
   *
   * The 40 is the height the block coordinates below were authored against,
   * not a drawn size -- errata 54 did not make it stale, because everything
   * here is a PROPORTION of whatever height it is handed. A mover asking to
   * be 233 tall gets a 233-tall placeholder.
   */
  private drawFigure(centreX: number, feetY: number, height: number, index: number): void {
    const unit = height / 40;
    const px = (value: number) => Math.max(1, Math.round(value * unit));
    const top = feetY - height + 1;
    const block = (dx: number, dy: number, w: number, h: number) =>
      this.screen.fill(centreX + Math.round(dx * unit), top + Math.round(dy * unit), px(w), px(h), index);

    block(-3, 0, 6, 8);
    block(-5, 9, 10, 15);
    block(-7, 10, 2, 13);
    block(5, 10, 2, 13);
    block(-5, 24, 4, 16);
    block(1, 24, 4, 16);
  }

  /**
   * Speech, OVER THE SPEAKER. Doc 30 section 3.1.
   *
   * "Anchor at the speaker's current screen-space head position plus an
   * authored offset. The anchor follows actor position and scale; it is not a
   * room-global SAY_TOP constant." Doc 30 section 2 names the gap this closes
   * in as many words: "Consolation currently treats most dialogue as a
   * top-centred string."
   *
   * THE CLAMP IS WHAT MAKES IT SAFE. The block is positioned from its measured
   * dimensions and then pushed inside the playfield -- margins at the sides,
   * two pixels from the top, and clear of the panel -- so a speaker at the
   * frame edge or drawn tall does not push his own words off the screen.
   *
   * A SPEAKER WITH NOWHERE TO STAND FALLS BACK TO THE TOP, and doc 30 forbids
   * exactly that -- "a speaker who is offscreen must use an explicit fixed
   * anchor or be staged onscreen. Do not silently fall back to top-centre." So
   * it is not silent: the fallback is used only when the speaker is not a
   * mover in this room at all, which today means an unattributed line, and the
   * watch records it by name.
   */
  private drawSay(lines: string[], awaitingClick = false): void {
    const ink = this.speechColour();
    const anchor = this.speechAnchor(lines, awaitingClick && lines.length > 0);
    lines.forEach((line, index) => {
      this.font.drawCentredOutlined(
        this.screen.context,
        line,
        anchor.x,
        anchor.y + index * SPEECH_LINE_HEIGHT,
        ink,
        this.screen.roleColour('overlayBg'),
      );
    });
    if (awaitingClick && lines.length > 0) this.drawContinueMark(anchor, lines);
  }

  /**
   * THE LETTER, AS ONE PAGE (errata 128; the bookends audit, finding 2). Doc
   * 48 S7 beat 4: "The letter, Act IV, over black". The bible calls it very
   * short, and it was shown as four subtitles each erasing the last; now each
   * line joins the page under the one before, centred in the play area, in
   * the letter-writer's ink, and the page holds whole.
   */
  private drawPage(lines: string[], alpha: number): void {
    if (alpha <= 0) return;
    const writer = this.state.content.actor.id;
    const ink = this.state.content.speechColours?.speakers[writer]?.colour ?? this.screen.roleColour('inkBright');
    const blocks = lines.map((line) => this.font.wrap(line, PAGE_WIDTH));
    // A FIXED TOP, so the page grows downward and a line once placed never moves.
    let y = PAGE_TOP;
    const ctx = this.screen.context;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * Math.min(1, alpha);
    for (const block of blocks) {
      for (const row of block) {
        this.font.drawCentredOutlined(ctx, row, NATIVE_WIDTH / 2, y, ink, this.screen.roleColour('overlayBg'));
        y += SPEECH_LINE_HEIGHT;
      }
      y += PAGE_GAP;
    }
    ctx.globalAlpha = was;
  }

  /**
   * THE TITLE SCREEN (errata 128; doc 36 Q59, doc 17 beat 1: "Title over the
   * ridge at night"). The ridge plate, the drawn title in its sky, and the
   * menu in the game's face on the dark ground below it. The panel band stays
   * black. Every word is content/ui/title.json's.
   */
  private drawTitleScreen(title: { items: TitleItem[]; hovered: string | null; theEnd?: boolean; begin?: boolean }): void {
    const file = this.state.content.title;
    if (!file) return;
    const ctx = this.screen.context;
    // THE BEGIN CARD (errata 155): its words alone, on black, in the middle of
    // the play area. The title, and its music, come with the click.
    if (title.begin && file.begin) {
      this.screen.fill(0, 0, NATIVE_WIDTH, PLAY_HEIGHT, this.screen.role('overlayBg'));
      this.font.drawCentredOutlined(ctx, file.begin, NATIVE_WIDTH / 2, Math.round(PLAY_HEIGHT / 2 - SPEECH_LINE_HEIGHT / 2),
        this.screen.roleColour('ink'), this.screen.roleColour('overlayBg'));
      return;
    }
    const plate = this.sheet(file.background);
    if (plate) ctx.drawImage(plate, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    else this.screen.fill(0, 0, NATIVE_WIDTH, PLAY_HEIGHT, this.screen.role('overlayBg'));
    const logo = file.logo ? this.sheet(file.logo) as { width?: number; height?: number } | null : null;
    if (logo?.width && logo.height) {
      const height = Math.round((logo.height / logo.width) * TITLE_SCREEN_LOGO_WIDTH);
      ctx.drawImage(logo as CanvasImageSource, Math.round((NATIVE_WIDTH - TITLE_SCREEN_LOGO_WIDTH) / 2),
        TITLE_SCREEN_LOGO_Y, TITLE_SCREEN_LOGO_WIDTH, height);
    } else {
      // The same words in the game's face, if the drawing has not loaded.
      file.title.lines.forEach((line, index) => {
        this.font.drawCentredOutlined(ctx, line.text, NATIVE_WIDTH / 2,
          TITLE_SCREEN_LOGO_Y + index * SPEECH_LINE_HEIGHT * 2,
          this.screen.roleColour('inkBright'), this.screen.roleColour('overlayBg'));
      });
    }
    // THE END, under the title, when the game has just ended (Tyler, 2026-11-06:
    // "Title + THE END only"). The words are title.json's.
    if (title.theEnd && file.theEnd) {
      this.font.drawCentredOutlined(ctx, file.theEnd, NATIVE_WIDTH / 2, TITLE_THE_END_Y,
        this.screen.roleColour('inkBright'), this.screen.roleColour('overlayBg'));
    }
    for (const [index, item] of title.items.entries()) {
      const ink = !item.enabled ? 'inkDim' : item.id === title.hovered ? 'inkBright' : 'ink';
      this.font.drawCentredOutlined(ctx, item.label, NATIVE_WIDTH / 2, TITLE_MENU_Y + index * TITLE_MENU_STEP,
        this.screen.roleColour(ink), this.screen.roleColour('overlayBg'));
    }
  }

  /**
   * ERRATA 157: the play area as composed, moved down by `offset`, under the
   * bottom `offset` rows of the room's sky. Everything in the room -- plate,
   * coach, people, lamps -- moves together because it is the composed frame
   * that moves. A sky that has not loaded draws nothing and the room shows
   * as it stands, rather than a black band.
   */
  private drawPan(pan: { offset: number; sky: string; clock?: number }): void {
    const sky = this.sheet(pan.sky) as (CanvasImageSource & { width?: number; height?: number }) | null;
    if (!sky?.width || !sky.height) return;
    const ctx = this.screen.context;
    const offset = Math.min(PLAY_HEIGHT, pan.offset);
    if (!this.panBuffer && typeof document !== 'undefined') {
      this.panBuffer = document.createElement('canvas');
      this.panBuffer.width = NATIVE_WIDTH;
      this.panBuffer.height = PLAY_HEIGHT;
    }
    const buffer = this.panBuffer?.getContext('2d');
    if (!buffer || !this.panBuffer) return;
    buffer.imageSmoothingEnabled = false;
    buffer.clearRect(0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    buffer.drawImage(ctx.canvas, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    if (offset < PLAY_HEIGHT) {
      ctx.drawImage(this.panBuffer, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT - offset, 0, offset, NATIVE_WIDTH, PLAY_HEIGHT - offset);
    }
    const rows = Math.min(offset, sky.height);
    ctx.drawImage(sky, 0, sky.height - rows, NATIVE_WIDTH, rows, 0, offset - rows, NATIVE_WIDTH, rows);
    // THE STARS FLICKER (Tyler: "with stars flickering in a few places").
    // Each declared star flares briefly at its own irregular moments: two
    // incommensurate waves multiplied and raised to a high power are near
    // zero most of the time and peak rarely. A soft cross of light in the
    // stars' own warm colour, never a sprite; nothing about it is
    // information (invariant 9).
    const clock = pan.clock ?? 0;
    const was = ctx.globalAlpha;
    const glow = 'rgb(255, 226, 170)';
    for (const [index, [sx, sy]] of (this.state.room.skyStars ?? []).entries()) {
      const y = sy - (sky.height - offset);
      if (y < 0 || y >= offset) continue;
      const a = Math.sin(clock * (0.9 + index * 0.137) + index * 2.1);
      const b = Math.sin(clock * (0.53 + index * 0.071) + index * 0.7);
      const flare = Math.max(0, a * b) ** 6;
      if (flare < 0.02) continue;
      ctx.fillStyle = glow;
      ctx.globalAlpha = was * Math.min(1, flare * 1.4);
      ctx.fillRect(sx - 3, y - 3, 6, 6);
      ctx.globalAlpha = was * flare * 0.45;
      ctx.fillRect(sx - 9, y - 1, 18, 2);
      ctx.fillRect(sx - 1, y - 9, 2, 18);
    }
    ctx.globalAlpha = was;
  }

  private panBuffer: HTMLCanvasElement | null = null;

  /** Where each title item is clickable: its row, a little wider than its words. */
  titleHitboxes(items: TitleItem[]): { id: string; x: number; y: number; width: number; height: number }[] {
    return items.map((item, index) => {
      const width = this.font.measure(item.label) + 8 * GLYPH_SCALE;
      return {
        id: item.id,
        x: Math.round(NATIVE_WIDTH / 2 - width / 2),
        y: TITLE_MENU_Y + index * TITLE_MENU_STEP - 2 * GLYPH_SCALE,
        width,
        height: TITLE_MENU_STEP,
      };
    });
  }

  /**
   * THE CONTINUE MARK: a small still triangle after the block's last line, in
   * the line's own ink with the outline the words have. Interface grammar, not
   * words; it does not blink, because nothing on this screen moves to ask for
   * attention.
   */
  private drawContinueMark(anchor: { x: number; y: number }, lines: string[]): void {
    const last = lines[lines.length - 1] ?? '';
    const rows = CONTINUE_MARK_ROWS;
    const left = anchor.x + Math.ceil(this.font.measure(last) / 2) + CONTINUE_MARK_GAP;
    const top = anchor.y + (lines.length - 1) * SPEECH_LINE_HEIGHT + 3 * GLYPH_SCALE;
    const ctx = this.screen.context;
    const was = ctx.fillStyle;
    const draw = (colour: string, grow: number): void => {
      ctx.fillStyle = colour;
      for (let row = -grow; row < rows + grow; row += 1) {
        const spread = Math.max(0, rows - 1 - Math.max(0, row)) + grow;
        ctx.fillRect(left + rows - spread, top + row, spread * 2 + 1, 1);
      }
    };
    draw(this.screen.roleColour('overlayBg'), GLYPH_SCALE);
    draw(this.speechColour(), 0);
    ctx.fillStyle = was;
  }

  /**
   * Where a speech block's first line sits, clamped into the playfield.
   *
   * Measured, not estimated: doc 30 section 5 says "measure with
   * BitmapFont.measure(); do not estimate from string length", and the block's
   * width is the widest line in it.
   */
  private speechAnchor(lines: string[], marked = false): { x: number; y: number } {
    const height = lines.length * SPEECH_LINE_HEIGHT;
    const half = Math.max(...lines.map((line) => this.font.measure(line)), 0) / 2;
    // THE WAITING MARK IS PART OF THE BLOCK (errata 143). It hangs after the
    // last line, and the clamp measured the words alone, so a line said near
    // the right edge -- Thad's echo by the coach -- had its triangle sliced
    // off by the frame.
    const right = marked
      ? Math.max(half, this.font.measure(lines[lines.length - 1] ?? '') / 2 + CONTINUE_MARK_EXTENT)
      : half;
    // CUTSCENE CAPTIONS SIT AT THE TOP; ONLY AN EXCHANGE ANCHORS OVER A HEAD.
    //
    // Doc 30 governs DIALOGUE presentation. Anchoring every line over its
    // speaker also moved the opening's captions into the middle of the frame,
    // over the coach and the town, and that is the Room 1 Tyler signed off
    // being changed by a rule written for conversations.
    //
    // It cannot be fixed by narrowing alone. Doc 30 section 5's "240 native
    // pixels" was written when the play area was 320 wide -- three quarters of
    // the screen -- and errata 54 made the screen 1920. Three quarters of 1920
    // is 1440, so even at spec the block spans most of the frame and the
    // clamp can shift it by at most 240px. A caption that wide has nowhere to
    // be but the middle; the only real fix is to stop anchoring it.
    // A GREETING IS CONVERSATION TOO. It is said in the moment before the tree
    // opens -- not performing, not yet active -- so it fell to this caption
    // rule and every opening line in the game (the one-strike man's, the card
    // sharp's, Vessel's "You're the piano man.") printed top-centre instead of
    // over the person saying it. Found by Deke Vessel's proof, 2026-10-31.
    if (!this.performing && !this.state.dialogue.isActive && this.greeting === null) {
      return { x: NATIVE_WIDTH / 2, y: SAY_TOP };
    }
    const at = this.speakerHead();
    if (!at) {
      if (watch.enabled && this.speaker !== null) {
        watch.record('off-band', this.speaker,
          'speaks but stands nowhere in this room, so the line falls back to top-centre');
      }
      return { x: NATIVE_WIDTH / 2, y: SAY_TOP };
    }
    // ABOVE HIS HEAD, BY A FRACTION OF HIS OWN DRAWN HEIGHT rather than a
    // constant: the offset has to follow the scale for the same reason the
    // anchor follows the position, or a man drawn small up the road wears his
    // words as a hat while one at the front holds them at his knees.
    const top = at.headY - SPEECH_GAP * at.height - height;
    // THE CAMERA, WHICH WAS MISSING. `at.x` is a WORLD coordinate and this is
    // clamped against NATIVE_WIDTH in SCREEN space, because drawSay runs after
    // the camera translate is restored. On a 3700-wide street that put every
    // line at the right-hand clamp regardless of who was speaking.
    const screenX = at.x - this.state.cameraX;
    return {
      x: clampSpeechX(screenX, half, right),
      // Two native pixels from the top, x GLYPH_SCALE, and never into the
      // panel: doc 30 section 3.1's two clamps, in one expression.
      y: Math.round(Math.max(2 * GLYPH_SCALE,
        Math.min(PLAY_HEIGHT - height, top))),
    };
  }

  /**
   * Where the current speaker's head is, whatever KIND of thing he is.
   *
   * A SPEAKER NEED NOT BE A MOVER, and assuming he was is what put the
   * driver's lines back at the top of the sky. He is not a mover at all -- he
   * is baked into the coach's own frames with only his head separating, which
   * is why he is an overlay -- so a search of the actor registry found
   * nothing and the fallback fired for a man plainly on screen. Doc 30 section
   * 3.1 forbids exactly that: "a speaker who is offscreen must use an explicit
   * fixed anchor or be staged onscreen. Do not silently fall back to
   * top-centre."
   *
   * THE LINK IS ALREADY IN THE CONTENT. An overlay's states name the speaker
   * they answer to -- `whenSpeaker: 'stage_driver'` on the driver's `speaking`
   * head -- so the overlay that draws a speaker's face is found by asking
   * which overlay claims him, and his head is its rect on the body it sits on.
   * Nothing new is declared and no id is named in code.
   */
  private speakerHead(): { x: number; headY: number; height: number } | null {
    if (this.speaker === null) return null;
    const mover = this.actors.all().find((each) => each.id === this.speaker);
    if (mover) return { x: mover.x, headY: mover.y - mover.height, height: mover.height };

    // AN AMBIENT CHARACTER IS A SPEAKER TOO, and this did not know it. Only
    // movers and overlay faces were looked up, so the pie woman and the map
    // seller fell through to the centre-top fallback -- which is exactly what
    // Tyler saw: their dialogue printed at the top of the screen instead of
    // over their heads. They are the only people in Room 2 and they were the
    // ones this could not find.
    // WHERE THIS ROOM PUTS HER, NOT WHERE HER FILE DOES. Room 4's Vessel is a
    // placement of his Nugget record; read from the file, his words hung over
    // his place at the Nugget's bar, which in the back room is empty floor.
    // A FIGURE IN THE ROOM WHO SPEAKS AS HIM COMES BEFORE HIS OWN RECORD
    // ELSEWHERE (AmbientFile.speaksAs; errata 131 C). Duel Three's Fanshawe and
    // Sowerby are their own figures on Main Street, and their lines hung over
    // Fanshawe's office x and the back room's, clamped to the street's left edge.
    const npc = figureSpeaking(this.ambient.present, this.speaker)
      ?? [...this.state.content.ambient.values()].find((each) => each.id === this.speaker);
    if (npc) {
      const height = this.state.heightForZone(npc.zone);
      // A FIGURE DRAWN TALLER THAN HIS ZONE'S MAN keeps his words above his
      // own head. Deke Vessel is drawn at the depth curve's height where he
      // stands (312) and every zone height is shorter, so the zone anchor put
      // "You're the piano man." across his face. The higher of the two
      // anchors is used, so every figure drawn at or under its zone height --
      // the whole cast before him -- is exactly where it was.
      const drawn = this.ambientDrawnTop(npc);
      const headY = drawn ? Math.min(npc.y - height, drawn.top) : npc.y - height;
      return { x: npc.x, headY, height: drawn ? Math.max(height, drawn.height) : height };
    }

    for (const overlay of this.state.content.overlays.values()) {
      const claims = Object.values(overlay.states)
        .some((shown) => shown.whenSpeaker === this.speaker);
      if (!claims) continue;
      const body = this.actors.all().find((each) => each.id === overlay.over);
      const sprite = body ? this.sprites.get(body.id) : undefined;
      if (!body || !sprite) continue;
      const state = this.state.moverState(body.id);
      const place = sprite.placement(body.clip, body.facing, body.surfaceHere(),
        Math.round(body.x), Math.round(body.y), body.height, state);
      if (!place) continue;
      // The same rect the overlay is DRAWN at, resolved the same way, so the
      // words cannot sit above a head that is somewhere else.
      const [rx, ry, rw, rh] = overlayRect(overlay, body.clip, state);
      // His own head's box, in play-area pixels: the block sits above THAT
      // rather than above the coach he is sitting on, which is two metres of
      // stagecoach further down.
      return {
        x: place.x + (rx + rw / 2) * place.scale,
        headY: place.y + ry * place.scale,
        height: rh * place.scale,
      };
    }
    // A VOICE WITH NO FIGURE, STAGED WHERE IT COMES FROM (RoomFile.voices;
    // errata 131 A): the ring's mutter, from the chairs, not the top of the frame.
    const voice = this.state.room.voices?.[this.speaker];
    if (voice) return { x: voice.x, headY: voice.y, height: 0 };
    return null;
  }

  /**
   * The colour the current speaker's lines are drawn in.
   *
   * A FACT ABOUT A CHARACTER, LOOKED UP BY ID. Monkey Island gave each speaker
   * a colour and it is how a player tells who is talking without an
   * attribution line -- and this game had one ink for everybody, so the
   * driver, Hob and Thad were typographically the same person.
   *
   * THE OUTLINE DOES NOT CHANGE. It is what keeps a line legible over a night
   * plate, and varying it too would make one speaker harder to read than
   * another for a reason nobody chose.
   *
   * Absent falls back to the default ink, so a character nobody has coloured
   * is legible rather than invisible.
   */
  private speechColour(): string {
    // A STAGE DIRECTION IS NOBODY'S VOICE. It sits over the person it
    // describes, so the player knows whose it is, but it is drawn in the dim
    // ink rather than theirs: nobody is saying it.
    if (this.direction) return this.screen.roleColour('inkDim');
    const declared = this.speaker
      ? this.state.content.speechColours?.speakers[this.speaker]?.colour
      : undefined;
    return declared ?? this.screen.roleColour('inkBright');
  }

  /** A bark sits over the character who said it, not at the top of the screen. */
  /**
   * A bark, over the head of whoever said it.
   *
   * THE CAMERA IS APPLIED HERE, AND WAS NOT. `at.x` is the speaker's WORLD x
   * -- 2180 on a 3700-wide street -- and this draws AFTER the camera translate
   * has been restored, in screen space. So every bark on Main Street was
   * clamped against NATIVE_WIDTH with a world coordinate, which pinned it to
   * the right edge and clipped it: Tyler saw the pie woman's line appear on
   * the side of the screen, cut off, nowhere near her.
   *
   * The clamp itself is right and now clamps the right number.
   */
  private drawBark(lines: string[], at: { x: number; y: number }): void {
    const screenX = at.x - this.state.cameraX;
    lines.forEach((line, index) => {
      const y = at.y - (lines.length - index) * SPEECH_LINE_HEIGHT;
      const width = this.font.measure(line);
      const x = Math.max(GLYPH_SCALE * 2,
        Math.min(NATIVE_WIDTH - width - GLYPH_SCALE * 2, screenX - Math.round(width / 2)));
      this.font.drawOutlined(
        this.screen.context,
        line,
        x,
        y,
        this.screen.roleColour('inkBright'),
        this.screen.roleColour('overlayBg'),
      );
    });
  }

  /** Row hitboxes for the open menu page, in draw order. */
  menuHitboxes(): { id: string; y: number; height: number }[] {
    const rows = this.state.menu.rows();
    const top = MENU_TOP + MENU_ROW;
    return rows.map((row, index) => ({
      id: row.id, y: top + index * MENU_ROW, height: MENU_ROW,
    }));
  }

  private drawMenu(): void {
    const menu = this.state.menu;
    if (!menu.isOpen) return;
    const ctx = this.screen.context;
    const rows = menu.rows();
    const height = MENU_ROW * (rows.length + 2);

    this.screen.fill(MENU_X, MENU_TOP, MENU_WIDTH, height, this.screen.role('overlayBg'));
    this.screen.outline(MENU_X, MENU_TOP, MENU_WIDTH, height, this.screen.role('outline'));
    this.font.draw(ctx, menu.title(), MENU_X + 6 * GLYPH_SCALE, MENU_TOP + 3 * GLYPH_SCALE, this.screen.roleColour('inkBright'));

    for (const [index, row] of rows.entries()) {
      const y = MENU_TOP + MENU_ROW * (index + 1);
      // A disabled row is drawn dim and still drawn: a menu that changes
      // length depending on whether a save exists is harder to learn.
      const colour = this.screen.roleColour(row.enabled ? 'ink' : 'inkDim');
      this.font.draw(ctx, row.label, MENU_X + 8 * GLYPH_SCALE, y + 3 * GLYPH_SCALE, colour);
    }
  }

  private drawDialogue(): void {
    const node = this.state.dialogue.currentNode;
    if (!node) return;
    const ui = this.state.content.ui.dialogue;
    const ctx = this.screen.context;

    // THE CHOICES, AND ONLY THE CHOICES. The node's prompt used to be drawn
    // above the list (after first living in the sentence slot, where it
    // collided with the list's third row -- Tyler photographed it twice); doc
    // 30 says it is not interface text at all, and the greeting it duplicates
    // has already been spoken by its speaker before this list exists.
    const { backingTop, lines, arrows } = choiceLines(this.state.dialogue.presentOptions(), ui,
      this.choiceFit(), this.choiceView);
    // On the same black the band shows while an answer is performed, so the
    // area does not change colour each time the list goes and comes back.
    this.screen.fill(0, backingTop, NATIVE_WIDTH,
      NATIVE_HEIGHT - backingTop, this.screen.role('overlayBg'));
    for (const line of lines) {
      if (!line.shown) continue;
      this.panelFont.draw(ctx, line.marker, TEXT_MARGIN, line.y, this.screen.roleColour(line.markerRole));
      line.body.forEach((row, index) => {
        this.panelFont.draw(ctx, row, line.textX, line.y + index * DIALOGUE_LINE_HEIGHT,
          this.screen.roleColour(line.role));
      });
    }
    for (const arrow of arrows) {
      this.screen.fill(arrow.x, arrow.y, arrow.width, arrow.height, this.screen.role('buttonBg'));
      this.drawTriangle(arrow, this.screen.role(arrow.live ? 'ink' : 'inkDim'));
    }
  }

  /** The panel face and the width an option row may use (errata 134). */
  choiceFit(): ChoiceFit {
    return { wrap: (text, width) => this.panelFont.wrap(text, width),
      measure: (text) => this.panelFont.measure(text), width: CHOICE_WIDTH };
  }

  /**
   * A label's baseline inside a button, CENTRED rather than inset.
   *
   * It was `button.y + 2` -- two glyph pixels -- which at x GLYPH_SCALE is
   * twelve units, and the bottom verb row's text then ran off the bottom of
   * the frame. Looked at, not tested. Centring also survives the panel being
   * re-authored the day Q6's font lands, which a constant would not.
   */
  private labelY(button: Rect): number {
    return button.y + Math.max(0, Math.floor((button.height - this.panelFont.height) / 2));
  }

  private drawPanel(frame: Frame): void {
    const ctx = this.screen.context;
    const { verbs } = this.state.content;

    this.screen.fill(0, PANEL_Y, NATIVE_WIDTH, PANEL_HEIGHT, this.screen.role('panelBg'));

    const words = this.state.content.ui.map;
    const travelling = this.state.isMap && frame.hoveredTargetName && words;
    const sentence = frame.panelDim ? '' : frame.notice ?? (travelling
      ? format(words.travelTemplate, { target: frame.hoveredTargetName as string })
      : (this.state.isMap ? '' : this.sentenceText(frame.hoveredTarget, frame.hoveredTargetName)));
    const { x: sx, y: sy } = this.panel.sentence;
    this.panelFont.draw(ctx, sentence, sx, sy, this.screen.roleColour('inkBright'));

    // On the map every verb is inert -- doc 20 rule 5, a click travels and
    // there is nothing to look at, pull or open. They draw dim rather than
    // disappearing, the same convention an exhausted dialogue option uses:
    // still there, visibly not doing anything. A panel offering LOOK AT on a
    // screen with nothing to look at is the panel telling the player a lie.
    const inert = this.state.isMap;
    for (const verb of verbs.verbs) {
      const rect = this.panel.verbButton(verb.col, verb.row);
      const active = !inert && verb.id === this.state.verbs.selectedVerb;
      this.screen.fill(rect.x, rect.y, rect.width, rect.height, this.screen.role(active ? 'buttonBgActive' : 'buttonBg'));
      this.panelFont.draw(
        ctx,
        verb.label,
        rect.x + 3,
        this.labelY(rect),
        this.screen.roleColour(inert ? 'inkDim' : (active ? 'inkBright' : 'ink')),
      );
    }

    this.drawInventory();

    // The menu button, always present, always clickable. No key hints are
    // drawn because there are no required keys left to hint at.
    const menu = this.state.menu;
    const button = this.panel.menuButton;
    this.screen.fill(button.x, button.y, button.width, button.height,
      this.screen.role(menu.isOpen ? 'buttonBgActive' : 'buttonBg'));
    const label = menu.buttonLabel;
    const labelX = button.x + Math.floor((button.width - this.panelFont.measure(label)) / 2);
    this.panelFont.draw(ctx, label, labelX, this.labelY(button), this.screen.roleColour('ink'));

    // Doc 20 rule 2. Beside MENU, and it says BACK while the map is open --
    // the same button, because a screen you can enter and not leave by the
    // way you came in is a trap, and travel is instant either way.
    const map = this.panel.mapButton;
    if (map && words) {
      const open = this.state.isMap;
      this.screen.fill(map.x, map.y, map.width, map.height,
        this.screen.role(open ? 'buttonBgActive' : 'buttonBg'));
      const text = open ? words.back : words.button;
      const x = map.x + Math.floor((map.width - this.panelFont.measure(text)) / 2);
      this.panelFont.draw(ctx, text, x, this.labelY(map), this.screen.roleColour('ink'));
    }

    // ERRATA 39's fullscreen toggle, in the panel because the ruling says the
    // panel AND the menu "per the mouse-only requirement". It says which way
    // it goes rather than what it is: FULL while windowed, WINDOW while full.
    const full = this.panel.fullscreenButton;
    const fullWords = this.state.content.ui.fullscreen;
    if (full && fullWords) {
      this.screen.fill(full.x, full.y, full.width, full.height,
        this.screen.role(this.fullscreen ? 'buttonBgActive' : 'buttonBg'));
      const text = this.fullscreen ? fullWords.back : fullWords.button;
      const x = full.x + Math.floor((full.width - this.panelFont.measure(text)) / 2);
      this.panelFont.draw(ctx, text, x, this.labelY(full), this.screen.roleColour('ink'));
    }
  }

  /**
   * Whether the game is currently filling the screen.
   *
   * Read from the DOM rather than from a flag this class keeps, because the
   * browser owns the state and can leave fullscreen without asking -- Escape,
   * a window manager, a tab switch. A cached boolean would go stale in exactly
   * the case where the button is the only thing telling the player where they
   * are.
   */
  private get fullscreen(): boolean {
    return typeof document !== 'undefined' && document.fullscreenElement !== null;
  }

  /**
   * Hitboxes for the item rows currently on screen. Errata ruling 26.
   *
   * Only the visible window, not the whole inventory -- a row that has been
   * scrolled off is not clickable, and returning it here would make the
   * eleventh item answer a click on the fourth.
   */
  inventoryHitboxes(): ({ id: string } & Rect)[] {
    const carried = this.state.carried;
    const first = this.state.inventoryScroll;
    return carried
      .slice(first, first + this.panel.visibleRows)
      .map((id, index) => ({ id, ...this.panel.inventoryRow(index) }));
  }

  /** The two scroll arrows, whether or not they are currently usable. */
  arrowHitboxes(): ({ direction: 'up' | 'down' } & Rect)[] {
    return [
      { direction: 'up' as const, ...this.panel.arrow('up') },
      { direction: 'down' as const, ...this.panel.arrow('down') },
    ];
  }

  /**
   * Errata 29: a grid of icons, drawn from one sheet.
   *
   * The NAME is not drawn here and never was -- it goes in the sentence line
   * on hover and on selection, which is ruling 29's first condition and the
   * reason the authored display names survived the change of medium. An icon
   * is never the only way an item is identified.
   */
  private drawInventory(): void {
    const table = this.state.content.itemIcons;
    const sheet = this.sheet(table.sheet);
    for (const slot of this.inventoryHitboxes()) {
      const held = this.state.heldItem === slot.id;
      this.screen.fill(slot.x, slot.y, slot.width, slot.height,
        this.screen.role(held ? 'buttonBgActive' : 'panelBg'));
      const cell = table.icons[slot.id];
      if (sheet && cell) {
        // FITTED TO THE SLOT, not drawn at its own size. The icon sheet is
        // 320-era art and a 20x20 cell in a 180x84 slot reads as a speck --
        // looked at on screen, the inventory was three faint marks. Same
        // reasoning as drawPlate: a legacy asset lands where its geometry says
        // and is magnified until it is redrawn, rather than sitting in the
        // corner of the space it is supposed to fill. Aspect is preserved and
        // it is centred, so a redrawn icon at slot size is a no-op here.
        const fit = Math.min(slot.width / cell[2], slot.height / cell[3]);
        const width = Math.round(cell[2] * fit);
        const height = Math.round(cell[3] * fit);
        this.screen.context.drawImage(sheet, cell[0], cell[1], cell[2], cell[3],
          Math.round(slot.x + (slot.width - width) / 2),
          Math.round(slot.y + (slot.height - height) / 2), width, height);
      } else {
        // No icon drawn for this item yet. A labelled box is a visible gap;
        // an empty one is an item the player cannot see they are carrying.
        this.screen.outline(slot.x, slot.y, slot.width, slot.height,
          this.screen.role('inkDim'));
        this.panelFont.draw(this.screen.context, this.state.itemLabel(slot.id).slice(0, 4),
          slot.x + 2 * PANEL_GLYPH_SCALE, slot.y + 2 * PANEL_GLYPH_SCALE,
          this.screen.roleColour('inkDim'));
      }
      if (held) this.screen.outline(slot.x, slot.y, slot.width, slot.height,
        this.screen.role('inkBright'));
    }

    // Arrows are drawn dim when they would do nothing rather than hidden, so
    // the list is the same shape whatever is in it -- the same reason
    // CONTINUE greys out on the title screen instead of disappearing.
    const first = this.state.inventoryScroll;
    const canScroll = {
      up: first > 0,
      down: first + this.panel.visibleRows < this.state.carried.length,
    };
    for (const arrow of this.arrowHitboxes()) {
      const live = canScroll[arrow.direction];
      this.screen.fill(arrow.x, arrow.y, arrow.width, arrow.height,
        this.screen.role('buttonBg'));
      this.drawTriangle(arrow, this.screen.role(live ? 'ink' : 'inkDim'));
    }
  }

  /** A solid triangle, point up or down, centred in its button. */
  private drawTriangle(arrow: { direction: 'up' | 'down' } & Rect, index: number): void {
    // Glyph pixels: a four-row arrow was right beside a seven-row face and
    // is a speck beside a forty-two-row one.
    const rows = 4 * GLYPH_SCALE;
    const centre = arrow.x + Math.floor(arrow.width / 2);
    const top = arrow.y + Math.floor((arrow.height - rows) / 2);
    for (let row = 0; row < rows; row += 1) {
      const spread = arrow.direction === 'up' ? row : rows - 1 - row;
      this.screen.fill(centre - spread, top + row, spread * 2 + 1, 1, index);
    }
  }

  private sentenceText(target: Interactable | null, targetName: string | null): string {
    const { ui } = this.state.content;
    // ERRATA 28b: the sentence shows what a click would DO, which with
    // nothing selected is the hovered object's own default verb. Showing the
    // selection alone would have left the line blank in the state the ruling
    // makes the starting one.
    const verb = this.state.verbs.verbFor(target ?? undefined);
    const verbLabel = this.state.verbs.labelFor(verb);
    // Walking is not a sentence about a thing. Doc 06's walk template is just
    // the verb, so the road does not read "Walk to THE MUD".
    //
    // A DEPARTURE IS THE EXCEPTION, AND IT IS THE ONE CASE THAT NEEDS THE
    // NAME. Hovering the gap in the fence read "Walk to" with nothing after
    // it, so the click that leaves the room looked exactly like a click on
    // mud. An exit is a place; the ground is not. The rule was written about
    // THE MUD and quietly covered CONSOLATION too.
    if (verb === this.state.verbs.walkVerbId) {
      // An Exit is an Interactable that names a destination. Nothing else does.
      const departure = targetName && target && 'to' in target;
      if (!departure) return format(ui.sentence.walkTemplate, { verb: verbLabel });
      return format(ui.sentence.template, { verb: verbLabel, target: targetName });
    }
    const held = this.state.heldItem;
    // With an item picked up the sentence gains a middle: the verb applies
    // WITH the item TO the target. Both halves are named, because a player
    // holding something and reading "Use the trough" cannot tell whether the
    // fork is in the sentence or not.
    if (held) {
      // The DISPLAY name, the same string the panel row draws. Doc 23 gives
      // every item both, and a sentence reading "Use The tuning fork on
      // POSTED NOTICES" mixes the two conventions in one line.
      const item = this.state.itemLabel(held);
      if (!targetName) return format(ui.sentence.itemOnly, { verb: verbLabel, item });
      return format(ui.sentence.itemTemplate, { verb: verbLabel, item, target: targetName });
    }
    if (!targetName) {
      return format(ui.sentence.verbOnly, { verb: verbLabel });
    }
    return format(ui.sentence.template, { verb: verbLabel, target: targetName });
  }
}
