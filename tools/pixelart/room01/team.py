"""Room 1 — the coach team. Three horses, 69 x 36 px, at rest.

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
value step, and §9.5 warns that the 6.7 will feel far too subtle at 8x and
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
by NOT drawing — every mass is built column by column with a measured top
and a measured bottom, and a hole is a column the loop never enters.

THE HIDE IS THE BUSIEST SURFACE IN THE FRAME AND IT IS NOT A DITHER. §7
measures a mean horizontal run of 1.27 px in the mane and 1.65 in the lit
barrel, 68-80% single-pixel runs, and no repeating motif anywhere: no
checkerboard, no ordered matrix, no 50% mix between two adjacent steps of
one ramp. What is actually there is per-pixel stipple alternating between
`pine_fresh` and `mud` AT THE SAME LUMINANCE, which is why the barrel reads
as hair while its value profile stays smooth top to bottom. `_Hide` below
copies the statistic rather than a pattern: a first-order Markov field whose
flip probability IS the reciprocal of the target mean run, so 0.61 gives
1.65 px on the barrel and 0.79 gives 1.27 px on the mane, and a second,
uncorrelated field resolves the fractional rung of the value ladder so the
gradient itself never bands.

IT RIDES WITH THE COACH. coach.md §8 makes the coach a removable object
layer and errata 31d makes the shipping background the departed
composition; the team is hitched to the vehicle and leaves with it, so this
region draws nothing when ctx.with_coach is False. That is also what makes
the coach layer come out of a difference of two composes.
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

#: §3.5, measured off the bar: the top row of the far mass, column by column,
#: for x 170 to 193. It is flat to within four pixels over twenty-four
#: columns and the wobble IS the edge — drawn dead straight the far animals
#: become a plank, drawn with a curve they become one animal with a
#: swayback. Left of x=170 the crest is a solid black bar and its top row is
#: CREST_TOP.
TOPLINE = (69, 69, 69, 70, 70, 71, 71, 69, 68, 71, 71, 72,
           71, 70, 70, 70, 70, 68, 69, 70, 70, 71, 71, 72)
TOPLINE_FROM = 170
CREST_TOP = 69

#: §3.4. The near-black bar ends at x=171 and the topline goes on to x=193
#: without it. Measured, x 160-169 at y 70 is L 0-4 and x 172-193 at y 71 is
#: L 8-20 — one is a cut-out and the other is an edge, and drawing thirty-four
#: columns of the first is what turned three animals into a building.
CREST_RIGHT = 171

#: §3.3, measured. Six cool pixels widening downward from 2 px to 6 px, per
#: row y 77-81 as (left, right) inclusive. THE SINGLE MOST LOAD-BEARING
#: NEGATIVE SHAPE IN THE REGION — the difference between a lowered head and a
#: thick neck.
JAW_WEDGE_TOP = 77
JAW_WEDGE = ((162, 163), (162, 163), (160, 163), (159, 163), (159, 164))

#: §3.12. Six highlight peaks between x 180 and x 195 along a 19 px axis at
#: 28° above horizontal. Pitch 2-4 px, mean 3 — and §7 says do not comb them
#: into an even pattern, the measured pitch varies. The second number is how
#: far each stroke stands proud of the crest line, and it varies too.
MANE_POLL = (177, 84)
MANE_WITHERS = (194, 75)
MANE_PEAKS = ((181, 3), (183, 4), (186, 4), (188, 3), (190, 4), (194, 3))

#: §4.5. The neck leaves the body at the withers and rises at 28°, and it is
#: NOT a constant thickness: measured on the bar the lit plane under the
#: crest is four rows deep behind the poll and twelve by the time it reaches
#: the shoulder. It runs a column past the withers at each end so that it
#: meets the head at one end and the back at the other with no seam.
NECK_FROM, NECK_TO = 175, 197

#: The lit ridge the six strokes stand on, measured x 178-196.
MANE_BAND_FROM, MANE_BAND_TO = 178, 196
NECK_DEPTH_POLL, NECK_DEPTH_SHOULDER = 4, 12

#: §4. C's head is the only one with a top edge — B's and A's merge upward
#: into the mass with no seam at all — so the brow curve is fitted to C's
#: measured tops (11, 10, 7, 5, 3, 0, 1 rows below its own top row across
#: seven columns). A power curve, because a straight ramp gives a wedge and
#: a wedge is a beak.
HEAD_BROW_POWER = 1.35

#: The chin, as a fraction along the head. The muzzle is the lowest point and
#: it is NOT in the middle: it sits about a third of the way back, and behind
#: it the jaw and throat climb away steeply. §4's 13 : 7 is the head's
#: bounding box; this is its shape inside it.
HEAD_CHIN = 0.30
HEAD_MUZZLE_LIFT = 3.0     # rows the nose rises in front of the chin
HEAD_THROAT_LIFT = 7.0     # rows the throat rises behind it

#: §5. The hide ladder. Each rung is TWO entries at the SAME luminance, one
#: warm-chestnut `pine_fresh` and one `mud`, because §7 is explicit that the
#: barrel is not a mix of two steps of one ramp — it is stipple between two
#: FAMILIES at matched value. Written as (material, offset) pairs so that
#: nothing here names an index and every step is a move along a family the
#: shared material table already chose.
#:
#: AND THE RUNGS ARE THREE LUMINANCE APART WHERE THE ANIMALS LIVE. The ladder
#: was nine rungs with an 8-luminance gap either side of L 27, so the barrel,
#: which the reference draws between 25 and 41, had three values to say it in
#: and came out in bands. The locked-palette proof of the bar uses eleven
#: entries in this region and its three commonest are `pine_fresh` 0 and 1 and
#: `mud` 4 — 27.9, 36.9, 34.5 — which the old ladder could not tell apart.
#: Every entry below is inside §6's twenty: `pine_fresh` 0-4, `mud` 0-7,
#: `umber` 0-5, `void` 0.
HIDE_TONES = (
    (("horse_black", 0), ("horse_hide_shadow", 0)),       # L 0.0  / 9.2
    (("horse_hide_shadow", 0), ("horse_hide_mid", -3)),   # L 9.2  / 12.7
    (("horse_hide_shadow", 1), ("horse_hide_mid", -2)),   # L 14.4 / 17.9
    (("horse_hide_mid", -1), ("horse_hide_shadow", 3)),   # L 23.1 / 25.5
    (("horse_hide_mid", 0), ("horse_hide", -1)),          # L 27.1 / 27.9
    (("horse_hide_mid", 1), ("horse_hide_shadow", 5)),    # L 34.5 / 35.0
    (("horse_hide", 0), ("horse_hide_mid", 2)),           # L 36.9 / 38.5
    (("horse_hide_mid", 3), ("horse_hide", 1)),           # L 43.7 / 44.5
    (("horse_hide_mid", 4), ("horse_hide", 2)),           # L 49.5 / 53.8
    (("horse_hide", 3), ("horse_hide", 3)),               # L 62.5
)
TONE_LUMINANCE = (4.6, 11.0, 16.2, 24.3, 27.5, 34.8, 37.7, 44.1, 51.7, 62.5)

#: The floor the STIPPLE may reach. `void@0` is 21-31% of the crest, the tail
#: and the chest shadow and is used NOWHERE ELSE in the region (§6) — so the
#: mottled planes are clamped above it and only the four hard-edged masses,
#: which ask for it by name, ever get there. Unclamped, the wobble put 170
#: single black pixels through the hide against the reference's 99 pooled
#: ones, and a plane with black speckle through it reads as sawn timber.
STIPPLE_FLOOR = 10.0

#: §7's measured run lengths, as flip probabilities. A first-order Markov
#: chain that changes state with probability p has mean run 1/p, so these ARE
#: the table: mane 1.27 px, legs 1.35 px, lit hide 1.65 px.
RUN_MANE = 1.0 / 1.27
RUN_LEG = 1.0 / 1.35
RUN_HIDE = 1.0 / 1.65

#: §3.19, measured. Where each cannon stands relative to its own ground
#: contact. It is NOT zero and it is not constant: a standing horse's toe
#: points forward, so the hoof reaches past the leg on the near side, and the
#: two hind pairs stand a further two pixels back again. Measured cannons on
#: the bar: 172-174, 178-180, 181-183, 185-187, 190-192, 194-196, 199-201,
#: 209-211, 215-217 against the nine contacts in layout.HOOVES.
CANNON_OFFSET = (0, 1, -1, -1, -1, -1, -2, -2, 0)

#: The three columns of a cannon, front to back. §7: 2-3 px of hide across,
#: LIT ON THE LEADING EDGE with 1 px of `umber@0` behind it. That last column
#: is the whole reason nine legs read as nine — measured, the lit columns run
#: L 30-51 and the column behind each one drops to L 1-11, and it is the hard
#: black line rather than the light that separates them.
CANNON_PLANES = (46.0, 30.0, 4.0)

#: §3.20, measured, and §7 calls them as load-bearing as the legs: six cool
#: BACKGROUND holes between the legs, L 18-29 at warmth −7 to +2. They are the
#: hillside seen through the team, not the animals' own shade, and §9.8 is
#: explicit that painting them warm and dark closes the silhouette and loses
#: every leg. Each is (x0, x1, y0, y1) inclusive.
#:
#: THEY ARE DRAWN BY NOT BEING DRAWN, so every mass that could reach into one
#: has to ask. The whole lower half of this region used to be a solid apron
#: from the underline to the ground — x 197-215 filled black from y 86 to 91,
#: on the reasoning that a gap between the fore and hind legs would make the
#: animal read as a table. Measured, the reference has exactly that gap: holes
#: 5 and 6 are the daylight between A's foreleg and its hind leg, and closing
#: them is what turned nine legs into one dark skirt.
HOLES = ((170, 172, 89, 97), (178, 179, 91, 96), (185, 187, 88, 96),
         (190, 192, 92, 95), (198, 202, 91, 95), (204, 209, 90, 93))

#: §3.17 exactly: the underline is ONE dark row. Measured across x 202-215 it
#: runs L 4-14 at y=86 and is back to L 16-32 by y=87 — the rows under it are
#: the stifle, the gaskin and the gap between them, not more shadow.
UNDERLINE_Y = 86

#: §5.2's rim, measured end to end: it starts at the withers ramp and runs to
#: the far side of the croup, x 195-221, not the 22 px the summary quotes.
RIM_FROM, RIM_TO = 195, 221

#: The trace strap across the barrel, measured (see `_strap_x`).
STRAP_TOP, STRAP_LEAN = 204.5, 0.45

#: Where the flank starts losing light into the point of the hip. Measured,
#: columns 214-218 run four to eight luminance under 210-213 at every row
#: below y=82.
HIP_FROM = 214
#: The hind quarter under the barrel, measured at y 87-91: a lit gaskin at
#: x 212-218 (L 24-40), a dark gap at x 208-211 (L 0-8) and the flank and
#: stifle at x 202-207 (L 16-28). Three masses, not one band.
GASKIN = (211, 218)
STIFLE = (202, 207)

#: The hame strap, measured: one column about four L under its neighbours.
HAME_X = 198

#: §3.18's darkest mass, as a centre rather than as a rectangle.
CHEST_CORE = (184, 87)

#: Where the pooled shadow begins. See `_cast_shadow`.
SHADOW_TOP = 90

#: §3.2. C's head, measured as an AXIS rather than as a box. The row the
#: measurements are anchored on, the left edge of the head on that row, the
#: centre of the lit nasal plane on that row, and how far both walk left per
#: row down. Left edge: 156 at y=71 falling to 153 by y=81. Nasal centre:
#: 158.8 at y=71 falling to 153.8 by y=81.
HEAD_AXIS_ROW = 71
HEAD_LEFT_AT_71 = 156.0
HEAD_NASAL_AT_71 = 158.8
HEAD_LEAN = -0.5

#: §3.5's gullet — the near-black diagonal down the front of C's neck.
#: Measured dark cells: (161, 74), (162, 76), (162, 77), (163, 78), (164, 78),
#: (165, 80), (166, 81), (167, 81) — nine rows, leaning about 0.7 px per row.
GULLET_FROM = (161, 73)
GULLET_ROWS = 10
GULLET_LEAN = 0.7

#: Where each leg becomes separable from the mass above it, measured. It is
#: NOT one line: the two behind the hanging heads only appear at y=93, the
#: forelegs at 90, and the hind pair leaves the underline at 88. §9.7 —
#: evenly spaced legs on a single baseline read as a fence, and that applies
#: to the top of the leg as much as to the bottom.
LEG_TOP = (93, 93, 93, 90, 90, 88, 90, 92, 88)

#: Errata 35d. `graze` is 0 for a head down and 1 for a head raised and
#: chewing, PER HORSE, and the two are out of phase because two animals
#: lifting together is a pantomime horse. It applies to B and A: they are
#: exactly level with each other (§4), so a lift on one is legible, while C
#: is 13 px higher already and lifting it would put the group above the
#: coach roof.
GRAZE_LIFT = 3

#: The region rect, which is where the stipple fields are generated. The
#: content is smaller than this — §0: the animals are x 153-221, y 69-104,
#: 46% of the rect — but the fields are addressed by absolute coordinate so
#: that moving a shape one pixel does not reshuffle its texture.
RECT = (142, 54, 92, 58)


# ---------------------------------------------------------------------------
# The hide surface
# ---------------------------------------------------------------------------


class _Hide:
    """The stipple, the value ladder, and the one call that joins them.

    Two independent noise fields, both generated once per compose from named
    streams so that adding a leg cannot move the texture of the barrel:

      `runs`  — Markov fields of booleans choosing WHICH FAMILY a pixel takes
                at its rung. Each flip probability is the reciprocal of the
                mean run length §7 measured for that surface.
      `fine`  — an uncorrelated uniform field choosing WHICH OF TWO ADJACENT
                RUNGS a fractional luminance lands on. Uncorrelated on
                purpose: the value gradient must not acquire the run
                structure of the family stipple, or the two would beat
                against each other and produce exactly the fabric §9.10
                warns about.
    """

    def __init__(self, ctx: layout.Ctx) -> None:
        self.ctx = ctx
        self.tones = tuple(
            (ctx.ink(warm, warm_step), ctx.ink(cool, cool_step))
            for (warm, warm_step), (cool, cool_step) in HIDE_TONES)
        self.runs = {
            "hide": self._markov("team hide stipple", RUN_HIDE),
            "mane": self._markov("team mane stipple", RUN_MANE),
            "leg": self._markov("team leg stipple", RUN_LEG),
        }
        self.fine = self._uniform("team hide rung")
        self.wobble = self._levels("team hide wobble", RUN_HIDE)

    def _markov(self, name: str, flip: float) -> dict[tuple[int, int], bool]:
        rng = self.ctx.stream(name)
        x0, y0, width, height = RECT
        field: dict[tuple[int, int], bool] = {}
        for y in range(y0, y0 + height):
            state = rng.random() < 0.5
            for x in range(x0, x0 + width):
                if rng.random() < flip:
                    state = not state
                field[(x, y)] = state
        return field

    def _levels(self, name: str, flip: float) -> dict[tuple[int, int], float]:
        """A −1…+1 field with the same run statistic as the family stipple.

        The value wobble has to CLUSTER. Drawn from an uncorrelated field it
        is salt and pepper, which at 320x144 reads as film grain rather than
        as hide; drawn from a chain with the same 1.65 px mean run as the
        colour stipple it reads as the broken, patchy surface the reference
        actually has — p10 to p90 across the far animals spans L 8 to 45, and
        no amount of a single flat value gets there.
        """
        rng = self.ctx.stream(name)
        x0, y0, width, height = RECT
        field: dict[tuple[int, int], float] = {}
        for y in range(y0, y0 + height):
            level = rng.choice((-1.0, 0.0, 1.0))
            for x in range(x0, x0 + width):
                if rng.random() < flip:
                    level = rng.choice((-1.0, -0.5, 0.0, 0.5, 1.0))
                field[(x, y)] = level
        return field

    def _uniform(self, name: str) -> dict[tuple[int, int], float]:
        rng = self.ctx.stream(name)
        x0, y0, width, height = RECT
        return {(x, y): rng.random()
                for y in range(y0, y0 + height)
                for x in range(x0, x0 + width)}

    def index(self, x: int, y: int, luminance: float, grain: str = "hide") -> int:
        """The palette index for a hide pixel at a target luminance.

        `grain="flat"` turns the rung dither off. §7 names exactly four
        places where the edges are hard and the fill takes no dither at all —
        the crest, the back rim, the underline and chest shadow, and the
        tail — and those four are the only reason the rest reads as texture
        rather than as noise.
        """
        if grain != "flat":
            # Only the four hard-edged masses may spend `void`. See
            # STIPPLE_FLOOR: a stippled plane that reaches index 0 puts black
            # specks through hide, and the reference's black is pooled.
            luminance = max(STIPPLE_FLOOR, luminance)
        rung = 0
        while rung < len(TONE_LUMINANCE) - 2 and TONE_LUMINANCE[rung + 1] < luminance:
            rung += 1
        low, high = TONE_LUMINANCE[rung], TONE_LUMINANCE[rung + 1]
        blend = 0.0 if high <= low else (luminance - low) / (high - low)
        blend = max(0.0, min(1.0, blend))
        if grain == "flat":
            rung += 1 if blend > 0.5 else 0
        elif self.fine.get((x, y), 0.5) < blend:
            rung += 1
        warm, cool = self.tones[rung]
        field = self.runs.get(grain, self.runs["hide"])
        return warm if field.get((x, y), False) else cool

    def grain(self, x: int, y: int) -> float:
        """A signed −0.5…+0.5 wobble, for planes that carry their own noise.

        The far animals are the case this exists for. §5 gives their hide a
        median of 17.9, but the plane measures L 6-33 across it: at one value
        it stops being an animal and becomes a hole cut in the picture.
        """
        return self.wobble.get((x, y), 0.0) * 0.5

    def put(self, canvas: IndexedCanvas, x: int, y: int, luminance: float,
            grain: str = "hide") -> None:
        canvas.put(x, y, self.index(x, y, luminance, grain))

    def column(self, canvas: IndexedCanvas, x: int, top: int, bottom: int,
               at_top: float, at_bottom: float, grain: str = "hide",
               jitter: float = 0.0) -> None:
        """A column of hide with the light falling down it.

        §5.3: within A's barrel value falls monotonically top to bottom and
        does NOT vary left to right — 42, 34, 30, 27.5 down the rows, L 25-37
        across all twenty-four columns. Light comes from above, so every
        plane in this region is modelled top-to-bottom and nothing at all is
        modelled side-to-side.
        """
        if bottom < top:
            return
        span = max(1, bottom - top)
        for y in range(top, bottom + 1):
            # `jitter` is the hide's own broken surface, and without it the
            # stipple is invisible: the two families are chosen AT MATCHED
            # LUMINANCE, so alternating them alone moves hue and nothing
            # else. §7 measures 68-80% single-pixel runs after quantising to
            # eight VALUE bands, which is a statement about value.
            self.put(canvas, x, y,
                     at_top + (at_bottom - at_top) * (y - top) / span
                     + self.grain(x, y) * jitter, grain)


# ---------------------------------------------------------------------------


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    if not ctx.with_coach:
        # coach.md §8: the team is part of the removable layer. Nothing here
        # survives the coach's departure, and the shipping background is the
        # departed composition (errata 31d).
        return
    hide = _Hide(ctx)
    # THE SHADOW GOES DOWN BEFORE THE ANIMALS, not after. It is the ground
    # they stand on, and stamped last it darkened the nine feet standing in
    # it as well — measured on the bar the legs run L 30-48 at y 94-99 while
    # the ground between them runs 20-28, so a pass that takes both down two
    # steps deletes the only contrast the legs have left down there.
    _cast_shadow(canvas, ctx)
    with ctx.track(canvas, "the team"):
        _far_horse(canvas, ctx, hide)
        _near_horse(canvas, ctx, hide)
        _heads(canvas, ctx, hide)
        _legs(canvas, ctx, hide)
        _tack(canvas, ctx, hide)
        _sparks(canvas, ctx)


# ---------------------------------------------------------------------------
# Geometry shared by the three animals
# ---------------------------------------------------------------------------


def _topline(x: int) -> int:
    """The top row of the mass at a column. TWO toplines, 5 px apart.

    §5.2 is the reason the number steps at x=194 rather than sliding: C's
    back at y 70 is a black cut-out against the sky and A's back at y 75 is a
    bright cool rim, and the eye finds two withers because there are two
    edges at two heights, not one edge that bends.
    """
    if x >= MASS_STEP:
        return layout.HORSE_A_TOPLINE_Y
    if x < TOPLINE_FROM:
        return CREST_TOP
    return TOPLINE[min(len(TOPLINE) - 1, x - TOPLINE_FROM)]


def _belly(x: int) -> int:
    """The last row of the mass at a column.

    Six sections, all from §3, and the steps between them are the anatomy:
    the two lowered heads hang past y=93 while the chest beside them stops at
    91, the barrel's underline is straight at 86-88, and the croup is cut off
    at 85 by the tail. A single belly line across the whole mass is what
    turns three animals into one dark skirt.

    The first step is the important one. C's throat stops at y=76 — the five
    columns behind its jaw are BACKGROUND all the way down to where B's head
    starts, and that column of night is what §3.3's wedge opens into. Carry
    the mass down through it and the three heads become one curtain.
    """
    if x <= 160:
        # C's throat and chest, which run all the way down BEHIND the middle
        # horse's head. Measured, x=160 carries L 11-43 from y 84 to 93; cut
        # it off at the rail and the wedge stops being a hole in an animal
        # and becomes a two-pixel channel of night straight through the team.
        return 92
    if x <= 164:
        return 81               # the wedge is carved out of these five rows
    if x <= 180:
        return 81               # the two hanging heads take over at y=82
    if x <= 188:
        # The chest and the elbow. This is the ONE place §9.11 allows a
        # curve: the underline is straight everywhere else and thickens into
        # the chest mass only at the front end.
        return 89 + (x - 180) // 3
    if x <= 193:
        return 88
    if x <= 217:
        # §4.1: barrel depth 11 against a leg of 16, and that ratio IS the
        # horse. The back is at y=75 so the hide has to stop at 86; carry it
        # to 88 and the depths come out 13 and 13, which is §9.1's mastiff.
        return 86
    return 85                   # flank and croup


def _head_top(column: int, width: int, height: int) -> int:
    """Rows below the head's own top row that this column starts at.

    §4: the head axis stays within 15° of vertical and the poll is at the
    back. So the brow climbs from the muzzle end to the poll end along a
    power curve — a straight ramp here gives a wedge, and a wedge is a beak.
    """
    position = column / max(1, width - 1)
    return int(round((height - 2) * (1.0 - position) ** HEAD_BROW_POWER))


def _head_bottom(column: int, width: int) -> int:
    """Rows above the head's last row that this column stops at.

    A muzzle is NARROW. The chin is the lowest point of the animal, it sits
    about a third of the way back along the head, the nose falls away in
    front of it and the jaw and throat climb steeply behind. Drawn flat this
    is a boot; drawn symmetrically it is a hoof.
    """
    position = column / max(1, width - 1)
    if position < HEAD_CHIN:
        return int(round(HEAD_MUZZLE_LIFT
                         * ((HEAD_CHIN - position) / HEAD_CHIN) ** 1.4))
    return int(round(HEAD_THROAT_LIFT
                     * ((position - HEAD_CHIN) / (1.0 - HEAD_CHIN)) ** 1.4))


def _face_light(column: int, width: int, face: float, poll: float) -> float:
    """The luminance across a lowered head, front to back.

    THE HEADS ARE LIT ACROSS, NOT DOWN, and it is the one place in this
    region where that is true. Measured column means on the bar: C runs
    39, 33, 24, 25, 23, 24, 17 from muzzle to poll and A runs 15, 30, 50, 35,
    40, 35, 30, 22, 18, 16 — a bright nasal plane a third of the way back,
    with a one-pixel dark rim in front of it and the whole poll end falling
    away into the mane. Model it as a top-down fall and the head becomes a
    brick with a light top.
    """
    position = column / max(1, width - 1)
    plane = poll + (face - poll) * (1.0 - position) ** 0.8
    if column == 0 and width > 7:
        # The leading rim. On the two near heads the outer edge of the nose
        # turns away from the sky before the face does.
        return poll + (plane - poll) * 0.4
    return plane


def _in_jaw_wedge(x: int, y: int) -> bool:
    """§3.3. Six cool pixels that are drawn by not being drawn."""
    row = y - JAW_WEDGE_TOP
    if not 0 <= row < len(JAW_WEDGE):
        return False
    left, right = JAW_WEDGE[row]
    return left <= x <= right


def _rim_lit(x: int) -> bool:
    """§5.2's cool rim, and the three places it dips.

    Measured on the bar at y=75: the run is bright except at x 203-204,
    x 207 and x 215-217, where the back turns under the harness saddle and
    over the point of the hip and loses a step.
    """
    return not (203 <= x <= 204 or x == 207 or 215 <= x <= 217)


def _strap_x(y: int) -> float:
    """The trace strap's centre column at a row.

    Measured: dark at x 204-205 on y 76, x 205-206 on y 77, and x 206-209
    from y 78 to y 85 — a strap two pixels wide leaning about half a pixel
    per row toward the tail. It is the only vertical in the barrel and it is
    what makes the near horse read as harnessed rather than as a shape.
    """
    return STRAP_TOP + STRAP_LEAN * (y - 76)


def _in_hole(x: int, y: int) -> bool:
    """§3.20. True inside one of the six cool background gaps between the legs.

    Nothing this region draws may enter one. They are the difference between
    nine legs and a skirt, and they are the reference's, not an omission.
    """
    return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, x1, y0, y1 in HOLES)


def _mane_crest(x: float) -> float:
    """The 28° axis the standing mane sits on, poll to withers (§3.12)."""
    x0, y0 = MANE_POLL
    x1, y1 = MANE_WITHERS
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


# ---------------------------------------------------------------------------
# C — the far horse. Drawn first, entirely in shadow.
# ---------------------------------------------------------------------------


def _far_horse(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.1-5. Head, ear, crest, and the neck and back behind everything.

    Everything here is under L 20 — §5 measures C's neck and back at a median
    of 17.9, DARKER than the sky it sits against, which is the whole reason
    §9.5 exists: the animal is not separated from the hill by value, and
    darkening it further only merges it with the chest shadow.
    """
    black = ctx.ink("horse_black")

    # The back and neck. ONE continuous silhouette from x 160 to x 193 with
    # no seam anywhere across the top of it (§9.3) — C's back and B's back
    # merge, deliberately, and a line drawn between them produces two flat
    # paper cut-outs.
    # THE TOP TWO ROWS ARE THE PICTURE'S HARDEST EDGE. §5.2 measures C's back
    # at L 7.5 against a sky of 34 — a −26 step, a black cut-out — and the
    # hide four rows below it at 17.9, which is DARKER THAN THE SKY it sits
    # against. So the edge is a wall and everything under it is one quiet
    # value; there is no modelling in the far animal at all.
    for x in range(MASS_LEFT, MASS_STEP):
        top = _topline(x)
        bottom = _belly(x)
        for y in range(top, bottom + 1):
            if _in_jaw_wedge(x, y):
                continue
            depth = y - top
            if x <= CREST_RIGHT and depth < 3:
                # The wall, and IT IS TWELVE PIXELS LONG, not thirty-four.
                # §3.4 puts the near-black bar at x 160-171 and §7 lists it as
                # one of the four hard edges in the region, so it takes no
                # grain: a single stray light pixel along a −26 L step is the
                # whole step gone. But carried on to x=193 the same wall drew
                # a ruled black line the width of the team, and at the squint
                # the animals stopped being animals and became a roof.
                hide.put(canvas, x, y, 2.0 + 4.0 * depth, "flat")
            elif depth < 2:
                # Right of the crest the top edge is a SOFT dark, not a wall.
                # Measured across x 172-193: y+0 runs L 8-20 and y+1 runs
                # L 4-12, mottled, with no two adjacent columns alike. This is
                # where B's back merges into C's with no seam (§9.3) and the
                # merge is only invisible if the edge is broken.
                hide.put(canvas, x, y,
                         11.0 - 3.0 * depth + hide.grain(x, y) * 10.0)
            else:
                # Mottled, not flat, AND THE MOTTLE IS WIDE. Measured, this
                # whole plane runs L 1-33 about a median of 17.9 — the same
                # busy 1.5 px surface as the lit hide, just at a sixth of the
                # light, and it reaches umber 0 and void 0 in single pixels
                # all through. Held inside ±7 of the median it stops being
                # hide and becomes a flat brown card, which is exactly the
                # complaint that the animals do not read as three.
                hide.put(canvas, x, y,
                         min(20.0, 5.0 + 4.0 * depth) + hide.grain(x, y) * 26.0)

    # §3.4. A 12 x 3 near-black bar at the crest, x 160-171. `void@0` 31% +
    # `umber@0` 29%, and §7 says it takes no dither into the sky at all.
    cx, cy, cwidth, cheight = layout.HORSE_C_CREST
    for x in range(cx, cx + cwidth):
        canvas.vline(x, _topline(x), cheight - 2, black)

    # §3.2. 7 x 13, hanging almost vertically, the axis leaning ~15° forward.
    # The muzzle bottom row is y=81, which is EXACTLY the top rail of the
    # hitching fence (§8): they meet, with no gap and no overlap, and if the
    # rail moves this head moves with it. C's is the only head with a top
    # edge of its own — B's and A's merge upward into the mass.
    # THE HEAD IS LIT ALONG ITS OWN AXIS, NOT ACROSS THE COLUMNS. This is the
    # measurement that was being drawn wrong, and it is why the head read as a
    # lump of neck. The bright plane does not stay in one column: it walks
    # down and to the LEFT with the head's lean, half a pixel a row —
    #
    #   y 71  x 158-159 at L 26-32     y 77  x 155-156 at L 37-41
    #   y 74  x 157    at L 37         y 80  x 153-154 at L 37-40
    #
    # — with a one-pixel near-black rim (L 1-8) on its outside the whole way
    # down and the cheek falling off to L 13-18 behind it. That is a lit
    # NASAL STRIPE two pixels wide on a 13-px head: model it column by column
    # and every row gets the same value, which is a post with a light side.
    hx, hy, hwidth, hheight = C_HEAD
    for y in range(hy + 1, hy + hheight):
        row = y - HEAD_AXIS_ROW
        left = int(round(HEAD_LEFT_AT_71 + HEAD_LEAN * row))
        nose = HEAD_NASAL_AT_71 + HEAD_LEAN * row
        for x in range(max(hx, left), hx + hwidth):
            if _in_jaw_wedge(x, y):
                continue
            offset = x - nose
            if offset < -1.5:
                level = 5.0                 # the outside rim, against the sky
            elif offset <= 0.5:
                level = 39.0                # the lit nasal plane
            elif offset <= 1.5:
                level = 24.0
            else:
                level = 14.0                # the cheek, turning into the jaw
            hide.put(canvas, x, y, level + hide.grain(x, y) * 16.0)

    # §3.5's gullet. A dark diagonal from (161, 73) down to (168, 82),
    # L 1-11 against a neck at 18-26 either side: the front edge of C's neck,
    # and the only thing that cuts its head off the mass behind it. Without
    # it the head and the neck are one value and the head is a lump — which
    # is exactly the reading the region has been failing.
    for step in range(GULLET_ROWS):
        x = GULLET_FROM[0] + round(step * GULLET_LEAN)
        y = GULLET_FROM[1] + step
        if _in_jaw_wedge(x, y):
            continue
        hide.put(canvas, x, y, 5.0, "flat")
        hide.put(canvas, x + 1, y, 11.0)

    # §3.1. Two pixels, and the top of the whole group. §7: without the ear,
    # C's head is a post — AND A BLACK EAR IS NOT AN EAR. Measured at
    # (157, 69) and (158, 69) the two pixels are L 26 and L 41 at warmth +29
    # and +35: they are LIT, standing against a sky at L 34 and cold. Drawn in
    # `void` they joined the crest bar behind them and the silhouette lost its
    # only bump.
    ex, ey = layout.HORSE_C_EAR
    hide.put(canvas, ex, ey, 27.0, "flat")
    hide.put(canvas, ex + 1, ey, 41.0, "flat")
    hide.put(canvas, ex + 1, ey + 1, 14.0, "flat")


