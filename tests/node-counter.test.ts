import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { counterReading, priceText } from '../engine/core/NodeCounter.ts';
import type { DialogueNode, FlagValue } from '../engine/core/types.ts';

/**
 * A NODE'S RUNNING TOTAL (doc 04's live price counter; errata 75, 189). Every node that keeps one
 * reads a number flag the node itself adds to, prices it from figures the extractor read out of
 * the documents, stops on a flag one of its own options sets, and is drawn with labels from
 * content/ui/ui.json.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const manifest = read('content/manifest.json') as { dialogue: string[]; ui: string };
const flags = new Map((read('content/flags/flags.json').flags as { id: string; type: string }[]).map((f) => [f.id, f]));

const counted = manifest.dialogue.flatMap((path) => Object.entries(read(path).nodes as Record<string, DialogueNode>)
  .filter(([, node]) => node.counter).map(([id, node]) => ({ path, id, node })));

test('at least one node keeps a running total, and the panel says how to draw it', () => {
  assert.ok(counted.length >= 1);
  const place = read(manifest.ui).nodeCounter;
  assert.ok(place?.countLabel && place?.priceLabel && place?.currency && place?.at?.length === 2);
});

for (const { path, id, node } of counted) {
  test(`${path} ${id}: the counter is a number its options add to, and stops on a flag they set`, () => {
    const spec = node.counter!;
    assert.equal(flags.get(spec.counter)?.type, 'number', `${spec.counter} is not a number flag`);
    assert.ok(node.options.some((o) => (o as { add?: Record<string, number> }).add?.[spec.counter]), 'nothing in the node adds to it');
    assert.ok(node.options.some((o) => o.set?.[spec.stopsOn] === true), 'nothing in the node settles it');
    assert.ok(spec.perUnit > 0 && spec.minimum > 0);
  });
}

test('the reading: nothing at the opening, the rate per unit while it runs, the minimum once settled', () => {
  const node = { options: [], counter: { counter: 'C', perUnit: 2, minimum: 0.5, stopsOn: 'S' } } as unknown as DialogueNode;
  const at = (values: Record<string, FlagValue>) => counterReading(node, (id) => values[id] ?? false);
  assert.deepEqual(at({}), { count: 0, price: 0, stopped: false });
  assert.deepEqual(at({ C: 4 }), { count: 4, price: 8, stopped: false });
  assert.deepEqual(at({ C: 4, S: true }), { count: 4, price: 0.5, stopped: true });
  assert.equal(counterReading({ options: [] } as unknown as DialogueNode, () => false), null);
  assert.equal(counterReading(null, () => false), null);
  assert.equal(priceText(8), '8');
  assert.equal(priceText(0.5), '0.50');
});
