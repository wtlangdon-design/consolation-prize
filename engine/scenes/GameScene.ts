import Phaser from 'phaser';

import type { GameState } from '../core/GameState.ts';
import type { Interactable } from '../core/types.ts';
import { Actor } from '../core/Actor.ts';
import { AmbientLayer } from '../core/Ambient.ts';
import { BitmapFont } from '../render/BitmapFont.ts';
import { Renderer } from '../render/Renderer.ts';
import { NATIVE_HEIGHT, NATIVE_WIDTH, PLAY_HEIGHT, Screen, pointInRect, verbButtonRect } from '../render/Screen.ts';
import {
  isDoubleClick as detectDoubleClick,
  NO_CLICK,
  recordClick,
  type ClickRecord,
} from '../core/ClickTracker.ts';
import { GAME_SCENE, KEY_LOAD, KEY_RESET, KEY_SAVE, REGISTRY_STATE, SCREEN_TEXTURE } from './keys.ts';

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
    this.view = new Renderer(this.screen, this.font, this.state, this.actor, this.ambient, (roomId) => {
      const room = this.state.content.rooms.get(roomId);
      if (!room?.background) return null;
      const key = `bg:${roomId}`;
      return this.textures.exists(key) ? this.textures.get(key).getSourceImage() as CanvasImageSource : null;
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.keyboard?.on(`keydown-${KEY_SAVE}`, this.onSave, this);
    this.input.keyboard?.on(`keydown-${KEY_LOAD}`, this.onLoad, this);
    this.input.keyboard?.on(`keydown-${KEY_RESET}`, this.onReset, this);

    this.markDirty();
  }

  update(): void {
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

  private markDirty(): void {
    this.dirty = true;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.state.dialogue.isActive) return;
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

    // Walking wins over examining whenever the player has asked to walk.
    //
    // THE MUD is a hotspot covering the entire walkable band, so without this
    // there is nowhere on the street left to click to move, and double-click
    // resolved WALK TO against a hotspot that has no WALK TO response and
    // therefore did nothing at all. Doc 06: double-click is the walk verb.
    const wantsToWalk = isDoubleClick || this.state.verbs.selectedVerb === this.state.verbs.walkVerbId;
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

  private onSave(): void {
    this.state.save();
    this.showNotice(this.state.content.ui.notices.saved);
  }

  private onLoad(): void {
    if (!this.state.load()) return;
    this.hovered = null;
    this.hoveredName = null;
    this.sayLines = [];
    this.showNotice(this.state.content.ui.notices.restored);
  }

  private onReset(): void {
    this.state.reset();
    this.hovered = null;
    this.hoveredName = null;
    this.sayLines = [];
    this.showNotice(this.state.content.ui.notices.reset);
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
