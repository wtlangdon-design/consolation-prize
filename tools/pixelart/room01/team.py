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
MANE_PEAKS = ((181, 2), (183, 3), (186, 3), (188, 2), (190, 3), (194, 2))

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
HIDE_TONES = (
    (("horse_hide_shadow", 0), ("horse_black", 0)),       # L 8.9  / 0.0
    (("horse_hide_shadow", 1), ("horse_hide_mid", -3)),   # L 13.7 / 12.6
    (("horse_hide_shadow", 2), ("horse_hide_mid", -2)),   # L 17.7 / 17.4
    (("horse_hide_shadow", 3), ("horse_hide_mid", -1)),   # L 25.1 / 22.3
    (("horse_hide", -1), ("horse_hide_mid", 0)),          # L 26.8 / 26.3
    (("horse_hide", 0), ("horse_hide_mid", 1)),           # L 35.6 / 33.9
    (("horse_hide", 1), ("horse_hide_mid", 3)),           # L 43.3 / 42.7
    (("horse_hide", 2), ("horse_hide_mid", 5)),           # L 52.6 / 54.9
    (("horse_hide", 3), ("horse_hide_mid", 6)),           # L 61.1 / 59.7
)
TONE_LUMINANCE = (4.5, 13.2, 17.6, 23.7, 26.6, 34.8, 43.0, 53.8, 60.4)

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
CANNON_PLANES = (40.0, 30.0, 7.0)

#: The shadow the whole barrel sits in, below the underline proper. Measured
#: x 197-215, y 86-91.
UNDERBELLY_LEFT, UNDERBELLY_RIGHT, UNDERBELLY_BOTTOM = 197, 215, 91

