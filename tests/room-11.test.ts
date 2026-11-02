/**
 * ROOM 11, FANSHAWE'S OFFICE: its puzzles, played through the game state from
 * the room's own fixtures (content/fixtures/room-11.json).
 *
 * A4's map from FAN_A1; A10, the dinner (doc 48 S1, doc 57) -- the laid table,
 * FAN_A2's one option that does not sell, the handkerchief, and beat 4 at the
 * door that turns the act; C4 on the funeral day, the office empty; E0b, the
 * offer and Clause 9, which turns the act again. Every line asserted here is
 * read from content extracted from the documents, never typed into this file.
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

// PLAYS: A10, C4, E0b

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
// THE ROOM'S ONE CHARACTER WITH A TREE, found by what the content says, so no
// name of the fiction is written in code.
const hostOf = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc?.tree, 'the room has a character with a tree');
  return npc;
};
const opt = (state: GameState, suffix: string) => `${hostOf(state).id}${suffix}`;
const optionOf = (state: GameState, node: string, suffix: string) => {
  const tree = state.content.dialogue.get(hostOf(state).tree as string);
  const option = tree?.nodes[node]?.options.find((one) => one.id === opt(state, suffix));
  assert.ok(option, `${node} has option ${suffix}`);
  return option;
};
const target = (state: GameState, id: string): Interactable => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is in the room`);
  return found;
};
const shownProps = (state: GameState) => (state.room.props ?? [])
  .filter((prop) => state.flags.test(prop.when)).map((prop) => prop.id);
const present = (state: GameState) => state.flags.test(hostOf(state).when);
const lineOf = (rule: { say?: string } | undefined) => rule?.say;

test('A4: after the swindle he opens on FAN_A1, and either answer about the claim gives the map', async () => {
  for (const choice of ['1', '2']) {
    const state = await inState('r11-a');
    state.dialogue.start(hostOf(state).tree as string);
    assert.equal(state.dialogue.positionSnapshot().node, 'FAN_A1');
    assert.ok(!state.carried.includes('company_map'));
    state.dialogue.select(opt(state, choice));
    assert.ok(state.carried.includes('company_map'), `option ${choice}: there is no way to withhold it`);
  }
});

test('A10: holding the invitation, the table is laid and the dinner opens; option 6 ends it with the handkerchief', async () => {
  const state = await inState('r11-b');
  assert.deepEqual(shownProps(state), ['dinner'], 'the table laid absurdly well');
  assert.ok(state.findTarget('handkerchief'), 'his handkerchief is on the desk');
  const accost = state.room.onEnter?.accost;
  assert.ok(accost?.whenAny?.some((when) => state.flags.test(when)), 'he opens on him as he comes in');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'FAN_A2');
  // The five that sell it are retained and change nothing.
  const before = [...state.carried];
  for (const suffix of ['1', '2', '3', '4', '5', '7']) state.dialogue.select(opt(state, suffix));
  assert.deepEqual(state.carried, before);
  assert.ok(!state.puzzleComplete('A10'));
  state.dialogue.select(opt(state, '6'));
  assert.ok(state.puzzleComplete('A10'));
  assert.ok(state.flags.get('T_DINED'));
  assert.ok(state.carried.includes('handkerchief'), 'pocketed, absently');
  assert.ok(!state.dialogue.isActive, 'the dinner is over');
  assert.deepEqual(shownProps(state), ['desk_bare'], 'the table cleared, and his handkerchief gone from it');
  assert.equal(state.findTarget('handkerchief'), undefined, 'not drawn from now on');
});

test('A10: leaving the table early is his line, and the dinner waits for the next entry', async () => {
  const state = await inState('r11-b');
  const leave = optionOf(state, 'FAN_A2', 'x');
  assert.equal(leave.tag, 'EXIT');
  assert.ok(leave.say, 'doc 57 writes what he says');
  state.dialogue.start(hostOf(state).tree as string);
  state.dialogue.select(opt(state, 'x'));
  assert.ok(!state.flags.get('T_DINED'));
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'FAN_A2', 'the table will keep');
});

test('A10 beat 4: the first way out after the dinner is the porch -- his two lines, then ACT 2 and its card', async () => {
  const state = await inState('r11-b');
  state.dialogue.start(hostOf(state).tree as string);
  state.dialogue.select(opt(state, '6'));
  const door = target(state, 'to_lobby') as Interactable & { transitScene?: { say?: string; then?: unknown[] }[] };
  const scene = door.transitScene?.[0];
  assert.ok(scene?.say && scene.then?.length, 'doc 57 writes beat 4');
  const out = state.interact(door, 'WALK_TO');
  assert.equal(out.say, scene.say);
  assert.deepEqual(out.then, scene.then);
  assert.equal(out.goesTo, 'company_lobby', 'the room changes once the lines are read');
  assert.equal(state.flags.get('ACT'), 2);
  assert.ok(state.content.actCards.get(2), 'PART TWO has its card');
  // And never again.
  state.enterRoom('fanshawe_office');
  const again = state.interact(target(state, 'to_lobby'), 'WALK_TO');
  assert.equal(again.say, null);
});

test('C4: on the funeral day he is up the hill; the log and the drawer give up what they hold, once', async () => {
  const state = await inState('r11-c');
  assert.ok(!present(state), 'the office is drawn without him');
  assert.ok(state.room.onEnter?.say?.length && state.flags.test(state.room.onEnter.sayWhen), 'the empty office is remarked on');
  const log = target(state, 'submission_log');
  const took = state.interact(log, 'PICK_UP');
  assert.equal(took.say, lineOf(log.responses?.PICK_UP?.[0]));
  assert.ok(state.carried.includes('padded_log'));
  assert.ok(state.flags.get('T_QUEUE_PADDED'));
  const drawer = target(state, 'stock_portrait_drawer');
  state.interact(drawer, 'OPEN');
  assert.ok(state.carried.includes('photograph'));
  assert.ok(state.puzzleComplete('C4'));
  state.interact(drawer, 'OPEN');
  assert.equal(state.carried.filter((item) => item === 'photograph').length, 1, 'forty of him, but one is enough');
});

test('C4: with him in the room, neither the log nor the drawer can be taken', async () => {
  const state = await inState('r11-b');
  assert.ok(present(state));
  const said = state.interact(target(state, 'submission_log'), 'PICK_UP');
  const drawer = state.interact(target(state, 'stock_portrait_drawer'), 'OPEN');
  assert.equal(said.say, drawer.say, 'one refusal for both');
  assert.ok(!state.carried.includes('padded_log'));
  assert.ok(!state.carried.includes('photograph'));
});

test('E0b: after E0 he opens on the offer; reading the contract is Clause 9, the aside, and ACT 3', async () => {
  const state = await inState('r11-d');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'FAN_C1');
  // "Yes" never sells: the pen has no ink.
  state.dialogue.select(opt(state, '2'));
  assert.ok(state.carried.includes('deed'), 'he will never actually let the claim be sold');
  state.dialogue.select(opt(state, '1'));
  assert.ok(state.flags.get('T_EXCAVATION_CLAUSE'));
  assert.ok(state.puzzleComplete('E0b'));
  assert.equal(state.flags.get('ACT'), 3);
  assert.ok(state.content.actCards.get(3), 'PART THREE has its card');
  const aside = optionOf(state, 'FAN_C1', '1').exchange?.at(-1);
  assert.equal(aside?.speaker, state.content.actor.id, 'the turn is the hero\'s aside');
});
