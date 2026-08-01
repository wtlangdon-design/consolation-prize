"""Room 1 — the mid-ground, between the town's foot and the road. GRAYBOX.

The band nobody wrote a spec for, because it is not an object: it is the
valley floor and the near bank the whole lower half of the picture stands
on. Its numbers come from the whole-frame study rather than from a region
brief, and they are the two rows of the depth ladder between the near
range's base and the road:

    near range base   +17 rows below crest   L 21.75   sat 0.56   sd 5.86
    valley floor      +24                    L 24.60   sat 0.48   sd 4.28
    mid ground        +34                    L 28.92   sat 0.54   sd 6.08
    road              --                     L 37.39   sat 0.42   sd 7.33

Read down the value column: this band is where the U turns. Value has
finished falling at the near range ridge and is climbing forward again, and
it climbs GENTLY -- 21.75 to 28.92 across twenty-five rows, about one and a
half mud steps. Study §5 is explicit that below the valley floor the gaps
collapse to one step or less and separation switches to OVERLAP: the fence
over the valley floor, the horse team over the fence, the coach over the
horses, the timber over everything on the left. Anything that tries to
separate these planes by value instead runs out of range and the foreground
goes chalky.

WHERE THE WARM BOUNDARY CROSSES IT. Study §3 measures the warm/cold line per
column and it is a GROUND LINE, not a horizontal: median y=58, dipping to
y=71 at x=96 where cold valley floor pushes down, riding high on the left
and right. So this band straddles it, and the straddle is drawn rather than
averaged -- cold `grey` above layout's WARM_BOUNDARY, warm `mud` below it.
That matters more than it looks: the lantern pool's outermost contour
reaches y=94, and the lighting pass cannot change hue. A cold pixel there
can never be warmed.

WHERE IT STOPS. Nominally layout.MIDGROUND_ROWS, y 69-93. In practice `road`
lays its own value field from a few rows above the seam and its rut fan from
higher still, because road.md §8 requires the ground plane and the fan to be
continuous across y=94 -- "if the road is drawn as a self-contained band, the
seam at y = 94 will show as a step in both the value gradient and the rut
spacing." So the bottom rows of this band are painted twice, on purpose, and
the second coat wins.

DEFERRED to whoever takes this band:
  - study §6 measures the mid-ground at 0.0% flat -- the busiest plane in
    the frame after the road. This is a flat graded fill and it is the one
    place in the composition where "no texture" is a real departure rather
    than a simplification.
  - the scrub, stones and clumps that carry that texture are not drawn.
  - the dark pocket under the hitching rail (rail.md §2.7, mean L 28.4,
    darker than the hillside behind it) belongs to `rail` and is drawn there.

THE BAND IS COLD, AND THAT IS THE INTEGRATION FIX OF THIS ROUND. It was
authored warm below layout.WARM_BOUNDARY, which put warm `mud` under
essentially the whole band, and four region authors independently reported
the same failure from four different rects: the backdrop behind the team,
behind the rail, behind Hob and behind the coach composited as flat warm
brown at the same value AND the same hue as the thing standing on it.

WARM_BOUNDARY IS NOT A MASK, and layout says so in the line that declares
it. Study §3 measured it as "the first row below which the next ten rows are
at least 60% warm" -- a statistic over a band that contains the timber (warm
up into the sky), the coach (warm to its roofline), the fence, the crate,
the horses and the top of the road. Those objects are what make the band 60%
warm. The GROUND they stand on is cold, and measured on the bar's open
ground it is not close:

    x 105-135, rows 70-81   L 29-40   warmth -19 to -20
    x 196-233, rows 56-74   L 13-29   warmth -21 to 0
    x 300-319, rows 44-70   L 12-21   warmth -20 to -39

against this module's own previous output of warmth +16 to +29 on every row
it owned. Study §5 is the reason it matters more than a hue error usually
would: below the valley floor the value gaps collapse to one step or less
and separation switches to hue and overlap. A warm ground at matched value
takes the hue channel away from every object in the lower half of the frame
at the moment it becomes the only channel left.

So the warm side of the ground line is drawn by `road`, which repaints this
band's bottom rows from a few rows above the seam anyway (see WHERE IT STOPS
below) -- and the hue seam lands where road's own coat begins, which is what
study §3's ground line is.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from dither import BAYER4

from . import layout


#: The two ends of the band. The top is study §5's valley floor,
#: ridge-relative, at L 24.6. The bottom is the mid-ground plane easing into
#: the road: study §5's ladder runs valley floor 24.60 -> mid ground 28.92 ->
#: road 37.39, and the bar's open mid-ground at x 105-135 measures a median
#: of about 33 across rows 70-87.
#:
#: IT USED TO END AT 44.0 -- road.md §4.1's model at the road's own top row
#: less one step -- which chased seam continuity into a band the reference
#: measures at 24-38, and did it in the warm family, so the seam it was
#: smoothing was a seam that should be there. The ground line is a hue
#: boundary with a value step of about +8 across it (§5's ladder), not a
#: gradient that has to be levelled.
TOP_L = 24.6
BOTTOM_L = 33.0

#: How much of the plane is the blue entry rather than the neutral one.
#: `grey` carries warmth -4 and `accent_indigo` -29 to -41, so an even mix
#: lands at -16 to -22 against a measured -19 to -20. Ordered, phase-offset
#: from the value dither below so the two do not lock into one pattern.
BLUE_DENSITY = 0.5

#: THE GROUND LINE, as a handover rather than an edge. Study §3's boundary is
#: the frame's principal structural line and it is a HUE boundary, but it is
#: not a step: measured across x 100-260 the bar's warmth runs -10 to +5
#: through rows 70-85, +10 to +15 by rows 88-93, and +10 to +21 in the road
#: below -- it turns over about eight rows. Handing a cold plane straight to
#: `road`'s warm one at y=94 put a +16-warmth jump into a single row across
#: 160 px, which is a line in the picture where the reference has none.
#:
#: So the last rows dissolve into the road's own family instead of meeting
#: it. Most of this span is overdrawn by `road` and by what stands on it --
#: this band keeps only 15-29 px a row down here -- but those leftovers are
#: exactly the pixels seen right beside the seam.
GROUND_LINE_FROM = 84

#: The blue entry paired with each `grey` step, at MATCHED VALUE. Explicit
#: rather than palette.nearest_in_family, because nearest-in-family for
#: grey 3 is accent_indigo 2 -- the first entry of the puddles' reserved
#: cycling band -- and it would be clamped back out silently by
#: cycling.reserve() after the picture had already been composed around it.
#:
#:   grey 1  L 24.3  <-  accent_indigo 0  L 21.0   (3.3 apart)
#:   grey 2  L 32.3  <-  accent_indigo 1  L 33.8   (1.5 apart)
#:   grey 3  L 40.4  <-  accent_indigo 1  L 33.8   (6.6 apart)
BLUE_FOR_GREY = {0: 0, 1: 0, 2: 1, 3: 1, 4: 1}


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    top, bottom = layout.MIDGROUND_ROWS
    grey = ctx.ramp("valley_floor")
    blue = ctx.ramp("valley_floor_blue")
    warm = ctx.ramp("wet_mud")
    palette = ctx.palette

    # Row 68 is drawn as well as rows 69-93, and only outside the town's own
    # horizontal extent. THAT ROW WAS A HOLE: `town` ends its moonlit foot
    # band at y=68 but only across its own rect, `range` stops at the same
    # row, and this band began at 69 -- so 49 px of row 68 out past the
    # town, mostly x 180-215, were never written by any region at all and
    # shipped as the canvas's initial fill. A hole that is one row tall and
    # the colour of the void reads as a hard black rule across the valley,
    # and it is invisible to every region author because it is nobody's row.
    # ...and the skip yields to a hole. `town` leaves one pixel of its own
    # rect unpainted at (81, 68), and one pixel of index 0 in the middle of a
    # lit valley is exactly the kind of thing that survives every check and
    # is visible at 1x. The town has no `void` material anywhere in its
    # table, so index 0 inside its rect on this row cannot be anything it
    # meant.
    town_x, _, town_w, _ = layout.TOWN_MASS
    hole = ctx.palette.family("void").at(0)

    # Precompute the row's grey position once, so the fill is a lookup.
    span = {}
    warm_span = {}
    warm_share = {}
    for y in range(layout.TOWN_BASE_Y, bottom):
        walk = (y - top) / max(1, bottom - 1 - top)
        target = TOP_L + (BOTTOM_L - TOP_L) * max(0.0, walk)
        span[y] = _span(palette, grey, target)
        warm_span[y] = _span(palette, warm, target)
        warm_share[y] = max(0.0, min(1.0, (y - GROUND_LINE_FROM)
                                     / float(bottom - GROUND_LINE_FROM)))

    for y in range(layout.TOWN_BASE_Y, bottom):
        low, high, blend = span[y]
        wlow, whigh, wblend = warm_span[y]
        share = warm_share[y]
        for x in range(layout.WIDTH):
            if (y < top and town_x <= x < town_x + town_w
                    and canvas.get(x, y) != hole):
                continue
            # The ground line first, on its own dither phase, so the three
            # families never lock into one pattern.
            if share > 0.0 and BAYER4.threshold(x, y + 2) < share:
                canvas.put(x, y, warm.at(whigh if wblend > BAYER4.threshold(x, y)
                                         else wlow))
                continue
            step = high if blend > BAYER4.threshold(x, y) else low
            if BAYER4.threshold(x + 2, y) < BLUE_DENSITY:
                canvas.put(x, y, blue.at(BLUE_FOR_GREY.get(step, 1)))
            else:
                canvas.put(x, y, grey.at(step))


def _span(palette, ramp, target: float) -> tuple[int, int, float]:
    """The two ramp steps a target luminance falls between, plus the blend.

    Chasing the target rather than picking a step by eye, because this band's
    whole job is to land between two measured numbers seven luminance points
    apart. Picking by eye at 8× zoom is how a night becomes a dusk. The
    fraction is carried rather than rounded away so that twenty-five rows of
    an eight-luminance ramp do not come out as two flat plates.
    """
    steps = sorted(range(ramp.count), key=lambda s: palette.luminance(ramp.at(s)))
    below, above = steps[0], steps[-1]
    for step in steps:
        if palette.luminance(ramp.at(step)) <= target:
            below = step
        if palette.luminance(ramp.at(step)) >= target:
            above = step
            break
    low_l = palette.luminance(ramp.at(below))
    high_l = palette.luminance(ramp.at(above))
    blend = 0.0 if high_l <= low_l else (target - low_l) / (high_l - low_l)
    return below, above, blend
