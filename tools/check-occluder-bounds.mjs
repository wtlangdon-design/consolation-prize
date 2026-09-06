import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

import { loadContent, Report, ROOT, runCheck } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * AN OCCLUDER MASK STAYS INSIDE THE ART IT WAS CUT FROM.
 *
 * THE DEFECT THIS EXISTS FOR. Main Street's trough was masked by a six-point
 * polygon drawn around it, and a six-point polygon around a box in oblique
 * projection is a convex hull: it swallowed a wedge of mud above the far rim
 * and a skirt of shadow below the near wall. On screen that is a man losing
 * his feet and shins while standing well clear of the trough -- which is what
 * Tyler saw, twice, and what no other check in this suite could see. Every
 * mask file existed, loaded, named a real plane and covered the authored proof
 * points. None of that asks whether the mask is the SHAPE OF THE OBJECT.
 *
 * WHAT IT ASSERTS. A plane mask may declare, in a `*-cut.json` beside it, the
 * geometry it was cut from: for each object a box, a base line, a horizontal
 * span, or a set of quads. Every mask pixel must fall inside one of those
 * envelopes, grown by `tolerancePx` (2 by default, for the anti-aliased edge).
 * A mask with no such record is reported and not asserted -- the check is for
 * masks that claim a provenance, and claiming one is what makes the claim
 * checkable.
 */
const TOLERANCE = 2;

function alphaMask(path) {
  const { width, height, pixels } = readPng(readFileSync(resolve(ROOT, path)));
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) mask[i] = pixels[i * 4 + 3] > 8 ? 1 : 0;
  return { width, height, mask };
}

function insideQuad(quad, x, y) {
  let inside = false;
  for (let i = 0, j = quad.length - 1; i < quad.length; j = i, i += 1) {
    const [xi, yi] = quad[i];
    const [xj, yj] = quad[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function check() {
  const report = new Report('Every occluder mask stays inside the art it was cut from');
  const content = loadContent();
  let masks = 0;
  for (const { path, data: room } of content.rooms) {
    for (const plane of room.occlusionPlanes ?? []) {
      const record = `${dirname(plane.mask)}/${basename(plane.mask).replace(/\.png$/, '')}-cut.json`;
      const fallback = `${dirname(plane.mask)}/plane-${plane.level}-cut.json`;
      const cut = [record, fallback].find((candidate) => existsSync(resolve(ROOT, candidate)));
      if (!cut) {
        report.note(`${room.id} plane ${plane.level}: ${plane.mask} declares no cut record, so its `
          + 'shape is not checkable here. A mask cut by a tool writes one beside itself.');
        continue;
      }
      masks += 1;
      const geometry = JSON.parse(readFileSync(resolve(ROOT, cut), 'utf8'));
      const tolerance = geometry.tolerancePx ?? TOLERANCE;
      const envelopes = [];
      for (const [name, object] of Object.entries(geometry)) {
        if (!object || typeof object !== 'object' || Array.isArray(object)) continue;
        if (object.quads) {
          for (const quad of Object.values(object.quads)) envelopes.push({ name, quad });
        } else if (object.box && object.baseLine) {
          envelopes.push({ name, box: object.box, baseLine: object.baseLine, span: object.span });
        }
      }
      if (envelopes.length === 0) {
        report.fail(`${cut} names no geometry (a box with a base line, or quads), so the mask it `
          + 'stands behind cannot be held to anything');
        continue;
      }
      const { width, mask } = alphaMask(plane.mask);
      let outside = 0;
      let firstOutside;
      let pixels = 0;
      const bbox = [Infinity, Infinity, -Infinity, -Infinity];
      for (let i = 0; i < mask.length; i += 1) {
        if (!mask[i]) continue;
        pixels += 1;
        const x = i % width;
        const y = Math.floor(i / width);
        bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y);
        bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y);
        const held = envelopes.some((envelope) => {
          if (envelope.quad) {
            return insideQuad(envelope.quad.map(([qx, qy]) => [qx, qy]), x, y)
              || envelope.quad.some(([qx, qy]) => Math.abs(qx - x) <= tolerance && Math.abs(qy - y) <= tolerance)
              || insideQuad(envelope.quad.map(([qx, qy], index) => {
                const [cx, cy] = envelope.quad.reduce((sum, [px, py]) => [sum[0] + px / envelope.quad.length, sum[1] + py / envelope.quad.length], [0, 0]);
                return [qx + Math.sign(qx - cx) * tolerance, qy + Math.sign(qy - cy) * tolerance];
              }), x, y);
          }
          const [bx0, by0, bx1, by1] = envelope.box;
          if (x < bx0 - tolerance || x > bx1 + tolerance || y < by0 - tolerance || y > by1 + tolerance) return false;
          if (envelope.span && (x < envelope.span[0] - tolerance || x > envelope.span[1] + tolerance)) return false;
          const [[lx0, ly0], [lx1, ly1]] = envelope.baseLine;
          const base = ly0 + ((ly1 - ly0) * (x - lx0)) / (lx1 - lx0);
          return y <= base + tolerance;
        });
        if (!held) {
          outside += 1;
          firstOutside ??= [x, y];
        }
      }
      if (outside > 0) {
        report.fail(`${room.id} plane ${plane.level}: ${outside} of ${pixels} mask pixel(s) fall `
          + `outside the geometry ${cut} says the mask was cut from -- the first at `
          + `${firstOutside?.join(',')}. A mask wider than its object clips actors who are `
          + 'nowhere near it.');
      }
      report.note(`${room.id} plane ${plane.level}: ${pixels} px, bbox `
        + `${bbox.join(',')}, inside ${envelopes.length} declared envelope(s) `
        + `(${envelopes.map((envelope) => envelope.name).join(', ')}) at ${tolerance}px tolerance`);
    }
  }
  report.note(`${masks} mask(s) checked against their cut records`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
