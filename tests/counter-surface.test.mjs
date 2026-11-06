import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readPng } from '../tools/lib/png.mjs';

/**
 * NOTHING ON THE COUNTER IS THE FIGURE'S. Tyler, 2026-11-06, of the Registrar
 * at his window: "That's a book on a book. You have to make sure these
 * character changes aren't sloppy or added in a lazy way."
 *
 * A figure behind a counter was generated holding his own ledger, and the
 * room's plate already has one there: two books, one floating on the other,
 * and his sliding a few pixels between poses. The room's counter and what is
 * on it belong to the plate. A behind-counter figure is cut at the waist where
 * the counter's back edge hides it, forearms forward, and the only things at
 * its bottom edge are its hands (doc 55 section 8).
 *
 * Held from the frames: along the bottom SPAN rows of every frame, no solid run
 * of drawn pixels may be wider than WIDEST of the frame. A hand is about 0.15
 * to 0.25 of a waist-up frame; a hand holding a notebook 0.39; the ledger Tyler
 * caught measured 0.50, the clerk's writing-frame ledger 0.56, a held register
 * 0.86, a plank on the bench 0.92.
 *
 * A figure WAITING with its arms folded (`sprite.hands: "folded"`) has nothing
 * forward of its waist, and its bottom rows are the waist itself, not hands:
 * there, nothing along the bottom may be wider than FOLDED of the figure's
 * widest row above it -- an object on the counter is wider than the body.
 * Every behind-counter figure declares which it is.
 *
 * AND THE BODY STOPS AT THE FAR EDGE OF WHAT IS IN FRONT OF IT. Tyler, the same
 * day, of the redrawn Registrar: "body is partially on top of the book. BE
 * CAREFUL." His waist had been set on the counter's back edge, which lies
 * below the ledger's far edge, so his waistcoat covered the top of the pages.
 * Every behind-counter figure declares `sprite.waistOn`, the plate row its
 * waist ends on; held here twice over:
 *   - the rest frame's waist (the lowest drawn row of its centre column) lands
 *     on that row, within one pixel; and
 *   - that row IS an edge in the plate across the figure's waist (within REACH
 *     of its x), standing EDGE times out of the rows around it
 *     (edgeProminence), so a number that matches the drawing but not the room
 *     fails too.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const SPAN = 6;
const WIDEST = 0.45;
const EDGE = 4;
const FOLDED = 0.85;
const REACH = 40;

const lists = JSON.parse(readFileSync(resolve(ROOT, 'proofs/counter-surface-awaiting.json'), 'utf8'));
const awaiting = new Set(lists.awaiting);
const awaitingWaist = new Set(lists.awaitingWaist);
const figures = readdirSync(resolve(ROOT, 'content/ambient')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(resolve(ROOT, 'content/ambient', f), 'utf8')))
  .filter((npc) => npc.posture === 'behind-counter' && npc.sprite?.frames?.length);

/** The widest solid run of drawn pixels along a frame's bottom SPAN rows, as a share of its width. */
export function widestAtCounter(png, [x0, y0, w, h]) {
  let bottom = -1;
  for (let y = h - 1; y >= 0 && bottom < 0; y -= 1) {
    for (let x = 0; x < w; x += 1) if (png.pixels[((y0 + y) * png.width + x0 + x) * 4 + 3] > 128) { bottom = y; break; }
  }
  let widest = 0;
  for (let y = Math.max(0, bottom - SPAN + 1); y <= bottom; y += 1) {
    let run = 0;
    for (let x = 0; x < w; x += 1) {
      run = png.pixels[((y0 + y) * png.width + x0 + x) * 4 + 3] > 128 ? run + 1 : 0;
      widest = Math.max(widest, run);
    }
  }
  return widest / w;
}

const worst = (npc) => {
  const png = readPng(readFileSync(resolve(ROOT, npc.sprite.sheet)));
  return Math.max(...npc.sprite.frames.map((frame) => widestAtCounter(png, frame)));
};

/** For a folded-arms figure: its bottom rows' widest run over its widest row anywhere above them. */
export function waistOverBody(png, [x0, y0, w, h]) {
  const runOf = (y) => { let run = 0, widest = 0; for (let x = 0; x < w; x += 1) { run = png.pixels[((y0 + y) * png.width + x0 + x) * 4 + 3] > 128 ? run + 1 : 0; widest = Math.max(widest, run); } return widest; };
  let bottom = h - 1;
  while (bottom > 0 && runOf(bottom) === 0) bottom -= 1;
  let body = 0, base = 0;
  for (let y = 0; y < bottom - SPAN; y += 1) body = Math.max(body, runOf(y));
  for (let y = bottom - SPAN + 1; y <= bottom; y += 1) base = Math.max(base, runOf(y));
  return base / Math.max(body, 1);
}

test('there are behind-counter figures to check', () => assert.ok(figures.length >= 5));

