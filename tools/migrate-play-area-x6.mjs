/**
 * ONE-SHOT: migrate room geometry from the 320x144 play area to 1920x864.
 *
 * ERRATA 54 replaced the presentation spec. The play area went from 320x144 to
 * 1920x864, which is an EXACT INTEGER 6x -- 1920/320 = 6 and 864/144 = 6 -- so
 * every declared coordinate migrates losslessly by multiplication. Measured
 * before running: 17 rooms, 140 rects, zero non-integer, zero outside 320x144.
 *
 * THE PANEL IS NOT PART OF THIS. 56 x 6 = 336 against errata 54's 216, so the
 * panel is a re-proportioning rather than a scale and its geometry has to be
 * re-authored by hand. That is a look decision and it needs the font, which is
 * open under Q6.
 *
 * ALLOWLIST, NOT HEURISTIC. Every field scaled is named below. A migration that
 * guesses from key names would multiply a palette index, a zone number, a frame
 * count or a rate the first time content grew a field nobody thought about --
 * and the damage would be silent, because a room with a wrong colour index
 * still loads. Anything not on the list is left exactly as it was, and the
 * report prints what was touched so the diff can be read rather than trusted.
 *
 * Kept deliberately in the repository after running. It is the record of what
 * was multiplied; a diff of 17 JSON files is not.
 *
 * Run: node tools/migrate-play-area-x6.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const FACTOR = 6;
const DRY = process.argv.includes('--dry');
const ROOMS = 'content/rooms';

const touched = [];
let scaled = 0;

const num = (v, where) => {
  if (typeof v !== 'number') return v;
  if (!Number.isInteger(v)) throw new Error(`${where}: ${v} is not an integer`);
  scaled += 1;
  touched.push(`${where}: ${v} -> ${v * FACTOR}`);
  return v * FACTOR;
};
const arr = (v, where) =>
  Array.isArray(v) ? v.map((n, i) => num(n, `${where}[${i}]`)) : v;
/** A maximal pixel-inclusive boundary: old row v spans new rows 6v..6v+5. */
const edge = (v, where) => {
  if (typeof v !== 'number') return v;
  if (!Number.isInteger(v)) throw new Error(`${where}: ${v} is not an integer`);
  scaled += 1;
  touched.push(`${where}: ${v} -> ${v * FACTOR + FACTOR - 1}  (inclusive edge)`);
  return v * FACTOR + FACTOR - 1;
};
const point = (o, where) => {
  if (!o || typeof o !== 'object') return o;
  if (o.x !== undefined) o.x = num(o.x, `${where}.x`);
  if (o.y !== undefined) o.y = num(o.y, `${where}.y`);
  return o;
};

/**
 * NOT SCALED, and each for its own reason:
 *
 *   colours.sky / colours.ground / hotspots[].colour / exits[].colour
 *       palette indices
 *   walkable[].zone / walkBoxes[].scaleMode.zone
 *       depth-zone indices into the scaling table
 *   occlusionPlanes[].level
 *       a z-plane index -- Renderer matches it with `plane.level === level`
 *   cycling.*
 *       VOID under errata 54; dead data, and scaling dead data invents an
 *       authority it does not have
 *   rates, phases, frame counts, flag counters
 *       not geometry
 */
function migrateRoom(room, file) {
  const at = (w) => `${file}${w}`;

  if (room.horizon !== undefined) room.horizon = num(room.horizon, at('.horizon'));

  for (const [i, h] of (room.hotspots ?? []).entries()) {
    h.rect = arr(h.rect, at(`.hotspots[${i}].rect`));
    if (h.walkTo) point(h.walkTo, at(`.hotspots[${i}].walkTo`));
  }
  for (const [i, w] of (room.walkable ?? []).entries()) {
    w.rect = arr(w.rect, at(`.walkable[${i}].rect`));
  }
  for (const [i, e] of (room.exits ?? []).entries()) {
    e.rect = arr(e.rect, at(`.exits[${i}].rect`));
    if (e.walkTo) point(e.walkTo, at(`.exits[${i}].walkTo`));
    for (const [name, state] of Object.entries(e.states ?? {})) {
      if (state.bounds) state.bounds = arr(state.bounds, at(`.exits[${i}].states.${name}.bounds`));
    }
  }
  for (const [i, e] of (room.entrances ?? []).entries()) {
    if (e.at) e.at = arr(e.at, at(`.entrances[${i}].at`));
  }
  for (const [i, l] of (room.lightSources ?? []).entries()) {
    l.rect = arr(l.rect, at(`.lightSources[${i}].rect`));
  }
  for (const [i, l] of (room.locations ?? []).entries()) {
    if (l.at) l.at = arr(l.at, at(`.locations[${i}].at`));
  }
  for (const [i, s] of (room.staging ?? []).entries()) {
    if (s.at) s.at = arr(s.at, at(`.staging[${i}].at`));
  }
  for (const [i, f] of (room.idles?.figures ?? []).entries()) {
    if (f.at) f.at = arr(f.at, at(`.idles.figures[${i}].at`));
    if (f.height !== undefined) f.height = num(f.height, at(`.idles.figures[${i}].height`));
  }
  /*
   * WALK BOXES ARE PIXEL-INCLUSIVE AND RECTS ARE NOT. This is the one place a
   * flat x6 is wrong, and it is silent.
   *
   * `walkable[].rect` is [x, y, w, h] -- w and h are EXTENTS, so x6 on all
   * four numbers is exactly right and the band keeps its size. A walk box is a
   * polygon of pixel COORDINATES and `inside()` is a winding test that counts
   * the boundary as in, so a box whose lowest points are y=143 is walkable ON
   * row 143. Old pixel row v is new rows 6v..6v+5, so a maximal boundary at
   * 143 must become 863 and not 858 -- otherwise the bottom five rows of every
   * room stop being floor while the walkable rect still claims them.
   *
   * Caught by `main_street/mud_near should be walkable at its own centre`,
   * which samples the rect's bottom row. Without that test this would have
   * shipped as a five-pixel dead strip along the bottom of all 17 rooms.
   *
   * `nearY` moves with it: it is the curve's near reference and it was
   * authored at the box's own bottom row, so leaving it at 6v would put the
   * near end of the depth curve five rows above the floor it describes.
   */
  for (const [i, b] of (room.walkBoxes ?? []).entries()) {
    const pts = b.points ?? [];
    const maxX = Math.max(...pts.map((p) => p.x));
    const maxY = Math.max(...pts.map((p) => p.y));
    for (const [j, p] of pts.entries()) {
      const w = at(`.walkBoxes[${i}].points[${j}]`);
      p.x = p.x === maxX ? edge(p.x, `${w}.x`) : num(p.x, `${w}.x`);
      p.y = p.y === maxY ? edge(p.y, `${w}.y`) : num(p.y, `${w}.y`);
    }
    if (b.clipPlane !== undefined) b.clipPlane = num(b.clipPlane, at(`.walkBoxes[${i}].clipPlane`));
    const s = b.scaleMode;
    if (s) {
      for (const k of ['farHeight', 'farY', 'height', 'nearHeight']) {
        if (s[k] !== undefined) s[k] = num(s[k], at(`.walkBoxes[${i}].scaleMode.${k}`));
      }
      if (s.nearY !== undefined) s.nearY = edge(s.nearY, at(`.walkBoxes[${i}].scaleMode.nearY`));
    }
  }
  if (room.atmosphere) {
    for (const k of ['skyRows', 'skylineRows']) {
      if (room.atmosphere[k]) room.atmosphere[k] = arr(room.atmosphere[k], at(`.atmosphere.${k}`));
    }
  }
  return room;
}

