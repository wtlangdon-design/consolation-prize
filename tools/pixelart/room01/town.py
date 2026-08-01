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

from dataclasses import dataclass

from canvas import IndexedCanvas

from . import layout


#: town.md §2.3. Top edge nearly flat at y = 51 ± 2 from x=89 to x=140, then
#: falling away to y≈57 at x=148 and y≈62 at x=152. It enters the rect
#: already in progress at x=60 and continues left behind the foreground.
#:
#: MEASURED AGAIN OFF THE PROOF, because the old profile ran two rows low
#: through the middle and the mass then had nothing on its top three rows.
#: Scanning the locked-palette proof for the first row at L >= 28 in each
#: column gives 52, 51, 52, 50, 51, 51, 50, 55, 53, 54, 52, 52, 51, 54, 51,
#: 52, 52 across x 94-136 -- mean 51.9, and the two rows above it already
#: carry the mass. So the ridge is 51 from x=94 to x=136, not 51 at x=105
#: sagging to 54 by x=140, and the fall east starts at 138 rather than 120.
#:
#: AND IT SITS ONE ROW LOWER THAN THAT SCAN SAID, because the scan was for the
#: first row at L >= 28 and the mass's own top row does not reach 28. Measured
#: on the bar, cool pixels only over x 88-150: row 51 is 18.3 and row 52 is
#: 25.4 -- a seven-point step, and that step IS the roofline. With the profile
#: at 51 this region's row 51 came out at 23.1 and its row 52 at 24.9, an
#: edge of one and a half points, so the town had no top and the dark trough
#: above it read as eleven rows of nothing instead of six. §2.3 says y = 51
#: +/- 2 and the proof's own mean is 51.9; 52 is inside both and it is the
#: only value that puts the step where the bar has it.
MASS_LEFT, MASS_RIGHT = 62, 152
ROOF_PROFILE = ((62, 54), (89, 53), (100, 52), (124, 52), (138, 53),
                (146, 57), (152, 62))

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
TROUGH_ROWS = (45, 52)
TROUGH_LEFT = 88
TROUGH_RIGHT = ((45, 143), (50, 150))

#: THE TROUGH IS A RAMP, NOT A PLATE, and this is the measurement that says
#: so. Counted in the locked-palette proof over x 88-150, the fraction of
#: each row that is `grey` 0 against `accent_indigo` 0:
#:
#:     row 45   grey 0 = 11%   indigo 0 = 78%    mean L 21.5
#:     row 46             29%              57%          20.4
#:     row 47             42%              51%          19.7
#:     row 48             57%              33%          18.8
#:     row 49             70%              24%          17.9
#:     row 50             63%              16%          20.5  (town starting)
#:
#: So the band does not begin; it DARKENS INTO EXISTENCE over five rows,
#: starting as the hill's own colour with a few grey pixels in it and ending
#: as grey with a few hill pixels in it. Drawn as one value from row 45 the
#: top edge is a ruled horizontal line sixty columns long -- which is what
#: this was, at 76% grey 0 on every row, mean L 17.5 flat -- and it read as a
#: printed bar rather than as the foot of a range. The floor is right; the
#: entrance was not. `grey` 1 holds a steady 6-14% throughout and is what
#: keeps the mix from reading as two colours.
#:
#: AND THE FLOOR WAS FOUR POINTS HIGH. Measured per row over x 88-150, the bar
#: runs 17.8 / 16.7 / 15.9 / 15.1 / 14.5 / 17.0 across rows 45-50 and this
#: pass ran 21.7 / 20.7 / 20.5 / 20.1 / 19.0 / 19.4. The trough is not a
#: decorative band -- §2.2 says it is what makes the roofline read -- and the
#: step from its floor to the town's top edge is the measurement that matters:
#: the bar climbs from 14.5 at row 49 to 34.6 at row 53, twenty points, and
#: this climbed nine. Half of that was the trough sitting too high. The shares
#: below are the proof's own ratio (45% `grey` 0 against 43% `accent_indigo`
#: 0 over the whole band) redistributed down the ramp the bar measures.
#: Row 51 is the sixth: the bar has it at 18.3, still trough, and the town
#: begins on 52. See ROOF_PROFILE.
TROUGH_GREY = ((45, 0.26), (46, 0.42), (47, 0.55), (48, 0.66), (49, 0.74),
               (50, 0.66), (51, 0.52))
TROUGH_WALL = 0.09

