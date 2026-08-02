import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import type { Actor } from '../core/Actor.ts';
import type { RoomActors } from '../core/RoomActors.ts';
import type { AmbientLayer } from '../core/Ambient.ts';
import type { AmbientFile, Interactable } from '../core/types.ts';
import { ActorSprite } from './ActorSprite.ts';
import { BitmapFont } from './BitmapFont.ts';
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
const DIALOGUE_BOTTOM = NATIVE_HEIGHT - 3;
const DIALOGUE_LINE_HEIGHT = 10;
const SAY_TOP = 8;
const TEXT_MARGIN = 6;
/**
 * Doc 17 beat 7's card, on the view rather than across the man standing
 * in it. At 118 it crossed Thad's chest; the band above the horizon is the
 * shot the card is commenting on.
 */
const ACT_CARD_Y = 66;
//: Doc 17 writes the card on two lines. 11 rows apart for a 7-row font.
const ACT_CARD_LINE_HEIGHT = 11;
const MAP_MARKER = 3;
const MAP_LABEL_HEIGHT = 11;

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

/** Fills `{name}` placeholders from the supplied map. */
export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/** Overlay geometry. Sits over the play area, clear of the verb panel. */
const MENU_X = 84;
const MENU_WIDTH = 152;
const MENU_TOP = 18;
const MENU_ROW = 12;

