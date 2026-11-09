/**
 * FIDDLER'S GULCH: THE WASHOUT, THE MINE AND THE LEDGE (reference/fiddlers-gulch/brief.md; docs 107-108; errata 199).
 *
 * The mine is a maze that is forgiving and fair: a wrong way costs one screen and says, in turn, doc 108's BACK WHERE
 * HE STARTED (counted, so a save keeps its place); the right way is the survey's; the rod at the line tells and does
 * not open; once through, the washout's mine leads straight to the ledge, with THE WAY THROUGH said once. And nothing
 * in it is found by ear: the brief asks for "a check that fails if the four mine rooms differ in music or ambience, or
 * if any exit, passage or rod use in them carries a sound" -- doc 107's "the listening stays special", made a test.
 *
 * Every line asserted here is read from doc 108 or from content extracted from it, never typed into this file. The
 * mine's rooms are read from their readiness records.
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

// PLAYS: G2

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const json = async (path: string) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc108 = await readFile(resolve(ROOT, 'docs/108-the-washout-and-the-mine.md'), 'utf8');

/** A `## heading`'s body, to the next `## ` or `---`. */
const section = (heading: string) => {
  const at = doc108.indexOf(`## ${heading}`);
  assert.ok(at >= 0, `doc 108 has ${heading}`);
  const rest = doc108.slice(at + heading.length + 3);
  return rest.slice(0, (/\n## |\n---\n/.exec(rest) ?? { index: rest.length }).index);
};
const quotes = (text: string) => [...text.replace(/\*\([^)]*\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
const BACK = [1, 2, 3, 4, 5].map((n) => quotes(new RegExp(`^${n}\\. (.+)$`, 'm').exec(section('THE MINE · BACK WHERE HE STARTED'))![1]!)[0]!);
const WAY_THROUGH = quotes(/^\*\*THE WAY THROUGH\*\*(.+)$/m.exec(section('THE WASHOUT'))![1]!)[0]!;
const rowAfter = (body: string, starts: string) => body.split('\n').find((line) => line.startsWith(starts))!.split(' — ').slice(1).join(' — ');
const ROD_LINE = rowAfter(section('THE MINE · THE LINE'), '**THE BRASS ROD** · USE').split(' · ').map((piece) => ({
  direction: /\*\(([^)]+)\)\*/.exec(piece)?.[1]?.trim() ?? null, line: quotes(piece)[0]!,
}));
const wrongs = section('THE MINE · WRONG ANSWERS, ANYWHERE IN IT');
const ROD_ANYWHERE = quotes(rowAfter(wrongs, '**THE BRASS ROD** · USE'));
const FORK = quotes(rowAfter(wrongs, '**THE TUNING FORK** · USE'))[0]!;

const roomOf = async (n: number) => (await json((await json(`proofs/readiness/room-${n}.sources.json`)).roomFile)).id as string;
const [WASHOUT, ADIT, CLIMB, ROCKS, LINE, LEDGE] = (await Promise.all([45, 46, 47, 48, 49, 50].map(roomOf))) as [string, string, string, string, string, string];
const MINE: string[] = [ADIT, CLIMB, ROCKS, LINE];

const atTheWashout = async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get('r45-a');
  assert.ok(fixture && state.applyFixture(fixture), 'the washout fixture applies');
  return state;
};
const target = (state: GameState, id: string): Interactable => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is here in ${state.room.id}`);
  return found;
};
/** Walk through a way; return what was said on arrival, if anything. */
const take = (state: GameState, id: string) => {
  state.holdItem(null);
  const result = state.interact(target(state, id), 'WALK_TO');
  // A line said AT the door changes the room once it has been read (the scene's `goesTo`), as Room 8's test follows it.
  if (result.goesTo) state.enterRoom(result.goesTo);
  return result.say;
};
const useOn = (state: GameState, item: string, id: string) => {
  state.holdItem(null);
  state.holdItem(item);
  const result = state.interact(target(state, id), 'USE');
  state.holdItem(null);
  return result;
};

test('the mine is found by eye, never by ear: one music, one bed, and no sound for a way or the rod', async () => {
  const manifest = await json('content/manifest.json');
  const sounds = await json('content/audio/sounds.json');
  const music = MINE.map((room) => JSON.stringify(manifest.music.rooms[room]));
  assert.ok(manifest.music.rooms[ADIT], 'the mine has music');
  assert.equal(new Set(music).size, 1, 'the four mine rooms play one file at one gain, carried across them (doc 45 R46-49-M)');
  const beds = MINE.map((room) => JSON.stringify(sounds.ambience[room]));
  assert.ok(sounds.ambience[ADIT], 'the mine has a bed');
  assert.equal(new Set(beds).size, 1, 'the four mine rooms share one bed at one level (doc 45 R46-49-A)');
  // Nothing in the mine makes a sound: no transit cue between any two of its rooms or out of it, no verb cue on any
  // of its targets, and no cue on the rod anywhere.
  for (const transit of sounds.transits ?? []) {
    assert.ok(!transit.between.some((room: string) => MINE.includes(room)), `no transit sound touches the mine: ${transit.between}`);
  }
  for (const cue of sounds.verbs ?? []) assert.ok(!MINE.includes(cue.room), `no verb sound in the mine: ${cue.room}/${cue.target}`);
  const combinations = await json('content/combinations.json');
  for (const pair of combinations.pairs.filter((one: { item: string }) => one.item === 'brass_rod')) {
    assert.ok(!JSON.stringify(pair).includes('"cue"'), 'the rod at the line is shown, never heard (doc 107)');
  }
  for (const room of MINE) {
    const file = (await json('content/manifest.json')).rooms.find((path: string) => path.endsWith(`${room.replace(/_/g, '-')}.json`));
    const built = await json(file);
    for (const exit of built.exits) {
      assert.ok(!JSON.stringify(exit).includes('"cue"') && !JSON.stringify(exit).includes('"sound"'), `${room}/${exit.id} carries no sound`);
    }
  }
});

test('a wrong way costs one screen and says, in turn, BACK WHERE HE STARTED; the survey\'s way leads through', async () => {
  const state = await atTheWashout();
  assert.equal(state.room.id, WASHOUT);
  take(state, 'to_mine_adit');
  assert.equal(state.room.id, ADIT, 'the old mine leads into the adit');
  assert.equal(take(state, 'left_opening'), BACK[0], 'the first wrong way: the first line');
  assert.equal(state.room.id, WASHOUT, 'the adit\'s wrong way leads back out to the washout (doc 107)');
  take(state, 'to_mine_adit');
  assert.equal(take(state, 'middle_opening'), BACK[1]);
  assert.equal(state.room.id, WASHOUT);
  take(state, 'to_mine_adit');
  take(state, 'right_opening');
  assert.equal(state.room.id, CLIMB, 'the opening with the stake by it');
  assert.equal(take(state, 'passage_on'), BACK[2]);
  assert.equal(state.room.id, ADIT, 'the climb\'s wrong way leads back to the adit');
  take(state, 'right_opening');
  take(state, 'passage_up');
  assert.equal(state.room.id, ROCKS, 'the passage that rises');
  assert.equal(take(state, 'way_past_other_rock'), BACK[3]);
  assert.equal(state.room.id, CLIMB, 'the two rocks\' wrong way leads back to the climb');
  take(state, 'passage_up');
  take(state, 'way_past_big_rock');
  assert.equal(state.room.id, LINE, 'past the larger rock');
  assert.equal(take(state, 'left_passage'), BACK[4], 'the fifth line');
  assert.equal(state.room.id, LINE, 'round in a loop to the line again');
  assert.equal(take(state, 'left_passage'), BACK[4], 'after the fifth, the fifth again');
  assert.equal(state.flags.get('T_MINE_CROSSED'), false);
  take(state, 'right_passage');
  assert.equal(state.room.id, LEDGE, 'the right passage leads out, with or without the rod');
  assert.equal(state.flags.get('T_MINE_CROSSED'), true, 'the first crossing is kept');
});

test('once through, the washout and the ledge join, and THE WAY THROUGH is said once', async () => {
  const state = await atTheWashout();
  state.flags.set('T_MINE_CROSSED', true);
  assert.ok(!state.findTarget('to_mine_adit'), 'the way into the adit is closed once the mine is known');
  assert.equal(take(state, 'to_ledge'), WAY_THROUGH, 'the first walk straight through says it');
  assert.equal(state.room.id, LEDGE);
  take(state, 'to_washout');
  assert.equal(state.room.id, WASHOUT, 'the ledge\'s mine leads back to the washout');
  assert.equal(take(state, 'to_ledge'), null, 'and not again');
  assert.equal(state.room.id, LEDGE);
});

test('the rod at the line tells in turn on either passage; anywhere else in the mine it gives the wrong answers', async () => {
  const state = await atTheWashout();
  take(state, 'to_mine_adit');
  // Anywhere but the line, in turn, carried across the mine.
  assert.equal(useOn(state, 'brass_rod', 'stake').say, ROD_ANYWHERE[0]);
  assert.equal(useOn(state, 'tuning_fork', 'stake').say, FORK, 'the fork in the mine');
  take(state, 'right_opening');
  assert.equal(useOn(state, 'brass_rod', 'props').say, ROD_ANYWHERE[1]);
  take(state, 'passage_up');
  take(state, 'way_past_big_rock');
  assert.equal(useOn(state, 'brass_rod', 'ore_cart').say, ROD_ANYWHERE[2], 'at the line but not on a passage');
  // On a passage: the first is performed, then said; the second and third said; the third holds.
  const first = useOn(state, 'brass_rod', 'left_passage');
  assert.equal(first.say, ROD_LINE[0]!.direction, 'the humming is shown, in the rod and in him');
  const said = first.then?.[0];
  assert.equal(typeof said === 'string' ? said : said?.line, ROD_LINE[0]!.line);
  assert.equal(state.room.id, LINE, 'using the rod on a way is not walking down it');
  assert.equal(useOn(state, 'brass_rod', 'right_passage').say, ROD_LINE[1]!.line, 'either passage, one run');
  assert.equal(useOn(state, 'brass_rod', 'left_passage').say, ROD_LINE[2]!.line);
  assert.equal(useOn(state, 'brass_rod', 'left_passage').say, ROD_LINE[2]!.line, 'the third holds');
});

test('a save keeps the mine\'s place: the wrong-way count and the crossing are flags', async () => {
  const flags = (await json('content/flags/flags.json')).flags as { id: string; type: string }[];
  for (const id of ['MINE_BACK_AGAIN', 'T_MINE_CROSSED', 'ROD_AT_LINE']) {
    assert.ok(flags.some((flag) => flag.id === id), `${id} is a declared flag, so a save restores it`);
  }
});
