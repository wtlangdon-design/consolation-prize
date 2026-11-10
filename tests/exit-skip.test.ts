import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { secondExitClick } from '../engine/core/Standing.ts';
import { HeadlessPlayer, playThrough } from './lib/headless-player.ts';

/**
 * A SECOND CLICK ON THE WAY OUT GOES AT ONCE (errata 256; doc 122 P2. Tyler, 2026-11-10: "P2 - yes").
 *
 * The first click on a way out walks him to it. A second click on the same way out, while he walks, cuts to the next
 * room: the map has done this since errata 163, and a room had not. A door that is a beat is never cut: its line is
 * said at the door, and he has to be seen to get there.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as
  { steps: { id: string }[] };

test('only a second click on the same way out cuts the walk, and only where the way simply lets him through', () => {
  const same = { walkingTo: 'door', clicked: 'door', transit: true, atOnce: true };
  assert.equal(secondExitClick(same), 'cut');
  assert.equal(secondExitClick({ ...same, walkingTo: null }), 'walk', 'a first click walks');
  assert.equal(secondExitClick({ ...same, clicked: 'other_door' }), 'walk', 'another way out is a change of mind');
  assert.equal(secondExitClick({ ...same, clicked: null }), 'walk', 'the floor is a change of mind');
  assert.equal(secondExitClick({ ...same, transit: false }), 'walk', 'LOOK AT the door is not leaving by it');
  assert.equal(secondExitClick({ ...same, atOnce: false }), 'walk', 'a door that is a beat is walked to');
});

test('an ordinary way out leaves at once; a door with a beat in this state does not', () => {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  const steps = walkthrough.steps;
  playThrough(player, steps.slice(0, steps.findIndex((step) => step.id === 'C4.3') + 1) as never);
  // The Colonel's office with the drawer open (doc 121 N-1): the door has a line and keeps him.
  const door = state.room.exits.find((exit) => exit.transitScene?.some((rule) => rule.stays))!;
  assert.equal(state.leavesAtOnce(door, 'WALK_TO'), false, 'the door that will not have the drawer open would be cut to');
  assert.equal(state.leavesAtOnce(door, 'LOOK_AT'), false, 'looking at a door is not leaving by it');
  player.verb('stock_portrait_drawer', 'CLOSE');
  assert.equal(state.leavesAtOnce(door, 'WALK_TO'), true, 'the drawer is shut and the door is a door again');
  // And a thing that is not a way out never is.
  assert.equal(state.leavesAtOnce(state.findTarget('stock_portrait_drawer')!, 'WALK_TO'), false);
});

test('no way out in the game is cut while it holds its travel for a scene', () => {
  const state = new GameState(content, new MemoryStorage());
  for (const room of content.rooms.values()) {
    for (const exit of room.exits ?? []) {
      if (!exit.travelWhenTold) continue;
      assert.equal(state.leavesAtOnce(exit, 'WALK_TO'), false, `${room.id}/${exit.id} travels when told and would be cut to`);
    }
  }
});

test('the scene cuts by this rule and no other: it asks before it places him, and forgets the walk on any other click', async () => {
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const cut = scene.slice(scene.indexOf('A SECOND CLICK ON THE WAY OUT GOES AT ONCE'), scene.indexOf('THE SAME CLICK AGAIN HURRIES HIM'));
  assert.ok(cut.includes('secondExitClick(') && cut.includes('leavesAtOnce('), 'the cut does not ask the rule');
  assert.ok(cut.indexOf('secondExitClick(') < cut.indexOf('placeAt('), 'he is placed before the rule is asked');
  assert.ok(/this\.exitWalk = null;\s*(\/\/\s*)?$/.test(cut.trimEnd()), 'a click that does not cut leaves the walk remembered');
  assert.ok(cut.includes('this.exitWalk.room === this.state.roomId'), 'a walk remembered from another room could cut this one');
});
