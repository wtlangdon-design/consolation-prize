import assert from 'node:assert/strict';
import test from 'node:test';
import { checkLoosened, findLoosenings, pendingWithoutReason } from '../tools/check-friction.mjs';

/**
 * THE FRICTION ALARM, AS TUNED BY THE CHECK REVIEW (2026-11-16; ruled by Tyler 2026-11-18, "do all four").
 *
 * It stops counting two things its reviews kept finding were not loosenings, and starts seeing three lists it could
 * not. Each rule is proved both ways: what it now lets pass, and the loosening it still catches.
 */
const diff = (removed, added) => ['@@ -1 +1 @@', ...removed.map((l) => `-${l}`), ...added.map((l) => `+${l}`)].join('\n');

test('a threshold changed is a loosening, as it always was', () => {
  assert.equal(checkLoosened(diff(['const LIMIT = 0.05;'], ['const LIMIT = 0.08;'])), true);
  assert.equal(checkLoosened(diff(['const LIMIT = 0.05;'], ['const LIMIT = 0.02;'])), true, 'unmarked, even lowered');
  assert.equal(checkLoosened(diff(['const NAME = "a";'], ['const NAME = "b";'])), false, 'no number, no threshold');
});

test('a ratchet that goes down tightens; raised, or reshaped, it is a loosening', () => {
  assert.equal(checkLoosened(diff(['const CAP = 58; // ratchet'], ['const CAP = 41; // ratchet'])), false);
  assert.equal(checkLoosened(diff(["  'a.json': 3, // ratchet"], ["  'a.json': 1, // ratchet"])), false);
  assert.equal(checkLoosened(diff(['const CAP = 41; // ratchet'], ['const CAP = 58; // ratchet'])), true, 'raised');
  assert.equal(checkLoosened(diff(['const CAP = 41; // ratchet'], ['const CAP = 41 + 9; // ratchet'])), true, 'reshaped');
  assert.equal(checkLoosened(diff(['const CAP = 41;'], ['const CAP = 30; // ratchet'])), true, 'the mark added in the same change');
  assert.equal(checkLoosened(diff(['const CAP = 41;'], ['const CAP = 41; // ratchet'])), false, 'only marked, nothing moved');
  // A ratchet lowered beside a threshold raised is still a loosening.
  assert.equal(checkLoosened(['@@ -1 +1 @@', '-const CAP = 9; // ratchet', '+const CAP = 8; // ratchet',
    '@@ -9 +9 @@', '-const MAX = 1;', '+const MAX = 2;'].join('\n')), true);
});

test('a played-pending entry with its reason is not a loosening; one without fails', () => {
  const before = { puzzles: {}, items: {} };
  const after = { puzzles: { D6: 'Needs the Reverend at the foot of Boot Hill, whose staging is not built yet.' }, items: { rod: 'tbd' } };
  assert.deepEqual(pendingWithoutReason(before, after), ['items.rod']);
  const json = (file, atBase) => (atBase ? before : after);
  const { loosened, problems } = findLoosenings(['proofs/played-pending.json'],
    { diffOf: () => diff([], ['    "D6": "..."', '    "rod": "tbd"']), inBase: () => true, json });
  assert.deepEqual([...loosened], []);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /items\.rod/);
});

test('the three lists it could not see are watched: ruled scale ranges, comic exemptions, reach exceptions', () => {
  const states = {
    'content/scale-anchors.json': [{ figures: [{ figure: 'pratt', expect: [0.93, 0.99] }] },
      { figures: [{ figure: 'pratt', expect: [0.93, 0.99] }, { figure: 'judge', expect: [0.9, 1.1] }] }],
    'tests/data/repeats-passed.json': [{ comicExempt: { trees: ['A'], options: [] } }, { comicExempt: { trees: ['A', 'B'], options: [] } }],
  };
  const json = (file, atBase) => states[file]?.[atBase ? 0 : 1] ?? null;
  const diffs = { 'reference/room-05/annotation.json': diff([], ['      "reachException": "Winnie kneels at its end",']) };
  const { loosened } = findLoosenings([...Object.keys(states), ...Object.keys(diffs)],
    { diffOf: (file) => diffs[file] ?? diff([], ['x']), inBase: () => true, json });
  assert.deepEqual([...loosened].sort(), ['tests/feet-clear.test.ts', 'tests/repeats.test.ts', 'tests/scale-vs-thad.test.mjs']);

  // And taking one away, or a figure measured with no ruled range, is not.
  const fewer = {
    'content/scale-anchors.json': [states['content/scale-anchors.json'][0], { figures: [{ figure: 'pratt', expect: [0.93, 0.99] }, { figure: 'cook' }] }],
    'tests/data/repeats-passed.json': [states['tests/data/repeats-passed.json'][1], states['tests/data/repeats-passed.json'][0]],
  };
  const quiet = findLoosenings(Object.keys(fewer),
    { diffOf: () => diff([], ['x']), inBase: () => true, json: (file, atBase) => fewer[file][atBase ? 0 : 1] });
  assert.deepEqual([...quiet.loosened], []);
});

test('the allowlists and movementException are counted as before', () => {
  const { loosened } = findLoosenings(['content/checks/narration-allowlist.json', 'content/actors/x.json'], {
    diffOf: (file) => (file.endsWith('allowlist.json') ? diff([], ['  "back door",']) : diff([], ['  "movementException": "ruled",'])),
    inBase: () => true, json: () => null,
  });
  assert.deepEqual([...loosened].sort(), ['content/checks/narration-allowlist.json', 'tests/movement.test.mjs']);
});
