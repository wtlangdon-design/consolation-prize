// A CONVERSATION STANDS IN FRONT OF THE FACE (errata 304).
//
// Tyler, 2026-11-14, with a screenshot: "When you talk to the man leaving tomorrow,
// Thad goes to the right side of him while the man faces left." His authored stand
// was at his back. A figure drawn turned says so (`faces`, measured against its rest
// frame by tests/faces.test.mjs); a conversation with it stands on that side, and the
// hero stands there facing him. The engine works the side out the same way when no
// stand is authored (GameScene.talkSide).
//
// One exception, by ruling: the boundary men argue facing each other and are talked
// to from their right, because the hitching horses stand in the near mud on their
// left and a horse's head would cover the hero there (errata 187).
const RULED = { boundary_b: 'errata 187: the horses' };

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DIR = new URL('../content/ambient/', import.meta.url);
const people = readdirSync(DIR).filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')));

test('a figure drawn turned is talked to from in front of its face', () => {
  const turned = people.filter((person) => (person.faces === 'left' || person.faces === 'right') && person.tree && !(person.id in RULED));
  assert.ok(turned.some((person) => person.id === 'man_leaving_tomorrow'), 'the man leaving tomorrow says which way he faces');
  for (const person of turned) {
    if (!person.walkTo) continue;
    const side = person.walkTo.x < person.x ? 'left' : 'right';
    assert.equal(side, person.faces, `${person.id} faces ${person.faces} and is talked to from his ${side}, at his back`);
    if (person.walkTo.facing) {
      assert.equal(person.walkTo.facing, person.faces === 'left' ? 'right' : 'left', `${person.id}: the hero stands facing him`);
    }
  }
});

// EVERY TALKER SAYS WHICH WAY IT FACES (errata 321). Tyler, 2026-11-14, with a screenshot: "Thad stands to the right
// of the pie lady when he talks to her but she's looking left." The rule above held only for a figure that declared
// `faces`; she never had, so nothing looked, and the engine stood Thad on whichever side he came from. The dog's owner
// in the back alley, drawn in profile, was talked to from his back the same way. Now a talker with no declaration
// fails here, so somebody has to look at the figure in its room and say.
test('every figure that can be talked to says which way it faces', () => {
  const silent = people.filter((person) => person.tree && person.sprite?.frames?.length && !['left', 'right', 'front'].includes(person.faces));
  assert.deepEqual(silent.map((person) => person.id), []);
});

test('the check finds a talker drawn turned and talked to from its back', () => {
  const pie = { id: 'pie', tree: 't', x: 2470, faces: 'left', walkTo: { x: 2580 } };
  assert.notEqual(pie.walkTo.x < pie.x ? 'left' : 'right', pie.faces);
});
