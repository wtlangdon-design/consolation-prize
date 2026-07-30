import type { ContentBundle, Exit, Interactable, RoomFile } from './types.ts';
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
    this.verbs = new VerbSystem(content.verbs, this.flags);
    this.dialogue = new DialogueRunner(content.dialogue, this.flags);
    this.saves = new SaveManager(storage);
    this.currentRoomId = content.manifest.startRoom;
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
