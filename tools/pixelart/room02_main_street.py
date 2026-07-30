"""Room 2 -- Main Street. 320x144.

Lateral stage-set composition, flat on, like a theatre backdrop: the whole
street is parallel to the picture plane, which is both the SCUMM convention
and the literal truth about Consolation.

Two constraints fight each other here and the resolution matters.
Character sprites are ~40px tall and the play area is 144px, so an honest
two-storey false front is roughly 85px and would fill the frame edge to
edge, leaving no sky. Monkey Island's answer, adopted here: let the terrace
crop against the top of the frame and open *one* deliberate gap in it. The
gap does the work of the sky for the whole picture -- hills, haze and the
church steeple all live in that one hole, and the roofline stops being a
flat line across the top of the screen.

Depth is three flat bands, not perspective:
  sky and hills (palest, coolest) -> buildings (mid) -> mud (darkest, warmest)

The Improvement Company is the one building painted recently. Everything
either side of it is silvered timber, so it reads as an intruder without
being pointed at.
"""

from __future__ import annotations

import random
from pathlib import Path

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
    shingle_roof,
    sky_gradient,
    water_trough,
)
from dither import BAYER2, BAYER4, BAYER8, dither_pixel, speckle
from palette import Palette

WIDTH, HEIGHT = 320, 144

HILL_BASE = 58        # where the ridges sit down, behind the terrace
GROUND = 94           # top of the boardwalk deck
WALK_DEPTH = 11
STREET_TOP = GROUND + WALK_DEPTH + 3

SEED = 20250730

# x, width, top, wall family, tone, weathering, accent, windows, door position.
# Negative and near-zero tops crop against the frame on purpose.
LOTS = [
    (-8, 58, -6, "pine_weathered", 0.50, 1.0, None, 2, 0.64),
    (50, 52, 2, "umber", 0.56, 1.0, "accent_rust", 2, 0.36),
    (100, 52, 52, "pine_fresh", 0.44, 1.0, None, 1, 0.50),   # the low shed: the sky gap
    (152, 56, -4, "accent_teal", 0.46, 0.0, "accent_gold", 2, 0.50),   # freshly painted
    (208, 46, 10, "pine_fresh", 0.34, 1.0, None, 1, 0.42),
    (254, 74, 0, "pine_weathered", 0.42, 1.0, "accent_red", 2, 0.32),
]

# x, width, and the indices of the lots either side. The top is derived, not
# authored: an alley starts at the lower of its two neighbours' rooflines.
ALLEYS = [(46, 5, 0, 1), (146, 6, 2, 3), (204, 4, 3, 4), (250, 4, 4, 5)]


def alley_top(left: int, right: int) -> int:
    return max(LOTS[left][2], LOTS[right][2])


