// The six interiors' plates (reference/ancillary-interiors/brief.md, errata 183), derived to 1920x864 under
// errata 63 and promoted provisionally under errata 72 E, as tools/art/room44-plate.mjs does for the Lane.
// No image operation here.
//
//   node tools/art/interiors-plate.mjs <NN> <id> --plate plate-01 --y <row> [--lift <gain>] [--attempt N] [--promote]
//
// THE FRAME. derive.mjs's 20:9 crop of 1520 x 684 from x 8 at --y <row> (170 by default); each room's row is
// chosen so its walk band and its lamp are both in, and recorded in its frame.json and in errata 183.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const [n, id] = process.argv.slice(2, 4);
const arg = (name, fallback) => { const at = process.argv.indexOf(name); return at > 0 ? process.argv[at + 1] : fallback; };
const S = `art/staging/room-${n}/${arg('--plate', 'plate-01')}`;
const CROP = { x: 8, y: Number(arg('--y', 170)), width: 1520, height: 684 };
const attempt = Number(arg('--attempt', 2));
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
const liftGain = arg('--lift', null);
const lift = liftGain ? JSON.parse(execFileSync('python3', ['tools/art/plate-lift.py', `${S}/candidate-1920x864.png`,
  `${S}/candidate-1920x864.png`, liftGain], { encoding: 'utf8' })) : null;
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-1920x864.png`, derivation: record, ...(lift ? { lift } : {}),
  why: `Room ${n} takes a 20:9 crop of ${CROP.width} x ${CROP.height} from ${CROP.x},${CROP.y} (tools/art/interiors-plate.mjs).`,
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: `room-${n}`, attempt, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: `art/backgrounds/room-${n}-${id}.png`,
    gates: { ...gates, kind: 'plate' }, by: `the builder, for Room ${n} (errata 183)` });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
