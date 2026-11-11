/**
 * CONVERSATIONS AS MONKEY ISLAND RAN THEM (errata 280, doc 126; Tyler,
 * 2026-11-11: "I want it to be exactly like MI"). A question asked is a
 * question gone, unless it ends the conversation, was written to come back
 * (counted-repeat, rephrase, replace), or doc 126 names it as one that stays.
 * Proved against the defect: the trees as they were (TOPIC and COMIC rows
 * retained, greyed) fail the first test on 230 rows.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const doc = readFileSync(new URL('../docs/126-conversations-as-monkey-island-ran-them.md', import.meta.url), 'utf8');
const stays = new Set([...doc.matchAll(/^- `([^`]+)`(?: in `([^`]+)`)? stays\b/gm)].map((m) => m[1]));
const trees = readdirSync(new URL('../content/dialogue/', import.meta.url))
  .map((file) => JSON.parse(readFileSync(new URL(`../content/dialogue/${file}`, import.meta.url), 'utf8')))
  .filter((tree) => tree.nodes && !['LETTERS_HOME', 'harness_tree'].includes(tree.id));

test('a TOPIC or COMIC question, once asked, is gone unless it was written to come back', () => {
  const kept = [];
  for (const tree of trees) {
    for (const [node, body] of Object.entries(tree.nodes)) {
      for (const option of body.options ?? []) {
        if (!['TOPIC', 'COMIC'].includes(option.tag) || option.ends || option.end) continue;
        if (['remove', 'counted-repeat', 'rephrase', 'replace'].includes(option.afterUse)) continue;
        if (option.afterUse === 'retain' && stays.has(option.id)) continue;
        kept.push(`${tree.id}/${node}/${option.id} (${option.afterUse ?? 'unset'})`);
      }
    }
  }
  assert.deepEqual(kept, []);
});

test('every question doc 126 keeps on purpose has a second answer to give', () => {
  for (const tree of trees) {
    for (const body of Object.values(tree.nodes)) {
      for (const option of body.options ?? []) {
        if (!stays.has(option.id) || option.afterUse !== 'retain') continue;
        assert.ok(option.repeat || option.repeats?.length, `${tree.id}/${option.id} stays, and says something new the second time`);
      }
    }
  }
});

test('the map seller opens short, and digging waits for "not been disproved"', () => {
  const tree = trees.find((one) => one.id === 'amb_map_seller');
  const options = tree.nodes.root.options;
  const dig = options.find((one) => one.id === 'map_seller3');
  assert.deepEqual(dig.after, ['map_seller6']);
  assert.ok(options.indexOf(dig) > options.findIndex((one) => one.id === 'map_seller6'), 'listed after what raises it');
});
