"""Batch A: Rooms 18, 19 and 13 -- the hotel lobby, Thad's room, the undertaker's.

THE FIRST BATCH BUILT TO THE FROZEN STANDARD, and the first three rooms
composed without a ruling between them. Everything they obey was settled
before they were started:

  errata 30f  material identity and palette script, assigned in step 0's
              single pass and looked up here rather than decided
  errata 32a  objects overlap; no row of things on one baseline
  errata 32b  density at the edges and in depth, never on the walkable plane
  errata 32c  detail is a hierarchy -- two or three focal objects carry it
  errata 32d  the foreground plane is a NAMEABLE OBJECT, cropped, at scale
  errata 32e  three scales per room: 40px+ cropped, the 8-20px middle, 3-4px
  errata 33a  every source gets a dark collar
  errata 34   interiors are asymmetric -- the back wall is off centre and the
              two side walls are different lengths

ON RULING 34 AND THE FREEZE. The camera work was deferred as "a re-block of
composed rooms". These three are not composed rooms, and 34 names the hotel
lobby as the room that sets the pattern, so the ruling is applied to the new
and withheld from the old. Room 5 and the exteriors are untouched.

DOC 26 DRESSES THESE ROOMS, and it arrived after they were composed. Where
the writing named furniture the composition did not have -- a settee, a
parlour stove, a spittoon, a lobby clock, a desk, a window, a price list, a
waiting bench -- the furniture went in, and where the composition had objects
the writing never mentions -- a piano, two armchairs, a low table, a second
coffin on trestles -- they came out.

That is not the frozen standard being reopened. The freeze fixed how a room
LOOKS; what is in it is a claim the examine layer makes, and a hotspot has to
sit on a drawn object. A drawn object nobody wrote is a click with no answer,
and a written object nobody drew is a line about nothing.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import crowd
import furniture
import interior
import lighting
import void
from canvas import IndexedCanvas
from dither import BAYER2, BAYER4, dither_pixel
from interior import Box
from lighting import Lamp, LightField, collar
from palette import Palette
from primitives import (
    arch, barrel, catenary, cylinder, ellipse_fill, ellipse_outline, ellipse_shaded,
    ground_objects, organic_mass, rope, sack,
)
from renders import BACKGROUNDS, FOREGROUNDS, RENDERS

#: Figure bounds, filled at compose time and read by the hotspot report so a
#: rect in a room file is measured off the drawing rather than eyeballed.
UNDERTAKER_BOUNDS: list = []
CLERK_BOUNDS: list = []

ROOT = Path(__file__).resolve().parents[2]
WIDTH, HEIGHT = 320, 144

#: Errata 30f step 0, looked up rather than decided. Composing a room is a
#: lookup because the assignment was made for all eleven at once.
IDENTITIES = json.loads(
    (ROOT / "content/rooms/interior-identities.json").read_text(encoding="utf-8"))["identities"]


def script_for(number: int, palette: Palette):
    """The four families of a room's palette script, as ramps and positions."""
    entry = IDENTITIES[str(number)]["paletteScript"]
    out = {}
    for role in ("dominant", "shadow", "secondary", "accent"):
        family, position = entry[role].rsplit(" ", 1)
        out[role] = (palette.family(family), float(position))
    return out


def void_regions(canvas: IndexedCanvas, box: Box, regions) -> None:
    """ERRATA 40, per room. The regions are passed in; this only stamps them.

    Every interior gets the same three structural ones -- roof space, the two
    ceiling/wall junctions, and the line where the floor meets the back wall
    -- because those are properties of being a room rather than of being this
    room. What differs is the furniture, and that is what `regions` carries.
    """
    void.band(canvas, 0, 0, WIDTH, box.back_top - 4, feather=5)
    void.wedge(canvas, 0, box.back_top - 4, box.back_left, box.back_top + 2, 6)
    void.wedge(canvas, WIDTH - 1, box.back_top - 4, box.back_right, box.back_top + 2, 6)
    for kind, args in regions:
        getattr(void, kind)(canvas, *args)


def shell(canvas: IndexedCanvas, palette: Palette, box: Box, script, rng,
          drop: float = 0.18) -> None:
    """Walls, ceiling and floor.

    THE SHELL SITS BELOW ITS SCRIPT POSITION, and the objects sit at it.
    Errata 23's dominant is a PROPORTION -- 55 to 70 per cent of the frame --
    and reading it as a tone put the hotel's walls at the same value as its
    plush, which made the furniture no lighter than the room and the whole
    thing a blue box. A wall is the dominant FAMILY at the bottom of its
    range; what stands against the wall is the same family at the top.
    """
    dominant, dom_tone = script["dominant"]
    shadow, shadow_tone = script["shadow"]
    wall = max(0.05, dom_tone - drop)
    interior.back_wall(canvas, box, dominant, rng, base=wall,
                       wainscot=max(0.03, wall - 0.10))
    interior.side_walls(canvas, box, dominant, rng, base=max(0.04, wall - 0.08))
    interior.ceiling(canvas, box, shadow, rng, base=max(0.03, shadow_tone - 0.14))


def batten_wall(canvas: IndexedCanvas, box: Box, ramp, tone: float, step: int = 11) -> None:
    """Vertical battens down the back wall. Cheap, and it stops a flat plane."""
    for x in range(box.back_left + 3, box.back_right - 2, step):
        canvas.vline(x, box.back_top + 1, box.back_bottom - box.back_top - 1,
                     ramp.frac(max(0.03, tone - 0.10)))


# ---------------------------------------------------------------------------
# Room 18 -- the hotel lobby


HOTEL_BOX = Box(WIDTH, HEIGHT, back_left=44, back_right=192, back_top=16, back_bottom=84)


