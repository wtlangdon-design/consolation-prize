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
import { HeadlessPlayer } from './lib/headless-player.ts';

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

/**
 * ENDS THE DINNER THE WAY THE CONTENT SAYS IT ENDS (tuned 2026-11-10, proofs/check-friction.json). This test named the
 * act that ends the dinner and so was rewritten each time the design moved it. It now finds the rule that completes A10
 * in the room and does what that rule asks, first doing whatever act writes a flag the rule waits on.
 */
function endTheDinner(state: GameState): void {
  type Rule = { when?: Record<string, unknown>; set?: Record<string, unknown>; completes?: string };
  const sites = (): { target: Interactable; verb: string; rule: Rule }[] => state.room.hotspots.flatMap((one) =>
    Object.entries((one.responses ?? {}) as Record<string, Rule[]>).flatMap(([verb, rules]) => rules.map((rule) => ({ target: one, verb, rule }))));
  for (let step = 0; step < 4 && !state.puzzleComplete('A10'); step += 1) {
    const end = sites().find((site) => site.rule.completes === 'A10')!;
    assert.ok(end, 'something on the table ends the dinner');
    if (state.findTarget(end.target.id) && state.flags.test(end.rule.when as never)) { state.interact(end.target, end.verb); continue; }
    // What the ending waits on: its own condition and the condition of the thing it is done to.
    const waits = { ...((end.target as { when?: Record<string, unknown> }).when ?? {}), ...(end.rule.when ?? {}) };
    const opener = sites().find((site) => state.findTarget(site.target.id) && state.flags.test(site.rule.when as never)
      && Object.entries(site.rule.set ?? {}).some(([flag, value]) => waits[flag] === value && state.flags.get(flag) !== value));
    assert.ok(opener, 'nothing he can reach leads to the act that ends the dinner');
    state.interact(opener.target, opener.verb);
  }
}
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

test('A10: holding the invitation, the table is laid and the dinner opens; nothing said ends it, and the cover put back does', async () => {
  const state = await inState('r11-b');
  assert.deepEqual(shownProps(state), ['dinner', 'dinner_drape'], 'the table laid absurdly well, its cloth to the floor');
  // Errata 248 (doc 120 I-1): the table stands over the desk for the dinner, so the desk's own things are not
  // pointed at, and the table's are.
  assert.equal(state.findTarget('handkerchief'), undefined, 'his handkerchief is under the table for now');
  assert.ok(state.findTarget('covered_dish') && state.findTarget('my_glass') && state.findTarget('bottle'), 'the table can be tried');
  const accost = state.room.onEnter?.accost;
  assert.ok(accost?.whenAny?.some((when) => state.flags.test(when)), 'he opens on him as he comes in');
  state.dialogue.start(hostOf(state).tree as string);
  assert.equal(state.dialogue.positionSnapshot().node, 'FAN_A2');
  // STAGED (doc 04 FAN_A2, Tyler 2026-11-05): it opens on two pitches and the
  // wine; each deferred pitch brings the next, and the honest answer arrives
  // once two pitches have been deferred.
  const shown = () => state.dialogue.presentOptions().map((one) => one.option.id);
  assert.deepEqual(shown(), ['1', '2', '7', 'x'].map((suffix) => opt(state, suffix)), 'the dinner opens short');
  state.dialogue.select(opt(state, '1'));
  assert.ok(shown().includes(opt(state, '3')) && !shown().includes(opt(state, '6')), 'the first pitch brings the next, not the answer');
  state.dialogue.select(opt(state, '2'));
  assert.ok(shown().includes(opt(state, '4')) && shown().includes(opt(state, '6')), 'two deferred pitches bring the honest answer');
  // Everything he can say is said, the honest answer among them, and it changes nothing.
  const before = [...state.carried];
  for (const suffix of ['1', '2', '3', '4', '5', '7', '6', '6']) state.dialogue.select(opt(state, suffix));
  assert.deepEqual(state.carried, before);
  assert.ok(!state.puzzleComplete('A10') && !state.flags.get('T_DINED'), 'said, agreed with, and the dish is still there');
  state.dialogue.select(opt(state, 'x'));
  assert.ok(!state.dialogue.isActive);
  // The dinner is ended by hand: the cover lifted, the contract found, the cover put back.
  endTheDinner(state);
  assert.ok(state.puzzleComplete('A10'));
  assert.ok(state.flags.get('T_DINED'));
  assert.ok(state.carried.includes('handkerchief'), 'pocketed, absently');
  assert.ok(!state.carried.includes('invitation'), 'and the invitation left on the table');
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
  // Errata 248: the dinner is ended at the table (the cover put back over the contract), not by a line.
  endTheDinner(state);
  const door = target(state, 'to_lobby') as Interactable & { transitScene?: { when?: Record<string, unknown>; say?: string; then?: unknown[] }[] };
  // The door's first beat is the Colonel's line for leaving the table early; beat 4 is the one that holds now.
  const scene = door.transitScene?.find((rule) => state.flags.test(rule.when as never));
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
  // Errata 242 (doc 113, A): not bare. A ledger off the shelf goes where the log lay.
  const log = target(state, 'submission_log');
  const refused = state.interact(log, 'PICK_UP');
  assert.equal(refused.say, lineOf(log.responses?.PICK_UP?.[0]));
  assert.ok(!state.carried.includes('padded_log'), 'he will not leave a bare desk');
  state.interact(target(state, 'ledgers'), 'PICK_UP');
  assert.ok(state.carried.includes('company_ledger'));
  state.interact(target(state, 'ledgers'), 'PICK_UP');
  assert.equal(state.carried.filter((item) => item === 'company_ledger').length, 1, 'the shelf gives one');
  // Errata 244 (doc 115, II-3): not until the ledger is ready -- its gilt date off, its spine broken in.
  const player = new HeadlessPlayer(state);
  player.use('company_ledger', 'submission_log');
  assert.ok(!state.carried.includes('padded_log'), 'a ledger with a date on it and a whole spine will not pass');
  player.use('handkerchief', 'company_ledger');
  assert.ok(state.flags.get('T_LEDGER_PLAIN'));
  player.use('company_ledger', 'submission_log');
  assert.ok(!state.carried.includes('padded_log'), 'nor with the spine whole');
  player.use('company_ledger', 'chairs');
  assert.ok(state.flags.get('T_LEDGER_CRACKED'));
  player.use('company_ledger', 'submission_log');
  assert.ok(state.carried.includes('padded_log'));
  assert.ok(!state.carried.includes('company_ledger'), 'the ledger stays on the desk');
  assert.ok(state.flags.get('T_QUEUE_PADDED'));
  assert.ok(!state.findTarget('submission_log') && state.findTarget('ledger_on_the_desk'), 'the book on the desk is the double now');
  const drawer = target(state, 'stock_portrait_drawer');
  state.interact(drawer, 'OPEN');
  assert.ok(state.carried.includes('photograph'));
  assert.ok(state.puzzleComplete('C4'));
  state.interact(drawer, 'OPEN');
  assert.equal(state.carried.filter((item) => item === 'photograph').length, 1, 'forty of him, but one is enough');
  assert.ok(state.findTarget('stock_portrait_drawer'), 'the drawer is still the sideboard\'s: one photograph leaves, not the drawer');
});

test('C4: with him in the room, neither the log nor the drawer can be taken', async () => {
  const state = await inState('r11-b');
  // Errata 248: for the dinner the table stands over the desk and the log is not pointed at. With him in the room
  // on any other day it is, so the dinner is over here.
  state.flags.set('T_DINED', true);
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
