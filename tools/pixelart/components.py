"""Reusable pixel-art components.

Every component draws hard-edged indexed pixels into a canvas. Shared rules:

  * Forms are separated by a dark edge line, not by a tonal difference alone.
    At 320x144 a one-step tonal change between two planes disappears; a dark
    seam is what makes a silhouette read.
  * Detail is rationed. A few nails and one knot per wall reads as carpentry;
    texture everywhere reads as noise and is the most common way generated
    pixel art gives itself away.
  * Dithering is for gradients and for aging a surface, never for shading a
    small form. Small forms get two or three flat steps.
  * Every component takes an rng so output is deterministic for a given seed.
"""

from __future__ import annotations

import random

from canvas import IndexedCanvas
from dither import BAYER2, BAYER4, BAYER8, dither_pixel, dither_rect, speckle, vertical_gradient
from palette import Palette, Ramp

# ---------------------------------------------------------------------------
# Sky and land
# ---------------------------------------------------------------------------


def sky_gradient(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    top: float = 0.30,
    bottom: float = 0.92,
) -> None:
    """Dithered vertical sky. Light gathers at the horizon, as it does."""
    vertical_gradient(canvas, x, y, width, height, ramp, top, bottom, BAYER8)


def distant_hills(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    baseline: int,
    ramp: Ramp,
    rng: random.Random,
    layers: int = 3,
    amplitude: int = 9,
) -> None:
    """Layered ridge silhouettes, palest and highest at the back.

    Aerial perspective is doing the work: each nearer layer is darker and
    lower, which is what keeps a flat 2D scene from reading as a sticker.
    """
    for layer in range(layers):
        depth = layer / max(1, layers - 1)
        tone = 0.62 - depth * 0.34
        crest = baseline - int((layers - layer) * amplitude * 0.75)
        step = 14 + layer * 5
        points: list[int] = []
        height_at = crest
        for col in range(0, width + step, step):
            points.append((col, height_at))
            height_at = crest + rng.randint(-amplitude, amplitude // 2)

        for col in range(width):
            # Piecewise-linear ridge line, sampled per column.
            for index in range(len(points) - 1):
                x0, y0 = points[index]
                x1, y1 = points[index + 1]
                if x0 <= col <= x1:
                    blend = (col - x0) / max(1, x1 - x0)
                    ridge = int(y0 + (y1 - y0) * blend)
                    break
            else:
                ridge = crest
            for row in range(ridge, baseline + 1):
                # Ridges fade slightly toward their base where haze pools.
                falloff = (row - ridge) / max(1, baseline - ridge)
                dither_pixel(canvas, x + col, y + row, ramp, tone + falloff * 0.10, BAYER4)


def mud_street(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    grit: Ramp | None = None,
    tone_shift: float = 0.0,
) -> None:
    """Churned mud.

    Built in the order the road actually forms: a wet base, a crown that
    dries out down the middle where the wheels do not run, then ruts cut
    through the crown, then water standing in the ruts. Doing colour before
    structure gives a brown carpet with confetti on it.
    """
    for row in range(height):
        across = row / max(1, height - 1)
        # Wetter and darker toward the camera.
        tone = 0.40 + tone_shift - across * 0.20
        # The dry crown: a broad lift through the middle of the band.
        crown = max(0.0, 1.0 - abs(across - 0.45) * 2.4)
        tone += crown * 0.16
        for col in range(width):
            # Slow lateral wander so the crown edge is not a straight line.
            wander = ((col * 5) % 47) / 47 * 0.05
            dither_pixel(canvas, x + col, y + row, ramp, max(0.05, tone + wander), BAYER4)

    # Wheel ruts, cut after the crown so they read as gouges through it.
    for _ in range(9):
        rut_y = y + rng.randrange(2, height - 2)
        rut_x = rng.randrange(-20, width - 20)
        length = rng.randrange(30, 92)
        dark = ramp.frac(max(0.03, 0.14 + tone_shift))
        edge = ramp.frac(max(0.05, 0.52 + tone_shift))
        for col in range(length):
            drift = int((col / 22) % 2 == 0)
            canvas.put(x + rut_x + col, rut_y + drift, dark)
            canvas.put(x + rut_x + col, rut_y + drift - 1, edge)

    # Standing water: flat, hard-edged, with a bright rim on the far side.
    for _ in range(5):
        pool_w = rng.randrange(12, 30)
        pool_h = rng.randrange(3, 6)
        pool_x = x + rng.randrange(0, max(1, width - pool_w))
        pool_y = y + rng.randrange(1, max(2, height - pool_h))
        for row in range(pool_h):
            inset = abs(row - pool_h // 2)
            for col in range(inset, pool_w - inset):
                dither_pixel(canvas, pool_x + col, pool_y + row, ramp, 0.09, BAYER2)
        canvas.hline(pool_x + 1, pool_y, max(1, pool_w - 2), ramp.frac(0.60))

    # Grit. Sparse, and only on the dry crown -- this is seasoning, not a
    # layer. Density here was the loudest error in the previous pass.
    if grit is not None:
        band_top = y + int(height * 0.28)
        band_h = max(1, int(height * 0.34))
        for _ in range(int(width * band_h * 0.035)):
            canvas.put(
                x + rng.randrange(width),
                band_top + rng.randrange(band_h),
                grit.frac(rng.uniform(0.26, 0.42)),
            )

    speckle(canvas, x, y, width, height, ramp.frac(0.52), rng, 0.008)
    speckle(canvas, x, y, width, height, ramp.frac(0.18), rng, 0.006)


# ---------------------------------------------------------------------------
# Timber
# ---------------------------------------------------------------------------


def plank_wall(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    plank_width: int = 7,
    base: float = 0.52,
    weathering: float = 1.0,
    battens: bool = True,
) -> None:
    """Board-and-batten wall. Each board carries its own tone.

    The per-board variation is the whole point: a wall of one flat colour
    reads as a texture swatch, and a wall where every board differs slightly
    reads as timber someone nailed up in a hurry.
    """
    canvas.rect(x, y, width, height, ramp.frac(base))

    column = 0
    while column < width:
        board_width = min(plank_width, width - column)
        jitter = rng.uniform(-0.11, 0.11) * weathering
        tone = max(0.06, min(0.95, base + jitter))
        for row in range(height):
            for col in range(board_width):
                dither_pixel(canvas, x + column + col, y + row, ramp, tone, BAYER4)

        # Seam between boards: one dark pixel column.
        seam = ramp.frac(max(0.04, base - 0.34))
        canvas.vline(x + column, y, height, seam)

        if battens and board_width == plank_width and rng.random() < 0.45:
            batten = ramp.frac(min(0.95, tone + 0.07))
            canvas.vline(x + column + 1, y, height, batten)

        # Weathering: a few boards split, warp or lose a nail.
        if weathering > 0.5 and rng.random() < 0.14 * weathering:
            split_y = y + rng.randrange(0, max(1, height - 6))
            split_len = rng.randrange(4, min(14, max(5, height - 2)))
            canvas.vline(x + column + rng.randrange(2, max(3, board_width)), split_y, split_len, seam)

        if rng.random() < 0.22:
            nail_y = y + rng.randrange(2, max(3, height - 2))
            canvas.put(x + column + board_width // 2, nail_y, ramp.frac(max(0.02, base - 0.42)))

        column += plank_width

    if weathering > 0.5:
        # Damp rising out of the mud, dithered so it has no hard top edge.
        damp_height = min(height, 5)
        for row in range(damp_height):
            strength = 1.0 - row / damp_height
            for col in range(width):
                if rng.random() < strength * 0.32 * weathering:
                    dither_pixel(canvas, x + col, y + height - 1 - row, ramp, max(0.05, base - 0.30), BAYER4)


def shingle_roof(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    course_height: int = 4,
    base: float = 0.40,
) -> None:
    """Overlapping shingle courses, offset row to row."""
    canvas.rect(x, y, width, height, ramp.frac(base))
    row = y
    course = 0
    while row < y + height:
        depth = min(course_height, y + height - row)

        # Lay the course one shingle at a time, each its own width and tone.
        col = -rng.randrange(0, 5) if course % 2 else 0
        while col < width:
            shingle_w = rng.randrange(4, 9)
            tone = base + rng.uniform(-0.10, 0.10) + (0.04 if course % 2 else -0.02)
            tone = max(0.06, min(0.95, tone))
            for line in range(depth):
                for inner in range(shingle_w):
                    if 0 <= col + inner < width:
                        dither_pixel(canvas, x + col + inner, row + line, ramp, tone, BAYER4)
            # Joint between neighbouring shingles: shallow.
            if col >= 0:
                canvas.vline(x + col, row, depth, ramp.frac(max(0.05, base - 0.18)))
            # An occasional curled or missing shingle.
            if rng.random() < 0.10 and depth > 1:
                canvas.hline(x + max(0, col), row + depth - 1, min(shingle_w, width - max(0, col)),
                             ramp.frac(min(0.95, base + 0.26)))
            col += shingle_w

        # Shadow cast by the course above: deep, and the thing that makes the
        # roof read as overlapping layers rather than as a grid.
        canvas.hline(x, row, width, ramp.frac(max(0.03, base - 0.32)))
        if depth > 1:
            canvas.hline(x, row + 1, width, ramp.frac(max(0.04, base - 0.22)))

        row += course_height
        course += 1


def false_front_cornice(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    base: float = 0.58,
    accent: Ramp | None = None,
) -> None:
    """The flat parapet that makes a one-storey shed look like two storeys.

    Structurally a lie, which is why it is the signature of the whole town.
    """
    canvas.rect(x, y, width, height, ramp.frac(base))

    # Top capping board, proud of the front by a pixel each side.
    canvas.rect(x - 1, y, width + 2, 2, ramp.frac(min(0.95, base + 0.24)))
    canvas.hline(x - 1, y + 2, width + 2, ramp.frac(max(0.03, base - 0.36)))

    # A moulding band, picked out in paint if the owner had any.
    band_y = y + max(3, height - 4)
    band_ramp = accent if accent is not None else ramp
    band_tone = 0.58 if accent is not None else min(0.95, base + 0.14)
    canvas.rect(x, band_y, width, 2, band_ramp.frac(band_tone))
    canvas.hline(x, band_y + 2, width, ramp.frac(max(0.03, base - 0.32)))

    # Dentils. Cheap classical pretension, three pixels wide.
    for col in range(x + 2, x + width - 2, 6):
        canvas.rect(col, band_y - 2, 3, 2, ramp.frac(min(0.95, base + 0.20)))


def window(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    frame: Ramp,
    glass: Ramp,
    rng: random.Random,
    lit: bool = False,
    panes: tuple[int, int] = (2, 3),
    frame_tone: float = 0.62,
) -> None:
    """Sash window with mullions and a raking reflection."""
    canvas.rect(x, y, width, height, frame.frac(frame_tone))
    canvas.outline(x, y, width, height, frame.frac(max(0.03, frame_tone - 0.40)))

    inner_x, inner_y = x + 2, y + 2
    inner_w, inner_h = width - 4, height - 4
    if inner_w <= 0 or inner_h <= 0:
        return

    # Glass. Unlit glass is not black -- it holds a dark reflection of sky.
    if lit:
        for row in range(inner_h):
            for col in range(inner_w):
                dither_pixel(canvas, inner_x + col, inner_y + row, glass, 0.72, BAYER2)
    else:
        # Dark. Glass in daylight is a hole, not a light source -- bright
        # panes were the single loudest error in the first pass.
        for row in range(inner_h):
            tone = 0.28 - (row / max(1, inner_h - 1)) * 0.10
            for col in range(inner_w):
                dither_pixel(canvas, inner_x + col, inner_y + row, glass, max(0.04, tone), BAYER4)

        # A raking reflection. Length, start and side vary per window, or
        # a terrace of them reads as one stamp repeated.
        span = max(3, inner_h)
        run = rng.randrange(max(2, span // 2), span + 1)
        start = rng.randrange(0, max(1, span - run + 1))
        flip = rng.random() < 0.4
        for step in range(run):
            col = (inner_w - 1 - step) if flip else step
            row = inner_h - 1 - (start + step)
            if 0 <= col < inner_w and 0 <= row < inner_h:
                canvas.put(inner_x + col, inner_y + row, glass.frac(0.50))

    cols, rows = panes
    mullion = frame.frac(min(0.95, frame_tone + 0.18))
    for index in range(1, cols):
        canvas.vline(inner_x + index * inner_w // cols, inner_y, inner_h, mullion)
    for index in range(1, rows):
        canvas.hline(inner_x, inner_y + index * inner_h // rows, inner_w, mullion)

    # Sill, proud both sides.
    canvas.rect(x - 1, y + height - 1, width + 2, 2, frame.frac(min(0.95, frame_tone + 0.10)))
    canvas.hline(x - 1, y + height + 1, width + 2, frame.frac(max(0.03, frame_tone - 0.42)))

    if rng.random() < 0.35:
        # A cracked pane. Every town has one.
        crack_x = inner_x + rng.randrange(max(1, inner_w - 2))
        canvas.line(crack_x, inner_y + 1, crack_x + 2, inner_y + inner_h - 2, glass.frac(0.70))


def door(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    base: float = 0.44,
    open_gap: bool = False,
) -> None:
    """Plank door with a Z-brace and a dark reveal around it."""
    canvas.rect(x - 1, y - 1, width + 2, height + 1, ramp.frac(max(0.03, base - 0.34)))
    canvas.rect(x, y, width, height, ramp.frac(base))
    # Lintel and jambs, so the opening is framed into the wall.
    canvas.rect(x - 2, y - 3, width + 4, 3, ramp.frac(min(0.95, base + 0.24)))
    canvas.hline(x - 2, y - 1, width + 4, ramp.frac(max(0.03, base - 0.40)))

    for col in range(0, width, 4):
        for row in range(height):
            tone = base + (0.06 if (col // 4) % 2 else -0.05)
            for inner in range(min(4, width - col)):
                dither_pixel(canvas, x + col + inner, y + row, ramp, tone, BAYER4)
        canvas.vline(x + col, y, height, ramp.frac(max(0.04, base - 0.26)))

    brace = ramp.frac(min(0.95, base + 0.20))
    canvas.hline(x, y + 2, width, brace)
    canvas.hline(x, y + height - 4, width, brace)
    canvas.line(x, y + height - 4, x + width - 1, y + 2, brace)

    if open_gap:
        # A door standing ajar: a hard black wedge, no gradient.
        canvas.rect(x + width - 4, y + 1, 3, height - 2, ramp.frac(0.02))

    knob = y + height // 2
    canvas.put(x + width - 3, knob, ramp.frac(0.90))
    canvas.put(x + width - 3, knob + 1, ramp.frac(max(0.03, base - 0.30)))

    if rng.random() < 0.5:
        canvas.put(x + 1, y + height - 2, ramp.frac(max(0.03, base - 0.30)))


def boardwalk(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    base: float = 0.50,
) -> None:
    """Raised plank walk. Six inches above the mud, which in Consolation is
    the difference between a gentleman and a prospector."""
    # Deck: boards run along the street, so joints are horizontal.
    for row in range(height):
        tone = base - (row / max(1, height - 1)) * 0.10
        for col in range(width):
            dither_pixel(canvas, x + col, y + row, ramp, tone, BAYER4)

    for row in range(0, height, 5):
        canvas.hline(x, y + row, width, ramp.frac(max(0.06, base - 0.14)))

    # Board ends, staggered, so the deck is not one continuous plane.
    column = rng.randrange(9, 24)
    while column < width:
        canvas.vline(x + column, y, height, ramp.frac(max(0.04, base - 0.30)))
        canvas.vline(x + column + 1, y, height, ramp.frac(min(0.95, base + 0.14)))
        column += rng.randrange(21, 44)

    # Front edge, then the shadow it throws onto the mud. The shadow is what
    # lifts it -- without it the walk reads as painted onto the street.
    canvas.hline(x, y + height - 1, width, ramp.frac(min(0.95, base + 0.26)))
    # Fascia: the side of the deck, in shadow, then its shadow on the mud.
    canvas.rect(x, y + height, width, 2, ramp.frac(max(0.05, base - 0.34)))
    canvas.hline(x, y + height, width, ramp.frac(max(0.08, base - 0.20)))
    canvas.hline(x, y + height + 2, width, ramp.frac(0.06))
    for post in range(x + 5, x + width, 29):
        canvas.vline(post, y + height, 3, ramp.frac(0.08))

    if rng.random() < 0.9:
        loose = x + rng.randrange(20, max(21, width - 30))
        canvas.hline(loose, y + 1, 11, ramp.frac(min(0.95, base + 0.30)))
        canvas.hline(loose, y, 11, ramp.frac(max(0.04, base - 0.30)))


# ---------------------------------------------------------------------------
# Street furniture
# ---------------------------------------------------------------------------


def barrel(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    hoops: Ramp,
    rng: random.Random,
    base: float = 0.46,
) -> None:
    """Staved barrel. Bulges at the middle, hoops top and bottom."""
    for row in range(height):
        # Barrel profile: widest at the waist.
        waist = 1.0 - abs((row / max(1, height - 1)) - 0.5) * 2
        inset = max(0, round((1 - waist) * 1.6))
        left, right = x + inset, x + width - inset

        for col in range(left, right):
            across = (col - left) / max(1, (right - left) - 1)
            # Cylindrical shading: lit from the left, hard terminator.
            tone = base + 0.26 * (1 - across) - 0.20 * max(0.0, across - 0.62) * 2.4
            dither_pixel(canvas, col, y + row, ramp, max(0.05, min(0.95, tone)), BAYER2)

        canvas.put(left - 1, y + row, ramp.frac(0.05))
        canvas.put(right, y + row, ramp.frac(0.05))

    for stave in range(x + 2, x + width - 1, 3):
        canvas.vline(stave, y + 1, height - 2, ramp.frac(max(0.05, base - 0.18)))

    for hoop_y in (y + 1, y + height // 2, y + height - 2):
        canvas.hline(x, hoop_y, width, hoops.frac(0.44))
        canvas.hline(x, hoop_y + 1, width, hoops.frac(0.20))

    canvas.hline(x, y, width, ramp.frac(min(0.95, base + 0.28)))
    if rng.random() < 0.4:
        canvas.put(x + width // 2, y + height - 3, ramp.frac(0.08))


def crate(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    base: float = 0.52,
) -> None:
    """Packing crate with corner battens and a diagonal brace."""
    canvas.rect(x, y, width, height, ramp.frac(base))
    for row in range(height):
        tone = base - (row / max(1, height - 1)) * 0.14
        for col in range(width):
            dither_pixel(canvas, x + col, y + row, ramp, tone, BAYER4)

    canvas.outline(x, y, width, height, ramp.frac(0.06))
    batten = ramp.frac(min(0.95, base + 0.20))
    canvas.vline(x + 1, y + 1, height - 2, batten)
    canvas.vline(x + width - 2, y + 1, height - 2, batten)
    canvas.hline(x + 1, y + 1, width - 2, batten)
    canvas.hline(x + 1, y + height - 2, width - 2, batten)
    canvas.line(x + 2, y + height - 3, x + width - 3, y + 2, ramp.frac(max(0.06, base - 0.20)))

    if rng.random() < 0.5:
        canvas.hline(x + 3, y + height // 2, max(2, width - 6), ramp.frac(max(0.06, base - 0.24)))


def hitching_rail(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    rng: random.Random,
    base: float = 0.44,
) -> None:
    """Two posts and a rail. Reads at a glance, which is the requirement."""
    rail_y = y
    canvas.rect(x, rail_y, width, 2, ramp.frac(base + 0.14))
    canvas.hline(x, rail_y + 2, width, ramp.frac(max(0.04, base - 0.28)))

    for post_x in (x + 1, x + width - 4):
        canvas.rect(post_x, rail_y, 3, height, ramp.frac(base))
        canvas.vline(post_x, rail_y, height, ramp.frac(min(0.95, base + 0.20)))
        canvas.vline(post_x + 2, rail_y, height, ramp.frac(max(0.04, base - 0.30)))
        # Contact shadow. Without it the post floats.
        canvas.hline(post_x - 1, rail_y + height, 5, ramp.frac(0.08))

    if rng.random() < 0.7:
        canvas.put(x + width // 2, rail_y - 1, ramp.frac(max(0.04, base - 0.24)))


def water_trough(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    wood: Ramp,
    water: Ramp,
    rng: random.Random,
    base: float = 0.42,
) -> None:
    """Trough with three inches of water and a great deal of ambition."""
    canvas.rect(x, y, width, height, wood.frac(base))

    # Water sits proud of the rim, flat and slightly reflective.
    water_h = max(2, height // 3)
    for row in range(water_h):
        tone = 0.30 + (row / max(1, water_h - 1)) * 0.14
        for col in range(1, width - 1):
            dither_pixel(canvas, x + col, y + row, water, tone, BAYER2)
    canvas.hline(x + 1, y, width - 2, water.frac(0.66))

    for row in range(water_h, height):
        tone = base - ((row - water_h) / max(1, height - water_h)) * 0.16
        for col in range(width):
            dither_pixel(canvas, x + col, y + row, wood, tone, BAYER4)

    for stave in range(x + 3, x + width - 2, 5):
        canvas.vline(stave, y + water_h, height - water_h, wood.frac(max(0.05, base - 0.22)))

    canvas.outline(x, y, width, height, wood.frac(0.06))
    canvas.hline(x, y + height, width, wood.frac(0.08))

    if rng.random() < 0.8:
        canvas.put(x + 2, y + 1, water.frac(0.82))


# ---------------------------------------------------------------------------
# Composite
# ---------------------------------------------------------------------------


def building(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    palette: Palette,
    rng: random.Random,
    wall_family: str = "pine_weathered",
    wall_tone: float = 0.52,
    weathering: float = 1.0,
    accent: str | None = None,
    cornice_height: int = 13,
    door_at: float | None = 0.5,
    window_count: int = 2,
    lit_windows: bool = False,
    roof: bool = False,
) -> None:
    """A false-fronted frontier building: cornice, wall, openings.

    Two storeys tall in front and one storey deep, per the Bible -- the depth
    is implied by the cornice sitting proud of the wall and casting a seam.
    """
    wall = palette.family(wall_family)
    accent_ramp = palette.family(accent) if accent else None

    if roof:
        shingle_roof(canvas, x, y - 5, width, 6, palette.family("umber"), rng, base=0.36)

    false_front_cornice(canvas, x, y, width, cornice_height, wall, base=wall_tone + 0.08, accent=accent_ramp)

    body_y = y + cornice_height
    body_h = height - cornice_height
    plank_wall(canvas, x, body_y, width, body_h, wall, rng, base=wall_tone, weathering=weathering)

    # Corner boards frame the facade and stop the planks running off the edge.
    corner = wall.frac(min(0.95, wall_tone + 0.18))
    canvas.rect(x, body_y, 2, body_h, corner)
    canvas.rect(x + width - 2, body_y, 2, body_h, corner)
    canvas.vline(x, body_y, body_h, wall.frac(0.06))
    canvas.vline(x + width - 1, body_y, body_h, wall.frac(0.06))

    glass = palette.family("grey")
    usable_h = body_h

    if window_count > 0 and usable_h >= 16:
        win_w = max(9, min(15, width // (window_count + 1)))
        win_h = min(18, usable_h - 10)
        spacing = width / (window_count + 1)
        for index in range(window_count):
            wx = x + int(spacing * (index + 1)) - win_w // 2
            window(canvas, wx, body_y + 4, win_w, win_h, wall, glass, rng, lit=lit_windows)

    if door_at is not None and usable_h >= 20:
        door_w = max(14, min(21, width // 3))
        door_h = min(30, usable_h - 4)
        dx = x + int(width * door_at) - door_w // 2
        door(canvas, dx, body_y + body_h - door_h, door_w, door_h, wall, rng, base=wall_tone - 0.10)


def ridge_range(
    canvas: IndexedCanvas,
    ramp: Ramp,
    tone: float,
    baseline: int,
    crest_min: int,
    crest_max: int,
    rng: random.Random,
    *,
    step: int = 18,
    feather: int = 5,
) -> None:
    """One range of hills with a dithered top edge.

    Aerial perspective is the whole job here: distance is read as *loss of
    contrast*, not as a different colour. A far range is therefore drawn a
    hair below the sky's own value, and its crest dissolves into the sky over
    a few rows instead of landing on a hard line -- a crisp silhouette at the
    back of a picture reads as nearer than everything in front of it.
    """
    points: list[tuple[int, int]] = []
    col = -step
    while col < canvas.width + step * 2:
        points.append((col, rng.randint(crest_min, crest_max)))
        col += step

    for col in range(canvas.width):
        crest = points[-1][1]
        for index in range(len(points) - 1):
            x0, y0 = points[index]
            x1, y1 = points[index + 1]
            if x0 <= col <= x1:
                blend = (col - x0) / max(1, x1 - x0)
                # Smoothstep, so ridges roll rather than zigzag.
                eased = blend * blend * (3 - 2 * blend)
                crest = int(y0 + (y1 - y0) * eased)
                break
        solid = ramp.frac(tone)
        for row in range(crest, baseline + 1):
            depth = row - crest
            if depth < feather:
                # Only the crest dithers, and it dithers into whatever is
                # already behind it. Dithering the whole body against a sky of
                # almost the same value produces a checkerboard that reads as
                # texture -- the exact failure the haze band had twice.
                if BAYER8.threshold(col, row) > (depth + 0.5) / feather:
                    continue
            canvas.put(col, row, solid)
