/**
 * ERRATA 49 ITEM 1: render the stems offline from the same synthesis path.
 *
 *     node tools/render-music.mjs
 *
 * The proof is the renderer. It exports `ConsolationAudio` on window and
 * `createEngine(ctx, opts)` takes ANY context, which is why this can drive it
 * in an OfflineAudioContext without a second copy of the synthesis existing --
 * and a second copy is the thing to avoid, because two synths agree today and
 * drift a semitone apart in a month.
 *
 * WHY A BROWSER AT ALL. Web Audio is the synthesis. Reimplementing it in Node
 * would mean the stems no longer sound like the thing Tyler auditioned and
 * approved, which is the only reason any of these decisions are settled.
 *
 * NOT RUN AT BUILD TIME YET, AND THAT IS DELIBERATE. Rendering needs Chromium;
 * Pages already installs Node and could install a browser, but adding a
 * browser download to every deploy to regenerate files that change about once
 * a month is a poor trade. Run it when the music changes, commit the stems.
 *
 * IT HAS BEEN RUN NOW, and the stems in `audio/` came out of it.
 *
 * EVERY RENDER IS A DIFFERENT PERFORMANCE, AND THAT IS THE INSTRUMENT. Two
 * runs of this tool produce files of identical length that differ in half
 * their samples, peaking about 30 dB below full scale. It is not drift and it
 * is not a bug: the synthesis uses `Math.random()` twice, deliberately, and
 * both are load-bearing --
 *
 *   `noiseBuffer`  the noise source itself, which is what noise IS
 *   `vibOsc`       5.0 + random x 0.7 Hz per note, so the vibrato of two
 *                  notes never lines up, which is the whole reason it sounds
 *                  like a hand and not an oscillator
 *
 * Seeding them would make this reproducible and would make every note's
 * vibrato identical, which is the sound the jitter was put there to avoid.
 *
 * SO IT CAN NEVER BE A REGISTERED GENERATOR. `check-generated` proves an
 * artefact is what its generator produces TODAY, by comparing bytes, and these
 * bytes are different every time by design. It is a tool somebody runs and
 * then LISTENS to, which is a different kind of thing, and it is in
 * `NOT_GENERATORS` for that reason rather than by omission.
 *
 * AND IT REFUSES TO OVERWRITE. A stem that exists has been listened to; a
 * casual re-run would replace an approved performance with an unheard one and
 * the diff would say nothing but "4 MB changed". Pass --force when the music
 * has actually changed and you mean to audition the result.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { browser as launch } from './lib/chromium.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROOF = resolve(ROOT, 'proofs/audio/consolation-audio-proof.html');
const OUT = resolve(ROOT, 'audio');
const RATE = 44100;
/**
 * How much release to render past the last beat, and then FOLD BACK OVER THE
 * START rather than leave hanging on the end.
 *
 * `Music.ts` sets `element.loop = true`, which restarts at sample zero the
 * instant the file ends. An appended tail therefore plays out and then cuts to
 * the top: measured on the first render, THADDEUS decayed to DIGITAL SILENCE
 * 0.6s before the end, so a 39-second bed had a half-second hole in it every
 * time round. The title's tail fell from 0.45 to 0.014 over the same 1.2s --
 * quieter, and the same hole.
 *
 * Folding is what continuous playing actually sounds like: the release of the
 * last statement carries over the first notes of the next, because that is
 * where it would be if the piece had not stopped. The file is then exactly a
 * whole number of statements long and loops without a seam, which is what this
 * tool already claimed to do.
 */
const TAIL_SECONDS = 1.2;

