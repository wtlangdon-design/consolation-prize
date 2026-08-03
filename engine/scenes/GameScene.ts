import Phaser from 'phaser';

import type { GameState } from '../core/GameState.ts';
import type { Exit, Interactable } from '../core/types.ts';
import { Actor, IDLE_BREAK } from '../core/Actor.ts';
import { planBoot } from '../core/BootAssets.ts';
import { RoomActors } from '../core/RoomActors.ts';
import type { FrameReport, MoverReport } from '../dev/Probe.ts';
import { BodyOwners, SequenceWorld } from '../core/SequenceWorld.ts';
import { assertRequiredClip } from '../core/Assertions.ts';
import { AmbientLayer } from '../core/Ambient.ts';
import { mappingAt, resolve, sameMapping } from '../core/PaletteCycling.ts';
import { BitmapFont, GLYPH_SCALE } from '../render/BitmapFont.ts';
import { CyclingBackground } from '../render/CyclingBackground.ts';
import { IdleLayer } from '../render/IdleLayer.ts';
import { Renderer } from '../render/Renderer.ts';
import {
  NATIVE_HEIGHT,
  NATIVE_WIDTH,
  PanelLayout,
  PLAY_HEIGHT,
  Screen,
  pointInRect,
} from '../render/Screen.ts';
import { SequenceRunner, type SequenceStep } from '../core/Sequence.ts';
import { CarriedBeats } from '../core/CarriedBeats.ts';
import {
  actCardOf, playfieldClick, segmentsOf, stepsFor, writesOf, type Segment,
} from '../core/Opening.ts';
import {
  CYCLING_OPTION,
  GAME_SCENE,
  KEY_LOAD_MODIFIED,
  KEY_MENU,
  KEY_SAVE_MODIFIED,
  QUICK_SLOT,
  REGISTRY_STATE,
  SCREEN_TEXTURE,
} from './keys.ts';

const NOTICE_MS = 1200;
// Glyph pixels, like the renderer's copy: x GLYPH_SCALE with the face.
const TEXT_MARGIN = 6 * GLYPH_SCALE;

/**
 * Draws the whole 320x200 frame into one canvas texture and routes input.
 * Redrawing everything on change is cheap at this size, which keeps the
 * renderer stateless and the pixel grid exact.
 */
