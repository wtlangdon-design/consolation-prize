"""Room 1 — the hitching rail and the middle clutter. GRAYBOX.

Sixty-eight pixels of middle distance between the lit figure and the coach
team. Its job is TRANSPORT, NOT ARRIVAL: the eye is meant to leave Thad,
travel right along the rail, and land on the horses. Everything here is a
road surface for the eye and nothing in it is a destination.

THAT PRODUCES THE REGION'S WHOLE PROBLEM. These objects are neither lit nor
silhouetted. rail.md §1: the region's mean is 37, the crate's face averages
32.2, the backdrop to its left averages 34.1 and the backdrop above it
33.1. NOTHING SEPARATES BY VALUE MASS. Everything separates by ONE LIT PIXEL
ON TOP AND ONE BLACK PIXEL UNDERNEATH, and §1 is explicit that getting that
discipline right makes the region work at any brightness while getting it
wrong cannot be fixed by re-lighting.

BARS ARE ONE PIXEL OF LIGHT AND ONE PIXEL OF DARK. NO EXCEPTIONS (§6). The
top bar's highlight is row y=82 and nothing else; y=84 is its shadow. The
lower bar's highlight is row y=88 and y=89 is its shadow. The back fence's
rail is row y=82 alone with no shadow at all. If any of these becomes two
rows of light the region gains a horizontal stripe and loses a place.

POSTS ARE THREE COLUMNS: LIGHT, MID, DARK. And the dark column is doing as
much work as the light one — it is what holds the post off the pocket behind
it.

HORIZONTAL TIMBER IS COOL, VERTICAL TIMBER IS WARM (§5). A bar's top face
catches the sky; a post's left face catches the lantern. Measured
saturations: bar highlights 0.07-0.47, post highlights 0.61-0.62. §8.9 —
collapse the split and the region goes flat even at correct values. layout's
material table encodes it: `weathered_rail` and `rail_highlight` are cold,
`post_lit` and `post_mid` are warm, and `back_post_lit` is cold BECAUSE it
is far away.

THE NEAR POST CHANGES POLARITY AT THE BAR, and it is deliberate (§2.5).
Above the bar it is a dark silhouette against the pale distance; below it,
column x=127 is the brightest sustained mark in the region at mean L 70.6.
§8.10 — drawn uniformly bright it is a light stick poking into the sky;
drawn uniformly dark it loses the strongest vertical in the region.

THE BRIGHTNESS BUDGET IS A BUDGET, NOT A SUGGESTION (§3). Of 1,946 pixels in
the fence structure, 29 reach L>=70 and ELEVEN OF THOSE ARE ON ROW y=82 and
eleven are in column x=127 — two lines hold three-quarters of the region's
light. Seven pixels reach L>=80 and all seven are on row y=82. The lantern
peaks at 122.8; that forty-point gap is what keeps the fence a road for the
eye rather than a destination.

THE CRATE IS SEATED BY A BLACK LINE, NOT BY A SHADOW (§6). Its contact row
at y=80 drops to L 6.1 and the rail highlight two rows below runs at 77-81.5
across x 139-146. A seventy-five-point swing across two pixel rows is why a
thirteen-pixel box with no silhouette contrast reads as sitting on
something. DRAW THE BLACK ROW FIRST; the bright run under the crate exists
to serve it.

ONE COINCIDENCE TO PRESERVE (§4): the back fence's rail lands on the same
scanline as the near bar's highlight. One unbroken line of light at y=82
crosses the whole region — flat grey at L≈49 on the left, a warm three-row
bar peaking at 81.5 on the right. The eye reads a continuous rail; the value
tells it half of it is far away.

DEFERRED to the region author:
  - §2.12's four value zones along the top bar's highlight (78 / 58 / 77 /
    48). Three are blocked in here; the falloff to the right that keeps the
    eye moving toward the horses is approximate.
  - §6's stipple: unstructured ±1 ramp step, mean horizontal neighbour step
    2.8-4.3 L on man-made surfaces. None of it is drawn.
  - §2.8's bench read as four alternating rows at ten to fifteen points of
    separation — blocked as two rows here. §8.8: give the bench the rails'
    contrast and the region becomes a ladder with five equal horizontals.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: §2.12. The top bar's highlight row, in four measured zones:
#: (x from, x to, offset from `rail_highlight`). x 125-127 is the projecting
#: end cap at mean 78, x 128-138 flat at 58, x 139-146 the bright run under
#: the crate at 77, x 147-153 falling away to 48.
TOP_BAR_ZONES = ((125, 127, 0), (128, 138, -2), (139, 146, 0), (147, 153, -3))


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    # TWO TAGGED OBJECTS, not nine. Errata 32a asks whether the composition
    # has a row of things sharing a baseline with clear air between them, and
    # that is a question about objects a player would name. The near post,
    # the bars, the bench, the bucket and the crate are ONE hitching rail --
    # they interpenetrate and they stand or fall together. Tagging them
    # separately would report a fence as a row of five.
    with ctx.track(canvas, "back fence"):
        _back_fence(canvas, ctx)
    _dark_pocket(canvas, ctx)
    with ctx.track(canvas, "hitching rail"):
        _posts(canvas, ctx)
        _bench(canvas, ctx)
        _bucket(canvas, ctx)
        _bars(canvas, ctx)
        _crate(canvas, ctx)


def _back_fence(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.2-4. A cool, desaturated copy of nothing — a different structure.

    §8.4: the near post spans a 46-point range and the back post 19, and the
    back one is built out of `dust`, `dusk` and `grey` rather than warm
    families. Shrink the near post without dropping its contrast and
    desaturating it and it walks straight to the front of the picture.
    """
    # ONE PIXEL ROW, entering from the left edge and running to x=124
    # where the near post interrupts it. No shadow row, no body, no
    # highlight — one row of flat cool grey.
    canvas.hline(0, layout.BACK_FENCE_RAIL_Y, 125, ctx.ink("back_post_lit", 1))
    x0, y0, width, height = layout.BACK_FENCE_RAIL_2
    canvas.rect(x0, y0, width, height, ctx.ink("back_post_lit", -1))

    px, py, pwidth, pheight = layout.BACK_FENCE_POST
    canvas.vline(px, py, pheight, ctx.ink("back_post_lit"))
    canvas.vline(px + 1, py, pheight, ctx.ink("post_mid", -1))
    canvas.vline(px + 2, py, pheight, ctx.ink("post_dark"))
    canvas.hline(px, py, pwidth, ctx.ink("back_post_lit", 2))


