import { runCheck } from './lib/content.mjs';

import { check as noContentInCode } from './check-no-content-in-code.mjs';
import { check as contentSchema } from './check-content-schema.mjs';
import { check as paletteLocked } from './check-palette.mjs';
import { check as walkableZones } from './check-walkable.mjs';
import { check as roomEntries } from './check-room-entries.mjs';
import { check as staging } from './check-staging.mjs';
import { check as paletteCycling } from './check-palette-cycling.mjs';
import { check as examineLines } from './check-examine-lines.mjs';
import { check as writtenContent } from './check-written-content.mjs';
import { check as variantOne } from './check-variant-one.mjs';
import { check as lookFigures } from './audit-look-figures.mjs';
import { check as dialogueNodes } from './check-dialogue-nodes.mjs';
import { check as flagOrder } from './check-flag-order.mjs';
import { check as glyphCoverage } from './check-glyph-coverage.mjs';
import { check as puzzleGraph } from './check-puzzle-graph.mjs';

/**
 * The whole validation pass. Every criterion here is a script somebody can
 * read the output of in under a minute -- no adjectives, no judgement calls.
 */
const CHECKS = [
  noContentInCode,
  contentSchema,
  paletteLocked,
  walkableZones,
  roomEntries,
  staging,
  paletteCycling,
  examineLines,
  writtenContent,
  variantOne,
  lookFigures,
  dialogueNodes,
  flagOrder,
  glyphCoverage,
  puzzleGraph,
];

let failed = 0;
for (const check of CHECKS) {
  let report;
  try {
    report = check();
  } catch (error) {
    console.log(`FAIL  ${check.name} threw`);
    console.log(`      x ${error instanceof Error ? error.message : String(error)}`);
    failed += 1;
    continue;
  }
  if (!runCheck(report)) failed += 1;
}

console.log('');
console.log(failed === 0 ? `All ${CHECKS.length} checks passed.` : `${failed} of ${CHECKS.length} checks failed.`);
process.exit(failed === 0 ? 0 : 1);
