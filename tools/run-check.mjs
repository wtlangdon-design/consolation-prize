#!/usr/bin/env node
/**
 * `npm run check`: THE TYPECHECK, THE VALIDATION SUITE AND THE TESTS, RUN SIDE BY SIDE.
 *
 * The twice-monthly check review (2026-11-16, ruled by Tyler 2026-11-18: "do all four") found the suite at 153-160 s
 * of its 180 s budget, and over it five times between Nov 11 and 14. The three parts were run one after another
 * (`tsc && run-all && node --test`), though none reads what another writes, and CI's runner has four cores. They now
 * run at once: the wall time is the slowest part, not the sum. Nothing is dropped and nothing is loosened -- every
 * part runs to its end, and any one failing fails the whole.
 *
 * Each part's output is held and printed whole, in the old order, so a log reads as it did. Then one line a part,
 * with its time, and THE SLOWEST TESTS beside run-all's slowest checks: the tests are most of the suite's time, and
 * until now nothing named them.
 *
 * Writes nothing. CI's "Confirm the suite wrote nothing" step holds that.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NODE = process.execPath;

/** The three parts, in the order the log prints them. The commands are the package.json scripts' own. */
export const PARTS = [
  { name: 'typecheck', command: NODE, args: ['node_modules/typescript/bin/tsc', '--noEmit'] },
  { name: 'validate', command: NODE, args: ['tools/run-all.mjs'] },
  {
    name: 'test',
    command: 'sh',
    // The glob is the shell's, exactly as `npm run test` expands it. TAP to stdout, as CI has always logged it, so the
    // slowest can be read from it.
    args: ['-c', `"${NODE}" --experimental-strip-types --test --test-reporter=tap tests/*.test.ts tests/*.test.mjs`],
  },
];

/** Run one part to its end, holding its output. */
const run = (part) => new Promise((resolve) => {
  const started = Date.now();
  const child = spawn(part.command, part.args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const chunks = [];
  child.stdout.on('data', (chunk) => chunks.push(chunk));
  child.stderr.on('data', (chunk) => chunks.push(chunk));
  child.on('error', (error) => chunks.push(Buffer.from(`could not start ${part.name}: ${error.message}\n`)));
  child.on('close', (code) => {
    const seconds = (Date.now() - started) / 1000;
    // Said the moment it ends, so a hang names the part still running.
    console.log(`${part.name} finished in ${seconds.toFixed(0)}s${code === 0 ? '' : ` -- FAILED (exit ${code})`}`);
    resolve({ ...part, code, seconds, output: Buffer.concat(chunks).toString('utf8') });
  });
});

/**
 * The slowest tests in a TAP log: every top-level test point and its duration_ms. Node reports each test file's
 * tests at the top level, so a top-level point is one test.
 */
export function slowestTests(tap, count = 5) {
  const timings = [];
  let name = null;
  for (const line of tap.split('\n')) {
    const point = /^(?:not )?ok \d+ - (.*)$/.exec(line);
    if (point) { name = point[1]; continue; }
    const duration = /^ {2}duration_ms: ([\d.]+)/.exec(line);
    if (duration && name !== null) { timings.push([name, Number(duration[1])]); name = null; }
  }
  return timings.sort((a, b) => b[1] - a[1]).slice(0, count);
}

/**
 * Print every part's output whole, then the summary; the exit code to leave with. Never `process.exit()` after it:
 * to a pipe -- which is what CI's log is -- stdout is written in the background, and exiting at once cuts it off at
 * 64 KB. The first run of this file in CI lost everything after the validation suite's first screen that way, the
 * tests' results and the summary with them.
 */
export function report(results, started, write = (text) => process.stdout.write(text)) {
  for (const result of results) {
    write(`\n========== ${result.name} ==========\n`);
    write(result.output.endsWith('\n') ? result.output : `${result.output}\n`);
  }
  const test = results.find((result) => result.name === 'test');
  const lines = [''];
  for (const result of results) lines.push(`${result.name}: ${result.seconds.toFixed(0)}s${result.code === 0 ? '' : ' FAILED'}`);
  lines.push(`slowest tests: ${slowestTests(test?.output ?? '')
    .map(([name, ms]) => `${name.length > 90 ? `${name.slice(0, 87)}...` : name} ${(ms / 1000).toFixed(1)}s`).join(', ')}`);
  lines.push(`all three, side by side: ${((Date.now() - started) / 1000).toFixed(0)}s`);
  write(`${lines.join('\n')}\n`);
  return results.every((result) => result.code === 0) ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const started = Date.now();
  const results = await Promise.all(PARTS.map(run));
  // Set, not exit: node leaves once stdout has drained, with this code.
  process.exitCode = report(results, started);
}
