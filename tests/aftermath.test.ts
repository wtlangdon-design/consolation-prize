import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { DialogueFile, DialogueOption } from '../engine/core/types.ts';
import type { PresentedOption } from '../engine/core/DialogueRunner.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * W1: ERRATA 57's AFTERMATH, DOC 30's SELECTION COUNTS. These drive the one
 * aftermath-authored tree in the manifest -- found from the data, by that
 * marker -- through the runner with no screen, and check what each mode
 * guarantees. No line of the fiction is written here; the lines compared are
 * read out of the tree as the runner answers with them.
 */
const setup = async (flags: Record<string, boolean | number> = {}) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  for (const [id, value] of Object.entries(flags)) state.flags.set(id, value);
  const tree = [...content.dialogue.values()].find((t) => t.aftermathAuthored);
  assert.ok(tree, 'a tree declares its aftermath authored');
  return { content, state, tree };
};
const ids = (state: GameState) => state.dialogue.presentOptions().map((p) => p.option.id);
const byMode = (tree: DialogueFile, node: string, mode: string): DialogueOption | undefined =>
  tree.nodes[node]!.options.find((o) => o.afterUse === mode);

test('remove: the option is gone after its first selection, and stays gone across re-entry and save/load', async () => {
  const { state, tree } = await setup();
  const opensOn = tree.start;
  const removable = byMode(tree, opensOn, 'remove');
  assert.ok(removable, 'the opening node has a remove row');
  state.dialogue.start(tree.id);
  assert.ok(ids(state).includes(removable.id), 'offered on the first visit');
  state.dialogue.select(removable.id);
  state.dialogue.end();
  state.dialogue.start(tree.id);
  assert.ok(!ids(state).includes(removable.id), 'gone on re-entry, not merely dimmed');
  assert.ok(state.dialogue.presentOptions().every((p) => p.option.id !== removable.id));
  state.dialogue.end();
  state.save();
  const again = new GameState(state.content, new MemoryStorage());
  // A fresh state loads the same save through its own storage.
  const storage = new MemoryStorage();
  const saver = new GameState(state.content, storage);
  saver.dialogue.start(tree.id); saver.dialogue.select(removable.id); saver.dialogue.end(); saver.save();
  const loaded = new GameState(state.content, storage);
  assert.ok(loaded.load());
  loaded.dialogue.start(tree.id);
  assert.ok(!ids(loaded).includes(removable.id), 'gone after save and load');
  void again;
});

test('retain: the option stays, greys, and answers with its authored repeat or its exchange again', async () => {
  const { state, tree } = await setup();
  const retained = byMode(tree, tree.start, 'retain');
  assert.ok(retained);
  state.dialogue.start(tree.id);
  const first = state.dialogue.select(retained.id);
  const shown = state.dialogue.presentOptions().find((p) => p.option.id === retained.id);
  assert.ok(shown, 'still offered');
  assert.equal(shown.exhausted, true, 'greyed');
  assert.equal(shown.selections, 1);
  const second = state.dialogue.select(retained.id);
  const expected = retained.repeats?.[0]?.say ?? retained.repeat ?? first.say;
  assert.equal(second.say, expected, 'the authored repeat if there is one, else the exchange again');
});

test('counted-repeat: selections advance through the authored answers and clamp at the last; the row never greys', async () => {
  const { state, tree } = await setup({ T_TUNES_PIANOS: true });
  const counted = tree.nodes[tree.start]!.options.find((o) => o.afterUse === 'counted-repeat' && o.repeats?.length);
  assert.ok(counted, 'the opening node has a counted-repeat row with authored repeats');
  state.dialogue.start(tree.id);
  const answers: (string | null)[] = [];
  for (let n = 1; n <= (counted.repeats!.at(-1)!.selection + 2); n += 1) {
    const shown: PresentedOption | undefined = state.dialogue.presentOptions().find((p) => p.option.id === counted.id);
    assert.ok(shown, `offered at selection ${n}`);
    assert.equal(shown.exhausted, false, 'a counted-repeat stays at full weight');
    assert.equal(shown.selections, n - 1);
    answers.push(state.dialogue.select(counted.id).say);
  }
  assert.equal(answers[0], counted.say, 'first: the authored exchange');
  for (const entry of counted.repeats!) {
    assert.equal(answers[entry.selection - 1], entry.say ?? entry.exchange![0]!.line, `selection ${entry.selection}: its authored answer`);
  }
  const last = counted.repeats!.at(-1)!;
  assert.equal(answers.at(-1), last.say ?? last.exchange![0]!.line, 'past the last authored variant: clamped to it');
});

test('counted-repeat with an exchange at a later selection plays that exchange, whole', async () => {
  const { state, tree } = await setup({ T_BORDERS_MOTT: true, T_RACCOON_NAMED: true });
  const node = Object.entries(tree.nodes).find(([, n]) => n.options.some((o) => o.repeats?.some((r) => r.exchange)));
  assert.ok(node, 'a node has a repeat authored as an exchange');
  const [nodeId, data] = node;
  const option = data.options.find((o) => o.repeats?.some((r) => r.exchange))!;
  state.dialogue.restore({}, { tree: null, node: null });
  state.dialogue.start(tree.id);
  assert.equal(state.dialogue.positionSnapshot().node, nodeId, 'the flags open the node that has it');
  const staged = option.repeats!.find((r) => r.exchange)!;
  let result = state.dialogue.select(option.id);
  for (let n = 2; n <= staged.selection; n += 1) result = state.dialogue.select(option.id);
  assert.equal(result.say, staged.exchange![0]!.line);
  assert.deepEqual(result.rest.map((l) => l.line), staged.exchange!.slice(1).map((l) => l.line), 'the rest of the exchange follows');
  assert.equal(result.sayer, staged.exchange![0]!.speaker);
});

test('rephrase: the machinery holds the authored rephrase and does not fire until its canonical milestone is complete', async () => {
  const { state, tree } = await setup();
  const [nodeId, data] = Object.entries(tree.nodes).find(([, n]) => n.options.some((o) => o.afterUse === 'rephrase'))!;
  const option = data.options.find((o) => o.afterUse === 'rephrase')!;
  assert.ok(option.rephrase?.after, 'names a milestone');
  assert.equal(state.puzzleComplete(option.rephrase!.after), false, 'nothing in the build completes it');
  state.dialogue.start(tree.id);
  // Reach the node the row is on, by the row that opens it if it is not the start.
  if (state.dialogue.positionSnapshot().node !== nodeId) {
    const opener = state.dialogue.presentOptions().find((p) => p.option.goto === nodeId)!;
    state.dialogue.select(opener.option.id);
  }
  const shown = state.dialogue.presentOptions().find((p) => p.option.id === option.id)!;
  assert.equal(shown.text, option.text, 'the original wording before the milestone');
  assert.equal(state.dialogue.select(option.id).say, option.say, 'and the original answer');
  // The same tree under a runner whose milestone source says the puzzle is complete.
  const { DialogueRunner } = await import('../engine/core/DialogueRunner.ts');
  const reached = new DialogueRunner(state.content.dialogue, state.flags, undefined, (id) => id === option.rephrase!.after);
  reached.start(tree.id);
  if (reached.positionSnapshot().node !== nodeId) reached.select(reached.presentOptions().find((p) => p.option.goto === nodeId)!.option.id);
  const after = reached.presentOptions().find((p) => p.option.id === option.id)!;
  assert.equal(after.text, option.rephrase!.text, 'the rephrased wording once the milestone is reached');
  assert.equal(reached.select(option.id).say, option.rephrase!.say, 'and its answer');
});

test('save/load carries the selection counts, and a pre-W1 save restores as one selection each', async () => {
  const { content, tree } = await setup();
  const storage = new MemoryStorage();
  const state = new GameState(content, storage);
  state.flags.set('T_TUNES_PIANOS', true);
  const counted = tree.nodes[tree.start]!.options.find((o) => o.afterUse === 'counted-repeat' && o.repeats?.length)!;
  state.dialogue.start(tree.id);
  state.dialogue.select(counted.id); state.dialogue.select(counted.id);
  state.dialogue.end();
  state.save();
  const loaded = new GameState(content, storage);
  assert.ok(loaded.load());
  assert.deepEqual(loaded.dialogue.progressSnapshot(), { [tree.id]: { [`${tree.start}:${counted.id}`]: 2 } });
  loaded.dialogue.start(tree.id);
  assert.equal(loaded.dialogue.presentOptions().find((p) => p.option.id === counted.id)!.selections, 2);
  // A pre-W1 save: taken keys as a list.
  const legacy = new GameState(content, new MemoryStorage());
  legacy.dialogue.restore({ [tree.id]: [`${tree.start}:${counted.id}`] } as never, { tree: null, node: null });
  assert.deepEqual(legacy.dialogue.progressSnapshot(), { [tree.id]: { [`${tree.start}:${counted.id}`]: 1 } });
});

test('a fixture may carry selection counts, and they restore like a save', async () => {
  const { content, tree } = await setup();
  const state = new GameState(content, new MemoryStorage());
  const removable = byMode(tree, tree.start, 'remove')!;
  assert.ok(state.applyFixture({ id: 'x', label: 'x', room: 'assay_office', flags: {}, dialogueCounts: { [tree.id]: { [`${tree.start}:${removable.id}`]: 1 } } }));
  state.dialogue.start(tree.id);
  assert.ok(!ids(state).includes(removable.id), 'the removed row is gone in the fixture state');
});
