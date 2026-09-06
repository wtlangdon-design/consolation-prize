import type { Condition, FrontOnlyRegion, Point, WalkBox } from './types.ts';

/**
 * Walk boxes: routing, and the geometry the actor's scale and clip plane hang
 * off. Doc 22 section 3, errata 28a item 1.
 *
 * A box is a convex quadrilateral fitted to the room art, not an axis-aligned
 * rectangle, and boxes carry adjacency. That is what makes routing authored
 * and cheap: given a start box and a destination box, walk the adjacency
 * graph, and cross into each next box at the point on their shared edge
 * nearest the destination. No general pathfinding, no navmesh, no simulation
 * -- the same reason SCUMM did it this way on a 286.
 *
 * The one thing this replaces that mattered: Main Street was four full-width
 * rectangles, so there was nothing in the room to route AROUND. Splitting the
 * middle band either side of the water trough is what makes routing provable
 * rather than asserted.
 */

export interface Route {
  /** Boxes crossed, start first. */
  boxes: string[];
  /** Points to walk through, destination last. */
  waypoints: Point[];
}

function inside(box: WalkBox, x: number, y: number): boolean {
  // Winding test. Works for any convex quad and does not care which way round
  // the points were authored, which matters because they are hand-written.
  let positive = false;
  let negative = false;
  for (let index = 0; index < box.points.length; index += 1) {
    const a = box.points[index] as Point;
    const b = box.points[(index + 1) % box.points.length] as Point;
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross > 0) positive = true;
    if (cross < 0) negative = true;
    if (positive && negative) return false;
  }
  return true;
}

function bounds(box: WalkBox): { left: number; right: number; top: number; bottom: number } {
  const xs = box.points.map((point) => point.x);
  const ys = box.points.map((point) => point.y);
  return {
    left: Math.min(...xs), right: Math.max(...xs),
    top: Math.min(...ys), bottom: Math.max(...ys),
  };
}

/** Closest point to (x, y) that is still inside the box. */
function clampInto(box: WalkBox, x: number, y: number): Point {
  if (inside(box, x, y)) return { x, y };
  let best: Point = box.points[0] as Point;
  let bestGap = Number.POSITIVE_INFINITY;
  // Walk the edges rather than the corners: the nearest point on a quad is
  // almost never a corner, and snapping to corners made a click just outside
  // a box send the actor to its end instead of straight in.
  for (let index = 0; index < box.points.length; index += 1) {
    const a = box.points[index] as Point;
    const b = box.points[(index + 1) % box.points.length] as Point;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length));
    const candidate = { x: a.x + dx * t, y: a.y + dy * t };
    const gap = Math.hypot(candidate.x - x, candidate.y - y);
    if (gap < bestGap) {
      best = candidate;
      bestGap = gap;
    }
  }
  return best;
}

export class WalkBoxes {
  private readonly boxes: WalkBox[];
  private readonly byId = new Map<string, WalkBox>();
  private readonly frontOnly: FrontOnlyRegion[];

  constructor(
    boxes: WalkBox[],
    holds: (when?: Condition) => boolean = () => true,
    frontOnly: FrontOnlyRegion[] = [],
  ) {
    this.boxes = boxes.filter((box) => holds(box.enabledWhen));
    for (const box of this.boxes) this.byId.set(box.id, box);
    this.frontOnly = frontOnly;
  }

  get all(): WalkBox[] {
    return this.boxes;
  }

  get(id: string): WalkBox | undefined {
    return this.byId.get(id);
  }

  boxAt(x: number, y: number): WalkBox | undefined {
    return this.boxes.find((box) => inside(box, x, y));
  }

  contains(x: number, y: number): boolean {
    return this.boxAt(x, y) !== undefined;
  }

