"""Room 1 — the mountain ranges behind Consolation. GRAYBOX.

TWO LAYERS AND ONE LIT FACE. Not four ranges, not six. range.md §7.1 is
blunt about why: the palette will not support a third. `accent_indigo[0]` is
the darkest blue in the locked 256 and there is nothing between it and
black, so a third range either duplicates the far range's index (invisible)
or jumps to neutral grey -- which IS the near range, so the depth order
inverts. Count the layers before drawing anything.

THE MECHANISM IS CHROMA, NOT VALUE. Blueness (B−R) runs 59 → 38 → 20 and
roughly halves at each step toward the viewer. Value drops 10, then 7, and
then goes back UP: the lit face at L 23.7 is 3.5 points brighter than the
far range and still unambiguously reads as nearer, because it is neutral
where the far range is blue. That inversion is the whole trick, and it is
why layout makes the near range EXPLICITLY grey[0] -- range.md §7.10 records
that a nearest-colour pass splits the near range 44/42 between grey[0] and
accent_indigo[0] and merges the two layers into one shapeless mass.

THE CREST IS SMOOTH, NOT JAGGED, BUT IT IS NOT RULED EITHER. A DFT of the
reference crest has nothing above 0.8 px amplitude at any wavelength shorter
than 36 px, and 63% of adjacent column pairs are dead flat -- so sawtooth
peaks at 4-8 px spacing, which are the default mental image of a pixel-art
mountain, degrade at 320×144 into what looks like dither noise. What the
measured polyline in layout carries is the long half of that spectrum and
nothing between 40 and 70 px, which left the near crest 86% flat with one
ruled run 61 columns long. `CREST_WANDER` puts the missing band back, added
in float and rounded exactly once, and the whole argument is written out
there because a previous pass tried it, produced a sawtooth by rounding
twice, and reverted.

THE BASE IS NOT A LINE. range.md §7.9: the near range is cut by the town
roofline at y≈51 on the left, runs down behind the town to y≈62 in the
centre, and is cut by the coach at y≈47 on the right. So this region fills
down to the town's own base row and lets `town`, `coach` and `left_yard`
cut it. Terminating the mass at a constant y turns the mountains into a
wallpaper strip.

THE LIT FACE IS A CONE THAT IS CUT, not a triangle. §2 layer 3's last
sentence is the whole of it: darker layer-2 ridges cross IN FRONT of the
base, entering from x≈138-147 on the left and x≈171 rightward. Drawn as the
leftover shape it is a lopsided hexagon; drawn as a cone with two nearer
ridges standing in front of it, it is the one place in the frame a viewer
sees three depths at once. See `_lit_face`.

§6 records that from x≈226 to x≈300 the coach hides the near range
completely. Nothing is shaped for that span and nothing should be.

THREE LIT THINGS, NOT ONE, AND THEY ARE ALL THE SAME LIGHT. §2 counts one
lit FACE and that count is right. But the bar has two smaller lit incidents
besides, both measured, both eight rows or fewer: the rim of a spur under the
left summit (`SPUR_APEX`) and the ground on the far side of the right-hand
crossing ridge (`BEYOND_TOP`). Every one of them is lit from up and to the
left, and without them the near range is a black wall with a stepped top edge
across two-thirds of the frame. They total about sixty pixels between them.

AND THE SLOPE BREAKS UP AS IT COMES FORWARD. §2 calls layer 2's body flat and
for the top of the mass it is: measured on the bar over the one clean column
band, the near range's standard deviation is 0.8 four rows under its own
crest. Seven rows under it, the same measurement is 4.6, and by seventeen the
median has climbed from 12.8 to 23.2. That is layout.DEPTH_LADDER's own two
near-range rows and the whole-frame study's monotonic texture-with-depth, and
without it the region ends as "sky steps once to the range colour and holds
flat for eighteen rows", which is what a blind critic called it. See `_scree`.

WHAT THIS REGION KNOWS IT IS SHORT OF, and cannot fix from inside this file:
  - The near range is grey[0] at L 16.0 and blueness 0 against a bar that
    measures L 13.2 and blueness +20. §4 chose grey[0] deliberately and §7.10
    explains why nothing else will do -- accent_indigo[0] is nearer in RGB
    and would merge layers 1 and 2 into one shapeless mass. The 20 points of
    lost blue are a palette fact on the frame's largest single mass, and it
    is the whole of this region's saturation shortfall: measured over the
    terrain below `layout.far_crest`, ours is 0.58 of the bar's mean chroma,
    and the far range on its own is within a tenth of it. There is no entry
    in the locked 256 at L 13 with blue in it -- `pine_green` 0 is the only
    dark with chroma and it is a third hue family in a frame the study
    measures as strictly bimodal, so it is refused rather than borrowed.
  - `layout.FAR_CREST` is a polyline and rules straight through wander the
    bar has: 78% of columns flat, one flat run 25 columns long. The near
    crest's version of that is fixed here; the far crest's cannot be,
    because `sky` cuts its own fill at the same line.
  - The lit face's two measured steps are 23.7 and 20.4, and the palette has
    grey 1 at 24.3 and then nothing until grey 0 at 16.0. The face is drawn
    at one value for the reason written out above `LIT_BRIGHT_SLOPE`.
  - `town`'s dark trough is drawn after this region and takes 28 pixels off
    the lit face's left flank at x 146-152, y 45-49, where the bar has the
    face's bright step.
"""

