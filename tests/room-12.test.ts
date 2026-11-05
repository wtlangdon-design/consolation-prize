/**
 * ROOM 12, THE MERCANTILE: what the store hands over, played through the game
 * state from the room's own fixtures (content/fixtures/room-12.json).
 *
 * No puzzle is solved here (doc 02). The store issues THE PICKAXE, THE PICKLED
 * EGGS and DR. PURVIS'S TONIC on the hero's account (doc 54, errata 68 A, 75):
 * each first PICK UP gives its item once, and the jar and the pickaxes answer
 * their written "again" after. In Act III the credit ledger is ruled off.
 * Every line asserted here is read from the compiled content, never typed.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';

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
const target = (state: GameState, id: string): Interactable => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is in the room`);
  return found;
};
const rules = (state: GameState, id: string) => target(state, id).responses?.PICK_UP ?? [];
const count = (state: GameState, item: string) => state.carried.filter((one) => one === item).length;

for (const [hotspot, item] of [['pickaxes', 'pickaxe'], ['pickle_jar', 'eggs']] as const) {
  test(`${hotspot}: the first PICK UP puts ${item} on account, and the next is the written "again"`, async () => {
    const state = await inState('r12-a');
    const [again, first] = rules(state, hotspot);
    assert.ok(first?.grants?.includes(item) && again?.say, 'both lines are written');
    assert.equal(state.interact(target(state, hotspot), 'PICK_UP').say, first?.say);
    assert.equal(count(state, item), 1);
    assert.equal(state.interact(target(state, hotspot), 'PICK_UP').say, again?.say);
    assert.equal(count(state, item), 1, 'one is equipment');
    assert.ok(state.findTarget(hotspot), 'the shelf stays: one leaves, not the stock');
  });
}

test('the tonic goes on account once; asked again, nothing more is given', async () => {
  const state = await inState('r12-a');
  const tonic = target(state, 'dr_purvis_s_tonic');
  state.interact(tonic, 'PICK_UP');
  state.interact(tonic, 'PICK_UP');
  assert.equal(count(state, 'tonic'), 1);
});

test('Act III: the credit ledger is ruled off, by its act line', async () => {
  const state = await inState('r12-b');
  const ledger = target(state, 'credit_ledger');
  const act = ledger.responses?.LOOK_AT?.find((rule) => rule.when && 'ACT' in rule.when);
  assert.ok(act, 'the ledger has an act line');
  assert.equal(state.interact(ledger, 'LOOK_AT').say, act.say);
});

test('nobody is drawn in the store: the proprietor is in the back room', async () => {
  const state = await inState('r12-a');
  assert.equal([...state.content.ambient.values()].filter((one) => one.room === state.roomId).length, 0);
});
