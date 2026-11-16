/**
 * ONE "NOTHING." A ROOM (errata 343; Tyler, 2026-11-15, the hotel lobby sample: "Approve it all").
 *
 * The Act I review's dialogue editor counted "Nothing." as the game's most repeated line: the lobby alone answered
 * LISTEN with it seventeen times. A silent object is given a small real sound instead, and a room keeps one "Nothing."
 * for the object that has earned it. This is a ratchet: a room goes on the list when its lines have had the pass, and
 * no room on the list may slip back. Proved against the defect: on main before errata 343 the lobby fails with 17.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const PASSED = { 'hotel-lobby': 'errata 343' };
const BARE = /^(Still nothing|Nothing at all|Nothing)[.,]? ?(?=$|[A-Z])/;

test('a room that has had the voice pass answers LISTEN with one "Nothing." at most', () => {
  for (const [file, ruling] of Object.entries(PASSED)) {
    const room = JSON.parse(readFileSync(new URL(`../content/rooms/${file}.json`, import.meta.url), 'utf8'));
    const seen = new Set();
    for (const target of [...room.hotspots, ...(room.exits ?? [])]) {
      if (target.stateOf) continue;
      for (const rule of target.responses?.LISTEN_TO ?? []) {
        for (const line of [rule.say, ...(rule.repeat ?? [])]) if (typeof line === 'string' && BARE.test(line)) seen.add(`${target.id}: ${line}`);
      }
    }
    assert.ok(seen.size <= 1, `${file} (${ruling}) has ${seen.size} bare "Nothing." lines: ${[...seen].join(' / ')}`);
  }
});
