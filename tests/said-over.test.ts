import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { clearOfFaces, type FaceBand } from '../engine/render/Renderer.ts';

/**
 * NOTHING IS SAID OVER SOMETHING ELSE (errata 359). Two faults from the Acts III and IV playtests.
 *
 * Speech was placed over its speaker's head and nowhere else. At the séance the speaker sits at the front of the
 * table, and his line was drawn across the faces of the sitters behind him; in the street at the last duel the
 * Colonel's opening line crossed the judges and the Reverend on the porch behind him. Each case below is that
 * geometry, read off the playtest's frames.
 *
 * And a figure's speaking break said its line while another line was being said: the Reverend's prayer began
 * before his own "Let us bow our heads." had been read, because the flag that starts the prayer is set as the
 * exchange that ends with it begins.
 */
const GAP = 6;
const FLOOR = 12;
const LINE = 60;

test('a line said in front of a row of faces is lifted above them', () => {
  // The séance: the block at 400-460 over the speaker's head at 490; the sitters' faces across 540-1400 at 300-470.
  const sitters: FaceBand[] = [{ left: 540, right: 1400, top: 300, bottom: 470 }];
  assert.equal(clearOfFaces(400, LINE, 160, 1290, [], GAP, FLOOR), 400, 'with no face it is where the head put it');
  const y = clearOfFaces(400, LINE, 160, 1290, sitters, GAP, FLOOR);
  assert.ok(y + LINE <= 300, `the line ends at ${y + LINE}, inside the faces that begin at 300`);
});

test('the highest face in its way decides, not the first', () => {
  // The duel: the judges' faces on the porch at 140-170, the Reverend's a little higher at 120-150.
  const porch: FaceBand[] = [{ left: 820, right: 900, top: 140, bottom: 170 }, { left: 900, right: 960, top: 120, bottom: 150 }];
  const y = clearOfFaces(130, 30, 700, 1100, porch, GAP, FLOOR);
  for (const face of porch) assert.ok(y + 30 <= face.top || y >= face.bottom, `the line at ${y} still crosses a face at ${face.top}`);
});

test('a line that crosses no face stays where it was put', () => {
  const beside: FaceBand[] = [{ left: 1500, right: 1600, top: 300, bottom: 360 }];
  assert.equal(clearOfFaces(400, LINE, 160, 1290, beside, GAP, FLOOR), 400);
  assert.equal(clearOfFaces(400, LINE, 160, 1290, [{ left: 600, right: 900, top: 470, bottom: 520 }], GAP, FLOOR), 400);
});

test('it is never lifted out of the frame', () => {
  assert.equal(clearOfFaces(100, LINE, 0, 1920, [{ left: 0, right: 1920, top: 20, bottom: 200 }], GAP, FLOOR), FLOOR);
});

test('the speech anchor lifts the line clear of every face but the speaker\'s', () => {
  const renderer = readFileSync(new URL('../engine/render/Renderer.ts', import.meta.url), 'utf8');
  const start = renderer.indexOf('private speechAnchor');
  const body = renderer.slice(start, renderer.indexOf('\n  /**', start));
  assert.match(body, /clearOfFaces\(/);
  assert.match(body, /this\.facesOtherThan\(this\.speaker\)/);
});

test('a speaking break says nothing while a line is being said', () => {
  const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
  const start = scene.indexOf('private speakingBreaks');
  const body = scene.slice(start, scene.indexOf('\n  /**', start));
  const guard = body.indexOf('this.sayLines.length > 0 || this.pendingSay.length > 0');
  assert.ok(guard > 0, 'speakingBreaks does not wait for the lines being said');
  assert.ok(guard < body.indexOf('breakLine('), 'the wait comes after a break has already taken its line');
});
