import { readJson, Report, runCheck } from './lib/content.mjs';
import {
  buildModel, declaredGraph, loadModelContent, lossAnalysis, reach, unwrittenReads, winReached,
} from './lib/puzzle-model.mjs';

/**
 * Automated graph traversal: every puzzle reachable from a fresh save, and
 * the win state reachable from every reachable state (invariant 6).
 *
 * Errata ruling 5 fixed the canonical count at 45 and states the enumeration
 * this script traverses; Fiddler's Gulch (doc 107, errata 213) adds seven, 52.
 * 43 is wrong wherever it still appears.
 *
 * ERRATA 219: THIS CHECK WAS INERT FOR ITS WHOLE LIFE. The manifest's
 * `puzzles` was empty from the engine skeleton on, and the check printed "no
 * puzzle graph declared ... inert" and passed, while errata 213 and others
 * wrote that the fresh-save traversal and win-from-everywhere checks held.
 * Now:
 *
 *   - THE GRAPH IS DERIVED, NOT TYPED. tools/lib/puzzle-model.mjs reads every
 *     site in content that changes state -- what it reads and what it writes
 *     -- and content/puzzles/puzzle-graph.json is its view per canonical
 *     puzzle, written by tools/derive-puzzle-graph.mjs. This check fails if
 *     the file and the content disagree, so the declared graph cannot drift.
 *   - AN EMPTY OR SHORT GRAPH FAILS. No declared graph, or one missing a
 *     canonical puzzle, is a failure, not a note.
 *   - What it proves, and the model it proves it in, is the header of
 *     tools/lib/puzzle-model.mjs: reachability over accumulated facts, held by
 *     tests/puzzle-graph.test.mjs to everything the continuous playthrough
 *     reaches; dead ends one loss at a time.
 *
 * KNOWN FINDINGS. An unreachable puzzle, a gate nothing writes, or a dead end
 * the traversal finds is a finding for Tyler, not something this check may
 * paper over by fixing the game. It is listed in proofs/puzzle-graph-
 * findings.json with what was found; the check then reports it on every run
 * and passes, and fails if a listed finding stops reproducing.
 */
export const CANONICAL_PUZZLE_IDS = [
  ...range('A', 1, 10),
  ...range('B', 1, 6),
  ...range('C', 1, 6),
  ...range('D', 1, 6),
  'E0',
  'E0b',
  ...range('E', 1, 6),
  // SCENE A, THE HEARSE (doc 110 section 2; errata 233): between the executor and the coffin.
  'E6b',
  ...range('E', 7, 10),
  ...range('F', 1, 5),
  // FIDDLER'S GULCH (doc 107; reference/fiddlers-gulch/brief.md, "When it is all in"): G1 to G9, less G6 and G7, which
  // are B4 and B5 moved to the Gulch. 45 and seven: 52; and E6b, the hearse (errata 233): 53.
  'G1', 'G2', 'G3', 'G4', 'G5', 'G8', 'G9',
];

export const DECLARED_GRAPH_PATH = 'content/puzzles/puzzle-graph.json';
export const FINDINGS_PATH = 'proofs/puzzle-graph-findings.json';

function range(prefix, from, to) {
  const out = [];
  for (let index = from; index <= to; index += 1) out.push(`${prefix}${index}`);
  return out;
}

function list(items, most = 4) {
  return items.length <= most ? items.join(', ') : `${items.slice(0, most).join(', ')} and ${items.length - most} more`;
}

