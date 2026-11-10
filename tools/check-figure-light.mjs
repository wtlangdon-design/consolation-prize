import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { heightIn, WalkBoxes } from '../engine/core/WalkBoxes.ts';
import { moverTint } from '../engine/render/LightFields.ts';
import { figureGrade, roomFigureLight } from '../engine/render/Renderer.ts';
import { Report, ROOT } from './lib/content.mjs';
import { readPng } from './lib/png.mjs';

/**
 * NO FIGURE BRIGHTER THAN ITS NIGHT (errata 205; Tyler, 2026-11-08, "Proceed",
 * on holding the whole cast to the horses' two catches).
 *
 * Errata 198: Main Street's horses "seem to be lit a little too bright ... make
 * sure they're a bit dimmer for the night". Nothing held it. They were cut
 * from a generation lit for the day and set down in a night street, and their
 * mean luminance was 69 against Thad's 59 in the same light. The fix was the
 * room's `figureLight` grade (53). This holds every placed figure to the same
 * question, the way Tyler asks it: beside Thad, where it stands.
 *
 * WHAT IS COMPARED. The figure's rest frame, AS THE ENGINE DRAWS IT -- the
 * room's `figureLight` grade if it names the figure (brightness, contrast,
 * saturation, then the light's colour as a multiply: Renderer.drawTinted), then
 * the lamps' tint at its feet (engine/render/LightFields.ts moverTint) -- against
 * Thad's standing frame drawn the same way at the same feet: graded if the room
 * grades him, tinted by the same lamps. The measure is the mean luminance of
 * the opaque pixels. A figure more than LIMIT times Thad's there reads as lit
 * brighter than the night he stands in. LIMIT is the midpoint of errata 198's
 * own two measurements: the pie woman, whom it took as the street's night
 * (63 against Thad's 59, 1.07), and the horses it dimmed (69, 1.17).
 *
 * IT CANNOT TELL A WHITE APRON FROM A BRIGHT LAMP. A figure in pale clothes,
 * or one whose frame carries a pale prop, measures brighter than Thad's blue
 * coat in the same light. That is why a flag is a finding for Tyler to look
 * at beside Thad (tools/art/beside-thad.py draws the pair), not a fix.
 *
 * THE ROOM'S OWN LIGHT. A figure in a lamp's pool is lit by it, and may be
 * brighter than Thad's even light: the map seller by the office lantern is
 * painted in its light. Every lamp the room declares raises the limit for a
 * figure inside its radius by LAMP_GAIN at its heart, falling in a straight
 * line to nothing at the radius, measured from the lamp to the nearest drawn
 * pixel of the figure's frame (a lamp hangs over a man's head, not at his
 * feet), with the lamp's own vertical `reach` where it declares one. Out in
 * the dark between the lamps the limit is LIMIT.
 *
 * CALIBRATED ON THE KNOWN CASES (tests/figure-light.test.mjs): errata 198's
 * horses, before the grade, fail (1.17); the horses as they are pass (0.90);
 * the pie woman, whom errata 198 measured as the street's night, passes (1.05,
 * in the lamp's tint at her feet);
 * and the map seller, 1.90 of Thad, passes only because he stands in the
 * office lantern's pool -- take the lamp away and he fails.
 *
 * Not a verdict on taste: a number to look at. A figure it flags that Tyler has
 * not ruled on is listed in reference/figure-light-known.json with its numbers
 * and a suggested fix, printed on every run; the check fails on a new one, and
 * on a listed one that has stopped being flagged (take it out of the list).
 *
 * A ROOM'S LIGHT BY STATE (RoomFile.figureLightWhen; errata 239, Tyler, 2026-11-09: "Fix all the things that are
 * rough"). The tent's lamp is turned down for the séance: the plate and the group went dark and Thad stood in his own
 * even light. Two things follow here.
 *   - A sheet drawn while a condition holds (`spriteWhen`) is measured in the light of THAT state: the room's
 *     `figureLightWhen` entry the sheet's own condition implies, for the figure and for Thad beside it.
 *   - A ROOM THAT GOES DARK TAKES THAD WITH IT (`darkStates`). Where a plate chosen by state (`plateWhen`) is under
 *     DARK_PLATE of the room's own plate in mean luminance, Thad as the engine draws him in that state must be at
 *     least halfway down with it: no more than 1 - (1 - plate ratio) / 2 of himself in the room's ordinary light.
 *     Half, because how dark a man reads beside a dark wall is Tyler's to judge, and a man not darkened at all is not.
 *
 * Out of scope: rooms whose plate is daylight by ruling (reference/global-baseline.json
 * `daylight`), where there is no night to be brighter than, and candidate rooms.
 */
