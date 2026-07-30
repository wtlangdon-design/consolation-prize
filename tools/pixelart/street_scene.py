"""Main Street, composed once and lit twice.

Room 2 (day) and Room 36 (dawn) are the same street. The composition is
shared and a Scheme may only substitute palette families and shift tones --
never branch in a way that consumes randomness, or the two rooms stop being
the same street. See rng_sync in proofs.py.

Vertical budget for 320x144, which is tight and had to be argued about:

    0  - 20   open sky, palest at the horizon
    14 - 32   far range: barely darker than the sky, crest dithered into it
    24 - 42   near range: greener, still lighter than any building
    18 - 44   parapets, deliberately ragged -- 33px to 59px of false front
    ~40- 56   porch awnings
    77        boardwalk deck
    77 - 86   the walk itself
    88 -144   mud, 56px, deep enough for a character to move in

Every building is a false front: a tall decorative board nailed to a shallow
shed. The parapets are stepped so the real roof shows in the notch above each
shoulder, and the roof is drawn wider than the facade so it shows in the
alleys too. That is the theme of the game as architecture and it is the
reason this street is drawn at all.

Sun is warm and from frame left. Everything that projects throws a shadow
right, and shadows are cast by stepping colours down their own family ramp.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field

from buildings import (
    balcony,
    dress_window,
    ghost_lettering,
    batwing_doors,
    cast_shadow,
    display_window,
    false_front,
    porch,
    signboard,
)
from canvas import IndexedCanvas
from clutter import crate_stack, lumber_stack, laundry_line, leaning_tools, rope_coil, sacks
from components import (
    barrel,
    boardwalk,
    ridge_range,
    door,
    hitching_rail,
    mud_street,
    sky_gradient,
    water_trough,
    window,
)
from dither import BAYER2, BAYER4, BAYER8, dither_pixel, speckle
from palette import Palette

WIDTH, HEIGHT = 320, 144

SKY_OPEN = 20         # nothing but sky above this
FAR_BASE = 36         # where the far range sits down
NEAR_BASE = 47        # where the near range sits down
HILL_BASE = NEAR_BASE
GROUND = 77           # top of the boardwalk deck
WALK_DEPTH = 9
POST_FOOT = GROUND + 7
STREET_TOP = GROUND + WALK_DEPTH + 2      # 88; leaves 56px of mud

ROOF_DROP = 5         # parapet centre to the real roof ridge behind it

SEED = 20250730


@dataclass
class Lot:
    kind: str
    x: int
    width: int
    parapet: int
    wall: str
    tone: float
    weathering: float
    awning: int
    posts: int
    shoulder_drop: int = 14
    detail: str = "quiet"          # 'busy' lots earn their clutter; the rest rest
    treatments: tuple[str, ...] = ()
    roof: str = "umber"


# Six businesses. Widths, parapet heights and detail are all deliberately
# uneven: Consolation was put up in a hurry by different people with
# different money, and a regular rhythm reads as wallpaper.
#
# Detail is concentrated at three places -- the store display, the saloon
# porch and the Company frontage. Everything else is deliberately quiet.
# The flat rests are not laziness; they are what lets the busy parts read.
LOTS = [
    Lot("store",      -8, 66, 36, "pine_weathered", 0.70, 1.0, 50, 4,
        shoulder_drop=12, detail="busy",  treatments=("shutters",)),
    Lot("newspaper",  64, 32, 24, "umber",          0.64, 1.0, 44, 2,
        shoulder_drop=14, detail="quiet", treatments=("blind",)),
    Lot("saloon",    100, 60, 32, "pine_fresh",     0.56, 1.0, 48, 4,
        shoulder_drop=14, detail="busy",  treatments=("curtain", "curtain")),
    Lot("company",   164, 50, 28, "bone",           0.74, 0.0, 46, 3,
        shoulder_drop=14, detail="busy",  treatments=("blind", "blind"), roof="grey"),
    Lot("hotel",     218, 56, 18, "pine_weathered", 0.72, 1.0, 54, 4,
        shoulder_drop=14, detail="quiet", treatments=("curtain", "shutters")),
    Lot("assay",     278, 50, 44, "umber",          0.70, 1.0, 56, 3,
        shoulder_drop=8,  detail="quiet", treatments=("boarded",)),
]

ALLEYS = [(58, 6, 0, 1), (96, 4, 1, 2), (160, 4, 2, 3), (214, 4, 3, 4), (274, 4, 4, 5)]


@dataclass
class Scheme:
    """How the street is lit. Families and tones only."""

    name: str
    sky_top: float
    sky_bottom: float
    far_hill: str
    far_tone: float
    near_hill: str
    near_tone: float
    ghost_lettering: bool
    facade_shift: float
    walk_base: float
    mud_shift: float
    grit_family: str
    steeple_shift: float
    alley_tone: float
    shadow_steps: int
    # Extra shift for pale facades. A cream building keeps its value when the
    # sky loses two thirds of its own, so at dawn it would out-light the sky
    # and invert the whole atmosphere. Caught by luminance_check.py.
    pale_shift: float = 0.0
    swap: dict[str, str] = field(default_factory=dict)

    def family(self, palette: Palette, name: str):
        return palette.family(self.swap.get(name, name))


DAY = Scheme(
    name="day",
    sky_top=0.54,
    sky_bottom=1.00,
    far_hill="sky",
    far_tone=0.84,
    near_hill="sage",
    near_tone=0.72,
    ghost_lettering=False,
    pale_shift=0.0,
    facade_shift=0.0,
    walk_base=0.62,
    mud_shift=0.0,
    grit_family="ochre",
    steeple_shift=0.0,
    alley_tone=0.17,
    shadow_steps=2,
)

DAWN = Scheme(
    name="dawn",
    sky_top=0.12,
    sky_bottom=0.58,
    far_hill="sky",
    far_tone=0.44,
    near_hill="sage",
    near_tone=0.50,
    ghost_lettering=True,
    pale_shift=-0.30,
    facade_shift=-0.15,
    walk_base=0.40,
    mud_shift=-0.13,
    grit_family="dust",
    steeple_shift=-0.18,
    alley_tone=0.06,
    shadow_steps=1,
    swap={
        "umber": "grey",
        "pine_fresh": "pine_weathered",
        "ochre": "dust",
        "accent_rust": "dust",
        "accent_red": "grey",
        "accent_gold": "dust",
    },
)


# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------


def distant_steeple(canvas: IndexedCanvas, x: int, base_y: int, palette: Palette, scheme: Scheme) -> None:
    """The church, several streets back, in the reclaimed sky."""
    dust = scheme.family(palette, "dust")
    shift = scheme.steeple_shift
    body = dust.frac(0.46 + shift)
    dark = dust.frac(max(0.03, 0.26 + shift))
    lit = dust.frac(0.62 + shift)

    tower_w, tower_h = 11, 20
    canvas.rect(x, base_y - tower_h, tower_w, tower_h, body)
    canvas.vline(x, base_y - tower_h, tower_h, lit)
    canvas.vline(x + tower_w - 1, base_y - tower_h, tower_h, dark)

    spire_h = 13
    apex_y = base_y - tower_h - spire_h
    for row in range(spire_h):
        inset = round((row / spire_h) * (tower_w // 2))
        span = max(1, tower_w - (tower_w // 2 - inset) * 2)
        left = x + (tower_w - span) // 2
        canvas.rect(left, apex_y + row, span, 1, body)
        canvas.put(left, apex_y + row, lit)
        canvas.put(left + span - 1, apex_y + row, dark)

    canvas.vline(x + tower_w // 2, apex_y - 4, 4, dark)
    canvas.rect(x + 3, base_y - tower_h + 4, 4, 6, dark)
    canvas.hline(x, base_y - tower_h, tower_w, lit)


def alley(canvas: IndexedCanvas, x: int, width: int, top: int, palette: Palette, scheme: Scheme) -> None:
    """The gap between two lots. Dark, never black -- and with the real shed
    roofs of both neighbours running back into it."""
    umber = scheme.family(palette, "umber")
    for row in range(top, GROUND):
        depth = (row - top) / max(1, GROUND - top)
        for col in range(x, x + width):
            dither_pixel(canvas, col, row, umber, max(0.02, scheme.alley_tone - depth * 0.05), BAYER2)
    canvas.vline(x - 1, top, GROUND - top, umber.frac(0.05))
    canvas.vline(x + width, top, GROUND - top, umber.frac(0.05))


# ---------------------------------------------------------------------------
# The six businesses
# ---------------------------------------------------------------------------


def storefront(
    canvas: IndexedCanvas,
    palette: Palette,
    scheme: Scheme,
    lot: Lot,
    rng: random.Random,
) -> None:
    """One building: false front, sign panel, openings, porch."""
    wall = scheme.family(palette, lot.wall)
    tone = max(0.06, lot.tone + scheme.facade_shift + (scheme.pale_shift if lot.wall == "bone" else 0.0))
    trim = scheme.family(palette, "bone") if lot.kind == "company" else wall

    shoulder_y = false_front(
        canvas,
        palette,
        lot.x,
        lot.parapet,
        lot.width,
        GROUND,
        wall,
        rng,
        wall_tone=tone,
        weathering=lot.weathering,
        roof_family=scheme.swap.get(lot.roof, lot.roof),
        shoulder_drop=lot.shoulder_drop,
        roof_drop=ROOF_DROP,
        trim=trim,
        battens=lot.kind != "company",
    )

    # Blank sign panel on the raised centre of the parapet -- where these
    # actually went. Geometry only; the engine draws the words.
    sign_w = lot.width - max(16, lot.width // 2)
    signboard(
        canvas,
        palette,
        lot.x + (lot.width - sign_w) // 2,
        lot.parapet + 6,
        sign_w,
        max(4, lot.shoulder_drop - 6),
        trim,
        tone=min(0.90, tone + (0.06 if lot.kind == "company" else 0.14)),
    )

    if scheme.ghost_lettering and lot.kind == "company":
        ghost_lettering(
            canvas,
            lot.x + (lot.width - sign_w) // 2,
            lot.parapet + 6,
            sign_w,
            max(4, lot.shoulder_drop - 6),
            trim,
            board_tone=min(0.90, tone + 0.06),
        )

    glass = scheme.family(palette, "grey")

    treatment_index = [0]

    def treat(wx: int, wy: int, ww: int, wh: int) -> None:
        """Applies this lot's next window treatment, if it has any left."""
        if treatment_index[0] >= len(lot.treatments):
            return
        dress_window(canvas, palette, wx, wy, ww, wh, wall,
                     lot.treatments[treatment_index[0]], rng, tone=tone)
        treatment_index[0] += 1

    open_top = lot.awning + 4
    open_h = GROUND - open_top
    # Door head tucks behind the awning; the porch is drawn later and overlaps it.
    door_top = lot.awning - 2
    door_h = GROUND - door_top

    if lot.kind == "store":
        display_window(canvas, palette, lot.x + 5, open_top + 6, 30, open_h - 8, wall, glass, rng, tone=tone + 0.14, glass_tone=0.38)
        door(canvas, lot.x + 44, door_top, 18, door_h, wall, rng, base=tone - 0.10)

    elif lot.kind == "newspaper":
        window(canvas, lot.x + 4, open_top + 4, 12, open_h - 12, wall, glass, rng, panes=(2, 2))
        treat(lot.x + 4, open_top + 4, 12, open_h - 12)
        door(canvas, lot.x + 18, door_top, 12, door_h, wall, rng, base=tone - 0.10)

    elif lot.kind == "saloon":
        batwing_doors(canvas, palette, lot.x + 22, door_top + 2, 18, door_h - 4, wall, rng, tone=tone - 0.04)
        window(canvas, lot.x + 5, open_top + 4, 13, open_h - 14, wall, glass, rng, panes=(2, 2))
        treat(lot.x + 5, open_top + 4, 13, open_h - 14)
        window(canvas, lot.x + 43, open_top + 4, 13, open_h - 14, wall, glass, rng, panes=(2, 2))
        treat(lot.x + 43, open_top + 4, 13, open_h - 14)

    elif lot.kind == "company":
        door(canvas, lot.x + 19, door_top, 16, door_h, wall, rng, base=tone - 0.18)
        window(canvas, lot.x + 4, open_top + 3, 12, open_h - 10, wall, glass, rng, panes=(2, 3))
        treat(lot.x + 4, open_top + 3, 12, open_h - 10)
        window(canvas, lot.x + 35, open_top + 3, 12, open_h - 10, wall, glass, rng, panes=(2, 3))
        treat(lot.x + 35, open_top + 3, 12, open_h - 10)

    elif lot.kind == "hotel":
        # Tall enough to have a real upper storey above the porch.
        window(canvas, lot.x + 8, shoulder_y + 2, 13, 17, wall, glass, rng, panes=(2, 3))
        treat(lot.x + 8, shoulder_y + 2, 13, 17)
        window(canvas, lot.x + 25, shoulder_y + 2, 13, 17, wall, glass, rng, panes=(2, 3), lit=True)
        window(canvas, lot.x + 42, shoulder_y + 2, 12, 17, wall, glass, rng, panes=(2, 3))
        treat(lot.x + 42, shoulder_y + 2, 12, 17)
        door(canvas, lot.x + 21, door_top, 16, door_h, wall, rng, base=tone - 0.12)
        window(canvas, lot.x + 5, open_top + 2, 12, open_h - 5, wall, glass, rng, panes=(2, 2))
        window(canvas, lot.x + 40, open_top + 2, 12, open_h - 5, wall, glass, rng, panes=(2, 2))

    else:  # assay
        door(canvas, lot.x + 16, door_top, 15, door_h, wall, rng, base=tone - 0.12)
        window(canvas, lot.x + 33, open_top + 2, 13, open_h - 5, wall, glass, rng, panes=(2, 2))
        treat(lot.x + 33, open_top + 2, 13, open_h - 5)


