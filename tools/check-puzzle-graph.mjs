import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Automated graph traversal: every puzzle reachable from a fresh save, and
 * the win state reachable from every reachable state.
 *
 * Errata ruling 5 fixes the canonical count at 45 and states the enumeration
 * this script traverses. 43 is wrong wherever it still appears.
 */
export const CANONICAL_PUZZLE_IDS = [
  ...range('A', 1, 10),
  ...range('B', 1, 6),
  ...range('C', 1, 6),
  ...range('D', 1, 6),
  'E0',
  'E0b',
  ...range('E', 1, 10),
  ...range('F', 1, 5),
];

function range(prefix, from, to) {
  const out = [];
  for (let index = from; index <= to; index += 1) out.push(`${prefix}${index}`);
  return out;
}

/** Facts accumulate and are never removed, so reachability is monotonic. */
function traverse(puzzles) {
  const held = new Set();
  const reached = new Set();
  let grew = true;

  while (grew) {
    grew = false;
    for (const puzzle of puzzles) {
      if (reached.has(puzzle.id)) continue;
      const met = (puzzle.requires ?? []).every((token) => held.has(token));
      if (!met) continue;
      reached.add(puzzle.id);
      for (const token of puzzle.yields ?? []) held.add(token);
      grew = true;
    }
  }

  return { reached, held };
}

export function check() {
  const report = new Report('All puzzles reachable from a fresh save; win reachable from every state');
  const content = loadContent();

  const puzzles = content.puzzles.flatMap(({ data }) => data.puzzles ?? []);

  if (puzzles.length === 0) {
    report.note(`no puzzle graph declared in the manifest -- nothing traversed`);
    report.note(`expected once Act content lands: ${CANONICAL_PUZZLE_IDS.length} puzzles (errata ruling 5)`);
    report.note('this check is inert in Phase 1 by design, not passing on evidence');
    return report;
  }

  const ids = puzzles.map((puzzle) => puzzle.id);
  const declared = new Set(ids);

  for (const id of ids) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      report.fail(`duplicate puzzle id "${id}"`);
    }
  }
  for (const id of CANONICAL_PUZZLE_IDS) {
    if (!declared.has(id)) report.fail(`canonical puzzle "${id}" is missing from the graph`);
  }
  for (const id of declared) {
    if (!CANONICAL_PUZZLE_IDS.includes(id)) report.fail(`puzzle "${id}" is not in the canonical list of 45`);
  }

  // Graph rule 1: nothing is destroyable. Monotonicity is what makes
  // "win reachable from every reachable state" follow from one traversal.
  for (const puzzle of puzzles) {
    if (puzzle.removes || puzzle.consumes) {
      report.fail(`puzzle "${puzzle.id}" removes state -- nothing may be permanently consumed`);
    }
  }

  const { reached } = traverse(puzzles);
  for (const id of ids) {
    if (!reached.has(id)) {
      report.fail(`puzzle "${id}" is not reachable from a fresh save`);
    }
  }

  const winId = content.puzzles.map(({ data }) => data.win).find(Boolean);
  if (!winId) {
    report.fail('no win state declared');
  } else if (!reached.has(winId)) {
    report.fail(`win state "${winId}" is not reachable from a fresh save`);
  }

  report.note(`${reached.size}/${puzzles.length} puzzles reachable`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
