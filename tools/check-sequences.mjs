import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * Errata 30a: `wait` is legal ONLY inside a beat whose control is `none`.
 *
 * The restriction is the whole reason the step kind was granted at all.
 * Errata 28a excluded a timed wait to stop "sleep 400ms and hope" becoming a
 * substitute for waitForActor in ordinary interaction, and that reasoning
 * still holds everywhere except a cutscene, where the duration IS the
 * content. A duration on a beat the player is in charge of is the excluded
 * case wearing the granted case's clothes.
 *
 * The runner cannot enforce this: a step has no idea which beat it came from.
 * The lowering in engine/core/Opening.ts refuses it at runtime, and this is
 * the same rule stated where a person can see it fail.
 *
 * Also checks the things a beat sheet can get wrong quietly:
 *   - a beat that both carries lines and hands them to a tree
 *   - a flag write on a beat that no flag file declares
 *   - a speaker with no entry in the file's own speakers table
 */
export function check() {
  const report = new Report('Sequence beats are lowerable (errata 30a, 30b)');
  const content = loadContent();
  const declared = new Set(content.flags.flags.map((flag) => flag.id));

  let beatCount = 0;
  let waits = 0;
  for (const { path, data } of content.sequences ?? []) {
    const seen = new Set();
    for (const beat of data.beats ?? []) {
      beatCount += 1;
      const where = `${path}: beat ${beat.beat}`;

      if (seen.has(beat.beat)) report.fail(`${where}: duplicated`);
      seen.add(beat.beat);

      if (!['menu', 'none', 'player'].includes(beat.control)) {
        report.fail(`${where}: control is "${beat.control}", not menu/none/player`);
      }

      if (beat.seconds !== undefined) {
        waits += 1;
        if (beat.control !== 'none') {
          report.fail(`${where}: states ${beat.seconds}s but its control is "${beat.control}" `
            + '-- errata 30a allows a timed wait only where control is none');
        }
      }

      // Errata 30b: a beat whose lines a tree carries is interactive. If it
      // were left non-interactive the lowering would play the tree's lines as
      // a cutscene AND the tree would offer them again.
      if (beat.carriedBy && beat.control !== 'player') {
        report.fail(`${where}: carried by ${beat.carriedBy} but control is "${beat.control}" `
          + '-- errata 30b makes a carried beat interactive');
      }
      if (beat.carriedBy && !content.dialogue.some(({ data: tree }) => tree.id === beat.carriedBy)) {
        report.fail(`${where}: carried by ${beat.carriedBy}, which is not in the manifest`);
      }

      for (const id of Object.keys(beat.set ?? {})) {
        if (!declared.has(id)) report.fail(`${where}: writes undeclared flag ${id}`);
      }
      for (const spoken of beat.lines ?? []) {
        if (!data.speakers?.[spoken.speaker]) {
          report.fail(`${where}: "${spoken.speaker}" has no entry in the speakers table`);
        }
      }
    }
  }

  report.note(`${beatCount} beats across ${(content.sequences ?? []).length} sequence(s)`);
  report.note(`${waits} timed beat(s); ${report.passed ? 'all' : 'not all'} inside control: none`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