from __future__ import annotations

import math

from canvas import IndexedCanvas

from . import layout


#: THE CREST CADENCE, AND THE ONE WAY OF ADDING IT THAT DOES NOT SAWTOOTH.
#:
#: §2 gives the crest's spectrum -- 2.9 px at wavelength 320, 2.8 at 107, 1.9
#: at 160, 1.3 at 64, 1.0 at 53, nothing above 0.8 below 36 -- and the mean
#: |step| per column follows from it, since a sine of amplitude A and
#: wavelength L contributes 4A/L. Summing gives 0.35, which is §2's measured
#: 63%-flat / 34%-one-step cadence. `layout.NEAR_CREST` is a polyline through
#: measured summits and saddles, so it carries the long components and none of
#: the 40-70 px ones: 0.13 steps per column, 86% of columns dead flat, one
#: flat run 61 COLUMNS LONG. That run is a ruled line nineteen per cent of the
#: frame wide, and "a mechanically regular staircase" is what a blind critic
#: named here two rounds running.
#:
#: A PREVIOUS PASS ADDED THE MISSING COMPONENTS AND REVERTED, and its reason
#: was right about the symptom and wrong about the cause. It added a
#: continuous offset to `layout.near_crest`, which has ALREADY ROUNDED to a
#: row -- so where offset and polyline disagreed by about half a pixel the sum
#: alternated, and x 156-172 came out as 43/42/43/42 one-pixel teeth. A 2 px
#: sawtooth, in front of the lit face, which is the exact failure §7.4 spends
#: a paragraph on. That is a double-rounding artifact, not a fact about
#: sinusoids: quantising twice on the way to one integer is what makes a teeth
#: pattern out of a smooth curve.
#:
#: So the crest is built ONCE, in float, and rounded ONCE at the end --
#: `layout.NEAR_CREST` interpolated without rounding, the wander added to it,
#: `round()` applied to the sum and to nothing before it. Rounding a shallow
#: line is itself what produces the measured cadence: a step, a flat run of
#: about two, a step. Nothing is added below wavelength 40, because §7.4 is
#: emphatic that sawtooth peaks at 4-8 px spacing degrade into dither noise at
#: 320x144 and drag the eye up to a horizon this shot wants ignored.
#:
#: The wander is also TAPERED TO ZERO across the cone (`CONE_CREST_SPAN`),
#: because the cone's outline is measured column by column off the bar and a
#: synthetic wobble on top of a measurement is strictly worse than the
#: measurement.
#:
#: THE FAR CREST IS NOT OURS AND CANNOT BE DONE THIS WAY. `sky` cuts its own
#: fill at `layout.far_crest(x)` and this region fills from the same row down,
#: so a range-side wobble tears that seam open. It has the same defect --
#: 78% flat, one flat run 25 columns long -- and fixing it means moving
#: `layout.FAR_CREST`, which is two regions' business. Reported, not reached
#: for.
NEAR_CREST_MIN = layout.NEAR_RANGE_CREST_HIGH
NEAR_CREST_LOW = layout.NEAR_RANGE_CREST_LOW

#: (wavelength px, amplitude px, phase turns). The three components the
#: polyline is missing, taken off §2's spectrum: 64 px at 1.3, 53 px at 1.0,
#: and one at 41 px held under §2's 0.8 ceiling for anything shorter than 36.
#: Amplitudes are trimmed a little from the far range's measured figures
#: because §2 measures the NEAR crest as the smoother of the two -- mean step
#: 0.27 px per column against the far range's 0.35, max step 3.
#:
#: Phases are irrational multiples of each other so the three never re-align
#: inside 320 px and the eye cannot find the period. They are not a fit to the
#: bar and are not claimed to be: §2 measures the crest's amplitude spectrum
#: and says nothing about its phase, so what is reproduced here is the
#: cadence, not the mountain.
#: Measured on the drawn line: 77% of adjacent columns flat, 22% stepping
#: one, 1% stepping two, none more; mean step 0.24 px per column against §2's
#: 0.27; longest flat run 19 columns, down from 61; and ZERO single-column
#: teeth, which is the artifact the previous attempt produced and the reason
#: the rounding happens exactly once.
CREST_WANDER = ((67.0, 1.80, 0.19), (53.0, 1.40, 0.63), (43.0, 1.00, 0.31))


#: WHERE THE CONE STANDS, THE CONE IS THE CREST. The lit face is not painted
#: onto a hillside that was already there -- it IS the near range's summit in
#: the middle of the frame, so its outline and the top of the dark mass are
#: the same line. `layout.NEAR_CREST` puts control points at (145,44) and
#: (157,42) and rules straight between them, which cuts the corner off the
#: cone: the bar's near crest across x 140-148 is y=47, three rows lower, and
#: those three rows are the far range that the apex is supposed to stand
#: against. Drawn layout's way the cone has dark mass wrapped around its
#: shoulders and stops reading as a cone at all -- the recession in the middle
#: of the frame, which §2 calls the only place a viewer sees three depths at
#: once, goes with it.
#:
#: Inverting the flanks gives the crest directly: y = 42 + (157 − x)/2.2 to
#: the left of the apex and y = 42 + (x − 158)/3.2 to the right. Against the
#: bar, column by column across x 140-174, that is within one row nearly
#: everywhere where the polyline is out by three.
#:
#: The cap is the crossing ridges. Past the cone's own base the ridges §2 says
#: cross in front of it take over, and their crests measure y=47 on both
#: sides -- so the cone's outline governs only until it falls below them.
CONE_CREST_SPAN = (138, 174)
CONE_CREST_CAP = 47


def _cone_top(x: int) -> float:
    """The row the lit cone's outline reaches in column x. Inverse of §2's flanks."""
    apex_x, apex_y = LIT_APEX
    if x <= apex_x:
        return apex_y + (apex_x - x) / LIT_LEFT_SLOPE
    return apex_y + (x - apex_x - 1) / LIT_RIGHT_SLOPE


def _polyline(points: tuple[tuple[int, int], ...], x: float) -> float:
    """layout's piecewise-linear crest, WITHOUT the rounding.

    `layout._crest` rounds to a row because that is what its callers want.
    This region needs the un-rounded line so the wander can be added before
    the single rounding rather than after it -- see CREST_WANDER.
    """
    x = max(0.0, min(layout.WIDTH - 1.0, x))
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return y0 + (y1 - y0) * t
    return float(points[-1][1])


def _wander(x: int) -> float:
    """The 40-70 px content the measured polyline does not carry. Float."""
    lo, hi = CONE_CREST_SPAN
    if lo - 4 <= x <= hi + 4:
        # Tapered out over four columns each side, so the cone's measured
        # outline is joined rather than stepped into.
        if x < lo:
            weight = (lo - x) / 4.0
        elif x > hi:
            weight = (x - hi) / 4.0
        else:
            weight = 0.0
    else:
        weight = 1.0
    total = 0.0
    for length, amplitude, phase in CREST_WANDER:
        total += amplitude * math.sin(math.tau * (x / length + phase))
    return total * weight


def near_crest(x: int) -> int:
    """Top of the near range's mass, in this region's own drawing order."""
    y = _polyline(layout.NEAR_CREST, x) + _wander(x)
    y = round(max(float(NEAR_CREST_MIN), min(float(NEAR_CREST_LOW), y)))
    lo, hi = CONE_CREST_SPAN
    if lo <= x <= hi:
        y = max(y, min(round(_cone_top(x)), CONE_CREST_CAP))
    # THE GAP IS THE ENTIRE DEPTH CUE and §2 measures it at 1 px at its
    # narrowest, never 0. A column where the near crest reaches the far crest
    # is a column with no far range in it at all, and the two layers touch
    # the sky in the same place -- the one thing this region exists to avoid.
    return max(y, layout.far_crest(x) + 1)


#: range.md §2 layer 3. Apex two pixels wide, widening ~2 px per row each
#: side to a base spanning x≈146-172 by y≈49. Its apex sits 8 rows below the
#: far range's central summit at (155, 34) and 2 px right of it -- a nearer,
#: lower, brighter cone tucked under a farther, taller, darker one, and that
#: offset is what sells the recession in the middle of the frame.
LIT_APEX = (157, 42)

