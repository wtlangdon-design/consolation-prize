"""Room 1 — the stagecoach.

The largest single object in the frame, about 91 × 68 px, and the second
thing the eye reaches after the lantern. coach.md notes that this one region
uses all 54 palette indices the whole 320×144 frame uses, which is why it is
drawn early and the rest of the room calibrates against it.

THE BODY IS NOT SEPARATED FROM THE SKY BY VALUE. §3.1: sky behind the roof
means 26.0, cargo means 36.7 — ELEVEN LUMINANCE POINTS. All the silhouette
work is done by exactly two features, both tiny: one row of ROOF RAIL at
L 47-82, and an 8 × 5 BLACK TRUNK at L 2-16 bitten out of the skyline. One
pale line above, one black notch inside. §10.4 — raise the body's value to
make it "read better" and you get a coach-shaped grey slab, you flatten the
sky the sky region worked to keep at ten indices, and the rail stops being a
line and becomes a bevel.

THE HORIZONTAL BANDING IS THE STRUCTURE (§3.2), and it survives at any size:

    cargo 31-36 → RAIL 46.8 → deck 26-31 → CORNICE SHADOW 16.9 →
    moulding 31.0 → upper panel 21-35 → WINDOW BAND 13.5-19.4 →
    the event band (lamps, faces, neckcloth) → lower panels 20-33 →
    UNDERCARRIAGE SHADOW 16-19 → wheels over road 21-27

Light, dark, mid, dark, the bright events, mid, dark. Six alternations in
forty rows, and getting that ladder right is what makes the coach legible
before a single texture pixel is laid.

THE RAIL'S FALLOFF IS THE LIGHT DIRECTION (§5.5). It is NOT flat: L 82 at
x 239-240 down to 26 at x=279, 56 points across 41 pixels. That gradient,
plus the rear quarter panel at Lmed 12.1 against the front quarter's 31.1,
is the entire statement that the warm key comes from the LEFT — from the
lantern and the town.

TWO KEYS, TWO TEMPERATURES, TWO DIRECTIONS. The warm key is from the left.
The COOL key is from up and to the right, and it is the rear wheel rim's
30°-60° peak, the fence and the road ruts. §10.11: drift warm and the wheels
stop separating from the road; drift cool and the coach stops being wood.

THE WHEELS ARE DRAWN TO DIFFERENT RULES, and §5.1 calls this the single most
misdrawn thing in the region. The rear one IS a wheel: two-pixel rim,
brightest upper-right, twelve one-pixel spokes at Δ24 L — not full contrast,
and broken, resolving only outside radius 5. THE FRONT ONE IS NOT A WHEEL.
It is an arc in the 90°-190° sector and nothing else; its right half is
simply absent, lost into the undercarriage. And it reads only because of a
hard dark column immediately inside it at x=228 — rim at 45-60 against
shadow at 9-15, A 40-POINT DROP ACROSS ONE PIXEL. Draw the arc without the
dark column and it becomes a scratch.

THE LAMPS ARE BINDING (§7). Both top out at `ochre[13]` and STOP THERE.
Three pixels for lamp A, two for lamp B, one ring of `ochre[8]`, one
transitional ring, then straight into the doorway's void. No bloom on the
surrounding panels — the reference throws none. No cycling: these sit on an
object that departs, so animating them would make the coach's state readable
as motion. `accent_gold` does not appear in this region at all.

THERE IS NO DITHER HERE (§5.2). Measured ABAB rates in the bar top out at
11% on the boot canvas and sit at 1-6% everywhere else: those are noise
floors, not patterns. The reference gets its gradation from 208 distinct
colours quantising into 54 indices, and our job is to reproduce that read
with ramp steps. The kegs and the boot carry an irregular seeded mottle,
which is a material and not a gradient — no ordered matrix touches this
region, because at a 3-4× integer upscale a checker across an 18 × 22 boot
face shimmers, and because the coach is a removable layer and a dither keyed
to the background behind it tears when the coach departs.

THE COACH IS AN OBJECT STATE, NOT BACKGROUND ART (§8, errata 31d). The fence
and the keg stack are BACKGROUND and are drawn whether or not the coach is
present — §8.2 requires them complete under the boot. Two seams this file
must not break: the 4-pixel gap of unobstructed moonlit road at x 222-225
between the nearest horse's rear and the front wheel's arc, which is the
reason the coach and the team can be separate layers at all; and the
strongbox's top edge, which has only road behind it.
"""

from __future__ import annotations

import math

from canvas import IndexedCanvas
from palette import Palette
from primitives import ellipse_points

from . import layout


# ---------------------------------------------------------------------------
# The region's inks
# ---------------------------------------------------------------------------
#
# Name -> (palette family, ramp step), in the shape layout.MATERIALS uses,
# with the measured luminance each stands in for. §4 governs the families and
# it is three rules:
#
#   `ochre` IS THE LAMP FAMILY AND NOTHING ELSE — the two lamp cores, the two
#   faces, the neckcloth, the lit hand. If ochre turns up in a body panel the
#   panel is being lit by something that is not there.
#
#   `grey` IS THE COOL FAMILY AND IT DOES ALL THE TEMPERATURE WORK — wheel
#   tyres, both men's lower halves, the fence, the kegs. It never appears in
#   a body panel.
#
#   `accent_indigo[0]` IS THE SKY, and it is allowed to show THROUGH the
#   cargo in the gaps between lashed bundles. That is the one place a
#   background family belongs inside the object silhouette, and it is why the
#   cargo's top edge reads lumpy rather than solid.

