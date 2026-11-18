import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PARTS, slowestTests } from '../tools/run-check.mjs';

/**
 * `npm run check` RUNS ALL THREE PARTS, AND NAMES THE SLOWEST TESTS (the check review, ruled 2026-11-18).
 *
 * The suite now runs its three parts side by side. What would make that a loosening is a part quietly left out, or a
 * part run with different arguments from the script a person runs alone -- so the parts are held to package.json's
 * own scripts.
 */
const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('npm run check runs the typecheck, the validation suite and every test, as their own scripts do', () => {
  assert.equal(scripts.check, 'node tools/run-check.mjs');
  assert.deepEqual(PARTS.map((part) => part.name), ['typecheck', 'validate', 'test']);
  const line = (part) => [part.command, ...part.args].join(' ');
  assert.match(line(PARTS[0]), /typescript\/bin\/tsc --noEmit$/);
  assert.equal(scripts.typecheck, 'tsc --noEmit');
  assert.match(line(PARTS[1]), /tools\/run-all\.mjs$/);
  assert.equal(scripts.validate, 'node tools/run-all.mjs');
  // The test part is the test script with a TAP reporter added, and nothing else changed.
  const [, testScript] = /^node (.*)$/.exec(scripts.test);
  assert.ok(line(PARTS[2]).includes(testScript.replace('--test ', '--test --test-reporter=tap ')), line(PARTS[2]));
});

test('the slowest tests are read from TAP, top-level points only, slowest first', () => {
  const tap = [
    'TAP version 13',
    '# Subtest: quick',
    'ok 1 - quick',
    '  ---',
    '  duration_ms: 3.5',
    '  ...',
    '# Subtest: slow, with a comma',
    'not ok 2 - slow, with a comma',
    '  ---',
    '  duration_ms: 9000',
    '  ...',
    '    # Subtest: nested',
    '    ok 1 - nested',
    '      ---',
    '      duration_ms: 99999',
    '      ...',
    '# duration_ms 12000',
  ].join('\n');
  assert.deepEqual(slowestTests(tap), [['slow, with a comma', 9000], ['quick', 3.5]]);
});

test('a long log reaches a pipe whole, summary last, with the exit code the parts earned', async () => {
  // CI's log is a pipe. The first CI run of tools/run-check.mjs exited at once after printing, and node had flushed
  // only 64 KB: the tests' results and the summary never reached the log. Four megabytes here, through a real pipe.
  const { spawnSync } = await import('node:child_process');
  const script = [
    `import { report } from ${JSON.stringify(new URL('../tools/run-check.mjs', import.meta.url).href)};`,
    "const big = 'x'.repeat(4 << 20);",
    "process.exitCode = report([{ name: 'typecheck', output: big, code: 0, seconds: 1 },",
    "  { name: 'validate', output: 'ok', code: 1, seconds: 2 }, { name: 'test', output: 'ok 1 - t\\n  duration_ms: 5\\n', code: 0, seconds: 3 }], Date.now());",
  ].join('\n');
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', maxBuffer: 64 << 20 });
  assert.ok(child.stdout.length > 4 << 20, `only ${child.stdout.length} bytes arrived`);
  assert.match(child.stdout, /validate: 2s FAILED\ntest: 3s\nslowest tests: t 0\.0s\nall three, side by side: \d+s\n$/);
  assert.equal(child.status, 1, 'a part failing fails the whole');
});
