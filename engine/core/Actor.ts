import type { GameState } from './GameState.ts';

/** Pixels moved per frame at 60fps. Slow enough to read as walking. */
const WALK_SPEED = 0.9;

/**
 * The player character's position and drawn height.
 *
 * Height is snapped, never interpolated (errata ruling 15). The actor is a
 * plain silhouette for now -- three drawn sizes are a sprite commission, and
 * a placeholder that scales smoothly would hide the very artefact the
 * stepped design exists to avoid.
 */
export class Actor {
  x: number;
  y: number;
  height: number;
  private targetX: number;
  private targetY: number;

  constructor(private readonly state: GameState, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.height = state.actorHeightAt(x, y) ?? state.heightForZone(0);
  }

  get isWalking(): boolean {
    return Math.abs(this.targetX - this.x) > 0.5 || Math.abs(this.targetY - this.y) > 0.5;
  }

  /** Ignores a destination that is not floor, rather than sliding to its edge. */
  walkTo(x: number, y: number): boolean {
    if (!this.state.isWalkable(Math.round(x), Math.round(y))) return false;
    this.targetX = x;
    this.targetY = y;
    return true;
  }

  placeIn(roomId: string): void {
    const regions = this.state.content.rooms.get(roomId)?.walkable ?? [];
    const region = regions[regions.length - 1] ?? regions[0];
    if (!region) return;
    const [rx, ry, rw, rh] = region.rect;
    this.x = rx + rw / 2;
    this.y = ry + rh - 1;
    this.targetX = this.x;
    this.targetY = this.y;
    this.height = this.state.actorHeightAt(Math.round(this.x), Math.round(this.y)) ?? this.height;
  }

  /** Returns true if the drawn height changed, i.e. a zone boundary was crossed. */
  update(): boolean {
    if (this.isWalking) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.hypot(dx, dy);
      const step = Math.min(WALK_SPEED, distance);
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
    }
    const zoneHeight = this.state.actorHeightAt(Math.round(this.x), Math.round(this.y));
    if (zoneHeight !== null && zoneHeight !== this.height) {
      this.height = zoneHeight;
      return true;
    }
    return false;
  }
}
