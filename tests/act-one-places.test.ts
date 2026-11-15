/**
 * THE TOWN, ONE NIGHT AT A TIME (errata 324; doc 133).
 *
 * Tyler, 2026-11-14: "I'm wondering if maybe the town is too open to start with too much to potentially do? Which
 * may leave the player feeling a bit aimless? ... I want there to also be some narrative structure where it feels like
 * a story is progressing vs feeling haphazard." About twenty-five places were open on Thad's first evening, and about
 * half had no part in Act I. He chose: open places as the story reaches them.
 *
 * Held here: on night one the map shows the town and the road to the claims (errata 30c's floor of two), and nothing
 * past them; each far place appears when its flag is written; and every one of those flags is written by the story,
 * so no place is shut for good (invariant 6).
 */
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
const content = await loadContent(fsReader);
const flags = JSON.parse(await readFile(resolve(ROOT, 'content/flags/flags.json'), 'utf8'));
const declared = new Map<string, { writtenBy?: string[] }>((flags.flags ?? flags).map((one: { id: string }) => [one.id, one]));

// What opens each place past the town, by the story's own flags.
const OPENS: Record<string, [string, unknown]> = {
  motts_site: ['T_BORDERS_MOTT', true],
  creek: ['ACT', 2],
  claim_row: ['ACT', 2],
  laundry: ['ACT', 2],
  high_ridge: ['ACT', 2],
  boarding_house_parlour: ['ACT', 2],
  bakehouse: ['ACT', 2],
  schoolhouse: ['ACT', 2],
};

function nightOne(extra: Record<string, unknown> = {}): GameState {
  const state = new GameState(content, new MemoryStorage());
  for (const [flag, value] of Object.entries({ T_THAD_LEAVING: true, T_SEEN_MAIN_STREET: true, T_SEEN_CLAIMS_ROAD: true, ...extra })) {
    state.flags.set(flag, value as never);
  }
  return state;
}
const onMap = (state: GameState) => { state.enterRoom('town_map'); return new Set(state.mapLocations.map((one) => one.location.room)); };

test('night one: the map shows the town, and nothing past it is on it', () => {
  const shown = onMap(nightOne());
  for (const room of Object.keys(OPENS)) assert.ok(!shown.has(room), `${room} is not on the map on night one`);
  assert.ok(shown.has('main_street') && shown.has('claims_road'), 'the town is, and the road he can see from it');
});

test('each far place goes on the map when the story writes its flag', () => {
  for (const [room, [flag, value]] of Object.entries(OPENS)) {
    const shown = onMap(nightOne({ [flag]: value }));
    assert.ok(shown.has(room), `${room} is on the map once ${flag} is ${String(value)}`);
  }
});

test('every flag that opens a place is written by the story, so nothing is shut for good', () => {
  for (const [flag] of Object.values(OPENS)) {
    assert.ok((declared.get(flag)?.writtenBy ?? []).length > 0, `${flag} is written somewhere in play`);
  }
});
