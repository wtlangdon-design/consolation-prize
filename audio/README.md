# Music beds

**Rendered, and here.** `node tools/render-music.mjs` writes both files from
`proofs/audio/consolation-audio-proof.html` — the proof *is* the renderer, and
that is the point of errata 49 item 1: a second copy of the synthesis would
agree today and drift a semitone apart in a month.

| file | cue | length | content |
|---|---|---|---|
| `consolation-title.wav` | **O-01-M** | 25.26s | CONSOLATION, full, piano-led — doc 28's title mix. Two statements of 32 beats at 152. |
| `thaddeus-room-01.wav` | **O-02-M** | 37.89s | THADDEUS, Room 1. Solo, unaccompanied. Four bars of 3/4 at 76, four times. |

Both use the LA-flavoured voices, which **errata 56** made canon: *"The
LA-flavoured voice is canon."* `THEME_LA` and `THADDEUS_LA`, at
`DETUNE_START` — the whole game is 35 cents flat and so are these.

**They change about once a month.** Rendering needs Chromium, and adding a
browser download to every deploy to regenerate a file that changes monthly is
a poor trade, so the stems are committed and this is not a build step.

## Each file is exactly a whole number of statements, and loops without a seam

`engine/core/Music.ts` sets `element.loop = true`, which restarts at sample
zero the instant the file ends. So a stem's length has to *be* the loop, and a
release hanging off the end is a hole in it.

**The first render had one.** THADDEUS decayed to *digital silence* 0.6s before
the end — a half-second hole in a 38-second bed, every time round — and the
title's tail fell from 0.45 to 0.014 over the same 1.2 seconds.

The renderer now renders the release past the last beat and **folds it back
over the start**, which is what continuous playing sounds like: a note still
ringing when the last beat ends is still ringing when the first beat comes
round again. Measured after: **no silent run anywhere in either file**, and the
sample step across the loop point is *smaller than the median ordinary step* —
0.0116 against a median of 0.0118 on the title, 0.0062 against 0.0089 on
THADDEUS. There is no click to hear.

`renders/music-stems-waveforms.png` is what they look like.

## Two renders are never byte-identical, and that is the voice

Errata 56 builds the LA attack transient from **bandpassed noise** plus a high
inharmonic ping. So every render is a different performance of the same music.
Measured across two consecutive runs: the difference is **0.9% RMS on the
title and 0.1% on THADDEUS** — 45% and 82% of samples identical, largest single
sample difference 0.03 and 0.004.

**So do not diff these files to see whether the music changed.** A byte
comparison says "different" on every re-render and would say it just as loudly
if nothing had been touched. Listen, or compare lengths and levels.

## A missing file is silence, not an error

`Music.ts` survives every path here being absent, which is why the game ran
unchanged while this directory was empty — and why it starts playing the moment
these are committed, with no other change.
