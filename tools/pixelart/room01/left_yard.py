"""Room 1 — the left yard: timber, the sign, the fence, two wheels.

The frame's LEFT REPOUSSOIR, and its job is structural before it is
descriptive. The picture opens to the right — town, road, coach, light — and
everything in this region leans against that and holds the eye in. Half the
rect is below L 25, and the lamp pool at bottom right is only impressive
because of what sits beside it.

THE REGION IS A MONOTONIC LEFT-TO-RIGHT VALUE RAMP, and left_yard.md §1
gives it as a table: mean L climbs 21.1 → 50.0 across eleven column bands,
and the max row matters more than the mean row. NOTHING IN THE LEFTMOST 24
COLUMNS EXCEEDS L 59. NOTHING IN THE LEFTMOST 32 EXCEEDS L 80. All 69 pixels
above L 110 live at x >= 76. §7.8 is the warning that goes with it: every
instinct while working at 8× on a bright monitor says the timber is
unreadably dark and needs a rim light. It does not. Its readability comes
from the stepped moonlit caps and the lit right edge at x 23-24, and from
nothing else, and adding value here flattens the ramp holding the whole
composition.

TIMBER IS NOT ONE FAMILY (§4). Distant and shaded timber is
`pine_weathered`; lit near timber is `pine_fresh`; the signboard is `umber`
and `mud` upper steps. THE FAMILY CARRIES THE PLANE, THE STEP CARRIES THE
LIGHT. Painting all the wood out of one ramp flattens the depth immediately.

AND THERE IS ONLY ONE `ochre` IN THE REGION AND IT IS FIRE. §4: ochre 8 and
13 appear in exactly three places — the lantern, the pool it throws, and the
town's windows. A rail or a rim in ochre 8 reads as a light source at native
size, which is §7.11.

THE OBJECTS ARE HIGHLIGHTS, NOT BOXES. §2.12 and §7.12: the crates, barrel,
plank and keg are each a 1-px lit top edge over a near-black body. Given
side planes, hoops and staves they become six small objects competing at
L 30-45 in the region's darkest quarter, and the wheel — the shape that
actually matters down there — disappears among them.

NO DITHER ANYWHERE (§5). The bar's 2×2 checkerboard metric is at or below
the level a noise field produces by accident in every part of this rect.
What texture there is comes from SCATTERING VALUES WITHIN A TWO-TO-THREE
STEP BAND — one whole index per pixel, chosen from a narrow band — never
from weaving two colours on a grid. Every scatter here draws from a named
stream so it is the same in every process and so adding a plank cannot move
a star.

HOW THE TIMBER IS BUILT, because it is 40% of the rect and it is the thing
most likely to come out as a slab. The mass is a stack of poles seen end-on,
and it is drawn as PLANKS AND EDGES, in this order:

  1. the silhouette — a three-tread staircase, not a slope (§2.9)
  2. the planks — measured off the column-median profile over y 55-82, which
     has a stable trough-and-peak cadence: dark seams at x 1, 7, 9, 14, 16
     and 22, lit faces at x 6, 15, 17-21 and 23-24
  3. the horizontal runs — three 1-px pale rails at y 71, 84 and 89, plus
     the two moonlit cap rows at y 53 and 54
  4. the two edges that carry the object: the near-black column at x=0 and
     the warm lit right edge at x 23-24

TWO BOUNDARY FACTS THIS FILE HONOURS AND DOES NOT DRAW:

  The man's lantern. left_yard.md §8 claims it ("authored once, here, and
  must not be duplicated next door"); hob.md §2 items 12-16 also specify it,
  down to the flame's reserved-band pixel budget, and adds the constraint
  that it must be drawn AFTER the lighting pass. layout settles it by
  filing every LANTERN_* anchor under hob.md §2, so it is drawn in `hob` and
  not here. The seam contract §8 describes still holds — there is exactly
  one lantern and it straddles x=87.

  The puddles. §2.17 puts four small cool clusters in this rect at `sky` 3.
  Standing water is the `puddles` cycling element now and `road` owns every
  pixel of it; the two nearest clusters are inside the road's own bounds.
"""

from __future__ import annotations

import math

from canvas import IndexedCanvas

from . import layout

# ---------------------------------------------------------------------------
# THE TIMBER MASS. §2.9, and every number measured off the bar.
# ---------------------------------------------------------------------------

#: §2.9. A three-tread staircase, NOT A SLOPE, and the region's silhouette
#: against the range behind it. (x from, x to, first row of timber). The
#: left shoulder at x 0-2 sits a row below the first tread; the treads
#: proper are the three the spec names.
TIMBER_TOP = ((0, 2, 44), (3, 9, 42), (10, 13, 45), (14, 24, 46))

#: §2.9's pole seams, "roughly every 3-4 px, the seams dropping to L 13-17
#: and the lit pole faces reaching L 33-40". Measured as the troughs and
#: peaks of the column-median profile over the body rows y 55-82:
#:
#:   x    0    1    2  3-5   6    7    8    9 10-11 12-13  14   15   16
#:   L  2.4 14.6 22.8 30.2 42.3 18.8 28.5 15.6  25.3  28.8 22.5 37.7 25.5
#:   x 17-19 20-21  22   23   24
#:   L   39.3  42.9 25.4 32.8 37.8
#:
#: (x from, x to, tone). The tones are the four things a pole face can be
#: doing at night — in a seam, turned away, facing out, or catching the
#: moon — and NOT four arbitrary values.
TIMBER_PLANKS = (
    (0, 0, "void"), (1, 1, "seam"), (2, 2, "shade"), (3, 5, "face"),
    (6, 6, "lit"), (7, 7, "seam"), (8, 8, "face"), (9, 9, "seam"),
    (10, 10, "face"), (11, 11, "shade"), (12, 13, "face"), (14, 14, "shade"),
    (15, 15, "lit"), (16, 16, "face"), (17, 17, "lit"), (18, 20, "moon"),
    (21, 21, "lit"), (22, 22, "shade"), (23, 23, "mid"), (24, 24, "edge"),
)

#: THE STACK CHANGES BELOW THE y=71 RAIL AND THAT IS NOT WEATHERING. The same
#: column-median reading, run separately over rows 55-71 and rows 72-96:
#:
#:   x       1   3   4   6   8  10  13  15  17  18  19  20  21  23  24
#:   55-71  16  29  29  43  31  27  31  40  43  48  48  48  43  37  43
#:   72-96  13  23  30  33  18  21  23  36  29  29  24  25  20  32  35
#:
#: The bright poles at x 18-21 lose 20-24 luminance across that rail and end
#: up DARKER than their neighbours, while x 4 gains. This is not a body with
#: a gradient on it — it is the upper gate face catching what light there is
#: and the stacked timber below it standing in the yard's own shade, and the
#: rail is where one stops and the other starts. One table for the whole
#: height gives a set of full-height stripes, which is what a moonlit pole
#: run from y=55 to y=96 looked like: a painted band, not a plane turning.
TIMBER_PLANKS_LOWER = (
    (0, 0, "void"), (1, 1, "seam"), (2, 2, "shade"), (3, 3, "shade"),
    (4, 4, "face"), (5, 5, "shade"), (6, 6, "mid"), (7, 8, "seam"),
    (9, 14, "shade"), (15, 15, "mid"), (16, 16, "shade"), (17, 18, "face"),
    (19, 22, "shade"), (23, 23, "mid"), (24, 24, "edge"),
)

#: Where the one table gives way to the other: the pale run at y 70-71.
TIMBER_SPLIT_Y = 72

#: Ramp step for each tone, on the plank's own family. `seam` and `void` are
#: the two that are NOT pine — a seam between two poles is a crack with
#: nothing in it, and it is warm-dark rather than grey-dark.
#:
#: FIVE TONES, NOT FOUR, AND THE FIFTH IS THE POINT. Read down the bar's
#: column profile at rows 56-70 in eight-luminance buckets and x 19-20
#: alternate between L 40-47 and L 56-63 while every other lit face sits at
#: L 40-47 flat: there is one pole in this stack whose face is square to
#: whatever light there is, and it runs L 54-59 — the top of the timber's
#: measured range at x < 23. Four tones capped at `lit` deliver a mass whose
#: whole body lives inside eighteen luminance, which is the compression the
#: critic named. The measured body is min 7.6 to max 80.3, and it is the
#: SPREAD that says stack-of-poles rather than painted flat.
PLANK_TONE = {"shade": 0, "face": 1, "mid": 2, "lit": 3, "moon": 4}

