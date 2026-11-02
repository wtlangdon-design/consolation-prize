// Room 11's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE SOURCE is operation 2's people-free room with operation 4's colonel
// restored to his portrait (tools/art/room11-compose.py writes
// composite-source.png). THE FRAME: both kept the room inside the 20:9 band
// (y 165-862), so Room 11 takes the standard crop, x 8-1528, y 170-854.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-11/plate-01';
const CROP = { x: 8, y: 170, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/composite-source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/composite-source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  sources: ['room-11 attempt 2 (plate-01/source.png): the room', 'room-11 attempt 4 (dinner-01/source.png): the portrait\'s canvas only'],
  why: 'Room 11 takes the standard 20:9 crop of operation 2 with operation 4\'s portrait (tools/art/room11-compose.py, tools/art/room11-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-11', attempt: 2, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-11-fanshawe-office.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 11 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
