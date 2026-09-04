import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { PLAY_HEIGHT, readJson, Report, ROOT, roomWidth, runCheck } from './lib/content.mjs';
import { resolveIssueRef } from './lib/issueref.mjs';
import { readPng } from './lib/png.mjs';

/**
 * EVERY WALK BOX'S CLIP PLANE NAMES A PLANE THE ROOM HAS, AND SOMEBODY HAS
 * STOOD AN ACTOR BEHIND IT.
 *
 * THE DEFECT THIS EXISTS FOR. `compile-room.mjs` wrote `clipPlane: 12` into
 * every box it made -- one constant, no room's, naming no plane. Main Street
 * declares planes at levels 1 and 2, so `Renderer.masked()` looked 12 up,
 * found nothing, and drew straight through: no figure on that street was ever
 * occluded by the lumber stack, the rail or the trough, and two mask PNGs
 * loaded, occupied memory and occluded nobody.
 *
 * NOTHING IN THE SUITE COULD SEE IT, and the reason is worth keeping.
 * `check-asset-paths` confirmed the masks exist. `check-boot-assets` confirmed
 * they were loaded. `check-walk-boxes` checked routing and default verbs.
 * Every artefact anybody looked at was correct. The one question nobody asked
 * was whether the NUMBER on the box named a plane the room had, which is the
 * whole of assertion one below and costs four lines.
 *
 * THREE ASSERTIONS, AND THE THIRD IS NOT HERE. Tyler's ruling asks for:
 *
 *   1. every nonzero clipPlane names an existing plane level      -- here
 *   2. authored proof points geometrically overlap the mask       -- here
 *   3. the runtime uses the expected plane at those points        -- the proof
 *
 * The third cannot be answered by a file on disk: it is a question about what
 * the renderer resolved while a figure was standing there, and it lives in
 * `tools/gauntlet/proof.mjs` gate 8D against a live frame. Named here so that
 * a reader of this file knows the set is not complete without it.
 *
 * WHAT ASSERTION 2 CAN AND CANNOT ESTABLISH, and this is the most important
 * paragraph in the file. It proves the mask HAS PIXELS where the actor will be
 * drawn. It cannot prove those pixels correspond to an object in the PLATE.
 *
 * Both of Main Street's masks are stale -- authored against an earlier,
 * narrower street -- and both pass this test comfortably: 31% of the drawn
 * figure covered at the near point, 12% at the middle one. What the near mask
 * covers him with is a wagon wheel, drawn in eight spokes, over open mud.
 *
 * IT FOOLED THE AUDIT TOO, which is why it is written down. Rendering a mask
 * over a background produces a highlighted shape whether or not there is a
 * shape there, and the first reading of that overlay recorded plane 1 as
 * correct because the wheel looked like the plate's. Only panel C of the room
 * proof -- a man standing in the middle of it, drawn whole, with nothing to be
 * behind -- settled it.
 *
 * So: a machine can say the shapes overlap; only a person looking at a frame
 * can say the shape is a wheel. Doc 44's first honesty in miniature, and
 * `maskPending` is where the person's answer is recorded.
 */

/**
 * The drawn figure's width as a share of its height.
 *
 * MEASURED OFF THE ART, not chosen: `thad-stand-front` holds a 626px figure in
 * 222 columns, which is 0.355. Used only to give the overlap test a body with
 * a width -- a plumb line through the feet would pass wherever the mask has a
 * single column and is not what an actor occludes.
 */
const FIGURE_ASPECT = 0.355;

/** Opaque enough to occlude. The same 16 the rest of the tooling uses. */
const SOLID = 16;

/** The room's own drawn height at a row, from the box that covers it. */
function heightAt(box, y) {
  const mode = box.scaleMode;
  if (!mode) return null;
  if (mode.kind === 'fixed') return mode.height;
  const span = mode.nearY - mode.farY;
  if (span === 0) return mode.nearHeight;
  const walk = Math.max(0, Math.min(1, (y - mode.farY) / span));
  return Math.round(mode.farHeight + (mode.nearHeight - mode.farHeight) * walk);
}

