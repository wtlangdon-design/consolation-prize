import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * THE PILOT ROOM's ENGINE ADDITIONS, asserted against the shipped content.
 *
 * A tree may open on a different node per act (`entries`); an option may be
 * gated on a flag; a hotspot may exist only in some acts. Asserted with the
 * pilot room's real data, READ FROM THE CONTENT rather than spelled here:
 * the engine must not know the fiction, and neither may its tests. The
 * room, its tree and the flags are all discovered from the manifest.
 */
const PILOT_ROOM = 'assay_office';

/** The pilot room's ambient character and the tree she opens, from content. */
async function pilot() {
  const content = await loadContent(fsReader);
  const room = content.rooms.get(PILOT_ROOM)!;
  const npc = content.ambient.get(room.ambient![0]!)!;
  const tree = content.dialogue.get(npc.tree)!;
  return { content, room, npc, tree };
}

test('a tree with entries opens on its start node with nothing set, and on the entry node once its flag holds', async () => {
  const { content, tree } = await pilot();
  const state = new GameState(content, new MemoryStorage());
  assert.ok((tree.entries?.length ?? 0) > 0, 'the pilot tree declares entries');
  state.dialogue.start(tree.id);
  assert.equal(state.dialogue.activeTreeId, tree.id);
  assert.ok((state.dialogue.currentNode?.prompt?.length ?? 0) > 0, 'the start node has its opening line');
  const startOptions = state.dialogue.presentOptions().map((entry) => entry.option.id);
  assert.deepEqual(startOptions, tree.nodes[tree.start]!.options
    .filter((option) => !option.when).map((option) => option.id), 'the ungated start options, in order');
  state.dialogue.end();

  // The LAST entry is the earliest act's; its flag alone must open its node.
  const entry = tree.entries![tree.entries!.length - 1]!;
  for (const [flag, value] of Object.entries(entry.when ?? {})) state.flags.set(flag, value as boolean);
  state.dialogue.start(tree.id);
  const opened = state.dialogue.presentOptions().map((e) => e.option.id);
  const wanted = tree.nodes[entry.node]!.options.filter((o) => !o.when).map((o) => o.id);
  assert.deepEqual(opened, wanted, `opens on ${entry.node} once ${Object.keys(entry.when ?? {}).join(', ')} holds`);
  state.dialogue.end();
});

test('a gated option in the start node is absent before its flag and present after -- both sides', async () => {
  const { content, tree } = await pilot();
  const state = new GameState(content, new MemoryStorage());
  const gated = tree.nodes[tree.start]!.options.find((option) => option.when);
  assert.ok(gated, 'the start node has a gated option');
  const [flag] = Object.keys(gated!.when!);
  state.dialogue.start(tree.id);
  assert.ok(!state.dialogue.presentOptions().some((e) => e.option.id === gated!.id), 'absent before the flag');
  state.dialogue.end();
  state.flags.set(flag!, true);
  state.dialogue.start(tree.id);
  assert.ok(state.dialogue.presentOptions().some((e) => e.option.id === gated!.id), 'present after it');
  state.dialogue.end();
});

test('an act-gated hotspot exists inside its acts and not outside them', async () => {
  const { content, room } = await pilot();
  const state = new GameState(content, new MemoryStorage());
  const bench = room.hotspots.find((hotspot) => (hotspot as { act?: string }).act)!;
  assert.ok(bench, 'the pilot room has an act-gated hotspot');
  assert.deepEqual(bench.when, { ACT: { atLeast: 2, atMost: 4 } });
  assert.equal(state.flags.test(bench.when), false, 'ACT starts at 1');
  state.flags.set('ACT', 2);
  assert.equal(state.flags.test(bench.when), true);
  state.flags.set('ACT', 5);
  assert.equal(state.flags.test(bench.when), false, 'and it is gone again past act 4');
});
