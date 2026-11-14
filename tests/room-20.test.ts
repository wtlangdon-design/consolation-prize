/**
 * ROOM 20, THE BACK ALLEY, played through the game state from the room's own
 * fixture (content/fixtures/room-20.json).
 *
 * Doc 20: "20 · Back alley | Main Street, east end". E6 begins here: doc 04's
 * HOB_E6, Hob "on his rounds at night" once Section nineteen is said aloud
 * (Tyler, 2026-11-05: the alley), gives THE EXECUTOR'S FORM, and doc 57 E6
 * takes it to the Registrar. A wrong verb on Hob is doc 54's Room 20 Overrides.
 * The cat is a figure on the top crate, and her lines -- doc 05's,
 * doc 09's, doc 54's and doc 49's PICK UP and TALK TO -- are THE CAT
 * hotspot's, which lies over her. Every line asserted is read from the
 * documents or the content extracted from them.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { AmbientLayer } from '../engine/core/Ambient.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';

// PLAYS: E6


const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc49 = await readFile(resolve(ROOT, 'docs/49-wrong-answers.md'), 'utf8');

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};

test('the alley opens off Lower Street, and leads back to it (errata 161)', async () => {
  const state = await inState('r20-a');
  const out = (state.room.exits ?? []).find((exit) => exit.to === 'lower_street');
  assert.ok(out, 'a way back to the street');
  const street = state.content.rooms.get('lower_street');
  assert.ok(street, 'the street is loaded');
  const lots = (street.exits ?? []).find((exit) => exit.to === state.roomId);
  assert.ok(lots, 'the street has a way into the alley');
  assert.ok((street.entrances ?? []).some((one) => one.from === state.roomId), 'and an arrival from it');
  assert.ok((state.room.entrances ?? []).some((one) => one.from === 'lower_street'), 'the alley has an arrival from the street');
});

test('the cat is a figure on the crates, and her written lines are under her', async () => {
  const state = await inState('r20-a');
  const figure = [...state.content.ambient.values()].find((one) => one.room === state.roomId);
  assert.ok(figure?.sprite, 'a figure, drawn, in the alley');
  assert.ok(!figure.tree, 'she does not talk');
  const under = state.targetAt(figure.x, figure.y - 10);
  assert.ok(under, 'a hotspot lies over her');
  for (const verb of ['PICK_UP', 'TALK_TO']) {
    const said = state.interact(under, verb);
    assert.ok(said.say && doc49.includes(said.say), `${verb}: doc 49's line`);
  }
});

const registrarIn = (state: GameState) => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree);
  assert.ok(npc, 'the Registrar is at his counter');
  return { id: npc.id, name: npc.name, rect: [npc.x - 40, npc.y - 200, 80, 200], colour: 0, responses: {} } as Interactable;
};
const caseOf = (state: GameState, label: string) => {
  const pair = state.content.combinations.pairs.find((one) => one.item === 'executor_form' && one.room === state.roomId);
  const rule = pair?.rules?.find((one) => one.case === label);
  assert.ok(rule, `a case "${label}"`);
  return rule;
};

test('E6: Hob on his rounds gives the form; the Registrar takes it once the death is recorded', async () => {
  const state = await inState('r20-b');
  const hob = [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.tree
    && state.flags.test(one.when));
  assert.ok(hob?.tree, 'Hob is on his rounds in the alley, with his tree');
  state.dialogue.start(hob.tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'HOB_E6', 'the executor, once Section nineteen is said aloud');
  const first = state.dialogue.presentOptions().find((one) => one.option.gives?.length);
  assert.ok(first, 'one option gives the form');
  state.dialogue.select(first.option.id);
  const form = first.option.gives![0]!;
  assert.ok(state.carried.includes(form), 'THE EXECUTOR\'S FORM, signed');
  state.dialogue.end();

  state.enterRoom('claims_registrar');
  const registrar = registrarIn(state);
  state.holdItem(null);
  state.holdItem(form);
  state.flags.set('T_DECEASED', false);
  assert.equal(state.interact(registrar, 'GIVE').say, caseOf(state, 'before T_DECEASED').say, 'not yet an estate');
  assert.ok(!state.puzzleComplete('E6'));
  state.flags.set('T_DECEASED', true);
  state.holdItem(null);
  state.holdItem(form);
  const named = state.interact(registrar, 'GIVE');
  const rule = caseOf(state, 'with T_DECEASED');
  assert.equal(named.say, rule.say);
  assert.deepEqual(named.then, rule.then, 'the read-back, whole');
  assert.ok(state.puzzleComplete('E6'));
  assert.ok(state.carried.includes(form), 'handed back, never consumed');

  state.enterRoom('back_alley');
  assert.ok(!state.flags.test(hob.when), 'his rounds here are done with');
});

test('a wrong verb on Hob in the alley is doc 54\'s line for it', async () => {
  const state = await inState('r20-b');
  const doc54 = await readFile(resolve(ROOT, 'docs/54-batch-c.md'), 'utf8');
  const lines = state.room.peopleResponses?.hob;
  assert.ok(lines, 'his refusals are the room\'s');
  for (const verb of ['PICK_UP', 'PUSH', 'USE']) {
    const said: string | undefined = lines[verb]?.[0]?.say;
    assert.ok(said && doc54.includes(`"${said}"`), `${verb}: doc 54's line`);
  }
});

test('errata 101 A: from the first night through Act II, Hob is on his rounds here and opens on HOB_A1', async () => {
  // Found by the continuous playthrough: he was placed only from Act III, so
  // HOB_A1 -- doc 04's "Option 3 is the whole game" -- could never be reached.
  const content = await loadContent(fsReader);
  const alley = (await inState('r20-a')).roomId;
  const state = new GameState(content, new MemoryStorage());
  // Errata 310: Hob is asked about Mott once the map seller has said who Mott was.
  state.flags.set('T_MOTT_TOLD', true);
  state.enterRoom(alley);
  const layer = new AmbientLayer(state);
  // THE ALLEY'S OWN CONVERSATION, not a passer-by's: since errata 115 the dog's
  // owner stands here too, and doc 07's townspeople talk in micro-trees
  // (`amb_*`), never in a doc 04 tree. Asking for "the first with a tree" found
  // him instead.
  const host = () => {
    layer.arrived();
    return layer.present.find((one) => one.tree && !one.tree.startsWith('amb_'));
  };
  const npc = host();
  assert.ok(npc?.tree, 'Act I: a person with a conversation is in the alley');
  const tree = content.dialogue.get(npc.tree)!;
  state.dialogue.start(npc.tree);
  assert.equal(state.dialogue.positionSnapshot().node, tree.start, 'his conversation opens on the start node, HOB_A1');

  // Option 3 is doc 04's pause: he stops, says one word, and stands. Since errata 310 (no parentheticals) the stop
  // and the standing are the same "…" every pause is, and nothing is printed.
  const three = state.dialogue.select(`${tree.speaker}3`);
  const spoken = [{ line: three.say, direction: three.direction }, ...three.rest];
  assert.equal(spoken.filter((one) => one.line === '…').length, 2, 'the stop and the standing are pauses');
  assert.ok(!spoken.some((one) => one.direction), 'nothing is printed');
  assert.ok(spoken.some((one) => one.line === 'No.'), 'and the one word is said');
  // Option 6 teaches pair 21 quietly: doc 04's tag, a flag, and nothing else.
  const six = tree.nodes[tree.start]!.options.find((one) => one.id === `${tree.speaker}6`)!;
  assert.equal(six.tag, 'ASSAY');
  assert.equal(six.puzzle, undefined, 'it records no progress');
  state.dialogue.select(six.id);
  for (const flag of Object.keys(six.set ?? {})) assert.equal(state.flags.get(flag), true, `${flag} is learned`);
  assert.ok(Object.keys(six.set ?? {}).some((flag) => flag.startsWith('ASSAY_PAIR_')), 'a pair');
  state.dialogue.end();

  state.flags.set('ACT', 2);
  assert.equal(host()?.id, npc.id, 'Act II: still on his rounds');
  state.flags.set('ACT', 3);
  assert.equal(host(), undefined, 'Act III: gone until Section nineteen is said aloud');
  state.flags.set('T_EXECUTOR_RULE', true);
  assert.equal(host()?.id, npc.id, 'back for the executor');
  state.dialogue.start(npc.tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'HOB_E6');
  state.dialogue.end();
  state.flags.set('T_EXECUTOR_NAMED', true);
  assert.equal(host(), undefined, 'and gone once E6 is done');
});
