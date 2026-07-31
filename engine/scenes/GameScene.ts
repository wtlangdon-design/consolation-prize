import Phaser from 'phaser';

import type { GameState } from '../core/GameState.ts';
import type { Exit, Interactable } from '../core/types.ts';
import { Actor } from '../core/Actor.ts';
import { AmbientLayer } from '../core/Ambient.ts';
import { mappingAt, resolve, sameMapping } from '../core/PaletteCycling.ts';
import { BitmapFont } from '../render/BitmapFont.ts';
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
import { SequenceRunner, type SequenceHost, type SequenceStep } from '../core/Sequence.ts';
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
const TEXT_MARGIN = 6;

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
  private ambient!: AmbientLayer;
  private panel!: PanelLayout;
  private texture!: Phaser.Textures.CanvasTexture;

  private hovered: Interactable | null = null;
  private hoveredName: string | null = null;
  private sayLines: string[] = [];
  private notice: string | null = null;
  private barkLines: string[] = [];
  private barkAt: { x: number; y: number } | null = null;
  private barkTimer?: Phaser.Time.TimerEvent;
  private noticeTimer?: Phaser.Time.TimerEvent;
  private dirty = true;
  private readonly cyclers = new Map<string, CyclingBackground>();
  private lastCycle: Map<number, number> | null = null;
  private lastFrameAt = 0;
  /** Doc 22 section 7's choreography. One performance at a time. */
  private readonly sequence = new SequenceRunner();

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
    this.actor = new Actor(this.state, 160, 130);
    this.actor.placeIn(this.state.roomId);
    this.ambient = new AmbientLayer(this.state);
    this.panel = new PanelLayout(this.state.content.panel);
    this.view = new Renderer(this.screen, this.font, this.state, this.actor, this.ambient,
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

    this.markDirty();
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
    if (this.sequence.update(now, this.host())) this.markDirty();
    if (this.actor.update(now)) this.markDirty();
    if (this.sequence.isRunning) this.markDirty();
    // Ambient idles are two-frame and slow, so the scene redraws on the frame
    // one of them turns over rather than every frame. Same rule as ruling
    // 20's crowds: the room is still, and then it is very slightly not.
    if (this.ambientChanged(before, now)) this.markDirty();
    if (this.actor.isWalking) {
      this.markDirty();
      const fired = this.ambient.checkApproach(this.actor.x, this.actor.y);
      if (fired) this.showBark(fired.npc.name, fired.line, fired.npc.x, fired.npc.y - 30);
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.view.drawFrame({
      hoveredTarget: this.hovered,
      hoveredTargetName: this.hoveredName,
      sayLines: this.sayLines,
      notice: this.notice,
      barkLines: this.barkLines,
      barkAt: this.barkAt,
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

    if (pointInRect(x, y, this.panel.menuButton)) {
      this.state.menu.open();
      this.markDirty();
      return;
    }

    if (this.state.dialogue.isActive) {
      this.onDialogueClick(y);
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
    if (this.sequence.isRunning) {
      this.sequence.cancel();
      this.actor.halt();
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
      if (this.actor.walkTo(x, y)) this.markDirty();
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
    const chore = target.reactions?.[verb];
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
      this.sequence.cancel();
      this.actor.placeIn(this.state.roomId, this.state.previousRoomId);
    }
    this.markDirty();
  }

  /**
   * What the sequence runner is allowed to do to the world.
   *
   * Built per tick rather than held, because it closes over nothing but the
   * scene and the runner must not outlive a room change.
   */
  private host(): SequenceHost {
    return {
      walk: (_actor, x, y) => { this.actor.walkTo(x, y); },
      isWalking: () => this.actor.isWalking,
      face: (_actor, facing) => { this.actor.setFacing(facing); },
      isTurning: () => this.actor.isTurning,
      chore: (_actor, clip) => {
        const seconds = this.choreSeconds(clip);
        this.actor.react(clip, seconds);
        return seconds;
      },
      say: (step) => {
        if (step.interact) {
          const target = this.state.findTarget(step.interact.target);
          if (target) this.applyInteraction(target, step.interact.verb);
          return;
        }
        this.setSay(step.line ?? null);
      },
    };
  }

  /** How long a clip runs, from its own frame count. */
  private choreSeconds(clip: string): number {
    const { reactRate, sizes } = this.state.content.actor;
    const frames = sizes.near.clips.find((candidate) => candidate.id === clip)?.frames ?? 1;
    return frames / reactRate;
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
    if (target && verb && this.state.verbs.examines(verb)) {
      this.setSay(this.state.verbs.resolve(verb, target).say);
    } else {
      this.state.holdItem(slot.id);
    }
    this.markDirty();
    return true;
  }

  private onPanelClick(x: number, y: number): void {
    for (const verb of this.state.content.verbs.verbs) {
      if (pointInRect(x, y, this.panel.verbButton(verb.col, verb.row))) {
        this.state.verbs.selectVerb(verb.id);
        this.markDirty();
        return;
      }
    }
  }

  private onDialogueClick(y: number): void {
    const options = this.state.dialogue.presentOptions();
    const hit = this.view
      .dialogueHitboxes(options)
      .find((box) => y >= box.y && y < box.y + box.height);
    if (!hit) return;

    const result = this.state.dialogue.select(hit.id);
    this.setSay(result.say);
    if (result.ended) {
      this.state.autosave();
    }
    this.markDirty();
  }

  private setSay(text: string | null): void {
    this.sayLines = text ? this.font.wrap(text, NATIVE_WIDTH - TEXT_MARGIN * 2) : [];
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

  /** Clears anything that referred to the room we are no longer in. */
  private afterLoad(): void {
    this.hovered = null;
    this.hoveredName = null;
    this.sayLines = [];
    this.sequence.cancel();
    this.actor.placeIn(this.state.roomId);
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
