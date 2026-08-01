"""Room 1 — the hitching rail and the middle clutter.

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
collapse the split and the region goes flat even at correct values.

THE NEAR POST CHANGES POLARITY AT THE BAR, and it is deliberate (§2.5).
Above the bar it is a dark silhouette against the pale distance; below it,
column x=127 is the brightest sustained mark in the region at mean L 70.6.
§8.10 — drawn uniformly bright it is a light stick poking into the sky;
drawn uniformly dark it loses the strongest vertical in the region.

THE BRIGHTNESS BUDGET IS A BUDGET, NOT A SUGGESTION (§3). Seven pixels in
this region reach L>=80 and ALL SEVEN ARE ON ROW y=82 — x 125, 127 and
139-143. `_top_bar` spends exactly those seven and there is an assertion at
the bottom of this file that counts them, because a budget nobody counts is
a budget that has already been spent twice.

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

DRAW ORDER, and the three places it is load-bearing rather than obvious:

    back fence -> pocket -> bench -> bracket -> bucket ->
    lower bar -> top bar -> near post -> right post -> crate

  1. THE POCKET GOES DOWN BEFORE ANYTHING SITS IN IT (§2.7). It is not empty
     space; it is the element both bright bars are read against.
  2. THE LOWER BAR GOES UNDER THE POSTS AND THE TOP BAR GOES OVER THEM. Both
     are measured: at row 88 the near post's own three columns interrupt the
     bar (72 / 44 / 23 against the bar's flat 58), while at row 82 the bar
     runs straight over the post at 70-82. A rail is nailed to the FRONT of
     its posts and rests in a notch at the top; the reference draws both.
  3. THE RIGHT POST STARTS AT y=84, not at its nominal top. §2.6 — it does
     not project above the rail, the bar cuts it off, and rows 81-83 there
     belong to the bar's own falling zone.

TEXTURE IS STIPPLE, NOT DITHER (§6, §8.11). Checkerboard bias across every
sub-area of this region measures 0.02-0.09, i.e. none. `_grain` is an
unstructured ±1 ramp step keyed on the pixel's own coordinates, so it is
stable across processes and independent of draw order — and there is no
Bayer matrix anywhere in this file.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout

# ---------------------------------------------------------------------------
# The region's inks
# ---------------------------------------------------------------------------
#
# Name -> (palette family, ramp step), in the shape layout.MATERIALS uses,
# with the measured luminance each one stands in for. The nine entries the
# shared table already names are asserted against it at import; the rest are
# sub-materials only this region has an opinion about, and they are here
# rather than in `layout` because no neighbour needs them.
#
# §5 IS THE WHOLE MATERIAL LOGIC AND IT IS TWO SENTENCES: horizontal timber
# is cool, vertical timber is warm. Bar tops sit at saturation 0.07-0.47 in
# `dust` / `pine_weathered` / `grey`; post faces sit at 0.61-0.62 in
# `pine_fresh`. The far fence drops out of the warm families altogether --
# that is aerial perspective done by hue, and it is why the back fence sits
# behind rather than merely appearing smaller.

INKS: dict[str, tuple[str, int]] = {
    # -- back fence. COOL FAMILIES ONLY (§5, §8.4). Its post spans 19
    #    luminance points against the near post's 46; shrink the near post
    #    without dropping its contrast and it walks to the front.
    "back_rail": ("grey", 4),               # L 53; flattest, coolest timber
    "back_rail_2": ("dust", 2),             # L 41; meant to be almost invisible
    "back_post_lit": ("dust", 3),           # L 46; layout `back_post_lit`
    "back_post_cap": ("dusk", 1),  # step 1, not 0: ruling 21b -- the moonlit cap on the back post
                                            # is not a shadow, but a pale family on its
                                            # own floor reads as one to the audit           # L 50; y 79-81 only
    "back_post_mid": ("pine_fresh", 1),     # L 37
    "back_post_dark": ("pine_weathered", 0),  # L 21

    # -- near post, above the bar. A DARK SILHOUETTE against the pale
    #    distance: lit left edge, then a genuinely dark column.
    "near_top_lit": ("pine_fresh", 3),      # L 54; x=126, measured 38-58
    "near_top_mid": ("pine_fresh", 1),      # L 37; x=127
    "near_top_dark": ("umber", 2),          # L 18; x=128, measured 14-23

    # -- near post, below the bar. The brightest sustained mark in the region.
    "post_lit": ("pine_fresh", 5),          # L 70; layout `post_lit`, sat 0.62
    "post_mid": ("pine_fresh", 2),          # L 44; layout `post_mid`
    "post_dark": ("umber", 3),              # L 25; layout `post_dark`

    # -- right post. One to two steps below the near post, and FOUR columns:
    #    two lit, then mid, then dark (§2.6).
    "right_lit": ("pine_fresh", 3),         # L 54; x 152-153 measure 55.0/57.3
    "right_mid": ("umber", 5),              # L 35; x=154
    "right_dark": ("mud", 1),               # L 18; x=155

    # -- the bars. Near-neutral on top, warm-dark underneath.
    "bar_hot": ("dust", 8),                 # L 82; layout `rail_highlight`
    "bar_warm": ("umber", 10),              # L 69; the second value on row 82
    "bar_flat": ("pine_weathered", 6),      # L 59; layout `weathered_rail`
    "bar_face": ("mud", 7),                 # L 49; front face, left half
    "bar_face_far": ("mud", 5),             # L 39; front face, right half
    "bar_face_end": ("mud", 3),             # L 27; the last few pixels
    "bar_shadow": ("mud", 1),               # L 18; layout `rail_shadow`

    # -- the pocket and the boarding in it. ONE NARROW FAMILY, NO CONTRAST
    #    (§5). §8.8 — give the bench the rails' contrast and the region
    #    becomes a ladder with five equal horizontals and no hierarchy.
    "pocket": ("umber", 3),                 # L 25; measured floor 17-31
    "pocket_deep": ("umber", 2),            # L 18
    "pocket_foot": ("umber", 4),            # L 29; the ground coming under
    "bench_light": ("umber", 5),            # L 35; rows 90 and 92
    "bench_dark": ("umber", 3),             # L 25; row 91
    "bench_deep": ("mud", 2),               # L 23; rows 93-94
    "bracket": ("mud", 8),                  # L 55; a short brace off the post
    "bracket_lit": ("mud", 11),             # L 73; four pixels of it

    # -- bucket. The same cool-horizontal / warm-vertical split as the rest
    #    of the region, inside one 13 x 8 object.
    "bucket_rim": ("dusk", 1),  # step 1, not 0: ruling 21b -- the bucket rim
                                            # is not a shadow, but a pale family on its
                                            # own floor reads as one to the audit              # L 50; cool, like the bars
    "bucket_rim_far": ("grey", 3),          # L 41
    "bucket_lit": ("mud", 7),               # L 49; warm, like the posts
    "bucket_face": ("mud", 4),              # L 35
    "bucket_body": ("umber", 3),            # L 25
    "bucket_body_deep": ("grey", 0),        # L 16
    "bucket_foot": ("umber", 4),            # L 29

    # -- crate. Twelve indices inside ten by seven pixels, almost all of them
    #    within +/-2 ramp steps of each other (§6).
    "crate_frame": ("pine_weathered", 6),   # L 59; the batten's right half
    "crate_stile": ("umber", 6),            # L 40; left and right uprights
    "crate_batten": ("mud", 5),             # L 39; the batten's left half
    "crate_inner": ("umber", 3),            # L 25; ONE column, ONE value
    "crate_face": ("umber", 4),             # L 29; +/-1 step of stipple
    "crate_edge": ("umber", 3),             # L 25; the dark edge at x=149
    "crate_seat": ("mud", 3),               # L 27; contact shadow, left end
    "crate_seat_mid": ("grey", 0),          # L 16
    "crate_seat_deep": ("umber", 0),        # L 9; the minimum, at x=145
}

#: The nine inks the shared table also names. Duplicated deliberately -- the
#: local table is what this file reads, so if `layout` ever moves one of them
#: the mismatch has to be loud rather than a colour that quietly disagrees
#: with the neighbour drawing the same timber.
_SHARED = ("back_post_lit", "post_lit", "post_mid", "post_dark",
           "bar_flat", "bar_shadow")
_SHARED_AS = {"bar_flat": "weathered_rail", "bar_shadow": "rail_shadow"}

for _name in _SHARED:
    _ours = INKS[_name]
    _theirs = layout.MATERIALS[_SHARED_AS.get(_name, _name)]
    if _ours != _theirs:
        raise RuntimeError(
            f"rail ink {_name!r} is {_ours} but layout says {_theirs}")
del _name, _ours, _theirs


# ---------------------------------------------------------------------------
# Geometry, all of it measured off the bar
# ---------------------------------------------------------------------------

#: §2.12. The top bar's highlight row in its four measured zones. The bright
#: cap and the bright run under the crate are the ONLY places `bar_hot` is
#: spent, and they come to seven pixels exactly.
TOP_BAR_Y = layout.RAIL_TOP_BAR[1] + 1          # y=82, and nothing else
TOP_BAR_CAP = (125, 127)                        # mean 78; hot / warm / hot
TOP_BAR_FLAT = (128, 138)                       # mean 58, and genuinely flat
TOP_BAR_RUN = (139, 146)                        # mean 77; five hot, three warm
TOP_BAR_HOT_RUN = (139, 143)                    # the five that reach L>=80
TOP_BAR_FALL = (147, 153)                       # mean 48, falling to the right

#: §3's brightness budget, counted rather than remembered. SEVEN pixels in
#: this region reach L>=80 and all seven are on row y=82 -- the two ends of
#: the cap and the five under the crate. The single brightest structural
#: pixel is 81.5 against the lantern's 122.8, and that forty-point gap is
#: what keeps the fence a road for the eye rather than a destination.
HOT_PIXELS = 2 + (TOP_BAR_HOT_RUN[1] - TOP_BAR_HOT_RUN[0] + 1)
if HOT_PIXELS != 7:
    raise RuntimeError(f"rail spends {HOT_PIXELS} pixels at L>=80; §3 allows 7")

#: §2.11. The lower bar's flat run: row 88 varies by only 6.6 sd across
#: twenty-two pixels, and that evenness is what makes it read as milled
#: timber next to the ragged bench boards below it.
LOWER_BAR_Y = layout.RAIL_LOWER_BAR[1] + 1      # y=88
LOWER_BAR_FLAT = (130, 146)

#: §7. The top bar dies at x≈154, swallowed by the horse's head. The lower
#: bar survives in the gap under the jaw and is handed to `team` at y 87-88.
LOWER_BAR_GAP = (154, 155)                      # the right post's dark columns
LOWER_BAR_TAIL = (156, 163)

#: §2.7 and §2.14. Measured mean 28.4 -- darker than the hillside behind
#: (35.2) and far darker than the road in front (64.7).
#:
#: IT IS NOT THE ANCHOR RECT. The anchor is y 89-104, which is where the
#: pocket is at its most obvious; measured, the enclosure starts four rows
#: higher (between the two bars, x 130-151 at rows 85-86, the bar reads 20-25
#: against a backdrop of 30-38) and its left edge steps out to x=124 below
#: the bar's end cap, because §2.14's road edge does not drop from y=96 to
#: y=104 at the anchor's x=128 -- it steps under the bar's own shade at
#: x≈124. The last entry is the deepest corner, which holds one row longer
#: than the rest before the ground takes over.
#: (row from, row to, x from, x to). `None` means the anchor's right edge.
POCKET_BANDS = ((85, 92, 128, None), (93, 102, 122, None), (103, 103, 128, 137))
POCKET_DEEP_ROWS = frozenset((89, 93, 94, 95))
POCKET_FOOT_ROWS = frozenset((101, 102, 103))

#: §2.10. A short brace projecting left and down from the near post, two
#: pixels wide, measured 47-72. Its only job is to stop the ground between
#: the two fences being empty. (row, x from, x to).
BRACKET_RUNS = ((91, 124, 125), (92, 123, 126), (93, 122, 123), (93, 125, 126),
                (94, 122, 123), (95, 122, 123))
BRACKET_LIT = ((91, 124), (92, 124), (92, 125), (94, 122))

#: §5. The contact shadow under the crate, as four zones left to right:
#: mud 3 -> grey 0 -> umber 0 and back up. L 27 down to 6.1 and it is the
#: darkest run anywhere in the region above the ground.
CRATE_SEAT_ZONES = ((136, 142, "crate_seat"), (143, 143, "bench_deep"),
                    (144, 144, "crate_seat_mid"), (145, 145, "crate_seat_deep"),
                    (146, 147, "pocket_deep"), (148, 149, "bench_deep"))


# ---------------------------------------------------------------------------
# Stipple -- a material, not a gradient tool
# ---------------------------------------------------------------------------


def _hash(seed: int, x: int, y: int) -> float:
    """A stable 0.0-1.0 from a coordinate. No Bayer phase, no draw order.

    Keyed on the pixel rather than drawn from a sequence, so adding a row to
    the bench cannot move the grain on the crate, and so the same pixel gets
    the same grain whichever pass reaches it first.
    """
    value = (x * 0x1F1F1F1F ^ y * 0x27D4EB2D ^ seed) & 0xFFFFFFFF
    value = (value ^ (value >> 15)) * 0x2C1B3C6D & 0xFFFFFFFF
    value = (value ^ (value >> 12)) * 0x297A2D39 & 0xFFFFFFFF
    return ((value ^ (value >> 15)) & 0xFFFF) / 65535.0


def _grain(seed: int, x: int, y: int, amount: float = 0.26) -> int:
    """An unstructured +/-1 ramp step. §6: mean horizontal neighbour step is
    2.8-4.3 luminance on man-made surfaces, which is a little over half a
    ramp step, so a little over half the neighbour pairs differ by one."""
    sample = _hash(seed, x, y)
    if sample < amount:
        return -1
    if sample > 1.0 - amount:
        return 1
    return 0


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
        _bench(canvas, ctx)
        _bracket(canvas, ctx)
        _bucket(canvas, ctx)
        _lower_bar(canvas, ctx)
        _top_bar(canvas, ctx)
        _near_post(canvas, ctx)
        _right_post(canvas, ctx)
        _crate(canvas, ctx)

    # §1: these objects are NEITHER LIT NOR SILHOUETTED. They sit outside the
    # lantern's pool -- the fitted excess at the fence is one to two ramp
    # steps -- and every value in them is authored against a measurement. The
    # rows below the bar are shielded so the pass cannot lift the pocket the
    # bars are read against (§8.7). Rows 104 and down are NOT shielded,
    # because that is the road and the road is lit; the two posts ARE
    # shielded to their feet, because a post standing IN the pool still
    # measures 51-67 at its base and an unshielded one climbs to 88.
    ctx.shield_rect(122, 85, 43, 103 - 85 + 1)
    ctx.shield_rect(layout.RAIL_NEAR_POST[0], 85, 4, 104 - 85 + 1)
    ctx.shield_rect(layout.RAIL_RIGHT_POST[0], 84, 4, 103 - 84 + 1)
    # And the back fence's post, whose foot stands eight rows higher than the
    # near fence's and well inside the pool's reach. §8.4: its whole range is
    # nineteen luminance points against the near post's forty-six, and two
    # steps of lift is the difference between a far post and a near one.
    ctx.shield_rect(layout.BACK_FENCE_POST[0], layout.BACK_FENCE_POST[1],
                    layout.BACK_FENCE_POST[2], layout.BACK_FENCE_POST[3] - 1)


def _ink(ctx: layout.Ctx, name: str, offset: int = 0) -> int:
    """A named ink, optionally stepped along its OWN family.

    Stepping within the family is the only legal way to move a colour here:
    reaching for a naked index, or for a different family at a similar value,
    is how a cool bar top becomes a warm one three passes later.
    """
    family, step = INKS[name]
    return ctx.palette.family(family).at(step + offset)


def _stipple_row(canvas: IndexedCanvas, ctx: layout.Ctx, seed: int,
                 x0: int, x1: int, y: int, name: str,
                 amount: float = 0.26, offset: int = 0,
                 dip_only: bool = False) -> None:
    """One row of an ink with unstructured grain on it.

    `dip_only` keeps the grain below the named step, for the two runs the
    spec measures as having a ceiling rather than a spread -- the lower bar's
    highlight tops out at 62 and the crate's batten at 59, and a symmetric
    grain on either of them spends light the region has not got.
    """
    for x in range(x0, x1 + 1):
        step = _grain(seed, x, y, amount)
        if dip_only:
            step = min(0, step)
        canvas.put(x, y, _ink(ctx, name, offset + step))


def _stipple_rect(canvas: IndexedCanvas, ctx: layout.Ctx, seed: int,
                  x0: int, y0: int, x1: int, y1: int, name: str,
                  amount: float = 0.26, offset: int = 0) -> None:
    for y in range(y0, y1 + 1):
        _stipple_row(canvas, ctx, seed, x0, x1, y, name, amount, offset)


# ---------------------------------------------------------------------------
# The back fence -- a different structure, at a different depth
# ---------------------------------------------------------------------------


def _back_fence(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.2-4 and §4. It genuinely recedes; the near rail does not.

    Its post measures fourteen pixels from rail to ground against the near
    post's twenty-two -- a depth ratio of 0.64 -- and its base sits eight
    rows higher in frame. §8.4: the near post spans a 46-point range and this
    one spans 19, and this one is built out of `dust`, `dusk` and `grey`.
    """
    seed = 0x2A11F
    rail_y = layout.BACK_FENCE_RAIL_Y

    # ONE PIXEL ROW. §2.2 is explicit: no shadow row, no body, no highlight,
    # one row of flat cool grey, and the row directly beneath it measures 31.
    # §7: it leaves this region's left edge at x=104 on this row at `grey` 4
    # and is picked up there by whoever draws toward the signpost. Hob stands
    # over x 92-108 and covers the handoff.
    left = layout.RAIL_TOP_BAR[0]                       # x=125, where the
    canvas.hline(104, rail_y, left - 104, _ink(ctx, "back_rail"))

    # §2.3. L 35-42 against surroundings of 27-30 -- eight points, and it is
    # MEANT to be almost invisible. It exists so the back fence is not a
    # single stick.
    x0, y0, width, height = layout.BACK_FENCE_RAIL_2
    _stipple_rect(canvas, ctx, seed, x0, y0, x0 + width - 1, y0 + height - 1,
                  "back_rail_2")

    # §2.4. Three columns, brightest at its cap, base meeting the lamp-lit
    # ground at y=96 -- eight rows higher than the near posts.
    px, py, _, height = layout.BACK_FENCE_POST
    # §2.4: the base MEETS the lamp-lit ground at y=96, so the last row of
    # timber is 95 and row 96 belongs to `road`. Eight rows higher than the
    # near posts, and that eight rows is the depth read.
    bottom = py + height - 2
    for y in range(py, bottom + 1):
        cap = y <= py + 2
        canvas.put(px, y, _ink(ctx, "back_post_cap" if cap else "back_post_lit",
                               _grain(seed, px, y)))
        canvas.put(px + 1, y, _ink(ctx, "back_post_mid", _grain(seed, px + 1, y)))
        canvas.put(px + 2, y, _ink(ctx, "back_post_dark", _grain(seed, px + 2, y)))