#: The cone's flanks, measured off the bar row by row and fitted. The apex is
#: two pixels (x 157-158); the left edge runs 157 / 155 / 153 / 149 / 146 and
#: the right 158 / 161 / 163 / 166 / 169 / 173 down y=42..46. So the cone is
#: NOT symmetric -- it leans right, which is what makes it read as a face
#: turned toward the sky rather than a pyramid.
LIT_LEFT_SLOPE = 2.2
LIT_RIGHT_SLOPE = 3.2

#: The cone would keep widening to x 137-178 by y=52 if nothing stopped it.
#: What stops it is §2 layer 3's last sentence: darker layer-2 ridges cross IN
#: FRONT of the base, entering from x≈138-147 on the left and x≈171 onward on
#: the right. Their crest lines, as (x, y) pairs measured where the face's own
#: edge stops following the cone and starts following the cut:
#:
#:   left  (140, 46) -> (152, 50)   dark below and left of this line
#:   right (174, 46) -> (167, 50)   dark right of it
#:
#: Those two cuts are the only reason a viewer reads three depths here rather
#: than a lit triangle sitting on a dark slab.
LIT_CUT_LEFT = ((140, 46), (152, 50))
LIT_CUT_RIGHT = ((174, 46), (167, 50))

#: Where the face stops being a face. Below this it is entirely eaten by the
#: two crossing ridges anyway.
LIT_BASE_Y = 52

#: The bright step's own right edge, and the row it stops at. THE BRIGHT STEP
#: IS THE UPPER-LEFT OF THE CONE, NOT ITS TOP THREE ROWS. §2 layer 3 says so
#: in one sentence -- "the upper-left of the triangle takes the bright step;
#: the right flank takes a mid step one notch down" -- and the bar agrees
#: column by column. Classifying the face on the bar at L>=22 gives a bright
#: region whose right edge runs
#:
#:     y   42   43   44   45   46   47
#:     x  158  161  163  163  162  161
#:
#: and which stops at y=47: below that the whole face is the mid step. It
#: opens fast for two rows against the cone's own right flank, holds at 163,
#: and then walks back one pixel a row as the face turns away. Left of it the
#: bright step runs all the way out to the cone's left edge.
#:
#: WHAT CHANGED, AND IT IS THE LARGEST SINGLE ERROR THIS REGION HAD. The two
#: steps were drawn one ramp notch too high each -- bright as `near_rock_lit`
#: (grey 2, L 32.3) and mid as `near_rock_lit_mid` (grey 1, L 24.3). Sampled
#: over the cone's own footprint the bar gives 263 px running min 11.7, mean
#: 19.4, MAX 27.6, with quintiles 15.4 / 20.4 / 20.4 / 23.7 and exactly ONE
#: pixel at or above 24. So the reference's brightest face pixel is 23.7 and
#: the mass around it is 12: the face is a soft L-20 cone, and grey 2 at 32.3
#: is eight and a half luminance ABOVE anything the bar has anywhere in this
#: region except the left spur. Rendered, sixty-four pixels of it read as a
#: glowing lens in the middle of the frame -- the one thing on the near range
#: that pulls the eye, in the region whose whole brief is "nothing up here
#: should attract the eye".
#:
#: So both steps come down one notch. The bright step is `near_rock_lit_mid`
#: (grey 1, L 24.3) against a measured 23.7 -- within half a luminance point,
#: the closest the locked palette comes to anything in this region. The mid
#: step at a measured 20.4 has NO entry: grey 0 is 16.0 and grey 1 is 24.3,
#: and the two nearest colours in the whole locked 256 -- accent_indigo 0 at
#: L 21.0, blueness +29 against the measured +23 -- are the far range's own
#: index, which §7.10 spends a paragraph forbidding here. Painting the right
#: flank in it would put a patch of far-range colour inside the near range
#: two rows under the far range's own band, and the cone would read as a hole
#: through the near mass rather than as a summit in front of it.
#:
#: The mid step therefore MERGES INTO THE BRIGHT STEP rather than into the
#: mass, which is the choice that keeps the shape. Bright-versus-mid is 3.3 L
#: on the bar -- under one palette step at this end of the ramp, and below
#: what the eye resolves at these luminances -- while face-versus-mass is 8,
#: which is exactly what grey 1 over grey 0 gives us (8.3). We keep the gap
#: that carries the form and give up the gap that does not.
#:
#: The constants below are kept, and the classification with them, because
#: they are a measurement of the bar and the next author will want them
#: whether or not this pass can spend them.
LIT_BRIGHT_SLOPE = 2.5
LIT_BRIGHT_RIGHT = 163
LIT_BRIGHT_HOLD_ROW = 45
LIT_BRIGHT_LAST_ROW = 47

