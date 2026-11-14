// THAD ONLY ASKS ABOUT WHAT HE HAS BEEN TOLD (errata 310).
//
// Tyler, 2026-11-14: "Some of it doesn't seem to match where the game is chronologically ... Some of it seems to
// come out of nowhere." On the first night Thad asked Hob about Obadiah Mott and Claim One, and the map seller
// whether his maps led to Mott's strike, before anyone in the game had said either name.
//
// In the first act's conversations (a doc 07 townsperson's tree, a doc 27 tree, or a node of Act I: `*_A*`), an
// option or a line of Thad's that names Mott waits for the map seller to have told him (T_MOTT_TOLD), unless it is
// the question that asks; one that names Claim One waits for Sump to have told him whose it borders (T_BORDERS_MOTT).

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DIR = new URL('../content/dialogue/', import.meta.url);
const trees = readdirSync(DIR).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')))
  .filter((tree) => tree.nodes);
const actOne = (tree, node) => tree.id.startsWith('amb_') || ['root', 'HOB_A1'].includes(node.id) || /^[A-Z]{3}_A\d/.test(node.id);
const thad = (option) => [option.text, option.echo, ...(option.exchange ?? []).filter((line) => line.speaker === 'thad').map((line) => line.line)]
  .filter(Boolean).join(' ');

const KNOWS = [
  { name: /\bMott\b/, flag: 'T_MOTT_TOLD', told: 'the map seller has said who Mott was' },
  { name: /Claim One/, flag: 'T_BORDERS_MOTT', told: 'Sump has said whose claim his borders' },
];

test('in the first act, Thad names Mott and Claim One only once somebody has told him of them', () => {
  const early = [];
  for (const tree of trees) {
    for (const node of Object.values(tree.nodes).filter((one) => actOne(tree, one))) {
      for (const option of node.options ?? []) {
        for (const { name, flag, told } of KNOWS) {
          if (!name.test(thad(option))) continue;
          if (option.set?.[flag] || option.when?.[flag] === true) continue;
          early.push(`${tree.id}/${node.id}/${option.id} "${option.text}": asked before ${told}`);
        }
      }
    }
  }
  assert.deepEqual(early, []);
});

test('the map seller is who tells him, and nothing before it is gated on hearing it', () => {
  const seller = trees.find((tree) => tree.id === 'amb_map_seller');
  assert.ok(Object.values(seller.nodes).flatMap((node) => node.options).some((option) => option.set?.T_MOTT_TOLD), 'he tells');
});
