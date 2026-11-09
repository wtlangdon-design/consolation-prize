import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

/**
 * A GIFT IS SEEN BEING GIVEN (errata 228). The playthrough found "Keep it. I have dozens." said of an object
 * nobody had seen, and a map in the inventory that no line handed over: doc 57's knocked glass and doc 04's
 * map were written and not played. Every dialogue option that gives an item carries a performed direction in
 * its exchange, or is listed here with the reason its words already hand the thing over.
 */
const NAMED_IN_SPEECH = {
  'FRA_E1/frame1': 'the reply names it: an obituary',
  'LIV_A1/livery_man5': 'the reply is about the blanket in his hand, asked for by name in the option',
  'SHE_D1/sheng2': 'the reply names the sum, and the sum is the item',
};

export function bareGifts(trees) {
  const bare = [];
  for (const tree of trees) {
    for (const [nodeId, node] of Object.entries(tree.nodes ?? {})) {
      for (const option of node.options ?? []) {
        if (!option.gives?.length) continue;
        const staged = (option.exchange ?? []).some((line) => line.direction);
        if (!staged && !NAMED_IN_SPEECH[`${nodeId}/${option.id}`]) bare.push(`${tree.id}/${nodeId}/${option.id} gives ${option.gives.join(', ')}`);
      }
    }
  }
  return bare;
}

const dir = new URL('../content/dialogue/', import.meta.url);
const trees = readdirSync(dir).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))).filter((t) => t.nodes);

test('every gift in a conversation is shown being given, or named as it is', () => {
  const bare = bareGifts(trees);
  assert.deepEqual(bare, [], bare.join('\n'));
});

test('the check catches the map that arrived unseen', () => {
  const old = [{ id: 'T', nodes: { FAN_A1: { options: [{ id: 'fanshawe1', gives: ['company_map'], say: 'x' }] } } }];
  assert.equal(bareGifts(old).length, 1);
});
