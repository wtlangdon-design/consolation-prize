import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * A LINE IS TRUE ON THE NIGHT IT CAN FIRST BE READ (doc 59 §11; errata 172, doc 99 step 3). Tyler, 2026-11-07:
 * "Thad wouldn't know that the guy leaving town tomorrow said last week that he was leaving tomorrow. Thad just
 * arrived in town." The audit then found the Nugget's mirror saying he had been robbed, the Company's map calling
 * a claim his and the claims road quoting a deed, all readable before Vessel had sold him anything.
 *
 * The rooms in tests/data/first-night-rooms.json are open before the swindle. No line in them that is not gated
 * may speak of the swindle or of what it gives him: a deed, a claim of his own, the raccoon in it.
 */
const SPENT = /\b((?:been|was|got|I.m) robbed|swindl\w*|my claim|my deed|the deed says|the raccoon|raccoon.s|my raccoon)\b/i;

type Rule = { when?: unknown; say?: string | string[]; then?: string[]; repeat?: (string | { say?: string })[] };
const rooms = (JSON.parse(readFileSync(new URL('./data/first-night-rooms.json', import.meta.url), 'utf8')) as { rooms: string[] }).rooms;

test('no ungated line in a room open before the swindle assumes it has happened', () => {
  const faults: string[] = [];
  for (const file of rooms) {
    const room = JSON.parse(readFileSync(new URL(`../content/rooms/${file}.json`, import.meta.url), 'utf8')) as
      { id: string; hotspots?: { id: string; when?: unknown; responses?: Record<string, Rule | Rule[]> }[]; exits?: { id: string; when?: unknown; responses?: Record<string, Rule | Rule[]> }[] };
    for (const target of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      if (target.when) continue;
      for (const [verb, rules] of Object.entries(target.responses ?? {})) {
        for (const rule of Array.isArray(rules) ? rules : [rules]) {
          if (!rule || typeof rule !== 'object' || rule.when) continue;
          const said = [rule.say ?? [], rule.then ?? [], (rule.repeat ?? []).map((r) => (typeof r === 'string' ? r : r.say ?? ''))].flat(2);
          for (const line of said) if (typeof line === 'string' && SPENT.test(line)) faults.push(`${room.id}/${target.id} ${verb}: ${line}`);
        }
      }
    }
  }
  assert.deepEqual(faults, []);
});
