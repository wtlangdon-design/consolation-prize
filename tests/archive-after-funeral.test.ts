/**
 * THE ARCHIVE WAITS FOR THE FUNERAL (errata 124; the fairness audit). Doc 02
 * makes E9 depend on E8 -- Hob digs Thad out, then the archive. Gated on the
 * executor alone, the door opened straight after Sump's "Accepted.", and a
 * player could compare the hands and hear the confession before the funeral:
 * Act IV would open with the coffin, invariant 2's scene, never played.
 */
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

async function at(flags: Record<string, boolean | number>) {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.applyFixture({ id: 'x', label: 'x', room: 'claims_registrar', flags: { ACT: 3, ...flags }, inventory: [] });
  return state;
}

test('the archive door does not open for the executor before the funeral', async () => {
  const early = await at({ T_EXECUTOR_NAMED: true });
  const before = early.interact(early.findTarget('sealed_archive_door')!, 'OPEN');
  assert.notEqual(before.goesTo, 'archive', 'executor named, funeral not done: the door stays shut');
  const late = await at({ T_EXECUTOR_NAMED: true, T_FUNERAL_DONE: true });
  const after = late.interact(late.findTarget('sealed_archive_door')!, 'OPEN');
  assert.equal(after.goesTo, 'archive', 'after the funeral the executor goes in');
});
