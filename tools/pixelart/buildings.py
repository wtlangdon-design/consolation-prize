"""False fronts, porches, and the six businesses on Main Street.

The false front is the whole game stated as architecture: a tall decorative
board nailed to the front of a shallow shed, so the building looks like two
storeys from the street and is one storey deep from anywhere else.

Drawing it dead-on is the hard part, because from directly in front a
parapet hides the roof it is lying about. Three cues do the work instead:

  * The parapet is *stepped* -- a raised centre with lower shoulders -- and
    the real roof ridge sits between the two heights. So the roof shows in
    the notch above each shoulder. This is both how these were actually
    built and the clearest possible read of the lie.
  * The shed roof is drawn wider than the facade, so it also shows in the
    alley gaps either side.
  * The roof is a shallow shingle plane in a duller, cooler tone than the
    painted board in front of it, so the two never merge.

Sun is warm, from frame left. Everything that projects throws a shadow to
the right, and shadows are cast by stepping colours down their own family
ramp rather than by washing toward black.
"""

from __future__ import annotations

import random

from canvas import IndexedCanvas
from components import door, plank_wall, shingle_roof, window
from dither import BAYER2, BAYER4, dither_pixel
from palette import Palette, Ramp

SUN_FROM_LEFT = True


# ---------------------------------------------------------------------------
# Light
# ---------------------------------------------------------------------------


def cast_shadow(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    height: int,
    steps: int = 2,
    soft_edge: int = 0,
) -> None:
    """Darkens whatever is already there, in place, by material.

    A shadow is the same surface with less light on it, so this steps each
    pixel down its own family's ramp. Painting a translucent black over the
    top would flatten five materials into one grey.
    """
    for row in range(max(0, y), min(canvas.height, y + height)):
        for col in range(max(0, x), min(canvas.width, x + width)):
            canvas.put(col, row, palette.darken(canvas.get(col, row), steps))

    # Optional dithered fade along the right edge, where a shadow runs out.
    for offset in range(soft_edge):
        col = x + width + offset
        if not 0 <= col < canvas.width:
            continue
        for row in range(max(0, y), min(canvas.height, y + height)):
            if (col + row) % (offset + 2) == 0:
                canvas.put(col, row, palette.darken(canvas.get(col, row), 1))


def diagonal_shadow(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    length: int,
    thickness: int,
    steps: int = 2,
    slope: float = 1.6,
) -> None:
    """A post's shadow raking away to the right across a flat surface."""
    for step in range(length):
        col = x + int(step * slope)
        for inner in range(thickness):
            canvas.put(col + inner, y + step, palette.darken(canvas.get(col + inner, y + step), steps))


# ---------------------------------------------------------------------------
# The false front
# ---------------------------------------------------------------------------


