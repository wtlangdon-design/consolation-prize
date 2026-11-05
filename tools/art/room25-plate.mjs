// Room 25's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 2 took Thad and Pratt out (Pratt is a figure, errata 77);
// operation 4 relit that plate to dusk, the hour next door (Tyler, 2026-11-05),
// and drew it 34 rows higher, so the crop moves up 34 to keep every object put.
// The master painted the whole canvas; the 20:9 crop from y 256 keeps the lean-to,
// the trench and the swept ground before them.
// THE EMBERS (Tyler, 2026-11-05): room-25 attempt 6 put the coffee fire's embers
// under the pot, the room's one warm light, on attempt 5's night plate.
// NIGHT (Tyler, 2026-11-05: "Going from night back to dusk doesn't make sense"):
// room-25 attempt 5 relit the empty plate to the town's hour, nothing moved.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-25/plate-embers';
const CROP = { x: 8, y: 256, width: 1520, height: 684 };
// LIFTED TOWARD THE APPROVED NIGHT ROOMS (Tyler, 2026-11-05): one gain, pixel by
// pixel (tools/art/plate-lift.py), recorded beside the crop.
const LIFT = 1.45;
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
const lift = JSON.parse(execFileSync('python3', ['tools/art/plate-lift.py', `${S}/candidate-1920x864.png`, `${S}/candidate-lifted-1920x864.png`, String(LIFT)], { encoding: 'utf8' }));
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-lifted-1920x864.png`, derivation: record, lift,
  why: 'Room 25 takes a 20:9 crop from y 256: the master painted the whole canvas (tools/art/room25-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-lifted-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-25', attempt: 6, derived: `${S}/candidate-lifted-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-25-pratts-claim.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 25 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
