import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * A NODE THAT IS WRITTEN IS A NODE THAT IS BUILT, OR SAYS WHY NOT (errata 180). Doc 04 wrote an Act IV node for
 * one of its characters in its first growth pass; no extractor ever read it, no figure stood where it is played,
 * and it surfaced a week later only because an act-by-act read happened to look. Every node id doc 04 names in
 * backticks must now be a node in content/dialogue, or be listed in tests/data/doc04-nodes-not-built.json with
 * its reason.
 */
test('every node doc 04 writes is in the game, or is listed with the reason it is not', () => {
  const doc = readFileSync(new URL('../docs/04-dialogue-trees.md', import.meta.url), 'utf8');
  const named = new Set([...doc.matchAll(/`([A-Z]{3}_[A-Z]\d)`/g)].map((m) => m[1] as string));
  const built = new Set<string>();
  const dir = new URL('../content/dialogue/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const tree = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as { nodes?: Record<string, unknown> };
    for (const id of Object.keys(tree.nodes ?? {})) built.add(id);
  }
  const excused = (JSON.parse(readFileSync(new URL('./data/doc04-nodes-not-built.json', import.meta.url), 'utf8')) as
    { nodes: Record<string, string> }).nodes;
  const missing = [...named].filter((id) => !built.has(id) && !excused[id]).sort();
  assert.deepEqual(missing, [], `written in doc 04 and never built, with no reason given: ${missing.join(', ')}`);
  const stale = Object.keys(excused).filter((id) => built.has(id)).sort();
  assert.deepEqual(stale, [], `built now, so off the not-built list: ${stale.join(', ')}`);
});