#: THE BODY IS NOT ONE RAMP EITHER, and this is what the compressed range
#: actually was. §4's own row for this material reads `pine_weathered` 0-1,
#: `dust` 0-1, `mud` 1 — three families, not one — and counting indices in
#: the locked-palette proof over x 0-24, y 55-96 bears it out: grey 0 (94 px)
#: and pine_weathered 1 (81) and dust 0 (80) and pine_weathered 0 (77) and
#: dust 1 (64) and mud 1 (54), a spread across four families before the
#: seventh most common entry. Drawn out of one ramp the same rect came back
#: 90% pine_weathered 0-3: the values were near enough, and the surface read
#: as one painted board with a gradient because every pixel in it was a
#: neighbour of every other.
#:
#: So each tone is a SET OF VALUE-MATCHED ENTRIES and the stream picks one
#: per pixel. They agree on luminance to within a few points and disagree on
#: hue and saturation, which at 320×144 is the difference between weathered
#: timber and a flat fill — and it costs nothing, because these are the
#: entries the region is already measured to use. Repeats are weights.
#:
#: The grain then steps whichever entry was drawn along ITS OWN family, so
#: the hue rule survives: a pixel that came out `dust` is lit as `dust`.
TIMBER_GRAIN = {
    "shade": (("pine_weathered", 0), ("pine_weathered", 0), ("dust", 0),
              ("mud", 1), ("grey", 0)),
    "face":  (("pine_weathered", 1), ("pine_weathered", 1), ("dust", 1),
              ("mud", 3)),
    "mid":   (("pine_weathered", 2), ("pine_weathered", 2), ("dust", 1)),
    "lit":   (("pine_weathered", 3), ("pine_weathered", 3), ("dust", 2)),
    "moon":  (("pine_weathered", 4), ("pine_weathered", 4), ("dust", 3)),
}

#: §1's max row, and the one hard number the left-to-right ramp hangs on:
#: NOTHING IN THE LEFTMOST 24 COLUMNS EXCEEDS L 59. Weathering may widen the
#: band downward as far as it likes — the measured floor is 7.6 — and may not
#: push a lit pole over this, whichever family the pixel landed in.
TIMBER_CEILING = 60.0

#: §2.9's near-horizontal pale runs, "each 1 px, spanning most of the mass's
#: width". (row, x from, x to, step above the body). §7.7: Image A carries a
#: wire X-brace across this face and AT 320×144 THE X DOES NOT SURVIVE — two
#: clean diagonals would be the only diagonal lines in the region and would
#: cut the anchor mass in half. What is left of it is this.
TIMBER_RAILS = ((71, 9, 24, 2), (84, 1, 24, 3), (89, 0, 24, 2))

#: The two moonlit cap rows where the stack's top timbers lie across it. The
#: left cap is a row higher than the right, which is what stops the top of
#: the mass reading as one sawn edge.
TIMBER_CAPS = ((53, 5, 8), (54, 17, 24))

#: The body's own fall from the top of the stack to its foot: measured row
#: medians run about 31 at y 55-62, 25 at y 63-79, 21 at y 80-88 and 17 from
#: y 90 down. The mass is not lit from above — it is simply further out of
#: the sky's reach the lower it goes, and a body drawn at one value from the
#: cap to the ground is the single loudest way to make it read as a slab.
BODY_FALL = ((64, 0), (72, 1), (80, 0), (90, -1))

#: §2.9's lower posts and crate, x 0-10, y 96-122. The same trough-and-peak
#: reading as the body, measured over y 100-112.
LOWER_PLANKS = (
    (0, 0, "void"), (1, 1, "shade"), (2, 2, "lit"), (3, 3, "face"),
    (4, 4, "seam"), (5, 6, "face"), (7, 7, "lit"), (8, 8, "seam"),
)
LOWER_RAILS = ((98, 1, 7, 2), (101, 3, 8, 2))

# ---------------------------------------------------------------------------
# THE SIGN. §2.7, §6.
# ---------------------------------------------------------------------------

#: §6. Eleven capitals across 38 px at 3.45 px pitch — about three pixels
#: wide by six tall with roughly half the letter pairs touching. What the
#: reader gets is a RHYTHM: round shapes at 1, 2, 5 and 10 (C O O O), a
#: single stem at 9 (I), a centre stem at 8 (T), paired stems at 3 and 11
#: (N N). At 1× the word is recognised by silhouette and length.
GLYPH_RHYTHM = ("C", "O", "N", "S", "O", "L", "A", "T", "I", "O", "N")
GLYPH_PITCH = 3.45

#: §6. "Do not straighten the board." The top edge is level at y=62 with
#: ±1 px of hand-cut wobble — it lifts to y=61 over two short runs and the
#: board starts a row late where the left chain crosses it. THE BOARD IS NOT
#: TILTED (§7.3); it is irregular, and only one of those is correctable
#: later. (x from, x to, row).
BOARD_WOBBLE = ((36, 37, 61), (43, 44, 63), (57, 60, 61))

#: §6. The bottom edge steps from y=78 at the left to y=77 from x≈48 right.
BOARD_FOOT_LEFT = 78
BOARD_FOOT_RIGHT = 77
BOARD_FOOT_STEP_X = 48

#: §6. The plank seam between the two lines of type, running BRIGHTER than
#: the field either side. It separates them, and it is the board's
#: construction showing rather than a rule.
BOARD_SEAM_ROWS = (71, 72)

#: THE BOARD IS NOT ONE FAMILY EITHER, and §4 says so in its own row: the
#: face is `umber` 10, `dust` 8, `pine_fresh` 5-6 and `mud` 9-10 — four
#: families inside eight luminance of each other. Drawn out of `umber` alone
#: the face came back as one flat orange plate with a gradient across it, the
#: same failure the timber mass had and for the same reason: every pixel in
#: it was a neighbour of every other. The entries below agree on value to
#: within five points (69 / 66 / 70 / 74) and disagree on hue, which at
#: 320×144 is the difference between a painted board and a fill. Repeats are
#: weights, and the base entry keeps the majority so the board still reads as
#: one object.
#: `dust` is the one entry here that is not warm — warmth +16 against the
#: bar's own face colours, which run +38 to +58 across every one of its
#: dozen most common entries. §4 lists it and the bar holds twenty pixels of
#: it in 731, so it is ONE part in twelve and not one in eight: at an eighth
#: it speckles the face grey and the board stops being wood.
BOARD_GRAIN = (("umber", 10), ("umber", 10), ("umber", 10), ("umber", 10),
               ("umber", 10), ("mud", 10), ("mud", 10), ("mud", 10),
               ("mud", 9), ("pine_fresh", 5), ("pine_fresh", 5), ("dust", 7))

# ---------------------------------------------------------------------------
# THE WHEELS. §2.13 and §7.5-6, re-fitted to the bar's own pixels.
# ---------------------------------------------------------------------------

#: THE FAR TYRE IS AN ARC, NOT A FLANK. §2.13 gives it as "a cool 1-px arc
#: down the outer left, x 12-21, y 95-113", and drawn as a flank — one pixel
#: per row on the leftmost column of a circle — it comes out as a short soft
#: vertical smudge that says nothing. Selecting the bar's cool pixels
#: (blue >= red, L >= 22) over x 8-42 / y 88-122 gives an unmistakable arc:
#:
#:   (23,93) (24,93) (21,94) (22,94) (19,95) (20,95) (18,96) (17,97)
#:   (16,98) (16,99) (16,100) (15,101) ... (15,104) (15,107) (15,108) (17,112)
#:
#: which fits centre (26,103), radius 11, swept from 135 deg to 256 deg —
#: from lower-left, round the flank, to upper-left. THE LEFTMOST COLUMN IS
#: x=15, not x=12: layout.WAGON_WHEEL_FAR's centre is three pixels left of
#: the fit, and three pixels is a third of the gap between the two wheels at
#: this size. The arc stays inside layout's protected box either way, so the
#: void pass still spares it; the box is a guard, not a placement.
FAR_TYRE = (26.0, 103.0, 11.0)
FAR_TYRE_SWEEP = (2.36, 4.47)

#: The near wheel's own rim, measured the same way (red − blue >= 12):
#: a warm column at x=21 from y=96 to y=108, a top arc across x 25-33 at
#: y 93-95, and a right flank around x 34-35 at y 95-100. Against
#: layout.WAGON_WHEEL_NEAR — centre (28,103), rx 9, ry 10 — the left rim
#: lands at 19 and measures 21, so the disc is drawn one step tighter
#: horizontally than the box allows and the box keeps its clearance.
NEAR_TYRE_SQUEEZE = 1.5

