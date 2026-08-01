"""Room 1 — the coach team. GRAYBOX.

Three harnessed horses standing still with their heads down, drawn as ONE
horizontal dark mass 69 px long and 36 px tall whose only strong internal
information is a flat topline, a straight belly line, nine hooves on two
ground lines, and four warm sparks of bridle metal — and which is separated
from the sky behind it NOT BY VALUE but by hue and by two one-pixel rims of
opposite polarity.

WHY THREE AND NOT TWO. team.md §3 settles it with three independent
measurements, and records them because a rebuild will be tempted to
simplify: three separate lowered head shapes, each with its own furniture;
NINE HOOF CONTACTS between x 172 and x 218, where two horses can show at
most eight; and two toplines with a 5-px step plus a third back that is
neither of them. Two animals cannot produce nine feet.

THE PROPORTIONS ARE THE ANIMAL, not the outline (§4). Against a 27 px
withers height: barrel depth 11, LEG 16. A dog is the other way round, and
§9.1 says if those come out 14 and 13 the result is a mastiff and no amount
of mane will save it. The head is 13 px — HALF THE HEIGHT OF THE ANIMAL —
which feels wrong and is the single most under-drawn measurement here.

THE ANIMALS ARE NOT DARKER THAN THE SKY. Not usefully. Averaged along the
whole topline, background 2-3 px above the edge is L 28.1 and hide 2-3 px
below it is L 21.4 — a gap of 6.7, 2.6% of the scale. What separates them is
WARMTH: hide +14 to +28, sky −13 to −26. A 40-unit hue swing across a 7-unit
value step, and §9.5 warns that the 6.7 will feel far too subtle at 8× and
somebody will "fix" it by darkening the hides, which pushes them into the
chest shadow's family, kills the mane and turns the team into a hole.

THE TWO TOPLINES ARE LIT IN OPPOSITE DIRECTIONS AND THAT IS THE DEPTH CUE.
C's back at y 69-72 is a black cut-out, −26 against the sky. A's back at
y=75 is a BRIGHT COOL RIM, +14 against it — one row, 22 px long, warmth −7
sitting on hide at warmth +26. §9.4: it looks like an error in the data. It
is the only thing that puts the near horse in front of the far one.

AND THERE IS NO SEAM ACROSS THE TOP OF THE MASS. From x 160 to x 193 the far
and middle horses merge into one continuous silhouette with nothing between
them. §9.3: adding a separating line there produces two flat paper cut-outs,
which is precisely the failure the offset toplines exist to avoid.

THE HOLES ARE AS IMPORTANT AS THE SOLIDS. Six background gaps between the
legs and one sky wedge under C's jaw. §7: nine hooves are drawn and without
the holes they are one dark skirt; the wedge is six cool pixels and it is
the difference between a lowered head and a thick neck. Both are drawn here
by NOT drawing — the mass is built column by column with the gaps left as
whatever was behind.

IT RIDES WITH THE COACH. coach.md §8 makes the coach a removable object
layer and errata 31d makes the shipping background the departed
composition; the team is hitched to the vehicle and leaves with it, so this
region draws nothing when ctx.with_coach is False. That is also what makes
the coach layer come out of a difference of two composes.

DEFERRED to the region author:
  - §7's stipple. The hide is the busiest surface in the frame — mean
    horizontal run 1.27 px in the mane and 1.65 in the lit barrel, 68-80%
    single-pixel runs, `pine_fresh` and `mud` alternating at similar value
    so the barrel reads as HAIR while its value profile stays smooth. Copy
    the statistic, not a pattern. None of it is drawn here.
  - §3.19's per-leg lit leading edge with 1 px of `umber@0` behind it.
  - §3.23's trace stepping (1-2 px of horizontal run per 1 px of rise).
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: §4. C is the odd one out — set back, and standing with its head less far
#: down. B and A read as a pair at the same depth, separated only sideways,
#: and that asymmetry is why the group looks like animals rather than like a
#: repeating stamp. Heads begin at x 153, 161, 171: +8, then +10.
C_HEAD = layout.HORSE_C_HEAD
B_HEAD = layout.HORSE_B_HEAD
A_HEAD = layout.HORSE_A_HEAD

#: §3.5. The topline runs essentially flat from x=160 to x=193 and C's croup
#: is the step down at x 193→194.
MASS_LEFT, MASS_STEP, MASS_RIGHT = 160, 194, 221

#: §3.12. Six highlight peaks between x 180 and x 195 along a 19 px axis at
#: 28° above horizontal. Pitch 2-4 px, mean 3 — and §7 says do not comb them
#: into an even pattern, the measured pitch varies.
MANE_PEAKS = (181, 183, 186, 188, 190, 194)

#: Errata 35d. `graze` is 0 for a head down and 1 for a head raised and
#: chewing, PER HORSE, and the two are out of phase because two animals
#: lifting together is a pantomime horse. It applies to B and A: they are
#: exactly level with each other (§4), so a lift on one is legible, while C
#: is 13 px higher already and lifting it would put the group above the
#: coach roof.
GRAZE_LIFT = 3


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    if not ctx.with_coach:
        # coach.md §8: the team is part of the removable layer. Nothing here
        # survives the coach's departure, and the shipping background is the
        # departed composition (errata 31d).
        return
    with ctx.track(canvas, "the team"):
        _mass(canvas, ctx)
        _heads(canvas, ctx)
        _legs(canvas, ctx)
        _marks(canvas, ctx)
        _tack(canvas, ctx)
    _cast_shadow(canvas, ctx)


# ---------------------------------------------------------------------------


def _belly(x: int) -> int:
    """The first background row under the mass at a column.

    Five sections, all from §3, and the steps between them are the anatomy:
    the two lowered heads hang to y=95 while the chest beside them stops at
    91, the barrel's underline is straight at 86-88, and the croup is cut off
    at 84 by the tail. A single belly line across the whole mass is what
    turns three animals into one dark skirt.
    """
    if x <= 160:
        return 88
    if x <= 180:
        return 95          # B's and A's heads, hanging
    if x <= 188:
        return 91          # chest and forearm shadow
    if x <= 193:
        return 88
    if x <= 201:
        return 86          # barrel, ahead of the underline
    if x <= 218:
        return 88          # underline
    return 84              # croup


def _mass(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The single dark body, drawn as column spans so the holes stay holes."""
    hide = ctx.ink("horse_hide")
    hide_mid = ctx.ink("horse_hide_mid")
    far_hide = ctx.ink("horse_hide_shadow", 2)
    black = ctx.ink("horse_black")

    # C's head, and the ear that is the top of the whole group.
    hx, hy, hwidth, hheight = C_HEAD
    for column in range(hwidth):
        # §3.2: the head hangs almost vertically, the axis leaning ~15°
        # forward — top of the head at x≈157, muzzle at x≈154.
        top = hy + (0 if column >= 3 else 1)
        bottom = hy + hheight - (0 if column <= 4 else 5)
        canvas.vline(hx + column, top, bottom - top, far_hide)
    ex, ey = layout.HORSE_C_EAR
    canvas.vline(ex, ey - 1, 2, black)

    # §3.4: a 12 × 3 near-black bar at the crest. Against sky at L 34 this is
    # a −26 step, the hardest edge in the region.
    cx, cy, cwidth, cheight = layout.HORSE_C_CREST
    canvas.rect(cx, cy, cwidth, cheight, black)

    # The body proper. Two toplines 5 px apart, one belly line per section,
    # and NOTHING in between them across the top of the mass.
    #
    # THE FAR HALF IS A DIFFERENT VALUE FROM THE NEAR HALF, and that is the
    # other half of the depth read. §5: C's neck and back measure L 17.9 --
    # DARKER than the sky they sit against -- while A's barrel runs 34 at the
    # top falling to 27.5. The value break lands at x=193, on the same column
    # as the 5-px topline step, so the two arrive together.
    wx, wy, wwidth, wheight = layout.SKY_WEDGE_UNDER_JAW
    for x in range(MASS_LEFT, MASS_RIGHT + 1):
        top = layout.HORSE_C_TOPLINE_Y if x < MASS_STEP else layout.HORSE_A_TOPLINE_Y
        for y in range(top, _belly(x)):
            # §3.3: the six cool pixels under C's jaw are THE SINGLE MOST
            # LOAD-BEARING NEGATIVE SHAPE IN THE REGION -- the difference
            # between a lowered head and a thick neck. Drawn by not drawing.
            if wx <= x < wx + wwidth and wy <= y < wy + wheight:
                continue
            canvas.put(x, y, far_hide if x < MASS_STEP else
                       (hide if y < top + 4 else hide_mid))

    # §3.18. The darkest mass in the region, Lmed 8.6, and the anchor that
    # holds the front of the animal down.
    sx, sy, swidth, sheight = layout.HORSE_CHEST_SHADOW
    canvas.rect(sx, sy, swidth, sheight, black)
    # §3.17. Straight. The curve happens only at the front end, where it
    # thickens into the chest mass; §9.11 — curving the middle produces a
    # pot-bellied pony.
    ux, uy, uwidth, uheight = layout.HORSE_UNDERLINE
    canvas.rect(ux, uy, uwidth, uheight, ctx.ink("horse_hide_shadow"))

    # §3.16. ONE tail, 1-2 px, near-black, ending 5 px above the hoof line.
    tx, ty, twidth, theight = layout.HORSE_TAIL
    canvas.rect(tx, ty, twidth, theight, black)

    # §5.2. ONE COOL ROW on a warm animal, 22 px long, and the entire depth
    # read between the near and far animals.
    bx, by, bwidth, _ = layout.HORSE_A_BACK
    canvas.hline(bx + 3, by, bwidth - 3, ctx.ink("horse_rim"))


