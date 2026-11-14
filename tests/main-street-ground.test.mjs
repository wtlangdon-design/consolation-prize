// MAIN STREET'S FLOOR IS THE GROUND, MEETING EACH PORCH AT ITS FOOT (errata 300).
//
// Tyler, 2026-11-13, with a screenshot of the hero standing against the Nugget's
// window: "Thad can walk partway up the side of a building. And he just randomly
// walks up the edge of the porch instead of going up the stairs. On every
// building." The floor had a boardwalk strip the width of the street, from the
// street as first drawn, and the street's far band started above the porches'
// feet. The redrawn street has a porch to each building at its own depth, with
// stairs and gaps.
//
// Held against points read off the plate at 2x: on a porch, a stair or a wall
// he cannot stand; at the foot of each stair and in front of each building he can.
// Both streets, night and dawn, which are the same street.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { WalkBoxes } from '../engine/core/WalkBoxes.ts';

const read = (name) => JSON.parse(readFileSync(new URL(`../content/rooms/${name}.json`, import.meta.url), 'utf8'));
const streets = [read('main-street'), read('main-street-dawn')];

// Off the floor: the front face of each porch (under its deck, beside its stairs), the walls, the deck behind the
// trough (no stairs reach it), the barrel, the notice board behind its legs.
const OFF = [
  [380, 596, "the mercantile's porch front"], [560, 596, "the Company's porch front"], [930, 588, "the Clarion's porch front"],
  [1300, 582, "the row's porch front"], [1600, 566, "the porch front by the false fronts"],
  [1975, 530, 'the deck behind the trough'], [2400, 598, "the Nugget's porch front"], [2440, 525, "the Nugget's window (Tyler's screenshot)"],
  [2850, 630, "the hotel's porch front"], [3180, 645, "the assay office's porch front"],
  [3230, 620, 'the barrel'], [1150, 560, 'the notice board, behind its legs'], [1830, 560, 'the wall between the porches'],
];
// On the floor: the ground at the foot of each stair and in front of each building; each stair; each deck.
const ON = [
  [260, 640, "the foot of the mercantile's stairs"], [720, 628, "the foot of the Company's stairs"],
  [1010, 615, "the foot of the Clarion's steps"], [1430, 612, "the foot of the row's steps"],
  [1700, 590, 'in front of the false fronts'], [2250, 618, "the foot of the Nugget's step"],
  [2650, 660, "the foot of the hotel's stairs"], [3080, 672, "the foot of the assay office's stairs"],
  [3477, 603, 'the road out to the claims'], [2018, 652, 'in front of the trough'],
  [255, 605, "the mercantile's stairs"], [730, 598, "the Company's stairs"], [1010, 588, "the Clarion's steps"],
  [2250, 596, "the Nugget's step"], [2650, 632, "the hotel's stairs"], [3080, 650, "the assay office's stairs"],
  [300, 574, "the mercantile's porch"], [689, 566, "the Company's porch"], [1097, 558, "the Clarion's porch"],
  [1400, 552, "the row's porch"], [1700, 542, 'the porch by the false fronts'], [2317, 566, "the Nugget's porch"],
  [2707, 600, "the hotel's porch"], [3113, 621, "the assay office's porch"],
];

test('he cannot stand on a porch, a stair or a wall', () => {
  for (const room of streets) {
    const boxes = new WalkBoxes(room.walkBoxes);
    const on = OFF.filter(([x, y]) => boxes.boxAt(x, y)).map(([x, y, what]) => `${what} (${x},${y}) in ${boxes.boxAt(x, y).id}`);
    assert.deepEqual(on, [], `${room.id}: standing where nobody can`);
  }
});

test('he can stand at the foot of every stair, on it, and on every porch', () => {
  for (const room of streets) {
    const boxes = new WalkBoxes(room.walkBoxes);
    const off = ON.filter(([x, y]) => !boxes.boxAt(x, y)).map(([x, y, what]) => `${what} (${x},${y})`);
    assert.deepEqual(off, [], `${room.id}: no floor where there is ground`);
    for (const [x, y, what] of ON) {
      assert.ok(boxes.route(3300, 760, x, y), `${room.id}: no way from the street to ${what}`);
    }
  }
});

test("every door's stand is on the ground or on its porch, never on a porch's front", () => {
  const boxes = new WalkBoxes(streets[0].walkBoxes);
  for (const exit of streets[0].exits ?? []) {
    if (!exit.walkTo) continue;
    assert.ok(boxes.boxAt(exit.walkTo.x, exit.walkTo.y), `${exit.id}: its stand ${exit.walkTo.x},${exit.walkTo.y} is not on the ground`);
    const off = OFF.find(([x, y]) => Math.abs(x - exit.walkTo.x) < 30 && Math.abs(y - exit.walkTo.y) < 12);
    assert.equal(off, undefined, `${exit.id}: its stand is on ${off?.[2]}`);
  }
});