export const LIMIT = 1.12;
export const LAMP_GAIN = 1.5;
/** A plate chosen by state under this share of the room's own plate's luminance is the room gone dark. */
export const DARK_PLATE = 0.8;

const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const pngs = new Map();
const png = (path) => {
  if (!pngs.has(path)) pngs.set(path, readPng(readFileSync(resolve(ROOT, path))));
  return pngs.get(path);
};

/**
 * The room's grade for a figure drawn from a sheet, as Renderer.gradeFor resolves it (figureGrade): null when it names
 * neither that id nor that sheet (FigureLight.sheets; errata 238).
 */
export function gradeFor(room, id, sheet, state = {}) {
  return figureGrade(lightIn(room, state), id, sheet);
}

/** Whether a condition is known to hold in a state given as the flags a `when` names: every flag it asks, as asked. */
export function impliedBy(when, state) {
  return Object.entries(when ?? {}).every(([flag, value]) => flag in state && JSON.stringify(state[flag]) === JSON.stringify(value));
}

/** The room's figure grade in a state (RoomFile.figureLightWhen), as Renderer.roomFigureLight resolves it from flags. */
export function lightIn(room, state = {}) {
  return roomFigureLight(room, (when) => impliedBy(when, state));
}

/** A whole plate's mean luminance. */
function plateLuma(path) {
  const image = png(path);
  let sum = 0;
  for (let i = 0; i < image.pixels.length; i += 4) sum += 0.2126 * image.pixels[i] + 0.7152 * image.pixels[i + 1] + 0.0722 * image.pixels[i + 2];
  return sum / (image.pixels.length / 4);
}

/**
 * Every plate a room shows by state that is the room gone dark, with Thad's drawn luminance in that state against his
 * own in the room's ordinary light. `overrides` replaces a room's fields by id, as measureCast's does.
 */
export function darkStates({ rooms: roomOverrides = {} } = {}) {
  const manifest = read('content/manifest.json');
  const thad = thadFrame();
  const found = [];
  for (const path of manifest.rooms) {
    const file = read(path);
    const room = { ...file, ...(roomOverrides[file.id] ?? {}) };
    if (room.candidateOf !== undefined || !room.background || !room.plateWhen?.length) continue;
    const own = plateLuma(room.background);
    const ordinary = meanDrawnLuma(thad.image, thad.rect, gradeFor(room, 'thad'));
    for (const entry of room.plateWhen) {
      const plate = room.plates?.[entry.plate];
      if (!plate) continue;
      const ratio = plateLuma(plate) / own;
      if (ratio >= DARK_PLATE) continue;
      const drawn = meanDrawnLuma(thad.image, thad.rect, gradeFor(room, 'thad', undefined, entry.when));
      const limit = 1 - (1 - ratio) / 2;
      found.push({ room: room.id, when: entry.when, plate, plateRatio: ratio, playerRatio: drawn / ordinary, limit, flagged: drawn / ordinary > limit });
    }
  }
  return found;
}

