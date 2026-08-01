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
    (10, 11, "shade"), (12, 13, "face"), (14, 14, "shade"), (15, 15, "lit"),
    (16, 16, "shade"), (17, 19, "lit"), (20, 21, "lit"), (22, 22, "shade"),
    (23, 23, "face"), (24, 24, "edge"),
)

#: Ramp step for each tone, on the plank's own family. `seam` and `void` are
#: the two that are NOT pine — a seam between two poles is a crack with
#: nothing in it, and it is warm-dark rather than grey-dark.
PLANK_TONE = {"shade": 0, "face": 1, "lit": 3}

#: §2.9's near-horizontal pale runs, "each 1 px, spanning most of the mass's
#: width". (row, x from, x to, step above the body). §7.7: Image A carries a
#: wire X-brace across this face and AT 320×144 THE X DOES NOT SURVIVE — two
#: clean diagonals would be the only diagonal lines in the region and would
#: cut the anchor mass in half. What is left of it is this.
TIMBER_RAILS = ((71, 9, 24, 1), (84, 0, 24, 2), (89, 0, 24, 1))

#: The two moonlit cap rows where the stack's top timbers lie across it. The
#: left cap is a row higher than the right, which is what stops the top of
#: the mass reading as one sawn edge.
TIMBER_CAPS = ((53, 5, 8), (54, 17, 24))

#: The body's own fall from the top of the stack to its foot: measured row
#: medians run about 31 at y 55-62, 25 at y 63-79, 21 at y 80-88 and 17 from
#: y 90 down. The mass is not lit from above — it is simply further out of
#: the sky's reach the lower it goes, and a body drawn at one value from the
#: cap to the ground is the single loudest way to make it read as a slab.
BODY_FALL = ((63, -0), (80, -1), (90, -2))

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
    with ctx.track(canvas, "sign post"):
        _sign_post(canvas, ctx)
    # §5's occlusion order: THE WHEELS CROSS IN FRONT OF THE TIMBER MASS'S
    # LOWER BODY, AND THE CRATES CROSS IN FRONT OF THE NEAR WHEEL'S LOWER
    # RIGHT. So the yard floor goes down first, the wheels stand on it, and
    # the heap goes down after them.
    _yard_floor(canvas, ctx)
    with ctx.track(canvas, "wheel pair"):
        _wheels(canvas, ctx)
    with ctx.track(canvas, "crate stack"):
        _clutter(canvas, ctx)


# ---------------------------------------------------------------------------


def _plank_ink(ctx: layout.Ctx, tone: str, lift: int = 0) -> int:
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
    return ctx.ink("timber_far", PLANK_TONE[tone] + lift)


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
        canvas.put(x, y, _plank_ink(ctx, tone, _body_fall(y) + grain))


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
            _plank_column(canvas, ctx, x, tone, tops[x], foot, stream)

    # §2.9's stepped top edge, "each tread capped by a 1-px cool moonlit line
    # at L 47-59 — the brightest cool marks in the region's left half". §5:
    # they are what separates the timber silhouette from the ridge behind it,
    # which is only 5-10 L points away, and they are load-bearing.
    for left, right, row in TIMBER_TOP[1:]:
        for x in range(left, right + 1):
            canvas.put(x, row, ctx.ink("timber_cap",
                                       1 if stream.random() < 0.55 else 0))
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

    # The two cap rows where the stack's top timbers lie across it.
    for row, left, right in TIMBER_CAPS:
        canvas.hline(left, row, right - left + 1, ctx.ink("timber_cap", 1))

    # §2.9's near-horizontal pale runs at y 70-71, 84 and 89.
    for row, left, right, lift in TIMBER_RAILS:
        for x in range(left, right + 1):
            canvas.put(x, row, ctx.ink("timber_body", lift))

    # §5: the lit right edge at x 23-24 is WHAT KEEPS THE MASS FROM BLEEDING
    # INTO THE SHADOW SLOT BESIDE IT, and it is warm where the rest is not.
    canvas.vline(24, 60, 29, ctx.ink("dry_mud", -1))
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
    for y in range(96, 122):
        for x in range(9, 20):
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     1 if stream.random() < 0.3 else 0))


