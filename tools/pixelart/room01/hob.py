"""Room 1 — the man on the road, and his lantern.

A man in a long coat holding a kerosene barn lantern out to his left, and
the pool of warm light he stands in. This is where the eye lands first and
it is the only warm light source the player is meant to walk toward.
Everything else warm in the frame — the town, the coach lamps, the sign's
lantern — is scenery. This one is a person holding a thing.

HE IS SEVENTEEN BY THIRTY-SIX PIXELS AND HE HAS NO CONTRAST ON ONE SIDE.
hob.md §3: his far contour runs L 16-29 against a backdrop of 33-45 — under
ten points, and it MELTS, deliberately. He does not read by silhouette. He
reads by three things and nothing else: the lit edge on his lamp side, the
face, and the black hole between his legs. §10.8 — somebody will read the
far contour as a legibility failure and "fix" it. It is the design.

THE LANTERN LIGHTS THE GROUND BEHIND HIM, NOT HIM, and that is the frame's
cleverest move. The whole-frame study §4 measures his bbox against its
surround at −0.3 L, Michelson 0.003: AS A REGION HE IS INVISIBLE. His coat
averages 26.4 against lit ground at 58.0 — a +31.6 silhouette separation,
the largest of any object in the picture — plus one top-value pixel on his
face. §7.5 of the study: the instinct in a rebuild is to point the lamp at
the character, and doing it lifts the coat, collapses the separation, and
dissolves the most important figure in the room while every individual
measurement still looks plausible.

WHICH IS WHY EVERY PIXEL THIS MODULE WRITES IS SHIELDED. layout's
Ctx.shield exists for regions that author their own lit values, and this is
the case it was built for. Nothing here is drawn at an unlit value waiting
for a pass to finish it: the coat's lamp-side rim is authored at mud 8-10
and must STAY there while the ground behind it climbs past 86. Everything
goes through `_Brush`, which puts and shields in the same call, so it is not
possible to author a value here and forget to defend it.

THE OCCLUSION NOTCH IS NOT PAINTED AND THE CONTACT ROW NOW IS. hob.md §6
calls both subtractions from the pool, and for the notch that is exactly
right: his body blocks the lamp, the ground behind him sits a step below its
neighbours, and `lightpass` scales the field there so it tracks the light
instead of being a shape drawn beside him. The contact row at y=106 was left
to the same mechanism and the mechanism cannot reach it. A multiplier on the
lamp's EXCESS can take a pixel down to the bare road and no further, and the
bare road under his boots is not dark enough — the row composited at a mean
of 66 against the bar's 37, lighter in places than the lit ground two rows
in front of it. So it is authored here, at the values the bar carries, and
shielded. See §9 below, which is where the reasoning lives.

THE MEASUREMENTS. Everything below is taken off the bar at native
320x144 with L = 0.299R + 0.587G + 0.114B, and every table says which rows
and columns it came from. The figure is fifteen columns wide and each column
has a value; that is how a coat at this size is built, and it is why the
tables here are COLUMN PROFILES and ROW SPANS rather than pixels — the
silhouette and the shading are separate facts and only one of them changes
when he walks.

THE VALUE TIERS, hob.md §3, across 449 px:

    black    0-15   13%   hat crown, coat opening, boot cores
    deep    15-28   23%   far side of the coat, trousers
    shadow  28-41   27%   coat body, near side of the trousers
    mid     41-53   19%   coat's lit panel, brim's lit edge
    lampside 53-71  13%   the warm rim down his left, sleeve, boot tops
    light   71-101   4%   face mid-tones, brass patch, collar
    highlight 101-123 1.6% — SEVEN PIXELS. Five on the face, two on the hand.

Seven. Not a rim light down his silhouette (§10.5); seven pixels, and five
of them are inside a seven-by-six face.

...AND A VALUE IS ONLY HALF OF WHAT A PIXEL IS. Every table above was a
luminance and nothing else, and every one of them was right, and the figure
still read flat — a face that was one orange with a keyline round it, a coat
that was one grey. The bar builds the same forty-two pixels of face out of
five families and the same three hundred of coat out of four, at values that
barely move between neighbours: what moves is SATURATION, 0.72 at the cheek
down to 0.11 at the jaw's far corner. Skin one pixel out of the light is not
darker skin, it is skin lit by the night instead. THE CHROMA LADDER below is
that second axis, and every table in this file now carries a rung as well as
a value. It moves no silhouette, no tier boundary and no top-value pixel.

THE FLAME IS THE RESERVED BAND AND IT IS SMALL. accent_gold 4-7 measure
L 136/156/181/204 against a frame maximum of 123 everywhere else, so the
band is genuinely the brightest thing in the palette and it MOVES. §7: size
is the only control we have over how loud it is. Twenty-two to twenty-eight
pixels, total, inside x 82-89 / y 85-90 — a forty-pixel flame pulls the eye
off the man it is supposed to introduce and the cycle reads as a fault
light. This build spends twenty-one, on the reference's own map of where the
top value falls, and the shape of that map is the point: a flame body at
x 83-86 that widens downward, a frame post at x=87 that stays DARK, and a
separate lit pane at x=88 seen past it. The hardware around it takes
accent_gold 0-3, the same family one band below the reserve, so the object
holds together and only the flame moves — including the base plate's lit
strip, which is why this is twenty-one and not the reference's twenty-two.

AND THE HALO IS TIGHT AND IT IS WARM. §4 measures the airborne glow against
the backdrop at r = 4…9: 79, 69, 55, 44, 39, 37, against a backdrop ambient
of 33-37. So it is real — four rings of it — and it is DEAD by r = 8, and
there is none at all above the hand: by y=77 the column over the lamp is
already at ambient. The lamp throws its light DOWN. §10.4 — a soft radial
bloom is the single easiest way to make this region look wrong, so the halo
here is four hard bands off a measured table, floored at y=81, and it never
darkens a pixel that is already brighter than the ring it lands in (which is
what keeps the fence rail's own lit top row, running into the glow at x≈80,
from being flattened by it).

WHY THE FLAME IS DRAWN BEFORE THE LIGHTING PASS HERE. hob.md §2 says a
source is not a lit surface and must go on afterwards, and the old
compositor did exactly that. It is unnecessary now: layout.keep() makes the
lighting pass skip reserved indices outright, so the flame survives the pass
untouched wherever it is drawn, and drawing it in the region that owns it
beats drawing it in the compositor. The pass additionally refuses to lift
any pixel INTO the band, which is the other half of the same guarantee.

DEFERRED to a later pass:
  - §8's broken bands on the pool's edge — 5-7 px solid runs near the core
    narrowing to 2-4 outside, with a 1-2 px mottle between neighbours.
    `lightpass` dithers with a 4x4 threshold instead, and the pool is its
    field to walk; this module only authors the wedge between his legs and
    leaves the rest of the ground to it.
  - the road immediately under the lantern. §5's contours want the top edge
    of the pool to fall off faster than the fitted ellipse does, and the
    correction belongs in the falloff, which is shared.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


# ---------------------------------------------------------------------------
# The brush
# ---------------------------------------------------------------------------


class _Brush:
    """Puts a pixel and shields it, in one call, always.

    Every value in this region is a FINISHED value. There is no unlit
    authoring here for a later pass to complete, because the whole point of
    the figure is that the light misses him — so a pixel written and not
    shielded is a bug, and the only way to make that unwriteable is to make
    the two operations the same operation.
    """

    __slots__ = ("canvas", "ctx")

    def __init__(self, canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
        self.canvas = canvas
        self.ctx = ctx

    def put(self, x: int, y: int, index: int) -> None:
        self.canvas.put(x, y, index)
        self.ctx.shield(x, y)

    def run(self, y: int, x_from: int, x_to: int, index: int) -> None:
        """An inclusive horizontal run — the shape rows below are inclusive."""
        for x in range(x_from, x_to + 1):
            self.put(x, y, index)


# ---------------------------------------------------------------------------
# Colour, through the material table and nothing else
# ---------------------------------------------------------------------------
#
# layout.MATERIALS anchors five ramps for this region and every colour below
# is a step along one of them. The offsets are written against the anchor so
# that moving a material moves the whole figure with it, which is the point
# of having a material table at all.

# Three of the five ramps this file used to step by hand are now reached
# through THE CHROMA LADDER below instead, because every table that wanted
# them wanted a value and a hue rather than a family and a step. `grey` and
# `ochre` had a helper apiece here and neither has a caller left; the two
# that stay are the ones whose STEP is the natural unit — `mud` for the
# ground under him, `accent_gold` for the lantern, where the ramp position is
# the specification (§7's flame budget is written in steps) and not a
# stand-in for a luminance.

_MUD_ANCHOR = layout.MATERIALS["hob_coat_lit"][1]        # mud 8, L 55
_GOLD_ANCHOR = layout.MATERIALS["lamp_hardware"][1]      # accent_gold 2, L 89
_UMBER_ANCHOR = layout.MATERIALS["dark_pocket"][1]       # umber 1, L 14


def _mud(ctx: layout.Ctx, step: int) -> int:
    """mud, the warm ground-and-lamplight family. 0:12 … 18:122."""
    return ctx.ink("hob_coat_lit", step - _MUD_ANCHOR)


def _umber(ctx: layout.Ctx, step: int) -> int:
    """umber, the darkest warm ramp. 0:9 1:14 3:26 4:30 — the trousers and
    the boots, which are lit by bounce off the pool rather than by the lamp."""
    return ctx.ink("dark_pocket", step - _UMBER_ANCHOR)


def _gold(ctx: layout.Ctx, step: int) -> int:
    """accent_gold BELOW the reserve. 0:41 1:66 2:89 3:112. Never 4-7."""
    return ctx.ink("lamp_hardware", step - _GOLD_ANCHOR)


# ---------------------------------------------------------------------------
# THE CHROMA LADDER — the axis this figure did not have
# ---------------------------------------------------------------------------
#
# THE FIGURE WAS BUILT OUT OF TWO FAMILIES AND THE BAR BUILDS IT OUT OF SIX.
# Every value table below was measured off the bar and every one of them was
# right: composited against the reference the face tracks within two or three
# luminance on all forty-two pixels, the coat's column profile within four.
# And the head still read as a flat orange tile with a keyline round it,
# because a value was all that was ever measured. Re-measured for SATURATION
# at the same pixels, the bar's face runs 0.49 mean and this build's ran 0.70
# — every pixel of skin was `ochre`, sat 0.65-0.78, from the top value down
# to the jaw's darkest corner, and every pixel of coat was `grey`, sat 0.11.
#
# What the bar actually does, pixel by pixel, on the face:
#
#     y74   mud4  ochre8  umber1 ochre8  pine2  pine2  pine2
#     y75   dust5 ochre13 umber14 ochre13 pine6 ochre8 pine5
#     y76   umber7 pine3  pine4  umber14 ochre13 pine3 grey2
#     y77   dust1 pine5   ochre13 ochre8 ochre8  pine2  grey1
#     y78   grey3 umber2  pine4  ochre8 ochre8  umber7 grey2
#     y79   dust1 dust1   dust8  ochre13 dust2  grey2  grey1
#
# Read the rows across and the luminance barely moves between neighbours —
# pine4 is 63 and umber9 is 61 and mud10 is 66. What moves is SATURATION,
# from 0.72 at the cheek to 0.11 at the jaw's far corner. That is the
# transition the critic could see was missing and it is not detail: it is
# the surface turning away from the lamp. Skin one pixel out of the light is
# not darker skin, it is skin lit by the night instead, and the night in this
# frame is 232 degrees away. Six families at one saturation apart give the
# three or four steps across two pixels of cheek that a curved surface needs
# and a flat fill with a keyline does not have.
#
# NOTHING HERE ADDS A FEATURE AND NOTHING HERE MOVES A VALUE. Every rung is
# resolved by NEAREST LUMINANCE inside its own family, so a pixel changes hue
# and stays where it was on the value scale — which is `Palette.darken`'s own
# note about re-materialising at matched value, applied along the whole
# figure instead of only in a cast shadow. §3's seven tiers, §3's seven
# top-value pixels and §2's bounding boxes are untouched.

#: Coolest to warmest, and the ONE axis every table below indexes. Each rung
#: is a material out of layout's table rather than a family name, so nothing
#: in this file reaches a ramp the shared contract has not named.
#:
#: `hob_skin_turn` is the rung between mud and ochre, where a third of the
#: bar's face lives. It used to be `lit_mud` -- the ROAD's lit fringe, and
#: the only entry in the whole material table anchored on `pine_fresh`, so
#: the figure was reaching a rung through another region's material. Asked
#: for rather than added, because layout.py belongs to nine authors and not
#: to this one; granted by the integrator, and the swap changes no pixel,
#: because `_turn` and `_bracket` index the family and never the step.
_LADDER = (
    "hob_coat",       # grey,        sat 0.00-0.14 — turned fully into the night
    "hob_collar",     # dust,        sat 0.13-0.29
    "dark_pocket",    # umber,       sat 0.33-0.50
    "hob_coat_lit",   # mud,         sat 0.44-0.56
    "hob_skin_turn",  # pine_fresh,  sat 0.43-0.62
    "hob_face",       # ochre,       sat 0.51-0.78 — square into the lamp
)
_G, _D, _U, _M, _P, _O = range(6)

#: Every family's own floor. `grey` bottoms out at 16 and `pine_fresh` at 28,
#: so a rung asked for a value it cannot reach silently lifts the pixel — and
#: at the bottom of this figure, where §3 spends thirteen per cent of him
#: between 0 and 15, a five-luminance lift is a hole filled in. Tables below
#: keep to `umber`, `mud` and `void` under L 25 for that reason.
_LADDER_FLOOR = (16, 25, 9, 13, 28, 26)


def _turn(ctx: layout.Ctx, rung: int, value: float) -> int:
    """The entry of a chroma rung's family that sits nearest a measured L.

    Value in, hue chosen. This is the whole mechanism: the tables say what a
    pixel's luminance is and how far its surface has turned from the lamp,
    and the palette says which of its 256 entries is both.
    """
    ramp = ctx.ramp(_LADDER[rung])
    luminance = ctx.palette.luminance
    return min((ramp.at(step) for step in range(ramp.count)),
               key=lambda index: abs(luminance(index) - value))


def _bracket(ctx: layout.Ctx, rung: int, value: float, rng) -> int:
    """The two entries of a rung that STRADDLE a value, and a coin between.

    `_turn` takes the nearest, which is right when a table has measured a
    pixel. This is for the mottle, and the mottle is the reason the coat had
    a hole in it: `grey` runs 32, 41, 53 and the bar spends a fifth of the
    figure between 42 and 49, so a pixel authored at 41 on grey and moved to
    the NEAREST dust or umber lands on 41 again and the band stays empty.
    The families are offset from one another — dust 41 / 46, umber 40 / 48,
    mud 39 / 44 — and taking either side of the value instead of the closest
    to it is how the bar gets to 43, 46 and 48 with no ramp that has them.

    Which is the honest description of what a chroma rung is: not a hue at
    your exact value, but the two entries of another family your value falls
    between.
    """
    ramp = ctx.ramp(_LADDER[rung])
    luminance = ctx.palette.luminance
    below = above = None
    for step in range(ramp.count):
        index = ramp.at(step)
        if luminance(index) <= value:
            below = index
        if luminance(index) >= value and above is None:
            above = index
    if below is None:
        return above
    if above is None:
        return below
    return below if rng.random() < 0.5 else above


def _nudge(ctx: layout.Ctx, index: int, rung: int, rng) -> int:
    """One rung either way, at a value the rung can hold, or nothing at all.

    THE DIRECTION FLIPS AT THE ENDS OF THE LADDER rather than being dropped.
    `grey` is rung 0 and half the coat is authored on it; a nudge that simply
    failed when it drew "cooler" halved the mottle on exactly the columns
    that needed it most, and the far side of the coat came out at saturation
    0.21 against the bar's 0.30. It is a coin toss over which NEIGHBOUR a
    pixel takes, and at the end of the ladder there is only one neighbour.

    And it refuses a rung whose family cannot reach the value: `dust` bottoms
    out at 25 and `pine_fresh` at 28, so a nudge into either from a boot at
    L 14 would lift the pixel out of §3's black tier to paint a hue nobody
    would see anyway.
    """
    order = (1, -1) if rng.random() < 0.5 else (-1, 1)
    for direction in order:
        nudged = rung + direction
        if 0 <= nudged < len(_LADDER) \
                and ctx.palette.luminance(index) >= _LADDER_FLOOR[nudged]:
            return _bracket(ctx, nudged, ctx.palette.luminance(index), rng)
    return index


# ---------------------------------------------------------------------------
# 10a-b. The hat
# ---------------------------------------------------------------------------
#
# §10.13: the brim is TEN PIXELS ON ONE ROW and it reads because its two ends
# are forty-two points apart — the near tip lit to L 46, the far tip at L 4
# the darkest pixel in the region. A symmetric dark ellipse loses the light
# direction the whole region is built on, and the whole region is built on it.
#
# Measured across y=73, x 95→104: 46 34 27 22 22 26 8 8 23 31. So it is not a
# gradient either: it is lit, mid, dark, dark, then a tip that comes back up
# against the sky. (row, x from, x to, mud steps left to right).

#
# AND IT IS NOT ONE MATERIAL EITHER. Felt at this size is a curved top plane
# and a flat under-brim, and the bar says so in chroma before it says it in
# value: the crown's lamp-side edge and the brim's near tip are `pine_fresh`,
# the crown's top is `umber` and `mud` at nine to fifteen luminance, and the
# far tip goes to void. (row, x from, ((L, rung), ...)).

HAT_CROWN = (
    (71, 99, ((32, _P), (26, _P), (15, _U), (28, _G))),
    (72, 97, ((35, _P), (15, _U), (14, _M), (12, _U), (9, _U), (12, _M))),
)
HAT_BRIM_Y = 73
HAT_BRIM_X = 95
#: Measured across y=73, x 95→104: 46 35 28 23 23 26 9 9 24 31, and the rungs
#: at those same ten pixels. The near tip is the warmest thing on the hat and
#: the far tip is the coldest — which is the light direction the whole region
#: is built on, said twice.
HAT_BRIM = ((46, _P), (35, _P), (28, _P), (23, _M), (23, _U), (26, _P),
            (9, _U), (9, _M), (24, _U), (31, _U))
#: §8's first load-bearing single pixel. L 4, the darkest in the region, and
#: the reason the brim is a brim rather than a blob.
HAT_FAR_TIP = (103, 74)
#: The shadow the brim throws on his own forehead. Measured L 25 at sat 0.24,
#: which is `dust` and not `mud` — it is forehead lit by the sky, not by the
#: lamp, and it was authored a saturated warm before.
HAT_BROW_SHADOW = (95, 74, 25, _D)


def _hat(brush: _Brush, ctx: layout.Ctx) -> None:
    for y, x_from, row in HAT_CROWN:
        for offset, (value, rung) in enumerate(row):
            brush.put(x_from + offset, y, _turn(ctx, rung, value))
    for offset, (value, rung) in enumerate(HAT_BRIM):
        brush.put(HAT_BRIM_X + offset, HAT_BRIM_Y, _turn(ctx, rung, value))
    brush.put(*HAT_FAR_TIP, ctx.ink("shadow_slot"))
    x, y, value, rung = HAT_BROW_SHADOW
    brush.put(x, y, _turn(ctx, rung, value))


# ---------------------------------------------------------------------------
# 10c-d. The face
# ---------------------------------------------------------------------------
#
# Seven by six, and §10.12 says anything more than this becomes a mask. The
# eyes are NOT DRAWN — they are the gap between the brim shadow across y=74
# and the cheek at y=75. The moustache is a two-pixel darkening of x 97-98 on
# y=76 while the cheek beside it stays at the top value.
#
# Measured x 96→102, rows 74→79, as (luminance, chroma rung) — the two facts
# a painter has about a pixel and the two this table used to have one of. The
# luminance column is unchanged from the measurement it always carried; the
# rung column is the same forty-two pixels re-measured for saturation. See
# THE CHROMA LADDER above for what the six rungs are and why a face at seven
# by six needs all of them.
#
# THE FIVE TOP-VALUE PIXELS ARE WRITTEN AT 120 AND NOT AT THE BAR'S 123. The
# palette's ochre reaches 117 at step 12 and 126 at step 13, and 13 is
# `lit_window_hot`, which layout names THE CEILING OF THE PICTURE. §3 puts
# the highlight tier at 101-123 and the frame's ceiling at 121.9; 117 is
# inside both and 126 is outside one of them. Five pixels of a man's cheek do
# not get to be the brightest unreserved entry in the room.
#
# THE COLLAR IS NO LONGER A SPECIAL CASE and that is the ladder earning its
# keep. §8 calls it the only cool-neutral pixel on the figure, L 82 at
# saturation 0.30 against the face's 0.59 — which is exactly dust 8, exactly
# `hob_collar`, and exactly what (82, _D) resolves to. It was a hard-coded
# exception because there was no axis it could be a position on.

FACE_X = 96
FACE_Y = 74
FACE = (
    # brim shadow, with two lit pixels punched through it
    ((36, _M), (87, _O), (12, _U), (87, _O), (42, _P), (46, _P), (46, _P)),
    # the widest lit band; two of the five top pixels
    ((58, _D), (120, _O), (97, _U), (120, _O), (76, _P), (87, _O), (72, _P)),
    # the moustache darkens 97-98 while the cheek beside it stays hot
    ((50, _U), (56, _P), (59, _P), (97, _U), (120, _O), (51, _P), (30, _G)),
    # jaw
    ((38, _D), (72, _P), (120, _O), (87, _O), (87, _O), (42, _P), (27, _G)),
    # jaw, and the far edge is already inside the backdrop's own family
    ((43, _G), (21, _U), (59, _P), (87, _O), (87, _O), (50, _U), (30, _G)),
    # chin, and §8's collar at (98, 79)
    ((40, _D), (33, _D), (82, _D), (120, _O), (41, _D), (38, _G), (28, _G)),
)


def _face(brush: _Brush, ctx: layout.Ctx) -> None:
    for row, cells in enumerate(FACE):
        for column, (value, rung) in enumerate(cells):
            brush.put(FACE_X + column, FACE_Y + row, _turn(ctx, rung, value))


# ---------------------------------------------------------------------------
# 10e-h. The coat
# ---------------------------------------------------------------------------
#
# TWO TABLES, because the silhouette and the shading are two different facts.
#
# The silhouette, measured row by row off the bar: shoulders twelve px wide
# at y=80, the body settling at fourteen to fifteen, and no taper at the hem —
# it is a long coat and it hangs straight. (row, left, right), inclusive.
#
# The shading is a COLUMN PROFILE, because at this size a coat is a set of
# vertical panels and nothing else. Left to right off the bar's mid-coat rows:
#
#   x 94  ~33   the extreme left edge, turned away from the lamp again
#   x 95  ~44   mid
#   x 96  ~64   THE READING EDGE — 20-33 points clear of the backdrop
#   x 97  ~60
#   x 98  ~55
#   x 99  ~15   the front opening: one pixel wide, and the only interior line
#   x100  ~40   the coat's right panel, cold from here on
#   x101  ~48
#   x102  ~43
#   x103  ~36
#   x104  ~21   and from here it is INSIDE the backdrop's own range and melts
#   x105  ~27
#   x106  ~28
#   x107  ~24
#   x108  ~20
#
# Note where the light is. It is not a one-pixel rim: it is a three-column
# panel at x 96-98, which is the front of the coat turned toward the lamp,
# and it carries the whole of the figure's readability. Right of the opening
# there is no light at all — four hundred and forty-nine pixels and the
# brightest thing on his dark side is a hand.

COAT_ROWS = (
    (80, 95, 106), (81, 94, 107), (82, 94, 107), (83, 94, 107), (84, 94, 108),
    (85, 95, 108), (86, 95, 108), (87, 95, 108), (88, 95, 108), (89, 95, 108),
    (90, 95, 108), (91, 95, 108), (92, 94, 107), (93, 94, 107), (94, 94, 107),
    (95, 94, 107), (96, 94, 107), (97, 94, 107),
)

#: The cold half, from the front opening rightwards: (x, grey step). The hue
#: break is AT the opening and that is the frame's colour event in miniature —
#: one warm island, and the cold starts one pixel to its right. The lamp side
#: is not here; it moves, and it lives in COAT_LAMPSIDE below.
#: TWO PROFILES, because the coat's dark half dims below the waist and the
#: whole right side of him goes out. Measured means, y 82-91 against y 92-97,
#: column by column: x101 46→31, x104 22→33, x105 35→27, x106 40→21. Chest
#: and skirt, and the skirt is the part hanging below the lamp's throw.
#: (x, family key, grey step); "g" is grey and cold, and everything from the
#: opening rightwards is cold — that is the whole of the hue architecture.
#:
#: AND THE COLD HALF IS NOT ALL ONE COLD. Re-measured for saturation down the
#: same columns, the bar runs dust at x 100-102 (0.18-0.29), grey at x 103-107
#: (0.03-0.14) and umber again at x 108 (0.33-0.50) — the near shoulder still
#: catching a little of the lamp, the middle of the coat lit only by the sky,
#: and the far edge picking up the town and the road behind him. Three
#: statements about which way a panel faces, at values that barely move.
#: (x, luminance, chroma rung).
#: The values are the columns' own means, re-taken with the hand's rows and
#: the brass patch excluded rather than averaged in. x=102 was the one that
#: mattered: measured clear of the patch it runs 46 through the chest and 48
#: through the skirt against the 41 declared here, and 41 is `grey` 3 at 40.6
#: — a tenth of a luminance under the bar's own fourth quintile. Sixteen
#: pixels of the coat's brightest cold column were landing one bucket low,
#: which is most of why the figure held six per cent of the 42-49 band
#: against the bar's twenty.
COAT_COLUMNS = (
    (99, 41, _D),
    (100, 39, _D), (101, 52, _D), (102, 46, _D), (103, 38, _G), (104, 23, _G),
    (105, 32, _G), (106, 40, _G), (107, 26, _G), (108, 23, _U),
)
COAT_COLUMNS_SKIRT = (
    (99, 41, _D),
    (100, 41, _D), (101, 32, _D), (102, 48, _D), (103, 42, _G), (104, 34, _G),
    (105, 26, _G), (106, 22, _G), (107, 20, _G), (108, 16, _U),
)
COAT_SKIRT_FROM = 92

#: x=106 above the waist is not a mistake and it is not a rim light. Measured
#: down that column, y 84-88 runs 34 40 48 48 39 against 16-32 either side of
#: it: a single lit fold on his dark shoulder, sitting at exactly the
#: backdrop's own value so that it MELTS rather than outlines (§3, §10.8). It
#: is the only structure his far side has above the hand — and it stops at
#: the waist, where the same column drops to 16-27.

#: The shoulders are a different plane and take a different profile. The top
#: of a shoulder faces the sky, not the lamp, so it is flatter and slightly
#: brighter on the far side than the body under it: measured y=80, x 99→107
#: gives 50 29 35 36 46 42 34 18 24 against a body column set that runs 40 53
#: 46 40 24 24 40 15. (x, grey step), for rows 80-81 only.
COAT_SHOULDER = ((99, 41, _U), (100, 32, _D), (101, 32, _D), (102, 41, _G),
                 (103, 41, _D), (104, 41, _G), (105, 32, _G), (106, 16, _D),
                 (107, 24, _U), (108, 24, _D))
COAT_SHOULDER_ROWS = (80, 81)

#: §8. x=99 for eight rows, widening to three by the hem — the coat's front
#: opening, the only interior line on it, and what stops him reading as a
#: bell.
#:
#: AND IT WAS THE FLATTEST SHAPE ON THE FIGURE. It was one grey at L 16 for
#: eight rows and then one void for eight more: a ruled bar down the middle
#: of the most-looked-at object in the frame, in the two colours a keyline is
#: made of. The bar does not have a keyline there. Measured down x=99 from
#: y=82 it runs 26 15 26 20 26 19 28 9 6 6 6 6 2 2 2 2 — a WARM dark that
#: breathes between 15 and 28 through the chest, drops to a hard 6 at the
#: waist, and only reaches the frame's true black in the last four rows,
#: where §1 of the whole-frame study says near-black is allowed to be spent.
#: The opening is a gap between two edges of cloth and a gap has depth in it;
#: what makes it read is that it is the darkest thing on him, not that it is
#: a single value.
#:
#: The rows below L 5 take `shadow_slot`, which is void and is the only
#: neutral in this file. (row, L, chroma rung); `_V` is void.
_V = -2
COAT_OPENING_X = 99
COAT_OPENING = ((82, 26, _M), (83, 15, _G), (84, 26, _M), (85, 20, _M),
                (86, 26, _M), (87, 19, _U), (88, 28, _D), (89, 9, _M),
                # 6 is not 0. `umber` 0 at L 9 for the waist rows and void
                # only for the last four, because study §1 puts true
                # near-black at 1.73% of the frame in components whose
                # largest is the coach doorway, and eight rows of an opening
                # is not where that budget goes.
                (90, 6, _U), (91, 6, _U), (92, 6, _U), (93, 6, _U),
                (94, 2, _V), (95, 2, _V), (96, 2, _V), (97, 2, _V))
#: It flares to three by the hem, and the two outer columns are their own
#: measurement rather than a second copy of the core: x=98 runs 12 2 2 6 9 17
#: 19 down y 91-97 and x=100 runs 12 12 8 8 11 20 down y 92-97. The flare
#: OPENS as it falls — near-black where the two skirts part and coming back
#: up to the coat's own value at the hem, because by then it is the inside of
#: the cloth catching the road rather than the dark between two panels.
#: (x, row from, (L, rung)...).
COAT_OPENING_FLARE = (
    (98, 91, ((12, _M), (2, _V), (2, _V), (6, _V), (9, _M), (17, _U), (19, _U))),
    (100, 92, ((12, _M), (12, _M), (8, _U), (8, _U), (11, _M), (20, _U))),
)

#: THE LIT PANEL IS NOT A STRIPE FROM COLLAR TO HEM, AND IT DOES NOT STAY IN
#: ONE PLACE. The lamp is held low and out to his left, so the shoulder is a
#: top plane turned away from it, and the skirt of the coat swings forward
#: below the waist — measured, the panel sits at x 96-98 through the chest,
#: shifts to x 95-96 by y=93, and by y=97 the brightest pixel on the whole
#: figure below his face is x=95 at L 70 while x=97 has gone to 13.
#:
#: That drift is the difference between a coat and a bell (§8's own words
#: about the front opening apply just as much to the panel beside it). Run
#: the panel straight down and he reads as a lit cylinder with a dark seam.
#: (row from, row to, mud steps for x 94, 95, 96, 97, 98). None yields the
#: column to the opening.
COAT_LAMPSIDE = (
    (80, 80, (7, 7, 6, 5, 6)),
    (81, 81, (5, 6, 9, 6, 4)),
    (82, 83, (2, 6, 10, 9, 8)),
    (84, 89, (5, 6, 10, 9, 8)),
    (90, 90, (5, 6, 10, 9, 4)),
    (91, 91, (5, 6, 9, 9, None)),
    (92, 92, (6, 10, 9, 8, None)),
    (93, 94, (5, 10, 9, 3, None)),
    (95, 95, (9, 9, 9, 2, None)),
    (96, 97, (9, 11, 5, 0, None)),
)
COAT_LAMPSIDE_X = 94

#: ...and the panel is not one material either. Measured down the same five
#: columns the bar's saturation runs 0.22 / 0.24 / 0.51 / 0.47 / 0.55 — the
#: extreme left edge at x=94 has turned away from the lamp and DESATURATES,
#: which is the same fact its low value already says and is why the edge does
#: not read as a rim light. x 96-98 are the panel proper and stay warm.
#: (chroma rung for x 94, 95, 96, 97, 98).
COAT_LAMPSIDE_TURN = (_D, _D, _M, _U, _P)

#: §8. One pixel of brass at L 87 on an otherwise dead-dark shoulder, and the
#: only ornament he has. accent_gold 2 — the same family as the lamp, three
#: bands under the reserve, so it can never be mistaken for the flame.
BRASS_PATCH = (102, 82)

#: §8. Two pixels at the top value, eighteen rows below the face and on the
#: DARK side of him. They are what tells the eye there is a second arm, and
#: they are the only reason his right side has any structure at all.
#: (row, x from, ochre steps).
#: And it is a hand at the far edge of the lamp's throw, not a hand under it:
#: the bar puts its two top pixels on `ochre` and everything around them on
#: `pine_fresh` and `umber`, so the four pixels of knuckle fall away in
#: chroma as fast as they fall away in value. (row, x from, (L, rung)...).
RIGHT_HAND = (
    (89, 106, ((69, _P), (53, _P), (35, _U))),
    (90, 105, ((62, _U), (120, _O), (120, _O), (53, _U))),
    (91, 106, ((69, _P), (85, _O), (35, _U))),
)


#: THE TWO JITTERS, and the second one is the whole of what this pass added.
#:
#: §6 of the whole-frame study: the mid-ground is 0.0% flat. Flat columns
#: would read as corduroy, so one pixel in five steps once along its own
#: family — never more, because two steps at this size is a fold and he has
#: no folds. That was here already and it was not enough, because a value
#: jitter is corduroy in the other direction: it varies the one axis the
#: columns already vary along and leaves every pixel of the coat the same
#: colour. Measured across the bar's own coat at a FIXED value, the cloth
#: runs mud 9, umber 9 and pine 4 — 61, 61 and 63 luminance, three families —
#: in adjacent pixels of the same column. Cloth has a nap, and a nap is a
#: chroma texture at constant value.
#:
#: One rung, never two, and never off the end of the ladder: two rungs is a
#: different material and the reading edge stops being one panel.
COAT_VALUE_JITTER = 0.20
COAT_CHROMA_JITTER = 0.25


def _coat(brush: _Brush, ctx: layout.Ctx) -> None:
    cold = {x: (value, rung) for x, value, rung in COAT_COLUMNS}
    skirt = {x: (value, rung) for x, value, rung in COAT_COLUMNS_SKIRT}
    shoulder = {x: (value, rung) for x, value, rung in COAT_SHOULDER}
    lampside = {}
    for y_from, y_to, steps in COAT_LAMPSIDE:
        for y in range(y_from, y_to + 1):
            lampside[y] = steps

    rng = ctx.stream("hob coat")
    for y, left, right in COAT_ROWS:
        panel = lampside[y]
        if COAT_SHOULDER_ROWS[0] <= y <= COAT_SHOULDER_ROWS[1]:
            far = shoulder
        else:
            far = skirt if y >= COAT_SKIRT_FROM else cold
        for x in range(left, right + 1):
            if x < COAT_LAMPSIDE_X + len(panel):
                step = panel[x - COAT_LAMPSIDE_X]
                if step is None:
                    continue
                column = x - COAT_LAMPSIDE_X
                rung = COAT_LAMPSIDE_TURN[column]
                index = _turn(ctx, rung, ctx.palette.luminance(_mud(ctx, step)))
            else:
                value, rung = far[x]
                index = _turn(ctx, rung, value)
            # CHROMA FIRST AND VALUE SECOND, and the order is the whole point.
            # See COAT_CHROMA_JITTER: `grey` steps 41 to 53 with nothing
            # between, so a value jitter applied to a grey pixel and then
            # re-materialised lands back on 41 or 53 and the coat holds NO
            # pixels in the 42-49 band the bar spends a fifth of the figure
            # in. Move the family first and the step second and the same two
            # jitters reach 44, 46, 48 and 49 — which is how the bar reaches
            # them too. A value its own ramp does not have is a value found
            # by turning the surface, not by pushing it harder.
            if rng.random() < COAT_CHROMA_JITTER:
                index = _nudge(ctx, index, rung, rng)
            if rng.random() < COAT_VALUE_JITTER:
                index = ctx.palette.darken(index, 1) if rng.random() < 0.5 \
                    else ctx.palette.lighten(index, 1)
            brush.put(x, y, index)

    for y, value, rung in COAT_OPENING:
        brush.put(COAT_OPENING_X, y, ctx.ink("shadow_slot") if rung == _V
                  else _turn(ctx, rung, value))
    for x, y_from, cells in COAT_OPENING_FLARE:
        for offset, (value, rung) in enumerate(cells):
            brush.put(x, y_from + offset, ctx.ink("shadow_slot") if rung == _V
                      else _turn(ctx, rung, value))

    brush.put(*BRASS_PATCH, _gold(ctx, 2))

    for y, x_from, cells in RIGHT_HAND:
        for offset, (value, rung) in enumerate(cells):
            brush.put(x_from + offset, y, _turn(ctx, rung, value))


# ---------------------------------------------------------------------------
# 10i, 11, 12. The arm, the hand, the bail
# ---------------------------------------------------------------------------
#
# §10.11: six pixels join him to the lantern, and missing them leaves the
# lamp hanging in mid-air next to a man. The arm is OUT AND A LITTLE UP —
# the hand sits above the lantern and above his own shoulder — so it is a
# lit top edge and a dark underside, two rows, and never a tube.
#
# Measured y=81, x 88→94: 40 33 26 46 48 48 40, and y=82, x 88→93:
# 52 50 41 35 44 40. The sleeve is what the lamp catches of it and the rest
# is inside the lamp's own shadow.

#
# AND THE SLEEVE'S TWO ROWS ARE TWO PLANES, WHICH IS ALSO A CHROMA FACT. The
# top row is the arm's upper surface and the only light on it is the sky; the
# under row is the surface the lantern is directly under. Measured, the bar
# runs the top at saturation 0.18-0.29 and the underside's lamp end at
# 0.47-0.48 at the SAME luminance, 47-52 across both. Drawn in one family it
# was a tube. (row, x from, (L, rung)...).

SLEEVE_TOP = (81, 91, ((49, _U), (49, _D), (49, _U), (44, _D)))
SLEEVE_UNDER = (82, 88, ((55, _U), (55, _U), (44, _D), (23, _D),
                         (44, _U), (39, _D)))

#: §4's construction, and it is a hand rather than a mitten: two pixels reach
#: the top value and everything else falls away fast. It is also the one
#: piece of skin in the region seen AGAINST the source rather than by it, and
#: the bar says so: the knuckles measure `dust` and `umber` at saturation
#: 0.18-0.48 where the face at the same luminance measures `ochre` at 0.72.
#: A hand between the eye and a lamp is a silhouette with a lit rim, and
#: painting it the same colour as a cheek is what made it read as a mitten.
#: (row, x from, (L, rung)...). `_B` marks the bail, which is hardware.
_B = -1
HAND_ON_BAIL = (
    (78, 85, ((85, _D), (69, _M))),
    (79, 84, ((93, _U), (120, _O), (93, _U), (69, _M))),
    (80, 84, ((76, _P), (93, _U), (69, _P), (120, _O))),
    (81, 84, ((48, _D), _B, _B, (40, _U))),
)


def _arm(brush: _Brush, ctx: layout.Ctx) -> None:
    swing = ctx.swing
    for y, x_from, cells in (SLEEVE_TOP, SLEEVE_UNDER):
        for offset, (value, rung) in enumerate(cells):
            brush.put(x_from + offset + swing, y, _turn(ctx, rung, value))
    for y, x_from, cells in HAND_ON_BAIL:
        for offset, cell in enumerate(cells):
            x = x_from + offset + swing
            # §8. Two pixels of wire. Without them the lantern is not being
            # carried, it is floating.
            if cell == _B:
                brush.put(x, y, _gold(ctx, 1))
            else:
                brush.put(x, y, _turn(ctx, cell[1], cell[0]))


# ---------------------------------------------------------------------------
# 10j-k. Trousers and boots
# ---------------------------------------------------------------------------
#
# The legs part at y=98 and the coat parts with them; below that everything
# is between L 1 and L 33 except the boot tops. The right boot is set forward
# and one pixel wider, and the left boot's toe runs three pixels further left
# than the trouser above it — which is the only thing in the region that says
# he is standing at an angle rather than facing the camera.
#
# (row, left, right) inclusive, per leg.

LEFT_LEG = ((98, 95, 99), (99, 95, 99), (100, 95, 98), (101, 95, 98),
            (102, 95, 98), (103, 94, 98), (104, 94, 97), (105, 92, 97))
RIGHT_LEG = ((98, 102, 106), (99, 102, 106), (100, 102, 106), (101, 103, 107),
             (102, 103, 107), (103, 104, 107), (104, 104, 107), (105, 103, 107))

#: The near leg's outer edge turns toward the lamp and takes a warm step; the
#: far leg's inner edge only catches the wedge behind it and takes half of
#: one. Measured: x=95 down the left leg runs 31-34 while x 102-103 down the
#: right runs 19-28. (mud step above the boot, mud step at and below it).
LEG_EDGE = {"near": (35, 23), "far": (23, 18)}

#: Trousers take the deep tier, boots take the black one, and the join is a
#: row rather than a fade: measured, the trouser at y=102 runs L 15-29 and the
#: boot at y=104 runs L 7-13. (row from, umber step).
#:
#: UMBER AND NOT GREY, WHICH IS WHERE HIS COAT STOPS. The study's cold below
#: the ground line is the wet ruts and THE COAT; it is not the trousers. On
#: the bar, x 95-107 across y 98-102 measures R-B +26.5 — as warm as the road
#: he is standing on — against the coat's own +6.5 twenty rows above. He is
#: knee-deep in the pool and the light comes back up off it, which is the one
#: place on the whole figure the lamp reaches by bouncing. Drawn in grey these
#: rows measured +15.6, and at L 15-30 that is the difference between black
#: boots on brown ground and a pair of blue-grey posts.
#:
#: The steps are chosen at MATCHED VALUE, so this is a hue change and nothing
#: else: umber 3 is L 25.5 against grey 1's 24.5, umber 1 is L 14.4 against
#: grey 0's 16.0. The lamp-side column of each leg keeps one warm mud step on
#: top of that so the boots do not read as holes.
#:
#: THE BANDS ARE A VALUE AND THE CLOTH IS A CHROMA, same as the coat above
#: it. Measured across the trouser at a fixed luminance the bar runs `umber`,
#: `mud` and `dust` in adjacent pixels — 25, 27 and 25 — so the trouser
#: mottles between three families and the boot below it, at 9 to 14, mottles
#: between the two that reach that low. (row from, L, chroma rung).
LEG_BANDS = ((98, 25, _U), (100, 25, _U), (103, 14, _U))
#: One pixel in four, the same coin toss the coat takes. Lower than the
#: coat's because the legs are half the coat's height and twice its contrast
#: — the boots are read against road at L 86-123 and a mottle that shows on a
#: shoulder is a hole in a boot.
LEG_CHROMA_JITTER = 0.25
BOOT_CORE_FROM = 103
#: Each leg carries a dark seam and it is what stops the trousers reading as
#: two grey posts. On the near leg it is the edge facing the lit wedge, two
#: columns wide the whole way down; on the far leg it is a single column that
#: swings outward below the knee as the leg turns. Measured, both run L 1-20
#: against 15-41 across the rest of the leg. (row, x from, x to).
LEG_SEAM = {
    "near": ((98, 98, 99), (99, 98, 99), (100, 97, 98), (101, 97, 98),
             (102, 97, 98)),
    "far": ((98, 104, 105), (99, 105, 105), (100, 105, 105), (101, 106, 107),
            (102, 106, 107)),
}
#: The boots' darkest, and it is NOT the frame's black. Measured pixel by
#: pixel at those thirteen positions the bar reads 8, 8, 11, 12, 12, 15, 11,
#: 12, 14, 8, 12, 11, 8, 12 — every one of them in 8-15, which is `umber` 0
#: at L 9.2 and not `void` at L 0. §7 offers either and the bar picks; the
#: whole-frame study §1 is the reason it matters, because true near-black
#: (Y < 6) is 1.73% of the frame in components whose largest is the coach
#: doorway, and thirteen pixels of it spent on a pair of boots is thirteen
#: pixels the doorway no longer owns. This was drawn at L 0 and read 8 to 15
#: luminance under the bar the whole way across.
#:
#: The black that IS here is x=99's coat opening, which the bar measures at
#: L 1-6, and the far leg's seam below. (row, x from, x to).
#:
#: AND THEY ARE NOT ONE VALUE EITHER. That same pixel-by-pixel measurement —
#: 8, 8, 11, 12, 12, 15, 11, 12, 14, 8, 12, 11, 8, 12 — is quoted above as
#: proof that the boots are not void, and it is equally proof that they are
#: not one entry: it spans seven luminance and umber 0 is one of them. Leather
#: against ground at L 86-123 is the highest-contrast edge on the figure, and
#: a seven-point wobble inside it is the difference between a boot and a hole
#: cut in the road. Two entries, `umber` 0 and 1 at 9 and 14, mottled at the
#: rate the measurement carries — six of its fourteen pixels sit above 11.
BOOT_CORE = ((103, 97, 97), (104, 96, 97), (105, 93, 97),
             (103, 106, 106), (104, 106, 107), (105, 105, 107))
BOOT_MOTTLE = 0.40


def _legs(brush: _Brush, ctx: layout.Ctx) -> None:
    # umber 0, L 9.2 — the bottom of a warm ramp rather than the absence of
    # one. `dark_pocket` is the material this file already steps for the
    # hood's shadow; one step under it is the darkest warm entry there is.
    boot_black = _umber(ctx, 0)
    rng = ctx.stream("hob legs")
    for rows, side in ((LEFT_LEG, "near"), (RIGHT_LEG, "far")):
        above, below = LEG_EDGE[side]
        for y, left, right in rows:
            value, rung = 18, _U
            for band_y, band_value, band_rung in LEG_BANDS:
                if y >= band_y:
                    value, rung = band_value, band_rung
            for x in range(left, right + 1):
                index = _turn(ctx, rung, value)
                if rng.random() < LEG_CHROMA_JITTER:
                    index = _nudge(ctx, index, rung, rng)
                brush.put(x, y, index)
            # One warm pixel down the lamp side of each leg. The deep tier,
            # not the mid one: it is a turn toward the light, not a highlight.
            brush.put(left, y, _turn(ctx, _M, above if y < BOOT_CORE_FROM else below))
        # The far leg's seam is the one true dark on this half of him: the bar
        # measures it 2, 3, 3, 8, 8, 9, 12, 14 down x 104-107 where the near
        # leg's own seam sits at 12-20. The near seam is grey 0 and reads; the
        # far one at grey 0 was eight luminance light along its whole length,
        # which is the gap between boot and hem going missing.
        seam = _umber(ctx, 1) if side == "near" else boot_black
        for y, x_from, x_to in LEG_SEAM[side]:
            brush.run(y, x_from, x_to, seam)
    # §1's third job. These thirteen pixels sit against road the lamp has
    # taken to L 86-122, a separation of seventy to a hundred and fifteen
    # points. It is the largest contrast anywhere on the figure and it is
    # what plants him.
    boot_lift = _umber(ctx, 1)
    for y, x_from, x_to in BOOT_CORE:
        for x in range(x_from, x_to + 1):
            brush.put(x, y, boot_lift if rng.random() < BOOT_MOTTLE else boot_black)


# ---------------------------------------------------------------------------
# 8. THE LIT WEDGE BETWEEN HIS LEGS
# ---------------------------------------------------------------------------
#
# §1's third job and §10.7's most likely loss. Five of the frame's L 123
# pixels are here — (99-102, 103) and (99, 104) — in a hard-edged wedge four
# pixels wide with a lit throat running up between the coat's skirts to y=98.
# It is the figure's only contact with the ground and it is the first thing a
# tidy silhouette pass fills in.
#
# It is painted rather than lifted because the fitted pool does not predict
# it: at (100, 103) the falloff gives ρ = 7.1 and L ≈ 69, and the bar
# measures 122. The light between his legs is the lamp seen almost end-on
# down a corridor, and no smooth field reproduces that.
#
# Measured, as mud steps (13:84 15:100 18:122), row by row, left to right.

# AND IT IS THE GOLDEST GROUND IN THE FRAME, which is the other half of why
# it reads. §7 offers `ochre` 12-13 for the pool core "if a more golden note
# is wanted", and here it is not wanted, it is measured: the bar runs this
# wedge at saturation 0.62-0.72 against the open road's 0.42-0.49 either side
# of it. Lamplight seen almost end-on down a corridor is the least diluted
# light on the ground anywhere, and painting the wedge in the same `mud` as
# the road it interrupts is what made five top-value pixels read as a bright
# patch of road rather than as a hole through to the lamp.
#
# The throat's own top value stays on `mud` 18 at L 123 and does NOT go to
# ochre 13. §3: the pool core has to stay at or below 123 so the reserved
# band can stand above it, and ochre 13 is 126 and is the town's ceiling.
# (row, x from, (L, rung)...).

WEDGE = (
    (98, 100, ((61, _P), (66, _P))),
    (99, 100, ((77, _P), (77, _P))),
    (100, 99, ((49, _P), (85, _O), (77, _P))),
    (101, 99, ((85, _O), (85, _O), (85, _O), (61, _P))),
    (102, 99, ((85, _O), (77, _P), (73, _P), (77, _P))),
    (103, 99, ((123, _M), (123, _M), (123, _M), (123, _M), (61, _P))),
    (104, 99, ((123, _M), (101, _U), (85, _O), (85, _O), (66, _P))),
    (105, 98, ((44, _M), (44, _M), (44, _M), (44, _M), (39, _P))),
)


def _wedge(brush: _Brush, ctx: layout.Ctx) -> None:
    for y, x_from, cells in WEDGE:
        for offset, (value, rung) in enumerate(cells):
            brush.put(x_from + offset, y, _turn(ctx, rung, value))


# ---------------------------------------------------------------------------
# 9. THE CONTACT ROW
# ---------------------------------------------------------------------------
#
# ONE ROW, y=106, x 94-108, and §9 assigns it to this region. It measures
# L 25-48 on the bar where the pool model wants 77 — about four ramp steps
# down, the width of both boots, and gone by y=107 which comes straight back
# to L 86 across the whole width. There is no other shadow anywhere near him
# (§6): no directional cast, no silhouette wedge, nothing right of him but the
# occlusion notch, which stays a subtraction.
#
# THIS WAS LEFT TO `lightpass` AND `lightpass` CANNOT DO IT. That pass scales
# the pool's EXCESS by a quarter across this span, which is the right physical
# model and the right thing for the notch — but the excess is what the lamp
# ADDS, and the road underneath is already authored at its own depth value. A
# multiplier on the increment can take the row down to the bare road and no
# further, and the bare road there is not dark enough: measured on the
# composite the row came out at a mean of 66 against the bar's 37, brighter
# than the lit ground two rows below it in places. A contact shadow that is
# lighter than what it sits on is not a contact shadow.
#
# So the row is authored, at the values the bar has, and shielded — which also
# takes it out of `lightpass`'s reach so the two are not fighting over it.
# Measured x 94→108: 32 36 42 38 41 38 41 49 41 35 26 24 36 38 42, which is
# mud 4 5 6 5 6 5 6 7 6 4 3 2 5 5 6 to within two luminance everywhere.
#
# It is a BAND, not a boot sole. The reference's darkest pixels in the feet
# are a row higher, at y 103-105; this row is the ground the boots meet, and
# it runs three pixels wider than they do on each side.

#: §2.9 gives the span as x 94-108; the bar carries it two pixels further
#: left, under the near boot's toe, which runs three columns out past the
#: trouser above it — x=93 measures 39 and x=92 measures 59 against a pool
#: that is at 97 by x=91. Those two are the band's shoulder and without them
#: the row starts with a 60-point step.
#:
#: It is `mud` down the middle where the boots meet it and it turns a rung
#: warmer at both ends, where the row runs back out into the lit road: the
#: bar measures the band's own shoulders at saturation 0.61-0.62 against
#: 0.47-0.51 under the soles. That is not decoration — a shadow whose ends
#: are the same colour as its middle is a painted bar, and this one has to
#: read as light being blocked. (L, chroma rung) per column from x=92.
CONTACT_Y = layout.HOB_CONTACT_ROW
CONTACT_X = 92
CONTACT = ((61, _P), (39, _P), (35, _U), (39, _M), (44, _M), (39, _M),
           (44, _M), (39, _M), (44, _M), (49, _P), (44, _U), (35, _M),
           (27, _M), (23, _U), (39, _M), (39, _M), (44, _M))


def _contact(brush: _Brush, ctx: layout.Ctx) -> None:
    for offset, (value, rung) in enumerate(CONTACT):
        x = CONTACT_X + offset
        # The road's standing water is `road`'s cycling element and its
        # bounds start at y=96, so it can reach this row. A reserved index is
        # never repainted, here or anywhere.
        if layout.keep(brush.canvas.get(x, CONTACT_Y)):
            continue
        brush.put(x, CONTACT_Y, _turn(ctx, rung, value))


# ---------------------------------------------------------------------------
# 12-16. The lantern
# ---------------------------------------------------------------------------
#
# §4: the falloff off the object is VIOLENT — 123 to 68 in four pixels. This
# is a hard-edged object with a bright interior, not a soft blob. Rows within
# three pixels of the flame centre are the glass; four is already the hood,
# the base and the air.
#
# Construction, top to bottom: bare hand gripping (drawn with the arm) → wire
# bail → dark hood → glass globe → base plate with a lit strip on its top row.
# The hood is the piece that makes it a lantern instead of a light: it is
# DARK, against its own glow, and it is what the eye reads as "this thing has
# a top".
#
# (row, x from, accent_gold steps 0-3 — never 4-7, which are the reserve.)

HOOD = (
    (82, 83, (1, 1, 0, 0, 0, 1)),
    (83, 83, (1, 0, 0, 0, 1, 1)),
    (84, 83, (0, 0, 1, 1, 0, 0)),
)
HOOD_DARK_ROW = 83
#: The hood's own shadow, umber-dark under the cap. Measured L 27-32 at
#: x 85-86 on y=83 against L 66 at either end of the same row.
HOOD_DARK = (85, 86)

#: The glass is TWO STEPS, not one. Measured across the globe's own rows the
#: frame columns and the corners sit at L 66-96 while the panes beside the
#: flame reach 122 — so a globe filled uniformly at accent_gold 3 is a
#: hundred-and-twelve-luminance rectangle with the fire drawn on it, and at
#: this size the rectangle is what the eye gets. Body at step 2, and step 3
#: only in the ring the flame actually lights.
GLOBE_ROWS = (85, 89)
GLOBE_X = (82, 89)
#: THE FRAME IS A POST, NOT FOUR CORNERS. Measured down x=87 through the
#: globe's own rows, the bar reads 67, 76, 87, 123, 76 — dark on four rows out
#: of five, with only the flame's widest row crossing it. That single column
#: is the whole reason the reference's lantern is a made thing with a wire
#: cage and a pane behind it rather than a lit ball: right of it, x=88 comes
#: back to the top value on three rows, so the eye gets glass, post, glass.
#: Four corner pixels do not do that, and this had four corner pixels while
#: the flame band ran straight through x=87 at 136-156 — the post was not
#: dark, it was the second-brightest thing in the region.
#:
#: x=89 is the globe's own right edge and reads one step under the post
#: (76, 97, 87, 76 down y 86-89). (x, y, gold step).
GLOBE_FRAME = ((83, 85, 1), (87, 85, 1),
               (87, 86, 1), (89, 86, 1),
               (87, 87, 2), (89, 87, 2),
               (87, 89, 1), (89, 89, 1))
#: (row from, row to, x from, x to). The lit panes bulge out to the frame on
#: the flame's own two rows — measured, x=82 runs 86, 86, 96, 122, 86 down
#: y 85-89, so the widest part of the glass is exactly level with the fire.
GLOBE_LIT = ((86, 88, 83, 88), (87, 88, 82, 88))

BASE = (
    (90, 82, (1, 1, 3, 3, 3, 2, 0, 1)),
    (91, 82, (0, 0, 1, 1, 1, 1, 0, 0)),
    # §7: the base plate reaches y=92 and that row is OUTSIDE the cycling
    # element's declared bounds (x 80-95, y 76-91), so it must be unreserved
    # gold or the bounds and the object disagree. It is hardware, so it is.
    (92, 82, (1, 1, 0, 0, 0, 0, 1, 0)),
)

#: §7's pixel budget, calibrated against the reference's 22 top-value globe
#: pixels: 10-14 px at accent_gold 4, 6-8 at step 5, 3-5 at step 6, 1-2 at
#: step 7. This build spends 10 / 6 / 4 / 1 — twenty-one, one under the
#: reference's twenty-two because the reference's last three are the base
#: plate's lit strip at y=90 and this build keeps the base in unreserved gold
#: (§7 puts the hardware at steps 0-3, and the strip is 10 L short rather
#: than absent). The ration is by COUNT, which is the only control §7 gives
#: us over how loud a band brighter than the whole frame is allowed to be.
#:
#: THE FOOTPRINT IS THE REFERENCE'S OWN TOP-VALUE MAP, not an ellipse:
#:
#:     x:  82 83 84 85 86 87 88 89
#:     y85  .  .  .  #  #  .  .  .
#:     y86  .  #  #  #  #  .  #  .
#:     y87  #  #  #  #  #  .  #  .
#:     y88  #  #  #  #  #  #  #  .
#:     y89  .  .  .  #  .  .  .  .
#:
#: A flame body at x 83-86 widening downward, a SEPARATE lit pane at x=88
#: seen past the frame post, the widest row at y=88 where the light spreads
#: across the base of the glass, and a single pixel at y=89. An ellipse was
#: drawn here before and it filled the post, closed the gap at x=87 and put
#: three pixels across y=89 — which is a glowing ball, and a lantern is not
#: one. (band position, x, y).
FLAME = (
    # step 7, L 204. One pixel, on the flame's own centre.
    (3, 85, 87),
    # step 6, L 181. Four, the core's cross.
    (2, 85, 86), (2, 84, 87), (2, 86, 87), (2, 85, 88),
    # step 5, L 156. Six.
    (1, 86, 86), (1, 83, 87), (1, 83, 88), (1, 84, 88), (1, 86, 88),
    (1, 85, 89),
    # step 4, L 136. Ten, and they carry the shape's outline — the pane at
    # x=88, the left edge at x=82, and the row that crosses the post at y=88.
    (0, 85, 85), (0, 86, 85), (0, 83, 86), (0, 84, 86), (0, 88, 86),
    (0, 82, 87), (0, 88, 87), (0, 82, 88), (0, 87, 88), (0, 88, 88),
)


def _lantern(brush: _Brush, ctx: layout.Ctx) -> None:
    swing = ctx.swing

    for y, x_from, steps in HOOD:
        for offset, step in enumerate(steps):
            brush.put(x_from + offset + swing, y, _gold(ctx, step))
    for x in HOOD_DARK:
        brush.put(x + swing, HOOD_DARK_ROW, ctx.ink("dark_pocket", 2))

    # The glass, under the flame. One family, two steps below the reserve, so
    # the object holds together and only the fire moves.
    top, bottom = GLOBE_ROWS
    for y in range(top, bottom + 1):
        brush.run(y, GLOBE_X[0] + swing, GLOBE_X[1] + swing, _gold(ctx, 2))
    for y_from, y_to, x_from, x_to in GLOBE_LIT:
        for y in range(y_from, y_to + 1):
            brush.run(y, x_from + swing, x_to + swing, _gold(ctx, 3))
    # The post goes down AFTER the panes it divides, and before the flame,
    # which crosses it on one row only.
    for x, y, step in GLOBE_FRAME:
        brush.put(x + swing, y, _gold(ctx, step))

    for y, x_from, steps in BASE:
        for offset, step in enumerate(steps):
            brush.put(x_from + offset + swing, y, _gold(ctx, step))

    band = layout.LAMP_BAND
    for position, x, y in FLAME:
        brush.put(x + swing, y, band[position])


# ---------------------------------------------------------------------------
# The halo — four hard rings, and then nothing
# ---------------------------------------------------------------------------
#
# §4, measured against the backdrop only: r 4→9 gives 79, 69, 55, 44, 39, 37
# on an ambient of 33-37. Four rings and it is over. §10.4: the airborne halo
# dies by r ≈ 8 and is ENTIRELY ABSENT above the hand — straight up the
# column is interrupted rather than graded, and by y=77 the backdrop is
# already at ambient — so this is floored at y=81 and never climbs.
#
# It brightens and never darkens. The left fence's rail runs into the glow at
# about x=80 and its own lit top row measures 58-82 there; overwriting it
# with a ring value would flatten a neighbour's structure to paint air.

HALO_FLOOR_Y = 81
HALO_ASPECT = 1.15                        # slightly wide, as the rings measure
#: (outer radius, mud step). §4's ring table is a mean over ALL directions,
#: and most of what it averages is the lit ground under the lamp — sampled in
#: the air alone, beside and above the globe, the same radii measure 75, 55,
#: 40 and 37 rather than 79, 69, 55 and 44. The air gets the air's numbers;
#: the ground is `lightpass`'s pool and arrives from underneath.
#:
#: AND THE RINGS DO NOT GO UP. Re-measured per radius over air and taken at
#: face value they read 72 / 65 / 55 / 47 out to r=8, which is a step and a
#: ring more than these — but that measurement is contaminated and raising
#: them to it is worse, tested pixel by pixel against the bar: +168 luminance
#: of error over the 85 pixels it moves. The reason is that the glow ISN'T
#: CONCENTRIC. Up and to the left of the flame the bar is genuinely at 62-82
#: — but that is `left_yard`'s lit rail top and its post catching the lamp,
#: objects and not air. Down and to the right it is at 29-47, which is
#: ambient. A ring set fitted to the average of the two overshoots the whole
#: right half of the glow, and the right half is the half the man stands in.
HALO_RINGS = ((4.6, 11), (5.6, 8), (6.6, 6), (7.6, 4))


def _halo(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    cx, cy = layout.FLAME_CENTRE
    cx += ctx.swing
    palette = ctx.palette
    reach = int(HALO_RINGS[-1][0] * HALO_ASPECT) + 1
    bottom = min(cy + reach, layout.ROAD_TOP - 1)
    for y in range(max(HALO_FLOOR_Y, cy - reach), bottom + 1):
        for x in range(cx - reach, cx + reach + 1):
            dx = (x - cx) / HALO_ASPECT
            dy = y - cy
            radius = (dx * dx + dy * dy) ** 0.5
            step = None
            for outer, ring in HALO_RINGS:
                if radius <= outer:
                    step = ring
                    break
            if step is None:
                continue
            if ctx.is_shielded(x, y):
                continue
            index = _mud(ctx, step)
            standing = canvas.get(x, y)
            # Never move a cycling entry, and never dim what is already lit.
            if layout.keep(standing):
                continue
            if palette.luminance(standing) >= palette.luminance(index):
                continue
            canvas.put(x, y, index)
            ctx.shield(x, y)


# ---------------------------------------------------------------------------


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    brush = _Brush(canvas, ctx)
    with ctx.track(canvas, "hob"):
        # The air first, so the object goes down on top of its own glow and
        # every edge of it stays hard against the ring it sits in.
        _halo(canvas, ctx)
        _hat(brush, ctx)
        _face(brush, ctx)
        _coat(brush, ctx)
        _arm(brush, ctx)
        _legs(brush, ctx)
        # The ground between his legs goes down AFTER the legs, because it is
        # the hole they leave and not a shape beside them.
        _wedge(brush, ctx)
        # ...and the row he meets it on goes down after both, because it is
        # the ground the boots stand on and not a shape drawn beside them.
        _contact(brush, ctx)
        _lantern(brush, ctx)
