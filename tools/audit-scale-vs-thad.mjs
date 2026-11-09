import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { heightIn, WalkBoxes } from '../engine/core/WalkBoxes.ts';
import { Report, ROOT, runCheck } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * EVERY FIGURE BESIDE THAD, AS DRAWN (errata 234). Tyler, 2026-11-09, of
 * Room 14 with the funeral cast at the gate: "the screenshot you sent shows
 * Thad looking much smaller than everyone else. It all needs to be scaled
 * correctly. Similarly through the whole game."
 *
 * tests/scale.test.ts held every `standing` ambient to the room's curve on
 * what its file DECLARED -- the curve times `stature`, or a 1:1 sheet's frame
 * height -- and never on the pixels. A sheet whose crown-to-sole is not its
 * `figureHeight` (a hat counted, a raised arm counted, padding under the
 * feet) passed while being drawn taller or shorter than Thad beside it, and
 * a `band` (a group cut as one sheet) was not measured at all.
 *
 * WHAT IS MEASURED. For every visible figure in a shipping room (its own room
 * and every placement), its rest frame's crown-to-sole IN SCREEN PIXELS,
 * through the engine's own arithmetic (Renderer.ambientSize and drawAmbient:
 * the room's man where its feet are -- GameState.stagedHeightAt, the box it
 * stands in or else the nearest -- times `stature` over `figureHeight`, the
 * drawn height rounded, `footRow` on `y`), against THAD's crown-to-sole had
 * he stood at that figure's soles: his standing front frame's opaque rows
 * through ActorSprite.draw's scale (the curve over the clip's
 * `figureHeight`). The ratio is figure over Thad.
 *
 * THE CROWN, NOT A RAISED HAND. The crown is the top opaque row (alpha over
 * half) inside a head-wide window over the body's centre: the median opaque
 * column of the torso rows (a quarter to a half of the way down), plus or
 * minus HEAD_WINDOW of the figure's height. A finger raised beside the head,
 * a pick on a shoulder or a sign held out is outside the window and does not
 * count.
 *
 * THE CROWN UNDER A HAT. A hat cannot be told from a head by its pixels, and
 * the house's brim rule (tools/art/figure-height.py --hat: the widest row in
 * the top 18% is the brim, the crown 4% of the man above it) takes a
 * shoulder, a collar, a fiddle or a held-up map for the brim as often as not:
 * it put Pratt's crown at his eyebrows. The face cannot be moved by a hat, so
 * a hatted figure declares its eye row and chin row (content/scale-anchors.json
 * `figures`, read from the rest frame) and its crown is where a hatless head's
 * top would be: HAIR_OVER_EYES of the eyes-to-chin above the eyes. That share
 * is MEASURED on the hatless cast: Thad 46/50 = 0.92, Deke 35/39 = 0.90, the
 * photographer 29/33 = 0.88, Frame 34/40 = 0.85. So a hatted man is held to
 * Thad by the top of his head, as Thad's own height is the top of his hair.
 * A group names the columns of its tallest adult. The sole is the bottom
 * opaque row of those columns, or `soleRow`, or `footRow`.
 *
 * Run it: node tools/audit-scale-vs-thad.mjs [--md <path>] [--json <path>].
 * As a check in tools/run-all.mjs it only reports; tests/scale-vs-thad.test.mjs
 * holds the numbers.
 */
export const HEAD_WINDOW = 0.075;
export const TOLERANCE = 0.03;
export const HAIR_OVER_EYES = 0.9;

const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const pngs = new Map();
export const png = (path) => {
  if (!pngs.has(path)) pngs.set(path, readPng(readFileSync(resolve(ROOT, path))));
  return pngs.get(path);
};

const opaque = (image, sx, sy, col, row) => image.pixels[((sy + row) * image.width + sx + col) * 4 + 3] > 128;

/**
 * Crown and sole rows of a frame, in the frame's own rows, and how it found
 * them. `declared` may name `columns` ([first, last], frame columns), `crownRow`
 * and `soleRow`; `footRow` is the sprite's.
 */
