// Room 35's plates, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 2 took Thad out; operation 3 is the room's second state
// (errata 69 A for Room 34: after F3, the seam, the old lantern and the
// footprints; for Room 35: the wall broken through where the void was). The
// master kept to the layout's band; the crop is the band. Lamplit underground:
// no lift (tools/art/plate-lift.py at 1.0 records that).
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const CROP = { x: 8, y: 170, width: 1520, height: 684 };
const LIFT = 1.0;
const derive = (dir) => {
  const record = deriveFixedRoomPlate({ source: `${dir}/patched.png`, out: `${dir}/candidate-1920x864.png`, crop: CROP });
  const lift = JSON.parse(execFileSync('python3', ['tools/art/plate-lift.py', `${dir}/candidate-1920x864.png`, `${dir}/candidate-lifted-1920x864.png`, String(LIFT)], { encoding: 'utf8' }));
  writeFileSync(`${dir}/frame.json`, `${JSON.stringify({
    source: `${dir}/patched.png`, crop: CROP, out: `${dir}/candidate-lifted-1920x864.png`, derivation: record, lift,
    why: 'Room 35 takes the standard 20:9 crop from y 170 of the patched plate (tools/art/room35-patch.py, tools/art/room35-plate.mjs).',
  }, null, 1)}\n`);
  console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
};
const S = 'art/staging/room-35';
derive(`${S}/plate-01`);
deriveFixedRoomPlate({ source: `${S}/composition-master-01.png`, out: `${S}/composition-master-01-1920x864.png`, crop: CROP });
if (process.argv.includes('--promote')) {
  for (const [dir, attempt, path] of [[`${S}/plate-01`, 2, 'art/backgrounds/room-35-company-vault.png']]) {
    const gates = runGates(`${dir}/candidate-lifted-1920x864.png`, { kind: 'plate', expect: '1920x864' });
    if (!gates.passed) throw new Error(`${dir} fails its gates`);
    const done = promoteProvisional({ assetId: 'room-35', attempt, derived: `${dir}/candidate-lifted-1920x864.png`,
      provenance: `${dir}/frame.json`, shippingPath: path,
      gates: { ...gates, kind: 'plate' }, by: 'claude, Room 35 builder (doc 55 section 3, errata 72 E)' });
    console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
  }
}
