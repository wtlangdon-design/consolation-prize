"""Main Street, composed once and lit twice.

Room 2 (day) and Room 36 (dawn) are the same street. Doc 05 is explicit that
the closing screen re-uses Room 2's hotspots with new lines -- "the cheapest
possible ending sequence to build and the most effective, because the player
has read the originals two hundred times". The picture has to earn that the
same way: same buildings, same boards, same ruts, different light.

So there is one composition and a Scheme that only ever does two things:
substitute one palette family for another, and shift tones.

That restriction is load-bearing, not tidiness. Every plank's tone jitter,
every rut, every nail is drawn from a seeded RNG, so the two rooms are
pixel-identical in structure only as long as both variants make exactly the
same sequence of RNG calls. Anything that branches on a scheme value and
consumes randomness -- `weathering > 0.5`, `lit`, `roof`, `grit is not None`
-- would desynchronise the streams and quietly produce a different street.
Those values are therefore fixed in LOTS and never schemed.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field

from canvas import IndexedCanvas
from components import (
    barrel,
    boardwalk,
    building,
    crate,
    distant_hills,
    hitching_rail,
    mud_street,
    plank_wall,
    sky_gradient,
    water_trough,
)
from dither import BAYER2, BAYER4, BAYER8, dither_pixel, speckle
from palette import Palette

WIDTH, HEIGHT = 320, 144

HILL_BASE = 58        # the horizon: where the ridges sit down behind the terrace
GROUND = 94           # top of the boardwalk deck
WALK_DEPTH = 11
STREET_TOP = GROUND + WALK_DEPTH + 3

SEED = 20250730

# x, width, top, wall family, tone, weathering, accent, windows, door position.
# Negative and near-zero tops crop against the frame on purpose.
# weathering and window counts are NOT schemable -- see the module docstring.
LOTS = [
    (-8, 58, -6, "pine_weathered", 0.50, 1.0, None, 2, 0.64),
    (50, 52, 2, "umber", 0.56, 1.0, "accent_rust", 2, 0.36),
    (100, 52, 52, "pine_fresh", 0.44, 1.0, None, 1, 0.50),   # the low shed: the sky gap
    (152, 56, -4, "accent_teal", 0.46, 0.0, "accent_gold", 2, 0.50),   # the painted one
    (208, 46, 10, "pine_fresh", 0.34, 1.0, None, 1, 0.42),
    (254, 74, 0, "pine_weathered", 0.42, 1.0, "accent_red", 2, 0.32),
]

ALLEYS = [(46, 5, 0, 1), (146, 6, 2, 3), (204, 4, 3, 4), (250, 4, 4, 5)]


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
    sign: str                                    # 'gilt' or 'stripped'
    swap: dict[str, str] = field(default_factory=dict)

    def family(self, palette: Palette, name: str):
        return palette.family(self.swap.get(name, name))

    def maybe_family(self, palette: Palette, name: str | None):
        return None if name is None else self.family(palette, name)


DAY = Scheme(
    name="day",
    sky_top=0.36,
    sky_bottom=0.96,
    hill_family="sage",
    haze_tone=0.66,
    facade_shift=0.0,
    walk_base=0.60,
    mud_shift=0.0,
    grit_family="ochre",
    steeple_shift=0.0,
    alley_tone=0.12,
    sign="gilt",
)

# Dawn. Not "the same picture, darker" -- the warm families are swapped out
# for cool ones so the light changes hue, not just level. Before sunrise the
# only warm thing on a street is lamplight, and there is none here.
DAWN = Scheme(
    name="dawn",
    sky_top=0.10,
    sky_bottom=0.56,
    hill_family="pine_green",
    haze_tone=0.30,
    facade_shift=-0.15,
    walk_base=0.40,
    mud_shift=-0.13,
    grit_family="dust",
    steeple_shift=-0.18,
    alley_tone=0.07,
    sign="stripped",
    swap={
        "umber": "grey",
        "pine_fresh": "pine_weathered",
        "ochre": "dust",
        "accent_rust": "dust",
        "accent_red": "grey",
        "accent_gold": "dust",
    },
)


def alley_top(left: int, right: int) -> int:
    return max(LOTS[left][2], LOTS[right][2])


def distant_steeple(canvas: IndexedCanvas, x: int, base_y: int, palette: Palette, scheme: Scheme) -> None:
    """The church, several streets back -- the one silhouette allowed to break
    the roofline, and it gets to do it in the open gap."""
    dust = scheme.family(palette, "dust")
    shift = scheme.steeple_shift
    body = dust.frac(0.50 + shift)
    dark = dust.frac(max(0.03, 0.30 + shift))
    lit = dust.frac(0.66 + shift)

    tower_w, tower_h = 13, 30
    canvas.rect(x, base_y - tower_h, tower_w, tower_h, body)
    canvas.vline(x, base_y - tower_h, tower_h, dark)
    canvas.vline(x + 1, base_y - tower_h, tower_h, lit)
    canvas.vline(x + tower_w - 1, base_y - tower_h, tower_h, dark)

    # Stepped spire. The steps are the point -- a smooth diagonal here would
    # be the single most obvious anti-aliasing tell in the picture.
    spire_h = 16
    apex_y = base_y - tower_h - spire_h
    for row in range(spire_h):
        inset = round((row / spire_h) * (tower_w // 2))
        span = max(1, tower_w - (tower_w // 2 - inset) * 2)
        left = x + (tower_w - span) // 2
        canvas.rect(left, apex_y + row, span, 1, body)
        canvas.put(left, apex_y + row, dark)
        canvas.put(left + span - 1, apex_y + row, dark)

    canvas.vline(x + tower_w // 2, apex_y - 5, 5, dark)
    canvas.rect(x + 4, base_y - tower_h + 6, 5, 7, dark)
    canvas.hline(x, base_y - tower_h, tower_w, lit)


def alley(canvas: IndexedCanvas, x: int, width: int, top: int, palette: Palette, scheme: Scheme) -> None:
    """The gap between two lots. Dark, but never black -- a black gap reads as
    missing data, while a dark gap with a low roofline in it reads as the
    one-storey shed actually standing behind the two-storey lie."""
    umber = scheme.family(palette, "umber")

    for row in range(top, GROUND):
        depth = (row - top) / max(1, GROUND - top)
        for col in range(x, x + width):
            dither_pixel(canvas, col, row, umber, max(0.02, scheme.alley_tone - depth * 0.06), BAYER2)

    roof_y = top + max(10, (GROUND - top) // 3)
    canvas.rect(x, roof_y, width, 2, umber.frac(max(0.05, 0.30 + scheme.facade_shift)))
    canvas.hline(x, roof_y, width, umber.frac(max(0.06, 0.44 + scheme.facade_shift)))

    canvas.vline(x - 1, top, GROUND - top, umber.frac(0.06))
    canvas.vline(x + width, top, GROUND - top, umber.frac(0.06))


def notice_board(canvas: IndexedCanvas, x: int, y: int, palette: Palette, scheme: Scheme, rng: random.Random) -> None:
    """Claims for sale, claims disputed, a lost dog, and a man offering to
    write letters home for those who cannot."""
    pine = scheme.family(palette, "pine_weathered")
    bone = scheme.family(palette, "bone")
    shift = scheme.facade_shift

    canvas.rect(x - 1, y - 1, 26, 21, pine.frac(0.08))
    plank_wall(canvas, x, y, 24, 18, pine, rng, plank_width=6, base=0.44 + shift, weathering=0.3, battens=False)
    canvas.hline(x, y, 24, pine.frac(0.66 + shift))

    for _ in range(6):
        note_w = rng.randrange(5, 9)
        note_h = rng.randrange(4, 6)
        nx = x + rng.randrange(1, max(2, 24 - note_w))
        ny = y + rng.randrange(1, max(2, 18 - note_h))
        canvas.rect(nx, ny, note_w, note_h, bone.frac(rng.uniform(0.42, 0.72) + shift))
        canvas.hline(nx, ny + note_h, note_w, pine.frac(0.10))
        canvas.hline(nx + 1, ny + 1, max(1, note_w - 2), bone.frac(0.16))
        if note_h > 4:
            canvas.hline(nx + 1, ny + 3, max(1, note_w - 3), bone.frac(0.16))

    canvas.rect(x + 3, y + 19, 2, 5, pine.frac(max(0.04, 0.28 + shift)))
    canvas.rect(x + 19, y + 19, 2, 5, pine.frac(max(0.04, 0.28 + shift)))


SIGN_RHYTHM = (3, 2, 4, 2, 3, 3, 2, 4, 2, 3)


def company_sign(canvas: IndexedCanvas, x: int, y: int, width: int, palette: Palette, scheme: Scheme) -> None:
    """The only sign in town that has been painted twice -- and then, in the
    last scene, taken down in the night.

    Both states are drawn from the same rhythm, which is the whole point of
    the gag surviving into the picture: the ghosts sit exactly where the
    letters sat. Paint fades in sun; paint under a fixed letter does not. So
    the removed lettering leaves patches that are *richer* than the board
    around them, not lighter -- the reverse would read as fresh paint.
    """
    teal = palette.family("accent_teal")
    board_tone = 0.16 if scheme.sign == "gilt" else 0.34

    canvas.rect(x, y, width, 11, teal.frac(board_tone))
    canvas.outline(x, y, width, 11, teal.frac(0.04))
    canvas.hline(x + 1, y + 1, width - 2, teal.frac(board_tone + 0.24))
    canvas.hline(x + 1, y + 9, width - 2, teal.frac(max(0.03, board_tone - 0.10)))

    cursor = x + 4
    for index, glyph_w in enumerate(SIGN_RHYTHM):
        if cursor + glyph_w > x + width - 4:
            break
        if scheme.sign == "gilt":
            gold = scheme.family(palette, "accent_gold")
            canvas.rect(cursor, y + 4, glyph_w, 4, gold.frac(0.84 if index % 3 else 0.96))
            canvas.hline(cursor, y + 8, glyph_w, gold.frac(0.24))
        else:
            # Unfaded paint where the letter was, plus the two screw holes
            # that held it. Somebody did this at night and did it carefully.
            canvas.rect(cursor, y + 4, glyph_w, 4, teal.frac(0.12))
            canvas.put(cursor, y + 4, teal.frac(0.02))
            canvas.put(cursor + glyph_w - 1, y + 7, teal.frac(0.02))
        cursor += glyph_w + 2


def foreground_grade(canvas: IndexedCanvas, palette: Palette, scheme: Scheme, rng: random.Random) -> None:
    """Near-camera anchoring: the bottom edge darkens and coarsens, giving the
    eye somewhere to stand and pushing the terrace back."""
    mud = palette.family("mud")
    shift = scheme.mud_shift

    for row in range(HEIGHT - 14, HEIGHT):
        strength = (row - (HEIGHT - 14)) / 14
        for col in range(WIDTH):
            if rng.random() < strength * 0.42:
                dither_pixel(canvas, col, row, mud, max(0.04, 0.30 + shift - strength * 0.20), BAYER4)

    plank_y = HEIGHT - 9
    canvas.rect(6, plank_y, 44, 4, mud.frac(max(0.05, 0.46 + shift)))
    canvas.hline(6, plank_y, 44, mud.frac(max(0.06, 0.62 + shift)))
    canvas.hline(6, plank_y + 4, 44, mud.frac(0.08))
    for col in range(6, 50, 7):
        canvas.vline(col, plank_y + 1, 3, mud.frac(max(0.04, 0.32 + shift)))

    for _ in range(9):
        stone_x = rng.randrange(0, WIDTH)
        stone_y = rng.randrange(HEIGHT - 18, HEIGHT - 1)
        canvas.put(stone_x, stone_y, mud.frac(max(0.06, 0.58 + shift)))
        canvas.put(stone_x + 1, stone_y, mud.frac(max(0.05, 0.40 + shift)))
        canvas.put(stone_x, stone_y + 1, mud.frac(0.14))


def compose(scheme: Scheme) -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("sky").frac(0.5))

    # -- air ---------------------------------------------------------------
    sky_gradient(
        canvas, 0, 0, WIDTH, HILL_BASE + 8, palette.family("sky"), top=scheme.sky_top, bottom=scheme.sky_bottom
    )
    distant_hills(
        canvas, 0, HILL_BASE - 34, WIDTH, 34, palette.family(scheme.hill_family), rng, layers=4, amplitude=11
    )
    distant_steeple(canvas, 118, HILL_BASE - 4, palette, scheme)

    haze = scheme.family(palette, "dust")
    for row in range(HILL_BASE - 6, GROUND - 26):
        for col in range(WIDTH):
            if (col * 3 + row * 5) % 11 < 3:
                dither_pixel(canvas, col, row, haze, scheme.haze_tone, BAYER8)

    # -- alleys go down first, so facades overlap their edges --------------
    for gap_x, gap_w, left, right in ALLEYS:
        alley(canvas, gap_x, gap_w, max(0, alley_top(left, right)), palette, scheme)

    # -- the terrace -------------------------------------------------------
    for index, (x, width, top, family, tone, weathering, accent, windows, door_at) in enumerate(LOTS):
        is_shed = index == 2
        building(
            canvas,
            x,
            top,
            width,
            GROUND - top,
            palette,
            rng,
            wall_family=scheme.swap.get(family, family),
            wall_tone=max(0.06, tone + scheme.facade_shift),
            weathering=weathering,
            accent=scheme.swap.get(accent, accent) if accent else None,
            cornice_height=11 if is_shed else (16 if index == 3 else 14),
            door_at=door_at,
            window_count=windows,
            lit_windows=index in (1, 5),
            roof=is_shed,
        )

    company_sign(canvas, 158, 30, 44, palette, scheme)

    # -- boardwalk ---------------------------------------------------------
    pine = scheme.family(palette, "pine_weathered")
    boardwalk(canvas, 0, GROUND, WIDTH, WALK_DEPTH, pine, rng, base=scheme.walk_base)
    for col in range(WIDTH):
        canvas.put(col, GROUND, pine.frac(0.14))
        canvas.put(col, GROUND + 1, pine.frac(0.26))

    # -- street ------------------------------------------------------------
    mud_street(
        canvas,
        0,
        STREET_TOP,
        WIDTH,
        HEIGHT - STREET_TOP,
        palette.family("mud"),
        rng,
        grit=palette.family(scheme.grit_family),
        tone_shift=scheme.mud_shift,
    )

    # -- street furniture --------------------------------------------------
    notice_board(canvas, 62, GROUND - 44, palette, scheme, rng)

    grey = scheme.family(palette, "grey")
    fresh = scheme.family(palette, "pine_fresh")
    umber = scheme.family(palette, "umber")
    ochre = scheme.family(palette, "ochre")
    shift = scheme.facade_shift

    barrel(canvas, 20, GROUND - 15, 11, 15, fresh, grey, rng, base=max(0.06, 0.42 + shift))
    barrel(canvas, 32, GROUND - 13, 10, 13, umber, grey, rng, base=max(0.06, 0.36 + shift))
    crate(canvas, 218, GROUND - 12, 16, 12, fresh, rng, base=max(0.06, 0.50 + shift))
    crate(canvas, 234, GROUND - 9, 11, 9, ochre, rng, base=max(0.06, 0.44 + shift))
    crate(canvas, 296, GROUND - 14, 15, 14, umber, rng, base=max(0.06, 0.42 + shift))

    hitching_rail(canvas, 92, STREET_TOP + 10, 48, 13, pine, rng, base=max(0.06, 0.38 + shift))
    water_trough(
        canvas, 240, STREET_TOP + 12, 42, 13, pine, palette.family("sky"), rng, base=max(0.06, 0.34 + shift)
    )

    # -- final grade -------------------------------------------------------
    speckle(canvas, 0, GROUND + WALK_DEPTH, WIDTH, 3, palette.family("mud").frac(max(0.06, 0.30 + scheme.mud_shift)), rng, 0.30)
    foreground_grade(canvas, palette, scheme, rng)

    return canvas, palette
