"""Room 1 — the road surface. GRAYBOX.

Thirty-five per cent of the play area, and it has ONE job: read as a floor
going away from the viewer, a surface a character is standing *on* rather
than in front of. road.md §1 is unambiguous that there is exactly one
structure in the region that does the receding and it is the rut fan; the
mud, the stones and the water are dressing hung on it. If the fan is wrong
the region fails whatever else is right, and it fails at the legibility
gate, not at lighting.

THE FAN, in three numbers, all from §3:

  1. EVERY RUT HEADS FOR (316, 82). Twelve rows above the top of the band
     and off the region entirely. Fitting 48 high-coherence orientation
     samples gives (315.9, 82.1) at 6.9° residual; fitting each traced rut
     as a chord and extending it independently gives a median of 307. The
     two agree. layout carries the point as RUT_VANISHING because the whole
     lower third of the frame recedes at that rate and nothing else may
     disagree with it.
  2. SPACING SCALES WITH (y − 82). An 18 px gap at the bottom edge is 7 px
     at y=106 and 4 px at y=96. That is layout.depth_scale, and it is why
     the rut widths here taper.
  3. THE STARTS ARE IRREGULAR ON PURPOSE. Median 18 px, range 8-31. The
     tight pairs (238/246, 257/269) read as one cart having passed twice;
     evenly-spaced ruts read as corduroy.

AND THEY BOW. Push each chord's midpoint 3% of its length toward the
bottom-left. That is 2-4 px on a 90-130 px rut, it is small, and §3.1 calls
it "the entire difference between a curving road and a fan of stripes".
Pleasingly the chord length cancels out of the arithmetic, so the sagitta
is one constant for every ordinary rut.

THE TWO OUTERMOST RUTS ARE NOT ORDINARY. They wrap an elbow at (272, 112) —
where the road turns behind the coach — and past it their tangent reverses
sign. §3.1 calls this the most distinctive shape in the region.

THE ROAD GETS DARKER TOWARD THE VIEWER, not lighter: L(y) = 75.4 − 0.291y,
a fall of 10.8 across the band, about two ramp steps, and gentle. It is not
what makes the region recede. It is the fan.

AUTHORED WARM, ALL OF IT, from the start. The lantern pool spans x 50-122
with a lit fringe to x=175 and the lighting pass cannot change hue. §7 of
the whole-frame study: a grey road cannot be made warm afterwards and the
failure only shows up three passes from its cause. The two exceptions are
declared and both are cold on purpose — the left verge below y=118, which
is stone and shadow and outside the pool, and the standing water.

THE WATER IS THE RESERVED BAND, and the band moved today. road.md §5.1 still
says `sky` 7-9 (indices 152-154) and §5.4 spends a page explaining why that
cannot work: at L 107/115/123 against a rebuilt road at L 32-40 the water
reads as chalk lines, 66 L above the measured 50. The spec declined to
change the declaration itself and asked for a ruling. The ruling landed:
content/rooms/stage-road.json now declares accent_indigo 2-4 (239-241, L
44/61/74), which is what §5.4 nominated, and layout derives PUDDLE_BAND from
that declaration rather than from any number typed here. Everything else in
§5 stands unchanged, including the bounds — no reserved index above y=95.

DEFERRED to the region author:
  - §3.4's angle table. The straight-to-the-point construction is accurate
    to about 3° in the near half and 7° at worst; the tabulated rotation
    from −9° at x=104 to −69° at x=296 has not been checked column by column.
  - §3.5's cross-section. Crest and trough are one flat step each here;
    measured, the crest is a 4-6 px plateau sitting 3-4 px to the far side
    and the trough has a 2.5 px half-depth width.
  - §9's grain: 3-4 px wide, 1 px tall dashes, horizontally biased, scaling
    with LIGHT and not with depth. None of it is drawn.
  - §3.5's rule that rut contrast triples inside the lamp pool.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: road.md §8: the top edge of the region is NOT a boundary in the picture.
#: The ground plane runs up past y=94 and is occluded by what stands on it.
#:
#: THE FIELD AND THE FAN STOP AT DIFFERENT ROWS, and the split is what §8
#: actually asks for. The FAN is authored from six rows above the seam so
#: the rut spacing is continuous across it; a fan that begins at y=94
#: announces the region boundary. The FIELD stops at the region's own top
#: row, because §4.1's model is fitted on the ROAD SURFACE and extrapolating
#: it upward into the mid ground laid a straight bright horizontal across the
#: full width at y=88. `terrain` ramps up to meet it instead, which is the
#: same continuity written from the other side of the seam.
FIELD_TOP = layout.ROAD_TOP
FAN_TOP = 88

#: §3.1. Ordinary ruts bow 3% of chord toward the near side; the two
#: outermost bow 15-23% and wrap the elbow instead.
BOW = 0.03
OUTER_RUTS = (283, 305)

#: §3.6. Left of this is verge, not road, and it carries no ruts at all.
#: Right of ROAD_RIGHT_EDGE is a flatter, stonier verge on the far side.
NO_RUTS_LEFT = layout.ROAD_LEFT_EDGE

#: §5.3. The pool's bright core carries no water at all. Dry.
DRY_CORE = (70, 100, 48, 18)

#: §5.1. The element's bounds start at y=96, and in practice the water is
#: all at y >= 104 where the road proper begins. A reserved index above that
#: is silently clamped by cycling.reserve(), leaving a hole in the streak.
WATER_TOP = 104

#: §5.2, descending. 42 streaks of 4 px or more, median 10, mean 26. The two
#: largest are chains of segments along a single rut spanning 60-80 px of x.
STREAK_SIZES = (210, 153, 84, 73, 72, 52, 34, 34, 30, 30, 30, 24, 23, 23, 22,
                20, 18, 17, 15, 14, 13, 12, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6,
                6, 6, 5, 5, 5, 5, 4, 4, 4, 4)


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    _field(canvas, ctx)
    _fan(canvas, ctx)
    _verge(canvas, ctx)
    _stones(canvas, ctx)
    _water(canvas, ctx)


# ---------------------------------------------------------------------------
# the value field
# ---------------------------------------------------------------------------


def _field(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§4.1's depth gradient, flat and untextured. Everything else modulates it."""
    ramp = ctx.ramp("dry_mud")
    palette = ctx.palette
    for y in range(FIELD_TOP, layout.HEIGHT):
        step = _nearest(palette, ramp, layout.road_luminance(y))
        canvas.hline(0, y, layout.WIDTH, ramp.at(step))


