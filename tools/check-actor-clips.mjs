import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadContent, Report } from './lib/content.mjs';

/**
 * Every clip directory is either a BODY CLIP the record declares, or an
 * OVERLAY the record must not declare. Nothing is allowed to be neither.
 *
 * WHY THIS IS A CHECK AND NOT A COMMENT. `art/actors/` holds two kinds of
 * thing that look identical from the outside -- a directory of RGBA frames
 * with a rig.json beside them. A body clip is scaled to a character height
 * against its `figure`. An overlay is a HEAD, composited into a body frame at
 * `overlay_rect`, and it has a `figure` too because the rig records the body
 * it belongs to. Scale an overlay by that figure and you get a sprite four to
 * eight pixels tall: absurd, silent, and produced by code that did nothing
 * obviously wrong.
 *
 * That is not hypothetical. Thad's three `talk` directories render at 4, 7 and
 * 8 px under exactly that treatment.
 *
 * TWO WAYS TO GET IT WRONG, AND BOTH FAIL HERE:
 *
 *   an overlay declared as a body clip  -- the absurd-sprite case;
 *   a directory in neither list         -- new art nobody wired, which is
 *                                          invisible because the game simply
 *                                          never asks for it.
 *
 * The second is the one that catches the next person rather than the last.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, 'art', 'actors');
const OVERLAY_KIND = 'head-overlay';

export function check() {
  const report = new Report('Every clip directory is a declared body clip or a marked overlay');
  const content = loadContent();

  // Every declared record, read from the MANIFEST'S OWN LIST rather than from
  // whatever the tools loader happens to expose. The list is the thing being
  // checked -- a character absent from it is exactly the gap -- so reading it
  // at the source keeps this check honest about what the game will load.
  const manifest = JSON.parse(readFileSync(join(ROOT, 'content', 'manifest.json'), 'utf8'));
  const paths = manifest.actors ?? [manifest.actor];
  const records = new Map();
  for (const path of paths) {
    const record = JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
    records.set(record.id, record);
  }
  if (!records.has(content.actor.id)) records.set(content.actor.id, content.actor);
  const declared = new Map();
  for (const record of records.values()) {
    for (const clip of record.clips ?? []) {
      for (const frame of clip.frames ?? []) {
        declared.set(frame.split('/').slice(0, -1).join('/'), { clip, record });
      }
    }
  }
  const known = new Set(records.keys());

  let bodies = 0;
  let overlays = 0;
  const unrecorded = new Map();
  const directories = readdirSync(ART, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of directories) {
    const rigPath = join(ART, name, 'rig.json');
    if (!existsSync(rigPath)) {
      report.fail(`art/actors/${name} has no rig.json -- neither a clip nor an overlay`);
      continue;
    }
    const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
    const isOverlay = rig.kind === OVERLAY_KIND || rig.overlay_rect !== undefined;
    const found = declared.get(`art/actors/${name}`);
    const clip = found?.clip;

    if (isOverlay && found) {
      report.fail(
        `art/actors/${name} is a ${OVERLAY_KIND} and the actor record declares it as the `
        + `body clip "${clip.id}/${clip.facing}". Scaled to its figure height of `
        + `${clip.figureHeight} it draws a few pixels tall. Overlays composite at `
        + `overlay_rect [${rig.overlay_rect ?? '?'}] into a body frame.`,
      );
      continue;
    }
    if (isOverlay) {
      if (!Array.isArray(rig.overlay_rect) || rig.overlay_rect.length !== 4) {
        report.fail(`art/actors/${name} is a ${OVERLAY_KIND} with no usable overlay_rect`);
        continue;
      }
      overlays += 1;
      continue;
    }
    if (!clip) {
      const character = name.split('-')[0];
      if (!known.has(character)) {
        unrecorded.set(character, (unrecorded.get(character) ?? 0) + 1);
        continue;
      }
      report.fail(
        `art/actors/${name} is neither declared in ${found?.record.id ?? character}'s record nor marked `
        + `"kind": "${OVERLAY_KIND}". New art nobody wired is invisible -- the game `
        + `never asks for it and nothing says so. Re-run tools/build-actor-record.mjs, `
        + `or mark it as an overlay.`,
      );
      continue;
    }
    bodies += 1;
  }

  for (const [character, count] of [...unrecorded].sort()) {
    report.fail(
      `${character} has ${count} clip directory/ies under art/actors/ and NO ACTOR RECORD. `
      + `content/manifest.json's \`actors\` list names ${[...known].join(', ')} and nothing `
      + `else, so there is nowhere for these to be declared and the game cannot ask for `
      + `them. This is not a missing clip and re-running the generator alone will not fix `
      + `it: add the character to CHARACTERS in tools/build-actor-record.mjs AND to the `
      + `manifest's list.`,
    );
  }

  report.note(`${bodies} body clip directory/ies declared, ${overlays} overlay(s) marked`);
  if (bodies + overlays !== directories.length) {
    report.note(`${directories.length - bodies - overlays} unaccounted for`);
  }
  return report;
}
