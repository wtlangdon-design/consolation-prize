import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report, runCheck } from './lib/content.mjs';

/**
 * Every extracted content file matches what its document currently says.
 *
 * CLAUDE.md makes the extraction rule binding: a line that needs changing is
 * changed in /docs and re-extracted, never edited in /content. Until this
 * existed that was a habit. A hand-edit in /content passes every other check
 * in this directory -- the line is still there, it is still unique, it still
 * has glyphs -- and the only symptom is that the game and the document
 * disagree about a comma. This is the check that notices.
 *
 * It runs the extractor in --check mode, which builds what the file should
 * contain and compares rather than writing.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function check() {
  const report = new Report('Extracted content matches its documents');
  const run = spawnSync('node', ['tools/extract-content.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  const lines = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim().split('\n').filter(Boolean);
  if (run.status === 0) {
    for (const line of lines) report.note(line);
    return report;
  }
  for (const line of lines) {
    if (line.startsWith('stale: ')) {
      report.fail(`${line.slice(7)} -- edited by hand, or its document moved on. Re-run `
        + 'tools/extract-content.mjs and change the doc, not the file');
    } else {
      report.fail(line);
    }
  }
  if (report.passed) report.fail(`extractor exited ${run.status} with no explanation`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
