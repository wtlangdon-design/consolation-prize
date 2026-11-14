import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

/**
 * A GIFT IS SEEN BEING GIVEN (errata 228). The playthrough found "Keep it. I have dozens." said of an object
 * nobody had seen, and a map in the inventory that no line handed over: doc 57's knocked glass and doc 04's
 * map were written and not played. Every dialogue option that gives an item carries a performed direction in
 * its exchange, or is listed here with the reason its words already hand the thing over.
 */
/**
 * Tuned (errata 314's review): since doc 130 nothing is printed, so a gift is handed over in words far more often
 * than in a pose. A reply that says the item's name (a word of it, as "map", "Hen.", "Form 31-E", "Document B") is
 * named in speech without an entry; the list holds only the gifts whose words hand them over without the name.
 */
const NAMED_IN_SPEECH = {
  'LIV_A1/livery_man5': 'the reply is about the blanket in his hand, asked for by name in the option',
  'SHE_D1/sheng2': 'the reply names the sum, and the sum is the item',
};

const STOP = new Set(['the', 'and', 'of', 'my', 'mr', 'mrs', 'his', 'her', 'a', 'an', 'in', 'to', 's']);
const itemsDir = new URL('../content/items/', import.meta.url);
const ITEM_WORDS = new Map(readdirSync(itemsDir).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, itemsDir), 'utf8')))
  .map((item) => [item.id, String(item.name ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w))]));

/** The words of a reply, as said: its own line and every line of its exchange. */
const said = (option) => [option.say, ...(option.exchange ?? []).map((line) => line.line)].filter(Boolean).join(' ').toLowerCase();

export function namedInSpeech(option) {
  const words = said(option);
  return (option.gives ?? []).every((id) => (ITEM_WORDS.get(id) ?? []).some((w) => new RegExp(`\\b${w}\\b`).test(words)));
}

export function bareGifts(trees) {
  const bare = [];
  for (const tree of trees) {
    for (const [nodeId, node] of Object.entries(tree.nodes ?? {})) {
      for (const option of node.options ?? []) {
        if (!option.gives?.length) continue;
        const staged = (option.exchange ?? []).some((line) => line.direction);
        if (!staged && !namedInSpeech(option) && !NAMED_IN_SPEECH[`${nodeId}/${option.id}`]) bare.push(`${tree.id}/${nodeId}/${option.id} gives ${option.gives.join(', ')}`);
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

test('a reply that says the item\'s name hands it over; one that does not, does not', () => {
  const tree = (say) => [{ id: 'T', nodes: { X: { options: [{ id: 'o', gives: ['hen'], say }] } } }];
  assert.equal(bareGifts(tree('Hen.')).length, 0, 'the hen, named');
  assert.equal(bareGifts(tree('Here.')).length, 1, 'something, unnamed');
});
