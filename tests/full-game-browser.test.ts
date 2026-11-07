/**
 * WHAT THE BROWSER FULL-GAME RUN FOUND (tools/gauntlet/full-game.mjs, errata
 * 151), each held here so it cannot come back. The run plays
 * tests/data/full-game-walkthrough.json through the real game by real input;
 * every break it found that was the game's or the tools', and not Tyler's,
 * carries its lesson in this file. Rooms and people are found from the data:
 * no fiction is named here.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
// @ts-expect-error -- a plain .mjs module with no declarations.
import { targetRect } from '../tools/gauntlet/route.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const centre = (rect: readonly number[]) => [rect[0]! + rect[2]! / 2, rect[1]! + rect[3]! / 2] as const;

/** A written pair on a target, found from the data. */
const pairOn = (target: string) => {
  const pair = (content.combinations?.pairs ?? []).find((one) => one.target === target);
  assert.ok(pair, `some item has a pair with ${target}`);
  return pair;
};

test('a held item goes where the sentence line says: the fork on the saloon piano, not the fiddler in front of it (A8)', () => {
  const pair = pairOn('piano');
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('w1-piano')!));
  state.enterRoom(pair.room);
  const ambient = new AmbientLayer(state);
  const piano = state.findTarget('piano');
  assert.ok(piano, 'the piano is a target in its room');
  const [x, y] = centre(piano.rect);
  // The defect's shape: a talking figure's box over the piano's centre.
  assert.ok(ambient.npcAt(x, y)?.tree, 'a figure with a tree stands over the piano, which is why this could break');
  assert.equal(ambient.personAt(x, y, 'USE'), undefined, 'the sentence line names THE PIANO there');
  assert.equal(ambient.itemTakerAt(x, y, 'USE', pair.item), undefined,
    'and the click uses the fork on the piano, not on the figure in front of it');
});

test('a held item with a written pair still goes to its person, whatever scenery stands behind (A9, C5)', () => {
  let checked = 0;
  for (const pair of content.combinations?.pairs ?? []) {
    const person = content.ambient.get(pair.target);
    if (!person) continue;
    const state = new GameState(content, new MemoryStorage());
    state.enterRoom(pair.room);
    const ambient = new AmbientLayer(state);
    const here = ambient.present.find((npc) => npc.id === person.id);
    if (!here) continue;
    const [hx, hy, hw, hh] = ambient.hitBox(here);
    // Every point of the person's box: whatever scenery is behind, the item is for them.
    for (const fy of [0.2, 0.5, 0.8]) {
      for (const fx of [0.2, 0.5, 0.8]) {
        const x = hx + hw * fx;
        const y = hy + hh * fy;
        if (ambient.npcAt(x, y)?.id !== person.id) continue;
        assert.equal(ambient.itemTakerAt(x, y, 'USE', pair.item)?.id, person.id, `${pair.item} goes to ${person.id} at ${x},${y}`);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 0, 'some pair names a person present on a fresh arrival');
});

test('the scene asks the shared rule, for the pointer and for the click', async () => {
  const scene = await readFile(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  assert.match(scene, /this\.ambient\.itemTakerAt\(/, 'the held-item click goes through AmbientLayer.itemTakerAt');
  assert.match(scene, /return this\.ambient\.personAt\(/, 'the hover and the click name a person by AmbientLayer.personAt');
});

test('a route aims at a person where the room places them, not where their file does (the watchman at home)', () => {
  let checked = 0;
  for (const room of content.rooms.values()) {
    for (const id of room.ambient ?? []) {
      const npc = content.ambient.get(id);
      const placed = npc?.placements?.[room.id];
      if (!npc || !placed) continue;
      const [x, , w] = targetRect(room, id) as number[];
      assert.equal(x! + w! / 2, placed.x, `${id} in ${room.id} is aimed at its placement`);
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'some character is placed per room');
});