#: THE SECOND LIT PLANE, on the left summit. §2 says the near range's body is
#: flat "with one exception", and read as a count of triangular faces that is
#: right: there is one lit FACE. But the bar has a second, much smaller lit
#: thing on the near range's highest summit (x≈27, y=35) and it is not noise.
#: Sampled off the bar, luminance against a near-range body of L 11.7:
#:
#:     y=34  x30 23.7  x31 23.7
#:     y=35  x30 30.3  x31 30.3  x32 28.9
#:     y=36  x31 27.6  x32 27.6  x33 26.4  x34 23.7
#:     y=37  x31 33.4                      x34 23.9
#:     y=38  x31 23.9  x32 23.7
#:     y=39            x32 23.7  x33 23.7
#:     y=40  x30 23.7            x33 19.2  x34 20.4
#:
#: Eight contiguous rows, a two-pixel band, walking down and right at half a
#: pixel a row, with its dark right flank beside it at L 11.7-12.9 the whole
#: way. That is the SAME MOTIF as the central cone at a fifth the size: a
#: nearer spur standing in front of the summit, apex up, lit on its upper-left,
#: dark on the flank that turns away. Same light, same read, and drawing it
#: costs 12 pixels.
#:
#: It is here because the left third had no light information in it at all --
#: the near range's biggest summit was a flat black wedge with a stepped edge,
#: which is the failure a blind critic named across this whole region. A
#: one-to-two-pixel rim IS the form at 320x144; there is no room for anything
#: bigger and nothing bigger is wanted.
SPUR_APEX = (30, 34)
SPUR_SLOPE = 0.5
SPUR_WIDTH = 2
SPUR_LAST_ROW = 41
#: L 27.6-33.4 on the bar against the central face's brightest 23.7 -- the
#: spur's core is the brightest terrain anywhere in the region. Three rows.
SPUR_BRIGHT_ROWS = (35, 36, 37)

#: THE GROUND BEYOND THE RIGHT-HAND CUT. §2 layer 3 says a darker layer-2
#: ridge crosses in front of the face's base "from x≈171 onward", and
#: `LIT_CUT_RIGHT` draws that ridge's near edge. What the sentence leaves out
#: is that the ridge is a ridge and not a wall: past its dark crest the ground
#: comes back up into the same light. Classified on the bar at rows 44-51 the
#: band right of the cut runs
#:
#:     y   44   45   46   47   48   49   50   51
#:     x  178  175  176  175  174  172  171  169   left
#:        182  182  182  179  181  180  178  173   right
#:
#: at L 16-21 against a near-range body of 11.8-12.9 -- a six-pixel mid-step
#: band walking down and LEFT, with the dark notch of the crossing ridge
#: between it and the face. Without it the whole right half of the massif is
#: one unbroken grey[0] wall from the face's edge to the coach, which is the
#: single flattest thing left in the region. Mid step only: nothing out here
#: reaches the bright step on the bar.
BEYOND_TOP = 44
BEYOND_BASE = 51
BEYOND_LEFT_X, BEYOND_LEFT_SLOPE = 178, 1.3
BEYOND_RIGHT_X, BEYOND_RIGHT_SLOPE, BEYOND_RIGHT_HOLD = 182, 1.4, 46

#: The near range's mass continues down behind the town to about here. The
#: town and the coach cut it; nothing is drawn below it by this region.
MASS_BASE = layout.TOWN_BASE_Y


