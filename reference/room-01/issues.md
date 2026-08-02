# Room 1 — the finite issue list

The loops are done. Doc 34's stop condition applies: no more rounds. What the
blind critics named and nobody fixed is written down here instead, at the
priority it actually has, which is **P3 refinement against a project that does
not have Act I**.

Each entry is what a fresh critic said, in its own words where they were exact,
plus what is known about why it survived. None of them blocks anything.

---

## P3-1 · The coach reads as a building, not a suspended box

*"Beta has no undercarriage, so the coach reads as a building. The near wheel
has no hub, its spokes are scattered brown pixels that do not converge, and its
lower-right rim arc is a literal 50% checkerboard that dissolves instead of a
rim; above it the body never ends — the panels run straight down past y53 and
merge into the road with no bottom edge."*

The fix the critic named, which is specific enough to act on without reopening
anything: terminate the body in a hard 1px moonlit bottom rail across x30–88 at
y52, open a 4–6px band of visible ground and cast shadow beneath it, run a solid
axle and perch bar across to the far wheel, and rebuild the near wheel as an
unbroken 1px rim ring with 10–12 spokes converging on a 3px lit hub.

**Why it survived.** The coach spec's own measurement says the reference's front
wheel is *not* a wheel — eight to ten lit pixels in one quadrant plus a one-pixel
shadow column, no rim and no spokes — and every round the author correctly
refused to close it into a disc. The undercarriage is a different question that
the wheel ruling kept absorbing. The rear wheel's lower-left arc also loses
itself into road of the same value, and fixing that properly means either a rim
value the spec caps or a contact darkening on the road, which is another
region's finished work.

## P3-2 · The near horse's head blurs against the sky

*"Alpha's near horse has no head: an undifferentiated dark blur with blue
sky-dither scattered on top of it. Redraw it as a closed hard-edged silhouette
against the sky — a 2px dark mane running the neck crest, a distinct ear notch
at the poll, a wedge muzzle with a lit top plane and a dark underjaw, one eye
pixel — and delete every blue pixel that falls inside the animal's contour."*

**Why it survived.** The first brief said "no internal form" and the author
reasonably read it as being about the bodies, and spent a round modelling
barrels and haunches. The correction — that at this scale a head reads by
SILHOUETTE and not by shading — arrived one round later, and the round after it
went to the sky. The general rule it produced is worth more than the fix:
**at 320×144 most objects read by silhouette before they read by shading, so
where a critic says something lacks form, check first whether the outline is
wrong. Adding interior detail to a wrong shape makes it worse.**

## P3-3 · The town reads as lights rather than buildings

Named by five separate blind critics across five rounds, in nearly the same
words each time: *windows with no host geometry*.

**Why it survived, and this is the useful part.** Every number said it was fine.
Mean luminance within 1.4 of the bar, saturation *lower*, roughness lower, warm
pixel count lower, per-row warm distribution within a few pixels, run anisotropy
nearer isotropic. Errata 42 came out of it — the distribution was bimodal and no
summary statistic holds a shape.

And then the shape metric itself turned out to have no floor under it: our
render scores 0.445 on that rect against the re-quantised bar's 0.505, so we are
already past the best the locked palette can do at that picture. Two rounds of
town work were spent partly chasing a number that could not be reached.

**So the town's remaining defect is a placement judgement and nothing else can
see it.** `room01_farfield.py` says in its own docstring that it is blind to
where a value sits. For this region that blindness is the whole story, and the
next attempt should be judged by eye against the bar and not by any number in
this repository.

---

## Not on this list, deliberately

**Anything the palette cannot reach.** Errata 47 records the two: the sky's
bucket 2, where the only cold entry in that luminance window carries no chroma
at all, and the near range, which wants luminance 13 with blue in it when the
locked 256 has no such entry. Neither is a drawing error and neither should be
re-litigated.

**The lantern being brighter than the bar's.** The reserved cycling band runs
L 136–204 against the bar's 123 ceiling, because the band has to be brighter
than everything for the flame to cycle at all. A blind critic will name it every
round for ever. It is the correct trade and it is spec.

**The signboard being blank.** It is blank on purpose, a check enforces it, and
a critic asked for lettering in four separate rounds. See errata 48.