/**
 * Drawn heights are play-area geometry in the same units as everything above,
 * so they migrate with it. THIS IS A CHANGE OF UNITS AND NOT AN ANSWER TO Q9.
 * The two-drawn-sizes shape is untouched. 40 x 6 = 240 was compared here against
 * errata 54's "~233px at mid-depth" and called a 3% difference; Q21 has since
 * MEASURED the plate and put the anchor at ~205px at the fence, so 240 is about
 * 17% over it rather than 3%. Neither number is settled by this script: 205 is
 * an anchor at one depth and Q6's per-room scale curve is what turns it into a
 * height. The migration changed units and nothing else.
 *
 * `threshold` MOVES WITH THEM, and the reason is worth stating because the
 * first pass left it behind. Errata 54 voids DECIMATION, which is what the
 * threshold used to trigger; it does not void the two drawn sizes, which
 * survive as a source choice because `thad.json` still declares two and that
 * is Q9. So the threshold is still the height at which one source hands over
 * to the other -- a play-area height, in play-area units, and left at 30 it
 * would sit below a `far` of 156 and stop meaning anything at all.
 *
 * The actor record's copy moves too, and only that field: `sizes.*.cell` is a
 * measurement of the sprite SHEET, which errata 54 did not resize, and
 * multiplying it would tear the sheet apart.
 */
function migrateScaling(s, file) {
  const at = (w) => `${file}${w}`;
  for (const k of ['near', 'far']) {
    if (s.drawn?.[k] !== undefined) s.drawn[k] = num(s.drawn[k], at(`.drawn.${k}`));
  }
  if (s.threshold !== undefined) s.threshold = num(s.threshold, at('.threshold'));
  for (const [i, z] of (s.zones ?? []).entries()) {
    if (z.height !== undefined) z.height = num(z.height, at(`.zones[${i}].height`));
  }
  return s;
}

/** Only the two play-area heights and the threshold. Never `cell`. */
function migrateActor(a, file) {
  const at = (w) => `${file}${w}`;
  if (a.threshold !== undefined) a.threshold = num(a.threshold, at('.threshold'));
  for (const [k, size] of Object.entries(a.sizes ?? {})) {
    if (size.height !== undefined) size.height = num(size.height, at(`.sizes.${k}.height`));
  }
  return a;
}

const files = readdirSync(ROOMS).filter((f) => f.endsWith('.json'));
for (const f of files) {
  const path = join(ROOMS, f);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  const out = migrateRoom(json, f.replace(/\.json$/, ''));
  if (!DRY) writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`);
}

const scalingPath = 'content/actors/scaling.json';
const scaling = migrateScaling(JSON.parse(readFileSync(scalingPath, 'utf8')), 'scaling');
if (!DRY) writeFileSync(scalingPath, `${JSON.stringify(scaling, null, 2)}\n`);

const actorPath = 'content/actors/thad.json';
const actor = migrateActor(JSON.parse(readFileSync(actorPath, 'utf8')), 'thad');
if (!DRY) writeFileSync(actorPath, `${JSON.stringify(actor, null, 2)}\n`);

console.log(touched.join('\n'));
console.log(`\n${DRY ? 'DRY RUN -- ' : ''}${scaled} values x${FACTOR} across ${files.length} rooms, scaling.json and thad.json`);
