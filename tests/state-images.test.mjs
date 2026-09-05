import assert from 'node:assert/strict';
import test from 'node:test';

import { loadContent } from '../tools/lib/content.mjs';
import { check, roomVisualStates } from '../tools/check-state-images.mjs';

/**
 * THE DAY/NIGHT COMPANION CHECK, PROVED BY REINTRODUCING THE DEFECT. Doc 46
 * part three: a check is proved by handing it the bug it is named after and
 * watching it fail by name. Every witness here starts from the real content
 * and breaks exactly one thing.
 */

const room5 = (content) => content.rooms.find(({ data }) => data.id === 'assay_office').data;
const stateOf = (room, id, name) => room.hotspots.find((h) => h.id === id).states[name];
const failing = (report, pattern) => report.failures.filter((line) => pattern.test(line));

// SINCE THE PROMOTION (doc 36 Q116) NIGHT IS THE BASE and DAY is the
// companion state: the shipping plate and the shipping boards are the night
// files, and the day boards are reached through imageByState.day.
test('the live content passes, and Room 5 answers to the day state', () => {
  const content = loadContent();
  const report = check(content);
  assert.deepEqual(report.failures, []);
  assert.deepEqual(roomVisualStates(room5(content)), ['day']);
});

test('a base-only overlay in a room with a companion state fails by name (the floorboard defect)', () => {
  const content = loadContent();
  const board = stateOf(room5(content), 'floorboard', 'rest');
  delete board.imageByState.day;
  const report = check(content);
  const hits = failing(report, /floorboard\/rest: .* has no imageByState\.day/);
  assert.equal(hits.length, 1, report.failures.join('\n'));
});

test('a prop with no companion must say it is the same in every state', () => {
  const content = loadContent();
  const lamp = stateOf(room5(content), 'hanging_lamp', 'lit');
  assert.equal(lamp.sameInAllStates, true, 'the lamp declares it');
  delete lamp.sameInAllStates;
  const report = check(content);
  assert.equal(failing(report, /hanging_lamp\/lit: .* does not say sameInAllStates/).length, 1);
});

test('a companion of the wrong size fails on geometry', () => {
  const content = loadContent();
  const board = stateOf(room5(content), 'floorboard', 'pressed');
  // The ink stand is a 74x50 prop sheet, not a 1920x864 overlay.
  board.imageByState.night = 'art/staging/room-05/winnie-02-counter/inkstand.png';
  const report = check(content);
  assert.equal(failing(report, /floorboard\/pressed: imageByState\.night is 74x50/).length, 1);
});

test('a companion that names the base file is refused as sameInAllStates in disguise', () => {
  const content = loadContent();
  const board = stateOf(room5(content), 'floorboard', 'rest');
  board.imageByState.night = board.image;
  const report = check(content);
  assert.equal(failing(report, /floorboard\/rest: imageByState\.night names the base image/).length, 1);
});

test('a missing companion file is named', () => {
  const content = loadContent();
  const board = stateOf(room5(content), 'floorboard', 'rest');
  board.imageByState.night = 'art/staging/room-05/floorboard/no-such-board.png';
  const report = check(content);
  assert.equal(failing(report, /no-such-board\.png, which does not exist/).length, 1);
});

test('a room that answers to no visual state asserts nothing and says so', () => {
  const content = loadContent();
  const street = content.rooms.find(({ data }) => data.id === 'main_street').data;
  assert.deepEqual(roomVisualStates(street), []);
  content.rooms = content.rooms.filter(({ data }) => data.id === 'main_street');
  const report = check(content);
  assert.deepEqual(report.failures, []);
  assert.ok(report.notes.some((note) => /nothing was asserted/.test(note)));
});
