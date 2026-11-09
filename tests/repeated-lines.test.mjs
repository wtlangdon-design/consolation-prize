import assert from 'node:assert/strict';
import test from 'node:test';

import { check, findRepeats, readAllowlist } from '../tools/check-repeated-lines.mjs';

/**
 * ERRATA 226: A LINE SEEN WHOLE TWICE ON THE MAIN PATH FAILS. Proved three
 * ways: on a made-up transcript for each rule; on the real game with the two
 * fixes the feel review asked for (errata 224's Sump, errata 225's Frame)
 * taken back out, which the check must catch by the line; and on the real
 * game as it stands, which must pass.
 *
 * The made-up lines are not the game's: they are placeholders that only
 * have to be six words long or not.
 */

const line = (text, extra = {}) => ({ text, speaker: 'someone', kind: 'reply', step: 's', room: 'r', ...extra });
const LONG = 'one two three four five six';
const SHORT = 'one two three four five';

test('a line of six words seen twice is a repeat; five words is not', () => {
  const found = findRepeats([line(LONG), line(SHORT), line(`${LONG}  `), line(SHORT)]);
  assert.deepEqual(found.map((one) => [one.text, one.where.length]), [[LONG, 2]]);
});

test('said by Thad counts as much as said by anyone else', () => {
  const found = findRepeats([line(LONG, { speaker: 'thad', kind: 'echo' }), line(LONG, { speaker: 'thad', kind: 'verb' })]);
  assert.equal(found.length, 1);
});

test('the universal exit pool rotates by design and is never a repeat', () => {
  assert.deepEqual(findRepeats([line(LONG), line(LONG)], { exitPool: [LONG] }), []);
});

test('a [COMIC] option picked again, and its answer, are the player\'s own repeat', () => {
  const first = line(LONG, { tag: 'COMIC', reselected: false });
  const again = line(LONG, { tag: 'COMIC', reselected: true });
  assert.deepEqual(findRepeats([first, again]), []);
  // The same line from a joke picked once each in two places is still twice.
  assert.equal(findRepeats([first, { ...first }]).length, 1);
  // And a TOPIC asked again is not a joke: it counts.
  assert.equal(findRepeats([line(LONG, { tag: 'TOPIC' }), line(LONG, { tag: 'TOPIC', reselected: true })]).length, 1);
});

test('an allowlisted line is still found, and marked allowed', () => {
  const [found] = findRepeats([line(LONG), line(LONG)], { allowed: [LONG] });
  assert.equal(found.allowed, true);
});

test('an allowlist entry without a ruling in its why is refused', async () => {
  const report = await check({ allowlist: [...readAllowlist(), { text: LONG, why: 'because' }] });
  assert.ok(report.failures.some((one) => one.includes(LONG) && one.includes('no why quoting a ruling')), report.failures.join('\n'));
});

test('errata 224 taken out: Sump explains the documents on every visit, and the check names the line', async () => {
  const report = await check({
    mutate: (content) => { delete content.dialogue.get('SUMP').nodes.SUM_B1.openingOnce; },
  });
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((one) => one.includes('That would be circular, and this office is linear.')),
    report.failures.join('\n'));
});

test('errata 225 taken out: Frame says "You\'re new!" on every visit, and the check names it', async () => {
  const report = await check({
    mutate: (content) => {
      const node = content.dialogue.get('FRAME').nodes.FRA_A1;
      delete node.openingOnce;
      delete node.returnOpening;
    },
  });
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((one) => one.includes("'I'd… rather… not,' says mystery man.")), report.failures.join('\n'));
});

test('the game as it stands passes, and the run is the walkthrough\'s path', async () => {
  const report = await check();
  assert.deepEqual(report.failures, []);
});
