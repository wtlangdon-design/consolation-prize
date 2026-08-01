"""Room 1 — Consolation, downhill and two miles off. GRAYBOX.

About 90 × 25 usable pixels, and roughly sixty lit windows standing in for
several hundred buildings. It is the destination named on the signpost and
the only reason the scene has a subject.

THE TOWN IS NOT SEPARATED BY VALUE. town.md §3: it is 5 to 8 luminance
points brighter than the hill it sits on. What separates it is TEXTURE
FREQUENCY -- mean neighbour-pixel ΔL of 14.29 inside the mass against 1.35
on the hill behind it, a tenfold difference at near-identical mean value.
That ratio, not the silhouette and not the brightness, is what says "town".
So this is composed as a MATERIAL with five landmarks carved out of it, not
as forty little houses; §9.3 is explicit that drawing 3×4 px buildings
produces a toy village.

AUTHOR IT COLD AND PUNCH WARM HOLES. The mass is `grey` (saturation 0.11)
standing on the range's `accent_indigo` (saturation 0.6) at nearly the same
value, which is why it reads as material rather than as atmosphere. The
lighting pass cannot change hue, so a town authored warm and darkened can
never be recovered.

NOTHING GLOWS COLLECTIVELY. §6: no haze, no lift, no bloom. The four rows
immediately above the roofline are the DARKEST band in the top half of the
frame -- the dark trough, and it is an element rather than an absence. A
town at night wants to be given an atmospheric glow and the reference
explicitly does the opposite. That is why it sits back in space.

THE RATION, which is binding and is what keeps the lantern the lantern
(§7): a town window and Hob's lamp peak at the same colour. The town loses
on AREA. Only 14 of ~60 lights reach the ceiling, they total 24 pixels, they
sit in 21 separate blobs, and THE LARGEST IS TWO PIXELS. The rule is
mechanical: in this region the ceiling colour never appears more than twice
in a row and never in a 2×2.

DEFERRED to the region author:
  - the roof stipple is scattered here at the measured mean run of ~2 px.
    §2.4 wants ~320 px in ~157 runs with 106 of them single pixels; the
    distribution is right, the placement is not composed.
  - §2.14's moonlit foot band is laid flat. Measured it is brightest across
    x 139-155 and x 164-179 and dips between.
  - the headframe is built from its three marks (§6) but its four stacked
    windows are placed from the table rather than drawn as a structure.
  - the east end thins (§6) but does not yet dissolve over the measured 30
    pixels of falling roughness.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: town.md §2.3. Top edge nearly flat at y = 51 ± 2 from x=89 to x=140, then
#: falling away to y≈57 at x=148 and y≈62 at x=152. It enters the rect
#: already in progress at x=60 and continues left behind the foreground.
MASS_LEFT, MASS_RIGHT = 62, 152
ROOF_PROFILE = ((62, 53), (89, 51), (120, 50), (140, 52), (148, 57), (152, 62))

#: §4. Lights per 10-px column band from x=70 to x=179. Uniform at 7-9 from
#: x=80 to x=139, then 5, then 3, then singles. East of x=150 there are five
#: isolated lights and the town has no right-hand edge, only a thinning.
BAND_COUNTS = (3, 8, 7, 9, 9, 6, 9, 5, 3, 1, 1)
BAND_FROM = 70

#: §4: median nearest-neighbour distance 3.2 px, hard minimum 2. No two
#: windows ever touch -- there is always at least one dark pixel between.
WINDOW_SPACING = 2

#: §2.10. Four stacked lights in a 6-px column. This vertical stack over
#: eight rows is the ONLY one in the picture and it is what makes the
#: headframe read as tall rather than as more town.
HEADFRAME_WINDOWS = ((87, 43), (83, 46), (83, 50), (87, 50))

#: §2.5. The seven horizontal highlight runs that are the only marks reading
#: as an individual building's ridge. Everything else is 5 px or shorter.
#: Every additional long run costs a building's worth of ambiguity.
ROOF_STROKES = layout.TOWN_ROOF_STROKES

#: §7.3's ration. Fourteen of sixty lights reach the ceiling, 24 px in all.
HOT_LIGHTS = 14

#: Occluded by the foreground and therefore not drawn (§2). The bar simply
#: has no town behind the signboard and the rail; painting it and then
#: covering it wastes the pass and risks a pixel surviving at the edges.
OCCLUDED = (
    (0, 53, 85, 6),      # the gantry beam and its crossbeam, x <= 84
    (0, 60, 79, 9),      # the signboard, x <= 78 below y=60
    (75, 62, 7, 7),      # the hanging lamp and its post
)


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    _trough(canvas, ctx)
    _mass(canvas, ctx)
    _headframe(canvas, ctx)
    _foot_band(canvas, ctx)
    _windows(canvas, ctx)


def _roof_y(x: int) -> int:
    for (x0, y0), (x1, y1) in zip(ROOF_PROFILE, ROOF_PROFILE[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return int(round(y0 + (y1 - y0) * t))
    return ROOF_PROFILE[-1][1]


def _trough(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.2. Four to five rows of near-nothing, and it is what makes the
    roofline read: without it the town has no top edge."""
    x, y, width, height = layout.TOWN_DARK_TROUGH
    canvas.rect(x, y, width, height, ctx.ink("town_trough"))


