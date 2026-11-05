// Room 28's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 2 took Thad, Sheng and his ironing board out (they are one
// figure, errata 77 and 99 D). The master kept to the layout's band; the crop is the
// band. At night, lit by the coppers' fires (errata 98, 99).
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-28/plate-01';
const CROP = { x: 8, y: 170, width: 1520, height: 684 };
// LIFTED TOWARD THE APPROVED NIGHT ROOMS (Tyler, 2026-11-05): one gain, pixel by
// pixel (tools/art/plate-lift.py), recorded beside the crop.
const LIFT = 1.0;
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
const lift = JSON.parse(execFileSync('python3', ['tools/art/plate-lift.py', `${S}/candidate-1920x864.png`, `${S}/candidate-lifted-1920x864.png`, String(LIFT)], { encoding: 'utf8' }));
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-lifted-1920x864.png`, derivation: record, lift,
  why: 'Room 28 takes a 20:9 crop from y 170: the master painted the whole canvas (tools/art/room28-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-lifted-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-28', attempt: 2, derived: `${S}/candidate-lifted-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-28-laundry.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 28 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
