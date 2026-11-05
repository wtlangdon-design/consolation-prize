// Room 36's plate: Room 2's street at first light (tools/art/room36-dawn.py), at
// Room 2's own size, 3700x864. Promoted provisionally under errata 72 E.
// Operation 1 is the light; every pixel of the street is Room 2's.
import { execFileSync } from 'node:child_process';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-36/dawn-01';
console.log(execFileSync('python3', ['tools/art/room36-dawn.py'], { encoding: 'utf8' }).trim());
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-3700x864.png`, { kind: 'plate', expect: '3700x864' });
  if (!gates.passed) throw new Error(`the plate fails its gates: ${JSON.stringify(gates).slice(0, 400)}`);
  const done = promoteProvisional({ assetId: 'room-36', attempt: 1, derived: `${S}/candidate-3700x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-36-main-street-dawn.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 36 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
