import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { allInteractables, loadContent, Report, ROOT, runCheck } from './lib/content.mjs';

/**
 * Lines the documents mark as FIXED, and which must never gain a variant.
 *
 * Doc 26: THE COFFINS · USE — "Not yet." It is the same line in Act III when
 * Thad is arranging his own funeral in that room, and a second version
 * explains the joke. Every other override in the game may grow repeats; this
 * one may not, and the difference is invisible in the data.
 *
 * The rule is DECLARED IN THE DOCUMENT, not listed here. A document says
 * `*(This line does not change ... Do not add a variant.)*` after the line and
 * this reads that marker -- so a second fixed line is protected by writing it
 * in /docs, not by editing a tool. The line itself never appears in this file:
 * it is matched against what the doc says, which is the same rule the rest of
 * the pipeline runs on.
 */

//: Documents that may declare a fixed line. Adding one here is the only
//: maintenance this check needs.
const DOCS = ['docs/26-batch-a.md'];

//: `> **NAME** · VERB — "LINE" *(instruction)*`
const OVERRIDE = /^> \*\*(.+?)\*\* · (\w[\w ]*?) — "(.+?)"\s*\*\((.+)\)\*$/gm;
const FIXED = /do not add a variant/i;

//: `**NAME** — *... they must always exist ...*`, the second thing a document
//: can declare durable. THE OUTGOING LETTER's LOOK lines are the default set
//: shown before any letter has been chosen; when the letters-home system
//: lands it replaces variant 1 with the chosen text and leaves 2 and 3 alone.
//: What it must never do is remove the default, because a player who has
//: chosen nothing yet would then be looking at an object with no answer.
const ALWAYS = /^\*\*(.+?)\*\* — \*[^\n]*must always exist[^\n]*\*$/gm;
const EXAMINE = ['LOOK_AT', 'LISTEN_TO'];

export function check() {
  const report = new Report('Lines the docs mark as fixed have no variant');
  const content = loadContent();
  const targets = allInteractables(content);

  const declared = [];
  const defaults = [];
  for (const doc of DOCS) {
    const text = readFileSync(resolve(ROOT, doc), 'utf8');
    for (const entry of text.matchAll(OVERRIDE)) {
      const [, name, verb, line, instruction] = entry;
      if (!FIXED.test(instruction)) continue;
      declared.push({ doc, name: name.trim(), verb: verb.trim().replace(/ /g, '_'), line });
    }
    for (const entry of text.matchAll(ALWAYS)) {
      defaults.push({ doc, name: plainName(entry[1]) });
    }
  }

  if (declared.length === 0) {
    report.fail('no fixed line found in any document -- the marker or the docs list is wrong');
    return report;
  }
  report.note(`${declared.length} fixed line(s) declared across ${DOCS.length} document(s)`);

  for (const { doc, name, verb, line } of declared) {
    const owners = targets.filter(({ target }) => target.name === name);
    if (owners.length !== 1) {
      report.fail(`${doc}: "${name}" matches ${owners.length} hotspots, not 1`);
      continue;
    }
    const { roomId, target } = owners[0];
    const where = `${roomId}/${target.id}/${verb}`;
    const wired = target.overrides?.[verb];

    if (typeof wired !== 'string') {
      report.fail(`${where}: fixed line is ${wired === undefined ? 'missing' : 'not a string'}`);
      continue;
    }
    if (wired !== line) {
      report.fail(`${where}: fixed line does not match ${doc} -- "${wired}"`);
      continue;
    }
    // The two ways a variant can be added: a repeat list under responses for
    // the same verb, which the engine prefers over the override entirely, or
    // an array in place of the string.
    if (target.responses?.[verb]) {
      report.fail(`${where}: a response rule was added for the fixed verb -- `
        + 'it takes precedence over the override, so the fixed line is now unreachable');
      continue;
    }
    report.note(`  ${where} fixed, one line, no response rule`);
  }

  if (defaults.length > 0) {
    report.note(`${defaults.length} always-present default set(s) declared`);
  }
  for (const { doc, name } of defaults) {
    const owners = targets.filter(({ target }) => target.name === name);
    if (owners.length !== 1) {
      report.fail(`${doc}: "${name}" matches ${owners.length} hotspots, not 1`);
      continue;
    }
    const { roomId, target } = owners[0];
    for (const verb of EXAMINE) {
      const rules = target.responses?.[verb] ?? [];
      const where = `${roomId}/${target.id}/${verb}`;
      // The LAST rule is the fallthrough. A gated rule may be added ahead of
      // it -- that is the letters-home system landing -- but an unconditional
      // rule has to remain behind them all, or a player who has chosen
      // nothing yet is looking at an object with no answer.
      const last = rules[rules.length - 1];
      if (!last) {
        report.fail(`${where}: the always-present default set is gone`);
        continue;
      }
      if (last.when !== undefined) {
        report.fail(`${where}: every rule is gated -- there is no unconditional default left`);
        continue;
      }
      const lines = [last.say, ...(last.repeat ?? [])].filter((s) => typeof s === 'string');
      if (lines.length < 3) {
        report.fail(`${where}: the default set has ${lines.length} line(s), not 3`);
        continue;
      }
      report.note(`  ${where} default set intact, ${lines.length} lines, ungated`);
    }
  }
  return report;
}

//: A doc heading as the name a content file uses. Emphasis inside the span is
//: markdown, not part of the name.
function plainName(text) {
  return text.replace(/\*/g, '').trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
