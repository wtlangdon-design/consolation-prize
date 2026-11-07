/**
 * A HEADLESS PLAYER for the continuous playthrough (tests/full-game.test.ts).
 *
 * It drives a real GameState only through what a player's click reaches, and
 * where the click lands in GameScene rather than GameState, it mirrors the
 * scene's own handling of the CONTENT the scene reads -- nothing more. Every
 * mirrored piece names the GameScene method it stands in for, so a reader can
 * check the two agree:
 *
 *   arrival()        GameScene.enterRoomPerformance -> arrivalLines / armAccost / timeline / listening
 *   settle()         GameScene.update: travelAfterSay, afterTimeline, advanceSay -> afterArrival
 *   talk()           GameScene's TALK TO on an ambient character (pendingTree -> dialogue.start)
 *   use()            GameScene's held item on a person (evidence pair / plain pair) or on a hotspot
 *   tap()            GameScene.listenAt + tickListening (Room 33)
 *   opening()        GameScene.beginOpening / playOpeningSegment / advanceOpening + CarriedBeats.play
 *   go()             exits (a transit verb on the exit) and the map (toggleMap + travelTo)
 *
 * WHAT IT DOES NOT DO: it never writes a flag, an item or a puzzle that the
 * content did not ask the engine to write. Time passing (a timeline running
 * out, the ninety seconds of tuning, a line being read) is the one thing it
 * supplies, because a headless run has no clock.
 *
 * No content strings live here: every id it uses comes from the walkthrough
 * data or from the content bundle.
 */
import type { GameState } from '../../engine/core/GameState.ts';
import { AmbientLayer } from '../../engine/core/Ambient.ts';
import { RoomTimeline } from '../../engine/core/RoomTimeline.ts';
import { segmentsOf, writesOf, type Segment } from '../../engine/core/Opening.ts';
import { tapAt } from '../../engine/core/Listening.ts';
import type { AmbientFile, Interactable, Exit, MapLocation, SequenceBeat } from '../../engine/core/types.ts';

export class PlayError extends Error {}

type Owed = { set?: Record<string, boolean | number>; gives?: string[]; completes?: string };
type Edge = { kind: 'exit'; from: string; exit: Exit } | { kind: 'map'; from: string; location: MapLocation };

export class HeadlessPlayer {
  readonly state: GameState;
  readonly ambient: AmbientLayer;
  /** Every line the run has "heard", in order, as ids/speakers only. */
  readonly trail: string[] = [];
  private readonly timeline = new RoomTimeline();
  /** GameScene.travelAfterSay: a scene's room change, once its lines have been read. */
  private travelAfterSay: string | null = null;
  /** GameScene.afterArrival: owed arrival-scene outcomes. */
  private owedArrival: Owed[] = [];
  /** The opening's segments still to play (GameScene.opening), and the carried remainder (CarriedBeats). */
  private opening: Segment[] | null = null;
  private openingAt = 0;
  private carried: SequenceBeat[] = [];
  private openingDoneFlag: string | null = null;

  constructor(state: GameState) {
    this.state = state;
    this.ambient = new AmbientLayer(state);
  }

  private note(line: string): void {
    this.trail.push(`[${this.state.roomId}] ${line}`);
  }

  /* ---- the opening ------------------------------------------------------- */

  /** GameScene.beginOpening: only in the manifest's start room, only once. */
  beginOpening(): void {
    const id = this.state.content.manifest.openingSequence;
    const file = id ? this.state.content.sequences.get(id) : undefined;
    if (!file) throw new PlayError('the manifest names no opening sequence');
    this.openingDoneFlag = file.doneFlag ?? null;
    if (this.openingDoneFlag && this.state.flags.get(this.openingDoneFlag) === true) return;
    if (this.state.roomId !== this.state.content.manifest.startRoom) return;
    this.opening = segmentsOf(file).filter((segment) => segment.kind !== 'menu');
    this.openingAt = 0;
    this.arrival(null);
    this.playOpening();
  }

  get openingRunning(): boolean {
    return this.opening !== null;
  }

