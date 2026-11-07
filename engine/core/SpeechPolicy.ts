/**
 * HOW A LINE ON THE SPEECH CHANNEL COMES DOWN, AND WHO A CLICK BELONGS TO.
 *
 * Phaser-free so the rule has a test, the way `playfieldClick` in Opening.ts
 * does: a decision made by an `if` inside an event handler cannot be tested,
 * and this one was wrong for long enough that it broke both ends of the game
 * (the bookends audit, finding 1).
 *
 * WHAT WAS WRONG. Only a conversation's greeting and an arrival scene with an
 * outcome chained on their own. Every other queued line -- a verb response's
 * `then`, Main Street's first sight, a door's beat, the filing's read-backs,
 * the close and its letter -- showed its first line for its reading hold,
 * went blank, and then waited for a click nobody was told to give. The click
 * that came was spent revealing the next line: the first click on Main Street
 * did not walk Thad, a click on the map's undertaker went nowhere, and the
 * letter at the end of the game sat on a black screen for ever.
 *
 * THE RULE NOW:
 * - A conversation's lines (its greeting, its exchanges) wait for a click when
 *   Tyler's click-to-read ruling is on (ui.json conversationWaitsForClick,
 *   2026-11-01), and stay on screen while they wait.
 * - Every other line comes down on doc 30 section 4.1's reading hold, and the
 *   next queued line follows it by itself.
 * - A click outside a conversation is never spent on the speech channel: it
 *   walks, uses a verb or travels, and the lines keep playing.
 */

export interface LineContext {
  /** A dialogue tree is open, or its greeting is being said. */
  conversation: boolean;
  /** ui.json `conversationWaitsForClick`. */
  clickToRead: boolean;
  /** The line is a bare pause, "…" (doc 58 rule 2). */
  rest?: boolean;
}

/**
 * A BARE PAUSE IS A REST, NOT A LINE TO CLICK THROUGH (errata 133; the
 * bookends audit, finding 9). Doc 58 rule 2 shows `(beat)` and `(pause)` as
 * the character saying "…"; under click-to-read each one stood on screen as
 * a floating ellipsis waiting for a click. It is still shown, and now it
 * holds for its reading hold and gives way by itself, as a pause does.
 */
export function isRest(line: string | null | undefined): boolean {
  return typeof line === 'string' && /^\s*(…|\.\.\.)\s*$/.test(line);
}

/** Whether the line going up now waits for a click (true) or comes down on its hold (false). */
export function waitsForClick(line: LineContext): boolean {
  return line.conversation && line.clickToRead && !line.rest;
}

/** A line's hold is over: the next queued line follows, or the channel goes quiet. */
export function holdOver(queued: number): 'next' | 'down' {
  return queued > 0 ? 'next' : 'down';
}

/**
 * A click arrived while something is on the speech channel. `advance` spends
 * it on the next line; `through` lets it do what the player clicked for.
 * Only a line that is waiting for a click takes one.
 */
export function clickOnSpeech(line: { waiting: boolean }): 'advance' | 'through' {
  return line.waiting ? 'advance' : 'through';
}
