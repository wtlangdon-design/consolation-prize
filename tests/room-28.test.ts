/**
 * ROOM 28, THE LAUNDRY, from the room's own fixtures
 * (content/fixtures/room-28.json). Doc 57 D3 and D4's second half.
 *
 * SHE_A1 option 1 (once Pratt is "told to") opens SHE_D1; its option 1 is
 * the terms -- D3. With the Reverend's money in hand, 1-prime reads the
 * Thursday ledger -- D4's half that is the laundry's, T_PRATT_TRAIL. SHE_D1
 * opens only while its business is open, so SHE_A1 -- pair 18 among it -- is
 * his opening again after (errata 99 D); in Act III, SHE_D1 again for the
 * loan. Every line asserted is read from the documents.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { AmbientFile } from '../engine/core/types.ts';

// PLAYS: D3

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const docs = (await Promise.all(['docs/04-dialogue-trees.md', 'docs/05-examine-layer.md', 'docs/10-examine-batch-3.md', 'docs/54-batch-c.md', 'docs/08-examine-batch-1.md', 'docs/09-examine-batch-2.md']
  .map((path) => readFile(resolve(ROOT, path), 'utf8')))).join('\n');

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
const hostOf = (state: GameState): AmbientFile => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  return npc;
};
const speaker = (state: GameState) => state.content.dialogue.get(hostOf(state).tree!)!.speaker!;
const shown = (state: GameState) => state.dialogue.presentOptions().map((one) => one.option.id);
const node = (state: GameState) => state.dialogue.positionSnapshot().node;

test('D3: who pays Pratt opens the paper, and the ledger costs a service', async () => {
  const state = await inState('r28-a');
  const s = speaker(state);
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(node(state), 'SHE_A1');
  state.dialogue.select(`${s}1`);
  assert.equal(state.flags.get('T_SHENG_HOLDS_PAPER'), true);
  assert.equal(node(state), 'SHE_D1', 'the paper opens');
  const terms = state.dialogue.select(`${s}1`);
  assert.ok(terms.say && docs.includes(terms.say));
  assert.ok(state.puzzleComplete('D3'));
  assert.equal(state.flags.get('T_SHENG_TASK'), true);
  assert.ok(!shown(state).includes(`${s}1a`), 'the ledger waits for the money');
});

test('D4, the laundry\'s half: the Reverend\'s money buys the ledger, and the root returns', async () => {
  const state = await inState('r28-b');
  const s = speaker(state);
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(node(state), 'SHE_D1', 'the paper is open while its business is');
  const read = state.dialogue.select(`${s}1a`);
  for (const line of [read.say, ...read.rest.map((one) => one.line)]) assert.ok(line && docs.includes(line), `"${line}" is written`);
  assert.ok(state.puzzleComplete('D4'));
  assert.equal(state.flags.get('T_PRATT_TRAIL'), true, 'the Company carries Claim Two at eleven thousand');
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(node(state), 'SHE_A1', 'his root again');
  assert.ok(shown(state).includes(`${s}6`), 'pair 18 is never lost');
});

test('the loan: in Act III the paper opens again, after the ledger, for two dollars and sixty cents', async () => {
  const state = await inState('r28-b');
  const s = speaker(state);
  state.dialogue.start(hostOf(state).tree!);
  state.dialogue.select(`${s}1a`);
  state.flags.set('T_NEED_TO_DIE', true);
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(node(state), 'SHE_D1');
  state.dialogue.select(`${s}2`);
  assert.ok(state.carried.includes('loan'), "SHENG'S LOAN");
  state.dialogue.start(hostOf(state).tree!);
  assert.equal(node(state), 'SHE_A1', 'and his root after');
});

test('four dollars: three different answers, then the third again', async () => {
  const state = await inState('r28-a');
  const s = speaker(state);
  const heard: string[] = [];
  for (let n = 0; n < 4; n += 1) {
    state.dialogue.start(hostOf(state).tree!);
    heard.push(state.dialogue.select(`${s}5`).say!);
  }
  for (const line of heard) assert.ok(docs.includes(line));
  assert.equal(new Set(heard.slice(0, 3)).size, 3);
  assert.equal(heard[3], heard[2]);
});

test('every subject answers LOOK and LISTEN from the documents, and doc 54 writes the hands-on verbs on him', async () => {
  const state = await inState('r28-a');
  for (const target of state.room.hotspots ?? []) {
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const said = state.interact(target, verb).say;
      assert.ok(said && docs.includes(said), `${target.id} ${verb}: "${said}" is written`);
    }
  }
  const people = state.room.peopleResponses?.[hostOf(state).id] ?? {};
  for (const verb of ['PICK_UP', 'PUSH', 'USE']) assert.ok(people[verb]?.[0]?.say && docs.includes(people[verb]![0]!.say!), verb);
});
