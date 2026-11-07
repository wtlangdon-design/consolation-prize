/**
 * THE TITLE AND THE CLOSE, AS STATE (errata 128; the bookends audit,
 * findings 2 and 3). Phaser-free, so both have tests.
 *
 * THE TITLE. Doc 36 Q59 specified it and doc 33 table 5 says how it behaves:
 * NEW GAME always; CONTINUE visible and dim with no save; OPTIONS; CREDITS.
 * Nothing on it is written here -- every label is content/ui/title.json's.
 * CREDITS is inert: its words are Tyler's and no document has them.
 *
 * THE CLOSE. After the letter's last line the game had nowhere to go: the play
 * area stayed black for ever over a live verb panel. Now the letter, built
 * line by line on one page, holds; fades; the screen stays black a moment; and
 * the title returns. The phases are a function of time since the last line
 * came down, so the scene only has to ask.
 */
import type { TitleFile } from './types.ts';

export interface TitleItem {
  id: string;
  label: string;
  enabled: boolean;
}

/** The title's menu, in its content order: the same length every time. */
export function titleItems(file: TitleFile, canContinue: boolean): TitleItem[] {
  return file.menu.items.map((item) => ({
    id: item.id,
    label: item.label,
    enabled: item.id === 'continue' ? canContinue
      // No document writes the credits (doc 48 S7 beat 5; doc 45 OQ-08).
      : item.id !== 'credits',
  }));
}

/**
 * THE BEGIN CARD (errata 155). A browser plays nothing until the page has been
 * clicked, and the title's first click was nearly always NEW GAME -- so its
 * bed, O-01-M, was never heard. A boot onto the title with sound still locked
 * shows `begin` alone first; the click on it unlocks sound, and the title
 * comes up with its bed playing. With sound already unlocked (Quit to Title,
 * the close) there is nothing to wait for and no card.
 */
export function bootsToBeginCard(file: TitleFile, soundUnlocked: boolean): boolean {
  return Boolean(file.begin) && !soundUnlocked;
}

export interface EndingTiming {
  hold: number;
  fade: number;
  black: number;
}

export type EndingPhase = 'hold' | 'fade' | 'black' | 'title';

/**
 * Where the close is, `elapsed` seconds after the letter's last line came
 * down: the page holds, then fades (`pageAlpha` 1 to 0), then the screen is
 * black, then the title.
 */
export function endingAt(elapsed: number, timing: EndingTiming): { phase: EndingPhase; pageAlpha: number } {
  if (elapsed < timing.hold) return { phase: 'hold', pageAlpha: 1 };
  const fading = elapsed - timing.hold;
  if (fading < timing.fade) return { phase: 'fade', pageAlpha: 1 - fading / Math.max(0.001, timing.fade) };
  if (fading - timing.fade < timing.black) return { phase: 'black', pageAlpha: 0 };
  return { phase: 'title', pageAlpha: 0 };
}
