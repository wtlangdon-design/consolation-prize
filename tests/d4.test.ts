import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: D4

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');

/**
 * D4'S FIRST HALF, THE PLATE AT THE GATE. Doc 57 D4: "On the funeral day he has
 * a full plate, at the foot of Boot Hill" -- the exchange, then THE LINEN MONEY.
 * Doc 57 C3: "If T_SHENG_TASK is set and D4 is not done, Sowerby is at the gate
 * with the plate. Then T_FUNERAL_DAY clears ... and Sowerby is back in his
 * church." The laundry half is tests/room-28.test.ts.
 */
const setup = async (task: boolean) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r14-a')!));
  const hill = state.roomId;
  const away = state.room.exits[0]!.to;
  state.enterRoom(away);
  state.flags.set('T_FUNERAL_DAY', true);
  state.flags.set('T_SHENG_TASK', task);
  return { content, state, hill, away };
};
const atGate = (state: GameState) => [...state.content.ambient.values()]
  .filter((npc) => npc.room === state.roomId && npc.when !== undefined && state.flags.test(npc.when));

test('on the funeral day with Sheng\'s task open, the Reverend is at the gate and the exchange is doc 57\'s', async () => {
  const { state, hill } = await setup(true);
  state.enterRoom(hill);
  const scene = state.room.onEnter!.scenes![0]!;
  assert.equal(state.flags.test(scene.when), true);
  assert.equal(atGate(state).length, 1, 'one figure at the gate');
  for (const line of scene.lines) assert.ok(doc57.includes(line.line), `"${line.line}" is doc 57's`);
  state.afterArrival(scene.after!);
  for (const item of scene.after!.gives!) assert.ok(state.carried.includes(item), 'THE LINEN MONEY');
  assert.equal(state.flags.test(scene.when), false, 'once');
  assert.equal(atGate(state).length, 1, 'he stays for the visit');
});

test('without the task he is not at the gate; and the next visit he is back in his church', async () => {
  const { state, hill, away } = await setup(false);
  state.enterRoom(hill);
  assert.equal(atGate(state).length, 0);
  const second = await setup(true);
  second.state.enterRoom(second.hill);
  second.state.flags.set('T_FUNERAL_DAY', false); // the day's line clears it as he arrives
  second.state.enterRoom(second.away);
  second.state.enterRoom(second.hill);
  assert.equal(atGate(second.state).length, 0, 'gone the next time');
  void away;
});
