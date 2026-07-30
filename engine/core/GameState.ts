import type { ContentBundle, Exit, Interactable, RoomFile, WalkableRegion } from './types.ts';
import { FlagStore } from './FlagStore.ts';
import { DialogueRunner } from './DialogueRunner.ts';
import { VerbSystem } from './VerbSystem.ts';
import { SaveManager, type StorageLike } from './SaveManager.ts';

export interface InteractionResult {
  say: string | null;
  enteredDialogue: boolean;
  changedRoom: boolean;
}

/**
 * Ties the flag store, verb system, dialogue runner, room loader and save
 * system together. Deliberately free of Phaser so it can be driven headlessly
 * by the validation harness.
 */
export class GameState {
  readonly flags: FlagStore;
  readonly verbs: VerbSystem;
  readonly dialogue: DialogueRunner;
  readonly saves: SaveManager;
  readonly content: ContentBundle;

  private currentRoomId: string;
  private inventory: string[] = [];
  private reputation = 0;

  constructor(content: ContentBundle, storage: StorageLike) {
    this.content = content;
    this.flags = new FlagStore(content.flags);
    this.verbs = new VerbSystem(content.verbs, this.flags, content.verbFallbacks);
    this.dialogue = new DialogueRunner(content.dialogue, this.flags);
    this.saves = new SaveManager(storage);
    this.currentRoomId = content.manifest.startRoom;
  }

  get reputationIndex(): number {
    return this.reputation;
  }

  get roomId(): string {
    return this.currentRoomId;
  }

  get room(): RoomFile {
    const room = this.content.rooms.get(this.currentRoomId);
    if (!room) {
      throw new Error(`Unknown room: ${this.currentRoomId}`);
    }
    return room;
  }

  /** Hotspots and exits together, in the order they should hit-test. */
  get targets(): Interactable[] {
    const room = this.room;
    return [...room.hotspots, ...room.exits];
  }

  findTarget(id: string): Interactable | undefined {
    return this.targets.find((target) => target.id === id);
  }

  targetAt(x: number, y: number): Interactable | undefined {
    return this.targets.find((target) => {
      const [tx, ty, tw, th] = target.rect;
      return x >= tx && x < tx + tw && y >= ty && y < ty + th;
    });
  }

  enterRoom(roomId: string): void {
    if (!this.content.rooms.has(roomId)) {
      throw new Error(`Unknown room: ${roomId}`);
    }
    this.currentRoomId = roomId;
    this.autosave();
  }

  /** Applies the selected verb to a target and resolves what follows. */
  interact(target: Interactable): InteractionResult {
    const action = this.verbs.resolve(this.verbs.selectedVerb, target);

    if (action.dialogue) {
      this.dialogue.start(action.dialogue);
      return { say: action.say, enteredDialogue: true, changedRoom: false };
    }

    const destination = action.goto ?? this.exitDestination(target);
    if (destination) {
      this.enterRoom(destination);
      return { say: action.say, enteredDialogue: false, changedRoom: true };
    }

    return { say: action.say, enteredDialogue: false, changedRoom: false };
  }

  /**
   * An exit only walks the player through on the walk verb. Every other verb
   * examines it in place, so LOOK AT on a doorway is not a room transition.
   */
  private exitDestination(target: Interactable): string | null {
    const exit = target as Partial<Exit>;
    if (!exit.to) return null;
    return this.verbs.selectedVerb === this.verbs.walkVerbId ? exit.to : null;
  }

  /**
   * The walkable region under a point, or undefined if it is not floor.
   * Regions are tested in declaration order, so a room may overlap them and
   * rely on the first match.
   */
  regionAt(x: number, y: number): WalkableRegion | undefined {
    return (this.room.walkable ?? []).find((region) => {
      const [rx, ry, rw, rh] = region.rect;
      return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
    });
  }

  isWalkable(x: number, y: number): boolean {
    return this.regionAt(x, y) !== undefined;
  }

  /**
   * Drawn height for an actor standing at a point.
   *
   * Errata ruling 15: three drawn sizes, snapped on crossing a boundary,
   * never interpolated. Returning a discrete height rather than a scale
   * factor is what makes interpolation impossible to introduce by accident.
   */
  actorHeightAt(x: number, y: number): number | null {
    const region = this.regionAt(x, y);
    if (!region) return null;
    return this.heightForZone(region.zone);
  }

  heightForZone(zone: number): number {
    const found = this.content.scaling.zones.find((candidate) => candidate.index === zone);
    if (!found) {
      throw new Error(`Undeclared depth zone: ${zone}`);
    }
    return found.height;
  }

  save(): void {
    this.saves.write({
      room: this.currentRoomId,
      inventory: [...this.inventory],
      reputation: this.reputation,
      flags: this.flags.snapshot(),
      dialogueProgress: this.dialogue.progressSnapshot(),
      dialoguePosition: this.dialogue.positionSnapshot(),
    });
  }

  autosave(): void {
    this.save();
  }

  /** Returns false when there is no save, or the save is unreadable. */
  load(): boolean {
    const save = this.saves.read();
    if (!save) return false;
    if (!this.content.rooms.has(save.room)) return false;

    this.flags.restore(save.flags);
    this.dialogue.restore(save.dialogueProgress, save.dialoguePosition);
    this.currentRoomId = save.room;
    this.inventory = [...save.inventory];
    this.reputation = save.reputation;
    return true;
  }

  reset(): void {
    this.flags.reset();
    this.dialogue.restore({}, { tree: null, node: null });
    this.currentRoomId = this.content.manifest.startRoom;
    this.inventory = [];
    this.reputation = 0;
    this.verbs.resetToDefault();
    this.saves.clear();
  }
}