def hotel_lobby() -> tuple[IndexedCanvas, Palette]:
    """Room 18. Worn blue-grey plush and tarnished brass -- errata 30d.

    THE ONLY COOL INTERIOR IN ACT I, and cool in HUE: the assay office is
    achromatic cold and nothing else in the act may go blue. Oil-lamp warmth
    fighting a cool field and losing, which is the room's whole argument.

    Errata 34's asymmetry, and the hotel is where the pattern is set: the
    back wall sits left of centre so the right-hand wall runs much longer,
    the stair climbs it, and the vanishing point is at x=118 rather than 160.
    A symmetrical box is a machine; this is a business.

    WATCH THE COAT, per 30d. Thad's is dark bottle green against a cool mid
    field, and this is the first interior where green sits near green. The
    field runs 0.45 of sky, which measures well clear of his coat -- checked
    at graybox by legibility_audit rather than asserted here.
    """
    palette = Palette.load()
    palette.shadow_tint = "accent_indigo"
    rng = random.Random(18_1858)
    canvas = IndexedCanvas(WIDTH, HEIGHT)
    script = script_for(18, palette)
    box = HOTEL_BOX

    plush, plush_tone = script["dominant"]
    deep, deep_tone = script["shadow"]
    brass, brass_tone = script["secondary"]
    lamp_ramp, lamp_tone = script["accent"]
    bone = palette.family("bone")
    # ERRATA 30d, AMENDED. "The only cool interior" governs the room's
    # DOMINANT FIELD, not every surface in it, and reading it as every
    # surface produced exactly one colour: wall, wainscot, floor, settee and
    # stairs all the same blue-grey, which is the ruling doing what it was
    # asked and the asking being wrong.
    #
    # pine_weathered was already a different FAMILY and that changed nothing,
    # because it measures saturation 0.17 -- effectively grey -- and a cool
    # field with an indigo shadow tint pushes grey timber straight to blue.
    # A second material has to differ in HUE, not in name. So the boards and
    # the treads are umber, which is warm and stays warm through the pass,
    # and the brass is lifted until it reads as brass rather than as a lighter
    # blue. The room is still cool: the field is 55 to 70 per cent of the
    # frame and every bit of it is sky.
    pine = palette.family("umber")

    # ERRATA 40 CANNOT BE MET IN THIS ROOM BY DARKENING, and the measurement
    # says why: SKY'S FLOOR IS LUMINANCE 53. It is one of errata 21b's four
    # families that cannot approach black, and 30d makes it this room's
    # dominant. At drop 0.32 the wall and its wainscot both clamped onto the
    # same bottom entry -- 45% of the frame at exactly 60.5, which is why the
    # median and the p90 measured the same number.
    #
    # So the drop goes back to 0.22, which keeps the dado distinct from the
    # wall, and the room sits at a median in the fifties. Reaching 25-35 needs
    # 21b's SWAP rather than a darkening, and a swap here changes what 30d
    # calls the only cool interior in Act I. That is a ruling, not a tuning.
    shell(canvas, palette, box, script, rng, drop=0.22)
    batten_wall(canvas, box, plush, plush_tone)
    interior.plank_floor(canvas, box, pine, rng, base=0.34)

    # -- the staircase, climbing the long right-hand wall. It is the room's
    #    largest object and the reason the box is asymmetric: a stair on a
    #    wall you can see the length of reads as a storey above you.
    with canvas.track("staircase"):
        for tread in range(11):
            x = box.back_right - 6 + tread * 11
            y = box.back_bottom - 6 - tread * 5
            canvas.rect(x, y, 12, 5, pine.frac(max(0.06, 0.34 - tread * 0.01)))
            canvas.hline(x, y, 12, pine.frac(0.48))
            canvas.vline(x, y, 5, pine.frac(0.12))
            # DOC 26: carpeted for the first four treads and bare above that.
            # The carpet ran out. Four is the number in the line, so four is
            # the number drawn -- and the fifth tread is where it stops being
            # a hotel and starts being a building.
            if tread < 4:
                canvas.rect(x + 1, y, 10, 4, plush.frac(max(0.05, plush_tone - 0.24)))
                canvas.hline(x + 1, y, 10, plush.frac(max(0.05, plush_tone - 0.12)))
        # The banister, which is what makes it a stair rather than a ziggurat.
        canvas.line(box.back_right - 4, box.back_bottom - 20, WIDTH - 6, box.back_bottom - 76,
                    brass.frac(min(0.95, brass_tone + 0.40)))
        canvas.line(box.back_right - 4, box.back_bottom - 18, WIDTH - 6, box.back_bottom - 74,
                    brass.frac(max(0.04, brass_tone - 0.14)))
        for post in range(6):
            px = box.back_right - 2 + post * 20
            canvas.vline(px, box.back_bottom - 22 - post * 10, 12, pine.frac(0.24))

    # -- THE HOTEL CLERK, doc 27, BEHIND his counter -- and drawn before it,
    #    so the counter cuts him off at the chest. Standing him in front of
    #    the furniture and drawing him last put a man's head and shoulders on
    #    top of the settee with no legs under them: he was correctly placed in
    #    depth and incorrectly placed in the drawing order, which at this size
    #    are the same mistake. Only what clears the counter is clickable.
    with canvas.track("the hotel clerk"):
        CLERK_BOUNDS.append(
            crowd.standing(canvas, palette, 70, 98, 34, rng, hat=False,
                           facing=1, tone=0.30, seed=18))

    # -- the desk, left of the vanishing point, with the register on it and
    #    the key rack behind. The focal object: 32c's detail hierarchy puts
    #    the fussiest drawing here and leaves the walls plain.
    desk_y = 96
    with canvas.track("desk"):
        furniture.service_counter(canvas, palette, 26, desk_y, 84, 22,
                                  bone, plush, brass, rng, window=None)
    with canvas.track("register"):
        furniture.ledger_stack(canvas, palette, 54, desk_y - 1, 20, 5, plush, bone)
        canvas.vline(70, desk_y - 8, 6, brass.frac(brass_tone + 0.20))     # the pen
        canvas.put(70, desk_y - 8, bone.frac(0.82))
    with canvas.track("key rack"):
        canvas.rect(30, box.back_bottom - 28, 34, 18, pine.frac(0.22))
        canvas.outline(30, box.back_bottom - 28, 34, 18, pine.frac(0.10))
        # Doc 26: four out of forty are gone, and the four are not near each
        # other. Not random -- the gaps are placed, because "not near each
        # other" is the observation and a random draw would clump.
        gone = {1, 4, 8, 11}
        for row in range(2):
            for hook in range(6):
                index = row * 6 + hook
                canvas.vline(34 + hook * 5, box.back_bottom - 24 + row * 8, 4,
                             brass.frac(brass_tone + 0.10))
                if index not in gone:
                    canvas.put(34 + hook * 5, box.back_bottom - 20 + row * 8,
                               brass.frac(brass_tone + 0.26))

    # -- the parlour, right of the desk. DOC 26 NAMES THE FURNITURE and the
    #    room is dressed to it rather than the other way round: a settee, a
    #    parlour stove, a spittoon and a clock. What was here before -- a
    #    piano, two armchairs, a low table -- was composed before the content
    #    existed and none of it is written, so none of it is in the room. A
    #    hotspot must sit on a drawn object and a drawn object nobody wrote
    #    is a click with no answer.
    with canvas.track("rug"):
        # Doc 26: the spittoon has left a ring on the carpet where it used to
        # be and a ring where it is. There has to be a carpet for that to be
        # true, so there is one, and it is worn through in the traffic lane.
        for row in range(22):
            t = row / 21
            left, right = int(98 - 4 * t), int(198 + 8 * t)
            canvas.hline(left, 104 + row, right - left,
                         plush.frac(max(0.04, plush_tone - 0.30 - 0.05 * t)))
        canvas.hline(98, 104, 100, plush.frac(max(0.04, plush_tone - 0.18)))
        for _ in range(70):                                     # worn through
            x, y = rng.randrange(112, 190), rng.randrange(106, 124)
            canvas.put(x, y, pine.frac(max(0.04, 0.24 + 0.06 * rng.random())))
        for ring_x, ring_y in ((152, 112), (186, 110)):         # both rings
            ellipse_outline(canvas, ring_x, ring_y, 7, 3,
                            plush.frac(max(0.04, plush_tone - 0.38)))

    with canvas.track("settee"):
        settee(canvas, palette, 100, 106, 64, 32, plush, plush_tone + 0.02, brass, rng)

    with canvas.track("stove"):
        parlour_stove(canvas, palette, 164, 104, 28, 34, box.back_top, deep, brass, rng)

    with canvas.track("spittoon"):
        # Brass, emptied, and standing on its second ring rather than its
        # first. 32e's middle scale, and the only object in the room a player
        # could mistake for an item.
        cylinder(canvas, 190, 104, 13, 9, brass, base=max(0.04, brass_tone - 0.06),
                 lid_lift=0.22)
        ellipse_outline(canvas, 196, 104, 7, 3, brass.frac(min(0.95, brass_tone + 0.24)))

    with canvas.track("clock"):
        # Behind the desk, which is where a lobby clock goes and where doc
        # 26's joke needs it -- nineteen minutes off the Registrar's, and the
        # two are never in frame together.
        canvas.rect(76, 50, 20, 24, pine.frac(0.20))
        canvas.outline(76, 50, 20, 24, pine.frac(0.08))
        ellipse_shaded(canvas, 86, 58, 7, 7, bone, 0.62, lift=0.14)
        ellipse_outline(canvas, 86, 58, 7, 7, brass.frac(min(0.95, brass_tone + 0.18)))
        canvas.line(86, 58, 86, 54, pine.frac(0.06))                       # the hands
        canvas.line(86, 58, 89, 60, pine.frac(0.06))
        canvas.vline(86, 66, 6, brass.frac(brass_tone))                    # the pendulum
        canvas.put(86, 72, brass.frac(min(0.95, brass_tone + 0.22)))

    # -- the engraving of an Italian bay, doc 09. Small, high, and the only
    #    thing in the room pretending to be somewhere else.
    with canvas.track("engraving"):
        canvas.rect(72, 30, 26, 20, pine.frac(0.18))
        canvas.outline(72, 30, 26, 20, brass.frac(brass_tone + 0.12))
        canvas.rect(74, 32, 22, 16, bone.frac(0.52))
        for row in range(3):
            canvas.hline(75, 36 + row * 3, 20 - row * 4, plush.frac(0.44))  # water
        canvas.line(76, 36, 84, 33, pine.frac(0.30))                        # a headland

    # -- the street door, on the short left wall.
    with canvas.track("street door"):
        arch(canvas, 4, 46, 22, 44, pine, tone=0.14, rise=9)

    # -- ERRATA 32e's small end: the dust and the tacks nobody sees.
    with canvas.track("floor dust"):
        for _ in range(120):
            x, y = rng.randrange(20, WIDTH - 20), rng.randrange(box.back_bottom, HEIGHT - 2)
            canvas.put(x, y, pine.frac(max(0.04, 0.24 + 0.08 * rng.random())))

    ground_objects(canvas, palette, canvas.strokes, box.back_bottom - 12)

    # -- one oil lamp on the desk, and the cool field it is losing to.
    # ERRATA 40. Ambient was 0.72 -- a lobby at night, lit evenly, everywhere.
    # The void regions moved p10 to 0 and left the median at 60 because the
    # median is the WALLS, and an ambient that high means there is no such
    # thing as away-from-the-lamp. 0.40 leaves the desk lamp doing the work it
    # was drawn to do.
    field = LightField(WIDTH, HEIGHT, ambient=0.40)
    field.add_lamp(Lamp(x=44, y=desk_y - 14, radius=70, intensity=0.62, squash=1.2))
    field.add_lamp(Lamp(x=250, y=40, radius=120, intensity=0.22, squash=1.4))
    field.apply(canvas, palette)

    with canvas.track("desk lamp"):
        canvas.rect(40, desk_y - 16, 7, 8, lamp_ramp.frac(lamp_tone))
        canvas.rect(41, desk_y - 15, 5, 5, lamp_ramp.frac(min(0.95, lamp_tone + 0.16)))
        canvas.hline(39, desk_y - 17, 9, brass.frac(max(0.04, brass_tone - 0.16)))
        canvas.hline(39, desk_y - 8, 9, brass.frac(max(0.04, brass_tone - 0.20)))
    # ERRATA 33a: the dark collar, so the one warm thing in a cool room reads
    # as a source rather than as a pale patch on a desk.
    collar(canvas, palette, 43, desk_y - 12, 6, 17, steps=3)

    # ERRATA 40. Before: median 74.0, p10 21.7, 26.0% below 30, and 1.0% of
    # the frame near-void in NO region over 150 pixels. A lobby at night with
    # one oil lamp had no shadow in it anywhere.
    void_regions(canvas, box, (
        ("rect", (4, 48, 22, 40, 2)),                  # the street door, shut on night
        ("wedge", (192, 82, 314, 20, 8)),              # under the stair, its full run
        ("smear", (26, 112, 86, 6)),                   # under the desk
        ("smear", (98, 102, 68, 5)),                   # under the settee
        ("smear", (162, 100, 32, 5)),                  # under the stove
        ("smear", (box.back_left, box.back_bottom - 1, 148, 4)),   # floor/wall junction
        ("smear", (24, 132, 250, 8)),                  # the near floor, out of the lamp
    ))
    return canvas, palette


