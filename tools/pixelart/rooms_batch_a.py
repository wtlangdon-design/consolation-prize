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

NO HOTSPOTS. These rooms are enterable, lit and dressed; their examine
layers arrive with the documents being written for them. A hotspot with no
line is worse than no hotspot, and check-examine-lines says so.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import furniture
import interior
import lighting
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
    pine = palette.family("pine_weathered")

    shell(canvas, palette, box, script, rng)
    batten_wall(canvas, box, plush, plush_tone)
    interior.plank_floor(canvas, box, pine, rng, base=0.30)

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
        # The banister, which is what makes it a stair rather than a ziggurat.
        canvas.line(box.back_right - 4, box.back_bottom - 20, WIDTH - 6, box.back_bottom - 76,
                    brass.frac(brass_tone + 0.16))
        canvas.line(box.back_right - 4, box.back_bottom - 18, WIDTH - 6, box.back_bottom - 74,
                    brass.frac(max(0.04, brass_tone - 0.14)))
        for post in range(6):
            px = box.back_right - 2 + post * 20
            canvas.vline(px, box.back_bottom - 22 - post * 10, 12, pine.frac(0.24))

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
        canvas.rect(30, box.back_bottom - 30, 34, 18, pine.frac(0.22))
        canvas.outline(30, box.back_bottom - 30, 34, 18, pine.frac(0.10))
        for row in range(2):
            for hook in range(6):
                canvas.vline(34 + hook * 5, box.back_bottom - 26 + row * 8, 4,
                             brass.frac(brass_tone + 0.10))
                if rng.random() < 0.55:
                    canvas.put(34 + hook * 5, box.back_bottom - 22 + row * 8,
                               brass.frac(brass_tone + 0.26))

    # -- the parlour, right of the desk: the piano A2 turns on, two armchairs
    #    and a low table, arranged so every one of them crosses another.
    with canvas.track("piano"):
        furniture.upright_piano(canvas, palette, 128, 92, 52, 30, plush, bone, rng)
    with canvas.track("piano stool"):
        cylinder(canvas, 186, 104, 12, 10, pine, base=0.26, lid_lift=0.20)
    with canvas.track("armchair near"):
        armchair(canvas, palette, 96, 122, 34, 30, plush, plush_tone + 0.14, brass, rng)
    with canvas.track("armchair far"):
        armchair(canvas, palette, 172, 112, 28, 24, plush, plush_tone + 0.04, brass, rng)
    with canvas.track("low table"):
        furniture.rough_table(canvas, palette, 138, 112, 30, 12, pine, rng)
        canvas.hline(140, 114, 26, bone.frac(0.34))                        # a cloth

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
    field = LightField(WIDTH, HEIGHT, ambient=0.72)
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

    return canvas, palette


def armchair(canvas, palette, x, base_y, width, height, ramp, tone, brass, rng) -> None:
    """A wing chair: rounded back, arms proud of it, feet. Errata 32d's kind
    of object -- nameable, and it reads at a glance from its outline."""
    back_h = int(height * 0.72)
    ellipse_shaded(canvas, x + width // 2, base_y - back_h, width // 2, back_h // 2 + 2,
                   ramp, tone, lift=0.18)
    canvas.rect(x + 3, base_y - back_h, width - 6, back_h, ramp.frac(tone))
    for arm in (x, x + width - 6):
        canvas.rect(arm, base_y - int(height * 0.44), 6, int(height * 0.34),
                    ramp.frac(min(0.92, tone + 0.10)))
        ellipse_shaded(canvas, arm + 3, base_y - int(height * 0.44), 3, 2, ramp, tone + 0.16)
    canvas.rect(x + 2, base_y - int(height * 0.30), width - 4, int(height * 0.20),
                ramp.frac(min(0.92, tone + 0.14)))              # the seat, shiny
    for foot in (x + 3, x + width - 5):
        canvas.rect(foot, base_y - 4, 2, 4, brass.frac(0.22))
    canvas.hline(x + 1, base_y - 1, width - 2, ramp.frac(0.05))