/** One pixel through the grade (CSS brightness, contrast, saturate, then the multiply), and the tint. */
function drawnLuma(r, g, b, grade, tint) {
  let red = r / 255; let green = g / 255; let blue = b / 255;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  if (grade?.brightness !== undefined) {
    red = clamp(red * grade.brightness); green = clamp(green * grade.brightness); blue = clamp(blue * grade.brightness);
  }
  if (grade?.contrast !== undefined) {
    const k = grade.contrast;
    red = clamp((red - 0.5) * k + 0.5); green = clamp((green - 0.5) * k + 0.5); blue = clamp((blue - 0.5) * k + 0.5);
  }
  if (grade?.saturate !== undefined) {
    const s = grade.saturate;
    const R = (0.2126 + 0.7874 * s) * red + (0.7152 - 0.7152 * s) * green + (0.0722 - 0.0722 * s) * blue;
    const G = (0.2126 - 0.2126 * s) * red + (0.7152 + 0.2848 * s) * green + (0.0722 - 0.0722 * s) * blue;
    const B = (0.2126 - 0.2126 * s) * red + (0.7152 - 0.7152 * s) * green + (0.0722 + 0.9278 * s) * blue;
    red = clamp(R); green = clamp(G); blue = clamp(B);
  }
  if (grade?.light) {
    red *= clamp(grade.light[0]); green *= clamp(grade.light[1]); blue *= clamp(grade.light[2]);
  }
  red *= 255; green *= 255; blue *= 255;
  if (tint) {
    red = red * (1 - tint.alpha) + tint.colour[0] * tint.alpha;
    green = green * (1 - tint.alpha) + tint.colour[1] * tint.alpha;
    blue = blue * (1 - tint.alpha) + tint.colour[2] * tint.alpha;
  }
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Mean drawn luminance of a frame's opaque pixels (alpha over half), or null for an empty frame. */
export function meanDrawnLuma(image, [x, y, w, h], grade = null, tint = null) {
  let sum = 0;
  let count = 0;
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < w; col += 1) {
      const i = ((y + row) * image.width + x + col) * 4;
      if (image.pixels[i + 3] < 128) continue;
      sum += drawnLuma(image.pixels[i], image.pixels[i + 1], image.pixels[i + 2], grade, tint);
      count += 1;
    }
  }
  return count ? sum / count : null;
}

/** Thad's standing frame and its full rect: the figure every other is judged beside. */
function thadFrame() {
  const record = read('content/actors/thad.json');
  const stand = record.clips.find((clip) => clip.id === 'stand' && clip.facing === 'front');
  const image = png(stand.frames[0]);
  return { image, rect: [0, 0, image.width, image.height] };
}

/** The drawn rect of an ambient's frame, as Renderer.drawAmbient places it. */
function drawnRect(room, x, y, sprite, frame) {
  const [, , w, h] = frame;
  let scale = 1;
  if (sprite.figureHeight && room.walkBoxes?.length) {
    const near = new WalkBoxes(room.walkBoxes, () => true).nearest(x, y);
    const man = near ? heightIn(near.box, y) : 0;
    if (man) scale = (man * (sprite.stature ?? 1)) / sprite.figureHeight;
  }
  const drawW = Math.max(1, Math.round(w * scale));
  const drawH = Math.max(1, Math.round(h * scale));
  const below = sprite.footRow === undefined ? 0 : Math.round(((h - 1 - sprite.footRow) * drawH) / h);
  return [x - Math.floor(drawW / 2), y - drawH + 1 + below, drawW, drawH];
}

/** How much brighter than Thad's even light the room's lamps let a figure in this rect be. */
export function lampAllowance(lamps, [left, top, w, h]) {
  let best = 1;
  for (const lamp of lamps ?? []) {
    if (!(lamp.radius > 0)) continue;
    const [lx, ly] = lamp.at;
    const dx = Math.max(left - lx, 0, lx - (left + w - 1));
    const dy = Math.max(top - ly, 0, ly - (top + h - 1)) / (lamp.movers?.reach ?? 1);
    const reach = 1 - Math.hypot(dx, dy) / lamp.radius;
    if (reach > 0) best = Math.max(best, 1 + LAMP_GAIN * reach);
  }
  return best;
}

/**
 * Every placed figure's drawn brightness against Thad's at its feet. `overrides`
 * replaces an ambient's fields or a room's (by id) -- the calibration's way of
 * putting errata 198's horses back without touching a file.
 */
