import type { AmbientExit, AmbientFile, Condition } from './types.ts';
import { departureAt, walkDuration, type DeparturePose, type HeightAt } from './Departure.ts';
import type { GameState } from './GameState.ts';

export interface FiredBark {
  npc: AmbientFile;
  line: string;
  /** A bark two people say (AmbientFile.barkExchange): every line, in order, `line` the first. */
  exchange?: { speaker: string; line: string }[];
  /** A bark that is played, not said (AmbientFile.barkCues): the sound cue to fire. */
  cue?: string;
}

/**
 * Ambient barks: the town appearing to pay attention to the player.
 *
 * Doc 07's rules, implemented literally. Barks fire on approach rather than
 * on click. One bark per reputation state per character, and once it has
 * fired it does not fire again in that state -- the town is not a soundboard.
 */
/**
 * How wide a character is to click, as a fraction of his DRAWN height.
 *
 * IT WAS A FLAT 8 AND IT WAS THE 320-ERA NUMBER. A figure was about 40 rows
 * tall then, so a 16px box was 40% of his height and about the width of a man.
 * The zones are 263/240/222 now and the constant was never multiplied -- so
 * every ambient character in the game had a SIXTEEN PIXEL hit box against a
 * 240px figure, 7% of his width. They were not unclickable in principle; they
 * were unclickable in practice, and doc 07 has eighteen of them.
 *
 * 8/40 = 0.2, so at 240 this gives 48 -- which is exactly x6, and that matters:
 * the mechanical migration and the proportional rule agree today, so storing
 * the ratio does not re-choose the number, it records where the number came
 * from. "Multiplied, not re-chosen" is honoured either way.
 *
 * THE REASON TO STORE THE RATIO IS DEPTH, NOT THE NEXT ZONE CHANGE. Drawn
 * height already varies inside one room -- 222 at the back of Room 1's band
 * against 98 up the road -- so a fixed 48 would be a 96px box on a man drawn 98
 * tall, wider than he is tall, swallowing whatever stood beside him. The
 * ambient three sit at fixed positions so it would not bite today; the mover
 * hit path crosses depth by definition and is built on top of this.
 */
const NPC_HALF_WIDTH = 0.2;

/** A character walking out (AmbientFile.exit), where he is this frame. */
export interface Departing {
  npc: AmbientFile;
  exit: AmbientExit;
  pose: DeparturePose;
}

/**
 * Whether a person's own conditions place him in this room: the placement's
 * `when` there if it declares one, else the file's `when` with its `whenAny`
 * (AmbientFile.whenAny).
 * The one reading of it, so the scene, the tests and the probe cannot differ.
 */
/**
 * How far a figure's drawn frame reaches below its feet (`sprite.footRow`):
 * the frame's rows under the foot row, at the size it is drawn. 0 for a figure
 * standing on its frame's last row. The renderer and the staging checks place
 * a frame with this, so they agree on where every pixel lands (errata 199).
 */
export function drawnBelowFeet(frameHeight: number, drawnHeight: number, footRow?: number): number {
  if (footRow === undefined) return 0;
  return Math.round(((frameHeight - 1 - footRow) * drawnHeight) / frameHeight);
}

export function ambientHere(npc: AmbientFile, roomId: string, test: (when?: Condition) => boolean): boolean {
  const placed = npc.placements?.[roomId]?.when;
  if (placed !== undefined) return test(placed);
  return test(npc.when) && (!npc.whenAny?.length || npc.whenAny.some((one) => test(one)));
}

/**
 * THE FIGURE WHO SAYS `speaker`'s LINES, among those present: his own id
 * first, else a figure that speaks as him (AmbientFile.speaksAs; errata 131
 * C). The one reading of it, so the renderer, the scene and the tests agree.
 */
export function figureSpeaking(present: readonly AmbientFile[], speaker: string | null): AmbientFile | undefined {
  if (speaker === null) return undefined;
  return present.find((npc) => npc.id === speaker) ?? present.find((npc) => npc.speaksAs === speaker);
}

/** How long a figure stirs after a cue it stirs on (AmbientFile.stirsOn), in seconds. */
export const STIR_SECONDS = 3;

export class AmbientLayer {
  private readonly fired = new Set<string>();
  /** Who was present last frame, in which room: how a departure is noticed. */
  private seen = new Map<string, AmbientFile>();
  private seenRoom: string | null = null;
  private departures: { npc: AmbientFile; exit: AmbientExit; startedAt: number }[] = [];
  /** Figures walking IN (AmbientFile.arrive), latched as present when they arrive. */
  private arrivals: { npc: AmbientFile; exit: AmbientExit; startedAt: number }[] = [];
  private clock = 0;

