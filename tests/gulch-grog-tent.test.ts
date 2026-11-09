/**
 * FIDDLER'S GULCH, ROOM 52: THE GROG TENT (reference/fiddlers-gulch/brief.md, "What the engine needs" 5 and 6; doc
 * 109; errata 208).
 *
 * G4: the watch's first LOOK is THE FIND -- the subject's line, the find's lines and doc 03's Duel One opening, said
 * here -- and from then the keeper is named by his own name and his tree opens VES_G1. The watch has three states:
 * before the find, after it, and after G9, when it is THE NAIL and the watch is gone with him. G5: the fork on the
 * fiddle is the seat, and the rule-keeper plays it in his playing frames, the peg shown empty while he does. VES_G1:
 * doc 04's VES_B1 with doc 109's Gulch differences -- the seat first, the challenge to the bar (B4), and after Duel One
 * the rematch agreed (G9).
 *
 * Every line asserted here is read from doc 109 or from the content extracted from the documents, never typed here.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';

// PLAYS: G4, G5, G6, G9

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const json = async (path: string) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const doc109 = await readFile(resolve(ROOT, 'docs/109-fiddlers-gulch-lines.md'), 'utf8');
const quotes = (text: string) => [...text.replace(/\*\([^)]*\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
const lineStarting = (starts: string) => {
  const found = doc109.split('\n').find((line) => line.startsWith(starts));
  assert.ok(found, `doc 109 has a line starting ${starts}`);
  return found;
};
const block = (heading: string) => {
  const at = doc109.indexOf(`\n### ${heading}\n`);
  assert.ok(at >= 0, `doc 109 has ### ${heading}`);
  const rest = doc109.slice(at + heading.length + 6);
  return rest.slice(0, (/^#{2,3} |^---$/m.exec(rest) ?? { index: rest.length }).index);
};
const runOf = (body: string, label: string) => [...(new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm').exec(body)![1]!)
  .matchAll(/\d "([^"]+)"/g)].map((m) => m[1]!);

const WATCH = block('THE WATCH');
const WATCH_LOOK = runOf(WATCH, 'LOOK');
const [PICK_BEFORE, PICK_AFTER] = quotes(lineStarting('**PICK UP** — *before the find:*'));
const [NAIL_LOOK, NAIL_LISTEN] = quotes(lineStarting('**THE NAIL**'));
// The found man's section, by its own heading (`### NAME, found`), never named here.
const FOUND_LOOK = runOf(block(/^### (.+, found)$/m.exec(doc109)![1]!), 'LOOK');
const SEAT = quotes(lineStarting('- **Options 3 and 6 wait for the seat'));
const FIDDLE_AFTER = quotes(lineStarting('*After G5:* **THE FIDDLE** · USE THE TUNING FORK'))[0]!;

const ROOM = (await json('proofs/readiness/room-52.sources.json')).roomFile as string;

const inState = async (fixtureId: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const fixture = content.fixtures.get(fixtureId);
  assert.ok(fixture && state.applyFixture(fixture), `fixture ${fixtureId} applies`);
  assert.ok(ROOM.endsWith(`${state.roomId.replace(/_/g, '-')}.json`), `${fixtureId} stands in Room 52`);
  return state;
};
const keeperOf = (state: GameState) => [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.names?.length)!;
const sitterOf = (state: GameState) => [...state.content.ambient.values()].find((one) => one.room === state.roomId && one.posture === 'seated')!;
const target = (state: GameState, id: string): Interactable => {
  const found = state.findTarget(id);
  assert.ok(found, `${id} is here`);
  return found;
};
const spoken = (one: unknown) => (typeof one === 'string' ? one : (one as { line: string }).line);

test('G4: the watch\'s first LOOK is THE FIND, and from it he is named and his tree is VES_G1', async () => {
  const state = await inState('r52-a');
  const keeper = keeperOf(state);
  assert.notEqual(state.nameOf(keeper), keeper.names![0]!.name, 'before the find he is not called by it');
  const first = state.interact(target(state, 'watch'), 'LOOK_AT');
  const said = [first.say, ...(first.then ?? []).map(spoken)].join(' ');
  assert.ok(said.startsWith(WATCH_LOOK[0]!.slice(0, 30)), 'the subject\'s own first LOOK leads');
  for (const line of quotes(block('THE FIND').split('\n').filter((one) => one.startsWith('> **')).join('\n'))) {
    assert.ok(said.includes(line), `THE FIND says: ${line}`);
  }
  // Doc 03's opening as extracted: the file the room's scene reads it from, named in the annotation.
  const scene = (await json('reference/room-52/annotation.json')).scenes[0].extracted;
  const vessel = await json(scene.file);
  const opening = (scene.path as string).split('.').reduce((at: any, key) => at?.[key], vessel) as { line: string }[];
  assert.ok(opening?.length, `${scene.file} holds doc 03's opening at ${scene.path}`);
  for (const one of opening) assert.ok(said.includes(one.line), `doc 03's opening, here: ${one.line}`);
  assert.ok(state.puzzleComplete('G4'));
  assert.equal(state.flags.get('T_DEACON_FOUND'), true);
  assert.equal(state.nameOf(keeper), keeper.names![0]!.name, 'from the find his hover reads his own name');
  const tree = state.content.dialogue.get(keeper.tree)!;
  assert.equal((tree.entries ?? []).find((one) => state.flags.test(one.when))?.node, 'VES_G1');
  assert.equal(state.interact(target(state, 'watch'), 'LOOK_AT').say, WATCH_LOOK[1], 'then its second LOOK');
  assert.equal(state.interact(target(state, 'watch'), 'LOOK_AT').say, WATCH_LOOK[2], 'and its third');
});

test('the watch\'s three states: PICK UP before and after the find, and THE NAIL after G9', async () => {
  const before = await inState('r52-a');
  assert.equal(before.interact(target(before, 'watch'), 'PICK_UP').say, PICK_BEFORE);
  const after = await inState('r52-b');
  assert.equal(after.interact(target(after, 'watch'), 'PICK_UP').say, PICK_AFTER);
  after.flags.set('T_VESSEL_FOUND', true);
  const nail = target(after, 'watch');
  assert.equal(after.nameOf(nail as never), 'THE NAIL');
  assert.equal(after.interact(nail, 'LOOK_AT').say, NAIL_LOOK);
  assert.equal(after.interact(nail, 'LISTEN_TO').say, NAIL_LISTEN);
  const props = (after.room as { props?: { id: string; when?: Record<string, unknown> }[] }).props ?? [];
  const empty = props.filter((one) => one.when && after.flags.test(one.when as never));
  assert.equal(empty.length, 1, 'the empty nail is drawn over the plate from G9');
  assert.equal(keeperOf(after).when?.T_VESSEL_FOUND, false, 'he leaves the tent with the watch at G9');
});

test('G5: the fork on the fiddle is the seat, and he plays it in his playing frames, the peg shown empty', async () => {
  const state = await inState('r52-a');
  state.holdItem('tuning_fork');
  const scene = state.interact(target(state, 'fiddle'), 'USE');
  state.holdItem(null);
  const pair = state.content.combinations.pairs.find((one) => one.target === 'fiddle')!;
  assert.equal(scene.say, pair.rules![0]!.say);
  assert.ok(state.puzzleComplete('G5'));
  assert.equal(state.flags.get('T_PLANK_SEAT'), true);
  state.holdItem('tuning_fork');
  assert.equal(state.interact(target(state, 'fiddle'), 'USE').say, FIDDLE_AFTER, 'after G5, his line');
  state.holdItem(null);
  // The playing direction is acted, in the frames the peg prop maps to its empty frame, with the fiddle's cue.
  const sitter = sitterOf(state);
  const rows = state.content.actedDirections!.directions.filter((row) => row.speaker === sitter.id && row.class === 'A');
  const peg = sitter.sprite!.props![0]!;
  for (const row of rows.filter((one) => one.cue)) {
    for (const frame of row.frames!) assert.equal(peg.byFrame?.[String(frame)], 1, `frame ${frame} shows the peg empty`);
  }
  assert.ok(rows.some((row) => row.cue), 'he plays with a sound');
});

test('VES_G1: the seat first, then the challenge to the bar (G6, which is B4); after Duel One the rematch agreed (G9)', async () => {
  const before = await inState('r52-a');
  before.flags.set('T_DEACON_FOUND', true);
  before.dialogue.start(keeperOf(before).tree);
  const offered = before.dialogue.presentOptions().map((one) => one.option);
  const six = offered.find((one) => one.id === 'ves_g1_6_seat')!;
  assert.ok(six, 'before the seat, the affidavit answers with the seat');
  assert.equal(before.dialogue.select(six.id).say, SEAT[0]);
  const seated = await inState('r52-b');
  seated.dialogue.start(keeperOf(seated).tree);
  const challenge = seated.dialogue.presentOptions().map((one) => one.option).find((one) => one.id === 'ves_g1_6')!;
  assert.deepEqual(challenge.puzzle, { B4: 'complete' });
  assert.equal(challenge.duel, undefined, 'the local way is out on the bar: no duel is fought in the tent');
  // G6 played: the challenge chosen is B4 done, here (the G-id is B4's until the trip's close makes the Gulch's ids
  // canonical), and it calls Duel One to the bar, where he and the rule-keeper go (tests/gulch-river.test.ts plays it).
  seated.dialogue.select(challenge.id);
  assert.ok(seated.puzzleComplete('B4'), 'the challenge is B4, done in the grog tent');
  assert.equal(seated.flags.get('T_DUEL_ONE_CALLED'), true, 'it calls Duel One to the bar');
  assert.equal(seated.flags.test(keeperOf(seated).when!), false, 'and he goes down the bank, out of the tent');
  assert.equal(seated.flags.test(sitterOf(seated).when!), false, 'and the rule-keeper with him');
  const after = await inState('r52-c');
  after.dialogue.start(keeperOf(after).tree);
  const rematch = after.dialogue.presentOptions().map((one) => one.option).find((one) => one.id === 'ves_g1_5')!;
  assert.ok(rematch, 'after Duel One, the rematch');
  after.dialogue.select(rematch.id);
  assert.equal(after.flags.get('T_VESSEL_FOUND'), true);
});

test('the keeper\'s LOOK is his own name\'s once he is found; LISTEN as before', async () => {
  const state = await inState('r52-b');
  const room = state.room as { peopleResponses?: Record<string, Record<string, { when?: unknown; say: string }[]>> };
  const look = room.peopleResponses![keeperOf(state).id]!.LOOK_AT!;
  assert.equal(look.find((rule) => rule.when && state.flags.test(rule.when as never))?.say, FOUND_LOOK[0]);
});

test('the rule-keeper\'s barks go in turn, and every figure\'s sprite props are a list (the page drew none otherwise)', async () => {
  const state = await inState('r52-a');
  const sitter = sitterOf(state);
  const layer = new AmbientLayer(state);
  const heard: string[] = [];
  for (let visit = 0; visit < 3; visit += 1) {
    layer.arrived();
    heard.push(layer.checkApproach(sitter.x, sitter.y)!.line);
  }
  assert.deepEqual(heard, sitter.barkTurns![0]!.lines);
  for (const npc of state.content.ambient.values()) {
    const props = (npc.sprite as { props?: unknown } | undefined)?.props;
    if (props !== undefined) assert.ok(Array.isArray(props), `${npc.id}: sprite.props is a list`);
  }
});
