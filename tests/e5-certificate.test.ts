import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: E5

/**
 * THE OBITUARY IS ASKED FOR WITH THE DEATH IN HAND (errata 274; doc 124, proposal 1).
 *
 * Doc 124 found E5 the weakest step in the game's longest stretch of paperwork: after the death is recorded, the
 * obituary came from the next TALK TO the printer, and the certificate in Thad's pocket was never used on anyone
 * but a counter. Tyler, 2026-11-10: "You decide". Now the certificate on Frame opens FRA_E1, as the log on Winnie
 * opens WIN_B2 (C5). TALK TO still opens it. The continuous playthrough (tests/data/full-game-walkthrough.json, E5.4)
 * plays it this way.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

const inPrintShop = async (flags: Record<string, boolean>) => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const pair = content.combinations.pairs.find((one) => one.item === 'death_certificate' && one.opensNode === 'FRA_E1');
  assert.ok(pair, 'doc 24 pairs the death certificate with the printer');
  const fixture = [...content.fixtures.values()].find((one) => one.room === pair.room);
  assert.ok(fixture, 'a fixture in the print shop');
  assert.ok(state.applyFixture({ ...fixture, flags: { ...fixture.flags, ...flags } }));
  return state;
};

test('the death certificate on Frame opens the obituary between the recorded death and the obituary, and not otherwise', async () => {
  const live = await inPrintShop({ T_DECEASED: true, T_OBITUARY: false });
  const pair = live.evidencePairFor('death_certificate', 'frame', 'GIVE');
  // Errata 282: handed over, as Monkey Island's were. USE THE CERTIFICATE ON FRAME is the certificate's pool.
  assert.equal(live.evidencePairFor('death_certificate', 'frame', 'USE'), null, 'USE does not hand it over');
  assert.ok(pair, 'with the death recorded, the certificate on Frame does nothing');
  assert.equal(pair.opens, 'FRAME');
  assert.equal(pair.opensNode, 'FRA_E1');
  assert.equal(pair.completes, undefined, 'the pair completes E5 itself: FRA_E1 option 1 is what does');
  assert.equal((await inPrintShop({ T_DECEASED: false })).evidencePairFor('death_certificate', 'frame', 'GIVE'), null, 'live before the death is recorded');
  assert.equal((await inPrintShop({ T_DECEASED: true, T_OBITUARY: true })).evidencePairFor('death_certificate', 'frame', 'GIVE'), null, 'live again after the obituary');
});

test('showing it keeps it: the county wants it at the end', async () => {
  const state = await inPrintShop({ T_DECEASED: true, T_OBITUARY: false });
  const pair = state.evidencePairFor('death_certificate', 'frame', 'GIVE')!;
  state.commitEvidence(pair);
  assert.ok(!(pair.set && 'T_OBITUARY' in pair.set), 'showing it writes the obituary without the conversation');
});
