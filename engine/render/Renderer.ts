import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import { FAR_WALK, IDLE_BREAK, type Actor } from '../core/Actor.ts';
import type { RoomActors } from '../core/RoomActors.ts';
import type { AmbientLayer } from '../core/Ambient.ts';
import type { ActorFile, AmbientFile, Interactable, OverlayFile } from '../core/types.ts';
import { ActorSprite } from './ActorSprite.ts';
import { depthTies, watch } from '../dev/Watch.ts';
import { GLYPH_SCALE, PANEL_GLYPH_SCALE, BitmapFont } from './BitmapFont.ts';
import { IdleLayer } from './IdleLayer.ts';
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
  hoveredTarget: Interactable | null;
  hoveredTargetName: string | null;
  sayLines: string[];
  notice: string | null;
  barkLines: string[];
  barkAt: { x: number; y: number } | null;
  /** Doc 17 beat 7, over the view of the town. Null the rest of the time. */
  actCard?: string | null;
  /**
   * Doc 17 beat 8: "Control. Verb panel appears." Before that beat there is
   * no panel, because there is nothing the player may do with it.
   */
  showPanel?: boolean;
  /** The map location under the pointer, so it can draw as the live one. */
  hoveredLocation?: string | null;
  /**
   * Who is speaking, so a head overlay can answer to it. Doc 43 line 97.
   *
   * The overlay's states name their own speaker; this is the fact they are
   * matched against. Null when nobody is talking, which selects the default.
   */
  speaker?: string | null;
  /**
   * An exchange is being PERFORMED, so the choice list is neither drawn nor
   * clickable. Doc 30 section 1.
   */
  performing?: boolean;
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
const SAY_TOP = 8 * GLYPH_SCALE;
const TEXT_MARGIN = 6 * GLYPH_SCALE;
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
const MAP_MARKER = 3 * GLYPH_SCALE;
const MAP_LABEL_HEIGHT = 11 * GLYPH_SCALE;

/**
 * Where the first option row sits, for a node with this many options.
 *
 * Bottom-anchored, and it only reaches above the panel when the options
 * genuinely do not fit in it -- which for every tree in Act I they do.
 */
export function dialogueTop(count: number): number {
  return DIALOGUE_BOTTOM - count * DIALOGUE_LINE_HEIGHT;
}

