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
 *   2026-11-01), and stay on screen while they wait -- all but Thad's echo of
 *   the option just chosen, which comes down on its reading hold (Tyler,
 *   2026-11-06, errata 147).
 * - Every other line comes down on doc 30 section 4.1's reading hold, and the
 *   next queued line follows it by itself.
 * - A click outside a conversation is never spent on the speech channel: it
 *   walks, uses a verb or travels, and the lines keep playing.
 * - UNLESS THE PLAYER HAS SET TEXT SPEED TO MANUAL (errata 154 A; doc 30
 *   table 2: "Every utterance remains until the player advances it"; doc 33
 *   table 6: "MANUAL never advances a line automatically"). Then every line
 *   waits for its click -- in conversation or not, Thad's echo included --
 *   and the click is spent on it, one line a click (doc 30 section 4.2). A
 *   bare pause still gives way on its hold: it is an authored pause, and
 *   doc 30 keeps those "unchanged" at every text speed.
 */

export interface LineContext {
  /** A dialogue tree is open, or its greeting is being said. */
  conversation: boolean;
  /** ui.json `conversationWaitsForClick`. */
  clickToRead: boolean;
  /** The line is a bare pause, "…" (doc 58 rule 2). */
  rest?: boolean;
  /**
   * The line is THAD'S ECHO of the option just chosen (doc 30 section 6.2).
   * Tyler, 2026-11-06 (errata 147): "Echo moves on by itself". The player
   * has just picked those words, so the echo advances on its reading hold and
   * never waits; the answer to it still does.
   */
  echo?: boolean;
  /** Text speed is MANUAL (errata 154 A): every line but a rest waits. */
  manual?: boolean;
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
  if (line.rest) return false;
  if (line.manual) return true;
  return line.conversation && line.clickToRead && !line.echo;
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
