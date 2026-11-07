/**
 * THE LAST LETTER IS NOT READ BEFORE IT IS TRUE (errata 124; the bookends
 * audit). Doc 04's Act IV letter -- "The gold is real. The story is better." --
 * was the Room 19 letter's USE for the whole of Act IV, and Act IV opens in
 * Room 19 before any gold is found. A player who had used the letters in every
 * act read the ending in its first minute, and heard it again at the coach stop.
 *
 * Every response anywhere in a room that says the gold is real waits on the
 * strike (T_STRIKE_FOUND, F3).
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

type Rule = { when?: Record<string, unknown>; say?: string; then?: unknown[] };

test('no room says "The gold is real" before the strike is found', () => {
  const offenders: string[] = [];
  for (const name of readdirSync(resolve(ROOT, 'content/rooms'))) {
    if (!name.endsWith('.json')) continue;
    const room = JSON.parse(readFileSync(resolve(ROOT, 'content/rooms', name), 'utf8'));
    for (const hotspot of room.hotspots ?? []) {
      for (const [verb, rules] of Object.entries(hotspot.responses ?? {})) {
        for (const rule of (rules as Rule[]) ?? []) {
          if (!JSON.stringify([rule.say, rule.then]).includes('The gold is real')) continue;
          if (rule.when?.T_STRIKE_FOUND !== true) offenders.push(`${room.id}/${hotspot.id}/${verb}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], 'the last letter says the gold is real; it waits for T_STRIKE_FOUND');
});

test('in Act IV before the strike, the letter answers with one of its own lines', () => {
  const room = JSON.parse(readFileSync(resolve(ROOT, 'content/rooms/thads-room.json'), 'utf8'));
  const letters = room.hotspots.find((one: { id: string }) => one.id === 'letters_home');
  const use: Rule[] = letters.responses.USE;
  const early = use.find((rule) => rule.when?.ACT === 4 && rule.when?.T_STRIKE_FOUND === undefined);
  assert.ok(early, 'Act IV has an answer before the strike');
  const own = letters.responses.LOOK_AT.find((rule: Rule & { repeat?: string[] }) => !rule.when);
  assert.ok([own.say, ...(own.repeat ?? [])].includes(early.say), 'and it is one of the letter\'s own written lines');
});
