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
  // Errata 308 (no parentheticals): the Colonel hands the map over in words, as Monkey Island would, not in a printed direction.
  'FAN_A1/fanshawe1': 'the reply names it: "Take a map of the district, with my compliments."',
  'FAN_A1/fanshawe2': 'the reply names it: "Take a map of the district all the same."',
  // Errata 313 (Act II, no parentheticals): she runs it in a pause, not a printed direction, and hands it over in words.
  // Errata 314 (Acts III and IV, no parentheticals): the hand-over is said, in the giver's own few words.
  'HOB_E6/hob1': 'the reply names it: "Signed. Form 31-E."',
  'PRA_E3/pratt_e3_2': 'the reply names it: "Hen."',
  'WIN_B2/winnie1': 'the reply names it: "Your assay.", and Thad names it again: "Then there\'s no Document B."',
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
  // The map as it once arrived, under a node id no exception names (the real one now hands it over in words).
  const old = [{ id: 'T', nodes: { FAN_X1: { options: [{ id: 'fanshawe1', gives: ['company_map'], say: 'x' }] } } }];
  assert.equal(bareGifts(old).length, 1);
});