def settee(canvas, palette, x, base_y, width, height, ramp, tone, brass, rng) -> None:
    """Doc 26's settee, and the LOOK line is the drawing instruction.

    "Gone shiny at both arms and nowhere in the middle." So the two arms are
    drawn a full two steps up the ramp and the seat between them is drawn at
    the base tone, which is the opposite of how upholstery is normally shaded
    and is the entire point of the object. A settee shaded conventionally --
    bright in the middle where the light falls -- would contradict the only
    line most players will ever read about it.
    """
    back_h = int(height * 0.62)
    top = base_y - back_h
    # The back is a PANEL with a shallow crown, not a dome. A dome at this
    # width reads as a bathtub -- the horizontal top rail is what says settee.
    canvas.rect(x + 6, top + 2, width - 12, back_h - 2, ramp.frac(max(0.05, tone - 0.06)))
    ellipse_fill(canvas, x + width // 2, top + 3, width // 2 - 6, 4,
                 ramp.frac(max(0.05, tone - 0.04)))
    canvas.hline(x + 7, top + 1, width - 14, ramp.frac(min(0.94, tone + 0.06)))
    canvas.hline(x + 7, top + 5, width - 14, ramp.frac(max(0.04, tone - 0.16)))
    # The seat: darker than the arms and flat across, because nobody sits in
    # the middle and it has never been polished by anybody's sleeve.
    seat_y = base_y - int(height * 0.36)
    canvas.rect(x + 6, seat_y, width - 12, int(height * 0.24),
                ramp.frac(max(0.04, tone - 0.20)))
    canvas.hline(x + 7, seat_y, width - 14, ramp.frac(max(0.05, tone - 0.10)))
    # The arms, two full steps up: this is the whole line, drawn.
    for arm in (x, x + width - 9):
        canvas.rect(arm, base_y - int(height * 0.52), 9, int(height * 0.44),
                    ramp.frac(min(0.95, tone + 0.20)))
        ellipse_shaded(canvas, arm + 4, base_y - int(height * 0.52), 5, 3,
                       ramp, min(0.95, tone + 0.28), lift=0.08)
        canvas.vline(arm, base_y - int(height * 0.50), int(height * 0.42),
                     ramp.frac(max(0.04, tone - 0.22)))
    for foot in (x + 4, x + width - 6):
        canvas.rect(foot, base_y - 4, 2, 4, brass.frac(0.22))
    canvas.hline(x + 2, base_y - 1, width - 4, ramp.frac(0.05))