  /** GameScene.playOpeningSegment, with each automatic segment's performance collapsed to its writes. */
  private playOpening(): void {
    while (this.opening && this.openingAt < this.opening.length) {
      const segment = this.opening[this.openingAt]!;
      if (segment.kind === 'automatic') {
        this.note(`opening beat(s) ${segment.beats.map((b) => b.beat).join(',')} play`);
        this.state.flags.applyWrites(writesOf(segment));
        this.openingAt += 1;
        continue;
      }
      if (segment.carriedBy) {
        this.note(`opening beat(s) ${segment.beats.map((b) => b.beat).join(',')} carried by ${segment.carriedBy}`);
        this.state.dialogue.start(segment.carriedBy);
        return;
      }
      const remaining = this.opening.slice(this.openingAt).flatMap((rest) => rest.beats);
      this.finishOpening();
      this.carried = remaining;
      this.playCarried();
      return;
    }
    this.finishOpening();
  }

  private finishOpening(): void {
    this.opening = null;
    if (this.openingDoneFlag) this.state.flags.applyWrites({ [this.openingDoneFlag]: true });
    this.state.autosave();
  }

  /**
   * CarriedBeats.play: each beat waits on its flag, then writes its `set`; a
   * `travel` step goes through the named exit (SequenceWorld's travel).
   */
  private playCarried(): void {
    while (this.carried.length) {
      const beat = this.carried[0]!;
      if (beat.awaitFlag && this.state.flags.get(beat.awaitFlag) !== true) return;
      this.carried.shift();
      this.note(`carried beat ${beat.beat} plays`);
      this.state.flags.applyWrites(beat.set ?? {});
      for (const staged of (beat as { staging?: { do: string; through?: string }[] }).staging ?? []) {
        if (staged.do === 'travel' && staged.through) {
          const exit = this.state.room.exits.find((one) => one.id === staged.through);
          if (!exit) throw new PlayError(`carried beat ${beat.beat} travels through "${staged.through}", which ${this.state.roomId} has no exit for`);
          const from = this.state.roomId;
          this.state.enterRoom(exit.to);
          this.carried = [];
          this.arrival(from);
          return;
        }
      }
    }
  }

  /* ---- arriving ---------------------------------------------------------- */

  /**
   * GameScene.enterRoomPerformance, minus the drawing. `from` is the room
   * walked out of (null for a load). A return from the map to a room he has
   * stood in this session is a RESUME and plays nothing (resumeStanding).
   */
  private arrival(from: string | null): void {
    this.ambient.arrived();
    this.timeline.stop();
    const room = this.state.room;
    if (room.timeline?.length) {
      this.timeline.start(room.timeline);
      const checkpoint = this.timeline.checkpoint;
      if (checkpoint?.do === 'dialogue' && checkpoint.completes && this.state.puzzleComplete(checkpoint.completes)) {
        for (const due of this.timeline.skipToCheckpoint()) this.timelineStep(due);
      }
    }
    const resume = this.state.resumeStanding(from);
    const listening = room.listening;
    if (listening) {
      if (this.state.flags.test({ [listening.foundFlag]: true })
        && !this.state.flags.test({ [listening.tune.doneFlag]: true })) {
        this.state.flags.applyWrites({ [listening.tune.doneFlag]: true });
      }
      if (listening.fork && !this.state.flags.test({ [listening.fork.onceFlag]: true })) {
        this.state.flags.applyWrites({ [listening.fork.onceFlag]: true });
      }
    }
    if (resume) this.note(`resumes (returned from ${from ?? 'a load'} to a room he has stood in) -- no arrival lines, no accost`);
    else this.arrivalLines();
    // The scene remembers where he stands every frame he is not on the map.
    if (!this.state.isMap) {
      const at = this.state.entranceInto(room.id, from)?.at ?? [Math.round(this.state.roomWidth / 2), 760];
      this.state.rememberStanding(at[0], at[1]);
    }
    if (!resume) this.accost();
  }

  /** GameScene.arrivalLines, with the reading of the lines collapsed. */
  private arrivalLines(): void {
    const entry = this.state.room.onEnter;
    if (!entry?.say?.length && !entry?.scenes?.length && !entry?.walkTo) return;
    const { held, scenes } = this.state.arrivalOf();
    const lines = [...(held ? [] : (entry.say ?? [])), ...scenes.flatMap((scene) => scene.lines.map((l) => l.speaker))];
    if (entry.sayWhen !== undefined && !held && lines.length && entry.sayOnce) this.state.flags.set(entry.sayOnce, true);
    if (!held && entry.say?.length && entry.saySet) this.state.flags.applyWrites(entry.saySet);
    if (lines.length) this.note(`arrival: ${lines.length} line(s)${scenes.length ? `, ${scenes.length} scene(s)` : ''}`);
    const owed = scenes.map((scene) => scene.after).filter((after) => after !== undefined);
    this.owedArrival.push(...(owed as Owed[]));
    // The lines are read; the scene's outcome lands (GameScene.advanceSay).
    this.payArrival();
  }

