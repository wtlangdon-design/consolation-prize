import assert from 'node:assert/strict';
import test from 'node:test';

import { check, findTemplates, gameThadLines, readAllowlist, thadLinesOf } from '../tools/check-narration-templates.mjs';

/**
 * ERRATA 226: A PHRASE THAD REACHES FOR UNDER FOUR SUBJECTS FAILS, unless it
 * is allowlisted. Proved on made-up line sets for each rule, by putting a
 * habit into the real game's lines, and on the real game as it stands.
 *
 * The made-up lines are placeholders, not the game's writing.
 */

const each = (...texts) => texts.map((text, at) => ({ text, subject: `s${at}` }));

test('a phrase under four subjects fails; under three it is only listed', () => {
  const habit = each(
    'The kettle, which I am told is the custom.',
    'The fence, which I am told is the law.',
    'The mule, which I am told is a horse.',
    'The hat, which I am told is fashionable.',
  );
  const failing = check({ lines: habit, allowlist: [] });
  assert.equal(failing.passed, false);
  assert.ok(failing.failures.some((one) => one.startsWith('"which i am told is" x4')), failing.failures.join('\n'));
  const listed = check({ lines: habit.slice(0, 3), allowlist: [] });
  assert.equal(listed.passed, true);
  assert.match(listed.notes.join('\n'), /"which i am told is" x3/);
});

test('leading and trailing stopwords come off: "in four minutes" and "four minutes ago" are one phrase', () => {
  const found = findTemplates(each('Done in four minutes.', 'It was four minutes ago.', 'Four minutes. A record.'));
  assert.deepEqual(found.map((one) => [one.phrase, one.count]), [['four minutes', 3]]);
});

test('a phrase of nothing but stopwords is not a habit', () => {
  assert.deepEqual(findTemplates(each('It is in the box.', 'It is in the hat.', 'It is in the cart.', 'It is in the hole.')), []);
});

test('a name is not a habit: a run of words he always capitalises mid-sentence', () => {
  const lines = each('I walked down Main Street again.', 'Back on Main Street again.', 'Up Main Street again.', 'Along Main Street again.');
  assert.deepEqual(findTemplates(lines), []);
  // The same words in lower case are a habit.
  const plain = each('I walked down main street again.', 'Back on main street again.', 'Up main street again.', 'Along main street again.');
  assert.deepEqual(findTemplates(plain).map((one) => [one.phrase, one.count]), [['main street', 4]]);
});

test('one subject is one use: three lines about the same board are the board, not a habit', () => {
  const board = ['A loose board here.', 'The loose board creaks.', 'That loose board again.'].map((text) => ({ text, subject: 'board' }));
  assert.deepEqual(findTemplates(board), []);
});

test('an allowlisted phrase passes, and one without a ruling in its why is refused', () => {
  const habit = each('Four minutes flat.', 'Four minutes flat, again.', 'In four minutes flat.', 'Four minutes flat; done.');
  assert.equal(check({ lines: habit, allowlist: [{ text: 'four minutes flat', why: 'Tyler, a ruling' }] }).passed, true);
  const bad = check({ lines: habit, allowlist: [{ text: 'four minutes flat', why: 'because' }] });
  assert.ok(bad.failures.some((one) => one.includes('no why quoting a ruling')));
});

test('whose a line is: in a tree a bare say is the owner\'s; elsewhere it is Thad\'s unless `by` names another', () => {
  const tree = { nodes: { N: { opening: [{ speaker: 'thad', line: 'mine' }, { speaker: 'sump', line: 'his' }],
    options: [{ id: 'o', tag: 'TOPIC', text: 'asked', say: 'answered', repeat: 'answered again' }] } },
  examine: { LOOK_AT: [{ say: 'looked' }] } };
  assert.deepEqual(thadLinesOf(tree, 'thad', { dialogue: true }).map((one) => one.text).sort(), ['asked', 'looked', 'mine']);
  const room = { hotspots: [{ responses: { LOOK_AT: [{ say: 'seen', repeat: ['seen again'] }, { say: 'theirs', by: 'sump' }] },
    overrides: { USE: 'used' }, note: 'not a line' }] };
  assert.deepEqual(thadLinesOf(room, 'thad').map((one) => one.text).sort(), ['seen', 'seen again', 'used']);
});

test('a habit put into the real game fails it', () => {
  const lines = gameThadLines();
  const planted = [...lines, ...each(
    'Planted, as the almanac quietly suggests.',
    'Planted again, as the almanac quietly suggests.',
    'Planted twice, as the almanac quietly suggests.',
    'Planted thrice, as the almanac quietly suggests.',
  ).map((one) => ({ ...one, subject: `planted#${one.subject}` }))];
  const report = check({ lines: planted });
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((one) => one.includes('almanac quietly suggests')), report.failures.join('\n'));
});

test('the game as it stands passes, and every allowlisted phrase is still in use', () => {
  const report = check();
  assert.deepEqual(report.failures, []);
  assert.ok(readAllowlist().length > 0);
  assert.deepEqual(report.notes.filter((one) => one.includes('can come off the list')), []);
});
