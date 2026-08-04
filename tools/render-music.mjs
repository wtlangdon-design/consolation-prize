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
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROOF = resolve(ROOT, 'proofs/audio/consolation-audio-proof.html');
const OUT = resolve(ROOT, 'audio');
const RATE = 44100;

/**
 * WHAT GETS RENDERED, and each one is a doc 45 cue rather than a convenience.
 *
 * `loops` is whole statements, so the file ends where it began and the bed
 * loops without a seam. A stem cut mid-bar is audible on every repeat.
 */
const STEMS = [
  { file: 'consolation-title.ogg', piece: 'THEME_LA', loops: 2,
    note: 'O-01-M — CONSOLATION, the title mix. Doc 28: full, piano-led.' },
  { file: 'thaddeus-room-01.ogg', piece: 'THADDEUS_LA', loops: 4,
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

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(PROOF).href);
mkdirSync(OUT, { recursive: true });

for (const stem of STEMS) {
  const rendered = await page.evaluate(async ({ piece, loops, rate }) => {
    const CA = window.ConsolationAudio;
    const music = CA[piece];
    const beat = 60 / music.tempo;
    const beats = music.loopBeats * loops;
    // A tail, so the last note's release is inside the file rather than
    // chopped off and clicking on the loop point.
    const seconds = beats * beat + 1.2;
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
    };
  }, { piece: stem.piece, loops: stem.loops, rate: RATE });

  const path = resolve(OUT, stem.file.replace(/\.ogg$/, '.wav'));
  writeFileSync(path, wav([Float32Array.from(rendered.left), Float32Array.from(rendered.right)], RATE));
  process.stdout.write(`${stem.file.replace(/\.ogg$/, '.wav')}  ${rendered.seconds.toFixed(2)}s  ${stem.note}\n`);
}

await browser.close();
