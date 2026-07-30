import type { GameState } from '../core/GameState.ts';
import type { PresentedOption } from '../core/DialogueRunner.ts';
import { BitmapFont } from './BitmapFont.ts';
import {
  HUD_Y,
  NATIVE_WIDTH,
  PANEL_HEIGHT,
  PANEL_Y,
  PLAY_HEIGHT,
  Screen,
  SENTENCE_Y,
  UI_BUTTON_BG,
  UI_BUTTON_BG_ACTIVE,
  UI_INK,
  UI_INK_BRIGHT,
  UI_INK_DIM,
  UI_OVERLAY_BG,
  UI_PANEL_BG,
  verbButtonRect,
} from './Screen.ts';

export interface Frame {
  hoveredTargetName: string | null;
  sayLines: string[];
  notice: string | null;
}

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

  constructor(screen: Screen, font: BitmapFont, state: GameState) {
    this.screen = screen;
    this.font = font;
    this.state = state;
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
    // The response to an option is drawn above the option list, not instead
    // of it -- otherwise picking an option appears to do nothing.
    this.drawSay(frame.sayLines);
    if (this.state.dialogue.isActive) {
      this.drawDialogue();
    }
    this.drawPanel(frame);
  }

  private drawRoom(): void {
    const room = this.state.room;
    this.screen.fill(0, 0, NATIVE_WIDTH, room.horizon, room.colours.sky);
    this.screen.fill(0, room.horizon, NATIVE_WIDTH, PLAY_HEIGHT - room.horizon, room.colours.ground);

    for (const target of this.state.targets) {
      const [x, y, width, height] = target.rect;
      this.screen.fill(x, y, width, height, target.colour);
      this.screen.outline(x, y, width, height, UI_INK_DIM);
    }
  }

  private drawSay(lines: string[]): void {
    lines.forEach((line, index) => {
      this.font.drawCentred(
        this.screen.context,
        line,
        NATIVE_WIDTH / 2,
        SAY_TOP + index * DIALOGUE_LINE_HEIGHT,
        this.screen.colour(UI_INK_BRIGHT),
      );
    });
  }

  private drawDialogue(): void {
    const node = this.state.dialogue.currentNode;
    if (!node) return;
    const ui = this.state.content.ui.dialogue;
    const ctx = this.screen.context;

    this.screen.fill(0, DIALOGUE_TOP - 14, NATIVE_WIDTH, PLAY_HEIGHT - DIALOGUE_TOP + 14, UI_OVERLAY_BG);
    this.font.draw(ctx, node.prompt, TEXT_MARGIN, DIALOGUE_TOP - 12, this.screen.colour(UI_INK_BRIGHT));

    const options = this.state.dialogue.presentOptions();
    options.forEach((presented, index) => {
      const prefix = presented.exhausted ? ui.exhaustedPrefix : ui.optionPrefix;
      const colour = this.screen.colour(presented.exhausted ? UI_INK_DIM : UI_INK);
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

    this.screen.fill(0, PANEL_Y, NATIVE_WIDTH, PANEL_HEIGHT, UI_PANEL_BG);

    const sentence = frame.notice ?? this.sentenceText(frame.hoveredTargetName);
    this.font.draw(ctx, sentence, TEXT_MARGIN, SENTENCE_Y, this.screen.colour(UI_INK_BRIGHT));

    for (const verb of verbs.verbs) {
      const rect = verbButtonRect(verb.col, verb.row);
      const active = verb.id === this.state.verbs.selectedVerb;
      this.screen.fill(rect.x, rect.y, rect.width, rect.height, active ? UI_BUTTON_BG_ACTIVE : UI_BUTTON_BG);
      this.font.draw(
        ctx,
        verb.label,
        rect.x + 3,
        rect.y + 2,
        this.screen.colour(active ? UI_INK_BRIGHT : UI_INK),
      );
    }

    const hint = format(ui.hud.hintTemplate, ui.keys);
    this.font.draw(ctx, hint, TEXT_MARGIN, HUD_Y, this.screen.colour(UI_INK_DIM));
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