/**
 * WHAT GETS RENDERED, and each one is a doc 45 cue rather than a convenience.
 *
 * `loops` is whole statements, so the file ends where it began and the bed
 * loops without a seam. A stem cut mid-bar is audible on every repeat.
 *
 * NAMED `.wav`, WHICH IS WHAT IS WRITTEN AND WHAT THE MANIFEST ASKS FOR. They
 * were named `.ogg` here and rewritten to `.wav` at all three use sites -- the
 * residue of an intention to encode, carried by a name that had stopped being
 * true (R5k). At 11 MB for the pair that intention is still worth having; it
 * needs an encoder and a manifest change, and it is not this.
 */
const STEMS = [
  { file: 'consolation-title.wav', piece: 'THEME_LA', loops: 2,
    note: 'O-01-M — CONSOLATION, the title mix. Doc 28: full, piano-led.' },
  { file: 'thaddeus-room-01.wav', piece: 'THADDEUS_LA', loops: 4,
    note: 'O-02-M — THADDEUS, Room 1. Four bars of 3/4, solo, unaccompanied.' },
  { file: 'thaddeus-complete-room-33.wav', piece: 'THADDEUS_COMPLETE_LA', loops: 4,
    note: 'R33-M — THADDEUS, complete (errata 70 C): the fourth bar resolves. Placeholder composition by the builder.' },
  // ERRATA 102: the other four themes, placeholder compositions by the builder.
  // Theme statements, named for the theme rather than a room: the room mixes
  // doc 28 Part Three asks for are arrangements OF these, and come after Tyler
  // has heard the themes themselves.
  { file: 'the-strike.wav', piece: 'STRIKE_LA', loops: 1, oneShot: true,
    note: 'THE STRIKE — three notes, harmonica, distant. A one-shot (doc 45 0.3): the tail is kept, not folded.' },
  { file: 'the-assay.wav', piece: 'ASSAY_LA', loops: 2,
    note: 'THE ASSAY — piano and jaw harp, bars of 3, 4, 5, 6.' },
  { file: 'winnie.wav', piece: 'WINNIE_LA', loops: 4,
    note: 'WINNIE — fiddle without vibrato, piano, C major, four bars.' },
  { file: 'the-company.wav', piece: 'COMPANY_LA', loops: 2,
    note: 'THE COMPANY — fiddle and parlour piano, F major; the piano doubles the tune the second time.' },
  // ERRATA 103: the room mixes, doc 28 Part Three. Arrangements of the approved
  // themes; `pianoTuned` renders the Nugget piano after T_NUGGET_PIANO_TUNED, and
  // `distance` puts a stem somewhere else: `far` (from up the road), `wall`
  // (through a hotel wall) -- filtering done here, after the synthesis, so the
  // proof keeps one performance and the room decides where it is heard from.
  { file: 'consolation-nugget-piano.wav', piece: 'CONSOLATION_PIANO_LA', loops: 2,
    note: 'R03-M — the Nugget piano, untuned: CONSOLATION on the upright alone. Also the Lane.' },
  { file: 'consolation-nugget-piano-tuned.wav', piece: 'CONSOLATION_PIANO_LA', loops: 2, pianoTuned: true,
    note: 'R03-M after T_NUGGET_PIANO_TUNED: the same performance with the C-sharp mended.' },
  { file: 'consolation-distant-piano.wav', piece: 'CONSOLATION_PIANO_LA', loops: 2, distance: 'far',
    note: 'O-07-M — the Nugget piano from the stage road.' },
  { file: 'consolation-distant-piano-tuned.wav', piece: 'CONSOLATION_PIANO_LA', loops: 2, distance: 'far', pianoTuned: true,
    note: 'O-07-M after the piano is tuned.' },
  { file: 'consolation-through-wall.wav', piece: 'THEME_LA', loops: 2, distance: 'wall',
    note: 'Rooms 18/19 — CONSOLATION faintly through a wall, as if from the street.' },
  { file: 'consolation-dawn.wav', piece: 'CONSOLATION_DAWN_LA', loops: 2,
    note: 'Room 36 — CONSOLATION, thin, one instrument (in tune by the bus, not the stem).' },
  { file: 'consolation-funeral.wav', piece: 'CONSOLATION_FUNERAL_LA', loops: 1,
    note: 'Room 31 — CONSOLATION, slow, a half step down on the bell\'s pitch, fiddle.' },
  { file: 'the-assay-registrar.wav', piece: 'ASSAY_JAW_LA', loops: 2,
    note: 'Rooms 7/8 — THE ASSAY, unaccompanied jaw harp.' },
  { file: 'the-strike-layer.wav', piece: 'STRIKE_LAYER_LA', loops: 1,
    note: 'Rooms 23/24 — THE STRIKE every 29 seconds, the layer under THADDEUS.' },
  // ERRATA 104: the Woodtick way -- the buildings doc 28 does not name, each
  // with CONSOLATION (or its neighbour's music) in its own orchestration.
  { file: 'consolation-laundry.wav', piece: 'CONSOLATION_LAUNDRY_LA', loops: 2,
    note: 'Sheng\'s laundry — the tune on harmonica, alone.' },
  { file: 'consolation-livery.wav', piece: 'CONSOLATION_LIVERY_LA', loops: 2,
    note: 'The livery — fiddle over the jaw harp\'s offbeats.' },
  { file: 'consolation-clarion.wav', piece: 'CONSOLATION_CLARION_LA', loops: 2,
    note: 'The Clarion — harmonica over the jaw harp\'s offbeats.' },
  { file: 'consolation-tent.wav', piece: 'CONSOLATION_TENT_LA', loops: 1,
    note: 'Madame Ozymandia\'s tent — harmonica at half speed, the fiddle\'s counter-line against it.' },
  { file: 'consolation-nugget-piano-wall.wav', piece: 'CONSOLATION_PIANO_LA', loops: 2, distance: 'wall',
    note: 'The Nugget back room — the saloon piano through the wall.' },
  { file: 'consolation-nugget-piano-wall-tuned.wav', piece: 'CONSOLATION_PIANO_LA', loops: 2, distance: 'wall', pianoTuned: true,
    note: 'The Nugget back room after the piano is tuned.' },
  { file: 'the-company-wall.wav', piece: 'COMPANY_LA', loops: 2, distance: 'wall',
    note: 'The Company vault — THE COMPANY through the wall from the offices.' },
  // ERRATA 109: the duels and the tunings.
  { file: 'the-final-duel.wav', piece: 'FINAL_DUEL_LA', loops: 1,
    note: 'U-FINAL-DUEL — the Company\'s tune over the Assay\'s machinery.' },
  { file: 'sfx/piano-flat.wav', piece: 'TUNING_LA', loops: 1, oneShot: true,
    note: 'A2/A8 — the flat C-sharp as the room has always heard it.' },
  { file: 'sfx/piano-tuned.wav', piece: 'TUNING_LA', loops: 1, oneShot: true, pianoTuned: true,
    note: 'A2/A8 — the same notes on the mended piano.' },
  // ERRATA 115: the fiddler (doc 07 #11).
  { file: 'consolation-nugget-fiddle.wav', piece: 'CONSOLATION_NUGGET_FIDDLE_LA', loops: 2,
    note: 'The Nugget fiddler: CONSOLATION\'s own fiddle part, with the piano, while he is in the room.' },
  { file: 'sfx/fiddler-faster.wav', piece: 'FIDDLER_FASTER_LA', loops: 1, oneShot: true,
    note: 'R_BORDERS_MOTT: "He plays something faster. Still flat."' },
  { file: 'sfx/fiddler-passing.wav', piece: 'FIDDLER_PASSING_LA', loops: 1, oneShot: true,
    note: 'R_DEAD: "He plays the passing tune. Correctly. Flat."' },
  { file: 'sfx/fiddler-broken-off-far.wav', piece: 'FIDDLER_BROKEN_OFF_LA', loops: 1, oneShot: true, distance: 'far',
    note: 'R_TRUTH, F2: the phrase, broken off, far away (assembled by tools/audio/render-fiddler.py).' },
  { file: 'sfx/fiddler-open-a-far.wav', piece: 'FIDDLER_OPEN_A_LA', loops: 1, oneShot: true, distance: 'far',
    note: 'R_TRUTH, F2: his A string, flat, before he turns the peg.' },
  { file: 'sfx/fiddler-phrase-far-tuned.wav', piece: 'FIDDLER_PHRASE_LA', loops: 1, oneShot: true, distance: 'far', inTune: true,
    note: 'R_TRUTH, F2: the phrase again, in tune -- the only stem rendered at 0 cents, because it is the one that is.' },
];
/** Where a stem is heard from (errata 103): a low-pass, a level, and the room it crosses. */
const DISTANCE = {
  far:  { lowpass: 1500, gain: 0.7, echoes: [[0.083, 0.30], [0.171, 0.18], [0.29, 0.10]] },
  wall: { lowpass: 420,  gain: 0.9, echoes: [[0.012, 0.35], [0.027, 0.2]] },
};

