/**
 * A CLICK WITH NO VERB WALKS (errata 283; Tyler, 2026-11-11, asked how a bare click should behave: "Exactly MI1").
 * The first Monkey Island walked Guybrush to whatever was clicked with no verb chosen; acting took a verb. Proved
 * against the defect: under errata 28b a bare click on an object performed its default verb (LOOK AT), and the
 * first test fails.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);

test('with no verb chosen, a click on a thing walks to it, left button or right', () => {
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  const thing = state.targets.find((one) => !(one as { to?: string }).to && one.defaultVerb !== content.verbs.walkVerb.id);
  assert.ok(thing, 'a thing that is not the ground');
  assert.equal(state.verbs.verbFor(thing), content.verbs.walkVerb.id);
  assert.equal(state.verbs.verbFor(thing, true), content.verbs.walkVerb.id, 'the right button is the left');
});

test('a chosen verb is what a click does; an item in the pocket keeps its own default', () => {
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  const thing = state.targets[0]!;
  state.verbs.selectVerb('PUSH');
  assert.equal(state.verbs.verbFor(thing), 'PUSH');
  assert.equal(state.verbs.verbFor(thing, true), 'PUSH');
  state.verbs.resetToDefault();
  const item = state.itemTarget([...content.items.keys()][0]!)!;
  assert.equal(state.verbs.verbFor(item, false, true), item.defaultVerb ?? content.verbs.defaultVerb);
});

test('a person clicked with no verb is walked to, and nothing opens', () => {
  const scene = readFileSync(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const at = scene.indexOf('if (npc && chosen === null && this.state.verbs.bareClickWalks)');
  assert.ok(at > 0, 'the scene walks to a person on a bare click');
  const branch = scene.slice(at, scene.indexOf('\n    }\n', at));
  assert.doesNotMatch(branch, /pendingTree|dialogue/, 'and opens no conversation');
  assert.ok(at < scene.indexOf('if (npc?.tree) {'), 'before the branch that opens one');
});
