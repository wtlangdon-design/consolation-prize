// THE MENU SHOWS THE FIRST SENTENCE; THAD SAYS THE WHOLE LINE (errata 292).
//
// Tyler, 2026-11-11, on the driver's menu showing the whole of a line Thad was
// about to say: "In MI, it didn't reveal the whole line of text in the dialogue
// menu right?" He chose "Tales style: first sentence, then more". The rule is
// tools/lib/menu-line.mjs, applied by extract-content's write(); this holds
// the content to it, so a tree extracted without it fails here.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { firstSentence, keepsWholeLine, menuFirstSentence, menuLine } from '../tools/lib/menu-line.mjs';

const DIR = new URL('../content/dialogue/', import.meta.url);
const trees = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')));

function* options() {
  for (const tree of trees) {
    const nodes = Array.isArray(tree.nodes) ? tree.nodes : Object.values(tree.nodes ?? {});
    for (const node of nodes) for (const option of node.options ?? []) yield { tree, node, option };
  }
}

test('a sentence ends where a sentence ends, not at a title or an initial', () => {
  assert.equal(firstSentence("I'm expected by a Mr. Ezra Pike. He wrote to me."), "I'm expected by a Mr. Ezra Pike.");
  assert.equal(firstSentence('Purely as a matter of business. Nothing more.'), 'Purely as a matter of business.');
  assert.equal(firstSentence('J. P. Grubb, of Providence. Musician.'), 'J. P. Grubb, of Providence.');
  assert.equal(firstSentence('“Gold?” he said. Well.'), '“Gold?” he said.', 'a question in quotes, then who asked it');
  assert.equal(firstSentence('One sentence only.'), 'One sentence only.');
});

test('a greeting alone does not say what the choice is, so it brings its sentence', () => {
  assert.equal(menuLine('Madame! Might I trouble you for a room?'), 'Madame! Might I trouble you for a room?');
  assert.equal(menuLine("How do you do! I'd like to have some soil assayed, please."),
    "How do you do! I'd like to have some soil assayed, please.");
  assert.equal(menuLine('How much? I ask purely as a matter of business.'), 'How much?');
});

test('the Liar\'s Assay, pool exits and lines that already say something else keep the whole line', () => {
  const tree = {
    id: 'T',
    nodes: [{ options: [
      { id: 'a', tag: 'ASSAY', text: 'I once tuned a cathedral. In an afternoon.' },
      { id: 'b', universal: true, text: 'Good day. I have business.' },
      { id: 'c', echo: 'Something else entirely.', text: 'Two. Sentences.' },
      { id: 'd', tag: 'COMIC', text: 'I have a death to record. Mine.' },
    ] }],
  };
  menuFirstSentence(tree);
  const [a, b, c, d] = tree.nodes[0].options;
  assert.equal(a.text, 'I once tuned a cathedral. In an afternoon.');
  assert.equal(a.echo, undefined);
  assert.equal(b.text, 'Good day. I have business.');
  assert.equal(c.text, 'Two. Sentences.');
  assert.equal(c.echo, 'Something else entirely.');
  assert.equal(d.text, 'I have a death to record.');
  assert.equal(d.echo, 'I have a death to record. Mine.', 'and Thad says the whole of it');
});

test('every menu in the game shows no more than its first sentence, and Thad still says the whole line', () => {
  let shortened = 0;
  for (const { tree, option } of options()) {
    if (typeof option.text !== 'string') continue;
    // An authored echo (doc 30 6.2) is what Thad says instead; the menu keeps the line as written.
    const authoredEcho = typeof option.echo === 'string' && !option.echo.startsWith(option.text);
    if (authoredEcho || keepsWholeLine({ ...option, echo: undefined }, tree.id)) continue;
    assert.equal(menuLine(option.text), option.text,
      `${tree.id} ${option.id}: the menu shows "${option.text}", more than its first sentence`);
    if (option.echo !== undefined) {
      assert.ok(option.echo.length > option.text.length, `${tree.id} ${option.id}: the echo is the longer line`);
      shortened += 1;
    }
  }
  assert.ok(shortened > 0, 'the rule shortened something');
});
