"""Anonymous background figures. Doc 19's rule, stated there once:

    Crowds are background. Individuals are sprites.

A crowd is texture -- non-approachable, never spoken to, never in the way of
a hotspot -- so it is drawn into the composition like furniture is. Doc 11's
no-figures rule is about characters the player interacts with, and none of
these are. Ruling 19b's first resolution is what asks for them: a LOOK line
naming eleven men in a visibly empty room is a contradiction the player can
see, and the room has a hotspot called THE PATRONS.

They are deliberately CRUDE. Two rules hold the whole module together:

  1. They must not out-draw the actor. Thad is a drawn character with a face
     and a walk; these are shapes with hats. If a background man is as
     articulated as the protagonist, the player will try to talk to him.
  2. They must not out-draw the room. Every one of them is authored dark, in
     the room's own families, at the bottom of its ramps -- so the eye still
     goes to the chandelier, the window and the bar, which is where the
     composition was already sending it.

Scale follows depth like everything else: they are drawn at whatever height
the depth zone gives, not at a fixed size, and a seated man is short because
a chair is short and not because he is far away.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from palette import Palette

#: Coats, in the room's own families. Warm and dim: an 1858 saloon at eleven
#: in the morning is full of men in the one coat they own.
#: Dark families only. pine_weathered and grey were in here and came out
#: pale wherever the light lands -- a man standing in the window shaft is
#: correctly lit, but a lit man with no internal contrast reads as a sack.
#: mud went too: a mud-family coat is the floor's own family, so it is either
#: invisible against the floor or, once the shaft lifts it, pink.
GARMENTS = ("umber", "pine_green", "dusk", "accent_indigo")


def _garment(palette: Palette, rng, tone: float):
    return palette.family(GARMENTS[rng.randrange(len(GARMENTS))]), tone


def standing(
    canvas: IndexedCanvas, palette: Palette, x: int, feet_y: int, height: int, rng,
    hat: bool = True, facing: int = 0, tone: float = 0.14,
) -> tuple[int, int, int, int]:
    """A man standing, seen from behind or three-quarters. Returns his bounds.

    `facing` is -1, 0 or 1 and only moves the shoulders and the hat brim by a
    pixel. At this size it is the difference between a row of identical
    cutouts and a group of people, and it costs almost nothing.
    """
    cloth, base = _garment(palette, rng, tone)
    dark = palette.family("void")

    # Proportions, not fractions of a box. The first version divided the
    # height into thirds and drew a rectangle per third, and eleven of them
    # read as eleven barrels: a person is narrow at the head, wide at the
    # shoulder and split at the legs, and if those three are not there the
    # size does not matter.
    head_h = max(3, round(height * 0.16))
    leg_h = max(4, round(height * 0.34))
    body_h = height - head_h - leg_h - 1                     # 1 for the neck
    width = max(5, round(height * 0.26))
    left = x - width // 2

    # Legs, with daylight between them.
    hip = feet_y - leg_h
    canvas.vline(left + 1, hip, leg_h, cloth.frac(max(0.04, base - 0.12)))
    canvas.vline(left + 2, hip, leg_h, cloth.frac(max(0.03, base - 0.16)))
    canvas.vline(left + width - 2, hip, leg_h, cloth.frac(max(0.04, base - 0.13)))
    canvas.vline(left + width - 3, hip, leg_h, cloth.frac(max(0.03, base - 0.17)))
    canvas.hline(left + 1, feet_y - 1, width - 2, dark.at(0))            # boots in the dirt

    # Coat: widest at the shoulder, narrowing to the hem, with the arms a
    # step darker than the back so the mass is not one slab.
    body_top = hip - body_h
    for row in range(body_h):
        inset = 1 if row >= body_h - 2 else 0
        canvas.hline(left + inset, body_top + row, width - inset * 2, cloth.frac(base))
    canvas.hline(left, body_top, width, cloth.frac(min(0.9, base + 0.16)))     # lit shoulder
    canvas.vline(left, body_top + 1, body_h - 1, cloth.frac(max(0.03, base - 0.09)))
    canvas.vline(left + width - 1, body_top + 1, body_h - 1, cloth.frac(max(0.03, base - 0.13)))

    # Neck, then a head narrower than the shoulders. That difference is most
    # of what says "man" at twenty-six pixels.
    head_w = max(3, width - 4)
    head_x = left + (width - head_w) // 2 + facing
    canvas.hline(head_x, body_top - 1, head_w, cloth.frac(max(0.03, base - 0.14)))
    head_top = body_top - 1 - head_h
    canvas.rect(head_x, head_top, head_w, head_h, palette.family("dust").frac(0.20))
    canvas.vline(head_x + head_w - 1, head_top, head_h, palette.family("dust").frac(0.12))
    if hat:
        canvas.hline(head_x - 1, head_top, head_w + 2, cloth.frac(max(0.03, base - 0.08)))
        canvas.hline(head_x, head_top - 1, head_w, cloth.frac(max(0.04, base - 0.02)))
        head_top -= 1

    # A keyline, in void, which has one entry and therefore cannot be lifted
    # by the lighting pass. Without it these read fine in shadow and dissolve
    # into pale sacks wherever the window shaft or the chandelier lands on
    # them -- lit correctly, and unreadable, which is the worst combination.
    _keyline(canvas, dark, left, body_top, width, body_h, head_x, head_top, head_w,
             body_top - head_top)
    return left - 1, head_top, width + 2, feet_y - head_top


def seated(
    canvas: IndexedCanvas, palette: Palette, x: int, table_top: int, height: int, rng,
    hat: bool = True, facing: int = 0, tone: float = 0.12,
) -> tuple[int, int, int, int]:
    """A man at a table: head and shoulders above the top, and nothing else.

    Drawing legs under a table is drawing something nobody can see, and at
    this size the two pixels it would cost are two pixels of noise. What
    makes a seated figure read is that his shoulders START at the table.
    """
    cloth, base = _garment(palette, rng, tone)
    head_h = max(3, round(height * 0.30))
    width = max(6, round(height * 0.55))
    left = x - width // 2

    shoulder_h = height - head_h - 1
    body_top = table_top - shoulder_h
    for row in range(shoulder_h):
        canvas.hline(left + (1 if row == 0 else 0), body_top + row,
                     width - (2 if row == 0 else 0), cloth.frac(base))
    canvas.hline(left + 1, body_top, width - 2, cloth.frac(min(0.9, base + 0.14)))
    canvas.vline(left + width - 1, body_top + 1, shoulder_h - 1, cloth.frac(max(0.03, base - 0.12)))

    head_w = max(3, width - 4)
    head_x = left + (width - head_w) // 2 + facing
    canvas.hline(head_x, body_top - 1, head_w, cloth.frac(max(0.03, base - 0.14)))
    head_top = body_top - 1 - head_h
    canvas.rect(head_x, head_top, head_w, head_h, palette.family("dust").frac(0.20))
    canvas.vline(head_x + head_w - 1, head_top, head_h, palette.family("dust").frac(0.12))
    if hat:
        canvas.hline(head_x - 1, head_top, head_w + 2, cloth.frac(max(0.03, base - 0.08)))
    _keyline(canvas, palette.family("void"), left, body_top, width, shoulder_h,
             head_x, head_top, head_w, body_top - head_top)
    return left - 1, head_top, width + 2, table_top - head_top


def _keyline(canvas, dark, left, body_top, width, body_h,
             head_x, head_top, head_w, head_h) -> None:
    """One dark pixel down each edge. Cheap, and it is the whole difference."""
    canvas.vline(left - 1, body_top, body_h, dark.at(0))
    canvas.vline(left + width, body_top, body_h, dark.at(0))
    canvas.vline(head_x - 1, head_top, head_h, dark.at(0))
    canvas.vline(head_x + head_w, head_top, head_h, dark.at(0))
    canvas.hline(head_x - 1, head_top - 1, head_w + 2, dark.at(0))


def overlaps(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah
