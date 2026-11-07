/**
 * A CLICK ON WALKABLE GROUND WALKS (errata 154 C; errata 28b row 1: "Left
 * click on walkable ground -- Walk there. Always."). The first-playthrough
 * audit, and the real-browser run before it (errata 151), found Main Street's
 * BOARDWALK -- a hotspot laid over walk boxes Thad stands on -- answering a
 * plain click with LOOK AT, so a player clicking the boardwalk to walk along
 * it was read a description instead. The mud beside it already declared
 * WALK_TO, which is errata 28b-i's own example.
 *
 * GROUND, NOT A THING ON IT: a hotspot at least half over walk boxes AND at
 * least a third of the play area wide (640 px) is a stretch of ground -- mud,
 * path, boardwalk, floor -- and declares WALK_TO. Narrower ones over walk boxes
 * are objects lying there (the dog, a boot, a survey mark, a floorboard) and
 * keep LOOK AT; at the time of writing the widest of those is 442 px and the
 * narrowest ground 785 px, so the line is not close to either.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
type Pt = { x: number; y: number };

function inside(p: Pt, poly: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i]!; const b = poly[j]!;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

test('every hotspot that is mostly walkable ground walks when clicked', () => {
  const wrong: string[] = [];
  let ground = 0;
  for (const name of readdirSync(resolve(ROOT, 'content/rooms')).filter((n) => n.endsWith('.json'))) {
    const room = JSON.parse(readFileSync(resolve(ROOT, 'content/rooms', name), 'utf8'));
    if (room.candidateOf) continue;
    const boxes: Pt[][] = (room.walkBoxes ?? []).map((box: { points: Pt[] }) => box.points).filter((p: Pt[] | undefined) => p?.length);
    if (!boxes.length) continue;
    for (const hotspot of room.hotspots ?? []) {
      const rect = hotspot.rect as [number, number, number, number] | undefined;
      if (!rect) continue;
      const [x, y, w, h] = rect;
      let on = 0; let all = 0;
      for (let i = 0; i < 12; i += 1) {
        for (let k = 0; k < 6; k += 1) {
          const p = { x: x + (w * (i + 0.5)) / 12, y: y + (h * (k + 0.5)) / 6 };
          all += 1;
          if (boxes.some((poly) => inside(p, poly))) on += 1;
        }
      }
      if (on / all < 0.5 || w < 640) continue;
      ground += 1;
      if (hotspot.defaultVerb !== 'WALK_TO') wrong.push(`${room.id}/${hotspot.id}: ${hotspot.defaultVerb} (${Math.round((100 * on) / all)}% walkable)`);
    }
  }
  assert.ok(ground >= 5, `ground hotspots found: ${ground}`);
  assert.deepEqual(wrong, [], 'a plain click on walkable ground must walk (errata 28b row 1)');
});
