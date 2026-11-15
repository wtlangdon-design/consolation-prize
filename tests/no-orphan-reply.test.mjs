// A SHORT FOLLOW-UP ANSWERS SOMETHING THAT WAS SAID (errata 329).
//
// Tyler, 2026-11-15: "I don't understand the back-and-forth with the map seller where the map seller says something
// like, 'Arm out, finger pointed...'" Errata 320 took out the sentence the exchange hung on ("I'll draw you on the
// next one, telling them") and left Thad's "Me?" answering a reply that never mentioned him.
//
// Held here, for every micro-tree in doc 07: a bare follow-up of Thad's that points back at a word ("Me?", "Which
// company?", "Whose accounts?", "Every funeral?") follows a reply that says that word, or "you" for "Me?".

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const DOC = readFileSync(new URL('../docs/07-ambient-layer.md', import.meta.url), 'utf8');

export function orphans(doc) {
  const lines = doc.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i += 1) {
    const ask = /^>\s+\*Thad:\* "(Me|(?:Which|Whose|Every) (\w+))\?"/.exec(lines[i]);
    if (!ask) continue;
    const before = lines[i - 1].split('→').slice(1).join('→').toLowerCase();
    const word = ask[1] === 'Me' ? /\byou(r)?\b/ : new RegExp(`\\b${ask[2].toLowerCase().replace(/s$/, '')}`);
    if (!word.test(before)) out.push(`line ${i + 1}: "${ask[1]}?" after ${lines[i - 1].trim().slice(0, 90)}`);
  }
  return out;
}

test('every short follow-up of Thad\'s answers a word the reply before it said', () => {
  assert.deepEqual(orphans(DOC), []);
});

test('the check finds the map seller\'s "Me?" as errata 320 left it', () => {
  const was = '> ↳ `[COMIC]` "Your maps are a swindle, sir, and I\'ll tell the whole town so!" → "Tell them, sir! Every man in town owns one, and not one has asked for his money back."\n>   *Thad:* "Me?"\n';
  assert.equal(orphans(was).length, 1);
});
