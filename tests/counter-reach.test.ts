import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

/**
 * A COUNT THAT A GATE WAITS FOR CAN BE MADE (errata 184). A conversation's payoff waited for a counter to reach
 * five; the documents wrote five things that count, and only two were ever offered, so it could never open and
 * no check noticed for a week -- the gate's flag had writers, which is all the flag checks asked. Now: wherever
 * content waits for a counter to reach N, the things that add to it must be able to add N. A writer that can be
 * used again (any option not removed after use, or anything that is not a dialogue option) counts as unbounded.
 */
type Json = unknown;
const ROOT = new URL('../content/', import.meta.url);

function files(dir: URL): URL[] {
  return readdirSync(dir).flatMap((name) => {
    const at = new URL(name, dir);
    if (statSync(at).isDirectory()) return files(new URL(`${name}/`, dir));
    return name.endsWith('.json') ? [at] : [];
  });
}

const writers = new Map<string, { once: number; unbounded: boolean }>();
const gates: { flag: string; atLeast: number; where: string }[] = [];

function walk(value: Json, where: string): void {
  if (Array.isArray(value)) { value.forEach((one) => walk(one, where)); return; }
  if (!value || typeof value !== 'object') return;
  const node = value as Record<string, Json>;
  const isOption = typeof node.text === 'string' && typeof node.tag === 'string';
  const add = node.add as Record<string, number> | undefined;
  if (add && typeof add === 'object') {
    for (const [flag, by] of Object.entries(add)) {
      if (typeof by !== 'number' || by <= 0) continue;
      const tally = writers.get(flag) ?? { once: 0, unbounded: false };
      if (isOption && node.afterUse === 'remove') tally.once += by;
      else tally.unbounded = true;
      writers.set(flag, tally);
    }
  }
  for (const key of ['when', 'whenAny']) {
    const conditions = ([] as Json[]).concat(node[key] ?? []);
    for (const condition of conditions) {
      if (!condition || typeof condition !== 'object') continue;
      for (const [flag, test] of Object.entries(condition as Record<string, Json>)) {
        const atLeast = (test as { atLeast?: number } | null)?.atLeast;
        if (typeof atLeast === 'number') gates.push({ flag, atLeast, where });
      }
    }
  }
  for (const [key, child] of Object.entries(node)) {
    if (key !== 'when' && key !== 'whenAny') walk(child, where);
  }
}

for (const file of files(ROOT)) {
  walk(JSON.parse(readFileSync(file, 'utf8')) as Json, file.pathname.split('/content/')[1] ?? file.pathname);
}

test('every counter a gate waits for can reach what it waits for', () => {
  const short: string[] = [];
  for (const gate of gates) {
    const tally = writers.get(gate.flag);
    // Counters written by the engine or by a set, not by an add, are not this test's (ACT, the duels' tallies).
    if (!tally || tally.unbounded) continue;
    if (tally.once < gate.atLeast) short.push(`${gate.where}: waits for ${gate.flag} >= ${gate.atLeast}; only ${tally.once} can be added`);
  }
  assert.deepEqual(short, [], short.join('\n'));
});

test('the test sees a counter with a one-shot writer at all', () => {
  assert.ok([...writers.values()].some((one) => one.once > 0 && !one.unbounded), 'no one-shot counter was found, so the test would pass on anything');
});
