import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT, Report } from './lib/content.mjs';
import { GENERATORS, NOT_GENERATORS } from './lib/generators.mjs';

/**
 * Every generated artefact is what its generator would produce today.
 *
 * THE DIFFERENCE BETWEEN THIS AND check-actor-frames. That one catches a
 * record that disagrees with the PICTURES, which is the failure that hurt --
 * a figure height three times too large, drawn at a third size. This catches
 * a record that disagrees with its GENERATOR, which is the larger class the
 * same mistake belongs to. A rig change that alters `walkDx`, or a facing, or
 * adds a clip directory, changes nothing about any frame's dimensions and
 * would sail past a check that only reads PNG headers. It fails here.
 *
 * "Generated and not regenerated" stops being detectable and becomes
 * impossible, which is the point: the failure has no symptom at the moment it
 * is made and a bewildering one an hour later.
 *
 * IT NEVER WRITES. Every registered generator has a `--check` mode that
 * builds its output and compares. A validation pass that mutated the tree
 * would be unsafe to run on a dirty branch, and a check that is unsafe to run
 * is a check that stops being run.
 *
 * AND IT NAMES THE COMMAND. Q34 took forty minutes to find partly because
 * nothing connected "Thad draws at a third of his size" to
 * "build-actor-record.mjs was not re-run". A staleness report that does not
 * say what to run has done half the job.
 */
export function check() {
  const report = new Report('Every generated artefact matches what its generator produces now');

  for (const entry of GENERATORS) {
    const command = entry.command.join(' ');

    for (const output of entry.outputs) {
      if (!existsSync(resolve(ROOT, output))) {
        report.fail(`${entry.id} declares the output ${output} and it does not exist. `
          + `Run: ${command}`);
      }
    }

    if (entry.coveredBy) {
      report.note(`${entry.id}: covered by ${entry.coveredBy}`);
      continue;
    }

    const run = spawnSync(entry.command[0], [...entry.command.slice(1), '--check'],
      { cwd: ROOT, encoding: 'utf8' });
    const lines = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim().split('\n').filter(Boolean);

    if (run.status === 0) {
      report.note(`${entry.id}: ${entry.outputs.length} output(s) current`);
      continue;
    }

    // A generator with no --check mode exits non-zero having written nothing
    // useful, or worse, having written. Distinguished from real staleness so
    // the message is about the missing mode rather than about the file.
    if (!lines.some((line) => line.startsWith('stale: '))) {
      report.fail(`${entry.id} exited ${run.status} without reporting a stale output. `
        + `A registered generator must support --check: build the output and COMPARE, `
        + `printing "stale: <path>" per file and exiting non-zero. See `
        + `tools/extract-content.mjs. ${lines[0] ?? 'no output'}`);
      continue;
    }

    for (const line of lines) {
      if (!line.startsWith('stale: ')) continue;
      report.fail(
        `${line.slice(7)} is NOT what ${entry.id} produces today -- it was generated from `
        + `an older state of its inputs and never regenerated. ${entry.why} `
        + `RUN: ${command}`,
      );
    }
  }

  report.note(`${GENERATORS.length} generator(s) registered, `
    + `${NOT_GENERATORS.length} tool(s) named as deliberately not generators`);
  return report;
}
