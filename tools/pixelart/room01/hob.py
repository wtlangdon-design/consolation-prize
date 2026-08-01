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

WHAT IS *NOT* PAINTED IS AS DELIBERATE AS WHAT IS. The contact row at y=106
and the occlusion notch behind him are left untouched, because hob.md §6 is
explicit that they are SUBTRACTIONS FROM THE POOL and not painted shapes —
`lightpass` attenuates the field there. Paint them and they stop tracking
the pool; the man acquires a shadow that does not move when the lamp does.

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

THE FLAME IS THE RESERVED BAND AND IT IS SMALL. accent_gold 4-7 measure
L 136/156/181/204 against a frame maximum of 123 everywhere else, so the
band is genuinely the brightest thing in the palette and it MOVES. §7: size
is the only control we have over how loud it is. Twenty-two to twenty-eight
pixels, total, inside x 82-89 / y 85-90 — a forty-pixel flame pulls the eye
off the man it is supposed to introduce and the cycle reads as a fault
light. This build spends twenty-three. The hardware around it takes
accent_gold 0-3, the same family one band below the reserve, so the object
holds together and only the flame moves.

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

_MUD_ANCHOR = layout.MATERIALS["hob_coat_lit"][1]        # mud 8, L 55
_GREY_ANCHOR = layout.MATERIALS["hob_coat"][1]           # grey 0, L 16
_OCHRE_ANCHOR = layout.MATERIALS["hob_face"][1]          # ochre 10, L 101
_GOLD_ANCHOR = layout.MATERIALS["lamp_hardware"][1]      # accent_gold 2, L 89


def _mud(ctx: layout.Ctx, step: int) -> int:
    """mud, the warm ground-and-lamplight family. 0:12 … 18:122."""
    return ctx.ink("hob_coat_lit", step - _MUD_ANCHOR)


def _grey(ctx: layout.Ctx, step: int) -> int:
    """grey, the cold family his far side melts into. 0:15 … 4:53."""
    return ctx.ink("hob_coat", step - _GREY_ANCHOR)


def _ochre(ctx: layout.Ctx, step: int) -> int:
    """ochre, skin. 0:25 … 12:117, and 12 is the top value on him."""
    return ctx.ink("hob_face", step - _OCHRE_ANCHOR)


def _gold(ctx: layout.Ctx, step: int) -> int:
    """accent_gold BELOW the reserve. 0:41 1:66 2:89 3:112. Never 4-7."""
    return ctx.ink("lamp_hardware", step - _GOLD_ANCHOR)


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

HAT_CROWN = (
    (71, 99, (2, 3, 0, 3)),          # measured 32 26 15 27
    (72, 97, (3, 0, 0, 0, 0, 0)),    # measured 34 15 13 11 8 12
)
HAT_BRIM_Y = 73
HAT_BRIM_X = 95
HAT_BRIM = (6, 4, 3, 2, 2, 3, 0, 0, 2, 4)
#: §8's first load-bearing single pixel. L 4, the darkest in the region, and
#: the reason the brim is a brim rather than a blob.
HAT_FAR_TIP = (103, 74)


def _hat(brush: _Brush, ctx: layout.Ctx) -> None:
    for y, x_from, steps in HAT_CROWN:
        for offset, step in enumerate(steps):
            brush.put(x_from + offset, y, _mud(ctx, step))
    for offset, step in enumerate(HAT_BRIM):
        brush.put(HAT_BRIM_X + offset, HAT_BRIM_Y, _mud(ctx, step))
    brush.put(*HAT_FAR_TIP, ctx.ink("shadow_slot"))
    # The shadow the brim throws on his own forehead, one pixel left of the
    # face proper. Without it the brim floats off the head.
    brush.put(95, 74, _mud(ctx, 1))


