import type { Violation } from './Watch.ts';
import { watch } from './Watch.ts';

/**
 * WHAT THE HARNESS READS. Doc 44 part three.
 *
 * One shape, written down in one place, because two halves that disagree
 * about a field name fail silently: the harness compares `undefined` against
 * an expectation, decides they differ, and reports a defect in the game.
 *
 * IT REPORTS STATE, NOT PIXELS. Every fault this project has diagnosed by
 * reading pixels took longer than it should have, and two of them were
 * decided by an argument about pixels that turned out to be wrong -- 2,064
 * pure-black pixels looked conclusive until the coach's own art was found to
 * hold 2,997 of them. Asking the game what it thinks it is drawing answers
 * in one call what a screenshot argues about for an hour.
 *
 * IT IS DEV-ONLY, AND THAT IS A REAL LIMIT, NOT A DETAIL. `import.meta.env.DEV`
 * strips the handle from the production bundle, so the state assertions run
 * against the dev server and the built artifact gets a screencast smoke pass
 * instead. Every fault found by playing this project has reproduced on the dev
 * server, which makes it a small gap in practice -- but it is a gap, and doc
 * 44 states it rather than implying the deployed build is under the same
 * scrutiny.
 */

export interface MoverReport {
  at: [number, number];
  facing: string;
  clip: string;
  height: number;
  moving: boolean;
  /** How it drew: `sprite`, or which of the three graybox branches. */
  drawn: string;
}

export interface FrameReport {
  frame: number;
  clock: number;
  /** The beat playing, from whichever runner is playing it. Null if none. */
  beat: string | null;
  control: string | null;
  movers: Record<string, MoverReport>;
  overlays: Record<string, string | null>;
  /** The speaker of the line on screen, or null. Never the words. */
  says: string | null;
  /** How many dialogue options are on offer. Errata 37 is revoked: none vanish. */
  options: number;
  /**
   * Lines queued behind the one on screen.
   *
   * A multi-speaker response lands ONE LINE AT A TIME and each needs a click:
   * the player has to see "Hotel's five." before "I have four." A harness that
   * clicked an option row while a line was still queued had its click taken by
   * the queue instead, chose nothing, and waited for a conversation that could
   * not advance. This is what tells it to flush first.
   */
  pending: number;
  /**
   * An exchange is being PERFORMED, so the choice list is hidden and nothing
   * in it can be clicked. Doc 30 section 1.
   *
   * THE HARNESS NEEDED THIS THE MOMENT THE PERFORMANCE EXISTED. It drove the
   * driver's tree by clicking one option after another, which worked while a
   * selection resolved in three lines and stopped working the instant it took
   * seconds -- `dialogueHitboxes` answers with nothing while the list is
   * hidden, so every subsequent click found no row and the run timed out at
   * 180s having never left the tree. `options` cannot say it: `presentOptions`
   * reports four throughout, because what changed is whether they are ON
   * SCREEN, not whether they exist.
   */
  performing: boolean;
  /** True once the opening has handed control to the player. */
  handedOver: boolean;
  /**
   * The opening segment now playing, when one is.
   *
   * A BEAT IS NOT ALWAYS OBSERVABLE AND A SEGMENT ALWAYS IS. Errata 30b makes
   * doc 17's beats 4, 5 and 6 one dialogue tree: no runner holds a beat while
   * the tree is up, so `beat` is null for the whole of the driver's
   * conversation. The first version of the harness therefore never saw beat 4,
   * never drove its input, and sat until its own deadline -- found by running
   * it, which is the only way that was ever going to be found.
   *
   * So the segment is reported alongside, and it says which beats it covers
   * WITHOUT claiming which of them is playing. That claim is not available:
   * a tree is a graph and the beats are a list, and no mapping between them
   * was ever authored.
   */
  segment: { kind: string; beats: string[]; carriedBy: string | null } | null;
}

/** What a scene must be able to answer for the probe to work at all. */
export interface Probeable {
  /**
   * Whether the scene has been built. Phaser hands out a scene object the
   * moment it is registered and runs `create` later, so the probe is asked
   * about a scene whose renderer does not exist yet -- for the whole of boot,
   * which is precisely the window the gauntlet cares most about. Null is the
   * honest answer there; a thrown TypeError is not.
   */
  readonly probeReady: boolean;
  report(): FrameReport;
}

export interface Gauntlet {
  arm(config: { band?: [number, number]; bandExempt?: string[] }): void;
  probe(): FrameReport | null;
  violations(): { violations: Violation[]; counts: Record<string, number>; dropped: number };
  /** Clears the violation log without disarming, between runs. */
  reset(): void;
  /** Switches the watch off entirely, for the without-the-instrument run. */
  disarm(): void;
}

/**
 * Installs the handle. Called once, from a dev build, with the live scene.
 *
 * The scene is fetched through a callback rather than captured, because the
 * scene the harness wants is the one running NOW -- a scene captured at boot
 * is the one that was restarted out from under it by a load.
 */
export function installGauntlet(target: Record<string, unknown>,
                                scene: () => Probeable | null): void {
  const handle: Gauntlet = {
    arm: (config) => watch.arm(config),
    probe: () => {
      const live = scene();
      return live?.probeReady ? live.report() : null;
    },
    violations: () => watch.report(),
    reset: () => watch.reset(),
    disarm: () => watch.enable(false),
  };
  target.__gauntlet = handle;
}