def _nearest(palette, ramp, target: float) -> int:
    best, gap = 0, None
    for step in range(ramp.count):
        distance = abs(palette.luminance(ramp.at(step)) - target)
        if gap is None or distance < gap:
            best, gap = step, distance
    return best


# ---------------------------------------------------------------------------
# the rut fan
# ---------------------------------------------------------------------------


def _rut_path(start_x: int) -> dict[int, float]:
    """Column of a rut at each row, from the bottom edge up to FAN_TOP.

    ORDINARY RUTS are the straight line to (316, 82) with a parabolic bow.
    The sagitta is 3% of the chord and the perpendicular's x-component is
    −61/|d|, so the chord length cancels and the whole bow is one constant:
    4·t·(1−t)·0.03·61 pixels of leftward push, peaking under 2 px at the
    midpoint. Small, and §3.1 says it is everything.

    THE TWO OUTERMOST are drawn as two straight runs meeting at the elbow at
    (272, 112) rather than as a bow, because a bow cannot reverse a tangent
    and §3.1's whole point about them is that theirs reverses. The measured
    angles either side of the elbow (−55° below it, +40° above) are §3.4's
    and are DEFERRED — what is drawn here is the elbow's position and the
    reversal, not its exact slopes.
    """
    vanish_x, vanish_y = layout.RUT_VANISHING
    bottom = layout.HEIGHT - 1
    path: dict[int, float] = {}

    if start_x in OUTER_RUTS:
        elbow_x, elbow_y = layout.RUT_ELBOW
        for y in range(FAN_TOP, bottom + 1):
            if y >= elbow_y:
                t = (bottom - y) / max(1, bottom - elbow_y)
                path[y] = start_x + (elbow_x - start_x) * t
            else:
                t = (elbow_y - y) / max(1, elbow_y - vanish_y)
                path[y] = elbow_x + (vanish_x - elbow_x) * t
        return path

    span = bottom - vanish_y
    for y in range(FAN_TOP, bottom + 1):
        t = (bottom - y) / span
        straight = start_x + (vanish_x - start_x) * t
        path[y] = straight - 4.0 * t * (1.0 - t) * BOW * span
    return path


