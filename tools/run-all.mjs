import { runCheck } from './lib/content.mjs';

import { check as noContentInCode } from './check-no-content-in-code.mjs';
import { check as contentSchema } from './check-content-schema.mjs';
import { check as extraction } from './check-extraction.mjs';
import { check as stateCoverage } from './check-state-coverage.mjs';
import { check as sequences } from './check-sequences.mjs';
import { check as townMap } from './check-map.mjs';
import { check as paletteLocked } from './check-palette.mjs';
import { check as walkableZones } from './check-walkable.mjs';
import { check as roomEntries } from './check-room-entries.mjs';
import { check as staging } from './check-staging.mjs';
import { check as walkBoxes } from './check-walk-boxes.mjs';
// IN THE SUITE FROM THE CHANGE THAT COMMITS A PATH, as its own header says:
// until then it passed because its subject did not exist, which is the same
// green as a check that passed on real work.
import { check as beat11Path } from './check-beat11-path.mjs';
import { check as itemNames } from './check-item-names.mjs';
import { check as combinations } from './check-combinations.mjs';
import { check as paletteCycling } from './check-palette-cycling.mjs';
import { check as examineLines } from './check-examine-lines.mjs';
import { check as writtenContent } from './check-written-content.mjs';
import { check as variantOne } from './check-variant-one.mjs';
import { check as fixedLines } from './check-fixed-lines.mjs';
import { check as lookFigures } from './audit-look-figures.mjs';
import { check as dialogueNodes } from './check-dialogue-nodes.mjs';
import { check as flagOrder } from './check-flag-order.mjs';
import { check as glyphCoverage } from './check-glyph-coverage.mjs';
import { check as puzzleGraph } from './check-puzzle-graph.mjs';
import { check as roomOneDrawn } from './check-room-01-drawn.mjs';
import { check as stableSeeds } from './check-stable-seeds.mjs';
import { check as assetPaths } from './check-asset-paths.mjs';
import { check as moverLifecycle } from './check-mover-lifecycle.mjs';
import { check as actorClips } from './check-actor-clips.mjs';
import { check as bootAssets } from './check-boot-assets.mjs';
import { check as actorFrames } from './check-actor-frames.mjs';
import { check as generated } from './check-generated.mjs';
import { check as entityFallback } from './check-entity-fallback.mjs';
import { check as drawerCoverage } from './check-drawer-coverage.mjs';
import { check as keyFringe } from './check-key-fringe.mjs';
import { check as gauntletScript } from './check-gauntlet-script.mjs';
import { check as speechColours } from './check-speech-colours.mjs';
import { check as exitCollisions } from './check-exit-collisions.mjs';

/**
 * The whole validation pass. Every criterion here is a script somebody can
 * read the output of in under a minute -- no adjectives, no judgement calls.
 */
const CHECKS = [
  noContentInCode,
  contentSchema,
  extraction,
  stateCoverage,
  sequences,
  townMap,
  paletteLocked,
  walkableZones,
  roomEntries,
  staging,
  walkBoxes,
  beat11Path,
  itemNames,
  combinations,
  paletteCycling,
  examineLines,
  writtenContent,
  variantOne,
  fixedLines,
  lookFigures,
  dialogueNodes,
  flagOrder,
  glyphCoverage,
  puzzleGraph,
  roomOneDrawn,
  stableSeeds,
  assetPaths,
  actorClips,
  bootAssets,
  actorFrames,
  generated,
  entityFallback,
  drawerCoverage,
  keyFringe,
  gauntletScript,
  speechColours,
  exitCollisions,
];

let failed = 0;
for (const check of CHECKS) {
  let report;
  try {
    // Awaited: a check may load content through the ENGINE's own async loader
    // rather than the tools' parallel one, which is the only way to assert
    // something about the bundle the game actually builds.
    report = await check();
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