def hotel_foreground(palette: Palette) -> IndexedCanvas:
    """Errata 32d and 21a: a NAMEABLE object, cropped, at large scale.

    The wing of a second armchair, bottom-left, forty pixels of it and the
    rest off the frame. A texture mass would satisfy 21a and do nothing 32d
    asks for -- this establishes depth in one read and gives the room a scale
    anchor, which is 32e's large end supplied for free.
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

    shell(canvas, palette, box, script, rng)
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

    # -- the washstand, against the back wall, with a basin and a jug. The
    #    accent lives here: tin, and nowhere else.
    with canvas.track("washstand"):
        canvas.rect(88, 84, 34, 26, pine.frac(0.24))
        canvas.hline(88, 84, 34, pine.frac(0.40))
        canvas.vline(90, 86, 24, pine.frac(0.12))
        canvas.vline(118, 86, 24, pine.frac(0.12))
    with canvas.track("basin"):
        ellipse_shaded(canvas, 100, 82, 11, 4, tin, tin_tone, lift=0.20)
        ellipse_outline(canvas, 100, 82, 11, 4, tin.frac(min(0.95, tin_tone + 0.22)))
    with canvas.track("jug"):
        cylinder(canvas, 112, 70, 10, 12, tin, base=max(0.04, tin_tone - 0.10), lid_lift=0.18)
        canvas.line(122, 74, 125, 78, tin.frac(tin_tone))                  # the handle

    # -- his case, open on the floor at the foot of the bed, and the chair
    #    with a coat over it. Both cross something.
    with canvas.track("his case"):
        canvas.rect(150, 116, 26, 12, palette.family("umber").frac(0.20))
        canvas.hline(150, 116, 26, palette.family("umber").frac(0.34))
        canvas.rect(152, 110, 22, 7, palette.family("umber").frac(0.14))   # the lid, up
        canvas.put(162, 116, gold.frac(0.44))                              # the clasp
    with canvas.track("chair"):
        # Seat, four legs, a back. Drawn here rather than through
        # rough_chair, which is built for a saloon at a different scale and
        # came out a cone at this one.
        canvas.rect(122, 112, 20, 3, pine.frac(0.30))
        canvas.hline(122, 112, 20, pine.frac(0.44))
        for leg in (123, 139):
            canvas.rect(leg, 115, 2, 13, pine.frac(0.20))
        canvas.rect(122, 96, 2, 17, pine.frac(0.26))
        canvas.rect(140, 96, 2, 17, pine.frac(0.22))
        canvas.hline(122, 97, 20, pine.frac(0.34))
        canvas.hline(122, 103, 20, pine.frac(0.30))
    with canvas.track("coat"):
        # Over the chair back and hanging past the seat. His one coat, and
        # the only dark mass in a pale-drab room.
        green = palette.family("pine_green")
        for row in range(22):
            half = 7 + row // 4 - (3 if row > 17 else 0)
            canvas.hline(132 - half // 2, 96 + row, half,
                         green.frac(max(0.04, 0.14 - row * 0.002)))
        canvas.hline(128, 96, 10, green.frac(0.24))

    # -- the candle, unlit until night, on the sill. 32e's small end.
    with canvas.track("candle"):
        canvas.vline(160, 62, 7, calico.frac(0.72))
        canvas.put(160, 61, gold.frac(0.50))
    with canvas.track("floor grit"):
        for _ in range(90):
            x, y = rng.randrange(30, WIDTH - 30), rng.randrange(box.back_bottom, HEIGHT - 2)
            canvas.put(x, y, pine.frac(max(0.04, 0.26 + 0.08 * rng.random())))

    ground_objects(canvas, palette, canvas.strokes, box.back_bottom - 6)

    field = LightField(WIDTH, HEIGHT, ambient=0.80)
    field.add_lamp(Lamp(x=180, y=46, radius=130, intensity=0.44, squash=1.5))
    field.apply(canvas, palette)
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

    # -- the workbench, the focal object, with the tools that made them.
    with canvas.track("workbench"):
        canvas.rect(186, 88, 108, 8, fresh.frac(fresh_tone))
        canvas.hline(186, 88, 108, fresh.frac(min(0.95, fresh_tone + 0.18)))
        for leg in (190, 284):
            canvas.rect(leg, 96, 5, 26, fresh.frac(max(0.04, fresh_tone - 0.22)))
        canvas.line(195, 100, 284, 116, fresh.frac(max(0.04, fresh_tone - 0.26)))
    with canvas.track("tools"):
        for index, x in enumerate((196, 206, 214, 226, 238)):
            canvas.vline(x, 78 - index % 2 * 3, 10 + index % 3 * 2, dust.frac(0.30))
            canvas.hline(x - 1, 78 - index % 2 * 3, 3, dust.frac(0.46))
        canvas.rect(250, 82, 18, 6, dust.frac(0.24))                       # a plane
        canvas.hline(250, 82, 18, dust.frac(0.44))
    with canvas.track("shavings"):
        # ERRATA 32b: against the bench legs, not strewn over the floor a
        # player walks across. Shavings gather where the plane was used.
        for _ in range(40):
            x = rng.choice((rng.randrange(186, 214), rng.randrange(272, 302)))
            y = rng.randrange(120, 138)
            ellipse_outline(canvas, x, y, rng.randrange(2, 4), 1,
                            fresh.frac(min(0.95, fresh_tone + 0.06)))

    # -- an unfinished coffin on trestles, mid-room, crossing the bench.
    with canvas.track("trestles"):
        for tx in (176, 250):
            canvas.line(tx, 108, tx + 7, 122, fresh.frac(max(0.04, fresh_tone - 0.24)))
            canvas.line(tx + 14, 108, tx + 7, 122, fresh.frac(max(0.04, fresh_tone - 0.24)))
            canvas.hline(tx, 108, 15, fresh.frac(fresh_tone - 0.10))
    with canvas.track("coffin on trestles"):
        for row in range(11):
            t = row / 10
            left = int(170 + 6 * t)
            right = int(268 - 4 * t)
            canvas.hline(left, 98 + row, right - left, bone.frac(bone_tone - 0.10 - 0.04 * t))
        canvas.hline(170, 98, 98, bone.frac(min(0.95, bone_tone + 0.06)))
        # The lid line and the shoulder breaks, so it is a coffin rather than
        # a trough. Three lines, and they are the whole difference.
        canvas.hline(178, 103, 84, bone.frac(max(0.04, bone_tone - 0.26)))
        canvas.vline(196, 98, 11, bone.frac(max(0.04, bone_tone - 0.22)))
        canvas.vline(244, 98, 11, bone.frac(max(0.04, bone_tone - 0.22)))

    # -- the black coat on its peg. The ONE dark object in a pale room, and
    #    32c's hierarchy in one item: everything else is plain, this is not.
    with canvas.track("the coat"):
        canvas.put(84, 30, dust.frac(0.30))                                # the peg
        for row in range(30):
            half = 3 + row // 4
            canvas.hline(84 - half // 2, 32 + row, half, palette.family("void").at(0))
            canvas.put(84 - half // 2, 32 + row, dust.frac(max(0.04, 0.16 - row * 0.003)))
        canvas.hline(80, 34, 9, dust.frac(0.12))                           # the shoulders

    # -- the burial ledger, on a stand by the door. Small, and the object the
    #    whole of A1 is about.
    with canvas.track("burial ledger"):
        canvas.rect(40, 92, 22, 4, dust.frac(0.34))
        canvas.rect(38, 96, 26, 4, dust.frac(0.22))
        canvas.line(44, 100, 46, 120, fresh.frac(max(0.04, fresh_tone - 0.24)))
        canvas.line(58, 100, 56, 120, fresh.frac(max(0.04, fresh_tone - 0.24)))
    with canvas.track("floor sawdust"):
        for _ in range(140):
            x, y = rng.randrange(14, WIDTH - 14), rng.randrange(box.back_bottom, HEIGHT - 2)
            canvas.put(x, y, fresh.frac(max(0.04, fresh_tone - 0.14 + 0.10 * rng.random())))

    ground_objects(canvas, palette, canvas.strokes, box.back_bottom - 8)

    # Flat daylight through a window out of frame. No lamp: an undertaker's
    # is scrubbed and it works in the morning.
    field = LightField(WIDTH, HEIGHT, ambient=0.90)
    field.add_lamp(Lamp(x=40, y=40, radius=150, intensity=0.26, squash=1.6))
    field.apply(canvas, palette)
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
