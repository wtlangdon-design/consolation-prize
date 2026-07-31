"""Room 0 — the town map. Doc 20's one added screen.

DRAWN, NOT PAINTED. Every other background in this game is a place seen from
eye level. This one is a plan of the district, and it has to read as a plan
immediately or it becomes a bad landscape: no horizon, no sky gradient, no
perspective, no lighting pass. Flat ink on paper, seen from above.

It also has to stay OUT OF THE WAY. Doc 20 says the location markers and the
labels are drawn by the engine in the game font so that nothing is baked in
and nothing needs redrawing when a name changes. That means the plan is the
quietest image in the project: everything in it sits low in contrast so that
engine-drawn text on top of it is the brightest thing on screen. A plan that
competes with its own labels is unreadable, and the labels are the interface.

ERRATA 25 applies here and is why there is no figure: the map carries no
character token, so nothing on this screen moves and nothing is at a scale
the decimation curve could not produce anyway.

The geometry is doc 20's: Main Street as a line of façades running across
the middle, side lanes off it, the road out to the diggings leaving to the
east, hills above. Distances are schematic. A map is a diagram of relations,
not a survey, and Consolation's is drawn by somebody who lives there.
"""

from __future__ import annotations

import random
from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette
from renders import BACKGROUNDS, RENDERS

ROOT = Path(__file__).resolve().parents[2]

WIDTH, HEIGHT = 320, 144
SEED = 20_1850

#: Main Street runs across the plan, a little above centre, so the diggings
#: road below it has room to wander and the hills above have room to sit.
STREET_Y = 74
STREET_X0, STREET_X1 = 46, 250


def paper(canvas: IndexedCanvas, palette: Palette, rng: random.Random) -> None:
    """The sheet itself: bone, foxed, with a faint rule at the edge."""
    bone = palette.family("bone")
    dust = palette.family("dust")

    canvas.rect(0, 0, WIDTH, HEIGHT, bone.frac(0.72))

    # Age. Sparse, low-contrast, and never two steps from the field -- this is
    # texture the eye should not resolve, not a pattern it should read.
    for _ in range(1100):
        x, y = rng.randrange(WIDTH), rng.randrange(HEIGHT)
        canvas.put(x, y, bone.frac(0.62) if rng.random() < 0.7 else dust.frac(0.58))

    # A drawn border, inset. It tells the eye "this is a sheet" in four lines.
    canvas.outline(6, 5, WIDTH - 12, HEIGHT - 10, dust.frac(0.30))


def hills(canvas: IndexedCanvas, palette: Palette, rng: random.Random) -> None:
    """Hachured ridges along the top. The only texture on the sheet."""
    dust = palette.family("dust")
    ink = dust.frac(0.26)

    for base, height, x0, x1 in ((34, 13, 28, 128), (28, 16, 116, 226), (36, 11, 214, 296)):
        peak = (x0 + x1) // 2
        for x in range(x0, x1):
            reach = 1.0 - abs(x - peak) / ((x1 - x0) / 2)
            if reach <= 0:
                continue
            top = base - int(reach * height)
            canvas.put(x, top, ink)
            # Hachures: short strokes down the slope, thinning as it flattens.
            if rng.random() < reach * 0.55:
                for step in range(1, rng.randrange(2, 5)):
                    canvas.put(x, top + step, dust.frac(0.40))


def street(canvas: IndexedCanvas, palette: Palette) -> None:
    """Main Street: two rules with the façades ticked off along them."""
    umber = palette.family("umber")
    dust = palette.family("dust")
    line = umber.frac(0.30)

    canvas.hline(STREET_X0, STREET_Y, STREET_X1 - STREET_X0, line)
    canvas.hline(STREET_X0, STREET_Y + 6, STREET_X1 - STREET_X0, line)

    # The six enterable businesses, as ticks. They are NOT map entries --
    # errata 30c is explicit that the façades are entered from the street --
    # so they are drawn as buildings and never labelled or clicked.
    for x in (62, 92, 118, 158, 192, 224):
        canvas.rect(x, STREET_Y - 9, 18, 9, dust.frac(0.52))
        canvas.outline(x, STREET_Y - 9, 18, 9, line)
    for x in (74, 134, 176, 210):
        canvas.rect(x, STREET_Y + 7, 14, 8, dust.frac(0.52))
        canvas.outline(x, STREET_Y + 7, 14, 8, line)


def lanes(canvas: IndexedCanvas, palette: Palette) -> None:
    """Side lanes and the road east, as single dashed rules."""
    umber = palette.family("umber")
    ink = umber.frac(0.34)

    def dashed(points: list[tuple[int, int]]) -> None:
        """A polyline drawn as dashes, so a road never reads as a wall."""
        drawn = 0
        for (x0, y0), (x1, y1) in zip(points, points[1:]):
            steps = max(abs(x1 - x0), abs(y1 - y0)) or 1
            for step in range(steps + 1):
                x = x0 + round((x1 - x0) * step / steps)
                y = y0 + round((y1 - y0) * step / steps)
                if drawn % 5 < 3:
                    canvas.put(x, y, ink)
                drawn += 1

    # North, to the church and the tent. South, to the livery and the yards.
    dashed([(104, STREET_Y - 9), (104, 46), (150, 46)])
    dashed([(200, STREET_Y + 15), (200, 100), (162, 100)])
    # West, off the sheet: the stage road Thad arrived on.
    dashed([(STREET_X0, STREET_Y + 3), (22, STREET_Y + 3), (22, 60)])
    # East and down, to the junction and everything past it.
    dashed([(STREET_X1, STREET_Y + 3), (272, STREET_Y + 3), (272, 108), (238, 118)])
    # Boot Hill, off the junction, going up.
    dashed([(272, 96), (296, 88)])


def compose() -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT)

    paper(canvas, palette, rng)
    hills(canvas, palette, rng)
    lanes(canvas, palette)
    street(canvas, palette)
    return canvas, palette


def main() -> None:
    canvas, palette = compose()
    RENDERS.mkdir(parents=True, exist_ok=True)
    BACKGROUNDS.mkdir(parents=True, exist_ok=True)
    canvas.save(RENDERS / "room-00-town-map.png", palette)
    canvas.save(RENDERS / "room-00-town-map@4x.png", palette, scale=4)
    native = BACKGROUNDS / "room-00-town-map.png"
    canvas.save(native, palette)
    print(f"wrote renders/room-00-town-map@4x.png and {native.relative_to(ROOT)}")
    print(f"colours used: {len(canvas.used_indices())}")


if __name__ == "__main__":
    main()
