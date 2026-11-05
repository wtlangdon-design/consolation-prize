// Room 12's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE SOURCE is operation 3: operation 2's room with nobody in it (and the
// catalogue's five slips), with the unsold scales and the lamp oil added.
// THE FRAME: the master filled the 3:2 canvas, so Room 12 takes its own 20:9
// crop, x 8-1528, y 130-814 (doc 55 section 8: a plate drawn past
// the band is cropped when every subject fits).
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-12/plate-02';
const CROP = { x: 8, y: 130, width: 1520, height: 684 };
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  sources: ['room-12 attempt 3 (plate-02/source.png): attempt 2 with the unsold scales and the lamp oil'],
  why: 'The master filled the 3:2 canvas; Room 12 takes its own 20:9 crop, x 8-1528, y 130-814 (tools/art/room12-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-12', attempt: 3, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-12-mercantile.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 12 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
