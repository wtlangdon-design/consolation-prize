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
  /**
   * The frame file the renderer actually took, or null if it drew a
   * placeholder. GATE 7 IS THIS FIELD. A proof that says a character is on
   * screen and cannot say which file drew him cannot tell a current sheet
   * from a stale one, and "the room looks right" is exactly how a stale sheet
   * survives -- it looked right the last time too.
   */
  from: string | null;
  /**
   * The destination rectangle, `[x, y, width, height]`, in ROOM coordinates.
   * Gate 8B compares its baseline against the authoritative feet position;
   * gate 8D needs the extents to establish that two figures overlap at all
   * before it says anything about which is in front.
   *
   * Null when a placeholder drew, because a placeholder has no sprite bounds
   * to report and reporting the graybox's would be reporting a different
   * thing under the same name.
   */
  bounds: [number, number, number, number] | null;
  /** Position in the frame's depth-sorted draw order. Lower draws first. */
  order: number;
  /** The occlusion plane of the walk box it stands in. 0 is masked by nothing. */
  clipLevel: number;
  /**
   * True when the clip asked for had not loaded and a spare pose drew instead.
   *
   * A FALLBACK IS A PROOF FAILURE EVEN THOUGH THE PICTURE LOOKS FINE. That is
   * the whole reason it is reported: the frame shows a character in a
   * plausible pose, and the pose is not the one the scene asked for.
   */
  fallback: boolean;
}

/** What `Renderer` hands back per mover. Kept beside the report it feeds. */
export interface DrawRecord {
  order: number;
  clipLevel: number;
  from: string | null;
  bounds: [number, number, number, number] | null;
  fallback: boolean;
}

export interface FrameReport {
  /** The room the game is in. A route that waits for one needs to see it. */
  room: string;
  frame: number;
  clock: number;
  /** The beat playing, from whichever runner is playing it. Null if none. */
  beat: string | null;
  /**
   * A beat that is ARMED and waiting on a flag the player has not written.
   *
   * IT IS NOT `beat`, AND CONFLATING THEM MAKES A CORRECT WAIT LOOK LIKE A
   * HANG. Doc 17 beat 9 holds on `T_HOB_SPOKEN`: Hob stands at the roadside
   * with his lamp until somebody addresses him, which Q63 ruled deliberately
   * -- "a player who never speaks to him leaves a man standing at the roadside
   * with his lamp, which is the truthful state and not a stall." A harness
   * that reads that as beat 9 playing waits out its own deadline against a
   * game doing exactly what it was told.
   */
  waitingBeat: string | null;
  control: string | null;
  movers: Record<string, MoverReport>;
  overlays: Record<string, string | null>;
  /** The speaker of the line on screen, or null. Never the words. */
  says: string | null;
  /** How many dialogue options are on offer. Errata 37 is revoked: none vanish. */
  options: number;
  /**
   * The room's own shipping asset paths, as the ROOM FILE declares them.
   *
   * Reported rather than derived by the harness from the same JSON, because
   * the question gate 7 asks is what the RUNTIME resolved -- a room whose
   * background failed to load and drew nothing would still have a path in its
   * content file, and a harness reading the file would confirm the path it
   * had just read. `loaded` is the half the file cannot answer.
   */
  assets: { key: string; path: string; loaded: boolean }[];
  /** Flags currently true. Identifiers, never content. */
  flags: string[];
  /** Numeric flags and their values. Errata 60's ACT is one of these. */
  counters: Record<string, number>;
  /** Item ids the player is carrying. Identifiers, never content. */
  inventory: string[];
  /**
   * The camera's left edge, in room coordinates.
   *
   * A ROUTE CANNOT CLICK A WIDE ROOM WITHOUT IT. Main Street is 3700 across
   * with the view following, so a hotspot at world x2900 is not at screen
   * x2900 and is frequently not on screen at all -- and a click computed
   * without this lands on whatever happens to be under it, writes no flag, and
   * holds until a deadline. That is the exact fault doc 36 Q67 records for the
   * gauntlet's beat 9 click, one level up.
   */
  camera: number;
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
  /**
   * The frame as a PNG data URL, or null before the scene exists.
   *
   * NOTHING IN THIS PROJECT HAD EVER CAPTURED A REAL FRAME HEADLESSLY, and
   * the gauntlet's own smoke test says so: it checks that a JPEG exceeds four
   * thousand bytes and admits "this does not claim the picture is right".
   * Every other route returns black, because the game draws into a Phaser
   * CanvasTexture -- an OFFSCREEN 2D canvas -- which Phaser blits to a WebGL
   * canvas, and headless WebGL composites nothing.
   *
   * The 2D canvas is the picture. Reading it directly is the only capture
   * that works, and it is also the truest one: it is the frame the renderer
   * drew, before any scaling or presentation.
   */
  snapshot(): string | null;
  report(): FrameReport;
  /** Where option `index` (1-based, as a player counts) is drawn, if it is. */
  optionRow(index: number): { id: string; y: number; height: number } | null;
  /** Backs `Controls`. Implemented by the scene, which owns the state. */
  readonly controls: Controls;
}