export function check(content = loadModelContent(), { losses = true } = {}) {
  const report = new Report('All puzzles reachable from a fresh save; win reachable from every state');
  const known = content.puzzleFindings ?? readJson(FINDINGS_PATH);
  const knownUnreachable = new Map((known.unreachable ?? []).map((one) => [one.puzzle, one]));
  const knownUnwritten = new Map((known.unwrittenReads ?? []).map((one) => [`${one.site} ${one.flag}`, one]));
  const knownDeadEnds = new Map((known.deadEnds ?? []).map((one) => [one.site, one]));
  const seen = new Set();

  // THE DECLARED GRAPH: present, whole, and the content's own.
  const files = content.puzzles ?? [];
  if (files.length === 0) {
    report.fail('no puzzle graph is declared in the manifest -- nothing would be traversed. An empty graph '
      + `is a failure, not a note (errata 219): list ${DECLARED_GRAPH_PATH} under the manifest's \`puzzles\``);
  }
  const declared = files.flatMap(({ data }) => data.puzzles ?? []);
  const ids = declared.map((puzzle) => puzzle.id);
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) report.fail(`duplicate puzzle id "${id}"`);
  }
  for (const id of CANONICAL_PUZZLE_IDS) {
    if (files.length && !ids.includes(id)) report.fail(`canonical puzzle "${id}" is missing from the declared graph`);
  }
  for (const id of new Set(ids)) {
    if (!CANONICAL_PUZZLE_IDS.includes(id)) report.fail(`puzzle "${id}" is not in the canonical list of ${CANONICAL_PUZZLE_IDS.length}`);
  }

  const model = buildModel(content);
  for (const problem of model.unresolved) report.fail(`the graph cannot place a site: ${problem}`);
  const derived = declaredGraph(model, CANONICAL_PUZZLE_IDS);
  const file = files.find(({ path }) => path === DECLARED_GRAPH_PATH);
  if (files.length && (!file || JSON.stringify(file.data) !== JSON.stringify(derived))) {
    report.fail(`${DECLARED_GRAPH_PATH} is out of step with the content it is derived from -- `
      + 'run `node tools/derive-puzzle-graph.mjs --write` and read the diff: it is what changed in the graph');
  }

  // FROM A FRESH SAVE.
  const full = reach(model);
  for (const id of CANONICAL_PUZZLE_IDS) {
    if (!model.puzzleSites.has(id)) {
      report.fail(`canonical puzzle "${id}" -- nothing in content completes it`);
      continue;
    }
    if (full.tokens.has(`p:${id}`)) continue;
    const finding = knownUnreachable.get(id);
    if (finding) { seen.add(`unreachable ${id}`); report.note(`KNOWN FINDING -- "${id}" unreachable: ${finding.finding}`); continue; }
    report.fail(`canonical puzzle "${id}" is not reachable from a fresh save (completed only by ${
      list(model.puzzleSites.get(id).map((site) => site.id))})`);
  }
  if (!model.win.length) report.fail('no win state: no room in content `endsGame`');
  else if (!winReached(model, full)) report.fail(`the win (${model.win.join(', ')}) is not reachable from a fresh save`);

  // NO FLAG READ BEFORE IT CAN BE WRITTEN, in play order.
  for (const read of unwrittenReads(model, full)) {
    const finding = knownUnwritten.get(`${read.site} ${read.flag}`);
    if (finding) { seen.add(`unwritten ${read.site} ${read.flag}`); report.note(`KNOWN FINDING -- ${read.site} reads ${read.flag}: ${finding.finding}`); continue; }
    report.fail(`${read.site} reads ${read.flag}=${read.wants}, which nothing reachable from a fresh save writes`);
  }

  // THE WIN FROM EVERY REACHABLE STATE, one loss at a time.
  // `losses: false` is for tests about something else; the suite always runs it.
  const deadEnds = losses ? lossAnalysis(model, full) : [];
  for (const dead of deadEnds) {
    const finding = knownDeadEnds.get(dead.site);
    if (finding) { seen.add(`dead ${dead.site}`); report.note(`KNOWN FINDING -- dead end at ${dead.site}: ${finding.finding}`); continue; }
    report.fail(`DEAD END: after ${dead.site} (losing ${dead.lost.join(', ')}) with ${list(dead.before, 2)} not yet done, `
      + `the win is unreachable; out of reach: ${list(dead.missing, 8)}`);
  }

  // A KNOWN FINDING IS TRUE OR IT GOES.
  for (const one of known.unreachable ?? []) {
    if (!seen.has(`unreachable ${one.puzzle}`)) report.fail(`known finding "${one.puzzle}" unreachable no longer reproduces -- take it out of ${FINDINGS_PATH}`);
  }
  for (const one of known.unwrittenReads ?? []) {
    if (!seen.has(`unwritten ${one.site} ${one.flag}`)) report.fail(`known finding ${one.site} reads ${one.flag} no longer reproduces -- take it out of ${FINDINGS_PATH}`);
  }
  for (const one of losses ? known.deadEnds ?? [] : []) {
    if (!seen.has(`dead ${one.site}`)) report.fail(`known dead end at ${one.site} no longer reproduces -- take it out of ${FINDINGS_PATH}`);
  }

  const reached = CANONICAL_PUZZLE_IDS.filter((id) => full.tokens.has(`p:${id}`)).length;
  report.note(`${reached}/${CANONICAL_PUZZLE_IDS.length} canonical puzzles reachable from a fresh save; win (${model.win.join(', ')}) `
    + `${winReached(model, full) ? 'reachable' : 'NOT reachable'}`);
  report.note(`${model.sites.length} sites derived from content, ${full.fired.size} reachable; `
    + `${deadEnds.length} dead end(s) across every loss, taken one at a time`);
  report.note('the model: facts accumulate, and a gate holds if each flag it names has had a passing value '
    + '(tools/lib/puzzle-model.mjs) -- held to the continuous playthrough by tests/puzzle-graph.test.mjs');
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
