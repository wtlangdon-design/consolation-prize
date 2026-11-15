// NO LINE IS CUT AFTER A TITLE (errata 319).
//
// Tyler, 2026-11-14, in the Clarion: Thad said "…I have seen this exact photograph in Mr." and then, as a second
// line, "Sheng's window, advertising collars." The compiler cuts a long line in two at a sentence break, and took the
// full stop after "Mr" for one. Held here over every string the game can show: none ends on a title.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../content/', import.meta.url));
const TITLE = /(?:^|\s)(?:Mr|Mrs|Ms|Dr|Rev|Col|Capt|Messrs|St|Jr|Sr)\.$/;

export function cutAfterTitle(value, path = '', out = []) {
  if (typeof value === 'string') { if (TITLE.test(value.trim())) out.push(`${path}: …${value.slice(-50)}`); }
  else if (Array.isArray(value)) value.forEach((one, i) => cutAfterTitle(one, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [key, one] of Object.entries(value)) if (key !== 'note' && key !== 'sceneLine') cutAfterTitle(one, `${path}.${key}`, out);
  }
  return out;
}

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith('.json') ? [path] : [];
  });
}

test('no line the game shows ends on a title', () => {
  const cut = files(ROOT).flatMap((path) => cutAfterTitle(JSON.parse(readFileSync(path, 'utf8')), path.slice(ROOT.length)));
  assert.deepEqual(cut, []);
});

test('the check finds the Clarion line as it was cut', () => {
  assert.equal(cutAfterTitle({ say: 'The only known likeness of Obadiah Mott. I have seen this exact photograph in Mr.' }).length, 1);
  assert.equal(cutAfterTitle({ say: 'No.' }).length, 0, '"No." is a word, not a title');
});