for (const npc of figures) {
  test(`${npc.id}: only hands at the counter edge, nothing of the counter's`, () => {
    if (!awaiting.has(npc.id)) assert.ok(['on-counter', 'folded'].includes(npc.sprite.hands), `${npc.id} declares no sprite.hands ("on-counter" or "folded")`);
    if (npc.sprite.hands === 'folded') {
      const png = readPng(readFileSync(resolve(ROOT, npc.sprite.sheet)));
      const ratio = Math.max(...npc.sprite.frames.map((frame) => waistOverBody(png, frame)));
      assert.ok(ratio <= FOLDED, `${npc.id}'s bottom rows are ${ratio.toFixed(2)} of its body's width -- something on the counter is drawn with it`);
      return;
    }
    const measured = worst(npc);
    if (awaiting.has(npc.id)) {
      assert.ok(measured > WIDEST, `${npc.id} now passes (${measured.toFixed(2)}): take it off proofs/counter-surface-awaiting.json`);
      return;
    }
    assert.ok(measured <= WIDEST, `${npc.id} draws something ${measured.toFixed(2)} of its width wide along the counter -- the plate's things are the plate's`);
  });
}

const plates = new Map(readdirSync(resolve(ROOT, 'content/rooms')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(resolve(ROOT, 'content/rooms', f), 'utf8'))).map((room) => [room.id, room.background]));

const median = (values) => { const v = [...values].sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
/**
 * How far row `edge` of a plate stands out as a horizontal edge at x: the
 * median, over 41 columns, of the two-row step in summed RGB, at its strongest
 * within two rows above it, over the same measure's median across the 29 rows
 * around it. A real far edge runs across every column; wood grain and a soft
 * gradient do not. Measured: the true edges stand 6.2x to 17.6x out, rows a
 * few pixels off them 0.9x to 3.0x.
 */
export function edgeProminence(plate, x, edge) {
  const sum = (y, c) => { const i = (y * plate.width + c) * 4; return plate.pixels[i] + plate.pixels[i + 1] + plate.pixels[i + 2]; };
  const step = (y) => median(Array.from({ length: 41 }, (_, k) => Math.abs(sum(y + 2, x - 20 + k) - sum(y, x - 20 + k))));
  const at = Math.max(step(edge - 2), step(edge - 1), step(edge));
  const around = median(Array.from({ length: 29 }, (_, k) => step(edge - 14 + k)));
  return at / Math.max(around, 1);
}

/** The lowest drawn row of the rest frame's centre column, in room coordinates. */
export function waistRow(png, [x0, y0, w, h], feetY) {
  let last = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = Math.floor(w / 2) - 4; x <= Math.floor(w / 2) + 4; x += 1) {
      if (png.pixels[((y0 + y) * png.width + x0 + x) * 4 + 3] > 128) { last = y; break; }
    }
  }
  return feetY - (h - 1) + last;
}

for (const npc of figures) {
  test(`${npc.id}: the waist ends on the far edge of what is in front of it`, () => {
    const edge = npc.sprite.waistOn;
    if (awaitingWaist.has(npc.id)) {
      assert.equal(edge, undefined, `${npc.id} is placed now: take it off awaitingWaist`);
      return;
    }
    assert.ok(Number.isInteger(edge), `${npc.id} declares no sprite.waistOn`);
    const png = readPng(readFileSync(resolve(ROOT, npc.sprite.sheet)));
    const waist = waistRow(png, npc.sprite.frames[0], npc.y);
    assert.ok(Math.abs(waist - edge) <= 1, `${npc.id}'s waist is drawn at y ${waist}, not on y ${edge}`);
    const plate = readPng(readFileSync(resolve(ROOT, plates.get(npc.room))));
    // Read across the waist, not at one column: at the figure's centre the edge
    // can be behind what stands in front of it (Ozymandia's ball, the spine of
    // the hotel register). The strongest reading within REACH of centre counts.
    const prominence = Math.max(...Array.from({ length: 2 * REACH / 10 + 1 }, (_, k) => edgeProminence(plate, npc.x - REACH + 10 * k, edge)));
    assert.ok(prominence >= EDGE, `y ${edge} is not an edge in the plate within ${REACH} px of x ${npc.x} (it stands ${prominence.toFixed(1)}x out of the rows around it)`);
  });
}

test('the self-test: a frame holding its own ledger fails', () => {
  // A 40x20 frame: a body above, a ledger 30 wide along the bottom.
  const width = 40, height = 20, data = new Uint8Array(width * height * 4);
  const fill = (x0, x1, y0, y1) => { for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) data[(y * width + x) * 4 + 3] = 255; };
  fill(14, 26, 0, 14);
  fill(5, 35, 14, 20);
  assert.ok(widestAtCounter({ width, height, pixels: data }, [0, 0, width, height]) > WIDEST);
  const hands = new Uint8Array(width * height * 4);
  for (let y = 14; y < 20; y += 1) for (const x0 of [6, 28]) for (let x = x0; x < x0 + 6; x += 1) hands[(y * width + x) * 4 + 3] = 255;
  assert.ok(widestAtCounter({ width, height, pixels: hands }, [0, 0, width, height]) <= WIDEST);
});
