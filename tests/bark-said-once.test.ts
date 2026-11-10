import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { SaidLately } from '../engine/core/Ambient.ts';

/**
 * ONE FIGURE, ONE LINE, ONCE A WALK PAST (errata 242). A figure whose break shouts says her reputation line on a timer
 * and once to Thad's face on his first pass in that reputation. The whole game played (2026-11-09) printed the same line
 * twice running three times, each on the first pass after his reputation changed. Whichever comes second is not shown.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');

test('the second saying of a line inside a minute is not shown, whichever clock it came from', () => {
  const said = new SaidLately();
  assert.equal(said.allow('a', 'one', 100), true, 'the first is said');
  assert.equal(said.allow('a', 'one', 108), false, 'the same line eight seconds on is not');
  assert.equal(said.allow('a', 'one', 159), false, 'nor inside the minute');
  assert.equal(said.allow('a', 'one', 161), true, 'a minute after the first, it is');
});

test('a different line, and another figure, are not held back', () => {
  const said = new SaidLately();
  assert.equal(said.allow('a', 'one', 0), true);
  assert.equal(said.allow('a', 'two', 1), true, 'her line for a new reputation');
  assert.equal(said.allow('b', 'two', 2), true, 'somebody else with the same words');
});

test('both ways a figure calls out go through it: the approach and the speaking break', () => {
  const approach = scene.slice(scene.indexOf('this.ambient.checkApproach(this.actor.x, this.actor.y)'));
  assert.match(approach.slice(0, 900), /this\.mayCallOut\(fired\.npc\.id, fired\.line\)/);
  const start = scene.indexOf('private speakingBreaks(');
  const breaks = scene.slice(start, scene.indexOf('private soundingBreaks(', start));
  assert.match(scene, /private mayCallOut\(id: string, line: string\): boolean \{\s+return this\.saidLately\.allow\(id, line, this\.time\.now \/ 1000\);/);
  assert.match(breaks, /this\.mayCallOut\(npc\.id, line\)/);
});
