/**
 * ROOM 21, THE WATCHMAN'S SHACK: E10, the confession, played through the game
 * state from the room's own fixtures (content/fixtures/room-21.json).
 *
 * Doc 57 E10: "Entering the shack after E9 plays doc 48 S4 beat 1, then
 * HOB_C2's opening -- the confession -- and E10 completes." The room's accost
 * is that action, once. Doc 48 S4 beat 3, after the tree: the flags, Hob's line,
 * dawn in the window, and ACT 4 -- whose rise is the Part Four card. Every line
 * asserted is read from the documents or the content extracted from them.
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

// PLAYS: E10

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc48 = await readFile(resolve(ROOT, 'docs/48-act-turn-beats.md'), 'utf8');
const s4 = doc48.slice(doc48.indexOf('## S4 '), doc48.indexOf('## S5 '));

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
const present = (state: GameState) => {
  const layer = new AmbientLayer(state);
  layer.arrived();
  return layer.present;
};
const propsShown = (state: GameState) => (state.room.props ?? []).filter((one) => state.flags.test(one.when)).map((one) => one.id);

test('Act I: nobody home, no cups, night in the window', async () => {
  const state = await inState('r21-b');
  assert.deepEqual(present(state).map((one) => one.id), [], 'he is out on his rounds');
  assert.deepEqual(propsShown(state), []);
});

test('E10: on entering after E9, the confession; at its end, S4 beat 3 and Act IV', async () => {
  const state = await inState('r21-a');
  const host = present(state).find((one) => one.tree);
  assert.ok(host?.tree, 'Hob is at home');
  assert.deepEqual(propsShown(state), ['cups'], 'he has set two cups');
  const accost = state.room.onEnter?.accost;
  assert.equal(accost?.npc, host.id, 'he opens on the player');
  assert.equal(accost?.completes, 'E10', 'and the opening is E10');
  assert.ok(state.flags.test(accost?.when));

  // The accost's action: E10 completes, and the entry's opening is performed.
  state.completeByTimeline('E10');
  const opening = state.dialogue.openingOf(host.tree, true);
  assert.ok(opening.length > 1);
  assert.equal(opening[0]!.speaker, host.id);
  assert.ok(s4.includes(`"${opening[0]!.line}"`), 'S4 beat 1 first');
  assert.ok(state.puzzleComplete('E10'));

  state.dialogue.start(host.tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'HOB_C2');
  const leave = state.dialogue.presentOptions().find((one) => one.option.tag === 'EXIT');
  assert.ok(leave?.option.say && s4.includes(`"${leave.option.say}"`), 'S4 beat 3: his line');
  state.dialogue.select(leave.option.id);
  assert.equal(state.flags.get('T_HOB_IS_MOTT'), true);
  assert.equal(state.flags.get('T_NO_GOLD_EVER'), true);
  assert.equal(state.flags.get('ACT'), 4, 'Act IV');
  assert.ok(state.content.actCards.get(4), 'whose card is PART FOUR');
  assert.deepEqual(propsShown(state).sort(), ['cups', 'dawn_window'], 'dawn is starting');
  assert.ok(!present(state).some((one) => one.id === host.id), 'the next time the player comes in, he is not here');
});

test('a wrong verb on Hob in the shack is doc 54\'s line for it', async () => {
  const state = await inState('r21-a');
  const doc54 = await readFile(resolve(ROOT, 'docs/54-batch-c.md'), 'utf8');
  const lines = state.room.peopleResponses?.hob;
  assert.ok(lines);
  for (const verb of ['PICK_UP', 'PUSH', 'USE']) {
    const said: string | undefined = lines[verb]?.[0]?.say;
    assert.ok(said && doc54.includes(`"${said}"`), `${verb}: doc 54's line`);
  }
});

test('errata 103 B: once Act IV begins, the game cuts to his room and he says doc 57\'s line once', async () => {
  // Found by the continuous playthrough: doc 57's Act IV opening was never
  // wired, so Act IV began wherever the confession left him.
  const due = (one: GameState) => one.actOpeningDue;
  const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
  const content = await loadContent(fsReader);
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  assert.ok(state.applyFixture(content.fixtures.get('r21-a')!));
  const host = present(state).find((one) => one.tree)!;
  state.completeByTimeline('E10');
  assert.equal(due(state), null, 'nothing is owed before the act turns');
  state.dialogue.start(host.tree!);
  const leave = state.dialogue.presentOptions().find((one) => one.option.tag === 'EXIT')!;
  state.dialogue.select(leave.option.id);
  const owed = due(state);
  assert.ok(owed, 'the act turn owes the opening');
  assert.equal(content.actOpenings.get(4), owed, 'Act IV\'s');
  const annotation = JSON.parse(await readFile(resolve(ROOT, 'reference/room-19/annotation.json'), 'utf8'));
  assert.equal(owed.room, annotation.room, 'Room 19');

  // A save taken between the turn and the cut still owes it.
  state.save(2);
  const between = new GameState(content, storage);
  assert.ok(between.load(2));
  assert.equal(due(between)?.room, owed.room, 'a load before the cut still makes it');

  const lines = state.openAct();
  assert.equal(state.roomId, owed.room, 'he is in his room');
  assert.ok(lines.length > 0 && lines.every((line) => doc57.includes(`> "${line}"`)), 'doc 57\'s line, as written');
  assert.equal(due(state), null, 'said once');
  assert.deepEqual(state.openAct(), [], 'and never again');
  const after = new GameState(content, storage);
  assert.ok(after.load());
  assert.equal(after.roomId, owed.room);
  assert.equal(due(after), null, 'a load after the cut does not replay it');

  // A playtest fixture that merely starts in Act IV owes nothing.
  for (const fixture of content.fixtures.values()) {
    if (fixture.flags.ACT !== 4) continue;
    const other = new GameState(content, new MemoryStorage());
    assert.ok(other.applyFixture(fixture));
    assert.equal(due(other), null, `${fixture.id} is not cut away from`);
  }
});
