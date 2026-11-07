/**
 * THE QUIET MOMENTS OF THE ENDING (errata 135; the bookends audit, findings
 * 8, 9, 10 and 15).
 *
 * - The filing cut straight to the dawn with the held item and the sentence
 *   line carried over, and the four filed documents still in the inventory.
 * - Under click-to-read, a bare pause ("…", doc 58 rule 2) stood on screen
 *   as a floating ellipsis waiting for a click.
 *
 * Room 33's dimmed panel and beat 11's hidden panel are presentation, held by
 * the gauntlet and the errata; what can be held here is held here.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { DialoguePerformance, type HoldTiming } from '../engine/core/DialoguePerformance.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { isRest, waitsForClick } from '../engine/core/SpeechPolicy.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const FILED = ['deed', 'death_certificate', 'document_c', 'sample'];

test('the filing hands on to the dawn by a fade', async () => {
  const content = await loadContent(fsReader);
  const after = content.rooms.get('claims_registrar')?.afterTimeline;
  assert.equal(after?.goto, 'main_street_dawn');
  assert.equal(after?.fade, true, 'doc 48 S7 beat 1: fade up on the street');
  const timing = content.ui.timing;
  for (const key of ['roomFadeOutSeconds', 'roomFadeHoldSeconds', 'roomFadeInSeconds'] as const) {
    assert.ok((timing?.[key] ?? 0) > 0, key);
  }
});

test('the four filed documents leave the inventory once filed, and nothing is held into the dawn', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r7-f5')!), 'the filing fixture');
  for (const id of FILED) assert.ok(state.carried.includes(id), `${id} is carried before the filing`);
  state.holdItem('sample');
  state.flags.applyWrites({ T_FILED: true });
  for (const id of FILED) assert.ok(!state.carried.includes(id), `${id} is on file`);
  state.handOn(content.rooms.get('claims_registrar')!.afterTimeline!);
  assert.equal(state.roomId, 'main_street_dawn');
  assert.equal(state.heldItem, null, 'the held item does not carry into the dawn');
});

test('a bare pause is a rest: shown, never waiting for a click', () => {
  assert.equal(isRest('…'), true);
  assert.equal(isRest('...'), true);
  assert.equal(isRest('Stamp.'), false);
  assert.equal(waitsForClick({ conversation: true, clickToRead: true, rest: true }), false);
  assert.equal(waitsForClick({ conversation: true, clickToRead: true, rest: false }), true);
});

test('in a conversation read by click, a pause gives way on its hold and a line does not', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.dialogue.start('STAGE_DRIVER');
  const chosen = state.dialogue.presentOptions()[0]!;
  const exchange = state.dialogue.beginSelection(chosen.option.id);
  const timing: HoldTiming = { base: 0.45, perGlyph: 0.055, minimum: 1.8, maximum: 8, waitForClick: true };
  const rest = { speaker: 'stage_driver', line: '…' };
  const reply = { speaker: 'stage_driver', line: 'A reply.' };
  const performance = new DialoguePerformance(exchange, rest, [reply], timing, 0);
  assert.equal(performance.current, rest);
  assert.equal(performance.tick(10), true, 'the pause gives way by itself');
  assert.equal(performance.current, reply);
  assert.equal(performance.tick(100), false, 'the line waits for its click');
});
