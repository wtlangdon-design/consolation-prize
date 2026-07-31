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
  MENU_BUTTON,
  NATIVE_HEIGHT,
  NATIVE_WIDTH,
  PLAY_HEIGHT,
  Screen,
  pointInRect,
  verbButtonRect,
} from '../render/Screen.ts';
import {
  isDoubleClick as detectDoubleClick,
  NO_CLICK,
  recordClick,
  type ClickRecord,
} from '../core/ClickTracker.ts';
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
  private texture!: Phaser.Textures.CanvasTexture;

  private hovered: { id: string; name: string } | null = null;
  private hoveredName: string | null = null;
  private sayLines: string[] = [];
  private notice: string | null = null;
  private barkLines: string[] = [];
  private barkAt: { x: number; y: number } | null = null;
  private barkTimer?: Phaser.Time.TimerEvent;
  private noticeTimer?: Phaser.Time.TimerEvent;
  private lastClick: ClickRecord = NO_CLICK;
  private dirty = true;
  private readonly cyclers = new Map<string, CyclingBackground>();
  private lastCycle: Map<number, number> | null = null;
  private lastFrameAt = 0;

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
    this.view = new Renderer(this.screen, this.font, this.state, this.actor, this.ambient,
      (roomId) => this.backgroundFor(roomId),
      (roomId) => this.foregroundFor(roomId),
      (roomId) => this.imageFor(roomId, 'idle', this.state.content.rooms.get(roomId)?.idles?.sheet));

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
    if (IdleLayer.changed(this.state.room, this.lastFrameAt, now)) this.markDirty();
    this.lastFrameAt = now;
    this.view.setClock(now);
    if (this.cycleChanged()) this.markDirty();
    if (this.actor.update()) this.markDirty();
    if (this.actor.isWalking) {
      this.markDirty();
      const fired = this.ambient.checkApproach(this.actor.x, this.actor.y);
      if (fired) this.showBark(fired.npc.name, fired.line, fired.npc.x, fired.npc.y - 30);
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.view.drawFrame({
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

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.state.dialogue.isActive || this.state.menu.isOpen) return;
    const { x, y } = this.nativePoint(pointer);
    // Ambient characters stand in front of the scenery, so they take the
    // pointer first -- exactly as they take the click. Reading one name and
    // clicking another is worse than either alone.
    const npc = y < PLAY_HEIGHT ? this.ambient.npcAt(x, y) : undefined;
    const found = npc
      ? { id: npc.id, name: npc.name }
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
    const now = this.time.now;

    // The menu takes every click while it is open, including clicks on the
    // verb panel behind it.
    if (this.state.menu.isOpen) {
      this.onMenuClick(y);
      this.lastClick = { targetId: null, at: now };
      return;
    }

    if (pointInRect(x, y, MENU_BUTTON)) {
      this.state.menu.open();
      this.lastClick = { targetId: null, at: now };
      this.markDirty();
      return;
    }

    if (this.state.dialogue.isActive) {
      this.onDialogueClick(y);
      return;
    }

    if (y >= PLAY_HEIGHT) {
      this.onPanelClick(x, y);
      // Choosing a verb is not half of a double-click. Without this, picking
      // a verb and then clicking a hotspot quickly reads as a double-click
      // and silently walks instead of applying the verb.
      this.lastClick = { targetId: null, at: now };
      return;
    }

    // An ambient character is talked to, never examined -- they are not
    // hotspots and doc 07 is clear that none of them gates anything.
    const npc = this.ambient.npcAt(x, y);
    if (npc) {
      this.state.dialogue.start(npc.tree);
      this.markDirty();
      return;
    }

    const target = this.state.targetAt(x, y);
    const isDoubleClick = detectDoubleClick(this.lastClick, target?.id, now);
    this.lastClick = recordClick(target?.id, now);

    const isExit = target !== undefined && (target as Partial<Exit>).to !== undefined;
    const wantsToWalk = isDoubleClick || this.state.verbs.selectedVerb === this.state.verbs.walkVerbId;

    // A doorway asked to be walked through is walked through, even when it
    // happens to stand on walkable ground -- the road to the claims does.
    if (isExit && (wantsToWalk || this.state.verbs.isTransit(this.state.verbs.selectedVerb))) {
      const before = this.state.verbs.selectedVerb;
      if (wantsToWalk) this.state.verbs.selectVerb(this.state.verbs.walkVerbId);
      this.applyInteraction(target as Interactable);
      if (wantsToWalk) this.state.verbs.selectVerb(before);
      return;
    }

    // Walking wins over examining whenever the player has asked to walk.
    //
    // THE MUD is a hotspot covering the entire walkable band, so without this
    // there is nowhere on the street left to click to move, and double-click
    // resolved WALK TO against a hotspot that has no WALK TO response and
    // therefore did nothing at all. Doc 06: double-click is the walk verb.
    if (!target || wantsToWalk) {
      if (this.actor.walkTo(x, y)) {
        this.markDirty();
        return;
      }
      if (!target) return;
    }

    this.applyInteraction(target);
  }

  private applyInteraction(target: Interactable): void {
    const result = this.state.interact(target);
    this.setSay(result.say);
    if (result.changedRoom) {
      this.hovered = null;
      this.hoveredName = null;
      this.actor.placeIn(this.state.roomId);
    }
    this.markDirty();
  }

  private onPanelClick(x: number, y: number): void {
    for (const verb of this.state.content.verbs.verbs) {
      if (pointInRect(x, y, verbButtonRect(verb.col, verb.row))) {
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