def _shadow_slot(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§2.10 and §7.9. The darkest pixels in the region, and the reason the
    signboard reads at all.

    Columns 28-29 fall to L 1.4. It will look like a hole. If it comes up to
    L 20 "so the timber's edge shows", the board's left end loses forty
    luminance points of separation and starts to look glued to the lumber.
    """
    x0, y0, width, height = layout.SHADOW_SLOT
    for x in range(x0, x0 + width):
        canvas.vline(x, y0, height, ctx.ink("rail_shadow", -1))
    # The core. It starts a few rows below the beam, because the top of the
    # slot still carries the beam's own end and the timber's junction with it.
    canvas.rect(x0 + 3, y0 + 8, 2, height - 8, ctx.ink("shadow_slot"))


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
            canvas.put(x, y, ctx.ink("sign_board", lift + grain + _plank_grain(y)))
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
    for row, step in zip(BOARD_SEAM_ROWS, (1, 2)):
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


def _board_lift(column: int, face_w: int) -> int:
    """The board's lateral gradient as a ramp step. §3: +13 L, left to right."""
    return -3 + (4 * column) // face_w


#: The board is THREE PLANKS, not a panel: the top one carries the word, a
#: narrow one carries the seam between the lines, and the bottom one carries
#: the smudge. Each shows its own edge, which is why the face measures a row
#: of horizontal steps rather than an even field. Row -> ramp step against
#: the board's own field, from the measured row medians across x 31-73.
BOARD_ROWS = {62: 4, 63: 1, 64: 2, 71: 1, 72: 2, 73: 1, 77: 1, 78: -3}


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
                # Worn paint: about one pixel in sixteen is simply not there.
                # It is what stops eleven marks reading as eleven stamps —
                # and it is the whole budget, because a glyph three pixels
                # wide loses its identity at two dropouts.
                if stream.random() < 0.06:
                    continue
                lift = _board_lift(x - face_x, face_w)
                canvas.put(x, y0 + row, ctx.ink("sign_letter", max(-1, lift + 2)))

    # §6 and §7.2: "2 MILES" is 4 px tall and 20 px wide and it is SUPPOSED
    # to be a smudge — a shorter, fainter row of ticks under the main word,
    # never legible, and it must not be made legible. So it is drawn as its
    # rhythm and nothing else: seven marks on a 2.9 px pitch, each one or two
    # pixels wide, each a different height, none of them a glyph.
    lx, ly, _, lheight = layout.SIGN_LINE_2
    for position in range(7):
        x = lx + int(round(position * 2.9))
        lift = _board_lift(x - face_x, face_w)
        ink = ctx.ink("sign_letter", max(0, lift + 3))
        # Every mark a different height and a different width, because seven
        # identical marks at an even pitch is a comb and reads as ornament.
        top = ly + (1 if stream.random() < 0.35 else 0)
        canvas.vline(x, top, ly + lheight - top, ink)
        for offset, chance in ((1, 0.8), (-1, 0.25)):
            if stream.random() < chance:
                canvas.put(x + offset, ly + lheight - 1 - int(stream.random() * 2), ink)


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
    left, run = 58, 12
    stream = ctx.stream("left_yard.corral")

    # The panel's own ground first. §2.4: the gaps fall to L 12.7-14.7 and
    # below y=93 the panel goes near-black. It is authored here rather than
    # left to the road, because a rail IS its lit edge and an edge needs
    # something to be an edge against.
    for y in range(80, 96):
        for x in range(left, left + run):
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     -1 if stream.random() < 0.55 else 0))

    # Four rails, and THEY ARE NOT A LADDER OF EQUAL LIGHTS. Measured means
    # 32.7 / 48.9 / 36.7 / 27.8 top to bottom: the second is the bright one.
    # Under each, two rows down, the gap the rail is read against.
    rails = ((81, "weathered_rail", -4), (85, "dry_mud", 1),
             (89, "dry_mud", -1), (92, "weathered_rail", -5))
    for (row, material, offset) in rails:
        for x in range(left, left + run):
            canvas.put(x, row, ctx.ink(material,
                                       offset - (1 if stream.random() < 0.3 else 0)))
        canvas.hline(left, row + 1, run, ctx.ink("rail_shadow", 1))

    px, py, pwidth, pheight = layout.CORRAL_POST
    # §2.4: "brightening on its right face toward the lantern" — the post is
    # split, x=70 in shade and x 71-72 lit, and that split is the only thing
    # saying the panel ends at an upright rather than running out of frame.
    canvas.vline(px, py, pheight, ctx.ink("post_dark"))
    canvas.vline(px + 1, py, pheight, ctx.ink("post_mid", 1))
    canvas.vline(px + 2, py, pheight, ctx.ink("post_mid"))
    canvas.hline(px, py, pwidth, ctx.ink("timber_cap"))
    # §7.13 and §8: THE PANEL ENDS AT THAT POST. It is shielded along with
    # the panel because §2.4 measures both directly and the pool's own left
    # cut runs through them — letting the lamp lift a rail four steps turns
    # four measured means into one striped block.
    ctx.shield_rect(left, 79, run + 5, 21)


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
    boxes = (
        (layout.CRATE_UPPER, 83, -4, 10, "dry_mud", 2),
        (layout.CRATE_LOWER, 85, 0, 7, "dry_mud", 0),
        (layout.OPEN_BARREL, 95, -12, 10, "dry_mud", -1),
        (layout.PLANK_LID, 103, 0, 11, "dry_mud", 3),
        (layout.SMALL_KEG, 113, 0, 9, "dry_mud", 2),
    )
    for (x0, y0, width, height), row, inset, run, material, lift in boxes:
        for y in range(row, y0 + height):
            for x in range(x0, x0 + width):
                # §7.12: below each edge the body is a BODY, not a modelled
                # box — no side plane, no hoop, no stave, and nothing that
                # would put six small objects at L 30-45 in the region's
                # darkest quarter. It sits a step under the yard floor it
                # stands on and that step is the entire modelling.
                roll = stream.random()
                canvas.put(x, y, ctx.ink("rail_shadow",
                                         1 if roll < 0.35 else (-1 if roll < 0.55 else 0)))
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
            # Two steps, not three. §5's texture is scatter inside a NARROW
            # band; open a third step and the dirt starts to read as noise,
            # which is the one thing invariant 9 is there to keep out.
            canvas.put(x, y, ctx.ink("rail_shadow",
                                     2 if stream.random() < 0.4 else 1))


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
    far_x, far_y, far_r, _ = layout.WAGON_WHEEL_FAR
    near_x, near_y, near_rx, near_ry = layout.WAGON_WHEEL_NEAR

    # The far tyre. Cool, one pixel, outer left only — a predicate rather than
    # an angle range, because a quadrant test is exact at integer resolution
    # and an angle test rounds and nicks the ends. It fades downward: the top
    # of the arc is against the timber's foot and the bottom is in the verge.
    for y in range(far_y - far_r, far_y + far_r + 1):
        dy = y - far_y
        span = far_r * far_r - dy * dy
        if span < 0:
            continue
        x = far_x - int(round(span ** 0.5))
        if x > far_x - 3:
            continue
        fade = 1 if y > far_y + 3 else 0
        canvas.put(x, y, ctx.ink("stone", -fade))

    # The near wheel: a dark disc first, then its rim, then the spoke accents.
    for dy in range(-near_ry, near_ry + 1):
        for dx in range(-near_rx, near_rx + 1):
            if (dx / near_rx) ** 2 + (dy / near_ry) ** 2 > 1.0:
                continue
            # §2.13: sampled on rings at radius 4-8 the interior gives mean
            # L 21, sd 13-17, MINIMUM 2.4 AND MAXIMUM 69, with no angular
            # periodicity at any radius. So it is near-black with warm
            # pixels scattered through it — not a black disc, which is what
            # a filled ellipse gives and which reads as a hole.
            roll = stream.random()
            if roll < 0.10:
                ink = ctx.ink("dry_mud", -1)
            elif roll < 0.20:
                ink = ctx.ink("rail_shadow", 2)
            else:
                ink = ctx.ink("dark_pocket", -1 if roll < 0.72 else 0)
            canvas.put(near_x + dx, near_y + dy, ink)

    # The tyre. ONE PIXEL, all the way round, because at this size a two-pixel
    # rim on a nine-pixel radius is a doughnut. It is warm — `pine_fresh` 2
    # and `umber` 6, L 39-43 — and it dims as it goes into the dirt.
    for dy in range(-near_ry, near_ry + 1):
        span = 1.0 - (dy / near_ry) ** 2
        if span < 0:
            continue
        reach = near_rx * span ** 0.5
        for dx in (int(round(-reach)), int(round(reach))):
            canvas.put(near_x + dx, near_y + dy,
                       ctx.ink("post_mid", 0 if dy < 2 else -1))
    for dx in range(-near_rx, near_rx + 1):
        span = 1.0 - (dx / near_rx) ** 2
        if span < 0:
            continue
        reach = near_ry * span ** 0.5
        canvas.put(near_x + dx, near_y - int(round(reach)), ctx.ink("post_mid"))
        if stream.random() < 0.45:
            canvas.put(near_x + dx, near_y + int(round(reach)),
                       ctx.ink("post_mid", -2))

    # Twelve spokes, and NOT ONE OF THEM IS DRAWN. What the reference has is
    # scattered single warm pixels where a spoke catches, all in the upper
    # half, with no angular periodicity a ring sample can find. So the
    # accents are placed by the stream, in the half where light could reach
    # them, and the hub is two pixels.
    for _ in range(16):
        angle = stream.random() * math.pi
        radius = 0.3 + stream.random() * 0.55
        dx = int(round(-near_rx * radius * math.cos(angle)))
        dy = int(round(-near_ry * radius * math.sin(angle)))
        canvas.put(near_x + dx, near_y + dy,
                   ctx.ink("dry_mud", -1 if stream.random() < 0.5 else -2))
    for dy in (-1, 0):
        canvas.put(near_x, near_y + dy, ctx.ink("dry_mud"))
        canvas.put(near_x - 1, near_y + dy, ctx.ink("dry_mud", -2))
