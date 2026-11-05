// Room 31's plate, derived to 1920x864 under errata 63 and promoted
// provisionally under errata 72 E. No image operation here.
//
// THE FRAME. Operation 2 took out every person, the mule and her hearse, and the coffin
// on its trestles: each is cut from the master by difference and drawn over this plate
// (tools/art/room31-cast.py). The master painted the whole canvas and stood Thad below
// the layout's band, so the crop starts at y 200, which keeps his feet. By day (doc 54's
// THE SKY, errata 99 G).
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';

const S = 'art/staging/room-31/plate-01';
const CROP = { x: 8, y: 200, width: 1520, height: 684 };
// By day: no lift (tools/art/plate-lift.py at 1.0 records that).
const LIFT = 1.0;
const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/candidate-1920x864.png`, crop: CROP });
const lift = JSON.parse(execFileSync('python3', ['tools/art/plate-lift.py', `${S}/candidate-1920x864.png`, `${S}/candidate-lifted-1920x864.png`, String(LIFT)], { encoding: 'utf8' }));
writeFileSync(`${S}/frame.json`, `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, out: `${S}/candidate-lifted-1920x864.png`, derivation: record, lift,
  why: 'Room 31 takes a 20:9 crop from y 200: the master painted the whole canvas and stood Thad below the band (tools/art/room31-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', record.derived.path, record.derived.hash.slice(0, 12));
// THE NIGHT (operation 4, doc 57 E8): the same hill after Hob has dug Thad out --
// the grave open, the coffin in it with its lid off, the dirt thrown about, nobody.
// Same crop; it reads as Boot Hill's night does (lower 45%: 37.6 against Room 14's
// 37.2), so no lift. Shown by the room's plateWhen once Thad has lain down.
const N = 'art/staging/room-31/plate-night';
const night = deriveFixedRoomPlate({ source: `${N}/source.png`, out: `${N}/candidate-1920x864.png`, crop: CROP });
writeFileSync(`${N}/frame.json`, `${JSON.stringify({
  source: `${N}/source.png`, crop: CROP, out: `${N}/candidate-1920x864.png`, derivation: night,
  why: 'The night companion, cropped as the day plate is (tools/art/room31-plate.mjs).',
}, null, 1)}\n`);
console.log('derived', night.derived.path, night.derived.hash.slice(0, 12));
if (process.argv.includes('--promote')) {
  const nightGates = runGates(`${N}/candidate-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!nightGates.passed) throw new Error('the night plate fails its gates');
  const nightDone = promoteProvisional({ assetId: 'room-31', attempt: 4, derived: `${N}/candidate-1920x864.png`,
    provenance: `${N}/frame.json`, shippingPath: 'art/backgrounds/room-31-funeral-night.png',
    gates: { ...nightGates, kind: 'plate' }, by: 'claude, Room 31 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', nightDone.to, nightDone.hash.slice(0, 12));
}
if (process.argv.includes('--promote')) {
  const gates = runGates(`${S}/candidate-lifted-1920x864.png`, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-31', attempt: 2, derived: `${S}/candidate-lifted-1920x864.png`,
    provenance: `${S}/frame.json`, shippingPath: 'art/backgrounds/room-31-funeral.png',
    gates: { ...gates, kind: 'plate' }, by: 'claude, Room 31 builder (doc 55 section 3, errata 72 E)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
