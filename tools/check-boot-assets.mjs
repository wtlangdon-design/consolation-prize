import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadContent as loadEngineContent } from '../engine/core/ContentLoader.ts';
import { FIRST_FRAME_CLIPS, planBoot } from '../engine/core/BootAssets.ts';
import { ROOT, Report } from './lib/content.mjs';

/**
 * Every declared image is loaded, exactly once, on one side of the boot split.
 *
 * THE FAILURE THIS IS FOR HAS A NAME NOW: DECLARED AND NEVER LOADED. Hob's
 * record parsed. His art was on disk. `check-actor-clips` passed. The asset
 * path check passed. He drew nothing, because the loader asked for the
 * protagonist's frames and no others -- a third category beyond "missing clip"
 * and "missing record", and one that no check could see, because every
 * artefact it would have looked at was correct.
 *
 * A partition makes it visible by construction. `planBoot` returns two lists;
 * this walks the content records INDEPENDENTLY, generically, the way
 * check-asset-paths does, and asserts that every image it finds is in one of
 * them. Walking independently is the point: if this check enumerated assets by
 * calling planBoot's own field-by-field helper it would agree with itself
 * about a field neither of them knows exists, which is precisely how Hob was
 * missed. The next `"image"` somebody adds to a schema is found here by the
 * regex, not by anyone remembering to update the loader.
 *
 * THREE THINGS ARE ASSERTED.
 *
 *   covered  -- every declared image is in `required` or `deferred`. This is
 *               the Hob category.
 *   disjoint -- no texture key is in both. An asset cannot both block the
 *               first frame and not block it.
 *   unique   -- no texture key names two different files. Room images are
 *               keyed by room and everything else by its own path, so a
 *               collision means two rooms would fight over one texture.
 *
 * AND ONE THING IS REPORTED, NOT ASSERTED: the byte weight of each half. There
 * is no threshold here because there is no ruling on one. The number is
 * printed every run so that the next character's frames landing in `required`
 * is a thing somebody can see happening rather than a thing they discover by
 * staring at a black screen. Boot was 70 MB and fifteen seconds when nobody
 * was printing it.
 */

// Same shape as check-asset-paths', deliberately: what counts as an asset
// path should not be two different questions in two files.
const ASSET = /^(art|assets)\/[^\s"']+\.(png|webp|gif|jpg|jpeg)$/i;

function walk(node, path, out) {
  if (typeof node === 'string') {
    if (ASSET.test(node)) out.push({ ref: node, at: path });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`, out);
  }
}

function megabytes(assets) {
  let bytes = 0;
  for (const path of new Set(assets.map((asset) => asset.path))) {
    try {
      bytes += statSync(resolve(ROOT, path)).size;
    } catch {
      // A path that does not resolve is check-asset-paths' failure, not this
      // one. Reporting it twice would only make the other check look optional.
    }
  }
  return (bytes / 1e6).toFixed(2);
}

export async function check() {
  const report = new Report('Boot loads every declared image, exactly once, on one side of the split');

  // The ENGINE's loader, with an fs reader -- not the tools' parallel one.
  // planBoot takes the bundle the game builds, and a second loader that
  // assembles a similar-looking object would be a second thing to keep in
  // step. This is the same code path BootScene runs.
  const read = async (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
  const bundle = await loadEngineContent(read);
  const plan = planBoot(bundle);

  const seen = new Map();
  let clash = false;
  for (const [side, assets] of [['required', plan.required], ['deferred', plan.deferred]]) {
    for (const asset of assets) {
      const first = seen.get(asset.key);
      if (first && first.path !== asset.path) {
        report.fail(
          `texture key "${asset.key}" names two different files -- ${first.path} in `
          + `${first.side} and ${asset.path} in ${side}. Whichever loads second wins and `
          + `the other room draws the wrong picture.`,
        );
        clash = true;
      } else if (first) {
        report.fail(
          `${asset.path} is in BOTH lists (key "${asset.key}"). It cannot both have to `
          + `exist before the first frame and be allowed to arrive after it.`,
        );
        clash = true;
      }
      if (!first) seen.set(asset.key, { path: asset.path, side });
    }
  }

  const planned = new Set([...plan.required, ...plan.deferred].map((asset) => asset.path));

  // Every image any content record names, found generically.
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/manifest.json'), 'utf8'));
  const files = new Set([manifest.actor, ...(manifest.actors ?? []), manifest.itemIcons,
    ...manifest.rooms, ...(manifest.ambient ?? []), ...(manifest.items ?? [])]);
  const declared = new Map();
  for (const file of files) {
    const found = [];
    walk(JSON.parse(readFileSync(resolve(ROOT, file), 'utf8')), '', found);
    for (const { ref, at } of found) {
      if (!declared.has(ref)) declared.set(ref, `${file}${at}`);
    }
  }

  const orphans = [...declared].filter(([ref]) => !planned.has(ref));
  for (const [ref, at] of orphans.slice(0, 12)) {
    report.fail(
      `${ref} is declared at ${at} and is in NEITHER boot list. Nothing will ever `
      + `load it, nothing will fail, and whatever draws it will silently show the `
      + `graybox placeholder instead. Add it to planBoot in engine/core/BootAssets.ts.`,
    );
  }
  if (orphans.length > 12) {
    report.fail(`...and ${orphans.length - 12} more declared image(s) in neither list`);
  }

  if (orphans.length === 0 && !clash) {
    report.note(
      `${declared.size} declared image(s) partitioned: `
      + `${plan.required.length} required (${megabytes(plan.required)} MB), `
      + `${plan.deferred.length} deferred (${megabytes(plan.deferred)} MB)`,
    );
    // WHO, not just what. The cast is derived from the opening's staging, so
    // adding a mover to an early beat silently grows the blocking set -- and
    // the coach's two frames cost 1.44 MB. Printed every run so that growth is
    // something somebody sees rather than discovers by waiting for a screen.
    const cast = [...new Set(plan.required
      .map((asset) => asset.path.match(/^art\/actors\/([^-/]+)-/)?.[1])
      .filter(Boolean))].sort();
    report.note(`the first frame waits on ${bundle.manifest.startRoom} and `
      + `${cast.join(', ')} -- ${FIRST_FRAME_CLIPS.join(', ')} each`);
  }
  return report;
}