  /** Who was in the room when Thad arrived in it. See `present`. */
  private latched: Map<string, AmbientFile> | null = null;
  private latchedRoom: string | null = null;
  /** Figures fading out (AmbientFile.leaves): id to when the fade began. */
  private fadings = new Map<string, number>();
  /** The `leaves` cues owed: sounded once the figure has gone. */
  private cuesOwed: string[] = [];
  private readonly cued = new Set<string>();
  /** Who has said a line of his run (AmbientFile.barkRun) this visit: one a visit. */
  private readonly ranThisVisit = new Set<string>();
  /** When a cue last fired, by id, for the figures that stir on it. */
  private stirredAt = new Map<string, number>();

  private readonly state: GameState;

  // A plain field rather than a parameter property, so node's type stripping
  // can load this module and a test can drive the layer without a browser.
  constructor(state: GameState) {
    this.state = state;
  }

  /** Thad has arrived in a room (or a save has put him there): who is here is decided afresh. */
  arrived(): void {
    this.latched = null;
    this.fadings.clear();
    this.cued.clear();
    this.ranThisVisit.clear();
  }

  /**
   * Ambient characters in the current room.
   *
   * NOBODY POPS IN OR OUT OF VIEW (Tyler, 2026-11-01: "it would bother me
   * immensely to have a character just disappear"). Who is here is decided
   * when Thad arrives. A character whose condition stops holding while he
   * watches walks out if he has an `exit`, and otherwise stays until Thad
   * leaves -- the judges after Duel Two, who have no walk. One whose condition
   * starts holding while he watches is there next time he comes in.
   */
  get present(): AmbientFile[] {
    const live = this.live;
    const room = this.state.room.id;
    if (this.latched === null || this.latchedRoom !== room) {
      this.latchedRoom = room;
      this.latched = new Map(live.map((npc) => [npc.id, npc]));
    }
    const out = live.filter((npc) => this.latched!.has(npc.id));
    for (const [id, npc] of this.latched) {
      if (npc.exit || out.some((one) => one.id === id)) continue;
      // ONE WHO FADES (AmbientFile.leaves) is drawn until the fade is over.
      if (npc.leaves) {
        const began = this.fadings.get(id);
        if (began !== undefined && this.clock - began >= npc.leaves.fade) continue;
      }
      out.push(npc);
    }
    return out;
  }

  /** How opaque a figure is drawn: 1, or less while it fades out (AmbientFile.leaves). */
  opacity(id: string): number {
    const began = this.fadings.get(id);
    const npc = this.latched?.get(id);
    if (began === undefined || !npc?.leaves) return 1;
    return Math.max(0, 1 - (this.clock - began) / Math.max(0.01, npc.leaves.fade));
  }

  /** The cues owed by figures that have finished leaving, once each. The scene sounds them. */
  takeCues(): string[] {
    const out = this.cuesOwed;
    this.cuesOwed = [];
    return out;
  }

  /** A cue has fired: figures that stir on it (AmbientFile.stirsOn) stir. */
  heard(cue: string): void {
    this.stirredAt.set(cue, this.clock);
  }

  /** Whether this figure is stirring now, and for how long it has been. */
  stirring(npc: AmbientFile): number | null {
    for (const cue of npc.stirsOn ?? []) {
      const at = this.stirredAt.get(cue);
      if (at !== undefined && this.clock - at < STIR_SECONDS) return this.clock - at;
    }
    return null;
  }

  /** Who the conditions place here right now. */
  private get live(): AmbientFile[] {
    const ids = this.state.room.ambient ?? [];
    const roomId = this.state.room.id;
    return ids
      .map((id) => this.state.content.ambient.get(id))
      .filter((npc): npc is AmbientFile => npc !== undefined)
      // PRESENT ONLY WHILE THEIR CONDITION HOLDS, the room's placement first.
      .filter((npc) => ambientHere(npc, roomId, (when) => this.state.flags.test(when)))
      // A PER-ROOM PLACEMENT WINS over the file's own x,y in that room (doc 36
      // Q117): the same dog, standing where THIS plate has ground for him.
      .map((npc) => {
        const placed = npc.placements?.[roomId];
        return placed
          ? {
            ...npc,
            x: placed.x,
            y: placed.y,
            zone: placed.zone ?? npc.zone,
            // A PER-ROOM PLANE TOO, and for the same reason as the
            // position: the plate she is standing on is not the one her
            // file was written against.
            clipPlane: placed.clipPlane ?? npc.clipPlane,
            // AND THE ART, where the room supplies its own: a recast
            // character against a replacement plate is a different
            // picture, and the shipping room keeps the one it shipped.
            sprite: placed.sprite ?? npc.sprite,
            posture: placed.posture ?? npc.posture,
            walkTo: placed.walkTo ?? npc.walkTo,
            tree: placed.tree ?? npc.tree,
            // AND WHAT HE SAYS HERE, where the room says otherwise: the dog's
            // owner, found and standing beside his dog, asks nobody whether
            // they have seen one (doc 07 #18; errata 110).
            barks: placed.barks ?? npc.barks,
          }
          : npc;
      });
  }

