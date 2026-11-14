/**
 * EVERY WRITTEN OPENING IS SPOKEN (errata 218's audit of Fiddler's Gulch).
 *
 * The engine voices a node's `opening` and nothing else: `DialogueRunner.openingOf` returns `node.opening`, a node
 * reached by goto says its `opening` (errata 181), and `prompt` is drawn nowhere (doc 30 section 14; Renderer.ts,
 * `choiceLines`). An extractor that put a one-line opening only into `prompt`, or kept all but the last line of a
 * longer one, left the line written and silent: five of Fiddler's Gulch's six openings, Madame Ozymandia's, and the
 * stage lines doc 07 writes over the pie woman and the map seller. Every check passed, because the line existed.
 *
 * These read the documents, not a list: every document a tree in content/dialogue names as its source (its `note`),
 * and in it every opening it writes, in the three shapes the documents use --
 *   - a node marked by its id (a heading carrying `` `ID` ``, or a line that is only **`ID`**), whose
 *     `> **NAME:** "..."` lines before its table are the opening (docs 04, 57, 109);
 *   - a `**Root:** "..."` line under a `# HEADING` that names the tree's speaker (doc 27);
 *   - an `***Opening:***` line in the section a tree's note names (doc 07's stage lines, errata 114).
 * For each, the engine's own `openingOf`, asked on that node, must voice every quoted line, word for word.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { DialogueRunner } from '../engine/core/DialogueRunner.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import type { DialogueFile } from '../engine/core/types.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const normal = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
const quotedIn = (text: string) => [...normal(text).matchAll(/"([^"]+)"/g)].map((m) => m[1]!.trim()).filter(Boolean);

type Written = { doc: string; at: number; tree: string; node: string; lines: string[]; returning?: boolean };

/** What the engine says when a conversation opens on `node` -- asked of the runner itself, on a copy of the tree. */
function voiced(state: GameState, treeId: string, node: string, returning = false): string {
  const tree = state.content.dialogue.get(treeId)!;
  // A ROOT FOR EVERY VISIT AFTER THE FIRST (doc 27, errata 310): voiced once the node's openingOnce flag is set.
  const once = tree.nodes[node]?.openingOnce;
  if (once) state.flags.set(once, returning);
  const copy: DialogueFile = { ...tree, start: node, entries: [] };
  const runner = new DialogueRunner(new Map([[treeId, copy]]), state.flags);
  return normal(runner.openingOf(treeId).map((one) => one.line).join(' '));
}

