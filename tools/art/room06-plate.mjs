// Room 6's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 1 (the master) painted the whole 1536x1024 rather than
// the 20:9 band, and operation 2 (the same picture with Thad taken out) kept
// that framing: no 20:9 crop of it holds the high window, the mat and the cot
// together (plate-01's y-110 crop cut the window in half and lost the mat).
// Operation 3 was given that plate at 0.8 scale in the band and asked to extend
// the walls into the side strips; it re-framed the room a little further back
// instead, the whole room in a band at y 128-895 with every subject in it.
// That is the plate: x 8-1528, y 152-836 keeps the window's frame, the mat and
// the cot's legs.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-06/plate-02';
const CROP = { x: 8, y: 152, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  why: 'Room 6 takes its own 20:9 crop of operation 3, which re-framed the room into a band at y 128-895 (tools/art/room06-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-06', attempt: 3, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-06-assay-records.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 6 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
