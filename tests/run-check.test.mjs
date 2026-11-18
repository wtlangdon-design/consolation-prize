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
