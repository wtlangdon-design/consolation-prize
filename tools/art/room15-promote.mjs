// Room 15's three figures, promoted provisionally under errata 72 E: technical
// gates run now, acceptance pending Tyler's playthrough. Cut by
// tools/art/room15-figures.py; the plate is promoted by tools/art/room15-plate.mjs.
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const items = [
  { attempt: 3, name: 'livery-man' },
  { attempt: 4, name: 'grievance' },
  { attempt: 5, name: 'mules' },
];
for (const { attempt, name } of items) {
  const derived = `art/staging/room-15/${name}/${name}.png`;
  const gates = runGates(derived, { kind: 'sprite' });
  if (!gates.passed) throw new Error(`${derived} fails its gates: ${JSON.stringify(gates).slice(0, 400)}`);
  const done = promoteProvisional({ assetId: 'room-15', attempt, derived,
    provenance: `art/staging/room-15/${name}/${name}.json`, shippingPath: `art/actors/room-15-${name}.png`,
    gates: { ...gates, kind: 'sprite' }, by: 'claude, Room 15 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
