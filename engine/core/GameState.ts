import type {
  ContentBundle, Entrance, Exit, Interactable, MapLocation, Point, RoomFile, WalkableRegion,
} from './types.ts';
import { heightIn, WalkBoxes, type Route } from './WalkBoxes.ts';
import { FlagStore } from './FlagStore.ts';
import { DialogueRunner } from './DialogueRunner.ts';
import { VerbSystem } from './VerbSystem.ts';
import { SaveManager, type StorageLike } from './SaveManager.ts';
import { MenuSystem } from './MenuSystem.ts';

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
  readonly menu: MenuSystem;
  readonly content: ContentBundle;

  private currentRoomId: string;
  private inventory: string[] = [];
  private reputation = 0;
  /** The room walked out of, so the arrival point can be chosen. Doc 21 gap 7. */
  private cameFrom: string | null = null;
  /** The item the next verb applies WITH, not the item it applies TO. */
  private held: string | null = null;
  /** First visible inventory row. Errata ruling 26's scrollable list. */
  private scroll = 0;
  private boxCache: WalkBoxes | null = null;
  private boxesFor: string | null = null;
  /** Doc 22 item 9: runtime object state, keyed room/object. Saved. */
  private objectStates = new Map<string, string>();
  /** Objects whose ownership has passed to the actor. Saved. */
  private taken = new Set<string>();

  constructor(content: ContentBundle, storage: StorageLike) {
    this.content = content;
    this.flags = new FlagStore(content.flags);
    this.verbs = new VerbSystem(content.verbs, this.flags, content.verbFallbacks,
      content.combinations);
    this.dialogue = new DialogueRunner(content.dialogue, this.flags);
    this.saves = new SaveManager(storage);
    this.menu = new MenuSystem(content.menu, this.saves,
      (id) => content.rooms.get(id)?.name ?? id);
    this.currentRoomId = content.manifest.startRoom;
    this.inventory = this.startingInventory();
  }

  /** Doc 01: the fork is his one tool and never leaves the inventory. */
  private startingInventory(): string[] {
    return [...this.content.items.values()]
      .filter((item) => item.startsHeld)
      .map((item) => item.id);
  }

  get carried(): string[] {
    return [...this.inventory];
  }

  get heldItem(): string | null {
    return this.held;
  }

  /**
   * Picks an item up as the thing the next verb is applied WITH.
   *
   * Clicking the same item again puts it down, which is the only way back out
   * of a held state with a mouse and no second button.
   */
  holdItem(id: string | null): void {
    this.held = this.held === id ? null : id;
  }

  itemNamed(id: string): string {
    return this.content.items.get(id)?.name ?? id;
  }

  /**
   * What the panel draws for an item. Errata ruling 26 point 2.
   *
   * The short name if one is authored, the full name otherwise. Never a
   * computed truncation: three of the Act II items differ only in their
   * parenthetical, and cutting them to the panel width would render two of
   * them identically and quietly delete a running gag. check-item-names
   * fails the build if a name does not fit or if two rows would draw the
   * same, which is the part that actually protects it.
   */
  itemLabel(id: string): string {
    const item = this.content.items.get(id);
    return item?.short ?? item?.name ?? id;
  }

  get inventoryScroll(): number {
    return this.scroll;
  }

  /** Moves the inventory window, clamped to what is actually carried. */
  scrollInventory(by: number, visible: number): void {
    const last = Math.max(0, this.inventory.length - visible);
    this.scroll = Math.max(0, Math.min(last, this.scroll + by));
  }

  /**
   * An inventory item as a verb target.
   *
   * Items carry the same `responses`/`overrides` shape a hotspot carries, so
   * they resolve through the same verb system. There is deliberately no
   * second resolver: two paths to a line is two places for a line to differ
   * from what was written.
   */
  itemTarget(id: string): Interactable | undefined {
    const item = this.content.items.get(id);
    if (!item) return undefined;
    return {
      id: item.id,
      name: item.name,
      rect: [0, 0, 0, 0],
      colour: 0,
      responses: item.responses,
      overrides: item.overrides,
    };
  }

  /** The declared arrival point for entering `roomId` out of `from`. */
  entranceInto(roomId: string, from: string | null): Entrance | undefined {
    const entrances = this.content.rooms.get(roomId)?.entrances ?? [];
    return entrances.find((entrance) => entrance.from === from && entrance.at)
      ?? entrances.find((entrance) => entrance.at !== undefined && entrance.from === 'default');
  }

  get previousRoomId(): string | null {
    return this.cameFrom;
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

  /**
   * Hotspots and exits together, in the order they should hit-test.
   *
   * Exits first. A doorway is a small, specific target that sits inside a
   * large piece of scenery -- all three of Room 2's doors fall within THE
   * FALSE FRONTS, and the road to the claims falls within THE MUD. Testing
   * scenery first made every exit in the room unclickable.
   *
   * Targets whose `when` does not hold are not here at all, per ruling 19a.
   * Filtered rather than hidden: a target that fails its gate must not be
   * findable, hit-testable, or countable, because the two halves of a state
   * change share a rect and the wrong half would answer first.
   */
  get targets(): Interactable[] {
    const room = this.room;
    return [...room.exits, ...room.hotspots].filter(
      // An object the actor owns is not in the room. Doc 22 item 9: taking
      // something is an ownership change, so it leaves the room the same way
      // a gated hotspot does -- filtered out entirely, not drawn dim.
      (target) => this.flags.test(target.when) && !this.taken.has(this.key(target.id)),
    );
  }

  private key(objectId: string): string {
    return `${this.currentRoomId}/${objectId}`;
  }

  /** The object's current state, or its declared initial one. */
  stateOf(target: Interactable): string | undefined {
    return this.objectStates.get(this.key(target.id)) ?? target.state;
  }

  /** What this object looks like and covers right now. */
  presentation(target: Interactable) {
    const state = this.stateOf(target);
    return (state && target.states?.[state]) || undefined;
  }

  setState(target: Interactable, state: string): void {
    this.objectStates.set(this.key(target.id), state);
  }

  /** Every object in the current room that draws something for its state. */
  get statefulTargets(): Interactable[] {
    return this.targets.filter((target) => this.presentation(target)?.image);
  }

  findTarget(id: string): Interactable | undefined {
    return this.targets.find((target) => target.id === id);
  }

  /** True on Room 0, which is a menu that looks like a place. Doc 20 rule 5. */
  get isMap(): boolean {
    return this.room.kind === 'map';
  }

  /**
   * Map destinations Thad currently knows about.
   *
   * A location whose room is not in the manifest still appears: doc 20 rule 3
   * says the map records what Thad has learned, and what we have got round to
   * building is not something he knows about. It draws dim and does not
   * travel, which is honest on screen and in the build output both.
   */
  get mapLocations(): { location: MapLocation; label: string; built: boolean }[] {
    return (this.room.locations ?? [])
      .filter((location) => this.flags.test(location.when))
      .map((location) => {
        const room = this.content.rooms.get(location.room);
        return {
          location,
          label: room?.name ?? location.label ?? location.id,
          built: room !== undefined,
        };
      });
  }

  /** Doc 20 rule 5: travel is instant. Nothing walks anywhere. */
  travelTo(location: MapLocation): boolean {
    if (!this.content.rooms.has(location.room)) return false;
    this.enterRoom(location.room);
    return true;
  }

  targetAt(x: number, y: number): Interactable | undefined {
    return this.targets.find((target) => {
      // Per-state bounds, per doc 22. An open door is a different shape from
      // a shut one, and hit-testing the shut one's rect after it opens is the
      // kind of wrongness nobody reports because it nearly works.
      const [tx, ty, tw, th] = this.presentation(target)?.bounds ?? target.rect;
      return x >= tx && x < tx + tw && y >= ty && y < ty + th;
    });
  }

  enterRoom(roomId: string): void {
    if (!this.content.rooms.has(roomId)) {
      throw new Error(`Unknown room: ${roomId}`);
    }
    this.cameFrom = this.currentRoomId;
    this.currentRoomId = roomId;
    this.boxCache = null;
    // Errata 31c: standing somewhere is a thing that can happen to a player,
    // and no hotspot response can observe it. Applied before the autosave so
    // a save taken on arrival already knows where he has been.
    this.flags.applyWrites(this.content.rooms.get(roomId)?.onEnter?.set);
    this.autosave();
  }

  /**
   * Applies a verb to a target and resolves what follows.
   *
   * The verb is passed IN rather than read from the selection, because errata
   * 28b's table decides it: the selection, or the object's own defaultVerb, or
   * the object's default regardless of selection on a right click. One place
   * works that out and this is not it.
   */
  interact(target: Interactable, verb: string): InteractionResult {
    // Going through a door is not a question about the door. Checked before
    // the verb resolves, so no line is produced and no pool is consumed --
    // otherwise OPEN on an exit would spend a fallback line on its way out.
    const transit = this.transitDestination(target, verb);
    if (transit) {
      // A door that has been gone through is a door that is open. Applied
      // here rather than through a response rule because doc 14 is explicit
      // that transit produces no line -- and a state change is not a line.
      if (target.stateOnTransit) this.setState(target, target.stateOnTransit);
      this.enterRoom(transit);
      return { say: null, enteredDialogue: false, changedRoom: true };
    }

    // With an item held the verb applies WITH it, which is a different
    // question and draws on a different source. Checked after transit, so
    // walking through a door while carrying something still walks.
    const action = this.held
      ? this.verbs.resolveWith(verb, this.held, target, this.currentRoomId)
      : this.verbs.resolve(verb, target, this.currentRoomId);

    if (action.state) this.setState(target, action.state);
    if (action.take && target.item) {
      this.taken.add(this.key(target.id));
      if (!this.inventory.includes(target.item)) this.inventory.push(target.item);
    }

    if (action.dialogue) {
      this.dialogue.start(action.dialogue);
      return { say: action.say, enteredDialogue: true, changedRoom: false };
    }

    const destination = action.goto ?? null;
    if (destination) {
      this.enterRoom(destination);
      return { say: action.say, enteredDialogue: false, changedRoom: true };
    }

    return { say: action.say, enteredDialogue: false, changedRoom: false };
  }

  /**
   * An exit transits only on a transit verb. Every other verb examines it in
   * place, so LOOK AT on a doorway describes the doorway rather than
   * teleporting the player through it mid-sentence.
   */
  private transitDestination(target: Interactable, verb: string): string | null {
    const exit = target as Partial<Exit>;
    if (!exit.to) return null;
    return this.verbs.isTransit(verb) ? exit.to : null;
  }

  /**
   * The walkable region under a point, or undefined if it is not floor.
   * Regions are tested in declaration order, so a room may overlap them and
   * rely on the first match.
   */
  /**
   * The current room's walk boxes, or undefined if it still uses the zone
   * model. Rebuilt per room rather than cached across rooms, because a box's
   * `enabledWhen` is evaluated against live flags.
   */
  get boxes(): WalkBoxes | undefined {
    const declared = this.room.walkBoxes;
    if (!declared) return undefined;
    if (this.boxesFor !== this.currentRoomId || !this.boxCache) {
      this.boxCache = new WalkBoxes(declared, (when) => this.flags.test(when));
      this.boxesFor = this.currentRoomId;
    }
    return this.boxCache;
  }

  /** A route across the boxes, or undefined in a room without them. */
  routeTo(fromX: number, fromY: number, toX: number, toY: number): Route | undefined {
    return this.boxes?.route(fromX, fromY, toX, toY);
  }

  /**
   * The occlusion level for a figure standing at a point. Doc 22 section 5.
   *
   * Falls back to the NEAREST box rather than to zero, because a figure whose
   * feet are a pixel outside a box -- standing on a seam, or mid-turn -- would
   * otherwise flip to unmasked for a frame and pop out from behind whatever
   * was covering him.
   */
  clipPlaneAt(x: number, y: number): number {
    const boxes = this.boxes;
    if (!boxes) return 0;
    return (boxes.boxAt(x, y) ?? boxes.nearest(x, y)?.box)?.clipPlane ?? 0;
  }

  /** Nearest standable point. Doc 22 step 1 -- a click is snapped, not refused. */
  nearestFloor(x: number, y: number): Point | undefined {
    return this.boxes?.nearest(x, y)?.point;
  }

  regionAt(x: number, y: number): WalkableRegion | undefined {
    return (this.room.walkable ?? []).find((region) => {
      const [rx, ry, rw, rh] = region.rect;
      return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
    });
  }

  isWalkable(x: number, y: number): boolean {
    const boxes = this.boxes;
    if (boxes) return boxes.contains(x, y);
    return this.regionAt(x, y) !== undefined;
  }

  /**
   * The surface a point stands on, for the walk cycle and the standing sink.
   *
   * Falls back to the actor sheet's first declared surface rather than to a
   * name in this file. No .ts file gets to know that mud is called mud.
   */
  surfaceAt(x: number, y: number): string {
    const fallback = this.content.actor.sizes.near.clips[0]?.surface ?? '';
    const boxes = this.boxes;
    if (boxes) return boxes.boxAt(x, y)?.surface ?? fallback;
    return this.regionAt(x, y)?.surface ?? fallback;
  }

  /**
   * Drawn height for an actor standing at a point.
   *
   * ERRATA RULING 24 replaced ruling 15's snapping here. The zone heights are
   * depth SAMPLES, not drawn sizes: each walkable band contributes one
   * (row, height) point at its vertical centre and the height between two
   * bands is interpolated. Crossing from the mid band to the near band is now
   * a one-row change every few rows of walk instead of an eight-row jump.
   *
   * What is drawn at that height is ActorSprite's problem, and the one place
   * a snap survives is its threshold.
   */
  actorHeightAt(x: number, y: number): number | null {
    // A room with boxes gets its height from the box the actor is in. That is
    // errata 28a's whole point: the boardwalk is `fixed` at the far drawn
    // size and the mud is a `curve` starting above the threshold, so the
    // sprite swap happens at the lip rather than in open mud.
    const boxes = this.boxes;
    if (boxes) {
      const box = boxes.boxAt(x, y);
      return box ? heightIn(box, y) : null;
    }
    if (!this.isWalkable(x, y)) return null;
    const samples = this.depthSamples();
    if (samples.length === 0) return null;
    if (samples.length === 1) return (samples[0] as [number, number])[1];

    const first = samples[0] as [number, number];
    const last = samples[samples.length - 1] as [number, number];
    if (y <= first[0]) return Math.round(first[1]);
    if (y >= last[0]) return Math.round(last[1]);
    for (let index = 1; index < samples.length; index += 1) {
      const [aboveY, aboveH] = samples[index - 1] as [number, number];
      const [belowY, belowH] = samples[index] as [number, number];
      if (y <= belowY) {
        const walk = (y - aboveY) / Math.max(1, belowY - aboveY);
        return Math.round(aboveH + (belowH - aboveH) * walk);
      }
    }
    return Math.round(last[1]);
  }

  /**
   * (row, height) pairs from the room's walkable bands, far to near.
   *
   * The sample sits at each band's vertical centre rather than at its edge,
   * so a band is its declared height in the middle and blends at its seams --
   * which is what stops the interpolation putting a visible kink exactly on
   * the line where two rectangles meet.
   */
  private depthSamples(): [number, number][] {
    // One sample per REGION, not per zone. Room 2 puts the boardwalk and the
    // far mud both in zone 2 at different rows; sampling by zone would give
    // the pair one row between them and make the far mud interpolate away
    // from the height it declares.
    return (this.room.walkable ?? [])
      .map((region): [number, number] => {
        const [, ry, , rh] = region.rect;
        return [ry + rh / 2, this.heightForZone(region.zone)];
      })
      .sort((a, b) => a[0] - b[0]);
  }

  heightForZone(zone: number): number {
    const found = this.content.scaling.zones.find((candidate) => candidate.index === zone);
    if (!found) {
      throw new Error(`Undeclared depth zone: ${zone}`);
    }
    return found.height;
  }

  save(slot: number | null = null): void {
    this.saves.write({
      room: this.currentRoomId,
      inventory: [...this.inventory],
      reputation: this.reputation,
      objectStates: Object.fromEntries(this.objectStates),
      taken: [...this.taken].sort(),
      flags: this.flags.snapshot(),
      dialogueProgress: this.dialogue.progressSnapshot(),
      dialoguePosition: this.dialogue.positionSnapshot(),
    }, slot);
  }

  autosave(): void {
    this.save();
  }

  /** Returns false when there is no save, or the save is unreadable. */
  load(slot: number | null = null): boolean {
    const save = slot === null ? this.saves.read() : this.saves.readSlot(slot);
    if (!save) return false;
    if (!this.content.rooms.has(save.room)) return false;

    this.flags.restore(save.flags);
    this.dialogue.restore(save.dialogueProgress, save.dialoguePosition);
    this.currentRoomId = save.room;
    this.inventory = [...save.inventory];
    this.reputation = save.reputation;
    this.held = null;
    this.cameFrom = null;
    this.scroll = 0;
    this.objectStates = new Map(Object.entries(save.objectStates ?? {}));
    this.taken = new Set(save.taken ?? []);
    return true;
  }

  reset(): void {
    this.flags.reset();
    this.dialogue.restore({}, { tree: null, node: null });
    this.currentRoomId = this.content.manifest.startRoom;
    this.inventory = this.startingInventory();
    this.reputation = 0;
    this.held = null;
    this.cameFrom = null;
    this.scroll = 0;
    this.objectStates.clear();
    this.taken.clear();
    this.verbs.resetToDefault();
    this.saves.clear();
  }
}
