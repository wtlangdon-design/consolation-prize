import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

/**
 * A MAN WHO SAYS HIS LINES ONE AT A TIME (errata 184). Doc 04 wrote the night watchman's "Running" lines --
 * remarks made unprompted on his rounds, one at a time -- and errata 71 D gave them to the ambient layer; for
 * a week nothing said them, because a bark could only answer Thad's reputation, and he has none. A run is now
 * said on approach, one line a visit, in order, each once, counted in a flag so a save keeps its place.
 *
 * Read from the content, not named here: the figure is whoever carries a `barkRun`.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

async function onRounds() {
  const content = await loadContent(fsReader);
  const runner = [...content.ambient.values()].find((npc) => npc.barkRun);
  assert.ok(runner?.barkRun, 'nobody carries a run of lines');
  let state: GameState | undefined;
  for (const fixture of content.fixtures.values()) {
    if (fixture.room !== runner.room) continue;
    const trial = new GameState(content, new MemoryStorage());
    if (trial.applyFixture(fixture) && trial.flags.test(runner.barkRun.when)) { state = trial; break; }
  }
  assert.ok(state, `no fixture stands in ${runner.room} while the run is said`);
  state.enterRoom(runner.room);
  const layer = new AmbientLayer(state);
  layer.arrived();
  const here = layer.present.find((npc) => npc.id === runner.id);
  assert.ok(here, `${runner.id} is not on his rounds in ${runner.room}`);
  return { state, layer, here, run: runner.barkRun };
}

test('a run is said one line a visit, in order, each once, and counted', async () => {
  const { state, layer, here, run } = await onRounds();
  for (const [said, bark] of run.lines.entries()) {
    assert.equal(state.flags.getNumber(run.counter), said);
    const fired = layer.checkApproach(here.x, here.y);
    assert.equal(fired?.line, bark[0]?.line, `visit ${said + 1} says the run's line ${said + 1}`);
    if (bark.length > 1) assert.deepEqual(fired?.exchange, bark, 'a bark of several lines says them all, in order');
    assert.equal(layer.checkApproach(here.x, here.y), null, 'a second line in the same visit');
    layer.arrived();
  }
  assert.equal(state.flags.getNumber(run.counter), run.lines.length);
  assert.equal(layer.checkApproach(here.x, here.y), null, 'a line said twice, after the run is over');
});

test('nothing of the run is said where its condition does not hold, and nothing is counted', async () => {
  const { state, layer, here, run } = await onRounds();
  const later = Object.entries(run.when ?? {}).find(([, v]) => typeof v === 'object' && v !== null && 'atMost' in v);
  assert.ok(later, 'the run has no act it ends in');
  const [flag, limit] = later as [string, { atMost: number }];
  state.flags.set(flag, limit.atMost + 1);
  assert.equal(layer.checkApproach(here.x, here.y), null);
  assert.equal(state.flags.getNumber(run.counter), 0);
});

test("the run's counter is declared, as a number, written by the engine", async () => {
  const flags = JSON.parse(await readFile(resolve(ROOT, 'content/flags/flags.json'), 'utf8')) as
    { flags: { id: string; type: string; writtenBy?: string[] }[] };
  const content = await loadContent(fsReader);
  for (const npc of content.ambient.values()) {
    if (!npc.barkRun) continue;
    const flag = flags.flags.find((f) => f.id === npc.barkRun!.counter);
    assert.equal(flag?.type, 'number', `${npc.id}'s run counts in ${npc.barkRun.counter}, which is not a declared number`);
    assert.ok(flag.writtenBy?.some((w) => w.startsWith('engine:ambient:barkRun')), `${npc.barkRun.counter} names no writer`);
  }
});