/** A two-pole low-pass, run twice, over a loop as the circle it is. */
function placeAt(data, how, bodyFrames) {
  const out = Float32Array.from(data);
  const w = 2 * Math.PI * how.lowpass / RATE, q = Math.SQRT1_2;
  const alpha = Math.sin(w) / (2 * q), cos = Math.cos(w), a0 = 1 + alpha;
  const b = [(1 - cos) / 2 / a0, (1 - cos) / a0, (1 - cos) / 2 / a0], a = [-2 * cos / a0, (1 - alpha) / a0];
  for (let pass = 0; pass < 2; pass += 1) {
    // run in over the loop's end first, so sample 0 follows the last sample
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const lead = Math.min(out.length, Math.round(0.2 * RATE));
    for (let i = out.length - lead; i < out.length; i += 1) {
      const y = b[0] * out[i] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
      x2 = x1; x1 = out[i]; y2 = y1; y1 = y;
    }
    for (let i = 0; i < out.length; i += 1) {
      const y = b[0] * out[i] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
      x2 = x1; x1 = out[i]; y2 = y1; y1 = y; out[i] = y;
    }
  }
  const dry = Float32Array.from(out);
  for (const [delay, g] of how.echoes) {
    const d = Math.round(delay * RATE);
    for (let i = 0; i < out.length; i += 1) out[(i + d) % bodyFrames] += g * dry[i];
  }
  for (let i = 0; i < out.length; i += 1) out[i] *= how.gain;
  return out;
}

