"""Main Street, composed once and lit twice.

Room 2 (day) and Room 36 (dawn) are the same street. The composition is
shared and a Scheme may only substitute palette families and shift tones --
never branch in a way that consumes randomness, or the two rooms stop being
the same street. See rng_sync in proofs.py.

Vertical budget for 320x144, which is tight and had to be argued about:

    0  - 32   sky and distant hills, unbroken across most of the width (22%)
    30 - 44   false-front parapets stand against it; the hotel alone goes high
    ~56- 68   porch awnings, varying per building
    104       boardwalk deck
    104-114   the walk itself
    116-144   mud (28px, trimmed back from 36)

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
    distant_hills,
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

HILL_BASE = 32        # ridges sit down here; the true horizon is behind the terrace
GROUND = 108          # top of the boardwalk deck
WALK_DEPTH = 10
POST_FOOT = GROUND + 8
STREET_TOP = GROUND + WALK_DEPTH + 2

SHOULDER_DROP = 18    # parapet centre to shoulder: the sign panel
ROOF_DROP = 8         # parapet centre to the real roof ridge behind it

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
    roof: str = "umber"


# Six businesses, six widths, no two alike. The Improvement Company is cream
# and everything either side of it is weathered grey-brown -- it reads as
# expensive because it is the only maintained thing on the street.
LOTS = [
    Lot("store",      -8, 66, 38, "pine_weathered", 0.70, 1.0, 66, 4),
    Lot("newspaper",  64, 32, 30, "umber",          0.64, 1.0, 70, 2),
    Lot("saloon",    100, 60, 36, "pine_fresh",     0.56, 1.0, 62, 4),
    Lot("company",   164, 50, 32, "bone",           0.84, 0.0, 68, 3, roof="grey"),
    Lot("hotel",     218, 56, 10, "pine_weathered", 0.72, 1.0, 72, 4),
    Lot("assay",     278, 50, 42, "umber",          0.70, 1.0, 68, 3),
]

ALLEYS = [(58, 6, 0, 1), (96, 4, 1, 2), (160, 4, 2, 3), (214, 4, 3, 4), (274, 4, 4, 5)]


@dataclass
class Scheme:
    """How the street is lit. Families and tones only."""

    name: str
    sky_top: float
    sky_bottom: float
    hill_family: str
    haze_tone: float
    facade_shift: float
    walk_base: float
    mud_shift: float
    grit_family: str
    steeple_shift: float
    alley_tone: float
    shadow_steps: int
    swap: dict[str, str] = field(default_factory=dict)

    def family(self, palette: Palette, name: str):
        return palette.family(self.swap.get(name, name))


DAY = Scheme(
    name="day",
    sky_top=0.40,
    sky_bottom=0.97,
    hill_family="sage",
    haze_tone=0.70,
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
    hill_family="pine_green",
    haze_tone=0.30,
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
    tone = max(0.06, lot.tone + scheme.facade_shift)
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
        shoulder_drop=SHOULDER_DROP,
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
        SHOULDER_DROP - 8,
        trim,
        tone=min(0.90, tone + (0.06 if lot.kind == "company" else 0.14)),
    )

    glass = scheme.family(palette, "grey")
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
        door(canvas, lot.x + 18, door_top, 12, door_h, wall, rng, base=tone - 0.10)

    elif lot.kind == "saloon":
        batwing_doors(canvas, palette, lot.x + 22, door_top + 2, 18, door_h - 4, wall, rng, tone=tone - 0.04)
        window(canvas, lot.x + 5, open_top + 4, 13, open_h - 14, wall, glass, rng, panes=(2, 2))
        window(canvas, lot.x + 43, open_top + 4, 13, open_h - 14, wall, glass, rng, panes=(2, 2))

    elif lot.kind == "company":
        door(canvas, lot.x + 19, door_top, 16, door_h, wall, rng, base=tone - 0.18)
        window(canvas, lot.x + 4, open_top + 3, 12, open_h - 10, wall, glass, rng, panes=(2, 3))
        window(canvas, lot.x + 35, open_top + 3, 12, open_h - 10, wall, glass, rng, panes=(2, 3))

    elif lot.kind == "hotel":
        # Tall enough to have a real upper storey above the porch.
        window(canvas, lot.x + 8, shoulder_y + 2, 13, 17, wall, glass, rng, panes=(2, 3))
        window(canvas, lot.x + 25, shoulder_y + 2, 13, 17, wall, glass, rng, panes=(2, 3), lit=True)
        window(canvas, lot.x + 42, shoulder_y + 2, 12, 17, wall, glass, rng, panes=(2, 3))
        door(canvas, lot.x + 21, door_top, 16, door_h, wall, rng, base=tone - 0.12)
        window(canvas, lot.x + 5, open_top + 4, 12, open_h - 12, wall, glass, rng, panes=(2, 2))
        window(canvas, lot.x + 40, open_top + 4, 12, open_h - 12, wall, glass, rng, panes=(2, 2))

    else:  # assay
        door(canvas, lot.x + 16, door_top, 15, door_h, wall, rng, base=tone - 0.12)
        window(canvas, lot.x + 33, open_top + 4, 13, open_h - 12, wall, glass, rng, panes=(2, 3))


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

    # In front of the general store: sacks, crates and cut lumber.
    sacks(canvas, palette, 2, deck, 3, dust, rng, tone=0.60)
    crate_stack(canvas, palette, 26, deck, fresh, rng, tone=0.56)
    lumber_stack(canvas, palette, 44, deck - 1, 15, 4, fresh, rng, tone=0.60)

    # The newspaper keeps its bundles by the door.
    crate_stack(canvas, palette, 76, deck - 2, umber, rng, tone=0.44)

    # Saloon: barrels, and one on its side.
    barrel(canvas, 104, deck - 16, 12, 16, fresh, grey, rng, base=0.46)
    barrel(canvas, 117, deck - 14, 11, 14, umber, grey, rng, base=0.40)
    barrel(canvas, 146, deck - 15, 11, 15, fresh, grey, rng, base=0.44)

    # The Improvement Company keeps its frontage clear. That is the joke.

    # Hotel: a trunk waiting to go somewhere, and rope.
    crate_stack(canvas, palette, 258, deck - 1, umber, rng, tone=0.40)
    rope_coil(canvas, palette, 246, deck, pine, rng, tone=0.54)

    # Assay office: tools leaning where men left them.
    leaning_tools(canvas, palette, 300, deck, 3, pine, grey, rng)
    sacks(canvas, palette, 284, deck, 2, dust, rng, tone=0.54)

    # Washing over the hotel balcony rail. Somebody is living up there.
    laundry_line(canvas, palette, 226, 54, 40, pine, bone, rng)


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------


def compose(scheme: Scheme) -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("sky").frac(0.5))

    # -- air, and plenty of it ---------------------------------------------
    sky_gradient(canvas, 0, 0, WIDTH, HILL_BASE + 12, palette.family("sky"),
                 top=scheme.sky_top, bottom=scheme.sky_bottom)
    distant_hills(canvas, 0, HILL_BASE - 20, WIDTH, 20, palette.family(scheme.hill_family),
                  rng, layers=4, amplitude=8)
    distant_steeple(canvas, 140, HILL_BASE + 18, palette, scheme)

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

    balcony(canvas, palette, 220, 64, 52, scheme.family(palette, "pine_weathered"), rng,
            tone=max(0.06, 0.52 + scheme.facade_shift))

    # -- goods, tools, washing ---------------------------------------------
    dress_boardwalk(canvas, palette, scheme, rng)

    # -- street ------------------------------------------------------------
    mud_street(canvas, 0, STREET_TOP, WIDTH, HEIGHT - STREET_TOP, palette.family("mud"), rng,
               grit=palette.family(scheme.grit_family), tone_shift=scheme.mud_shift)

    hitching_rail(canvas, 96, STREET_TOP + 6, 46, 12, pine, rng, base=max(0.06, 0.38 + scheme.facade_shift))
    water_trough(canvas, 214, STREET_TOP + 8, 40, 12, pine, palette.family("sky"), rng,
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
        for col in range(length):
            drift = (col // 24) % 2
            canvas.put(rut_x + col, rut_y + drift, mud.frac(max(0.03, 0.10 + scheme.mud_shift)))
            canvas.put(rut_x + col, rut_y + drift - 1, mud.frac(max(0.06, 0.44 + scheme.mud_shift)))

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
