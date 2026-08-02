# Audio feasibility proof — not an audio system

One HTML file, no dependencies, no engine integration. It exists to answer one
question: **does synthesis get us a period-correct sound, or is audio the area
where sampled or commissioned work is the honest answer?**

Open `consolation-audio-proof.html` in a browser. Three buttons: the Consolation
theme at −35 cents, the same theme in tune, and the ninety-second Act IV
resolution. The instrument auditions and the flat-C♯ toggle are diagnostics —
they are the only way to judge the four instruments individually and to hear the
C♯ rule as an A/B.

**The melody is not canon.** Doc 28 describes the Consolation theme; nobody had
written it, so it was written for this proof and is expected to be replaced. What
is being demonstrated is the engine, not the tune.

## What is measured, not asserted

Verified headless in Chromium with autocorrelation on the rendered waveform:
global detune −35.47 cents on piano and −35.16 on fiddle *from the same
parameter*; the C♯ rule at −100.52 cents, stacking to −135.11 with the global
offset, while D moves 1.86 cents and is therefore genuinely per-note-class; the
ninety-second arc exact at every quartile and landing on 0.000.

A real leak was found and fixed on the way: `connect(osc.detune)` holds a strong
reference to every oscillator for ever, so sixty seconds of music left 799 live
note-graphs and climbing. Anyone building "one parameter threaded through every
voice" for real will hit it.

## The finding, in one line

The mechanism should be built and the music should not. The tuning conceit is
one `ConstantSourceNode.offset` and it is exact and free; a synthesized solo
fiddle playing THADDEUS is the most recognisable "this is a computer" sound in
game audio, and it would be playing during the moment the game is about.
