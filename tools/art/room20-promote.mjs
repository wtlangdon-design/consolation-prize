// Room 20's one figure, promoted provisionally under errata 72 E: technical
// gates run now, acceptance pending Tyler's playthrough. Cut by
// tools/art/room20-cat.py; the plate is promoted by tools/art/room20-plate.mjs.
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const items = [
  { attempt: 3, name: 'cat' },
];
for (const { attempt, name } of items) {
  const derived = `art/staging/room-20/${name}/${name}.png`;
  const gates = runGates(derived, { kind: 'sprite' });
  if (!gates.passed) throw new Error(`${derived} fails its gates: ${JSON.stringify(gates).slice(0, 400)}`);
  const done = promoteProvisional({ assetId: 'room-20', attempt, derived,
    provenance: `art/staging/room-20/${name}/${name}.json`, shippingPath: `art/actors/room-20-${name}.png`,
    gates: { ...gates, kind: 'sprite' }, by: 'claude, Room 20 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
