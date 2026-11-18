/**
 * ERRATA 375: THE ROD IS REQUIRED (Tyler, 2026-11-17: "make the rod required"). The Act II playtest reached the ledge
 * with no rod: at the mine's last junction the right passage was one of two, so the rod (G1, and the piano tuning
 * that pays for it) was never needed. Now the right passage leads out only once the rod has been held out at the line;
 * before that it loops back like the left. Fails on main before errata 375.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));

test('the way out of the mine waits for the rod', () => {
  const g2 = json('content/puzzles/puzzle-graph.json').puzzles.find((one) => one.id === 'G2');
  for (const site of g2.completedBy) {
    assert.ok(site.requires.some((need) => need.startsWith('ROD_AT_LINE')), `${site.site} does not wait for the rod`);
  }
  const writers = json('content/flags/flags.json').flags.find((one) => one.id === 'ROD_AT_LINE').writtenBy;
  assert.ok(writers.length > 0 && writers.every((site) => site.startsWith('combination:brass_rod:')), 'only the rod answers the line');
});

test('before the rod the right passage loops back, and says what the survey said about the rod once', () => {
  const room = json('content/rooms/mine-line.json');
  const loop = room.exits.find((exit) => exit.id === 'right_passage_loop');
  assert.equal(loop.to, room.id);
  assert.match(loop.transitScene[0].say, /rod/);
});
