import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { measureCast } from './audit-scale-vs-thad.mjs';
import { ROOT } from './lib/content.mjs';

/**
 * THE figureHeight THAT DRAWS A FIGURE AT `stature` OF THAD WHERE IT STANDS
 * (errata 234). For a figure tools/audit-scale-vs-thad.mjs measures off Thad,
 * the data fix is a `figureHeight` -- never the pixels, never its position.
 * A figure whose soles are its `y` needs only its measured crown-to-sole; a
 * group's tallest adult stands behind the group's `y`, so the curve under
 * him differs from the one the sheet is scaled by, and the answer is found by
 * search through the engine's own arithmetic.
 *
 * Usage: node tools/solve-figure-height.mjs <figure>[@room][=stature] ...
 * (stature defaults to the file's, or 1 for a sheet that declares none).
 */
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json');
const files = new Map(manifest.ambient.map((path) => { const one = read(path); return [one.id, one]; }));

export function solve(id, roomId, stature) {
  const file = files.get(id);
  const target = stature ?? file.sprite.stature ?? 1;
  const ratioAt = (figureHeight) => {
    const measured = measureCast({ ambient: { [id]: { sprite: { figureHeight, stature: target } } } });
    return measured.find((one) => one.figure === id && (!roomId || one.room === roomId)).ratio;
  };
  let lo = 20;
  let hi = 4000;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (ratioAt(mid) > target) lo = mid; else hi = mid;
  }
  const figureHeight = Math.round((lo + hi) / 2);
  return { id, room: roomId ?? file.room, stature: target, figureHeight, ratio: ratioAt(figureHeight) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const arg of process.argv.slice(2)) {
    const [who, stature] = arg.split('=');
    const [id, room] = who.split('@');
    const one = solve(id, room, stature === undefined ? undefined : Number(stature));
    console.log(`${one.id} in ${one.room}: figureHeight ${one.figureHeight}, stature ${one.stature} -> ${one.ratio.toFixed(3)} of Thad`);
  }
}
