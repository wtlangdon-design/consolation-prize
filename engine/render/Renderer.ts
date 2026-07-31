import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import type { Actor } from '../core/Actor.ts';
import type { AmbientLayer } from '../core/Ambient.ts';
import type { AmbientFile, Interactable } from '../core/types.ts';
import { ActorSprite } from './ActorSprite.ts';
import { BitmapFont } from './BitmapFont.ts';
import { IdleLayer } from './IdleLayer.ts';
import {
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
}

/** Composed room images, keyed by room id. Used for both planes. */
export type BackgroundSource = (roomId: string) => CanvasImageSource | null;

const DIALOGUE_TOP = 84;
const DIALOGUE_LINE_HEIGHT = 9;
const SAY_TOP = 8;
const TEXT_MARGIN = 6;

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

  private readonly actor: Actor;
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
    actor: Actor,
    ambient: AmbientLayer,
    background: BackgroundSource,
    foreground: BackgroundSource = () => null,
    idleSheet: BackgroundSource = () => null,
    sheet: (path: string) => CanvasImageSource | null = () => null,
  ) {
    this.screen = screen;
    this.font = font;
    this.state = state;
    this.actor = actor;
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
    return options.map((presented, index) => ({
      id: presented.option.id,
      y: DIALOGUE_TOP + index * DIALOGUE_LINE_HEIGHT,
      height: DIALOGUE_LINE_HEIGHT,
    }));
  }

  drawFrame(frame: Frame): void {
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
    this.drawPanel(frame);
    // Last, so it sits over everything including the panel.
    this.drawMenu();
  }

  private drawRoom(): void {
    const room = this.state.room;
    const image = this.background(room.id);
    if (image) {
      this.screen.context.drawImage(image, 0, 0);
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
      if (image) this.screen.context.drawImage(image, 0, 0);
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
    if (image) this.screen.context.drawImage(image, 0, 0);
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
    const drawables: { feetX: number; feetY: number; draw: () => void }[] = [];

    for (const npc of this.ambient.present) {
      drawables.push({
        feetX: npc.x,
        feetY: npc.y,
        draw: () => {
          if (!this.drawAmbient(npc)) {
            this.drawFigure(npc.x, npc.y, this.state.heightForZone(npc.zone),
              this.screen.role('outline'));
          }
        },
      });
    }

    const feetX = Math.round(this.actor.x);
    const feetY = Math.round(this.actor.y);
    drawables.push({ feetX, feetY, draw: () => this.drawActor(feetX, feetY) });

    // Stable by construction: ambient characters keep their declared order
    // among themselves when they share a row, so a tie does not flicker.
    drawables.sort((a, b) => a.feetY - b.feetY);
    for (const drawable of drawables) {
      this.masked(drawable.feetX, drawable.feetY, drawable.draw);
    }
  }

  private drawActor(feetX: number, feetY: number): void {
    const surface = this.actor.surfaceHere();
    const clip = this.actor.clip;
    const { walkRate, reactRate } = this.state.content.actor;
    const frames = this.sprite?.frameCount(clip, this.actor.facing, surface, this.actor.height) ?? 1;
    const frame = this.actor.frameAt(this.clock, walkRate, reactRate, frames);
    const drawn = this.sprite?.draw(this.screen.context, clip, this.actor.facing, surface,
      frame, feetX, feetY, this.actor.height);
    if (!drawn) {
      this.drawFigure(feetX, feetY, this.actor.height, this.screen.role('overlayBg'));
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
    if (mask) scratch.drawImage(mask, 0, 0);
    for (const extra of stateMasks) scratch.drawImage(extra, 0, 0);
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

    this.screen.fill(0, DIALOGUE_TOP - 14, NATIVE_WIDTH, PLAY_HEIGHT - DIALOGUE_TOP + 14, this.screen.role('overlayBg'));
    this.font.draw(ctx, node.prompt, TEXT_MARGIN, DIALOGUE_TOP - 12, this.screen.roleColour('inkBright'));

    const options = this.state.dialogue.presentOptions();
    options.forEach((presented, index) => {
      const prefix = presented.exhausted ? ui.exhaustedPrefix : ui.optionPrefix;
      const colour = this.screen.roleColour(presented.exhausted ? 'inkDim' : 'ink');
      this.font.draw(
        ctx,
        `${prefix}${presented.option.text}`,
        TEXT_MARGIN,
        DIALOGUE_TOP + index * DIALOGUE_LINE_HEIGHT,
        colour,
      );
    });
  }

  private drawPanel(frame: Frame): void {
    const ctx = this.screen.context;
    const { verbs } = this.state.content;

    this.screen.fill(0, PANEL_Y, NATIVE_WIDTH, PANEL_HEIGHT, this.screen.role('panelBg'));

    const sentence = frame.notice ?? this.sentenceText(frame.hoveredTarget, frame.hoveredTargetName);
    const { x: sx, y: sy } = this.panel.sentence;
    this.font.draw(ctx, sentence, sx, sy, this.screen.roleColour('inkBright'));

    for (const verb of verbs.verbs) {
      const rect = this.panel.verbButton(verb.col, verb.row);
      const active = verb.id === this.state.verbs.selectedVerb;
      this.screen.fill(rect.x, rect.y, rect.width, rect.height, this.screen.role(active ? 'buttonBgActive' : 'buttonBg'));
      this.font.draw(
        ctx,
        verb.label,
        rect.x + 3,
        rect.y + 2,
        this.screen.roleColour(active ? 'inkBright' : 'ink'),
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
