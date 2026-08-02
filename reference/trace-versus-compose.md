# Should we trace the quantised bar instead of composing?

Asked after Room 1's loops closed, with the remaining gaps identified as object
detail rather than composition or tone. Answered with measurements, not
preference. **Short version: yes, mostly — and the reason it works is not the
reason it looks like it works.**

---

## 1 · What tracing costs

**The image itself is free.** The bar re-quantised into the locked palette uses
54 indices and has zero unmapped pixels. It is already a legal 320×144
on-palette picture. Nothing has to be redrawn to make it one.

**But it is not a legal ASSET, and this is the finding.** Two measurements, both
about the palette entries that carry runtime meaning:

| reserved band | what it is for | what the quantised bar contains |
|---|---|---|
| `accent_gold` 225–228 | Hob's lantern flame, cycled at 0.6 Hz | **0 pixels** |
| `accent_indigo` 239–241 | the road puddles, cycled at 0.25 Hz | 486 px, bbox **(15, 8) – (318, 143)** |

The flame band is **empty**, so the engine would rotate four palette entries that
nothing paints and the lantern would be dead. The puddle band is present but
scattered across the whole frame, including the sky at y=8 — so the sky would
shimmer at 0.25 Hz along with the water.

A quantiser optimises colour distance. It knows nothing about which entries mean
*this pixel animates*, and it will scatter them wherever they happen to be the
nearest colour.

**This is a chore, not a blocker.** Roughly 500 pixels to re-point and 25 to
paint into the flame — an hour a room. But it is invisible, it is silent, and
nothing about the picture looks wrong when it is missed. **It must be a check
before it is a workflow**, and it generalises to every traced room.

## 2 · Separability, and the thing a trace cannot contain

A traced image contains only what is **visible**. That is the whole difficulty
and it is bigger than the cutting.

Room 1's coach layer is **5,959 px**, bbox x 153–305, y 43–108. Cutting the coach
out of a traced image is easy. But the coach *departs*, and the moment it does
the engine needs the hillside, the road and the fence that were behind it — and
a trace has no information there at all. That 5,959 px would have to be
invented, by hand, matching a picture nobody drew.

The current pipeline gets it free: `compose(with_coach=False)` draws what is
behind the coach because the code knows it is there, and the coach layer is the
**difference between two composes** — exact, automatic, and correctly lit,
because both passes ran the same lighting.

The same applies to the 96 px foreground plane, which draws *over* the actor and
therefore cannot travel in the background at all.

**But the objection dissolves if the generator can produce the companion.** Ask
the source for *the same scene with no coach*, quantise that too, and the coach
layer is again a difference between two images — the current technique exactly,
with the generator in place of the composer. That is the version of tracing that
works, and it should be the rule rather than an optimisation:

> **Every removable object needs a companion generation of the scene without it.
> A separable layer is a difference between two images, never a cut with a hole
> behind it.**

Objects needing this in Room 1: the coach and team (they leave together), Hob and
his lantern with its ground pool, the driver on the box, the man at the door.

## 3 · What we lose

**Parameterisation, and less of it than it first appears.** Room 36's dawn comes
free from re-running the composer with a different ramp; the ambient GIF comes
from `compose(swing=…, graze=…)`; the coach-departed background and the
foreground plane are both derived. All of that is real and all of it is lost.

But the observation that the generator has *already* produced the dawn variant
is the strongest part of the case, and it generalises: **if the source can
generate the variants, parameterisation moves out of our composer and into the
source.** It does not disappear, it relocates — and it relocates to something
that draws better than we do.

**What does not relocate is editability.** A composed room can be told to move
the sign four pixels left. A traced room cannot: it needs a new generation, a new
quantisation, and a new hand-correction pass, and the generator will not
reproduce the rest of the frame identically. For a game where 45 puzzles need
hotspots aligned to art, that is a real constraint and it will be felt during
puzzle work rather than during art work.

**And the audits stay useful either way.** `room01_seams.py`, the reserved-band
checks, the foreign-family test, `check-stable-seeds`, the legibility and void
audits — none of them care how a picture was made. They stop being construction
tools and become acceptance tools, which is a better job for them.

## 4 · Does it remove the metric problem?

**Yes, and this is the strongest argument by a distance.**

Four rounds went into arguing with instruments: a flatness test measured against
a control it could never match; a saturation test that rewarded chroma in the
wrong hue and produced a green sky; a mean hue-axis fix that scored the same
with the defect present and absent; a shape metric with no floor under it, which
reported failure while the drawing was already past the best the palette can do.
Each was corrected and each correction was itself a finding — errata 41, 42, 46,
47 all came out of that — but the cost was rounds.

Every one of those instruments exists to answer *is this close enough to the
reference*. If the source **is** the reference, the question is a pixel diff and
the answer is exact. There is nothing to calibrate and no threshold to argue
with.

---

## The honest verdict

**Trace, with three conditions**, for every room that has a generated reference:

1. **Reserved cycling bands are hand-corrected and checked.** The flame band is
   empty and the puddle band is in the sky. This is invisible, silent, and
   fatal to two of the room's three animations.
2. **Every removable object gets a companion generation.** A separable layer is
   a difference between two images. Cutting a hole and inventing what is behind
   it is the one part of this that is genuinely harder than composing.
3. **Accept that traced rooms are not editable.** Decide composition and hotspot
   geometry before tracing, because afterwards the answer to "move that four
   pixels" is a new generation.

**Keep the composer** for what it is actually good at, which is not what it was
being used for: the audits, the two-image differencing that makes separable
layers exact, and any room with no generated reference.

**And the thing I would say plainly.** The four rounds of instrument-arguing were
not wasted — they produced four errata rulings that will outlive Room 1 — but
they were spent proving that a procedural reconstruction had converged on a
target we already possessed. The gaps you identified at 1× are all *objects with
less drawn inside them*, and that is precisely the failure mode of
reconstruction: it converges on tone and composition first, because those are
global and measurable, and runs out of budget on the interiors, which are local
and are the actual craft.

Tracing starts where reconstruction ran out.
