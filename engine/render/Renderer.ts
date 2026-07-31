import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import type { Actor } from '../core/Actor.ts';
import type { AmbientLayer } from '../core/Ambient.ts';
import type { AmbientFile } from '../core/types.ts';
import { ActorSprite } from './ActorSprite.ts';
import { BitmapFont } from './BitmapFont.ts';
import { IdleLayer } from './IdleLayer.ts';
import {
  INVENTORY_SLOT_WIDTH,
  INVENTORY_STRIP,
  MENU_BUTTON,
  NATIVE_WIDTH,
  PANEL_HEIGHT,
  PANEL_Y,
  PLAY_HEIGHT,
  Screen,
  SENTENCE_Y,
  verbButtonRect,
} from './Screen.ts';

export interface Frame {
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
   * The near plane, over the actor. Ruling 21a.
   *
   * It is also baked into the composed background, so a room whose overlay
   * fails to load still looks right -- the actor stands in front of it
   * instead of behind it, which is a depth error rather than a hole in the
   * picture. Drawing the same pixels twice costs one blit at 320x144.
   */
  private drawForeground(): void {
    const image = this.foreground(this.state.room.id);
    if (image) this.screen.context.drawImage(image, 0, 0);
  }

  /**
   * The people, back to front: ambient characters, then the player.
   *
   * Both are real sprites now. The block silhouettes are kept only as the
   * fallback for a sheet that has not loaded -- a missing sheet should be a
   * figure that looks wrong, not a screen with no protagonist on it.
   */
  private drawPeople(): void {
    for (const npc of this.ambient.present) {
      if (!this.drawAmbient(npc)) {
        this.drawFigure(npc.x, npc.y, this.state.heightForZone(npc.zone),
          this.screen.role('outline'));
      }
    }
    const feetX = Math.round(this.actor.x);
    const feetY = Math.round(this.actor.y);
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

    const sentence = frame.notice ?? this.sentenceText(frame.hoveredTargetName);
    this.font.draw(ctx, sentence, TEXT_MARGIN, SENTENCE_Y, this.screen.roleColour('inkBright'));

    for (const verb of verbs.verbs) {
      const rect = verbButtonRect(verb.col, verb.row);
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
    this.screen.fill(MENU_BUTTON.x, MENU_BUTTON.y, MENU_BUTTON.width, MENU_BUTTON.height,
      this.screen.role(menu.isOpen ? 'buttonBgActive' : 'buttonBg'));
    const label = menu.buttonLabel;
    const labelX = MENU_BUTTON.x + Math.floor((MENU_BUTTON.width - this.font.measure(label)) / 2);
    this.font.draw(ctx, label, labelX, MENU_BUTTON.y + 1, this.screen.roleColour('ink'));
  }

  /** Slot hitboxes for what the player is carrying, in draw order. */
  inventoryHitboxes(): { id: string; x: number; width: number; y: number; height: number }[] {
    return this.state.carried.map((id, index) => ({
      id,
      x: INVENTORY_STRIP.x + index * INVENTORY_SLOT_WIDTH,
      width: INVENTORY_SLOT_WIDTH - 2,
      y: INVENTORY_STRIP.y,
      height: INVENTORY_STRIP.height,
    }));
  }

  private drawInventory(): void {
    for (const slot of this.inventoryHitboxes()) {
      const held = this.state.heldItem === slot.id;
      this.screen.fill(slot.x, slot.y, slot.width, slot.height,
        this.screen.role(held ? 'buttonBgActive' : 'buttonBg'));
      this.font.draw(this.screen.context, this.state.itemNamed(slot.id), slot.x + 2,
        slot.y + 1, this.screen.roleColour(held ? 'inkBright' : 'ink'));
    }
  }

  private sentenceText(targetName: string | null): string {
    const { ui } = this.state.content;
    const verbLabel = this.state.verbs.labelFor(this.state.verbs.selectedVerb);
    const held = this.state.heldItem;
    // With an item picked up the sentence gains a middle: the verb applies
    // WITH the item TO the target. Both halves are named, because a player
    // holding something and reading "Use the trough" cannot tell whether the
    // fork is in the sentence or not.
    if (held) {
      const item = this.state.itemNamed(held);
      if (!targetName) return format(ui.sentence.itemOnly, { verb: verbLabel, item });
      return format(ui.sentence.itemTemplate, { verb: verbLabel, item, target: targetName });
    }
    if (!targetName) {
      return format(ui.sentence.verbOnly, { verb: verbLabel });
    }
    return format(ui.sentence.template, { verb: verbLabel, target: targetName });
  }
}