def _heads(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """B's and A's heads: same posture as C's, dropped 13 px, +8 then +10 px."""
    hide = ctx.ink("horse_hide_mid")
    lit = ctx.ink("horse_hide")

    for index, (x0, y0, width, height) in enumerate((B_HEAD, A_HEAD)):
        lift = ctx.graze[index] * GRAZE_LIFT if index < len(ctx.graze) else 0
        for column in range(width):
            # §4: the head axis stays within 15° of vertical. None of them is
            # grazing; a raised head shortens the neck's reach as well as
            # lifting it, so the head is redrawn rather than translated.
            taper = 0 if column < width - 3 else (column - width + 4) * 2
            top = y0 - lift + (2 if column < 2 else 0)
            canvas.vline(x0 + column, top, height - taper - (top - y0 + lift),
                         lit if column < 2 else hide)


def _legs(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§3.19. Nine contacts on TWO ground lines 5 px apart.

    §9.7: evenly spaced legs on a single baseline read as a fence. The five
    px of fall from back rank to front rank is this region's statement about
    where the ground plane is, and road.md's ruts run parallel to it.
    """
    hide = ctx.ink("horse_hide_mid")
    lit = ctx.ink("horse_hide")
    hoof = ctx.ink("horse_hide_shadow")
    for left, right, ground in layout.HOOVES:
        width = max(2, right - left)
        top = _belly(left) - 1
        # §7: 2-3 px of hide across, lit on the LEADING (left) edge with 1 px
        # of `umber@0` behind it. The gaps either side are 2-4 px and they are
        # background, not shade -- §9.8, painting them warm and dark closes
        # the silhouette and loses every leg.
        canvas.rect(left, top, width, ground - top, hide)
        canvas.vline(left, top, ground - top, lit)
        # Hooves are 3-4 px wide, 2-3 px tall, and NOT pure black: the near
        # ones catch a little road bounce.
        canvas.rect(left, ground - 2, width + 1, 2, hoof)


def _marks(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The four bridle sparks and the mane, which are unequal on purpose.

    §9.12: L 85 on the near horse, L 61 on the middle, NOTHING AT ALL on the
    far one. Giving all three heads a spark flattens the depth stagger;
    removing them merges three heads into one.
    """
    mane = ctx.ink("horse_mane")
    # §3.12: from the poll at (177, 84) up to the withers at (194, 75).
    for peak in MANE_PEAKS:
        top = 84 - int(round((peak - 177) * 9 / 17))
        canvas.vline(peak, top, 3, mane)

    lift_b = ctx.graze[0] * GRAZE_LIFT if ctx.graze else 0
    lift_a = ctx.graze[1] * GRAZE_LIFT if len(ctx.graze) > 1 else 0

    bx, by, bwidth, bheight = layout.HORSE_B_BRIDLE
    canvas.rect(bx, by - lift_b, bwidth, bheight, ctx.ink("horse_mane"))
    canvas.put(163, 92 - lift_b, ctx.ink("horse_mane", -1))

    ax, ay, awidth, aheight = layout.HORSE_A_BRIDLE
    canvas.rect(ax, ay - lift_a, awidth, aheight, ctx.ink("horse_hide_mid", 2))
    canvas.rect(ax + 1, ay + 4 - lift_a, 2, 3, ctx.ink("bridle_spark"))
    canvas.put(172, 92 - lift_a, ctx.ink("horse_mane"))
    canvas.put(176, 92 - lift_a, ctx.ink("horse_mane", -1))


def _tack(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§3.21-23. One straight row, one cool fleck, two hue lines.

    The pole is the flattest lit row in the barrel and THE ONLY STRAIGHT LINE
    INSIDE THE ANIMALS — it is what says "hitched to something" rather than
    "standing loose". In image A it is a timber bar with a brass ferrule; at
    320×144 it is one row and it must stay one row.
    """
    px, py, plength = layout.POLE_ROW
    canvas.hline(px, py, plength, ctx.ink("horse_mane", -1))

    tx, ty, twidth, theight = layout.TERRET
    canvas.rect(tx, ty, twidth, theight, ctx.ink("horse_rim", 1))

    # §9.6: the traces are L 25.9 against a sky of L 23.6 — a difference of
    # nothing. They are a HUE LINE, not a value line, for their whole run,
    # and they only go bright in the last 3 px at the driver's hands. A
    # bright rein across the sky becomes the most legible object in the frame
    # and steals the read from the coach lamp.
    thread = ctx.ink("horse_hide_shadow", 3)
    for (x0, y0), (x1, y1) in (layout.TRACE_1, layout.TRACE_2):
        canvas.line(x0, y0, x1, y1, thread)


def _cast_shadow(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§3.24. ONE pooled shadow. There are no per-leg shadows.

    The road's own family darkened, not a grey wash, and its front edge is
    broken and stippled rather than a line.
    """
    x0, y0, width, height = layout.TEAM_SHADOW
    ctx.shield_rect(x0, y0, width, height)
    for y in range(y0, y0 + height):
        for x in range(x0, x0 + width):
            if y >= y0 + height - 2 and (x * 5 + y * 3) % 4 == 0:
                continue
            canvas.put(x, y, ctx.palette.darken(canvas.get(x, y), 3))