  private payArrival(): void {
    const owed = this.owedArrival;
    this.owedArrival = [];
    for (const done of owed) this.state.afterArrival(done);
  }

  /** GameScene.armAccost, its delay elapsed. */
  private accost(): void {
    const accost = this.state.room.onEnter?.accost;
    if (!accost) return;
    const holds = this.state.flags.test(accost.when)
      && (!accost.whenAny || accost.whenAny.some((when) => this.state.flags.test(when)))
      && !(accost.completes && this.state.puzzleComplete(accost.completes));
    if (!holds || this.state.dialogue.isActive) return;
    const npc = this.ambient.present.find((each) => each.id === accost.npc);
    if (!npc?.tree) return;
    for (const [id, value] of Object.entries(accost.set ?? {})) this.state.flags.set(id, value);
    if (accost.completes) this.state.completeByTimeline(accost.completes);
    this.note(`accosted by ${npc.id}${accost.duel ? ` (${accost.duel})` : ''}`);
    if (accost.duel) this.state.dialogue.startDuel(npc.tree, accost.duel);
    else this.state.dialogue.start(npc.tree);
  }

  /** GameScene.applyTimelineStep: only the steps with state (the plate, sound and panel are drawing). */
  private timelineStep(due: { do: string; tree?: string; completes?: string }): void {
    if (due.do !== 'dialogue') return;
    if (due.completes) this.state.completeByTimeline(due.completes);
    if (due.tree && this.state.content.dialogue.has(due.tree) && !this.state.dialogue.isActive) {
      this.note(`timeline opens ${due.tree}`);
      this.state.dialogue.start(due.tree);
    }
  }

  /** Lets a timeline room's clock run out (Room 32's minutes). */
  waitOutTimeline(): number {
    let ran = 0;
    for (const due of this.timeline.advance(60 * 60 * 1000)) { this.timelineStep(due); ran += 1; }
    this.settle();
    return ran;
  }

  /**
   * GameScene.update's hand-ons, once nothing is being said: a scene that
   * leads somewhere travels; a room that is over hands on (afterTimeline);
   * the opening's carried beats move on.
   */
  settle(): void {
    for (let guard = 0; guard < 10; guard += 1) {
      if (this.state.dialogue.isActive) return;
      if (this.opening) {
        // A carried segment's tree has closed: GameScene.showPerformance -> advanceOpening.
        const segment = this.opening[this.openingAt];
        if (segment?.carriedBy) {
          this.state.flags.applyWrites(writesOf(segment));
          this.openingAt += 1;
          this.playOpening();
          continue;
        }
      }
      if (this.travelAfterSay !== null) {
        const to = this.travelAfterSay;
        const from = this.state.roomId;
        this.travelAfterSay = null;
        this.note(`the scene travels to ${to}`);
        this.state.enterRoom(to);
        this.arrival(from);
        continue;
      }
      const after = this.state.room.afterTimeline;
      if (after && (!this.state.room.timeline?.length || !this.timeline.isRunning) && this.state.flags.test(after.when)) {
        const from = this.state.roomId;
        this.note(`the room hands on to ${after.goto}`);
        this.state.enterRoom(after.goto);
        this.arrival(from);
        continue;
      }
      // GameScene.openActWhenQuiet: the act's card has come down; the cut and the line (errata 101 B).
      if (this.state.actOpeningDue) {
        const from = this.state.roomId;
        const lines = this.state.openAct();
        this.note(`the act opens in ${this.state.roomId}: ${lines.length} line(s)`);
        this.arrival(from);
        continue;
      }
      if (this.carried.length) {
        const before = this.carried.length;
        this.playCarried();
        if (this.carried.length !== before) continue;
      }
      return;
    }
  }

  /* ---- verbs --------------------------------------------------------------- */

  /** Who is in the room to click on (AmbientLayer.present). */
  present(): AmbientFile[] {
    return this.ambient.present;
  }

  person(id: string): AmbientFile | undefined {
    return this.present().find((npc) => npc.id === id);
  }

