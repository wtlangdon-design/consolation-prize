import { loadContent, Report, runCheck } from './lib/content.mjs';
import { CANONICAL_PUZZLE_IDS } from './check-puzzle-graph.mjs';

/**
 * ERRATA 57, ENFORCED: every option's aftermath is authored, not inferred
 * from its tag. Doc 36 Q112 (W1).
 *
 * Strict on a tree whose document carries the notation (`aftermathAuthored`,
 * set by the extractor): an option without `afterUse` fails by name, except
 * the universal exit lines doc 04 part one supplies to every node, which the
 * extractor marks `universal` and which behave as retain. Permissive on the
 * trees whose documents predate the ruling (errata 57: "until W1 content
 * lands, every existing option behaves as retain") -- reported, not failed,
 * so the count of unauthored trees is visible on every run.
 *
 * Then the shape of each mode: a known mode; `rephrase` names a canonical
 * puzzle milestone and both a wording and an answer; `counted-repeat` (and
 * any `repeats`) lists selections from 2 upward, strictly increasing, each
 * with a line or an exchange; `replace` names what replaces it; and a node
 * stays LEAVABLE once everything that can be removed has been -- an ungated
 * ender that is not itself `remove` (errata 57's surviving constraint).
 */
const MODES = new Set(['retain', 'remove', 'counted-repeat', 'rephrase', 'replace']);
const PUZZLES = new Set(CANONICAL_PUZZLE_IDS);

export function check() {
  const report = new Report('Every dialogue option authors its aftermath (errata 57), and the shapes hold');
  const content = loadContent();
  let unauthoredTrees = 0;
  for (const { path, data } of content.dialogue) {
    const strict = data.aftermathAuthored === true;
    let unauthored = 0;
    for (const [nodeId, node] of Object.entries(data.nodes ?? {})) {
      const where = `${data.id}/${nodeId}`;
      const keys = new Set();
      for (const option of node.options ?? []) {
        const at = `${where}/${option.id}`;
        if (keys.has(option.id)) report.fail(`${at}: duplicate option id -- its selection-state key would collide`);
        keys.add(option.id);
        if (option.afterUse === undefined) {
          if (strict && !option.universal) report.fail(`${at}: no afterUse, and ${path} is aftermath-authored (errata 57)`);
          else unauthored += 1;
        } else if (!MODES.has(option.afterUse)) {
          report.fail(`${at}: unknown afterUse "${option.afterUse}"`);
        }
        if (option.afterUse === 'rephrase') {
          const r = option.rephrase;
          if (!r || typeof r.after !== 'string' || !r.text || !r.say) report.fail(`${at}: rephrase needs after, text and say`);
          else if (!PUZZLES.has(r.after)) report.fail(`${at}: rephrase.after "${r.after}" is not a canonical puzzle id`);
        } else if (option.rephrase) report.fail(`${at}: carries a rephrase but its afterUse is ${option.afterUse}`);
        if (option.afterUse === 'replace') {
          const w = option.replaceWith;
          if (!w || !w.id || !w.text || !w.tag) report.fail(`${at}: replace needs a replaceWith option with id, text and tag`);
          else if (keys.has(w.id) || (node.options ?? []).some((o) => o.id === w.id)) report.fail(`${at}: replaceWith id "${w.id}" collides with a row of the node`);
        }
        // PUZZLE PROGRESS A ROW WRITES: canonical ids, pending or complete.
        for (const [puzzle, status] of Object.entries(option.puzzle ?? {})) {
          if (!PUZZLES.has(puzzle)) report.fail(`${at}: puzzle "${puzzle}" is not a canonical puzzle id`);
          if (status !== 'pending' && status !== 'complete') report.fail(`${at}: puzzle ${puzzle} status "${status}" is neither pending nor complete`);
        }
        if (option.repeats) {
          let last = 1;
          for (const entry of option.repeats) {
            if (typeof entry.selection !== 'number' || entry.selection < 2) report.fail(`${at}: a repeats entry must name a selection of 2 or more`);
            else if (entry.selection <= last) report.fail(`${at}: repeats are not strictly increasing at selection ${entry.selection}`);
            last = entry.selection;
            const lines = entry.exchange?.length ? entry.exchange.every((l) => l.speaker && l.line) : Boolean(entry.say);
            if (!lines) report.fail(`${at}: repeats entry for selection ${entry.selection} has neither a line nor an exchange`);
          }
          if (option.repeat) report.fail(`${at}: carries both repeat and repeats; the authored form is repeats`);
        }
      }
      // LEAVABLE: with every removable option gone, an ungated ender remains.
      const survivors = (node.options ?? []).filter((o) => o.afterUse !== 'remove');
      const ungatedEnder = survivors.some((o) => !o.when && (o.ends || o.tag === 'EXIT'));
      const ungatedAny = survivors.some((o) => !o.when);
      if (!ungatedAny) report.fail(`${where}: once its removable options are gone, every remaining option is gated`);
      if (!ungatedEnder && survivors.some((o) => o.ends || o.tag === 'EXIT') === false && (node.options ?? []).some((o) => o.ends || o.tag === 'EXIT')) {
        report.fail(`${where}: every way out of this node removes itself (errata 57: a tree must always be leavable)`);
      }
    }
    // ENTRIES: a puzzle-gated entry names a canonical puzzle and a node that
    // has an opening for the action to perform (errata 66 C).
    for (const entry of data.entries ?? []) {
      if (entry.puzzle !== undefined) {
        if (!PUZZLES.has(entry.puzzle)) report.fail(`${data.id}: entry on puzzle "${entry.puzzle}" is not a canonical puzzle id`);
        if (!data.nodes?.[entry.node]) report.fail(`${data.id}: entry on ${entry.puzzle} names node "${entry.node}", which the tree lacks`);
        else if (!data.nodes[entry.node].opening?.length) report.fail(`${data.id}: entry on ${entry.puzzle} opens ${entry.node}, which has no opening for the action to perform`);
      }
      if (entry.when === undefined && entry.puzzle === undefined) report.fail(`${data.id}: an entry to ${entry.node} has neither flags nor a puzzle`);
    }
    if (strict) report.note(`${data.id}: aftermath authored on every option (strict)`);
    else if (unauthored) { unauthoredTrees += 1; report.note(`${data.id}: ${unauthored} option(s) without afterUse -- behaves as retain until W1 reaches this tree (errata 57)`); }
  }
  report.note(`${unauthoredTrees} tree(s) still on errata 57's interim`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
