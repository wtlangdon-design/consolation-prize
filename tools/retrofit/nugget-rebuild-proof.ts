/**
 * THE ROOM 3 REBUILD PROOFS, all five of them, in one run.
 *
 *   node --experimental-strip-types tools/retrofit/nugget-rebuild-proof.ts
 *
 * Tyler's rebuild ruling asks for an exact population proof, an empty-piano
 * proof, an abandoned-hand proof, a navigation/hotspot proof and a Deke-space
 * proof, and says not to judge success numerically alone. So each one is a
 * number a script checks AND a mark on a picture a person checks, and they are
 * the same measurement: the sheet is drawn from the very values the assertions
 * ran on, never from a second set read off by eye.
 *
 * THE NAVIGATION HALF USES THE ENGINE'S OWN ROUTER. A proof that reimplemented
 * reachability would prove that the reimplementation agrees with itself, which
 * is the failure this repository keeps finding in two lists kept by hand.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { WalkBoxes } from '../../engine/core/WalkBoxes.ts';
import type { RoomFile, WalkBox } from '../../engine/core/types.ts';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));

const manifest = read('content/manifest.json');
const rooms: RoomFile[] = manifest.rooms.map(read);
const room = rooms.find((one) => one.candidateOf !== undefined
  && one.hotspots.some((h) => h.id === 'piano'));
if (!room) throw new Error('the candidate saloon is not in the manifest');

const walk = new WalkBoxes(room.walkBoxes as WalkBox[], () => true,
  room.navigation?.frontOnly ?? []);
const arrival = room.entrances?.find((one) => one.from === 'main_street')
  ?? room.entrances?.find((one) => one.from === 'default');
const start = walk.nearest(arrival!.at![0] as number, arrival!.at![1] as number);

type Note = { what: string; ok: boolean; detail: string };
const notes: Note[] = [];
const say = (what: string, ok: boolean, detail: string) => {
  notes.push({ what, ok, detail });
};

// ---- POPULATION -----------------------------------------------------------
const pop = room.population!;
const people = pop.people;
const count = (group: string) => people.filter((one) => one.group === group).length;
say('population is exactly nine', people.length === pop.expect.total,
  `${people.length} declared: ${count('card')} at the cards, ${count('bar')} at the bar, `
  + `${count('landing')} on the landing, ${count('stove')} at the stove`);
const actors = people.filter((one) => one.kind === 'actor').map((one) => one.id).sort();
say('seven are paint and two are actors',
  people.filter((one) => one.kind === 'baked').length === pop.expect.baked
  && JSON.stringify(actors) === JSON.stringify([...(room.ambient ?? [])].sort()),
  `baked: ${people.filter((o) => o.kind === 'baked').map((o) => o.id).join(', ')} · `
  + `actors: ${actors.join(', ')} · the room asks for: ${(room.ambient ?? []).join(', ')}`);

// ---- THE PIANO IS EMPTY ---------------------------------------------------
const piano = room.hotspots.find((one) => one.id === 'piano')!;
const [px, py, pw, ph] = piano.rect as number[] as [number, number, number, number];
const atPiano = people.filter((one) => {
  const [bx, by, bw, bh] = one.box as [number, number, number, number];
  return bx < px + pw && bx + bw > px && by < py + ph + 90 && by + bh > py;
});
say('nobody is at the piano', atPiano.length === 0,
  `the piano stands at ${piano.rect.join(',')}; the nearest person's box begins at x `
  + `${Math.min(...people.map((one) => one.box[0]!))}`);

// ---- THE ABANDONED HAND ---------------------------------------------------
const hand = room.hotspots.find((one) => one.id === 'cards')!;
const [cx, cy, cw] = hand.rect as number[] as [number, number, number];
const [fx, fy, fw, fh] = pop.emptyFifthPlace as [number, number, number, number];
const seated = people.filter((one) => {
  const [sx, sy] = one.seat as [number, number];
  return sx > fx && sx < fx + fw && sy > fy && sy < fy + fh;
});
say('the fifth place is unoccupied and the hand is in front of it',
  seated.length === 0 && cx > fx - 40 && cx + cw < fx + fw + 40 && cy < fy,
  `the hand lies at ${hand.rect.join(',')}, on the table top, in front of the empty place at `
  + `${pop.emptyFifthPlace!.join(',')}; no seat falls inside it`);

// ---- NAVIGATION AND HOTSPOTS ---------------------------------------------
const targets: { id: string; x: number; y: number; kind: string }[] = [];
for (const spot of room.hotspots) {
  const at = spot.walkTo ?? null;
  const [hx, hy, hw, hh] = spot.rect as number[] as [number, number, number, number];
  const near = walk.nearest(at?.x ?? hx + hw / 2, at?.y ?? hy + hh);
  targets.push({ id: spot.id, x: near!.point.x, y: near!.point.y, kind: 'hotspot' });
}
for (const exit of room.exits ?? []) {
  const at = exit.walkTo ?? null;
  const [ex, ey, ew, eh] = exit.rect as number[] as [number, number, number, number];
  const near = walk.nearest(at?.x ?? ex + ew / 2, at?.y ?? ey + eh);
  targets.push({ id: exit.id, x: near!.point.x, y: near!.point.y, kind: 'exit' });
}
const unreachable = targets.filter((one) =>
  !walk.route(start!.point.x, start!.point.y, one.x, one.y)?.waypoints.length);
say('every hotspot and exit is reachable from where the player arrives',
  unreachable.length === 0,
  `${targets.length} target(s) routed from ${Math.round(start!.point.x)},`
  + `${Math.round(start!.point.y)}`
  + (unreachable.length ? ` · UNREACHABLE: ${unreachable.map((o) => o.id).join(', ')}` : ''));

// ---- DEKE SPACE -----------------------------------------------------------
const ann = read('reference/room-03-candidate/annotation.json');
const deke = ann.characters.deke_vessel.rect as [number, number, number, number];
const dekeFeet = { x: deke[0] + deke[2] / 2, y: deke[1] + deke[3] };
const onFloor = walk.contains(dekeFeet.x, dekeFeet.y);
const dekeNear = walk.nearest(dekeFeet.x, dekeFeet.y)!;
const dekeGap = Math.hypot(dekeNear.point.x - dekeFeet.x, dekeNear.point.y - dekeFeet.y);
// A FIGURE IN FRONT OF ANOTHER IS NOT A CLASH. Deke stands at the bar, and at
// the bar everybody overlaps everybody: his silhouette crosses two seated men's
// because he is nearer than they are, which is what nearer looks like. What
// would actually be wrong is his standing IN one of them -- his feet inside
// another man's box -- or on ground the room does not have, or somewhere Thad
// cannot walk to, because a character Thad cannot approach is a puzzle that
// cannot be played.
const standingIn = people.filter((one) => {
  const [bx, by, bw, bh] = one.box as [number, number, number, number];
  return dekeFeet.x > bx && dekeFeet.x < bx + bw && dekeFeet.y > by && dekeFeet.y < by + bh;
});
const dekeReached = Boolean(walk.route(start!.point.x, start!.point.y,
  dekeFeet.x, dekeFeet.y)?.waypoints.length);
say('Act II Deke has somewhere to stand, and Thad can reach it',
  onFloor && standingIn.length === 0 && dekeReached,
  `his provisional rect ${deke.join(',')} puts his feet at ${dekeFeet.x},${dekeFeet.y} -- `
  + `${onFloor ? 'on a walk box' : `off the floor by ${Math.round(dekeGap)}px`}, `
  + `${standingIn.length ? `inside ${standingIn.map((o) => o.id).join(', ')}` : 'inside nobody'}, `
  + `${dekeReached ? 'routable from arrival' : 'NOT routable from arrival'}. He crosses `
  + `${people.filter((one) => {
      const [bx, by, bw, bh] = one.box as [number, number, number, number];
      return bx < deke[0] + deke[2] && bx + bw > deke[0]
        && by < deke[1] + deke[3] && by + bh > deke[1];
    }).map((o) => o.id).join(', ') || 'nobody'} in silhouette, from in front`);

// ---- THE SHEET ------------------------------------------------------------
const sheet = {
  plate: room.background,
  people: people.map((one) => ({ id: one.id, kind: one.kind, box: one.box, seat: one.seat })),
  piano: piano.rect, hand: hand.rect, fifth: pop.emptyFifthPlace,
  deke, raccoon: ann.characters.raccoon.rect,
  arrival: [Math.round(start!.point.x), Math.round(start!.point.y)],
  targets,
  out: 'renders/opening-set-retrofit/room-03-rebuild-proof.webp',
};
mkdirSync(resolve(ROOT, 'proofs/room-03'), { recursive: true });
writeFileSync(resolve(ROOT, 'proofs/room-03/rebuild-sheet.json'), JSON.stringify(sheet, null, 1));
execFileSync('python3', [resolve(ROOT, 'tools/retrofit/nugget-rebuild-sheet.py')],
  { stdio: 'inherit' });

const record = {
  schema: 1,
  note: 'ROOM 3 REBUILD (Tyler, 2026-09-11): the five proofs his ruling asks for, each a '
    + 'number and a mark on the same sheet.',
  room: room.id,
  plate: room.background,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  checks: notes,
  passed: notes.every((one) => one.ok),
  sheet: sheet.out,
};
writeFileSync(resolve(ROOT, 'proofs/room-03/rebuild-proof.json'), JSON.stringify(record, null, 1));
for (const one of notes) console.log(`${one.ok ? 'PASS' : 'FAIL'}  ${one.what}\n      - ${one.detail}`);
console.log(record.passed ? '\nALL FIVE PROOFS PASS' : '\nSOMETHING FAILED');
process.exit(record.passed ? 0 : 1);
