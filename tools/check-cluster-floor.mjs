import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

import { Report, ROOT, runCheck } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * A GENERATED CLUSTER BRINGS ITS OWN FLOOR, AND SOMEBODY HAS TO HAVE LOOKED AT
 * ALL OF IT.
 *
 * THE DEFECT THIS EXISTS FOR, twice in one room. The Nugget's floor is packed
 * dirt. Both of its generated interaction clusters drew a PLANK floor under
 * their furniture, and both times the damage was reviewed with an actor
 * standing in front of it:
 *
 *   - the card cluster's floor was repaired from y 505 DOWN, because above 505
 *     was taken for shadow under the table. Right of the group it is open lit
 *     floor, and the stove man's body covered it. He moved to the back of the
 *     room eight days later and it was suddenly the first thing you saw.
 *   - the grounding translation laid the bar's own kick-board on the dirt
 *     behind the foreground patron's boots, and he read as standing on a
 *     wooden platform.
 *
 * THE LESSON, and it is the reason this file exists rather than a better
 * texture classifier: WHEN INTEGRATING A GENERATED INTERACTION CLUSTER,
 * INSPECT THE ENTIRE CLUSTER FOOTPRINT FOR IMPORTED ENVIRONMENTAL MATERIAL,
 * ESPECIALLY FLOOR, WALLS AND FURNITURE SEAMS THAT WERE HIDDEN BY ACTORS
 * DURING REVIEW. Three texture discriminators were tried on this room and none
 * of them separates this room's dirt from this room's wood -- fine mottling
 * energy scores wood grain as high as dirt, directional coherence puts dirt at
 * 0.33-0.56 against plank at 0.45-0.71, and in a region this dark every
 * channel is small and so is every difference. So this does not try to SEE the
 * defect. It asserts that a person did, over the whole footprint, against the
 * plate that is actually shipping.
 *
 * WHAT IT ASSERTS, per `cluster-integrations.json` under art/staging:
 *
 *   1. the record names the plate it was inspected against, and that plate's
 *      sha256 still matches -- a new plate makes every clearance stale;
 *   2. every cluster names what environmental material it imported, and every
 *      repair names a tool that exists;
 *   3. every repair and written-off rect lies inside the cluster's footprint;
 *   4. THE WHOLE FLOOR OF THE FOOTPRINT IS ACCOUNTED FOR -- every pixel of
 *      (footprint AND the room's floor mask) is inside a repair rect or inside
 *      a rect explicitly written off with a reason. Nothing is accounted for
 *      by not having been mentioned, which is exactly how the first one got
 *      through: a repair that declares its own floor band covers it by
 *      construction, so the band has to come from the room.
 */
function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function findRecords(dir, found = []) {
  const here = resolve(ROOT, dir);
  if (!existsSync(here)) return found;
  for (const entry of readdirSync(here)) {
    const path = join(dir, entry);
    if (statSync(resolve(ROOT, path)).isDirectory()) findRecords(path, found);
    else if (entry === 'cluster-integrations.json') found.push(path);
  }
  return found;
}

const inside = (r, f) => r[0] >= f[0] && r[1] >= f[1] && r[2] <= f[2] && r[3] <= f[3];

export function check() {
  const report = new Report('A generated cluster brings its own floor, and all of it was looked at');
  const records = findRecords('art/staging');
  if (!records.length) {
    report.note('no cluster-integrations.json anywhere under art/staging');
    return report;
  }

  for (const path of records) {
    const record = JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
    const where = `${path}:`;

    if (!existsSync(resolve(ROOT, record.plate))) {
      report.fail(`${where} the plate it was inspected against is gone: ${record.plate}`);
      continue;
    }
    const actual = sha256(resolve(ROOT, record.plate));
    if (actual !== record.plateSha256) {
      report.fail(`${where} ${record.plate} has changed since it was inspected `
        + `(${actual.slice(0, 12)} now, ${String(record.plateSha256).slice(0, 12)} recorded). `
        + 'Look at every cluster footprint again and restate the sha.');
      continue;
    }

    const mask = readPng(readFileSync(resolve(ROOT, record.floorMask)));
    const isFloor = (x, y) => mask.pixels[(y * mask.width + x) * 4] > 127;

    for (const cluster of record.clusters ?? []) {
      const at = `${where} ${cluster.id}:`;
      const foot = cluster.footprint;
      if (!cluster.imported?.length) {
        report.fail(`${at} says nothing about what environmental material it brought`);
      }
      const rects = [];
      for (const repair of cluster.repairs ?? []) {
        if (!existsSync(resolve(ROOT, repair.tool))) {
          report.fail(`${at} names a repair tool that does not exist: ${repair.tool}`);
        }
        rects.push(repair.rect);
      }
      for (const off of cluster.writtenOff ?? []) {
        if (!off.why) report.fail(`${at} writes off ${off.rect.join(',')} with no reason`);
        rects.push(off.rect);
      }
      if (!rects.length) {
        report.fail(`${at} accounts for none of its floor`);
        continue;
      }
      const strays = rects.filter((r) => !inside(r, foot));
      if (strays.length) {
        report.fail(`${at} claims ${strays.length} rect(s) outside its own footprint `
          + `${foot.join(',')} -- first is ${strays[0].join(',')}`);
      }

      let uncovered = 0;
      let first = null;
      for (let y = Math.max(0, foot[1]); y < Math.min(mask.height, foot[3]); y += 1) {
        for (let x = Math.max(0, foot[0]); x < Math.min(mask.width, foot[2]); x += 1) {
          if (!isFloor(x, y)) continue;
          if (rects.some((r) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3])) continue;
          uncovered += 1;
          if (!first) first = [x, y];
        }
      }
      if (uncovered) {
        report.fail(`${at} leaves ${uncovered} floor pixel(s) of its footprint unaccounted for, `
          + `first at ${first.join(',')}. Every floor pixel a cluster stands on is either `
          + 'repaired or written off with a reason.');
      } else {
        report.note(`${cluster.id}: footprint ${foot.join(',')} · `
          + `${(cluster.repairs ?? []).length} repair(s), `
          + `${(cluster.writtenOff ?? []).length} written off · imported: `
          + cluster.imported.join('; '));
      }
    }
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