def _dark_pocket(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.7 and §8.7. Not empty space — the element that makes both bars read.

    Mean L 28.4, darker than the hillside behind it (35.2) and far darker
    than the road in front (64.7). It looks like an unfinished area and
    invites filling in; lighten it and the fence dissolves into the backdrop.
    """
    x0, y0, width, height = layout.RAIL_DARK_POCKET
    canvas.rect(x0, y0, width, height, ctx.ink("dark_pocket"))
    ctx.shield_rect(x0, y0, width, height)


def _posts(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.5-6. Three columns each, and post centres at 12.5 and 25.5 px apart.

    §8.3: nothing here is on a grid. The three posts belong to two different
    structures at two different depths, and three posts evenly spaced reads
    as fence wallpaper.
    """
    x0, y0, _, height = layout.RAIL_NEAR_POST
    bar_y = layout.RAIL_TOP_BAR[1]
    # Above the bar: a dark silhouette against the pale distance, with a
    # lit LEFT edge only. Eight rows of post standing proud of the rail.
    canvas.vline(x0, y0, bar_y - y0, ctx.ink("post_mid"))
    canvas.rect(x0 + 1, y0, 3, bar_y - y0, ctx.ink("post_dark"))
    # Below it: the brightest sustained mark in the region.
    canvas.vline(x0, bar_y, height - (bar_y - y0), ctx.ink("post_dark", 1))
    canvas.vline(x0 + 1, bar_y, height - (bar_y - y0), ctx.ink("post_lit"))
    canvas.vline(x0 + 2, bar_y, height - (bar_y - y0), ctx.ink("post_mid"))
    canvas.vline(x0 + 3, bar_y, height - (bar_y - y0), ctx.ink("post_dark"))

    rx, ry, rwidth, rheight = layout.RAIL_RIGHT_POST
    # §2.6: two lit columns rather than one, then mid, then dark — and it
    # does NOT project above the rail; the bar cuts it off at y=84.
    canvas.vline(rx, ry, rheight, ctx.ink("post_lit", -1))
    canvas.vline(rx + 1, ry, rheight, ctx.ink("post_lit", -1))
    canvas.vline(rx + 2, ry, rheight, ctx.ink("post_mid"))
    canvas.vline(rx + 3, ry, rheight, ctx.ink("post_dark", -1))

    bx, by, bwidth, bheight = layout.RAIL_BRACKET
    # §2.10: four or five warm mid-tone pixels whose only job is to stop
    # the ground between the two fences being empty.
    canvas.rect(bx, by, bwidth, bheight - 3, ctx.ink("post_mid"))

    ctx.shield_rect(x0, y0, 4, height)
    ctx.shield_rect(rx, ry, 4, rheight)


def _bench(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.8. The bench's back and seat seen through the rail — texture, not
    structure, at ten to fifteen points of separation and no more."""
    x0, y0, width, height = layout.RAIL_BENCH
    canvas.rect(x0, y0, width, height, ctx.ink("dark_pocket", 2))
    canvas.hline(x0, y0, width, ctx.ink("weathered_rail", -3))
    canvas.hline(x0, y0 + 2, width, ctx.ink("weathered_rail", -3))
    canvas.hline(x0, y0 + 3, width, ctx.ink("dark_pocket", 1))


def _bucket(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.9. A pale cool rim, a warm lit left face, a dark right body.

    The same cool-horizontal / warm-vertical split as the rest of the region,
    inside one 13 × 8 object.
    """
    x0, y0, width, height = layout.RAIL_BUCKET
    canvas.rect(x0, y0, width, height, ctx.ink("dark_pocket", 2))
    canvas.rect(x0, y0 + 1, 6, height - 1, ctx.ink("post_mid"))
    canvas.hline(x0, y0, width, ctx.ink("back_post_lit"))
    ctx.shield_rect(x0, y0, width, height)


def _bars(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.11-12 and §8.1. The most likely failure in the region lives here.

    Drawn as a uniform two-pixel light bar the whole way across, the top bar
    breaks four things at once: it blows the brightness budget (seven pixels
    at L>=80, not fifty), it removes the falloff to the right that keeps the
    eye moving toward the horses, it destroys the bright run at x 139-146
    that seats the crate, and it converts a hitching rail into a graphic
    stripe.
    """
    lx, ly, lwidth, _ = layout.RAIL_LOWER_BAR
    canvas.hline(lx, ly, lwidth, ctx.ink("weathered_rail", -2))
    # The flattest run of value in the region, and the single most
    # consistent colour in it: `pine_weathered` 6, almost pure.
    canvas.hline(lx, ly + 1, lwidth, ctx.ink("weathered_rail"))
    canvas.hline(lx, ly + 2, lwidth, ctx.ink("rail_shadow"))

    tx, ty, twidth, _ = layout.RAIL_TOP_BAR
    # y=81 — the ambient top, present only from x≈139 rightward, where
    # two rows of the bar's top face come into view.
    canvas.hline(139, ty, tx + twidth - 139, ctx.ink("weathered_rail", -2))
    for left, right, offset in TOP_BAR_ZONES:
        canvas.hline(left, ty + 1, right - left + 1,
                     ctx.ink("rail_highlight", offset))
    canvas.hline(tx, ty + 2, twidth, ctx.ink("weathered_rail", -4))
    canvas.hline(tx, ty + 3, twidth, ctx.ink("rail_shadow", 1))
    # §7: the top bar DIES AT x≈154, swallowed by the horse's head. The lower
    # bar survives to x≈163 in the gap under the jaw and is handed to `team`.


def _crate(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.13 and §8.5-6. Ten by seven pixels of face carrying nothing legible.

    The composition brief shows a stencilled shipping mark. At 320×144 that
    resolves to six or eight darker pixels with no shape, and a legible mark
    here creates a second sign fighting the real signpost off the left edge —
    which is the one thing the player is supposed to read in this part of
    frame. Draw the scatter; do not draw the mark.
    """
    x0, y0, width, height = layout.RAIL_CRATE
    # THE BLACK ROW FIRST. Everything else in the object exists to serve it.
    canvas.hline(x0 + 2, y0 + height - 1, width - 1, ctx.ink("shadow_slot"))
    canvas.rect(x0, y0, width, height - 1, ctx.ink("dark_pocket", 3))
    canvas.hline(x0, y0 + 1, width, ctx.ink("weathered_rail", -3))
    canvas.vline(x0, y0, height - 1, ctx.ink("weathered_rail", -3))
    canvas.vline(x0 + width - 1, y0, height - 1, ctx.ink("weathered_rail", -4))
    # §2.13: a one-pixel inner shadow that is a DEAD-FLAT SINGLE VALUE
    # for all seven rows. `umber` 3, exclusively.
    canvas.vline(x0 + 1, y0 + 1, height - 2, ctx.ink("post_dark"))
    ctx.shield_rect(x0, y0, width, height)