INKS: dict[str, tuple[str, int]] = {
    # -- the rear boot. §2.4: 23 indices, the flattest large element here.
    #    `mud[0..2]` is 66% of it and §10.8 says straps at readable contrast
    #    turn the tail of the coach into the busiest object in the frame.
    "boot_body": ("mud", 1),            # L 18; the flat slab
    "boot_face": ("mud", 2),            # L 23; measured face mean 18-24
    "boot_top": ("mud", 4),             # L 35; lit top edge, y 56-57
    "boot_top_hot": ("mud", 8),         # L 55; x 289-291 only
    "boot_corner": ("mud", 6),          # L 44; the lit left column x=291
    "boot_corner_dim": ("mud", 3),      # L 27; x=290 beside it
    "boot_strap": ("mud", 3),           # L 27; banding at ~6 L and no more
    "boot_shelf": ("mud", 2),           # L 23; the one lighter row at y=78
    "brass": ("umber", 8),              # L 56; layout `brass`. ONE pixel.

    # -- the rear quarter. §2.6, the darkest large panel in the coach:
    #    Lmed 12.1, 41% mud[0], 26% umber[0], 10% void[0]. The body goes to
    #    near-black at its rear because the warm key is on the left.
    "rear_dark": ("mud", 0),            # L 13; layout `coach_body_rear`
    "rear_darkest": ("umber", 0),       # L 9
    "rear_edge": ("mud", 3),            # L 27; x=279, the last lit column
    "rear_edge_lit": ("mud", 5),        # L 39; x=278

    # -- the body shell. §4: front panels are mud[0..5] + pine_fresh[0..3],
    #    a dark red-brown mahogany, Lmed 31.
    "body": ("mud", 3),                 # L 27; layout `coach_body`
    "body_dark": ("mud", 2),            # L 23
    "body_lit": ("mud", 5),             # L 39
    "belt": ("mud", 4),                 # L 35; the moulding row y=54
    "cornice_shadow": ("mud", 0),       # L 13; the darkest upper row, y=53
    "deck": ("mud", 3),                 # L 27; roof deck y 50-51
    "undercarriage": ("umber", 1),      # L 14; rows 81-85, inside the body

    # -- the front corner post. §2.8: one pixel wide, 23 rows, the coach's
    #    leading edge taking the warm key, and the second most important
    #    vertical in the region.
    "post_hot": ("mud", 10),            # L 66; its brightest rows
    "post_lit": ("mud", 7),             # L 50; the sustained value
    "post_mid": ("mud", 5),             # L 39
    "post_dim": ("mud", 2),             # L 23; x=237, the dimmer support

    # -- the front quarter opening. §2.9: a dark recess with a dead-black
    #    column at x=239. NOT a glazed window — no frame, no glass event,
    #    nothing but a hole.
    "recess": ("umber", 1),             # L 14
    "recess_black": ("void", 0),        # x=239
    "sill_lit": ("mud", 8),             # L 55; the lit head of the opening

    # -- the door pillar. Four columns: lit, shadow, face, dark reveal.
    "pillar_lit": ("mud", 5),           # L 39; x=248, measured mean 35
    "pillar_shadow": ("umber", 2),      # L 18; x=249 and x=251
    "pillar_face": ("mud", 3),          # L 27; x=250
    "pillar_reveal": ("umber", 2),      # L 18; x 252-253

    # -- the doorway. §3.4: Lmed 2.6, 60% void, and its left edge dead
    #    vertical at x=254 for 22 unbroken rows.
    "void": ("void", 0),                # layout `coach_void`
    "void_warm": ("umber", 0),          # L 9; the 22% that is not void

    # -- the two interior lamps. §7.2: exactly two steps, one ring, one
    #    transitional ring, then straight into the void.
    "lamp_core": ("ochre", 13),         # L 126; layout `coach_lamp`. AND IT STOPS.
    "lamp_ring": ("ochre", 8),          # L 85; layout `coach_lamp_ring`
    "lamp_fringe": ("pine_fresh", 4),   # L 63; the single transitional ring
    "lamp_spill": ("pine_fresh", 2),    # L 45; the last pixel before void

    # -- the door leaf, swung open toward us so it reads nearly face-on.
    "leaf": ("mud", 3),                 # L 27; lower panel, Lmed 28.5
    "leaf_dark": ("mud", 1),            # L 18
    "leaf_frame": ("mud", 8),           # L 55; the lit hinge column x=266
    "leaf_frame_hot": ("mud", 11),      # L 73; its top third
    "leaf_edge": ("mud", 5),            # L 39; the far stile x=278
    "glass": ("umber", 0),              # L 9; the window's dark
    "glass_black": ("void", 0),         # x 268-269, darkest and full height
    "moulding": ("mud", 9),             # L 61; the kick moulding, y=75
    "scroll": ("mud", 8),               # L 55; §2.13d — a SMUDGE, not a curl

    # -- the roof cargo. §4: sacking and canvas.
    "cargo": ("pine_fresh", 1),         # L 37; layout `coach_cargo`
    "cargo_dim": ("pine_fresh", 0),     # L 28
    "cargo_dark": ("umber", 2),         # L 18
    "cargo_gap": ("accent_indigo", 0),  # L 22; THE SKY, showing through
    "crate_hot": ("dust", 8),           # L 83; the crest, five pixels
    "crate_lit": ("mud", 9),            # L 61
    "bundle_lit": ("mud", 9),           # L 61; the partial second row at y=48
    "trunk": ("void", 0),               # §2.18b, and it is a hole
    "trunk_edge": ("umber", 0),         # L 9

    # -- the driver. §2.23. Warm coat over COOL trousers, and §3.6 says take
    #    the temperature split out and both men dissolve into the coach.
    "hat": ("mud", 4),                  # L 35; crown
    "hat_lit": ("mud", 8),              # L 55; its lit front corner
    "brim": ("mud", 0),                 # L 13
    "face": ("ochre", 9),               # L 93
    "face_hot": ("ochre", 13),          # L 126; two pixels
    "face_mid": ("ochre", 6),           # L 69
    "moustache": ("umber", 1),          # L 14; THREE PIXELS at y=47
    "driver_coat": ("pine_fresh", 1),   # L 37; §4, Lmed 38.2 — WARM
    "driver_coat_lit": ("mud", 7),      # L 50
    "driver_coat_dark": ("mud", 2),     # L 23
    "hand": ("ochre", 6),               # L 69
    "hand_hot": ("ochre", 9),           # L 93
    "trouser": ("grey", 1),             # L 25; §4, Lmed 24.4 — COOL
    "trouser_lit": ("grey", 3),         # L 41
    "trouser_dark": ("grey", 0),        # L 16
    "leather": ("umber", 0),            # L 9; boots

    # -- the standing man. §2.24. COOL coat against WARM body panels.
    "felt": ("grey", 0),                # L 16; the hat, near-black at L 2-24
    "felt_dark": ("umber", 0),          # L 9
    "coat": ("grey", 1),                # L 25; §4, Lmed 30.5 — COOL
    "coat_lit": ("grey", 3),            # L 41
    "coat_dark": ("grey", 0),           # L 16
    "legs": ("umber", 1),               # L 14; §4, Lmed 22

    # -- running gear. §4: iron is grey[0..3] highlighting to dust; the
    #    spokes are wood and stay warm.
    "tyre": ("grey", 2),                # L 33; layout `coach_iron`
    "tyre_cool": ("grey", 5),           # L 62; the right flank, sky-lit
    "tyre_cool_dim": ("grey", 4),       # L 54; its inner ring
    "tyre_lit": ("dust", 5),            # L 61; the 35-70 degree corner ONLY
    "tyre_top": ("pine_weathered", 6),  # L 59; the crown, warm-neutral
    "tyre_top_dim": ("dust", 3),        # L 46
    "tyre_left": ("mud", 6),            # L 44; measured 40-44 at 180 degrees
    "tyre_left_dim": ("mud", 5),        # L 39
    "tyre_foot": ("mud", 6),            # L 44; sampled 43-63 across the bottom
    "tyre_foot_lit": ("grey", 4),       # L 53; the near-side contact quarter
    "spoke": ("mud", 7),                # L 49; measured 38-52 against the disc
    # The disc is not black. Sampled inside r=8 the bar's median is 26 and
    # ours was 18 — eight luminance points of the wheel reading as a hole in
    # the road rather than as the far felloe and the daylight-side of the
    # nave. §5.1's twenty-four-point spoke separation is measured FROM HERE,
    # so raising the field and the spoke together keeps the step and fixes
    # the mass.
    "disc": ("umber", 3),               # L 25; the interior the spokes sit in
    "hub": ("mud", 4),                  # L 35
    "hub_core": ("umber", 1),           # L 14; the darker centre
    "axle": ("mud", 6),                 # L 44; y 95-96, right past the rim
    "arc_cool": ("grey", 5),            # L 62; the front wheel's upper arc
    "arc_warm": ("pine_weathered", 6),  # L 59; its left flank
    "arc_shadow": ("umber", 0),         # L 9; x=228. THE REASON THE ARC READS.
    "step": ("mud", 7),                 # L 50
    "step_hot": ("mud", 9),             # L 61

    # -- in front, and on the ground.
    "box": ("mud", 2),                  # L 23; the strongbox's flat face
    "box_lid": ("mud", 6),              # L 44
    "box_lid_hot": ("mud", 10),         # L 66; two pixels
    "box_lock": ("mud", 8),             # L 55; ONE warm pixel at (228, 101)
    "contact": ("umber", 0),            # L 9
    "contact_soft": ("umber", 1),       # L 14

    # -- background: the fence and the kegs. COOL, and they stay behind.
    "fence_rail": ("grey", 2),          # L 33
    "fence_post": ("umber", 3),         # L 26
    "keg": ("umber", 3),                # L 26; Lmed 24.6
    "keg_dark": ("umber", 1),           # L 14; p10 13.1
    "keg_lit": ("umber", 4),            # L 30; p90 31.6 AND NO HIGHER
    "keg_cool": ("grey", 1),            # L 25
    "keg_stave": ("pine_weathered", 0),  # L 21

    # -- the reins. §6: drawn, but at L 22-32 over a sky of 21-35. They read
    #    as texture, not as lines, and they belong to the COACH layer.
    "rein": ("umber", 4),               # L 30
}

#: The eight inks the shared table also names. Duplicated deliberately — the
#: local table is what this file reads, so if `layout` ever moves one of them
#: the mismatch has to be loud rather than a colour that quietly disagrees
#: with the neighbour drawing against it.
_SHARED_AS = {
    "body": "coach_body",
    "rear_dark": "coach_body_rear",
    "cargo": "coach_cargo",
    "tyre": "coach_iron",
    "void": "coach_void",
    "brass": "brass",
    "lamp_core": "coach_lamp",
    "lamp_ring": "coach_lamp_ring",
}

for _name, _shared in _SHARED_AS.items():
    if INKS[_name] != layout.MATERIALS[_shared]:
        raise RuntimeError(
            f"coach ink {_name!r} is {INKS[_name]} but layout "
            f"{_shared!r} says {layout.MATERIALS[_shared]}")
del _name, _shared


# ---------------------------------------------------------------------------
# Geometry, all of it measured off the bar
# ---------------------------------------------------------------------------

#: §2.17 and §5.5. The rail is ONE ROW and it is NOT FLAT: L 82 at x 239-240
#: falling monotonically to 26 at x=279. That falloff IS the light direction,
#: and drawing it at a constant value costs the coach its light source.
#:
#: AND IT IS NOT A STRAIGHT LINE EITHER. Measured column by column on the bar,
#: row 49 drops 82 -> 58 in the first seven pixels, then holds a long plateau
#: at 47-56 across the middle twenty, then falls away to 26. A ruled line from
#: 82 to 26 runs SEVENTEEN luminance points hot at x 243-256 and its row mean
#: comes out at 52.5 against the measured 46.8 -- which is the difference
#: between a rail lit from the left and a rail lit from everywhere. The
#: control points below are the monotone envelope of the measurement.
RAIL_PROFILE = ((239, 82.0), (242, 68.0), (246, 58.0), (252, 52.0),
                (259, 47.0), (263, 40.0), (270, 35.0), (275, 32.0),
                (279, 26.0))

#: §2.14. The deck's bottom row carries the same left key the rail does, but
#: it dies much faster: measured 58 at x=238, 40 by x=242, 28 by x=256 and 12
#: at x=279. Fitted as a halving length rather than a line, because a line
#: from 58 to 12 runs fourteen luminance points hot across the middle third
#: and turns a cornice into a bevel.
DECK_EDGE_L = 58.0
DECK_EDGE_FLOOR = 12.0
DECK_EDGE_HALF = 11.0

#: §2.18. The cargo's top edge undulates, and this is where. Measured as the
#: topmost row above sky per column, x 239 through the rear bundles at 292.
#: Piecewise-linear between control points, exactly as `layout` does the
#: mountain crests: rounding a shallow line produces the measured cadence by
#: itself and no noise is wanted.
CARGO_CREST = ((239, 47), (241, 45), (244, 44), (248, 43), (255, 43),
               (256, 44), (275, 44), (276, 46), (279, 46), (280, 48),
               (292, 48))

#: §2.6. The body's panels stop here and the rear quarter takes over at
#: near-black. Measured: x 278-279 sit at L 23-38 and x 280-285 at L 9-12,
#: a six-column drop that is the reason the boot beyond it reads as a
#: separate object lashed on rather than as more coach.
BODY_RIGHT = 279

#: §5.1. Twelve spokes at ~30° pitch, one pixel wide, and they only
#: physically separate outside r≈5 — inside that the pitch is under 2.5 px
#: and the reference LETS THEM MERGE rather than fighting it.
SPOKES = 12
SPOKE_INNER = 5.0

#: §5.1 and §3.3. The rim's colour and value by angle, degrees measured
#: anticlockwise from the three o'clock position with screen-up positive.
#: Sampled around the annulus: the right flank quantises into `grey`, the
#: crown into `pine_weathered` / `dust`, the left into `mud`, and the foot
#: sits lowest of all. (upper bound, outer ink, inner ink).
#:
#: AND THE RING IS CONTINUOUS. The earlier version took the foot down to
#: mud[3] at L 27 on the strength of §3.3's "bottoms at 29", but that number
#: is the mean of the whole annulus SECTOR and the annulus includes the disc
#: behind it. Sampled pixel by pixel the bar's tyre never goes below about
#: L 32 anywhere on the circle and runs 43-63 across the bottom — so what the
#: reference actually has is an unbroken bright ring that varies by twenty
#: luminance points, not a ring that disappears for a quarter of its length.
#: A wheel whose rim dies at the bottom does not read as a wheel; it reads as
#: an arc with some sticks under it, which is the front wheel's job.
RIM_BANDS = (
    (35.0, "tyre_cool", "tyre_cool_dim"),     # 0-35, the sky-lit right flank
    (70.0, "tyre_lit", "tyre_cool_dim"),      # the bright top-right corner
    (135.0, "tyre_top", "tyre_top_dim"),      # the crown
    (205.0, "tyre_left", "tyre_left_dim"),    # the left, warm and the dimmest
    (255.0, "tyre_foot", "tyre_left_dim"),    # the foot
    (300.0, "tyre_foot_lit", "tyre_top_dim"),  # the near-side contact quarter
    (360.0, "tyre_cool", "tyre_cool_dim"),    # back onto the right flank
)