# ---------------------------------------------------------------------------
# 10c-d. The face
# ---------------------------------------------------------------------------
#
# Seven by six, and §10.12 says anything more than this becomes a mask. The
# eyes are NOT DRAWN — they are the gap between the brim shadow across y=74
# and the cheek at y=75. The moustache is a two-pixel darkening of x 97-98 on
# y=76 while the cheek beside it stays at the top value.
#
# Measured x 96→102, rows 74→79, as ochre steps (0:25 1:34 2:39 3:47 4:52
# 5:61 6:68 7:76 8:84 9:92 10:101 11:109 12:117). Two pixels are below the
# bottom of ochre and take mud instead: `_D` is mud 0 at L 12, the socket
# under the brim, and `_d` is mud 2 at L 23, the shadow beside the moustache.
# `_C` is the collar and is dealt with separately — it is the one cool pixel.

_D = -1
_d = -2
_C = -3

FACE_X = 96
FACE_Y = 74
FACE = (
    (1, 8, _D, 8, 2, 3, 3),      # brim shadow, with two lit pixels punched through
    (5, 12, 9, 12, 7, 8, 6),     # the widest lit band, and two of the five top pixels
    (3, 4, 5, 9, 12, 4, 0),      # the moustache darkens 97-98; the cheek stays hot
    (1, 6, 12, 8, 8, 2, 0),      # jaw
    (2, _d, 5, 8, 8, 3, 0),      # jaw
    (2, 1, _C, 12, 2, 1, 0),     # chin, and the collar
)


