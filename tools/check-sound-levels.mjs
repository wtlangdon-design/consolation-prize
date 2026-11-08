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
/**
 * AND NO BACKGROUND SOUND IS LOST UNDER THE MUSIC (Tyler, 2026-11-06, listening
 * to every room at its real level: "you can't hear really any of the background
 * sounds and noises. The music completely overpowers everything."). The first
 * pass set ceilings only, 16-20 dB under the score, and nothing stopped a sound
 * sitting so far under its place that nobody hears it. Every sound measured
 * here must also sit no more than FLOOR_DB under its place.
 */
const FLOOR_DB = 6;
/** And no place is set so far under the score that the floor itself is silence:
 * the first pass's places were 16-20 dB under, and every sound sat exactly on
 * its place. A background's place is no lower than this. */
const LOWEST_PLACE = -12;

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
  const report = new Report('No sound effect is louder than its place under the music, and a featured one is heard');
  const manifest = readJson('content/manifest.json');
  const sounds = readJson(manifest.sounds);
  const levels = sounds.levels;
  if (!levels) {
    report.fail(`${manifest.sounds} has no \`levels\`: every sound needs a place under the music`);
    return report;
  }
  const places = [['footsteps', levels.footsteps], ['cue', levels.cue], ['cueBed', levels.cueBed],
    ['ambienceDefault', levels.ambienceDefault], ['ambienceLayer', levels.ambienceLayer],
    ...Object.entries(levels.ambience ?? {}).map(([room, v]) => [`ambience.${room}`, v]),
    ...Object.entries(levels.cues ?? {}).map(([id, v]) => [`cues.${id}`, v])];
  for (const [name, place] of places) {
    if (typeof place === 'number' && place < LOWEST_PLACE) {
      report.fail(`levels.${name} is ${place} dB under the music; no sound's place is lower than ${LOWEST_PLACE} -- below that it is not heard`);
    }
  }
  const cache = new Map();
  const read = (path) => { if (!cache.has(path)) cache.set(path, samples(path)); return cache.get(path); };
  const beds = Object.values(manifest.music.rooms).filter(Boolean).map((bed) => db(rms(read(bed.src)) * (bed.gain ?? 1)));
  const music = median(beds);
  let checked = 0;
  const judge = (what, level, target, reference = music, against = 'the music', floor = true) => {
    checked += 1;
    const over = level - reference - target;
    if (over > SLACK_DB) {
      report.fail(`${what}: ${(level - reference).toFixed(1)} dB against ${against}, its place is ${target} `
        + `(ceiling ${target + SLACK_DB}) -- lower its gain in ${manifest.sounds}`);
    }
    // The coffin's and the chamber's scripted sounds (their place is `scene`)
    // keep a ceiling only: their distance is the scene.
    if (floor && target !== levels.scene && over < -FLOOR_DB) {
      report.fail(`${what}: ${(level - reference).toFixed(1)} dB against ${against}, its place is ${target} `
        + `(floor ${target - FLOOR_DB}) -- lost under the music; raise its gain in ${manifest.sounds}`);
    }
  };
  // A SOUND THAT DUCKS THE MUSIC (errata 107) is measured against what it
  // actually plays over: its own room's bed, dipped by the duck.
  const roomBed = (room) => {
    const bed = manifest.music.rooms[room];
    if (!bed) return music;
    let power = (rms(read(bed.src)) * (bed.gain ?? 1)) ** 2;
    for (const layer of bed.layers ?? []) power += (rms(read(layer.src)) * (layer.gain ?? 1)) ** 2;
    return db(Math.sqrt(power));
  };

  const steps = sounds.footsteps;
  for (const [surface, files] of Object.entries(steps.surfaces)) {
    // Each step under its ceiling; the floor is the surface's loudest step, since
    // a walk's steps differ on purpose and the softest of them is not the walk.
    for (const file of files) judge(`footstep ${surface} ${file}`, db(loudestMoment(read(file)) * steps.gain), levels.footsteps, music, 'the music', false);
    judge(`footsteps on ${surface}`, Math.max(...files.map((file) => db(loudestMoment(read(file)) * steps.gain))), levels.footsteps);
  }
  for (const [id, cue] of Object.entries(sounds.cues)) {
    const target = levels.cues?.[id] ?? levels.cue;
    const room = cue.duck ? sounds.verbs.find((rule) => rule.cue === id)?.room ?? cue.room : undefined;
    const reference = cue.duck ? roomBed(room) + db(cue.duck.to) : music;
    const against = cue.duck ? `${room}'s music, ducked to ${cue.duck.to}` : 'the music';
    for (const part of cue.play ?? []) {
      judge(`cue ${id} ${part.src}`, db(loudestMoment(read(part.src)) * (part.gain ?? 1)), target, reference, against);
    }
    // A bed may be given its own place (levels.cueBeds), as a cue's one-shot may: the team breathing in the dark
    // is the opening's only sound under the stars (errata 157, Tyler: "I didn't hear horses").
    if (cue.bed) judge(`cue ${id} bed ${cue.bed.src}`, db(rms(read(cue.bed.src)) * (cue.bed.gain ?? 1)), levels.cueBeds?.[id] ?? levels.cueBed);
  }
  // AND A FEATURED SOUND MUST BE HEARD (errata 107: "The bell is hard to hear
  // over the music"). A cue the room is about -- the bell the line says the
  // whole town heard -- ducks the music and sits no lower than its place.
  for (const id of levels.featured ?? []) {
    const cue = sounds.cues[id];
    if (!cue?.duck) { report.fail(`cue ${id} is featured and does not duck the music: it will be lost under the score`); continue; }
    const room = sounds.verbs.find((rule) => rule.cue === id)?.room ?? cue.room;
    const reference = roomBed(room) + db(cue.duck.to);
    const target = levels.cues?.[id] ?? levels.cue;
    // AND THE DIP LANDS FIRST, AND THE SOUND OUTLASTS IT (errata 108: "The
    // bell doesn't toll loudly enough for long enough and the music dips too
    // late"). Its first sound waits out the duck's attack, and it stays within
    // 10 dB of the ducked music for as long as the music is held down: a dip
    // with nothing in it is a hole, and a bell cut short by the music's return
    // is the complaint.
    const attack = cue.duck.attack ?? 0.08;
    for (const part of cue.play ?? []) {
      if ((part.at ?? 0) < attack) {
        report.fail(`cue ${id} ${part.src}: sounds at ${part.at ?? 0}s, before the music has dipped (${attack}s) -- give it an \`at\``);
      }
      const x = read(part.src);
      const n = Math.round(0.4 * 44100);
      let last = 0;
      for (let i = 0; i + n <= x.length; i += 2205) {
        let sum = 0;
        for (let k = i; k < i + n; k += 1) sum += x[k] * x[k];
        if (db(Math.sqrt(sum / n) * (part.gain ?? 1)) - reference >= -10) last = (i + n) / 44100;
      }
      const held = (part.at ?? 0) + last;
      if (held < cue.duck.seconds) {
        report.fail(`cue ${id} ${part.src}: heard over ${room}'s ducked music for ${held.toFixed(1)}s of a `
          + `${cue.duck.seconds}s dip -- it is featured, and over before the music comes back`);
      }
    }
    for (const part of cue.play ?? []) {
      const level = db(loudestMoment(read(part.src)) * (part.gain ?? 1)) - reference;
      if (level < target - SLACK_DB) {
        report.fail(`cue ${id} ${part.src}: ${level.toFixed(1)} dB over ${room}'s ducked music, its place is ${target} `
          + `(floor ${target - SLACK_DB}) -- it is featured, and too quiet to hear`);
      }
    }
  }
  // THE LOUDEST SOUND IN THE GAME IS THE ONE THE WRITING SAYS IS (doc 48 S6 beat 3: "The county seal
  // comes down. One stamp. It is the loudest sound in the game"). `levels.loudest` names one cue, the
  // single exception to "background effects, not centre stage" (errata 106): against the music, its
  // loudest moment is at least `overNext` dB over every other sound's -- every cue's every part and
  // every footstep. A bell turned up past it, or the seal turned down to a bell, fails here.
  if (levels.loudest) {
    const named = sounds.cues[levels.loudest.cue];
    if (!named?.play?.length) report.fail(`levels.loudest names ${levels.loudest.cue}, which is no cue that plays`);
    else {
      const levelOf = (part) => db(loudestMoment(read(part.src)) * (part.gain ?? 1)) - music;
      const seal = Math.max(...named.play.map(levelOf));
      let next = -Infinity; let nextWhat = '';
      for (const [id, cue] of Object.entries(sounds.cues)) {
        if (id === levels.loudest.cue) continue;
        for (const part of cue.play ?? []) { const l = levelOf(part); if (l > next) { next = l; nextWhat = `cue ${id} ${part.src}`; } }
      }
      for (const files of Object.values(steps.surfaces)) {
        for (const file of files) { const l = db(loudestMoment(read(file)) * steps.gain) - music; if (l > next) { next = l; nextWhat = `footstep ${file}`; } }
      }
      checked += 1;
      if (seal - next < levels.loudest.overNext) {
        report.fail(`${levels.loudest.cue} is ${seal.toFixed(1)} dB against the music and ${nextWhat} is ${next.toFixed(1)}: `
          + `the loudest sound in the game must be ${levels.loudest.overNext} dB over every other`);
      }
    }
  }
  // A MOMENT MEANT TO BE NOTICED IS SET TO BE NOTICED (errata 117; Tyler,
  // 2026-11-06: "it needs to really be noticeable if it's supposed to be
  // noticeable"). The fiddler's played barks went in at 4 dB over a gently
  // ducked room, and his retune in F2 at 8 dB under the score -- both measured,
  // both inside their ceilings, both easy to miss. A townsperson's played bark
  // is his remark: it is featured, at 8 dB or more over the ducked music. A
  // sound on Room 33's tuning arc sits no more than 4 dB under the score.
  for (const path of manifest.ambient ?? []) {
    const npc = readJson(path);
    for (const [state, id] of Object.entries(npc.barkCues ?? {})) {
      const target = levels.cues?.[id] ?? levels.cue;
      if (!(levels.featured ?? []).includes(id)) report.fail(`${npc.id} ${state}: his played bark ${id} is not featured -- a remark nobody hears is not a remark`);
      if (target < 8) report.fail(`${npc.id} ${state}: his played bark ${id} is placed ${target} dB over the ducked music; a remark sits at 8 or more`);
    }
  }
  for (const roomFile of manifest.rooms) {
    const room = readJson(roomFile);
    for (const one of room.listening?.tune?.cues ?? []) {
      const target = levels.cues?.[one.cue] ?? levels.cue;
      if (target < -4) report.fail(`${room.id}: ${one.cue} on the tuning arc is placed ${target} dB under the score; it is there to be noticed, no lower than -4`);
    }
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