  private afterInteraction(result: { goesTo?: string; changedRoom: boolean }, from: string): void {
    if (result.changedRoom) this.arrival(from);
    if (result.goesTo) this.travelAfterSay = result.goesTo;
    this.settle();
  }

  /** A verb on a hotspot or exit in this room (GameScene.applyInteraction). */
  verb(targetId: string, verb: string): { say: string | null } {
    this.requireIdle(`${verb} ${targetId}`);
    const target = this.state.findTarget(targetId);
    if (!target) {
      const npc = this.person(targetId);
      if (npc) return this.verbOnPerson(npc, verb);
      throw new PlayError(`no "${targetId}" to ${verb} in ${this.state.roomId} (targets: ${this.state.targets.map((t) => t.id).join(', ')})`);
    }
    if (this.state.room.listening && target.id === this.state.room.listening.surface && verb === 'LISTEN_TO') {
      throw new PlayError('a LISTEN on the listening surface is a tap: use the "tap" step');
    }
    const from = this.state.roomId;
    this.state.holdItem(null);
    const result = this.state.interact(target, verb);
    this.note(`${verb} ${targetId}${result.say ? '' : ' (no line)'}`);
    this.afterInteraction(result, from);
    return result;
  }

  /** A verb other than TALK TO on a person: the room's lines for them, their own layer, or the people pool. */
  private verbOnPerson(npc: AmbientFile, verb: string): { say: string | null } {
    const roomLines = this.state.room.peopleResponses?.[npc.id]?.[verb];
    if (roomLines?.some((rule) => this.state.flags.test(rule.when)) && (verb !== 'TALK_TO' || !npc.tree)) {
      const from = this.state.roomId;
      const result = this.state.interact({ id: `${npc.id}@${this.state.room.id}`, name: npc.name, rect: [0, 0, 1, 1], colour: 0,
        responses: { [verb]: roomLines.filter((rule) => this.state.flags.test(rule.when)) } } as Interactable, verb);
      this.note(`${verb} ${npc.id} (room lines)`);
      this.afterInteraction(result, from);
      return result;
    }
    const layer = npc.tree ? this.state.content.dialogue.get(npc.tree)?.examine : undefined;
    if (layer?.[verb]?.length) {
      const from = this.state.roomId;
      const result = this.state.interact({ id: npc.id, name: npc.name, rect: [0, 0, 1, 1], colour: 0, responses: layer } as Interactable, verb);
      this.afterInteraction(result, from);
      return result;
    }
    const pool = this.state.content.verbFallbacks?.people?.[verb];
    this.state.verbs.resetToDefault();
    return { say: Array.isArray(pool) ? (pool[0] ?? null) : null };
  }

  /** TALK TO a character in the room: his tree opens (GameScene's pendingTree -> dialogue.start). */
  talk(npcId: string): void {
    const npc = this.person(npcId);
    // Already talking to him: he opened on Thad as he walked in (an accost).
    if (npc?.tree && this.state.dialogue.isActive && this.state.dialogue.activeTreeId === npc.tree) {
      this.note(`TALK TO ${npcId}: already in his conversation`);
      return;
    }
    this.requireIdle(`TALK TO ${npcId}`);
    if (!npc) {
      throw new PlayError(`nobody called "${npcId}" is in ${this.state.roomId} (present: ${this.present().map((one) => one.id).join(', ') || 'nobody'})`);
    }
    if (!npc.tree) {
      this.verbOnPerson(npc, 'TALK_TO');
      return;
    }
    this.note(`TALK TO ${npcId} -> ${npc.tree}`);
    this.state.dialogue.start(npc.tree);
  }

  /** A presented option, by id; refused when the list does not offer it. */
  choose(optionId: string): void {
    if (!this.state.dialogue.isActive) throw new PlayError(`no conversation is open to choose "${optionId}" in`);
    const offered = this.state.dialogue.presentOptions();
    const found = offered.find((one) => one.option.id === optionId);
    if (!found) {
      const node = this.state.dialogue.positionSnapshot().node;
      throw new PlayError(`"${optionId}" is not offered at ${this.state.dialogue.activeTreeId}/${node} (offered: ${offered.map((one) => one.option.id).join(', ')})`);
    }
    const result = this.state.dialogue.select(optionId);
    this.note(`chooses ${optionId}${result.ended ? ' (ends)' : ''}`);
    if (!this.state.dialogue.isActive) this.settle();
  }

