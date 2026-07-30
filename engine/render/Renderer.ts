import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import type { Actor } from '../core/Actor.ts';
import type { AmbientLayer } from '../core/Ambient.ts';
import { BitmapFont } from './BitmapFont.ts';
import {
  HUD_Y,
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

/** Composed room backgrounds, keyed by room id. */
export type BackgroundSource = (roomId: string) => CanvasImageSource | null;

const DIALOGUE_TOP = 84;
const DIALOGUE_LINE_HEIGHT = 9;
const SAY_TOP = 8;
const TEXT_MARGIN = 6;

/** Fills `{name}` placeholders from the supplied map. */
export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

export class Renderer {
  private readonly screen: Screen;
  private readonly font: BitmapFont;
  private readonly state: GameState;

  private readonly actor: Actor;
  private readonly ambient: AmbientLayer;
  private readonly background: BackgroundSource;

  constructor(
    screen: Screen,
    font: BitmapFont,
    state: GameState,
    actor: Actor,
    ambient: AmbientLayer,
    background: BackgroundSource,
  ) {
    this.screen = screen;
    this.font = font;
    this.state = state;
    this.actor = actor;
    this.ambient = ambient;
    this.background = background;
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
    this.drawPeople();
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
   * Placeholder figures. Solid silhouettes at the zone's drawn height --
   * deliberately not scaled smoothly, so a zone crossing is visible as the
   * snap it is rather than hidden behind a tween.
   */
  private drawPeople(): void {
    for (const npc of this.ambient.present) {
      this.drawFigure(npc.x, npc.y, this.state.heightForZone(npc.zone), this.screen.role('outline'));
    }
    this.drawFigure(
      Math.round(this.actor.x),
      Math.round(this.actor.y),
      this.actor.height,
      this.screen.role('overlayBg'),
    );
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
    const { ui, verbs } = this.state.content;

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

    const hint = format(ui.hud.hintTemplate, ui.keys);
    this.font.draw(ctx, hint, TEXT_MARGIN, HUD_Y, this.screen.roleColour('inkDim'));
  }

  private sentenceText(targetName: string | null): string {
    const { ui } = this.state.content;
    const verbLabel = this.state.verbs.labelFor(this.state.verbs.selectedVerb);
    if (!targetName) {
      return format(ui.sentence.verbOnly, { verb: verbLabel });
    }
    return format(ui.sentence.template, { verb: verbLabel, target: targetName });
  }
}
