// THE SWITCH (errata 293). Tyler, 2026-11-11: "'you pick a bold line and he
// chickens out' -- this is the kind of stuff that made MI magical and unique!"
// The menu offers a bold line and Thad, who would apologise to a door, says a
// different one: the option's `echo` (doc 30 section 6.2), written in doc 07 as
// *Thad says:*. Doc 129 is the pass and its rules. This holds the game to them:
// a switch is only ever a [COMIC] option that does nothing, so the menu can
// never hide what a choice does; a person has at most one; and it keeps its own
// id, so adding one renumbers nothing.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DIR = new URL('../content/dialogue/', import.meta.url);
const trees = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')));

// The letters home choose a letter by its manner ("honest", "flattering") and the letter is what is said. That is
// not a switch; it is the letter-writing interface (invariant 10), and it is left alone.
const NOT_A_SWITCH = new Set(['LETTERS_HOME']);

function switches() {
  const out = [];
  for (const tree of trees) {
    if (NOT_A_SWITCH.has(tree.id)) continue;
    const nodes = Array.isArray(tree.nodes) ? tree.nodes : Object.values(tree.nodes ?? {});
    for (const node of nodes) {
      for (const option of node.options ?? []) {
        if (typeof option.echo === 'string' && !option.echo.startsWith(option.text)) out.push({ tree, option });
      }
    }
  }
  return out;
}

const DOES_SOMETHING = ['set', 'add', 'take', 'grants', 'completes', 'goto', 'ends', 'setState', 'give', 'pay'];

test('there are switches, and each is a [COMIC] option that does nothing', () => {
  const found = switches();
  assert.ok(found.length >= 3, `Main Street's three are in the game (found ${found.length})`);
  for (const { tree, option } of found) {
    assert.equal(option.tag, 'COMIC', `${tree.id} ${option.id}: a switch is only ever [COMIC]`);
    const acts = DOES_SOMETHING.filter((key) => key in option);
    assert.deepEqual(acts, [], `${tree.id} ${option.id}: a switch must not hide what a choice does`);
  }
});

test('what Thad says is not what the menu offered', () => {
  for (const { tree, option } of switches()) {
    assert.notEqual(option.echo.trim(), option.text.trim(), `${tree.id} ${option.id}`);
  }
});

test('a person has at most one switch, under its own id', () => {
  const byTree = new Map();
  for (const { tree, option } of switches()) {
    byTree.set(tree.id, [...(byTree.get(tree.id) ?? []), option.id]);
  }
  for (const [tree, ids] of byTree) {
    assert.equal(ids.length, 1, `${tree} has ${ids.length} switches: ${ids.join(', ')}`);
    if (tree.startsWith('amb_')) assert.match(ids[0], /s$/, `${tree}: a doc 07 switch keeps the id <prefix>s`);
  }
});

test("Main Street's three are the ones doc 07 writes", () => {
  const ids = switches().map(({ option }) => option.id).sort();
  for (const id of ['leavings', 'map_sellers', 'pie_womans']) assert.ok(ids.includes(id), `${id} is in the game`);
});