#: §7.5's warning and what the bar actually holds, which are not the same
#: thing. "A clean spoked hub produces a bicycle wheel and a moiré at
#: integer scaling" is true and the bar still shows spokes — eight or nine
#: warm streaks in the upper half and the left horizontal, each a different
#: length and a different value, most of them broken somewhere along their
#: run, and nothing at all in the lower right. So: real radii, jittered off
#: the even pitch so no ring sample finds a period, and a dropout that rises
#: with radius and with how far the spoke has turned away from the light.
SPOKE_COUNT = 11
SPOKE_JITTER = 0.14


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    # SIX TAGGED OBJECTS, and the grouping is the answer to errata 32a's
    # actual question: does the composition read as a row of things on one
    # baseline? The beam, the chains, the board and its lamp are ONE HANGING
    # SIGN -- §5's occlusion order has them interpenetrating and the sign
    # does not exist without the beam it hangs from. Likewise the crates,
    # barrel, plank and keg are one heap, which is how §2.12 measures them.
    with ctx.track(canvas, "timber yard"):
        _timber(canvas, ctx)
    _shadow_slot(canvas, ctx)
    with ctx.track(canvas, "hanging sign"):
        _gantry(canvas, ctx)
        _signboard(canvas, ctx)
        _gantry_lamp(canvas, ctx)
    with ctx.track(canvas, "corral panel"):
        _corral(canvas, ctx)
    # §5's occlusion order: THE WHEELS CROSS IN FRONT OF THE TIMBER MASS'S
    # LOWER BODY, AND THE CRATES CROSS IN FRONT OF THE NEAR WHEEL'S LOWER
    # RIGHT. So the yard floor goes down first, the wheels stand on it, and
    # the heap goes down after them.
    #
    # AND IT GOES DOWN BEFORE THE POST, not after. The floor now reaches
    # x=53 to cover the yard behind the heap, and the post is x 50-56: drawn
    # in the old order the floor was scattering dirt over the near-black core
    # of the one unbroken dark vertical the region's depth read depends on.
    _yard_floor(canvas, ctx)
    with ctx.track(canvas, "sign post"):
        _sign_post(canvas, ctx)
    with ctx.track(canvas, "wheel pair"):
        _wheels(canvas, ctx)
    with ctx.track(canvas, "crate stack"):
        _clutter(canvas, ctx)


# ---------------------------------------------------------------------------


def _plank_ink(ctx: layout.Ctx, tone: str, lift: int = 0, stream=None) -> int:
    """The index for one pole face. Four tones, three families, one rule.

    A seam is a crack with nothing in it and is warm-dark rather than
    grey-dark; the lit right edge is the one warm face in the mass, because
    it is the only one turned toward the town; everything else is weathered
    pine stepped by how far it has turned away from the sky.
    """
    if tone == "void":
        return ctx.ink("shadow_slot")
    if tone == "seam":
        return ctx.ink("rail_shadow")               # mud 1, L 17.4
    if tone == "edge":
        return ctx.ink("dry_mud", -1 + lift)        # mud 5, L 37.9
    choices = TIMBER_GRAIN[tone]
    family, step = choices[int(stream.random() * len(choices))]
    ramp = ctx.palette.family(family)
    step = max(0, step + lift)
    # The ceiling is a MEASURED LUMINANCE, not a ramp position, because the
    # entry that reaches it differs by family: pine_weathered 6 is L 59 and
    # dust 4 is L 53, and a fixed step index would cap one and not the other.
    while step > 0 and ctx.palette.luminance(ramp.at(step)) > TIMBER_CEILING:
        step -= 1
    return ramp.at(step)


def _body_fall(y: int) -> int:
    """How many ramp steps the mass has lost by row y. See BODY_FALL."""
    fall = 0
    for row, step in BODY_FALL:
        if y >= row:
            fall = step
    return fall


def _plank_column(canvas: IndexedCanvas, ctx: layout.Ctx, x: int, tone: str,
                  top: int, bottom: int, stream) -> None:
    """One pole, top to bottom, with weathering scattered inside its band.

    §5: the bar carries fine per-pixel value scatter and NO ORDERED PATTERN.
    So this steps single pixels one place along the plank's own ramp at low
    density rather than weaving anything — a plank that has been out in the
    weather for ten years, not a dithered gradient.
    """
    if tone == "void":
        canvas.vline(x, top, bottom - top + 1, _plank_ink(ctx, tone))
        return
    if tone == "seam":
        # A seam is a crack between two poles and it is the only place in the
        # mass that reaches the measured floor of L 7.6. Flat seams at one
        # value turn the stack into corduroy.
        for y in range(top, bottom + 1):
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     -1 if stream.random() < 0.45 else 0))
        return
    for y in range(top, bottom + 1):
        # THE MASS RUNS OUT OF PINE BEFORE IT RUNS OUT OF DARK. Rows 90-96
        # measure a median of 16-19 and `pine_weathered` 0 is L 21 — the
        # family's own floor, so no number of steps down reaches it. The
        # bottom of the stack is stepped into `mud` 0-1 instead: same warmth,
        # four luminance lower, and it is what puts the measured floor of 7.6
        # into a body whose ramp cannot otherwise go below 21.
        if y >= 90 and stream.random() < 0.45:
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     -1 if stream.random() < 0.4 else 0))
            continue
        roll = stream.random()
        # A TWO-TO-THREE STEP BAND with occasional excursions to four. The
        # bar's timber measures min L 7.6 and max L 80.3 inside a body whose
        # mean is 28.7 and whose sd is 10.9: it is not a flat surface with a
        # little noise on it, it is a stack of poles each of which has its
        # own history, and the outliers are what say so.
        if roll < 0.05:
            grain = 2
        elif roll < 0.19:
            grain = 1
        elif roll < 0.29:
            grain = -1
        elif roll < 0.34:
            grain = -2
        else:
            grain = 0
        canvas.put(x, y, _plank_ink(ctx, tone, _body_fall(y) + grain, stream))