# ---------------------------------------------------------------------------
# Ground clutter
# ---------------------------------------------------------------------------


def dress_boardwalk(canvas: IndexedCanvas, palette: Palette, scheme: Scheme, rng: random.Random) -> None:
    """Goods stacked outside, because nothing here has a back room."""
    pine = scheme.family(palette, "pine_weathered")
    fresh = scheme.family(palette, "pine_fresh")
    umber = scheme.family(palette, "umber")
    bone = scheme.family(palette, "bone")
    grey = scheme.family(palette, "grey")
    dust = scheme.family(palette, "dust")
    deck = GROUND + 7

    # FOCAL POINT 1 -- the store display. Goods spill out onto the walk.
    sacks(canvas, palette, 2, deck, 3, dust, rng, tone=0.60)
    crate_stack(canvas, palette, 26, deck, fresh, rng, tone=0.56)
    lumber_stack(canvas, palette, 44, deck - 1, 15, 4, fresh, rng, tone=0.60)

    # The newspaper is quiet: one bundle by the door and nothing else.
    crate_stack(canvas, palette, 78, deck - 2, umber, rng, tone=0.44)

    # FOCAL POINT 2 -- the saloon porch.
    barrel(canvas, 104, deck - 16, 12, 16, fresh, grey, rng, base=0.46)
    barrel(canvas, 117, deck - 14, 11, 14, umber, grey, rng, base=0.40)
    barrel(canvas, 146, deck - 15, 11, 15, fresh, grey, rng, base=0.44)

    # FOCAL POINT 3 -- the Company frontage, detailed by being the only
    # swept, painted, empty stretch of walk on the street. That is the joke,
    # and it only works while the walk either side of it is full.

    # Hotel and assay office stay quiet: one prop each.
    rope_coil(canvas, palette, 250, deck, pine, rng, tone=0.54)
    leaning_tools(canvas, palette, 300, deck, 3, pine, grey, rng)

    # Washing over the hotel balcony rail. Somebody is living up there.
    laundry_line(canvas, palette, 226, 36, 40, pine, bone, rng)


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------