/** A one-shot rings out in full rather than folding into a loop it is not. */
const ONE_SHOT_TAIL_SECONDS = 4.0;

function wav(channels, rate) {
  const n = channels[0].length;
  const bytes = n * channels.length * 2;
  const buf = Buffer.alloc(44 + bytes);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + bytes, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels.length, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * channels.length * 2, 28);
  buf.writeUInt16LE(channels.length * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(bytes, 40);
  let at = 44;
  for (let i = 0; i < n; i += 1) {
    for (const ch of channels) {
      // Clamped before scaling: the output stage soft-clips already, and a
      // sample that has crept past 1.0 must fold rather than wrap.
      const v = Math.max(-1, Math.min(1, ch[i]));
      buf.writeInt16LE(Math.round(v * 32767), at); at += 2;
    }
  }
  return buf;
}

/**
 * The body of the loop, with everything past it summed back into its head.
 *
 * A note that is still ringing when the last beat ends is still ringing when
 * the first beat comes round again -- that is what a loop IS -- so the overflow
 * belongs at the start, added to what is already there, and not on the end.
 */
function fold(data, bodyFrames) {
  const body = Float32Array.from(data.slice(0, bodyFrames));
  for (let i = bodyFrames; i < data.length; i += 1) {
    const at = i - bodyFrames;
    if (at >= body.length) break;
    body[at] += data[i];
  }
  return body;
}