# ---------------------------------------------------------------------------
# The pocket -- the ground both bright bars are read against
# ---------------------------------------------------------------------------


def _dark_pocket(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.7 and §8.7. Not empty space -- the element that makes both bars read.

    It looks like an unfinished area and invites filling in; lighten it and
    the fence dissolves into the backdrop. Measured mean 28.4, floor 14-31,
    lifting at its foot where light gets under the boarding.
    """
    seed = 0x9F0C3
    x0, _, width, _ = layout.RAIL_DARK_POCKET
    anchor_right = x0 + width - 1
    for first, last, left, right in POCKET_BANDS:
        for y in range(first, last + 1):
            # The deepest rows are the ones directly under a board; the two
            # above the road lift as light gets under the boarding.
            if y in POCKET_FOOT_ROWS:
                name = "pocket_foot"
            elif y in POCKET_DEEP_ROWS:
                name = "pocket_deep"
            else:
                name = "pocket"
            _stipple_row(canvas, ctx, seed, left,
                         anchor_right if right is None else right, y, name)


# ---------------------------------------------------------------------------
# The boarding in the pocket -- texture, not structure
# ---------------------------------------------------------------------------


def _bench(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.8. The bench's back and seat seen through the rail.

    Four alternating rows at a separation of ten to fifteen points, no more.
    §8.8: the real bars sit forty to sixty above their shadows; give the
    bench the same contrast and the region becomes a ladder with five equal
    horizontals and no hierarchy.
    """
    seed = 0x4BE07
    x0, y0, width, _ = layout.RAIL_BENCH
    x1 = x0 + width - 1
    for row, name, offset in ((0, "bench_light", 0), (1, "bench_dark", 0),
                              (2, "bench_light", 0), (3, "bench_deep", 0),
                              # The last board is a step darker again --
                              # measured 22.0 and then 19.5.
                              (4, "bench_deep", -1)):
        _stipple_row(canvas, ctx, seed, x0, x1, y0 + row, name, offset=offset)


def _bracket(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.10. Four or five warm mid-tone pixels, and no more than that.

    A short board or brace projecting left and down from the near post. Its
    only job is to stop the ground between the two fences being empty, so it
    is drawn as a two-pixel diagonal and never as an object.
    """
    lit = set(BRACKET_LIT)
    for y, x0, x1 in BRACKET_RUNS:
        for x in range(x0, x1 + 1):
            canvas.put(x, y, _ink(ctx, "bracket_lit" if (y, x) in lit
                                  else "bracket"))


def _bucket(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.9. A pale cool rim, a warm lit left face, a dark right body.

    Roughly 13 x 8, base merging into the road at y 102-103, and the same
    cool-horizontal / warm-vertical split as the rest of the region inside
    one small object.
    """
    seed = 0x71D5A
    x0, y0, width, height = layout.RAIL_BUCKET
    x1, y1 = x0 + width - 1, y0 + height - 1
    lit_to = x0 + 5                                     # x 138-143

    for y in range(y0 + 1, y1):
        # Two pixels of the left face carry nearly all of the object's light.
        _stipple_row(canvas, ctx, seed, x0, x0 + 1, y, "bucket_lit")
        _stipple_row(canvas, ctx, seed, x0 + 2, lit_to, y, "bucket_face")
        _stipple_row(canvas, ctx, seed, lit_to + 1, x1, y, "bucket_body")
        # The far corner is the deepest thing in the object.
        canvas.put(x1 - 1, y, _ink(ctx, "bucket_body_deep",
                                   _grain(seed, x1 - 1, y)))

    # The rim is ONE row and it is cool, like every other top surface here.
    _stipple_row(canvas, ctx, seed, x0, x0 + 4, y0, "bucket_rim")
    _stipple_row(canvas, ctx, seed, x0 + 5, x1, y0, "bucket_rim_far")
    # And the foot merges rather than ending.
    _stipple_row(canvas, ctx, seed, x0, x1, y1, "bucket_foot")


# ---------------------------------------------------------------------------
# The bars -- one pixel of light and one pixel of dark
# ---------------------------------------------------------------------------


def _lower_bar(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.11. Three rows: ambient, highlight, shadow.

    Row 88 is the flattest run of value in the region and `pine_weathered` 6
    is the single most consistent colour in it. The bright end cap at
    x 125-127 is the bar's own projecting end, and it is warm because it is
    an END GRAIN facing the lamp rather than a top face catching the sky.
    """
    seed = 0x63A22
    x0, y0, width, _ = layout.RAIL_LOWER_BAR
    x1 = x0 + width - 1
    ambient_y, highlight_y, shadow_y = y0, y0 + 1, y0 + 2

    # y=86 -- two short runs where the top face shows a SECOND row, measured
    # at 46-65 over x 130-133 and 52-56 over x 148-149 against a pocket of
    # 14-25 either side. They are four and two pixels; they are the only
    # thing that stops rows 85-86 being a dead band, and they are the lower
    # bar's own version of what row 81 does for the top bar.
    _stipple_row(canvas, ctx, seed, 130, 133, ambient_y - 1, "bar_flat",
                 amount=0.30, offset=-1)
    _stipple_row(canvas, ctx, seed, 148, 149, ambient_y - 1, "bar_flat",
                 amount=0.30, offset=-2)

    # y=87 -- the ambient top, mean 44.9. Brighter at the left, where more of
    # the bar's top face is turned toward the viewer, and again where it
    # passes the right post. (x from, x to, steps off `bar_flat`).
    for left, right, offset in ((125, 129, -3), (130, 137, -1), (138, 147, -3),
                                (148, 153, -1), (156, 163, -5)):
        _stipple_row(canvas, ctx, seed, left, right, ambient_y,
                     "bar_flat", amount=0.22, offset=offset)

    # y=88 -- THE HIGHLIGHT. One row. §2.11 measures it as the flattest run of
    # value in the region, sd 6.6 across twenty-two pixels, so the stipple is
    # turned almost off along its middle: that evenness is what makes it read
    # as milled timber next to the ragged bench boards below it.
    canvas.hline(125, highlight_y, 3, _ink(ctx, "bar_warm"))
    canvas.put(128, highlight_y, _ink(ctx, "bar_flat", -2))
    flat0, flat1 = LOWER_BAR_FLAT
    _stipple_row(canvas, ctx, seed, flat0, flat1, highlight_y,
                 "bar_flat", amount=0.12, dip_only=True)
    for step, x in enumerate(range(flat1 + 1, LOWER_BAR_GAP[0])):
        canvas.put(x, highlight_y, _ink(ctx, "bar_flat", -(step // 2)))
    # The tail under the horse's jaw, handed to `team` at y 87-88.
    _stipple_row(canvas, ctx, seed, LOWER_BAR_TAIL[0], LOWER_BAR_TAIL[1],
                 highlight_y, "bar_flat", amount=0.30, offset=-2)

    # y=89 -- the shadow, and it goes all the way to the tail.
    _stipple_row(canvas, ctx, seed, x0, x1, shadow_y, "bar_shadow")


def _top_bar(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.12 and §8.1. The most likely failure in the region lives here.

    Drawn as a uniform two-pixel light bar the whole way across, the top bar
    breaks four things at once: it blows the brightness budget (seven pixels
    at L>=80, not fifty), it removes the falloff to the right that keeps the
    eye moving toward the horses, it destroys the bright run at x 139-146
    that seats the crate, and it converts a hitching rail into a graphic
    stripe. The highlight has FOUR value zones along its length; all four are
    drawn here and only two of them spend `bar_hot`.

    §4: the highlight row does not tilt. It stays on y=82 for its whole
    twenty-nine-pixel run, and what changes with depth is how much of the top
    face is visible -- one row on the left, two from x≈139 rightward.
    """
    seed = 0x5C7E1
    x0, y0, width, _ = layout.RAIL_TOP_BAR
    x1 = x0 + width - 1
    ambient_y, face_y, shadow_y = y0, y0 + 2, y0 + 3

    # y=81 -- the second row of top face, present only from x≈139 rightward.
    # §4: the highlight row does not tilt, so this row is the ONLY thing that
    # says the bar is receding, and it says it by widening rather than by
    # sloping.
    _stipple_row(canvas, ctx, seed, 139, 142, ambient_y, "bar_flat",
                 amount=0.30, offset=-3)
    _stipple_row(canvas, ctx, seed, 143, 152, ambient_y, "bar_flat",
                 amount=0.20, offset=-1)
    canvas.put(153, ambient_y, _ink(ctx, "bar_flat", -3))

    # y=82 -- THE HIGHLIGHT, and the region's entire light budget.
    cap0, cap1 = TOP_BAR_CAP
    canvas.hline(cap0, TOP_BAR_Y, cap1 - cap0 + 1, _ink(ctx, "bar_hot"))
    canvas.put(cap0 + 1, TOP_BAR_Y, _ink(ctx, "bar_warm"))
    flat0, flat1 = TOP_BAR_FLAT
    canvas.hline(flat0, TOP_BAR_Y, flat1 - flat0 + 1, _ink(ctx, "bar_flat"))
    run0, run1 = TOP_BAR_RUN
    hot0, hot1 = TOP_BAR_HOT_RUN
    canvas.hline(hot0, TOP_BAR_Y, hot1 - hot0 + 1, _ink(ctx, "bar_hot"))
    canvas.hline(hot1 + 1, TOP_BAR_Y, run1 - hot1, _ink(ctx, "bar_warm"))
    # And the falling zone. Four ramp steps across seven pixels is what keeps
    # the eye moving right toward the horses instead of stopping on the bar.
    fall0, fall1 = TOP_BAR_FALL
    for step, x in enumerate(range(fall0, fall1 + 1)):
        canvas.put(x, TOP_BAR_Y, _ink(ctx, "bar_flat", -((step + 1) // 2)))

    # y=83 -- the front face, warm and falling to the right with the light.
    canvas.put(x0, face_y, _ink(ctx, "bar_hot", -1))
    _stipple_row(canvas, ctx, seed, x0 + 1, 137, face_y, "bar_face")
    _stipple_row(canvas, ctx, seed, 138, 143, face_y, "bar_face_far")
    _stipple_row(canvas, ctx, seed, 144, 147, face_y, "bar_face_end")
    _stipple_row(canvas, ctx, seed, 148, x1, face_y, "bar_shadow")

    # y=84 -- the cast shadow. One row, and it reaches L 15.9.
    _stipple_row(canvas, ctx, seed, x0, x1, shadow_y, "bar_shadow",
                 amount=0.34, offset=1)


# ---------------------------------------------------------------------------
# The posts -- three columns, and the dark one works as hard as the light one
# ---------------------------------------------------------------------------


def _near_post(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.5 and §8.10. IT CHANGES POLARITY AT THE RAIL LINE.

    Above the bar it is a dark silhouette against the pale distance: a lit
    left edge at x=126 and a genuinely dark column at x=128 against a backdrop
    of L 30-41. Below it, column x=127 holds mean L 70.6 across twenty rows
    and is the brightest sustained mark in the region.

    Drawn uniformly bright it is a light stick poking into the sky; drawn
    uniformly dark it loses the strongest vertical in the region.
    """
    seed = 0x1D904
    x0, y0, _, height = layout.RAIL_NEAR_POST
    bottom = y0 + height - 1                            # y=104, the contact
    bar = layout.RAIL_TOP_BAR[1]                        # y=81

    # ABOVE the bar: nine rows standing proud of the rail. The lit edge is
    # one column left of the bright column below, because above the rail we
    # are seeing the post's left arris and below it the whole lit face. It
    # runs to y=81 inclusive: the bar's own second top-face row does not
    # reach this far left, so the post is what fills row 81 here.
    for y in range(y0, bar + 1):
        # Over its last three rows the lit column walks from x=126 to x=127
        # -- measured 42/49, 42/58, 29/40 -- which is the post's lit face
        # turning into view as it comes down to meet the bright column below
        # the rail. It is three pixels and it is the whole reason the
        # polarity change reads as one post rather than as two sticks.
        lit, mid = (x0, x0 + 1) if y < bar - 2 else (x0 + 1, x0)
        canvas.put(lit, y, _ink(ctx, "near_top_lit", _grain(seed, lit, y)))
        canvas.put(mid, y, _ink(ctx, "near_top_mid", _grain(seed, mid, y)))
        canvas.put(x0 + 2, y, _ink(ctx, "near_top_dark", _grain(seed, x0 + 2, y)))

    # BELOW the bar, from y=85: light, mid, dark, and nothing else.
    for y in range(bar + 4, bottom + 1):
        canvas.put(x0 + 1, y, _ink(ctx, "post_lit", _grain(seed, x0 + 1, y, 0.18)))
        canvas.put(x0 + 2, y, _ink(ctx, "post_mid", _grain(seed, x0 + 2, y, 0.18)))
        canvas.put(x0 + 3, y, _ink(ctx, "post_dark", _grain(seed, x0 + 3, y, 0.18)))


def _right_post(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.6. Four columns -- TWO lit, then mid, then dark.

    It does not project above the rail; the bar cuts it off at y=84, so it
    starts there rather than at its nominal top. Base at y=103, one row
    higher than the near-left post, which is one pixel of recession across
    twenty-five and the whole tilt the near fence is allowed.
    """
    seed = 0xA30B7
    x0, _, _, _ = layout.RAIL_RIGHT_POST
    top = layout.RAIL_TOP_BAR[1] + 3                    # y=84
    bottom = layout.ground_y(x0 + 1)                    # y=103

    for y in range(top, bottom + 1):
        canvas.put(x0, y, _ink(ctx, "right_lit", _grain(seed, x0, y, 0.2)))
        canvas.put(x0 + 1, y, _ink(ctx, "right_lit", _grain(seed, x0 + 1, y, 0.2)))
        canvas.put(x0 + 2, y, _ink(ctx, "right_mid", _grain(seed, x0 + 2, y)))
        canvas.put(x0 + 3, y, _ink(ctx, "right_dark", _grain(seed, x0 + 3, y)))


# ---------------------------------------------------------------------------
# The crate -- seated by a black line, not by a shadow
# ---------------------------------------------------------------------------


def _crate(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.13 and §8.5-6. Ten by seven pixels of face carrying nothing legible.

    The composition brief shows a battened crate face with a stencilled
    shipping mark. At 320x144 that mark resolves to six or eight darker
    pixels with no shape, and a legible mark here creates a second sign
    fighting the real signpost off the left edge -- which is the one thing
    the player is supposed to read in this part of frame. DRAW THE SCATTER;
    DO NOT DRAW THE MARK.

    §8.6: its face averages 32.2 and the backdrop it overlaps averages 27-34.
    It has essentially zero value separation and that is CORRECT. It reads
    through its lit frame and its black contact row, nothing else.
    """
    seed = 0x8E641
    x0, y0, width, height = layout.RAIL_CRATE
    x1, y1 = x0 + width - 1, y0 + height - 1            # x=148, y=79
    seat_y = y1 + 1                                     # y=80

    # THE BLACK ROW FIRST. Everything else in the object exists to serve it,
    # and the bright run on the bar two rows below exists to serve it too.
    for left, right, name in CRATE_SEAT_ZONES:
        canvas.hline(left, seat_y, right - left + 1, _ink(ctx, name))

    # The face. Twelve indices, all within +/-2 steps, longest same-value
    # horizontal run five pixels and vertical run three.
    _stipple_rect(canvas, ctx, seed, x0 + 2, y0 + 2, x1 - 1, y1, "crate_face",
                  amount=0.34)

    # The top edge and the batten. The batten is brighter over its right half
    # because that half turns toward the sky over the valley.
    _stipple_row(canvas, ctx, seed, x0, x0 + 1, y0, "crate_batten")
    _stipple_row(canvas, ctx, seed, x0 + 2, x0 + 7, y0, "crate_face")
    _stipple_row(canvas, ctx, seed, x0 + 8, x1, y0, "crate_batten")
    _stipple_row(canvas, ctx, seed, x0 + 1, x0 + 6, y0 + 1, "crate_batten")
    _stipple_row(canvas, ctx, seed, x0 + 7, x0 + 10, y0 + 1, "crate_frame")
    canvas.put(x0, y0 + 1, _ink(ctx, "crate_frame"))
    _stipple_row(canvas, ctx, seed, x0 + 11, x1, y0 + 1, "bucket_lit")

    # The stiles, and the one column that is a dead-flat single value.
    for y in range(y0 + 2, y1 + 1):
        canvas.put(x0, y, _ink(ctx, "crate_stile", _grain(seed, x0, y)))
        canvas.put(x1, y, _ink(ctx, "crate_stile", _grain(seed, x1, y)))
    # §2.13: `umber` 3, exclusively, for all seven rows. NO STIPPLE. Every
    # one-pixel line in this region would be destroyed by a blend, and this
    # is the one the spec measures as dead flat.
    canvas.vline(x0 + 1, y0 + 2, height - 2, _ink(ctx, "crate_inner"))
    # And a one-pixel dark edge OUTSIDE the right stile.
    canvas.vline(x1 + 1, y0 + 1, height - 1, _ink(ctx, "crate_edge"))