export function crownAndSole(image, [sx, sy, w, h], declared = {}, footRow) {
  const [c0, c1] = declared.columns ?? [0, w - 1];
  let top = -1;
  let bottom = -1;
  for (let row = 0; row < h; row += 1) {
    for (let col = c0; col <= Math.min(c1, w - 1); col += 1) {
      if (!opaque(image, sx, sy, col, row)) continue;
      if (top < 0) top = row;
      bottom = row;
      break;
    }
  }
  if (top < 0) return null;
  const sole = declared.soleRow ?? footRow ?? bottom;
  // The body's centre: the median opaque column of the torso rows.
  const span = sole - top;
  const cols = [];
  for (let row = Math.round(top + 0.25 * span); row <= Math.round(top + 0.5 * span); row += 1) {
    for (let col = c0; col <= Math.min(c1, w - 1); col += 1) if (opaque(image, sx, sy, col, row)) cols.push(col);
  }
  cols.sort((a, b) => a - b);
  const centre = cols.length ? cols[Math.floor(cols.length / 2)] : Math.round((c0 + c1) / 2);
  const half = Math.max(4, Math.round(HEAD_WINDOW * span));
  let crown = -1;
  for (let row = top; row <= sole && crown < 0; row += 1) {
    for (let col = Math.max(c0, centre - half); col <= Math.min(c1, w - 1, centre + half); col += 1) {
      if (opaque(image, sx, sy, col, row)) { crown = row; break; }
    }
  }
  // UNDER THE HAT, FROM THE FACE. The eyes are where a hat cannot move them: a hatless head's top
  // stands HAIR_OVER_EYES of the eyes-to-chin above its eyes (measured on the hatless cast below),
  // so a hatted figure declares its eye and chin rows and its crown is read the same way.
  const underHat = declared.eyeRow !== undefined && declared.chinRow !== undefined
    ? Math.round(declared.eyeRow - HAIR_OVER_EYES * (declared.chinRow - declared.eyeRow)) : undefined;
  const how = declared.crownRow !== undefined ? 'declared crown'
    : underHat !== undefined ? `under the hat (eyes ${declared.eyeRow}, chin ${declared.chinRow})`
      : crown > top ? `${crown - top} rows above the head ignored` : 'top row';
  return { crown: declared.crownRow ?? underHat ?? crown, sole, top, bottom, centre, how };
}

/** The man the room's curve draws at a floor point, as GameState.stagedHeightAt answers it. */
export function manAt(room, x, y) {
  const boxes = new WalkBoxes(room.walkBoxes ?? [], () => true);
  const box = boxes.boxAt(x, y) ?? boxes.nearest(x, y)?.box;
  return box ? heightIn(box, y) : null;
}

/** Thad's standing frame: its opaque crown-to-sole and the clip's figureHeight and canvas height. */
export function thadStanding(record = read('content/actors/thad.json')) {
  const clip = record.clips.find((one) => one.id === 'stand' && one.facing === 'front' && !one.state);
  const image = png(clip.frames[0]);
  const found = crownAndSole(image, [0, 0, image.width, image.height], { soleRow: clip.anchor[1] - 1 });
  return { clip, image, rows: found.sole - found.top + 1, canvas: image.height };
}

/** Thad's crown-to-sole on screen at a curve height, as ActorSprite.draw scales him. */
export function thadAt(man, thad = thadStanding()) {
  const drawnH = Math.max(1, Math.round(thad.canvas * (man / thad.clip.figureHeight)));
  return (thad.rows * drawnH) / thad.canvas;
}

/** The first frame that draws anything: the rest frame, unless the figure is empty until it acts. */
function restFrame(image, sprite, declared) {
  if (declared?.frame !== undefined) return [declared.frame, sprite.frames[declared.frame]];
  for (let index = 0; index < sprite.frames.length; index += 1) {
    const [sx, sy, w, h] = sprite.frames[index];
    for (let row = 0; row < h; row += 1) for (let col = 0; col < w; col += 1) {
      if (opaque(image, sx, sy, col, row)) return [index, sprite.frames[index]];
    }
  }
  return [0, sprite.frames[0]];
}

/**
 * One figure in one room, measured. `npc` is the ambient file, `at` the
 * placement (or the file), `declared` its entry in scale-anchors `figures`.
 */
export function measureFigure(npc, at, room, declared, thad = thadStanding()) {
  const sprite = { ...npc.sprite, ...(at.sprite ?? {}) };
  const image = png(sprite.sheet);
  const [frameIndex, frame] = restFrame(image, sprite, declared);
  const [, , w, h] = frame;
  const x = at.x ?? npc.x;
  const y = at.y ?? npc.y;
  const found = crownAndSole(image, frame, declared ?? {}, sprite.footRow);
  if (!found) return null;
  // Renderer.ambientSize, then drawAmbient's placement.
  const man = manAt(room, x, y);
  let drawW = w;
  let drawH = h;
  if (sprite.figureHeight && man) {
    const scale = (man * (sprite.stature ?? 1)) / sprite.figureHeight;
    drawW = Math.max(1, Math.round(w * scale));
    drawH = Math.max(1, Math.round(h * scale));
  }
  const below = sprite.footRow === undefined ? 0 : Math.round(((h - 1 - sprite.footRow) * drawH) / h);
  const top = y - drawH + 1 + below;
  const left = x - Math.floor(drawW / 2);
  const k = drawH / h;
  const height = (found.sole - found.crown + 1) * k;
  const soleY = Math.round(top + (found.sole + 1) * k - 1);
  const soleX = Math.round(left + (found.centre + 0.5) * (drawW / w));
  // A man up a ladder is held to the man at the ladder's feet (`groundY`), not at his own soles.
  const thadMan = manAt(room, soleX, declared?.groundY ?? soleY);
  const thadHeight = thadAt(thadMan, thad);
  return {
    figure: npc.id, room: room.id, posture: at.posture ?? npc.posture ?? '(none)', x, y, frame: frameIndex,
    sheet: sprite.sheet, figureHeight: sprite.figureHeight ?? null, stature: sprite.stature ?? null,
    footRow: sprite.footRow ?? null, crownRow: found.crown, soleRow: found.sole, how: found.how,
    columns: declared?.columns ?? null, scale: k, height, soleX, soleY, man: thadMan, thad: thadHeight,
    ratio: height / thadHeight, rect: [left, top, drawW, drawH],
    // The figureHeight that would draw this figure's crown-to-sole at `stature` of the curve at its feet:
    // the sheet's own measured crown-to-sole (a 1:1 sheet gets it, and stature 1).
    measuredFigureHeight: found.sole - found.crown + 1,
  };
}

/** Every visible figure in every shipping room, measured. `overrides` replaces an ambient's fields by id. */
export function measureCast({ ambient: overrides = {}, anchors } = {}) {
  const manifest = read('content/manifest.json');
  const rooms = new Map(manifest.rooms.map((path) => { const room = read(path); return [room.id, room]; }));
  const scale = anchors ?? read('content/scale-anchors.json');
  const declaredFor = (id, roomId) => (scale.figures ?? []).find((one) => one.figure === id && (one.room === undefined || one.room === roomId));
  const thad = thadStanding();
  const measured = [];
  for (const path of manifest.ambient) {
    const file = read(path);
    const npc = { ...file, ...(overrides[file.id] ?? {}) };
    if (overrides[file.id]?.sprite) npc.sprite = { ...file.sprite, ...overrides[file.id].sprite };
    const places = [{ roomId: npc.room, at: npc }]
      .concat(Object.entries(npc.placements ?? {}).map(([roomId, at]) => ({ roomId, at })));
    for (const { roomId, at } of places) {
      const room = rooms.get(roomId);
      const sprite = at.sprite ?? npc.sprite;
      if (!room || room.candidateOf !== undefined || !sprite?.frames?.length || !room.walkBoxes?.length) continue;
      const declared = declaredFor(npc.id, roomId);
      const one = measureFigure(npc, at === npc ? npc : at, room, declared, thad);
      if (!one) continue;
      one.declared = declared ?? null;
      measured.push(one);
    }
  }
  return measured;
}

/** What a figure is held to: [min, max] of Thad, or null when it is reported only. */
export function heldTo(one) {
  const declared = one.declared;
  if (declared?.expect) return declared.expect;
  if (one.posture === 'standing' || declared?.held) return [1 - TOLERANCE, 1 + TOLERANCE];
  return null;
}