/** Whether (x, y) is inside a walk box's quad, by its bounding rectangle. */
function boxAt(room, x, y) {
  for (const box of room.walkBoxes ?? []) {
    const xs = box.points.map((point) => point.x);
    const ys = box.points.map((point) => point.y);
    if (x >= Math.min(...xs) && x <= Math.max(...xs)
      && y >= Math.min(...ys) && y <= Math.max(...ys)) return box;
  }
  return null;
}

export function check() {
  const report = new Report('Every clip plane names a plane, and somebody has stood behind it');
  const manifest = readJson('content/manifest.json');
  let boxes = 0;
  let points = 0;
  const pending = [];

  for (const path of manifest.rooms) {
    const room = readJson(path);
    const planes = room.occlusionPlanes ?? [];
    const levels = new Set(planes.map((plane) => plane.level));

    // ---- 1. EVERY NONZERO clipPlane NAMES AN EXISTING PLANE LEVEL ----------
    for (const box of room.walkBoxes ?? []) {
      boxes += 1;
      if (!box.clipPlane) continue;
      if (planes.length === 0) {
        report.fail(`${room.id}/${box.id}: clipPlane ${box.clipPlane} and the room declares no `
          + 'occlusionPlanes at all. The renderer resolves a plane by level and draws straight '
          + 'through when it finds none, so this box claims an occlusion it cannot have.');
        continue;
      }
      if (!levels.has(box.clipPlane)) {
        report.fail(`${room.id}/${box.id}: clipPlane ${box.clipPlane} and this room's planes are `
          + `${[...levels].join(', ')}. Renderer.masked() looks a plane up by level and draws `
          + 'straight through when it misses, so the mask loads and occludes nobody. Doc 36 Q14.');
      }
    }

    // AN AMBIENT THAT DECLARES ITS OWN PLANE must name one the room has --
    // the same rule as a walk box, for the same reason: Renderer.masked()
    // draws straight through on a miss, and a figure behind a counter would
    // stand in front of it and nothing would say so.
    const ambients = (manifest.ambient ?? []).map((one) => readJson(one));
    for (const npc of ambients.filter((one) => one.room === room.id)) {
      if (npc.clipPlane === undefined || npc.clipPlane === 0) continue;
      if (!levels.has(npc.clipPlane)) {
        report.fail(`${room.id}/${npc.id}: ambient clipPlane ${npc.clipPlane} and this room's planes are `
          + `${[...levels].join(', ') || 'none'}. The counter she stands behind would not mask her.`);
      }
    }
    if (planes.length === 0) continue;
    for (const plane of planes) {
      if (plane.maskPending) {
        pending.push(`${room.id} plane ${plane.level}: ${plane.mask} is marked maskPending, so `
          + 'the renderer skips it. Its assertions below are reported, not asserted.');
        // A SUPPRESSED ASSERTION MUST NAME WHERE IT WENT. `maskPending` turns
        // a check off, and a check turned off with no forwarding address is
        // how debt stops being debt and becomes the way things are. The
        // reference is qualified because a bare Q id names two issues.
        if (!plane.maskPendingIssue) {
          report.fail(`${room.id} plane ${plane.level}: maskPending with no maskPendingIssue. `
            + 'Suppressing an assertion requires naming the issue that owns it, as '
            + 'path.md::Exact Heading.');
        } else {
          const resolved = resolveIssueRef(plane.maskPendingIssue);
          if (!resolved.ok) {
            report.fail(`${room.id} plane ${plane.level}: maskPendingIssue ${resolved.why}`);
          }
        }
      }
    }

    // ---- 2. EVERY PLANE IN USE HAS AN AUTHORED PROOF POINT -----------------
    const proofs = room.occlusionProofs ?? [];
    const inUse = new Set((room.walkBoxes ?? []).map((box) => box.clipPlane).filter(Boolean));
    for (const level of inUse) {
      if (!proofs.some((proof) => proof.expect === level)) {
        report.fail(`${room.id}: walk boxes use plane ${level} and no authored proof point `
          + 'stands an actor there. A plane nobody has stood behind is a plane nobody has '
          + 'checked -- author one in the annotation\'s occlusion.proofPoints.');
      }
    }

    // ---- 2b. EACH POINT IS ON A BOX OF ITS OWN PLANE, AND OVERLAPS THE MASK -
    for (const proof of proofs) {
      points += 1;
      const where = `${room.id} proof ${proof.at.join(',')}`;
      const [x, y] = proof.at;
      const box = boxAt(room, x, y);
      if (!box) {
        report.fail(`${where}: stands on no walk box. A proof point off the floor measures the `
          + 'room where nobody can be.');
        continue;
      }
      if (proof.box && proof.box !== box.id && !box.id.startsWith(`${proof.box}_`)) {
        report.fail(`${where}: names box "${proof.box}" and lands on "${box.id}"`);
      }
      if (box.clipPlane !== proof.expect) {
        report.fail(`${where}: expects plane ${proof.expect} and stands on ${box.id}, whose `
          + `clipPlane is ${box.clipPlane}`);
        continue;
      }
      const plane = planes.find((candidate) => candidate.level === proof.expect);
      if (!plane) {
        report.fail(`${where}: expects plane ${proof.expect}, which this room does not declare`);
        continue;
      }
      if (!existsSync(resolve(ROOT, plane.mask))) {
        report.fail(`${where}: plane ${plane.level}'s mask ${plane.mask} does not exist`);
        continue;
      }
      let mask;
      try {
        mask = readPng(readFileSync(resolve(ROOT, plane.mask)));
      } catch (error) {
        // LOUD, NOT SKIPPED. A mask this cannot read is a mask it is not
        // checking, and a silent skip here reads exactly like a pass.
        report.fail(`${where}: cannot read ${plane.mask} -- ${error.message}`);
        continue;
      }

      // THE FIGURE'S DRAWN BOX AT THAT POINT, against the mask as the renderer
      // stretches it: `drawImage(mask, 0, 0, roomWidth, PLAY_HEIGHT)`. Sampled
      // through the same mapping rather than at the mask's own scale, because
      // what occludes is where the mask LANDS, not where it was drawn.
      const height = heightAt(box, y);
      if (height === null) {
        report.fail(`${where}: ${box.id} declares no scaleMode, so there is no drawn height to `
          + 'give the figure and nothing to overlap with');
        continue;
      }
      const width = Math.max(1, Math.round(height * FIGURE_ASPECT));
      const wide = roomWidth(room);
      let covered = 0;
      let total = 0;
      for (let py = Math.max(0, y - height); py < Math.min(PLAY_HEIGHT, y); py += 2) {
        const sy = Math.min(mask.height - 1, Math.floor((py / PLAY_HEIGHT) * mask.height));
        for (let px = Math.max(0, x - width / 2); px < Math.min(wide, x + width / 2); px += 2) {
          total += 1;
          const sx = Math.min(mask.width - 1, Math.floor((px / wide) * mask.width));
          if (mask.pixels[(sy * mask.width + sx) * 4 + 3] > SOLID) covered += 1;
        }
      }
      const share = total === 0 ? 0 : covered / total;
      const line = `${where}: plane ${plane.level}'s mask covers `
        + `${(share * 100).toFixed(0)}% of the ${width}x${height} figure drawn there`;
      if (covered === 0) {
        const message = `${line} -- NOTHING. The point claims an occlusion the mask cannot `
          + 'produce: an actor standing here would be drawn whole, in front of everything.';
        if (plane.maskPending) report.note(`  (not asserted, maskPending) ${message}`);
        else report.fail(message);
      } else {
        report.note(line);
      }
    }
  }

  report.note(`${boxes} walk box(es) and ${points} authored occlusion proof point(s) checked`);
  // NO SILENT CAPS: a plane the renderer is skipping is named every run, so a
  // decision made once stays visible instead of becoming invisible by being
  // accepted.
  for (const line of pending) report.note(line);
  report.note('the third assertion -- that the RUNTIME resolves the expected plane at these '
    + 'points -- is gate 8D in tools/gauntlet/proof.mjs, against a live frame. No file on '
    + 'disk can answer it.');
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
