import { loadContent, Report, runCheck } from './lib/content.mjs';
import { collectStrings } from './check-glyph-coverage.mjs';

/**
 * Nothing the game draws carries Markdown emphasis.
 *
 * The design documents are written in prose typography, and prose italicises:
 * "The window is *ajar*." The renderer has no emphasis mechanism -- the font
 * is one weight, one face -- so an asterisk that reaches a compiled line is
 * drawn as an asterisk, which is what Tyler saw over Winnie's head in his
 * Room 5 playthrough (2026-09-04). The fix is at the source: the wording is
 * kept and the markers go, in the document, and this is the check that
 * notices the next one before a player does.
 *
 * Runs over every drawn string the glyph check already walks -- hotspot
 * lines, dialogue prompts, openings, options, replies, repeats, exchanges,
 * verbs, notices, the menu -- so it is one rule for the whole game rather
 * than a rule for Room 5. A literal asterisk is not a thing this script
 * writes, and an underscore-wrapped word is the same notation by another
 * character.
 */
const EMPHASIS = [
  { name: 'asterisk emphasis', test: /\*\S[^*]*\*|\*/ },
  { name: 'underscore emphasis', test: /(^|\s)_\S[^_]*_(\s|$|[.,;!?])/ },
];

export function check() {
  const report = new Report('No drawn string carries Markdown emphasis');
  const content = loadContent();
  const strings = collectStrings(content);
  let found = 0;
  for (const { text, where } of strings) {
    for (const rule of EMPHASIS) {
      if (rule.test.test(text)) {
        found += 1;
        report.fail(`${rule.name} at ${where}: ${JSON.stringify(text)}`);
        break;
      }
    }
  }
  report.note(`${strings.length} strings checked, ${found} carrying emphasis markers`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
