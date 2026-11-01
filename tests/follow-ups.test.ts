import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { DialoguePerformance, type HoldTiming } from '../engine/core/DialoguePerformance.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

/**
 * TYLER, 2026-11-01, PLAYING THE NUGGET: "certain dialogue options didn't
 * appear until other ones were clicked first", and lines "disappear before I
 * have a chance to read" them. Doc 04 node rule 7 (`after N`) and ui.json's
 * conversationWaitsForClick are the two answers; these hold them.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const fresh = async () => new GameState(await loadContent(fsReader), new MemoryStorage());

test('every follow-up names an earlier option of its own node, so none is unreachable', async () => {
  const state = await fresh();
  let seen = 0;
  for (const [treeId, tree] of state.content.dialogue) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      const ids = node.options.map((option) => option.id);
      node.options.forEach((option, index) => {
        for (const before of option.after ?? []) {
          seen += 1;
          const at = ids.indexOf(before);
          assert.ok(at >= 0, `${treeId}/${nodeId}/${option.id} follows ${before}, which this node does not have`);
          assert.ok(at < index, `${treeId}/${nodeId}/${option.id} follows ${before}, which comes after it`);
        }
      });
    }
  }
  assert.ok(seen > 0, 'some tree marks a follow-up');
});

test('a follow-up is offered only once the question that raises it has been asked', async () => {
  const state = await fresh();
  const treeId = [...state.content.dialogue.keys()].find((id) =>
    Object.values(state.content.dialogue.get(id)!.nodes).some((node) =>
      node.options.some((option) => (option.after ?? []).length > 0)));
  assert.ok(treeId, 'a tree with a follow-up');
  const tree = state.content.dialogue.get(treeId)!;
  state.dialogue.start(treeId);
  const node = state.dialogue.currentNode!;
  const follower = node.options.find((option) => (option.after ?? []).length > 0)!;
  const shown = () => state.dialogue.presentOptions().map((each) => each.option.id);

  assert.ok(!shown().includes(follower.id), `${follower.id} waits`);
  assert.throws(() => state.dialogue.select(follower.id), /Gated/);

  for (const before of follower.after!) {
    state.dialogue.start(treeId);
    state.dialogue.select(before);
  }
  state.dialogue.start(treeId);
  assert.equal(state.dialogue.currentNode, tree.nodes[tree.start] ?? node);
  assert.ok(shown().includes(follower.id), `${follower.id} is offered once ${follower.after!.join(', ')} was asked`);
});

const TIMING: HoldTiming = { base: 0.45, perGlyph: 0.055, minimum: 1.8, maximum: 8.0 };

test('with waitForClick a line stays until a click, and a click advances exactly one', async () => {
  const state = await fresh();
  state.dialogue.start('STAGE_DRIVER');
  const chosen = state.dialogue.presentOptions()[0]!;
  const exchange = state.dialogue.beginSelection(chosen.option.id);
  const echo = { speaker: state.content.actor.id, line: chosen.option.text };
  const reply = { speaker: 'other', line: 'A reply.' };
  const performance = new DialoguePerformance(exchange, echo, [reply], { ...TIMING, waitForClick: true }, 0);

  assert.equal(performance.tick(1000), false, 'the clock alone never clears it');
  assert.deepEqual(performance.current, echo);
  assert.equal(performance.acceptsInput(0.05), false, 'the selecting click does not also dismiss');
  performance.skip(1000);
  assert.deepEqual(performance.current, reply);
  assert.equal(performance.tick(5000), false);
  assert.deepEqual(performance.current, reply);
});

test('the shipped ui waits for the click', async () => {
  const state = await fresh();
  assert.equal(state.content.ui.timing?.conversationWaitsForClick, true);
});
