"""Anonymous background figures. Doc 19's rule, stated there once:

    Crowds are background. Individuals are sprites.

A crowd is texture -- non-approachable, never spoken to, never in the way of
a hotspot -- so it is drawn into the composition like furniture is. Doc 11's
no-figures rule is about characters the player interacts with, and none of
these are. Ruling 19b's first resolution is what asks for them: a LOOK line
naming eleven men in a visibly empty room is a contradiction the player can
see, and the room has a hotspot called THE PATRONS.

ERRATA 32c NAMED THESE THE WORST CASE IN THE PROJECT, and the diagnosis was
exact: eleven identical dark rounded rectangles with a head block, in the
room where the crowd IS the subject. Detail is a hierarchy and they carried
the least of it in the frame.

The fix is not more detail on all eleven -- that breaks rule 1 below. It is
INDIVIDUALITY OF SILHOUETTE, which is nearly free, plus real detail on the
two or three nearest. A crowd reads as people when no two outlines match:
different headgear, different posture, an arm where another man has none. It
reads as wallpaper when eleven copies differ only in the colour of the coat,
which is what it was doing.

Every variation is derived from the figure's own index rather than from the
shared rng, so a man keeps his hat when something upstream draws one more
barrel.

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


def _garment(palette: Palette, rng, tone: float, named: str | None = None):
    """The coat. Random for the crowd, NAMED for a character.

    The crowd is anonymous and a random pick out of four dark families is
    exactly right for it. A named character is not anonymous, and the one
    thing that must not happen by accident is a man the player has to
    recognise wearing the protagonist's coat family -- Thad is pine_green,
    and a green Deke Vessel in the same frame is two green men.
    """
    if named is not None:
        if named not in GARMENTS:
            raise ValueError(f"{named} is not one of the crowd's families: {GARMENTS}")
        return palette.family(named), tone
    return palette.family(GARMENTS[rng.randrange(len(GARMENTS))]), tone


#: The silhouette variations. Errata 32c: what makes a crowd read as people
#: is that no two OUTLINES match, and headgear plus posture does that for
#: about four pixels a man.
HATS = ("slouch", "stovepipe", "cap", "bare", "back")
POSTURES = ("upright", "lean", "hunch", "hip")


def _build(seed: int) -> dict:
    """One man's silhouette, from his own index. Stable under upstream change."""
    return {
        "hat": HATS[seed % len(HATS)],
        "posture": POSTURES[(seed // 5) % len(POSTURES)],
        "arm": (seed // 3) % 3,          # 0 none, 1 hanging, 2 bent
        "girth": (seed * 7) % 3 - 1,     # a pixel either way on the shoulders
        "stoop": (seed // 7) % 2,        # a pixel off the head height
    }


def _headgear(canvas, cloth, base, kind, head_x, head_top, head_w) -> int:
    """Draws the hat and returns how far above the head it reaches.

    The old one was a single hline, which is a hair parting rather than a
    hat. At this size the brim WIDTH and the crown HEIGHT are the two things
    that separate one man from another across a room.
    """
    if kind == "bare":
        return 0
    if kind == "slouch":                              # wide brim, low crown
        canvas.hline(head_x - 2, head_top, head_w + 4, cloth.frac(max(0.03, base - 0.08)))
        canvas.hline(head_x, head_top - 1, head_w, cloth.frac(max(0.04, base - 0.02)))
        return 1
    if kind == "stovepipe":                           # narrow, tall
        canvas.hline(head_x - 1, head_top, head_w + 2, cloth.frac(max(0.03, base - 0.08)))
        canvas.rect(head_x + 1, head_top - 3, max(2, head_w - 2), 3,
                    cloth.frac(max(0.04, base - 0.04)))
        return 3
    if kind == "cap":                                 # no brim to speak of
        canvas.hline(head_x, head_top - 1, head_w, cloth.frac(max(0.04, base - 0.02)))
        return 1
    # pushed back off the forehead: brim high on one side, crown behind
    canvas.hline(head_x, head_top - 1, head_w + 1, cloth.frac(max(0.03, base - 0.08)))
    canvas.put(head_x + head_w, head_top - 2, cloth.frac(max(0.04, base - 0.02)))
    return 2


def standing(
    canvas: IndexedCanvas, palette: Palette, x: int, feet_y: int, height: int, rng,
    hat: bool = True, facing: int = 0, tone: float = 0.14, pose: int = 0,
    glass: bool = False, seed: int = 0, garment: str | None = None,
) -> tuple[int, int, int, int]:
    """A man standing, seen from behind or three-quarters. Returns his bounds.

    `facing` is -1, 0 or 1 and only moves the shoulders and the hat brim by a
    pixel. At this size it is the difference between a row of identical
    cutouts and a group of people, and it costs almost nothing.
    """
    cloth, base = _garment(palette, rng, tone, garment)
    dark = palette.family("void")

    # Proportions, not fractions of a box. The first version divided the
    # height into thirds and drew a rectangle per third, and eleven of them
    # read as eleven barrels: a person is narrow at the head, wide at the
    # shoulder and split at the legs, and if those three are not there the
    # size does not matter.
    build = _build(seed)
    head_h = max(3, round(height * 0.16))
    leg_h = max(4, round(height * 0.34))
    body_h = height - head_h - leg_h - 1                     # 1 for the neck
    width = max(5, round(height * 0.26) + build["girth"])
    left = x - width // 2
    # Posture: where the shoulders sit relative to the hips, and how far the
    # head drops toward them. Two pixels of difference, and it is the
    # difference between a rank of cutouts and a group of men waiting.
    sway = {"upright": 0, "lean": 1, "hunch": 0, "hip": -1}[build["posture"]]
    stoop = build["stoop"] + (1 if build["posture"] == "hunch" else 0)

    # Ruling 20's second frame. One pixel of weight shift: the legs stay put
    # and everything above the hip comes up. That is the whole animation, and
    # at 27 pixels it is the right amount -- a bigger move at this size reads
    # as a walk cycle, and ruling 20 is explicit that these are idles.
    lift = 1 if pose else 0

    # Legs, with daylight between them.
    hip = feet_y - leg_h
    canvas.vline(left + 1, hip, leg_h, cloth.frac(max(0.04, base - 0.12)))
    canvas.vline(left + 2, hip, leg_h, cloth.frac(max(0.03, base - 0.16)))
    canvas.vline(left + width - 2, hip, leg_h, cloth.frac(max(0.04, base - 0.13)))
    canvas.vline(left + width - 3, hip, leg_h, cloth.frac(max(0.03, base - 0.17)))
    canvas.hline(left + 1, feet_y - 1, width - 2, dark.at(0))            # boots in the dirt

    # Coat: widest at the shoulder, narrowing to the hem, with the arms a
    # step darker than the back so the mass is not one slab.
    body_top = hip - body_h - lift
    for row in range(body_h + lift):
        inset = 1 if row >= body_h + lift - 2 else 0
        # The shoulders drift over the hips by `sway`, easing to nothing at
        # the waist -- a man leaning on a bar is not a parallelogram.
        drift = round(sway * (1 - row / max(1, body_h)))
        canvas.hline(left + inset + drift, body_top + row, width - inset * 2, cloth.frac(base))
    canvas.hline(left + sway, body_top, width, cloth.frac(min(0.9, base + 0.16)))  # lit shoulder
    canvas.vline(left + sway, body_top + 1, body_h - 1, cloth.frac(max(0.03, base - 0.09)))
    canvas.vline(left + width - 1 + sway, body_top + 1, body_h - 1,
                 cloth.frac(max(0.03, base - 0.13)))

    # AN ARM. The coat was a solid slab from shoulder to hem on all eleven,
    # and an arm is two pixels wide -- a hanging one breaks the outline at
    # the elbow, a bent one puts a hand where the bar is.
    # It has to be OUTSIDE the coat. The first version drew it in the body's
    # last column, a step darker -- which is invisible against a dark coat
    # and changes nothing about the outline, and the outline is the entire
    # point. An arm that does not break the silhouette is not an arm.
    if build["arm"]:
        side = 1 if facing >= 0 else -1
        edge = (left + width + sway) if side > 0 else (left - 1 + sway)
        elbow = body_top + max(3, body_h // 2)
        canvas.vline(edge, body_top + 2, elbow - body_top - 1,
                     cloth.frac(max(0.04, base - 0.06)))
        canvas.vline(edge, body_top + 2, 1, cloth.frac(min(0.9, base + 0.10)))
        if build["arm"] == 2:                       # bent, hand forward
            canvas.hline(min(edge, edge + side * 2), elbow, 3,
                         cloth.frac(max(0.04, base - 0.04)))
            canvas.put(edge + side * 2, elbow, palette.family("dust").frac(0.22))
        else:                                       # hanging, hand at the hip
            canvas.vline(edge, elbow, max(2, body_h - (elbow - body_top)),
                         cloth.frac(max(0.04, base - 0.10)))
            canvas.put(edge, hip - 1, palette.family("dust").frac(0.20))

    # STANCE. Every man had both boots square under him. One foot forward, or
    # up on the bar rail, is two pixels and it is the last thing separating
    # eleven outlines.
    if build["posture"] == "lean":
        canvas.hline(left + width - 1, feet_y - max(2, leg_h // 3), 2,
                     cloth.frac(max(0.03, base - 0.14)))
    elif build["posture"] == "hip":
        canvas.hline(left - 1, feet_y - 1, 2, dark.at(0))
    # A glass, going up on the second frame. One pixel of sky family, which
    # is the only cold thing on a man in a warm room and so reads as glass.
    if glass:
        canvas.put(left + width, body_top + 2 - lift * 2, palette.family("sky").frac(0.62))

    # Neck, then a head narrower than the shoulders. That difference is most
    # of what says "man" at twenty-six pixels.
    head_w = max(3, width - 4)
    head_x = left + (width - head_w) // 2 + facing + sway
    canvas.hline(head_x, body_top - 1, head_w, cloth.frac(max(0.03, base - 0.14)))
    head_top = body_top - 1 - head_h + stoop
    canvas.rect(head_x, head_top, head_w, head_h, palette.family("dust").frac(0.20))
    canvas.vline(head_x + head_w - 1, head_top, head_h, palette.family("dust").frac(0.12))
    if hat:
        head_top -= _headgear(canvas, cloth, base, build["hat"], head_x, head_top, head_w)

    # A keyline, in void, which has one entry and therefore cannot be lifted
    # by the lighting pass. Without it these read fine in shadow and dissolve
    # into pale sacks wherever the window shaft or the chandelier lands on
    # them -- lit correctly, and unreadable, which is the worst combination.
    _keyline(canvas, dark, left, body_top, width, body_h + lift, head_x, head_top, head_w,
             body_top - head_top)
    return left - 1, head_top, width + 2, feet_y - head_top


def seated(
    canvas: IndexedCanvas, palette: Palette, x: int, table_top: int, height: int, rng,
    hat: bool = True, facing: int = 0, tone: float = 0.12, pose: int = 0,
    seed: int = 0,
) -> tuple[int, int, int, int]:
    """A man at a table: head and shoulders above the top, and nothing else.

    Drawing legs under a table is drawing something nobody can see, and at
    this size the two pixels it would cost are two pixels of noise. What
    makes a seated figure read is that his shoulders START at the table.
    """
    cloth, base = _garment(palette, rng, tone)
    build = _build(seed)
    head_h = max(3, round(height * 0.30))
    width = max(6, round(height * 0.55) + build["girth"])
    left = x - width // 2

    # Ruling 20's second frame, seated: he leans back a pixel. The shoulders
    # stay at the table because that is what makes a seated figure read.
    shoulder_h = height - head_h - 1 + (1 if pose else 0)
    body_top = table_top - shoulder_h
    for row in range(shoulder_h):
        canvas.hline(left + (1 if row == 0 else 0), body_top + row,
                     width - (2 if row == 0 else 0), cloth.frac(base))
    canvas.hline(left + 1, body_top, width - 2, cloth.frac(min(0.9, base + 0.14)))
    canvas.vline(left + width - 1, body_top + 1, shoulder_h - 1, cloth.frac(max(0.03, base - 0.12)))

    head_w = max(3, width - 4)
    head_x = left + (width - head_w) // 2 + facing
    canvas.hline(head_x, body_top - 1, head_w, cloth.frac(max(0.03, base - 0.14)))
    head_top = body_top - 1 - head_h + build["stoop"]
    canvas.rect(head_x, head_top, head_w, head_h, palette.family("dust").frac(0.20))
    canvas.vline(head_x + head_w - 1, head_top, head_h, palette.family("dust").frac(0.12))
    # A forearm on the table -- the one thing a seated man does that a
    # standing one does not, and it is three pixels.
    if build["arm"]:
        reach = 2 + build["arm"]
        canvas.hline(left + (0 if facing < 0 else width - reach), table_top - 1, reach,
                     cloth.frac(max(0.03, base - 0.18)))
    if hat:
        head_top -= _headgear(canvas, cloth, base, build["hat"], head_x, head_top, head_w)
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
