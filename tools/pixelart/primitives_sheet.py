"""Every non-rectangular primitive, drawn once, at 1x and at 4x.

A primitive library nobody has looked at is a library of assumptions. The
whole reason the barrels read as boxes is that the barrel was written, used
in one room, and never seen next to the thing it was meant to look like.
"""

from __future__ import annotations

import random

from canvas import IndexedCanvas
from palette import Palette
from primitives import (
    arch, barrel, catenary, chain, cylinder, ellipse_outline, ellipse_shaded,
    organic_mass, rope, sack, spoked_wheel,
)
from renders import RENDERS
from title_screen import game_font

WIDTH, HEIGHT = 320, 200


def main() -> None:
    palette = Palette.load()
    rng = random.Random(1850)
    canvas = IndexedCanvas(WIDTH, HEIGHT, palette.family("void").frac(0.0))

    bone = palette.family("bone")
    umber = palette.family("umber")
    pine = palette.family("pine_weathered")
    fresh = palette.family("pine_fresh")
    grey = palette.family("grey")
    dust = palette.family("dust")
    mud = palette.family("mud")

    def label(text: str, x: int, y: int) -> None:
        game_font(canvas, text, x, y, bone, 0.55)

    # Row 1 -- the shapes that were missing.
    label("ELLIPSE", 4, 4)
    ellipse_shaded(canvas, 26, 26, 16, 9, pine, 0.44)
    ellipse_outline(canvas, 26, 26, 16, 9, pine.frac(0.86))

    label("ARCH", 62, 4)
    arch(canvas, 60, 14, 22, 30, umber, tone=0.34)

    label("WHEEL", 100, 4)
    spoked_wheel(canvas, 118, 28, 15, grey, spokes=12, tone=0.34)

    label("TURNED", 146, 4)
    spoked_wheel(canvas, 164, 28, 15, grey, spokes=12, tone=0.30, squash=0.42)

    label("ROPE", 196, 4)
    rope(canvas, catenary(192, 16, 240, 20, 16), pine, tone=0.56)

    label("CHAIN", 252, 4)
    chain(canvas, catenary(250, 16, 300, 18, 18), grey, tone=0.48)

    # Row 2 -- the same object, before and after.
    label("BOX WITH LINES", 4, 56)
    _flat_barrel(canvas, 10, 70, 20, 26, umber, grey)

    label("CYLINDER", 74, 56)
    barrel(canvas, 76, 68, 20, 26, umber, grey, rng, base=0.44)

    label("OPEN", 128, 56)
    barrel(canvas, 128, 68, 20, 26, fresh, grey, rng, base=0.48, open_top=True)

    label("BUCKET", 176, 56)
    cylinder(canvas, 180, 70, 14, 16, grey, base=0.40, waist=0.4)

    label("SACK", 226, 56)
    sack(canvas, 226, 100, 20, 24, dust, rng, tone=0.54)

    label("SPOIL", 268, 56)
    organic_mass(canvas, 288, 100, 22, 13, mud, rng, tone=0.36)

    # Row 3 -- a rank of them, because density is the point of all this.
    label("AT DENSITY, OVERLAPPING", 4, 116)
    ground = 176
    canvas.rect(0, ground, WIDTH, HEIGHT - ground, mud.frac(0.30))
    for i in range(9):
        x = 6 + i * 34
        organic_mass(canvas, x + 26, ground + 3, 12, 6, mud, rng, tone=0.26, lumps=3)
    # Back row first, then the front row over it. Overlap is what turns a
    # shelf of props into a heap of goods, and it costs nothing.
    for i, (w, h, ramp) in enumerate(
        [(20, 26, umber), (16, 20, fresh), (22, 28, pine), (14, 18, umber),
         (20, 24, fresh), (17, 22, pine), (23, 27, umber)]):
        barrel(canvas, 6 + i * 44, ground - h - 9, w, h, ramp, grey, rng, base=0.36)
    for i in range(9):
        sack(canvas, 2 + i * 36, ground - 2, 15, 17, dust, rng, tone=0.50)
    for i, (w, h, ramp) in enumerate(
        [(18, 22, fresh), (23, 27, umber), (16, 20, pine), (20, 25, fresh)]):
        barrel(canvas, 24 + i * 78, ground - h + 4, w, h, ramp, grey, rng, base=0.48)

    canvas.save(RENDERS / "primitives-sheet.png", palette)
    canvas.save(RENDERS / "primitives-sheet@4x.png", palette, scale=4)
    print(f"wrote renders/primitives-sheet@4x.png -- {len(canvas.used_indices())} colours")


def _flat_barrel(canvas, x, y, width, height, ramp, hoops) -> None:
    """The old barrel, kept only so the sheet can show what changed."""
    for row in range(height):
        waist = 1.0 - abs((row / max(1, height - 1)) - 0.5) * 2
        inset = max(0, round((1 - waist) * 1.6))
        canvas.hline(x + inset, y + row, width - 2 * inset, ramp.frac(0.44))
    for stave in range(x + 2, x + width - 1, 3):
        canvas.vline(stave, y + 1, height - 2, ramp.frac(0.26))
    for hoop_y in (y + 1, y + height // 2, y + height - 2):
        canvas.hline(x, hoop_y, width, hoops.frac(0.44))
    canvas.hline(x, y, width, ramp.frac(0.72))


if __name__ == "__main__":
    main()