/** Every opening the source documents write, with the tree and node that should speak it. */
function writtenOpenings(trees: Map<string, DialogueFile>): Written[] {
  const nodeTree = new Map<string, string>();
  for (const [id, tree] of trees) for (const node of Object.keys(tree.nodes)) if (!nodeTree.has(node)) nodeTree.set(node, id);
  const sourceOf = (tree: DialogueFile) => [...((tree as { note?: string }).note ?? '').matchAll(/docs\/[\w.-]+\.md/g)].map((m) => m[0]);
  const docs = [...new Set([...trees.values()].flatMap(sourceOf))];
  const slug = (heading: string) => heading.toLowerCase().replace(/^the /, '').replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
  const found: Written[] = [];
  for (const doc of docs) {
    const lines = readFileSync(resolve(ROOT, doc), 'utf8').split('\n');
    // 1. A node marked by its id; its opening is the dialogue lines before its table.
    let block: Written | null = null;
    let tabled = false;
    const close = () => { if (block && block.lines.length && tabled) found.push(block); block = null; };
    lines.forEach((line, index) => {
      const marked = /^#{1,4} [^`]*`([A-Z]{3,4}_[A-Z0-9_]+)`/.exec(line) ?? /^\*\*`([A-Z]{3,4}_[A-Z0-9_]+)`\*\*\s*$/.exec(line);
      if (marked) {
        close();
        tabled = false;
        const tree = nodeTree.get(marked[1]!);
        if (tree) block = { doc, at: index + 1, tree, node: marked[1]!, lines: [] };
        return;
      }
      if (/^#{1,4} /.test(line)) { close(); return; }
      if (!block) return;
      if (/^\|/.test(line)) { tabled = true; return; }
      if (!tabled && /^> \*\*[^*]+:\*\*/.test(line)) (block as Written).lines.push(...quotedIn(line.replace(/^> \*\*[^*]+:\*\*/, '')));
    });
    close();
    // 2. Doc 27's `**Root:**`, under the heading that names its speaker.
    let heading = '';
    lines.forEach((line, index) => {
      const top = /^# (.+?)(?: · .*)?$/.exec(line);
      if (top) heading = top[1]!;
      const root = /^\*\*Root:\*\*(.+)$/.exec(line);
      if (!root) return;
      const tree = [...trees.values()].find((one) => (one as { speaker?: string }).speaker === slug(heading)
        && sourceOf(one).includes(doc));
      assert.ok(tree, `${doc}:${index + 1}: a **Root:** under "# ${heading}", and no tree from ${doc} speaks as ${slug(heading)}`);
      const [first, later] = root[1]!.split(/\*\(every visit after the first\)\*/);
      found.push({ doc, at: index + 1, tree: tree.id, node: tree.start, lines: quotedIn(first!) });
      if (later) found.push({ doc, at: index + 1, tree: tree.id, node: tree.start, lines: quotedIn(later), returning: true });
    });
  }
  // 3. A stage line doc 07 writes as ***Opening:*** in the section the tree names.
  for (const tree of trees.values()) {
    const note = (tree as { note?: string }).note ?? '';
    const named = /EXTRACTED from (docs\/[\w.-]+\.md) \((#+ [^)]+)\)/.exec(note);
    if (!named) continue;
    const text = readFileSync(resolve(ROOT, named[1]!), 'utf8');
    const at = text.indexOf(`\n${named[2]}\n`);
    if (at < 0) continue;
    const level = named[2]!.indexOf(' ');
    const rest = text.slice(at + 1);
    const headed = rest.indexOf('\n');
    const end = rest.slice(headed).search(new RegExp(`^#{1,${level}} `, 'm'));
    const body = end < 0 ? rest : rest.slice(0, headed + end);
    for (const m of body.matchAll(/^\*\*\*Opening:\*\*\*\s*\*(.+?)\*\s*$/gm)) {
      found.push({ doc: named[1]!, at: text.slice(0, at + 1 + m.index!).split('\n').length, tree: tree.id, node: tree.start,
        lines: [normal(m[1]!)] });
    }
  }
  return found;
}

const fresh = async () => new GameState(await loadContent(fsReader), new MemoryStorage());

test('every opening the documents write is voiced by the engine when its node opens', async () => {
  const state = await fresh();
  const written = writtenOpenings(state.content.dialogue);
  assert.ok(written.length >= 30, `the documents' openings were found (${written.length})`);
  const silent: string[] = [];
  for (const one of written) {
    const tree = state.content.dialogue.get(one.tree)!;
    // A node the documents write with sides (doc 109: *(before G3)* / *(after G3)*) is extracted a node a side.
    const sides = Object.keys(tree.nodes).filter((id) => id === one.node || id.startsWith(`${one.node}_`))
      .filter((id) => id === one.node || (tree.entries ?? []).some((entry) => entry.node === id));
    const said = sides.map((id) => voiced(state, one.tree, id, one.returning));
    for (const line of one.lines) {
      if (!said.some((spoken) => spoken.includes(line))) silent.push(`${one.doc}:${one.at} ${one.tree}/${one.node}: "${line}"`);
    }
  }
  assert.deepEqual(silent, [], 'a written opening line the engine never says');
});

test('no node carries a prompt the engine would drop: a prompt is the caption of an opening that is spoken', async () => {
  const state = await fresh();
  const dropped: string[] = [];
  for (const [treeId, tree] of state.content.dialogue) {
    for (const [id, node] of Object.entries(tree.nodes)) {
      if (node.prompt && !node.opening?.length) dropped.push(`${treeId}/${id}: "${node.prompt}"`);
      else if (node.prompt && !node.opening!.some((one) => one.line === node.prompt)) {
        dropped.push(`${treeId}/${id}: the prompt "${node.prompt}" is not in its opening`);
      }
    }
  }
  assert.deepEqual(dropped, [], 'a prompt only the data holds');
});
