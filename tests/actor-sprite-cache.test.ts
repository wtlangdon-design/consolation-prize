import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ActorSprite } from '../engine/render/ActorSprite.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * THE RESAMPLE CACHE IS BOUNDED. A depth-scaled room scales the protagonist, so a walk down
 * the room draws every frame at a new size on every row, and each size was a
 * canvas the cache kept for ever. The Act I gameplay pass lost its renderer
 * after seven minutes of that. This drives the sprite through more distinct
 * heights than the bound and checks the cache stops at the bound, keeps the
 * most recent sizes, and releases the ones it drops.
 */
test('the resampled-frame cache is bounded and drops the least recently drawn size', () => {
  // The protagonist's record, by way of the manifest: the tests name no file
  // of the fiction, the same way the engine names none.
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/manifest.json'), 'utf8'));
  const table = JSON.parse(readFileSync(resolve(ROOT, manifest.actor), 'utf8'));
  const made: { width: number; height: number }[] = [];
  const fakeDocument = {
    createElement: () => {
      const canvas = {
        width: 0, height: 0,
        getContext: () => ({ imageSmoothingEnabled: true, imageSmoothingQuality: 'low', drawImage() { /* fake */ } }),
      };
      made.push(canvas);
      return canvas;
    },
  };
  const had = (globalThis as { document?: unknown }).document;
  (globalThis as { document?: unknown }).document = fakeDocument;
  try {
    const image = { width: 1105, height: 1702 };
    const sprite = new ActorSprite(table, () => image as unknown as CanvasImageSource);
    const context = { drawImage() { /* fake */ } } as unknown as CanvasRenderingContext2D;
    const limit = ActorSprite.CACHE_LIMIT;
    assert.ok(limit > 0 && limit < 1000, 'a real bound');

    // Every row of a scaled room: a new height each draw, six walk frames each.
    let drawn = 0;
    for (let height = 400; height < 400 + limit; height += 1) {
      for (let frame = 0; frame < 6; frame += 1) {
        const out = sprite.draw(context, 'walk', 'right', 'floor', frame, 500, 700, height);
        assert.ok(out, 'the fake canvas draws');
        drawn += 1;
      }
    }
    assert.ok(drawn > limit, `${drawn} distinct sizes were drawn, more than the bound`);
    assert.equal(sprite.cached(), limit, 'and the cache holds exactly the bound');
    const released = made.filter((c) => c.width === 0 && c.height === 0).length;
    assert.equal(released, made.length - limit, 'every dropped canvas had its backing store released');

    // The most recent size is still cached: drawing it again makes no canvas.
    const before = made.length;
    sprite.draw(context, 'walk', 'right', 'floor', 5, 500, 700, 400 + limit - 1);
    assert.equal(made.length, before, 'a hit makes nothing');
    // The oldest was dropped: drawing it again resamples.
    sprite.draw(context, 'walk', 'right', 'floor', 0, 500, 700, 400);
    assert.equal(made.length, before + 1, 'a miss on the dropped size resamples');
    assert.equal(sprite.cached(), limit);
  } finally {
    (globalThis as { document?: unknown }).document = had;
  }
});
