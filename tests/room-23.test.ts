/**
 * ROOMS 23/24, THE CLAIM AND ITS HOLE: A5 and F1, played through the game
 * state from the room's own fixtures (content/fixtures/room-23.json).
 *
 * Doc 54 A5 (errata 68 A): the naming (doc 04 RAC_A1, on the first TALK TO);
 * the bait (three more arrive, walking in; the eggs are spent; gone the next
 * time he enters); the smoke (every verb on the hole and the raccoon refuses
 * until he leaves and returns); the blanket (the hole goes cold, the raccoon
 * walks off, the blanket comes back). Doc 57 A4: the claim is on the map only
 * while he holds the map. Doc 57 F1, Act IV: the draught, and the pickaxe.
 * Every line asserted is read from the documents.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { AmbientLayer } from '../engine/core/Ambient.ts';
import type { Interactable } from '../engine/core/types.ts';

// PLAYS: A4, A5, F1

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc54 = await readFile(resolve(ROOT, 'docs/54-batch-c.md'), 'utf8');
const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
/** The room's id, read from its fixture rather than written here. */
const ROOM = (JSON.parse(await readFile(resolve(ROOT, 'content/fixtures/room-23.json'), 'utf8')) as { fixtures: { room: string }[] }).fixtures[0]!.room;
const doc04 = await readFile(resolve(ROOT, 'docs/04-dialogue-trees.md'), 'utf8');

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
  assert.ok(found, `${id} is here`);
  return found;
};
const useOn = (state: GameState, item: string, id: string) => {
  state.holdItem(null);
  state.holdItem(item);
  return state.interact(target(state, id), 'USE');
};

test('A5, the naming: the first TALK TO opens RAC_A1, and he answers to his name after', async () => {
  const state = await inState('r23-a');
  const raccoon = target(state, 'raccoon');
  assert.ok(state.interact(raccoon, 'TALK_TO').enteredDialogue, 'his naming');
  const naming = state.dialogue.presentOptions().find((one) => (one.option as { displayName?: string }).displayName);
  assert.ok(naming);
  state.dialogue.select(naming.option.id);
  assert.equal(state.flags.get('T_RACCOON_NAMED'), true);
  const shown = (naming.option as { displayName?: string }).displayName!;
  assert.ok(doc04.includes(`display name ${shown}`));
  assert.equal(state.nameOf(raccoon), shown, 'he is called by it');
  const again = state.interact(raccoon, 'TALK_TO');
  assert.ok(!again.enteredDialogue && again.say && doc57.includes(`"${again.say}"`), 'doc 57\'s named line');
});

test('A5, the bait: three more walk in; the eggs are spent; gone when he comes back', async () => {
  const state = await inState('r23-a');
  const layer = new AmbientLayer(state);
  layer.arrived();
  layer.noteDepartures(0);
  const said = useOn(state, 'eggs', 'hole');
  assert.ok(said.say && doc54.includes(`"${said.say}"`));
  assert.ok(!state.carried.includes('eggs'), 'the eggs are spent');
  let now = 0.1;
  layer.noteDepartures(now);
  assert.ok(layer.departing.some((one) => one.npc.id === 'raccoon_meeting'), 'they walk in');
  while (layer.departing.some((one) => one.npc.id === 'raccoon_meeting') && now < 60) { now += 0.5; layer.noteDepartures(now); }
  assert.ok(layer.present.some((one) => one.id === 'raccoon_meeting'), 'and settle in around the first');
  const out = target(state, 'to_claims_road') as Interactable & { setOnTransit?: Record<string, boolean> };
  for (const [flag, value] of Object.entries(out.setOnTransit ?? {})) state.flags.set(flag, value);
  layer.arrived();
  assert.ok(!layer.present.some((one) => one.id === 'raccoon_meeting'), 'gone the next time he enters');
});

test('A5, the smoke: every verb on the hole and the raccoon refuses until he leaves', async () => {
  const state = await inState('r23-a');
  const said = useOn(state, 'tonic', 'hole');
  assert.ok(said.say && doc54.includes(`"${said.say}"`));
  assert.ok(!state.carried.includes('tonic'), 'the tonic is spent');
  state.holdItem(null);
  const fumes = state.interact(target(state, 'hole'), 'LOOK_AT').say;
  assert.ok(fumes && doc54.includes(`"${fumes}"`));
  for (const verb of ['LISTEN_TO', 'PICK_UP', 'PUSH']) assert.equal(state.interact(target(state, 'raccoon'), verb).say, fumes, `${verb} on the raccoon`);
  assert.equal(useOn(state, 'blanket', 'hole').say, fumes, 'not even the blanket');
});

test('A5, the blanket: the hole goes cold, he walks off, and the blanket comes back', async () => {
  const state = await inState('r23-a');
  const layer = new AmbientLayer(state);
  layer.arrived();
  layer.noteDepartures(0);
  const said = useOn(state, 'blanket', 'hole');
  assert.ok(said.say && doc54.includes(`"${said.say}"`));
  assert.ok(state.puzzleComplete('A5'));
  assert.equal(state.flags.get('T_WARM_HOLE'), true);
  assert.ok(state.carried.includes('blanket'), 'the blanket comes back');
  layer.noteDepartures(0.1);
  assert.ok(layer.departing.some((one) => one.npc.id === 'raccoon'), 'he leaves at a walk');
  const after = useOn(state, 'blanket', 'hole').say;
  assert.ok(after && doc54.includes(`"${after}"`), 'and the hole is not insulted twice');
});

test('A4: the claim is on the map only while he holds the map', async () => {
  const state = await inState('r23-a');
  state.enterRoom('town_map');
  assert.ok(state.mapLocations.some((one) => one.location.room === ROOM));
  const without = await inState('r22-a');
  assert.ok(!without.carried.includes('company_map'));
  without.enterRoom('town_map');
  assert.ok(!without.mapLocations.some((one) => one.location.room === ROOM), 'and not without it');
  // The road's way up: an exit to the claim with the map, doc 57's line without it.
  const road = without.content.rooms.get(without.content.rooms.get(ROOM)!.exits!.find((exit) => exit.stub || exit.to)!.to!)!.id;
  without.enterRoom(road);
  const up = (one: GameState) => one.targets.filter((t) => 'to' in t && (t as { to?: string }).to === ROOM);
  assert.equal(up(without).length, 0, 'no way up without the map');
  state.enterRoom(road);
  assert.equal(up(state).length, 1, 'and one with it');
  const closed = without.targets.find((t) => t.id.endsWith('_closed') && t.id.includes(ROOM));
  assert.ok(closed, 'the way up answers without the map');
  const words = /Room 22's way up to the claims\*\* · walk, \*without the map\* — "(.+)"$/m.exec(doc57)?.[1];
  assert.ok(words && JSON.stringify(closed).includes(words.slice(0, 30)), "doc 57's line, from the document");
});

test('F1: in Act IV the hole is understood, and the pickaxe answers after', async () => {
  const state = await inState('r23-b');
  assert.equal(useOn(state, 'pickaxe', 'hole').say !== undefined, true);
  state.holdItem(null);
  const look = state.interact(target(state, 'hole'), 'LOOK_AT');
  assert.ok(look.say && doc57.includes(`"${look.say}"`), 'doc 57 F1');
  assert.ok(state.puzzleComplete('F1'));
  assert.equal(state.flags.get('T_DRAUGHT'), true);
  const dig = useOn(state, 'pickaxe', 'hole').say;
  assert.ok(dig && doc57.includes(`"${dig}"`) && dig.startsWith('Three days'));
});
