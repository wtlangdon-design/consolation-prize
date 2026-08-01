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
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: The two ends of the band, and they come from different documents on
#: purpose. The top is study §5's valley floor, ridge-relative, at L 24.6.
#: The bottom is where `road` starts: road.md §4.1's depth model evaluated at
#: the road's own top row, L(94) = 48.0, less one ramp step of headroom so
#: the seam is a step of about four luminance rather than nineteen.
#:
#: THAT RAMP IS STEEPER THAN THE STUDY'S BAND TABLE SUGGESTS, and the
#: discrepancy is worth recording. Study §1 gives the mid-ground band (rows
#: 80-99) a median of 25.8 — LOWER than the valley floor above it — while
#: road.md's model puts the open ground at 48 by y=94. Both are right: the
#: band median is measured through the fence, the crate, three horses, the
#: figure and the coach, all of which are darker than the ground they stand
#: on, and its p90 of 48.1 is the ground showing between them. A rebuild
#: that authors the GROUND at 25.8 has confused a band with a plane.
TOP_L = 24.6
BOTTOM_L = 44.0


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    top, bottom = layout.MIDGROUND_ROWS
    warm_ramp = ctx.ramp("dry_mud")
    cold_ramp = ctx.ramp("verge_mud")
    palette = ctx.palette

    # Precompute the nearest step of each family for every row's target
    # value, so the fill is a lookup rather than a search per pixel.
    warm_step = {}
    cold_step = {}
    for y in range(top, bottom):
        walk = (y - top) / max(1, bottom - 1 - top)
        target = TOP_L + (BOTTOM_L - TOP_L) * walk
        warm_step[y] = _nearest(palette, warm_ramp, target)
        cold_step[y] = _nearest(palette, cold_ramp, target)

    for y in range(top, bottom):
        warm = warm_ramp.at(warm_step[y])
        cold = cold_ramp.at(cold_step[y])
        for x in range(layout.WIDTH):
            canvas.put(x, y, warm if y >= _warm_boundary(x) else cold)


def _warm_boundary(x: int) -> int:
    """Study §3's per-column boundary, interpolated. A sanity check, not a mask.

    layout carries the measured control points; this is the only place in the
    composition that reads them as a line rather than as a warning.
    """
    points = layout.WARM_BOUNDARY
    if x <= points[0][0]:
        return points[0][1]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return int(round(y0 + (y1 - y0) * t))
    return points[-1][1]


def _nearest(palette, ramp, target: float) -> int:
    """The step of `ramp` closest in luminance to a target value.

    Chasing the target rather than picking a step by eye, because this band's
    whole job is to land between two measured numbers seven luminance points
    apart. Picking by eye at 8× zoom is how a night becomes a dusk.
    """
    best, gap = 0, None
    for step in range(ramp.count):
        distance = abs(palette.luminance(ramp.at(step)) - target)
        if gap is None or distance < gap:
            best, gap = step, distance
    return best
