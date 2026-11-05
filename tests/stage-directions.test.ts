import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { DialogueFile } from '../engine/core/types.ts';

/**
 * DOC 58: STAGE DIRECTIONS IN A REPLY ARE PERFORMED. The script audit
 * (2026-11-05) found 108 of 202 conversation replies carried a direction and
 * none reached the screen: the extractor dropped them, and the reply that
 * survived was the punchline with its setup cut off.
 *
 * These guard both halves: the extracted content carries the directions
 * (and never a builder's note), and the runner hands them to the screen
 * marked as directions, so the scene draws them in the quieter ink.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

type Spoken = { speaker: string; line: string; direction?: boolean };
const directionsIn = (tree: DialogueFile): Spoken[] => Object.values(tree.nodes).flatMap((node) =>
  node.options.flatMap((option) => [
    ...(option.exchange ?? []),
    ...(option.repeats ?? []).flatMap((repeat) => repeat.exchange ?? []),
  ])).filter((spoken: Spoken) => spoken.direction === true);

test('the conversation trees carry their stage directions, and enough of them that a dropped pass shows', async () => {
  const content = await loadContent(fsReader);
  const shown = [...content.dialogue.values()].flatMap(directionsIn);
  // 49 at the time of doc 58; a pass that silently drops them falls far below.
  assert.ok(shown.length >= 40, `only ${shown.length} directions reach the trees`);
  for (const spoken of shown) assert.ok(spoken.line.trim().length > 0, 'a direction has words');
});

test('no builder note is shown as a direction -- neither by doc 58 rule 3 pattern nor by its hidden-by-name list', async () => {
  const content = await loadContent(fsReader);
  const doc = await readFile(resolve(ROOT, 'docs/58-stage-directions.md'), 'utf8');
  const section = doc.split(/^## Hidden by name\s*$/m)[1]?.split(/^#|^\*Why/m)[0] ?? '';
  const hidden = section.split('\n').filter((row) => row.startsWith('- ')).map((row) => row.slice(2).trim());
  assert.ok(hidden.length >= 10, 'doc 58 lists the directions it hides');
  const notes = /\berrata\b|\breq\s|\bsets\s|\bRULED\b|\bSuperseded\b|→|\bthe player\b/i;
  for (const tree of content.dialogue.values()) {
    for (const spoken of directionsIn(tree)) {
      assert.ok(!notes.test(spoken.line), `${tree.id}: a note is shown: ${spoken.line}`);
      assert.ok(!hidden.includes(spoken.line.trim()), `${tree.id}: doc 58 hides this: ${spoken.line}`);
    }
  }
});

test('the runner hands a direction to the screen marked as one, first line and the rest alike', async () => {
  const content = await loadContent(fsReader);
  let first = 0;
  let later = 0;
  for (const tree of content.dialogue.values()) {
    const state = new GameState(content, new MemoryStorage());
    try { state.dialogue.start(tree.id); } catch { continue; }
    for (const presented of state.dialogue.presentOptions()) {
      const exchange = presented.option.exchange as Spoken[] | undefined;
      if (!exchange?.some((spoken) => spoken.direction)) continue;
      const replay = new GameState(content, new MemoryStorage());
      replay.dialogue.start(tree.id);
      const said = replay.dialogue.select(presented.option.id);
      assert.equal(said.say, exchange[0]!.line, `${tree.id}/${presented.option.id}: the first line`);
      assert.equal(said.direction, exchange[0]!.direction === true, `${tree.id}/${presented.option.id}: the first line's ink`);
      if (said.direction) first += 1;
      for (const [index, spoken] of exchange.slice(1).entries()) {
        assert.equal(said.rest[index]?.line, spoken.line, `${tree.id}/${presented.option.id}: line ${index + 2}`);
        assert.equal(said.rest[index]?.direction === true, spoken.direction === true, `${tree.id}/${presented.option.id}: line ${index + 2}'s ink`);
        if (spoken.direction) later += 1;
      }
    }
  }
  assert.ok(first > 0, 'some opening option begins with a direction');
  assert.ok(later > 0, 'some opening option carries a direction after its first line');
});