  /** The EXIT row of whatever node is open (the tree's own way out), if he is still in a conversation. */
  leave(): void {
    if (!this.state.dialogue.isActive) return;
    if (this.state.dialogue.inDuel) throw new PlayError('no way out of a duel but through it');
    const exit = this.state.dialogue.presentOptions().find((one) => one.option.tag === 'EXIT' || one.option.ends);
    if (!exit) {
      const node = this.state.dialogue.positionSnapshot().node;
      throw new PlayError(`no EXIT row at ${this.state.dialogue.activeTreeId}/${node}`);
    }
    this.choose(exit.option.id);
  }

  /** Fights the open duel: the right counter whenever he knows it, else the first wrong one. */
  duel(): 'won' | 'lost' | 'unended' {
    if (!this.state.dialogue.inDuel) throw new PlayError('no duel is being fought');
    for (let guard = 0; guard < 40 && this.state.dialogue.inDuel; guard += 1) {
      const offers = this.state.dialogue.presentOptions();
      const pick = offers.find((one) => one.option.id === 'right') ?? offers[0];
      if (!pick) throw new PlayError('a duel offered no counters');
      this.state.dialogue.select(pick.option.id);
    }
    if (this.state.dialogue.inDuel) return 'unended';
    if (!this.state.dialogue.isActive) this.settle();
    return 'won';
  }

  /** USE an item on a hotspot or a person (GameScene: the held item, then the click). */
  use(item: string, targetId: string): { say: string | null } {
    this.requireIdle(`USE ${item} ON ${targetId}`);
    if (!this.state.carried.includes(item)) {
      throw new PlayError(`he is not carrying "${item}" (carrying: ${this.state.carried.join(', ')})`);
    }
    const from = this.state.roomId;
    const npc = this.state.findTarget(targetId) ? undefined : this.person(targetId);
    this.state.holdItem(null);
    this.state.holdItem(item);
    if (npc) {
      const pair = this.state.evidencePairFor(item, npc.id);
      if (npc.tree && pair && pair.opens === npc.tree) {
        // The evidence action lands at contact, then the tree opens through it.
        this.state.holdItem(null);
        this.state.verbs.resetToDefault();
        this.state.commitEvidence(pair);
        this.note(`shows ${item} to ${npc.id} -> ${npc.tree}`);
        this.state.dialogue.start(npc.tree);
        return { say: null };
      }
      // Any other item on a person resolves as an item on anything does: the
      // pair, the item's pool, the global pool (doc 24; errata 140).
      const result = this.state.interact({ id: npc.id, name: npc.name, rect: [0, 0, 1, 1], colour: 0, responses: {},
        ...(npc.walkTo ? { walkTo: npc.walkTo } : {}) } as Interactable, 'USE');
      this.note(`USE ${item} ON ${npc.id}`);
      this.afterInteraction(result, from);
      return result;
    }
    const target = this.state.findTarget(targetId);
    if (!target) {
      this.state.holdItem(null);
      throw new PlayError(`no "${targetId}" to use ${item} on in ${this.state.roomId} (targets: ${this.state.targets.map((t) => t.id).join(', ')}; present: ${this.present().map((one) => one.id).join(', ')})`);
    }
    const result = this.state.interact(target, 'USE');
    this.state.holdItem(null);
    this.note(`USE ${item} ON ${targetId}`);
    this.afterInteraction(result, from);
    return result;
  }

  /** USE one carried item on another (GameScene.onInventoryClick with an item held). */
  useOnItem(item: string, other: string): { say: string | null } {
    this.requireIdle(`USE ${item} ON ${other}`);
    for (const id of [item, other]) {
      if (!this.state.carried.includes(id)) throw new PlayError(`he is not carrying "${id}"`);
    }
    const from = this.state.roomId;
    this.state.holdItem(null);
    this.state.verbs.selectVerb('USE');
    if (this.state.inventoryClick(item) !== 'hold') throw new PlayError(`a USE click on ${item} does not pick it up`);
    this.state.holdItem(item);
    if (this.state.inventoryClick(other) !== 'apply') throw new PlayError(`a USE click on ${other} with ${item} in hand does not apply it`);
    const result = this.state.interact(this.state.itemTarget(other)!, 'USE');
    this.note(`USE ${item} ON ${other}`);
    this.afterInteraction(result, from);
    return result;
  }

