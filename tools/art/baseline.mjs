import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createHash } from 'node:crypto';

import { readJson, ROOT } from '../lib/content.mjs';

// Hashed here rather than imported from the adapter: the adapter has to be
// able to import THIS module to enforce the baseline, and a cycle between the
// two would be one more thing to reason about for no gain.
const hashFile = (path) =>
  createHash('sha256').update(readFileSync(resolve(ROOT, path))).digest('hex');

/**
 * ROOM 1 IS THE PERMANENT GLOBAL ART BASELINE. Tyler's ruling.
 *
 * Every new room inherits visually from approved game art, and before ANY
 * room-art generation call the production record identifies and hashes:
 *
 *   A  approved Room 1 full-frame live-runtime baseline
 *   B  approved Room 1 shipping background
 *   C  approved current Thad
 *   D  the closest approved comparable room of the same broad visual type
 *   E  applicable approved character / casting references
 *
 * A, B and C are global and permanent. D and E are per-room and declared in
 * `reference/global-baseline.json`, never inferred: a tool guessing which
 * room is "comparable" from a name is guessing about a picture.
 *
 * NEVER ROOM N-1 -> ROOM N -> ROOM N+1. A chain of small plausible drifts is
 * a different game after forty links, and no single comparison in it ever
 * looks wrong. Anchoring every room to a fixed Room 1 is what makes drift
 * visible at all.
 *
 * WHAT THIS DOES NOT DO. It does not score, rank or grade a resulting image
 * against the baseline. There is no automated aesthetic or style similarity
 * measure in this project and there is not going to be one -- Tyler's eye is
 * the only aesthetic authority. This module answers "were the right approved
 * images actually put in front of the model", which is a question about the
 * REQUEST and is answerable.
 */

export const BASELINE = 'reference/global-baseline.json';

/**
 * Assemble the reference set for a room, hashed.
 *
 * @returns {{ok: boolean, references: Array, missing: Array, pending: Array}}
 */
export function baselineFor(roomId) {
  const record = readJson(BASELINE);
  const references = [];
  const missing = [];
  const pending = [];

  const take = (slot, role, path, note) => {
    if (!path) { missing.push(`${slot}: ${role} -- no path declared`); return; }
    if (!existsSync(resolve(ROOT, path))) {
      missing.push(`${slot}: ${role} -- ${path} does not exist`);
      return;
    }
    references.push({ slot, role, path, hash: hashFile(path), note: note ?? null });
  };

  for (const slot of ['A', 'B', 'C']) {
    const entry = record.global?.[slot];
    if (!entry) { missing.push(`${slot}: not declared in ${BASELINE}`); continue; }
    take(slot, entry.role, entry.path, entry.note);
  }

  const room = record.rooms?.[roomId];
  if (!room) {
    missing.push(`D and E: ${roomId} has no entry in ${BASELINE}. The comparable room and the `
      + 'casting references are declared per room, never inferred from a name.');
    return { ok: false, references, missing, pending, room: null };
  }

  if (room.comparable) {
    take('D', `closest approved comparable (${room.comparable.id})`,
      room.comparable.path, room.comparable.note);
  } else if (room.comparableNone) {
    // "There is no comparable yet" is a legitimate state for the first room of
    // a visual type, and it has to be SAID rather than left as an absence.
    pending.push(`D: ${room.comparableNone}`);
  } else {
    missing.push(`D: ${roomId} declares neither a comparable nor a reason there is none`);
  }

  for (const cast of room.casting ?? []) {
    take('E', `casting reference (${cast.who})`, cast.path, cast.note);
  }
  for (const cast of room.castingPending ?? []) {
    pending.push(`E: ${cast.who} -- ${cast.why}${cast.issue ? ` (${cast.issue})` : ''}`);
  }

  return {
    ok: missing.length === 0 && pending.length === 0,
    references,
    missing,
    pending,
    room,
    visualType: room.visualType ?? null,
  };
}

/**
 * Refuse a room-art call whose baseline is not fully satisfied.
 *
 * `pending` is as fatal as `missing` on purpose. A declared, acknowledged,
 * documented absence is still an absence: generating the assay office with no
 * approved Winnie in front of the model produces a Winnie invented by the
 * model, and the fact that a JSON file predicted it would happen does not make
 * the result usable.
 */
export function requireBaseline(roomId) {
  const found = baselineFor(roomId);
  if (found.ok) return found;
  const lines = [
    ...found.missing.map((line) => `  MISSING  ${line}`),
    ...found.pending.map((line) => `  PENDING  ${line}`),
  ];
  throw new Error(`the global visual baseline is not satisfied for ${roomId}, so no room-art `
    + `call may be made:\n${lines.join('\n')}\n`
    + 'Room 1 is a permanent global reference and D and E are this room\'s own. A generation '
    + 'run without them produces art with no approved ancestry.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const roomId = process.argv[2];
  if (!roomId) {
    const record = readJson(BASELINE);
    process.stdout.write(`rooms declared in ${BASELINE}: `
      + `${Object.keys(record.rooms ?? {}).join(', ') || '(none)'}\n`);
    process.exit(0);
  }
  const found = baselineFor(roomId);
  for (const reference of found.references) {
    process.stdout.write(`  ${reference.slot}  ${reference.hash.slice(0, 12)}  `
      + `${reference.path}\n`);
  }
  for (const line of found.missing) process.stdout.write(`  MISSING  ${line}\n`);
  for (const line of found.pending) process.stdout.write(`  PENDING  ${line}\n`);
  process.stdout.write(found.ok
    ? `\n${roomId}: baseline satisfied, ${found.references.length} reference(s)\n`
    : `\n${roomId}: BASELINE NOT SATISFIED -- no room-art call may be made\n`);
  process.exit(found.ok ? 0 : 1);
}
