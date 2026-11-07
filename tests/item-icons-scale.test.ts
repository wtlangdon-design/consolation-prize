/**
 * EVERY ITEM ICON IS DRAWN AT A WHOLE-NUMBER SCALE (errata 142, 143).
 *
 * The inventory slot is 180x80 (content/ui/panel.json) and Renderer.drawInventory
 * fits each icon by min(slotWidth / w, slotHeight / h). The old 30x21 cells came
 * to x3.81: some art pixels drew three screen pixels wide and some four, against
 * CLAUDE.md's integer scaling and errata 112 B's "never enlarged". Redrawn at
 * 60x40 they fit at exactly x2. Held here for every cell, and shown failing on
 * the old 30x21 cell.
 *
 * And no icon carries the magenta it was cut from: the first cut left a pink
 * line round the outlines, at the key's own hue.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const panel = read('content/ui/panel.json');
const table = read('content/ui/item-icons.json');
const [slotW, slotH] = panel.inventory.cell as [number, number];

/** The scale drawInventory draws a w x h cell at, if it is a whole number; null otherwise. */
const wholeScale = (w: number, h: number): number | null => {
  const fit = Math.min(slotW / w, slotH / h);
  return Number.isInteger(fit) ? fit : null;
};

test('every icon cell is drawn into its slot at a whole-number scale', () => {
  const icons = table.icons as Record<string, [number, number, number, number]>;
  assert.equal(Object.keys(icons).length, 26, 'all 26 items have an icon');
  for (const [id, [, , w, h]] of Object.entries(icons)) {
    const fit = wholeScale(w, h);
    assert.ok(fit !== null && fit >= 1, `${id}: a ${w}x${h} cell draws at x${Math.min(slotW / w, slotH / h).toFixed(3)} in the ${slotW}x${slotH} slot`);
  }
  assert.deepEqual(table.cell, [60, 40], 'the declared cell is 60x40');
  assert.equal(wholeScale(60, 40), 2, 'which draws at x2');
});

test('the old 30x21 cell is what this catches', () => {
  assert.equal(wholeScale(30, 21), null, '180x80 over 30x21 is x3.81');
});

test('the sheet holds every cell, and no icon pixel is at the key colour\'s hue', () => {
  const png = readPng(readFileSync(resolve(ROOT, table.sheet)));
  let keyed = 0;
  for (const [id, [x, y, w, h]] of Object.entries(table.icons as Record<string, number[]>)) {
    assert.ok(x + w <= png.width && y + h <= png.height, `${id}'s cell lies inside the sheet`);
    let drawn = 0;
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        const at = (yy * png.width + xx) * 4;
        if (png.pixels[at + 3] === 0) continue;
        drawn += 1;
        const [r, g, b] = [png.pixels[at], png.pixels[at + 1], png.pixels[at + 2]];
        const hue = ((Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI + 360) % 360;
        if (hue > 285 && hue < 335 && Math.max(r, g, b) - Math.min(r, g, b) > 25) keyed += 1;
      }
    }
    assert.ok(drawn > 100, `${id} draws something`);
  }
  assert.equal(keyed, 0, 'pixels at the magenta key\'s hue');
});