# ---------------------------------------------------------------------------
# THE SLOPE BREAKS UP AS IT COMES DOWN, AND THAT IS MEASURED
# ---------------------------------------------------------------------------
#
# §2 says layer 2's body is "flat, same as layer 1, with one exception", and
# for the top of the mass that is exactly right. It is not right for the
# bottom of it, and the difference is the eighteen dead rows a blind critic
# named -- "sky steps once to the range colour and holds flat for eighteen
# rows".
#
# Measured on the bar over x 182-215, the one column band with no town, no
# coach and no team in it, as a function of ROWS BELOW THAT COLUMN'S OWN NEAR
# CREST (median luminance, then the standard deviation across the band):
#
#     +0   13.5  sd 3.3      +9   15.4  sd 2.7      +17  23.2  sd 4.1
#     +2   12.8  sd 2.5     +11   15.4  sd 3.6      +18  23.4  sd 4.2
#     +4   12.8  sd 0.8     +13   18.3  sd 3.9      +19  23.9  sd 4.5
#     +6   12.8  sd 1.4     +14   19.9  sd 4.5      +20  23.7  sd 4.4
#     +7   12.8  sd 4.6     +16   19.2  sd 6.0      +21  27.8  sd 4.6
#
# Two things happen at once and both are in layout.DEPTH_LADDER already:
# "near range +11 -> L 16.23, sd 4.11" and "near range base +17 -> L 21.75,
# sd 5.86". The mass is DARKEST AND FLATTEST at its crest -- sd 0.8 at +4 --
# and then breaks up and lifts as it comes forward, which is the same
# monotonic texture-with-depth the whole-frame study §6 measures across every
# plane in the frame: "local sd by plane runs 0.37 -> 2.43 -> 4.11 -> 5.86 ->
# 4.28 -> 6.08 -> 7.33 from far to near, monotonic with distance. Texture
# density in this frame is a DEPTH CUE." §6 puts the ranges band at median
# local sd 7.29 and 12.3% flat; ours was 100% flat.
#
# WHAT THE TEXTURE IS MADE OF. The bar's p90 at +7 is 23.7 against a median of
# 12.8 -- so the variation is not a small wobble on many pixels, it is a large
# step on a few. `grey` 1 at L 24.3 over `grey` 0 at 16.0 is that step, and it
# is the same pair the lit face is drawn from, because it is the same light on
# the same rock. Nothing new enters the palette.
#
# WHY IT IS CLUSTERED AND NOT A MATRIX. §5 measures zero dithering in this
# region and §7.6 is explicit that a dithered crest reads as a rendering fault
# at 320x144 and introduces the pseudo-motion texture invariant 9 exists to
# keep out of backgrounds. A Bayer field would do exactly that. This is
# clusters instead -- short horizontal runs of two to four pixels, the shape
# scree makes on a slope and the shape the bar's own rows make ("+", "**",
# "++") -- placed from a named, stable stream. The study says the same thing
# from the other end: the reference's noise is broadband and unstructured,
# phase score 0.10-0.20 where a Bayer matrix scores over 0.5, so what is
# reproduced is the AMPLITUDE per plane and not the pattern.
#
# AND THE TOP OF THE MASS STAYS CLEAN. Nothing is placed within SCREE_FLAT_TOP
# rows of the crest, so the silhouette is 1-bit against the far range for its
# whole length. A crest with speckle under it is the failure this is trying to
# avoid, not a milder version of it.

#: Rows below the local near crest that stay dead flat. The bar's sd is 0.8 to
#: 3.3 across +0 to +6 and jumps to 4.6 at +7.
SCREE_FLAT_TOP = 7
#: Rows below the crest at which the break-up reaches full density.
SCREE_FULL_AT = 14
#: Share of pixels taking the mid step at full density. The bar's median
#: crosses 19.2 -- half way between grey 0 and grey 1 -- at +14 to +16 and
#: reaches 23.7 by +19, so at the bottom of the visible slope rather more than
#: half of it is lit. Held at 0.44 rather than 0.5 because our grey 0 is
#: already 3 L above the bar's body and the plane must not out-run the town
#: lights immediately below it.
SCREE_DENSITY = 0.85
#: Share at the FIRST row that is allowed any. The bar does not ease into this
#: -- sd goes 1.4 at +6 to 4.6 at +7 in one row, with p90 jumping 16.2 to 23.7
#: while the median does not move at all. That is a slope that has started to
#: break up, not a slope that is getting lighter, and a density ramping from
#: zero draws the first one instead of the second: the break-up did not appear
#: until eight rows further down, and the crest sat on top of an unrelieved
#: ten-row plate.
SCREE_MIN_DENSITY = 0.20
#: Cluster length, in pixels. Runs, not points.
SCREE_RUN = (2, 4)
#: AND THE PATCHES ARE PATCHY. A run-and-gap generator with one density per
#: row lays an even stipple across all 320 columns, which is a texture with a
#: constant grain -- and constant grain is exactly what reads as an applied
#: effect rather than as ground. The bar does not do that: read along its rows
#: at x 176-215 and it goes twenty columns of unbroken dark, then six columns
#: of "++**++", then dark again. Two slow multipliers over x, at wavelengths
#: far longer than a cluster, put the clusters where the slope faces the light
#: and leave the stretches between them alone. (wavelength px, depth, phase).
SCREE_PATCH = ((97.0, 0.55, 0.21), (43.0, 0.30, 0.68))
#: WHERE IT STOPS, and this is a contract with `terrain`. That module opens
#: its band at y=68 and its docstring names the seam explicitly: "`range`
#: fills its near mass at `near_rock`, L 16.0, down to its own base at y=67".
#: It has already fitted its easing to a flat grey 0 arriving at row 67, so
#: the scree fades back out over SCREE_FADE rows and the last rows of the mass
#: are the flat value terrain is expecting. Lifting them is a better picture
#: and a worse seam, and the seam is not this region's to move.
#:
#: THE SEAM HAS NOW BEEN MOVED, BY THE INTEGRATOR, AND THIS IS WHY. Three
#: regions independently reported the same rect and all three correctly
#: declined to touch it: `town` ("range paints x 139-179 / y 52-67 in
#: near_rock, grey 0, L 16, where the locked-palette proof has L 21.7-27.9;
#: town.md §2.1 assigns that hill to the range region so I have not touched
#: it"), `team` ("the sky/town band immediately above the mass runs 5-11 L
#: dark against the bar for the full width of my rect"), and this file's own
#: note above. It is the definition of a seam: every region is right about
#: its own rect and the picture is wrong between them.
#:
#: MEASURED, over the range-owned pixels of rows 61-67: ours 16.0-18.1
#: against the bar's 22.8-25.3 and the proof's 22.7-27.0 -- a flat unbroken
#: slab of one index, 470 px wide, which is the darkest thing in the upper
#: half of the frame and reads as a hole punched out beside the town. The
#: mass now breaks up all the way to its base, which is what §2's own depth
#: table asks for ("+17 23.2, +19 23.9, +21 27.8" against a crest of 12.8),
#: and `terrain.FOOT_L` has been re-fitted to the value it now arrives at
#: rather than to the flat grey 0 it used to. The two constants are a pair
#: and neither is meaningful without the other; see terrain.FOOT_L.
SCREE_LAST_ROW = MASS_BASE - 1
SCREE_FADE = 0