  /**
   * The nearest point in any box. Doc 22's step 1: a click outside the floor
   * is snapped rather than refused, so the pointer is never dead.
   */
  nearest(x: number, y: number): { box: WalkBox; point: Point } | undefined {
    let best: { box: WalkBox; point: Point } | undefined;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const box of this.boxes) {
      const point = clampInto(box, x, y);
      const gap = Math.hypot(point.x - x, point.y - y);
      if (gap < bestGap) {
        best = { box, point };
        bestGap = gap;
      }
    }
    return best;
  }

  /**
   * WHERE A WALK DESTINATION RESOLVES TO -- `nearest`, unless the room has
   * ruled otherwise about this patch of frame.
   *
   * Main Street's east hitching rail, Phase 1.5I: the ground behind it is not
   * player ground, and a click on the rail must put him on the mud IN FRONT of
   * it. Plain `nearest` would hand back the boardwalk, which is nearer in
   * pixels and on the far side of the fence. Inside a declared region the
   * candidates are restricted to boxes at or below its front line; if the room
   * declares none, or the restriction finds nothing, this is `nearest`
   * unchanged.
   *
   * ONLY DESTINATIONS. `nearest` itself is untouched, because it also answers
   * "what plane is a figure standing here drawn at", and an ambient standing
   * behind the rail must keep being masked by it.
   */
  target(x: number, y: number): { box: WalkBox; point: Point } | undefined {
    const region = this.frontOnly.find(({ rect: [rx, ry, rw, rh] }) => x > rx && x < rx + rw
      && y > ry && y < ry + rh);
    if (!region) return this.nearest(x, y);
    let best: { box: WalkBox; point: Point } | undefined;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const box of this.boxes) {
      if (bounds(box).top < region.resolveBelowY) continue;
      const point = clampInto(box, x, y);
      const gap = Math.hypot(point.x - x, point.y - y);
      if (gap < bestGap) {
        best = { box, point };
        bestGap = gap;
      }
    }
    return best ?? this.nearest(x, y);
  }

  /** Box ids from `from` to `to`, inclusive. Empty if unreachable. */
  path(from: string, to: string): string[] {
    if (from === to) return [from];
    const cameFrom = new Map<string, string>();
    const queue = [from];
    const seen = new Set([from]);
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of this.byId.get(current)?.neighbours ?? []) {
        if (seen.has(next) || !this.byId.has(next)) continue;
        seen.add(next);
        cameFrom.set(next, current);
        if (next === to) {
          const chain = [to];
          let walk = to;
          while (walk !== from) {
            walk = cameFrom.get(walk) as string;
            chain.unshift(walk);
          }
          return chain;
        }
        queue.push(next);
      }
    }
    return [];
  }

  /**
   * A full route: the boxes crossed and the points to walk through.
   *
   * The crossing point between two boxes is the point on their shared border
   * NEAREST THE DESTINATION, not the midpoint of it. With midpoints the actor
   * walked to the centre of each seam and the path around the trough looked
   * like a man visiting two specific spots; nearest-to-destination makes him
   * hug the obstacle, which is what routing is supposed to look like.
   */
  route(fromX: number, fromY: number, toX: number, toY: number): Route | undefined {
    // BOTH ENDS THROUGH `target`, not `nearest`: a walk that STARTS on ground
    // the room has ruled out -- the actor placed there, or left there by an
    // earlier build -- must come out of it to the front, not route along it.
    const start = this.boxAt(fromX, fromY) ?? this.target(fromX, fromY)?.box;
    const landing = this.target(toX, toY);
    if (!start || !landing) return undefined;

    const chain = this.path(start.id, landing.box.id);
    if (chain.length === 0) return undefined;

    const waypoints: Point[] = [];
    for (let index = 0; index < chain.length - 1; index += 1) {
      const here = this.byId.get(chain[index] as string) as WalkBox;
      const next = this.byId.get(chain[index + 1] as string) as WalkBox;
      waypoints.push(this.crossing(here, next, landing.point));
    }
    waypoints.push(landing.point);
    return { boxes: chain, waypoints };
  }

  /** A point in the overlap of two adjacent boxes, as near `toward` as it gets. */
  private crossing(a: WalkBox, b: WalkBox, toward: Point): Point {
    const one = bounds(a);
    const two = bounds(b);
    const left = Math.max(one.left, two.left);
    const right = Math.min(one.right, two.right);
    const top = Math.max(one.top, two.top);
    const bottom = Math.min(one.bottom, two.bottom);
    // Boxes that only touch produce an empty overlap in one axis; clamping to
    // the degenerate span still lands on the seam.
    return {
      x: Math.max(Math.min(left, right), Math.min(Math.max(left, right), toward.x)),
      y: Math.max(Math.min(top, bottom), Math.min(Math.max(top, bottom), toward.y)),
    };
  }
}

/**
 * Drawn height at a point, from the box's own scale behaviour.
 *
 * ERRATA 28a: this is the field that lets Room 2's scaling snap sit at the
 * boardwalk lip. The boardwalk is `fixed` at the far drawn size and the mud
 * is a `curve` starting just above the threshold, so stepping off the lip --
 * the only real horizontal interruption in the band, measured at four times
 * the strength of anything else -- is exactly where the sprite swaps. Before
 * this the height was one continuous interpolation across the whole floor and
 * the swap landed at y109, in open mud, with nothing to hide it.
 */
export function heightIn(box: WalkBox, y: number): number {
  const mode = box.scaleMode;
  if (mode.kind === 'fixed') return mode.height;
  // ABOVE THE BAND, IF THE CURVE SAYS WHAT HAPPENS THERE.
  //
  // IT CLAMPED, AND THAT IS WORSE THAN EXTRAPOLATING BADLY. A staged crossing
  // can leave the walk box -- errata 38's own case -- and above `farY` every
  // height came back as `farHeight` exactly. A man walking away up the road
  // would not shrink at all: he would slide into the distance at the size of a
  // man standing at the back of the band, forever.
  //
  // The third sample is optional and covers ground the walkable band does not,
  // which is unusual enough that the room file says so in its own note. A box
  // without one still clamps, which is right: a curve that has not been asked
  // about ground it does not cover should not invent an answer for it.
  if (mode.beyondY !== undefined && mode.beyondHeight !== undefined && y < mode.farY) {
    const up = mode.farY - mode.beyondY;
    if (up <= 0) return mode.beyondHeight;
    const walk = Math.max(0, Math.min(1, (y - mode.beyondY) / up));
    return Math.round(mode.beyondHeight + (mode.farHeight - mode.beyondHeight) * walk);
  }
  const span = mode.nearY - mode.farY;
  if (span === 0) return mode.nearHeight;
  const walk = Math.max(0, Math.min(1, (y - mode.farY) / span));
  return Math.round(mode.farHeight + (mode.nearHeight - mode.farHeight) * walk);
}
