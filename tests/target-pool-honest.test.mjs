import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * A CATCH-ALL MUST NOT TALK THE PLAYER OUT OF THE ANSWER (errata 216). The Gulch's lookout is won by GIVING him
 * the Clarion. Anything else given to him was answered "Handing him things isn't helping." -- which tells the
 * player to stop trying the very verb that solves. A target's catch-all line answers the WRONG item; it may say
 * what the target wants, never that the verb itself is no use on it, when an item in its `except` list solves.
 */
const combinations = JSON.parse(readFileSync(new URL('../content/combinations.json', import.meta.url), 'utf8'));

const DISCOURAGES = /\b(isn't|is not|won't|will not|doesn't|does not)\s+(help|helping|work|working)\b|\bno use\b|\bpointless\b|\bnothing (I|you) (give|hand|use)\b/i;

export function discouragingLines(pools) {
  const found = [];
  for (const pool of pools ?? []) {
    if (!pool.except?.length) continue; // no item solves on this target, so "no use" would be true
    for (const line of pool.lines ?? []) {
      if (DISCOURAGES.test(line)) found.push(`${pool.room}/${pool.target} (${pool.verb}): "${line}"`);
    }
  }
  return found;
}

test("no target's catch-all says the verb is no use on a target that a listed item solves", () => {
  const found = discouragingLines(combinations.targetPools);
  assert.deepEqual(found, [], found.join('\n'));
});

test('the check catches the line errata 216 replaced', () => {
  const old = [{ room: 'gulch_tents', target: 'gulch_lookout', verb: 'USE', except: ['clarion', 'deed'],
    lines: ["He wants proof I own nothing. Handing him things isn't helping."] }];
  assert.equal(discouragingLines(old).length, 1);
});
