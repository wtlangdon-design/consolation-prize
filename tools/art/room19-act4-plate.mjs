// Room 19 in the morning, packed: the Act IV plate (errata 101 B, errata 119).
// Derived to 1920x864 the way tools/art/room19-plate.mjs derived the night plate,
// and promoted provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 3 (reference/room-19/prompts/act4-01.txt) was given the
// shipping night plate back in plate-01's 1536x1024 frame at (8,171), so the
// same crop returns the same room with the lamp out, the morning in the window
// and Thad's case strapped on the bed.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-19/act4-01';
const CROP = { x: 8, y: 171, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  why: 'Room 19 Act IV: the night plate placed back at (8,171) in plate-01\'s frame, so the same 20:9 crop.',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-19', attempt: 3, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-19-thads-room-act4.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, art fixes (errata 119)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