def _mass(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    wall = ctx.ink("town_wall")
    lit = ctx.ink("town_wall_lit")
    roof = ctx.ink("town_roof")
    rng = ctx.stream("town.stipple")

    for x in range(MASS_LEFT, MASS_RIGHT + 1):
        top = _roof_y(x)
        # §2.3: ragged by two or three pixels where chimneys and gable peaks
        # poke up. Two or three. Not a skyline.
        if rng.random() < 0.18:
            top -= 1 + (rng.random() < 0.3)
        for y in range(top, layout.TOWN_BASE_Y + 1):
            canvas.put(x, y, wall)

    # §2.4. The stipple IS the town: ~320 px, mean run 2.06, two-thirds of it
    # single isolated pixels. Placed as a density rather than as roofs.
    for _ in range(300):
        x = rng.randrange(MASS_LEFT, MASS_RIGHT + 1)
        y = rng.randrange(_roof_y(x), layout.TOWN_BASE_Y + 1)
        run = 1 if rng.random() < 0.68 else 2 + (rng.random() < 0.2)
        canvas.rect(x, y, run, 1, lit if rng.random() < 0.7 else roof)

    for x, y, length in ROOF_STROKES:
        canvas.hline(x, y, length, roof)


def _headframe(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.6-9 and §9.6. Built out of three marks, not a shape.

    Its body has NO silhouette contrast at all -- mean L 17-22 against a hill
    at 15-20 -- and it is legible entirely through a 4-px cool cap, a 4-px
    plume and a vertical stack of four windows. Give it a rim light and the
    town becomes its backdrop instead of its subject.
    """
    x, y, width, height = layout.HEADFRAME
    canvas.rect(x, y, width, height, ctx.ink("town_trough"))

    cap_x, cap_y, cap_w, _ = layout.HEADFRAME_CAP
    canvas.hline(cap_x, cap_y, cap_w, ctx.ink("town_roof_bright"))
    canvas.put(82, cap_y, ctx.ink("town_roof"))

    # The plume leans very slightly left as it rises and stops. L 59 is the
    # brightest cool value anywhere in the region -- it outranks every roof.
    plume_x, plume_y, plume_w, _ = layout.HEADFRAME_PLUME
    canvas.hline(plume_x, plume_y + 1, plume_w, ctx.ink("town_roof_bright"))
    canvas.put(plume_x + 1, plume_y, ctx.ink("town_roof"))

    # §2.9: +8 luminance over the hill AND NO MORE. It is meant to be almost
    # invisible and to reward a second look; at +20 it becomes a
    # compositional line pointing at nothing.
    (tx0, ty0), (tx1, ty1) = layout.TRAMWAY
    canvas.line(tx0, ty0, tx1, ty1, ctx.ink("town_wall_lit"))


def _foot_band(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.14. The far bank the town stands on, and the seam with mid-ground.

    The town's lowest windows sit directly on top of it with no dark break.
    """
    low, high = layout.TOWN_FOOT_BAND
    for y in range(low, high):
        canvas.hline(110, y, 70, ctx.ink("town_wall_lit"))
        canvas.hline(62, y, 48, ctx.ink("town_wall"))


def _windows(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Sixty lights, individually placed, on no grid whatsoever.

    §9.2: max 7 lights on any one row out of 57, only 60% of columns carry a
    light at all. Any two rows of four aligned windows will look like a hotel
    and break the scale.
    """
    rng = ctx.stream("town.windows")
    field_x, field_y, field_w, field_h = layout.TOWN_WINDOW_FIELD
    taken: set[tuple[int, int]] = set()

    def blocked(x: int, y: int) -> bool:
        if not field_x <= x < field_x + field_w:
            return True
        if not field_y <= y < field_y + field_h:
            return True
        for ox, oy, ow, oh in OCCLUDED:
            if ox <= x < ox + ow and oy <= y < oy + oh:
                return True
        for dy in range(-WINDOW_SPACING, WINDOW_SPACING + 1):
            for dx in range(-WINDOW_SPACING, WINDOW_SPACING + 1):
                if (x + dx, y + dy) in taken:
                    return True
        return False

    def place(x: int, y: int, width: int, height: int, material: str) -> None:
        index = ctx.ink(material)
        for row in range(y, y + height):
            for col in range(x, x + width):
                taken.add((col, row))
                canvas.put(col, row, index)
        # §3: each bright window gets EXACTLY ONE pixel of warm bleed and
        # then stops. ONE PIXEL, not a ring -- the ring at r=1 averages L 40.5
        # against a town background of 25.4, which is an average over a few
        # lit neighbours and a lot of dark ones, and a full 3×3 halo on every
        # bright window builds the collective glow §6 spends a paragraph
        # forbidding. §9.5: a haze over the town, a lift in the sky behind
        # it, a warm bloom on the hill — all three are wrong.
        if material == "lit_window_hot":
            spill = ctx.ink("lit_window_dim")
            for col, row in ((x + width, y), (x, y + height)):
                if (col, row) not in taken and not blocked(col, row):
                    canvas.put(col, row, spill)

    # The headframe stack first: it is the region's one deliberate vertical
    # and it must not lose its slots to the scatter.
    for x, y in HEADFRAME_WINDOWS:
        place(x, y, 2, 2 if y < 50 else 1, "lit_window")

    # §4's brightness spread: min 44, quartile 70, median 87, upper quartile
    # 97, max 126. Genuinely varied across a factor of three.
    ladder = (["lit_window_hot"] * HOT_LIGHTS + ["lit_window_bright"] * 15
              + ["lit_window"] * 18 + ["lit_window_dim"] * 14)
    rng.shuffle(ladder)

    #: §4's footprint census: 42% single pixels, 21% horizontal pairs, 19%
    #: vertical pairs, 9% 2×2, 7% larger. Horizontal and vertical pairs are
    #: used almost equally -- imposing an orientation convention looks like a
    #: pattern.
    shapes = ((1, 1),) * 24 + ((2, 1),) * 12 + ((1, 2),) * 11 + ((2, 2),) * 5 \
        + ((3, 2), (2, 3), (2, 4), (2, 2))

    slot = 0
    for band, count in enumerate(BAND_COUNTS):
        left = BAND_FROM + band * 10
        for _ in range(count):
            for _attempt in range(60):
                x = left + rng.randrange(10)
                # §4: density rises toward the bottom -- bright window pixels
                # per row climb from 5 at y=50 to 11-13 at y 63-67. That is
                # the perspective cue, so the pick is weighted downward.
                y = field_y + int(field_h * max(rng.random(), rng.random()))
                width, height = shapes[slot % len(shapes)]
                material = ladder[slot % len(ladder)]
                # §7.3's mechanical rule: the ceiling colour never appears
                # more than twice in a row and never in a 2×2.
                if material == "lit_window_hot" and width * height > 2:
                    width, height = 2, 1
                if any(blocked(x + dx, y + dy)
                       for dy in range(height) for dx in range(width)):
                    continue
                place(x, y, width, height, material)
                slot += 1
                break

    # §4: the one storefront strip, and the only footprint larger than 2×4.
    place(140, 66, 6, 2, "lit_window")
    # §4: the far outlier at (164-165, 59-60), one lit building on the edge
    # of the settlement, alone on a smooth dark hill, and one of the brightest.
    place(164, 59, 2, 2, "lit_window_bright")
