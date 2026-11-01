// Room 7's Sump, promoted provisionally under errata 72 E: technical gates run
// now, acceptance pending Tyler's playthrough. The plate is promoted by
// tools/art/room07-plate.mjs. Run once per change.
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const item = { assetId: 'room-07', attempt: 3, kind: 'sprite', derived: 'art/staging/room-07/sump/sump.png',
  provenance: 'art/staging/room-07/sump/sump.json', to: 'art/actors/room-07-sump.png' };
const gates = runGates(item.derived, { kind: item.kind });
if (!gates.passed) throw new Error(`${item.derived} fails its gates: ${JSON.stringify(gates).slice(0, 400)}`);
const done = promoteProvisional({ assetId: item.assetId, attempt: item.attempt, derived: item.derived,
  provenance: item.provenance, shippingPath: item.to, gates: { ...gates, kind: item.kind },
  by: 'claude, Room 7 builder (doc 55 section 3, errata 72 E)' });
console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
