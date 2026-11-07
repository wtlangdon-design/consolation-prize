// Room 43's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here (errata 161).
//
// THE FRAME. derive.mjs's crop from y 170 by default; if the master painted
// the band taller than 20:9, as Room 20's did, pass --y <row> and say why.
import { writeFileSync } from 'node:fs';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-43/plate-01';
const at = process.argv.indexOf('--y');
const CROP = { x: 8, y: at > 0 ? Number(process.argv[at + 1]) : 170, width: 1520, height: 684 };
const attempt = Number(process.argv[process.argv.indexOf('--attempt') + 1] || 2);
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record,
  why: `Room 43 takes a 20:9 crop from y ${CROP.y} (tools/art/room43-plate.mjs).`,
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-43', attempt, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-43-lower-street.png',
    gates: { ...gates, kind: 'plate' }, by: 'the image session, for the Room 43 builder (errata 161)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
