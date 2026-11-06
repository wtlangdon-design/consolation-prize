// The coach stop at first light (errata 118 B): Room 1's lettered plate under room-36
// operation 3's light, by the same transfer as Room 36's street (tools/art/room36-dawn.py),
// with Room 1's own skyline and its town's windows put out. Promoted provisionally under
// errata 72 E with --promote.
import { execFileSync } from 'node:child_process';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-36/coach-stop-dawn';
console.log(execFileSync('python3', ['tools/art/room36-dawn.py', '--staging', S, '--night', `${S}/night-lettered.png`,
  '--top', '166', '--rows', '691', '--shift-y', '-4', '--ridge-blue', '66',
  '--unlight', '455,220,700,230;150,200,305,160'], { encoding: 'utf8' }).trim());
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error(`the plate fails its gates: ${JSON.stringify(gates).slice(0, 400)}`);
  const done = promoteProvisional({ assetId: 'room-36', attempt: 3, derived: `${S}/candidate-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-36-coach-stop-dawn.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 36 builder (doc 48 S7 beat 3, errata 118 B)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
