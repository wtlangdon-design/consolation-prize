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


def _build(seed: int) -> dict:
    """One man's silhouette, from his own index. Stable under upstream change."""
    # EVERY STRIDE IS CO-PRIME WITH ITS TABLE, and that is the whole rule.
    # This function was written in one sitting and three of its five
    # properties collapsed on the seeds the game actually uses -- 0 to 6 for
    # the Nugget's cast -- because a stride that divides into the run gives
    # everybody the same answer:
    #
    #   posture  was POSTURES[(seed // 5) % 4]  -- seeds 0-4 all posture 0,
    #            which is every man at the bar and most of a table. Eleven
    #            men, one posture, nobody leaning on anything.
    #   hat      was HATS[(seed // 4) % 5]      -- TWO hats across seven men,
    #            and that one was mine: it was HATS[seed % 5] and gave five,
    #            and I broke it while fixing posture in the same edit.
    #   stoop    was (seed // 7) % 2            -- ZERO for every seed 0 to 6.
    #            Dead for the entire room it was written for, and it has been
    #            since it was written.
    #
    # Audited by evaluating each property over the seeds in use rather than
    # by reading the arithmetic, which is how the first one hid.
    #
    # `arm` is gone. The posture branches draw the arms now, and a property
    # nothing reads is worse than no property: it looks like variety.
    return {
        "hat": HATS[(seed * 3) % len(HATS)],       # stride 3, table 5
        "posture": POSTURES[seed % len(POSTURES)],  # stride 1, table 4
        "girth": (seed * 7) % 3 - 1,                # stride 7, table 3
        "stoop": seed % 2,                          # alternates; no two neighbours alike
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


#: ERRATA 36/3a. Four postures, and they are TRANSFORMS rather than a pixel
#: of sway. The old set -- upright, lean, hunch, hip -- moved the shoulders by
#: one pixel over a body six pixels wide, which is not a posture, it is a
#: rounding error. These change where the weight is, where the arms go, and
#: what the outline does at the elbow, which is the only place a person at
#: twenty-six pixels is distinguishable from a filing cabinet.
POSTURES = ("bar_lean", "akimbo", "hunch", "turned")


def _proportions(height: int, girth: int) -> dict:
    """Shoulders wider than hips, hips wider than a leg, head narrower again.

    THE OLD NUMBERS MADE THE FIGURE SIX PIXELS WIDE at height 24 -- 0.26 of
    the height -- and then drew four one-pixel leg columns into it. There was
    no room left for daylight between the legs, so eleven men came out as
    eleven slabs and every internal shading step landed inside the keyline.
    A man is about a third of his height across the shoulders; at 24 that is
    nine pixels, and nine is enough to have a gap in the middle of.
    """
    shoulder = max(7, round(height * 0.40) + girth)
    return {
        "head_h": max(3, round(height * 0.17)),
        "torso_h": max(7, round(height * 0.40)),
        "shoulder": shoulder,
        "hip": max(5, shoulder - 2),
        "head_w": max(3, shoulder - 5),
        "leg_w": max(2, (shoulder - 2) // 4),
    }


def standing(
    canvas: IndexedCanvas, palette: Palette, x: int, feet_y: int, height: int, rng,
    hat: bool = True, facing: int = 0, tone: float = 0.14, pose: int = 0,
    glass: bool = False, seed: int = 0, garment: str | None = None,
    rail_y: int | None = None,
) -> tuple[int, int, int, int]:
    """A man standing. Returns his bounds.

    SILHOUETTE FIRST, then posture. Head narrower than shoulders, shoulders
    wider than hips, two legs with light between them, and one arm that
    breaks the outline. Everything below is in service of the shape read at a
    glance -- internal shading at this size is decoration and the outline is
    the drawing.

    `rail_y`, when given, is the top of something to lean on. A man at a bar
    puts a forearm ON it, and that horizontal is the single most legible thing
    a figure this size can do.
    """
    cloth, base = _garment(palette, rng, tone, garment)
    dark = palette.family("void")
    skin = palette.family("dust")
    build = _build(seed)
    posture = build["posture"]
    prop = _proportions(height, build["girth"])

    head_h, torso_h = prop["head_h"], prop["torso_h"]
    shoulder_w, hip_w, leg_w = prop["shoulder"], prop["hip"], prop["leg_w"]
    leg_h = max(5, height - head_h - torso_h - 1)
    side = 1 if facing >= 0 else -1

    # Ruling 20's second frame: a pixel of lift above the hip, legs planted.
    lift = 1 if pose else 0
    # Posture, as offsets rather than as a mood.
    #   lean     shoulders displaced toward what he is leaning on
    #   rise     shoulders raised (hunch) or dropped (turned)
    #   narrow   foreshortening, for the man with his back half to us
    lean = {"bar_lean": 2 * side, "akimbo": 0, "hunch": 0, "turned": -side}[posture]
    rise = {"bar_lean": 0, "akimbo": 0, "hunch": -1, "turned": 1}[posture]
    narrow = 2 if posture == "turned" else 0
    shoulder_w = max(6, shoulder_w - narrow)

    hip_y = feet_y - leg_h
    hip_left = x - hip_w // 2

    # -- LEGS. Two of them, with daylight down the middle. The gap is the
    #    whole point and it is checked rather than hoped for.
    gap = hip_w - leg_w * 2
    if gap < 1:
        raise ValueError(f"a {height}px figure has no daylight between its legs")
    stride = 1 if posture in ("akimbo", "bar_lean") else 0
    for index, leg_x in enumerate((hip_left, hip_left + hip_w - leg_w)):
        # One leg forward on a cocked hip, and one crossed at the ankle for
        # the man at the bar. Two pixels, and it is the last thing separating
        # one outline from the next.
        drop = stride if index else 0
        canvas.rect(leg_x, hip_y, leg_w, leg_h - drop, cloth.frac(max(0.04, base - 0.10)))
        canvas.vline(leg_x, hip_y, leg_h - drop, cloth.frac(max(0.03, base - 0.18)))
    if posture == "bar_lean":                       # ankle crossed behind
        canvas.hline(hip_left + 1, feet_y - 2, hip_w - 2, cloth.frac(max(0.03, base - 0.20)))
    canvas.hline(hip_left, feet_y - 1, hip_w, dark.at(0))               # boots in the dirt

    # -- TORSO. Trapezoid: shoulders wide, waist narrow, so the mass has a
    #    direction. A rectangle has none, which is what eleven rectangles
    #    looked like.
    torso_top = hip_y - torso_h - lift + rise
    for row in range(torso_h + lift):
        t = row / max(1, torso_h + lift - 1)
        w = round(shoulder_w - (shoulder_w - hip_w) * t)
        drift = round(lean * (1 - t))
        canvas.hline(x - w // 2 + drift, torso_top + row, w, cloth.frac(base))
    canvas.hline(x - shoulder_w // 2 + lean, torso_top, shoulder_w,
                 cloth.frac(min(0.92, base + 0.18)))                    # lit shoulder line
    canvas.vline(x - shoulder_w // 2 + lean, torso_top + 1, torso_h - 2,
                 cloth.frac(max(0.03, base - 0.10)))

    # -- ARMS, ALWAYS, and always OUTSIDE the torso. An arm inside the
    #    outline is a shading step; an arm outside it is an arm.
    arm_top = torso_top + 2
    arm_len = max(4, torso_h - 2)
    near = x + side * (shoulder_w // 2) + lean
    far = x - side * (shoulder_w // 2) + lean
    if posture == "bar_lean":
        # Forearm out and down, and ON the rail when there is one. The
        # horizontal is the most legible thing a figure this size can do.
        #
        # THE GUARD USED TO BE `and rail_y is not None`, which meant every
        # bar_lean figure with nothing to lean on fell through to the `else`
        # branch and got the turned man's single hidden arm. The body commits
        # to the posture unconditionally -- the lean, the stride and the
        # crossed ankle are all drawn above -- so the arm was disagreeing with
        # the body it is attached to, on every standing call in the game
        # except the three at the Nugget's bar. Posture 0 of 4 is a quarter of
        # every cast, and it was the one that looked deliberate.
        elbow = (min(rail_y - 1, arm_top + arm_len // 2) if rail_y is not None
                 else arm_top + arm_len // 2)
        canvas.vline(near, arm_top, max(2, elbow - arm_top), cloth.frac(max(0.04, base - 0.05)))
        canvas.hline(min(near, near + side * 4), elbow, 5, cloth.frac(max(0.04, base - 0.02)))
        canvas.put(near + side * 4, elbow, skin.frac(0.26))
        canvas.vline(far, arm_top, arm_len, cloth.frac(max(0.03, base - 0.12)))
    elif posture == "akimbo":
        # Hand on the hip: the arm bows out and leaves a HOLE between elbow
        # and waist. A gap inside a silhouette is worth more than any amount
        # of shading -- it is the only shape here the eye cannot read as a box.
        elbow_x = near + side * 2
        canvas.vline(near, arm_top, 2, cloth.frac(max(0.04, base - 0.04)))
        canvas.vline(elbow_x, arm_top + 1, arm_len - 3, cloth.frac(max(0.04, base - 0.04)))
        canvas.hline(min(elbow_x, x), hip_y - 2, 3, cloth.frac(max(0.03, base - 0.10)))
        canvas.put(elbow_x - side, hip_y - 2, skin.frac(0.24))
        canvas.vline(far, arm_top, arm_len, cloth.frac(max(0.03, base - 0.12)))
    elif posture == "hunch":
        # Both forearms forward, hands together. Shoulders already raised.
        for edge in (near, far):
            canvas.vline(edge, arm_top, arm_len - 2, cloth.frac(max(0.04, base - 0.06)))
        canvas.hline(min(near, far), arm_top + arm_len - 2, abs(near - far) + 1,
                     cloth.frac(max(0.04, base - 0.03)))
        canvas.put(x, arm_top + arm_len - 2, skin.frac(0.22))
    else:                                            # turned: one arm hidden
        canvas.vline(far, arm_top, arm_len, cloth.frac(max(0.04, base - 0.06)))
        canvas.put(far, arm_top + arm_len - 1, skin.frac(0.22))

    if glass:
        canvas.put(near + side, torso_top + 2 - lift * 2, palette.family("sky").frac(0.62))

    # -- NECK AND HEAD. Narrower than the shoulders by five pixels, which is
    #    most of what says "man" rather than "post".
    head_w = prop["head_w"]
    head_x = x - head_w // 2 + facing + lean + (side if posture == "hunch" else 0)
    canvas.hline(head_x, torso_top - 1, head_w, cloth.frac(max(0.03, base - 0.16)))
    head_top = torso_top - 1 - head_h + build["stoop"]
    canvas.rect(head_x, head_top, head_w, head_h, skin.frac(0.20))
    canvas.vline(head_x + head_w - 1, head_top, head_h, skin.frac(0.12))
    if hat:
        head_top -= _headgear(canvas, cloth, base, build["hat"], head_x, head_top, head_w)

    _keyline(canvas, dark, x - shoulder_w // 2 + lean, torso_top, shoulder_w,
             torso_h + lift, head_x, head_top, head_w, torso_top - head_top, side=-side)
    return x - shoulder_w // 2 - 1, head_top, shoulder_w + 2, feet_y - head_top


def seated(
    canvas: IndexedCanvas, palette: Palette, x: int, table_top: int, height: int, rng,
    hat: bool = True, facing: int = 0, tone: float = 0.12, pose: int = 0,
    seed: int = 0,
) -> tuple[int, int, int, int]:
    """A man at a table: head and shoulders above the top, and nothing else.

    Drawing legs under a table is drawing something nobody can see. What makes
    a seated figure read is that his shoulders START at the table -- and, per
    3a, that his ELBOWS ARE ON IT. A seated man who is not touching the table
    is a bust on a plinth.
    """
    cloth, base = _garment(palette, rng, tone)
    dark = palette.family("void")
    skin = palette.family("dust")
    build = _build(seed)
    posture = build["posture"]
    head_h = max(4, round(height * 0.30))
    width = max(8, round(height * 0.58) + build["girth"])
    left = x - width // 2
    side = 1 if facing >= 0 else -1

    shoulder_h = height - head_h - 1 + (1 if pose else 0)
    body_top = table_top - shoulder_h
    # Sloped shoulders rather than a square top: at this size the two pixels
    # taken off each corner are the difference between a man and a crate.
    for row in range(shoulder_h):
        inset = 2 if row == 0 else (1 if row == 1 else 0)
        canvas.hline(left + inset, body_top + row, width - inset * 2, cloth.frac(base))
    canvas.hline(left + 2, body_top, width - 4, cloth.frac(min(0.92, base + 0.16)))
    canvas.vline(left + width - 1, body_top + 2, shoulder_h - 2, cloth.frac(max(0.03, base - 0.12)))

    # BOTH FOREARMS ON THE TABLE for a man talking, one for a man turned away,
    # and the hand pixel is what stops them reading as sleeves.
    reach = max(3, width // 2)
    if posture in ("hunch", "bar_lean"):
        for edge in (left, left + width - reach):
            canvas.hline(edge, table_top - 1, reach, cloth.frac(max(0.03, base - 0.06)))
        canvas.put(left + 1, table_top - 1, skin.frac(0.24))
        canvas.put(left + width - 2, table_top - 1, skin.frac(0.24))
    else:
        edge = left if side < 0 else left + width - reach
        canvas.hline(edge, table_top - 1, reach, cloth.frac(max(0.03, base - 0.06)))
        canvas.put(edge if side < 0 else edge + reach - 1, table_top - 1, skin.frac(0.24))

    head_w = max(3, width - 5)
    head_x = left + (width - head_w) // 2 + facing + (side if posture == "turned" else 0)
    canvas.hline(head_x, body_top - 1, head_w, cloth.frac(max(0.03, base - 0.16)))
    head_top = body_top - 1 - head_h + build["stoop"]
    canvas.rect(head_x, head_top, head_w, head_h, skin.frac(0.20))
    canvas.vline(head_x + head_w - 1, head_top, head_h, skin.frac(0.12))
    if hat:
        head_top -= _headgear(canvas, cloth, base, build["hat"], head_x, head_top, head_w)
    _keyline(canvas, dark, left, body_top, width, shoulder_h,
             head_x, head_top, head_w, body_top - head_top, side=-side)
    return left - 1, head_top, width + 2, table_top - head_top


def _keyline(canvas, dark, left, body_top, width, body_h,
             head_x, head_top, head_w, head_h, side: int = 1) -> None:
    """A dark edge on ONE side, and the crown.

    It used to run down both sides of the torso and all four sides of the
    head. At nine pixels across that is two columns of pure void out of nine
    and a closed box around a five-pixel head -- which is exactly the reading
    3a reports: a rectangle with a rectangle on top. The keyline exists so a
    figure does not dissolve where the light lands on him, and one edge does
    that. Two edges draw a box.
    """
    shadow = left + width if side > 0 else left - 1
    canvas.vline(shadow, body_top, body_h, dark.at(0))
    canvas.vline(head_x + head_w if side > 0 else head_x - 1, head_top, head_h, dark.at(0))
    canvas.hline(head_x, head_top - 1, head_w, dark.at(0))


def overlaps(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah
