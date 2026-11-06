/**
 * THE TOWN HEARS ABOUT THAD (doc 06, the propagation engine; errata 116).
 *
 * Reputation was a number nothing ever raised: every townsperson said his
 * R_NOBODY line from the first night to the last, and 162 written barks were
 * eight-ninths unreachable. It is now the furthest state, in doc 07's order,
 * whose headline puzzle is complete. A save with no puzzle done is R_NOBODY;
 * each headline moves the town on; a puzzle further back in the order never
 * moves it back.
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

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

async function townAfter(puzzles: string[]) {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.applyFixture({ id: 'test', label: 'test', room: content.manifest.startRoom, flags: {},
    puzzles: Object.fromEntries(puzzles.map((id) => [id, 'complete'])) } as never);
  return { state, ambient: new AmbientLayer(state), content };
}

test('every reputation state after the first is set by a puzzle (doc 06)', async () => {
  const { content } = await townAfter([]);
  const { states, setBy } = content.reputation;
  assert.ok(setBy, 'content/reputation.json has no setBy: nothing can move the town');
  assert.deepEqual(states.slice(1).filter((state) => !setBy[state]), []);
});

test('the town moves with each headline, and never back', async () => {
  const { content } = await townAfter([]);
  const { states, setBy } = content.reputation;
  assert.equal((await townAfter([])).ambient.reputationState, 'R_NOBODY');
  for (const [at, state] of states.entries()) {
    if (at === 0) continue;
    const { ambient } = await townAfter([setBy![state]!]);
    assert.equal(ambient.reputationState, state, `${setBy![state]} complete should make the town ${state}`);
  }
  const later = (await townAfter([setBy!['R_BORDERS_MOTT']!, setBy!['R_SWINDLED']!])).ambient.reputationState;
  assert.equal(later, 'R_BORDERS_MOTT', 'an earlier headline after a later one does not move the town back');
});

test('a townsperson says the line for where the town has got to', async () => {
  const { content } = await townAfter([]);
  const states = content.reputation.states;
  const last = states[states.length - 2]!;
  const { ambient } = await townAfter([content.reputation.setBy![last]!]);
  const speaker = [...content.ambient.values()].find((npc) => npc.barks[last] && npc.barks[last] !== npc.barks[states[0]!]);
  assert.ok(speaker, `nobody has a ${last} line of his own`);
  assert.equal(ambient.barkFor(speaker), speaker.barks[last]);
});
