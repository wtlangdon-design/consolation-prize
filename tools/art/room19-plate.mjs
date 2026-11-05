// Room 19's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 2 took Thad out, made the mirror the size of a hand (doc 26) and
// put the alley in the window (errata 69 C); the master already filled the band, so the
// 20:9 crop is the band itself, from y 171.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-19/plate-01';
const CROP = { x: 8, y: 171, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  why: 'Room 19 takes a 20:9 crop from y 171: the band the master painted (tools/art/room19-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-19', attempt: 2, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-19-thads-room.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 19 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
