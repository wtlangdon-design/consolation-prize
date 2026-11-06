/**
 * NO REPLY LOSES ITS LATER LINES (errata 119).
 *
 * Winnie's extractor kept the first quoted line of a reply and dropped the
 * rest, and so lost WIN_F1's "File it. I'll be at the Registrar's when you
 * do." -- the one line that sends Thad to the game's last filing (F5). The
 * fairness audit found it by comparing every reply against doc 04. This holds
 * that comparison: every line a doc 04 option's reply speaks, in the
 * character's own voice, is somewhere in what that option says in the game.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const normal = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

type Option = { text?: string; say?: string; exchange?: { speaker: string; line: string }[];
  repeats?: { say?: string }[]; repeat?: string | string[]; rephrase?: { say: string } };
type Tree = { nodes: Record<string, { options?: Option[] }> };

const trees = readdirSync(resolve(ROOT, 'content/dialogue'))
  .map((file) => JSON.parse(readFileSync(resolve(ROOT, 'content/dialogue', file), 'utf8')) as Tree);
const nodeById = new Map<string, { options?: Option[] }>();
for (const tree of trees) for (const [id, node] of Object.entries(tree.nodes ?? {})) nodeById.set(id, node);

test("every line of a doc 04 reply is said in the game", () => {
  const doc = readFileSync(resolve(ROOT, 'docs/04-dialogue-trees.md'), 'utf8');
  const missing: string[] = [];
  let checked = 0;
  let node: string | null = null;
  for (const raw of doc.split('\n')) {
    const heading = /^(?:#+\s.*?|\*\*)`([A-Z]{2,4}_[A-Z0-9]+)`/.exec(raw);
    if (heading) { node = heading[1]!; continue; }
    const row = /^\|\s*\d+\s*\|(.*)$/.exec(raw);
    if (!row || !node) continue;
    const cells = row[1]!.split('|').map((cell) => cell.trim());
    const text = /"([^"]+)"/.exec(cells[0] ?? '')?.[1];
    const reply = cells[2];
    const built = nodeById.get(node);
    if (!text || reply === undefined || !built) continue;
    const option = built.options?.find((one) => one.text && normal(one.text) === normal(text));
    if (!option) continue;
    // The first selection's reply, before any arrow to a next node, with
    // directions and Thad's italic interjections taken out.
    const first = reply.split(/\*\((?:second|third|fourth|fifth)\b[^)]*\)\*/)[0]!
      .replace(/\*\([^)]*\)\*/g, '').split('→')[0]!
      .replace(/\*"[^"]*"\*/g, '').replace(/\*\*"([^"]*)"\*\*/g, '"$1"');
    const said = [option.say ?? '', ...(option.exchange ?? []).map((one) => one.line), option.rephrase?.say ?? '']
      .map(normal).join(' | ');
    for (const quote of first.matchAll(/"([^"]+)"/g)) {
      checked += 1;
      if (!said.includes(normal(quote[1]!))) missing.push(`${node} "${text}": "${quote[1]}"`);
    }
  }
  assert.ok(checked > 100, `only ${checked} reply lines read: the parse is broken`);
  assert.deepEqual(missing, [], 'doc 04 writes these lines and the game never says them');
});
