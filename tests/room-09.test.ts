/**
 * ROOM 9, THE CLARION OFFICE: B1, E5 and the running gag, played through the
 * game state from the room's fixtures (content/fixtures/room-09.json).
 * Every line asserted here is read from extracted content.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: B1, E5

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
// The room's editor, found by what content says: the one character here with a tree.
const editorOf = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  return npc;
};
const opt = (state: GameState, n: string) => `${editorOf(state).id}${n}`;

test('B1: the trade -- either story pays with where Vessel went', async () => {
  for (const story of ['1', '2']) {
    const state = await inState('r9-a');
    state.dialogue.start(editorOf(state).tree as string);
    const opening = state.dialogue.positionSnapshot().node;
    state.dialogue.select(opt(state, '1'));
    assert.notEqual(state.dialogue.positionSnapshot().node, opening, 'option 1 opens the trade');
    state.dialogue.select(opt(state, story));
    assert.ok(state.puzzleComplete('B1'), `story ${story} pays`);
    assert.ok(state.flags.get('T_VESSEL_LOCATION'));
  }
});

test('E5: recorded deceased, he opens on the obituary, and option 1 hands it over', async () => {
  const state = await inState('r9-b');
  const tree = editorOf(state).tree as string;
  state.dialogue.start(tree);
  const node = state.dialogue.positionSnapshot().node;
  assert.equal(node, state.content.fixtures.get('r9-b')?.expect?.opensOn);
  const option = state.content.dialogue.get(tree)?.nodes[node]?.options.find((one) => one.gives?.length);
  assert.ok(option, 'an option in this node gives an item');
  assert.ok(!state.carried.includes(option.gives![0]!));
  state.dialogue.select(option.id);
  assert.ok(state.carried.includes(option.gives![0]!), 'the obituary is his');
  assert.ok(state.puzzleComplete('E5'));
});

test('the headline board carries the latest edition once, then its ordinary lines, and counts it', async () => {
  const state = await inState('r9-a');
  const board = state.content.rooms.get(state.roomId)?.hotspots.find((one) => one.responses?.LOOK_AT?.some((rule) => rule.afterPuzzles?.length));
  assert.ok(board, 'a board carries editions');
  const target = state.findTarget(board.id)!;
  const editions = board.responses!.LOOK_AT!.filter((rule) => rule.afterPuzzles?.length);
  const latest = editions.find((rule) => rule.afterPuzzles!.every((puzzle) => state.puzzleComplete(puzzle)));
  assert.ok(latest, 'an edition is due');
  const counter = Object.keys(latest.add ?? {})[0]!;
  assert.equal(state.interact(target, 'LOOK_AT').say, latest.say);
  assert.equal(state.flags.getNumber(counter), 1);
  const ordinary = state.interact(target, 'LOOK_AT').say;
  assert.ok(!editions.some((rule) => rule.say === ordinary), 'the ordinary lines resume');
  assert.equal(state.flags.getNumber(counter), 1, 'counted once');
});
