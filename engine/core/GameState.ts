import type {
  ContentBundle, Entrance, Exit, Interactable, MapLocation, Point, RoomFile, WalkableRegion,
} from './types.ts';
import { heightIn, WalkBoxes, type Route } from './WalkBoxes.ts';
import { FlagStore } from './FlagStore.ts';
import { DialogueRunner } from './DialogueRunner.ts';
import { VerbSystem, type ResolvedAction } from './VerbSystem.ts';
import { SaveManager, type StorageLike } from './SaveManager.ts';
import { MenuSystem } from './MenuSystem.ts';
import { pureResolution } from './Assertions.ts';
import { commitBundle, localJournals, type DurableWorld, type JournalSource } from './Commit.ts';
import type { ActionTransaction, DurableEffect, FinishReason } from './runtime-types.ts';

export interface InteractionResult {
  say: string | null;
  enteredDialogue: boolean;
  changedRoom: boolean;
}

/**
 * What a verb on a target WOULD do. Produced without touching anything.
 *
 * Doc 34 section 1.2's third defect: "Object state/take/room change occurs
 * before the response line finishes." Everything that used to happen inside
 * interact() before the line is described here instead.
 */
export interface InteractionResolution {
  readonly target: Interactable;
  readonly verb: string;
  /** The room the interaction was resolved in. Effect keys are scoped to it. */
  readonly room: string;
  /** The room key of the target, captured before any room change. */
  readonly objectKey: string;
  readonly action: ResolvedAction;
  /** True when this is a doorway being walked through rather than asked about. */
  readonly transit: boolean;
  /** Where the player ends up, from transit or from the response's goto. */
  readonly destination: string | null;
  /** The tree this response opens once it has finished performing. */
  readonly dialogue: string | null;
  readonly say: string | null;
  readonly effects: readonly DurableEffect[];
}

/**
 * One interaction, from reservation to settle.
 *
 * ERRATA 48, which is what this class exists for: "The build writes flags
 * inside resolution and applies object state and inventory BEFORE the line
 * finishes. A puzzle is therefore mechanically solved before it has been
 * performed, and the player sees consequence before cause. Canonical order,
 * binding: stage · chore · sound · line · object state · flags · inventory ·
 * settle."
 *
 * Staging, chore and sound belong to the scene and to step C; the four this
 * owns are line, object state, flags and inventory, and it owns them in that
 * order because the journal will not let it emit them in any other.
 */
export class Interaction {
  readonly resolution: InteractionResolution;
  readonly tx: ActionTransaction;

  private readonly state: GameState;
  private finished: FinishReason | null = null;

  constructor(state: GameState, resolution: InteractionResolution, tx: ActionTransaction) {
    this.state = state;
    this.resolution = resolution;
    this.tx = tx;
  }

  get settled(): boolean {
    return this.finished === 'settled';
  }

  /**
   * Hands the response line to the presentation and marks the line phase.
   *
   * Returns the line rather than drawing it: nothing in engine/core may know
   * what a screen is. A silent action -- a doorway walked through, a
   * combination with no written pair -- has no line and marks no line phase.
   */
  presentLine(): string | null {
    if (this.resolution.say !== null && !this.tx.journal.has('line')) {
      this.tx.journal.mark('line');
      this.tx.phase = 'line';
    }
    return this.resolution.say;
  }

  /** The line is over, by reading or by skip. Section 9.1's sixth marker. */
  lineSettled(): void {
    if (this.tx.journal.has('line') && !this.tx.journal.has('lineSettle')) {
      this.tx.journal.mark('lineSettle');
    }
  }

  /**
   * Applies the reserved bundle in phase order and releases the transaction.
   *
   * Doc 31 section 5.1's settle step: "apply downstream availability, clear
   * the transaction, persist at the stable state, then return control."
   * Skipping the line "commits steps 5-8 exactly once; it never cancels or
   * doubles the result" -- which here is free, because the journal refuses a
   * second worldState marker.
   */
  settle(): InteractionResult {
    if (this.finished !== null) throw new Error(`Interaction already finished: ${this.tx.id}`);
    this.lineSettled();
    this.state.applyInteraction(this);
    this.tx.phase = 'settling';
    this.tx.journal.mark('stable');
    this.tx.journal.release();
    this.finished = 'settled';
    return {
      say: this.resolution.say,
      enteredDialogue: this.resolution.dialogue !== null,
      changedRoom: this.resolution.destination !== null,
    };
  }

