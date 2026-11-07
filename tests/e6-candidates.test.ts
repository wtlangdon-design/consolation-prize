/**
 * EVERY CANDIDATE DOC 57 E6 REFUSES IS ASKABLE (errata 125; the fairness
 * audit: E6 was "an elimination puzzle with nothing to eliminate"). Doc 57
 * writes five refusals under the interest rule; two shipped, and the other
 * three waited for rooms that have since been built. Every person doc 57
 * answers on THE EXECUTOR'S FORM, other than the registrar who accepts it,
 * has a pair.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

test('doc 57 E6\'s refusals are all wired', () => {
  const doc = readFileSync(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
  const section = doc.slice(doc.indexOf('## E6 '), doc.indexOf('## E7 '));
  const asked = new Set([...section.matchAll(/^> \*\*([A-Z' -]+)\*\* · USE THE EXECUTOR'S FORM(?:,|\s—)/gm)].map((m) => m[1]!.trim()));
  const combinations = JSON.parse(readFileSync(resolve(ROOT, 'content/combinations.json'), 'utf8'));
  const refusals = combinations.pairs.filter((pair: { item: string; puzzle: string; rules?: { set?: unknown }[] }) => pair.item === 'executor_form' && pair.puzzle === 'E6'
    && !(pair.rules ?? []).some((rule) => rule.set));
  assert.ok(asked.size >= 6, `doc 57 E6 asks ${asked.size} people`);
  assert.equal(refusals.length, asked.size - 1, 'every refusal but the registrar\'s acceptance is a pair');
});
