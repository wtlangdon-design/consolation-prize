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
      return x >= npc.x - 8 && x <= npc.x + 8 && y >= npc.y - height && y <= npc.y;
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
