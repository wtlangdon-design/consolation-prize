import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import test from 'node:test';

/**
 * THAD TAKES THE LIGHT OF EVERY ROOM HE STANDS IN (errata 260).
 *
 * His coat is one cool blue. In a lamp-lit room nothing tinted him unless a ruling had (the Nugget, the vault), and in
 * the rest he stood like a figure pasted onto the plate: eight rooms of it were on the sheet Tyler was shown on
 * 2026-11-10. So every interior the game has grades him (`figureLight` names `thad`), by ruling or by
 * tools/art/thad-room-light.py, and a new interior that forgets to fails here.
 *
 * Three are left as drawn on purpose, and say why: two whose own people's grades are ruled, and the tent, whose light is ruled by state.
 */
const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const LEFT = {
  laundry: "Mr. Sheng's grade is ruled (errata 207); dimmed to the plate, Thad fell under him",
  bakehouse: "the boy's grade is ruled (errata 207); dimmed to the plate, Thad fell under him",
  ozymandias_tent: 'its light is ruled by state (errata 239): lit, he is as drawn; with the lamp down the room grades him (figureLightWhen)',
};
const baseline = readJson('reference/global-baseline.json').rooms;
const rooms = readJson('content/manifest.json').rooms.map(readJson).filter((room) => room.background);

test('every interior grades Thad into its light, or is one of the two left as drawn', () => {
  const bare = [];
  let interiors = 0;
  for (const room of rooms) {
    const kind = baseline[basename(room.background, '.png')]?.visualType ?? '';
    if (!kind.startsWith('interior')) continue;
    interiors += 1;
    const graded = room.figureLight?.figures?.includes('thad');
    if (LEFT[room.id]) assert.ok(!graded, `${room.id} is listed as left as drawn and grades him: take it off the list`);
    else if (!graded) bare.push(room.id);
  }
  assert.ok(interiors >= 30, `only ${interiors} interiors found: the baseline's kinds have moved`);
  assert.deepEqual(bare, [], 'run python3 tools/art/thad-room-light.py (add the room to its list)');
});

test('a grade for Thad is a tint and a dimming, never a recolouring', () => {
  for (const room of rooms) {
    const grade = room.figureLight;
    if (!grade?.figures?.includes('thad')) continue;
    const own = grade.perFigure?.thad ?? {};
    const light = own.light ?? grade.light ?? [1, 1, 1];
    const brightness = own.brightness ?? grade.brightness ?? 1;
    assert.ok(Math.min(...light) >= 0.7 && Math.max(...light) <= 1, `${room.id}: light ${light} would repaint his coat`);
    assert.ok(brightness >= 0.6 && brightness <= 1, `${room.id}: brightness ${brightness}`);
    const saturate = own.saturate ?? grade.saturate ?? 1;
    assert.ok(saturate >= 0.75 && saturate <= 1.1, `${room.id}: saturate ${saturate} takes his colour out, or adds one`);
  }
});

test('in the Gulch\'s daylight he takes the sun: every day exterior warms him (errata 265)', () => {
  let days = 0;
  for (const room of rooms) {
    const kind = baseline[basename(room.background, '.png')]?.visualType ?? '';
    if (kind !== 'exterior-day') continue;
    days += 1;
    const grade = room.figureLight;
    assert.ok(grade?.figures?.includes('thad'), `${room.id}: a day exterior in which Thad is the one cool, dark thing`);
    const light = grade.perFigure?.thad?.light ?? grade.light ?? [1, 1, 1];
    assert.ok(light[0] > light[2], `${room.id}: his light there is not warm`);
  }
  assert.ok(days >= 5, `only ${days} day exteriors found: the baseline's kinds have moved`);
});
