import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { readPng } from '../tools/lib/png.mjs';

/**
 * WINNIE COMES OUT FROM BEHIND HER COUNTER (errata 270; doc 95 row 74).
 *
 * "She produces it from under the floor." was printed for two days after everything but her walk was drawn. Tyler,
 * 2026-11-10, chose the staging: she walks out, kneels at the loose board, and stays there with the ledger until
 * Thad leaves the office. This holds the pieces of that together, because each is in a different file and the
 * scene is only right when all of them are.
 */
const root = new URL('..', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const text = (path) => readFileSync(new URL(path, root), 'utf8');
const out = read('content/ambient/winnie-at-board.json');
const counter = read('content/ambient/winnie.json');
const room = read('content/rooms/assay-office.json');

test('the direction is acted, by her, at the board', () => {
  const row = read('content/acted-directions.json').directions.find((one) => one.n === 74);
  assert.equal(row.class, 'A');
  assert.ok(row.performedBy.includes('winnie_at_board'), 'row 74 is not hers at the board');
  assert.ok(room.ambient.includes('winnie_at_board'));
});

test('she is one woman: called by her direction, walking from where she stood, and nobody is left behind the counter', () => {
  assert.equal(out.standsInFor, 'winnie');
  assert.equal(out.speaksAs, 'winnie');
  assert.equal(out.arrive.onAct, true, 'she would walk out when the flags land, after every line has been said');
  assert.equal(out.arrive.path[0][0], counter.x, 'her walk does not begin where her counter figure stands: the swap would jump');
  assert.ok(out.arrive.frames.length >= 6);
});

test('behind the counter she is behind it, and in front of it she is not', () => {
  const { plane, legs } = out.arrive.behind;
  const level = room.occlusionPlanes.find((one) => one.level === plane);
  assert.ok(level, `the room has no plane ${plane}`);
  const mask = readPng(readFileSync(new URL(level.mask, root)));
  const alpha = (x, y) => mask.pixels[(y * mask.width + x) * 4 + 3];
  assert.equal(alpha(1000, 500), 255, 'the counter front does not hide her legs');
  assert.equal(alpha(1000, 760), 0, 'the floor in front of the counter would be cut out of her');
  assert.ok(alpha(1301, 300) > 0 && alpha(1301, 300) < 255, 'the bell jar is not glass: she should show through it');
  // Only the legs behind the counter are drawn through it: their floor is above the counter's foot, the rest below.
  const path = [...out.arrive.path, [out.x, out.y]];
  for (let leg = 1; leg < path.length; leg += 1) {
    const [, y0] = path[leg - 1]; const [, y1] = path[leg];
    if (leg <= legs) assert.ok(y0 < 712 && y1 < 712, `leg ${leg} is drawn behind the counter and walked in front of it`);
  }
  assert.ok(path[legs + 1][1] > 712, 'she never comes out to the front');
});

test('she passes behind Thad where he stands at the window, and stops clear of him', () => {
  const stand = counter.walkTo;
  const path = [...out.arrive.path, [out.x, out.y]];
  for (let leg = 1; leg < path.length; leg += 1) {
    const [x0, y0] = path[leg - 1]; const [x1, y1] = path[leg];
    if (y0 < 712 && y1 < 712) continue;
    if ((x0 - stand.x) * (x1 - stand.x) > 0) continue;
    const y = y0 + (y1 - y0) * ((stand.x - x0) / (x1 - x0));
    assert.ok(y < stand.y, `she crosses x ${stand.x} at y ${y.toFixed(0)}, in front of where he stands (${stand.y})`);
  }
  assert.ok(stand.x - out.x >= 140, 'she kneels on his feet');
});

test('the ledger is in her hands at rest, and on the counter only when she is back behind it', () => {
  assert.deepEqual(out.when, { T_SECOND_LEDGER: true, T_LEDGER_ON_COUNTER: false });
  assert.deepEqual(out.sprite.frames[0], out.sprite.frames[1], 'her rest frames are not the one with the ledger closed');
  assert.ok(out.sprite.props.some((prop) => prop.sheet.endsWith('board-lifted.png')), 'the board is not lifted while she is at it');
});

test('the engine has what the scene needs', () => {
  const scene = text('engine/scenes/GameScene.ts');
  assert.ok(scene.includes('private awaitingEntrance(') && scene.includes('this.ambient.summon(pose.id)'), 'nobody calls her when her direction comes up');
  assert.ok(scene.includes('this.entering ? null : this.performance?.current?.poses'), 'the beat holds frames while she is still walking in');
  const renderer = text('engine/render/Renderer.ts');
  assert.ok(renderer.includes('behind.plane') && renderer.includes('drawLeftBehind'), 'her walk is not drawn behind the counter, or the ink stand leaves with her');
  assert.ok(text('engine/core/Ambient.ts').includes('replaced.has(id)'), 'her counter figure stays behind while she walks');
});
