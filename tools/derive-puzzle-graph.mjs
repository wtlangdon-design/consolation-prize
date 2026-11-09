import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { CANONICAL_PUZZLE_IDS, DECLARED_GRAPH_PATH } from './check-puzzle-graph.mjs';
import { ROOT } from './lib/content.mjs';
import { buildModel, declaredGraph, loadModelContent } from './lib/puzzle-model.mjs';

/**
 * Writes content/puzzles/puzzle-graph.json: per canonical puzzle, the sites in
 * content that complete it, what each reads and what each writes (errata 219).
 *
 * DERIVED, NEVER TYPED. Nobody edits the file; a change to content that
 * changes the graph changes the file when this is run with --write, and
 * tools/check-puzzle-graph.mjs fails until it is. The diff is the review: it
 * says, in ids, what a puzzle now needs or gives that it did not before.
 *
 *   node tools/derive-puzzle-graph.mjs           says whether the file is current
 *   node tools/derive-puzzle-graph.mjs --write   rewrites it
 */
const content = loadModelContent();
const graph = declaredGraph(buildModel(content), CANONICAL_PUZZLE_IDS);
const text = `${JSON.stringify(graph, null, 1)}\n`;
const current = content.puzzles.find(({ path }) => path === DECLARED_GRAPH_PATH);

if (process.argv.includes('--write')) {
  const path = resolve(ROOT, DECLARED_GRAPH_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  console.log(`wrote ${DECLARED_GRAPH_PATH}: ${graph.puzzles.length} puzzles, `
    + `${graph.puzzles.reduce((sum, one) => sum + one.completedBy.length, 0)} completing sites`);
} else {
  const same = current && JSON.stringify(current.data) === JSON.stringify(graph);
  console.log(same ? `${DECLARED_GRAPH_PATH} is current` : `${DECLARED_GRAPH_PATH} is out of step -- run with --write`);
  process.exit(same ? 0 : 1);
}
