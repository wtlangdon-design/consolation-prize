/**
 * A FOOTSTEP IS OVER BEFORE THE NEXT FOOT COMES DOWN (errata 153). Tyler, of
 * the mud: "It sounded like bubbles popping" -- and of its replacement, "we
 * need to make sure it matches the speed that Thad walks". The engine sounds a
 * take on every foot plant (GameScene.footsteps: two plants a gait cycle), and
 * Thad plants a foot every strideLength / walkSpeed / 2 seconds (141 px over
 * 194 px/s: 0.36 s). The old mud take rang on, its bubbles and suction, for
 * 0.32 s of that, so the steps ran together and the walk smeared. Every take
 * on every floor falls 30 dB below its peak inside HALF a plant, so each step
 * is heard as its own with a gap before the next (every other floor and the
 * new mud: 0.09-0.18 s).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const json = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));

function samples(path) {
  const buf = readFileSync(resolve(ROOT, path));
  let at = 12; let rate = 44100; let channels = 1; let data = null;
  while (at < buf.length) {
    const id = buf.toString('ascii', at, at + 4); const size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') { channels = buf.readUInt16LE(at + 10); rate = buf.readUInt32LE(at + 12); }
    if (id === 'data') { data = buf.subarray(at + 8, at + 8 + size); break; }
    at += 8 + size + (size % 2);
  }
  const n = data.length / 2 / channels; const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) out[i] = data.readInt16LE(i * 2 * channels) / 32768;
  return { out, rate };
}

/** Seconds from the start until the 10 ms energy stays 30 dB under its peak. */
function ringsFor({ out, rate }) {
  const w = Math.round(rate * 0.01); const levels = [];
  for (let i = 0; i + w <= out.length; i += w) {
    let e = 0; for (let k = i; k < i + w; k += 1) e += out[k] * out[k];
    levels.push(Math.sqrt(e / w));
  }
  const peak = Math.max(...levels); const floor = peak * 10 ** (-30 / 20);
  let last = 0; levels.forEach((l, i) => { if (l > floor) last = i; });
  return ((last + 1) * w) / rate;
}

test('every footstep take is spent within half of Thad\'s foot plant', () => {
  const thad = json('content/actors/thad.json');
  const plant = thad.strideLength / thad.walkSpeed / 2 / 2;
  const steps = json('content/audio/sounds.json').footsteps;
  const long = [];
  for (const [surface, takes] of Object.entries(steps.surfaces)) {
    for (const take of takes) {
      const rings = ringsFor(samples(take));
      if (rings > plant) long.push(`${surface} ${take}: ${rings.toFixed(2)} s against a ${plant.toFixed(2)} s plant`);
    }
  }
  assert.deepEqual(long, [], 'a take that rings past half the plant runs the steps together');
});
