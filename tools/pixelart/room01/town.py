"""Room 1 — Consolation, downhill and two miles off.

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

HOW THE MATERIAL IS BUILT. Per row, a walk of three things in turn: a dark
gap, a roof-highlight run at §2.4's measured mean of 2.06 px, and a pixel or
two of the shaded wall under its eave. The gap shrinks and the run count
rises toward the near edge, and all of it dissolves eastward. That walk is
what produces the roughness -- every boundary in it is a value step, three
or four of them every ten pixels -- and it is the whole drawing. Nothing is
composed as an object except the headframe and the seven legible ridges,
exactly as §6 describes.

Under the walk sits one coarse and one fine partition into irregular column
blocks, each with its own density bias and its own preferred colour. That is
the only structure in the mass, and it is a weighting rather than a stencil:
it gives the noise vertical coherence, so a roof plane survives two or three
rows and five buildings resolve out of a field that is not drawing any.

THE BACKGROUND OF THE MASS IS THE HILL'S OWN COLOUR. §5's table gives
`accent_indigo` 0 for "hill backdrop, dark wall mass" and it is 35% of the
band in the locked-palette proof -- the single most-used entry in the town.
The gaps between buildings are not a darker grey, they are the hill showing
through, which is why the silhouette does not read as a cut-out.

AND THE ROOFS ARE BLUE WHILE THE WALLS ARE GREY. The proof puts 106 pixels
of `accent_indigo` 1 in the band against 81 of `grey` 2 at almost the same
value, and 69% of the bar's town pixels are blue-dominant. There is exactly
one light on a roof plane in this frame and it is the sky glow; there is
none at all on a wall. So a roof takes the sky's own horizon colour, a wall
takes the neutral it would photograph as, and the mass comes out reading as
a blue thing with grey in it -- which is what it is -- without ever leaving
§5's six-step cool structure.

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
on AREA. The ceiling colour totals 24 pixels, they sit in 21 separate blobs,
and THE LARGEST IS TWO PIXELS. The rule is
mechanical: in this region the ceiling colour never appears more than twice
in a row and never in a 2×2. It is enforced in code rather than remembered,
because it is the one budget in the frame that a plausible-looking edit
breaks silently.

AND THE WINDOWS ARE NOT ALL THE SAME COLOUR. §4: peak luminance per light
runs min 44, quartile 70, median 87, upper quartile 97, max 126 -- a factor
of three. §5 gets that spread out of steps at similar VALUE and different
SATURATION (umber 14 sat 0.46, ochre 8 sat 0.72, pine_fresh 6 sat 0.62),
which is how sixty windows all read as lamplight without sixty of them
being the same lamp.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: town.md §2.3. Top edge nearly flat at y = 51 ± 2 from x=89 to x=140, then
#: falling away to y≈57 at x=148 and y≈62 at x=152. It enters the rect
#: already in progress at x=60 and continues left behind the foreground.
MASS_LEFT, MASS_RIGHT = 62, 152
ROOF_PROFILE = ((62, 53), (89, 52), (105, 51), (120, 52), (140, 54),
                (148, 58), (152, 62))

#: §6, and it is the whole east end: "the town has no right-hand edge; it has
#: a thinning." Roughness falls from 14 to 4.5 across x 138-152 while five
#: isolated lights carry on to x=174. A clean edge at x=150 makes it look
#: like a stage flat, so the run-length walk is faded out over these columns
#: rather than stopped.
DISSOLVE_FROM, DISSOLVE_TO = 142, 155

#: §2.2. The trough is an ELEMENT, not an absence: four to five rows of
#: near-nothing, mean L 15-16, and it is what makes the roofline read. Its
#: right edge is not straight -- at y 45-47 the range's lit face comes down
#: to x≈146 and the trough stops short of it; by y 49 it runs to x≈150.
TROUGH_ROWS = (45, 50)
TROUGH_LEFT = 88
TROUGH_RIGHT = ((45, 143), (50, 150))

#: §4. Lights per 10-px column band from x=70 to x=179. Uniform at 7-9 from
#: x=80 to x=139, then 5, then 3, then singles. East of x=150 there are five
#: isolated lights and the town has no right-hand edge, only a thinning.
BAND_COUNTS = (3, 8, 7, 9, 9, 6, 9, 5, 3, 1, 1)
BAND_FROM = 70

#: §4: median nearest-neighbour distance 3.2 px, hard minimum 2. No two
#: windows ever touch -- there is always at least one dark pixel between.
WINDOW_SPACING = 2

#: §4: "the most any single row holds is 7 of 57". Two rows of four aligned
#: windows read as a hotel and break the scale, so the row is a hard cap.
WINDOWS_PER_ROW = 7

#: §2.10. Four stacked lights in a 6-px column. This vertical stack over
#: eight rows is the ONLY one in the picture and it is what makes the
#: headframe read as tall rather than as more town.
HEADFRAME_WINDOWS = ((87, 43, 2, 2), (83, 46, 2, 2), (83, 50, 2, 1),
                     (87, 50, 2, 1))

#: §2.5. The seven horizontal highlight runs that are the only marks reading
#: as an individual building's ridge. Everything else is 5 px or shorter.
#: Every additional long run costs a building's worth of ambiguity.
ROOF_STROKES = layout.TOWN_ROOF_STROKES

#: §7.3's ration, in pixels rather than in lights, because pixels are what
#: the lantern is outweighed in. Twenty-four of the ceiling colour, in blobs
#: of at most two.
HOT_PIXEL_BUDGET = 24
HOT_BLOB_MAX = 2

#: §4's outliers, measured: the storefront strip -- the one footprint larger
#: than 2×4 anywhere in the region -- and the five isolated lights east of
#: x=150 that the town thins out into. (164-165, 59-60) is the far one and
#: one of the brightest: a single lit building alone on a smooth dark hill.
STOREFRONT = (140, 66, 6, 2)
EAST_LIGHTS = ((148, 62, 1, 2), (150, 64, 2, 1), (156, 61, 1, 1),
               (158, 65, 1, 1), (164, 59, 2, 2), (174, 63, 1, 1))

#: §2.14's moonlit foot band, as (x, luminance) control points read off the
#: bar's own per-10-column cool means for its two rows. It is the far bank
#: the town stands on and the seam with the mid-ground, and the town's lowest
#: windows sit directly on top of it with no dark break.
#:
#: THE TWO ROWS ARE NOT THE SAME BAND ONE STEP APART. The upper row is dark
#: to the west and only lights up from x≈139, which is where §2.14's first
#: bright stretch starts; the lower row is bright from x≈120 and peaks at
#: x≈145. Drawing the pair as a bar and a shadow loses the diagonal that
#: reading gives the bank, which is the only thing in the region that says
#: the ground is turning toward the viewer.
FOOT_UPPER = ((62, 19.0), (100, 19.0), (110, 22.6), (120, 22.0), (130, 27.5),
              (139, 34.3), (150, 37.6), (160, 34.0), (170, 37.0), (179, 37.0))
FOOT_LOWER = ((62, 24.0), (100, 28.0), (110, 27.8), (120, 36.0), (130, 40.8),
              (140, 46.5), (150, 37.2), (160, 30.9), (170, 37.2), (179, 37.2))

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


# ---------------------------------------------------------------------------
# geometry
# ---------------------------------------------------------------------------


def _roof_y(x: int) -> int:
    for (x0, y0), (x1, y1) in zip(ROOF_PROFILE, ROOF_PROFILE[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return int(round(y0 + (y1 - y0) * t))
    return ROOF_PROFILE[-1][1]


def _occluded(x: int, y: int) -> bool:
    for ox, oy, ow, oh in OCCLUDED:
        if ox <= x < ox + ow and oy <= y < oy + oh:
            return True
    return False


def _put(canvas: IndexedCanvas, x: int, y: int, index: int) -> None:
    """Paint, unless the foreground is going to cover it anyway (§9.10)."""
    if not _occluded(x, y):
        canvas.put(x, y, index)


def _density(x: int, y: int) -> float:
    """How much of a row at (x, y) is building rather than gap, 0 to 1.

    Two measured gradients, and they are the region's whole perspective. §4:
    bright window pixels per row climb from 5 at y=50 to 11-13 at y 63-67 --
    the near edge of town is brighter and busier than its upper terraces.
    §6: roughness drops from 14 to 4.5 at x≈150 and the mass stops, but the
    lights carry on, so the east end DISSOLVES rather than ending.
    """
    top = _roof_y(x)
    depth = (y - top) / max(1.0, layout.TOWN_BASE_Y - top)
    value = 0.44 + 0.50 * max(0.0, min(1.0, depth))
    if x > DISSOLVE_FROM:
        value *= max(0.0, 1.0 - (x - DISSOLVE_FROM) / (DISSOLVE_TO - DISSOLVE_FROM))
    return value


def _trough_right(y: int) -> int:
    (y0, x0), (y1, x1) = TROUGH_RIGHT
    t = (y - y0) / max(1, y1 - y0)
    return int(round(x0 + (x1 - x0) * max(0.0, min(1.0, t))))


# ---------------------------------------------------------------------------
# the elements
# ---------------------------------------------------------------------------


def _mass_dark(ctx: layout.Ctx) -> int:
    """§5: `accent_indigo` 0, the hill backdrop AND the dark wall mass.

    layout.MATERIALS names this step twice already -- `night_sky` and
    `far_rock` -- and neither is what the town's gaps are, so it now carries
    a third name that is: `town_mass_dark`, in COLD_MATERIALS. Step 0 is
    safely clear of the puddles' reserved `accent_indigo` 2-4.
    """
    return ctx.ink("town_mass_dark")


def _trough(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.2. Four to five rows of near-nothing, and it is what makes the
    roofline read: without it the town has no top edge.

    Not a dead plate. The measured band is mean L 14.9 with a scatter of
    slightly lighter pixels through it -- the hill's own colour showing where
    the trough is shallow -- and a flat rectangle at L 16 reads as a printing
    error rather than as the foot of a range.

    AND IT DOES NOT CROSS THE NEAR RANGE'S LIT FACE. The band's measured
    right edge runs x=143 at y=45 to x=150 at y=50, and range.md §2's lit
    cone has its bright step at x 145-152 over exactly those rows -- so the
    trough, drawn second, was taking 28 px off the face's left flank where
    the bar has the face. The two are not at the same depth: the face is the
    near range and the trough is the dark foot in front of the town behind
    it, so the face is the one that wins the overlap. Skipping the face's own
    two materials is narrower than moving the trough's edge to x=145, which
    would also lose the six rows of trough that are correctly there.
    """
    rng = ctx.stream("town.trough")
    deep = ctx.ink("town_trough")
    dark = _mass_dark(ctx)
    face = {ctx.ink("near_rock_lit"), ctx.ink("near_rock_lit_mid")}
    low, high = TROUGH_ROWS
    for y in range(low, high):
        right = _trough_right(y)
        for x in range(TROUGH_LEFT, right + 1):
            if canvas.get(x, y) in face:
                continue
            _put(canvas, x, y, dark if rng.random() < 0.14 else deep)


