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
        if (!stays.has(option.id) || option.afterUse !== 'retain' || !['TOPIC', 'COMIC'].includes(option.tag)) continue;
        assert.ok(option.repeat || option.repeats?.length, `${tree.id}/${option.id} stays, and says something new the second time`);
      }
    }
  }
});

test('the map seller opens short, and digging waits for "not been disproved"', () => {
  const tree = trees.find((one) => one.id === 'amb_map_seller');
  const options = tree.nodes.root.options;
  // Read by what it says, not its number (errata 286 rewrote the tree): the digging waits for "Do they work?".
  const dig = options.find((one) => /dug/.test(one.text));
  const work = options.find((one) => one.text === 'Do they work?');
  assert.deepEqual(dig.after, [work.id]);
  assert.ok(options.indexOf(dig) > options.indexOf(work), 'listed after what raises it');
});

test('every keeper doc 126 quotes is the second answer its row gives (Tyler, 2026-11-11: "Yes")', () => {
  const keepers = [...doc.matchAll(/^- `([^`]+)`(?: in `([^`]+)`)? stays — "([^"]+)"/gm)];
  assert.ok(keepers.length >= 30, 'the keepers are listed');
  const text = (value) => (typeof value === 'string' ? value : value?.line ?? value?.say ?? (value?.exchange ?? []).map(text).join(' '));
  for (const [, id, node, quote] of keepers) {
    const rows = trees.flatMap((tree) => Object.entries(tree.nodes).filter(([name]) => !node || name === node)
      .flatMap(([, body]) => (body.options ?? []).filter((option) => option.id === id)));
    assert.ok(rows.length > 0, `${id}${node ? ` in ${node}` : ''} exists`);
    for (const row of rows) {
      assert.equal(row.afterUse, 'retain', `${id} stays on the list`);
      const second = [row.repeat, ...(row.repeats ?? [])].flat().map(text).join(' ');
      assert.ok(second.includes(quote.replace(/^"|"$/g, '')), `${id}'s second answer is the keeper quoted: ${quote}`);
    }
  }
});