def _rim_inks(degrees: float) -> tuple[str, str]:
    for limit, outer, inner in RIM_BANDS:
        if degrees < limit:
            return outer, inner
    return RIM_BANDS[-1][1], RIM_BANDS[-1][2]

#: §5.1. The front wheel is an arc in the 90°-190° sector and nothing else.
#: Its right half is absent, lost into the undercarriage, and it has NO
#: SPOKES — polar sampling of its interior finds no angular periodicity.
FRONT_ARC = (90.0, 190.0)


def _cargo_crest(x: int) -> int:
    """The cargo's silhouette row at column x. Piecewise-linear, rounded."""
    for (x0, y0), (x1, y1) in zip(CARGO_CREST, CARGO_CREST[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return int(round(y0 + (y1 - y0) * t))
    return CARGO_CREST[-1][1]


def _ink(ctx: layout.Ctx, name: str, offset: int = 0) -> int:
    """A named ink, optionally stepped along its OWN family.

    Stepping within the family is the only legal way to move a colour here:
    reaching for a naked index, or for a different family at a similar value,
    is how a warm body panel becomes a cool one three passes later.
    """
    family, step = INKS[name]
    return ctx.palette.family(family).at(step + offset)


def _at_luminance(palette: Palette, family: str, target: float) -> int:
    """The step of `family` closest in luminance to a measured value.

    Used only where the drawing is a FITTED FALLOFF rather than a material —
    the roof rail, the deck's lower edge, the wheel rim's angular law. A
    falloff is a line through measurements and wants to land wherever the
    ramp is nearest; a material is a decision and is named in INKS.
    """
    ramp = palette.family(family)
    best, gap = 0, None
    for step in range(ramp.count):
        distance = abs(palette.luminance(ramp.at(step)) - target)
        if gap is None or distance < gap:
            best, gap = step, distance
    return ramp.at(best)


def _falloff_row(canvas: IndexedCanvas, ctx: layout.Ctx, x0: int, x1: int,
                 y: int, family: str, left: float, right: float) -> None:
    """One row whose luminance runs linearly from `left` to `right`."""
    span = max(1, x1 - x0)
    for x in range(x0, x1 + 1):
        target = left + (right - left) * (x - x0) / span
        canvas.put(x, y, _at_luminance(ctx.palette, family, target))


def _profile(points: tuple[tuple[int, float], ...], x: int) -> float:
    """Piecewise-linear through measured control points, exactly as `layout`
    reads the mountain crests. A fitted falloff wants to land wherever the
    measurement puts it, not wherever a straight line would."""
    if x <= points[0][0]:
        return points[0][1]
    for (x0, v0), (x1, v1) in zip(points, points[1:]):
        if x <= x1:
            return v0 + (v1 - v0) * (x - x0) / max(1, x1 - x0)
    return points[-1][1]


def _profile_row(canvas: IndexedCanvas, ctx: layout.Ctx, y: int, family: str,
                 points: tuple[tuple[int, float], ...]) -> None:
    for x in range(points[0][0], points[-1][0] + 1):
        canvas.put(x, y, _at_luminance(ctx.palette, family,
                                       _profile(points, x)))


# ---------------------------------------------------------------------------


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    # §8.2 and §9: the fence and the keg stack are BACKGROUND. The boot
    # occludes them and that background must be complete underneath, so they
    # go down whether or not the vehicle is present.
    _fence(canvas, ctx)
    _kegs(canvas, ctx)
    if not ctx.with_coach:
        return
    # ONE TAGGED OBJECT. A stagecoach is a stagecoach; tagging its boot, its
    # door and its wheels separately would answer errata 32a's question about
    # a vehicle instead of about the composition.
    with ctx.track(canvas, "the coach"):
        _boot(canvas, ctx)
        _rear_underframe(canvas, ctx)
        _shell(canvas, ctx)
        _doorway(canvas, ctx)
        _door_leaf(canvas, ctx)
        _roof(canvas, ctx)
        _driver(canvas, ctx)
        _front_boot(canvas, ctx)
        _rear_wheel(canvas, ctx)
        _front_wheel(canvas, ctx)
        _step_board(canvas, ctx)
        _standing_man(canvas, ctx)
        _strongbox(canvas, ctx)
        _contacts(canvas, ctx)
    ctx.shield_rect(210, 32, 110, 76)


# ---------------------------------------------------------------------------
# Behind the coach
# ---------------------------------------------------------------------------


def _fence(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.2. Two faint rails and one barely-there post. Nothing else survives.

    Lmed 22.0 over the whole thing, p90 33.0. §6 lists the pickets among the
    things the reference chooses not to draw, and at this size that is not a
    simplification — there is no room for them.
    """
    x0, y0, width, height = layout.COACH_FENCE
    right = x0 + width - 1
    # THE ROWS ARE MEASURED, y=68 AND y=74. The lower rail was at y=71, which
    # is the first row of the keg stack — so half the fence was being drawn
    # underneath the kegs and the region had one rail instead of two. On the
    # bar both runs sit at L 29-44 against a backdrop of 16-24: faint, but
    # faint over eighteen pixels is a fence, and one rail is a scratch.
    canvas.hline(x0 + 4, y0 + 6, width - 4, _ink(ctx, "fence_rail", 1))
    canvas.hline(x0 + 4, y0 + 12, width - 4, _ink(ctx, "fence_rail"))
    # One post, and it is the only vertical. The near end is cut by the frame.
    canvas.vline(right - 2, y0, height, _ink(ctx, "fence_post", 1))
    canvas.vline(x0 + 4, y0 + 1, height - 1, _ink(ctx, "fence_post"))


def _kegs(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.3. In image A this is a pyramid of round barrel ends.

    AT 320×144 NOT ONE KEG RESOLVES. It is warm-brown texture at the frame
    edge with a total range of 18 L, and its p90 sits BELOW the coach body's
    median (§10.14). The mottle below is irregular by construction — no
    ordered matrix, because §5.2 measures nothing in this region as dithered
    and a checker here would shimmer at a 4× upscale.
    """
    x0, y0, width, height = layout.COACH_KEGS
    canvas.rect(x0, y0, width, height, _ink(ctx, "keg"))
    rng = ctx.stream("coach kegs")
    inks = (_ink(ctx, "keg_dark"), _ink(ctx, "keg_lit"),
            _ink(ctx, "keg_cool"), _ink(ctx, "keg_stave"),
            _ink(ctx, "keg_dark"), _ink(ctx, "keg"))
    # No courses, no rhythm, no seams. A regular horizontal beat at this
    # scale reads as masonry, and a stack of barrels that reads as anything
    # in particular has already broken §10.14.
    #
    # BUT THE AMPLITUDE IS MEASURED AND IT IS WIDER THAN THIS WAS. The bar's
    # stack runs p10 13.1 to p90 31.6 with pixel extremes of 8 and 44, and
    # ours ran 14 to 29 — two thirds of the range, which at this size is the
    # difference between "a heap of something" and a flat brown wall twenty
    # pixels from the frame edge. §10.14 forbids LEGIBLE kegs, not textured
    # ones, and the region's own p50 stays at 25 either way. The dark specks
    # are the shadowed gaps between barrel ends and the pale ones are their
    # chimes; neither is drawn as a circle and none of them lines up.
    for _ in range(190):
        x = x0 + rng.randrange(width)
        y = y0 + rng.randrange(height)
        canvas.rect(x, y, 1 + (rng.random() < 0.35), 1,
                    inks[rng.randrange(len(inks))])
    for _ in range(64):
        x = x0 + rng.randrange(width)
        y = y0 + rng.randrange(height)
        deep = rng.random() < 0.5
        canvas.rect(x, y, 1 + (rng.random() < 0.4), 1,
                    _ink(ctx, "keg_dark", -1) if deep
                    else _ink(ctx, "keg_lit", 2))


# ---------------------------------------------------------------------------
# The coach — shell
# ---------------------------------------------------------------------------


def _boot(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.4. The strapped trunk on the tail. THREE FEATURES AND NO MORE.

    A lit top edge, a lit left corner, one brass buckle. The face is flat at
    a mean of 18-24 with strap banding at a contrast of about 6 L, and §10.8
    says straps at readable contrast turn the tail of the coach into the
    busiest object in the frame twenty-five pixels from the edge.
    """
    x0, y0, width, height = layout.COACH_BOOT
    right = x0 + width - 1

    # The roof's rear overhang shadows the gap above the boot: measured
    # x 280-305, y 52-55 at L 2-12, and it is what makes the boot sit UNDER
    # the roof rather than beside it.
    canvas.rect(x0 - 6, y0 - 4, width + 6, 4, _ink(ctx, "rear_darkest"))

    canvas.rect(x0, y0, width, height, _ink(ctx, "boot_face"))
    rng = ctx.stream("coach boot")
    for _ in range(70):
        canvas.put(x0 + rng.randrange(width), y0 + rng.randrange(height),
                   _ink(ctx, "boot_body"))

    # THE LID IS THE READ. Two rows across the whole width at L 26-39 — the
    # top face of the trunk seen from very slightly above — over a front face
    # at 12-32. That step is what makes twenty pixels of flat brown a box,
    # and it is worth more than every strap on it.
    canvas.hline(x0, y0, width, _ink(ctx, "boot_body"))
    canvas.hline(x0, y0 + 1, width - 2, _ink(ctx, "boot_top"))
    canvas.hline(x0, y0 + 2, width - 2, _ink(ctx, "boot_top", -1))
    canvas.hline(x0 + 1, y0, 3, _ink(ctx, "boot_top"))
    canvas.put(x0 + 2, y0, _ink(ctx, "boot_top", 1))
    # its lit near corner, three pixels, where the lid meets the left face.
    canvas.hline(x0 + 3, y0 + 1, 2, _ink(ctx, "boot_top_hot"))
    canvas.put(x0 + 5, y0 + 2, _ink(ctx, "boot_top_hot"))

    # The lit left corner: the column x=291 for seventeen rows, mean 25-37
    # with local maxima 46-56. §5.3 lists it among the region's hard edges.
    canvas.vline(x0 + 5, y0 + 2, height - 4, _ink(ctx, "boot_corner"))
    canvas.vline(x0 + 4, y0 + 3, height - 5, _ink(ctx, "boot_corner_dim"))
    for row in (y0 + 3, y0 + 9, y0 + 15):
        canvas.put(x0 + 5, row, _ink(ctx, "boot_top_hot"))

    # Strap banding at ~6 L: two columns, one step, and that is the set.
    canvas.vline(x0 + 8, y0 + 3, height - 5, _ink(ctx, "boot_strap"))
    canvas.vline(x0 + 12, y0 + 3, height - 5, _ink(ctx, "boot_strap"))
    # §5.4. ONE brass buckle, a single pixel, and it is the only thing telling
    # you the straps are straps. It may not be moved to tidy the shape.
    canvas.put(*layout.COACH_BUCKLE, _ink(ctx, "brass", 1))

    # The dark under the boot, then the one lighter shelf row at y=78. The
    # dark stops short of the frame edge: measured, x 300-305 comes back up
    # to L 13-35 below y=80 where the keg stack stands behind it.
    canvas.rect(x0, y0 + height - 4, width, 4, _ink(ctx, "rear_darkest"))
    sx, sy, swidth, _ = layout.COACH_BOOT_SHELF
    canvas.hline(sx, sy, swidth, _ink(ctx, "boot_shelf"))
    canvas.rect(x0, sy + 1, 14, 5, _ink(ctx, "void"))
    canvas.hline(x0, sy + 1, 14, _ink(ctx, "rear_darkest"))
    canvas.put(right, sy, _ink(ctx, "boot_body"))


def _rear_underframe(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The perch and reach carrying the boot back over the rear axle.

    NOT A CAST SHADOW — §10.13 is right that somebody will bake one and this
    is not it. Measured on the bar behind the rear wheel, x 283-299: rows
    84-85 sit at L 8-16 and rows 86-96 at L 8-42 with a median near 20, while
    the open road either side of the coach at the same rows measures 28-32
    and rising. That is a solid object between the viewer and the ground, and
    it goes when the coach goes.

    IT IS ALSO WHAT MAKES THE REAR WHEEL A WHEEL. The tyre's bright quadrant
    is L 55-62; drawn against road at 44 it is a four-step edge and the ring
    dissolves, and drawn against this it is fifteen steps and the ring is the
    first thing you see. §3.3 says the upper-right sector is the only part of
    either wheel that clears its background — it can only do that if there is
    a background dark enough to clear.
    """
    # The near-black immediately under the boot, carried two rows past the
    # shelf's own shadow: measured L 8-16 solid across x 283-297.
    canvas.rect(283, 84, 15, 2, _ink(ctx, "undercarriage"))
    canvas.rect(285, 84, 11, 2, _ink(ctx, "rear_darkest"))

    # Then the reach itself, mottled rather than flat because at this size it
    # is ironwork and daylight between ironwork. No ordered matrix (§5.2):
    # the coach is a removable layer and a dither keyed to the road behind it
    # tears the moment the vehicle leaves.
    rng = ctx.stream("coach underframe")
    canvas.rect(283, 86, 19, 11, _ink(ctx, "undercarriage"))
    for _ in range(150):
        x = 283 + rng.randrange(19)
        y = 86 + rng.randrange(11)
        canvas.put(x, y, _ink(ctx, "undercarriage", rng.randrange(-1, 4)))
    # its lower edge feathers into the road rather than ending on a line.
    for x in range(283, 302):
        canvas.put(x, 97, _ink(ctx, "undercarriage", rng.randrange(0, 3)))
        if rng.random() < 0.45:
            canvas.put(x, 98, _ink(ctx, "undercarriage", 2))


def _shell(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.6-10. The body between the front post and the rear quarter."""
    # -- the rear quarter, §2.6. Lmed 12.1, and it is the darkest large panel
    #    in the coach: the body goes to near-black at its rear because the
    #    warm key is on the left.
    # -- the upper panel, §2.7. Row means climb 31.0 → 21.5 → 25.8 → 31.2 →
    #    35.1: the body's rows are not a ramp and drawing them as one loses
    #    the belt moulding's read. The panel STOPS AT x=279 — the rear
    #    quarter owns everything beyond, and it owns it at near-black.
    ux, uy, _, _ = layout.COACH_UPPER_PANEL
    uwidth = BODY_RIGHT - ux + 1
    canvas.hline(ux, uy + 1, uwidth, _ink(ctx, "body_dark"))
    canvas.hline(ux, uy + 2, uwidth, _ink(ctx, "body_dark"))
    canvas.hline(ux, uy + 3, uwidth, _ink(ctx, "body"))
    canvas.hline(ux, uy + 4, uwidth, _ink(ctx, "belt"))

    # -- the window band, §3.2's darkest body band at 13.5-19.4.
    wx, wy, _, wheight = layout.COACH_WINDOW_BAND
    wwidth = BODY_RIGHT - wx + 1
    canvas.rect(wx, wy, wwidth, wheight, _ink(ctx, "recess"))
    # and the lower panels, 20-33, running down to the undercarriage.
    canvas.rect(wx, wy + wheight, wwidth, 15, _ink(ctx, "body"))
    canvas.rect(wx, 81, wwidth, 5, _ink(ctx, "undercarriage"))

    # -- the rear quarter, §2.6, and it goes on AFTER the panels because it
    #    is where they stop. Lmed 12.1, the darkest large panel in the coach:
    #    the body goes to near-black at its rear because the warm key is on
    #    the left, and that near-black is half of §5.5's statement of the
    #    light direction.
    rx, ry, _, rheight = layout.COACH_REAR_QUARTER
    canvas.rect(BODY_RIGHT + 1, ry - 7, 6, rheight + 7, _ink(ctx, "rear_dark"))
    canvas.rect(BODY_RIGHT + 2, ry - 3, 4, rheight + 2,
                _ink(ctx, "rear_darkest"))
    canvas.vline(rx, ry - 3, rheight + 3, _ink(ctx, "rear_edge_lit"))
    canvas.vline(rx + 1, ry - 3, rheight + 3, _ink(ctx, "rear_edge"))

    # -- the front quarter opening, §2.9. A dark recess, L 3-29, with a
    #    dead-black column at x=239. IT IS NOT A GLAZED WINDOW — no frame,
    #    no glass event, nothing but a hole.
    fx, fy, fwidth, fheight = layout.COACH_FRONT_QUARTER
    canvas.rect(fx, fy, fwidth, fheight + 3, _ink(ctx, "recess"))
    canvas.vline(fx, fy, fheight + 3, _ink(ctx, "recess_black"))
    # its lit head: three rows at y 58-60, x 238-245, measured L 33-67. It is
    # the only thing that says the opening has a top.
    canvas.hline(fx - 1, fy, 7, _ink(ctx, "sill_lit", -2))
    canvas.hline(fx - 1, fy + 1, 6, _ink(ctx, "sill_lit"))
    canvas.hline(fx, fy + 2, 5, _ink(ctx, "sill_lit", -1))

    # -- the front corner post, §2.8. ONE PIXEL WIDE, twenty-three rows, and
    #    §5.3 lists it among the six places the drawing is a single pixel of
    #    commitment. x=237 is a dimmer support beside it.
    cx, cy, _, cheight = layout.COACH_FRONT_POST
    canvas.vline(cx - 1, cy, cheight, _ink(ctx, "post_dim"))
    canvas.vline(cx, cy, cheight, _ink(ctx, "post_lit"))
    canvas.vline(cx, cy + 2, 4, _ink(ctx, "post_hot"))
    canvas.vline(cx, cy + 17, 6, _ink(ctx, "post_mid"))
    canvas.put(cx, cy + cheight - 1, _ink(ctx, "post_dim"))

    # -- the door pillar, §2.10. Four columns and each does one job: a lit
    #    stile, its shadow, a mid face, and a dark reveal into the doorway.
    px, py, _, pheight = layout.COACH_DOOR_PILLAR
    canvas.vline(px - 2, py, pheight - 1, _ink(ctx, "pillar_lit"))
    canvas.vline(px - 1, py, pheight - 1, _ink(ctx, "pillar_shadow"))
    canvas.vline(px, py, pheight - 1, _ink(ctx, "pillar_face"))
    canvas.vline(px + 1, py, pheight - 1, _ink(ctx, "pillar_shadow"))
    canvas.vline(px + 2, py, pheight - 1, _ink(ctx, "pillar_reveal"))
    canvas.vline(px + 3, py, pheight - 1, _ink(ctx, "pillar_reveal"))


def _doorway(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.11 and §3.4. Lmed 2.6, sixty per cent `void`.

    Its left edge is dead vertical at x=254 for twenty-two unbroken rows — a
    26-point drop across one pixel, held — and §3.4 calls it the single most
    valuable line in the region after the rail. It goes in before any of the
    door's ornament.
    """
    dx, dy, dwidth, dheight = layout.COACH_DOORWAY
    canvas.rect(dx, dy, dwidth, dheight, _ink(ctx, "void"))
    # The 22% that is `umber[0]` rather than `void[0]`: the far side of the
    # interior, faintly touched by the lamp standing in it.
    canvas.rect(dx + 3, dy + 14, dwidth - 4, 8, _ink(ctx, "void_warm"))
    _lamp(canvas, ctx, layout.COACH_LAMP_A, core=3)


def _lamp(canvas: IndexedCanvas, ctx: layout.Ctx, at: tuple[int, int],
          core: int) -> None:
    """§7.3. Two ramp steps, one ring, one transitional ring, nothing beyond.

    The reference ties these to the carried lantern on peak value and lets
    the lantern win on area alone — 3 and 2 peak pixels against 22, and a
    ground pool the coach lamps do not have. Our palette can do better and
    §7.2 says it should: the lantern spends the reserved `accent_gold` band
    and these stop at `ochre[13]`, opening a gap of at least +9.9 L that the
    reference does not have. At 320×144 a two-pixel lamp the same value as
    the hero light reads as a second hero light.

    AND NO BLOOM ON THE SURROUNDING PANELS. The reference throws none: no
    light on the door leaf's face, on the standing man, on the step or on
    the ground.
    """
    x, y = at
    # THE FOOTPRINT IS THE WHOLE ARGUMENT. §7.1 gives the lantern a 4.5x and
    # 4.1x advantage in warm ENERGY and 7.3x and 11x on peak-value pixels, and
    # energy is area times value. A 6 x 5 halo around a three-pixel core is
    # twenty warm pixels where the bar has nine; the peak obeys §7.2 and the
    # energy quietly doubles, which is the same failure §7 is written to
    # prevent arriving by the back door. Measured on the bar, each lamp dies
    # from 123 to under 20 in two to three pixels and there is nothing at
    # radius 3 at all.
    #
    # Offsets are (dx, dy) about the core, in one falling order: core, ring,
    # fringe, last pixel. Lamp A leans down-left into the doorway; lamp B
    # leans UP, which is how §2.13b measures it — its ring is the row above.
    if core > 2:
        rings = (((0, 0), (1, 0), (0, 1)),
                 ((1, 1), (0, -1)),
                 ((-1, 0), (-1, 1), (1, -1), (0, 2)),
                 ((-1, -1), (0, -2), (1, -2), (1, 2)))
    else:
        rings = (((0, 0), (1, 0)),
                 ((-1, -1), (0, -1), (1, -1), (-1, 0)),
                 ((1, 1), (-2, -1), (-2, 0), (0, 1)),
                 ((-1, 1), (-2, -2), (1, -2)))
    for ink, offsets in zip(("lamp_core", "lamp_ring", "lamp_fringe",
                             "lamp_spill"), rings):
        for dx, dy in offsets:
            canvas.put(x + dx, y + dy, _ink(ctx, ink))


def _door_leaf(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.13. Swung open toward us on its rear hinge, so it reads face-on."""
    lx, ly, lwidth, lheight = layout.COACH_DOOR_LEAF
    rng = ctx.stream("coach door leaf")

    # THE LEAF IS NOT DARK. Measured column by column on the bar it runs
    # L 19-56 everywhere it is not window, with a median near 30 — §4 puts
    # its lower panel at Lmed 28.5 and §3.2's event band at 24-40. It was
    # being drawn at a flat mud[3] with two lit rows on it, which is nine
    # points under the measurement across a 15 x 31 panel and reads as a
    # black door on a brown coach. Base it at the measured median and let the
    # frame members carry the light.
    canvas.rect(lx, ly, lwidth, lheight, _ink(ctx, "leaf", 1))
    for _ in range(90):
        canvas.put(lx + rng.randrange(lwidth), ly + rng.randrange(lheight),
                   _ink(ctx, "leaf", rng.randrange(-1, 2)))

    # The two stiles. The hinge stile takes the warm key and is the brighter,
    # sustained down the FULL height at L 46-76 — it is the leaf's own version
    # of the front corner post and it is what stands the door away from the
    # doorway's black. The far stile, six inches deeper into the night, is
    # two steps down.
    canvas.vline(lx, ly + 1, lheight - 2, _ink(ctx, "leaf", -1))
    canvas.vline(lx + 1, ly + 1, lheight - 2, _ink(ctx, "leaf"))
    canvas.vline(lx + 2, ly + 1, lheight - 2, _ink(ctx, "leaf", 1))
    canvas.vline(lx + 3, ly + 1, lheight - 3, _ink(ctx, "leaf_frame"))
    canvas.vline(lx + 3, ly + 3, 12, _ink(ctx, "leaf_frame_hot"))
    canvas.vline(lx + 4, ly + 1, lheight - 3, _ink(ctx, "leaf", -1))
    canvas.vline(lx + 15, ly, lheight - 4, _ink(ctx, "leaf_edge"))
    canvas.vline(lx + 16, ly, lheight - 4, _ink(ctx, "leaf"))

    # §2.13a. In image A this opening has a rounded top corner; AT THIS SIZE
    # IT IS A PLAIN RECTANGLE, and its left column runs the full height as
    # the darkest thing in the leaf. It is a RECESS and not a hole: the bar
    # keeps the far side of the glass at L 8-26 rather than at void, so that
    # the doorway beside it stays the only true black in the object.
    gx, gy, gwidth, gheight = layout.COACH_DOOR_WINDOW
    canvas.rect(gx + 2, gy + 1, gwidth - 2, gheight - 2, _ink(ctx, "glass"))
    canvas.rect(gx + 2, gy + 1, 2, gheight - 2, _ink(ctx, "glass_black"))
    for _ in range(28):
        canvas.put(gx + 4 + rng.randrange(gwidth - 4),
                   gy + 1 + rng.randrange(gheight - 3),
                   _ink(ctx, "glass", rng.randrange(0, 3)))
    _lamp(canvas, ctx, layout.COACH_LAMP_B, core=2)
    # the sill: the window's bottom two rows come back up to L 26-46, and it
    # is what gives the opening a bottom edge without a frame being drawn.
    canvas.hline(gx + 2, gy + gheight - 1, gwidth - 2, _ink(ctx, "leaf", 1))
    canvas.hline(gx + 2, gy + gheight, gwidth - 2, _ink(ctx, "leaf_edge"))
    canvas.hline(gx + 5, gy + gheight, 5, _ink(ctx, "leaf_edge", 1))

    # §2.13c. The kick moulding: one bright row and two studs, L 40-59, with
    # a second, shorter lit run two rows under it where the panel's bottom
    # rail catches the same light.
    canvas.hline(lx + 3, ly + 19, 12, _ink(ctx, "moulding"))
    canvas.hline(lx + 3, ly + 18, 5, _ink(ctx, "moulding", -2))
    canvas.put(lx + 4, ly + 18, _ink(ctx, "brass", 1))
    canvas.put(lx + 7, ly + 18, _ink(ctx, "brass"))
    canvas.hline(lx + 5, ly + 22, 4, _ink(ctx, "leaf_frame"))

    # §2.13d. In image A this is a legible brass curl. IN THE BAR IT SURVIVES
    # AS A 2-3 px LIGHTER SMUDGE. Draw the smudge; do not draw the curl.
    canvas.put(lx + 5, ly + 23, _ink(ctx, "scroll", 2))
    canvas.hline(lx + 6, ly + 23, 2, _ink(ctx, "scroll", -2))
    canvas.put(lx + 9, ly + 23, _ink(ctx, "scroll", -1))

    # The leaf's foot, and the dark it stands against.
    canvas.hline(lx + 1, ly + 28, lwidth - 3, _ink(ctx, "leaf_dark"))
    canvas.hline(lx + 4, ly + 30, 5, _ink(ctx, "void_warm"))


# ---------------------------------------------------------------------------
# The coach — roof
# ---------------------------------------------------------------------------


def _roof(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.14-18. Deck, cornice shadow, belt moulding, cargo, trunk, rail.

    §3.2's ladder in four rows: the rail at 46.8 is the brightest row
    anywhere in the coach, the deck sits at 26-31, the cornice shadow at 16.9
    is the darkest horizontal in the upper body, and the belt moulding
    returns to 31.0. Light over dark, twice, in the space of five rows — that
    is what makes the roof sit ON the body instead of floating.
    """
    cx, cy, cwidth, _ = layout.COACH_CARGO
    rng = ctx.stream("coach cargo")

    # -- the cargo, drawn from its measured crest down to the rail. The gaps
    #    between lashed bundles show `accent_indigo[0]` — THE SKY, inside the
    #    object silhouette — which is why the top edge reads lumpy rather
    #    than as a solid (§4).
    # BUNDLES, NOT COLUMNS. Scattering the sky-gaps per column gives a comb
    # of one-pixel teeth, which is the shape of noise and not the shape of
    # luggage. Each bundle is three to six columns wide, takes one ink and
    # one top offset, and the gap between two of them is where
    # `accent_indigo[0]` shows through (§4).
    # AND IT IS LIT ON TOP. §3.1 measures the cargo at a mean of 36.7 against
    # a sky of 26.0 and the whole coach's separation from the night is that
    # eleven points; drawn at the sacking's own body value the bundles come
    # out at 20-27, BELOW the sky, and the roof reads as a second notch
    # instead of as luggage. Every bundle therefore gets its top row a step
    # or two up — it is a horizontal surface under an open sky, the same
    # argument as the rail above it and the hat brim below.
    inks = ("cargo", "cargo", "cargo_dim", "cargo_dark")
    x = cx
    while x < cx + cwidth:
        run = min(3 + rng.randrange(4), cx + cwidth - x)
        ink = inks[rng.randrange(len(inks))]
        drop = rng.randrange(2)
        for column in range(x, x + run):
            crest = _cargo_crest(column) + drop
            canvas.vline(column, crest, 49 - crest, _ink(ctx, ink))
            canvas.put(column, crest, _ink(ctx, ink, 2))
            canvas.put(column, crest + 1, _ink(ctx, ink, 1))
            if column in (x, x + run - 1) and rng.random() < 0.45:
                canvas.put(column, crest, _ink(ctx, "cargo_gap"))
        x += run

    # §2.18a. The left crate's lit top face, five pixels, and it is the only
    # place the cargo reaches the rail's own value.
    canvas.hline(cx + 8, 44, 5, _ink(ctx, "crate_lit"))
    canvas.put(cx + 9, 44, _ink(ctx, "crate_hot"))
    canvas.hline(cx + 2, 45, 8, _ink(ctx, "crate_lit", -2))

    # §2.18b. Eight by five at L 2-16, sitting directly against a sky of
    # 20-21. A NEGATIVE SHAPE BITTEN OUT OF THE SKYLINE, and it does half the
    # silhouette work for the whole coach. §10.6: it looks like a hole
    # because it is one. Do not soften it, do not fill it, do not lose it.
    tx, ty, twidth, theight = layout.COACH_BLACK_TRUNK
    canvas.rect(tx, ty + 1, twidth, theight - 1, _ink(ctx, "trunk"))
    canvas.rect(tx, ty, 3, 1, _ink(ctx, "trunk_edge"))
    canvas.rect(tx + 1, ty + 1, 3, 2, _ink(ctx, "trunk_edge"))

    # §2.17's partial second bright row, where a lashed bundle behind the
    # rail catches the same light.
    _falloff_row(canvas, ctx, 260, 277, 48, "mud", 46.0, 62.0)
    canvas.hline(268, 48, 4, _ink(ctx, "bundle_lit"))

    # -- the deck. Its lowest row carries the left key one step down from the
    #    rail: 58 at the front corner to 12 at the rear.
    dx, dy, dwidth, _ = layout.COACH_ROOF_DECK
    canvas.hline(dx, dy, dwidth, _ink(ctx, "deck"))
    canvas.hline(dx, dy + 1, dwidth, _ink(ctx, "deck", 1))
    for x in range(dx, dx + dwidth):
        target = DECK_EDGE_FLOOR + (DECK_EDGE_L - DECK_EDGE_FLOOR) * \
            0.5 ** ((x - dx) / DECK_EDGE_HALF)
        canvas.put(x, dy + 2, _at_luminance(ctx.palette, "mud", target))

    # §2.15. One row tall, the full width, and the darkest horizontal in the
    # upper body. It is not level: measured L 10 under the lit front half and
    # L 19-23 under the rear, because a shadow is only as deep as the light
    # that is being blocked.
    sx, sy, swidth, _ = layout.COACH_CORNICE_SHADOW
    canvas.hline(sx, sy, swidth, _ink(ctx, "cornice_shadow"))
    canvas.hline(sx + 18, sy, swidth - 18, _ink(ctx, "pillar_reveal"))
    mx, my, mwidth, _ = layout.COACH_BELT_MOULDING
    canvas.hline(mx, my, mwidth, _ink(ctx, "belt"))

    # §2.17 and the draw-order note: THE RAIL GOES ON LAST OF THE ROOF GROUP,
    # over the cargo, because it is a single row and any cargo drawn over it
    # breaks the line. §5.5 — its falloff is the light direction.
    _, ry, _, _ = layout.COACH_ROOF_RAIL
    _profile_row(canvas, ctx, ry, "dust", RAIL_PROFILE)
    # §6: the rail's stanchions are not drawn. It is one continuous row.


# ---------------------------------------------------------------------------
# Figures
# ---------------------------------------------------------------------------


def _driver(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.23. The ONLY figure in the region read against the sky.

    His warm silhouette starts at y=43 and everything above it is sky. Below
    the waist the WARM coat over COOL trousers is what keeps his legs off the
    coach, and §3.6 says taking the temperature split out dissolves both men
    into the vehicle at 2× viewing distance. §10.10: eyes at 4 × 5 px produce
    a skull, so there are none.
    """
    x0, y0, _, _ = layout.COACH_DRIVER

    # hat: crown x 228-232 at y 43-45, brim x 226-234 at y=46 and near-black.
    canvas.rect(x0 + 12, y0, 5, 3, _ink(ctx, "hat"))
    canvas.put(x0 + 12, y0 + 1, _ink(ctx, "hat_lit"))
    canvas.rect(x0 + 11, y0 + 2, 6, 1, _ink(ctx, "hat", -1))
    # The brim is not one value either: measured at y=46 it runs 32, 31, 24,
    # 28 across its near half and drops to 12 only under the crown. A brim is
    # a disc seen almost edge-on, so its near edge turns up toward the sky
    # and its far side is under the hat — one flat dark run says "a bar", and
    # this is the only mark separating his head from the sky.
    canvas.rect(x0 + 10, y0 + 3, 9, 1, _ink(ctx, "brim"))
    canvas.hline(x0 + 10, y0 + 3, 3, _ink(ctx, "hat", -1))
    canvas.put(x0 + 13, y0 + 3, _ink(ctx, "hat", -2))
    canvas.put(x0 + 18, y0 + 3, _ink(ctx, "hat", -3))

    # face: 4 × 5 and NO MORE — §10.10, eyes at this size produce a skull.
    # One lit column down the middle, two pixels at the ceiling, the far side
    # two steps down, and at y=47 the run reads bright-dark-bright-dark-
    # bright. THAT IS THE MOUSTACHE AND IT IS THREE PIXELS (§5.4).
    fx, fy, fwidth, fheight = layout.COACH_DRIVER_FACE
    canvas.rect(fx, fy + 1, fwidth + 1, fheight - 1, _ink(ctx, "face", -4))
    canvas.vline(fx + 2, fy + 1, fheight - 1, _ink(ctx, "face", 1))
    canvas.vline(fx + 1, fy + 1, 2, _ink(ctx, "face"))
    canvas.vline(fx, fy + 2, 3, _ink(ctx, "face", -8))
    canvas.vline(fx + 4, fy + 1, fheight - 1, _ink(ctx, "face", -6))
    canvas.put(fx + 2, fy + 1, _ink(ctx, "face_hot"))
    canvas.put(fx + 2, fy + 4, _ink(ctx, "face_hot"))
    canvas.put(fx + 3, fy + 4, _ink(ctx, "face", -7))
    canvas.hline(fx, fy, fwidth + 1, _ink(ctx, "moustache"))
    canvas.put(fx, fy, _ink(ctx, "face", -5))
    canvas.put(fx + 2, fy, _ink(ctx, "face", -2))
    canvas.put(fx + 4, fy, _ink(ctx, "face", -4))

    # coat: a warm mass sloping down-left as his arms reach for the reins.
    # It runs from the shoulder at x=226 out to the coach's own corner post,
    # and its left edge falling one pixel a row IS the reach.
    # HIS SHOULDERS START AT y=49, UNDER THE BRIM, not at y=52. Measured
    # x 233-237 at rows 49-51 runs L 19-49; ours ran flat 16, which is the
    # background value — so three rows of the man were being drawn as
    # nothing, his head sat on air, and the face read as a lit object rather
    # than as a face because there was no body under it to belong to.
    canvas.hline(x0 + 16, y0 + 6, 5, _ink(ctx, "driver_coat_dark"))
    canvas.hline(x0 + 15, y0 + 7, 6, _ink(ctx, "driver_coat", -1))
    canvas.hline(x0 + 17, y0 + 7, 3, _ink(ctx, "driver_coat"))
    canvas.hline(x0 + 13, y0 + 8, 8, _ink(ctx, "driver_coat"))
    for row in range(7):
        left = x0 + 10 - row
        canvas.hline(left, y0 + 9 + row, x0 + 23 - left,
                     _ink(ctx, "driver_coat"))
    # THE LIT MARKS FOLLOW THE ARM, NOT THE ROWS. Three flat horizontal runs
    # across a coat read as shelving — the eye takes a repeated horizontal at
    # this size as structure belonging to the vehicle, and the driver stopped
    # being a man and became part of the box he sits on. The bar's lit
    # values here lie along the shoulder and down the sleeve: a diagonal from
    # the collar out to the hands, which is the reach, and it is the only
    # thing saying he is holding something.
    canvas.put(x0 + 13, y0 + 8, _ink(ctx, "driver_coat_lit"))
    canvas.line(x0 + 12, y0 + 9, x0 + 8, y0 + 13,
                _ink(ctx, "driver_coat_lit"))
    canvas.line(x0 + 13, y0 + 10, x0 + 10, y0 + 13,
                _ink(ctx, "driver_coat", 1))
    canvas.line(x0 + 17, y0 + 9, x0 + 19, y0 + 12,
                _ink(ctx, "driver_coat_lit"))
    canvas.put(x0 + 16, y0 + 10, _ink(ctx, "driver_coat", 2))
    canvas.hline(x0 + 9, y0 + 12, 3, _ink(ctx, "driver_coat_dark"))
    canvas.line(x0 + 14, y0 + 14, x0 + 18, y0 + 13,
                _ink(ctx, "driver_coat_dark"))

    # hands on the reins: two clusters at L 62-97, and they are the brightest
    # thing on him after his face.
    canvas.rect(x0 + 5, y0 + 14, 4, 2, _ink(ctx, "hand"))
    canvas.put(x0 + 6, y0 + 15, _ink(ctx, "hand_hot"))
    canvas.put(x0 + 4, y0 + 15, _ink(ctx, "hand_hot"))
    canvas.rect(x0 + 11, y0 + 14, 3, 2, _ink(ctx, "hand"))
    canvas.put(x0 + 11, y0 + 15, _ink(ctx, "hand_hot"))

    # trousers: COOL, two legs, and they are what stop him joining the coach.
    canvas.rect(x0 + 3, y0 + 16, 9, 9, _ink(ctx, "trouser", 1))
    canvas.vline(x0 + 5, y0 + 17, 8, _ink(ctx, "trouser_lit"))
    canvas.vline(x0 + 4, y0 + 18, 7, _ink(ctx, "trouser_lit", 1))
    canvas.vline(x0 + 9, y0 + 17, 5, _ink(ctx, "trouser_lit"))
    canvas.vline(x0 + 11, y0 + 17, 7, _ink(ctx, "trouser_dark"))
    canvas.vline(x0 + 12, y0 + 16, 8, _ink(ctx, "trouser_dark"))
    # boots. §2.23 calls them near-black and they are — but near-black here
    # measures L 22-27, not 9: they sit on a lit footboard with the town
    # behind them, and at umber[0] the whole bottom of the figure fell off.
    canvas.rect(x0 + 1, y0 + 23, 7, 4, _ink(ctx, "leather", 2))
    canvas.hline(x0 + 2, y0 + 23, 5, _ink(ctx, "trouser"))
    canvas.hline(x0 + 1, y0 + 26, 4, _ink(ctx, "leather"))

    # §8.2 and §6. The reins are drawn, but at L 22-32 over a sky of 21-35 —
    # about ±5 — so they read as texture rather than as lines. THEY BELONG TO
    # THE COACH LAYER, not to the sky: they go when the coach goes, and the
    # sky and hills underneath them must be complete.
    canvas.line(x0 + 4, y0 + 15, 210, y0 + 21, _ink(ctx, "rein"))
    canvas.line(x0 + 6, y0 + 16, 210, y0 + 25, _ink(ctx, "rein", -1))


def _front_boot(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.22. The front boot and driver's box: warm, mid, and mostly a wedge.

    Its trimmed edge runs down-right at L 38-51 from about (216, 69) to
    (224, 75), and the footboard's front corner is a lit vertical at x=229.
    Everything below and left of the trimmed edge is the team's air and must
    stay open — §8.1's four-pixel seam at x 222-225 is the reason the coach
    and the team can be separate layers at all.
    """
    x0, y0, width, height = layout.COACH_FRONT_BOOT
    right = x0 + width - 1

    # The box's near side: x 229-238, a mid-dark slab at L 8-40 divided by
    # two lit uprights. It is NOT a lit plane — §10.11, drift bright here and
    # the whole front of the coach stops being read against the night.
    canvas.rect(x0 + 15, y0 + 1, right - x0 - 14, 14,
                _ink(ctx, "pillar_reveal"))
    canvas.hline(x0 + 15, y0 + 1, 6, _ink(ctx, "post_lit"))
    canvas.hline(x0 + 15, y0 + 2, 5, _ink(ctx, "post_mid"))
    # the two uprights, one pixel each, ten rows.
    canvas.vline(x0 + 15, y0 + 1, 10, _ink(ctx, "post_lit"))
    canvas.vline(x0 + 19, y0 + 4, 10, _ink(ctx, "boot_corner"))
    canvas.vline(x0 + 16, y0 + 3, 8, _ink(ctx, "rear_darkest"))
    canvas.vline(x0 + 22, y0 + 3, 8, _ink(ctx, "rear_darkest"))

    # The apron below: a wedge only a little darker than the road it hangs
    # over, with ONE lit trimmed edge running down-right. §8.1 — its left
    # corner must clear x=222, because the four pixels between the nearest
    # horse's rear and the front wheel's arc are the reason the coach and the
    # team can be composited apart.
    for row in range(10):
        left = x0 + 2 + row
        canvas.hline(left, y0 + 10 + row, right - left - row,
                     _ink(ctx, "pillar_reveal"))
    canvas.line(x0 + 2, y0 + 10, x0 + 8, y0 + 14, _ink(ctx, "boot_corner"))
    canvas.line(x0 + 7, y0 + 15, x0 + 11, y0 + 17, _ink(ctx, "boot_strap"))
    # The footboard the driver's boots sit on: a lit run at y 69-70, x 216-221,
    # measured L 36-51. It is the one horizontal in this corner and without it
    # his feet end in the dark and he reads as floating on the box.
    canvas.hline(x0 + 2, y0 + 10, 6, _ink(ctx, "step"))
    canvas.hline(x0 + 3, y0 + 11, 4, _ink(ctx, "boot_corner"))
    canvas.put(x0 + 3, y0 + 10, _ink(ctx, "step_hot"))


def _standing_man(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.24. Goes on AFTER the wheels — his legs cross the front wheel's
    right edge at x 237-240.

    Face and neckcloth together are a 5 × 8 mass at p50 46.3 against a coat
    at 30.5 and a doorway at 2.6. It is the brightest sustained area of the
    coach and where the eye lands after the lantern. The bright head sits
    directly under a near-black hat, so the value jump is 100+ across one
    row — and his coat is COOL against warm body panels, which is the other
    half of why he separates at all.
    """
    x0, y0, _, _ = layout.COACH_STANDING_MAN
    fx, fy, fwidth, _ = layout.COACH_STANDING_FACE

    # hat: eight pixels wide, four rows. The CROWN is the near-black — L 2-8
    # across y 61-62 — and it is the darker half of the 100-point jump that
    # makes his head read. THE BRIM IS NOT. Measured at y 63-64 it runs
    # L 27-52: it is a horizontal surface a foot below an open sky and it
    # catches the same cool light the roof rail does, and drawing it black
    # welds the crown to the face and loses the one edge that says "hat".
    canvas.rect(x0 + 4, y0, 7, 2, _ink(ctx, "felt_dark"))
    canvas.hline(x0 + 5, y0, 5, _ink(ctx, "void"))
    canvas.hline(x0 + 3, y0 + 2, 9, _ink(ctx, "coat_lit"))
    canvas.put(x0 + 3, y0 + 2, _ink(ctx, "felt"))
    canvas.hline(x0 + 8, y0 + 2, 2, _ink(ctx, "coat"))
    canvas.hline(x0 + 4, y0 + 3, 8, _ink(ctx, "coat"))
    canvas.hline(x0 + 9, y0 + 3, 2, _ink(ctx, "coat_lit"))
    canvas.put(x0 + 4, y0 + 3, _ink(ctx, "felt"))

    # face: five wide, five tall, one hot row at y=67, and NOTHING ELSE.
    # §10.10 — eyes at this size produce a skull.
    canvas.rect(fx, fy, fwidth, 5, _ink(ctx, "face", -4))
    canvas.hline(fx, fy + 1, 4, _ink(ctx, "face", -1))
    canvas.hline(fx, fy + 2, 4, _ink(ctx, "face_hot"))
    canvas.put(fx + 1, fy + 1, _ink(ctx, "face_hot"))
    canvas.put(fx, fy, _ink(ctx, "face", -8))
    canvas.put(fx, fy + 3, _ink(ctx, "face", -7))
    canvas.put(fx, fy + 4, _ink(ctx, "face", -10))
    canvas.put(fx + 4, fy, _ink(ctx, "face", -7))

    # coat: COOL, and it is NOT dark — measured L 36-59 across its lit front,
    # against warm body panels at 25-40. As a mass he does not contrast with
    # the coach at all (Michelson 0.003); the temperature split is the entire
    # separation, and §3.6 says take it out and both men dissolve.
    #
    # IT STARTS AT y=73, NOT AT y=71. The shoulders were being laid across
    # rows 71-72 and painting out the neckcloth under them — four of the
    # region's ceiling-value pixels, §2.24's "cream cloth, not skin", gone
    # under a grey rectangle. That is a nine-point hole in the row mean at
    # exactly the row §3.2 calls the event band, and it is invisible in the
    # code because both statements are correct on their own.
    canvas.rect(x0 + 1, y0 + 12, 14, 7, _ink(ctx, "coat", 1))
    canvas.vline(x0 + 9, y0 + 12, 8, _ink(ctx, "coat_lit"))
    canvas.vline(x0 + 12, y0 + 12, 8, _ink(ctx, "coat_lit"))
    canvas.vline(x0 + 1, y0 + 12, 8, _ink(ctx, "coat_dark"))
    canvas.vline(x0 + 4, y0 + 12, 8, _ink(ctx, "coat"))
    canvas.vline(x0 + 14, y0 + 12, 8, _ink(ctx, "coat_dark"))
    canvas.hline(x0 + 2, y0 + 19, 12, _ink(ctx, "coat_dark"))
    # HIS COAT IS OPEN. The four columns down the middle of him are not coat
    # at all — measured `mud[7..9]` at L 45-59, a warm shirt front between
    # two cool flanks. That is the temperature split §10.11 warns about,
    # inside one figure: read it as a pale coat and the man goes cold and
    # flat and stops being cut out of the vehicle behind him.
    canvas.rect(x0 + 5, y0 + 12, 3, 6, _ink(ctx, "driver_coat_lit"))
    canvas.vline(x0 + 6, y0 + 12, 5, _ink(ctx, "moulding"))
    canvas.put(x0 + 7, y0 + 13, _ink(ctx, "moulding"))
    canvas.put(x0 + 5, y0 + 17, _ink(ctx, "coat"))

    # the raised right arm and hand: gripping the door frame and crossing the
    # doorway's blackness. It is what makes him half in and half out, and it
    # does not leave the coach's own silhouette.
    canvas.hline(x0 + 11, y0 + 10, 5, _ink(ctx, "coat_lit"))
    canvas.hline(x0 + 12, y0 + 11, 5, _ink(ctx, "coat_lit", 1))
    canvas.rect(x0 + 16, y0 + 9, 4, 3, _ink(ctx, "coat"))
    canvas.put(x0 + 17, y0 + 10, _ink(ctx, "face", -2))
    canvas.put(x0 + 18, y0 + 10, _ink(ctx, "face_hot"))
    canvas.put(x0 + 18, y0 + 9, _ink(ctx, "face", -3))
    canvas.put(x0 + 18, y0 + 11, _ink(ctx, "face", -5))
    # the left hand, over the front boot.
    canvas.put(x0, y0 + 16, _ink(ctx, "face", -2))
    canvas.put(x0, y0 + 17, _ink(ctx, "face", -4))

    # neckcloth: four more pixels at the ceiling, and they go on LAST of the
    # head group because the collar of the coat is behind them, not over
    # them. §2.24 — A CREAM CLOTH, NOT SKIN, which is why it sits a step
    # above the face it hangs under. Face and neckcloth together are the 5x8
    # mass at p50 46.3 that §3.6 says is where the eye lands after the
    # lantern, and it only reaches that median if all eight rows survive.
    canvas.rect(fx + 1, fy + 5, 3, 3, _ink(ctx, "face", 1))
    canvas.put(fx + 3, fy + 5, _ink(ctx, "face_hot"))
    canvas.put(fx + 1, fy + 6, _ink(ctx, "face_hot"))
    canvas.put(fx + 2, fy + 6, _ink(ctx, "face_hot"))
    canvas.put(fx + 1, fy + 7, _ink(ctx, "face_hot"))
    canvas.put(fx + 3, fy + 7, _ink(ctx, "face", -5))
    canvas.put(fx, fy + 5, _ink(ctx, "face", -6))
    canvas.put(fx + 4, fy + 5, _ink(ctx, "face", -5))
    canvas.put(fx, fy + 6, _ink(ctx, "coat_lit"))
    canvas.put(fx + 4, fy + 6, _ink(ctx, "coat_lit"))

    # legs: `grey[0..1]` / `umber[0]` / `void[0]`, Lmed 22 — not L 16. They
    # are trousers standing in front of a black doorway, and at the coat's
    # darkest step they merge with it and he ends at the waist.
    canvas.rect(x0 + 3, y0 + 20, 10, 10, _ink(ctx, "coat"))
    canvas.vline(x0 + 8, y0 + 20, 10, _ink(ctx, "void"))
    canvas.vline(x0 + 3, y0 + 21, 9, _ink(ctx, "legs"))
    canvas.vline(x0 + 12, y0 + 21, 8, _ink(ctx, "legs"))
    canvas.vline(x0 + 6, y0 + 23, 6, _ink(ctx, "coat_dark"))
    canvas.vline(x0 + 10, y0 + 23, 6, _ink(ctx, "coat_dark"))
    canvas.hline(x0 + 4, y0 + 30, 8, _ink(ctx, "contact"))


# ---------------------------------------------------------------------------
# Running gear
# ---------------------------------------------------------------------------


def _rear_wheel(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.19 and §5.1. THE REAR WHEEL IS A WHEEL.

    Rim two pixels thick, brightest in the upper-right sector at L 55-60,
    dimmest on the left at 29 — the COOL key, from up and to the right, and
    the rim is the clearest statement of it in the region. Twelve one-pixel
    spokes at 30° pitch drawn at L 39 against a disc interior of L 15: a
    24-point separation, three to four ramp steps, NOT a full-contrast line.
    They are broken, they resolve only outside radius 5, and inside that the
    reference lets them merge rather than fighting it. A 3 × 3 hub. That is
    the whole wheel.
    """
    cx, cy, rx, ry = layout.COACH_REAR_WHEEL
    centre_x, centre_y = int(cx), int(cy)
    radius_x, radius_y = int(rx), int(ry)

    # The disc the spokes are read against, and it is NEARLY FLAT. Measured
    # troughs between the reference's spokes run L 8-19 with no structure in
    # them; the earlier per-pixel scatter across the whole disc put a random
    # step under every spoke pixel and the twelve radii stopped being radii.
    # A spoke that is one step above a field that is itself one step either
    # way is not a spoke, it is grain — and §5.2 measures the disc's ABAB
    # rate at 1.6% / 1.0%, a noise floor and not a pattern.
    disc = ctx.stream("coach disc")
    for dy in range(-radius_y, radius_y + 1):
        for dx in range(-radius_x, radius_x + 1):
            if (dx / rx) ** 2 + (dy / ry) ** 2 <= 1.0:
                grain = -1 if disc.random() < 0.16 else 0
                canvas.put(centre_x + dx, centre_y + dy,
                           _ink(ctx, "disc", grain))

    # Twelve radii drawn AT FULL CONTRAST are a pinwheel, and a pinwheel at
    # 320×144 reads as MOTION (§10.2). What stops that is NOT breaking them
    # into confetti — it is the separation: the reference draws them at L 39
    # against a disc at L 15, three or four ramp steps, and lets the modesty
    # of that step do the work. §5.1 is explicit that they are one pixel wide
    # and CONTINUOUS OUTSIDE r=5, merging into the hub inside it.
    #
    # They are "broken" in the reference in the sense that a spoke passing
    # behind the far felloe drops out for two or three pixels, not in the
    # sense that a tenth of every pixel is missing. So: one gap per spoke, at
    # a radius the stream picks, and the rest of the run continuous. Drawn at
    # half-pixel radial steps because a whole-pixel walk at r=9 leaves holes
    # in a 30° line and holes are what turned this into noise.
    rng = ctx.stream("coach spokes")
    for index in range(SPOKES):
        angle = math.tau * index / SPOKES
        # Alternate spokes one step down: the wheel is lit from up and to the
        # right, so the six pointing that way catch a little more.
        bright = _ink(ctx, "spoke", 0 if index % 2 else -1)
        gap = SPOKE_INNER + 1.5 + rng.random() * (radius_x - SPOKE_INNER - 4)
        steps = int((radius_x - SPOKE_INNER) * 2) + 1
        for step in range(steps):
            radius = SPOKE_INNER + step * 0.5
            if gap <= radius < gap + 1.5:
                continue
            x = centre_x + int(round(math.cos(angle) * radius))
            y = centre_y + int(round(math.sin(angle) * radius * ry / rx))
            canvas.put(x, y, bright)

    # the rim, two pixels thick, valued AND COLOURED by angle. §5.5's two
    # keys meet on this one object and nowhere else: the COOL key from up and
    # to the right takes the whole right flank into `grey` at L 54-62, the
    # crown is warm-neutral weathered iron at 46-59, the left is warm mud at
    # 35-44 where the town reaches it, and the foot is the dimmest part of
    # the whole circle. §3.3 measures the range as 29-60 and 60 is a ceiling
    # rather than a target, because a full-contrast ring around a radial
    # pattern is a pinwheel and a pinwheel reads as motion.
    for inset in (0, 1):
        for x, y in ellipse_points(centre_x, centre_y,
                                   radius_x - inset, radius_y - inset):
            degrees = math.degrees(math.atan2(centre_y - y, x - centre_x)) % 360.0
            outer, inner = _rim_inks(degrees)
            canvas.put(x, y, _ink(ctx, outer if inset == 0 else inner))

    # §2.19c. A 3 × 3 hub, slightly lighter, with a darker centre.
    canvas.rect(centre_x - 1, centre_y - 1, 3, 3, _ink(ctx, "hub"))
    canvas.put(centre_x, centre_y, _ink(ctx, "hub_core"))
    # §2.19d. The axle continues right PAST THE RIM to about x=284 — measured
    # L 38-50 for two or three pixels beyond the tyre and then nothing. It is
    # what the wheel is hung on, not a bar laid across it: run it through the
    # disc and it reads as a thirteenth spoke twice the width of the others,
    # which is what it was doing.
    canvas.hline(centre_x + radius_x, centre_y, 4, _ink(ctx, "axle"))
    canvas.hline(centre_x + radius_x + 1, centre_y + 1, 3, _ink(ctx, "axle", -2))


def _front_wheel(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§5.1 and §10.1. THE FRONT WHEEL IS NOT A WHEEL.

    Only the 90°-190° sector is drawn — the upper left — as a run of eight to
    ten pixels at L 45-60. Its right half is simply absent, lost into the
    dark of the undercarriage, and THERE ARE NO SPOKES: polar sampling of its
    interior finds no angular periodicity at all.

    And the reason the arc reads is not its shape. IMMEDIATELY INSIDE IT
    THERE IS A HARD DARK COLUMN AT x=228, L 9-15, against a rim at 45-60 —
    a forty-point drop across one pixel. Draw the arc without the dark column
    and it becomes a scratch. Close the circle or add spokes and it becomes
    the second brightest object in the region and steals the eye from the
    open door, which is the story beat.
    """
    cx, cy, rx, ry = layout.COACH_FRONT_WHEEL

    # the undercarriage dark the arc is cut against, and the wheel's absent
    # right half dissolving into it.
    canvas.rect(cx - 6, cy - 5, 13, 12, _ink(ctx, "undercarriage", 1))
    rng = ctx.stream("coach front wheel")
    for _ in range(46):
        canvas.put(cx - 6 + rng.randrange(13), cy - 5 + rng.randrange(12),
                   _ink(ctx, "spoke", -3 + rng.randrange(5)))
    canvas.vline(cx + 5, cy - 4, 10, _ink(ctx, "undercarriage"))

    low, high = FRONT_ARC
    for x, y in ellipse_points(cx, cy, int(rx), int(ry)):
        degrees = math.degrees(math.atan2(cy - y, x - cx)) % 360.0
        if not low <= degrees <= high:
            continue
        # Cool at the top where it faces the sky glow, warm on the flank
        # where the town reaches it. Two keys, and both are on this arc.
        canvas.put(x, y, _ink(ctx, "arc_cool") if degrees < 145.0
                   else _ink(ctx, "arc_warm"))

    sx, sy, swidth, sheight = layout.COACH_FRONT_WHEEL_SHADOW
    canvas.rect(sx, sy, swidth, sheight + 1, _ink(ctx, "arc_shadow"))


def _step_board(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.21. A broken lit diagonal, stepping down as it runs right.

    The man's feet meet it at y≈92, which is the only thing standing him on
    the vehicle rather than beside it.
    """
    bx, by, _, _ = layout.COACH_STEP_BOARD
    canvas.hline(bx, by, 9, _ink(ctx, "step"))
    canvas.hline(bx + 4, by, 3, _ink(ctx, "step_hot"))
    canvas.hline(bx + 8, by + 1, 7, _ink(ctx, "step"))
    canvas.hline(bx + 11, by + 1, 3, _ink(ctx, "step_hot"))
    canvas.hline(bx + 1, by + 2, 12, _ink(ctx, "undercarriage"))


def _strongbox(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.25. Lit lid edge, flat face, ONE warm lock pixel.

    §8.2 item 4: only road sits behind its top edge, so it is safe as a
    separate object that stays after the coach leaves — RE-CHECK THAT SEAM
    AFTER ANY RE-BLOCK.
    """
    bx, by, bwidth, bheight = layout.COACH_STRONGBOX
    canvas.rect(bx, by, bwidth, bheight, _ink(ctx, "box"))
    canvas.hline(bx + 1, by, bwidth - 3, _ink(ctx, "box_lid"))
    canvas.hline(bx, by + 1, bwidth - 3, _ink(ctx, "box_lid"))
    canvas.put(bx + 1, by + 1, _ink(ctx, "box_lid_hot"))
    canvas.put(bx + 3, by + 1, _ink(ctx, "box_lid_hot"))
    # §6 and §9. The flat L=19 run under the front — a contact darkening, not
    # a cast shadow. There is no coach-shaped shadow anywhere on this road.
    canvas.hline(bx + 5, by + 2, 10, _ink(ctx, "contact_soft"))
    canvas.hline(bx, by + bheight - 1, bwidth, _ink(ctx, "contact_soft"))
    # §5.4. ONE lock pixel, and it is the only thing telling you what the box
    # is. It may not be moved to a neighbouring pixel.
    canvas.put(*layout.COACH_STRONGBOX_LOCK, _ink(ctx, "box_lock"))


def _contacts(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§6 and §9. Two local darkenings and NOTHING ELSE.

    Measured: the road under the coach means 36.3 against 32.5 to its right,
    and it brightens continuously toward the bottom of frame regardless of
    what is standing on it. THE DEPTH GRADIENT WINS OVER THE OBJECT. There is
    no coach-shaped cast shadow to bake, and §10.13 says somebody will bake
    one anyway.
    """
    ax, ay, awidth, aheight = layout.COACH_REAR_CONTACT
    canvas.rect(ax, ay, awidth, aheight, _ink(ctx, "contact"))
    canvas.hline(ax - 1, ay, awidth, _ink(ctx, "contact_soft"))