/** One figure standing in the room, whatever kind of thing it is. */
export interface RoomFigure {
  id: string;
  feetX: number;
  feetY: number;
  /** Exactly one of these is set. */
  npc?: AmbientFile;
  mover?: Actor;
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
export function roomFigures(ambient: AmbientFile[], movers: Actor[]): RoomFigure[] {
  return [
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
  private readonly font: BitmapFont;
  /**
   * The panel's own face, at Q35's derived scale. Same glyph data, same file,
   * a different multiplier -- because the panel is the one region errata 54
   * re-proportioned instead of scaling, and text sized for the play area's
   * factor does not fit in it. Built here rather than passed in, like
   * PanelLayout beside it: it is a property of the panel, not of the caller.
   */
  private readonly panelFont: BitmapFont;
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
    font: BitmapFont,
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
    this.panelFont = new BitmapFont(state.content.font, PANEL_GLYPH_SCALE);
  }

  /** The animation clock, in seconds. Set once per frame by the scene. */
  setClock(seconds: number): void {
    this.clock = seconds;
  }

  /**
   * What each mover last drew as, for the probe. Doc 44 part three.
   *
   * Only maintained while the watch is on: a map write per mover per frame is
   * small, and R5h says the instrument is part of the system, so it is not
   * paid for when nobody is reading it.
   */
  private readonly drawnAs = new Map<string, string>();
  private readonly shownOverlays = new Map<string, string>();
  private speaker: string | null = null;
  /**
   * Set from the frame, read by BOTH the draw and the hit test.
   *
   * One field rather than two readings of the same fact: a list that were
   * hidden but still clickable would be worse than a visible one, because the
   * player could not see what they had hit.
   */
  private performing = false;
  private frameIndex = 0;

  /** How every mover drew on the last composed frame. Doc 44's `drawn`. */
  lastDrawn(): Record<string, string> {
    return Object.fromEntries(this.drawnAs);
  }

  /** Options currently drawn, so the scene can hit-test them. */
  dialogueHitboxes(options: PresentedOption[]): { id: string; y: number; height: number }[] {
    // NOTHING IS CLICKABLE WHILE AN EXCHANGE PLAYS, and this is the half that
    // makes doc 30 step 2 true rather than merely look true. The list is not
    // drawn then either; both read `performing`, so there is no state in which
    // a row can be hit without being visible.
    if (this.performing) return [];
    const top = dialogueTop(options.length);
    return options.map((presented, index) => ({
      id: presented.option.id,
      y: top + index * DIALOGUE_LINE_HEIGHT,
      height: DIALOGUE_LINE_HEIGHT,
    }));
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

  /**
   * Where each location's marker and label go.
   *
   * A label near the right edge is drawn to the LEFT of its marker instead of
   * running off the screen -- which is what THE ROAD TO THE CLAIMS did, and
   * it is the location errata 30c puts on the map from the first opening, so
   * it was the most-seen label in the game and half of it was missing.
   */
  private mapLayout() {
    return this.state.mapLocations.map(({ location, label, built }) => {
      const [x, y] = location.at;
      const width = this.font.measure(label);
      const fits = x + MAP_MARKER + GLYPH_SCALE * 2 + width <= NATIVE_WIDTH - GLYPH_SCALE * 2;
      const labelX = fits ? x + MAP_MARKER + GLYPH_SCALE * 2 : x - GLYPH_SCALE * 2 - width;
      const left = Math.min(x, labelX);
      const right = Math.max(x + MAP_MARKER, labelX + width);
      return {
        location,
        label,
        built,
        labelX,
        rect: { x: left - GLYPH_SCALE, y: y - GLYPH_SCALE * 2,
          width: (right - left) + GLYPH_SCALE * 2, height: MAP_LABEL_HEIGHT },
      };
    });
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
    this.performing = frame.performing === true;
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
    this.idles.draw(this.state.room, this.idleSheet(this.state.room.id), this.clock);
    // After the idles as well as the plate: the ambient background motion is
    // on the ground too, and a pool that lit the mud but not the things on it
    // would draw a hole around every one of them.
    this.drawCarriedLight();
    this.drawPeople();
    this.drawForeground();
    this.screen.context.restore();
    // The response to an option is drawn above the option list, not instead
    // of it -- otherwise picking an option appears to do nothing.
    this.drawSay(frame.sayLines);
    if (frame.barkAt) {
      this.drawBark(frame.barkLines, frame.barkAt);
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
    if (frame.showPanel !== false) this.drawPanel(frame);
    // Last, so it sits over everything including the panel.
    this.drawMenu();
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
      if (!shown?.image) continue;
      const image = this.sheet(shown.image);
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
      context.globalAlpha = Math.max(0, Math.min(1, spec.intensity));
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
    for (const figure of depthOrder(roomFigures(this.ambient.present, this.actors.all()))) {
      this.masked(figure.feetX, figure.feetY, () => {
        if (figure.mover) {
          const halfWidth = this.drawMover(figure.mover, figure.feetX, figure.feetY);
          if (watch.enabled) {
            spans.push({ id: figure.id, feetX: figure.feetX, feetY: figure.feetY, halfWidth });
          }
          return;
        }
        const npc = figure.npc as AmbientFile;
        if (!this.drawAmbient(npc)) {
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
      });
    }
    if (!watch.enabled) return;
    for (const [one, two] of depthTies(spans)) {
      watch.record('depth-tie', `${one} ${two}`,
        `both at feet y ${spans.find((s) => s.id === one)?.feetY}, overlapping in x`);
    }
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
    const drawn = frames > 0 && sprite.draw(
      this.screen.context, clip, mover.facing, surface,
      // THE BREAK HAS ITS OWN RATE AND NOTHING HAD EVER READ IT. Doc 40 gives
      // idle 2.4/s and idle-break ~2/s, and `idleBreakRate` sits on every
      // actor record -- written there by build-actor-record.mjs, declared in
      // types.ts, and consumed by no code at all until `frameFor` existed. A
      // glance played at the breathing rate is not the animation the rate was
      // chosen for; it is the same frames at somebody else's tempo.
      this.frameFor(mover, record, frames),
      feetX, feetY, mover.height, state,
    );
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
        shown = sprite.draw(this.screen.context, spare, mover.facing, surface,
          this.frameFor(mover, record, spareFrames), feetX, feetY, mover.height, state);
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
  private masked(feetX: number, feetY: number, draw: () => void): void {
    const planes = this.state.room.occlusionPlanes;
    if (!planes?.length) {
      draw();
      return;
    }
    const level = this.state.clipPlaneAt(Math.round(feetX), Math.round(feetY));
    const plane = planes.find((candidate) => candidate.level === level);
    const mask = plane ? this.sheet(plane.mask) : null;
    // Doc 22 item 9: a state can change what OCCLUDES, not only what is
    // drawn, so an object whose current state masks this level joins the
    // punch-out alongside the room's own plane.
    const stateMasks = this.state.statefulTargets
      .map((target) => this.state.presentation(target))
      .filter((shown) => shown?.image && shown.occludes?.includes(level))
      .map((shown) => this.sheet(shown!.image as string))
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

  /** An ambient character's two-frame idle. Ruling 20. */
  private drawAmbient(npc: AmbientFile): boolean {
    const declared = npc.sprite;
    if (!declared) return false;
    const image = this.sheet(declared.sheet);
    if (!image) return false;
    const phase = declared.phase ?? 0;
    const index = this.ambientFrame(declared, phase);
    const [sx, sy, width, height] = declared.frames[
      (index + declared.frames.length) % declared.frames.length
    ] as [number, number, number, number];
    this.screen.context.drawImage(image, sx, sy, width, height,
      npc.x - Math.floor(width / 2), npc.y - height + 1, width, height);
    return true;
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
    const every = declared.breakEvery ?? 26;
    const t = this.clock + (declared.phase ?? 0) * every;
    const cycle = Math.floor(t / every);
    const into = t - cycle * every;
    const step = Math.floor(into / 0.34);
    const index = Math.abs(cycle * 2654435761) % declared.breaks.length;
    return step < (declared.breaks[index]?.length ?? 0) ? { index, step } : null;
  }

  private ambientFrame(declared: NonNullable<AmbientFile['sprite']>, phase: number): number {
    const idleFrames = declared.breaks?.length
      ? Math.min(2, declared.frames.length) : declared.frames.length;
    const sway = Math.floor((this.clock * declared.rate + phase) * 2) % idleFrames;
    const breaks = declared.breaks;
    if (!breaks?.length) return sway;

    const every = declared.breakEvery ?? 26;
    // The phase spreads the characters apart, so nobody breaks in unison.
    const t = this.clock + phase * every;
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
  private drawSay(lines: string[]): void {
    const ink = this.speechColour();
    const anchor = this.speechAnchor(lines);
    lines.forEach((line, index) => {
      this.font.drawCentredOutlined(
        this.screen.context,
        line,
        anchor.x,
        anchor.y + index * DIALOGUE_LINE_HEIGHT,
        ink,
        this.screen.roleColour('overlayBg'),
      );
    });
  }

  /**
   * Where a speech block's first line sits, clamped into the playfield.
   *
   * Measured, not estimated: doc 30 section 5 says "measure with
   * BitmapFont.measure(); do not estimate from string length", and the block's
   * width is the widest line in it.
   */
  private speechAnchor(lines: string[]): { x: number; y: number } {
    const height = lines.length * DIALOGUE_LINE_HEIGHT;
    const half = Math.max(...lines.map((line) => this.font.measure(line)), 0) / 2;
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
    if (!this.performing && !this.state.dialogue.isActive) {
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
      x: Math.round(Math.max(TEXT_MARGIN + half,
        Math.min(NATIVE_WIDTH - TEXT_MARGIN - half, screenX))),
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
    const npc = [...this.state.content.ambient.values()]
      .find((each) => each.id === this.speaker);
    if (npc) {
      const height = this.state.heightForZone(npc.zone);
      return { x: npc.x, headY: npc.y - height, height };
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
      const y = at.y - (lines.length - index) * DIALOGUE_LINE_HEIGHT;
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

    const options = this.state.dialogue.presentOptions();
    const top = dialogueTop(options.length);

    // THE PROMPT GOES ABOVE THE LIST, NOT IN THE SENTENCE SLOT.
    //
    // It used to go in the sentence line's slot, on the reasoning that nothing
    // else is using it during a conversation. Nothing else is -- but the LIST
    // is. The list is bottom-anchored and grows upward, so it reaches the
    // sentence slot at 894 from three options up, and at four the stage
    // direction printed straight across the third row. Tyler photographed it
    // twice: "The map seller brightens considerably." overlaid on "Have you
    // ever dug where a map says?", both legible, neither readable.
    //
    // Above the list is the only place that cannot collide with it, because
    // the list's own height is what decides where that is.
    const promptY = node.prompt ? top - DIALOGUE_LINE_HEIGHT : top;
    const backingTop = Math.min(promptY - 2 * GLYPH_SCALE, PANEL_Y);
    this.screen.fill(0, backingTop, NATIVE_WIDTH,
      NATIVE_HEIGHT - backingTop, this.screen.role('overlayBg'));

    if (node.prompt) {
      this.panelFont.draw(ctx, node.prompt, TEXT_MARGIN, promptY,
        this.screen.roleColour('inkBright'));
    }

    options.forEach((presented, index) => {
      const prefix = presented.exhausted ? ui.exhaustedPrefix : ui.optionPrefix;
      const colour = this.screen.roleColour(presented.exhausted ? 'inkDim' : 'ink');
      this.panelFont.draw(
        ctx,
        `${prefix}${presented.option.text}`,
        TEXT_MARGIN,
        top + index * DIALOGUE_LINE_HEIGHT + PANEL_GLYPH_SCALE,
        colour,
      );
    });
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
    const sentence = frame.notice ?? (travelling
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