export function measureCast({ ambient: ambientOverrides = {}, rooms: roomOverrides = {} } = {}) {
  const manifest = read('content/manifest.json');
  const rooms = new Map(manifest.rooms.map((path) => {
    const room = read(path);
    return [room.id, { ...room, ...(roomOverrides[room.id] ?? {}) }];
  }));
  const baseline = read('reference/global-baseline.json').rooms ?? {};
  const daylight = (room) => {
    const plate = /([^/]+)\.png$/.exec(room.background ?? '')?.[1];
    return plate ? baseline[plate]?.daylight : undefined;
  };
  const thad = thadFrame();
  const measured = [];
  const skipped = [];
  for (const path of manifest.ambient) {
    const file = read(path);
    const npc = { ...file, ...(ambientOverrides[file.id] ?? {}) };
    const places = [{ roomId: npc.room, at: npc }]
      .concat(Object.entries(npc.placements ?? {}).map(([roomId, at]) => ({ roomId, at })));
    for (const { roomId, at } of places) {
      const room = rooms.get(roomId);
      const own = at.sprite ?? npc.sprite;
      if (!room || room.candidateOf !== undefined || !own?.frames?.length) continue;
      if (daylight(room)) { skipped.push(`${npc.id} in ${roomId}: daylight by ruling`); continue; }
      // AND EVERY OTHER SHEET IT IS DRAWN FROM WHILE A CONDITION HOLDS (AmbientFile.spriteWhen; errata 238): the
      // raccoon halfway out of the hole and the hen were painted in daylight, and the séance in the dark is its own
      // sheet. Each is measured as the engine draws it, under its own name.
      // Each in the light of the state it is drawn in (RoomFile.figureLightWhen; errata 239).
      const sheets = [{ sprite: own, as: npc.id, state: {} }].concat(at === npc ? (npc.spriteWhen ?? [])
        .filter((variant) => variant.sprite.sheet)
        .map((variant) => ({ sprite: { ...own, ...variant.sprite }, as: `${npc.id} (${variant.sprite.sheet})`, state: variant.when ?? {} })) : []);
      for (const { sprite, as, state } of sheets) {
        const image = png(sprite.sheet);
        // The rest frame, or the first that draws anything (a figure that is empty until it acts).
        const frame = sprite.frames.find((one) => meanDrawnLuma(image, one) !== null);
        if (!frame) continue;
        const x = at.x ?? npc.x;
        const y = at.y ?? npc.y;
        const tint = moverTint(room.lamps, x, y, null);
        const figure = meanDrawnLuma(image, frame, gradeFor(room, npc.id, sprite.sheet, state), tint);
        const reference = meanDrawnLuma(thad.image, thad.rect, gradeFor(room, 'thad', undefined, state), tint);
        const allowance = lampAllowance(room.lamps, drawnRect(room, x, y, sprite, frame));
        const ratio = figure / reference;
        measured.push({
          figure: as, room: roomId, x, y, luma: figure, thad: reference, ratio, allowance,
          limit: LIMIT * allowance, flagged: ratio > LIMIT * allowance,
        });
      }
    }
  }
  return { measured, skipped };
}

const describe = (one) => `${one.figure} in ${one.room} (${one.x},${one.y}): mean luminance ${one.luma.toFixed(1)} `
  + `against Thad's ${one.thad.toFixed(1)} there, ${one.ratio.toFixed(2)}x; the limit there is ${one.limit.toFixed(2)}x`
  + (one.allowance > 1 ? ` (a lamp's pool, ${one.allowance.toFixed(2)} x ${LIMIT})` : '');

export function check() {
  const report = new Report('No figure brighter than its night: every placed figure beside Thad where it stands (errata 205)');
  const { measured, skipped } = measureCast();
  const known = read('reference/figure-light-known.json').known ?? [];
  const keyOf = (one) => `${one.figure}@${one.room}`;
  const listed = new Map(known.map((one) => [keyOf(one), one]));
  const flagged = measured.filter((one) => one.flagged);
  for (const one of flagged) {
    const entry = listed.get(keyOf(one));
    if (entry) report.note(`KNOWN, for Tyler: ${describe(one)} -- ${entry.why} Suggested: ${entry.fix}`);
    else report.fail(`${describe(one)} -- brighter than Thad in the same light; grade it into the room (\`figureLight\`) or record it in reference/figure-light-known.json`);
  }
  for (const entry of known) {
    if (!flagged.some((one) => keyOf(one) === keyOf(entry))) {
      report.fail(`${entry.figure} in ${entry.room} is no longer brighter than its night: take it out of reference/figure-light-known.json`);
    }
  }
  // A ROOM THAT GOES DARK TAKES THAD WITH IT (errata 239).
  const dark = darkStates();
  for (const one of dark) {
    const says = `${one.room} while ${JSON.stringify(one.when)}: the plate is ${one.plateRatio.toFixed(2)} of the room's own, and Thad is drawn at ${one.playerRatio.toFixed(2)} of himself`;
    if (one.flagged) report.fail(`${says}; he must be at most ${one.limit.toFixed(2)} -- grade him with the room in that state (\`figureLightWhen\`)`);
    else report.note(`${says} (limit ${one.limit.toFixed(2)})`);
  }
  for (const line of skipped) report.note(line);
  report.note(`${measured.length} placed figure(s) measured; ${flagged.length} brighter than the limit, ${known.length} of them known`);
  return report;
}
