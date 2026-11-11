/**
 * ROOM 17, THE CHURCH: its puzzles, played through the game state from the
 * room's own fixtures (content/fixtures/room-17.json).
 *
 * C3's third step (doc 57): the minister's root asks who speaks for the
 * deceased, and the letter answers it -- the memorial is booked and the letter
 * given back. E3's first step: his Act III node, the eulogy priced by the
 * adjective, settled at four words. On the funeral day he is up the hill. The
 * room's figure is found through his placement here, never by name. Every
 * line asserted here is read from content extracted from the documents.
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

// PLAYS: C3, E3

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
// HE STANDS HERE BY A PLACEMENT, with this room's own tree.
const placed = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.placements?.[state.roomId]?.tree);
  assert.ok(npc, 'the room places a character with a tree');
  return { npc, here: npc.placements![state.roomId]! };
};
const tree = (state: GameState) => placed(state).here.tree as string;
const opt = (state: GameState, suffix: string) => `${placed(state).npc.id}${suffix}`;
const shown = (state: GameState) => state.dialogue.presentOptions().map((one) => one.option.id);
const host = (state: GameState): Interactable => {
  const { npc, here } = placed(state);
  return { id: npc.id, name: npc.name, rect: [here.x - 40, here.y - 200, 80, 200], colour: 0, responses: {} } as Interactable;
};

test('C3: the funeral asked for, the letter answers who speaks for the deceased; it is given back', async () => {
  const state = await inState('r17-a');
  state.dialogue.start(tree(state));
  assert.equal(state.dialogue.positionSnapshot().node, 'SOW_A1');
  state.dialogue.select(opt(state, '5'));
  assert.ok(state.flags.get('T_SOW_FUNERAL_ASKED'));
  state.holdItem('letter');
  const out = state.interact(host(state), 'GIVE');
  const pair = state.content.combinations.pairs.find((one) => one.item === 'letter' && one.room === state.roomId);
  assert.equal(out.say, pair?.rules?.[0]?.say);
  assert.ok(state.flags.get('T_MEMORIAL_BOOKED'));
  assert.ok(state.carried.includes('letter'), 'he gives the letter back');
});

test('C3: no funeral to arrange before the funerals and the death are known', async () => {
  const state = await inState('r17-a');
  state.flags.set('T_FANSHAWE_FUNERALS', false);
  state.dialogue.start(tree(state));
  assert.ok(!shown(state).includes(opt(state, '5')));
});

test('another service waits for the memorial, and for C4 or D4 still to do', async () => {
  const state = await inState('r17-a');
  state.flags.set('T_MEMORIAL_BOOKED', true);
  state.dialogue.start(tree(state));
  assert.ok(shown(state).includes(opt(state, '7')));
  state.flags.set('T_QUEUE_PADDED', true);
  state.flags.set('T_PRATT_TRAIL', true);
  assert.ok(!shown(state).includes(opt(state, '7')), 'both done: no need of another');
});

test('E3 step 1: after the loophole he opens on the eulogy; adjectives cost, and four words settle it', async () => {
  const state = await inState('r17-b');
  state.dialogue.start(tree(state));
  assert.equal(state.dialogue.positionSnapshot().node, 'SOW_C1');
  state.dialogue.select(opt(state, '_c1'));
  assert.equal(state.flags.get('SOWERBY_ADJECTIVES'), 4);
  state.dialogue.select(opt(state, '_c3'));
  assert.ok(state.flags.get('T_SOWERBY_PRICE'));
  state.dialogue.start(tree(state));
  assert.equal(state.dialogue.positionSnapshot().node, 'SOW_A1', 'priced, he is himself again');
});

test('on the funeral day he is up the hill', async () => {
  const state = await inState('r17-a');
  const { here } = placed(state);
  assert.ok(state.flags.test(here.when));
  state.flags.set('T_FUNERAL_DAY', true);
  assert.ok(!state.flags.test(here.when));
});
