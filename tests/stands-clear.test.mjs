// HE STANDS CLEAR, WHATEVER THE VERB, AND NEVER ON A BYSTANDER (errata 337).
//
// The Act I playtest (a reviewer playing the build in a browser) found Thad in front of the cat for PUSH and the
// rain barrel for USE, in front of the Colonel and the undertaker while he looked at the things beside them, and
// standing inside the letter-writer after a click on the street beside him. Errata 330's stand-beside rule covered
// LOOK AT and LISTEN TO only and looked only at the thing; a walk's end was moved off movers, and the bystanders are
// not movers.
//
// Held here, on the scene's source: the stand-beside rule is not limited to the examining verbs; it passes over a
// stand that hides a person; and a walk's end is moved off the room's standing people as well as its movers.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
const method = (name) => {
  const from = scene.indexOf(`  private ${name}(`);
  assert.ok(from >= 0, `GameScene has ${name}`);
  return scene.slice(from, scene.indexOf('\n  }\n', from));
};

test('the stand-beside rule answers every verb on a thing, not only the examining ones', () => {
  const rule = method('besideIt');
  assert.ok(!/examineVerbs/.test(rule), 'no longer limited to LOOK AT and LISTEN TO');
  assert.match(rule, /verb === 'WALK_TO'/, 'a plain walk goes where it was sent');
});

test('a stand that hides somebody in the room is passed over', () => {
  const rule = method('besideIt');
  assert.match(rule, /COVERS_A_PERSON/);
  assert.match(rule, /this\.ambient\.present/);
});

test('a walk never ends on a bystander', () => {
  const clear = method('clearOfStanding');
  assert.match(clear, /this\.ambient\.present/, 'the room\'s people count, not only the movers');
  assert.match(clear, /'standing'/);
});
