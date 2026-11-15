/**
 * A CLICK WITH NO VERB DOES THE THING'S OWN VERB (errata 317; Tyler, 2026-11-14, playing: "Everything is currently
 * 'Walk to' by default ... having to click 'Look at' for a majority of the items is cumbersome." Offered Monkey Island
 * 2's right button, he chose "Left click does it"). Errata 283's MI1 walk is withdrawn; errata 28b's table stands:
 * with no verb chosen, a click on a thing performs its defaultVerb, the right button the same, and a chosen verb wins.
 * Proved against the defect: under errata 283 a bare click on a thing walked, and the first test fails.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);

test('with no verb chosen, a click on a thing does its own verb, left button or right', () => {
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  const things = state.targets.filter((one) => !(one as { to?: string }).to && one.defaultVerb && one.defaultVerb !== content.verbs.walkVerb.id);
  assert.ok(things.length > 3, 'things that are not the ground');
  for (const thing of things) {
    assert.equal(state.verbs.verbFor(thing), thing.defaultVerb, `${thing.id}: a left click does its verb`);
    assert.equal(state.verbs.verbFor(thing, true), thing.defaultVerb, `${thing.id}: and so does the right`);
  }
  assert.equal(state.verbs.bareClickWalks, false, 'a bare click no longer only walks');
});

test('a chosen verb is what a click does; an item in the pocket keeps its own default', () => {
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  const thing = state.targets[0]!;
  state.verbs.selectVerb('PUSH');
  assert.equal(state.verbs.verbFor(thing), 'PUSH');
  state.verbs.resetToDefault();
  const item = state.itemTarget([...content.items.keys()][0]!)!;
  assert.equal(state.verbs.verbFor(item, false, true), item.defaultVerb ?? content.verbs.defaultVerb);
});