  /** Drops the interaction without applying it, and hands its ids back. */
  abandon(reason: FinishReason): void {
    if (this.finished) return;
    this.tx.journal.release();
    this.finished = reason;
  }

  finishedWith(): FinishReason | null {
    return this.finished;
  }
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
  /**
   * Where transactions get their journals, and therefore which EffectOwnership
   * registry they claim into.
   *
   * One per GameState by default. Step D hands the live RuntimeCoordinator in
   * here instead -- it satisfies JournalSource structurally -- and every
   * journal in the session then shares the coordinator's one registry, which
   * is what doc 34 section 4.6's second assertion needs to be able to fire
   * across systems rather than only within one.
   */
  private readonly journals: JournalSource;
  private serial = 0;

  constructor(content: ContentBundle, storage: StorageLike, journals?: JournalSource) {
    this.content = content;
    this.journals = journals ?? localJournals();
    this.flags = new FlagStore(content.flags);
    this.verbs = new VerbSystem(content.verbs, this.flags, content.verbFallbacks,
      content.combinations);
    this.dialogue = new DialogueRunner(content.dialogue, this.flags, this.journals);
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

  /**
   * Walks into a room and saves on arrival.
   *
   * The autosave here is doc 34 section 1.2's FOURTH defect -- "enterRoom()
   * applies onEnter and autosaves immediately", where D29/D33 permit an
   * autosave only after destination ingress settles. That is step D's, and it
   * is left exactly as it was found. What step B does change is that an
   * interaction no longer arrives through this door: it arrives through
   * `arrive()` and saves once at its own settle, so a save can no longer land
   * between a response's room change and its flags.
   */
  enterRoom(roomId: string): void {
    this.arrive(roomId);
    this.autosave();
  }

  private arrive(roomId: string): void {
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
  }

  /**
   * What a verb on a target would do, without doing any of it.
   *
   * Wrapped in pureResolution over the whole durable world -- flags, room,
   * objects, inventory, ownership and dialogue counts, which is doc 34
   * section 9.1's list -- so assertion 7 runs against real content on every
   * interaction in a dev build.
   *
   * The verb is passed IN rather than read from the selection, because errata
   * 28b's table decides it: the selection, or the object's own defaultVerb, or
   * the object's default regardless of selection on a right click. One place
   * works that out and this is not it.
   */
  resolveInteraction(target: Interactable, verb: string): InteractionResolution {
    return pureResolution(() => this.signature(), () => this.resolvePure(target, verb));
  }

  private resolvePure(target: Interactable, verb: string): InteractionResolution {
    const room = this.currentRoomId;
    const objectKey = this.key(target.id);

    // Going through a door is not a question about the door. Checked before
    // the verb resolves, so no line is produced and no pool is consumed --
    // otherwise OPEN on an exit would spend a fallback line on its way out.
    const transit = this.transitDestination(target, verb);
    if (transit) {
      // A door that has been gone through is a door that is open. Reserved
      // here rather than through a response rule because doc 14 is explicit
      // that transit produces no line -- and a state change is not a line.
      const effects: DurableEffect[] = [];
      if (target.stateOnTransit) {
        effects.push({
          id: `act/${objectKey}/${verb}#transit:state`,
          kind: 'objectState',
          object: objectKey,
          state: target.stateOnTransit,
        });
      }
      effects.push({ id: `act/${objectKey}/${verb}#transit:room`, kind: 'room', room: transit });
      return {
        target, verb, room, objectKey,
        action: { say: null, dialogue: null, goto: null, effects: [] },
        transit: true,
        destination: transit,
        dialogue: null,
        say: null,
        effects,
      };
    }

    // With an item held the verb applies WITH it, which is a different
    // question and draws on a different source. Checked after transit, so
    // walking through a door while carrying something still walks.
    const action = this.held
      ? this.verbs.resolveWith(verb, this.held, target, room)
      : this.verbs.resolve(verb, target, room);

    // World state first, then flags, then inventory -- errata 48's order, as
    // the order the bundle is built in. Commit.ts groups by phase, so this is
    // legibility rather than mechanism, but the two agreeing is the point.
    const effects: DurableEffect[] = [];
    if (action.state) {
      effects.push({
        id: `act/${objectKey}/${verb}#state`,
        kind: 'objectState',
        object: objectKey,
        state: action.state,
      });
    }
    const destination = action.goto ?? null;
    if (destination) {
      effects.push({ id: `act/${objectKey}/${verb}#room`, kind: 'room', room: destination });
    }
    effects.push(...action.effects);
    if (action.take && target.item) {
      // Doc 22 item 9's ownership half. It rides on the inventory effect
      // rather than on a second one because DurableEffect has no ownership
      // member: the object leaving the room and the item arriving in the
      // inventory are one transfer, and doc 31 groups ownership with pickup.
      effects.push({ id: `act/${objectKey}/${verb}#take`, kind: 'inventoryAdd', item: target.item });
    }

    return {
      target, verb, room, objectKey, action,
      transit: false,
      destination,
      dialogue: action.dialogue,
      say: action.say,
      effects,
    };
  }

  /**
   * Resolves and reserves. Nothing durable has happened when this returns.
   *
   * THE SEAM FOR STEP E. The integrated proof presents the chore, the sound
   * and the line between this call and settle(); interact() below is the same
   * sequence with the performance collapsed to nothing.
   */
  beginInteraction(target: Interactable, verb: string): Interaction {
    const resolution = this.resolveInteraction(target, verb);
    this.serial += 1;
    const id = `act:${resolution.room}:${target.id}:${verb}#${this.serial}`;
    const journal = this.journals.newJournal(id);
    const tx: ActionTransaction = {
      id,
      phase: 'reserved',
      effects: journal.reserve(`${id}/bundle`, resolution.effects),
      journal,
    };
    return new Interaction(this, resolution, tx);
  }

  /**
   * Applies a verb to a target: resolve, reserve, perform, commit.
   *
   * The performance is empty for a caller that draws the line itself the
   * moment it is handed one, which every current caller does. What changed is
   * that the object no longer opens, the item no longer arrives and the room
   * no longer changes before the line exists.
   */
  interact(target: Interactable, verb: string): InteractionResult {
    const interaction = this.beginInteraction(target, verb);
    interaction.presentLine();
    return interaction.settle();
  }

  /**
   * Commits a settled interaction. Called by Interaction.settle() and by
   * nothing else.
   */
  applyInteraction(interaction: Interaction): void {
    const { resolution } = interaction;
    commitBundle(interaction.tx.effects, this.interactionWorld(resolution), interaction.tx.journal);

    // A response that opens a tree hands control over AFTER its own line and
    // its own writes, never during them.
    if (resolution.dialogue) this.dialogue.start(resolution.dialogue);
    // One save, at the stable state, carrying the whole result. Doc 31
    // section 5.1's settle step -- "persist at the stable state".
    if (resolution.destination) this.autosave();
  }

  /**
   * The world a reserved bundle is applied into, bound to the interaction
   * that reserved it.
   *
   * `objectKey` is captured at resolution and used here, so an interaction
   * that changes both an object's state and the room writes the state against
   * the room it happened in rather than the room it ended in.
   */
  private interactionWorld(resolution: InteractionResolution): DurableWorld {
    return {
      setFlag: (flag, value) => { this.flags.set(flag, value); },
      addFlag: (flag, delta) => { this.flags.set(flag, this.flags.getNumber(flag) + delta); },
      setObjectState: (object, state) => { this.objectStates.set(object, state); },
      enterRoom: (room) => { this.arrive(room); },
      addInventory: (item) => {
        this.taken.add(resolution.objectKey);
        if (!this.inventory.includes(item)) this.inventory.push(item);
      },
      removeInventory: (item) => {
        this.inventory = this.inventory.filter((carried) => carried !== item);
      },
      markDialogueTaken: () => {
        throw new Error('An action may not write dialogue counts');
      },
    };
  }

  /**
   * The deep state snapshot doc 34 section 4.6 row 7 compares before and
   * after a resolution. Section 9.1 names its members: flags, room, objects,
   * inventory, ownership and dialogue counts.
   */
  private signature(): string {
    return JSON.stringify({
      room: this.currentRoomId,
      inventory: this.inventory,
      ownership: [...this.taken].sort(),
      objects: [...this.objectStates].sort(),
      flags: this.flags.snapshot(),
      counts: this.dialogue.progressSnapshot(),
      position: this.dialogue.positionSnapshot(),
      reputation: this.reputation,
    });
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
