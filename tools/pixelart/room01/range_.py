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

THE CREST IS SMOOTH, NOT JAGGED, and layout's `far_crest`/`near_crest` are
where that lives: piecewise-linear through measured summits and saddles,
rounded to a row. Rounding a shallow line produces the measured cadence by
itself -- a step, then a flat run of about two, then a step. No noise is
added and none is wanted: a DFT of the reference crest has nothing above
0.8 px amplitude at any wavelength shorter than 36 px, and 63% of adjacent
column pairs are dead flat. Sawtooth peaks at 4-8 px spacing are the default
mental image of a pixel-art mountain and at 320×144 they degrade into what
looks like dither noise.

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
lit FACE and that count is right -- the central cone is the only triangular
plane with two values inside it. But the bar has two smaller lit incidents
besides, both measured, both eight rows or fewer, both mid-step: the rim of
a spur under the left summit (`SPUR_APEX`) and the ground on the far side of
the right-hand crossing ridge (`BEYOND_TOP`). Every one of them is lit from
up and to the left, and the whole point of drawing them is that without them
the near range is a black wall with a stepped top edge across two-thirds of
the frame. They total about sixty pixels between them.

WHAT THIS REGION KNOWS IT IS SHORT OF, and cannot fix from inside this file:
  - The near range is grey[0] at L 16.0 and blueness 0 against a bar that
    measures L 13.2 and blueness +20. §4 chose grey[0] deliberately and §7.10
    explains why nothing else will do -- accent_indigo[0] is nearer in RGB
    and would merge layers 1 and 2 into one shapeless mass. The 20 points of
    lost blue are a palette fact on the frame's largest single mass, and it
    is why the mass reads as a hole rather than as a dark hill.
  - `layout.NEAR_CREST` and `layout.FAR_CREST` are polylines and rule
    straight through wander the bar has. See the note above `near_crest`.
  - `town`'s dark trough is drawn after this region and takes 28 pixels off
    the lit face's left flank at x 146-152, y 45-49, where the bar has the
    face's bright step.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: THE CREST CADENCE IS LAYOUT'S AND IT IS LEFT ALONE. Recorded here because
#: it was tried and reverted, and the next author will have the same idea.
#:
#: §2 gives the crest's spectrum -- 2.9 px at wavelength 320, 2.8 at 107, 1.9
#: at 160, 1.3 at 64, 1.0 at 53, nothing above 0.8 below 36 -- and the mean
#: |step| per column follows from it, since a sine of amplitude A and
#: wavelength L contributes 4A/L. Summing gives 0.35, which is §2's measured
#: 63%-flat / 34%-one-step cadence. `layout.NEAR_CREST` is a polyline through
#: measured summits and saddles, so it carries the long components and none of
#: the 53-64 px ones: 0.12 steps per column, 88% of columns dead flat, one
#: flat run 61 columns long. A ruled line, and "a dead-straight roofline" is
#: what a blind critic named here.
#:
#: Adding the missing components back as sinusoids DOES fix the statistic --
#: flat 0.88 -> 0.79, worst run 61 -> 18 -- and it makes the picture worse.
#: Measured against the bar's own near crest over every column the foreground
#: does not hide, mean absolute error goes 1.14 -> 1.17 px, because a
#: synthetic wobble has the right amplitude and the wrong phase. Worse, adding
#: a continuous offset to an ALREADY-ROUNDED polyline double-rounds: where the
#: two disagree by about half a pixel the sum alternates, and x 156-172 came
#: out as 43/42/43/42 one-pixel teeth -- a 2 px sawtooth, in front of the lit
#: face, which is the exact failure §7.4 spends a paragraph on.
#:
#: The cadence is real and it is missing, but it is missing FROM THE MEASURED
#: LINE, and the fix is control points in `layout.NEAR_CREST` at the places
#: the bar wanders and the polyline rules straight through. Those columns are
#: reported rather than reached for. The far crest is doubly not ours: `sky`
#: cuts its own fill at `layout.far_crest(x)` and this region fills from the
#: same row down, so any range-side wobble would tear that seam open.
NEAR_CREST_MIN = layout.NEAR_RANGE_CREST_HIGH
NEAR_CREST_LOW = layout.NEAR_RANGE_CREST_LOW


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


def near_crest(x: int) -> int:
    """Top of the near range's mass, in this region's own drawing order."""
    y = max(NEAR_CREST_MIN, min(NEAR_CREST_LOW, layout.near_crest(x)))
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
#: That is 64 pixels of bright against 85 of mid -- the counts measured on
#: the bar. An earlier pass here capped the bright step at three rows (20 px)
#: out of a fear that a grey[2] patch at L 32.3 would lift the frame median
#: and turn the night into dusk. Sixty-four pixels is 0.14% of the frame and
#: moves the median by nothing; what it does move is whether the near range
#: has any lit form at all. It did not, and the flat dead mass that resulted
#: was the one thing a blind critic named in this region.
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


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    far = ctx.ink("far_rock")
    near = ctx.ink("near_rock")

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
        for y in range(below, min(MASS_BASE, layout.HEIGHT)):
            canvas.put(x, y, near)

    _lit_face(canvas, ctx)
    _beyond_the_cut(canvas, ctx)
    _left_spur(canvas, ctx)


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
    bright = ctx.ink("near_rock_lit")
    mid = ctx.ink("near_rock_lit_mid")
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
        # The bright step opens along its own slope, holds at 163, then walks
        # back a pixel a row from y=45 as the face turns away from the light.
        bright_edge = min(LIT_BRIGHT_RIGHT - max(0, y - LIT_BRIGHT_HOLD_ROW),
                          round(apex_x + 1 + LIT_BRIGHT_SLOPE * drop))
        for x in range(left, right + 1):
            # Never above the near crest: the face is modelling ON layer 2,
            # not a shape floating in front of layer 1.
            if y < near_crest(x):
                continue
            lit = y <= LIT_BRIGHT_LAST_ROW and x <= bright_edge
            canvas.put(x, y, bright if lit else mid)
