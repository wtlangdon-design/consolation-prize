import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: E0, E5

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * THE REGISTRAR'S TWO DOCUMENT ROWS, from Room 7's own fixtures.
 *
 * E0 (doc 57): "SUM_B1 option 1''', holding THE AFFIDAVIT, THE ASSAY OF RECORD
 * and THE ATTESTATION -> THE CERTIFICATE (the three are kept, stamped SEEN),
 * and the viewing ... -> T_CLAIM1_BLANK, E0."
 *
 * E5 (doc 57): "SUM_C1 option 1, presenting the certificate, records the
 * decease -> T_DECEASED. FRA_E1 opens on the next TALK TO Frame after that."
 */
const inState = async (id: string) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get(id)!));
  const npc = [...content.ambient.values()].find((one) => one.room === state.roomId && one.tree)!;
  return { content, state, tree: npc.tree as string };
};
const give = (state: GameState, item: string) => (state as unknown as { inventory: string[] }).inventory.push(item);
const rowGiving = (state: GameState, puzzle: string) => state.dialogue.presentOptions()
  .find((p) => p.option.puzzle?.[puzzle] === 'complete');

test('E0: the certificate row is offered only holding all three documents, and keeps them', async () => {
  const { content, state, tree } = await inState('r7-c');
  const row = content.dialogue.get(tree)!.nodes.SUM_B1!.options.find((one) => one.puzzle?.E0)!;
  const papers = row.holds!;
  assert.equal(papers.length, 3, 'A, B and D');
  state.dialogue.start(tree);
  assert.equal(rowGiving(state, 'E0'), undefined, 'not offered with none of them');
  state.dialogue.end();
  for (const paper of papers.slice(0, 2)) give(state, paper);
  state.dialogue.start(tree);
  assert.equal(rowGiving(state, 'E0'), undefined, 'not offered with two of three');
  state.dialogue.end();
  give(state, papers[2]!);
  state.dialogue.start(tree);
  const offered = rowGiving(state, 'E0');
  assert.ok(offered, 'offered with all three');
  state.dialogue.select(offered.option.id);
  assert.equal(state.puzzleComplete('E0'), true);
  assert.equal(state.flags.get('T_CLAIM1_BLANK'), true, 'the back of the sheet is blank');
  for (const item of row.gives!) assert.ok(state.carried.includes(item), 'THE CERTIFICATE');
  for (const paper of papers) assert.ok(state.carried.includes(paper), 'the three are kept');
});

test('E5: holding the death certificate, the Registrar records the decease, and the newspaper prints it', async () => {
  const { content, state, tree } = await inState('r7-d');
  const tc = content.dialogue.get(tree)!.nodes.SUM_C1!.options.find((one) => one.set?.T_DECEASED)!;
  state.flags.set('T_DEATH_CERTIFIED', true);
  for (const item of tc.holds!) give(state, item);
  state.dialogue.start(tree);
  assert.equal(state.dialogue.positionSnapshot().node, 'SUM_C1');
  state.dialogue.select(tc.id);
  assert.equal(state.flags.get('T_DECEASED'), true);
  state.dialogue.end();
  state.dialogue.start(tree);
  assert.notEqual(state.dialogue.positionSnapshot().node, 'SUM_C1', 'recorded once; the office moves on');
  state.dialogue.end();
  // The newspaper's tree opens on the obituary now (doc 57 E5).
  const press = [...content.dialogue.values()].find((one) => one.entries?.some((e) => (e.when as Record<string, unknown> | undefined)?.T_DECEASED === true))!;
  const paper = Object.values(press.nodes).flatMap((node) => node.options).find((one) => one.puzzle?.E5)!;
  state.dialogue.start(press.id);
  state.dialogue.select(paper.id);
  assert.equal(state.puzzleComplete('E5'), true);
});
