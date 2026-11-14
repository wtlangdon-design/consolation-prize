// THAD ASKS AFTER PIKE AS A LIVING MAN UNTIL HE KNOWS (errata 306).
//
// Tyler, 2026-11-14: "'Did you know Ezra Pike?' -- why wouldn't Thad ask this in the present tense?" He carries a
// letter of introduction to Pike (doc 02, A1) and learns he is dead only from the undertaker (T_PIKE_DEAD). Ten
// people were asked "Did you know", which is how you ask after a man you know is dead.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DIR = new URL('../content/dialogue/', import.meta.url);
const PAST = /\b(did|was|were|knew|had)\b/i;

test('before the undertaker tells him, no option asks after Pike in the past tense', () => {
  const asked = [];
  for (const name of readdirSync(DIR).filter((one) => one.endsWith('.json'))) {
    const tree = JSON.parse(readFileSync(new URL(name, DIR), 'utf8'));
    for (const node of Object.values(tree.nodes ?? {})) {
      for (const option of node.options ?? []) {
        if (!/Pike/.test(option.text ?? '') || option.when?.T_PIKE_DEAD !== false) continue;
        asked.push(option.text);
        assert.ok(!PAST.test(option.text), `${name} ${option.id}: "${option.text}" asks after a living man in the past tense`);
      }
    }
  }
  assert.ok(asked.length >= 10, `${asked.length} people are asked after Pike`);
});