def _timber(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.9. The region's anchor, almost entirely one value band."""
    stream = ctx.stream("left_yard.timber")
    cap = ctx.ink("timber_cap")
    x0, y0, width, height = layout.TIMBER_MASS
    foot = y0 + height          # y=97, where the body gives way to the posts

    tops = {}
    for left, right, row in TIMBER_TOP:
        for x in range(left, right + 1):
            tops[x] = row

    for left, right, tone in TIMBER_PLANKS:
        for x in range(left, right + 1):
            _plank_column(canvas, ctx, x, tone, tops[x], TIMBER_SPLIT_Y - 1,
                          stream)
    for left, right, tone in TIMBER_PLANKS_LOWER:
        for x in range(left, right + 1):
            _plank_column(canvas, ctx, x, tone, TIMBER_SPLIT_Y, foot, stream)

    # §2.9's stepped top edge, "each tread capped by a 1-px cool moonlit line
    # at L 47-59 — the brightest cool marks in the region's left half". §5:
    # they are what separates the timber silhouette from the ridge behind it,
    # which is only 5-10 L points away, and they are load-bearing.
    # THEY WERE A STEP DIM. `timber_cap` is grey 3 at L 41 and the caps
    # measure L 47-59 — grey 4 and 5, at 53 and 61. Drawn at 41/53 the whole
    # top of the mass sat under the bar's floor for these marks, and since
    # they are the ONLY thing separating the timber silhouette from a range
    # 5-10 L behind it, a step of loss there costs more than a step anywhere
    # else in the rect. So the cap is grey 4 with grey 5 on the pixels that
    # catch: the run reads as a lit edge with a sparkle in it rather than as
    # a grey line.
    for left, right, row in TIMBER_TOP[1:]:
        for x in range(left, right + 1):
            canvas.put(x, row, ctx.ink("timber_cap",
                                       2 if stream.random() < 0.4 else 1))
    # The third tread carries a second, dimmer line a row down as the stack
    # steps back: the measured run at y=47 reaches x=24 where y=46 stops at 21.
    canvas.hline(16, 47, 9, cap)

    # THE OPEN FRAME ABOVE THE BODY. Between the treads and the body the mass
    # is a gate rather than a wall: two posts standing in front of the range
    # with air between them, measured at L 6-16 either side and L 23-35 on
    # the posts themselves. It is the second-largest dark pool in the frame's
    # left half and it is why the stack reads as built rather than piled.
    for x in range(0, 25):
        top = tops[x]
        if top >= 53:
            continue
        for y in range(top + 1, 53):
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     -1 if stream.random() < 0.6 else 0))
    for x in (6, 8):
        _plank_column(canvas, ctx, x, "face", tops[x] + 1, 52, stream)
    # The lattice: what is left of the gate's upper framing once it is four
    # pixels tall. It survives as short pale runs where a cross-member's top
    # face is turned to the sky, and as nothing else — the members themselves
    # are below the value the range behind them sits at.
    for row, left, run in ((50, 11, 1), (51, 11, 1), (52, 20, 5), (49, 13, 2)):
        canvas.hline(left, row, run, ctx.ink("timber_far", 1))

    # The two cap rows where the stack's top timbers lie across it. Measured
    # in the bar these are the brightest cool marks in the region's left
    # half — L 48-63 at x 5-8 on row 53 and x 18-23 on row 54, i.e. grey 4
    # AND grey 5, not one flat grey 4. A cap row drawn at one index is a
    # ruled line; the bar's is a top face with two or three pixels on it
    # catching more than their neighbours.
    for row, left, right in TIMBER_CAPS:
        for x in range(left, right + 1):
            canvas.put(x, row, ctx.ink("timber_cap",
                                       2 if stream.random() < 0.5 else 1))

    # §2.9's near-horizontal pale runs at y 70-71, 84 and 89 — and they are
    # RUNS, not rules. Drawn as one index across all twenty-five columns they
    # came out as two mechanical lines ruled across the anchor mass, which is
    # §7.7's failure arriving by the other door: the X-brace was not drawn
    # and its replacement was. Thresholding the bar at L 45 over the same rows
    # gives broken segments — y=84 reads `.---xxxx.xxxx..xxx--XXx-XX`, y=89
    # `..----xx---xxxxxx----------x` — short bright lengths where a
    # cross-member's top face is square to the sky, dropping to the body
    # where a pole stands in front of it. So each rail is walked in segments
    # with gaps, and the brightest lengths go two steps over the body.
    for row, left, right, lift in TIMBER_RAILS:
        x = left
        while x <= right:
            run = 2 + int(stream.random() * 5)
            if stream.random() < 0.24:
                x += 1 + int(stream.random() * 2)
                continue
            crown = lift + (1 if stream.random() < 0.38 else 0)
            for step in range(run):
                if x + step > right:
                    break
                if stream.random() < 0.14:
                    continue
                canvas.put(x + step, row,
                           _plank_ink(ctx, "face",
                                      crown - (1 if stream.random() < 0.3 else 0),
                                      stream))
            x += run

    # §5: the lit right edge at x 23-24 is WHAT KEEPS THE MASS FROM BLEEDING
    # INTO THE SHADOW SLOT BESIDE IT, and it is warm where the rest is not.
    # It is measured at L 43 above the y=71 rail and L 35 below it, the same
    # break the poles behind it take: the edge is the corner of the upper
    # gate face, and below the rail there is no gate, only stacked timber.
    # AND IT IS THE REGION'S BRIGHTEST TIMBER, at its foot rather than its
    # top. The bar reads x=24 at L 28-49 through rows 62-79 and L 30-52 from
    # y=80 down, with a single pixel at 80.3 at (24,83) — the whole region's
    # maximum outside the lamps, and the one the critic named as the reason
    # the timber's range was reading compressed. §1's ceiling is on the
    # leftmost 24 COLUMNS, x 0-23; this is the twenty-fifth and it is
    # entitled to the 80. One pixel, and it is not repeated.
    for y in range(60, 92):
        roll = stream.random()
        step = 0 if y < 72 else -2
        if y >= 80:
            step = -1
        canvas.put(24, y, ctx.ink("dry_mud",
                                  step + (1 if roll < 0.3 else (-1 if roll < 0.5 else 0))))
    canvas.put(24, 83, ctx.ink("dry_mud", 4))
    canvas.put(24, 84, ctx.ink("dry_mud", 1))
    # And the near-black column at x=0: column mean L 10.8, the darkest column
    # in the region by a wide margin (§3).
    canvas.vline(0, 55, foot - 55, ctx.ink("shadow_slot"))

    _lower_timber(canvas, ctx, stream)


def _lower_timber(canvas: IndexedCanvas, ctx: layout.Ctx, stream) -> None:
    """§2.9's lower posts and crate, x 0-10, y 96-122.

    The mass does not stop at the body — it stands on posts, and the ground
    between them is the frame's largest dark pool outside the sky (study §1:
    171 px at x 8-24, y 92-122). The posts fade out rather than ending,
    because the near plane takes over below y≈121.
    """
    for left, right, tone in LOWER_PLANKS:
        for x in range(left, right + 1):
            _plank_column(canvas, ctx, x, tone, 96, 118, stream)
    for row, left, right, lift in LOWER_RAILS:
        canvas.hline(left, row, right - left + 1, ctx.ink("timber_body", lift))
    # Below y=113 the posts are out of the moon and into the verge's own
    # falloff; road.md §4.3 measures that corner 10-27 L under the light model.
    for y in range(113, 123):
        for x in range(0, 9):
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     1 if stream.random() < 0.35 else 0))
    # The ground the posts stand in, and the pool the wheels are seen against:
    # study §1's 171-px dark component at x 8-24, y 92-122, the largest in the
    # frame's left half. It is DARK, not void — measured L 11-16 — and the
    # difference is the whole distinction between a shadow and a hole.
    # ITS FLOOR IS L 9-16, NOT L 18-23. The bar reads x 16-19 across rows
    # 104-115 at L 2-22 with a mean near 11, and drawn out of `rail_shadow`
    # it came back a flat 17-24 — seven luminance over the bar in the one
    # place the region is supposed to bottom out, and flat where the bar
    # scatters across twenty. This is the pool the far tyre's arc is seen
    # against and the arc is only 20 luminance above it.
    for y in range(96, 122):
        for x in range(9, 20):
            roll = stream.random()
            canvas.put(x, y, ctx.ink("dark_pocket",
                                     1 if roll < 0.28 else (-1 if roll < 0.55 else 0)))


