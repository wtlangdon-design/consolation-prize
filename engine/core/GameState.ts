import type {
  ContentBundle, Entrance, Exit, Interactable, MapLocation, Point, RoomFile, WalkableRegion, PlaytestFixture, PuzzleStatus, CombinationPair,
} from './types.ts';
import { cameraAt, cameraFollow, roomWidth } from './Camera.ts';
import { heightIn, WalkBoxes, type Route } from './WalkBoxes.ts';
import { FlagStore } from './FlagStore.ts';
import { DialogueRunner } from './DialogueRunner.ts';
import { VerbSystem, type ResolvedAction } from './VerbSystem.ts';
import { SaveManager, type SaveFile, type StorageLike } from './SaveManager.ts';
import { MenuSystem } from './MenuSystem.ts';
import { pureResolution } from './Assertions.ts';

/** A point that declares no surface has none. Not a name, and not anybody's. */
const NO_SURFACE = '';
import { commitBundle, flagEffects, localJournals, type DurableWorld, type JournalSource } from './Commit.ts';
import type { ActionTransaction, DurableEffect, FinishReason } from './runtime-types.ts';

export interface InteractionResult {
  say: string | null;
  /** Doc 30 §5: further utterances after `say`, first selection only. */
  then?: string[];
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
  readonly then?: string[];
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
      then: this.resolution.then,
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
   * PUZZLE PROGRESS, by canonical id. The milestone a dialogue `rephrase`
   * waits on (WIN_A2's wait question after C5) and the state a later scene
   * will read. No writer exists yet: doc 36 Q112 records the contract.
   */
  private puzzles = new Map<string, PuzzleStatus>();
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

  constructor(content: ContentBundle, storage: StorageLike, journals?: JournalSource, saveKey?: string) {
    this.content = content;
    this.journals = journals ?? localJournals();
    this.flags = new FlagStore(content.flags);
    this.verbs = new VerbSystem(content.verbs, this.flags, content.verbFallbacks,
      content.combinations);
    this.dialogue = new DialogueRunner(content.dialogue, this.flags, this.journals, {
      reached: (puzzle) => this.puzzles.get(puzzle) === 'complete',
      set: (puzzle, status) => { this.puzzles.set(puzzle, status); },
    });
    // A PLAYTEST FIXTURE SAVES UNDER ITS OWN KEY, so a review session's
    // autosaves never overwrite the player's real game.
    this.saves = saveKey ? new SaveManager(storage, saveKey) : new SaveManager(storage);
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
    return `${this.scopeOf(objectId)}/${objectId}`;
  }

  /**
   * Which scope an object's keys belong to: the room, or the inventory.
   *
   * AN ITEM IS NOT IN A ROOM. Its response index, its taken-once record and
   * its state all belong to the item, so keying them to wherever the player
   * happened to be standing would reset a letter's repeat lines every time he
   * walked through a door -- and would give one letter as many independent
   * histories as there are rooms.
   */
  private scopeOf(objectId: string): string {
    return this.content.items.has(objectId) ? 'inventory' : this.currentRoomId;
  }

  /** The object's current state, or its declared initial one. */
  stateOf(target: Interactable): string | undefined {
    return this.objectStates.get(this.key(target.id)) ?? target.state;
  }

  /**
   * The state of a MOVER, from the same store a hotspot's comes from.
   *
   * Q38: the coach must show a shut door and an open one, and a mover has
   * clips rather than states. This is the seam -- `objectStates` is keyed
   * "room/object", is already saved, and is doc 22 item 9's mechanism; the
   * clip lookup consults it and nothing new stores anything.
   *
   * A mover with no entry answers undefined, which is what every character
   * answers and what a clip with no `state` matches.
   */
  moverState(moverId: string): string | undefined {
    return this.objectStates.get(this.key(moverId));
  }

  /** The named object's current state in this room, by id; undefined when no such object. */
  objectStateById(id: string): string | undefined {
    const target = this.targets.find((candidate) => candidate.id === id);
    return target ? this.stateOf(target) : undefined;
  }

  /** What this object looks like and covers right now. */
  presentation(target: Interactable) {
    const state = this.stateOf(target);
    return (state && target.states?.[state]) || undefined;
  }

  setState(target: Interactable, state: string): void {
    this.objectStates.set(this.key(target.id), state);
  }

  /**
   * The same store, keyed by a MOVER id rather than by a target.
   *
   * A mover has no rect and is not an Interactable, so it cannot go through
   * `setState` above -- but it is the same fact in the same map under the same
   * key, which is what makes it save and restore for free.
   *
   * `undefined` CLEARS it, which is how the coach's door shuts: back to the
   * declared default rather than to a state called "shut" that no clip
   * declares. `clipOf` is exact-match-then-fall-back, so a cleared state
   * resolves to the plain clip exactly as a mover that never had one does.
   */
  setMoverState(moverId: string, state: string | undefined): void {
    if (state === undefined) this.objectStates.delete(this.key(moverId));
    else this.objectStates.set(this.key(moverId), state);
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
   * Where he is standing, per room, so a RETURN is not an arrival.
   *
   * OPENING A MENU SHOULD NOT BE A MOVE, and it was one. The map is a room --
   * doc 20 rule 5's "a menu that looks like a place" -- so closing it
   * re-entered the road, and room entry places him at the entrance. He walked
   * to x691 and came back at x960. Doc 20 rule 2 makes the map always
   * reachable, so under that bug CHECKING WHERE YOU ARE RELOCATED YOU.
   *
   * Loading a save did the same thing for the same reason: the payload had
   * eight fields and not one of them was where he was standing.
   */
  private standing = new Map<string, [number, number]>();
  /** How far the view has scrolled in the current room. Always 0 if it fits. */
  private camera = 0;
  /**
   * Who the view is tracking, or null for nobody.
   *
   * NULL IS A PINNED VIEW, not a broken one: `{ do: 'camera', to: x }` sets
   * it, and the view then stays where it was put until something hands it
   * back. The player's id is the default and is restored on every room entry,
   * so a beat that forgets to hand it back cannot strand a later room.
   */
  private cameraFollows: string | null = null;

  /**
   * Where the followed mover is standing, once a tick.
   *
   * SEPARATE FROM `rememberStanding` BECAUSE THEY ARE DIFFERENT FACTS. Where
   * the PLAYER stands is saved and restored; what the VIEW tracks may be the
   * coach, and a coach's position is not a resumed standing position.
   */
  followCamera(actor: string, x: number): void {
    if (this.isMap || this.cameraFollows !== actor) return;
    this.camera = cameraFollow(x, this.roomWidth, this.camera);
  }

  /** Who the view is tracking. The scene reads it to know whose x to send. */
  get cameraFollowing(): string | null {
    return this.cameraFollows;
  }

  /** Called every frame by the scene. Never while the map is up. */
  rememberStanding(x: number, y: number): void {
    if (this.isMap) return;
    this.standing.set(this.currentRoomId, [Math.round(x), Math.round(y)]);
  }

  /** The room's whole width. Absent `size` means the window's. */
  get roomWidth(): number {
    return roomWidth(this.room.size);
  }

  /** How far the view has scrolled. Always 0 in a room that fits. */
  get cameraX(): number {
    return this.camera;
  }

  /**
   * A point on the screen, as a point in the room.
   *
   * THE ONE PLACE THE TWO SPACES MEET. Everything drawn in the world pass is
   * shifted by `-cameraX`, so everything hit-tested against the world has to
   * be shifted back by `+cameraX`, and a hotspot is clickable exactly where it
   * is drawn. y is untouched: the view scrolls sideways only.
   *
   * It lives here rather than in the scene because the renderer and the hit
   * test must not each keep their own idea of where the view is -- that is
   * R5i, two mechanisms agreeing until one of them changes.
   */
  toWorld(screenX: number): number {
    return screenX + this.camera;
  }

  /**
   * Doc 22 line 414's `camera` step, as the fenced minimum.
   *
   * `to` LOOKS AT a world x -- centred and then clamped, the same arithmetic
   * an entry uses -- and stops the view following. `follow` gives it to a
   * named mover. A beat that wants the view somewhere must be able to say so
   * and then hand it back, or the next walk snaps it.
   *
   * BOTH TOGETHER ARE LEGAL and mean "look here, then track him from there",
   * which is the only sensible reading. `to` is applied first, so the follow
   * starts its dead zone from where the cut put it.
   */
  moveCamera(to: number | undefined, follow: string | undefined): void {
    if (to !== undefined) {
      this.cameraFollows = null;
      this.camera = cameraAt(to, this.roomWidth);
    }
    if (follow !== undefined) this.cameraFollows = follow;
  }

  /**
   * Where to put him on entering, when this is a RETURN rather than an
   * arrival: back from the map, or back from a load. Walking through a door
   * is an arrival and still uses the entrance, because coming in through a
   * door is exactly what an entrance is for.
   *
   * The map is recognised by its own `kind`, so no `.ts` file names Room 0.
   */
  resumeStanding(from: string | null): [number, number] | undefined {
    const returning = from === null || this.content.rooms.get(from)?.kind === 'map';
    return returning ? this.standing.get(this.currentRoomId) : undefined;
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
    // THE VIEW GOES BACK TO HIM ON EVERY ENTRY. A beat that pinned the camera
    // and never handed it back can hold the view still for the rest of its own
    // room, which is visible and recoverable; carrying that across a door is
    // neither, and it would be a save-game state that looks like a dead engine.
    this.cameraFollows = this.content.actor.id;
    // CLAMPED BEFORE THE FIRST FRAME DRAWS, not after. Arriving at x=3200 with
    // the camera still at 0 and correcting on frame two is a visible jolt on
    // every entry, and it would look like the plate loading late.
    //
    // Wherever he will be standing: the resumed position if this is a return,
    // else the entrance, else the middle. The scene places him from the same
    // three, so the view starts where he does.
    const resumed = this.standing.get(roomId);
    const entrance = this.entranceInto(roomId, this.cameFrom)?.at;
    const width = roomWidth(this.content.rooms.get(roomId)?.size);
    const entryX = resumed?.[0] ?? entrance?.[0] ?? width / 2;
    this.camera = cameraAt(entryX, width);
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
      const exit = target as Partial<Exit>;
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
      // DOC 14: TRANSIT PRODUCES NO LINE, and a flag write is not a line --
      // the same argument `stateOnTransit` above is made from. Without this an
      // exit can write nothing at all: this branch returns before the response
      // resolves, so `set` on a response never fires for the verb that
      // actually goes through the door.
      for (const [flag, value] of Object.entries(exit.setOnTransit ?? {})) {
        effects.push({
          id: `act/${objectKey}/${verb}#transit:flag:${flag}`, kind: 'flag', flag, value,
        });
      }
      // AN EXIT THAT TRAVELS WHEN TOLD DOES NOT TRAVEL NOW. Doc 17's ending is
      // a departure the player watches; an exit that moves you the instant you
      // touch it cannot also be one. The flag above releases the beat, and the
      // beat travels when it ends.
      if (!exit.travelWhenTold) {
        effects.push({ id: `act/${objectKey}/${verb}#transit:room`, kind: 'room', room: transit });
      }
      return {
        target, verb, room, objectKey,
        action: { say: null, dialogue: null, goto: null, effects: [] },
        transit: true,
        // NOT REPORTED WHEN THE TRAVEL IS HELD. `destination` is what the
        // caller reads to know the room changed -- it drives the autosave and
        // the scene's own room-change bookkeeping -- and claiming a
        // destination nobody went to would autosave a move that did not
        // happen.
        destination: exit.travelWhenTold ? null : transit,
        dialogue: null,
        say: null,
        effects,
      };
    }

    // WITH AN ITEM HELD, ONLY A CARRY VERB APPLIES IT. Doc 24's USE X ON Y is
    // the two-click sentence; LOOK AT, OPEN, PULL and the rest are questions
    // about the target and were never about what he happens to be holding.
    //
    // Without the `carries` test every verb went down the WITH path while
    // anything was held, so LOOK AT on the letter while holding the letter
    // resolved as LOOK AT THE LETTER ON THE LETTER -- a pair nobody authored,
    // which fell through to a pool and then to nothing. Reported as the
    // sentence repeating twice and doing nothing.
    //
    // VerbSystem.carries() already existed for exactly this distinction and
    // its own comment names the inverted question -- "the small set is the one
    // that CARRIES, not the one that answers" -- but only VerbSystem asked it.
    // R5o: the predicate was written, correct, and unreached by the branch it
    // was written for.
    const action = this.held && this.verbs.carries(verb)
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
    // A container's contents. Distinct from the ownership transfer below:
    // nothing about the hotspot itself enters the inventory, so this does not
    // require target.item and does not conflict with it.
    for (const [n, item] of (action.items ?? []).entries()) {
      effects.push({ id: `act/${objectKey}/${verb}#take${n}`, kind: 'inventoryAdd', item });
    }
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
      then: action.then,
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
    const result = interaction.settle();
    // ERRATA 28b AS AMENDED (Q74): A VERB CLEARS ON USE.
    //
    // 28b used to say "a selected verb persists until another is chosen. It is
    // not cleared by use". That sentence is void. Persisting is what made the
    // mud problem permanent: `resetToDefault` ran only on a new game and no
    // deselect existed, so the no-verb state could be left exactly once per
    // playthrough and never returned to -- taking a third of 28b's own table
    // with it, and with that every object's `defaultVerb`, "the verb a player
    // would try first", live for one click each.
    //
    // HERE, AND NOT IN THE SCENE. It was written in `GameScene` first, where
    // it worked and where NO TEST COULD REACH IT: 132 tests passed without one
    // of them being able to see a change to how every click in the game
    // behaves. A rule about what the game does when a verb is used belongs to
    // the game.
    //
    // A BARE WALK STILL CONSUMES NOTHING -- 28b row 1, untouched. A click on
    // ground never reaches here.
    //
    // AND THE TWO-CLICK SENTENCE SURVIVES: USE on an inventory item HOLDS it
    // rather than resolving it (`carryVerbs`, doc 24's USE X ON Y), and that
    // path returns before this one. The verb clears when the sentence
    // finishes, not halfway through.
    this.verbs.resetToDefault();
    return result;
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
    return this.worldFor(resolution.objectKey);
  }

  /** The world a durable bundle applies into, bound to the object it happened on. */
  private worldFor(objectKey: string): DurableWorld {
    return {
      setFlag: (flag, value) => { this.flags.set(flag, value); },
      addFlag: (flag, delta) => { this.flags.set(flag, this.flags.getNumber(flag) + delta); },
      setObjectState: (object, state) => { this.objectStates.set(object, state); },
      setPuzzle: (puzzle, status) => { this.puzzles.set(puzzle, status); },
      enterRoom: (room) => { this.arrive(room); },
      addInventory: (item) => {
        this.taken.add(objectKey);
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
      puzzles: this.puzzleProgress(),
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
   * A POINT WITH NO DECLARED SURFACE HAS NO SURFACE. This used to fall back to
   * `content.actor.clips[0]?.surface` -- the protagonist's first clip -- to
   * avoid writing a surface name in a `.ts`, and it is the same defect as the
   * coach's height one indirection along: a question about the GROUND answered
   * out of a CHARACTER's record. It happened to be harmless only because no
   * clip declares a surface today, so it evaluated to the empty string anyway.
   *
   * NO_SURFACE keeps what that fallback was really for -- no .ts file gets to
   * know that mud is called mud -- without borrowing anybody's data to do it.
   * An empty string names nothing, which is the honest answer here.
   */
  surfaceAt(x: number, y: number): string {
    const boxes = this.boxes;
    if (boxes) return boxes.boxAt(x, y)?.surface ?? NO_SURFACE;
    return this.regionAt(x, y)?.surface ?? NO_SURFACE;
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
    return this.heightAt(x, y, false);
  }

  /**
   * The same curve, for a mover whose path is NOT confined to a walk box.
   *
   * A staged crossing deliberately leaves the boxes -- Hob enters at x-260 and
   * exits at 2100 against a box of 256 to 1629 -- and the box's x extent is a
   * statement about where a player may WALK, not about where the ground is.
   * The curve itself is a function of Y alone. Asking `actorHeightAt` would
   * have returned null for two thirds of his crossing and left him holding
   * whatever height he had, so he would have stepped from 240 to 224 at x256
   * in full view.
   *
   * `actorHeightAt` is deliberately NOT changed to do this. Its null means
   * "there is no floor here", which is a true and useful answer for the
   * routed player and is asserted as such.
   */
  stagedHeightAt(x: number, y: number): number | null {
    return this.heightAt(x, y, true);
  }

  private heightAt(x: number, y: number, staged: boolean): number | null {
    // A room with boxes gets its height from the box the actor is in. That is
    // errata 28a's whole point: the boardwalk is `fixed` at the far drawn
    // size and the mud is a `curve` starting above the threshold, so the
    // sprite swap happens at the lip rather than in open mud.
    const boxes = this.boxes;
    if (boxes) {
      const box = boxes.boxAt(x, y) ?? (staged ? boxes.nearest(x, y)?.box : undefined);
      return box ? heightIn(box, y) : null;
    }
    if (!staged && !this.isWalkable(x, y)) return null;
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
      puzzles: Object.fromEntries(this.puzzles),
      dialogueProgress: this.dialogue.progressSnapshot(),
      dialoguePosition: this.dialogue.positionSnapshot(),
      position: this.standing.get(this.currentRoomId),
    }, slot);
  }

  autosave(): void {
    this.save();
  }

  /** Returns false when there is no save, or the save is unreadable. */
  load(slot: number | null = null): boolean {
    const save = slot === null ? this.saves.read() : this.saves.readSlot(slot);
    if (!save) return false;
    return this.restoreFrom(save);
  }

  /**
   * A PLAYTEST FIXTURE IS RESTORED EXACTLY AS A SAVE IS. It is turned into a
   * save file first -- the fork held, the declared initial value of every
   * flag it does not name, no dialogue in progress, no standing position --
   * and goes through `restoreFrom`, so a fixture can only express what a
   * save can express and lands in the same state a load would. Undeclared
   * flags are dropped by `FlagStore.restore`; `tools/check-fixtures.mjs`
   * refuses them, and the documented prerequisites, at build time.
   */
  applyFixture(fixture: PlaytestFixture): boolean {
    const held = new Set([...this.startingInventory(), ...(fixture.inventory ?? [])]);
    return this.restoreFrom({
      version: 1,
      room: fixture.room,
      inventory: [...held].filter((id) => this.content.items.has(id)),
      reputation: 0,
      objectStates: fixture.objectStates ?? {},
      taken: [],
      flags: fixture.flags,
      puzzles: fixture.puzzles ?? {},
      dialogueProgress: fixture.dialogueCounts ?? {},
      dialoguePosition: { tree: null, node: null },
    });
  }

  /** Whether a canonical puzzle has been completed. Read by the probe and by tests. */
  puzzleComplete(id: string): boolean {
    return this.puzzles.get(id) === 'complete';
  }

  /** Every puzzle held complete, sorted. For the probe. */
  puzzlesComplete(): string[] {
    return [...this.puzzles.entries()].filter(([, status]) => status === 'complete').map(([id]) => id).sort();
  }

  /** Every puzzle with progress, by id. For the probe and the save. */
  puzzleProgress(): Record<string, PuzzleStatus> {
    return Object.fromEntries([...this.puzzles.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
  }

  /**
   * THE PAIR AN ITEM HAS WITH A PERSON IN THIS ROOM, if it is live. Errata 66
   * A-C: showing the submission log to Winnie is C5. Doc 24's table names
   * the pair; this asks whether it fires now -- the puzzles it needs are
   * complete and the one it completes is not -- and answers null otherwise,
   * so the caller falls through to the ordinary pools exactly as an item on
   * scenery does. It fires once by construction.
   */
  evidencePairFor(itemId: string, npcId: string): CombinationPair | null {
    const pair = (this.content.combinations?.pairs ?? []).find((one) => one.item === itemId
      && one.room === this.currentRoomId && one.target === npcId && one.opens && one.completes);
    if (!pair) return null;
    if ((pair.requiresPuzzles ?? []).some((id) => this.puzzles.get(id) !== 'complete')) return null;
    if (this.puzzles.get(pair.completes as string) === 'complete') return null;
    return pair;
  }

  /**
   * THE EVIDENCE ACTION LANDS: the pair's puzzle completes and its flags
   * write, through a journal like every other durable change, and the game
   * autosaves at the decision point. The item is not consumed (errata 66 A).
   * Called by the scene at contact, after the walk and the beat, and never
   * before -- a cancelled approach reaches this for nothing.
   */
  commitEvidence(pair: CombinationPair): void {
    if (!pair.completes) throw new Error(`the pair ${pair.item} on ${pair.target} completes nothing`);
    this.serial += 1;
    const id = `with:${this.currentRoomId}:${pair.target}:${pair.item}#${this.serial}`;
    const prefix = `with/${this.currentRoomId}/${pair.target}/${pair.item}`;
    const journal = this.journals.newJournal(id);
    const bundle = journal.reserve(`${id}/bundle`, [
      { id: `${prefix}#${pair.completes}`, kind: 'puzzleProgress', puzzle: pair.completes, status: 'complete' },
      ...flagEffects(prefix, pair.set),
    ]);
    journal.mark('line');
    journal.mark('lineSettle');
    commitBundle(bundle, this.worldFor(`${this.currentRoomId}/${pair.target}`), journal);
    journal.mark('stable');
    journal.release();
    this.autosave();
  }

  private restoreFrom(save: SaveFile): boolean {
    if (!this.content.rooms.has(save.room)) return false;

    this.flags.restore(save.flags);
    this.puzzles = new Map(Object.entries(save.puzzles ?? {})
      .filter(([, v]) => v === 'pending' || v === 'complete') as [string, PuzzleStatus][]);
    this.dialogue.restore(save.dialogueProgress, save.dialoguePosition);
    this.currentRoomId = save.room;
    this.inventory = [...save.inventory];
    this.reputation = save.reputation;
    this.held = null;
    this.cameFrom = null;
    this.scroll = 0;
    this.objectStates = new Map(Object.entries(save.objectStates ?? {}));
    this.taken = new Set(save.taken ?? []);
    // Only the saved room's position survives a load. Anywhere else he stood
    // this session belongs to a game that is being put away.
    this.standing.clear();
    if (save.position) this.standing.set(save.room, save.position);
    return true;
  }

  reset(): void {
    this.standing.clear();
    this.flags.reset();
    this.puzzles = new Map();
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
