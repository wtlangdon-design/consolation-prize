/**
 * A PAIR OUT OF STATE DOES NOT SAY ITS SUCCESS (errata 124; the fairness
 * audit, A7). Fourteen pairs are only cases -- each line waits on a state --
 * and their pair-level `say` is a copy of the first case's success line. When
 * no case held, the engine spoke that line and did nothing: the filing fee
 * offered to Ozymandia before she had named her price answered "That was the
 * filing fee. It is now a divining fee." while taking nothing and setting
 * nothing, and the player believed he had paid. Out of state, a pair of cases
 * now yields to the item's pool, as `otherwise: "pool"` always did.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { Interactable } from '../engine/core/types.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('a pair whose cases do not hold never speaks a case\'s line', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const wrong: string[] = [];
  let checked = 0;
  for (const pair of content.combinations?.pairs ?? []) {
    const cases = pair.rules ?? [];
    if (!cases.length || cases.some((one) => !one.when)) continue;
    const said = state.verbs.resolveWith('USE', pair.item, { id: pair.target } as Interactable, pair.room, []);
    const lines = new Set(cases.map((one) => one.say));
    // A fresh game holds no flags; where a case still holds (it waits on a
    // flag being false), the case answering is right.
    const holds = cases.some((one) => Object.entries(one.when ?? {}).every(([, v]) => v === false || (typeof v === 'object' && v !== null)));
    if (holds) continue;
    checked += 1;
    if (said.say && lines.has(said.say)) wrong.push(`${pair.item} on ${pair.target} (${pair.puzzle}): "${said.say.slice(0, 50)}"`);
  }
  assert.ok(checked > 5, `checked ${checked} pairs out of state`);
  assert.deepEqual(wrong, [], 'out of state, the success line is spoken with nothing done');
});
