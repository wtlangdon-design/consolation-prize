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

WHAT THIS REGION KNOWS IT IS SHORT OF, and cannot fix from inside this file:
  - The near range is grey[0] at L 16.0 and blueness 0 against a bar that
    measures L 13.2 and blueness +20. §4 chose grey[0] deliberately and §7.10
    explains why nothing else will do -- accent_indigo[0] is nearer in RGB
    and would merge layers 1 and 2 into one shapeless mass. The 20 points of
    lost blue are a palette fact on the frame's largest single mass.
  - `town`'s dark trough is drawn after this region and takes 28 pixels off
    the lit face's left flank at x 146-152, y 45-49, where the bar has the
    face's bright step.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


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
LIT_LEFT_SLOPE = 2.4
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

#: The bright step's own right edge, and the row it stops at. Measured, the
#: brightest pixels form a lens whose right edge runs 158 / 161 / 163 / 163 /
#: 162 / 161 down y=42..47 -- it opens fast for two rows and then holds. The
#: mid step is everything outboard of it.
#:
#: THE BRIGHT STEP IS SMALL ON PURPOSE. §4 measures the reference's bright
#: step at L 23.7 and records that the locked palette's `grey[2]` -- the entry
#: the spec assigns it -- sits at L 32.3, 8.6 points hot, and that the proof
#: quantiser only chose it for 11% of the face, "apex pixels only". Painting
#: the whole upper-left of the cone at grey[2] puts a 70-pixel L-32 patch into
#: a band whose neighbours are L 16-21, and the one failure the whole-frame
#: study calls most likely and hardest to see is exactly this: the median
#: creeps up and the night reads as dusk. So the bright step gets the top
#: THREE rows -- 20 px, the 11% the proof agreed on -- and the mid step gets
#: the rest, which lands the face's MEAN on the reference's mean rather than
#: on the reference's brightest pixel. Rendered at 44, 47 and 52 and looked
#: at against the bar: 44 is the only one that stays as quiet as the target.
LIT_BRIGHT_SLOPE = 2.5
LIT_BRIGHT_RIGHT = 163
LIT_BRIGHT_LAST_ROW = 44

#: The near range's mass continues down behind the town to about here. The
#: town and the coach cut it; nothing is drawn below it by this region.
MASS_BASE = layout.TOWN_BASE_Y


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    far = ctx.ink("far_rock")
    near = ctx.ink("near_rock")

    for x in range(layout.WIDTH):
        crest = layout.far_crest(x)
        below = layout.near_crest(x)
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
        bright_edge = min(LIT_BRIGHT_RIGHT,
                          round(apex_x + 1 + LIT_BRIGHT_SLOPE * drop))
        for x in range(left, right + 1):
            # Never above the near crest: the face is modelling ON layer 2,
            # not a shape floating in front of layer 1.
            if y < layout.near_crest(x):
                continue
            lit = y <= LIT_BRIGHT_LAST_ROW and x <= bright_edge
            canvas.put(x, y, bright if lit else mid)
