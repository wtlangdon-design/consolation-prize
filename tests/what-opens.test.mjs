// WHAT OPENS ANSWERS OPEN ITSELF (errata 316, 318; doc 133).
//
// Tyler, 2026-11-14: "When you try to open the letter in the inventory it says it doesn't open, which doesn't make
// sense." The verb fallbacks are written for scenery; a letter, a ledger, a map or a jar is a thing a player opens.
// Then, asked whether the same fix belonged elsewhere: "Do all 5." Held here: every item doc 133 lists under WHAT
// OPENS, and the letter, answers OPEN with its own line, word for word from the document, and never falls back.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const doc = read('docs/133-playthrough-rulings.md');
const section = doc.slice(doc.indexOf('## WHAT OPENS'));
const lines = new Map([...section.matchAll(/^- `([a-z_]+)` — "([^"]+)"$/gm)].map((m) => [m[1], m[2]]));
const item = (id) => JSON.parse(read(`content/items/${id.replace(/_/g, '-')}.json`));

test('doc 133 lists the things that open', () => {
  assert.ok(lines.size >= 10, `${lines.size} read`);
});

test('every one of them answers OPEN in its own words, as the document writes them', () => {
  for (const [id, line] of lines) {
    const open = item(id).responses?.OPEN;
    assert.ok(open?.length, `${id} has no OPEN of its own, so it says "It doesn't open"`);
    // Errata 351: a line said until a flag comes first; the last, unconditioned, is the listed one, and both are the document's.
    assert.equal(open.at(-1).say, line, `${id}: OPEN is doc 133's line`);
    assert.ok(open.every((rule) => doc.includes(`"${rule.say}"`)), `${id}: every OPEN line is written in doc 133`);
  }
});

test('and the letter, which started it, answers in both its states', () => {
  const open = item('letter').responses?.OPEN ?? [];
  assert.equal(open.length, 2);
});