  /**
   * NOTICES WHO HAS JUST GONE. Called once a frame by the scene. A character
   * present last frame and absent now, in the same room, with an `exit`,
   * starts walking it; arriving in a room notices nothing, so a man who left
   * while Thad was away is simply not there. True while anyone is walking.
   */
  noteDepartures(now: number): boolean {
    this.clock = now;
    const room = this.state.room.id;
    const present = new Map(this.present.map((npc) => [npc.id, npc]));
    if (room !== this.seenRoom) {
      this.seenRoom = room;
      this.departures = [];
      this.arrivals = [];
      this.fadings.clear();
      this.cued.clear();
    } else {
      // ONE WHOSE CONDITION HAS ENDED AND WHO HAS NO WALK fades (AmbientFile.leaves).
      const liveIds = new Set(this.live.map((npc) => npc.id));
      for (const [id, npc] of this.latched ?? new Map<string, AmbientFile>()) {
        if (!npc.leaves || npc.exit || liveIds.has(id)) continue;
        const began = this.fadings.get(id);
        if (began === undefined) this.fadings.set(id, now);
        else if (now - began >= npc.leaves.fade && npc.leaves.cue && !this.cued.has(id)) {
          this.cuesOwed.push(npc.leaves.cue);
          this.cued.add(id);
        }
      }
      // ONE WHO COMES IN WHILE THAD WATCHES walks in (AmbientFile.arrive),
      // and is latched present when he reaches his place.
      for (const npc of this.live) {
        if (!npc.arrive || present.has(npc.id) || this.arrivals.some((one) => one.npc.id === npc.id)) continue;
        this.arrivals.push({ npc, exit: { ...npc.arrive, path: [...npc.arrive.path, [npc.x, npc.y]] }, startedAt: now });
      }
      for (const one of this.arrivals) {
        if (departureAt(one.exit, now - one.startedAt).done && this.latched) this.latched.set(one.npc.id, one.npc);
      }
      this.arrivals = this.arrivals.filter((one) => !departureAt(one.exit, now - one.startedAt).done);
      for (const [id, npc] of this.seen) {
        const exit = npc.exit;
        if (!present.has(id) && exit && !this.departures.some((one) => one.npc.id === id)) {
          // FROM WHERE HE STOOD: the path is the way to the door, and its
          // first leg starts at his own feet.
          this.departures.push({ npc, exit: { ...exit, path: [[npc.x, npc.y], ...exit.path] }, startedAt: now });
        }
      }
    }
    this.seen = present;
    // A walker who went out by a door stays on the list, not drawn, until it has shut behind him.
    this.departures = this.departures.filter((one) => !departureAt(one.exit, now - one.startedAt).done
      || (one.exit.door !== undefined && now - one.startedAt < walkDuration(one.exit) + one.exit.door.linger));
    const fading = [...this.fadings].some(([id, began]) => now - began < (this.latched?.get(id)?.leaves?.fade ?? 0) + 0.1);
    const stirring = [...this.stirredAt.values()].some((at) => now - at < STIR_SECONDS + 0.1);
    return this.departures.length > 0 || this.arrivals.length > 0 || fading || stirring
      || this.present.some((npc) => npc.loop);
  }

  /** The doors standing open this frame: one a walker is going out by, or has just gone through. */
  get openDoors(): NonNullable<AmbientExit['door']>[] {
    const out: NonNullable<AmbientExit['door']>[] = [];
    for (const { npc, exit, startedAt } of this.departures) {
      const door = exit.door;
      if (!door) continue;
      const pose = departureAt(exit, this.clock - startedAt, this.manAt(npc));
      const [ex, ey] = exit.path[exit.path.length - 1]!;
      if (pose.done || Math.hypot(pose.x - ex, pose.y - ey) <= door.within) out.push(door);
    }
    return out;
  }

