/**
 * A PERSON DRAWN IN A ROOM ANSWERS AS A PERSON (errata 323; doc 133, THE COMPANY'S CLERK).
 *
 * Tyler, 2026-11-14: "Is the Clerk not supposed to talk when Thad tries to talk to him?" Pointing at the clerk found
 * Fanshawe's portrait on the wall behind him, so TALK TO got Thad's line for a picture ("I'll save my charm for
 * something that can answer"), said at a man. Held here: over his figure the pointer finds him; a click talks to him;
 * he answers in his own voice.
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
const clerk = JSON.parse(await readFile(resolve(ROOT, 'content/ambient/lobby-clerk.json'), 'utf8'));

test('over the clerk\'s face and chest the pointer finds the clerk, not the portrait behind him', () => {
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(clerk.room);
  const [, , w, h] = clerk.sprite.frames[0];
  // Head and chest: the top two thirds of the figure drawn above the desk, around his middle.
  for (const dy of [0.2, 0.4, 0.6]) {
    for (const dx of [-0.2, 0, 0.2]) {
      const at = state.targetAt(Math.round(clerk.x + dx * w), Math.round(clerk.y - h + dy * h));
      assert.equal(at?.id, 'clerk', `at ${dx}, ${dy}`);
    }
  }
});

test('a click talks to him, and he answers in his own voice', () => {
  const room = content.rooms.get(clerk.room)!;
  const spot = room.hotspots.find((one) => one.id === 'clerk')!;
  assert.equal(spot.defaultVerb, 'TALK_TO');
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(clerk.room);
  const result = state.interact(state.targets.find((one) => one.id === 'clerk')!, 'TALK_TO');
  assert.ok(result.say);
  const rule = (spot.responses.TALK_TO ?? [])[0]!;
  assert.ok((rule.then ?? []).some((line) => typeof line === 'object' && line.speaker === clerk.id), 'he speaks');
});
