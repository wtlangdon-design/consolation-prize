import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT, Report, loadContent } from './lib/content.mjs';

/**
 * Every staging step kind the content uses is NAMED in the drawer.
 *
 * `tools/draw-staging-timeline.mjs` exists to be looked at before a sequence
 * is played, and a drawing that quietly omits a step is worse than no drawing:
 * the missing thing reads as an absence in the CONTENT rather than in the
 * TOOL. That is not hypothetical. A staged `say` carries no `actor` -- it
 * names one of its beat's own lines by index, which is what keeps dialogue out
 * of the staging table -- so the drawer's group-by-actor dropped all three of
 * Hob's lines, and beat 9 drew as `walk / walk`: the exact shape the say-step
 * was added to fix. The label branch for `say` EXISTED and was unreachable.
 *
 * AND THE SAME SHAPE WAS ALREADY THERE TWICE. `walk` is the commonest step in
 * the file and the drawer never named it -- it fell through to a default and
 * drew by accident. Correct today, and the next kind added would have fallen
 * through the same way and looked drawn.
 *
 * SO THE VOCABULARY IS CHECKED AGAINST THE DRAWING, not against itself. This
 * reads the `do` values out of every staging table in the content and the
 * string literals compared against `.do` in the drawer, and requires the first
 * set to be covered by the second. "The drawing has stopped keeping up with
 * the vocabulary" becomes a build failure rather than something noticed when a
 * picture looks thin.
 */
const DRAWER = 'tools/draw-staging-timeline.mjs';

/** Every literal the drawer compares a `.do` against. */
function namedKinds() {
  const path = resolve(ROOT, DRAWER);
  const src = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const found = new Set();
  const visit = (node) => {
    if (ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
      const { left, right } = node;
      const reads = ts.isPropertyAccessExpression(left) && left.name.text === 'do';
      if (reads && ts.isStringLiteral(right)) found.add(right.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  return found;
}

export function check() {
  const report = new Report('Every staging step kind the content uses is named in the drawer');
  const content = loadContent();

  const used = new Map();
  for (const { path, data } of content.sequences ?? []) {
    for (const beat of data.beats ?? []) {
      for (const staged of beat.staging ?? []) {
        if (!staged.do) continue;
        if (!used.has(staged.do)) used.set(staged.do, `${path} beat ${beat.beat}`);
      }
    }
  }

  const named = namedKinds();
  for (const [kind, where] of [...used].sort()) {
    if (named.has(kind)) continue;
    report.fail(
      `staging uses "${kind}" (${where}) and ${DRAWER} never names it. It reaches the `
      + `drawing through a default branch, which is correct by accident: the label is `
      + `whatever the step happens to look like, and nothing says so. Name it, even if `
      + `the label is its own name.`,
    );
  }

  report.note(`${used.size} kind(s) used: ${[...used.keys()].sort().join(', ')}`);
  const spare = [...named].filter((kind) => !used.has(kind)).sort();
  if (spare.length) report.note(`drawn but not currently staged anywhere: ${spare.join(', ')}`);
  return report;
}