  /**
   * Room 33: LISTEN TO the rock at a point (GameScene.listenAt). `at` is the
   * void's own position, read from the room, unless given: the player finds it
   * by ear and the run cannot. The ninety seconds then pass (tickListening).
   */
  tap(at?: [number, number]): boolean {
    this.requireIdle('tap');
    const listening = this.state.room.listening;
    if (!listening) throw new PlayError(`${this.state.roomId} is not a listening room`);
    const [x, y] = at ?? listening.void.at;
    // The click has to land on the rock: the scene answers a tap only through the surface's own hotspot.
    const surface = this.state.targetAt(x, y);
    if (surface?.id !== listening.surface) {
      throw new PlayError(`a click at ${x},${y} lands on ${surface?.id ?? 'nothing'}, not the listening surface "${listening.surface}"`);
    }
    const answer = tapAt(listening, x, y);
    this.state.verbs.resetToDefault();
    if (answer.void && !this.state.flags.test({ [listening.foundFlag]: true })) {
      const from = this.state.roomId;
      const result = this.state.interact({ id: `${listening.surface}#void`, name: surface.name, rect: surface.rect, colour: 0,
        distant: true, responses: { LISTEN_TO: [listening.found] } } as Interactable, 'LISTEN_TO');
      this.note('taps the void');
      this.afterInteraction(result, from);
      this.state.flags.applyWrites({ [listening.tune.doneFlag]: true });
    }
    return answer.void;
  }

  /* ---- travel ------------------------------------------------------------- */

  private mapRoomId(): string | null {
    for (const [id, room] of this.state.content.rooms) if (room.kind === 'map') return id;
    return null;
  }

  /** The exits a room offers right now (GameState.targets' gate, for a room he is not in). */
  private exitsOf(roomId: string): Exit[] {
    const room = this.state.content.rooms.get(roomId);
    if (!room) return [];
    return room.exits.filter((exit) => this.state.flags.test(exit.when)
      && Object.entries(exit.holding ?? {}).every(([item, held]) => this.state.carried.includes(item) === held));
  }

  private mapLocationsNow(): MapLocation[] {
    const map = this.state.content.rooms.get(this.mapRoomId() ?? '');
    return (map?.locations ?? []).filter((location) => this.state.flags.test(location.when)
      && Object.entries(location.holding ?? {}).every(([item, held]) => this.state.carried.includes(item) === held)
      && this.state.content.rooms.has(location.room));
  }

  /** The shortest way there: exits and the map. Exits that play a scene or travel when told are not route legs. */
  private route(to: string): Edge[] | null {
    const mapId = this.mapRoomId();
    const start = this.state.roomId;
    const seen = new Map<string, Edge[]>([[start, []]]);
    const queue = [start];
    while (queue.length) {
      const at = queue.shift()!;
      const path = seen.get(at)!;
      if (at === to) return path;
      const edges: Edge[] = [];
      for (const exit of this.exitsOf(at)) {
        if (exit.travelWhenTold) continue;
        // A door that is a beat and keeps him where he is (a refusal) is not a way out.
        const scene = exit.transitScene?.find((rule) => this.state.flags.test(rule.when));
        if (scene?.stays) continue;
        edges.push({ kind: 'exit', from: at, exit });
      }
      if (mapId && at === mapId) {
        for (const location of this.mapLocationsNow()) edges.push({ kind: 'map', from: at, location });
      } else if (mapId && !this.state.content.rooms.get(at)?.kind) {
        // The map button: always reachable once the panel is (doc 20 rule 2).
        edges.push({ kind: 'map', from: at, location: { id: '#map', room: mapId } as MapLocation });
      }
      for (const edge of edges) {
        const next = edge.kind === 'exit' ? edge.exit.to : edge.location.room;
        if (seen.has(next)) continue;
        seen.set(next, [...path, edge]);
        queue.push(next);
      }
    }
    return null;
  }

