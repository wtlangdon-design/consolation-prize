import { allInteractables, loadContent, Report, runCheck } from './lib/content.mjs';

const MIN_VARIANTS = 3;
const EXAMINE = ['LOOK_AT', 'LISTEN_TO'];

/**
 * Written content the design requires and that has not been written yet.
 *
 * This check exists to fail. CLAUDE.md is explicit that a missing line is
 * reported rather than filled, so the gap has to live somewhere visible
 * instead of being quietly papered over with generated text -- and a red
 * check is more visible than a paragraph in a handover note.
 *
 * Two requirements, both from the design documents:
 *   - Doc 05 warning 4: three repeat-selection variants minimum per hotspot.
 *   - Doc 06 core systems: every object needs a fallback pool for verb
 *     combinations it does not handle, "never a generic 'I can't do that'".
 */
export function check() {
  const report = new Report('Written content the design requires is present');
  const content = loadContent();
  const verbIds = content.verbs.verbs.map((verb) => verb.id);
  const pools = content.verbFallbacks?.pools ?? {};

  const thinVariants = [];
  const noFallback = [];
  let responses = 0;

  const fixtureRooms = new Set(
    content.rooms.filter(({ data }) => data.fixture).map(({ data }) => data.id),
  );

  for (const { roomId, target } of allInteractables(content)) {
    // Engine test fixtures are not shipped content and are not held to doc
    // 05's standard -- they exist to exercise code paths, not to be read.
    if (target.stub || fixtureRooms.has(roomId)) continue;
    const where = `${roomId}/${target.id}`;

    for (const verb of EXAMINE) {
      for (const rule of target.responses?.[verb] ?? []) {
        if (typeof rule.say !== 'string') continue;
        responses += 1;
        const variants = 1 + (rule.repeat?.length ?? 0);
        if (variants < MIN_VARIANTS) thinVariants.push({ where: `${where}/${verb}`, have: variants });
      }
    }

    // A verb is covered by a written response, an object-specific override,
    // an object pool, or the global pool for that verb -- in that order.
    const silent = verbIds.filter(
      (verb) =>
        !(target.responses ?? {})[verb] &&
        !(target.overrides ?? {})[verb] &&
        (target.fallback ?? []).length === 0 &&
        (pools[verb] ?? []).length === 0,
    );
    if (silent.length > 0) {
      noFallback.push({ where, unhandled: silent.length });
    }
  }

  if (thinVariants.length > 0) {
    const missing = thinVariants.reduce((sum, entry) => sum + (MIN_VARIANTS - entry.have), 0);
    report.fail(`${missing} repeat-selection lines missing (doc 05 wants ${MIN_VARIANTS} per hotspot verb)`);
    report.fail(`  ${thinVariants.length} of ${responses} examine responses have only one line`);
  }
  if (noFallback.length > 0) {
    const combinations = noFallback.reduce((sum, entry) => sum + entry.unhandled, 0);
    report.fail(`${noFallback.length} objects have no fallback pool, leaving ${combinations} verb combinations silent`);
    for (const entry of noFallback.slice(0, 4)) {
      report.fail(`  ${entry.where}: ${entry.unhandled} unhandled verbs, no pool`);
    }
    if (noFallback.length > 4) report.fail(`  ...and ${noFallback.length - 4} more`);
  }

  report.note('these lines exist in the design or must be authored -- they are not to be generated');
  report.note(`${responses} examine responses checked; ${fixtureRooms.size} fixture room(s) excluded`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