def distant_steeple(canvas: IndexedCanvas, x: int, base_y: int, palette: Palette) -> None:
    """The church, several streets back. The tallest thing in Consolation and
    the only building as deep as it is tall -- so it gets the one silhouette
    allowed to break the roofline, and it gets it in the open gap."""
    dust = palette.family("dust")
    body = dust.frac(0.50)
    dark = dust.frac(0.30)
    lit = dust.frac(0.66)

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

    canvas.vline(x + tower_w // 2, apex_y - 5, 5, dark)          # the finial
    canvas.rect(x + 4, base_y - tower_h + 6, 5, 7, dark)          # louvred belfry
    canvas.hline(x, base_y - tower_h, tower_w, lit)


def alley(canvas: IndexedCanvas, x: int, width: int, top: int, palette: Palette) -> None:
    """The gap between two lots.

    Not black. A pure black gap reads as missing data; a very dark gap with a
    lower roofline visible in it reads as the one-storey shed that is
    actually back there behind the two-storey lie.
    """
    umber = palette.family("umber")

    for row in range(top, GROUND):
        depth = (row - top) / max(1, GROUND - top)
        for col in range(x, x + width):
            dither_pixel(canvas, col, row, umber, 0.12 - depth * 0.06, BAYER2)

    # The real roof, well below the false front, catching a little sky.
    roof_y = top + max(10, (GROUND - top) // 3)
    canvas.rect(x, roof_y, width, 2, umber.frac(0.30))
    canvas.hline(x, roof_y, width, umber.frac(0.44))

    canvas.vline(x - 1, top, GROUND - top, umber.frac(0.06))
    canvas.vline(x + width, top, GROUND - top, umber.frac(0.06))


def notice_board(canvas: IndexedCanvas, x: int, y: int, palette: Palette, rng: random.Random) -> None:
    """Claims for sale, claims disputed, a lost dog, and a man offering to
    write letters home for those who cannot."""
    pine = palette.family("pine_weathered")
    bone = palette.family("bone")

    canvas.rect(x - 1, y - 1, 26, 21, pine.frac(0.08))
    plank_wall(canvas, x, y, 24, 18, pine, rng, plank_width=6, base=0.44, weathering=0.3, battens=False)
    canvas.hline(x, y, 24, pine.frac(0.66))

    for _ in range(6):
        note_w = rng.randrange(5, 9)
        note_h = rng.randrange(4, 6)
        nx = x + rng.randrange(1, max(2, 24 - note_w))
        ny = y + rng.randrange(1, max(2, 18 - note_h))
        canvas.rect(nx, ny, note_w, note_h, bone.frac(rng.uniform(0.42, 0.72)))
        canvas.hline(nx, ny + note_h, note_w, pine.frac(0.10))
        canvas.hline(nx + 1, ny + 1, max(1, note_w - 2), bone.frac(0.16))
        if note_h > 4:
            canvas.hline(nx + 1, ny + 3, max(1, note_w - 3), bone.frac(0.16))

    # Two posts, so it stands in front of the wall rather than on it.
    canvas.rect(x + 3, y + 19, 2, 5, pine.frac(0.28))
    canvas.rect(x + 19, y + 19, 2, 5, pine.frac(0.28))


def company_sign(canvas: IndexedCanvas, x: int, y: int, width: int, palette: Palette) -> None:
    """The only sign in town that has been painted twice."""
    gold = palette.family("accent_gold")
    teal = palette.family("accent_teal")

    canvas.rect(x, y, width, 11, teal.frac(0.16))
    canvas.outline(x, y, width, 11, teal.frac(0.04))
    canvas.hline(x + 1, y + 1, width - 2, teal.frac(0.40))
    canvas.hline(x + 1, y + 9, width - 2, teal.frac(0.06))

    # Gilt lettering, suggested rather than spelled: legible text at this
    # size would be taller than the door. Blocked glyph rhythm reads as words
    # from across the street, which is all a sign has to do.
    cursor = x + 4
    rhythm = (3, 2, 4, 2, 3, 3, 2, 4, 2, 3)
    for index, glyph_w in enumerate(rhythm):
        if cursor + glyph_w > x + width - 4:
            break
        canvas.rect(cursor, y + 4, glyph_w, 4, gold.frac(0.84 if index % 3 else 0.96))
        canvas.hline(cursor, y + 8, glyph_w, gold.frac(0.24))
        cursor += glyph_w + 2


def foreground_grade(canvas: IndexedCanvas, palette: Palette, rng: random.Random) -> None:
    """Near-camera anchoring. The bottom edge darkens and coarsens, which
    gives the eye somewhere to stand and pushes the terrace back."""
    mud = palette.family("mud")

    for row in range(HEIGHT - 14, HEIGHT):
        strength = (row - (HEIGHT - 14)) / 14
        for col in range(WIDTH):
            if rng.random() < strength * 0.42:
                dither_pixel(canvas, col, row, mud, max(0.06, 0.30 - strength * 0.20), BAYER4)

    # A plank half sunk in the mud, bottom left. Foreground clutter reads as
    # scale: it is nearer, so it is bigger and darker than anything behind it.
    plank_y = HEIGHT - 9
    canvas.rect(6, plank_y, 44, 4, mud.frac(0.46))
    canvas.hline(6, plank_y, 44, mud.frac(0.62))
    canvas.hline(6, plank_y + 4, 44, mud.frac(0.08))
    for col in range(6, 50, 7):
        canvas.vline(col, plank_y + 1, 3, mud.frac(0.32))

    for _ in range(9):
        stone_x = rng.randrange(0, WIDTH)
        stone_y = rng.randrange(HEIGHT - 18, HEIGHT - 1)
        canvas.put(stone_x, stone_y, mud.frac(0.58))
        canvas.put(stone_x + 1, stone_y, mud.frac(0.40))
        canvas.put(stone_x, stone_y + 1, mud.frac(0.14))


def compose() -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("sky").frac(0.5))

    # -- air ---------------------------------------------------------------
    sky_gradient(canvas, 0, 0, WIDTH, HILL_BASE + 8, palette.family("sky"), top=0.36, bottom=0.96)
    distant_hills(canvas, 0, HILL_BASE - 34, WIDTH, 34, palette.family("sage"), rng, layers=4, amplitude=11)
    distant_steeple(canvas, 118, HILL_BASE - 4, palette)

    # Haze pooled along the base of the hills, so the terrace has something
    # to sit in front of rather than on.
    haze = palette.family("dust")
    for row in range(HILL_BASE - 6, GROUND - 26):
        for col in range(WIDTH):
            if (col * 3 + row * 5) % 11 < 3:
                dither_pixel(canvas, col, row, haze, 0.66, BAYER8)

    # -- alleys go down first, so facades overlap their edges --------------
    for gap_x, gap_w, left, right in ALLEYS:
        alley(canvas, gap_x, gap_w, max(0, alley_top(left, right)), palette)

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
            wall_family=family,
            wall_tone=tone,
            weathering=weathering,
            accent=accent,
            cornice_height=11 if is_shed else (16 if index == 3 else 14),
            door_at=door_at,
            window_count=windows,
            lit_windows=index in (1, 5),
            roof=is_shed,
        )

    company_sign(canvas, 158, 30, 44, palette)

    # -- boardwalk ---------------------------------------------------------
    boardwalk(canvas, 0, GROUND, WIDTH, WALK_DEPTH, palette.family("pine_weathered"), rng, base=0.60)

    # The walk runs in the buildings' shadow along its back edge. Without
    # this the terrace looks pasted on top of the deck.
    pine = palette.family("pine_weathered")
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
        grit=palette.family("ochre"),
    )

    # -- street furniture --------------------------------------------------
    notice_board(canvas, 62, GROUND - 44, palette, rng)

    barrel(canvas, 20, GROUND - 15, 11, 15, palette.family("pine_fresh"), palette.family("grey"), rng, base=0.42)
    barrel(canvas, 32, GROUND - 13, 10, 13, palette.family("umber"), palette.family("grey"), rng, base=0.36)
    crate(canvas, 218, GROUND - 12, 16, 12, palette.family("pine_fresh"), rng, base=0.50)
    crate(canvas, 234, GROUND - 9, 11, 9, palette.family("ochre"), rng, base=0.44)
    crate(canvas, 296, GROUND - 14, 15, 14, palette.family("umber"), rng, base=0.42)

    hitching_rail(canvas, 92, STREET_TOP + 10, 48, 13, palette.family("pine_weathered"), rng, base=0.38)
    water_trough(
        canvas, 240, STREET_TOP + 12, 42, 13, palette.family("pine_weathered"), palette.family("sky"), rng, base=0.34
    )

    # -- final grade -------------------------------------------------------
    speckle(canvas, 0, GROUND + WALK_DEPTH, WIDTH, 3, palette.family("mud").frac(0.30), rng, 0.30)
    foreground_grade(canvas, palette, rng)

    return canvas, palette


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    canvas, palette = compose()

    native = root / "art" / "backgrounds" / "room-02-main-street.png"
    preview = root / "art" / "backgrounds" / "preview" / "room-02-main-street@4x.png"
    canvas.save(native, palette)
    canvas.save(preview, palette, scale=4)

    used = canvas.used_indices()
    print(f"wrote {native.relative_to(root)}  ({WIDTH}x{HEIGHT})")
    print(f"wrote {preview.relative_to(root)}  ({WIDTH * 4}x{HEIGHT * 4})")
    print(f"colours used: {len(used)} of 256")


if __name__ == "__main__":
    main()