def _face(brush: _Brush, ctx: layout.Ctx) -> None:
    for row, steps in enumerate(FACE):
        for column, step in enumerate(steps):
            x, y = FACE_X + column, FACE_Y + row
            if step == _D:
                brush.put(x, y, _mud(ctx, 0))
            elif step == _d:
                brush.put(x, y, _mud(ctx, 2))
            elif step == _C:
                # §8. The ONLY cool-neutral pixel on the figure: L 82 at
                # saturation 0.30 against the face's 0.59. It sets the chin
                # off the coat, and warming it fuses the head to the body.
                brush.put(x, y, ctx.ink("hob_collar"))
            else:
                brush.put(x, y, _ochre(ctx, step))


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
COAT_COLUMNS = (
    (99, "g", 3),
    (100, "g", 3), (101, "g", 4), (102, "g", 3), (103, "g", 3), (104, "g", 1),
    (105, "g", 2), (106, "g", 3), (107, "g", 1), (108, "g", 1),
)
COAT_COLUMNS_SKIRT = (
    (99, "g", 3),
    (100, "g", 3), (101, "g", 2), (102, "g", 3), (103, "g", 3), (104, "g", 2),
    (105, "g", 1), (106, "g", 1), (107, "g", 0), (108, "g", 0),
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
COAT_SHOULDER = ((99, 3), (100, 2), (101, 2), (102, 3), (103, 3), (104, 3),
                 (105, 2), (106, 0), (107, 1), (108, 1))
COAT_SHOULDER_ROWS = (80, 81)

#: §8. x=99 for eight rows, widening to three by the hem — the coat's front
#: opening, the only interior line on it, and what stops him reading as a
#: bell. (row from, row to, x from, x to), and it goes to void below y=89
#: where the reference measures L 1.
COAT_OPENING_CORE = (82, 97)              # x=99, and void from y=90 down
COAT_OPENING_VOID_FROM = 90
#: It flares to three by the hem, but the two outer columns are grey 0 rather
#: than void: measured, x=99 runs L 1 through the skirt while x 98 and 100 sit
#: at 7-20. One black line with two dark ones beside it, not a black bar.
COAT_OPENING_FLARE = ((91, 97, 98), (92, 97, 100))

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

#: §8. One pixel of brass at L 87 on an otherwise dead-dark shoulder, and the
#: only ornament he has. accent_gold 2 — the same family as the lamp, three
#: bands under the reserve, so it can never be mistaken for the flame.
BRASS_PATCH = (102, 82)

#: §8. Two pixels at the top value, eighteen rows below the face and on the
#: DARK side of him. They are what tells the eye there is a second arm, and
#: they are the only reason his right side has any structure at all.
#: (row, x from, ochre steps).
RIGHT_HAND = (
    (89, 106, (6, 4, 1)),
    (90, 105, (5, 12, 12, 4)),
    (91, 106, (6, 8, 1)),
)


def _coat(brush: _Brush, ctx: layout.Ctx) -> None:
    cold = {x: _grey(ctx, step) for x, key, step in COAT_COLUMNS if key == "g"}
    skirt = {x: _grey(ctx, step) for x, key, step in COAT_COLUMNS_SKIRT}
    shoulder = {x: _grey(ctx, step) for x, step in COAT_SHOULDER}
    lampside = {}
    for y_from, y_to, steps in COAT_LAMPSIDE:
        for y in range(y_from, y_to + 1):
            lampside[y] = steps

    # §6 of the whole-frame study: the mid-ground is 0.0% flat. Flat columns
    # would read as corduroy, so one pixel in four steps once along its own
    # family — never more, because two steps at this size is a fold and he
    # has no folds.
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
                index = _mud(ctx, step)
            else:
                index = far[x]
            if rng.random() < 0.22:
                index = ctx.palette.darken(index, 1) if rng.random() < 0.5 \
                    else ctx.palette.lighten(index, 1)
            brush.put(x, y, index)

    top, bottom = COAT_OPENING_CORE
    for y in range(top, bottom + 1):
        brush.put(99, y, ctx.ink("shadow_slot") if y >= COAT_OPENING_VOID_FROM
                  else _grey(ctx, 0))
    for y_from, y_to, x in COAT_OPENING_FLARE:
        for y in range(y_from, y_to + 1):
            brush.put(x, y, _grey(ctx, 0))

    brush.put(*BRASS_PATCH, _gold(ctx, 2))

    for y, x_from, steps in RIGHT_HAND:
        for offset, step in enumerate(steps):
            brush.put(x_from + offset, y, _ochre(ctx, step))


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

SLEEVE_TOP = (81, 91, (7, 7, 7, 6))       # y, x from, mud steps
SLEEVE_UNDER = (82, 88, (8, 8, 6, 2, 6, 5))

#: §4's construction, and it is a hand rather than a mitten: two pixels reach
#: the top value and everything else falls away fast. (row, x from, ochre
#: steps). -1 marks the bail, which is hardware, not skin.
_B = -1
HAND_ON_BAIL = (
    (78, 85, (8, 6)),
    (79, 84, (9, 12, 9, 6)),
    (80, 84, (7, 9, 6, 12)),
    (81, 84, (3, _B, _B, 2)),
)


def _arm(brush: _Brush, ctx: layout.Ctx) -> None:
    swing = ctx.swing
    for y, x_from, steps in (SLEEVE_TOP, SLEEVE_UNDER):
        for offset, step in enumerate(steps):
            brush.put(x_from + offset + swing, y, _mud(ctx, step))
    for y, x_from, steps in HAND_ON_BAIL:
        for offset, step in enumerate(steps):
            x = x_from + offset + swing
            # §8. Two pixels of wire. Without them the lantern is not being
            # carried, it is floating.
            brush.put(x, y, _gold(ctx, 1) if step == _B else _ochre(ctx, step))


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
LEG_EDGE = {"near": (4, 2), "far": (2, 1)}

#: Trousers take the deep tier, boots take the black one, and the join is a
#: row rather than a fade: measured, the trouser at y=102 runs L 15-29 and the
#: boot at y=104 runs L 7-13. (row from, grey step). The lamp-side column of
#: each leg keeps one warm step so the boots do not read as holes.
LEG_BANDS = ((98, 1), (100, 1), (103, 0))
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
#: The boots' true black, measured at L 7-13 and nowhere else on the legs.
#: (row, x from, x to). Thirteen pixels; §1 of the whole-frame study is
#: explicit that near-black is scarce and placed.
BOOT_CORE = ((103, 97, 97), (104, 96, 97), (105, 93, 97),
             (103, 106, 106), (104, 106, 107), (105, 105, 107))


def _legs(brush: _Brush, ctx: layout.Ctx) -> None:
    black = ctx.ink("shadow_slot")
    for rows, side in ((LEFT_LEG, "near"), (RIGHT_LEG, "far")):
        above, below = LEG_EDGE[side]
        for y, left, right in rows:
            step = 1
            for band_y, band_step in LEG_BANDS:
                if y >= band_y:
                    step = band_step
            for x in range(left, right + 1):
                brush.put(x, y, _grey(ctx, step))
            # One warm pixel down the lamp side of each leg. The deep tier,
            # not the mid one: it is a turn toward the light, not a highlight.
            brush.put(left, y, _mud(ctx, above if y < BOOT_CORE_FROM else below))
        for y, x_from, x_to in LEG_SEAM[side]:
            brush.run(y, x_from, x_to, _grey(ctx, 0))
    # §1's third job. These thirteen pixels sit against road the lamp has
    # taken to L 86-122, a separation of seventy to a hundred and fifteen
    # points. It is the largest contrast anywhere on the figure and it is
    # what plants him.
    for y, x_from, x_to in BOOT_CORE:
        brush.run(y, x_from, x_to, black)


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

WEDGE = (
    (98, 100, (9, 10)),
    (99, 100, (12, 12)),
    (100, 99, (7, 13, 12)),
    (101, 99, (13, 13, 13, 9)),
    (102, 99, (13, 12, 11, 12)),
    (103, 99, (18, 18, 18, 18, 9)),
    (104, 99, (18, 15, 13, 13, 10)),
    (105, 98, (6, 6, 6, 6, 5)),
)


def _wedge(brush: _Brush, ctx: layout.Ctx) -> None:
    for y, x_from, steps in WEDGE:
        for offset, step in enumerate(steps):
            brush.put(x_from + offset, y, _mud(ctx, step))


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
#: The glass frame's corner posts, where the panes stop. Measured L 66-75 at
#: x 83 and 87 on the globe's top row and at x 87 and 89 on its bottom one —
#: four pixels, and they are the whole reason the globe reads as a made thing
#: with a frame rather than as a hole cut in the night. (row, x, gold step).
GLOBE_CORNERS = ((85, 83, 1), (85, 87, 1), (89, 87, 1), (89, 89, 1))
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
#: step 7. Painted outermost band first so each hotter one bites out of the
#: one under it — which is how a flame is shaped, and which lands the counts
#: at 10 / 8 / 4 / 1, twenty-three pixels in all, inside x 83-88 and y 85-89.
#: (band position, row, x from, x to), inclusive.
FLAME = (
    (0, 85, 84, 86), (0, 86, 83, 87), (0, 87, 83, 88), (0, 88, 83, 88),
    (0, 89, 84, 86),
    (1, 85, 85, 85), (1, 86, 84, 86), (1, 87, 84, 87), (1, 88, 84, 87),
    (1, 89, 85, 85),
    (2, 86, 85, 85), (2, 87, 85, 86), (2, 88, 85, 86),
    (3, 87, 85, 85),
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
    for y, x, step in GLOBE_CORNERS:
        brush.put(x + swing, y, _gold(ctx, step))

    for y, x_from, steps in BASE:
        for offset, step in enumerate(steps):
            brush.put(x_from + offset + swing, y, _gold(ctx, step))

    band = layout.LAMP_BAND
    for position, y, x_from, x_to in FLAME:
        brush.run(y, x_from + swing, x_to + swing, band[position])


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
HALO_RINGS = ((4.6, 11), (5.6, 8), (6.6, 6), (7.6, 4))


def _halo(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    cx, cy = layout.FLAME_CENTRE
    cx += ctx.swing
    palette = ctx.palette
    reach = int(HALO_RINGS[-1][0] * HALO_ASPECT) + 1
    for y in range(max(HALO_FLOOR_Y, cy - reach), cy + reach + 1):
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
        _lantern(brush, ctx)