  /** A man's drawn height at a floor point, for this figure (his stature): what a stride is measured against. */
  private manAt(npc: AmbientFile): HeightAt {
    const stature = npc.sprite?.stature ?? 1;
    return (x, y, declared) => (declared ?? this.state.stagedHeightAt(x, y) ?? 0) * stature;
  }

  /** Everyone walking out this frame, and everyone walking a loop, and where. */
  get departing(): Departing[] {
    const out: Departing[] = [...this.departures, ...this.arrivals].map(({ npc, exit, startedAt }) => ({
      npc, exit, pose: departureAt(exit, this.clock - startedAt, this.manAt(npc)),
    })).filter((one) => !one.pose.done);
    for (const npc of this.present) {
      const pose = loopPose(npc, this.clock, this.manAt(npc));
      if (pose && npc.loop) out.push({ npc, exit: npc.loop, pose });
    }
    return out;
  }

  get reputationState(): string {
    const states = this.state.content.reputation.states;
    return states[Math.max(0, Math.min(states.length - 1, this.state.reputationIndex))] ?? states[0]!;
  }

  /** The bark for whoever the actor has just walked up to, or null. */
  checkApproach(x: number, y: number, only?: string): FiredBark | null {
    const state = this.reputationState;
    for (const npc of this.present) {
      if (only !== undefined && npc.id !== only) continue;
      if (Math.hypot(npc.x - x, npc.y - y) > npc.approachRadius) continue;
      const key = `${npc.id}:${state}`;
      if (!this.fired.has(key)) {
        const exchange = npc.barkExchange?.[state];
        const line = exchange?.[0]?.line ?? npc.barks[state];
        const cue = npc.barkCues?.[state];
        if (line || cue) {
          this.fired.add(key);
          return { npc, line: line ?? '', ...(exchange ? { exchange } : {}), ...(cue ? { cue } : {}) };
        }
      }
      const run = this.nextOfRun(npc);
      if (run) return run;
    }
    return null;
  }

  /** The next line of this man's run (AmbientFile.barkRun), counted as said; null if none is owed this visit. */
  private nextOfRun(npc: AmbientFile): FiredBark | null {
    const run = npc.barkRun;
    if (!run || this.ranThisVisit.has(npc.id) || !this.state.flags.test(run.when)) return null;
    const said = this.state.flags.getNumber(run.counter);
    const next = run.lines[said];
    if (!next?.length) return null;
    this.ranThisVisit.add(npc.id);
    this.state.flags.set(run.counter, said + 1);
    return { npc, line: next[0]!.line, ...(next.length > 1 ? { exchange: next } : {}) };
  }

  /**
   * Records this character's bark for the current reputation as said, so the
   * walk past him later does not repeat what he has just told Thad face to
   * face. Used when a conversation opens with the bark (greetsWithBark).
   */
  markBarked(npc: AmbientFile): void {
    this.fired.add(`${npc.id}:${this.reputationState}`);
  }

  /** The line this character has for the reputation Thad currently carries. */
  barkFor(npc: AmbientFile): string | null {
    return npc.barkExchange?.[this.reputationState]?.[0]?.line ?? npc.barks[this.reputationState] ?? null;
  }

  /**
   * Every line of this character's bark for the current reputation, each with
   * who says it: one line, his own, or a pair's exchange in both voices.
   */
  barkLinesFor(npc: AmbientFile): { speaker: string; line: string }[] {
    const exchange = npc.barkExchange?.[this.reputationState];
    if (exchange?.length) return exchange;
    const line = npc.barks[this.reputationState];
    return line ? [{ speaker: npc.id, line }] : [];
  }

  /**
   * THE PERSON A CLICK (OR THE POINTER) IS ON, with a verb selected: the one
   * precedence the sentence line and the click share. A hotspot rect under
   * the point names the hotspot, not the person over it, unless the verb is
   * TALK TO or the hotspot is the bigger of the two -- otherwise the sentence
   * line promised "Pick up WINNIE" for a click that picked up her pen.
   * Moved here from GameScene so a test can ask it (errata 151).
   */
  personAt(wx: number, y: number, verb: string | null): AmbientFile | undefined {
    const npc = this.npcAt(wx, y);
    if (!npc) return undefined;
    const object = this.state.targetAt(wx, y);
    // A FIGURE WHO CANNOT TALK, UNDER A HOTSPOT THAT ANSWERS TALK TO, IS THAT
    // HOTSPOT (errata 96 E): the raccoon is spoken to through THE RACCOON,
    // which opens his naming and then carries his name.
    // Its TALK TO may be an override (doc 49's THE MOURNERS · TALK_TO), which
    // answers as surely as a rule does.
    if (object && verb === 'TALK_TO' && !npc.tree
      && (object.responses?.TALK_TO?.length || object.overrides?.TALK_TO)) return undefined;
    if (!object || verb === 'TALK_TO') return npc;
    if (!npc.tree) return undefined;
    const [, , ow, oh] = this.state.presentation(object)?.bounds ?? object.rect;
    const [, , pw, ph] = this.hitBox(npc);
    return ow * oh > pw * ph ? npc : undefined;
  }

