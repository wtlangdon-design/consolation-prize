// Room 4's shipping art, promoted provisionally under errata 72 E: technical
// gates run now, acceptance pending Tyler's playthrough. Run once per change.
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const BY = 'claude, Room 4 builder (doc 55 section 3, errata 72 E)';
const items = [
  { assetId: 'room-04', attempt: 2, kind: 'plate', expect: '1920x864',
    derived: 'art/staging/room-04/plate-01/candidate-1920x864.png',
    provenance: 'art/staging/room-04/plate-01/frame.json', to: 'art/backgrounds/room-04-nugget-back.png' },
  ...[1, 2, 3].map((n) => ({ assetId: 'room-04', attempt: 2, kind: 'sprite',
    derived: `art/staging/room-04/judges/judge-${n}.png`,
    provenance: 'art/staging/room-04/judges/judges.json', to: `art/actors/room-04-judge-${n}.png` })),
  { assetId: 'deke-vessel', attempt: 2, kind: 'sprite',
    derived: 'art/staging/room-04/deke/deke-vessel-530-graded.png',
    provenance: 'art/staging/room-04/deke/deke.json', to: 'art/actors/deke-vessel-room-04.png' },
];
for (const item of items) {
  const gates = runGates(item.derived, { kind: item.kind, ...(item.expect ? { expect: item.expect } : {}) });
  if (!gates.passed) throw new Error(`${item.derived} fails its gates`);
  const done = promoteProvisional({ assetId: item.assetId, attempt: item.attempt, derived: item.derived,
    provenance: item.provenance, shippingPath: item.to, gates: { ...gates, kind: item.kind }, by: BY });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
