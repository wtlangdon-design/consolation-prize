import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readJson, Report, ROOT, runCheck } from './lib/content.mjs';

/**
 * EVERY ROOM'S BED, AS PLANNED (doc 45, "Every room's bed"; errata 203, 206).
 *
 * Tyler approved a plan that gives every room a bed of room sound and four
 * rooms none. A plan is prose, and prose drifts from what is wired without
 * anything failing: a room added later falls back to silence, a silent room
 * gets a bed by a copy-paste, a layer gets a `when` the engine silently ignores
 * today and honours tomorrow. So this holds the plan:
 *
 *   1. Doc 45's table and rule 6 are read out of doc 45 itself. The row numbers
 *      and the four silent rooms' numbers must be exactly the ones
 *      content/audio/sounds.json's `bedPlan` maps to room ids.
 *   2. Every room in a row has an `ambience` entry that cites its row; every
 *      silent room has none.
 *   3. No bed or layer is keyed to a puzzle's state (rule 3, invariant 9): a
 *      bed carries only src, gain, why, layers and `duringDuel`; a layer only
 *      src, gain and `whenPresent`, which names a figure who stands in that
 *      room; and no value anywhere in one names a flag.
 *   4. Nothing at Prosperity is tied to the hole (rule 2, invariant 3): no verb
 *      sound on the hole or the way down it, no door sound between the claim
 *      and what is under it, and no Prosperity layer that follows a figure
 *      sitting on the hole (the raccoon is in its mouth: his breathing would be
 *      a sound at the hole).
 */
export const BED_KEYS = new Set(['src', 'gain', 'why', 'layers', 'duringDuel']);
export const LAYER_KEYS = new Set(['src', 'gain', 'whenPresent']);

