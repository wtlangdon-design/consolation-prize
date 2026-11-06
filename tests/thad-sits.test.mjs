import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * DOC 48 S5 BEAT 3: "He sits down in the dark and listens to it." Room 33's
 * ninety seconds are played seated (tools/art/thad-sit.py; GameScene
 * sitWhenSaid / riseIfSeated). What is held here is what would show:
 *
 *   - `sit` starts on his stand and ends on the seated frame, and `rise` is the
 *     same frames backwards, so neither end pops;
 *   - seated is ONE still frame for every clip he plays standing still --
 *     invariant 8: by the time the score resolves, the lamp is the only moving
 *     thing in the frame, and a breathing figure would be a second;
 *   - a sit is not a verb's snap: it takes the better part of a second.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const thad = JSON.parse(readFileSync(resolve(ROOT, 'content/actors/thad.json'), 'utf8'));
const clip = (id, facing, state) => thad.clips.find((c) => c.id === id && c.facing === facing && c.state === state);
const pixels = (p) => readPng(readFileSync(resolve(ROOT, p))).pixels;
const same = (a, b) => Buffer.compare(Buffer.from(pixels(a)), Buffer.from(pixels(b))) === 0;

for (const facing of ['left', 'right']) {
  test(`he sits and rises facing ${facing}, from his stand to one still seated frame and back`, () => {
    const sit = clip('sit', facing); const rise = clip('rise', facing);
    assert.ok(sit && rise, `sit and rise are declared facing ${facing}`);
    assert.deepEqual(rise.frames.map((f) => pixels(f).length), [...sit.frames].reverse().map((f) => pixels(f).length));
    sit.frames.forEach((f, i) => assert.ok(same(f, rise.frames[rise.frames.length - 1 - i]), `rise is sit backwards (${f})`));
    const seated = clip('idle', facing, 'seated');
    assert.ok(seated, 'idle has a seated state');
    for (const id of ['idle', 'idle-break', 'stand']) {
      const held = clip(id, facing, 'seated');
      assert.ok(held, `${id} has a seated state`);
      assert.equal(held.frames.length, 1, `${id}/seated is one still frame (invariant 8)`);
      assert.ok(same(held.frames[0], sit.frames.at(-1)), `${id}/seated is the frame the sit ends on`);
    }
    assert.ok(sit.frames.length / thad.reactRate >= 0.8, `the sit takes ${(sit.frames.length / thad.reactRate).toFixed(2)} s`);
  });
}
