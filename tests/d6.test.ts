import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: D6

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');

/**
 * D6, THE ATTESTATION. Doc 57: "PRA_D6 option 5; the next time he enters the
 * Registrar's, Pratt is at the counter" -- the exchange, then THE ATTESTATION
 * and D6. The scene plays on arrival (onEnter.sayLines, read from doc 57);
 * what it does lands when its last line is read (onEnter.sayAfter), which is
 * when the figure at the counter walks out.
 */
const setup = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r7-c')!));
  const registrar = state.roomId;
  const outside = state.room.exits[0]!.to;
  return { content, state, registrar, outside };
};
/** Who is drawn in the room now: its figures whose condition holds (engine/core/Ambient.ts). */
const present = (state: GameState) => [...state.content.ambient.values()]
  .filter((npc) => npc.room === state.roomId && state.flags.test(npc.when)).map((npc) => npc.id);
/** The scene's visitor: the speaker whose figure is in the room only on a condition. */
const visitorOf = (content: Awaited<ReturnType<typeof loadContent>>, state: GameState) => state.room.onEnter!.scenes![0]!.lines
  .map((line) => line.speaker).find((id) => content.ambient.get(id)?.when !== undefined)!;

test('no attestation before he has sworn: nobody extra at the counter, nothing on arrival', async () => {
  const { content, state, registrar, outside } = await setup();
  const scene = state.room.onEnter!.scenes![0]!;
  state.enterRoom(outside);
  state.enterRoom(registrar);
  assert.equal(state.flags.test(scene.when), false);
  const visitor = visitorOf(content, state);
  assert.ok(visitor, 'the scene has a visitor');
  assert.ok(!present(state).includes(visitor), 'not at the counter yet');
});

test('once he has sworn, the next arrival is the attestation, every line doc 57\'s', async () => {
  const { state, registrar, outside } = await setup();
  state.flags.set('T_PRATT_SWEARS', true);
  state.enterRoom(outside);
  state.enterRoom(registrar);
  const scene = state.room.onEnter!.scenes![0]!;
  assert.equal(state.flags.test(scene.when), true, 'the scene plays');
  const speakers = new Set(scene.lines.map((line) => line.speaker));
  for (const who of speakers) if (who !== state.content.actor.id) assert.ok(present(state).includes(who), `${who} is in the room to say it`);
  for (const line of scene.lines) assert.ok(doc57.includes(line.line), `"${line.line}" is doc 57's`);
});

test('the scene\'s outcome: THE ATTESTATION, D6, and the man at the counter goes', async () => {
  const { content, state, registrar, outside } = await setup();
  state.flags.set('T_PRATT_SWEARS', true);
  state.enterRoom(outside);
  state.enterRoom(registrar);
  const scene = state.room.onEnter!.scenes![0]!;
  const visitor = visitorOf(content, state);
  assert.ok(present(state).includes(visitor), 'at the counter while it plays');
  state.afterArrival(scene.after!);
  assert.ok(!present(state).includes(visitor), 'gone once it is read (he walks out)');
  assert.equal(state.puzzleComplete('D6'), true);
  for (const item of scene.after!.gives!) assert.ok(state.carried.includes(item));
  assert.equal(state.flags.test(scene.when), false, 'and it does not play again');
});