export class Renderer {
  private readonly screen: Screen;
  private readonly font: BitmapFont;
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
  private readonly sprite: ActorSprite | null;
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
    this.sprite = new ActorSprite(state.content.actor, sheet);
    this.panel = new PanelLayout(state.content.panel);
  }

  /** The animation clock, in seconds. Set once per frame by the scene. */
  setClock(seconds: number): void {
    this.clock = seconds;
  }

  /** Options currently drawn, so the scene can hit-test them. */
  dialogueHitboxes(options: PresentedOption[]): { id: string; y: number; height: number }[] {
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
      const fits = x + MAP_MARKER + 2 + width <= NATIVE_WIDTH - 2;
      const labelX = fits ? x + MAP_MARKER + 2 : x - 2 - width;
      const left = Math.min(x, labelX);
      const right = Math.max(x + MAP_MARKER, labelX + width);
      return {
        location,
        label,
        built,
        labelX,
        rect: { x: left - 1, y: y - 2, width: (right - left) + 2, height: MAP_LABEL_HEIGHT },
      };
    });
  }

  drawFrame(frame: Frame): void {
    if (this.state.isMap) {
      this.drawRoom();
      this.drawMap(frame);
      if (frame.showPanel !== false) this.drawPanel(frame);
      this.drawMenu();
      return;
    }
    this.drawRoom();
    this.drawObjectStates();
    this.idles.draw(this.state.room, this.idleSheet(this.state.room.id), this.clock);
    this.drawPeople();
    this.drawForeground();
    // The response to an option is drawn above the option list, not instead
    // of it -- otherwise picking an option appears to do nothing.
    this.drawSay(frame.sayLines);
    if (frame.barkAt) {
      this.drawBark(frame.barkLines, frame.barkAt);
    }
    if (this.state.dialogue.isActive) {
      this.drawDialogue();
    }
    // Doc 17 beat 7. Over the room, not over black: the card lands on the
    // view of the town after the coach has gone, which is the shot it is
    // commenting on.
    if (frame.actCard) this.drawActCard(frame.actCard);
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
  private drawActCard(text: string): void {
    const parts = text.split('\u2014').map((part) => part.trim()).filter(Boolean);
    const lines = parts.length > 1 ? [parts[0] as string, parts.slice(1).join(' — ')] : parts;
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
      this.screen.outline(x - 1, y - 1, MAP_MARKER + 2, MAP_MARKER + 2,
        this.screen.role('overlayBg'));
      this.font.drawOutlined(
        this.screen.context, label, labelX, y - 2, ink,
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
    this.screen.fill(0, 0, NATIVE_WIDTH, room.horizon, room.colours.sky);
    this.screen.fill(0, room.horizon, NATIVE_WIDTH, PLAY_HEIGHT - room.horizon, room.colours.ground);
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
    this.screen.context.drawImage(image, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
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
  private drawPeople(): void {
    // EVERY MOVER, not just the protagonist, sorted against the ambient set
    // in one pass -- so a driver standing further up the road is drawn behind
    // a man standing nearer it for the same reason and by the same rule.
    for (const figure of depthOrder(roomFigures(this.ambient.present, this.actors.all()))) {
      this.masked(figure.feetX, figure.feetY, () => {
        if (figure.mover) {
          this.drawMover(figure.mover, figure.feetX, figure.feetY);
          return;
        }
        const npc = figure.npc as AmbientFile;
        if (!this.drawAmbient(npc)) {
          this.drawFigure(npc.x, npc.y, this.state.heightForZone(npc.zone),
            this.screen.role('outline'));
        }
      });
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
  private drawMover(mover: Actor, feetX: number, feetY: number): void {
    if (mover.id !== this.actors.playerId) {
      this.drawFigure(feetX, feetY, mover.height, this.screen.role('outline'));
      return;
    }
    const surface = mover.surfaceHere();
    const clip = mover.clip;
    const { walkRate, reactRate, idleRate } = this.state.content.actor;
    // Zero frames means the record does not declare this clip, and there is
    // no substitute for one. The graybox below is a placeholder, not a
    // stand-in animation: it is visibly not the character.
    const frames = this.sprite?.frameCount(clip, mover.facing, surface, mover.height) ?? 0;
    const drawn = frames > 0 && this.sprite?.draw(
      this.screen.context, clip, mover.facing, surface,
      mover.frameAt(this.clock, walkRate, reactRate, frames, idleRate ?? 0),
      feetX, feetY, mover.height,
    );
    if (!drawn) {
      this.drawFigure(feetX, feetY, mover.height, this.screen.role('overlayBg'));
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
    scratch.clearRect(0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    const screenContext = this.screen.borrow(scratch);
    try {
      draw();
    } finally {
      this.screen.borrow(screenContext);
    }
    scratch.globalCompositeOperation = 'destination-out';
    if (mask) scratch.drawImage(mask, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    for (const extra of stateMasks) scratch.drawImage(extra, 0, 0, NATIVE_WIDTH, PLAY_HEIGHT);
    scratch.globalCompositeOperation = 'source-over';
    screenContext.drawImage(scratch.canvas, 0, 0);
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
    const index = Math.floor((this.clock * declared.rate + phase) * 2) % declared.frames.length;
    const [sx, sy, width, height] = declared.frames[
      (index + declared.frames.length) % declared.frames.length
    ] as [number, number, number, number];
    this.screen.context.drawImage(image, sx, sy, width, height,
      npc.x - Math.floor(width / 2), npc.y - height + 1, width, height);
    return true;
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

  private drawSay(lines: string[]): void {
    lines.forEach((line, index) => {
      this.font.drawCentredOutlined(
        this.screen.context,
        line,
        NATIVE_WIDTH / 2,
        SAY_TOP + index * DIALOGUE_LINE_HEIGHT,
        this.screen.roleColour('inkBright'),
        this.screen.roleColour('overlayBg'),
      );
    });
  }

  /** A bark sits over the character who said it, not at the top of the screen. */
  private drawBark(lines: string[], at: { x: number; y: number }): void {
    lines.forEach((line, index) => {
      const y = at.y - (lines.length - index) * DIALOGUE_LINE_HEIGHT;
      const width = this.font.measure(line);
      const x = Math.max(2, Math.min(NATIVE_WIDTH - width - 2, at.x - Math.round(width / 2)));
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
    this.font.draw(ctx, menu.title(), MENU_X + 6, MENU_TOP + 3, this.screen.roleColour('inkBright'));

    for (const [index, row] of rows.entries()) {
      const y = MENU_TOP + MENU_ROW * (index + 1);
      // A disabled row is drawn dim and still drawn: a menu that changes
      // length depending on whether a save exists is harder to learn.
      const colour = this.screen.roleColour(row.enabled ? 'ink' : 'inkDim');
      this.font.draw(ctx, row.label, MENU_X + 8, y + 3, colour);
    }
  }

  private drawDialogue(): void {
    const node = this.state.dialogue.currentNode;
    if (!node) return;
    const ui = this.state.content.ui.dialogue;
    const ctx = this.screen.context;

    const options = this.state.dialogue.presentOptions();
    const top = dialogueTop(options.length);
    // Backing over the panel always, and over the play area only by however
    // much the options actually overflow it.
    this.screen.fill(0, Math.min(top - 2, PANEL_Y), NATIVE_WIDTH,
      NATIVE_HEIGHT - Math.min(top - 2, PANEL_Y), this.screen.role('overlayBg'));

    // The prompt goes in the sentence line's slot. Nothing else is using it:
    // there is no hovering during a conversation.
    if (node.prompt) {
      const { x: px, y: py } = this.panel.sentence;
      this.font.draw(ctx, node.prompt, px, py, this.screen.roleColour('inkBright'));
    }

    options.forEach((presented, index) => {
      const prefix = presented.exhausted ? ui.exhaustedPrefix : ui.optionPrefix;
      const colour = this.screen.roleColour(presented.exhausted ? 'inkDim' : 'ink');
      this.font.draw(
        ctx,
        `${prefix}${presented.option.text}`,
        TEXT_MARGIN,
        top + index * DIALOGUE_LINE_HEIGHT + 1,
        colour,
      );
    });
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
    this.font.draw(ctx, sentence, sx, sy, this.screen.roleColour('inkBright'));

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
      this.font.draw(
        ctx,
        verb.label,
        rect.x + 3,
        rect.y + 2,
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
    const labelX = button.x + Math.floor((button.width - this.font.measure(label)) / 2);
    this.font.draw(ctx, label, labelX, button.y + 2, this.screen.roleColour('ink'));

    // Doc 20 rule 2. Beside MENU, and it says BACK while the map is open --
    // the same button, because a screen you can enter and not leave by the
    // way you came in is a trap, and travel is instant either way.
    const map = this.panel.mapButton;
    if (map && words) {
      const open = this.state.isMap;
      this.screen.fill(map.x, map.y, map.width, map.height,
        this.screen.role(open ? 'buttonBgActive' : 'buttonBg'));
      const text = open ? words.back : words.button;
      const x = map.x + Math.floor((map.width - this.font.measure(text)) / 2);
      this.font.draw(ctx, text, x, map.y + 2, this.screen.roleColour('ink'));
    }
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
        this.screen.context.drawImage(sheet, cell[0], cell[1], cell[2], cell[3],
          slot.x, slot.y, cell[2], cell[3]);
      } else {
        // No icon drawn for this item yet. A labelled box is a visible gap;
        // an empty one is an item the player cannot see they are carrying.
        this.screen.outline(slot.x, slot.y, slot.width, slot.height,
          this.screen.role('inkDim'));
        this.font.draw(this.screen.context, this.state.itemLabel(slot.id).slice(0, 4),
          slot.x + 2, slot.y + 2, this.screen.roleColour('inkDim'));
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
    const rows = 4;
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
    if (verb === this.state.verbs.walkVerbId) {
      return format(ui.sentence.walkTemplate, { verb: verbLabel });
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
