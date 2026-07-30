"""Things left on the boardwalk.

An empty walk reads as a diagram of a street. Consolation has two thousand
people in it and forty shovels, and all of it is stacked outside because
nothing here has a back room.

Everything sits ON the deck, so everything gets a contact shadow. A prop
without one floats, and floating props are the fastest way to make a
composed scene look assembled rather than inhabited.
"""

from __future__ import annotations

import random

from buildings import cast_shadow
from canvas import IndexedCanvas
from dither import BAYER2, dither_pixel
from palette import Palette, Ramp


def contact_shadow(canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int) -> None:
    """The dark line where a thing meets the deck, plus a short rake right."""
    cast_shadow(canvas, palette, x, y, width, 1, steps=3)
    cast_shadow(canvas, palette, x + width, y - 1, 3, 2, steps=2)


def sacks(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    base_y: int,
    count: int,
    ramp: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.56,
) -> int:
    """Slumped sacks of flour or beans. Returns the width used."""
    cursor = 0
    for index in range(count):
        width = rng.randrange(7, 11)
        height = rng.randrange(6, 9)
        top = base_y - height
        shade = max(0.06, min(0.95, tone + rng.uniform(-0.08, 0.08)))

        for row in range(height):
            # Slumped: narrow at the tied top, wide at the base.
            across = row / max(1, height - 1)
            inset = max(0, round((1 - across) * 2.2))
            for col in range(inset, width - inset):
                lit = 0.20 * (1 - col / max(1, width - 1))
                dither_pixel(canvas, x + cursor + col, top + row, ramp, min(0.95, shade + lit), BAYER2)

        canvas.hline(x + cursor + 2, top, max(1, width - 4), ramp.frac(min(0.95, shade + 0.24)))
        canvas.put(x + cursor + width // 2, top - 1, ramp.frac(max(0.05, shade - 0.26)))   # the tie
        canvas.vline(x + cursor + width - 1, top + 1, height - 1, ramp.frac(max(0.05, shade - 0.28)))
        contact_shadow(canvas, palette, x + cursor, base_y, width)
        cursor += width - rng.randrange(0, 3)
    return cursor


def lumber_stack(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    base_y: int,
    width: int,
    layers: int,
    ramp: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.62,
) -> None:
    """Cut lumber, stacked flat. Boards seen edge-on, so it is a stripe of
    light and dark lines and reads instantly at this size."""
    for layer in range(layers):
        y = base_y - 1 - layer * 3
        jitter = rng.randrange(-2, 3)
        board_w = width + jitter
        canvas.rect(x, y - 2, board_w, 3, ramp.frac(tone))
        canvas.hline(x, y - 2, board_w, ramp.frac(min(0.95, tone + 0.24)))
        canvas.hline(x, y, board_w, ramp.frac(max(0.05, tone - 0.30)))
        canvas.vline(x + board_w - 1, y - 2, 3, ramp.frac(max(0.05, tone - 0.22)))
    contact_shadow(canvas, palette, x, base_y, width)


def rope_coil(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    base_y: int,
    ramp: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.58,
) -> None:
    """A coil of rope hung on a nail: concentric rings, flattened."""
    radius_x, radius_y = 5, 6
    centre_x, centre_y = x + radius_x, base_y - radius_y
    for ring in range(2):
        rx, ry = radius_x - ring * 2, radius_y - ring * 2
        if rx <= 0 or ry <= 0:
            continue
        for angle in range(0, 360, 8):
            import math

            col = centre_x + int(rx * math.cos(math.radians(angle)))
            row = centre_y + int(ry * math.sin(math.radians(angle)))
            lit = tone + (0.18 if math.cos(math.radians(angle)) < 0 else -0.14)
            canvas.put(col, row, ramp.frac(max(0.05, min(0.95, lit))))
    canvas.vline(centre_x, centre_y - radius_y - 2, 3, ramp.frac(max(0.05, tone - 0.20)))


def leaning_tools(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    base_y: int,
    count: int,
    ramp: Ramp,
    metal: Ramp,
    rng: random.Random,
) -> None:
    """Shovels and picks leaning against a wall. Long diagonals -- the only
    diagonals on the whole street, which is why they read."""
    for index in range(count):
        lean = rng.choice((-1, 1))
        height = rng.randrange(20, 28)
        foot_x = x + index * 4
        top_x = foot_x + lean * rng.randrange(3, 6)
        canvas.line(foot_x, base_y - 1, top_x, base_y - height, ramp.frac(0.52))
        canvas.line(foot_x + 1, base_y - 1, top_x + 1, base_y - height, ramp.frac(0.30))
        # The business end.
        canvas.rect(top_x - 1, base_y - height - 3, 3, 4, metal.frac(0.60))
        canvas.put(top_x - 1, base_y - height - 3, metal.frac(0.80))
        contact_shadow(canvas, palette, foot_x, base_y, 3)


def laundry_line(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    ramp: Ramp,
    cloth: Ramp,
    rng: random.Random,
) -> None:
    """A line strung across an alley mouth, with washing on it.

    Sags in the middle. A straight line reads as a wire and a sagging one
    reads as rope with weight on it.
    """
    sag = 3
    heights: list[int] = []
    for col in range(width):
        across = col / max(1, width - 1)
        drop = int(sag * (1 - (2 * across - 1) ** 2))
        heights.append(y + drop)
        canvas.put(x + col, y + drop, ramp.frac(0.30))

    cursor = rng.randrange(2, 6)
    while cursor < width - 6:
        cloth_w = rng.randrange(6, 10)
        cloth_h = rng.randrange(5, 10)
        top = heights[min(cursor, width - 1)] + 1
        shade = rng.uniform(0.52, 0.86)
        for row in range(cloth_h):
            wobble = 1 if row > cloth_h - 3 and rng.random() < 0.5 else 0
            for col in range(cloth_w):
                dither_pixel(canvas, x + cursor + col + wobble, top + row, cloth, shade, BAYER2)
        canvas.hline(x + cursor, top, cloth_w, cloth.frac(min(0.95, shade + 0.14)))
        canvas.vline(x + cursor + cloth_w - 1, top, cloth_h, cloth.frac(max(0.05, shade - 0.22)))
        cursor += cloth_w + rng.randrange(5, 10)


def crate_stack(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    base_y: int,
    ramp: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.54,
) -> int:
    """Two or three crates stacked, each offset. Returns width used."""
    from components import crate

    widest = 0
    y = base_y
    offset = 0
    for level in range(rng.randrange(2, 4)):
        width = rng.randrange(11, 18) - level * 2
        height = rng.randrange(8, 12)
        crate(canvas, x + offset, y - height, width, height, ramp, rng, base=max(0.06, tone - level * 0.05))
        cast_shadow(canvas, palette, x + offset + width, y - height, 2, height, steps=2)
        widest = max(widest, offset + width)
        y -= height
        offset += rng.randrange(-2, 3)
    contact_shadow(canvas, palette, x, base_y, widest)
    return widest
