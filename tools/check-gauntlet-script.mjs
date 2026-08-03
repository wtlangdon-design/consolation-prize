import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { readJson, Report, ROOT } from './lib/content.mjs';
import { validateScript } from './gauntlet/schema.mjs';

/**
 * The gauntlet scripts are well formed and agree STRUCTURALLY with the
 * sequences they script. Doc 44.
 *
 * IT RUNS IN `npm run validate`, WITHOUT A BROWSER, because the file is
 * written by hand from a prose document and the feedback on a typo should
 * arrive in a second rather than after a headless Chromium has booted, played
 * an opening and failed on something that was never about the game.
 *
 * WHAT IT REFUSES TO CHECK IS THE POINT. Not one coordinate, height, facing or
 * clip is compared against the content. Doc 44's third honesty: a script
 * validated against the staging table would be the staging table compared with
 * itself, and would pass whatever the staging said -- which is R5i, a
 * mechanism agreeing with itself. The structure is which beats exist, in what
 * order, under what control. The numbers are the independent half, and the
 * only thing that makes the gauntlet worth running.
 *
 * IT PRINTS THE COVERAGE EVERY TIME, PASS OR FAIL. A script that asserts
 * nothing passes this check, correctly -- an empty script is not malformed --
 * and would read as "the gauntlet is green" to anyone who did not look
 * closely. So the count is stated in the same breath.
 */
export function check() {
  const report = new Report('gauntlet scripts');
  const dir = resolve(ROOT, 'tools/gauntlet');
  const scripts = readdirSync(dir).filter((name) => name.endsWith('.json'));
  if (scripts.length === 0) {
    report.fail('tools/gauntlet holds no *.json script at all');
    return report;
  }

  for (const name of scripts) {
    const path = `tools/gauntlet/${name}`;
    const script = readJson(path);
    let sequence = null;
    try {
      sequence = readJson(`content/sequences/${script.sequence}.json`);
    } catch {
      report.fail(`${path}: names sequence "${script.sequence}", which does not exist`);
      continue;
    }

    const { errors, warnings, coverage } = validateScript(script, sequence);
    for (const message of errors) report.fail(`${path}: ${message}`);
    for (const message of warnings) report.note(`${path}: ${message}`);

    if (coverage) {
      const { checked, total, unscripted } = coverage;
      report.note(`${path}: ${checked} of ${total} beats assert something`);
      // NO SILENT CAPS. A skipped beat is named, with its reason, on every
      // run -- so a script that covers two beats of eleven cannot be mistaken
      // for one that covers the opening.
      for (const line of unscripted) report.note(`  not checked -- ${line}`);
    }
  }
  return report;
}