  /** Walks there by exits and the map, one leg at a time, checking each leg lands. */
  go(to: string): string[] {
    this.requireIdle(`go to ${to}`);
    if (this.state.roomId === to) return [];
    const legs = this.route(to);
    if (!legs) throw new PlayError(`no way from ${this.state.roomId} to ${to} with the exits and map places open now`);
    const taken: string[] = [];
    for (const leg of legs) {
      const from = this.state.roomId;
      if (leg.kind === 'exit') {
        const target = this.state.findTarget(leg.exit.id);
        if (!target) throw new PlayError(`the exit ${leg.exit.id} is not there in ${from}`);
        const verb = this.state.verbs.isTransit('WALK_TO') ? 'WALK_TO' : 'USE';
        const result = this.state.interact(target, verb);
        if (result.goesTo) this.travelAfterSay = result.goesTo;
        if (result.changedRoom) this.arrival(from);
        this.settle();
        taken.push(`${leg.exit.id}`);
        if (this.state.roomId === from) throw new PlayError(`the exit ${leg.exit.id} in ${from} did not go anywhere${result.say ? ' (it answered instead)' : ''}`);
      } else if (leg.location.id === '#map') {
        this.state.enterRoom(leg.location.room);
        this.arrival(from);
        taken.push('map');
      } else {
        if (!this.state.travelTo(leg.location)) throw new PlayError(`the map would not travel to ${leg.location.room}`);
        this.arrival(from);
        taken.push(`map:${leg.location.id}`);
      }
      if (this.state.dialogue.isActive) break;
    }
    this.note(`goes: ${taken.join(' > ')}`);
    return taken;
  }

  private requireIdle(what: string): void {
    if (this.state.dialogue.isActive) {
      const node = this.state.dialogue.positionSnapshot().node;
      throw new PlayError(`cannot ${what}: a conversation is open (${this.state.dialogue.activeTreeId}/${node})`);
    }
  }
}

/* ---- the walkthrough ------------------------------------------------------ */

/** What a step expects to be true once it has been played. Ids only. */
export interface Expectation {
  room?: string;
  act?: number;
  puzzles?: string[];
  puzzlesPending?: string[];
  flags?: Record<string, boolean | number>;
  carrying?: string[];
  notCarrying?: string[];
  present?: string[];
  absent?: string[];
  /** The conversation open afterwards (a tree id), or null for none. */
  dialogue?: string | null;
  node?: string;
  offered?: string[];
  notOffered?: string[];
  targets?: string[];
  noTargets?: string[];
}

/**
 * A MINIMAL, LABELLED WAY PAST A BREAK. Only ever applied after the step it
 * belongs to has broken, so that play can go on and find the next one. It is
 * the finding, not a fix: the test prints it every run.
 */
export interface Bypass {
  reason: string;
  flags?: Record<string, boolean | number>;
  give?: string[];
  complete?: string[];
  enter?: string;
}

export interface Step {
  id: string;
  puzzle?: string;
  do: 'opening' | 'go' | 'talk' | 'choose' | 'leave' | 'use' | 'verb' | 'duel' | 'tap' | 'wait' | 'check';
  room?: string;
  npc?: string;
  choose?: string[];
  leave?: boolean;
  item?: string;
  on?: string;
  verb?: string;
  /** For a duel: the outcome play should reach. */
  outcome?: 'won' | 'lost';
  expect?: Expectation;
  bypass?: Bypass;
}

export interface Break {
  step: string;
  puzzle: string | null;
  room: string;
  problem: string;
  bypassed: string | null;
}

