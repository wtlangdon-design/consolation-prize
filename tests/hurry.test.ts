import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { sameClickAgain } from '../engine/core/Standing.ts';

/**
 * A SECOND CLICK ON THE SAME PLACE HURRIES HIM (errata 260).
 *
 * Long rooms are long: Main Street is nineteen seconds end to end at a walking man's pace, and errata 256's second
 * click only helps at a way out. The same click again, while he is walking there, makes him hurry. He is never moved,
 * the walk is not started over, and what he was going to do when he arrived is still what he does.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const last = { x: 1000, y: 700, ask: '||1' };

test('the same place and the same ask, while he walks, hurries him; anything else is a new instruction', () => {
  const same = { walking: true, last, at: { x: 1010, y: 705 }, ask: '||1', within: 48 };
  assert.equal(sameClickAgain(same), 'hurry');
  assert.equal(sameClickAgain({ ...same, walking: false }), 'new', 'a man standing still was hurried');
  assert.equal(sameClickAgain({ ...same, last: null }), 'new');
  assert.equal(sameClickAgain({ ...same, at: { x: 1300, y: 700 } }), 'new', 'a click somewhere else is a change of mind');
  assert.equal(sameClickAgain({ ...same, ask: 'LOOK_AT||1' }), 'new', 'another verb on the same thing is another instruction');
  assert.equal(sameClickAgain({ ...same, ask: '|chalk|1' }), 'new', 'the same place with something in hand is another instruction');
});

test('a hurry is a faster walk and nothing else: the factor is content, modest, and the scene moves nobody', async () => {
  const ui = JSON.parse(await readFile(resolve(ROOT, 'content/ui/ui.json'), 'utf8')) as { timing: { hurry: number } };
  assert.ok(ui.timing.hurry > 1 && ui.timing.hurry <= 1.8, `he hurries at ${ui.timing.hurry} times a walk: more than 1.8 is a run, and no run is drawn`);
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const block = scene.slice(scene.indexOf('THE SAME CLICK AGAIN HURRIES HIM'), scene.indexOf('A CHANGE OF MIND ABOUT A CONVERSATION'));
  assert.ok(block.includes('sameClickAgain(') && block.includes('this.actor.hurry('), 'the scene does not ask the rule');
  assert.ok(!block.includes('placeAt(') && !block.includes('.cancel('), 'a hurry moved him or cancelled what he was doing');
  const actor = await readFile(resolve(ROOT, 'engine/core/Actor.ts'), 'utf8');
  assert.ok(/walkTo\(x: number, y: number\): boolean \{\s*if \(this\.rooted\) return false;\s*this\.hurried = 1;/.test(actor),
    'a new walk does not begin at his own pace');
  assert.ok(actor.includes('this.speed * this.hurried * scale'), 'the hurry is not in his step');
});
