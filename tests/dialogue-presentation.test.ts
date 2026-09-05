import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { choiceLines, dialogueTop } from '../engine/render/Renderer.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const fresh = async () => new GameState(await loadContent(fsReader), new MemoryStorage());
/** The tree of the character the fifth room's proof spec talks to -- from the data, so no name of the fiction lives here. */
const roomFiveTree = (state: GameState): string => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === 'assay_office' && one.tree);
  assert.ok(npc?.tree, 'the assay office has a character with a tree');
  return npc.tree;
};

/**
 * DOC 30 SECTION 14: "if the node has a greeting, enqueue it as a
 * speaker-labelled utterance; do not draw node.prompt". Section 16's binding
 * Room 1 proof: "no stale prompt is drawn".
 *
 * A node whose opening is performed line by line still carries `prompt` as
 * extracted metadata (the last line of that opening), and the renderer drew
 * it above the list -- so the line its speaker had just said stood a second
 * time over the choices. These guard the layout the renderer draws from:
 * the choices, and only the choices, for every tree in the manifest.
 */
test('the choice interface draws the options and never the node prompt', async () => {
  const state = await fresh();
  const ui = state.content.ui.dialogue;
  for (const [treeId, tree] of state.content.dialogue) {
    state.dialogue.start(treeId);
    const node = state.dialogue.currentNode;
    assert.ok(node, `${treeId} opens on a node`);
    const options = state.dialogue.presentOptions();
    assert.ok(options.length > 0, `${treeId} offers choices`);
    const layout = choiceLines(options, ui);
    assert.equal(layout.lines.length, options.length, `${treeId}: one line per option, nothing above them`);
    for (const [index, line] of layout.lines.entries()) {
      assert.ok(line.text.endsWith(options[index]!.option.text), `${treeId}: line ${index} is its option's text`);
      if (node.prompt) assert.ok(!line.text.includes(node.prompt), `${treeId}: the prompt "${node.prompt}" is not interface text`);
    }
    // The greeting, where the node has one, is spoken -- and its last line is
    // exactly what the prompt duplicates, which is why the prompt stays data.
    const opening = state.dialogue.openingOf(treeId);
    if (opening.length && node.prompt) assert.equal(opening.at(-1)?.line, node.prompt, `${treeId}: the prompt is the opening's last line, already spoken`);
    state.dialogue.end();
    void tree;
  }
});

test('the list is bottom-anchored from the option count alone, so hitboxes and lines agree', async () => {
  const state = await fresh();
  const ui = state.content.ui.dialogue;
  state.dialogue.start(roomFiveTree(state));
  const options = state.dialogue.presentOptions();
  const layout = choiceLines(options, ui);
  assert.equal(layout.top, dialogueTop(options.length));
  // The backing is a function of the option count alone -- a prompt used to
  // lift it by a line -- and never starts below the panel's top edge.
  assert.ok(layout.backingTop < layout.top, 'the backing starts above the first option');
  assert.equal(layout.backingTop, choiceLines([...options].reverse(), ui).backingTop);
  // An exhausted row is drawn dim with its own prefix; the rest are ink.
  assert.ok(layout.lines.every((line) => line.role === 'ink'), 'nothing is exhausted on a fresh tree');
  assert.ok(layout.lines.every((line) => line.text.startsWith(ui.optionPrefix)));
});

test('a goto node without a prompt lays out exactly as before: its rows and nothing else', async () => {
  const state = await fresh();
  const ui = state.content.ui.dialogue;
  state.dialogue.start(roomFiveTree(state));
  // The progress row that opens the second node, found by what it does.
  const opener = state.dialogue.presentOptions().find((p) => p.option.goto);
  assert.ok(opener, 'a row opens a second node at the first visit');
  state.dialogue.select(opener!.option.id);
  assert.equal(state.dialogue.positionSnapshot().node, opener!.option.goto);
  assert.equal(state.dialogue.currentNode?.noPrompt, true, 'the second node declares it has no prompt');
  const options = state.dialogue.presentOptions();
  assert.equal(options.length, 4);
  const layout = choiceLines(options, ui);
  assert.equal(layout.lines.length, 4);
  assert.equal(layout.top, dialogueTop(4));
});
