import { allInteractables, loadContent, Report, runCheck } from './lib/content.mjs';

const EXAMINE = ['LOOK_AT', 'LISTEN_TO'];

/**
 * Doc 17's rule: VARIANT 1 MUST STAND ALONE.
 *
 * Most players examine an object once. Variant 1 is therefore the only line
 * most of them will ever see, and it has to work cold -- establishing what
 * the thing is, with no prior knowledge assumed. Variants 2 and 3 may lean
 * on what came before; variant 1 has nothing to lean on.
 *
 * This flags CANDIDATES, not verdicts. Whether "Still flat." is a violation
 * or a joke is a writing judgement and the tool does not make it -- it finds
 * the lines that carry the grammar of a continuation and puts them in front
 * of somebody who can decide. Reported as notes rather than failures for
 * exactly that reason: a red check should mean something is wrong, and half
 * of these will turn out to be fine.
 */

//: Words and shapes that only make sense as a second observation.
const CONTINUATION = [
  /^still\b/i,
  /^the same\b/i,
  /^nothing new\b/i,
  /^\s*(?:it|he|she|they)\b/i,      // a pronoun with no antecedent in the line
  /^again\b/i,
  /^and\b/i,
  /\bstill\b/i,
  /\banother\b/i,
];

//: Phrases asserting elapsed time or prior observation. These are the ones
//: that read oddly on a first visit rather than being ungrammatical.
const ELAPSED = [
  /\bI have (?:asked|watched|counted|checked|measured|begun|started|stopped)\b/i,
  /\beleven weeks\b/i,
  /\bsince I arrived\b/i,
  /\bevery time I\b/i,
  /\bI keep\b/i,
];

export function check() {
  const report = new Report('Variant 1 stands alone (doc 17)');
  const content = loadContent();
  const fixtures = new Set(
    content.rooms.filter(({ data }) => data.fixture).map(({ data }) => data.id),
  );

  const continuation = [];
  const elapsed = [];
  let sequences = 0;

  for (const { roomId, target } of allInteractables(content)) {
    if (target.stub || fixtures.has(roomId)) continue;
    for (const verb of EXAMINE) {
      const rule = target.responses?.[verb]?.[0];
      if (typeof rule?.say !== 'string') continue;
      if (!rule.repeat?.length) continue;      // nothing to stand alone against
      sequences += 1;
      const where = `${roomId}/${target.id}/${verb}`;
      const first = rule.say;

      // A pronoun opening is only suspicious when the line never names the
      // thing -- "It is leaving" on a coach is fine, because the sentence
      // line above it says THE COACH.
      if (CONTINUATION.some((pattern) => pattern.test(first))) {
        continuation.push({ where, line: first });
      }
      if (ELAPSED.some((pattern) => pattern.test(first))) {
        elapsed.push({ where, line: first });
      }
    }
  }

  report.note(`${sequences} sequences with repeat variants checked`);
  report.note('candidates only -- whether each is a violation is a writing judgement');
  for (const { where, line } of continuation) {
    report.note(`  continuation grammar  ${where}: "${truncate(line)}"`);
  }
  for (const { where, line } of elapsed) {
    report.note(`  assumes elapsed time  ${where}: "${truncate(line)}"`);
  }
  return report;
}

function truncate(line) {
  return line.length > 72 ? `${line.slice(0, 69)}...` : line;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
