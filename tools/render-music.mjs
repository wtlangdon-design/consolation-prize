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
 * NOBODY HAS RUN IT. It was written in an environment with no browser and no
 * way to fetch one -- `npx playwright install chromium` fails on the network
 * allowlist there. So this has never executed and should be treated as
 * unproven until it has. That is the honest state and it is written here
 * rather than discovered.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
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
];

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

const browser = await launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(PROOF).href);
mkdirSync(OUT, { recursive: true });

for (const stem of STEMS) {
  const rendered = await page.evaluate(async ({ piece, loops, rate, tail }) => {
    const CA = window.ConsolationAudio;
    const music = CA[piece];
    const beat = 60 / music.tempo;
    const beats = music.loopBeats * loops;
    // Rendered WITH the tail; the caller folds it back over the start, so the
    // release is present at the loop point rather than chopped off it.
    const seconds = beats * beat + tail;
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
    const engine = CA.createEngine(ctx, { detuneCents: CA.DETUNE_START, pianoCSharpFlat: true });
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
  }, { piece: stem.piece, loops: stem.loops, rate: RATE, tail: TAIL_SECONDS });

  const channels = [rendered.left, rendered.right].map((data) => fold(data, rendered.bodyFrames));
  const path = resolve(OUT, stem.file);
  writeFileSync(path, wav(channels, RATE));
  const held = rendered.bodyFrames / RATE;
  process.stdout.write(`${stem.file}  ${held.toFixed(2)}s `
    + `(${(rendered.seconds - held).toFixed(2)}s of release folded back)  ${stem.note}\n`);
}

await browser.close();
