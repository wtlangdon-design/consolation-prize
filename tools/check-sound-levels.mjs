import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readJson, Report, ROOT, runCheck } from './lib/content.mjs';

/**
 * NO SOUND EFFECT TAKES CENTRE STAGE (Tyler, 2026-11-06: "make sure sfx
 * aren't absurdly loud. The sound level needs to make sure they're background
 * effects not sounds that take center stage").
 *
 * When the sounds were first wired, every gain was a number picked by eye. The
 * fork in the case played ten decibels over the music, the distant bell seven,
 * the hollow floorboard six. Nothing flagged it: a sound at the wrong level
 * still exists, still plays, still passes every other check.
 *
 * So the levels are measured. The reference is the music as it actually plays
 * -- the median room bed, file times gain -- and content/audio/sounds.json's
 * `levels` gives each kind of sound its place under it, in dB. Every sound must
 * sit at or below its target plus 2 dB:
 *
 *   a one-shot or a footstep  its loudest 400 ms, times its gain
 *   a held bed or background  its whole-file RMS, times its gain
 *
 * 400 ms because a short sound's loudness is a moment, not an average: a stamp
 * averaged over a silent tail would read as quiet and land like a slap.
 */
const SLACK_DB = 2;

function samples(path) {
  const buf = readFileSync(resolve(ROOT, path));
  let at = 12;
  let channels = 1;
  let bits = 16;
  while (at < buf.length - 8) {
    const id = buf.toString('ascii', at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(at + 10);
      bits = buf.readUInt16LE(at + 22);
    }
    if (id === 'data') {
      if (bits !== 16) throw new Error(`${path}: ${bits}-bit audio; this reads 16`);
      const frames = size / 2 / channels;
      const out = new Float64Array(frames);
      for (let f = 0; f < frames; f += 1) {
        let sum = 0;
        for (let c = 0; c < channels; c += 1) sum += buf.readInt16LE(at + 8 + (f * channels + c) * 2) / 32768;
        out[f] = sum / channels;
      }
      return out;
    }
    at += 8 + size + (size % 2);
  }
  throw new Error(`${path}: no audio data`);
}

const rms = (x) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));
function loudestMoment(x, seconds = 0.4, rate = 44100) {
  const n = Math.round(seconds * rate);
  if (x.length <= n) return rms(x);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += x[i] * x[i];
  let best = sum;
  for (let i = n; i < x.length; i += 1) {
    sum += x[i] * x[i] - x[i - n] * x[i - n];
    if (sum > best) best = sum;
  }
  return Math.sqrt(best / n);
}
const db = (v) => 20 * Math.log10(v + 1e-12);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

export function check() {
  const report = new Report('No sound effect is louder than its place under the music');
  const manifest = readJson('content/manifest.json');
  const sounds = readJson(manifest.sounds);
  const levels = sounds.levels;
  if (!levels) {
    report.fail(`${manifest.sounds} has no \`levels\`: every sound needs a place under the music`);
    return report;
  }
  const cache = new Map();
  const read = (path) => { if (!cache.has(path)) cache.set(path, samples(path)); return cache.get(path); };
  const beds = Object.values(manifest.music.rooms).filter(Boolean).map((bed) => db(rms(read(bed.src)) * (bed.gain ?? 1)));
  const music = median(beds);
  let checked = 0;
  const judge = (what, level, target) => {
    checked += 1;
    const over = level - music - target;
    if (over > SLACK_DB) {
      report.fail(`${what}: ${(level - music).toFixed(1)} dB against the music, its place is ${target} `
        + `(ceiling ${target + SLACK_DB}) -- lower its gain in ${manifest.sounds}`);
    }
  };

  const steps = sounds.footsteps;
  for (const [surface, files] of Object.entries(steps.surfaces)) {
    for (const file of files) judge(`footstep ${surface} ${file}`, db(loudestMoment(read(file)) * steps.gain), levels.footsteps);
  }
  for (const [id, cue] of Object.entries(sounds.cues)) {
    const target = levels.cues?.[id] ?? levels.cue;
    for (const part of cue.play ?? []) judge(`cue ${id} ${part.src}`, db(loudestMoment(read(part.src)) * (part.gain ?? 1)), target);
    if (cue.bed) judge(`cue ${id} bed ${cue.bed.src}`, db(rms(read(cue.bed.src)) * (cue.bed.gain ?? 1)), levels.cueBed);
  }
  for (const [room, bed] of Object.entries(sounds.ambience)) {
    judge(`background ${room} ${bed.src}`, db(rms(read(bed.src)) * (bed.gain ?? 1)), levels.ambience?.[room] ?? levels.ambienceDefault);
    for (const layer of bed.layers ?? []) {
      judge(`background ${room} layer ${layer.src}`, db(rms(read(layer.src)) * (layer.gain ?? 1)), levels.ambienceLayer);
    }
  }
  // A ROOM'S OWN SCRIPTED SOUNDS, through `roomGain`: the coffin's timeline,
  // the listening chamber's taps, void and fork.
  const roomGain = sounds.roomGain ?? {};
  for (const roomFile of manifest.rooms) {
    const room = readJson(roomFile);
    const scale = roomGain[room.id] ?? 1;
    const steps = (room.timeline?.steps ?? room.timeline ?? []);
    for (const step of Array.isArray(steps) ? steps : []) {
      if (step.do === 'sound' && step.src) judge(`${room.id} timeline ${step.src}`, db(loudestMoment(read(step.src)) * (step.gain ?? 1) * scale), levels.scene);
    }
  }
  if (manifest.listening || sounds.roomGain?.listening_chamber) {
    const taps = readJson('content/audio/r33-taps.json');
    const scale = roomGain.listening_chamber ?? 1;
    for (const one of [...taps.taps, taps.void, taps.fork].filter(Boolean)) {
      judge(`listening_chamber ${one.src}`, db(loudestMoment(read(one.src)) * scale), levels.scene);
    }
  }
  report.note(`${checked} sounds measured against the music (median room bed ${music.toFixed(1)} dBFS)`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
