/**
 * ROOM 22, THE ROAD TO THE CLAIMS, from the room's own fixtures
 * (content/fixtures/room-22.json).
 *
 * Doc 57 A4: "Room 22 offers the way to it, only while Thad holds the map",
 * and without the map, walking up answers with the document's line. Doc 10's
 * two crowds walk the road (Tyler, 2026-11-05: "Walk the road"): each is seen
 * walking for part of its cycle and is off the frame for the rest, never
 * standing. Every line asserted is read from the documents.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { AmbientLayer, loopPose } from '../engine/core/Ambient.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
const wayUp = (state: GameState) => state.targets.find((one) => one.holding && one.id.endsWith('_closed'));

test('A4: without the map, the way up answers with the document\'s line', async () => {
  const state = await inState('r22-a');
  const closed = wayUp(state);
  assert.ok(closed, 'the way up is there, closed');
  const said = state.interact(closed, 'WALK_TO');
  assert.ok(said.say && doc57.includes(`"${said.say}"`), 'doc 57 A4\'s line');
  assert.equal(state.roomId, 'claims_road', 'and he does not go');
});

test('A4: with the map in hand, the closed way is gone', async () => {
  const state = await inState('r22-b');
  assert.ok(state.carried.includes('company_map'));
  assert.equal(wayUp(state), undefined);
});

test('the two crowds walk the road, and are off the frame between walks', async () => {
  const state = await inState('r22-a');
  const layer = new AmbientLayer(state);
  layer.arrived();
  const walkers = layer.present.filter((one) => one.loop);
  assert.equal(walkers.length, 2, 'the men going out and the men coming back');
  for (const npc of walkers) {
    const seen: number[] = [];
    let away = 0;
    for (let clock = 0; clock < 120; clock += 0.5) {
      const pose = loopPose(npc, clock);
      if (pose) seen.push(pose.x);
      else away += 1;
    }
    assert.ok(seen.length > 20, `${npc.id} is seen walking`);
    assert.ok(new Set(seen).size > 20, `${npc.id} moves along the road`);
    assert.ok(away > 0, `${npc.id} is off the frame between walks`);
  }
});
