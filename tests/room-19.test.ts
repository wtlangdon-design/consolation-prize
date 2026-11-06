/**
 * ROOM 19, THE HERO'S ROOM: the letters home, played through the game state from
 * the room's own fixtures (content/fixtures/room-19.json).
 *
 * Doc 04 Part Three: "Each act offers three versions of the letter to his
 * mother ... The player picks freely. Nothing tracks it." In Acts I-III, USE
 * on the letter opens that act's three, named as the document names them, and
 * the one chosen is spoken as the letter itself (doc 30 section 6.2's echo).
 * Act IV is "the only version offered. No choice. Four lines." And design
 * invariant 10: nothing in the system is tracked -- no flag, no count read.
 * Every line asserted here is read from content extracted from the documents.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc04 = await readFile(resolve(ROOT, 'docs/04-dialogue-trees.md'), 'utf8');

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture, `fixture ${fixtureId} exists`);
  assert.ok(state.applyFixture(fixture));
  return state;
};
const sheet = (state: GameState) => {
  const target = state.findTarget('letters_home');
  assert.ok(target, 'the letter he is writing is on the desk');
  return target;
};
const flagsOf = (state: GameState) => JSON.stringify(state.flags.snapshot());

for (const act of [1, 2, 3]) {
  test(`Act ${act}: USE on the letter offers the act's three versions, and tracks none`, async () => {
    const state = await inState('r19-a');
    state.flags.set('ACT', act);
    const before = flagsOf(state);
    const opened = state.interact(sheet(state), 'USE');
    assert.ok(opened.enteredDialogue, 'the letters open');
    assert.ok(state.dialogue.isActive);
    const shown = state.dialogue.presentOptions();
    assert.equal(shown.length, 3, 'three versions');
    for (const one of shown) {
      assert.ok(doc04.includes(`**ACT ${['I', 'II', 'III'][act - 1]} — ${one.text}`), `"${one.text}" is the document's own name`);
      assert.ok(one.option.echo && doc04.includes(one.option.echo), 'the letter is the document\'s, word for word');
    }
    const result = state.dialogue.select(shown[0]!.option.id);
    assert.ok(result, 'chosen');
    assert.ok(!state.dialogue.isActive, 'the letter is written and the choice closes');
    assert.equal(flagsOf(state), before, 'nothing tracks it (invariant 10)');
  });
}

test('Act IV: the only version offered, four lines, no choice', async () => {
  const state = await inState('r19-b');
  const read = state.interact(sheet(state), 'USE');
  assert.ok(!read.enteredDialogue, 'no choice');
  const lines = [read.say, ...(read.then ?? []).map((line) => (typeof line === 'string' ? line : line.line))];
  assert.equal(lines.length, 4, 'four lines');
  const letter = doc04.slice(doc04.indexOf('**ACT IV —'));
  for (const line of lines) assert.ok(line && letter.includes(line), `"${line}" is doc 04's`);
});

test('errata 119: Act IV is the morning -- the packed plate, the lamp out -- and the night until then', async () => {
  // Errata 101 B: "The packed case on the bed and the morning light are Room
  // 19's Act IV state." The plate is chosen by ACT; the desk lamp's flicker is
  // live only while the plate shows it lit.
  const morning = await inState('r19-b');
  assert.ok((morning.flags.get('ACT') as number) >= 4);
  const plate = morning.room.plateWhen?.find((one) => morning.flags.test(one.when))?.plate;
  assert.equal(plate, 'act4');
  assert.equal(morning.room.plates?.[plate!], 'art/backgrounds/room-19-thads-room-act4.png');
  const lamp = morning.room.lamps?.find((one) => one.id === 'desk_lamp');
  assert.ok(lamp, 'the desk lamp is declared');
  assert.ok(!morning.flags.test(lamp.when), 'and out in the morning');
  // The case lies on the bed, inside the bed's hotspot: nothing is over it.
  const bed = morning.findTarget('bed');
  assert.ok(bed, 'the bed is still there to LOOK at');
  assert.equal(morning.targetAt(1620, 500)?.id, 'bed', 'the case on the bed answers as the bed');

  const night = await inState('r19-a');
  night.flags.set('ACT', 3);
  assert.equal(night.room.plateWhen?.find((one) => night.flags.test(one.when)), undefined, 'Acts I-III: the night plate');
  assert.ok(night.flags.test(night.room.lamps?.find((one) => one.id === 'desk_lamp')?.when), 'with the lamp lit');
});