#: Rows below the local near crest at which the mass's body goes cold. See
#: layout.MATERIALS["near_rock_base"] for the measurement and for why the
#: crest is untouched. Twelve because the bar holds 15.9-16.9 at +8 to +11 --
#: which grey 0 matches to half a luminance -- and steps to 22.3 at +12.
BASE_DEPTH = 12


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    far = ctx.ink("far_rock")
    near = ctx.ink("near_rock")
    base = ctx.ink("near_rock_base")

    for x in range(layout.WIDTH):
        crest = layout.far_crest(x)
        below = near_crest(x)
        # Layer 1: one flat colour, edge to edge, unbroken. range.md §2 --
        # 855 sampled body pixels give 22 nominal values all within +/-2 of
        # each other. There is no gradient down the mass, no ridge shading,
        # no cast shadow, no texture. Adding any fills a 7-px band with 1-px
        # value noise that competes with the town lights immediately below.
        for y in range(crest, min(below, layout.HEIGHT)):
            canvas.put(x, y, far)
        # Layer 2. The gap between the two crests averages 6.7 px and widens
        # from about 4 on the left to about 10 on the right. THAT GAP IS THE
        # ENTIRE DEPTH CUE; both crests are in layout so nobody can move one
        # without the other noticing.
        #
        # ...AND THE BODY GOES COLD AT BASE_DEPTH. The contour runs parallel
        # to the crest rather than horizontally, because it is the same slope
        # seen further down and the crest is the only line in this region
        # that is allowed to be a shape.
        for y in range(below, min(MASS_BASE, layout.HEIGHT)):
            canvas.put(x, y, near if y - below < BASE_DEPTH else base)

    _scree(canvas, ctx)
    _lit_face(canvas, ctx)
    _beyond_the_cut(canvas, ctx)
    _left_spur(canvas, ctx)


def _scree_density(x: int, y: int) -> float:
    """How much of this row's slope is lit, 0 at the crest and rising forward.

    Linear in rows-below-crest from SCREE_FLAT_TOP to SCREE_FULL_AT, then held,
    then faded back to nothing over the last rows before `terrain`'s seam.
    """
    depth = y - near_crest(x)
    if depth < SCREE_FLAT_TOP or y > SCREE_LAST_ROW:
        return 0.0
    walk = min(1.0, (depth - SCREE_FLAT_TOP) / float(SCREE_FULL_AT - SCREE_FLAT_TOP))
    density = SCREE_MIN_DENSITY + (SCREE_DENSITY - SCREE_MIN_DENSITY) * walk
    fade = SCREE_LAST_ROW - y
    if fade < SCREE_FADE:
        density *= (fade + 1) / float(SCREE_FADE + 1)
    for length, depth_, phase in SCREE_PATCH:
        density *= 1.0 - depth_ * (0.5 + 0.5 * math.sin(math.tau * (x / length + phase)))
    return density