export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private screen!: Screen;
  private font!: BitmapFont;
  private view!: Renderer;
  private actor!: Actor;
  /** Every named mover in the room, the player among them. Issue X4 defect 3. */
  private actors!: RoomActors;
  /** Doc 34 assertion 6's register. Step E swaps a RuntimeCoordinator in. */
  private readonly bodies = new BodyOwners();
  /** The one thing allowed to drive a mover from a script. Issue X4 defect 1. */
  private world!: SequenceWorld;
  private ambient!: AmbientLayer;
  private panel!: PanelLayout;
  private texture!: Phaser.Textures.CanvasTexture;

  private hovered: Interactable | null = null;
  private hoveredName: string | null = null;
  private sayLines: string[] = [];
  /** Lines still to come in a multi-speaker response, in order. */
  private pendingSay: { speaker: string | null; line: string }[] = [];
  /**
   * Who is saying the line on screen, when the line records it.
   *
   * Doc 44's probe reports this so the gauntlet can assert that beat 3's
   * first line is Thad's and its second is the driver's -- WITHOUT either
   * file quoting the words, which live in doc 17 and are extracted from it.
   * Null for a line that carries no attribution; never inferred.
   */
  private sayingActor: string | null = null;
  private notice: string | null = null;
  private barkLines: string[] = [];
  private barkAt: { x: number; y: number } | null = null;
  private barkTimer?: Phaser.Time.TimerEvent;
  private noticeTimer?: Phaser.Time.TimerEvent;
  private dirty = true;
  /** Drawn frames, for the probe. Counted here because the scene decides. */
  private frameCount = 0;
  private readonly cyclers = new Map<string, CyclingBackground>();
  private lastCycle: Map<number, number> | null = null;
  private lastFrameAt = 0;
  /** Doc 22 section 7's choreography. One performance at a time. */
  private readonly sequence = new SequenceRunner();

  /**
   * Doc 17's opening, as segments. Null once it has handed over control, and
   * null from the start in any room it is not the opening of.
   *
   * NOTHING HERE MAY ANNOUNCE ITSELF AS INSTRUCTION. Doc 17 v3.1 makes the
   * whole opening the tutorial -- receive a destination, walk there, examine
   * something, open a door, talk to someone, navigate a tree, get an
   * objective -- and the constraint that goes with it is that no part of it
   * says so. No tips, no prompts, no highlighted first target, no tutorial
   * text. That is why this plays lines and hides the panel and does nothing
   * else: every affordance the player learns, they learn by using it.
   */
  private opening: Segment[] | null = null;
  private openingAt = 0;
  private openingDoneFlag: string | null = null;
  /**
   * Doc 17 beat 9's carrier, and the beats after it. Issue X4's fourth
   * finding: "beat 9 additionally has no carrier".
   *
   * It is a SECOND runner, deliberately. The opening runner plays instead of
   * the player; this one plays alongside him. Hob crosses the road while the
   * panel is up and the player may walk, look and listen throughout -- which
   * is what doc 17 means by putting `yes` in beat 9's interactive column.
   */
  private readonly carried = new CarriedBeats(
    (writes) => this.state.flags.applyWrites(writes),
    (flag) => this.state.flags.get(flag));
  private actCard: string | null = null;
  private hoveredLocation: string | null = null;

  constructor() {
    super(GAME_SCENE);
  }

  create(): void {
    this.state = this.registry.get(REGISTRY_STATE) as GameState;

    const texture = this.textures.createCanvas(SCREEN_TEXTURE, NATIVE_WIDTH, NATIVE_HEIGHT);
    if (!texture) {
      throw new Error('Could not create the screen texture');
    }
    this.texture = texture;
    this.add.image(0, 0, SCREEN_TEXTURE).setOrigin(0, 0);

    const context = this.texture.getContext();
    context.imageSmoothingEnabled = false;
    this.screen = new Screen(context, this.state.content.palette);
    this.font = new BitmapFont(this.state.content.font);
    // The protagonist's id comes from content. No .ts file names him, and
    // the registry does not know which of its movers he is beyond holding it.
    this.actor = new Actor(this.state, this.state.content.actor.id,
      NATIVE_WIDTH / 2, PLAY_HEIGHT - 14 * GLYPH_SCALE, {
        routed: true,
        // Doc 40's idle break plays only where the record declares the clip.
        // `thad.json` does not -- that is Q9 -- so today he breathes and does
        // not glance aside, and NOTHING IS SUBSTITUTED for the clip he has
        // not got. It starts working the day the record grows one.
        hasIdleBreak: this.spriteDeclares(IDLE_BREAK),
      });
    this.actor.placeIn(this.state.roomId);
    this.actors = new RoomActors(this.state, this.actor);
    this.world = new SequenceWorld({
      actors: this.actors,
      bodies: this.bodies,
      choreSeconds: (mover, clip) => this.choreSeconds(mover, clip),
      say: (step) => this.saySequenceStep(step),
    });
    this.ambient = new AmbientLayer(this.state);
    this.panel = new PanelLayout(this.state.content.panel);
    this.view = new Renderer(this.screen, this.font, this.state, this.actors, this.ambient,
      (roomId) => this.backgroundFor(roomId),
      (roomId) => this.foregroundFor(roomId),
      (roomId) => this.imageFor(roomId, 'idle', this.state.content.rooms.get(roomId)?.idles?.sheet),
      (path) => this.sheetFor(path));

    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.keyboard?.on(`keydown-${KEY_MENU}`, this.onMenuKey, this);
    // Ctrl+S and Ctrl+L, both preventDefault so the browser does not take
    // them. Convenience only -- everything they do is on the menu.
    this.input.keyboard?.on('keydown', this.onModifiedKey, this);

    this.beginOpening();
    this.markDirty();
    this.loadDeferred();
  }

  /**
   * Everything boot did not wait for, fetched while the game is already on
   * screen. `planBoot` decides the split; this half only has to not block.
   *
   * Each arrival marks the frame dirty, because the renderer redraws on change
   * and a texture appearing is a change it cannot otherwise see -- Hob would
   * finish downloading into a frame that had already been drawn without him
   * and stay invisible until something else happened to move.
   *
   * Until a frame arrives the renderer draws the graybox it already falls back
   * to for an absent texture. That is deliberate and it is Q20's rule: a
   * missing sprite looks missing, and nothing is quietly substituted for it.
   */
  private loadDeferred(): void {
    let queued = 0;
    for (const { key, path } of planBoot(this.state.content).deferred) {
      if (this.textures.exists(key)) continue;
      this.load.image(key, new URL(path, document.baseURI).toString());
      this.load.once(`filecomplete-image-${key}`, () => this.markDirty());
      queued += 1;
    }
    if (queued > 0) this.load.start();
  }

  update(): void {
    const now = this.time.now / 1000;
    // Ruling 20's idles are a function of the clock and nothing else, so the
    // only state needed is what the last drawn frame showed.
    const before = this.lastFrameAt;
    if (IdleLayer.changed(this.state.room, before, now)) this.markDirty();
    this.lastFrameAt = now;
    this.view.setClock(now);
    if (this.cycleChanged()) this.markDirty();
    // THE WORLD MOVES, THEN SETTLES, THEN THE SCRIPT DECIDES. This order is
    // load-bearing and it used to be the other way round.
    //
    // A chore's end is computed twice: the runner waits `now + duration` from
    // the tick it issued one, and the Actor ends it from its OWN clock. With
    // the sequence first, the actor's clock was a frame behind the runner's,
    // so the actor finished at `now(N-1) + d` against the runner's
    // `now(N) + d` -- and the release, which happened at the END of the tick,
    // normally landed a frame before the next claim, at the START of one.
    //
    // ON A LONG FRAME BOTH DEADLINES FALL IN THE SAME TICK. The runner then
    // advanced and claimed the body while the chore still held it and had not
    // been settled: `BODY_ONE_OWNER: thad@chore+walk`, reproducible at 5 Mbps
    // and under anything else that stretches a frame. It is a race, so it
    // looked like an instrument artefact the first time it appeared.
    //
    // Advancing and settling FIRST puts the two clocks in phase -- a chore
    // issued now records the same `now` the runner waits from -- and
    // guarantees that whatever finished has let go before anything asks.
    if (this.actors.update(now)) this.markDirty();
    // Where he is standing is state, and this is the only place that knows it.
    this.state.rememberStanding(this.actor.x, this.actor.y);
    // Every body whose walk or chore has finished is handed back HERE, once a
    // tick and in one place. A claim that outlives its motion is what makes
    // the next one trip assertion 6.
    this.world.settleBodies();
    const wasRunning = this.sequence.isRunning;
    if (this.sequence.update(now, this.world)) this.markDirty();
    // Beat 9's carrier runs alongside the player rather than instead of him,
    // so it is ticked whether or not the opening runner is.
    if (this.carried.update(now, this.world)) this.markDirty();
    if (this.sequence.isRunning || this.carried.isRunning) this.markDirty();
    // The opening's automatic segment has played out. Bank its flag writes
    // and move on -- to the driver's tree, or to control.
    if (this.opening && wasRunning && !this.sequence.isRunning) this.advanceOpening();
    // Ambient idles are two-frame and slow, so the scene redraws on the frame
    // one of them turns over rather than every frame. Same rule as ruling
    // 20's crowds: the room is still, and then it is very slightly not.
    if (this.ambientChanged(before, now)) this.markDirty();
    if (this.actor.isWalking) {
      this.markDirty();
      const fired = this.ambient.checkApproach(this.actor.x, this.actor.y);
      if (fired) this.showBark(fired.npc.name, fired.line, fired.npc.x,
        fired.npc.y - 30 * GLYPH_SCALE);
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.frameCount += 1;
    this.view.drawFrame({
      hoveredTarget: this.hovered,
      hoveredTargetName: this.hoveredName,
      sayLines: this.sayLines,
      notice: this.notice,
      barkLines: this.barkLines,
      barkAt: this.barkAt,
      actCard: this.actCard,
      // Doc 17 beat 8: the panel appears when control does, and not before.
      showPanel: this.opening === null,
      hoveredLocation: this.hoveredLocation,
      // Doc 44: the beat travels with the frame so a violation recorded
      // while it is drawn can name it. Undefined outside a performance.
      beat: this.playingBeat(),
      // Doc 43 line 97: the driver's head answers to who is speaking. Null
      // when nobody is, which selects the overlay's default.
      speaker: this.sayLines.length > 0 ? this.sayingActor : null,
    });
    this.texture.refresh();
  }

  /**
   * Whether the cycling bands have moved since the last drawn frame.
   *
   * The scene only redraws when something changed, which is what keeps 60fps
   * on a Chromebook affordable -- so a room that animates has to say so. At
   * 0.25 and 0.6 Hz this is true a handful of times a minute and false on
   * every other frame, which is the point: the room is still, and then it
   * is very slightly not.
   */
  private cycleChanged(): boolean {
    const elements = this.state.room.cycling;
    if (!elements?.length) return false;
    const on = this.state.menu.toggle(CYCLING_OPTION);
    const mapping = on
      ? mappingAt(elements.map((element) => resolve(this.state.content.palette, element)),
        this.time.now / 1000)
      : new Map<number, number>();
    if (this.lastCycle && sameMapping(this.lastCycle, mapping)) return false;
    this.lastCycle = mapping;
    return true;
  }

  /**
   * The background for a room, cycled if it declares any elements. Doc 18.
   *
   * Wrapped once per room and cached, because the wrapper scans the whole
   * image for the reserved bands when it is built. Rooms that declare no
   * cycling get the loaded texture straight through and pay nothing.
   */
  private backgroundFor(roomId: string): CanvasImageSource | null {
    const room = this.state.content.rooms.get(roomId);
    if (!room?.background) return null;
    const key = `bg:${roomId}`;
    if (!this.textures.exists(key)) return null;
    const source = this.textures.get(key).getSourceImage() as CanvasImageSource;
    if (!room.cycling?.length) return source;

    let cycler = this.cyclers.get(roomId);
    if (!cycler) {
      cycler = new CyclingBackground(source, room, this.state.content.palette,
        NATIVE_WIDTH, PLAY_HEIGHT);
      this.cyclers.set(roomId, cycler);
    }
    return cycler.frameAt(this.time.now / 1000, this.state.menu.toggle(CYCLING_OPTION));
  }

  /** Ruling 21a's near plane. Straight through -- it never cycles. */
  private foregroundFor(roomId: string): CanvasImageSource | null {
    return this.imageFor(roomId, 'fg', this.state.content.rooms.get(roomId)?.foreground);
  }

  /** A loaded character sheet, keyed by the content path that named it. */
  private sheetFor(path: string): CanvasImageSource | null {
    return this.textures.exists(path)
      ? (this.textures.get(path).getSourceImage() as CanvasImageSource)
      : null;
  }

  /** A loaded room image, or null if the room does not declare one. */
  private imageFor(roomId: string, prefix: string, declared?: string): CanvasImageSource | null {
    if (!declared) return null;
    const key = `${prefix}:${roomId}`;
    return this.textures.exists(key)
      ? (this.textures.get(key).getSourceImage() as CanvasImageSource)
      : null;
  }

  private markDirty(): void {
    this.dirty = true;
  }

  /** Whether any ambient character's two-frame idle turned over. */
  private ambientChanged(before: number, after: number): boolean {
    return this.ambient.present.some((npc) => {
      const sprite = npc.sprite;
      if (!sprite) return false;
      const phase = sprite.phase ?? 0;
      const at = (seconds: number) => Math.floor((seconds * sprite.rate + phase) * 2);
      return at(before) !== at(after);
    });
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.state.dialogue.isActive || this.state.menu.isOpen) return;
    const { x, y } = this.nativePoint(pointer);

    // ERRATA 29 CONDITION 1. An icon must never be the only way an item is
    // identified, so hovering one puts its authored display name in the
    // sentence line -- the same line, the same templates, the same names
    // ruling 26 had drawn in the panel itself.
    if (y >= PLAY_HEIGHT) {
      const slot = this.view.inventoryHitboxes().find((box) => pointInRect(x, y, box));
      const item = slot ? this.state.itemTarget(slot.id) : undefined;
      if ((item?.id ?? null) !== (this.hovered?.id ?? null)) {
        this.hovered = item ?? null;
        this.hoveredName = item ? this.state.itemLabel(item.id) : null;
        this.markDirty();
      }
      return;
    }
    // On the map the sentence line names the destination under the pointer,
    // for the same reason an icon does: a marker must never be the only way a
    // place is identified.
    if (this.state.isMap) {
      const hit = this.view.mapHitboxes().find((box) => pointInRect(x, y, box.rect));
      const id = hit?.built ? hit.id : null;
      if (id !== this.hoveredLocation) {
        this.hoveredLocation = id;
        const known = this.state.mapLocations.find((entry) => entry.location.id === id);
        this.hoveredName = known?.label ?? null;
        this.hovered = null;
        this.markDirty();
      }
      return;
    }
    // Ambient characters stand in front of the scenery, so they take the
    // pointer first -- exactly as they take the click. Reading one name and
    // clicking another is worse than either alone.
    const npc = y < PLAY_HEIGHT ? this.ambient.npcAt(x, y) : undefined;
    const found = npc
      ? { id: npc.id, name: npc.name,
          defaultVerb: this.state.content.verbs.npcVerb }
      : y < PLAY_HEIGHT
        ? (this.state.targetAt(x, y) ?? null)
        : null;
    const changed = (found?.id ?? null) !== (this.hovered?.id ?? null);
    if (changed) {
      this.hoveredName = found?.name ?? null;
      this.hovered = (found as Interactable | null) ?? null;
      this.markDirty();
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const { x, y } = this.nativePoint(pointer);
    const secondary = pointer.rightButtonDown();

    // The menu takes every click while it is open, including clicks on the
    // verb panel behind it.
    if (this.state.menu.isOpen) {
      this.onMenuClick(y);
      return;
    }

    // Ahead of the panel buttons, because the options are drawn over them.
    // A click on a conversation must never reach the MENU or MAP button
    // underneath it.
    if (this.state.dialogue.isActive) {
      if (!this.advanceSay()) this.onDialogueClick(y);
      return;
    }

    if (pointInRect(x, y, this.panel.menuButton)) {
      this.state.menu.open();
      this.markDirty();
      return;
    }

    // The map button, and BACK while it is open. Not gated on the opening
    // being over, because the panel is not drawn until it is.
    const mapButton = this.panel.mapButton;
    if (mapButton && pointInRect(x, y, mapButton)) {
      this.toggleMap();
      return;
    }

    if (this.advanceSay()) return;

    // Doc 20 rule 5: the map is a menu that looks like a place. A click on a
    // location travels, instantly, whatever verb happens to be selected --
    // there is nothing on this screen to look at, pull or open.
    if (this.state.isMap) {
      if (y < PLAY_HEIGHT) this.onMapClick(x, y);
      else this.onPanelClick(x, y);
      return;
    }

    if (y >= PLAY_HEIGHT) {
      if (!this.onInventoryClick(x, y)) this.onPanelClick(x, y);
      return;
    }

    // A click in the play area abandons whatever performance is running. A
    // staged interaction the player has changed their mind about should stop
    // where it is rather than finish walking somewhere they no longer want to
    // be -- doc 22's deterministic cancellation, applied to ordinary play.
    //
    // UNLESS AN OPENING IS RUNNING, which is Q25 as ruled. `cancel()` clears
    // `started`, so this made `isRunning` false inside the click handler; the
    // next tick's `wasRunning` then read false, the transition that calls
    // `advanceOpening` was never observed, and the opening froze forever with
    // no error and nothing on screen to say so. The verdict is decided in
    // `playfieldClick` rather than here, because a decision with a name has a
    // test and an `if` in an event handler does not.
    const verdict = playfieldClick({
      sequenceRunning: this.sequence.isRunning,
      openingActive: this.opening !== null,
    });
    // A cutscene beat is playing. Any pending line was taken by `advanceSay`
    // above; with none left the click is spent, and it must not fall through
    // to the walk and interact code either -- control is `none` during an
    // automatic beat and a click cannot start the player moving under it.
    if (verdict === 'consume') return;
    if (verdict === 'cancel') {
      this.sequence.cancel();
      // The PLAYER's performance, and nobody else's: beat 9's carrier is
      // running Hob across the road on its own runner and a change of mind
      // about a trough is not a change of mind about him.
      this.world.abandonActor(this.actors.playerId);
    }

    // An ambient character is talked to, never examined -- they are not
    // hotspots and doc 07 is clear that none of them gates anything.
    const npc = this.ambient.npcAt(x, y);
    if (npc) {
      this.state.dialogue.start(npc.tree);
      this.markDirty();
      return;
    }

    // ERRATA 28b, the whole table:
    //
    //   ground, any selection      -> walk
    //   object + selected verb     -> that verb
    //   object, nothing selected   -> the object's own defaultVerb
    //   right button on an object  -> its defaultVerb, whatever is selected
    //
    // Double-click is gone entirely, along with the click tracker it needed.
    const target = this.state.targetAt(x, y);
    const verb = this.state.verbs.verbFor(target, secondary);

    // A doorway asked for with a transit verb is walked through -- checked
    // BEFORE the walk shortcut, because the road out of town declares WALK TO
    // as its default and would otherwise be walked TO and never down.
    if (target && (target as Partial<Exit>).to !== undefined
        && this.state.verbs.isTransit(verb)) {
      this.beginInteraction(target, verb);
      return;
    }

    // WALK TO resolved against an object still walks: THE MUD covers the
    // whole street and declares WALK TO as its default, so clicking the road
    // moves the player rather than examining the ground they are standing on.
    if (!target || verb === this.state.verbs.walkVerbId) {
      if (this.world.walkPlayer(x, y)) this.markDirty();
      return;
    }

    this.beginInteraction(target, verb);
  }

  /**
   * Doc 22 section 6, as data. An object that declares where to stand gets
   * the full staged chain; one that does not answers where the player stands.
   *
   *   walk -> waitForActor -> face -> waitForActor -> [chore] -> say
   *
   * The chore step is only present when the object declares a reaction for
   * this verb, so the chain is as short as the object needs and no shorter.
   */
  private beginInteraction(target: Interactable, verb: string): void {
    const staging = target.walkTo;
    if (!staging) {
      this.faceTarget(target);
      this.applyInteraction(target, verb);
      return;
    }
    const actor = this.state.content.actor.id;
    const steps: SequenceStep[] = [
      { kind: 'walk', actor, x: staging.x, y: staging.y },
      { kind: 'waitForActor', actor },
      { kind: 'face', actor, facing: staging.facing },
      { kind: 'waitForActor', actor },
    ];
    // A reaction belongs to the LINE it was written for. USE on the trough
    // is a recoil because "I am not drinking from that" is a flinch; USE THE
    // TUNING FORK ON THE TROUGH is a different sentence with a different
    // answer, and playing the recoil against it would be an animation
    // performing a line nobody said.
    const chore = this.state.heldItem ? undefined : target.reactions?.[verb];
    if (chore) steps.push({ kind: 'chore', actor, chore });
    steps.push({ kind: 'say', actor, interact: { target: target.id, verb } });
    this.sequence.start(steps);
    this.markDirty();
  }

  /**
   * He looks at what he is talking about. A man who describes a trough while
   * facing away from it is reading a label -- and this is the dossier's
   * face-direction-change-without-walking doing its job rather than sitting
   * in an animation list.
   */
  private faceTarget(target: Interactable): void {
    const [tx, ty, tw, th] = target.rect;
    if (tw > 0 && th > 0) this.actor.faceToward(tx + tw / 2, ty + th / 2);
  }

  private applyInteraction(target: Interactable, verb: string): void {
    const result = this.state.interact(target, verb);
    this.setSay(result.say);
    if (result.changedRoom) {
      this.hovered = null;
      this.hoveredName = null;
      this.enterRoomPerformance();
    }
    this.markDirty();
  }

  /**
   * Everything a change of room does to what is performing in it.
   *
   * Doc 22's deterministic cancellation, and it now has more to cancel: both
   * runners stop, every body claim is handed back, and every mover but the
   * player is dropped. A mover surviving a transition would be a coach
   * standing in an assay office, and a body claim surviving one would trip
   * assertion 6 on the first thing the next room tried to animate.
   */
  private enterRoomPerformance(from: string | null = this.state.previousRoomId): void {
    this.sequence.cancel();
    this.carried.cancel();
    this.world.abandon();
    this.actors.clearRoom();
    // A RETURN PUTS HIM BACK; AN ARRIVAL USES THE DOOR. Coming back from the
    // map or from a load resumes where he stood, which is what stops opening a
    // menu being a move; walking through an exit is an arrival and still lands
    // on the entrance, because that is what an entrance is for.
    const resume = this.state.resumeStanding(from);
    if (resume) this.actor.placeAt(resume[0], resume[1]);
    else this.actor.placeIn(this.state.roomId, from);
  }

  /**
   * A line, or the interaction that produces one. Handed to `SequenceWorld`,
   * which owns everything the runner may do to a BODY; this owns the words.
   */
  private saySequenceStep(step: Extract<SequenceStep, { kind: 'say' }>): number {
    if (step.interact) {
      const target = this.state.findTarget(step.interact.target);
      if (target) this.applyInteraction(target, step.interact.verb);
      return 0;
    }
    this.setSay(step.line ?? null, step.actor ?? null);
    return this.lineSeconds(step.line ?? '');
  }

  /**
   * How long a line stays on screen, from its length and a rate in content.
   *
   * Doc 17 states seconds for BEATS and never for lines, which is correct --
   * a line's duration is a property of the line. The rate and the floor live
   * in content/ui/ui.json because menu.json already declares an OPTIONS item
   * called "Text speed" that nothing implements yet: when it is built, this
   * is the value it scales, and a rate written into this file could not be.
   */
  private lineSeconds(line: string): number {
    const timing = this.state.content.ui.timing;
    const perGlyph = timing?.lineSecondsPerGlyph ?? 0.045;
    const minimum = timing?.lineSecondsMinimum ?? 1.6;
    return Math.max(minimum, line.length * perGlyph);
  }

  /**
   * How long a clip runs on this mover, from its own frame count.
   *
   * THERE IS NO FALLBACK, AND A MISSING CLIP IS NAMED. It used to end
   * `?? 1`, so a chore nobody had drawn ran for one frame's worth of time and
   * the actor played whatever `ActorSprite` fell through to -- coverage that
   * did not exist, reported as working.
   *
   * Two things are missing today and both are named rather than papered over:
   * only the protagonist has an actor record at all, so any chore naming
   * another mover throws with its id in the message; and doc 40 lists
   * `recoil`, `pickup` and `reach` as undrawn, so a chore naming one of those
   * throws with the clip in the message. Assertion 14 fires first in dev with
   * the code doc 34 gave it.
   */
  private choreSeconds(mover: Actor, clip: string): number {
    // HIS OWN RECORD AND HIS OWN RATE. This read `content.actor` -- the
    // protagonist -- and guarded it with `mover.id === record.id`, so a chore
    // staged for anyone else resolved to `undefined` and threw. That guard was
    // right when he was the only record and is wrong now that Hob and the
    // coach have their own: it would refuse a clip Hob genuinely declares, and
    // the duration would have come off Thad's reactRate if it had not.
    //
    // The lookup is keyed by the MOVER'S id, so the answer traces to the thing
    // being asked about. A mover with no record still throws, by name.
    const record = this.state.content.actors.get(mover.id);
    const facing = mover.facing;
    const surface = mover.surfaceHere();
    const found = record?.clips.find(
      (candidate) => candidate.id === clip && candidate.facing === facing);
    assertRequiredClip(found, clip, facing, surface);
    if (!found || !record) {
      throw new Error(`No declared clip "${clip}" (${facing}) for mover "${mover.id}"`);
    }
    return found.frames.length / record.reactRate;
  }

  /** Whether the protagonist's record declares a clip. Never a substitution. */
  private spriteDeclares(clip: string): boolean {
    return this.state.content.actor.clips
      .some((candidate) => candidate.id === clip);
  }

  /**
   * A click in the inventory strip.
   *
   * LOOK and LISTEN examine the item where it is. Every other verb picks it
   * up as the thing the next click applies WITH -- which is the whole of
   * item-on-target, and it needs no second verb and no second click mode.
   */
  private onInventoryClick(x: number, y: number): boolean {
    const arrow = this.view.arrowHitboxes().find((box) => pointInRect(x, y, box));
    if (arrow) {
      this.state.scrollInventory(arrow.direction === 'up' ? -1 : 1, this.panel.visibleRows);
      this.markDirty();
      return true;
    }
    const slot = this.view.inventoryHitboxes().find((box) => pointInRect(x, y, box));
    if (!slot) return false;
    const target = this.state.itemTarget(slot.id);
    const verb = this.state.verbs.selectedVerb;
    // AN ITEM-DIRECTED VERB RESOLVES WHERE IT STANDS. Only the verbs content
    // names as CARRYING an item -- doc 24's USE -- pick it up to apply to
    // something else; the other eight are complete sentences about the item
    // alone and must answer here.
    //
    // THIS ASKED `examines` AND HELD THE ITEM FOR EVERY OTHER ANSWER, so OPEN
    // THE LETTER produced nothing at all: no line, no flag, no refusal. The
    // only way to get a response out of an item was to click it and then click
    // Thad, which is the interface reading as broken. The question was
    // inverted -- the small named set is the one that carries.
    //
    // AND IT WENT THROUGH `verbs.resolve(...).say` RATHER THAN `interact`,
    // WHICH IS Q13. That call returns the line and the effects side by side
    // and this took only the line, so an item response's flag writes and state
    // changes were dropped on the floor -- silently, because the line still
    // appeared and nothing downstream could tell. `interact` is the same path
    // a room object takes: resolve, reserve, perform, commit, in errata 48's
    // order. Q13 was filed as a dropped write; it was also a missing response.
    if (target && verb && !this.state.verbs.carries(verb)) {
      this.applyInteraction(target, verb);
      return true;
    }
    this.state.holdItem(slot.id);
    this.markDirty();
    return true;
  }

  /**
   * Opens the map, or leaves it by the way it was opened.
   *
   * Doc 20 rule 5 -- travel is instant -- cuts both ways: coming back is a
   * screen change and not a walk, and a player who opens the map to look at
   * it must be able to close it without going anywhere.
   */
  private toggleMap(): void {
    const target = this.state.isMap ? this.state.previousRoomId : this.mapRoomId();
    if (!target || !this.state.content.rooms.has(target)) return;
    this.state.enterRoom(target);
    this.hovered = null;
    this.hoveredName = null;
    this.hoveredLocation = null;
    this.setSay(null);
    this.enterRoomPerformance();
    this.markDirty();
  }

  /** The one room declaring itself a map. Found, not named. */
  private mapRoomId(): string | null {
    for (const [id, room] of this.state.content.rooms) {
      if (room.kind === 'map') return id;
    }
    return null;
  }

  private onMapClick(x: number, y: number): void {
    const hit = this.view.mapHitboxes().find((box) => pointInRect(x, y, box.rect));
    // An unbuilt destination is drawn and does not travel. Silently: doc 17
    // v3.1's constraint is that nothing announces itself, and a notice saying
    // "not implemented" is the loudest possible announcement.
    if (!hit?.built) return;
    const location = (this.state.room.locations ?? []).find((entry) => entry.id === hit.id);
    if (!location || !this.state.travelTo(location)) return;
    this.hovered = null;
    this.hoveredName = null;
    this.hoveredLocation = null;
    this.setSay(null);
    this.enterRoomPerformance();
    this.markDirty();
  }

  private onPanelClick(x: number, y: number): void {
    // ERRATA 39's toggle, checked BEFORE the verbs: it shares the verb grid's
    // geometry and a cell that answered both would select a verb underneath it.
    const full = this.panel.fullscreenButton;
    if (full && pointInRect(x, y, full)) {
      this.toggleFullscreen();
      return;
    }
    for (const verb of this.state.content.verbs.verbs) {
      if (pointInRect(x, y, this.panel.verbButton(verb.col, verb.row))) {
        this.state.verbs.selectVerb(verb.id);
        this.markDirty();
        return;
      }
    }
  }

  /**
   * ERRATA 39, as ruled. Fullscreen is better and never required -- the game
   * stays correct windowed, and errata 54 superseded the integer rule that
   * once made a fractionally scaled window wrong.
   *
   * Driven from a CLICK and nowhere else, because browsers only grant
   * fullscreen inside a user gesture. A call from a timer or from restored
   * save state is refused, silently, which is why this is not something the
   * menu remembers and reapplies.
   */
  private toggleFullscreen(): void {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
    this.markDirty();
  }

  private onDialogueClick(y: number): void {
    const options = this.state.dialogue.presentOptions();
    const hit = this.view
      .dialogueHitboxes(options)
      .find((box) => y >= box.y && y < box.y + box.height);
    if (!hit) return;

    const result = this.state.dialogue.select(hit.id);
    this.setSay(result.say, result.sayer);
    this.pendingSay = result.rest.map((spoken) => (
      { speaker: spoken.speaker, line: spoken.line }));
    if (result.ended) {
      this.state.autosave();
      // A tree that was carrying a run of beats hands the sheet back when it
      // closes. Doc 17's EXIT option is "Thank you for the ride." -- the
      // coach goes, and beat 7 follows it.
      if (this.opening) this.advanceOpening();
    }
    this.markDirty();
  }

  /**
   * Starts doc 17's opening, if this is a fresh game standing in the room it
   * opens in.
   *
   * Gated on the flags rather than on "have we been here before", so a save
   * restored mid-opening does not replay it and a player who has already been
   * told the undertaker's name is not told again.
   */
  private beginOpening(): void {
    // Which sequence is the opening, and which flag records that it has run,
    // are both content. No .ts file names either.
    const id = this.state.content.manifest.openingSequence;
    const file = id ? this.state.content.sequences.get(id) : undefined;
    if (!file) return;
    this.openingDoneFlag = file.doneFlag ?? null;
    if (this.openingDoneFlag && this.state.flags.get(this.openingDoneFlag) === true) return;
    if (this.state.roomId !== this.state.content.manifest.startRoom) return;
    // Beat 1 is the title screen, which is its own scene and has already
    // happened by the time anyone is standing on a road.
    this.opening = segmentsOf(file).filter((segment) => segment.kind !== 'menu');
    this.openingAt = 0;
    this.playOpeningSegment();
  }

  /**
   * Plays segments until it reaches one somebody else has to carry.
   *
   * An automatic segment becomes steps. A player segment does not: beats 4 to
   * 6 are the driver's tree (errata 30b), so this opens the tree and stops,
   * and the tree's EXIT option is what brings it back.
   */
  private playOpeningSegment(): void {
    while (this.opening && this.openingAt < this.opening.length) {
      const segment = this.opening[this.openingAt] as Segment;
      if (segment.kind === 'automatic') {
        // A new beat clears the last one's line. Without this the act card
        // lands underneath whatever the driver said on his way out.
        this.setSay(null);
        this.pendingSay = [];
        // The card holds for doc 17's stated beat duration PLUS its own
        // reading time. The ~3s in the beat sheet is how long the beat lasts;
        // how long two lines of a 5x7 font take to read is interface timing
        // of the same class as lineSecondsPerGlyph, and it lives in content
        // beside it. Legal under errata 30a -- this segment's control is
        // `none`, which is the only place a wait may be added at all.
        const card = actCardOf(segment);
        this.actCard = card;
        const steps = stepsFor(segment);
        const extra = this.state.content.ui.timing?.actCardExtraSeconds ?? 0;
        if (card && extra > 0) {
          // TAGGED WITH THE BEAT THAT RAISED THE CARD. Doc 44: a step with no
          // beat makes the runner report no beat, so the four seconds the
          // card holds read as time belonging to nothing -- the gauntlet
          // timed beat 7 at a tenth of a second and the card's own hold
          // vanished from the record.
          const holder = segment.beats.find((entry) => entry.actCard)?.beat;
          steps.push({ kind: 'wait', seconds: extra, beat: holder } as SequenceStep);
        }
        this.sequence.start(steps);
        this.markDirty();
        return;
      }
      if (segment.carriedBy) {
        this.state.dialogue.start(segment.carriedBy);
        this.markDirty();
        return;
      }
      // A player segment nobody carries is beat 8 onwards: control, Hob's
      // crossing, and the walk west. The opening is over and the game has
      // started; there is no announcement, per doc 17 v3.1.
      //
      // IT USED TO END HERE AND THAT WAS THE FOURTH X4 FINDING. Beats 8, 9
      // and 10 are one uncarried player segment, so reaching beat 8 dropped
      // beat 9 with it: Hob's three lines were never delivered, his flag was
      // never written, and the watchman's lamp hotspot that flag gates could
      // not appear in the game at all. Control is handed over AND the rest of
      // the segment is armed, which is what doc 17's `yes` in beat 9's
      // interactive column actually means.
      //
      // CONTROL FIRST, THEN THE CROSSING: `finishOpening` autosaves, and that
      // save should record a game that has just begun rather than one three
      // words into a conversation with a man who is not in the save file.
      this.finishOpening();
      this.carried.arm(segment.beats);
      this.markDirty();
      return;
    }
    this.finishOpening();
  }

  /** The automatic segment that just ran, banked, and on to the next. */
  private advanceOpening(): void {
    if (!this.opening) return;
    const segment = this.opening[this.openingAt] as Segment;
    this.state.flags.applyWrites(writesOf(segment));
    this.actCard = null;
    this.openingAt += 1;
    this.playOpeningSegment();
  }

  private finishOpening(): void {
    this.opening = null;
    this.actCard = null;
    if (this.openingDoneFlag) this.state.flags.applyWrites({ [this.openingDoneFlag]: true });
    this.state.autosave();
    this.markDirty();
  }

  /**
   * Shows the next line of a multi-speaker response, and reports whether it
   * took the click.
   *
   * Doc 17 v3.1's second driver option is three lines across two people, and
   * they have to land one at a time or the joke's timing is gone -- the
   * player has to see "Hotel's five." before "I have four." lands, and both
   * before "You've all got four." The queue takes the click ahead of the
   * option list so a click meant to advance the exchange cannot select the
   * next option instead.
   */
  private advanceSay(): boolean {
    const next = this.pendingSay.shift();
    if (next === undefined) return false;
    this.setSay(next.line, next.speaker);
    this.markDirty();
    return true;
  }

  private setSay(text: string | null, speaker: string | null = null): void {
    this.sayLines = text ? this.font.wrap(text, NATIVE_WIDTH - TEXT_MARGIN * 2) : [];
    this.sayingActor = text ? speaker : null;
  }

  private onMenuKey(): void {
    if (this.state.dialogue.isActive) return;
    this.state.menu.escape();
    this.afterMenu();
  }

  private onModifiedKey(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toUpperCase();
    if (key !== KEY_SAVE_MODIFIED && key !== KEY_LOAD_MODIFIED) return;
    // The browser's own Save Page and Location Bar are not what the player
    // meant. Taking the event is the whole reason these are worth binding.
    event.preventDefault();
    if (key === KEY_SAVE_MODIFIED) {
      this.state.save(QUICK_SLOT);
      this.showNotice(this.state.content.menu.notices.saved);
      return;
    }
    if (this.state.load(QUICK_SLOT)) {
      this.afterLoad();
      this.showNotice(this.state.content.menu.notices.restored);
    } else {
      this.showNotice(this.state.content.menu.notices.noSave);
    }
  }

  /**
   * Which beat is playing, from whichever runner is playing it.
   *
   * TWO RUNNERS, ONE ANSWER. The opening runner plays instead of the player
   * and the carrier plays alongside him, and only one of them is ever running
   * -- but a caller that asked the wrong one would get null and report "no
   * beat" through the whole of Hob's crossing.
   *
   * BEAT 10 CANNOT BE SEEN HERE and doc 44 says so rather than pretending
   * otherwise: it stages nothing, deliberately, so no runner ever holds it
   * and the carrier has emptied its list by the time it is reached. What is
   * observable is that beat 9 finished and control is the player's, which is
   * `handedOver` in the probe.
   */
  private playingBeat(): string | null {
    return this.sequence.beat ?? this.carried.current?.beat ?? null;
  }

  /**
   * Doc 44's frame report. Everything the gauntlet compares against a script.
   *
   * Assembled on demand, never per frame: the harness asks about twenty times
   * a second and the game draws sixty, so building this in `update` would put
   * the instrument's cost into every frame whether or not anybody was
   * reading it. R5h -- an instrument can change the system, not only report
   * on it.
   */
  get probeReady(): boolean {
    return this.view !== undefined && this.actors !== undefined;
  }

  report(): FrameReport {
    const drawn = this.view.lastDrawn();
    const movers: Record<string, MoverReport> = {};
    for (const mover of this.actors.all()) {
      movers[mover.id] = {
        at: [Math.round(mover.x), Math.round(mover.y)],
        facing: mover.facing,
        clip: mover.clip,
        height: Math.round(mover.height),
        moving: mover.isWalking,
        drawn: drawn[mover.id] ?? 'not-drawn',
      };
    }
    return {
      frame: this.frameCount,
      // ALREADY SECONDS. `lastFrameAt` is `time.now / 1000` and dividing again
      // reported 0.002 for a scene two seconds old -- which nothing would have
      // failed on, because every consumer compares it against itself.
      clock: this.lastFrameAt,
      beat: this.playingBeat(),
      control: this.openingControl(),
      movers,
      // What each overlay actually DREW in, not what the rule says it should
      // -- an overlay whose image had not loaded drew nothing, and reporting
      // the intended state there would tell the gauntlet a head was on screen
      // that was not.
      overlays: this.view.shownOverlayStates(),
      says: this.sayLines.length > 0 ? this.sayingActor : null,
      options: this.state.dialogue.isActive
        ? this.state.dialogue.presentOptions().length : 0,
      pending: this.pendingSay.length,
      handedOver: this.opening === null,
      segment: this.playingSegment(),
    };
  }

  /** The opening segment now playing, without claiming which beat of it is. */
  private playingSegment(): { kind: string; beats: string[]; carriedBy: string | null } | null {
    const segment = this.opening?.[this.openingAt];
    if (!segment) return null;
    return {
      kind: segment.kind,
      beats: segment.beats.map((beat) => beat.beat),
      carriedBy: segment.carriedBy,
    };
  }

  /** The control of the opening segment now playing, or null once it is over. */
  private openingControl(): string | null {
    if (!this.opening) return null;
    const segment = this.opening[this.openingAt];
    if (!segment) return null;
    return segment.kind === 'automatic' ? 'none' : segment.kind;
  }

  /** Clears anything that referred to the room we are no longer in. */
  private afterLoad(): void {
    this.hovered = null;
    this.hoveredName = null;
    this.sayLines = [];
    this.pendingSay = [];
    this.enterRoomPerformance(null);
  }

  private afterMenu(): void {
    const notice = this.state.menu.takeNotice();
    if (notice) this.showNotice(notice);
    this.markDirty();
  }

  private onMenuClick(y: number): void {
    const hit = this.view.menuHitboxes().find((box) => y >= box.y && y < box.y + box.height);
    if (!hit) return;
    const rows = this.state.menu.rows();
    if (!rows.find((row) => row.id === hit.id)?.enabled) return;

    const action = this.state.menu.select(hit.id);
    if (action.kind === 'save') {
      this.state.save(action.slot ?? QUICK_SLOT);
    } else if (action.kind === 'load') {
      if (this.state.load(action.slot ?? QUICK_SLOT)) this.afterLoad();
    } else if (action.kind === 'fullscreen') {
      this.toggleFullscreen();
    } else if (action.kind === 'quit') {
      // No title scene is wired in yet, so quitting resets to the start
      // room. Marked here because it is the one menu route that does not
      // yet do what its label says.
      this.state.reset();
      this.afterLoad();
    }
    this.afterMenu();
  }

  private showBark(_name: string, line: string, x: number, y: number): void {
    this.barkLines = this.font.wrap(line, 150);
    this.barkAt = { x, y };
    this.barkTimer?.remove();
    this.barkTimer = this.time.delayedCall(2600, () => {
      this.barkLines = [];
      this.barkAt = null;
      this.markDirty();
    });
    this.markDirty();
  }

  private showNotice(text: string | undefined): void {
    this.notice = text ?? null;
    this.noticeTimer?.remove();
    this.noticeTimer = this.time.delayedCall(NOTICE_MS, () => {
      this.notice = null;
      this.markDirty();
    });
    this.markDirty();
  }

  /** Pointer position in native 320x200 space, clamped to the screen. */
  private nativePoint(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(Math.floor(pointer.worldX), 0, NATIVE_WIDTH - 1),
      y: Phaser.Math.Clamp(Math.floor(pointer.worldY), 0, NATIVE_HEIGHT - 1),
    };
  }
}
