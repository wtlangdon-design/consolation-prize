import type { AmbientExit, AmbientFile, Condition } from './types.ts';
import { departureAt, walkDuration, type DeparturePose, type HeightAt } from './Departure.ts';
import type { GameState } from './GameState.ts';

export interface FiredBark {
  npc: AmbientFile;
  line: string;
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
export function ambientHere(npc: AmbientFile, roomId: string, test: (when?: Condition) => boolean): boolean {
  const placed = npc.placements?.[roomId]?.when;
  if (placed !== undefined) return test(placed);
  return test(npc.when) && (!npc.whenAny?.length || npc.whenAny.some((one) => test(one)));
}

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

  private readonly state: GameState;

  // A plain field rather than a parameter property, so node's type stripping
  // can load this module and a test can drive the layer without a browser.
  constructor(state: GameState) {
    this.state = state;
  }

  /** Thad has arrived in a room (or a save has put him there): who is here is decided afresh. */
  arrived(): void {
    this.latched = null;
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
      if (!npc.exit && !out.some((one) => one.id === id)) out.push(npc);
    }
    return out;
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
    } else {
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
    this.departures = this.departures.filter((one) => !departureAt(one.exit, now - one.startedAt).done);
    return this.departures.length > 0 || this.arrivals.length > 0 || this.present.some((npc) => npc.loop);
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
    }));
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
      const key = `${npc.id}:${state}`;
      if (this.fired.has(key)) continue;
      if (Math.hypot(npc.x - x, npc.y - y) > npc.approachRadius) continue;
      const line = npc.barks[state];
      if (!line) continue;
      this.fired.add(key);
      return { npc, line };
    }
    return null;
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
    return npc.barks[this.reputationState] ?? null;
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
    const hits = this.present.filter((npc) => !npc.loop).filter((npc) => {
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