// UP THE STEPS, AND ONLY UP THE STEPS (errata 301; Tyler, 2026-11-13: "I would like him to actually walk up steps onto
// porches."). A deck touches its stairs and nothing else on the ground, so every way onto it is up them.
test('every porch is reached by its stairs, and only by its stairs', () => {
  for (const room of streets) {
    const decks = room.walkBoxes.filter((box) => box.id.startsWith('deck_'));
    assert.ok(decks.length >= 8, `${room.id}: ${decks.length} porches`);
    for (const deck of decks) {
      const name = deck.id.slice('deck_'.length);
      assert.deepEqual(deck.neighbours.filter((id) => !id.startsWith('deck_')), [`stairs_${name}`], `${room.id}: ${deck.id} is joined to ${deck.neighbours}`);
      const boxes = new WalkBoxes(room.walkBoxes);
      const xs = deck.points.map((point) => point.x); const ys = deck.points.map((point) => point.y);
      const route = boxes.route(3300, 760, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
      assert.ok(route, `${room.id}: no way onto ${deck.id}`);
      assert.ok(route.boxes.includes(`stairs_${name}`), `${room.id}: onto ${deck.id} without its stairs: ${route.boxes.join(' > ')}`);
    }
  }
});

// THE STEP UP DOES NOT SHRINK HIM (merged here from tests/interface.test.ts's lip test, errata 300 and 301). A porch
// and its stairs are drawn at the ground's height at the stairs' foot, so going up three steps changes nothing.
test('a porch and its stairs are drawn at the height of the ground at their foot, and there is no lip', () => {
  for (const room of streets) {
    assert.ok(!room.walkBoxes.some((box) => /^boardwalk/.test(box.id)), `${room.id}: a boardwalk strip`);
    const curve = room.walkBoxes.find((box) => box.scaleMode.kind === 'curve').scaleMode;
    const at = (y) => curve.farHeight + ((Math.max(y, curve.farY) - curve.farY) * (curve.nearHeight - curve.farHeight)) / (curve.nearY - curve.farY);
    for (const box of room.walkBoxes.filter((one) => one.scaleMode.kind === 'fixed')) {
      assert.match(box.id, /^(deck|stairs)_/, `${room.id}: ${box.id} is fixed and is not a porch`);
      const stairs = room.walkBoxes.find((one) => one.id === box.id.replace(/^deck_/, 'stairs_'));
      const foot = Math.max(...stairs.points.map((point) => point.y));
      assert.ok(Math.abs(box.scaleMode.height - at(foot)) <= 1, `${room.id}: ${box.id} is drawn at ${box.scaleMode.height}, the ground at its foot at ${at(foot).toFixed(1)}`);
    }
  }
});

// BEHIND THE POSTS WHEN HE IS BEHIND THEM (errata 302; Tyler, 2026-11-13: "make sure Thad isn't walking in front of
// posts on the porch when he should be walking behind them"). Each post is a rect of the plate and the row it stands
// on (RoomFile.occluders); the renderer cuts it out of a figure whose feet are above that row.
test('every porch with posts has them, each standing on its porch, and nobody on the ground is ever behind one', () => {
  for (const room of streets) {
    const posts = room.occluders ?? [];
    assert.ok(posts.length >= 14, `${room.id}: ${posts.length} posts`);
    const span = (box) => {
      const xs = box.points.map((point) => point.x); const ys = box.points.map((point) => point.y);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    const decks = room.walkBoxes.filter((box) => box.id.startsWith('deck_'));
    for (const name of ['mercantile', 'clarion', 'row_1', 'row_2', 'nugget', 'hotel']) {
      const [x0, , x1] = span(decks.find((deck) => deck.id === `deck_${name}`));
      assert.ok(posts.some(({ rect: [x, , w] }) => x < x1 && x + w > x0), `${room.id}: the ${name} porch's posts are not there`);
    }
    for (const post of posts) {
      const [px, , pw] = post.rect;
      // It stands on a porch: its foot is on a deck's rows, or at a deck's front edge.
      const on = decks.some((deck) => { const [x0, y0, x1, y1] = span(deck); return px < x1 + 40 && px + pw > x0 - 40 && post.baseY >= y0 - 6 && post.baseY <= y1 + 8; });
      assert.ok(on, `${room.id}: ${post.id} does not stand on a porch`);
      // Nobody standing anywhere but a porch is behind it.
      for (const box of room.walkBoxes.filter((one) => !one.id.startsWith('deck_'))) {
        const [x0, y0, x1] = span(box);
        if (px < x1 && px + pw > x0) assert.ok(y0 >= post.baseY, `${room.id}: on ${box.id} a man would be behind ${post.id}`);
      }
    }
    // And someone at the back of a porch, where a post stands nearer than him, is behind it.
    const nugget = span(decks.find((deck) => deck.id === 'deck_nugget'));
    assert.ok(posts.some((post) => nugget[1] < post.baseY && post.rect[0] > nugget[0] && post.rect[0] < nugget[2]), `${room.id}: nobody at the back of the Nugget's porch is behind a post`);
  }
});
