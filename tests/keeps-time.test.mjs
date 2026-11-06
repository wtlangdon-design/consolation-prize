import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ambientFrameAt } from '../engine/render/Renderer.ts';

/**
 * A FIGURE THAT KEEPS TIME WITH THE ROOM'S MUSIC (doc 22: "fiddler idles in
 * time with the musical bar grid"; errata 118). Found open when the
 * townspeople were cast (errata 115): the fiddler bowed at a fixed rate that
 * had nothing to do with the piano he plays beside.
 *
 * Held here, for every ambient figure that declares `keepsTime: "music"`:
 *   - the room he stands in plays a bed that declares its tempo, or there is
 *     no beat to keep;
 *   - his `rate` is written as tempo / 120, so the file says the speed he moves;
 *   - his breaks come a whole number of bars apart, so each starts on a bar line;
 *   - driven by the bed's clock at that tempo, the idle turns over ON THE BEAT:
 *     just after beat k it shows frame k mod 2, outside a break.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const manifest = read('content/manifest.json');
const BEATS_PER_BAR = 4;

const keepers = manifest.ambient.map(read).filter((npc) => npc.sprite?.keepsTime === 'music');

test('someone keeps time with the music (the Nugget\'s fiddler)', () => {
  assert.ok(keepers.length >= 1);
});

for (const npc of keepers) {
  test(`${npc.id} keeps time with ${npc.room}'s music`, () => {
    const bed = manifest.music?.rooms?.[npc.room];
    assert.ok(bed?.tempo > 0, `${npc.room}'s music declares no tempo, so there is no beat for ${npc.id} to keep`);
    const sprite = npc.sprite;
    assert.ok(Math.abs(sprite.rate - bed.tempo / 120) < 0.001,
      `${npc.id}: rate ${sprite.rate} is not the bed's tempo / 120 (${(bed.tempo / 120).toFixed(4)})`);
    const bar = (BEATS_PER_BAR * 60) / bed.tempo;
    const bars = sprite.breakEvery / bar;
    assert.ok(Math.abs(bars - Math.round(bars)) < 0.01,
      `${npc.id}: breakEvery ${sprite.breakEvery} s is ${bars.toFixed(2)} bars, not a whole number`);

    const timed = { ...sprite, rate: bed.tempo / 120, phase: 0 };
    const beat = 60 / bed.tempo;
    const longest = Math.max(...(sprite.breaks ?? [[]]).map((one) => one.length)) * 0.34;
    let checked = 0;
    for (let k = 0; k * beat < sprite.breakEvery * 3; k += 1) {
      const t = k * beat + 0.02;
      const into = t % sprite.breakEvery;
      if (into < longest + 0.05) continue; // a break is playing
      assert.equal(ambientFrameAt(timed, 0, t), k % 2, `${npc.id}: just after beat ${k} the bow is not on its stroke`);
      checked += 1;
    }
    assert.ok(checked > 40, 'enough beats checked');
  });
}