/**
 * THAD AGAINST EACH ROOM'S CURVE. He is drawn at the curve: ActorSprite scales
 * the clip so its `figureHeight` is the curve's man, so he is on it exactly
 * when every standing clip's crown-to-sole is its figureHeight. One answer for
 * every room, and the curve's own man at each room's near and far edges.
 */
export function thadAgainstCurves() {
  const record = read('content/actors/thad.json');
  const clips = record.clips.filter((one) => ['stand', 'idle'].includes(one.id) && !one.state).map((clip) => {
    const image = png(clip.frames[0]);
    const found = crownAndSole(image, [0, 0, image.width, image.height], { soleRow: clip.anchor[1] - 1 });
    return { clip: `${clip.id}-${clip.facing}`, rows: found.sole - found.top + 1, figureHeight: clip.figureHeight, ratio: (found.sole - found.top + 1) / clip.figureHeight };
  });
  return { clips, scalesWithDepth: record.scalesWithDepth !== false };
}

const fmt = (n) => (n === null || n === undefined ? '-' : typeof n === 'number' ? (Number.isInteger(n) ? String(n) : n.toFixed(2)) : String(n));

export function table(measured, { held = true } = {}) {
  const rows = measured
    .map((one) => ({ ...one, range: heldTo(one) }))
    .filter((one) => (held ? one.range : !one.range))
    .sort((a, b) => Math.abs(b.ratio - 1) - Math.abs(a.ratio - 1));
  const lines = ['| # | room | figure | posture | figure px | Thad px there | ratio | held to | crown | fH / stature |', '|---|---|---|---|---|---|---|---|---|---|'];
  rows.forEach((one, i) => {
    const out = one.range && (one.ratio < one.range[0] || one.ratio > one.range[1]);
    lines.push(`| ${i + 1} | ${one.room} | ${one.figure}${one.declared?.columns ? ' (tallest adult)' : ''} | ${one.posture} | ${one.height.toFixed(0)} | ${one.thad.toFixed(0)} | ${out ? '**' : ''}${one.ratio.toFixed(3)}${out ? '**' : ''} | ${one.range ? one.range.map((v) => v.toFixed(2)).join('-') : 'report'} | ${one.how} | ${fmt(one.figureHeight)} / ${fmt(one.stature)} |`);
  });
  return lines.join('\n');
}

export function check() {
  const report = new Report('Every figure beside Thad, as drawn: crown-to-sole on screen against Thad at the same feet (errata 234)');
  const measured = measureCast();
  const held = measured.filter((one) => heldTo(one));
  const out = held.filter((one) => { const [a, b] = heldTo(one); return one.ratio < a || one.ratio > b; });
  for (const one of out) report.note(`${one.figure} in ${one.room}: ${one.height.toFixed(0)} px against Thad's ${one.thad.toFixed(0)} there, ${one.ratio.toFixed(3)}x (tests/scale-vs-thad.test.mjs holds it)`);
  report.note(`${measured.length} placed figure(s) measured, ${held.length} held to Thad, ${out.length} outside`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const measured = measureCast();
  const thad = thadAgainstCurves();
  const md = [
    '# Every figure beside Thad, as drawn',
    '',
    `Generated by tools/audit-scale-vs-thad.mjs. Ratio = the figure's crown-to-sole on screen over Thad's at the same soles. Held figures: ±${TOLERANCE * 100}% of 1.00 unless content/scale-anchors.json \`figures\` gives a ruled range.`,
    '',
    '## Held (standing adults, and groups measured by their tallest adult), worst first',
    '',
    table(measured),
    '',
    '## Reported only (seated, behind a counter, bands not held, animals, children, identity frames)',
    '',
    table(measured, { held: false }),
    '',
    '## Thad against the curve',
    '',
    `Depth-scaled: ${thad.scalesWithDepth}. Each standing clip's crown-to-sole over its figureHeight (1.000 = drawn exactly at the room's man, in every room):`,
    '',
    ...thad.clips.map((one) => `- ${one.clip}: ${one.rows} / ${one.figureHeight} = ${one.ratio.toFixed(3)}`),
    '',
  ].join('\n');
  if (flag('--md')) writeFileSync(flag('--md'), md);
  if (flag('--json')) writeFileSync(flag('--json'), JSON.stringify(measured, null, 1));
  if (!flag('--md') && !flag('--json')) console.log(md);
  else runCheck(check());
}
