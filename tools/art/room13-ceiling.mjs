// Room 13's ceiling: the top rows of the plate painted (errata 119). The audit
// found the top 38 rows of art/backgrounds/room-13-undertakers.png one flat
// colour (mean 23,23,22, std about 1) over a near-black line -- the picture
// stopped short of the frame. Operation 4 (reference/room-13/prompts/ceiling-01.txt)
// was given the shipping plate back in plate-01's frame with that strip marked
// as missing, and painted the ceiling continuing upward.
//
// ONLY THE STRIP IS TAKEN. The operation's output is derived with the standard
// crop, and rows 0..BAND-1 come from it; every row from BAND down is the
// shipping plate's own, byte for byte, so no hotspot, walk box or occlusion
// plane read off the old plate moves. tools/check-plate-flat-edges.mjs is the
// check that fails the old plate.
//
// usage: node tools/art/room13-ceiling.mjs [--promote]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveFixedRoomPlate } from './derive.mjs';
import { runGates } from './gates.mjs';
import { promoteProvisional } from './staging.mjs';
import { readPng } from '../lib/png.mjs';
import { writePng } from '../lib/pngwrite.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const S = 'art/staging/room-13/ceiling-01';
const SHIPPING = 'art/backgrounds/room-13-undertakers.png';
const CROP = { x: 8, y: 170, width: 1520, height: 684 };
const BAND = 40;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sha = (p) => hash(readFileSync(resolve(ROOT, p)));

const record = deriveFixedRoomPlate({ source: `${S}/source.png`, out: `${S}/derived-1920x864.png`, crop: CROP });
const painted = readPng(readFileSync(resolve(ROOT, `${S}/derived-1920x864.png`)));
// The base is the plate as it shipped before this fix, kept beside the
// operation on the first run, so a re-run after promotion composites onto the
// old plate and not onto its own output. Its hash is in frame.json; the bytes
// are the plate's previous version in git.
const BEFORE = `${S}/before.png`;
if (!existsSync(resolve(ROOT, BEFORE))) writeFileSync(resolve(ROOT, BEFORE), readFileSync(resolve(ROOT, SHIPPING)));
const baseBytes = readFileSync(resolve(ROOT, BEFORE));
const base = readPng(baseBytes);
if (base.width !== painted.width || base.height !== painted.height) throw new Error('the plate and the derived picture differ in size');
const pixels = Buffer.from(base.pixels);
for (let y = 0; y < BAND; y += 1) {
  for (let x = 0; x < base.width; x += 1) {
    const i = (y * base.width + x) * 4;
    for (let c = 0; c < 4; c += 1) pixels[i + c] = c === 3 ? 255 : painted.pixels[i + c];
  }
}
const out = `${S}/candidate-1920x864.png`;
writeFileSync(resolve(ROOT, out), writePng({ width: base.width, height: base.height, pixels }, { alpha: false }));
writeFileSync(resolve(ROOT, `${S}/frame.json`), `${JSON.stringify({
  source: `${S}/source.png`, crop: CROP, derived: `${S}/derived-1920x864.png`, derivation: record,
  base: { path: BEFORE, hash: hash(baseBytes), was: SHIPPING },
  band: { rows: [0, BAND - 1], from: 'derived' }, out, outHash: sha(out),
  why: 'Room 13 ceiling (errata 119): rows 0-39 painted by operation 4; rows 40-863 are the shipping plate unchanged.',
}, null, 1)}\n`);
console.log('composited', out, sha(out).slice(0, 12));
if (process.argv.includes('--promote')) {
  const gates = runGates(out, { kind: 'plate', expect: '1920x864' });
  if (!gates.passed) throw new Error('the plate fails its gates');
  const done = promoteProvisional({ assetId: 'room-13', attempt: 4, derived: out,
    provenance: `${S}/frame.json`, shippingPath: SHIPPING,
    gates: { ...gates, kind: 'plate' }, by: 'claude, art fixes (errata 119)' });
  console.log('promoted (pending acceptance)', done.to, done.hash.slice(0, 12));
}
