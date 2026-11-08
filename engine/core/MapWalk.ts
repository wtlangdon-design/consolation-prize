import type { MapLocation, RoomFile } from './types.ts';

/**
 * THE MAP'S THAD (errata 163; Tyler, 2026-11-07: "Do it"). A small Thad walks
 * the district's drawn roads from where he is to the place clicked, as
 * Guybrush walks Melee Island, and arrives before the room changes. Errata 25
 * and 44a had withdrawn the token; this reverses them.
 *
 * Pure: the route is a shortest path over the room's `roads` graph, and the
 * walk is a function of elapsed seconds, so a test can walk it without a
 * scene and the scene only asks where he is now.
 */

export type Point = [number, number];

/** The place Thad stands on the map, given the room he opened it from. */
export function homeLocation(map: RoomFile, fromRoom: string | null): MapLocation | undefined {
  const places = map.locations ?? [];
  const own = places.find((place) => place.room === fromRoom);
  if (own) return own;
  const named = fromRoom ? map.mapToken?.homes?.[fromRoom] : undefined;
  return places.find((place) => place.id === named) ?? places[0];
}

/** Where a place is on the roads: its node, or its marker when it has none. */
export function placePoint(map: RoomFile, place: MapLocation): Point {
  const node = place.node ? map.roads?.nodes[place.node] : undefined;
  return node ? [node[0], node[1]] : [place.at[0], place.at[1]];
}

/** The road from one place to another: Dijkstra over the nodes, or a straight line with no road between them. */
export function mapPath(map: RoomFile, from: MapLocation, to: MapLocation): Point[] {
  const start = placePoint(map, from);
  const end = placePoint(map, to);
  const roads = map.roads;
  if (!roads || !from.node || !to.node || !(from.node in roads.nodes) || !(to.node in roads.nodes)) return [start, end];
  const at = (id: string): Point => roads.nodes[id] as Point;
  const near = new Map<string, string[]>();
  for (const [a, b] of roads.edges) {
    near.set(a, [...(near.get(a) ?? []), b]);
    near.set(b, [...(near.get(b) ?? []), a]);
  }
  const dist = new Map<string, number>([[from.node, 0]]);
  const prev = new Map<string, string>();
  const open = new Set<string>([from.node]);
  while (open.size) {
    let best: string | undefined;
    for (const id of open) if (best === undefined || (dist.get(id) ?? Infinity) < (dist.get(best) ?? Infinity)) best = id;
    open.delete(best!);
    if (best === to.node) break;
    for (const next of near.get(best!) ?? []) {
      const [ax, ay] = at(best!);
      const [bx, by] = at(next);
      const d = (dist.get(best!) ?? Infinity) + Math.hypot(bx - ax, by - ay);
      if (d < (dist.get(next) ?? Infinity)) {
        dist.set(next, d);
        prev.set(next, best!);
        open.add(next);
      }
    }
  }
  if (!dist.has(to.node)) return [start, end];
  const ids = [to.node];
  while (ids[0] !== from.node) ids.unshift(prev.get(ids[0]!)!);
  return ids.map(at);
}

export interface MapWalkPose {
  x: number;
  y: number;
  /** Walking left: the sheet faces right and is mirrored. */
  left: boolean;
  /** Index into mapToken.frames. */
  frame: number;
  done: boolean;
}

/** The walk along a path, as a function of the seconds since it began. */
export class MapWalk {
  readonly seconds: number;
  readonly points: Point[];
  private readonly token: NonNullable<RoomFile['mapToken']>;
  private readonly lengths: number[];
  private readonly total: number;

  constructor(points: Point[], token: NonNullable<RoomFile['mapToken']>) {
    this.points = points;
    this.token = token;
    this.lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index]![0], point[1] - points[index]![1]));
    this.total = this.lengths.reduce((a, b) => a + b, 0);
    this.seconds = Math.min(this.total / Math.max(1, token.speed), token.maxSeconds ?? Infinity);
  }

  at(elapsed: number): MapWalkPose {
    const t = this.seconds <= 0 ? 1 : Math.max(0, Math.min(1, elapsed / this.seconds));
    let along = t * this.total;
    let index = 0;
    while (index < this.lengths.length - 1 && along > this.lengths[index]!) {
      along -= this.lengths[index]!;
      index += 1;
    }
    const a = this.points[index]!;
    const b = this.points[Math.min(index + 1, this.points.length - 1)]!;
    const part = this.lengths[index] ? Math.min(1, along / this.lengths[index]!) : 1;
    const done = t >= 1;
    const walk = this.token.walk;
    return {
      x: a[0] + (b[0] - a[0]) * part,
      y: a[1] + (b[1] - a[1]) * part,
      left: b[0] < a[0],
      frame: done || !walk.length ? this.token.rest : walk[Math.floor(elapsed * (this.token.fps ?? 9)) % walk.length]!,
      done,
    };
  }
}