def _scree(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The near range's slope breaking up as it comes forward. See above.

    Drawn BEFORE the face, the beyond band and the spur, so that the three
    measured lit shapes are laid over it rather than eaten by it: they are
    modelling and this is material, and material never overwrites modelling.
    """
    mid = ctx.ink("near_rock_lit_mid")
    rng = ctx.stream("range-scree")
    low, high = SCREE_RUN
    for y in range(min(MASS_BASE, SCREE_LAST_ROW + 1)):
        if y < NEAR_CREST_MIN + SCREE_FLAT_TOP:
            continue
        x = 0
        while x < layout.WIDTH:
            run = rng.randint(low, high)
            if rng.random() < _scree_density(x, y):
                for step in range(run):
                    column = x + step
                    if column >= layout.WIDTH:
                        break
                    if y - near_crest(column) < SCREE_FLAT_TOP:
                        continue
                    canvas.put(column, y, mid)
            # A gap of its own, so the runs never tile edge to edge into a
            # solid row. Two to five: at 320 px that is 60-odd incidents in a
            # row at full density, which is scree rather than a stripe.
            x += run + rng.randint(2, 5)


def _beyond_the_cut(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The lit ground on the far side of the right-hand crossing ridge.

    A band, not a face: it has one value the whole way down. It exists to put
    the crossing ridge's dark crest BETWEEN two lit surfaces, which is the
    only way a 3-px-wide dark notch reads as a ridge in front of something
    rather than as a scratch.
    """
    mid = ctx.ink("near_rock_lit_mid")
    for y in range(BEYOND_TOP, BEYOND_BASE + 1):
        left = round(BEYOND_LEFT_X - BEYOND_LEFT_SLOPE * (y - BEYOND_TOP))
        right = round(BEYOND_RIGHT_X
                      - BEYOND_RIGHT_SLOPE * max(0, y - BEYOND_RIGHT_HOLD))
        for x in range(left, right + 1):
            if y < near_crest(x) or y >= MASS_BASE:
                continue
            canvas.put(x, y, mid)


def _left_spur(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The lit edge of the small spur under the left summit. See SPUR_APEX.

    Two pixels wide, walking down-right at half a pixel a row, bright for
    three rows at the top and the mid step below. It is only ever drawn where
    the near range's mass already is: the spur is modelling ON layer 2, and
    if `layout.near_crest` says there is no mass at a row then there is
    nothing here to be lit.
    """
    bright = ctx.ink("near_rock_lit")
    mid = ctx.ink("near_rock_lit_mid")
    apex_x, apex_y = SPUR_APEX

    for y in range(apex_y, SPUR_LAST_ROW + 1):
        left = round(apex_x + SPUR_SLOPE * (y - apex_y))
        ink = bright if y in SPUR_BRIGHT_ROWS else mid
        for x in range(left, left + SPUR_WIDTH):
            if y < near_crest(x) or y >= MASS_BASE:
                continue
            canvas.put(x, y, ink)


def _line_x(pair: tuple[tuple[int, int], tuple[int, int]], y: int) -> float:
    """x of a crest line at row y. Two measured points, extended both ways."""
    (x0, y0), (x1, y1) = pair
    return x0 + (x1 - x0) * (y - y0) / (y1 - y0)


def _lit_face(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The one place in the region with more than one value inside a mass.

    Two values, hard-edged between them: the upper-left takes the bright
    step, the right flank a mid step one notch down. Nothing else in the
    region gets internal modelling.

    The face is built as a cone and then CUT, rather than drawn as the shape
    that is left over. That order matters: the leftover shape is a lopsided
    hexagon nobody would draw on purpose, and it only makes sense as a cone
    with two nearer ridges standing in front of it -- which is what it is,
    and which is why it reads as depth instead of as a blotch.
    """
    face = ctx.ink("near_rock_lit_mid")
    apex_x, apex_y = LIT_APEX

    for y in range(apex_y, LIT_BASE_Y + 1):
        drop = y - apex_y
        left = round(apex_x - LIT_LEFT_SLOPE * drop)
        right = round(apex_x + 1 + LIT_RIGHT_SLOPE * drop)
        # The two ridges in front. They bind from y=46 down and leave the
        # cone's own flanks alone above that, which is why the face reads as
        # wide at the shoulders and pinched at the foot.
        left = max(left, round(_line_x(LIT_CUT_LEFT, y)))
        right = min(right, round(_line_x(LIT_CUT_RIGHT, y)))
        for x in range(left, right + 1):
            # Never above the near crest: the face is modelling ON layer 2,
            # not a shape floating in front of layer 1.
            if y < near_crest(x):
                continue
            canvas.put(x, y, face)
