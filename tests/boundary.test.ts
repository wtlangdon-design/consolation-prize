import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playThrough } from './lib/headless-player.ts';

// PLAYS: A7

/**
 * THE BOUNDARY IS WALKED, AND IT IS THE SURVEY'S (doc 120 I-3; errata 251). The first design let the player draw any
 * line. The survey's words are fixed (doc 57 A7), read aloud at A9, quoted by the third copy and walked again in the
 * mine (doc 108), so the line he walks on the map is that one. Held here: asking does not hand the survey over; the
 * legs come in doc 57's order and each is announced in doc 57's words; a wrong place moves nothing; while the map is
 * out he stays and only the map answers; and a save that already has its survey is not sent round again.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as { steps: { id: string }[] };
const doc57 = await readFile(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
const LEG = 'SURVEY_LEG';
const SURVEY = /\*\*The survey, as written on the form\*\*[^\n]*\n> "([^"]+)"/.exec(doc57)![1]!;

function playedTo(id: string) {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  playThrough(player, walkthrough.steps.slice(0, walkthrough.steps.findIndex((step) => step.id === id) + 1) as never);
  return { state, player };
}
type Rule = { when?: Record<string, unknown>; say: string; then?: (string | { line: string })[]; set?: Record<string, unknown> };
const advancing = (state: GameState, leg: unknown) => state.targets
  .flatMap((one) => (one.responses?.USE ?? []).map((rule) => ({ target: one, rule: rule as Rule })))
  .find(({ rule }) => rule.when?.[LEG] === leg && rule.set?.[LEG] !== undefined);
const wordsOf = (rule: Rule) => [rule.say, ...(rule.then ?? []).map((one) => (typeof one === 'string' ? one : one.line))].join(' ');

test('asking for the survey unrolls the map; it does not hand the survey over', () => {
  const { state } = playedTo('A7.4');
  assert.ok(state.playerStays && state.roomCovered);
  assert.ok(!state.carried.includes('survey') && !state.puzzleComplete('A7'));
  assert.equal(state.flags.get(LEG), 0);
});

test('the legs come in the survey\'s own order, each announced in its own words', () => {
  const { state } = playedTo('A7.4');
  const said: string[] = [];
  for (let guard = 0; guard < 8 && state.playerStays; guard += 1) {
    const next = advancing(state, state.flags.get(LEG));
    assert.ok(next, `nothing takes the rod at leg ${String(state.flags.get(LEG))}`);
    said.push(wordsOf(next.rule));
    state.interact(next.target, 'USE');
  }
  assert.ok(state.carried.includes('survey') && state.puzzleComplete('A7'));
  // What the form says, she has said on the map, in the form's order. Each phrase is the form's own.
  const heard = said.join(' ').toLowerCase();
  let from = 0;
  for (const phrase of ['Commencing at the stake', 'uphill', 'with feeling', 'the larger of the two rocks', 'forty feet', 'home']) {
    assert.ok(SURVEY.includes(phrase), `doc 57's survey no longer says "${phrase}"`);
    const at = heard.indexOf(phrase.toLowerCase(), from);
    assert.ok(at >= 0, `the form says "${phrase}" and she has not announced it on the map, in that order`);
    from = at;
  }
});

test('a wrong place moves nothing, at any leg', () => {
  const { state } = playedTo('A7.4');
  for (let guard = 0; guard < 8 && state.playerStays; guard += 1) {
    const leg = state.flags.get(LEG);
    const next = advancing(state, leg)!;
    for (const other of state.targets.filter((one) => one.id !== next.target.id)) {
      state.interact(other, 'USE');
      assert.equal(state.flags.get(LEG), leg, `${other.id} moved the survey on at leg ${String(leg)}`);
      assert.ok(state.playerStays && !state.carried.includes('survey'));
    }
    state.interact(next.target, 'USE');
  }
});

test('while the map is out only the map answers, and what was in the tent is there again after', () => {
  const before = playedTo('A7.3');
  const tent = before.state.targets.map((one) => one.id).sort();
  const { state } = playedTo('A7.4');
  const onMap = state.targets.map((one) => one.id);
  assert.equal(onMap.filter((id) => tent.includes(id)).length, 0, 'something of the tent is pointed at through the map');
  assert.ok(onMap.length >= 5);
  const after = playedTo('A7.4g');
  assert.deepEqual(after.state.targets.map((one) => one.id).sort(), tent);
  assert.ok(!after.state.playerStays);
});

test('a save keeps its place on the boundary', () => {
  const { state } = playedTo('A7.4e');
  const leg = state.flags.get(LEG);
  state.save(1);
  state.interact(advancing(state, leg)!.target, 'USE');
  assert.notEqual(state.flags.get(LEG), leg);
  assert.ok(state.load(1));
  assert.equal(state.flags.get(LEG), leg);
  assert.ok(state.playerStays && state.roomCovered);
});
