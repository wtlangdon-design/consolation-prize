// Room 8's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 1 (the master) painted the room in a band taller than
// 20:9. Operation 2 was given it at 0.79 scale inside the band with Thad still
// in it, and asked to take him out and extend the walls into the side strips;
// it did both and re-framed the whole room into a band at y 105-915, as Room 6's
// third operation did. The crop keeps the barred window's frame, the ladder,
// the shelves and the floor in front of the desk and the case: x 8-1528,
// y 140-824.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-08/plate-01';
const CROP = { x: 8, y: 140, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  why: 'Room 8 takes its own 20:9 crop of operation 2, which re-framed the room into a band at y 105-915 (tools/art/room08-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-08', attempt: 2, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-08-archive.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 8 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