#: §5's six-value cool structure, dark to light, with the luminance each one
#: actually carries in the locked palette. The whole region lives inside it
#: and §9.9 is explicit about what happens if it does not: reaching for
#: `grey` 5-7 to "make the roofs read" blows the town forward in depth and
#: puts it in the same plane as the coach.
COOL_LADDER = ((16.0, "town_trough"), (24.5, "town_wall"),
               (32.5, "town_wall_lit"), (40.6, "town_roof"),
               (53.5, "town_roof_bright"))


def _cool_at(ctx: layout.Ctx, rng, target: float) -> int:
    """The ladder step nearest a measured luminance, dithered between two.

    Six steps have to carry a band measured at half-step resolution, so a
    value between two of them is drawn as a random mix of the two in the
    ratio that averages to it. Whole index to whole pixel -- nothing blends;
    it is two colours in a proportion, which is the only kind of in-between
    an indexed palette has.
    """
    for (low, dark_name), (high, lit_name) in zip(COOL_LADDER, COOL_LADDER[1:]):
        if target <= high:
            share = (target - low) / (high - low)
            return ctx.ink(lit_name if rng.random() < share else dark_name)
    return ctx.ink(COOL_LADDER[-1][1])


def _at(profile: tuple[tuple[int, float], ...], x: int) -> float:
    """Piecewise-linear through measured (x, luminance) control points."""
    for (x0, v0), (x1, v1) in zip(profile, profile[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return v0 + (v1 - v0) * t
    return profile[-1][1]


def _blocks(rng) -> dict[int, tuple[float, float, bool]]:
    """A column partition, and it is the only structure under the texture.

    Randomising every row independently gives a field with the right run
    lengths, the right value histogram and the right roughness that still
    reads as television static, because nothing in it survives from one row
    to the next. The reference's mass has vertical coherence: a roof plane is
    two or three rows of similar value in the same columns, which is what
    lets five buildings resolve out of a texture that is not drawing any.

    So the mass is partitioned into irregular column blocks of 2-7 px, each
    with its own density bias and its own preferred stipple colour. It is a
    weighting, not a stencil -- a block has no edges, no top and no bottom,
    and nothing in it is filled. §9.3's toy village comes from drawing forty
    little 3×4 houses; this draws none, it only makes the noise lean.
    """
    coarse: dict[int, float] = {}
    x = MASS_LEFT
    while x <= MASS_RIGHT:
        width = 8 + int(rng.random() * 13)
        bias = -0.20 + rng.random() * 0.40
        for step in range(width):
            coarse[x + step] = bias
        x += width

    out: dict[int, tuple[float, float, bool]] = {}
    x = MASS_LEFT
    while x <= MASS_RIGHT:
        width = 2 + int(rng.random() * 6)
        bias = -0.22 + rng.random() * 0.42
        choice = rng.random()
        # A sixth of the blocks are in shade all the way down -- the alley,
        # and the wall with a lit one opposite. They are what supplies the
        # near-black the mass needs, and scattering single dark pixels
        # instead gives a value histogram that matches and a picture that
        # does not: the dark has to be in slots you can see between things.
        shaded = rng.random() < 0.09
        for step in range(width):
            out[x + step] = (bias + coarse.get(x + step, 0.0), choice, shaded)
        x += width
    return out


def _roof_ink(ctx: layout.Ctx, rng, roll: float | None = None) -> int:
    """One stipple pixel's colour. Weighted from the locked-palette proof.

    `roll` lets a column block hand in its own draw, so that a run of columns
    keeps leaning the same way from row to row.

    THE ROOFS ARE BLUE AND THE WALLS ARE GREY, and the split is not decorative.
    §5's table reads as though the whole town were `grey`, and the town band of
    the proof says otherwise: 106 of its pixels are `accent_indigo` 1 against
    81 of `grey` 2 at almost the same value. There is one light on a roof in
    this frame and it is the sky glow, which is saturated indigo; there is no
    light at all on a wall, so a wall is the neutral it would be in a
    photograph. That is why the mass reads blue overall (69% of the bar's town
    pixels are blue-dominant) while never leaving the six-step cool structure.

    `accent_indigo` 1 is the sky's own horizon colour, which is the point --
    a roof plane is a mirror of the sky above it. layout carries it under the
    town's own name, `town_roof_sky`. Step 1 and never step 2: the puddles
    hold `accent_indigo` 2-4 and layout.keep() protects them.
    """
    roll = rng.random() if roll is None else roll
    if roll < 0.48:
        return ctx.ink("town_roof_sky")                    # L 33.8, sky-lit
    if roll < 0.72:
        return ctx.ink("town_wall_lit")                    # grey 2, L 32.5
    if roll < 0.94:
        return ctx.ink("town_roof")                        # grey 3, L 40.6
    return ctx.ink("town_roof_bright")                     # grey 4, L 53.5


def _mass(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    rng = ctx.stream("town.mass")
    dark = _mass_dark(ctx)              # accent_indigo 0, L 21.7
    deep = ctx.ink("town_trough")       # grey 0, L 16.0
    wall = ctx.ink("town_wall")         # grey 1, L 24.5
    lit = ctx.ink("town_wall_lit")      # grey 2, L 32.5
    roof = ctx.ink("town_roof")         # grey 3, L 40.6
    bright = ctx.ink("town_roof_bright")  # grey 4, L 53.5
    base = layout.TOWN_BASE_Y

    # 1. The silhouette, filled with the colour of the hill behind it. §9.6's
    #    warning about the headframe applies to the whole mass: give it an
    #    edge and it stops being a place and starts being an object.
    tops = {}
    for x in range(MASS_LEFT, MASS_RIGHT + 1):
        top = _roof_y(x)
        # §2.3: ragged by two or three pixels where chimneys and gable peaks
        # poke up. Two or three. Not a skyline.
        if rng.random() < 0.18:
            top -= 1 + (rng.random() < 0.3)
        tops[x] = top
        for y in range(top, base + 1):
            _put(canvas, x, y, dark)

    # 2. The material. A run-length walk per row: gap, ROOF, wall, gap, ROOF,
    #    wall. The gap is the hill showing between buildings; the roof is a
    #    stipple run at §2.4's measured mean of 2.06 px; the wall is the pixel
    #    or two of shaded face below the eave. The gap length is driven by
    #    _density, so the upper terraces are mostly gap and the near edge is
    #    mostly building. THIS is where the roughness comes from -- three or
    #    four value steps every ten pixels, at a mean value that never moves
    #    more than five points off the hill's.
    #
    #    ROOF OUTNUMBERS WALL, about two to one. That is what a town looks
    #    like from several hundred feet up and two miles out, and it is what
    #    the locked-palette proof measures: the mass is 28% highlight stipple
    #    against 15% wall, with the remaining 35% cool background showing
    #    through and 22% windows punched into it.
    blocks = _blocks(ctx.stream("town.blocks"))
    for y in range(layout.TOWN_ROOF_Y - 2, base + 1):
        x = MASS_LEFT
        while x <= MASS_RIGHT:
            bias, _choice, _shaded = blocks.get(x, (0.0, None, False))
            weight = max(0.05, min(1.0, _density(x, y) + bias))
            x += 1 + int(rng.random() * (1.0 + 4.0 * (1.0 - weight)))
            if x > MASS_RIGHT:
                break
            # §6: highlights are STIPPLE, not lines. Mean run 2.06 px, and
            # 106 of the 157 runs are a single pixel; the seven runs of 6-9
            # in §2.5 are the entire budget of "this is a specific roof".
            run = 1 if rng.random() < 0.68 else 2 if rng.random() < 0.55 \
                else 3 + (rng.random() < 0.3)
            bias, choice, shaded = blocks.get(x, (0.0, None, False))
            if shaded:
                ink = wall if rng.random() < 0.75 else deep
            else:
                ink = _roof_ink(ctx, rng,
                                choice if choice is not None and rng.random() < 0.6
                                else None)
            for step in range(run):
                if x + step <= MASS_RIGHT and y >= tops.get(x + step, base + 1):
                    _put(canvas, x + step, y, ink)
            x += run
            # The shaded face under the eave. One or two pixels, and it is
            # what stops the stipple reading as snow on a hillside.
            tail = 0 if rng.random() > 0.32 + 0.3 * weight else 1 + (rng.random() < 0.3)
            for step in range(tail):
                if x + step <= MASS_RIGHT and y >= tops.get(x + step, base + 1):
                    _put(canvas, x + step, y,
                         deep if (shaded and rng.random() < 0.5)
                         or rng.random() > 0.92 else wall)
            x += tail

    # 2b. The crest. The mass's own top row gets a stipple pixel about a third
    #     of the time -- the ridge tile catching the sky, which is the only
    #     plane in the town facing straight up at the one light there is.
    #     §2.2 says the trough is what makes the roofline read, and that is
    #     only half of it: a hard dark band under a soft top edge reads as fog.
    #     The town needs an edge ON ITS SIDE of the boundary too, and at this
    #     scale that edge is single pixels, not a line. Never two adjacent, so
    #     it cannot collapse into the skyline §9.4 forbids.
    previous = False
    for x in range(MASS_LEFT, MASS_RIGHT + 1):
        top = tops[x]
        if previous or rng.random() > 0.34 * min(1.0, _density(x, top) + 0.4):
            previous = False
            continue
        _put(canvas, x, top, _roof_ink(ctx, rng))
        previous = True

    # 3. The deepest slots. §5 gives `grey` 0 to "the dark trough, deepest
    #    gaps between buildings" -- the alleys, and the shaded side of a wall
    #    that has a lit one opposite. Placed AFTER the walls so they cut.
    for _ in range(20):
        x = rng.randrange(MASS_LEFT, MASS_RIGHT + 1)
        y = rng.randrange(tops.get(x, base), base + 1)
        if rng.random() > _density(x, y) + 0.25:
            continue
        height = 1 + (rng.random() < 0.35)
        for step in range(height):
            _put(canvas, x, y + step, deep)

    # 4. §2.5's seven legible ridges, and they are the entire budget of "this
    #    is a specific roof". Six at the roof highlight, one at the top cool
    #    value -- the brightest single roof pixel in the reference is L=52.
    for index, (sx, sy, length) in enumerate(ROOF_STROKES):
        canvas.hline(sx, sy, length, bright if index == 3 else roof)


def _headframe(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.6-9 and §9.6. Built out of three marks, not a shape.

    Its body has NO silhouette contrast at all -- mean L 17-22 against a hill
    at 15-20 -- and it is legible entirely through a 4-px cool cap, a 4-px
    plume and a vertical stack of four windows. Give it a rim light and the
    town becomes its backdrop instead of its subject. So the body is painted
    in the hill's own colour with two pixels of `grey` 1 in it, which is the
    +2 the measurement actually shows, and nothing else.
    """
    rng = ctx.stream("town.headframe")
    x, y, width, height = layout.HEADFRAME
    dark = _mass_dark(ctx)
    wall = ctx.ink("town_wall")
    for row in range(y, y + height):
        for col in range(x, x + width):
            _put(canvas, col, row, wall if rng.random() < 0.12 else dark)

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
    # compositional line pointing at nothing. `grey` 2 alone is +10.8 over the
    # hill, so the diagonal alternates 2 and 1 and averages +7.
    (tx0, ty0), (tx1, ty1) = layout.TRAMWAY
    faint = ctx.ink("town_wall")
    strong = ctx.ink("town_wall_lit")
    steps = max(abs(tx1 - tx0), abs(ty1 - ty0))
    for step in range(steps + 1):
        t = step / steps
        _put(canvas, int(round(tx0 + (tx1 - tx0) * t)),
             int(round(ty0 + (ty1 - ty0) * t)),
             strong if step % 2 else faint)


def _foot_band(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.14. The far bank the town stands on, and the seam with mid-ground.

    Measured on the bar: rows 67-68, brightest across x 139-155 and x 164-179
    at L 31-37, about +8 over the rows either side, and distinctly dimmer
    between and to the west. The town's lowest windows sit directly on top of
    it with no dark break, so it goes down before they do.
    """
    rng = ctx.stream("town.foot")
    wall = ctx.ink("town_wall")
    lit = ctx.ink("town_wall_lit")
    roof = ctx.ink("town_roof")
    low, high = layout.TOWN_FOOT_BAND
    # §2.14 measures the band to the right edge of the rect and no further:
    # past x=179 it is the mid-ground region's ground, not the far bank the
    # town stands on. Both profiles are the bar's own per-10-column means.
    for y in range(low, high):
        profile = FOOT_UPPER if y == low else FOOT_LOWER
        for x in range(MASS_LEFT, 180):
            _put(canvas, x, y, _cool_at(ctx, rng, _at(profile, x)))


# ---------------------------------------------------------------------------
# the windows
# ---------------------------------------------------------------------------


def _window_ramp(ctx: layout.Ctx) -> tuple[int, ...]:
    """§5's warm ramp, dimmest first. Eight entries, five real steps.

    Four of the six families/steps §5 names are in layout.MATERIALS; `umber`
    14 and `pine_fresh` 5-6 are not, and are reached as offsets along the
    ramp of the material that shares their family, which is the only legal
    way to move a colour here. The steps are chosen to sit at SIMILAR VALUES
    WITH DIFFERENT SATURATION -- umber 14 at 0.46, ochre 8 at 0.72,
    pine_fresh 6 at 0.62 -- so that sixty windows read as sixty lamps.
    """
    return (
        ctx.ink("lit_window_dim"),        # mud 6          L 43.7
        ctx.ink("lit_window_dim", 3),     # mud 9          L 60.6
        ctx.ink("lit_window"),            # umber 10       L 68.7
        ctx.ink("lit_mud", 1),            # pine_fresh 5   L 70.1
        ctx.ink("lit_mud", 2),            # pine_fresh 6   L 78.8
        ctx.ink("lit_window_bright"),     # ochre 8        L 85.0
        ctx.ink("lit_window", 4),         # umber 14       L 98.2
        ctx.ink("lit_window_hot"),        # ochre 13       L 126.0 -- CEILING
    )


#: §4's brightness spread: peak L per light min 44, q1 70, median 87, q3 97,
#: max 126. Sixty-one lights distributed over the ramp above, by index.
#:
#: The count at the ceiling is set by §7 and not by §4. §4 says fourteen of
#: sixty lights reach ochre 13; §7 says the ceiling colour occupies 24 pixels
#: in 21 SEPARATE BLOBS with the largest at two. Twenty-one blobs cannot come
#: out of fourteen lights when no blob may exceed two pixels, so the blob
#: count is the binding one -- it is the number §7 uses to rank the town
#: against the lantern, and it is the number that keeps a hot window from
#: pooling. Eighteen lights at one hot pixel each, with a few taking two.
PEAK_MIX = ((7, 20), (6, 12), (5, 11), (4, 7), (3, 5), (2, 4), (1, 1), (0, 1))

#: §4's footprint census, as (width, height) with its measured count. Nothing
#: larger, and horizontal and vertical pairs are used almost equally -- there
#: is no orientation convention and imposing one will look like a pattern.
FOOTPRINTS = (((1, 1), 24), ((2, 1), 12), ((1, 2), 11), ((2, 2), 5),
              ((3, 2), 1), ((2, 3), 1), ((2, 4), 1))


class _Field:
    """The window field's bookkeeping: spacing, the row cap, the hot ration.

    All three are budgets that a plausible edit breaks silently, so they are
    checked at the point of painting rather than audited afterwards.
    """

    def __init__(self, canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
        self.canvas = canvas
        self.ctx = ctx
        self.ramp = _window_ramp(ctx)
        self.hot = self.ramp[-1]
        # §5's outermost tier is a RANGE, "mud 5-7 or umber 6-7, L 38-50",
        # and the bar's warm histogram puts 46 pixels in the forties and 58
        # in the fifties. One flat spill colour leaves a hole at L 50-59 and
        # piles a hundred pixels on a single dull step, which is what turns
        # sixty lamps into sixty smudges: the dim ring is most of the town's
        # warm area, so its spread is most of the town's warm character.
        self.spills = (ctx.ink("lit_window_dim"),        # mud 6   L 43.7
                       ctx.ink("lit_window_dim", 1),     # mud 7   L 49.5
                       ctx.ink("lit_window", -2))        # umber 8 L 55.8
        self.taken: set[tuple[int, int]] = set()
        self.cores: set[tuple[int, int]] = set()
        self.per_row: dict[int, int] = {}
        self.hot_left = HOT_PIXEL_BUDGET
        fx, fy, fw, fh = layout.TOWN_WINDOW_FIELD
        self.bounds = (fx, fy, fx + fw - 1, fy + fh - 1)

    # -- tests ------------------------------------------------------------

    def vacant(self, x: int, y: int) -> bool:
        """Inside the field, not already warm, and not behind the foreground."""
        x0, y0, x1, y1 = self.bounds
        if not (x0 <= x <= x1 and y0 <= y <= y1):
            return False
        return not _occluded(x, y) and (x, y) not in self.taken

    def free(self, x: int, y: int, reach: int = WINDOW_SPACING) -> bool:
        """vacant, and no window core within `reach` pixels.

        Spacing is a rule about CORES -- "no two windows ever touch, there is
        always at least one dark pixel between them" -- so the spill test is
        `vacant` and only the placement test is this one. Applying the
        spacing rule to spill as well leaves every bright window with nowhere
        to bleed, which measures as a town with a third of the reference's
        warm pixels and reads as a town seen through drizzle.

        REACH IS 2 AND THEN 1, and the retreat is the point. §4 gives median
        nearest-neighbour 3.2 px and a hard MINIMUM of 2, which means most
        pairs are well apart and a few are as close as the dark pixel between
        them allows. Enforcing 2 everywhere is enforcing the median as a
        floor: sixty lights each claiming a 5×5 exclusion need more room than
        the field has, a fifth of them fail to place, and the town comes out
        evenly spread and a third short -- which is the one thing §4 warns a
        placement rule must not produce. So the first forty attempts ask for
        the median and the rest settle for the minimum.
        """
        if not self.vacant(x, y):
            return False
        for dy in range(-reach, reach + 1):
            for dx in range(-reach, reach + 1):
                if (x + dx, y + dy) in self.cores:
                    return False
        return True

    def fits(self, x: int, y: int, width: int, height: int,
             reach: int = WINDOW_SPACING) -> bool:
        # §4's cap is LIGHTS per row, not lit pixels per row: "the most any
        # single row holds is 7 of 57" against a measured 19 to 25 warm
        # pixels on the busiest rows. Counting pixels here caps the near edge
        # of town at a third of the reference's light and flattens the one
        # gradient that says the near terraces are nearer.
        if any(self.per_row.get(row, 0) >= WINDOWS_PER_ROW
               for row in range(y, y + height)):
            return False
        return all(self.free(x + dx, y + dy, reach)
                   for dy in range(height) for dx in range(width))

    # -- painting ---------------------------------------------------------

    def place(self, x: int, y: int, width: int, height: int, peak: int,
              rng) -> None:
        """One light: a core at its peak colour, a body a step or two down.

        §7.3, mechanical: the ceiling colour never appears more than twice in
        a row and never in a 2×2. A light whose peak IS the ceiling therefore
        gets one or two ceiling pixels and the rest of its footprint at the
        step below, which is also where §4's "peak luminance per light" comes
        from -- a peak is one pixel, not a fill.
        """
        top = self.ramp[peak]
        body = self.ramp[max(0, peak - 1 - (rng.random() < 0.4))]
        hot_here = 0
        cells = [(x + dx, y + dy) for dy in range(height) for dx in range(width)]
        rng.shuffle(cells)
        core = 1
        if top == self.hot:
            # "never more than twice in a row and never in a 2×2": a pair is
            # only ever taken along a single row, so two ceiling pixels can
            # never close a square. The shuffle would otherwise put them on a
            # diagonal, which is a 2×2 with two corners lit and reads -- and
            # box-blurs -- as a four-pixel pool.
            pair = height == 1 and width >= 2 and rng.random() < 0.4
            if pair:
                cells.sort()
            core = min(HOT_BLOB_MAX if pair else 1, max(0, self.hot_left))
        for row in range(y, y + height):
            self.per_row[row] = self.per_row.get(row, 0) + 1
        for order, (cx, cy) in enumerate(cells):
            ink = top if order < core else body
            if ink == self.hot:
                hot_here += 1
            self.taken.add((cx, cy))
            self.cores.add((cx, cy))
            _put(self.canvas, cx, cy, ink)
        if top == self.hot:
            self.hot_left -= hot_here

        # §3's glow, and its whole extent: the ring at r=1 averages L 40.5
        # against a town background of 25.4 and the ring at r=2 is back to
        # background. That is not a halo -- it is one or two lit pixels
        # leaning off a bright window, and then nothing. A full 3×3 on every
        # window builds the collective glow §6 spends a paragraph forbidding.
        if peak < 4:
            return
        neighbours = [(x - 1, y), (x + width, y), (x, y - 1), (x, y + height),
                      (x - 1, y + height - 1), (x + width, y + height - 1),
                      (x + width - 1, y - 1), (x + width - 1, y + height)]
        rng.shuffle(neighbours)
        # Not every light bleeds. §4 counts 57 cores and 61 lights INCLUDING
        # their dim spill, and the bar's warm components at the spill
        # threshold are still 12 singles and 23 pairs -- a third of the town's
        # lights are one or two pixels with nothing at all around them.
        # Spilling from all of them merges the field into a single warm
        # crust and loses the sixty separate lamps that are the point.
        budget = (1 if rng.random() < 0.6 else 0) if peak < 6 \
            else 2 + (rng.random() < 0.45)
        for cx, cy in neighbours[:budget]:
            if self.vacant(cx, cy):
                self.taken.add((cx, cy))
                roll = rng.random()
                _put(self.canvas, cx, cy,
                     self.spills[0] if roll < 0.22
                     else self.spills[1] if roll < 0.48 else self.spills[2])


def _windows(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Sixty lights, individually placed, on no grid whatsoever.

    §9.2: max 7 lights on any one row out of 57, only 60% of columns carry a
    light at all, median spacing 3.2 px with a hard minimum of 2. Placing
    windows by storey and bay is the natural way to draw a building and it is
    fatal here.
    """
    rng = ctx.stream("town.windows")
    field = _Field(canvas, ctx)

    # The headframe stack first: it is the region's one deliberate vertical
    # and it must not lose its slots to the scatter. §2.10 -- four stacked
    # lights over eight rows in a 6-px column, and it is the ONLY vertical
    # stack in the picture.
    for x, y, width, height in HEADFRAME_WINDOWS:
        field.place(x, y, width, height, 5, rng)

    # §4's outliers, before the scatter can take their ground.
    sx, sy, sw, sh = STOREFRONT
    field.place(sx, sy, sw, sh, 2, rng)
    for ex, ey, ew, eh in EAST_LIGHTS:
        if field.fits(ex, ey, ew, eh):
            field.place(ex, ey, ew, eh, 6 if ew * eh > 1 else 4, rng)

    peaks = [peak for peak, count in PEAK_MIX for _ in range(count)]
    shapes = [shape for shape, count in FOOTPRINTS for _ in range(count)]
    rng.shuffle(peaks)
    rng.shuffle(shapes)

    slot = 0
    for band, count in enumerate(BAND_COUNTS):
        left = BAND_FROM + band * 10
        for _ in range(count):
            for _attempt in range(80):
                x = left + rng.randrange(10)
                # §4: density rises toward the bottom -- bright window pixels
                # per row climb from 5 at y=50 to 11-13 at y 63-67. That is
                # the perspective cue, so the pick is weighted downward.
                top = max(_roof_y(x) + 1, layout.TOWN_ROOF_Y)
                if x > MASS_RIGHT:
                    break
                span = layout.TOWN_BASE_Y - top
                if span <= 0:
                    break
                # Weighted down, but not steeply: the reference still puts
                # eleven to sixteen lit pixels on rows 53, 54, 56 and 57,
                # high up the hill. A hard max-of-two empties the upper
                # terraces and leaves the town looking like one lit street.
                reach = rng.random()
                if rng.random() < 0.6:
                    reach = max(reach, rng.random())
                y = top + int(span * reach + 0.5)
                width, height = shapes[slot % len(shapes)]
                reach = WINDOW_SPACING if _attempt < 40 else 1
                if not field.fits(x, y, width, height, reach):
                    continue
                peak = peaks[slot % len(peaks)]
                if peak == 7 and field.hot_left <= 0:
                    peak = 6
                field.place(x, y, width, height, peak, rng)
                slot += 1
                break