def compose(scheme: Scheme) -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("sky").frac(0.5))

    # -- air, and plenty of it ---------------------------------------------
    # Sky first, over the full height the terrace will later cover, and
    # lightest at the horizon. Then two ranges, each only slightly darker
    # than the air behind it. Nothing in the picture may out-light the sky:
    # the moment a hill or a wall does, the frame lids over.
    sky_gradient(canvas, 0, 0, WIDTH, NEAR_BASE + 14, palette.family("sky"),
                 top=scheme.sky_top, bottom=scheme.sky_bottom)
    ridge_range(canvas, palette.family(scheme.far_hill), scheme.far_tone,
                FAR_BASE, SKY_OPEN - 6, SKY_OPEN + 1, rng, step=24, feather=3)
    ridge_range(canvas, palette.family(scheme.near_hill), scheme.near_tone,
                NEAR_BASE, SKY_OPEN + 1, SKY_OPEN + 10, rng, step=16, feather=3)
    distant_steeple(canvas, 140, NEAR_BASE + 10, palette, scheme)

    # -- alleys first, so facades overlap their edges ----------------------
    for gap_x, gap_w, left, right in ALLEYS:
        alley(canvas, gap_x, gap_w, max(0, max(LOTS[left].parapet, LOTS[right].parapet) + ROOF_DROP),
              palette, scheme)

    # -- the terrace -------------------------------------------------------
    for lot in LOTS:
        storefront(canvas, palette, scheme, lot, rng)

    # -- boardwalk ---------------------------------------------------------
    pine = scheme.family(palette, "pine_weathered")
    boardwalk(canvas, 0, GROUND, WIDTH, WALK_DEPTH, pine, rng, base=scheme.walk_base)
    for col in range(WIDTH):
        canvas.put(col, GROUND, pine.frac(0.14))

    # -- porches, which shade the wall and the deck beneath them -----------
    for lot in LOTS:
        wall = scheme.family(palette, lot.wall)
        porch(canvas, palette, lot.x + 1, lot.awning, lot.width - 2, POST_FOOT, wall, rng,
              thickness=4, posts=lot.posts,
              tone=max(0.06, lot.tone + scheme.facade_shift + 0.04),
              post_tone=max(0.06, lot.tone + scheme.facade_shift - 0.12))

    # Sun rakes through each alley mouth onto the walk.
    for gap_x, gap_w, _, _ in ALLEYS:
        for row in range(GROUND + 1, GROUND + WALK_DEPTH):
            for col in range(gap_x + 2, gap_x + gap_w + 6):
                canvas.put(col, row, palette.lighten(canvas.get(col, row), 1))

    balcony(canvas, palette, 220, 46, 52, scheme.family(palette, "pine_weathered"), rng,
            tone=max(0.06, 0.52 + scheme.facade_shift))

    # -- goods, tools, washing ---------------------------------------------
    dress_boardwalk(canvas, palette, scheme, rng)

    # -- street ------------------------------------------------------------
    mud_street(canvas, 0, STREET_TOP, WIDTH, HEIGHT - STREET_TOP, palette.family("mud"), rng,
               grit=palette.family(scheme.grit_family), tone_shift=scheme.mud_shift)

    hitching_rail(canvas, 96, STREET_TOP + 12, 46, 12, pine, rng, base=max(0.06, 0.38 + scheme.facade_shift))
    water_trough(canvas, 214, STREET_TOP + 18, 40, 12, pine, palette.family("sky"), rng,
                 base=max(0.06, 0.34 + scheme.facade_shift))

    # The walk throws its own shadow onto the mud, offset right with the sun.
    cast_shadow(canvas, palette, 2, STREET_TOP, WIDTH, 3, steps=2, soft_edge=2)

    # -- boot churn, ruts and standing water in the lower third ------------
    mud = palette.family("mud")
    churn_top = STREET_TOP + 1
    for _ in range(85):
        col = rng.randrange(WIDTH)
        row = churn_top + rng.randrange(0, 7)
        canvas.put(col, row, mud.frac(max(0.04, 0.18 + scheme.mud_shift)))
        canvas.put(col + 1, row, mud.frac(max(0.06, 0.34 + scheme.mud_shift)))

    lower = STREET_TOP + (HEIGHT - STREET_TOP) * 2 // 3
    for _ in range(5):
        rut_x = rng.randrange(-10, WIDTH - 30)
        rut_y = lower + rng.randrange(0, HEIGHT - lower - 2)
        length = rng.randrange(34, 96)
        # A rut is a depression, not a line: a lit lip where the wheel threw
        # the mud up, a dark trough, and a dimmer far lip. Drawn as three
        # values it reads as a hollow; drawn as one it reads as a scratch.
        for col in range(length):
            drift = (col // 24) % 2
            base_row = rut_y + drift
            canvas.put(rut_x + col, base_row - 1, mud.frac(max(0.08, 0.56 + scheme.mud_shift)))
            canvas.put(rut_x + col, base_row, mud.frac(max(0.03, 0.12 + scheme.mud_shift)))
            canvas.put(rut_x + col, base_row + 1, mud.frac(max(0.03, 0.08 + scheme.mud_shift)))
            canvas.put(rut_x + col, base_row + 2, mud.frac(max(0.05, 0.34 + scheme.mud_shift)))

    for _ in range(4):
        pool_w = rng.randrange(16, 40)
        pool_h = rng.randrange(3, 6)
        pool_x = rng.randrange(0, WIDTH - pool_w)
        pool_y = lower + rng.randrange(0, max(1, HEIGHT - lower - pool_h))
        for row in range(pool_h):
            inset = abs(row - pool_h // 2)
            for col in range(inset, pool_w - inset):
                dither_pixel(canvas, pool_x + col, pool_y + row, palette.family("sky"), 0.16, BAYER2)
        canvas.hline(pool_x + 2, pool_y, max(1, pool_w - 4), palette.family("sky").frac(0.38))

    speckle(canvas, 0, HEIGHT - 16, WIDTH, 16, mud.frac(max(0.04, 0.16 + scheme.mud_shift)), rng, 0.03)

    return canvas, palette
