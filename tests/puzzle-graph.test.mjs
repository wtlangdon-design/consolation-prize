/**
 * THE PUZZLE TRAVERSAL, HELD TO WHAT IT CLAIMS (errata 219).
 *
 * tools/check-puzzle-graph.mjs answers invariant 6 by traversing the site
 * graph tools/lib/puzzle-model.mjs derives from content. A traversal is only
 * as good as two things, and this file tests both:
 *
 *   1. IT SEES WHAT PLAY DOES. Every fact the continuous playthrough produces
 *      from a fresh save, through the real engine (tests/full-game.test.ts's
 *      route), must be a fact the model reaches. A writer the model failed to
 *      read -- a new content shape, an engine write -- shows up here as a fact
 *      play reached and the model did not, instead of as a traversal that
 *      quietly passes on less than the game.
 *   2. IT FAILS WHEN IT SHOULD. Each defect it is named after is put back into
 *      the real content, and the check must fail on it: an empty graph (the
 *      inert pass this errata ends), a canonical puzzle missing from the
 *      declared graph, the declared graph out of step with content, a yield
 *      removed so a puzzle cannot be reached, a gate on a value nothing
 *      writes, and a loss that strands the player.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent as loadEngineContent } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { HeadlessPlayer, playStep, PlayError } from './lib/headless-player.ts';
import { CANONICAL_PUZZLE_IDS, check } from '../tools/check-puzzle-graph.mjs';
import { buildModel, loadModelContent, reach } from '../tools/lib/puzzle-model.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const reader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

const fresh = () => structuredClone(loadModelContent());
const failuresOf = (content, options) => check(content, options).failures;
/** For a defect that is not a dead end: the loss pass is the slow part, and the real-content test runs it. */
const quick = { losses: false };
const treeOf = (content, id) => content.dialogue.find(({ data }) => data.id === id).data;

test('the model reaches every fact the continuous playthrough produces, step by step', async () => {
  const content = await loadEngineContent(reader);
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  const walkthrough = JSON.parse(await readFile(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8'));
  const model = buildModel();
  const full = reach(model);
  const missed = new Set();
  const observe = (step) => {
    for (const [flag, value] of Object.entries(state.flags.snapshot())) {
      if (!full.state.flagPasses(flag, value, false)) missed.add(`${step}: flag ${flag}=${JSON.stringify(value)}`);
    }
    for (const item of state.carried) if (!full.tokens.has(`i:${item}`)) missed.add(`${step}: carrying ${item}`);
    for (const puzzle of state.puzzlesComplete()) if (!full.tokens.has(`p:${puzzle}`)) missed.add(`${step}: puzzle ${puzzle}`);
    if (!full.tokens.has(`r:${state.roomId}`)) missed.add(`${step}: in room ${state.roomId}`);
    if (state.dialogue.isActive && !state.dialogue.inDuel) {
      const { tree, node } = state.dialogue.positionSnapshot();
      if (!full.tokens.has(`n:${tree}/${node}`)) missed.add(`${step}: at ${tree}/${node}`);
    }
  };
  observe('fresh save');
  for (const step of walkthrough.steps) {
    try {
      playStep(player, step);
    } catch (error) {
      if (!(error instanceof PlayError)) throw error;
      // A break is full-game.test.ts's to report; this test only reads what play produced.
    }
    observe(step.id);
  }
  assert.deepEqual([...missed], [], 'facts play reached that the model does not -- a writer the model cannot see');
  assert.ok(state.puzzleComplete('F5'), 'the route was played to the end');
});

test('on the real content the traversal passes, and it traversed something', () => {
  const report = check();
  assert.deepEqual(report.failures, []);
  assert.ok(report.notes.some((note) => note.startsWith(`${CANONICAL_PUZZLE_IDS.length}/${CANONICAL_PUZZLE_IDS.length} canonical puzzles reachable`)),
    report.notes.join('\n'));
});

test('an empty puzzle graph FAILS: the inert pass is gone', () => {
  const content = fresh();
  content.puzzles = [];
  content.manifest.puzzles = [];
  assert.ok(failuresOf(content, quick).some((one) => one.includes('no puzzle graph is declared')));
});

test('a canonical puzzle missing from the declared graph fails', () => {
  const content = fresh();
  const graph = content.puzzles[0].data;
  graph.puzzles = graph.puzzles.filter((one) => one.id !== 'D3');
  assert.ok(failuresOf(content, quick).some((one) => one.includes('"D3" is missing from the declared graph')));
});

test('a declared graph out of step with the content fails', () => {
  const content = fresh();
  content.puzzles[0].data.puzzles.find((one) => one.id === 'A5').completedBy[0].yields.push('f:T_FUMES=true');
  assert.ok(failuresOf(content, quick).some((one) => one.includes('content/puzzles/puzzle-graph.json is out of step')));
});

test('a yield removed makes its puzzle unreachable, and the check says which', () => {
  // The hotel clerk's option is the only writer of T_TUNES_PIANOS; without it the fork on the parlour piano never earns the room (A2).
  const content = fresh();
  for (const node of Object.values(treeOf(content, 'HOTEL_CLERK').nodes)) {
    for (const option of node.options) if (option.set) delete option.set.T_TUNES_PIANOS;
  }
  const failures = failuresOf(content, quick);
  assert.ok(failures.some((one) => one.includes('canonical puzzle "A2" is not reachable from a fresh save')), failures.join('\n'));
});

test('a gate on a value nothing reachable writes fails', () => {
  const content = fresh();
  const sump = treeOf(content, 'SUMP');
  const option = Object.values(sump.nodes).flatMap((node) => node.options).find((one) => one.id === 'sump1b');
  option.when = { ...(option.when ?? {}), T_FILED: 7 };
  const failures = failuresOf(content, quick);
  assert.ok(failures.some((one) => one.includes('reads T_FILED=7')), failures.join('\n'));
});

test('a loss that strands the player is a dead end, and the check fails on it', () => {
  // Hiring the rod at G1 also taking the fork: the fork is still wanted at the livery (B3) and in the grog tent (G5).
  const content = fresh();
  for (const node of Object.values(treeOf(content, 'OZYMANDIA').nodes)) {
    for (const option of node.options) if (option.takes?.includes('filing_fee')) option.takes.push('tuning_fork');
  }
  const failures = failuresOf(content);
  assert.ok(failures.some((one) => one.includes('DEAD END') && one.includes('ozymandia9') && one.includes('i:tuning_fork')),
    failures.join('\n'));
});

test('the filing fee earned once only is a dead end: the piano paying again is what keeps A7, A9 and G1 open', () => {
  const content = fresh();
  const pair = content.combinations.pairs.find((one) => one.item === 'tuning_fork' && one.target === 'piano');
  pair.rules = pair.rules.filter((rule) => !(rule.items?.includes('filing_fee')) || rule.completes === 'A8');
  const failures = failuresOf(content);
  assert.ok(failures.some((one) => one.includes('DEAD END') && one.includes('i:filing_fee')), failures.join('\n'));
});

test('a known finding that no longer reproduces fails, so the list only holds what is true', () => {
  const content = fresh();
  content.puzzleFindings = { deadEnds: [{ site: 'dialogue:NOBODY:X:y', finding: 'invented' }], unreachable: [], unwrittenReads: [] };
  assert.ok(failuresOf(content).some((one) => one.includes('no longer reproduces')));
});
