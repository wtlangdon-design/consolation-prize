// Room 7's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 1 (the master) painted the room in a band at y 78-922,
// taller than 20:9; operation 2 (the same picture with Thad and Sump taken
// out) kept it. The crop keeps the door's bell, the window, the map, the
// partition and the counter whole, and the floor in front of the bench and
// the counter where Thad walks; it loses the ceiling's top and the nearest
// floor, where only the front queue posts' bases stand. x 8-1528, y 120-804.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-07/plate-01';
const CROP = { x: 8, y: 120, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  why: 'Room 7 takes its own 20:9 crop of operation 2, whose painted band runs y 78-922 (tools/art/room07-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-07', attempt: 2, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-07-claims-registrar.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 7 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
