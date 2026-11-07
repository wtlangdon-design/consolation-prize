// Room 44's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here (errata 161).
//
// THE FRAME. derive.mjs's crop from y 170 by default; if the master painted
// the band taller than 20:9, as Room 20's did, pass --y <row> and say why.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

// --plate plate-02: the corrected plate (room-44 operations 3 and 4; errata 161: the first master drew the
// middle of the lane ~100 px left of its layout, and the brief allowed one correction).
const plateAt = process.argv.indexOf('--plate');
const S = `art/staging/room-44/${plateAt > 0 ? process.argv[plateAt + 1] : 'plate-01'}`;
const at = process.argv.indexOf('--y');
// --crop x,y,w,h: a smaller 20:9 window, for a band painted SHORTER than 684 rows. Room 43's master
// painted 682 clean rows (171-852), so every 1520 x 684 crop kept a grey margin row (errata 161).
const cropAt = process.argv.indexOf('--crop');
const [cx, cy, cw, ch] = cropAt > 0 ? process.argv[cropAt + 1].split(',').map(Number) : [];
const CROP = cropAt > 0 ? { x: cx, y: cy, width: cw, height: ch }
  : { x: 8, y: at > 0 ? Number(process.argv[at + 1]) : 170, width: 1520, height: 684 };
const attempt = Number(process.argv[process.argv.indexOf('--attempt') + 1] || 2);
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
// --lift <gain>: LIFTED TOWARD THE APPROVED NIGHT ROOMS (tools/check-night-exposure.mjs, errata 99 D): one
// gain, pixel by pixel (tools/art/plate-lift.py), as Rooms 23 and 25 are. The Lane's plate-02 came out at
// 26.2 in its lower half, under the floor of 28; 1.15 brings it to the back alley's ~30 (errata 161).
const liftAt = process.argv.indexOf('--lift');
const lift = liftAt > 0 ? JSON.parse(execFileSync('python3', ['tools/art/plate-lift.py', `${S}/candidate-1920x864.png`,
  `${S}/candidate-1920x864.png`, process.argv[liftAt + 1]], { encoding: 'utf8' })) : null;
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record, ...(lift ? { lift } : {}),
  why: `Room 44 takes a 20:9 crop of ${CROP.width} x ${CROP.height} from ${CROP.x},${CROP.y} (tools/art/room44-plate.mjs).`,
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-44', attempt, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-44-the-lane.png',
    gates: { ...gates, kind: 'plate' }, by: 'the image session, for the Room 44 builder (errata 161)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
