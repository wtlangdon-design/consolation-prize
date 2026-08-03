import type { AmbientFile } from './types.ts';
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

export class AmbientLayer {
  private readonly fired = new Set<string>();

  constructor(private readonly state: GameState) {}

  /** Ambient characters placed in the current room. */
  get present(): AmbientFile[] {
    const ids = this.state.room.ambient ?? [];
    return ids
      .map((id) => this.state.content.ambient.get(id))
      .filter((npc): npc is AmbientFile => npc !== undefined);
  }

  get reputationState(): string {
    const states = this.state.content.reputation.states;
    return states[Math.max(0, Math.min(states.length - 1, this.state.reputationIndex))] ?? states[0]!;
  }

  /** The bark for whoever the actor has just walked up to, or null. */
  checkApproach(x: number, y: number): FiredBark | null {
    const state = this.reputationState;
    for (const npc of this.present) {
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

  npcAt(x: number, y: number): AmbientFile | undefined {
    return this.present.find((npc) => {
      const height = this.state.heightForZone(npc.zone);
      const half = height * NPC_HALF_WIDTH;
      return x >= npc.x - half && x <= npc.x + half
        && y >= npc.y - height && y <= npc.y;
    });
  }

  progressSnapshot(): string[] {
    return [...this.fired].sort();
  }

  restore(keys: string[]): void {
    this.fired.clear();
    for (const key of keys) this.fired.add(key);
  }
}
