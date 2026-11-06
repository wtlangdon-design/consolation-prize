/**
 * EVERY LINE A TOWNSPERSON SAYS IS IN DOC 07 (errata 114).
 *
 * Five of the townspeople's trees were typed in by hand in July, and six of
 * their lines -- three opening lines, three repeats -- were in no document.
 * Nothing noticed: a line that exists passes every check. Tyler has since
 * written them into doc 07. This holds every line of every townsperson's tree
 * (content/dialogue/amb-*.json) to the document, word for word, except the
 * exits, which are doc 04 part one's pool.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const normal = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
const doc07 = normal(readFileSync(resolve(ROOT, 'docs/07-ambient-layer.md'), 'utf8'));
const doc04 = normal(readFileSync(resolve(ROOT, 'docs/04-dialogue-trees.md'), 'utf8'));

type Option = { text?: string; tag?: string; say?: string; repeat?: string | string[];
  exchange?: { line: string; direction?: boolean }[] };
type Tree = { nodes: Record<string, { prompt?: string; options: Option[] }> };

test('every line of every townsperson\'s tree is written in doc 07', () => {
  const missing: string[] = [];
  for (const file of readdirSync(resolve(ROOT, 'content/dialogue')).filter((name) => name.startsWith('amb-'))) {
    const tree = JSON.parse(readFileSync(resolve(ROOT, 'content/dialogue', file), 'utf8')) as Tree;
    for (const node of Object.values(tree.nodes)) {
      const lines: string[] = node.prompt ? [node.prompt] : [];
      for (const option of node.options) {
        if (option.tag === 'EXIT') {
          if (option.text && !doc04.includes(normal(option.text))) missing.push(`${file}: exit "${option.text}"`);
          continue;
        }
        if (option.text) lines.push(option.text);
        if (option.say) lines.push(option.say);
        lines.push(...[option.repeat ?? []].flat());
        for (const one of option.exchange ?? []) if (one.line !== '…') lines.push(one.line);
      }
      for (const line of lines) if (!doc07.includes(normal(line))) missing.push(`${file}: "${line}"`);
    }
  }
  assert.deepEqual(missing, [], 'a townsperson says a line no document writes');
});
