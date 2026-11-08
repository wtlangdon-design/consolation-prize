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

/**
 * A NODE REACHED FROM A ROW SAYS ITS OPENING (errata 181). Openings were performed only when a conversation
 * started on their node. Four nodes are reached from a row instead, and none of them was ever heard: a
 * newspaperman's terms for a trade, a card offered across a desk, a banker's first line, and the second
 * ledger's whole scene, which went unheard when it was built because the row that leads to it played and the
 * scene did not. Every row that goes to a node with an opening now says that opening after its reply.
 */
test('every row that goes to a node with an opening says the opening after its own reply, once where the node says once', async () => {
  const content = await loadContent(fsReader);
  let checked = 0;
  for (const [treeId, tree] of content.dialogue) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      for (const option of node.options) {
        const target = option.goto ? tree.nodes[option.goto] : undefined;
        if (!target?.opening?.length || option.ends) continue;
        const state = new GameState(content, new MemoryStorage());
        // The row as offered: its own gate made true, then the conversation stood on its node.
        for (const [flag, want] of Object.entries(option.when ?? {})) {
          if (typeof want === 'boolean' || typeof want === 'number') state.flags.set(flag, want);
          else if (want && typeof want === 'object' && 'atLeast' in want) state.flags.set(flag, (want as { atLeast: number }).atLeast);
        }
        state.dialogue.restore({}, { tree: treeId, node: nodeId });
        const said = state.dialogue.select(option.id);
        const lines = [said.say, ...said.rest.map((line) => line.line)];
        for (const line of target.opening) {
          assert.ok(lines.includes(line.line), `${treeId} ${nodeId}/${option.id} goes to ${option.goto} and never says "${line.line}"`);
        }
        assert.equal(state.dialogue.positionSnapshot().node, option.goto);
        if (target.openingOnce) assert.equal(state.flags.get(target.openingOnce), true, `${option.goto}'s opening is not marked heard`);
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 4, `only ${checked} rows lead to a node with an opening`);
});