def parlour_stove(canvas, palette, x, base_y, width, height, ceiling_y,
                  deep, brass, rng) -> None:
    """Doc 26's stove: a parlour stove with a nickel rail, polished, and cold.

    The rail is the object. Everything else here is a black iron mass, and
    the one bright horizontal across its front is what says somebody in this
    building spends an afternoon on something -- which is the line.
    """
    iron = palette.family("void")
    body_top = base_y - height
    for row in range(height):
        t = row / (height - 1)
        half = int(width * (0.32 + 0.18 * t)) if t < 0.24 else int(width * (0.50 - 0.06 * t))
        canvas.hline(x + width // 2 - half, body_top + row, half * 2, iron.at(0))
        canvas.put(x + width // 2 + half - 1, body_top + row, deep.frac(0.16))
    ellipse_shaded(canvas, x + width // 2, body_top, width // 2 - 2, 4, deep, 0.12, lift=0.08)
    # The flue, up to the ceiling. It is what makes the mass a stove.
    canvas.rect(x + width // 2 - 2, ceiling_y, 5, body_top - ceiling_y + 2, iron.at(0))
    canvas.vline(x + width // 2 + 2, ceiling_y, body_top - ceiling_y + 2, deep.frac(0.14))
    # The nickel rail, polished, and the glove hooks nobody uses.
    rail_y = base_y - int(height * 0.44)
    canvas.hline(x - 3, rail_y, width + 6, brass.frac(0.86))
    canvas.hline(x - 3, rail_y + 1, width + 6, brass.frac(0.40))
    for hook in (x - 3, x + width + 2):
        canvas.vline(hook, rail_y, 5, brass.frac(0.62))
    for foot in (x + 4, x + width - 6):
        canvas.rect(foot, base_y - 3, 2, 3, iron.at(0))
    canvas.hline(x + 2, base_y - 1, width - 4, deep.frac(0.06))


def hotel_foreground(palette: Palette) -> IndexedCanvas:
    """Errata 32d and 21a: a NAMEABLE object, cropped, at large scale.

    The near end of a wing chair, bottom-left, forty pixels of it and the
    rest off the frame. A texture mass would satisfy 21a and do nothing 32d
    asks for -- this establishes depth in one read and gives the room a scale
    anchor, which is 32e's large end supplied for free.

    IT IS NOT THE SETTEE and must not be made into one. Doc 26 writes one
    settee, against the back wall, where both its arms are visible -- and
    "shiny at both arms and nowhere in the middle" is unreadable on an object
    with one arm in frame. So the foreground stays a chair: a lobby has
    chairs, nobody wrote a line for this one, and it carries no hotspot.
    """
    plane = IndexedCanvas(WIDTH, HEIGHT, fill=255)
    plush = palette.family("sky")
    dark = palette.family("accent_indigo")
    # The BACK of a wing chair: a tall rounded mass rising off the bottom
    # edge with one arm coming forward out of it. The arm is what names the
    # object -- without it this is a hill.
    top = HEIGHT - 62
    for row in range(62):
        t = row / 61
        half = int(20 + 24 * (t ** 0.55))
        for col in range(0, half):
            plane.put(col, top + row, dark.frac(max(0.03, 0.13 - 0.05 * t)))
        plane.put(half, top + row, dark.frac(0.04))
    ellipse_fill(plane, 8, top + 4, 26, 8, dark.frac(0.13))          # the crown
    ellipse_outline(plane, 8, top + 4, 26, 8, plush.frac(0.20))
    for row in range(18):                                            # the arm
        plane.hline(0, HEIGHT - 30 + row, 62 - row // 3, dark.frac(max(0.03, 0.16 - row * 0.004)))
    ellipse_shaded(plane, 54, HEIGHT - 29, 10, 5, plush, 0.16, lift=0.12)
    plane.hline(0, HEIGHT - 31, 60, plush.frac(0.24))
    return plane


# ---------------------------------------------------------------------------
# Room 19 -- Thad's room


THAD_BOX = Box(WIDTH, HEIGHT, back_left=76, back_right=214, back_top=26, back_bottom=86)


def thads_room() -> tuple[IndexedCanvas, Palette]:
    """Room 19. Neutral, plain, cheap -- and WARM-neutral, deliberately.

    17b says neutral and 30d says it must separate from the hotel lobby
    directly below it. Neutral next to cool reads as nothing, so the drab
    here is warm drab: bare pine, unbleached calico, a tin basin. Stepping up
    from the lobby is a small lift in temperature and a large drop in
    pretension, which is the room's entire job.

    Errata 32b matters more here than anywhere: it is a small room and the
    floor is most of it. Everything is against a wall.
    """
    palette = Palette.load()
    rng = random.Random(19_1858)
    canvas = IndexedCanvas(WIDTH, HEIGHT)
    script = script_for(19, palette)
    box = THAD_BOX

    drab, drab_tone = script["dominant"]
    shadow, shadow_tone = script["shadow"]
    calico, calico_tone = script["secondary"]
    tin, tin_tone = script["accent"]
    pine = palette.family("pine_weathered")
    gold = palette.family("accent_gold")

    shell(canvas, palette, box, script, rng, drop=0.30)
    batten_wall(canvas, box, drab, drab_tone, step=9)
    interior.plank_floor(canvas, box, pine, rng, base=0.34)

    # -- the window, high on the back wall, and the only cool thing in here.
    with canvas.track("window"):
        interior.interior_window(canvas, 168, 34, 26, 30, pine, palette.family("sky"),
                                 panes=(2, 2), base=0.34)

    # -- the bed, along the right wall, running away from the camera. The
    #    room's largest object and its focal one.
    with canvas.track("bed"):
        for row in range(26):
            t = row / 25
            left = int(206 - 8 * t)
            right = int(300 + 14 * t)
            canvas.hline(left, 88 + row, right - left, calico.frac(calico_tone - 0.26 - 0.10 * t))
        canvas.hline(200, 88, 106, calico.frac(calico_tone - 0.10))
        for post_x, post_h in ((202, 30), (296, 22)):
            canvas.rect(post_x, 88 - post_h, 4, post_h + 22, pine.frac(0.18))
            ellipse_shaded(canvas, post_x + 2, 88 - post_h, 3, 2, pine, 0.34)
        canvas.rect(266, 80, 30, 12, calico.frac(calico_tone - 0.04))              # pillow
        ellipse_shaded(canvas, 281, 80, 15, 5, calico, calico_tone - 0.02, lift=0.10)

    # -- the door, on the back wall at the left, with HIS COAT ON IT. Doc 26
    #    names the hotspot THE COAT ON THE DOOR, so the coat is on the door.
    #    It was on the chair, which was a guess made before the writing
    #    landed and is now simply wrong.
    with canvas.track("door"):
        canvas.rect(82, 38, 26, 48, pine.frac(0.20))
        canvas.outline(82, 38, 26, 48, pine.frac(0.08))
        canvas.rect(85, 42, 20, 18, pine.frac(0.26))                       # the panels
        canvas.rect(85, 63, 20, 19, pine.frac(0.24))
        canvas.put(104, 64, gold.frac(0.52))                               # the knob
        # Number nineteen, in brass, hung slightly crooked -- and the crook
        # is one pixel of vertical offset on the nine, which is all a crook
        # is at this size.
        canvas.vline(92, 40, 4, gold.frac(0.60))
        canvas.vline(96, 41, 4, gold.frac(0.60))
        canvas.put(95, 41, gold.frac(0.44))
    with canvas.track("coat"):
        # His one coat, on the door peg. The only dark mass in a pale-drab
        # room -- 32c's hierarchy in a single object.
        green = palette.family("pine_green")
        canvas.put(88, 44, pine.frac(0.40))                                # the peg
        for row in range(26):
            half = 7 + row // 4 - (3 if row > 21 else 0)
            canvas.hline(88 - half // 2, 46 + row, half,
                         green.frac(max(0.04, 0.14 - row * 0.002)))
        canvas.hline(84, 46, 10, green.frac(0.24))

    # -- the washstand, against the back wall, with a basin and a jug. The
    #    accent lives here: tin, and nowhere else.
    # ERRATA 32a: the washstand ABUTS THE DOOR. Standing clear of it, the
    # door, the basin and the jug shared a baseline with air between them --
    # the row the ruling forbids, found by the audit and not by looking.
    with canvas.track("washstand"):
        canvas.rect(104, 84, 34, 26, pine.frac(0.24))
        canvas.hline(104, 84, 34, pine.frac(0.40))
        canvas.vline(106, 86, 24, pine.frac(0.12))
        canvas.vline(134, 86, 24, pine.frac(0.12))
    with canvas.track("basin"):
        ellipse_shaded(canvas, 116, 82, 11, 4, tin, tin_tone, lift=0.20)
        ellipse_outline(canvas, 116, 82, 11, 4, tin.frac(min(0.95, tin_tone + 0.22)))
    with canvas.track("jug"):
        cylinder(canvas, 128, 70, 10, 12, tin, base=max(0.04, tin_tone - 0.10), lid_lift=0.18)
        canvas.line(138, 74, 141, 78, tin.frac(tin_tone))                  # the handle
    with canvas.track("mirror"):
        # "A piece of mirror the size of my hand." Six pixels by eight, and
        # it is meant to look insufficient.
        canvas.rect(120, 66, 6, 8, tin.frac(min(0.95, tin_tone + 0.18)))
        canvas.outline(120, 66, 6, 8, pine.frac(0.14))

    # -- the desk under the window, and everything written on this room's
    #    desk is on it: the case, the letters from home, the letter going
    #    back. 32c's focal object, and the only place in the room with
    #    detail at three scales.
    with canvas.track("desk"):
        canvas.rect(148, 96, 54, 6, pine.frac(0.32))
        canvas.hline(148, 96, 54, pine.frac(0.46))
        canvas.rect(150, 102, 50, 5, pine.frac(0.18))                      # the apron
        for leg in (150, 197):
            canvas.rect(leg, 107, 3, 19, pine.frac(0.16))
    with canvas.track("his case"):
        canvas.rect(178, 88, 24, 8, palette.family("umber").frac(0.20))
        canvas.hline(178, 88, 24, palette.family("umber").frac(0.34))
        canvas.hline(178, 92, 24, palette.family("umber").frac(0.10))      # the seam
        canvas.put(190, 92, gold.frac(0.48))                               # the clasp
    with canvas.track("letters from home"):
        # A tied bundle. Errata invariant 10 stands: nothing counts these,
        # nothing refers to them anywhere else in the game, and the number of
        # sheets drawn is not the act number. Do not wire one to the other.
        canvas.rect(150, 90, 13, 6, calico.frac(min(0.95, calico_tone + 0.10)))
        canvas.hline(150, 90, 13, calico.frac(min(0.95, calico_tone + 0.22)))
        canvas.hline(150, 93, 13, calico.frac(max(0.04, calico_tone - 0.30)))   # the tie
        canvas.vline(156, 90, 6, calico.frac(max(0.04, calico_tone - 0.30)))
    with canvas.track("outgoing letter"):
        canvas.rect(165, 91, 11, 5, calico.frac(min(0.95, calico_tone + 0.16)))
        canvas.hline(165, 91, 11, calico.frac(0.92))
        for line in range(3):                                              # four pages of it
            canvas.hline(166, 92 + line, 8 - line, pine.frac(0.20))
        canvas.vline(178, 88, 6, tin.frac(min(0.95, tin_tone + 0.10)))     # the pen
        canvas.put(178, 87, gold.frac(0.44))

    with canvas.track("chair"):
        # Pulled up to the desk, seen from behind. Drawn here rather than
        # through rough_chair, which is built for a saloon at a different
        # scale and came out a cone at this one.
        canvas.rect(158, 112, 20, 3, pine.frac(0.30))
        canvas.hline(158, 112, 20, pine.frac(0.44))
        for leg in (159, 175):
            canvas.rect(leg, 115, 2, 15, pine.frac(0.20))
        canvas.rect(158, 100, 2, 13, pine.frac(0.26))
        canvas.rect(176, 100, 2, 13, pine.frac(0.22))
        canvas.hline(158, 101, 20, pine.frac(0.34))
        canvas.hline(158, 106, 20, pine.frac(0.30))

    # -- the wall beside the bed. Doc 26 note 1, and it is drawn the way it
    #    is written: faint, uncommented, and no brighter than the boards it
    #    is on. NOTHING may mark this -- no cycling, no highlight, no sting.
    #    If a player finds it, they find it by reading a wall.
    with canvas.track("wall marks"):
        for stroke_x, stroke_h in ((198, 5), (201, 5), (204, 5)):
            canvas.vline(stroke_x, 42, stroke_h, drab.frac(max(0.03, drab_tone - 0.30)))
        canvas.line(196, 48, 207, 41, drab.frac(max(0.03, drab_tone - 0.28)))

    # -- the candle, unlit until night, on the sill. 32e's small end.
    with canvas.track("candle"):
        canvas.vline(172, 62, 7, calico.frac(0.72))
        canvas.put(172, 61, gold.frac(0.50))
    with canvas.track("floor grit"):
        for _ in range(90):
            x, y = rng.randrange(30, WIDTH - 30), rng.randrange(box.back_bottom, HEIGHT - 2)
            canvas.put(x, y, pine.frac(max(0.04, 0.26 + 0.08 * rng.random())))

    ground_objects(canvas, palette, canvas.strokes, box.back_bottom - 6)

    # ERRATA 40. One alley window at 0.80 ambient is a room with no shadowed
    # side. 0.46, and the window keeps its own reach.
    field = LightField(WIDTH, HEIGHT, ambient=0.46)
    field.add_lamp(Lamp(x=180, y=46, radius=130, intensity=0.44, squash=1.5))
    field.apply(canvas, palette)

    # ERRATA 40. Before: median 61.3, p10 32.7, 4.4% below 30 -- the least
    # dark room in the game after the undertaker's, and it is a cheap hotel
    # room at the top of a stair lit by one alley window.
    void_regions(canvas, box, (
        ("wedge", (box.back_left, box.back_bottom, 40, HEIGHT - 6, 7)),   # left corner
        ("smear", (198, 108, 116, 8)),                 # under the bed
        ("smear", (146, 122, 58, 6)),                  # under the desk
        ("smear", (102, 106, 40, 5)),                  # under the washstand
        ("smear", (box.back_left, box.back_bottom - 1, 138, 4)),
        ("smear", (40, 130, 170, 9)),                  # the near floor
    ))
    return canvas, palette


def thad_foreground(palette: Palette) -> IndexedCanvas:
    """The bed's foot rail and post, cropped bottom-right. Errata 32d."""
    plane = IndexedCanvas(WIDTH, HEIGHT, fill=255)
    pine = palette.family("pine_weathered")
    plane.rect(272, HEIGHT - 52, 10, 52, pine.frac(0.06))
    ellipse_shaded(plane, 277, HEIGHT - 52, 6, 4, pine, 0.14, lift=0.10)
    plane.rect(230, HEIGHT - 40, 90, 7, pine.frac(0.08))
    plane.hline(230, HEIGHT - 40, 90, pine.frac(0.16))
    return plane


# ---------------------------------------------------------------------------
# Room 13 -- the undertaker's


UNDERTAKER_BOX = Box(WIDTH, HEIGHT, back_left=68, back_right=236, back_top=20, back_bottom=80)


def undertakers() -> tuple[IndexedCanvas, Palette]:
    """Room 13. Scrubbed bone-white and pine, near-monochrome, deliberately.

    ERRATA 23'S NAMED EXCEPTION to the palette proportions: a deliberate
    near-monochrome room is a legitimate choice and the requirement is only
    that it be visibly deliberate rather than accidental. So it is scrubbed
    rather than dim -- the palest room in the game, everything in two
    families, and not one saturated pixel anywhere in it.

    Reached only from the map, which was drawn in an achromatic pencil grey
    for exactly this reason: a bone map into a bone room would be the
    adjacency errata 17b forbids, and step 0 caught it before either existed.
    """
    palette = Palette.load()
    rng = random.Random(13_1858)
    canvas = IndexedCanvas(WIDTH, HEIGHT)
    script = script_for(13, palette)
    box = UNDERTAKER_BOX

    bone, bone_tone = script["dominant"]
    dust, dust_tone = script["shadow"]
    fresh, fresh_tone = script["secondary"]

    shell(canvas, palette, box, script, rng)
    batten_wall(canvas, box, bone, bone_tone, step=13)
    interior.plank_floor(canvas, box, fresh, rng, base=max(0.06, fresh_tone - 0.20))

    # -- coffins on end against the back wall, in a rank that OVERLAPS. Six
    #    of them, at four widths, leaning on each other -- errata 32a, and
    #    the one place in this game where a row would have been honest and is
    #    still worse than a heap.
    with canvas.track("coffins standing"):
        for index, (x, w, h) in enumerate(
                ((74, 20, 54), (90, 18, 50), (104, 22, 58), (122, 19, 52),
                 (137, 21, 56), (154, 18, 48))):
            tone = fresh_tone - 0.06 + 0.03 * (index % 3)
            top = box.back_bottom - h
            # The hexagon: wide at the shoulders, tapering to head and foot.
            for row in range(h):
                t = row / (h - 1)
                if t < 0.22:
                    half = int(w * (0.34 + 0.66 * t / 0.22)) // 2
                elif t < 0.34:
                    half = w // 2
                else:
                    half = int(w * (1.0 - 0.42 * (t - 0.34) / 0.66)) // 2
                canvas.hline(x + w // 2 - half, top + row, half * 2, fresh.frac(tone))
                canvas.put(x + w // 2 - half, top + row, fresh.frac(max(0.04, tone - 0.16)))
                canvas.put(x + w // 2 + half - 1, top + row, fresh.frac(min(0.95, tone + 0.14)))

    # -- THE TABLE. Doc 26 gives this room one working surface, "scrubbed to
    #    the grain, and scrubbed again since", and the coffin that used to
    #    sit on trestles in front of it is gone: two large pale horizontals
    #    where the writing describes one meant a player clicking the nearer
    #    of them got the table's line about a coffin.
    with canvas.track("table"):
        canvas.rect(186, 88, 108, 8, fresh.frac(fresh_tone))
        canvas.hline(186, 88, 108, fresh.frac(min(0.95, fresh_tone + 0.22)))
        for leg in (190, 284):
            canvas.rect(leg, 96, 5, 30, fresh.frac(max(0.04, fresh_tone - 0.22)))
        canvas.line(195, 102, 284, 118, fresh.frac(max(0.04, fresh_tone - 0.26)))
        for grain in range(7):                                  # scrubbed to the grain
            canvas.hline(190 + grain % 3, 90 + grain % 4, 96 - grain * 4,
                         fresh.frac(min(0.95, fresh_tone + 0.10)))
    with canvas.track("jar of teeth"):
        # On the table. Bone in a bone room, which is the joke: it does not
        # stand out and nobody has hidden it.
        cylinder(canvas, 264, 88, 10, 12, bone, base=max(0.04, bone_tone - 0.10),
                 lid_lift=0.14)
        for _ in range(14):
            canvas.put(rng.randrange(260, 269), rng.randrange(80, 87),
                       bone.frac(min(0.95, bone_tone + 0.10)))
        canvas.hline(259, 76, 11, dust.frac(0.30))                         # the lid
    with canvas.track("shavings"):
        # ERRATA 32b: against the bench legs, not strewn over the floor a
        # player walks across. Shavings gather where the plane was used.
        for _ in range(40):
            x = rng.choice((rng.randrange(186, 214), rng.randrange(272, 302)))
            y = rng.randrange(120, 138)
            ellipse_outline(canvas, x, y, rng.randrange(2, 4), 1,
                            fresh.frac(min(0.95, fresh_tone + 0.06)))

    # -- THE WINDOW. North light, a blind half down, and the blind is left
    #    half down so a visitor can see Boot Hill from where they stand.
    #    Doc 26 note 3: he has arranged the room so the answer is visible
    #    before he has to say it. Declared as a light source in the room
    #    file, per the 33b exemption.
    with canvas.track("window"):
        interior.interior_window(canvas, 190, 26, 34, 36, dust, palette.family("bone"),
                                 panes=(2, 2), base=0.34)
        canvas.hline(187, 62, 40, dust.frac(0.26))                         # the sill
        canvas.hline(187, 63, 40, dust.frac(0.14))
        # The blind, half down, and PALE -- it is linen with north light
        # behind it. Drawn dark it read as a blackboard, which is a whole
        # object arriving in the room that nobody wrote.
        canvas.rect(192, 28, 30, 14, dust.frac(0.62))
        canvas.hline(192, 28, 30, dust.frac(0.50))
        for slat in range(31, 41, 3):                                      # the roll, creased
            canvas.hline(193, slat, 28, dust.frac(0.56))
        canvas.hline(192, 41, 30, dust.frac(0.24))                         # the bottom bar
        canvas.vline(207, 42, 5, dust.frac(0.24))                          # the cord
        canvas.put(207, 47, dust.frac(0.34))
        # Boot Hill, through the lower panes: markers on a rise, four pixels
        # tall, and no more legible than that from in here.
        for marker_x, marker_y in ((196, 54), (203, 52), (212, 55), (217, 53)):
            canvas.vline(marker_x, marker_y, 4, dust.frac(0.40))
            canvas.hline(marker_x - 1, marker_y + 1, 3, dust.frac(0.40))

    with canvas.track("tools"):
        # DOC 26: a saw, a plane, a brace and a mallet, HUNG LEVEL and clean.
        # They were standing on the bench, which is where a carpenter leaves
        # tools and is not what the line says. Level is the observation, so
        # they hang from one rail on the wall above the table.
        # Individual nails rather than one rail: a continuous rail under a
        # window read as a shelf, and four objects standing on a shelf is a
        # different sentence from four hung level.
        for nail in (180, 202, 224, 244):
            canvas.put(nail + 4, 64, dust.frac(0.20))
        # The saw: handle, then a blade tapering to a point over eighteen
        # rows. The taper is the whole silhouette -- a bar was a smudge.
        canvas.rect(178, 65, 6, 6, dust.frac(0.22))
        for row in range(18):
            canvas.hline(184, 66 + row, max(1, 12 - row * 2 // 3), dust.frac(0.12))
        canvas.hline(184, 66, 12, dust.frac(0.46))
        # The plane: a block with a knob at the front and a wedge slot.
        canvas.rect(198, 68, 16, 7, dust.frac(0.14))
        canvas.hline(198, 68, 16, dust.frac(0.46))
        canvas.rect(200, 64, 4, 4, dust.frac(0.24))
        canvas.line(207, 69, 210, 74, dust.frac(0.42))
        # The brace: the crank, which is the only tool here with a curve.
        canvas.vline(228, 65, 6, dust.frac(0.16))
        canvas.line(228, 71, 234, 74, dust.frac(0.16))
        canvas.line(234, 74, 234, 79, dust.frac(0.16))
        canvas.vline(231, 79, 5, dust.frac(0.20))
        # The mallet: head across, handle down.
        canvas.rect(244, 65, 11, 7, dust.frac(0.12))
        canvas.hline(244, 65, 11, dust.frac(0.40))
        canvas.vline(249, 72, 13, dust.frac(0.24))

    # -- THE PRICE LIST, nailed to the back wall where the coffins end.
    with canvas.track("price list"):
        canvas.rect(168, 30, 18, 24, bone.frac(min(0.95, bone_tone + 0.08)))
        canvas.outline(168, 30, 18, 24, dust.frac(0.24))
        for row, width in ((34, 12), (40, 14), (46, 13)):     # Plain, Respectable, Handsome
            canvas.hline(170, row, width, dust.frac(0.34))
        canvas.hline(170, 50, 11, dust.frac(0.30))            # the fourth line
        canvas.line(169, 51, 182, 49, dust.frac(0.44))        # scratched out

    # -- THE GOOD SUIT on its peg: three sizes on one hanger, all let out at
    #    the waist. The ONE dark object in a pale room, and 32c's hierarchy
    #    in a single item -- everything else here is plain, this is not.
    with canvas.track("good suit"):
        canvas.put(84, 30, dust.frac(0.30))                                # the peg
        canvas.hline(78, 32, 13, dust.frac(0.22))                          # the hanger
        for offset, height in ((-4, 30), (0, 28), (4, 26)):
            for row in range(height):
                half = 3 + row // 5
                canvas.hline(84 + offset - half // 2, 33 + row, half,
                             palette.family("void").at(0))
                canvas.put(84 + offset - half // 2, 33 + row,
                           dust.frac(max(0.04, 0.16 - row * 0.003)))

    # -- the street door, on the short left wall, and the bench beside it for
    #    those come to arrange things. Doc 26: it has a cushion.
    with canvas.track("street door"):
        arch(canvas, 6, 40, 24, 52, dust, tone=0.18, rise=10)
    with canvas.track("waiting bench"):
        canvas.rect(28, 108, 76, 5, fresh.frac(max(0.04, fresh_tone - 0.10)))
        canvas.hline(28, 108, 76, fresh.frac(min(0.95, fresh_tone + 0.12)))
        for leg in (32, 98):
            canvas.rect(leg, 113, 3, 17, fresh.frac(max(0.04, fresh_tone - 0.26)))
        canvas.rect(30, 96, 3, 13, fresh.frac(max(0.04, fresh_tone - 0.18)))
        canvas.rect(99, 96, 3, 13, fresh.frac(max(0.04, fresh_tone - 0.20)))
        canvas.hline(30, 97, 72, fresh.frac(fresh_tone - 0.06))
    with canvas.track("cushion"):
        # Worn in the middle, which is the opposite of the Registrar's --
        # people who come here sit down properly and stay a while. Drawn with
        # a top face and a seam: a flat ellipse read as a stain on the bench.
        canvas.rect(46, 101, 34, 7, dust.frac(0.44))
        canvas.hline(47, 100, 32, dust.frac(0.56))
        canvas.hline(47, 104, 32, dust.frac(0.36))                        # the seam
        for corner in (46, 79):
            canvas.vline(corner, 101, 7, dust.frac(0.30))
        ellipse_fill(canvas, 63, 104, 12, 2, dust.frac(0.34))             # worn, middle

    # -- the burial ledger, on a stand between the door and the coffins. It
    #    is a LECTERN: a sloped top on a post. Drawn flat it read as a mat
    #    lying on the floor.
    with canvas.track("burial ledger"):
        for row in range(7):
            canvas.hline(106 + row // 2, 84 + row, 26 - row // 2,
                         dust.frac(max(0.06, 0.34 - row * 0.02)))
        canvas.hline(106, 84, 26, bone.frac(min(0.95, bone_tone + 0.06)))  # the open page
        canvas.hline(107, 86, 22, dust.frac(0.20))
        canvas.hline(108, 88, 18, dust.frac(0.18))
        canvas.rect(116, 91, 4, 26, fresh.frac(max(0.04, fresh_tone - 0.20)))
        canvas.rect(110, 117, 16, 3, fresh.frac(max(0.04, fresh_tone - 0.26)))
    with canvas.track("floor sawdust"):
        for _ in range(140):
            x, y = rng.randrange(14, WIDTH - 14), rng.randrange(box.back_bottom, HEIGHT - 2)
            canvas.put(x, y, fresh.frac(max(0.04, fresh_tone - 0.14 + 0.10 * rng.random())))

    # -- THE UNDERTAKER. Doc 27 gives him a tree and doc 20 gives him this
    #    room; a tree with nobody in the room to open it is a written scene
    #    the player cannot reach. He is never named -- note 2 -- so the
    #    hotspot is THE UNDERTAKER and nothing in the game improves on that.
    #
    #    Mid-dark, not black. The good suit on its peg is this room's one
    #    void-black mass and 32c's hierarchy rests on it being the only one.
    with canvas.track("the undertaker"):
        UNDERTAKER_BOUNDS.append(
            crowd.standing(canvas, palette, 150, 100, 34, rng, hat=False,
                           facing=1, tone=0.20, seed=13))

    ground_objects(canvas, palette, canvas.strokes, box.back_bottom - 8)

    # Flat daylight through a window out of frame. No lamp: an undertaker's
    # is scrubbed and it works in the morning.
    # ERRATA 40, held to THIS ROOM'S band. 0.90 to 0.74 and no further: the
    # target is a median near 90, not near 30, because 17b declares the
    # near-monochrome deliberate and pulling it down would be the ruling
    # overruling its own stated exception.
    field = LightField(WIDTH, HEIGHT, ambient=0.74)
    field.add_lamp(Lamp(x=40, y=40, radius=150, intensity=0.26, squash=1.6))
    field.apply(canvas, palette)

    # ERRATA 40, AND THIS ROOM IS THE DECLARED EXCEPTION. Errata 17b makes it
    # near-monochrome scrubbed white ON PURPOSE, so it is NOT pulled towards a
    # median of 30: the target is about 90 with 15 to 20 per cent below
    # luminance 30, which means real dark under the things in it and then
    # stop. No roof band -- a scrubbed workshop's ceiling is not black, and
    # blacking it would be the ruling applied against its own exception.
    for kind, args in (
        ("rect", (6, 42, 24, 48, 2)),                  # the street door
        ("smear", (72, 76, 104, 6)),                   # under the standing coffins
        ("smear", (184, 120, 114, 7)),                 # under the table
        ("smear", (28, 124, 78, 6)),                   # under the waiting bench
        ("smear", (102, 116, 34, 5)),                  # under the ledger stand
        ("smear", (186, 92, 108, 5)),                  # under the table top itself
        ("rect", (188, 28, 38, 14, 2)),                # the window's blind, unlit
        ("smear", (28, 134, 264, 8)),                  # the near floor, out of the light
        ("wedge", (0, box.back_top, 0, HEIGHT - 1, 5)),
    ):
        getattr(void, kind)(canvas, *args)
    return canvas, palette


def undertaker_foreground(palette: Palette) -> IndexedCanvas:
    """A finished coffin on its trestles, cropped bottom-left. Errata 32d.

    The most nameable object this room has, at fifty pixels, with the rest
    of it off the frame -- so the player is standing behind one before they
    have been told anything.
    """
    plane = IndexedCanvas(WIDTH, HEIGHT, fill=255)
    fresh = palette.family("pine_fresh")
    # THE HEXAGON IS THE NAME. A tapered box is a box; the shoulder break at
    # a third of the length is what makes it a coffin, and at this scale it
    # is the only part of the shape doing any work.
    for row in range(34):
        t = row / 33
        right = 104 if t < 0.30 else int(104 - 40 * (t - 0.30) / 0.70)
        plane.hline(0, HEIGHT - 34 + row, right, fresh.frac(max(0.03, 0.15 - 0.06 * t)))
        plane.put(right, HEIGHT - 34 + row, fresh.frac(0.04))
    plane.hline(0, HEIGHT - 34, 104, fresh.frac(0.24))
    plane.hline(0, HEIGHT - 24, 104, fresh.frac(0.07))          # the lid line
    for tx in (12, 62):
        plane.line(tx, HEIGHT - 1, tx + 9, HEIGHT - 28, fresh.frac(0.08))
    return plane


# ---------------------------------------------------------------------------


ROOMS = (
    (18, "room-18-hotel-lobby", hotel_lobby, hotel_foreground),
    (19, "room-19-thads-room", thads_room, thad_foreground),
    (13, "room-13-undertakers", undertakers, undertaker_foreground),
)


def main() -> None:
    for number, name, compose, foreground in ROOMS:
        canvas, palette = compose()
        plane = foreground(palette)
        canvas.blit(plane, 0, 0, transparent=255)
        canvas.save(RENDERS / f"{name}.png", palette)
        canvas.save(RENDERS / f"{name}@4x.png", palette, scale=4)
        canvas.save(BACKGROUNDS / f"{name}.png", palette)
        plane.save_rgba(FOREGROUNDS / f"{name}.png", palette)
        objects = len([1 for _, px in canvas.strokes if px])
        print(f"room {number:2d} {name}: {len(canvas.used_indices()):3d} colours, "
              f"{objects} tagged objects")


if __name__ == "__main__":
    main()