#: §4. Lights per 10-px column band from x=70 to x=179. Uniform at 7-9 from
#: x=80 to x=139, then 5, then 3, then singles. East of x=150 there are five
#: isolated lights and the town has no right-hand edge, only a thinning.
#:
#: x 140-149 IS A SIX-PIXEL STOREFRONT AND LITTLE ELSE. The proof puts 18
#: warm pixels in that band, and twelve of them are §4's one 6x2 strip; five
#: scattered lights on top of it measured 32. Three.
#:
#: AND THE COUNTS ARE LIGHTS WHILE THE MEASUREMENT IS PIXELS. Warm pixels per
#: ten-column band over y 44-68, bar against this region:
#:
#:     bar    97  41  30  35  38  36  34  19   8   3   1
#:     ours   65  42  33  20  39  21  26  28  11   6   2
#:
#: The middle of the town was a third short and the thinning east end was half
#: again over -- and the east end is where §6 says the town DISSOLVES, so
#: light spent out there does not read as more town, it reads as a second,
#: smaller town. §4's own outliers already cover x 140-179: the 6x2 storefront
#: strip is twelve warm pixels on its own and EAST_LIGHTS places five more
#: lights, all before the scatter runs. The scatter's job out there is nearly
#: finished before it starts, so its counts come down and the middle takes
#: what they had.
BAND_COUNTS = (3, 8, 7, 11, 9, 8, 9, 1, 2, 0, 0)
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
#:
#: AND EVERY RECT HERE IS A CLAIM ABOUT ANOTHER REGION'S DRAWING. The lamp
#: rect was (75, 62, 7, 7) and `left_yard` actually covers x 75-79, never 80
#: or 81 -- so this region skipped two columns nobody else drew. At y 62-67
#: `range`'s near mass happened to be underneath and the over-claim was
#: invisible; at y=68 the near mass has ended and `terrain` starts at y=69,
#: so (81, 68) was a hole with nothing in it at all. room01_seams.py found
#: it, `terrain` grew a patch that filled any pixel still holding the void
#: index -- which is a fix keyed on the CANVAS FILL rather than on the
#: drawing, so it worked in the render and left the seam check failing.
#: Narrowed to what the occluder occupies. An occlusion rect that is too
#: small costs a few covered pixels; one that is too large costs a hole.
OCCLUDED = (
    (0, 53, 85, 6),      # the gantry beam and its crossbeam, x <= 84
    (0, 60, 79, 9),      # the signboard, x <= 78 below y=60
    (75, 62, 5, 7),      # the hanging lamp and its post, x 75-79
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
    wall = ctx.ink("town_wall")
    face = {ctx.ink("near_rock_lit"), ctx.ink("near_rock_lit_mid")}
    grey_share = dict(TROUGH_GREY)
    low, high = TROUGH_ROWS
    for y in range(low, high):
        right = _trough_right(y)
        share = grey_share.get(y, 0.70)
        for x in range(TROUGH_LEFT, right + 1):
            if canvas.get(x, y) in face:
                continue
            roll = rng.random()
            if roll < TROUGH_WALL:
                ink = wall
            elif roll < TROUGH_WALL + share * (1.0 - TROUGH_WALL):
                ink = deep
            else:
                ink = dark
            _put(canvas, x, y, ink)


#: §5's six-value cool structure, dark to light, with the luminance each one
#: actually carries in the locked palette. The whole region lives inside it
#: and §9.9 is explicit about what happens if it does not: reaching for
#: `grey` 5-7 to "make the roofs read" blows the town forward in depth and
#: puts it in the same plane as the coach.
#:
#: AND TWO OF ITS RUNGS ARE BLUE. The ladder was five grey steps, so
#: everything drawn through it -- §2.14's whole foot band, sixty pixels wide
#: and two rows deep -- came out neutral. Counted in the locked-palette proof
#: at x 88-150, row 67 is 29% `accent_indigo` 0 against 21% `grey` 1, and the
#: same rung of the mass above it runs 35-40% indigo. This region's cool
#: structure is a blue thing with grey in it, not a grey thing; a rung with
#: no blue on it cannot draw that, and the grey accumulates where nobody is
#: looking at a single element.
#:
#: `accent_indigo` 0 at L 21.7 is its own rung between `grey` 0 and `grey` 1.
#: The 32.5 rung takes a same-value alternate instead -- `accent_indigo` 1 at
#: L 35.0 against `grey` 2 at L 32.5, one and a half luminance apart -- which
#: is layout's own matched-value pairing: two entries that differ in hue and
#: not in value, which is the one case the two-adjacent-steps dither rule is
#: not about.
COOL_LADDER = ((16.0, "town_trough", None),
               (21.7, "town_mass_dark", None),
               (24.5, "town_wall", "town_mass_dark"),
               (32.5, "town_wall_lit", "town_roof_sky"),
               (40.6, "town_roof", None),
               (53.5, "town_roof_bright", None))

#: How often a rung takes its same-value blue alternate rather than its own
#: neutral. The proof's own ratio on the rungs that have one.
COOL_BLUE_SHARE = 0.45


def _cool_at(ctx: layout.Ctx, rng, target: float) -> int:
    """The ladder step nearest a measured luminance, dithered between two.

    Six steps have to carry a band measured at half-step resolution, so a
    value between two of them is drawn as a random mix of the two in the
    ratio that averages to it. Whole index to whole pixel -- nothing blends;
    it is two colours in a proportion, which is the only kind of in-between
    an indexed palette has.
    """
    for (low, dark_name, dark_alt), (high, lit_name, lit_alt) in \
            zip(COOL_LADDER, COOL_LADDER[1:]):
        if target <= high:
            share = (target - low) / (high - low)
            name, alt = ((lit_name, lit_alt) if rng.random() < share
                         else (dark_name, dark_alt))
            if alt is not None and rng.random() < COOL_BLUE_SHARE:
                name = alt
            return ctx.ink(name)
    return ctx.ink(COOL_LADDER[-1][1])


def _at(profile: tuple[tuple[int, float], ...], x: int) -> float:
    """Piecewise-linear through measured (x, luminance) control points."""
    for (x0, v0), (x1, v1) in zip(profile, profile[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return v0 + (v1 - v0) * t
    return profile[-1][1]


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

    AND THE NEUTRALS LIVE HERE RATHER THAN ON THE PLATES. Horizontal run
    lengths per colour in the locked-palette proof, x 88-150, y 50-68:

        accent_indigo 1   112 px   53 runs   mean 2.11   five runs of 6
        grey 2            . 82 px   75 runs   mean 1.09   69 of 75 SINGLE
        grey 3            . 79 px   50 runs   mean 1.58   37 of 50 single
        grey 1             133 px   92 runs   mean 1.45   64 of 92 single

    Two colours a luminance and a half apart, and one of them is drawn as
    planes while the other is drawn as dust. That is the whole technique:
    the roof PLANE is blue and contiguous, and the roof HIGHLIGHT is neutral
    and one pixel. Putting `grey` 2 and 3 into the plate mixes instead gave
    them mean runs of 1.35 and 2.58 with grey 3 reaching nine, and 134 px of
    a colour the proof spends 79 on -- which reads at 320x144 as slabs of
    concrete laid across a hillside, and is §9.4's drawn roofline arriving by
    the back door.
    """
    roll = rng.random() if roll is None else roll
    if roll < 0.10:
        return ctx.ink("town_roof_sky")                    # L 35.0, sky-lit
    if roll < 0.48:
        return ctx.ink("town_wall_lit")                    # grey 2, L 32.5
    if roll < 0.88:
        return ctx.ink("town_roof")                        # grey 3, L 40.6
    return ctx.ink("town_roof_bright")                     # grey 4, L 53.5


#: Five terraces down the hillside. The mass runs from the roofline at
#: y = 51 ± 2 to the base at y = 68 -- eighteen rows -- and the bar puts a
#: change of plane every three or four of them: the eave rows read at 51-53,
#: 54-57, 58-60, 61-64, 65-68 in the value map. Five is what that measures,
#: and it is also the most a seventeen-row band can carry and still leave a
#: wall under every roof.
STOREYS = 5


@dataclass(frozen=True)
class _Building:
    """One structure: an eave, a roof plate and the wall under it.

    IT IS A PLATE, NOT A HOUSE. Nothing here has a gable, a chimney or a
    door; at eight pixels wide there is room for a roof and a wall and
    nothing else. What it contributes is the thing a per-pixel field cannot:
    a run of four to twelve pixels that are all the SAME value, with a
    different value directly above and below it. That contiguity is the
    whole read -- §6's "hundreds of buildings" comes out of many small
    plates at slightly different values, not out of many small drawings.
    """

    x: int
    width: int
    eave: int
    roof_rows: int
    wall_rows: int
    roof: str
    wall: str | None
    #: Which terrace it stands on, 0 at the skyline. Only the eave-shade pass
    #: reads it: the top terrace's wall rows are the two the bar loads with
    #: light (rows 52-53 measure L 27.9 and 34.6 against a trough at 14.5),
    #: and darkening them is how the roofline's twenty-point step became a
    #: nine-point one.
    storey: int = 0

    @property
    def right(self) -> int:
        return self.x + self.width - 1

    @property
    def wall_top(self) -> int:
        return self.eave + self.roof_rows

    def wall_rows_range(self) -> range:
        return range(self.wall_top, self.wall_top + self.wall_rows)


def _storey_y(x: int, storey: int) -> int:
    """The eave row of terrace `storey` at column x.

    The terraces follow the silhouette rather than the frame, so the whole
    stack tips with the roofline and falls away eastward with it. Spacing is
    the mass's own depth divided by STOREYS, which keeps the near terraces
    the same three or four rows apart as the far ones -- correct here, where
    the town is seen from above and the hill is doing the foreshortening.
    """
    top = _roof_y(x)
    span = max(1, layout.TOWN_BASE_Y - top)
    return top + int(round(storey * span / STOREYS))


#: Roof plates, by terrace. §5's cool structure and nothing outside it, and
#: the weights are the locked-palette proof's own counts for the band: 97 px
#: of `accent_indigo` 1 against 77 of `grey` 2 and 76 of `grey` 3.
#:
#: A ROOF IS BLUE AND A WALL IS GREY. There is exactly one light on a roof
#: plane in this frame and it is the sky glow, which is saturated indigo;
#: there is none at all on a wall, so a wall is the neutral it would
#: photograph as. `grey` 3 is the roof that has turned furthest toward the
#: dome and it is rationed -- §6 spends the whole of the town's "specific
#: roof" budget on seven runs, and a hillside of them reads as a skyline.
#: The far mix carries one entry the near mix does not: the hill's own
#: colour, for a roof that is simply not catching anything. It is how the top
#: terrace gets broken without being left out. Skipping the frontage instead
#: breaks the roofline AND removes the wall under it, and §4 needs 102 warm
#: pixels on rows 53-57 -- which have to be cut into something.
#:
#: THE TOP TERRACE HAS TO READ, AND IT WAS NOT READING. The two darkest
#: entries carried 36% of ROOF_MIX_FAR between them, and because a frontage
#: is 3-12 columns wide that landed as CONTIGUOUS invisible stretches: x
#: 108-115 took `town_wall` and x 116-131 took `town_mass_dark`, so
#: twenty-four columns of the town's top edge were the same value as the hill
#: and the first mark at or above L 28 fell to rows 55-63. Measured against
#: the locked-palette proof, whose top edge sits at row 51-52 for x 94-136
#: with only about one column in five dark down to 55, the mass began three
#: to eleven rows late and the dark trough above it read as nine rows of
#: black rather than five.
#:
#: So the dark entries are rationed to about one frontage in six between
#: them, which is the proof's own proportion, and the raggedness comes from
#: where §2.3 measures it -- the eave jitter and the gaps between frontages,
#: both of which move the edge without deleting it.
#:
#: AND A PLATE IS BLUE OR IT IS DARK -- IT IS NEVER NEUTRAL. See `_roof_ink`
#: for the run-length measurement this comes out of: `accent_indigo` 1 is
#: drawn in runs averaging 2.11 px and reaching six, `grey` 2 in runs
#: averaging 1.09 with 69 of its 75 runs a single pixel. A plate is by
#: definition a run of four to twelve, so a plate painted in `grey` 2 or 3
#: draws a colour the proof only ever dusts.
#: `grey` 3 is not in either mix at all: the proof draws it in runs averaging
#: 1.58 with three-quarters of its pixels in runs of one or two, and every
#: pixel of it a plate spends is a run of four or more. It arrives through
#: the stipple pass and through §2.5's seven measured ridges, and nowhere else.
#: `grey` 2 is not in them either, and for the same reason one step further:
#: 69 of its 75 runs in the proof are a single pixel and its longest is three.
#: A plate is a run of four to twelve by definition.
#:
#: AND A ROOF IS LIT. This is the round's named gap and it was the mix's
#: fault: 44% of ROOF_MIX_FAR and 46% of ROOF_MIX_NEAR were `town_wall` at
#: L 24.5 and `town_mass_dark` at L 21.7 -- one and three luminance off the
#: background -- so nearly half the roofs in the town were the same value as
#: the hill behind them and the sky was not a light source. The measured
#: consequence, cool pixels only over x 88-150 / y 52-68: 17.2% of the mass in
#: `grey` 2 against the locked-palette proof's 9.0%, and 8.2% in `grey` 3
#: against 8.7% with 1.8% in `grey` 4 against 3.7%. Half the mid-tone was
#: sitting on WALLS, at a value a roof one row above shared, which is the
#: mechanical form of "every structure shares a value with the one behind it".
#:
#: So the dark entries come down to about one plate in eight -- enough that the
#: skyline is not a ruled line, and §2.3's eave jitter and the alleys between
#: frontages already carry most of that job -- and the rest of the roof budget
#: goes to `accent_indigo` 1 at L 35.0. Blue-shifted, not neutral: it is the
#: sky's own horizon colour and the sky is the only thing lighting a roof
#: here, at +13 over the wall beneath it, which is a plane the eye can read.
ROOF_MIX_FAR = (("town_roof_sky", 0.74), ("town_wall", 0.14),
                ("town_mass_dark", 0.12))

#: AND THE SKYLINE TERRACE IS NOT SAMPLED FROM THAT. There are only twelve
#: frontages on it across ninety columns, so a mix holding 26% dark entries
#: does not land as 26% -- it landed as SIX lit and SIX dark, and the four
#: buildings covering x 96-127 came out dark, wall, wall, dark. Twenty-four
#: columns of the town's top edge at the value of the hill behind it, which is
#: this round's named gap surviving the fix that was supposed to remove it,
#: because the fix was a proportion and the sample is twelve.
#:
#: The top terrace's eave IS the silhouette and the silhouette is the plane
#: turned furthest toward the dome; there is nothing in front of it to shade
#: it. So it is lit, and §2.3's raggedness comes from the eave jitter and the
#: alleys, both of which move the edge without putting it in shadow.
ROOF_MIX_TOP = (("town_roof_sky", 0.90), ("town_wall", 0.10))
ROOF_MIX_NEAR = (("town_roof_sky", 0.76), ("town_wall", 0.14),
                 ("town_mass_dark", 0.10))

#: The moonlit ridge, and it is why the plate can be blue and still sparkle.
#: §2.4 measures the roof-highlight stipple at a mean run of 2.06 px with 106
#: of 157 runs a single pixel, and `_roof_ink`'s run-length table says `grey` 3
#: is drawn in runs averaging 1.58 and `grey` 4 shorter still -- so a plate
#: painted in either is a run the reference does not contain. The plate is
#: therefore `accent_indigo` 1 across its whole width, and one to three pixels
#: of neutral highlight land on its eave row where the ridge tiles catch the
#: dome. Same read, right statistics.
RIDGE_CHANCE = 0.70
RIDGE_BRIGHT = 0.32

#: Wall planes. `None` is the hill's own colour showing through, and it is
#: the commonest wall in the town: §5 gives `accent_indigo` 0 to "hill
#: backdrop, DARK WALL MASS" as one entry, and the proof measures it at 34%
#: of the band -- more than every other cool value put together. A wall in
#: this town is mostly just the night.
#: AND `grey` 1 IS RATIONED, WHICH IS THE POINT OF THE TABLE. It sits at
#: L 24.5 against the background's L 21.7 -- two and a half luminance apart,
#: less than a quarter of a ramp step -- so a wall painted in it is invisible
#: as a plane and merely lowers the local contrast everywhere it lands. The
#: proof puts 11% of the band in it; an earlier pass here put 22%, and the
#: result measured a correct histogram and a cool-to-cool roughness of 3.3
#: against the bar's 6.4. Half the mass was two colours that are the same
#: value. A wall is either the night (None), or it is in shade (`grey` 0 at
#: L 16, five points BELOW the background and visible as a slot), and only
#: sometimes the neutral in between.
#:
#: AND IT IS NOT THE SAME MIX DOWN THE HILL. Measured per row on the bar,
#: over cool pixels in x 88-145: rows 52-53 mean L 26.2 and 25.4, rows 56-57
#: 24.1 and 25.2, row 66 28.5. The upper terraces are LIGHTER than the middle
#: of the town, not darker -- they are the far side of the valley, seen
#: almost flat-on and catching the dome -- and row 66, the last band of wall
#: before §2.14's moonlit bank, is the lightest wall in the region. One mix
#: for all five terraces put rows 52-53 four points dark and row 66 seven
#: points dark, which reads as a shadowed gully across the top of the town
#: and a black line under its feet.
#:
#: AND `grey` 0 IS RATIONED HARDER THAN ANY OF THEM. Counted in the
#: locked-palette proof over x 88-150, rows 54-67 -- the body of the mass,
#: below the trough and above the bank -- `grey` 0 holds a mean of 2.4
#: columns per row, 3.8%, and on five of those fourteen rows it holds NONE.
#: `accent_indigo` 0 holds 23.4, 37%. These mixes were spending 16-30% of
#: every wall on `grey` 0 and the deep-slot pass spent twenty-six more, which
#: came out at 11.7% -- three times the proof -- and it is visible as exactly
#: what it is: holes. A wall in shade is a slot you can see between two
#: things, and there are a few of them; it is not the material the town is
#: made of. The night is.
#:
#: AND A WALL IS NEVER `grey` 2. Same measurement as the roof mixes: 69 of
#: the proof's 75 `grey` 2 runs are one pixel long and none exceeds three, so
#: every wall plate painted in it is a run the reference does not contain.
#: With it in these three mixes the colour measured 127 px at a mean run of
#: 1.90 and a longest of seven against the proof's 82 px at 1.09 -- which is
#: what put the neutral grey slabs across the hillside that no light source
#: in this scene accounts for. It reaches the mass through the stipple pass
#: and only through the stipple pass, one pixel at a time.
#: The `grey` 1 share is what `grey` 2 used to hold plus what it already had,
#: and that was too much of it: the proof runs three pixels of the hill's own
#: colour for every one of `grey` 1 -- 405 against 133 -- and the first draft
#: of this rebalance ran 1.9 to 1, which lifts the whole mass off the hill it
#: is supposed to be indistinguishable from in value.
#: AND THE MID-TONE THAT WAS MISSING, which is what made three separate blind
#: critics call this region "windows with no host geometry" in three separate
#: rounds while every number in town.md came out right.
#:
#: The histogram, over the town core, x 66-149 / y 52-69:
#:
#:                     <18     18-26    26-34    34-45     45+
#:     ours           11.1%    46.1%     6.7%    18.9%    17.1%
#:     reference      12.8%    28.8%    16.6%    20.4%    21.4%
#:
#: A quarter of the reference's mass sat in a band we had almost nothing in.
#: Everything else agreed -- mean luminance within 1.4, saturation LOWER than
#: the bar, roughness lower, warm pixel count lower, per-row distribution
#: within a few pixels, run anisotropy closer to isotropic than the bar's. By
#: every instrument we had, the town was quieter than the thing it was copying.
#:
#: It was BIMODAL. Near-black mass with bright marks on it and nothing in
#: between, so the windows had nothing to be holes IN -- they were dots on the
#: night. The reference punches its windows into a wall you can already see.
#: That is the whole difference between a town and a starfield, and no
#: single-number check in this project could have found it: it is a shape in
#: the histogram, not a value of it. Errata 41's general form, a third time.
#:
#: So `town_wall_lit` enters the wall mix. At L 32.5 it stands ELEVEN
#: luminance above the hill behind it, which is a plane the eye can see --
#: unlike `town_wall` at 24.5, which the note above correctly rations because
#: two and a half luminance is not a plane, it is a rounding error.
#:
#: AND IT BELONGS ON THE ROOF, NOT ON THE WALL. `town_wall_lit` held 26-32% of
#: all three mixes and that is where the mid-tone went: at L 32.5 it sits two
#: and a half luminance under `town_roof_sky` at 35.0, so a wall painted in it
#: is the same value as the roof plate directly above it and the eave line
#: stops existing. The band was filled and the FORM was not, which is the
#: exact failure ruling 42 exists for -- the histogram moved and the picture
#: did not. The mid-tone now comes from the roof plates, where a light source
#: accounts for it, and the wall keeps a small share for a gable end catching
#: the street below it.
#:
#: AND THE SHARE `town_wall_lit` GAVE UP WENT TO THE WRONG PLACE. Counted as
#: cool pixels over x 88-150 / y 52-68 against the locked-palette proof:
#: `grey` 1 came out at 18.1% against its 10.6% because it absorbed the whole
#: of the mid-tone the roofs were supposed to take. It is the one entry in
#: this region that cannot carry a plane -- 2.8 luminance over the background,
#: a quarter of a ramp step -- so a wall painted in it neither reads as lit
#: nor reads as dark; it just lowers the contrast of everything around it.
#: The night takes the share back, and `town_wall_lit` returns at about half
#: what it held before this round: enough for a gable end catching the street,
#: not enough to be the value a roof shares.
WALL_MIX_FAR = ((None, 0.52), ("town_wall", 0.22), ("town_wall_lit", 0.18),
                ("town_trough", 0.06))
WALL_MIX_MID = ((None, 0.54), ("town_wall", 0.22), ("town_wall_lit", 0.18),
                ("town_trough", 0.06))
WALL_MIX_NEAR = ((None, 0.46), ("town_wall", 0.26), ("town_wall_lit", 0.22),
                 ("town_trough", 0.06))

#: One pixel of dark under an eave, and at 320x144 it is the whole difference
#: between a roof standing on a wall and a roof lying on one. The first wall
#: row of a frontage takes the hill's own colour or a slot of `grey` 0 about
#: half the time, so the lit plate above it has something to be an edge
#: against. It is not drawn as a line -- it is the top of the plane in front,
#: in shade, which is what a line under an eave actually is.
EAVE_SHADE = 0.55


def _pick(rng, mix):
    roll = rng.random()
    for name, weight in mix:
        roll -= weight
        if roll <= 0:
            return name
    return mix[-1][0]


def _buildings(ctx: layout.Ctx) -> list[_Building]:
    """The mass, as plates. Deterministic, and read twice.

    `_mass` draws them and `_windows` reads them, because a window belongs on
    a wall and the two passes must agree about where the walls are. Its own
    named stream, so it is the same list in both calls without either pass
    having to hand it to the other.
    """
    rng = ctx.stream("town.buildings")

    # THE TERRACES WANDER, and if they do not the town has hidden storey
    # lines. `_storey_y` is smooth in x, so five terraces put every eave in
    # the town on one of about eight rows: measured, rows 57, 60, 61, 63, 64
    # and 66-68 each carried forty to seventy columns of wall while rows 53,
    # 55, 58, 62 and 65 carried twelve to twenty-nine. Windows then land
    # where the walls are, and §9.2's hotel appears -- not as a neat grid,
    # which would at least be visible, but as a lumpy horizontal banding
    # nobody can point at. A terrace is a contour on a hillside; it wanders.
    # One slow walk of +/-2 rows over runs of nine to twenty columns, shared
    # by all five storeys so the stack tips together rather than shearing.
    wander: dict[int, int] = {}
    step, column = 0, MASS_LEFT
    while column <= MASS_RIGHT:
        run = 9 + int(rng.random() * 12)
        step = max(-2, min(2, step + (1 if rng.random() < 0.5 else -1)))
        for offset in range(run):
            wander[column + offset] = step
        column += run

    out: list[_Building] = []
    for storey in range(STOREYS):
        near = storey >= 2
        x = MASS_LEFT + int(rng.random() * 3)
        while x <= MASS_RIGHT:
            # §4's footprint sense, applied to buildings rather than to
            # lights: mostly four to eight pixels of frontage, with about one
            # in five running long enough to read as a warehouse or a terrace
            # of three. Nothing over thirteen -- past that a plate stops
            # being a building and starts being a wall across the hill.
            width = 3 + int(rng.random() * 5)
            if rng.random() < 0.20:
                width += 2 + int(rng.random() * 4)
            width = min(width, MASS_RIGHT - x + 1)
            if width < 3:
                break

            # §6: the east end dissolves rather than ending. Roughness falls
            # from 14 to 4.5 across x 138-152 and the mass stops, so the
            # plates thin out over those columns instead of meeting an edge.
            #
            # AND THE SKYLINE IS BROKEN BEFORE IT IS ANYTHING ELSE. Terrace
            # zero's eaves all sit within a row or two of the silhouette, so
            # if every frontage on it takes a lit roof the town gets a lit
            # line ninety pixels long across its top -- §9.4's modern
            # skyline, exactly. ROOF_MIX_FAR breaks it by value rather than
            # by absence; see there.
            centre = x + width // 2
            survives = 1.0
            if centre > DISSOLVE_FROM:
                survives *= max(0.0, 1.0 - (centre - DISSOLVE_FROM)
                                / (DISSOLVE_TO - DISSOLVE_FROM))
            if rng.random() > survives:
                x += width + 1 + int(rng.random() * 3)
                continue

            # The top terrace does not wander: it IS the silhouette, and §2.3
            # measures that edge at y = 51 +/- 2 from x=89 to x=140. Let the
            # contour walk carry it as well and the eaves slide down to 55,
            # the wall rows go with them, and rows 52-54 -- which the bar
            # loads with twenty-five warm pixels -- come out empty.
            eave = _storey_y(centre, storey)
            if storey:
                eave += wander.get(centre, 0)
            # §2.3: the top edge is ragged by two or three pixels where
            # chimneys and gable peaks poke up. Two or three -- so the jitter
            # is one row on most frontages and two on a few.
            roll = rng.random()
            eave += -1 if roll < 0.20 else (1 if roll > 0.82 else 0)
            if storey == 0:
                # THE SKYLINE IS FLAT WITH POKES IN IT, NOT RAGGED. §2.3:
                # "nearly flat at y = 51 +/- 2 ... ragged by two or three
                # pixels where chimneys and gable peaks poke up". At a fifth
                # up and a fifth down the top terrace's eaves spread over four
                # rows and only about half of them landed on the profile, so
                # the seven-point step the bar has between rows 51 and 52 came
                # out at under three and the town had no top edge to be the
                # top edge of.
                roll = rng.random()
                eave = _roof_y(centre) + (-1 if roll < 0.16
                                          else (1 if roll > 0.90 else 0))
            else:
                eave = max(eave, _roof_y(centre) - 2)
            eave = min(eave, layout.TOWN_BASE_Y - 1)
            floor = (_storey_y(centre, storey + 1) + wander.get(centre, 0)
                     if storey + 1 < STOREYS else layout.TOWN_BASE_Y + 1)
            # TWO ROWS OF ROOF, MORE OFTEN THAN NOT ON THE NEAR
            # TERRACES. §1: the town is seen from two miles out and several
            # hundred feet ABOVE, so what a building presents to this camera
            # is mostly roof and only a strip of frontage. At one row in four
            # the plates carried 9.3% of the mass against the proof's 12.9%
            # and the whole 33-56 band came out three points light of it,
            # which is the lit-plane deficit measured rather than seen.
            roof_rows = 1 if rng.random() < (0.40 if near else 0.56) else 2
            wall_rows = max(1, floor - eave - roof_rows)
            out.append(_Building(
                storey=storey, x=x, width=width, eave=eave,
                roof_rows=roof_rows, wall_rows=wall_rows,
                roof=_pick(rng, ROOF_MIX_TOP if storey == 0
                           else ROOF_MIX_NEAR if near else ROOF_MIX_FAR),
                wall=_pick(rng, WALL_MIX_NEAR if storey == STOREYS - 1
                           else WALL_MIX_MID if near else WALL_MIX_FAR)))
            # The gap between frontages. §4's dark pixel between two lights
            # is a spacing rule about windows; this is the alley, and it is
            # what the hill is seen through. Wider up the hill, where the
            # terraces are further apart than the buildings are wide.
            gap = 1 + (rng.random() < (0.18 if near else 0.40)) \
                + (rng.random() < (0.05 if near else 0.14))
            x += width + gap
    return out


def _mass(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    rng = ctx.stream("town.mass")
    dark = _mass_dark(ctx)              # accent_indigo 0, L 21.7
    deep = ctx.ink("town_trough")       # grey 0, L 16.0
    roof = ctx.ink("town_roof")         # grey 3, L 40.6
    bright = ctx.ink("town_roof_bright")  # grey 4, L 53.5
    base = layout.TOWN_BASE_Y

    # 1. The silhouette, filled with the colour of the hill behind it. §9.6's
    #    warning about the headframe applies to the whole mass: give it an
    #    edge and it stops being a place and starts being an object.
    tops = {}
    for x in range(MASS_LEFT, MASS_RIGHT + 1):
        top = _roof_y(x)
        tops[x] = top
        for y in range(top, base + 1):
            _put(canvas, x, y, dark)

    # 2. The plates, far terrace first. Each one paints over the skirt of the
    #    terrace behind it, which is where the hard edge under an eave comes
    #    from: it is not drawn as a line, it is the bottom of the plane above
    #    meeting the top of the plane in front.
    #
    #    THIS IS THE WHOLE DIFFERENCE BETWEEN A TOWN AND A FIELD OF NOISE.
    #    The previous pass produced the right value histogram, the right run
    #    lengths and the right roughness by walking each row independently,
    #    and it read as television static, because no two adjacent pixels
    #    were ever the same value and nothing survived from one row to the
    #    next. The bar's mass is the opposite: long flat runs of one value --
    #    eight pixels of `accent_indigo` 1 at y=60, seven of `grey` 2 at
    #    y 62-63 -- with hard steps between them. Contiguity IS the subject.
    #: Which cells a roof plate ended up on, in draw order, so the stipple
    #: pass can put its high frequency where a roof is instead of spraying it
    #: over the walls as well. See step 3.
    roofs: set[tuple[int, int]] = set()

    for building in _buildings(ctx):
        roof_ink = ctx.ink(building.roof)
        wall_ink = ctx.ink(building.wall) if building.wall else None
        for row in range(building.eave, building.eave + building.roof_rows):
            for col in range(building.x, building.right + 1):
                if row < tops.get(col, base + 1) or row > base:
                    continue
                # One frontage in six has its far end in shade -- a roof
                # turning away, or the next building standing in front of it.
                _put(canvas, col, row,
                     dark if rng.random() < 0.08 else roof_ink)
                roofs.add((col, row))

        # The moonlit ridge. One to three pixels of neutral highlight along
        # the eave row of a plate that is catching the dome at all, placed at
        # one end rather than across the plate: see RIDGE_CHANCE for why the
        # plate itself must stay blue. It is the mark that says a roof has a
        # ridge line and a pitch, and it is what §2.4's stipple is made of.
        if building.roof == "town_roof_sky" and rng.random() < RIDGE_CHANCE:
            run = 1 + int(rng.random() * 4)
            span = max(1, building.width - run + 1)
            start = building.x + int(rng.random() * span)
            ink = bright if rng.random() < RIDGE_BRIGHT else roof
            for col in range(start, min(start + run, building.right + 1)):
                if building.eave >= tops.get(col, base + 1):
                    _put(canvas, col, building.eave, ink)

        shade = building.storey > 0
        if wall_ink is None:
            shade_row = building.wall_top
            if shade and shade_row <= base and rng.random() < EAVE_SHADE:
                for col in range(building.x, building.right + 1):
                    if shade_row >= tops.get(col, base + 1):
                        _put(canvas, col, shade_row,
                             deep if rng.random() < 0.16 else dark)
            continue
        for row in building.wall_rows_range():
            if row < tops.get(building.x, base + 1) or row > base:
                continue
            # EAVE_SHADE: the first row of wall under a lit plate drops away,
            # so the plate has an edge to be the top of.
            eave_row = shade and row == building.wall_top
            for col in range(building.x, building.right + 1):
                if row < tops.get(col, base + 1):
                    continue
                # An alley, or a shutter, or the shaded return of a wall that
                # has a lit one opposite. Vertical, one or two columns, and
                # it is what stops a wall plate reading as a painted plank.
                roofs.discard((col, row))
                if eave_row and rng.random() < EAVE_SHADE:
                    _put(canvas, col, row,
                         deep if rng.random() < 0.12 else dark)
                    continue
                _put(canvas, col, row,
                     dark if rng.random() < 0.18 else wall_ink)

    # 3. Chimneys, gable ends and ridge tiles: single pixels of a roof value
    #    standing on a wall. §6 -- two-thirds of all roof highlights in the
    #    bar are single isolated pixels, mean run 2.06 px. The plates supply
    #    the structure; this supplies the frequency, and it is deliberately
    #    thin, because every one of these that lands on a plate edge softens
    #    the edge the plates exist to make.
    for x in range(MASS_LEFT, MASS_RIGHT + 1):
        top = tops[x]
        for y in range(top, base + 1):
            # THE RATE IS WHAT THE ROUGHNESS IS. §3's signature number is a
            # mean absolute neighbour-pixel ΔL of 14.29 inside the mass
            # against 1.35 on the hill behind it, and it is measured to be
            # the thing -- not the silhouette and not the brightness -- that
            # says "town". The plates supply contiguity and this supplies the
            # frequency; at 0.10 the composite measured 11.0 against the
            # bar's 14.9, which is a town three-quarters resolved.
            # ...AND IT GOES WHERE A ROOF IS. Sprayed over the whole mass at
            # one rate it lands as often on a wall as on a roof, and a wall
            # carrying `grey` 2 and `accent_indigo` 1 singles is a wall the
            # same value as the plate above it -- the round's named gap
            # arriving by the back door, one pixel at a time, after the mixes
            # had been fixed. A chimney, a ridge tile and a gable peak are
            # roof furniture; they stand on the plate, not on the frontage.
            rate = 0.16 if (x, y) in roofs else 0.09
            if rng.random() < rate * min(1.0, _density(x, y) + 0.35):
                _put(canvas, x, y, _roof_ink(ctx, rng))

    # 4. The deepest slots. §5 gives `grey` 0 to "the dark trough, deepest
    #    gaps between buildings" -- the alleys, and the shaded side of a wall
    #    that has a lit one opposite. Placed AFTER the walls so they cut.
    #    TEN, NOT TWENTY-SIX. See WALL_MIX_*: the proof spends 3.8% of the
    #    mass on this colour and twenty-six slots plus a 16-30% wall share
    #    was spending 11.7%.
    for _ in range(10):
        x = rng.randrange(MASS_LEFT, MASS_RIGHT + 1)
        y = rng.randrange(tops.get(x, base), base + 1)
        if rng.random() > _density(x, y) + 0.25:
            continue
        height = 1 + (rng.random() < 0.45)
        for step in range(height):
            _put(canvas, x, y + step, deep)

    # 5. §2.5's seven legible ridges, and they are the entire budget of "this
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
#:
#: AND THE MEDIAN WAS A STEP AND A HALF HIGH. Measured on the render against
#: the locked-palette proof, per warm component's peak: the proof runs min 44
#: / q1 70 / median 85 / q3 126, which is §4's own spread, and this mix
#: produced min 44 / q1 79 / median 98. Twenty lights of sixty-one at the
#: ceiling against §4's fourteen is the whole error -- it pushes the second
#: quartile up a step as well, and a town whose median light is `umber` 14
#: rather than `ochre` 8 is a town of sixty identical lamps with the variation
#: squeezed into the bottom third of the ramp.
#: EIGHTEEN AT THE CEILING, NOT FOURTEEN AND NOT TWENTY. Fourteen measured
#: 12 ceiling pixels in 11 blobs against §7's 24 in 21 -- the ration is a
#: FLOOR as well as a cap, and half of it spent is a town that has given the
#: lantern more room than the reference does. Eighteen lights, a few of them
#: taking their permitted pair, is 21 blobs and 24 pixels: §7 exactly.
#: AND THE STEP BELOW THE CEILING WAS EMPTY. Warm pixels binned by luminance
#: over x 88-179 / y 44-68: the bar puts 36 in 86-100 and this put 10. That is
#: `umber` 14 at L 98.2, the step §5 calls "near-hot", and it is the one the
#: bar spends on the lights that are bright but not at the ceiling -- which is
#: most of the ones a player would call bright. Five lights of sixty-three
#: could not carry it.
PEAK_MIX = ((7, 17), (6, 11), (5, 10), (4, 9), (3, 7), (2, 4), (1, 3), (0, 2))

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
        # layout.TOWN_WINDOW_FIELD is §4's measured extent, x 74-165, and it
        # is a shared anchor. §4 then names the town's last light at x=174 --
        # the two sentences are three paragraphs apart and they disagree by
        # nine columns. The anchor is not moved; the field's own bounds simply
        # take in whichever of EAST_LIGHTS falls outside it, so the declared
        # outliers can place. Nothing scattered ever reaches out there:
        # BAND_COUNTS gives x 170-179 exactly one light and this is it.
        fx, fy, fw, fh = layout.TOWN_WINDOW_FIELD
        right = max([fx + fw - 1] + [ex + ew - 1 for ex, _, ew, _ in EAST_LIGHTS])
        self.bounds = (fx, fy, right, fy + fh - 1)

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
        #
        # AND IT IS THE LIGHT'S OWN ROW, not every row it spans. Fifty-seven
        # lights over nineteen rows is three a row on average, so a cap of
        # seven should almost never bind -- and charging a 2x4 to four
        # separate rows made it bind on the busiest six, which are exactly
        # the near rows the bar loads to 19-24 warm pixels. The cap is there
        # to stop a row of four aligned windows reading as a hotel; a light
        # that happens to be tall is not four lights.
        if self.per_row.get(y, 0) >= WINDOWS_PER_ROW:
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
            pair = height == 1 and width >= 2 and rng.random() < 0.6
            if pair:
                cells.sort()
            core = min(HOT_BLOB_MAX if pair else 1, max(0, self.hot_left))
        self.per_row[y] = self.per_row.get(y, 0) + 1
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
        # §7 budgets the whole town 227 warm pixels and §4's footprint census
        # only accounts for about 122 of them: 57 cores averaging two pixels
        # each. The other hundred are this -- the one pixel of bleed, counted
        # across sixty lights. Spilling only from the top half of the ramp
        # measured 165 against 207 in the locked-palette proof, a quarter
        # short, and the shortfall does not read as dimmer windows; it reads
        # as a town with fewer of them.
        if peak < 2:
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
        #
        # AND ONE PIXEL MEANS ONE PIXEL. Counted as warm connected components
        # in the locked-palette proof over x 70-179: 17 singles and 23 pairs
        # out of 65, so 62% of the town's lights are one or two pixels and
        # nothing else. Spilling two or three from every bright window gave
        # 8 singles and 16 pairs out of 63, with eleven components of four
        # and six of five -- the same warm pixel count (324 against 316)
        # gathered into fewer, fatter marks. §7.3's ration is about the
        # ceiling colour; this is the same failure one step down the ramp,
        # and it is what turns sixty lamps into thirty smudges.
        #
        # ...AND THE NEAR EDGE BLEEDS MORE THAN THE UPPER TERRACES. §4's
        # density gradient is not only a count: warm pixels per row in the
        # proof run 9 at row 55 and 34 at row 66, and the bottom of the town
        # holds three components of 35, 12 and 10 px where lights and their
        # spill have run together. Nothing up the hill does that. The bleed
        # is still §3's one pixel per window -- what changes is how many
        # windows are close enough for their one pixel to meet.
        near = y >= layout.TOWN_BASE_Y - 6
        # AND THE TWO BUDGETS PULL AGAINST EACH OTHER. The proof holds 17
        # single-pixel components and 23 pairs out of 65 -- 62% of the town's
        # lights are one or two pixels with nothing around them -- AND 207
        # warm pixels, which needs about 1.4 spill pixels a light. Spend the
        # spill evenly and it buys the pixel count at the cost of the
        # singles: at 0.8/0.6 this measured 285 warm pixels in 55 components
        # with FOUR singles left. So it is spent unevenly, which is also what
        # the reference does -- the near rows cluster and the terraces above
        # keep their isolated lamps.
        #
        # AND THE WHOLE FIELD WAS A THIRD SHORT. Counted as warm pixels over
        # x 88-179 / y 44-68, which is the town clear of the gantry lamp: the
        # bar holds 210 and the locked-palette proof 179, against 127 here.
        # §7's own table says 227 for the whole town and this was at 56% of
        # it. The component census says where the missing light went -- the
        # bar has twelve components of five pixels or more and a largest of
        # 29, this had five and a largest of 13. So the shortfall is not
        # missing lamps (49 components against the bar's 54) and it is not
        # dim lamps (peak median 85 against 87); it is that the bar's lights
        # sit close enough for their one pixel of bleed to MEET, and a town
        # where no two lights touch reads as a field of separate specks
        # rather than as streets with buildings on them.
        # ...AND THE BLEED IS BOUGHT FROM THE BRIGHT LIGHTS, NOT SPREAD. Spent
        # evenly, +35 warm pixels took the single-pixel components from ten to
        # TWO against the bar's eleven and piled 24 components into the 3-4 px
        # bin against its thirteen: the right amount of light, gathered into
        # one wrong size of mark. §3's ring measurement is a ratio to the
        # window's own brightness -- r=1 averages L 40.5 around the HOTTEST
        # pixels -- so a dim lamp throws nothing you can see and a hot one
        # throws two pixels. Which is also what leaves a third of the town as
        # isolated specks, because a third of the town's lamps are dim.
        if peak >= 6:
            budget = 1 + (rng.random() < 0.75)
        elif peak >= 4:
            budget = 1 if rng.random() < 0.55 else 0
        else:
            budget = 1 if rng.random() < 0.15 else 0
        budget += near and rng.random() < 0.60
        # The budget is spent on vacant neighbours, not on the first `budget`
        # entries of a shuffled list -- which is what it was, and about half of
        # every light's allowance was being handed to a pixel another window
        # had already taken and then silently dropped. It measured as a spill
        # rate of 0.45 pixels a light against §7's implied 1.75, and no amount
        # of raising the budget fixed it because the failures scale with it.
        for cx, cy in neighbours:
            if budget <= 0:
                break
            if self.vacant(cx, cy):
                budget -= 1
                self.taken.add((cx, cy))
                roll = rng.random()
                _put(self.canvas, cx, cy,
                     self.spills[0] if roll < 0.22
                     else self.spills[1] if roll < 0.48 else self.spills[2])


def _wall_rows(ctx: layout.Ctx) -> dict[int, list[int]]:
    """Column -> the rows of wall standing at it. §4's "loosely share an edge".

    A LIGHT BELONGS TO A BUILDING, and this is the only thing that says so.
    §4 is emphatic that there is no grid, no storey line and no repeat, and
    the previous pass took that literally and scattered sixty lights over the
    mass by weighted random. What §4 actually measures is the absence of
    ALIGNMENT ACROSS the town -- "windows within the four or five legible
    buildings loosely share an edge; everywhere else they are placed
    individually" -- and a light that ignores the plate it stands on is not
    unaligned, it is unattached. It lands on roofs, in alleys and in the
    night between frontages, and sixty of those read as a starfield lying on
    a hill rather than as a place with people in it.

    So the eligible rows are the wall rows, and because the eaves are jittered
    by a row and the terraces follow the silhouette, no two neighbouring
    buildings offer the same set. The grouping is per building; the disorder
    is between them, which is where the bar puts it.
    """
    rows: dict[int, list[int]] = {}
    for building in _buildings(ctx):
        span = [row for row in building.wall_rows_range()
                if layout.TOWN_ROOF_Y - 2 <= row <= layout.TOWN_BASE_Y]
        if not span:
            continue
        for col in range(building.x, building.right + 1):
            rows.setdefault(col, []).extend(span)
    return rows


def _weighted_row(rng, rows: list[int], top: int, base: int) -> int:
    """One of `rows`, with the near ones 2.7 times likelier than the far.

    §4's measured gradient, as a straight line in depth rather than as a
    shaped draw. The constant is the ratio the bar has and nothing else: 102
    warm pixels on rows 53-57 against 272 on rows 62-68.

    2.7 WAS TOO SHALLOW ONCE THE LIGHTS WERE ON WALLS. Warm pixels per row
    in the locked-palette proof put 54% of the town's light on rows 62-67 and
    24% on rows 55-61; at 2.7 this put 39% and 37%, which flattens the one
    thing that says the near terraces are nearer. 4.5 to 1 restores the
    measured split without reaching §4's forbidden max-of-two draw, whose
    effective ratio at the ends is about twenty to one.
    """
    weights = [0.55 + 0.45 * (row - top) / max(1, base - top) for row in rows]
    pick = rng.random() * sum(weights)
    for row, weight in zip(rows, weights):
        pick -= weight
        if pick <= 0:
            return row
    return rows[-1]


def _windows(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Sixty lights, individually placed, on no grid whatsoever.

    §9.2: max 7 lights on any one row out of 57, only 60% of columns carry a
    light at all, median spacing 3.2 px with a hard minimum of 2. Placing
    windows by storey and bay is the natural way to draw a building and it is
    fatal here.
    """
    rng = ctx.stream("town.windows")
    field = _Field(canvas, ctx)
    walls = _wall_rows(ctx)

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
                # THE BIAS IS 2.7 TO 1, AND IT IS LINEAR IN DEPTH. §4: bright
                # window pixels per row climb from 5 at y=50 to 11-13 at
                # y 63-67, and that ratio is the whole perspective cue. A
                # max-of-two draw, which is the obvious way to lean a uniform
                # pick downward, is a ratio of about twenty to one at the
                # ends: it empties the upper terraces and leaves a dark band
                # four rows deep under the roofline, which reads as a cliff
                # with a town at the bottom of it.
                #
                # ...and the pick lands on a WALL. The weighting is applied
                # to the wall rows standing at this column rather than to the
                # whole depth of the mass, so a light is always on a plane
                # somebody could have cut a window into. Columns with no wall
                # -- an alley, a gap in a terrace, the thinning east end --
                # fall through to the free pick, which is what keeps the five
                # isolated eastern lights possible.
                storeys = walls.get(x)
                if storeys:
                    y = _weighted_row(rng, storeys, top - 1,
                                      layout.TOWN_BASE_Y)
                else:
                    reach = rng.random()
                    if rng.random() < 0.5:
                        reach = max(reach, rng.random())
                    y = top + int(span * reach + 0.5)
                # THE SHAPE IS DRAWN FRESH EACH ATTEMPT, NOT CYCLED. Taking
                # `shapes[slot]` and retrying the same footprint eighty times
                # sorts the census by crowding: a 2x2 that cannot fit in the
                # middle of town keeps failing until the walk wanders to the
                # thin east end, so the big footprints all end up out there.
                # Measured, that put 32 warm pixels in x 140-149 against the
                # proof's 18 while x 100-129 held 49 against its 93 -- the
                # right footprint census in the wrong half of the town. A
                # fresh draw lets a crowded column take the 1x1 that is 42%
                # of the census anyway and leaves the shape where the light is.
                width, height = shapes[rng.randrange(len(shapes))]
                # AND THE NEAR EDGE TAKES THE BIGGER WINDOW. §4's footprint
                # census is a count of the whole town and §4's own density
                # note says the bottom of it is "brighter and busier than its
                # upper terraces" -- so the census is not uniform in depth,
                # and drawing from it uniformly puts the same 1.93-px average
                # light on the near frontages as on the far ridge. Measured,
                # the bar carries 19-24 warm pixels on each of rows 62-67 and
                # this carried 9-14, with rows 63 and 67 -- the two brightest
                # rows in the reference -- ten luminance points dark.
                if y >= layout.TOWN_BASE_Y - 6 and rng.random() < 0.55:
                    alt = shapes[rng.randrange(len(shapes))]
                    if alt[0] * alt[1] > width * height:
                        width, height = alt
                # §4 gives a median nearest-neighbour of 3.2 px and a HARD
                # MINIMUM of 2, and the minimum is not spread evenly: the
                # near edge of town is where the buildings are closest
                # together, which is what "brighter and busier than its upper
                # terraces" measures as. So the bottom six rows ask for the
                # minimum from the start and the terraces above ask for the
                # median first. Enforcing the median everywhere left x
                # 120-139 with 28 warm pixels against the proof's 65 -- the
                # right number of lights, evenly spread, in a band the
                # reference packs.
                #
                # THE MINIMUM STILL HAS TO BE ASKED FOR SECOND, though. Made
                # unconditional on the near rows, the lights there packed at
                # two and their spill ran together: 57 warm components with
                # SEVEN singles against the proof's 65 with seventeen. §4's
                # census is a distribution -- median 3.2, minimum 2 -- and a
                # region that draws the minimum every time has drawn a
                # different distribution with the same floor. So the near rows
                # retreat to it after ten attempts rather than forty, which
                # is the pressure without the collapse.
                relax = 10 if y >= layout.TOWN_BASE_Y - 6 else 40
                reach = WINDOW_SPACING if _attempt < relax else 1
                if not field.fits(x, y, width, height, reach):
                    continue
                peak = peaks[slot % len(peaks)]
                if peak == 7 and field.hot_left <= 0:
                    peak = 6
                field.place(x, y, width, height, peak, rng)
                slot += 1
                # A LIT FRONTAGE AT THE NEAR EDGE. §4: "windows within the
                # four or five legible buildings loosely share an edge", and
                # that is the only alignment the reference contains. Measured
                # as warm connected components over x 88-179, the bar holds
                # twelve of five pixels or more and a largest of 29 -- at
                # x 127-132 / y 61-67, which is one building with its whole
                # front lit, and a fifteen at x 111-113 / y 62-68 which is a
                # narrower one. Scattering sixty lights on the minimum spacing
                # cannot make those: it made five, and the largest was 13.
                #
                # So a light on the near terraces brings a neighbour on the
                # same frontage about half the time -- one bay along, or one
                # floor down -- and the two of them plus their bleed run
                # together into the mark the bar has. §9.2's hotel is two ROWS
                # of four aligned windows across the town; two windows on one
                # building at the bottom of the hill is what a building is.
                if y >= layout.TOWN_BASE_Y - 6 and rng.random() < 0.62:
                    for _sib in range(2):
                        sx2 = x + (width + 2 if rng.random() < 0.5 else -2)
                        sy2 = y + (2 if rng.random() < 0.45 else 0)
                        sw, sh = shapes[rng.randrange(len(shapes))]
                        if not field.fits(sx2, sy2, sw, sh, 1):
                            continue
                        sib = max(0, peak - (rng.random() < 0.5))
                        if sib == 7 and field.hot_left <= 0:
                            sib = 6
                        field.place(sx2, sy2, sw, sh, sib, rng)
                        break
                break
