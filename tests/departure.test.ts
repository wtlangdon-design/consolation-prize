import assert from 'node:assert/strict';
import test from 'node:test';

import { departureAt } from '../engine/core/Departure.ts';
import type { AmbientExit } from '../engine/core/types.ts';

/**
 * A CHARACTER NEVER JUST DISAPPEARS (Tyler, 2026-11-01). A departing figure's
 * place and frame are a pure function of his exit and the time.
 */
const walk: AmbientExit = {
  path: [[100, 100], [0, 100], [0, 50]],
  speed: 50,
  sheet: 'x.png',
  frames: [[0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1]],
  fps: 6,
  drawnFacing: 'left',
  figureHeight: 10,
};

test('he walks the path at its speed, leg by leg, and is done only at its end', () => {
  assert.deepEqual(departureAt(walk, 0), { x: 100, y: 100, heading: -1, frame: 0, done: false });
  const mid = departureAt(walk, 1);
  assert.equal(mid.x, 50);
  assert.equal(mid.heading, -1, 'walking left along the first leg');
  assert.equal(departureAt(walk, 2).x, 0, 'the corner after 100 px');
  assert.equal(departureAt(walk, 2.5).y, 75, 'and on along the second leg');
  assert.equal(departureAt(walk, 2.9).done, false);
  assert.equal(departureAt(walk, 3).done, true, '150 px at 50 px/s');
});

test('the walk cycle advances at its fps and wraps', () => {
  assert.equal(departureAt(walk, 0.1).frame, 0);
  assert.equal(departureAt(walk, 0.2).frame, 1);
  assert.equal(departureAt(walk, 0.5).frame, 0, 'three frames at 6 fps wrap after half a second');
});

/**
 * A WALK OUT IS LOADED AT BOOT. The first walk-out's proof in the browser
 * showed him standing at the deal and gone the next frame: his exit sheet was on
 * no load list, so the walker had nothing to draw. Every declared exit's
 * sheet is required at boot, as every ambient's own sheet is.
 */
test('every ambient exit sheet is loaded at boot', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { loadContent } = await import('../engine/core/ContentLoader.ts');
  const { planBoot } = await import('../engine/core/BootAssets.ts');
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
  const content = await loadContent(async (path: string) => JSON.parse(await readFile(resolve(root, path), 'utf8')));
  const required = new Set(planBoot(content).required.map((asset) => asset.path));
  const exits = [...content.ambient.values()].filter((npc) => npc.exit);
  assert.ok(exits.length > 0, 'at least one character walks out');
  for (const npc of exits) assert.ok(required.has(npc.exit!.sheet), `${npc.id}'s walk ${npc.exit!.sheet} is loaded at boot`);
});