# ---------------------------------------------------------------------------
# A — the near horse. The only complete animal.
# ---------------------------------------------------------------------------


def _near_horse(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.10-18. Neck, mane, back, barrel, croup, tail, chest, underline."""
    black = ctx.ink("horse_black")

    # -- the neck, from the poll up to the withers -------------------------
    #
    # §4.5: the neck leaves the body AT THE WITHERS, at the top of the back,
    # and rises at 28°. Not from the chest. Below the crest line is the lit
    # shoulder plane; above it nothing of A exists — that is the far horse
    # showing over its neck.
    # It is A LIT WEDGE, and it is the single strongest horse-shape cue in
    # the region: one continuous bright diagonal from the poll to the top of
    # the back, WIDENING as it goes because a neck runs into a shoulder. Drawn
    # at the far animals' value it stops connecting the head to the body and
    # the near horse becomes a slab floating over a dark middle.
    for x in range(NECK_FROM, NECK_TO + 1):
        top = int(round(_mane_crest(x)))
        reach = (x - NECK_FROM) / max(1, NECK_TO - NECK_FROM)
        bottom = top + int(round(NECK_DEPTH_POLL
                                 + (NECK_DEPTH_SHOULDER - NECK_DEPTH_POLL) * reach))
        hide.column(canvas, x, top, min(bottom, _belly(x)), 44.0, 27.0, jitter=10.0)

    # §3.12. Six strokes across 19 px, each 1-2 px wide with a 1-2 px dark
    # trough beside it and a swing of 20-40 L. THE HIGHEST-CONTRAST TEXTURE
    # IN THE REGION, and §7 says do not comb them: the measured pitch varies
    # between 2 and 4 px and the peaks are unequal.
    # AND THE MANE IS A RIDGE BEFORE IT IS SIX STROKES. Measured, the two
    # rows immediately above the crest axis run L 30-58 for the whole length
    # from x=178 to the withers — a continuous lit band standing off the
    # neck, with the strokes as accents on top of it. Six isolated spikes on
    # a dark neck are a picket fence; the band is what makes them hair.
    for x in range(MANE_BAND_FROM, MANE_BAND_TO + 1):
        crest = int(round(_mane_crest(x)))
        # AND THE BAND CARRIES THE STROKES' RHYTHM, at half their amplitude.
        # Drawn as two flat rows at L 40-47 it was a painted stripe nineteen
        # pixels long — the flattest thing in the region, where the reference
        # measures the busiest: mean run 1.27 px, 80% single-pixel. Measured
        # along y=78, x 184-194 runs 8, 32, 28, 28, 68, 40, 48, 52, 32, 24, 44.
        # The troughs reach L 8. A band with no troughs in it is a stripe.
        near = min(abs(x - peak_x) for peak_x, _ in MANE_PEAKS)
        ridge = 56.0 if near == 0 else (19.0 if near == 1 else 40.0)
        # Three rows, not two. The measured mane box runs a p90 of 49.5 over
        # fifteen rows, which two rows of ridge and six two-pixel strokes
        # cannot reach: the reference's bright hair is spread from y=75 to
        # y=84 along the axis, not concentrated on one line of it.
        hide.put(canvas, x, crest, ridge - 14.0, "mane")
        hide.put(canvas, x, crest - 1, ridge, "mane")
        hide.put(canvas, x, crest - 2, ridge - 6.0, "mane")

    for index, (x, height) in enumerate(MANE_PEAKS):
        # Each stroke starts from its own root, a row either side of the
        # axis. Rooted on one line they comb into a picket fence, which is
        # the failure §7 names by refusing to let the pitch be even.
        crest = int(round(_mane_crest(x))) - 2 + (1 if index % 3 == 1 else 0)
        peak = 68.0 if index % 2 else 56.0
        for step in range(height):
            hide.put(canvas, x, crest - step, peak - 11.0 * step, "mane")
        # The trough is what makes the stroke a stroke. One column behind,
        # because the mane falls to the near side, and it goes to near-black:
        # §3.12 measures a swing of 20-40 L per stroke and a trough at L 20 on
        # a peak of 54 is half of one.
        for step in range(max(1, height - 2)):
            # L 17, not 11. Measured, the troughs between the strokes run
            # L 8-24 against peaks of 48-68; at 11 for three rows they became
            # a row of black teeth hanging off the crest, which is a comb
            # rather than hair.
            hide.put(canvas, x + 1, crest - step, 17.0, "mane")

    # -- the back, and the one row that carries the whole depth read -------
    #
    # §5.2: A's back at y=75 is L 41.9 against a sky of 27.7 — a BRIGHT COOL
    # RIM, warmth −7, sitting on hide at warmth +26. One row, 22 px, and §9.4
    # records that it looks like an error in the data. Draw it warm and the
    # near horse falls back into the far one.
    bx, by, _, _ = layout.HORSE_A_BACK
    rim = ctx.ink("horse_rim")
    for x in range(RIM_FROM, RIM_TO + 1):
        # One unbroken row (§7), but NOT one flat colour. Measured along y=75
        # the rim runs 45, 43, 43, 41, 44, 49, 51, 44, 26, 21, 48, 46, 29, 38,
        # 41, 49, 57, 51, 51, 51, 33, 38, 28, 44, 47, 49, 49 — three dips to
        # L 21-33 where the back turns under a strap or a hip, and a peak of
        # 57 over the loin. Drawn flat it is a ruled line and reads as the top
        # of a crate; the dips are where it becomes a back.
        canvas.put(x, by, rim if _rim_lit(x) else ctx.ink("horse_rim", -1))

    # -- the barrel --------------------------------------------------------
    #
    # §3.14 and §5.3: top-lit, L 40 at the top falling to L 26 by y 85, warmth
    # constant at +26 to +28.
    #
    # AND IT IS NOT FEATURELESS ACROSS. §5.3 says the barrel has no left-to-
    # right LIGHTING gradient and that is true — but it is not the same claim
    # as no structure, and modelled as a pure top-to-bottom fall the barrel
    # came out a flat plate twenty-four pixels wide, which at the squint is a
    # crate. Measured column means over y 76-86 run 31, 32, 28, 27, 33, 35,
    # 35, 33, 28, 25, 23, 31, 27, 30, 32, 32, 32, 25, 25, 26, 26, 24 across
    # x 196-217: a bright loin, a DARK STRAP two pixels wide leaning back from
    # (204, 76) to (209, 85), and a flank that loses five luminance into the
    # hip. Three objects, all of them harness or bone, none of them light.
    bxx, byy, bwidth, _ = layout.HORSE_A_BARREL
    for x in range(bxx, bxx + bwidth):
        bottom = _belly(x)
        for y in range(byy, bottom + 1):
            fall = (y - byy) / max(1, bottom - byy)
            level = 42.0 - 15.0 * fall
            if abs(x - _strap_x(y)) <= 1:
                level = 20.0                       # the trace strap
            elif x >= HIP_FROM:
                level -= 3.0 + 6.0 * fall          # the hip and the flank
            hide.put(canvas, x, y, level + hide.grain(x, y) * 9.0)

    # §3.15. The topline drops from y 76 to y 80 over 3 px and the croup is
    # the last of the animal; behind it is the coach's front boot.
    cx, cy, cwidth, cheight = layout.HORSE_A_CROUP
    for column in range(cwidth):
        x = cx + column
        top = cy + min(cheight - 2, column + column // 2)
        hide.column(canvas, x, top, _belly(x), 30.0, 18.0, jitter=9.0)

    # §3.18. THE DARKEST MASS IN THE REGION, Lmed 8.6, `umber@0` 31% +
    # `void@0` 20%, and the anchor that holds the front of the animal down.
    # §7: solid dark, no dither.
    # AND IT IS A MASS, NOT A BLOCK. Measured across x 181-188, y 84-91 the
    # values run 0 at the core out to 24 at the corners — 8, 8, 0, 0, 0, 4, 8,
    # 28 along y=85 and 24, 20, 32, 16, 8, 4, 8, 8 along y=84. Stamped as a
    # flat 8 x 8 rectangle of `void` it was the one hard-edged black square in
    # the frame, and at 8x it read as a hole punched in the picture rather
    # than as the shadow the front of the animal stands in.
    sx, sy, swidth, sheight = layout.HORSE_CHEST_SHADOW
    for x in range(sx, sx + swidth):
        for y in range(sy, sy + sheight):
            if _in_hole(x, y):
                continue
            near = 0.9 * abs(x - CHEST_CORE[0]) + 0.75 * abs(y - CHEST_CORE[1])
            hide.put(canvas, x, y,
                     min(22.0, 2.0 + 4.5 * max(0.0, near - 1.5))
                     + hide.grain(x, y) * 6.0, "flat")

    # §3.17. Straight, and ONE ROW. §9.11 — the curve happens only at the front
    # end, where it thickens into the chest mass; curving the middle produces a
    # pot-bellied pony. §7 lists it as one of the four hard edges: solid dark,
    # no dither, and it is what the whole barrel above it is weighed against.
    ux, uy, uwidth, _ = layout.HORSE_UNDERLINE
    for x in range(ux, ux + uwidth):
        # Measured along y=86, x 202-215: 16, 12, 8, 4, 8, 12, 12, 8, 4, 4, 8,
        # 12, 8, 20. Hard-edged, but not one index — a dead-level row of
        # `void` nineteen pixels long is a drawn line under a slab.
        hide.put(canvas, x, UNDERLINE_Y,
                 7.0 + hide.grain(x, UNDERLINE_Y) * 9.0, "flat")

    # AND THE ROWS BELOW IT ARE NOT MORE SHADOW. Measured at x 202-218, y 87
    # runs 8, 12, 20, 24, 32, 24, 12, 28, 20, 4, 0, 12, 28, 32, 24, 28, 28 —
    # a lit gaskin, a dark gap and a lit stifle, in that order right to left.
    # Filled solid these become an apron, the daylight between the fore and
    # hind legs closes, and holes 5 and 6 of §3.20 stop existing.
    for x in range(STIFLE[0], GASKIN[1] + 1):
        for y in range(UNDERLINE_Y + 1, 92):
            if _in_hole(x, y):
                continue
            if GASKIN[0] <= x <= GASKIN[1]:
                level = 27.0 - 1.6 * (y - UNDERLINE_Y)      # the gaskin, lit
            elif x <= STIFLE[1]:
                level = 22.0 - 1.4 * (y - UNDERLINE_Y)      # flank and stifle
            else:
                level = 4.0                                 # the gap between
            hide.put(canvas, x, y, level + hide.grain(x, y) * 8.0)

    # §3.16. THE ONLY TAIL. 1-2 px, near-black, 19 px long, ending 5 px above
    # the hoof line. §9.9: three horses, one visible tail, and that is
    # correct — the other two are behind bodies.
    tx, ty, twidth, theight = layout.HORSE_TAIL
    for y in range(ty, ty + theight):
        canvas.put(tx + 1, y, black)
        if y >= ty + 6:
            canvas.put(tx, y, ctx.ink("horse_hide_shadow"))


# ---------------------------------------------------------------------------
# The two heads that hang in front
# ---------------------------------------------------------------------------


def _heads(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """B's and A's heads: same posture as C's, dropped 13 px, +8 then +10 px.

    §4: B and A are EXACTLY LEVEL with each other and both sit 13 px below C.
    C is the odd one out, and that asymmetry is the reason the group looks
    like animals rather than like a repeating stamp.
    """
    for index, (x0, y0, width, height) in enumerate((B_HEAD, A_HEAD)):
        lift = ctx.graze[index] * GRAZE_LIFT if index < len(ctx.graze) else 0
        # A is in front and catches more light than B. §9.12's depth stagger
        # is carried by the bridle sparks; the hide follows it quietly.
        # Measured column means, muzzle to poll: B runs 41, 44, 61, 50, 31, 26,
        # 21, 8, 6 and A runs 15, 30, 50, 35, 40, 35, 30, 22, 18, 16 — a bright
        # nasal plane a third of the way back and a poll end that falls away
        # into near-black. Forty-five luminance across ten pixels; drawn at
        # half that swing both heads dissolve into the mass behind them.
        face, poll = (52.0, 12.0) if index else (44.0, 10.0)
        for column in range(width):
            x = x0 + column
            top = y0 - lift
            bottom = y0 - lift + height - 1 - _head_bottom(column, width)
            for y in range(top, bottom + 1):
                hide.put(canvas, x, y,
                         _face_light(column, width, face, poll)
                         - 7.0 * (y - top) / max(1, bottom - top)
                         + hide.grain(x, y) * 18.0)

    # §5. The strongest of the near-black seams, at x=184: averaged over
    # y 70-96 that column measures L 12.3 against 17-24 either side, and from
    # y 84 to y 94 it is a solid 1-px run of L 1-9. It is the gap between A's
    # foreleg and B behind it, and it is a SEAM rather than an outline — the
    # only place one animal's edge is allowed to cut another.
    for y in range(84, 95):
        hide.put(canvas, 184, y, 5.0, "flat")
    # The same device, weaker, between B's head and A's.
    for y in range(83, 92):
        hide.put(canvas, 171, y, 7.0, "flat")


# ---------------------------------------------------------------------------


def _legs(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.19. Nine contacts on TWO ground lines 5 px apart.

    §9.7: evenly spaced legs on a single baseline read as a fence. The five
    px of fall from back rank to front rank is this region's statement about
    where the ground plane is, and road.md's ruts run parallel to it.

    §7, exactly: 2-3 px of hide across, LIT ON THE LEADING (LEFT) EDGE with
    1 px of `umber@0` behind. Hooves are 3-4 px wide and 2-3 px tall and are
    NOT pure black — the near ones catch a little road bounce.

    And the six holes between them (§3.20) are as important as the legs. They
    are cool background at L 18-29, not shadow: §9.8, painting them warm and
    dark closes the silhouette and loses every leg. They exist here because
    nothing is drawn in them.
    """
    hoof = ctx.ink("horse_hide_shadow")
    bounce = ctx.ink("horse_hide_shadow", 5)
    for index, (left, right, ground) in enumerate(layout.HOOVES):
        cannon = left + CANNON_OFFSET[index]
        top = LEG_TOP[index]
        for column, luminance in enumerate(CANNON_PLANES):
            x = cannon + column
            for y in range(top, ground - 1):
                if _in_hole(x, y):
                    continue
                # The top two rows are still belly: a leg does not begin at an
                # edge, it emerges from the dark the barrel ends in, which is
                # why the reference's cannons only become separable around
                # y=92. Two rows, not three — measured, the lit column is
                # already at L 30+ one row under the belly, and a longer ramp
                # was spending the top third of every leg at chest-shadow
                # value, which is where nine legs became one dark skirt.
                emerge = min(1.0, (y - top) / 2.0)
                hide.put(canvas, x, y, 9.0 + (luminance - 9.0) * emerge
                         + hide.grain(x, y) * 7.0, "leg")
        # The hoof is wider than the cannon and its toe points FORWARD, which
        # is left: the ground contact reaches past the leg on the near side
        # and stops level with it behind. Two rows, and the front one takes a
        # little bounce off the road.
        for x in range(left, right + 1):
            canvas.put(x, ground - 1, hoof)
            canvas.put(x, ground, bounce if x < left + 2 else hoof)


# ---------------------------------------------------------------------------


def _tack(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.21-23. One straight row, one cool fleck, two hue lines.

    The pole is the flattest lit row in the barrel and THE ONLY STRAIGHT LINE
    INSIDE THE ANIMALS — it is what says "hitched to something" rather than
    "standing loose". In image A it is a timber bar with a brass ferrule; at
    320x144 it is one row and it must stay one row.
    """
    px, py, plength = layout.POLE_ROW
    for x in range(px, px + plength):
        # §3.21 measures it as the flattest lit row in the barrel — mean
        # absolute step 5.3 L against 6.7-8.9 for every hide row above it.
        # FLATTEST, not flat: a dead-level row of one index reads as a shelf
        # edge, and a shelf edge under a slab is a table.
        hide.put(canvas, x, py, 33.0 + hide.grain(x, py) * 7.0)
    # §3.21: directly beneath it is the near-black underline. One dark row is
    # what lifts a flat lit row off the hide it crosses.
    for x in range(px, px + plength):
        hide.put(canvas, x, py + 1, 12.0)

    # §3.22. The only cool object standing ABOVE the near horse's back.
    tx, ty, twidth, theight = layout.TERRET
    # Four pixels, and four is the number: it is the only cool object
    # standing above the near horse's back and a solid pale block up there
    # out-reads the back rim it is supposed to sit on.
    canvas.rect(tx, ty, twidth, theight - 2, ctx.ink("horse_rim", 1))
    canvas.put(tx, ty + theight - 2, ctx.ink("horse_rim"))
    canvas.put(tx + 1, ty + theight - 1, ctx.ink("horse_rim", -1))
    # And the hame it stands on, running down the shoulder to the pole.
    # Measured, x=198 sits about four L under the columns either side of it.
    for y in range(ty + theight, layout.POLE_ROW[1]):
        hide.put(canvas, HAME_X, y, 24.0)

    # §3.23 and §9.6: the traces measure L 25.9 against a sky of L 23.6 — a
    # difference of nothing — but warmth +10.8 against −6.2. THEY ARE A HUE
    # LINE, NOT A VALUE LINE, for their whole run, and they only go bright in
    # the last 3 px at the driver's hands. A bright rein across the sky
    # becomes the most legible object in the frame and steals the read from
    # the coach lamp.
    thread = ctx.ink("horse_hide_shadow", 3)
    for (x0, y0), (x1, y1) in (layout.TRACE_1, layout.TRACE_2):
        canvas.line(x0, y0, x1, y1, thread)


def _sparks(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The four bridle marks, which are unequal on purpose.

    §9.12: L 85 on the near horse, L 61 on the middle, NOTHING AT ALL on the
    far one. Four bright marks at two different heights are what make three
    heads count as three; giving all three heads a spark flattens the depth
    stagger, and removing them merges three heads into one.
    """
    lift_b = ctx.graze[0] * GRAZE_LIFT if ctx.graze else 0
    lift_a = ctx.graze[1] * GRAZE_LIFT if len(ctx.graze) > 1 else 0

    # THEY ARE CHEEKPIECES, NOT DOTS. Measured, both marks are short straps
    # running down and FORWARD across the jaw — B's from (166, 84) to
    # (164, 88), A's from (175, 82) to (173, 88) — brightening as they
    # descend to the bit. Stamped as rectangles they read as dominoes on a
    # black field; drawn as the two-pixel diagonals they are, they read as
    # buckled leather, which is the whole point of §1's "harnessed, not
    # loose".
    dim = ctx.ink("horse_mane")
    bx, by, bwidth, bheight = layout.HORSE_B_BRIDLE
    for row in range(5):
        x = bx + 2 - row // 2
        canvas.put(x, by - 1 + row - lift_b, dim if row < 2 else ctx.ink("horse_mane", 1))
        if row:
            canvas.put(x - 1, by - 1 + row - lift_b, dim)
    canvas.put(163, 92 - lift_b, dim)

    # §3.11. Peak L 85 at (173-174, 86-88), `ochre@8`. THE BRIGHTEST THING IN
    # THE TEAM, and the brightest thing in the rect that is not a town light
    # or a coach lamp — the only `ochre@8` anywhere in the region. Three
    # pixels, at the bottom of a strap that is otherwise one step dimmer than
    # itself.
    ax, ay, _, aheight = layout.HORSE_A_BRIDLE
    for row in range(aheight):
        x = ax + 3 - row // 3
        canvas.put(x, ay + row - lift_a, ctx.ink("horse_mane", 1))
        canvas.put(x - 1, ay + row - lift_a, dim)
    canvas.rect(173, 86 - lift_a, 2, 3, ctx.ink("bridle_spark"))
    canvas.put(175, 87 - lift_a, ctx.ink("horse_mane", 1))
    canvas.put(172, 92 - lift_a, ctx.ink("horse_mane"))
    canvas.put(176, 92 - lift_a, ctx.ink("horse_mane", -1))


# ---------------------------------------------------------------------------


def _cast_shadow(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§3.24. ONE pooled shadow. There are no per-leg shadows.

    L median 24 against open road at 54 — a 55% darkening — and it is THE
    ROAD'S OWN FAMILY DARKENED, not a grey wash, which is why it steps the
    index that is already there rather than painting one. Its front edge sits
    2-4 px in front of the deepest hoof and is broken and stippled, never a
    line.

    It skips the reserved bands. layout §5: the road's standing water is
    `accent_indigo` 2-4, and every pass that moves a colour has to consult
    keep(), because a reserved index stepped down its ramp leaves the band
    and the band is then reserved for pixels that are no longer in it.
    """
    x0, y0, width, height = layout.TEAM_SHADOW
    rng = ctx.stream("team shadow edge")
    # AND IT STARTS UNDER THE BELLY, not at the hooves. layout.TEAM_SHADOW
    # now begins at y=90 -- the anchor was at 99 and this module drew from
    # 90, and the contract has been reconciled to the drawing. Measured on
    # the bar, the ground between the legs at x 196-215 runs L 20-31 from
    # y=90 all the way down. It is one pooled shadow (§3.24 — there are
    # still no per-leg shadows) and nine legs are told apart against it.
    for y in range(SHADOW_TOP, y0 + height):
        # The pool is deepest under the belly and thins toward its front
        # edge; the last two rows break up into stipple.
        #
        # TWO STEPS, NOT THREE, AND THE REASON IS THE PLANE UNDERNEATH. This
        # was three because it was drawn against layout.road_luminance's old
        # model, which put the unlit road at 47-50 in these columns; the
        # model has since been re-fitted to the bar and puts them at 23, so
        # three steps of darkening now lands the ground between the legs at
        # 18.6 against a measured 28.7. Same shadow, same measurement, on a
        # plane that moved 24 luminance underneath it.
        depth = 2 if y < y0 + height - 3 else 1
        for x in range(x0, x0 + width):
            if layout.keep_at(canvas, x, y):
                continue
            if y >= y0 + height - 2 and rng.random() < 0.45:
                continue
            ctx.shield(x, y)
            canvas.put(x, y, ctx.palette.darken(canvas.get(x, y), depth))
