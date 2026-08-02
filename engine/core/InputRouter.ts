import { assertOneConsumer, assertShellReachable } from './Assertions.ts';
import type { InputLayer } from './runtime-types.ts';

/**
 * One ordered input router. Doc 34 section 10.7:
 *
 *   "Route input in this order: confirmation/shell, active dialogue choice,
 *    current-line skip, map/panel, world. One event is consumed by one layer.
 *    The playfield is skip-only during speech, but a reserved mouse-visible
 *    shell control remains reachable."
 *
 * G5 is the collision this settles. D30's exchange table allows skip-current-
 * line only; D33 requires MENU/SAVE/LOAD/OPTIONS to be mouse-reachable and
 * explicitly tests saving during dialogue. Both stand: the playfield takes
 * only the skip, and a reserved shell region takes its click before speech
 * ever sees it. Section 1.2 records that GameScene has this backwards today --
 * `if (this.state.dialogue.isActive)` runs before the MENU hit test, so during
 * a conversation the menu button is unreachable with a mouse.
 *
 * SKIP OUTRANKS THE PANEL, LITERALLY. Section 10.7 puts current-line skip
 * ahead of map/panel, so while a line is up, a click on the verb panel skips
 * the line rather than selecting a verb. That is a real consequence and it is
 * the stated order; the shell control is the exception that keeps it humane,
 * and it is checked on every route.
 *
 * GEOMETRY IS INJECTED. The router owns priority, not layout. It is handed
 * rectangles by whoever knows the panel, so no coordinate and no room id
 * reaches this file.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RouterGeometry {
  /**
   * The reserved mouse-visible shell control. Section 9.2: "Can the player
   * always reach MENU with only the mouse during speech, cutscene and ordinary
   * play without the click also skipping or acting underneath?" Null means it
   * is not on screen, which assertion 12 rejects.
   */
  shellControl(): Rect | null;
  /** The dialogue option list, when one is being offered. */
  choiceList(): Rect | null;
  /** Verb panel, inventory and map button. */
  panel(): Rect | null;
  /** The play area. 1920x864 under errata 54. */
  playfield(): Rect;
}

export interface RouterState {
  /** A modal confirmation, e.g. section 4.4's overwrite or quit prompts. */
  confirmationOpen: boolean;
  shellOpen: boolean;
  choicesActive: boolean;
  speechActive: boolean;
}

export function inside(x: number, y: number, rect: Rect | null): boolean {
  if (!rect) return false;
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

export class InputRouter {
  private readonly geometry: RouterGeometry;
  /** Layers that claimed the event currently being routed. */
  private claimed: InputLayer[] = [];

  constructor(geometry: RouterGeometry) {
    this.geometry = geometry;
  }

  /**
   * The single layer that consumes this event, or null if nothing does.
   *
   * Written as a fall-through chain with one return per layer, so "one event
   * is consumed by one layer" is true by construction and not by convention.
   * `record` exists for the callers that then have to prove it downstream.
   */
  route(state: RouterState, x: number, y: number): InputLayer | null {
    this.claimed = [];

    // The shell control has to be reachable in every mode, so its presence is
    // checked on the way through rather than at construction -- a panel that
    // stops drawing the button mid-conversation is precisely the failure.
    assertShellReachable(this.geometry.shellControl() !== null);

    if (state.confirmationOpen || state.shellOpen) return this.take('shell');
    if (inside(x, y, this.geometry.shellControl())) return this.take('shell');
    if (state.choicesActive && inside(x, y, this.geometry.choiceList())) return this.take('choice');
    if (state.speechActive) return this.take('speechSkip');
    if (inside(x, y, this.geometry.panel())) return this.take('panel');
    if (inside(x, y, this.geometry.playfield())) return this.take('world');
    return null;
  }

  /**
   * Records that a layer consumed the current event. Assertion 12 fires on the
   * second one.
   *
   * The router cannot see what its callers do after it answers, and G5's bug
   * is exactly a caller acting twice. So a caller that dispatches by hand
   * reports here and the guard catches the double consumption at the moment it
   * happens rather than in the resulting save file.
   */
  record(layer: InputLayer): void {
    this.claimed.push(layer);
    assertOneConsumer(this.claimed);
  }

  /** Which layers claimed the event being routed. Test and debug surface. */
  get consumers(): readonly InputLayer[] {
    return [...this.claimed];
  }

  private take(layer: InputLayer): InputLayer {
    this.record(layer);
    return layer;
  }
}