def _shadow_slot(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.10 and §7.9. The darkest pixels in the region, and the reason the
    signboard reads at all.

    Columns 28-29 fall to L 1.4. It will look like a hole. If it comes up to
    L 20 "so the timber's edge shows", the board's left end loses forty
    luminance points of separation and starts to look glued to the lumber.
    """
    stream = ctx.stream("left_yard.slot")
    x0, y0, width, height = layout.SHADOW_SLOT
    for x in range(x0, x0 + width):
        canvas.vline(x, y0, height, ctx.ink("rail_shadow", -1))
    # The core. It starts a few rows below the beam, because the top of the
    # slot still carries the beam's own end and the timber's junction with it.
    #
    # AND IT ENDS AT y=90, WHERE THE SIGNBOARD IT SEPARATES ENDED ELEVEN
    # ROWS AGO. §3.1's sixty-point step is the board's face against this gap,
    # and the board's foot is y 77-78: below y≈90 there is no board left for
    # the slot to be the dark side of, and the bar agrees — x 28-29 measures
    # L 8-38 across rows 90-96 against L 2-11 above them. Run to the bottom
    # of the rect the channel became a black stripe past the object that
    # justified it, in the middle of the region's darkest quarter, where the
    # study's near-black budget is 1.7% of the frame.
    core_bottom = 90
    canvas.rect(x0 + 3, y0 + 8, 2, core_bottom - (y0 + 8),
                ctx.ink("shadow_slot"))
    for y in range(core_bottom, y0 + height):
        for x in range(x0, x0 + width):
            roll = stream.random()
            canvas.put(x, y, ctx.ink("dark_pocket",
                                     1 if roll < 0.35 else (-1 if roll < 0.6 else 0)))
    # §2.9's lit right edge does not stop where the board does either: the
    # bar carries L 21-39 down x 25-26 across the same rows, which is the
    # timber's corner still catching what the corral post catches.
    for y in range(core_bottom, y0 + height):
        for x in (x0, x0 + 1):
            if stream.random() < 0.3:
                continue
            canvas.put(x, y, ctx.ink("timber_body",
                                     1 if stream.random() < 0.4 else 0))


def _gantry(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.5 and §2.6. Three rows of beam, and three one-pixel hangers.

    The beam's lit face DROPS A ROW as it runs right — measured, y 54-55
    carry it from the timber to about x=56 and y 55-56 carry it from there to
    where it stops. That single-pixel step is the beam running away from the
    eye, and flattening it turns a piece of carpentry into a ruled line.

    The hangers are the entire mechanism by which the sign and the lamp read
    as suspended. §7.4: at 2 px they become posts and the sign stops hanging,
    and they are also the only marks that break the board's bright top row,
    so they must land at x=42 and x=65 exactly or the break falls inside a
    letter.
    """
    x0, y0, width, _ = layout.GANTRY_BEAM
    right = x0 + width - 1                          # x=82, and it STOPS there
    step = 57                                       # where the lit face drops

    canvas.hline(x0, y0, width, ctx.ink("timber_far", -1))
    canvas.hline(35, y0, 16, ctx.ink("timber_body", 1))
    canvas.hline(x0, y0 + 1, right - x0 + 1, ctx.ink("post_mid"))
    canvas.hline(x0 + 2, y0 + 2, step - x0 - 2, ctx.ink("rail_shadow", 1))
    canvas.hline(step, y0 + 2, right - step + 1, ctx.ink("dry_mud", 1))
    # §2.5: its junction with the timber falls away as a short diagonal from
    # about (24,54) to (29,61), which is what stops the beam looking pushed
    # through the lumber pile.
    canvas.line(24, 54, 29, 61, ctx.ink("timber_far", -1))

    for x, material, offset in ((layout.SIGN_CHAIN_LEFT, "shadow_slot", 0),
                                (layout.SIGN_CHAIN_RIGHT, "rail_shadow", -1),
                                (layout.LANTERN_HOOK, "timber_far", 0)):
        canvas.vline(x, 57, 5, ctx.ink(material, offset))


def _signboard(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.7 and §3. The highest local contrast in the whole frame.

    The board is NOT FLAT: it carries a lateral gradient of about +13 L from
    its left sixth to its right end, because the lantern hangs off that end.
    The letters ride that ramp; they do not sit on an even field, and flat
    black letters on a flat board would be the same drawing with all the age
    taken out.
    """
    face_x, face_y, face_w, _ = layout.SIGN_BOARD_FACE
    stream = ctx.stream("left_yard.board")

    wobble = {}
    for left, right, row in BOARD_WOBBLE:
        for x in range(left, right + 1):
            wobble[x] = row

    for column in range(face_w):
        x = face_x + column
        top = wobble.get(x, face_y)
        foot = BOARD_FOOT_LEFT if x < BOARD_FOOT_STEP_X else BOARD_FOOT_RIGHT
        # Five steps of umber across 43 columns is the measured +13 L, and it
        # is the reason the right end of the word sits paler than the left.
        lift = _board_lift(column, face_w)
        for y in range(top, foot + 1):
            roll = stream.random()
            grain = 1 if roll < 0.16 else (-1 if roll < 0.24 else 0)
            canvas.put(x, y, _board_ink(ctx, stream,
                                        lift + grain + _plank_grain(y)))
        # §5: the top of the board is a CONTINUOUS pale run at L 69-95 and it
        # is one of only three hard edges in the region. Where the hand-cut
        # edge lifts a row, the run lifts with it and stays continuous —
        # breaking it is how the board stops looking like one plank.
        if top > face_y:
            canvas.put(x, top, ctx.ink("sign_board", lift + 2))
        else:
            for y in range(top, face_y):
                canvas.put(x, y, ctx.ink("sign_board", lift + 1))

    # §6: the plank seam between the two lines, running brighter than the
    # field either side. It is the board's construction showing, not a rule.
    for row, step in zip(BOARD_SEAM_ROWS, (0, 1)):
        for column in range(face_w):
            canvas.put(face_x + column, row,
                       ctx.ink("sign_board", _board_lift(column, face_w) + step))

    # §5: the board's RIGHT end is a hard edge, L 74.6 to 18.3 in one pixel;
    # its LEFT end ramps instead, over three columns, which is what stops the
    # board looking pasted on against the void of the shadow slot.
    for offset, lift in ((-2, -6), (-1, -4)):
        canvas.vline(face_x + offset, face_y + 1, BOARD_FOOT_LEFT - face_y,
                     ctx.ink("sign_board", lift))

    _lettering(canvas, ctx)


def _board_ink(ctx: layout.Ctx, stream, lift: int) -> int:
    """One pixel of the board's face. Four families, one value. See BOARD_GRAIN.

    The step is applied to whichever family the pixel landed in, so the hue
    rule survives the lateral gradient: a pixel that came out `mud` is lit as
    `mud`, exactly as the timber's grain works.
    """
    family, step = BOARD_GRAIN[int(stream.random() * len(BOARD_GRAIN))]
    return ctx.palette.family(family).at(step + lift)


def _board_lift(column: int, face_w: int) -> int:
    """The board's lateral gradient as a ramp step. §3: +13 L, left to right."""
    return -3 + (4 * column) // face_w


#: The board is THREE PLANKS, not a panel: the top one carries the word, a
#: narrow one carries the seam between the lines, and the bottom one carries
#: the smudge. Each shows its own edge, which is why the face measures a row
#: of horizontal steps rather than an even field. Row -> ramp step against
#: the board's own field, from the measured row medians across x 31-73.
BOARD_ROWS = {62: 2, 63: 1, 64: 2, 71: 0, 72: 1, 73: 1, 77: 1, 78: -3}


def _plank_grain(y: int) -> int:
    return BOARD_ROWS.get(y, 0)


# §6. Three pixels wide, six tall, EVERY STROKE ONE PIXEL. Rows are given as
# a 3-bit mask per row, most significant bit on the left, which is how a
# letter this small is actually described: which of the three columns is
# inked on each of the six rows. A 2-px stroke at this cap height turns the
# word into a solid bar, and a wider glyph turns a weathered painted board
# into a signpost decal (§7.1).
GLYPHS = {
    "C": (0b111, 0b100, 0b100, 0b100, 0b100, 0b111),
    "O": (0b111, 0b101, 0b101, 0b101, 0b101, 0b111),
    "N": (0b101, 0b101, 0b111, 0b111, 0b101, 0b101),
    "S": (0b111, 0b100, 0b111, 0b001, 0b001, 0b111),
    "L": (0b100, 0b100, 0b100, 0b100, 0b100, 0b111),
    "A": (0b111, 0b101, 0b111, 0b101, 0b101, 0b101),
    "T": (0b111, 0b010, 0b010, 0b010, 0b010, 0b010),
    "I": (0b010, 0b010, 0b010, 0b010, 0b010, 0b010),
}


def _lettering(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§6. Draw the word, not the letters.

    Eleven marks on their rhythm, one-pixel stems, half the pairs touching.
    §7.1: the instinct on the one piece of type in the frame is to make sure
    the player can read it, and widening, spacing or squaring the glyphs
    turns a weathered painted board into a signpost decal. The player is
    TOLD what it says by being able to LOOK at it.

    THE LETTERS RIDE THE BOARD'S RAMP. §6: their pixels vary from L 22 to
    L 45 across the word because the board under them climbs +13 L left to
    right. Flat black letters on a flat board would be the same drawing with
    all the age taken out — so the ink is stepped by column, exactly as the
    field behind it is, and a few pixels of each glyph are dropped where the
    paint has worn off the grain.
    """
    stream = ctx.stream("left_yard.lettering")
    face_x, _, face_w, _ = layout.SIGN_BOARD_FACE
    x0, y0, _, height = layout.SIGN_LINE_1

    for position, letter in enumerate(GLYPH_RHYTHM):
        left = x0 + int(round(position * GLYPH_PITCH))
        for row, mask in enumerate(GLYPHS[letter]):
            for column in range(3):
                if not mask & (0b100 >> column):
                    continue
                x = left + column
                ink = _letter_ink(ctx, stream, x - face_x, face_w)
                if ink is None:
                    continue
                canvas.put(x, y0 + row, ink)

    # §6 and §7.2: "2 MILES" is 4 px tall and 20 px wide and it is SUPPOSED
    # to be a smudge — a shorter, fainter row of ticks under the main word,
    # never legible, and it must not be made legible. So it is drawn as its
    # rhythm and nothing else: seven marks on a 2.9 px pitch, each one or two
    # pixels wide, each a different height, none of them a glyph.
    lx, ly, _, lheight = layout.SIGN_LINE_2
    for position in range(7):
        x = lx + int(round(position * 2.9))
        lift = _board_lift(x - face_x, face_w)
        ink = ctx.ink("sign_letter", max(0, (lift * 2) // 3 + 3))
        # Every mark a different height and a different width, because seven
        # identical marks at an even pitch is a comb and reads as ornament.
        top = ly + (1 if stream.random() < 0.35 else 0)
        canvas.vline(x, top, ly + lheight - top, ink)
        for offset, chance in ((1, 0.8), (-1, 0.25)):
            if stream.random() < chance:
                canvas.put(x + offset, ly + lheight - 1 - int(stream.random() * 2), ink)


def _letter_ink(ctx: layout.Ctx, stream, column: int, face_w: int):
    """One pixel of paint on a weathered board, or none. §6, and the note.

    PAINT WEARS, IT DOES NOT SWITCH OFF. Thresholding the bar's face at
    L 28 and L 42 over the letter rows gives 121 marks in two tiers mixed
    together across the whole word — no glyph is solid, every one is eaten
    into somewhere, and the darkest and lightest marks sit side by side. The
    same threshold over a version drawn at one ink per column with a 6%
    dropout gave 123 marks in two clean blocks: a black word on the left half
    of the board and a faint one on the right, which is what a per-column
    ramp does when it is the only thing varying. Same count, and it read as a
    decal because the wear was missing rather than because the values were.

    So there are three outcomes per pixel and not two: gone, worn — one or
    two steps back toward the board it sits on — or paint. And the column
    ramp is carried at two thirds strength, because the board under the
    letters climbs +13 L and the paint on it does not climb with it.
    """
    lift = (_board_lift(column, face_w) * 2) // 3
    roll = stream.random()
    if roll < 0.08:
        return None                                 # the paint is simply gone
    if roll < 0.30:
        # Worn through to the grain: still a mark, but nearer the board than
        # the ink. This is the tier the bar has that a dropout cannot give,
        # and it is a THIRD of the word at most — past that the eleven marks
        # stop being eleven marks and the rhythm §6 is built on goes with
        # them. Measured against the bar: two tiers either side of L 28, both
        # present in every glyph, neither of them the majority anywhere.
        return ctx.ink("sign_letter", lift + 3)
    return ctx.ink("sign_letter", max(-2, lift + int(stream.random() * 2)))


def _gantry_lamp(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.8 and §7.10. Twelve pixels of ochre 13, and NO GROUND POOL.

    Its influence dies within about four pixels: it lights the board's right
    end and stops. Giving it a pool puts two light sources in the left third
    and destroys the reason the road brightens to the right. hob.md §7 adds
    the harder constraint — it must sit below Hob's lamp and must never
    reach the reserved accent_gold band.
    """
    x0, y0, width, height = layout.GANTRY_LAMP
    core_x, core_y = layout.GANTRY_LAMP_CORE

    # The hardware, above and below the glass: a hood on the hook at x=76 and
    # a base plate under it, both at timber values so the object hangs rather
    # than floats. Measured L 21-33 above, 24-54 below.
    canvas.hline(x0, y0, width, ctx.ink("timber_far"))
    canvas.hline(x0 + 1, y0 + 1, width - 2, ctx.ink("timber_body"))
    canvas.hline(x0 + 1, y0 + 8, width - 2, ctx.ink("dry_mud", -1))
    canvas.hline(x0 + 2, y0 + 9, width - 4, ctx.ink("timber_body"))

    # The glass: TWELVE PIXELS AT THE CEILING and one ring around them.
    # Study §7.2 — no non-lantern source may have a fitted bloom over 4 px,
    # and this one is measured at 2.7. It is a blob with an edge, not a
    # window: a rectangle here reads as a lit pane in a wall at native size.
    edge = ctx.ink("dry_mud", -1)
    ring = ctx.ink("lit_window")
    glow = ctx.ink("lit_window_bright")
    hot = ctx.ink("lit_window_hot")
    for row in range(6):
        y = core_y - 2 + row
        # A blob with an edge, not a window: a rectangle here reads as a lit
        # pane in a wall at native size, which is exactly what the town two
        # regions right is made of.
        half = 3 if 1 <= row <= 4 else 2
        for shell, ink in ((half, edge), (half - 1, ring), (half - 2, glow)):
            if shell >= 0:
                canvas.hline(core_x - shell, y, shell * 2 + 1, ink)
        canvas.put(core_x, y, hot)
    for y in (core_y - 1, core_y, core_y + 1):
        canvas.put(core_x + 1, y, hot)

    # The one thing it does light: the board's right end, x 71-73 at y 66-68,
    # which jumps to L 75-85 and nothing beyond. §7.10: give this lamp a
    # ground pool and there are two light sources in the left third.
    canvas.rect(71, 66, 3, 3, ctx.ink("sign_board_lit"))
    canvas.put(72, 65, ctx.ink("sign_board_lit"))
    ctx.shield_rect(x0 - 4, y0 - 2, width + 6, height + 4)


def _corral(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.4 and §7.13. Four rails, each a single lit pixel row, and a post.

    THE PANEL IS TWELVE PIXELS LONG and stops dead at the capped post at
    x 70-72. Running it on to the region edge fills the space the lantern
    pool needs. There is no rail body at this size — a rail IS its lit edge,
    and two-pixel rails at 4-px pitch alias into a striped block at integer
    upscale.

    THEY ARE NOT A LADDER OF EQUAL LIGHTS. Measured means 32.7 / 48.9 /
    36.7 / 27.8 top to bottom: the second rail is the bright one and the
    panel goes near-black below the fourth. Four equal rails read as a
    graphic; these read as timber with the moon on one of them.
    """
    left, right = 57, 69
    stream = ctx.stream("left_yard.corral")

    # THE GAPS ARE COOL AND THAT IS WHY THE RAILS READ. §4's row for this
    # material is "corral rails, lit edges `mud` 7-9, `pine_weathered` 6 OVER
    # `grey` 0-1 GAPS", and the bar bears it out: measured warmth across
    # x 57-70 runs -22 to +10 on every gap row and reaches +10 to +30 only on
    # the two lit rails. Authored warm at `mud` 1 the panel came out as one
    # warm mass with bright bars on it — §7.13's striped block, arrived at
    # from the other side, because the thing the rail is an edge AGAINST was
    # the same hue as the rail. Cool gaps give the four edges forty degrees
    # of hue to work with on top of their eighteen luminance.
    #
    # AND THE BASE RUNS TO y=99. §2.14's band table gives rows 92-99 as
    # "base shadow ~25 — where the fence, post and clutter stand", and the
    # panel's own footing is part of it: §2.4 has the panel going near-black
    # below y=93 and it does not stop there, it stands in something.
    for y in range(79, 100):
        for x in range(left, right + 1):
            roll = stream.random()
            if y >= 94:
                # The footing, and it is NOT the panel's own near-black:
                # §2.14 measures rows 92-99 at about 25 and the bar reads
                # L 19-26 at warmth -22 to +5 right across it. Taken down to
                # the gap value it was eleven luminance under the band and
                # the fence stopped standing on anything.
                ink = ctx.ink("verge_mud", 1 if roll < 0.55 else 0)
            elif y >= 93 or roll < 0.22:
                ink = ctx.ink("dark_pocket", -1 if roll < 0.4 else 0)
            else:
                ink = ctx.ink("verge_mud", 1 if roll < 0.6 else 0)
            canvas.put(x, y, ink)

    # FOUR RAILS, AND THEY ARE NOT A LADDER OF EQUAL LIGHTS. Measured means
    # 32.7 / 48.9 / 36.7 / 27.8 top to bottom, and measured peaks 36 / 61 /
    # 44 / 36: the second rail is the bright warm one, the first and last are
    # neutral, and the panel goes near-black below the fourth. Four equal
    # rails read as a graphic; these read as timber with the moon on one.
    #
    # THE THIRD RAIL STEPS A ROW. Thresholding the bar, its lit run is at
    # y=88 across x 57-61 and at y=89 across x 62-69 — one pixel of downhill,
    # which is the rail running away from the eye. It is the only thing in
    # the panel that is not parallel to the frame edge, and four rails all
    # dead level is the other half of why the panel read as a graphic.
    rails = (
        ((81, 57, 69),), ((85, 57, 69),), ((88, 57, 61), (89, 62, 69)),
        ((92, 57, 69),),
    )
    tones = (("stone", 0, 0.45), ("dry_mud", 2, 0.55),
             ("dry_mud", 0, 0.5), ("stone", 0, 0.35))
    for segments, (material, lift, sparkle) in zip(rails, tones):
        for row, run_left, run_right in segments:
            for x in range(run_left, run_right + 1):
                # The lit rows fall away toward the post: the bar's second
                # rail runs L 51-61 to x=66 and 35-25 over its last three
                # columns, which is the panel turning out of what light there
                # is rather than the rail ending.
                fall = max(0, (x - 65)) // 2
                step = lift - fall - (0 if stream.random() < sparkle else 1)
                canvas.put(x, row, ctx.ink(material, step))
            # The row under each rail is what the rail is READ against and it
            # is not a rule either: the bar gives it at L 13-29 with three or
            # four luminance of scatter, and drawn at one index it puts a
            # second straight line under every straight line in the panel.
            for x in range(run_left, run_right + 1):
                canvas.put(x, row + 1,
                           ctx.ink("dark_pocket", 1 if stream.random() < 0.5 else 0))

    px, py, pwidth, pheight = layout.CORRAL_POST
    # §2.4: "brightening on its right face toward the lantern" — the post is
    # split, x=70 in shade and x 71-72 lit, and that split is the only thing
    # saying the panel ends at an upright rather than running out of frame.
    # The bar reads x 71-72 at L 41-52 with excursions to 70 and down to 27,
    # so the lit face is scattered inside a two-step band rather than ruled:
    # a flat vline here is the one place in the panel a straight edge shows.
    for row in range(py, py + pheight + 2):
        canvas.put(px, row, ctx.ink("post_dark",
                                    1 if stream.random() < 0.3 else 0))
        canvas.put(px + 1, row, ctx.ink("post_mid",
                                        1 if stream.random() < 0.45 else 0))
        canvas.put(px + 2, row, ctx.ink("post_mid",
                                        0 if stream.random() < 0.6 else -1))
    canvas.hline(px, py, pwidth, ctx.ink("timber_cap"))
    # §7.13 and §8: THE PANEL ENDS AT THAT POST. It is shielded along with
    # the panel because §2.4 measures both directly and the pool's own left
    # cut runs through them — letting the lamp lift a rail four steps turns
    # four measured means into one striped block.
    ctx.shield_rect(left, 79, (px + pwidth) - left, 23)


def _sign_post(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.11 and §7.14. Seven pixels across, split hard, and never softened.

    It stays at L 22-26 all the way down while the ground behind it climbs
    from 25 to 61, so it silhouettes hardest from y≈100 down. That unbroken
    dark vertical crossing the lit road is the region's strongest depth cue.
    It is SHIELDED from the lighting pass for exactly that reason: letting
    the lamp wrap around it removes it, and the pool's own left cut is at
    x 58-62, one pixel away.

    The split, measured: x=50 in shade, x 51-52 a near-black core, x 53-54 a
    mid step, x 55-56 a lit face at L 45-85. §5 lists that x 55→57 edge as
    one of the region's three hard edges — one pixel, forty luminance points.
    """
    x0, y0, width, height = layout.SIGN_POST
    columns = (("post_dark", 0), ("umber_core", 0), ("umber_core", 0),
               ("timber_far", 1), ("timber_far", 2),
               ("post_lit", 0), ("post_lit", -2))
    for offset, (material, lift) in enumerate(columns):
        if material == "umber_core":
            ink = ctx.ink("dark_pocket")
        else:
            ink = ctx.ink(material, lift)
        canvas.vline(x0 + offset, y0, height, ink)
    # §2.11: its foot dissolves into the dark foreground around y 118-120; it
    # does not get a base. The lit face gives out first, then the rest.
    canvas.vline(x0 + 5, 113, 6, ctx.ink("post_mid"))
    canvas.vline(x0 + 6, 113, 6, ctx.ink("post_dark"))
    for offset in range(width):
        canvas.vline(x0 + offset, 119, 3, ctx.ink("dark_pocket"))
    ctx.shield_rect(x0, y0, width, height + 3)


def _clutter(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.12. Five objects, and each one is a lit top edge with dark under it.

    §7.12: given side planes, hoops, staves and cast shadows they become six
    small objects competing at L 30-45 in the region's darkest quarter, and
    the wheel — which is the shape that actually matters down there —
    disappears among them. So each is a body at L 8-25 and ONE row of light,
    and the light is what varies: the plank's lid is the brightest thing in
    the heap at L 57-69 and the barrel's rim the weakest at L 30-52.
    """
    stream = ctx.stream("left_yard.clutter")
    #: box, lit-edge row, inset, run, edge material, edge lift, and the two
    #: columns of its LAMP SIDE. §7.12 forbids modelling and the bar still
    #: holds sustained vertical runs at L 30-54 down x 38-39 and x 46-47
    #: across rows 85-101 — one lit column pair per box, on the side the
    #: lantern is, is not a side plane with a hoop and a stave on it. Left
    #: out, the whole heap measured p75 = 18 against the bar's 36 and read as
    #: five bright rules floating on black.
    boxes = (
        (layout.CRATE_UPPER, 83, -4, 10, "dry_mud", 2, (46, 47)),
        (layout.CRATE_LOWER, 85, 0, 7, "dry_mud", 0, (39, 40)),
        (layout.OPEN_BARREL, 95, -12, 10, "dry_mud", -1, (46, 47)),
        (layout.PLANK_LID, 103, 0, 11, "dry_mud", 3, (41, 42)),
        (layout.SMALL_KEG, 113, 0, 9, "dry_mud", 2, (34, 35)),
    )
    for (x0, y0, width, height), row, inset, run, material, lift, lamp in boxes:
        for y in range(row, y0 + height):
            for x in range(x0, x0 + width):
                # The body is a BODY, not a modelled box — no hoop, no stave,
                # no cast shadow. It sits under the yard floor it stands on
                # and that step is the whole of it. The BAND was the error:
                # §2.12 gives it as L 8-25 and it was drawn at L 13-23 with
                # the mean at the bottom of that, so the heap composited nine
                # luminance under the bar across the region's darkest quarter.
                roll = stream.random()
                canvas.put(x, y, ctx.ink("rail_shadow",
                                         2 if roll < 0.30 else (1 if roll < 0.62 else 0)))
        for x in lamp:
            if not x0 <= x < x0 + width:
                continue
            for y in range(row + 1, y0 + height):
                if stream.random() < 0.22:
                    continue
                canvas.put(x, y, ctx.ink("dry_mud",
                                         -2 if stream.random() < 0.55 else -3))
        for step in range(run):
            x = x0 + inset + step
            canvas.put(x, row, ctx.ink(material,
                                       lift - (1 if stream.random() < 0.35 else 0)))
        ctx.shield_rect(x0, row, width, y0 + height - row)


def _yard_floor(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The dirt the wheels lean in and the heap stands on. §2.12, §2.14.

    Everything below y=95 in this corner is read AGAINST this, and it is the
    one surface here that is neither an object nor the road: the road proper
    starts where the lantern's cut ends, at x≈50. Measured L 17-30, mean
    about 25 — dark, but nothing like the void at the timber's foot, and the
    difference between those two is the difference between a yard and a hole.
    """
    stream = ctx.stream("left_yard.floor")

    # THE YARD BEHIND THE HEAP, AND IT IS A HOLE. Study §1 lists a 100-px
    # dark component at x 25-37, y 64-92 and the bar measures x 26-49 across
    # rows 79-95 at L 2-16 — near-black, with only the crates' lit top edges
    # coming out of it. This band was left to the mid-ground plane, which is
    # drawn across the whole frame width at L 21-33 on an ordered 4x4, so
    # twenty columns of the yard composited as a visible blue checkerboard
    # under the signboard: nine luminance too light, and carrying the one
    # thing §5 measures at zero everywhere in this rect. It is also the
    # ground the crates are read against, and §3.4's "highlight with darkness
    # under it" needs the darkness to exist before the highlight is drawn.
    for y in range(79, 96):
        for x in range(30, 54):
            # The right edge dissolves into the sign post's own shade rather
            # than stopping: x 50-56 is the post and it is drawn after this.
            roll = stream.random()
            if roll < 0.10:
                ink = ctx.ink("shadow_slot")
            else:
                ink = ctx.ink("dark_pocket", 1 if roll < 0.45 else 0)
            canvas.put(x, y, ink)

    for y in range(95, 119):
        for x in range(20, 53):
            # NO EDGE ON ANY SIDE. A rectangle of dirt is a rectangle, and
            # its four corners are visible at native size from across the
            # room. It gives out into the timber's void on the left and into
            # the road on the right over six columns each, and it never has a
            # top: the row it starts on walks.
            if x < 26 and stream.random() < (26 - x) / 6.5:
                continue
            if x > 46 and stream.random() < (x - 46) / 6.5:
                continue
            if y < 97 + (x % 3):
                continue
            # AND IT RAMPS. §1's column table climbs 21.1 → 50.0 left to
            # right and this is the surface carrying that climb in the
            # bottom left: the bar reads L 8-22 at x 20-30 and L 30-45 at
            # x 44-52 across the same rows, because the lantern pool is
            # dying out on it rather than because the dirt changes. Drawn at
            # one value the yard was a flat plate eleven luminance under the
            # bar at its right end and it took the monotonic ramp with it.
            #
            # Two steps at any given column, not three. §5's texture is
            # scatter inside a NARROW band; open a third and the dirt reads
            # as noise, which is what invariant 9 exists to keep out.
            # ...and it ramps back DOWN below y=113. §2.14's band table has
            # the lit road at rows 100-114 and "foreground shade" at rows
            # 115-124 at about 23: the near strip is in front of the light,
            # not in it, and a ramp that only climbs runs the yard's right
            # end ten luminance over the bar across the bottom eight rows.
            lift = 1 + max(0, x - 30) // 7 - max(0, (y - 111)) // 3
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     max(0, lift) + (1 if stream.random() < 0.4 else 0)))


def _wheels(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.13 and §7.5-6. Two wheels, and neither is drawn as a wheel.

    The far one exists ONLY as a cool 1-px tyre arc down its outer left. It
    is the only evidence there are two, and drawing it properly puts two
    competing circles in a 16-pixel span. The near one is a warm rim over a
    dark disc: measured on rings at radius 4-8 the interior has standard
    deviation 13-17 and NO ANGULAR PERIODICITY, so a clean spoked hub
    produces a bicycle wheel and a moiré at integer scaling — a mechanically
    regular object in the darkest corner of the frame, which drags the eye
    straight to it. What is there is a dark disc, a partly lit rim, and a
    handful of warm accents where a spoke catches.
    """
    stream = ctx.stream("left_yard.wheels")
    near_x, near_y, near_rx, near_ry = layout.WAGON_WHEEL_NEAR
    near_rx -= NEAR_TYRE_SQUEEZE

    _far_tyre(canvas, ctx, stream)

    # The near wheel's disc. §2.13: sampled on rings at radius 4-8 the
    # interior gives mean L 21, sd 13-17, MINIMUM 2.4 AND MAXIMUM 69. The
    # minimum is the point — it is near-black between the spokes, not a mid
    # mush at the mean, and the mean only arrives because the spokes are in
    # the same sample. Drawn as an even scatter around L 21 the disc came
    # back as a soft grey blob with a rim on it, which is the one shape §7.5
    # says the object must not be.
    for dy in range(-near_ry, near_ry + 1):
        for dx in range(-int(near_rx) - 1, int(near_rx) + 2):
            if (dx / near_rx) ** 2 + (dy / near_ry) ** 2 > 1.0:
                continue
            roll = stream.random()
            if roll < 0.10:
                ink = ctx.ink("shadow_slot")     # the measured minimum, 2.4
            else:
                ink = ctx.ink("dark_pocket", -1 if roll < 0.55 else 0)
            canvas.put(near_x + dx, near_y + dy, ink)

    _spokes(canvas, ctx, stream, near_x, near_y, near_rx, near_ry)

    # The tyre, ONE PIXEL all the way round, because at this size a two-pixel
    # rim on a nine-pixel radius is a doughnut. Warm — §4 gives `pine_fresh` 2
    # and `umber` 6 at L 39-43 — and it is not the same brightness all the way
    # round: the bar's rim runs L 30-45 across the top and the left flank and
    # falls into the dirt at the bottom, where the measured pixels stop.
    for dy in range(-near_ry, near_ry + 1):
        span = 1.0 - (dy / near_ry) ** 2
        if span <= 0:
            continue
        reach = near_rx * span ** 0.5
        for dx in (-int(round(reach)), int(round(reach))):
            # The left flank is the lit one: it is the edge turned toward the
            # road, and it is the run the bar measures from y=96 to y=108.
            lit = dx < 0 and dy < 5
            if not lit and stream.random() < 0.35:
                continue
            canvas.put(near_x + dx, near_y + dy,
                       ctx.ink("post_mid", 0 if lit else -2))
    for dx in range(-int(near_rx), int(near_rx) + 1):
        span = 1.0 - (dx / near_rx) ** 2
        if span <= 0:
            continue
        reach = near_ry * span ** 0.5
        # The bar's top arc is its brightest run — row 95 reads L 42-52
        # across x 25-31 — and it is the edge the whole object hangs off at
        # native size. A rim drawn at one step under the left flank loses it.
        canvas.put(near_x + dx, near_y - int(round(reach)),
                   ctx.ink("post_mid", 1 if stream.random() < 0.45 else 0))
        if stream.random() < 0.3:
            canvas.put(near_x + dx, near_y + int(round(reach)),
                       ctx.ink("post_mid", -3))

    # The hub: three pixels, and it is the only place in the disc where two
    # lit pixels touch. Anything larger reads as a boss on a ship's wheel.
    canvas.put(near_x, near_y - 1, ctx.ink("post_mid", -1))
    canvas.put(near_x + 1, near_y - 1, ctx.ink("dry_mud", -2))
    canvas.put(near_x, near_y, ctx.ink("dry_mud", -1))


def _far_tyre(canvas: IndexedCanvas, ctx: layout.Ctx, stream) -> None:
    """§2.13 and §7.6. The only evidence there are two wheels.

    A cool 1-px arc and nothing else — no spokes, no felloe, no interior.
    Omitting it makes the near wheel look like it is leaning on nothing;
    drawing it properly puts two competing circles in a 16-pixel span. So it
    is drawn ONCE, at one pixel, in `stone` — the region's cool mid step —
    and it is the only cool note in the bottom-left quarter.
    """
    cx, cy, radius = FAR_TYRE
    start, end = FAR_TYRE_SWEEP
    seen = set()
    steps = int((end - start) * radius * 3)
    for index in range(steps + 1):
        angle = start + (end - start) * index / steps
        x = int(round(cx + radius * math.cos(angle)))
        y = int(round(cy + radius * math.sin(angle)))
        if (x, y) in seen:
            continue
        seen.add((x, y))
        # It is iron, out in the weather, half in the timber's shadow: the
        # measured run is L 19-36 rather than one value, and the dimmer
        # pixels cluster at the two ends where the arc turns out of the sky.
        edge = min(index, steps - index) / steps
        fade = 1 if edge < 0.18 or stream.random() < 0.25 else 0
        canvas.put(x, y, ctx.ink("stone", -fade))


def _spokes(canvas: IndexedCanvas, ctx: layout.Ctx, stream,
            cx: int, cy: int, rx: float, ry: int) -> None:
    """§7.5, honoured rather than obeyed literally.

    "The wheel will be drawn as a wheel" is the failure it names, and the
    failure is a CLEAN hub: twelve identical radii at an even pitch, which
    moirés at integer upscale and puts a mechanically regular object in the
    darkest corner of the frame. The bar is not empty there — it holds eight
    or nine warm streaks, every one a different length and a different value,
    most of them broken somewhere along the run, and NOTHING in the lower
    right where the wheel has turned away from the road.

    So the spokes are real radii and nothing about them is regular: the pitch
    is jittered off even, each one gets its own value and its own reach, and
    the dropout rises with radius and with how far round the rim it has gone.
    A ring sample at radius 4-8 finds no period in that, which is what §2.13
    measured; what the eye finds is a wheel.
    """
    for spoke in range(SPOKE_COUNT):
        angle = (spoke / SPOKE_COUNT) * 2.0 * math.pi
        angle += (stream.random() - 0.5) * SPOKE_JITTER * 2.0
        # How far this spoke has turned away from the light. The road is to
        # the right and a little below; the run that catches is the upper
        # half and the left horizontal, exactly as measured.
        turn = math.sin(angle)
        lit = turn < 0.3
        if not lit and stream.random() < 0.35:
            continue
        # THIRTY-ONE PER CENT OF THE DISC IS OVER L 30 IN THE BAR, and that
        # number is what says wheel. Sampled inside the same ellipse the bar
        # gives median 20 / p75 32 / max 69 against a first pass at median 14
        # / p75 26 / 15% over L 30 — the spokes were there, they were half as
        # many and two steps too dim, and the object came back as a dark disc
        # with a rim, which §7.5 rules out exactly as firmly as a bicycle
        # wheel. The spoke is walked in ELLIPSE FRACTION rather than in
        # pixels: at rx 7.5 against ry 9.5 a circular radius reaches the rim
        # at twelve o'clock and is still two pixels short at nine, so a
        # radius-based walk with an ellipse gate on the end silently deleted
        # the outer third of every horizontal spoke.
        reach = (0.80 + stream.random() * 0.19) * (1.0 if lit else 0.8)
        bright = 0 if stream.random() < 0.25 else -1
        steps = int(rx + ry)
        for index in range(steps + 1):
            # AND THEY DO NOT MEET AT THE HUB. Walked from a fifth of the
            # radius out, eleven spokes converge on four pixels and the disc
            # gets a bright star in the middle of it -- §7.5's bicycle wheel
            # arriving as a hub rather than as a rim. The bar's own centre,
            # x 26-30 by y 100-104, is mid-to-dark with no convergence in it
            # at all: what catches is the OUTER half of a spoke, where the
            # face has turned toward the road.
            fraction = 0.40 + (reach - 0.40) * index / steps
            if stream.random() < 0.10 + 0.34 * fraction:
                continue
            x = cx + int(round(rx * fraction * math.cos(angle)))
            y = cy + int(round(ry * fraction * math.sin(angle)))
            canvas.put(x, y, ctx.ink("post_mid", bright - (0 if lit else 1)))
