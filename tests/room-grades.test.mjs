import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * EACH ROOM A COLOUR OF ITS OWN (errata 262). Tyler, 2026-11-10: "a nice way to differentiate different rooms from
 * each other, so they don't all look exactly the same."
 *
 * A graded plate is its untouched original put through one function (tools/art/room-grade.py), by the numbers in
 * reference/room-grades.json. This holds that nothing shipped has drifted from that: a plate regenerated or patched
 * by hand without re-running the tool, or a picture cut from a graded plate and left ungraded beside it, fails here.
 */
const root = new URL('..', import.meta.url);
const grades = JSON.parse(readFileSync(new URL('reference/room-grades.json', root), 'utf8')).rooms;

test('every graded picture is its original, graded as the list says', () => {
  let said = '';
  try {
    said = execFileSync('python3', ['tools/art/room-grade.py', '--check'], { cwd: root, encoding: 'utf8' });
  } catch (error) {
    assert.fail(`python3 tools/art/room-grade.py --check:\n${error.stdout}`);
  }
  assert.match(said, /picture\(s\) are their originals, graded/);
});

test('a grade is a lean, not a repaint, and the warm rooms the others are told apart from are left alone', () => {
  for (const [room, spec] of Object.entries(grades)) {
    assert.ok(spec.strength > 0 && spec.strength <= 0.65, `${room}: strength ${spec.strength} repaints the room`);
    assert.ok(spec.saturate >= 1 && spec.saturate <= 1.15, `${room}: saturate ${spec.saturate}`);
    assert.ok(spec.why, `${room}: says why this colour is its own`);
  }
  for (const warm of ['nugget', 'mercantile', 'livery', 'fanshawe_office', 'company_lobby']) {
    assert.ok(!grades[warm], `${warm} is the warm or the red the graded rooms are told apart from`);
  }
  const tints = Object.values(grades).map((spec) => spec.tint.join(','));
  assert.ok(new Set(tints).size >= tints.length - 1, 'the rooms are leaned to the same colour: that is the brown again');
});