  /**
   * THE PERSON A HELD ITEM IS USED ON, when the click lands on one (errata
   * 151): the person `personAt` names -- the one the sentence line says the
   * item is going to -- or one this item has a written pair with in this
   * room, whatever scenery stands behind them (A9's fee on Sump, C5's log on
   * Winnie). Otherwise nobody: the scenery under the click answers.
   *
   * THE CLICK USED TO TAKE WHOEVER'S BOX THE POINT WAS IN. The Nugget's
   * fiddler stands in front of the piano, and USE THE TUNING FORK on the
   * piano -- the sentence line reading "Use THE TUNING FORK on THE PIANO" --
   * used it on the fiddler: A8 could not be played by clicking the piano
   * (the browser full-game run).
   */
  itemTakerAt(wx: number, y: number, verb: string | null, item: string): AmbientFile | undefined {
    const under = this.npcAt(wx, y);
    if (!under) return undefined;
    const room = this.state.room.id;
    const paired = (this.state.content.combinations?.pairs ?? [])
      .some((pair) => pair.item === item && pair.room === room && pair.target === under.id);
    if (paired) return under;
    return this.personAt(wx, y, verb)?.id === under.id ? under : undefined;
  }

  /** The rect a character answers the pointer in: the box npcAt tests. */
  hitBox(npc: AmbientFile): [number, number, number, number] {
    const height = npc.sprite?.frames?.[0]?.[3] ?? this.state.heightForZone(npc.zone);
    const half = height * NPC_HALF_WIDTH;
    return [npc.x - half, npc.y - height, half * 2, height];
  }

  npcAt(x: number, y: number): AmbientFile | undefined {
    // A PERSON WHO SPEAKS WINS over a figure who does not, where they
    // overlap. The Nugget's named regulars are identities laid over men the
    // patron bands draw, and the cast list is sorted by id -- so without this,
    // which one a click found depended on the alphabet.
    // A walker on a loop is examined through the hotspot over its road.
    // SCENERY ANSWERS NOTHING (errata 187): the pointer passes through it.
    const hits = this.present.filter((npc) => !npc.loop && !npc.scenery).filter((npc) => {
      // THE SPRITE'S OWN HEIGHT WHEN IT HAS ONE, the zone's when it does not.
      // The zone heights are the game's three fixed drawn sizes; a figure
      // whose sheet is 440 rows tall behind a counter has a head 200 rows
      // above the top of a 240 box, and a click on her face missed her.
      const height = npc.sprite?.frames?.[0]?.[3] ?? this.state.heightForZone(npc.zone);
      const half = height * NPC_HALF_WIDTH;
      return x >= npc.x - half && x <= npc.x + half
        && y >= npc.y - height && y <= npc.y;
    });
    return hits.find((npc) => npc.tree !== undefined) ?? hits[0];
  }

  progressSnapshot(): string[] {
    return [...this.fired].sort();
  }

  restore(keys: string[]): void {
    this.fired.clear();
    for (const key of keys) this.fired.add(key);
  }
}

/**
 * WHERE A LOOPING WALKER IS (AmbientFile.loop), or null while it is off the
 * frame between walks. Pure in the clock, as a departure is.
 */
export function loopPose(npc: AmbientFile, clock: number, heightAt?: HeightAt): DeparturePose | null {
  const walk = npc.loop;
  if (!walk || (walk.speed <= 0 && !(walk.pace && walk.pace > 0))) return null;
  const walking = walkDuration(walk, heightAt);
  const cycle = walking + Math.max(0, walk.pause ?? 0);
  if (cycle <= 0) return null;
  const t = (((clock + (walk.offset ?? 0)) % cycle) + cycle) % cycle;
  if (t >= walking) return null;
  const pose = departureAt(walk, t, heightAt);
  return pose.done ? null : pose;
}