export function unmet(player: HeadlessPlayer, expect: Expectation | undefined): string[] {
  if (!expect) return [];
  const state = player.state;
  const out: string[] = [];
  if (expect.room !== undefined && state.roomId !== expect.room) out.push(`room is ${state.roomId}, expected ${expect.room}`);
  if (expect.act !== undefined && Number(state.flags.get('ACT')) !== expect.act) out.push(`ACT is ${state.flags.get('ACT')}, expected ${expect.act}`);
  for (const id of expect.puzzles ?? []) if (!state.puzzleComplete(id)) out.push(`puzzle ${id} is ${state.puzzleProgress()[id] ?? 'not started'}, expected complete`);
  for (const id of expect.puzzlesPending ?? []) if (state.puzzleProgress()[id] !== 'pending') out.push(`puzzle ${id} is ${state.puzzleProgress()[id] ?? 'not started'}, expected pending`);
  for (const [flag, value] of Object.entries(expect.flags ?? {})) {
    const actual = state.flags.get(flag);
    if (actual !== value) out.push(`${flag} is ${String(actual)}, expected ${String(value)}`);
  }
  for (const item of expect.carrying ?? []) if (!state.carried.includes(item)) out.push(`not carrying ${item}`);
  for (const item of expect.notCarrying ?? []) if (state.carried.includes(item)) out.push(`still carrying ${item}`);
  for (const id of expect.present ?? []) if (!player.person(id)) out.push(`${id} is not present`);
  for (const id of expect.absent ?? []) if (player.person(id)) out.push(`${id} is present`);
  if (expect.dialogue !== undefined) {
    const open = state.dialogue.isActive ? state.dialogue.activeTreeId : null;
    if (open !== expect.dialogue) out.push(`conversation open is ${open ?? 'none'}, expected ${expect.dialogue ?? 'none'}`);
  }
  if (expect.node !== undefined) {
    const node = state.dialogue.isActive ? state.dialogue.positionSnapshot().node : null;
    if (node !== expect.node) out.push(`node is ${node ?? 'none'}, expected ${expect.node}`);
  }
  const offered = state.dialogue.isActive ? state.dialogue.presentOptions().map((one) => one.option.id) : [];
  for (const id of expect.offered ?? []) if (!offered.includes(id)) out.push(`${id} is not offered (offered: ${offered.join(', ')})`);
  for (const id of expect.notOffered ?? []) if (offered.includes(id)) out.push(`${id} is offered`);
  const targets = state.targets.map((one) => one.id);
  for (const id of expect.targets ?? []) if (!targets.includes(id)) out.push(`${id} is not a target here`);
  for (const id of expect.noTargets ?? []) if (targets.includes(id)) out.push(`${id} is a target here`);
  return out;
}

export function playStep(player: HeadlessPlayer, step: Step): void {
  switch (step.do) {
    case 'opening': player.beginOpening(); break;
    case 'go': player.go(need(step.room, step, 'room')); break;
    case 'talk': player.talk(need(step.npc, step, 'npc')); break;
    case 'choose': break;
    case 'leave': player.leave(); break;
    case 'use': player.use(need(step.item, step, 'item'), need(step.on, step, 'on')); break;
    case 'verb': player.verb(need(step.on, step, 'on'), need(step.verb, step, 'verb')); break;
    case 'duel': {
      const outcome = player.duel();
      if (outcome === 'unended') throw new PlayError('the duel did not end');
      break;
    }
    case 'tap': if (!player.tap()) throw new PlayError('the tap did not land on the void'); break;
    case 'wait': player.waitOutTimeline(); break;
    case 'check': break;
  }
  for (const id of step.choose ?? []) player.choose(id);
  if (step.leave && step.do !== 'leave') player.leave();
}

function need<T>(value: T | undefined, step: Step, field: string): T {
  if (value === undefined) throw new PlayError(`step ${step.id} has no ${field}`);
  return value;
}

/** Applies a bypass, as visibly as possible. */
export function applyBypass(player: HeadlessPlayer, bypass: Bypass): void {
  const state = player.state;
  if (state.dialogue.isActive) state.dialogue.end();
  for (const [flag, value] of Object.entries(bypass.flags ?? {})) state.flags.set(flag, value);
  const inventory = (state as unknown as { inventory: string[] }).inventory;
  for (const item of bypass.give ?? []) if (!inventory.includes(item)) inventory.push(item);
  for (const id of bypass.complete ?? []) state.completeByTimeline(id);
  if (bypass.enter) state.enterRoom(bypass.enter);
  player.settle();
}

/** Plays every step; a step that throws or misses its expectation is a break, and play goes on. */
export function playThrough(player: HeadlessPlayer, steps: Step[]): Break[] {
  const breaks: Break[] = [];
  for (const step of steps) {
    let problem: string | null = null;
    let threw = false;
    try {
      playStep(player, step);
      const missing = unmet(player, step.expect);
      if (missing.length) problem = missing.join('; ');
    } catch (error) {
      if (!(error instanceof PlayError)) throw error;
      problem = error.message;
      threw = true;
    }
    if (problem === null) continue;
    const found: Break = {
      step: step.id, puzzle: step.puzzle ?? null, room: player.state.roomId, problem,
      bypassed: step.bypass ? step.bypass.reason : null,
    };
    breaks.push(found);
    if (step.bypass) applyBypass(player, step.bypass);
    // A step that played but missed its expectation leaves play where it is;
    // one that could not be played leaves any conversation it stranded.
    else if (threw && player.state.dialogue.isActive && !player.state.dialogue.inDuel) {
      try { player.leave(); } catch { player.state.dialogue.end(); player.settle(); }
    }
  }
  return breaks;
}