def _fan(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    trough = ctx.ink("dry_mud", -2)
    trough_faint = ctx.ink("dry_mud", -1)
    crest = ctx.ink("dry_mud", 1)

    for start_x in layout.RUT_STARTS:
        _draw_rut(canvas, _rut_path(start_x), trough, crest, strong=True)
    # §3.2: four faint intermediates, half strength, and only because the fan
    # would otherwise look sparse across the left half.
    for start_x in layout.RUT_STARTS_FAINT:
        _draw_rut(canvas, _rut_path(start_x), trough_faint, crest, strong=False)


def _draw_rut(canvas: IndexedCanvas, path: dict[int, float],
              trough: int, crest: int, strong: bool) -> None:
    for y, exact in path.items():
        x = int(round(exact))
        if x < NO_RUTS_LEFT or x > layout.ROAD_RIGHT_EDGE:
            continue
        # §3.5: trough 3 px wide near, 2 px at mid-depth, 1 px at the top of
        # the band. layout.depth_scale is the one function every receding
        # thing in this frame divides by, so nine regions recede together.
        width = 1 + int(round(2 * layout.depth_scale(y)))
        canvas.rect(x, y, width, 1, trough)
        if not strong:
            continue
        # §3.5: the crest sits 3-4 px to the FAR side of the trough. It is
        # the lit shoulder of the rut and it is what stops the fan reading as
        # a set of dark scratches.
        canvas.rect(x - 3 - width, y, width + 1, 1, crest)


# ---------------------------------------------------------------------------
# the verges
# ---------------------------------------------------------------------------


def _verge(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§4.3's third falloff: the bottom-left corner, pulled to L 14-24.

    A wedge, not a rectangle. It is the shadowed verge under the building and
    it is one of only two places on this ground plane authored COLD — it sits
    outside the lantern's reach entirely, so nothing is lost by it, and §6
    measures it at `grey` 0-1 with saturation almost gone.
    """
    dark = ctx.ink("verge_mud")
    edge = ctx.ink("verge_mud", 1)
    x0, y0, width, height = layout.VERGE_FALLOFF
    for y in range(y0, min(y0 + height, layout.HEIGHT)):
        # The wedge deepens downward and reaches further right as it comes
        # forward, which is what a shadow cast by something off-frame does.
        reach = width * (0.55 + 0.45 * (y - y0) / max(1, height - 1))
        for x in range(x0, int(x0 + reach)):
            canvas.put(x, y, dark if x < reach - 8 else edge)


# ---------------------------------------------------------------------------
# stones
# ---------------------------------------------------------------------------


def _stones(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§7. Half-buried, always wider than tall, and grey rather than brown.

    What makes a stone at 4×2 px is the 1 px pale top edge and the drop in
    CHROMA — saturation 0.20 against the mud's 0.48. A brown blob 8 L lighter
    than the mud is a light patch of mud, which is §10.7's failure.
    """
    rng = ctx.stream("road.stones")
    body = ctx.ink("stone")
    seat = ctx.ink("stone", -2)

    def stone(x: int, y: int, width: int, height: int, verge: bool) -> None:
        canvas.rect(x, y, width, height, body)
        # In the far-left verge the top edge measures L 30-40 against mud at
        # 20-26, not the L 53 it reaches out in the mid road. One step down.
        canvas.hline(x, y - 1, width, ctx.ink("stone_top", -1 if verge else 0))
        canvas.hline(x, y + height, width, seat)

    # §7: heavily front-loaded to the left — 14 of 31 in x 0-39. Dense enough
    # to read as a stony verge.
    for _ in range(14):
        x = rng.randrange(2, 40)
        y = rng.randrange(120, layout.HEIGHT - 3)
        stone(x, y, 3 + rng.randrange(6), 1 + rng.randrange(3), verge=True)
    for _ in range(4):
        x = rng.randrange(40, 78)
        y = rng.randrange(120, layout.HEIGHT - 3)
        stone(x, y, 3 + rng.randrange(4), 1 + rng.randrange(2), verge=True)
    # §7: the mid-road singles are lone cobbles kicked out of the ruts and
    # they should stay lonely.
    for _ in range(11):
        x = rng.randrange(90, 260)
        y = rng.randrange(112, layout.HEIGHT - 3)
        stone(x, y, 3 + rng.randrange(3), 1 + rng.randrange(2), verge=False)
    for _ in range(2):
        stone(302 + rng.randrange(14), 118 + rng.randrange(20),
              4 + rng.randrange(4), 2, verge=True)


# ---------------------------------------------------------------------------
# standing water -- the reserved band, and nothing else in the frame
# ---------------------------------------------------------------------------


def _water(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§5. In the troughs, following the rut's curve, 1-2 px wide.

    EACH STREAK TAKES A DIFFERENT ONE OF THE THREE reserved indices in turn.
    One rotation then shows each streak at a different point in the cycle,
    which is where the per-puddle phase offset comes from at no extra palette
    cost. That is how the technique did it in 1990 and it is why the element
    declares three entries rather than one.

    §5.2 asks for the two largest streaks to be hand-placed on DIFFERENT
    indices: a straight round-robin puts 217 / 466 / 418 pixels on the three,
    which is lopsided enough that one third of the shimmer visibly out-masses
    the others. Here the two longest ruts take band entries 0 and 1.
    """
    rng = ctx.stream("road.water")
    band = layout.PUDDLE_BAND
    dry_x, dry_y, dry_w, dry_h = DRY_CORE
    bounds_x, bounds_y, bounds_w, bounds_h = layout.PUDDLE_BOUNDS

    # §5.3's two chains first, on different indices, along the two ruts that
    # carry them: x 96-157 / y 119-139 and x 150-230 / y 122-143.
    plan = [(117, 119, 139, band[0]), (200, 122, 143, band[1])]
    for position, size in enumerate(STREAK_SIZES[2:]):
        start = layout.RUT_STARTS[(position * 3 + 1) % len(layout.RUT_STARTS)]
        # Steep short threads live past the elbow; the long shallow ones live
        # in the near-left of the fan. Length follows the measured tail.
        top = rng.randrange(WATER_TOP, layout.HEIGHT - 6)
        plan.append((start, top, min(layout.HEIGHT - 1, top + max(2, size // 3)),
                     band[(position + 2) % len(band)]))

    for start_x, top, bottom, index in plan:
        path = _rut_path(start_x)
        for y in range(max(top, WATER_TOP), bottom + 1):
            if y not in path:
                continue
            x = int(round(path[y]))
            if x < NO_RUTS_LEFT or x > layout.ROAD_RIGHT_EDGE:
                continue
            if dry_x <= x < dry_x + dry_w and dry_y <= y < dry_y + dry_h:
                continue
            if not (bounds_x <= x < bounds_x + bounds_w
                    and bounds_y <= y < bounds_y + bounds_h):
                continue
            # §9: 1-2 px wide over its whole length. Widening it to 3 turns
            # the road into a river.
            canvas.rect(x, y, 1 + (layout.depth_scale(y) > 0.6), 1, index)

    # §5.3: two or three lone flecks out on the dark left verge — enough to
    # say the ground is wet everywhere, not enough to draw the eye.
    for x, y in ((17, 128), (23, 135), (27, 121)):
        canvas.put(x, y, band[(x + y) % len(band)])