/** Doc 45's table rows and rule 6's silent rooms, by number. */
export function planOf(doc) {
  const start = doc.indexOf("## EVERY ROOM'S BED");
  if (start < 0) return null;
  const rest = doc.slice(start + 3);
  const end = rest.search(/\n#{1,2} /);
  const section = end < 0 ? rest : rest.slice(0, end);
  const rows = [...section.matchAll(/^\| (\d+) · /gm)].map((m) => m[1]);
  const lines = section.split('\n');
  const at = lines.findIndex((line) => /deliberately have none/.test(line));
  const silent = [];
  for (const line of lines.slice(at + 1)) {
    if (!/^\s+- /.test(line)) break;
    for (const m of line.matchAll(/\((\d+)\)/g)) silent.push(m[1]);
  }
  return { rows, silent: at < 0 ? [] : silent };
}

const within = (x, y, [rx, ry, rw, rh]) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;

/**
 * The judgement, on data, so a test can hand it a violation.
 * `rooms` and `figures` are Maps by id; `flags` a Set of flag ids.
 */
export function judge({ doc, sounds, rooms, figures, flags }) {
  const report = new Report("Every room's bed is as doc 45 plans it: none in the silent four, none keyed to a puzzle, nothing at Prosperity's hole");
  const plan = planOf(doc);
  const bedPlan = sounds.bedPlan;
  if (!plan || plan.rows.length === 0) {
    report.fail("doc 45 has no \"EVERY ROOM'S BED\" table to read");
    return report;
  }
  if (!bedPlan) {
    report.fail('content/audio/sounds.json has no `bedPlan`: the plan\'s rows have no rooms');
    return report;
  }
  const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  const rowKeys = Object.keys(bedPlan.rows ?? {});
  if (!same([...new Set(plan.rows)], rowKeys)) {
    report.fail(`doc 45's table has rows ${plan.rows.join(', ')}; bedPlan.rows maps ${rowKeys.join(', ')}`);
  }
  const silentKeys = Object.keys(bedPlan.silent ?? {});
  if (plan.silent.length !== 4 || !same(plan.silent, silentKeys)) {
    report.fail(`doc 45 rule 6 names rooms ${plan.silent.join(', ')} as having no bed; bedPlan.silent maps ${silentKeys.join(', ')}`);
  }
  const ambience = sounds.ambience ?? {};
  for (const [row, ids] of Object.entries(bedPlan.rows ?? {})) {
    for (const id of ids) {
      if (!rooms.has(id)) { report.fail(`row ${row}: no room ${id}`); continue; }
      const bed = ambience[id];
      if (!bed) report.fail(`row ${row} (${id}) has no bed: doc 45 gives it one`);
      else if (!new RegExp(`\\brow ${row}\\b`).test(bed.why ?? '')) report.fail(`${id}'s bed does not cite doc 45's row ${row} in its \`why\``);
    }
  }
  for (const [row, id] of Object.entries(bedPlan.silent ?? {})) {
    if (!rooms.has(id)) report.fail(`silent room ${row}: no room ${id}`);
    if (ambience[id]) report.fail(`${id} (room ${row}) has a bed: doc 45 rule 6 gives it none`);
  }

  // NOTHING KEYED TO A PUZZLE (rule 3; invariant 9).
  const flagIn = (value, where) => {
    if (typeof value === 'string' && flags.has(value)) report.fail(`${where} names the flag ${value}: a bed never follows a puzzle's state`);
    else if (Array.isArray(value)) value.forEach((v, i) => flagIn(v, `${where}[${i}]`));
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        if (flags.has(k)) report.fail(`${where}.${k} is a flag: a bed never follows a puzzle's state`);
        flagIn(v, `${where}.${k}`);
      }
    }
  };
  for (const [id, bed] of Object.entries(ambience)) {
    for (const key of Object.keys(bed)) {
      if (!BED_KEYS.has(key)) report.fail(`${id}'s bed has \`${key}\`: a bed carries only ${[...BED_KEYS].join(', ')} -- nothing that follows a puzzle's state`);
    }
    if (bed.duringDuel !== undefined && bed.duringDuel !== 'silent') report.fail(`${id}'s bed: duringDuel is "${bed.duringDuel}"; the only value is "silent"`);
    for (const [i, layer] of (bed.layers ?? []).entries()) {
      for (const key of Object.keys(layer)) {
        if (!LAYER_KEYS.has(key)) report.fail(`${id}'s layer ${i} has \`${key}\`: a layer carries only ${[...LAYER_KEYS].join(', ')} -- it follows a figure, never a flag`);
      }
      if (layer.whenPresent !== undefined) {
        const who = figures.get(layer.whenPresent);
        if (!who) report.fail(`${id}'s layer ${i} follows "${layer.whenPresent}", who is no figure`);
        else if (who.room !== id) report.fail(`${id}'s layer ${i} follows ${layer.whenPresent}, who stands in ${who.room}`);
      }
    }
    const { why, ...rest } = bed;
    flagIn(rest, `${id}'s bed`);
  }

  // NOTHING AT PROSPERITY'S HOLE (rule 2; invariant 3).
  const hole = bedPlan.hole;
  if (!hole) report.fail('bedPlan has no `hole`: nothing names the place at Prosperity that must stay silent');
  else {
    const room = rooms.get(hole.room);
    const rects = (room ? [...(room.hotspots ?? []), ...(room.exits ?? [])] : [])
      .filter((thing) => hole.targets.includes(thing.id)).map((thing) => thing.rect).filter(Boolean);
    if (rects.length !== hole.targets.length) report.fail(`${hole.room}: the hole's targets ${hole.targets.join(', ')} are not all there`);
    for (const rule of sounds.verbs ?? []) {
      if (rule.room === hole.room && hole.targets.includes(rule.target)) report.fail(`${rule.cue} sounds on ${rule.target}: Prosperity's hole gets no sound`);
    }
    for (const rule of sounds.transits ?? []) {
      const [a, b] = rule.between;
      if ((a === hole.room && b === hole.below) || (b === hole.room && a === hole.below)) report.fail(`${rule.cue} sounds on the way down the hole: Prosperity's hole gets no sound`);
    }
    for (const [i, layer] of (ambience[hole.room]?.layers ?? []).entries()) {
      const who = figures.get(layer.whenPresent);
      if (who && rects.some((rect) => within(who.x, who.y, rect))) {
        report.fail(`${hole.room}'s layer ${i} follows ${who.id}, who sits on the hole: a sound there marks the one place on the claim whose LISTEN matters`);
      }
    }
  }
  report.note(`${Object.values(bedPlan.rows ?? {}).flat().length} planned rooms bedded, ${silentKeys.length} silent, ${Object.keys(ambience).length} beds in all`);
  return report;
}

export function check() {
  const manifest = readJson('content/manifest.json');
  const doc = readFileSync(resolve(ROOT, 'docs/45-audio-cue-sheet.md'), 'utf8');
  const sounds = readJson(manifest.sounds);
  const rooms = new Map(manifest.rooms.map((path) => readJson(path)).map((room) => [room.id, room]));
  const figures = new Map((manifest.ambient ?? []).map((path) => readJson(path)).map((npc) => [npc.id, npc]));
  const flags = new Set(readJson(manifest.flags).flags.map((flag) => flag.id));
  return judge({ doc, sounds, rooms, figures, flags });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
