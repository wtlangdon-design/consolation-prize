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

DEFERRED to the region author:
  - the lit face is blocked as a plain two-value triangle. range.md §2
    layer 3 wants darker layer-2 ridges crossing IN FRONT of its base,
    entering from x≈138-147 on the left and x≈171 rightward, which is what
    cuts the triangle off at the bottom and is the only place a viewer can
    see three depths at once.
  - §6 records that from x≈226 to x≈300 the coach hides the near range
    completely. Nothing is shaped for that span here and nothing should be.
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
LIT_BASE_Y = 49

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


def _lit_face(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The one place in the region with more than one value inside a mass.

    Two values, hard-edged between them: the upper-left takes the bright
    step, the right flank a mid step one notch down. Nothing else in the
    region gets internal modelling.
    """
    bright = ctx.ink("near_rock_lit")
    mid = ctx.ink("near_rock_lit_mid")
    apex_x, apex_y = LIT_APEX

    for y in range(apex_y, LIT_BASE_Y + 1):
        spread = (y - apex_y) * 2
        left, right = apex_x - spread - 1, apex_x + spread + 1
        for x in range(left, right + 1):
            if y < layout.near_crest(x):
                continue
            # The split runs down the cone's own axis rather than across the
            # frame: this is a facet turned to the sky, not a hillside lit
            # from one side.
            canvas.put(x, y, bright if x <= apex_x else mid)