/**
 * THE CONTROL SURFACE, AND IT IS DELIBERATELY SHORT.
 *
 * The probe is observational and stays that way. These are the four things a
 * room proof cannot obtain by observing, each named individually rather than
 * exposed as a general setter, because "set any field on the scene" is an API
 * whose blast radius is the whole engine and whose users are scripts nobody
 * reviews.
 *
 * WHAT IS DELIBERATELY ABSENT: there is no `setState`, no `call`, no handle on
 * the scene, no way to move a mover other than the protagonist, no way to
 * write a flag that the flag registry does not declare, and no way to place a
 * figure off the floor. Every one of those was easy to add and every one would
 * have made a green proof mean less, because a proof that can put the game in
 * a state the game cannot reach is a proof about a state nobody will ever see.
 *
 * ALL FOUR ARE LOGGED. `writes()` returns what was done to the game, and the
 * proof records it beside its panels -- a panel reached by playing and a panel
 * reached by injection are both legitimate and they are not the same evidence.
 */
export interface Controls {
  /**
   * Draw the room without its cast. PANEL A.
   *
   * RENDER-ONLY, AND THAT DISTINCTION IS THE POINT. Nothing is removed from
   * the game: the movers still exist, still walk, still hold their state. The
   * renderer simply does not put them down, so what is left on screen is
   * exactly the permanent plate and its layers -- which is the only way to see
   * a mover that has been BAKED INTO the plate, because a baked one does not
   * go away when the real ones do.
   */
  cast(on: boolean): void;
  /**
   * Put the protagonist's feet on a point. PANEL C.
   *
   * REFUSES A POINT OFF THE FLOOR, and returns why. A depth test run at a
   * coordinate no walk box covers measures the scaling curve's behaviour
   * outside its own domain and reports it as the room's, which is a number
   * that looks like evidence and is not.
   */
  stand(x: number, y: number): { ok: boolean; why?: string };
  /**
   * Write declared flags. PANEL D.
   *
   * ONLY IDS `content/flags/flags.json` DECLARES. An undeclared id is refused
   * by name rather than written, because a flag the registry does not know
   * about is one no content gates on, so setting it proves nothing and
   * silently diverges the save from every check that reads the registry.
   */
  flags(values: Record<string, boolean | number>): { ok: boolean; refused: string[] };
  /** Go to a room by id, as the `?room=` warp does. Refuses an unknown id. */
  enter(roomId: string): { ok: boolean; why?: string };
  /** Everything these controls have done to the game, in order. */
  writes(): string[];
}

export interface Gauntlet {
  arm(config: { band?: [number, number]; bandExempt?: string[] }): void;
  probe(): FrameReport | null;
  violations(): { violations: Violation[]; counts: Record<string, number>; dropped: number };
  /** Clears the violation log without disarming, between runs. */
  reset(): void;
  /** Switches the watch off entirely, for the without-the-instrument run. */
  disarm(): void;
  /** The current frame as a PNG data URL. See Probeable.snapshot. */
  snapshot(): string | null;
  /**
   * The row a dialogue option is drawn on, so a driver can click it.
   *
   * IT IS HERE BECAUSE IT WAS REACHING PAST THE PROBE. `tools/gauntlet/run.mjs`
   * fetched the scene out of `window.__game.scene.getScene('game')` and walked
   * `scene.state.dialogue.presentOptions()` and `scene.view.dialogueHitboxes()`
   * -- four private hops to answer one question, every one of which breaks
   * silently when a field is renamed and none of which any check could see.
   * The question is legitimate and observational: where is row N drawn. The
   * route to it was not.
   *
   * Null when the row is not on the list, or while an exchange is performing
   * and the list is not drawn at all -- which is the same answer the renderer
   * gives a real cursor, and is why a harness must not click through it.
   */
  optionRow(index: number): { id: string; y: number; height: number } | null;
  /** The short, enumerated control surface. Never a general setter. */
  controls: Controls;
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
    snapshot: () => {
      const live = scene();
      return live?.probeReady ? live.snapshot() : null;
    },
    optionRow: (index) => {
      const live = scene();
      return live?.probeReady ? live.optionRow(index) : null;
    },
    // A FRESH SCENE EVERY CALL, like `probe`. A control captured at boot would
    // drive the scene a load restarted out from under the harness -- the same
    // fault the probe's callback exists to avoid, and worse here, because a
    // control writes.
    controls: {
      cast: (on) => scene()?.controls.cast(on),
      stand: (x, y) => scene()?.controls.stand(x, y) ?? { ok: false, why: 'no scene' },
      flags: (values) => scene()?.controls.flags(values) ?? { ok: false, refused: [] },
      enter: (roomId) => scene()?.controls.enter(roomId) ?? { ok: false, why: 'no scene' },
      writes: () => scene()?.controls.writes() ?? [],
    },
  };
  target.__gauntlet = handle;
}