const FORCE = process.argv.includes('--force');
// --only <file>: render that stem alone, leaving the auditioned ones as they are.
// A comma-separated list renders several in one browser session.
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
if (ONLY) STEMS.splice(0, STEMS.length, ...STEMS.filter((stem) => ONLY.includes(stem.file)));
// CHECKED BEFORE THE BROWSER STARTS, so a refusal costs nothing and reads as a
// refusal rather than as a slow failure.
const existing = STEMS.filter((stem) => existsSync(resolve(OUT, stem.file)));
if (existing.length && !FORCE) {
  process.stderr.write(
    `\nrender-music: ${existing.map((stem) => stem.file).join(', ')} already exist.\n\n`
    + '  Every render is a different performance -- the noise source and the per-note\n'
    + '  vibrato jitter are random by design -- so re-running replaces audio somebody\n'
    + '  has listened to with audio nobody has, and the diff says only that 4 MB\n'
    + '  changed. Pass --force when the music has actually changed, and listen to\n'
    + '  what comes out.\n\n');
  process.exit(1);
}

const browser = await launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(PROOF).href);
mkdirSync(OUT, { recursive: true });

for (const stem of STEMS) {
  const rendered = await page.evaluate(async ({ piece, loops, rate, tail, pianoTuned, inTune }) => {
    const CA = window.ConsolationAudio;
    const music = CA[piece];
    const beat = 60 / music.tempo;
    const beats = music.loopBeats * loops;
    // Rendered WITH the tail; the caller folds it back over the start, so the
    // release is present at the loop point rather than chopped off it.
    const seconds = beats * beat + tail;
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
    const engine = CA.createEngine(ctx, { detuneCents: inTune ? 0 : CA.DETUNE_START, pianoCSharpFlat: !pianoTuned });
    engine.setPiece(music);
    engine.open(0);
    engine.scheduleSpan(0, beats, 0);
    const buffer = await ctx.startRendering();
    return {
      left: Array.from(buffer.getChannelData(0)),
      right: Array.from(buffer.getChannelData(1)),
      seconds: buffer.duration,
      bodyFrames: Math.round(beats * beat * rate),
    };
  }, { piece: stem.piece, loops: stem.loops, rate: RATE, tail: stem.oneShot ? ONE_SHOT_TAIL_SECONDS : TAIL_SECONDS,
       pianoTuned: Boolean(stem.pianoTuned), inTune: Boolean(stem.inTune) });

  // A one-shot ends where its sound does, plus a breath: the first render of
  // THE STRIKE carried 3.15s of digital silence after its tail.
  const audibleEnd = (data) => { let i = data.length - 1; while (i > 0 && Math.abs(data[i]) < 0.0005) i -= 1; return i; };
  const oneShotEnd = Math.min(rendered.left.length,
    Math.max(audibleEnd(rendered.left), audibleEnd(rendered.right)) + Math.round(0.2 * RATE));
  const channels = stem.oneShot
    ? [rendered.left, rendered.right].map((data) => Float32Array.from(data.slice(0, oneShotEnd)))
    : [rendered.left, rendered.right].map((data) => fold(data, rendered.bodyFrames));
  if (stem.distance) channels.forEach((data, i) => { channels[i] = placeAt(data, DISTANCE[stem.distance], data.length); });
  const path = resolve(OUT, stem.file);
  writeFileSync(path, wav(channels, RATE));
  const held = stem.oneShot ? oneShotEnd / RATE : rendered.bodyFrames / RATE;
  process.stdout.write(`${stem.file}  ${held.toFixed(2)}s `
    + (stem.oneShot ? '(one-shot, rung out)  ' : `(${(rendered.seconds - held).toFixed(2)}s of release folded back)  `)
    + `${stem.note}\n`);
}

await browser.close();
