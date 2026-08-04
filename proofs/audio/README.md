# Audio feasibility proof — not an audio system

One HTML file, no dependencies, no engine integration. It exists to answer one
question: **does synthesis get us a period-correct sound, or is audio the area
where sampled or commissioned work is the honest answer?**

Open `consolation-audio-proof.html` in a browser. Buttons: the Consolation
theme at −35 cents, the same theme in tune, the ninety-second Act IV
resolution, and **THADDEUS in two voices** — the original bowed fiddle and the
LA-flavoured one. The instrument auditions and the flat-C♯ toggle are diagnostics —
they are the only way to judge the four instruments individually and to hear the
C♯ rule as an A/B.

**The melodies are placeholders, and both are now equally canonical.** Doc 28
describes the themes and no notated score exists there, so CONSOLATION and
THADDEUS were both written against the prose here. Either is replaceable by
anyone who writes a better one.

**THADDEUS and the LA voice are ruled, per errata 56.** Four bars of 3/4 at 76
in G major — a different metre from the town's 4/4, which is doc 28's whole
brief for him — ending on the third rather than the tonic, because "he does not
get to finish a thought in his own game". The LA-flavoured fiddle won an A/B
against the bowed one and is canon.

The LA voice is **a manner, not an emulation**: an MT-32 pairs a sampled attack
transient from its ROM with a synthesised sustain, and nothing here has those
ROMs. The transient is constructed. What is borrowed is the structure — one
filtered saw, and a resonant low-pass whose *cutoff* is the envelope, which is
what the ear reads as an instrument rather than an oscillator.

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