#: The hame strap, measured: one column about four L under its neighbours.
HAME_X = 198

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
    with ctx.track(canvas, "the team"):
        _far_horse(canvas, ctx, hide)
        _near_horse(canvas, ctx, hide)
        _heads(canvas, ctx, hide)
        _legs(canvas, ctx, hide)
        _tack(canvas, ctx, hide)
        _sparks(canvas, ctx)
    _cast_shadow(canvas, ctx)


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
            if depth < 3:
                # The wall. Three rows of it, and NO grain: §7 lists the
                # crest as one of the four hard edges in the region, and a
                # single stray light pixel along a −26 L step is the whole
                # step gone.
                hide.put(canvas, x, y, 2.0 + 4.0 * depth, "flat")
            else:
                # Mottled, not flat. Measured, this whole plane runs L 6-33
                # about a median of 17.9 — the same busy 1.5 px surface as
                # the lit hide, just at a sixth of the light. Drawn at one
                # value it becomes a hole in the picture.
                hide.put(canvas, x, y,
                         min(19.5, 6.0 + 4.0 * depth) + hide.grain(x, y) * 14.0)

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
    hx, hy, hwidth, hheight = C_HEAD
    for column in range(hwidth):
        x = hx + column
        top = hy + _head_top(column, hwidth, hheight)
        # Measured: the jaw is square to the rail for six columns and drops
        # away over the seventh, where the throat turns back into the neck.
        bottom = hy + hheight - 1 - (2 if column == hwidth - 1 else 0)
        for y in range(top, bottom + 1):
            if _in_jaw_wedge(x, y):
                continue
            # Lit across, not down: measured column means run 39, 33, 24, 25,
            # 23, 24, 17 from the muzzle back to the poll. One dark row along
            # the crest of the face keeps the head off the neck behind it.
            hide.put(canvas, x, y,
                     6.0 if y < top + 1 else
                     _face_light(column, hwidth, 42.0, 15.0)
                     - 6.0 * (y - top) / max(1, bottom - top)
                     + hide.grain(x, y) * 10.0)

    # §3.1. Two pixels, and the top of the whole group. §7: without the ear,
    # C's head is a post.
    ex, ey = layout.HORSE_C_EAR
    canvas.put(ex, ey, black)
    canvas.put(ex + 1, ey, black)
    canvas.put(ex + 1, ey + 1, black)


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
        hide.put(canvas, x, crest - 1, 47.0, "mane")
        hide.put(canvas, x, crest - 2, 40.0, "mane")

    for index, (x, height) in enumerate(MANE_PEAKS):
        # Each stroke starts from its own root, a row either side of the
        # axis. Rooted on one line they comb into a picket fence, which is
        # the failure §7 names by refusing to let the pitch be even.
        crest = int(round(_mane_crest(x))) - 2 + (1 if index % 3 == 1 else 0)
        peak = 62.0 if index % 2 else 54.0
        for step in range(height):
            hide.put(canvas, x, crest - step, peak - 9.0 * step, "mane")
        # The trough is what makes the stroke a stroke. One column behind,
        # because the mane falls to the near side.
        for step in range(max(1, height - 1)):
            hide.put(canvas, x + 1, crest - step, 20.0, "mane")

    # -- the back, and the one row that carries the whole depth read -------
    #
    # §5.2: A's back at y=75 is L 41.9 against a sky of 27.7 — a BRIGHT COOL
    # RIM, warmth −7, sitting on hide at warmth +26. One row, 22 px, and §9.4
    # records that it looks like an error in the data. Draw it warm and the
    # near horse falls back into the far one.
    bx, by, bwidth, _ = layout.HORSE_A_BACK
    rim = ctx.ink("horse_rim")
    for x in range(bx + 3, bx + bwidth):
        # One unbroken row (§7), but not one flat colour: the far end of the
        # back turns very slightly away and loses a step.
        canvas.put(x, by, rim if x < bx + bwidth - 4 else ctx.ink("horse_rim", -1))

    # -- the barrel --------------------------------------------------------
    #
    # §3.14 and §5.3: L 34 at the top falling to L 27.5 by y 83, warmth
    # constant at +26 to +28, and NO left-to-right gradient at all across
    # twenty-four columns. Top-lit, modelled only top to bottom.
    bxx, byy, bwidth, _ = layout.HORSE_A_BARREL
    for x in range(bxx, bxx + bwidth):
        hide.column(canvas, x, byy, _belly(x), 38.0, 27.0, jitter=9.0)

    # §3.15. The topline drops from y 76 to y 80 over 3 px and the croup is
    # the last of the animal; behind it is the coach's front boot.
    cx, cy, cwidth, cheight = layout.HORSE_A_CROUP
    for column in range(cwidth):
        x = cx + column
        top = cy + min(cheight - 2, column + column // 2)
        hide.column(canvas, x, top, _belly(x), 30.0, 20.0, jitter=9.0)

    # §3.18. THE DARKEST MASS IN THE REGION, Lmed 8.6, `umber@0` 31% +
    # `void@0` 20%, and the anchor that holds the front of the animal down.
    # §7: solid dark, no dither.
    sx, sy, swidth, sheight = layout.HORSE_CHEST_SHADOW
    for x in range(sx, sx + swidth):
        for y in range(sy, sy + sheight):
            hide.put(canvas, x, y, 6.0, "flat")

    # §3.17. Straight. §9.11 — the curve happens only at the front end, where
    # it thickens into the chest mass; curving the middle produces a
    # pot-bellied pony.
    ux, uy, uwidth, uheight = layout.HORSE_UNDERLINE
    for x in range(ux, ux + uwidth):
        for y in range(uy, uy + uheight):
            hide.put(canvas, x, y, 8.0 if y < uy + 2 else 15.0, "flat")

    # AND THE DARK DOES NOT STOP AT THE UNDERLINE. Measured across x 202-213,
    # rows 86 to 91 run L 1-33 about a mean of 16 — six rows of shadow under
    # the barrel, not three. Left open, the space between the fore and hind
    # legs becomes a window through the animal and the whole near horse reads
    # as a table: a slab on four sticks. The legs are drawn after this and
    # come up out of it, which is why they have no top edge either.
    for x in range(UNDERBELLY_LEFT, UNDERBELLY_RIGHT + 1):
        for y in range(uy, UNDERBELLY_BOTTOM + 1):
            hide.put(canvas, x, y,
                     7.0 + 2.4 * (y - uy) + hide.grain(x, y) * 11.0)

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
        face, poll = (40.0, 13.0) if index else (32.0, 12.0)
        for column in range(width):
            x = x0 + column
            top = y0 - lift
            bottom = y0 - lift + height - 1 - _head_bottom(column, width)
            for y in range(top, bottom + 1):
                hide.put(canvas, x, y,
                         _face_light(column, width, face, poll)
                         - 6.0 * (y - top) / max(1, bottom - top)
                         + hide.grain(x, y) * 13.0)

    # §5. The strongest of the near-black seams, at x=184: averaged over
    # y 70-96 that column measures L 12.3 against 17-24 either side, and from
    # y 84 to y 94 it is a solid 1-px run of L 1-9. It is the gap between A's
    # foreleg and B behind it, and it is a SEAM rather than an outline — the
    # only place one animal's edge is allowed to cut another.
    for y in range(84, 95):
        hide.put(canvas, 184, y, 5.0)
    # The same device, weaker, between B's head and A's.
    for y in range(83, 92):
        hide.put(canvas, 171, y, 7.0)


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
                # The top two or three rows are still belly: a leg does not
                # begin at an edge, it emerges from the dark the barrel ends
                # in, which is why the reference's cannons only become
                # separable around y=92.
                emerge = min(1.0, (y - top) / 3.0)
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
    for y in range(y0, y0 + height):
        # The pool is deepest under the belly and thins toward its front
        # edge; the last two rows break up into stipple.
        depth = 3 if y < y0 + height - 3 else 2
        for x in range(x0, x0 + width):
            if layout.keep_at(canvas, x, y):
                continue
            if y >= y0 + height - 2 and rng.random() < 0.45:
                continue
            ctx.shield(x, y)
            canvas.put(x, y, ctx.palette.darken(canvas.get(x, y), depth))