def false_front(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    parapet_top: int,
    width: int,
    ground: int,
    wall: Ramp,
    rng: random.Random,
    *,
    wall_tone: float = 0.50,
    weathering: float = 1.0,
    roof_family: str = "umber",
    shoulder_drop: int = 13,
    roof_drop: int = 6,
    shoulder_width: int | None = None,
    trim: Ramp | None = None,
    battens: bool = True,
) -> int:
    """Draws the lie. Returns the y of the shoulder line, for placing signs.

    Vertical order, top down:
        parapet_top      the raised centre of the board
        +roof_drop       the real roof ridge, behind
        +shoulder_drop   the shoulders of the board, and the top of the wall
        ...              wall
        ground           the boardwalk
    """
    shoulder = shoulder_width if shoulder_width is not None else max(5, width // 5)
    roof_y = parapet_top + roof_drop
    shoulder_y = parapet_top + shoulder_drop
    roof = palette.family(roof_family)

    # 1. The real shed roof, behind and wider than the front, so it shows
    #    both in the shoulder notches and out into the alleys.
    roof_h = shoulder_y - roof_y + 3
    shingle_roof(canvas, x - 3, roof_y, width + 6, roof_h, roof, rng, course_height=3, base=0.38)
    canvas.hline(x - 3, roof_y, width + 6, roof.frac(0.46))          # ridge, catching light
    canvas.hline(x - 3, roof_y + 1, width + 6, roof.frac(0.22))

    # 2. The board. Centre runs full height; shoulders start lower, and the
    #    gap between them is where the roof behind becomes visible.
    centre_x = x + shoulder
    centre_w = width - shoulder * 2

    plank_wall(canvas, centre_x, parapet_top, centre_w, ground - parapet_top, wall, rng,
               base=wall_tone, weathering=weathering, battens=battens)
    plank_wall(canvas, x, shoulder_y, shoulder, ground - shoulder_y, wall, rng,
               base=wall_tone, weathering=weathering, battens=battens)
    plank_wall(canvas, x + width - shoulder, shoulder_y, shoulder, ground - shoulder_y, wall, rng,
               base=wall_tone, weathering=weathering, battens=battens)

    # 3. Cornices. A capping board proud of the face on every top edge --
    #    this is the only ornament most of these buildings ever got.
    trim_ramp = trim if trim is not None else wall
    cap = trim_ramp.frac(min(0.95, wall_tone + 0.26))
    shade = wall.frac(max(0.03, wall_tone - 0.34))

    canvas.rect(centre_x - 2, parapet_top, centre_w + 4, 2, cap)
    canvas.hline(centre_x - 2, parapet_top + 2, centre_w + 4, shade)
    
    for shoulder_x in (x, x + width - shoulder):
        canvas.rect(shoulder_x - 1, shoulder_y, shoulder + 2, 2, cap)
        canvas.hline(shoulder_x - 1, shoulder_y + 2, shoulder + 2, shade)

    # 4. Corner boards, framing the whole facade.
    canvas.rect(x, shoulder_y, 2, ground - shoulder_y, trim_ramp.frac(min(0.95, wall_tone + 0.16)))
    canvas.rect(x + width - 2, shoulder_y, 2, ground - shoulder_y, trim_ramp.frac(min(0.95, wall_tone + 0.16)))
    canvas.vline(x, shoulder_y, ground - shoulder_y, wall.frac(0.06))
    canvas.vline(x + width - 1, shoulder_y, ground - shoulder_y, wall.frac(0.06))

    # 5. Sun from the left: the right-hand shoulder and the right edge of the
    #    raised centre sit in their own shadow.
    cast_shadow(canvas, palette, x + width - shoulder - 2, shoulder_y, shoulder + 2, ground - shoulder_y, steps=1)
    cast_shadow(canvas, palette, centre_x + centre_w - 3, parapet_top, 3, shoulder_y - parapet_top, steps=1)

    return shoulder_y


def signboard(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    height: int,
    board: Ramp,
    *,
    tone: float = 0.24,
    bracketed: bool = False,
) -> None:
    """A blank signboard. Geometry only.

    No glyphs anywhere -- lettering is rendered by the engine in the game
    font at runtime, so a painted-in word here would be a second, wrong copy
    that could never be edited without touching art.
    """
    canvas.rect(x, y, width, height, board.frac(tone))
    canvas.outline(x, y, width, height, board.frac(max(0.02, tone - 0.16)))
    canvas.hline(x + 1, y + 1, width - 2, board.frac(min(0.95, tone + 0.22)))
    canvas.hline(x + 1, y + height - 2, width - 2, board.frac(max(0.03, tone - 0.10)))
    cast_shadow(canvas, palette, x + 1, y + height, width, 2, steps=2)

    if bracketed:
        for bracket_x in (x + 2, x + width - 4):
            canvas.rect(bracket_x, y - 2, 2, 2, board.frac(max(0.03, tone - 0.14)))


# ---------------------------------------------------------------------------
# Porches
# ---------------------------------------------------------------------------


def porch(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    ground: int,
    wall: Ramp,
    rng: random.Random,
    *,
    thickness: int = 5,
    posts: int = 3,
    tone: float = 0.46,
    post_tone: float = 0.34,
) -> None:
    """A projecting awning on posts over the boardwalk.

    The defining silhouette of a frontier street, and the thing that makes a
    row of sheds read as a town. Drawn as its front fascia plus the shadow it
    throws: the wall beneath goes into shade, the deck beneath goes into
    shade, and each post rakes a shadow to the right.
    """
    # Everything the awning covers loses its light first, so the fascia and
    # posts draw over an already-shaded wall.
    cast_shadow(canvas, palette, x, y + thickness, width, ground - y - thickness, steps=1)
    cast_shadow(canvas, palette, x, ground, width, 4, steps=2, soft_edge=3)

    # Fascia board. Projects two pixels past the building either side and
    # carries a hard light/dark pair, because at 320x144 a projecting plane
    # is read entirely from the edge where it stops catching the sun.
    canvas.hline(x - 3, y - 1, width + 6, wall.frac(min(0.95, tone + 0.40)))   # top plane, raking sun
    canvas.rect(x - 2, y, width + 4, thickness, wall.frac(tone))
    canvas.hline(x - 2, y, width + 4, wall.frac(min(0.95, tone + 0.34)))
    canvas.hline(x - 2, y + 1, width + 4, wall.frac(min(0.95, tone + 0.16)))
    canvas.hline(x - 2, y + thickness - 1, width + 4, wall.frac(max(0.03, tone - 0.32)))
    # Soffit: the underside, which never sees sun and is what separates the
    # awning from the wall behind it.
    canvas.rect(x - 2, y + thickness, width + 4, 2, wall.frac(max(0.02, tone - 0.44)))
    canvas.put(x - 2, y + thickness, wall.frac(max(0.02, tone - 0.28)))

    # Posts, evenly spread, standing on the deck.
    if posts > 0:
        spacing = (width - 4) / max(1, posts - 1) if posts > 1 else 0
        for index in range(posts):
            post_x = x + 2 + int(spacing * index)
            canvas.rect(post_x, y + thickness + 2, 2, ground - y - thickness - 1, wall.frac(post_tone))
            canvas.vline(post_x, y + thickness, ground - y - thickness + 1, wall.frac(min(0.95, post_tone + 0.22)))
            canvas.vline(post_x + 1, y + thickness, ground - y - thickness + 1, wall.frac(max(0.03, post_tone - 0.20)))
            # Bracket where post meets awning.
            canvas.put(post_x + 2, y + thickness, wall.frac(post_tone))
            canvas.put(post_x - 1, y + thickness, wall.frac(post_tone))
            diagonal_shadow(canvas, palette, post_x + 2, ground + 1, 4, 2, steps=2, slope=1.4)


def balcony(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    wall: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.48,
) -> None:
    """An upper balcony. Only the hotel has one, and it is the only thing on
    the street that suggests anybody ever stands still outside."""
    deck_h = 3
    canvas.rect(x, y, width, deck_h, wall.frac(tone))
    canvas.hline(x, y, width, wall.frac(min(0.95, tone + 0.26)))
    canvas.hline(x, y + deck_h - 1, width, wall.frac(max(0.03, tone - 0.32)))
    cast_shadow(canvas, palette, x, y + deck_h, width, 5, steps=2)

    # Railing: top rail, bottom rail, balusters between.
    rail_y = y - 8
    canvas.rect(x + 1, rail_y, width - 2, 2, wall.frac(min(0.95, tone + 0.18)))
    canvas.rect(x + 1, y - 2, width - 2, 1, wall.frac(max(0.05, tone - 0.14)))
    for baluster in range(x + 3, x + width - 3, 4):
        canvas.vline(baluster, rail_y + 2, 6, wall.frac(max(0.05, tone - 0.10)))

    for post_x in (x + 1, x + width - 3):
        canvas.rect(post_x, rail_y - 2, 2, 12, wall.frac(max(0.05, tone - 0.06)))


# ---------------------------------------------------------------------------
# Openings, by trade
# ---------------------------------------------------------------------------


def batwing_doors(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    height: int,
    wall: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.42,
) -> None:
    """Saloon doors: two short leaves with daylight above and below them.

    The gaps are the whole read. A full-height door here would be any door.
    """
    # The opening behind, dark and warm rather than black.
    canvas.rect(x, y, width, height, wall.frac(0.12))
    canvas.rect(x - 2, y - 3, width + 4, 3, wall.frac(min(0.95, tone + 0.28)))
    canvas.hline(x - 2, y, width + 4, wall.frac(0.03))

    leaf_h = int(height * 0.52)
    leaf_y = y + (height - leaf_h) // 2
    leaf_w = width // 2 - 1

    for index, leaf_x in enumerate((x, x + width - leaf_w)):
        canvas.rect(leaf_x, leaf_y, leaf_w, leaf_h, wall.frac(tone))
        canvas.vline(leaf_x, leaf_y, leaf_h, wall.frac(min(0.95, tone + 0.20)))
        canvas.vline(leaf_x + leaf_w - 1, leaf_y, leaf_h, wall.frac(max(0.04, tone - 0.24)))
        canvas.hline(leaf_x, leaf_y, leaf_w, wall.frac(min(0.95, tone + 0.14)))
        canvas.hline(leaf_x, leaf_y + leaf_h - 1, leaf_w, wall.frac(max(0.04, tone - 0.24)))
        for slat in range(leaf_y + 2, leaf_y + leaf_h - 1, 3):
            canvas.hline(leaf_x + 1, slat, leaf_w - 2, wall.frac(max(0.05, tone - 0.14)))
        # One leaf hangs slightly open.
        if index == 1 and rng.random() < 0.8:
            canvas.vline(leaf_x - 1, leaf_y, leaf_h, wall.frac(0.04))

    canvas.vline(x + width // 2, leaf_y, leaf_h, wall.frac(0.04))


def display_window(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    width: int,
    height: int,
    frame: Ramp,
    glass: Ramp,
    rng: random.Random,
    *,
    tone: float = 0.54,
    glass_tone: float = 0.22,
) -> None:
    """A wide shop window with goods stacked behind it.

    The goods are silhouettes only -- at this size a tin of peaches and a
    boot are the same four pixels, and pretending otherwise reads as noise.
    """
    canvas.rect(x, y, width, height, frame.frac(tone))
    canvas.outline(x, y, width, height, frame.frac(max(0.03, tone - 0.40)))

    inner_x, inner_y = x + 2, y + 2
    inner_w, inner_h = width - 4, height - 4

    for row in range(inner_h):
        shade = glass_tone - (row / max(1, inner_h - 1)) * 0.12
        for col in range(inner_w):
            dither_pixel(canvas, inner_x + col, inner_y + row, glass, max(0.04, shade), BAYER4)

    # Stock on the sill, in silhouette.
    shelf_y = inner_y + inner_h - 1
    cursor = inner_x + 1
    while cursor < inner_x + inner_w - 2:
        item_w = rng.randrange(2, 5)
        item_h = rng.randrange(2, min(6, inner_h - 1))
        canvas.rect(cursor, shelf_y - item_h, item_w, item_h, glass.frac(0.06))
        canvas.hline(cursor, shelf_y - item_h, item_w, glass.frac(0.30))
        cursor += item_w + rng.randrange(1, 3)

    # Mullions: a shop window is big panes, not a domestic grid.
    for index in range(1, 3):
        canvas.vline(inner_x + index * inner_w // 3, inner_y, inner_h, frame.frac(min(0.95, tone + 0.16)))
    canvas.hline(inner_x, inner_y + 2, inner_w, frame.frac(min(0.95, tone + 0.16)))

    # A raking reflection across the upper panes.
    for step in range(min(inner_w, inner_h - 2)):
        canvas.put(inner_x + step, inner_y + (inner_h - 3) - step, glass.frac(0.46))

    canvas.rect(x - 1, y + height - 1, width + 2, 2, frame.frac(min(0.95, tone + 0.12)))
    cast_shadow(canvas, palette, x - 1, y + height + 1, width + 2, 2, steps=2)
