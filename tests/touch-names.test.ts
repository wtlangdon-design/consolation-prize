/**
 * A TAP NAMES, A SECOND TAP DOES; AND THE GROUND READS "WALK TO" (errata 319).
 * Tyler, 2026-11-14, testing on his phone: a click on a thing "doesn't say what it is in the bottom menu. It just
 * activates it." A finger has no hover. Proved against the defect: without the rule a first tap acts (the first
 * assertion fails), and with errata 28b's fallback alone the empty ground read "Look at".
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { touchNames } from '../engine/core/Standing.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

test('a first tap on a thing names it; the second tap on it acts', () => {
  assert.equal(touchNames({ chosen: false, under: 'thing:portrait', named: null }), 'name');
  assert.equal(touchNames({ chosen: false, under: 'thing:portrait', named: 'thing:portrait' }), 'act');
  assert.equal(touchNames({ chosen: false, under: 'thing:sabre', named: 'thing:portrait' }), 'name', 'another thing is named first');
});

test('the ground and the ways out go at once, and so does a chosen verb', () => {
  assert.equal(touchNames({ chosen: false, under: undefined, named: null }), 'act');
  assert.equal(touchNames({ chosen: true, under: 'thing:portrait', named: null }), 'act');
});

test('with no verb chosen, nothing under the pointer reads as a walk', async () => {
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.equal(state.verbs.verbFor(undefined), content.verbs.walkVerb.id);
});
