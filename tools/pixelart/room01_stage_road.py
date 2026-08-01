"""Room 1 — Stage Road & Coach Stop. Night. The only night exterior.

Doc 17: lamp and window light only, no directional sun. Ruling 17a decides
the whole room before anything is drawn -- the lighting pass steps a colour
along its own ramp and cannot change hue, so a cold-blue night with a warm
lamp needs BOTH families present in the materials from the start. The lamp
cannot warm a blue room. Every surface here is therefore authored in a cold
family (sky, grey, indigo) EXCEPT the things the lamp and the windows touch,
which are authored in warm ones (ochre, accent_gold, dusk).

Doc 17 also makes Hob's lamp the brightest object on screen and the only
warm one, because it is the only thing that moves and a player who examines
nothing should still watch it cross. So the town's lit windows downhill are
deliberately dimmer than the lamp: they are further away and they are not
the point.

The coach is present and departs on the driver's exit line, so it is drawn
as a separate layer the engine can stop compositing rather than baked into
the background.
"""

from __future__ import annotations

import math
import random
from contextlib import contextmanager, nullcontext
from pathlib import Path

import cycling
from canvas import IndexedCanvas
from clutter import lumber_stack
from components import crate, distant_hills
from dither import BAYER2, BAYER4, dither_pixel
from lighting import Lamp, LightField, collar, lamp_core
from palette import Palette
import void
from primitives import (
    barrel, catenary, ellipse_outline, ellipse_shaded, enforce_sky_ceiling,
    ground_objects, organic_mass, rope, sack, spoked_wheel,
)
from renders import BACKGROUNDS, FOREGROUNDS, RENDERS

OBJECTS = BACKGROUNDS.parent / "objects"

ROOT = Path(__file__).resolve().parents[2]

WIDTH, HEIGHT = 320, 144
SEED = 18580412

HORIZON = 58
ROAD_Y = 96            # where the stage road runs across
#: Night, but a PLAYABLE night. At 0.52 the ground measured p10 16-23 against
#: Thad's coat at 33 -- a seven-to-fourteen point margin, which means the
#: whole dark mass of him melts into the road and only his face reads. This
#: is the first room anyone plays. Moonlight is the source: cool, broad, and
#: from above, which is also why the wet ruts below have a sheen.
AMBIENT = 0.86

#: Hob's lamp, mid-crossing. The engine animates him; this is where he is
#: for the reference render.
LAMP = (88, 84)
COACH_X = 214

#: The two reserved cycling bands, doc 18. Absolute indices, resolved from the
#: same declarations content/rooms/stage-road.json gives the engine -- they are
#: derived here rather than typed twice, because two copies of a palette range
#: is exactly the sort of thing that stays right for one commit.
def _band(room_id: str, element_id: str) -> list[int]:
    from palette import Palette as _P
    element = next(e for e in cycling.load(room_id, _P.load()) if e.id == element_id)
    return list(element.indices)


LAMP_BAND = _band("stage_road", "hobs_lamp")
PUDDLE_BAND = _band("stage_road", "puddles")


def compose(with_coach: bool = True, lamp_x: int | None = None,
            swing: int = 0, graze: tuple[int, int] = (0, 0),
            tracked: bool = False) -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))

    indigo = palette.family("accent_indigo")
    sky = palette.family("sky")
    grey = palette.family("grey")
    sage = palette.family("sage")
    mud = palette.family("mud")
    umber = palette.family("umber")
    ochre = palette.family("ochre")
    gold = palette.family("accent_gold")
    bone = palette.family("bone")

    # -- night sky: indigo, darkest overhead --------------------------------
    for y in range(HORIZON):
        height = 1.0 - (y / HORIZON)
        for x in range(WIDTH):
            # ERRATA 40. The gradient ran 0.10 to 0.44 of indigo, which put a
            # THIRD of the frame in the forties -- a dusk sky, not a night
            # one, and the single largest reason Room 1's median measured 44
            # against the reference's 27. Overhead is now near-void and the
            # lift is kept for the last few rows above the hills, where a sky
            # actually is lighter. The stars gain from it: they are drawn at
            # bone 0.30 to 0.70 and were competing with their own background.
            dither_pixel(canvas, x, y, indigo, max(0.02, 0.02 + 0.30 * (1 - height) ** 2),
                         BAYER4)
    for _ in range(90):
        x, y = rng.randrange(WIDTH), rng.randrange(0, HORIZON - 14)
        canvas.put(x, y, bone.frac(0.30 + 0.40 * rng.random()))

    # -- hills, nearly silhouettes -----------------------------------------
    distant_hills(canvas, 0, HORIZON - 16, WIDTH, 18, sky, rng, layers=2, amplitude=6)
    distant_hills(canvas, 0, HORIZON - 8, WIDTH, 20, sage, rng, layers=2, amplitude=8)

    # -- ground: cold, because night ground is cold ------------------------
    #
    # Still grey, still cold: night ground is not warm and ruling 17a means no
    # amount of lamplight would make it so. But a graded fill was not enough.
    # It read as a concrete wall standing behind the road -- a quarter of the
    # frame at one tone, meeting the road at a dead straight horizontal. Three
    # things were wrong, and all three are ground cues rather than lighting.
    #
    # THE GRADE RAN OVER THE WRONG EXTENT. It was computed across the whole
    # canvas below the horizon, but the road covers the bottom half of that,
    # so the 36 visible rows used 0.30 to 0.39 of the ramp -- nine hundredths
    # of it -- and looked flat because they were flat. It now runs over the
    # band's own height, dark and cool at the hill base, lifting toward the
    # road.
    #
    # THE TWO PLANES BUTTED. They interleave now: the road's own family
    # appears in the verge with rising density over the last dozen rows, so
    # the near ground comes up to meet the far ground. Dithering ACROSS
    # families is normally wrong and dither.py says so; it is right here for
    # the same reason it is normally wrong. This genuinely is two materials
    # meeting, and the crosshatch is what stops the meeting being a line.
    ground_rng = random.Random(SEED ^ 0x51DE)
    verge_top = HORIZON + 2
    for y in range(verge_top, ROAD_Y):
        walk = (y - verge_top) / max(1, ROAD_Y - 1 - verge_top)
        for x in range(WIDTH):
            # Nothing warm until the last third, then quickly. A linear fade
            # puts stray warm pixels up by the horizon, where there is no road
            # to explain them.
            #
            # The threshold moves with x. Without that the interleave is a
            # perfectly horizontal crosshatch stripe, which replaces one ruled
            # line across the frame with a wider ruled band -- the same defect
            # in softer form. The undulation is worth about four rows.
            warm = max(0.0, (walk - (0.66 + 0.09 * _edge_wave(x))) / 0.34) ** 1.7
            if BAYER4.threshold(x, y) < warm:
                dither_pixel(canvas, x, y, mud, 0.38 + 0.16 * walk, BAYER2)
            else:
                dither_pixel(canvas, x, y, grey, max(0.03, 0.20 + 0.34 * walk), BAYER2)
    for _ in range(220):
        x, y = rng.randrange(WIDTH), rng.randrange(HORIZON + 3, ROAD_Y)
        canvas.put(x, y, sage.frac(0.10 + 0.14 * rng.random()))
        if rng.random() < 0.4:
            canvas.put(x + 1, y, sage.frac(0.08))
        if rng.random() < 0.3:
            canvas.put(x, y - 1, grey.frac(0.46))

    # AND THE HORIZONTAL WENT UNBROKEN from frame edge to frame edge. Scrub
    # gathered into clumps instead of scattered evenly, stones, and the wheel
    # ruts of the road east climbing away to frame right, which is the one
    # thing in the band that crosses it at an angle. An even scatter is a
    # texture; a plane needs something on it that recedes.
    #
    # ground_rng is its own stream so that adding any of this does not shift
    # the town's windows or the stars, which are already where they should be.
    scrub_clumps(canvas, ground_rng, sage, grey, verge_top)
    stones(canvas, ground_rng, grey, verge_top)
    wheel_ruts(canvas, mud, grey)

    # The road itself: churned mud, paler than the verge.
    for y in range(ROAD_Y, HEIGHT):
        walk = (y - ROAD_Y) / max(1, HEIGHT - ROAD_Y)
        for x in range(WIDTH):
            dither_pixel(canvas, x, y, mud, max(0.04, 0.54 + 0.16 * walk), BAYER2)
    for _ in range(90):
        y = rng.randrange(ROAD_Y, HEIGHT)
        canvas.hline(rng.randrange(0, WIDTH), y, 2 + rng.randrange(0, 8),
                     mud.frac(0.36 + 0.12 * rng.random()))

    # Wet sheen in the ruts. Drawn in the SKY family, not in mud: moonlight
    # on standing water is the coldest thing in the frame, and it has to stay
    # cold or it competes with the lamp for being the warm object. Ruling 17a
    # again -- the family decides, and no amount of lighting would have made
    # a mud-family highlight read as moonlight.
    #
    # Painted with the three RESERVED sky entries rather than with a fraction
    # of the ramp, because these are doc 18's cycling element. Each streak
    # takes a different one of the three in turn, which is where the per-puddle
    # phase offset comes from: one rotation, three indices, and a puddle
    # painted with the second index is always one third of a cycle ahead of a
    # puddle painted with the first. Doc 18 asks for three entries and this is
    # how three entries buy three phases.
    #
    # 152-154 and not the 149-151 they used to sit on: those three are shared
    # with the distant hills, and a reserved band may not be shared with
    # anything. The move is also a lift -- luminance 107 to 123 against a road
    # at 65 to 85 -- which reads more like standing water than the old one did.
    for streak in range(34):
        y = rng.randrange(ROAD_Y + 2, HEIGHT)
        x = rng.randrange(0, WIDTH - 8)
        length = 2 + rng.randrange(0, 6)
        rng.random()                      # kept, so the streaks stay where they were
        canvas.hline(x, y, length, PUDDLE_BAND[streak % len(PUDDLE_BAND)])

    # -- the town downhill, west: lit windows and nothing else -------------
    # Drawn AFTER the ground. It was drawn before it and the ground fill
    # painted straight over the top, so the town was not in the picture at all.
    town_glow(canvas, palette, rng, ochre, umber, grey)

    # -- what the road has accumulated -------------------------------------
    # Before the sign and the coach, so those two stay the objects that read
    # first: dressing goes down early and is overlapped by everything that
    # matters, which is also how it stays quiet.
    roadside(canvas, palette, random.Random(SEED ^ 0xD8E5), ROAD_Y, tracked=tracked)

    # -- the town sign -----------------------------------------------------
    with (canvas.track('town sign') if tracked else nullcontext()):
        town_sign(canvas, palette, 36, ROAD_Y - 34, umber, bone)

    # -- his case, at his feet, downstage ----------------------------------
    with (canvas.track('his case') if tracked else nullcontext()):
        case(canvas, palette, 150, 126, umber, gold)

    # -- the coach, halted, driver unloading -------------------------------
    if with_coach:
        with (canvas.track('the coach') if tracked else nullcontext()):
            coach(canvas, palette, rng, COACH_X, ROAD_Y + 2, umber, grey, gold,
                  graze=graze)

    # -- Hob, and his lamp -------------------------------------------------
    # Hob is lit; his lamp is not, so only Hob goes in before the pass.
    lx = LAMP[0] if lamp_x is None else lamp_x
    ly = LAMP[1]
    with (canvas.track('hob') if tracked else nullcontext()):
        watchman(canvas, palette, lx, ly, grey, swing=swing)

    # -- one lighting pass over the lot ------------------------------------
    field = LightField(WIDTH, HEIGHT, ambient=AMBIENT)
    # The lamp: small radius, high intensity. It is the brightest thing here
    # and it has to fall off fast or the night stops being night.
    field.add_lamp(Lamp(x=lx, y=ly + 4, radius=54, intensity=0.95, squash=1.3))
    # The coach lantern, dimmer.
    if with_coach:
        field.add_lamp(Lamp(x=COACH_X - 16, y=ROAD_Y - 4, radius=28, intensity=0.30, squash=1.2))
    # The town, far off downhill, lifting the horizon a little at frame left.
    field.add_lamp(Lamp(x=24, y=HORIZON + 6, radius=70, intensity=0.26, squash=2.2))
    # Moonlight: very broad, weak, cool, and from high frame right. It is not
    # a lamp in the fiction -- it is why the ground is visible at all.
    # ERRATA 40. The moon was 0.30 over a radius of 340, which is the whole
    # frame lit evenly -- and an evenly lit night is a grey day. Dropped to
    # 0.16: the ground away from the lamp falls away, which is what leaves
    # the lamp as the only warm thing in the picture and is the reason doc 17
    # put a man carrying one on this road.
    field.add_lamp(Lamp(x=250, y=40, radius=340, intensity=0.16, squash=0.8))
    # Sky is not lit by lamps.
    for y in range(HORIZON - 8):
        for x in range(WIDTH):
            field.level[y][x] = max(field.level[y][x], 0.98) if y < HORIZON - 18 else field.level[y][x]
    field.apply(canvas, palette)

    # Sources are objects, not lit surfaces, so they go on after the pass.
    #
    # The lamp OBJECT moved here too, from inside watchman(). It has to be
    # drawn after the field rather than before it: the field steps a colour
    # along its own ramp, and a lamp painted in its reserved band before the
    # pass comes out of the pass somewhere else, which would leave the band
    # reserved for pixels that are no longer in it.
    lantern(canvas, lx, ly)
    lamp_core(canvas, palette, lx - 1, ly + 2, "accent_gold", radius=1)
    # Two rows of core, not four. At four it covered the third band entry
    # completely and the lamp cycled on three of its four reserved entries --
    # which still animates, and still looks like a lamp, and is exactly the
    # kind of thing that is invisible until somebody counts the pixels.
    canvas.rect(lx - 2, ly + 2, 3, 2, LAMP_BAND[3])

    # -- ERRATA 33a: dark collars -----------------------------------------
    #
    # Not a hotter core. The lamp is already at accent_gold's ceiling and the
    # step to its surround is 124; what was wrong is that the surround sat at
    # 81 in a frame whose median is 53, so the brightest thing in the picture
    # was standing in one of its lighter patches.
    #
    # The lamp's own pixels are protected by its reserved band: doc 18 gives
    # it four indices that nothing else in the room may use, which makes "is
    # this the lamp" exact rather than a guess about brightness.
    lamp_band = set(LAMP_BAND)
    is_lamp = lambda cx, cy: canvas.get(cx, cy) in lamp_band
    collar(canvas, palette, lx - 1, ly + 3, 4, 13, steps=3, keep=is_lamp)
    if with_coach:
        collar(canvas, palette, COACH_X - 16, ROAD_Y - 5, 3, 9, steps=2)
    # The town downhill: a collar round the whole cluster, not each window.
    # At this distance the lit windows are one source, which is also what
    # doc 17's line calls them -- "lamps on in about a third of it".
    collar(canvas, palette, 30, ROAD_Y - 30, 22, 40, steps=2)

    # -- ERRATA 40: the void ----------------------------------------------
    #
    # Measured before this: median 44.4, p10 21.2, 17.8% below luminance 30 --
    # against the reference's 27.3 / 1.9 / 55.0%. And the frame's ONE region
    # of near-void was 8.0% of it, which is the foreground plane and exactly
    # what the ruling predicted: a near plane cannot carry this.
    #
    # A NIGHT EXTERIOR'S BLACK IS UNDER THINGS AND BEHIND THEM. There is no
    # roof here, so the regions are the ones a low moon and a single lamp
    # leave: under the coach body between its wheels, under the team's
    # bellies, the far side of the treeline, and the stretches of verge the
    # lamp does not reach. Every one is bounded by something already drawn.
    #
    # Stamped AFTER the field, and never over the lamp: doc 18 reserves four
    # entries for it and the pulse depends on those pixels being exactly
    # those.
    reserved = set(LAMP_BAND)
    keep_lamp = lambda cx, cy: canvas.get(cx, cy) in reserved

    if with_coach:
        # Under the body, between the wheels. The largest single region a
        # stage coach has and ours was lit ground.
        # A SMEAR, NOT A RECTANGLE. The first version stamped a hard-edged
        # black box on the road and it read as a hole, which is the same
        # mistake the Nugget's ellipses made and the reason both were looked
        # at rather than only measured.
        void.smear(canvas, COACH_X + 4, ROAD_Y - 7, 48, 9, keep=keep_lamp)
        # Under the team: two bellies and the ground between eight legs.
        void.smear(canvas, COACH_X - 84, ROAD_Y - 2, 62, 6, keep=keep_lamp)

    # NO BAND AT FRAME LEFT. A void band along the horizon there sat straight
    # over the town's lit windows -- which is errata 36.1 all over again, and
    # it was caught the same way: by looking at the picture after the numbers
    # came out right. The town is the only warm thing on that horizon and
    # nothing may stand in front of it, including darkness.
    #
    # It runs from x=88 instead, which is clear of town_glow's last roof: the
    # hills east of the town have nothing lit on them and no reason to be
    # visible at all.
    void.band(canvas, 88, HORIZON - 4, WIDTH - 88, 12, feather=5, keep=keep_lamp)

    # The verge, in the stretches between the lamp and the coach lantern. Not
    # one bar: the gaps are where the two sources do not overlap.
    for vx, vw in ((112, 42), (168, 30)):
        void.smear(canvas, vx, ROAD_Y - 14, vw, 5, keep=keep_lamp)

    # The freight heap's interior -- the gaps between a butt, two barrels and
    # a crate stacked against each other.
    void.smear(canvas, 6, ROAD_Y - 10, 50, 6, keep=keep_lamp)

    # -- the foreground plane, ruling 21a ----------------------------------
    #
    # Drawn last of the room, over everything including the actor when the
    # engine composites it. Room 1 is the ruling's cited worst case: eighty
    # per cent of the first screen anyone plays sat inside a 58-point band,
    # a quarter of the range available, with nothing below luminance 20 to
    # speak of. A near plane is out of the light by definition, so the bottom
    # of the range arrives without touching one lit surface.
    #
    # Bottom LEFT, because the right of this frame is the coach, the team,
    # the road east and every legibility sample. And a corner rather than a
    # band: 21a is explicit that a horizontal strip across the frame
    # reproduces the problem it exists to solve.
    global FOREGROUND
    FOREGROUND = IndexedCanvas(WIDTH, HEIGHT, fill=255)
    scrub_bank(FOREGROUND, palette, random.Random(SEED ^ 0x21A))
    canvas.blit(FOREGROUND, 0, 0, transparent=255)

    # ERRATA 33b, enforced rather than remembered. Room 1's hills were drawn
    # in the sky family and came out at 148 to 172 against a night sky of
    # 42.7 -- the code called them "nearly silhouettes" and they were the
    # second brightest thing in the frame after the lamp. The lamp, the coach
    # lantern and the town are exempt because the room file says so.
    enforce_sky_ceiling(canvas, palette, (0, 44), (44, 80), exempt=(
        (64, 66, 46, 42), (180, 76, 34, 30), (0, 56, 74, 22),
    ))

    # Doc 18 note 1, enforced before anything is written: a reserved index may
    # appear only inside its own element. reserve() moves the trespassers --
    # here the coach lantern and the clasp on Thad's case, both accent_gold --
    # and verify() proves none are left.
    elements = cycling.load("stage_road", palette)
    cycling.reserve(canvas, palette, elements)
    cycling.verify(canvas, elements)

    return canvas, palette


def roadside(canvas: IndexedCanvas, palette: Palette, rng, ground_y: int,
             tracked: bool = False) -> None:
    """What a stage road accumulates. Build item 3, and most of it is not a hotspot.

    Room 1 had nine drawn objects and about ninety per cent of the frame was
    two empty planes. Monkey Island's rooms carry forty to sixty, and the
    difference is not decoration -- an empty plane reads as unfinished
    whatever is standing on it, and Thad's first thirty seconds are spent
    looking at one.

    THREE RULES, all from the references rather than from taste:

    OVERLAP. Not one object in Room 1 partially occluded another. Everything
    stood alone on the ground line like stock on a shelf. In the ship's hold
    every object overlaps something, and that is what makes forty objects a
    place instead of forty stickers. So these are drawn in depth bands, back
    to front, and they are allowed to cross.

    QUIET. Errata 23's proportions do not relax and neither does the
    legibility gate. Almost all of this sits in the dominant field and the
    structural shadow -- mud, grey and weathered pine -- and introduces no
    new colour, which is how the reference gets density without losing the
    things that matter. A dense room is exactly where a hotspot stops
    reading.

    SCALE VARIETY. Everything in the old frame was between eight and twenty
    pixels. The reference runs from a whole circus tent down to a hammock.
    So: a water butt as tall as Thad's chest, and bottles four pixels long.
    """
    mud = palette.family("mud")
    grey = palette.family("grey")
    pine = palette.family("pine_weathered")
    umber = palette.family("umber")
    sage = palette.family("sage")
    dust = palette.family("dust")

    # Tracking is on ALWAYS, not only for the audit: the contact shadows are
    # driven off it, so an object that is not tagged is an object that does
    # not get grounded, which is the failure this is here to make impossible.
    first = len(canvas.strokes)

    @contextmanager
    def tag(name: str):
        with canvas.track(name):
            yield

    # SILHOUETTE, NOT TEXTURE. The first pass put everything at tone 0.16 to
    # 0.26 against a verge running 0.20 to 0.54 -- the same luminance band, so
    # forty new objects arrived and the frame read as slightly dirtier rather
    # than fuller. At night an object between the eye and a moonlit verge is
    # DARKER than it, not the same. Everything in the far and mid bands is
    # pushed down to read as a cut-out.
    #
    # And density belongs at the EDGES and in DEPTH, not scattered over the
    # plane the player walks on. That is the reference's actual habit: the
    # ship's hold is packed to the walls and its floor is nearly clear, the
    # circus clearing is empty because it is a pool of light. Litter strewn
    # across a walkable band is not density, it is a legibility problem with
    # more steps.

    # -- far band: low, half-buried, against the verge ----------------------
    for index, (x, r) in enumerate(((16, 6), (48, 4), (150, 5), (196, 6), (232, 4))):
        with tag(f"verge stone {index}"):
            organic_mass(canvas, x, ground_y - 13, r, max(2, r - 2), grey, rng, tone=0.10, lumps=3)

    # -- the fence: the one thing crossing the middle distance at an angle,
    #    which is what an empty plane needs more than it needs objects on it.
    for index in range(9):
      with tag(f"fence post {index}"):
        px = 12 + index * 34
        py = ground_y - 13 - index // 3
        canvas.vline(px, py - 10, 11, pine.frac(0.10))
        canvas.put(px + 1, py - 10, pine.frac(0.05))
        if index:
            canvas.line(px - 34, py - 7, px, py - 8, pine.frac(0.08))
            canvas.line(px - 34, py - 4, px, py - 5, pine.frac(0.06))

    # -- LEFT EDGE: the freight heap. A vertical mass at the frame edge, in
    #    depth: butt behind, barrels across it, sacks and crates in front.
    # ERRATA 36.1: THE HEAP CLEARS THE TOWN'S WINDOWS. town_glow paints its
    # lit squares between y=55 and y=64 across the whole of frame left, and
    # the water butt stood from 54 to 80 -- straight through them. The only
    # warm thing in the distance was behind a barrel. Everything here now
    # starts at 66 or lower, which keeps the heap at the frame edge where
    # 32b wants it and takes it out of the one band that matters.
    with tag("water butt"):
        barrel(canvas, 2, ground_y - 30, 19, 26, pine, grey, rng, base=0.14,
               open_top=True, horizon=HORIZON)
    with tag("butt rope"):
        rope(canvas, catenary(8, ground_y - 44, 21, ground_y - 42, 5), pine, tone=0.16)
    with tag("freight barrel A"):
        barrel(canvas, 18, ground_y - 26, 15, 18, umber, grey, rng, base=0.12,
               horizon=HORIZON)
    with tag("freight barrel B"):
        barrel(canvas, 30, ground_y - 22, 12, 14, mud, grey, rng, base=0.10,
               horizon=HORIZON)
    with tag("freight crate"):
        crate(canvas, 40, ground_y - 18, 14, 11, pine, rng, base=0.12)
    with tag("freight sack A"):
        sack(canvas, 14, ground_y - 6, 13, 14, dust, rng, tone=0.16)
    with tag("freight sack B"):
        sack(canvas, 25, ground_y - 7, 11, 12, dust, rng, tone=0.13)

    # -- 96 to 150: what was bare. Feed trough, lumber, a leaning crate.
    with tag("feed trough"):
        canvas.rect(98, ground_y - 15, 30, 6, pine.frac(0.11))
        canvas.hline(98, ground_y - 15, 30, pine.frac(0.20))
        canvas.vline(100, ground_y - 9, 8, pine.frac(0.09))
        canvas.vline(125, ground_y - 9, 8, pine.frac(0.09))
    with tag("lumber"):
        lumber_stack(canvas, palette, 112, ground_y - 4, 22, 5, pine, rng, tone=0.11)
    with tag("trough crate"):
        crate(canvas, 116, ground_y - 26, 12, 10, pine, rng, base=0.13)

    # -- the milepost, alone, with air round it. It is the only object in the
    #    frame that is a statement about distance, which is what the road is
    #    about, and crowding it would waste it.
    with tag("milepost"):
        canvas.vline(160, ground_y + 4, 14, pine.frac(0.26))
        canvas.rect(157, ground_y, 9, 6, pine.frac(0.34))
        canvas.hline(157, ground_y, 9, pine.frac(0.50))
        canvas.hline(157, ground_y + 5, 9, pine.frac(0.08))

    # -- the broken wheel, leaning on the fence. A curve in a frame that had
    #    exactly one, and now the second-largest object on the left of the
    #    coach.
    with tag("broken wheel"):
        spoked_wheel(canvas, 190, ground_y + 11, 13, grey, spokes=10, tone=0.13, squash=0.34)
    with tag("dropped axle"):
        # Runs from under the milepost to under the wheel and touches both.
        for offset in range(3):
            canvas.line(160, ground_y + 16 + offset, 192, ground_y + 12 + offset,
                        grey.frac(0.16 if offset == 1 else 0.08))

    # -- the harness rail: posts, a top bar, and three sets over it. Without
    #    the posts the ropes were three squiggles in mid-air.
    with tag("harness rail"):
        canvas.vline(210, ground_y - 26, 14, pine.frac(0.14))
        canvas.vline(246, ground_y - 26, 14, pine.frac(0.14))
        canvas.hline(210, ground_y - 26, 37, pine.frac(0.20))
        for hook_x in (216, 226, 236):
            rope(canvas, catenary(hook_x, ground_y - 25, hook_x + 8, ground_y - 25, 7),
                 umber, tone=0.14)

    # -- RIGHT EDGE: a woodpile, stacked end-on, closing the frame the way
    #    the freight heap closes the left. Nothing was over there but road.
    with tag("cordwood spoil"):
        organic_mass(canvas, 292, ground_y - 4, 13, 6, mud, rng, tone=0.12, lumps=3)
    with tag("cordwood"):
        # ERRATA 36.2. This was a five-row pyramid of three-pixel ellipses --
        # log ENDS, stacked in a neat triangle -- and it read as cannonballs
        # because a tidy pyramid of equal spheres is the only thing that
        # shape says. Cordwood by a road is stacked LENGTHWAYS: long
        # horizontals of unequal length, the stack settled at one end, and
        # one log rolled off. The horizontals are also the point -- errata
        # 3b: nothing in the frame was at an angle, and a sagging woodpile is
        # the cheapest gravity available.
        for row in range(6):
            sag = row // 3                       # the stack has settled left
            length = 30 - row * 3 - (row % 2) * 4
            lx = 286 + (row % 2) * 2
            ly = ground_y - 6 - row * 4 + sag
            canvas.hline(lx, ly, length, pine.frac(max(0.05, 0.15 - row * 0.01)))
            canvas.hline(lx, ly + 1, length, pine.frac(max(0.04, 0.09 - row * 0.01)))
            canvas.hline(lx, ly + 2, length, pine.frac(0.05))
            ellipse_shaded(canvas, lx, ly + 1, 2, 2, pine, 0.18, lift=0.12)   # the cut end
        # One rolled off and lies across the others at an angle.
        canvas.line(280, ground_y - 3, 306, ground_y - 7, pine.frac(0.16))
        canvas.line(280, ground_y - 2, 306, ground_y - 6, pine.frac(0.09))
        ellipse_shaded(canvas, 280, ground_y - 3, 2, 2, pine, 0.20, lift=0.12)

    # -- near band, and ONLY at the frame edges. A verge does not stop at the
    #    picture edge, and a few dark masses running off the bottom corners
    #    say so without putting anything where Thad walks.
    for index, (cx, cy, r) in enumerate(((6, ground_y + 16, 9), (16, ground_y + 26, 8),
                                         (300, ground_y + 30, 10), (312, ground_y + 20, 8))):
        with tag(f"near spoil {index}"):
            organic_mass(canvas, cx, cy, r, max(2, r // 2), mud, rng, tone=0.14, lumps=3)
    for bx, by in ((46, ground_y + 9), (272, ground_y + 6)):
        canvas.vline(bx, by - 4, 4, sage.frac(0.24))
        canvas.put(bx, by - 5, sage.frac(0.34))

    # -- boot churn: single pixels, not objects. Grain on the road rather
    #    than litter on it.
    for _ in range(90):
        bx = rng.randrange(2, WIDTH - 2)
        by = rng.randrange(ground_y + 2, HEIGHT - 1)
        canvas.put(bx, by, mud.frac(0.22 if rng.random() < 0.5 else 0.16))

    # -- the nailed notice, on the nearest fence post. Blank: the engine
    #    draws words and this is the board they would go on.
    with tag("nailed notice"):
        canvas.rect(60, ground_y - 33, 12, 9, dust.frac(0.26))
        canvas.outline(60, ground_y - 33, 12, 9, dust.frac(0.10))
        canvas.put(61, ground_y - 32, grey.frac(0.40))
        canvas.put(71, ground_y - 32, grey.frac(0.40))

    # -- and every one of them gets a contact shadow, so nothing floats.
    ground_objects(canvas, palette, canvas.strokes[first:], ground_y - 20)


def scrub_bank(canvas: IndexedCanvas, palette: Palette, rng) -> None:
    """A rock and scrub bank, cropping the bottom-left corner. Ruling 21a.

    Near, and therefore out of the light: the whole thing is drawn in void and
    the floor of umber, luminance 0 and 9, which are two values this room did
    not previously contain anywhere. That is the point of the ruling -- the
    0-30 band arrives from a plane nobody is standing on, so no lit surface
    moves and the legibility audit does not need re-running.

    Its silhouette is a diagonal with a spiked top. A rounded hump would read
    as a hill in the middle distance rather than as something four feet from
    the camera, and a flat top would be the horizontal band 21a forbids.
    """
    dark = palette.family("void")
    umber = palette.family("umber")
    sage = palette.family("sage")

    # The brow: high at the frame edge, falling away to nothing by x72.
    reach = 100
    brow = []
    for x in range(reach):
        walk = x / reach
        top = int(94 + 50 * walk * walk) + (1 if (x * 7) % 5 == 0 else 0)
        brow.append(min(HEIGHT, top))
        canvas.vline(x, brow[x], HEIGHT - brow[x], dark.at(0))

    # A rim of umber's floor along the top edge, one pixel of it, so the mass
    # has an edge rather than being a hole cut in the picture.
    for x in range(reach):
        canvas.put(x, brow[x], umber.at(0))
        if (x * 3) % 7 == 0 and brow[x] + 1 < HEIGHT:
            canvas.put(x, brow[x] + 1, umber.at(1))

    # Scrub standing off the brow: spikes, not lumps. Each is a few vertical
    # strokes of different length, which at this size is what a sage bush is.
    for _ in range(20):
        x = rng.randrange(2, reach - 4)
        height = 4 + rng.randrange(0, 9)
        base = brow[x]
        for offset in range(-2, 3):
            column = x + offset
            if not 0 <= column < reach:
                continue
            spike = height - abs(offset) * 2 - rng.randrange(0, 3)
            if spike <= 0:
                continue
            canvas.vline(column, base - spike, spike, dark.at(0))
            canvas.put(column, base - spike, sage.at(0))


def _edge_wave(x: int) -> float:
    """A slow, non-repeating undulation in -1..1. Two incommensurate sines,
    so the ground's edge never lines up with itself across 320 pixels."""
    return (math.sin(x * 0.041) + 0.6 * math.sin(x * 0.017 + 1.7)) * 0.55


def scrub_clumps(canvas: IndexedCanvas, rng, sage, grey, top: int) -> None:
    """Sagebrush, gathered. Bigger and looser downhill, tighter toward the rim.

    Scale is the whole job here. A clump the same size at the horizon as at
    the road says the ground is a wall; halving it over 36 rows says the
    ground is going away.
    """
    for _ in range(38):
        y = rng.randrange(top + 2, ROAD_Y - 2)
        x = rng.randrange(2, WIDTH - 6)
        near = (y - top) / max(1, ROAD_Y - top)
        size = 1 + int(3 * near)
        for _ in range(2 + size * 3):
            dx = rng.randrange(-size, size + 1)
            dy = rng.randrange(-max(1, size // 2), 1)
            canvas.put(x + dx, y + dy, sage.frac(0.07 + 0.16 * rng.random()))
        # Moonlight is from high frame right, so the lit side is the right one.
        canvas.put(x + size, y - max(1, size // 2), grey.frac(0.40))


def stones(canvas: IndexedCanvas, rng, grey, top: int) -> None:
    """Half a dozen, lit on the upper right by the same moon as everything."""
    for _ in range(11):
        y = rng.randrange(top + 6, ROAD_Y - 3)
        x = rng.randrange(6, WIDTH - 8)
        near = (y - top) / max(1, ROAD_Y - top)
        width = 2 + int(3 * near)
        height = max(1, width // 2)
        canvas.rect(x, y, width, height, grey.frac(0.14))
        canvas.hline(x + 1, y - 1, width - 1, grey.frac(0.52))
        canvas.put(x + width, y, grey.frac(0.34))


def wheel_ruts(canvas: IndexedCanvas, mud, grey) -> None:
    """The road east, climbing away over the rise at frame right.

    Doc 17 puts THE ROAD EAST at x276-319 and gives it examine lines, so the
    road demonstrably continues past the frame -- but nothing in the picture
    said so, and the ground read as a backdrop because the only line on it
    was the one along the bottom. Two ruts converging as they recede are the
    cheapest available statement that this is a plane.
    """
    # Drawn in the VERGE's own family, not the road's. The first attempt used
    # mud, and two warm bars on a cold plain read as planks lying on it rather
    # than as tracks worn into it. A rut is not an object: it is a trough in
    # shadow with a moonlit ridge beside it, and both belong to the ground.
    span = ROAD_Y - 2 - (HORIZON + 5)
    for near_x, far_x in ((260, 299), (287, 306)):
        for step in range(span):
            t = step / max(1, span - 1)
            y = ROAD_Y - 2 - step
            x = int(near_x + (far_x - near_x) * t)
            wobble = (step % 9) // 7                    # not a ruled line
            width = 1 if t > 0.45 else 2
            # The far end breaks up rather than stopping. A track that ends in
            # a clean point says the frame ends there; one that thins out says
            # the country does not.
            if t > 0.74 and (step % 3) == 0:
                continue
            canvas.hline(x + wobble, y, width, grey.frac(0.09 + 0.05 * t))
            canvas.put(x + wobble + width, y, grey.frac(0.44 - 0.14 * t))
            # Churned earth only where the track joins the road it is part of.
            if t < 0.14:
                canvas.put(x + wobble, y, mud.frac(0.30))


def town_glow(canvas: IndexedCanvas, palette: Palette, rng, ochre, umber, grey) -> None:
    """Consolation downhill to the west. Doc 17: lamps on in about a third.

    Roofs only, small, and warm windows -- the town is two hundred yards off
    and below, so it is a scatter of lit squares rather than architecture.
    """
    base = HORIZON + 6
    x = 2
    while x < 84:
        width = 7 + rng.randrange(0, 6)
        height = 5 + rng.randrange(0, 4)
        canvas.rect(x, base - height, width, height, grey.frac(0.10))
        canvas.hline(x, base - height, width, grey.frac(0.18))
        if rng.random() < 0.36:
            canvas.rect(x + 2, base - height + 2, 2, 2, ochre.frac(0.72))
        x += width + 1 + rng.randrange(0, 3)


def town_sign(canvas: IndexedCanvas, palette: Palette, x: int, y: int, post, board) -> None:
    """CONSOLATION · POP. 2,000 AND CLIMBING. Blank, like every sign here.

    Doc 05 gives the sign four repaintings with the older numbers showing
    through. That is drawn as bands of slightly different tone on the board
    rather than as text -- the words are the examine layer's job, and a
    painted approximation of them would contradict what it says.
    """
    canvas.vline(x + 12, y + 10, 34, post.frac(0.26))
    canvas.vline(x + 13, y + 10, 34, post.frac(0.14))
    # Kept dim. Bone at 0.34 made the sign the brightest thing in frame,
    # which directly contradicts doc 17 -- Hob's lamp is the brightest
    # object on screen and the only warm one, and that is what makes a
    # player who examines nothing still watch him cross.
    canvas.rect(x, y, 28, 14, board.frac(0.16))
    canvas.outline(x, y, 28, 14, post.frac(0.18))
    canvas.hline(x + 1, y + 1, 26, board.frac(0.24))
    # Four repaintings, oldest first, each patch WIDER than the last.
    #
    # This was inverted: the narrowest, lightest patch was drawn last and so
    # sat on top, which says the most recent number is the smallest one. Doc
    # 05 says the opposite -- "you can see the smaller ones underneath, each
    # of them once true" -- so the current number is the widest and freshest
    # and the older, smaller ones show at the edges where the patches do not
    # line up. The offsets are what make them visible at all: a repaint that
    # covered its predecessor exactly would leave nothing to see.
    for index, (px, pw) in enumerate(((11, 5), (9, 8), (6, 12), (4, 17))):
        canvas.rect(x + px, y + 8, pw, 4, board.frac(0.10 + 0.05 * index))


def case(canvas: IndexedCanvas, palette: Palette, x: int, y: int, leather, brass) -> None:
    """Everything Thad owns, and a tuning fork."""
    canvas.rect(x, y, 16, 10, leather.frac(0.30))
    canvas.hline(x, y, 16, leather.frac(0.46))
    canvas.hline(x, y + 9, 16, leather.frac(0.12))
    canvas.hline(x, y + 4, 16, leather.frac(0.18))          # the seam
    canvas.rect(x + 6, y - 2, 4, 2, leather.frac(0.38))     # handle
    canvas.put(x + 7, y + 4, brass.frac(0.56))              # clasp
    canvas.put(x + 8, y + 4, brass.frac(0.30))


def team(canvas: IndexedCanvas, x: int, ground: int, hide, iron,
         graze: tuple[int, int] = (0, 0)) -> None:
    """Two horses, hitched, heads down. Errata ruling 19a gives them lines.

    MEASURED, NOT DRAWN BY EYE, and the first version was badly wrong. The
    pair stood eighteen pixels tall where Thad is about twenty-seven at that
    depth -- withers fifteen pixels above the road against a coach body
    forty-three tall. They read as ponies, which does not make the horses
    look small, it makes the coach look enormous.

    The real proportion: a draft horse's withers are about 163cm against a
    man's 175, so the withers land at roughly nine tenths of his height and
    his eye is level with the top of the animal's back. Body length runs
    about one and a half times the withers height. At Thad's twenty-seven
    that is withers 25 and a barrel 36 long, which is what this draws.

    Heads stay DOWN. The doc has them halted and waiting, and a raised head
    would put the pair above the coach roof and make them the tallest thing
    in the frame -- which is a different picture from the one written.

    Two, and only two, are visible. The pair stand side by side, so the far
    one shows as a second head, a second rump and one extra pair of legs,
    which is what "I am told there are four more" is counting from.
    """
    WITHERS = 25          # top of the shoulder, above the road
    BARREL = 36           # nose-to-tail of the body itself
    DEPTH = 12            # how deep the barrel is, withers to belly

    # The offside horse is nearly black and the nearside nearly twice that.
    # At two steps apart the pair merged into one animal with eight legs; the
    # separation has to be tonal, because at this offset the shapes overlap
    # almost exactly and outline alone cannot do it.
    # ERRATA 35d: the heads come UP. `graze` is 0 for a head at the ground
    # and 1 for a head raised and chewing, PER HORSE -- the two are out of
    # phase because two animals lifting together is a pantomime horse. The
    # neck is redrawn rather than translated: a raised head shortens the
    # neck's reach as well as lifting it, and sliding the same pixels up
    # gives a giraffe.
    for index, (offset, up, tone) in enumerate(((-11, -4, 0.06), (0, 0, 0.28))):
        left = x + offset
        raise_by = graze[index] * 9
        back = ground - WITHERS + up
        belly = back + DEPTH

        # THE BARREL, by two profiles rather than one dip table. The first
        # attempt used a single table for the top edge and left the belly
        # straight, which draws a slab: what makes a horse read in side view
        # is that the TOP falls from the withers and rises again to the rump
        # WHILE the bottom tucks up behind the ribcage. Two curves going
        # opposite ways, and the shape between them is the animal.
        #
        # (position along the body, drop from the back line) and
        # (position, lift from the belly line). Linear between the stops.
        TOP = ((0.00, 4), (0.14, 0), (0.50, 3), (0.80, 1), (1.00, 4))
        BOTTOM = ((0.00, 3), (0.18, 0), (0.45, 1), (0.75, 5), (1.00, 3))

        def sample(table, along):
            for (a0, v0), (a1, v1) in zip(table, table[1:]):
                if along <= a1:
                    t = (along - a0) / max(1e-6, a1 - a0)
                    return v0 + (v1 - v0) * t
            return table[-1][1]

        for column in range(BARREL):
            along = column / (BARREL - 1)
            top = back + round(sample(TOP, along))
            bottom = belly - round(sample(BOTTOM, along))
            canvas.vline(left + 10 + column, top, bottom - top, hide.frac(tone))
            canvas.put(left + 10 + column, top, hide.frac(min(0.95, tone + 0.20)))
            canvas.put(left + 10 + column, bottom - 1, hide.frac(max(0.03, tone - 0.10)))

        # Neck and head. The neck leaves the withers going forward and down
        # and NARROWS as it goes -- a constant-width neck is a plank.
        for step in range(15):
            along = step / 14
            nx = left + 11 - round(along * (11 - raise_by * 0.4))
            ny = back + 1 + round(along * (13 - raise_by))
            thick = max(3, round(8 - along * 4))
            canvas.vline(nx, ny, thick, hide.frac(tone + 0.03))
            canvas.put(nx, ny, hide.frac(min(0.95, tone + 0.16)))       # crest
        # The head hangs off the end of the neck, longer than it is deep,
        # angled down. A square is a box; a horse's head is a wedge.
        head_y = ground - 11 - raise_by
        for step in range(7):
            canvas.vline(left - 4 + step + raise_by // 3, head_y + step // 2,
                         5 - step // 3, hide.frac(tone + 0.05))
        canvas.put(left - 4 + raise_by // 3, head_y + 4, hide.frac(tone + 0.20))   # muzzle
        canvas.put(left + 4, ground - 13 - raise_by, hide.frac(tone + 0.15))       # ear

        # Legs. Fore under the shoulder, hind under the rump, each pair one
        # forward of the other so the four are not a fence. Narrow below the
        # knee, which is most of what says "leg" at this size.
        for at, lean in ((0.14, 0), (0.24, 1), (0.76, 0), (0.90, -1)):
            leg_x = left + 10 + round(at * (BARREL - 1))
            knee = belly - round(sample(BOTTOM, at)) + 5
            canvas.rect(leg_x, belly - round(sample(BOTTOM, at)) - 1, 3, 6,
                        hide.frac(tone - 0.06))
            canvas.rect(leg_x + lean, knee, 2, ground - knee, hide.frac(tone - 0.11))
            canvas.hline(leg_x + lean - 1, ground - 1, 3, hide.frac(max(0.03, tone - 0.16)))
        canvas.line(left + 45, back + 3, left + 47, belly + 2, hide.frac(tone - 0.03))  # tail

        # Moonlit edge down the chest and along the near flank -- what parts
        # the nearside horse from the one standing behind it.
        canvas.line(left + 9, back + 5, left + 12, back + 11, hide.frac(tone + 0.22))
        canvas.hline(left + 13, belly - 4, 20, hide.frac(tone + 0.10))

    # Harness: collar at the shoulder, and the trace running back to the pole.
    canvas.vline(x + 10, ground - WITHERS + 2, 8, iron.frac(0.36))
    canvas.hline(x + 40, ground - 14, 14, iron.frac(0.26))


def cart_wheel(canvas: IndexedCanvas, cx: int, cy: int, radius: int, iron, spokes: int = 8) -> None:
    """A wheel that is round, because the last ones were square outlines.

    Rim, hub and spokes, with the upper-right arc a step lighter -- the same
    moon lights everything else in this room from high frame right and a
    wheel is the object in it most obviously made of a curve.
    """
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            distance = math.hypot(dx, dy)
            if abs(distance - radius) > 0.7:
                continue
            lit = dx + dy < -radius // 2
            canvas.put(cx + dx, cy + dy, iron.frac(0.44 if lit else 0.22))
    for index in range(spokes):
        angle = math.tau * index / spokes
        canvas.line(cx, cy,
                    cx + round(math.cos(angle) * (radius - 1)),
                    cy + round(math.sin(angle) * (radius - 1)),
                    iron.frac(0.16))
    canvas.rect(cx - 1, cy - 1, 3, 3, iron.frac(0.34))


def coach(canvas: IndexedCanvas, palette: Palette, rng, x: int, y: int, body, iron, brass,
          graze: tuple[int, int] = (0, 0)) -> None:
    """The stage, halted, facing west. Departs on the driver's exit line.

    SILHOUETTE FIRST, because at 1x that is all there is: two round wheels of
    visibly different size, a body slung between them, a roof line
    overhanging both ends, and a pole running out to the ground. Those four
    shapes are what makes a coach a coach at fifty pixels wide.

    DETAIL SECOND, and it was missing entirely. The body was three flat
    horizontal bands and two windows -- a brown box with two wheels, which
    against Monkey Island's ship's hold is the whole complaint in one object.
    A vehicle that a man has just climbed down from and unloaded luggage off
    carries: a door with a handle and a drip moulding, a folding step under
    it, a lamp on a bracket, a boot with the load strapped down, a driver's
    box with a rail and a footboard, leather braces the body hangs on, and
    wear where boots and hands have been going for four days. Every one of
    those is a shape somebody could name, which is the test.
    """
    ground = y + 3                       # where both wheels meet the road
    # Rear wheel larger than front -- the proportion that says "stagecoach"
    # rather than "cart" before any detail is legible. Now with a felloe, a
    # tyre and a hub, from the primitives library.
    spoked_wheel(canvas, x + 40, ground - 10, 10, iron, spokes=12, tone=0.24)
    spoked_wheel(canvas, x + 9, ground - 7, 7, iron, spokes=10, tone=0.22)

    # The pole, out to the front and down. It is what a coach is missing when
    # it reads as a shed: a shed is not attached to anything.
    canvas.line(x + 4, ground - 13, x - 26, ground - 4, iron.frac(0.26))
    canvas.line(x + 4, ground - 12, x - 26, ground - 3, iron.frac(0.16))
    canvas.vline(x - 26, ground - 7, 5, iron.frac(0.22))          # swingletree
    team(canvas, x - 74, ground, body, iron, graze=graze)

    # Leather braces. The body of a stage hangs on them rather than sitting on
    # the axle, and the two diagonals under the doors are the most
    # recognisable thing about the vehicle after the wheels.
    for brace_x in (x + 6, x + 44):
        canvas.line(brace_x, ground - 12, brace_x + 2, ground - 26, iron.frac(0.30))
        canvas.line(brace_x + 1, ground - 12, brace_x + 3, ground - 26, iron.frac(0.14))

    # Body: swelled, so its underside is a curve and not a plank.
    for row in range(19):
        inset = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 6)[row]
        canvas.hline(x + 2 + inset, ground - 31 + row, 47 - inset * 2,
                     body.frac(0.30 - 0.10 * (row / 18)))
    canvas.hline(x + 2, ground - 31, 47, body.frac(0.42))
    canvas.hline(x + 4, ground - 20, 43, body.frac(0.20))         # the belt rail

    # THE DOOR, centred, with its frame proud of the panel, a handle, and the
    # drip moulding over it that every coach of this period had.
    door_x, door_y = x + 20, ground - 30
    canvas.outline(door_x, door_y, 14, 17, body.frac(0.44))
    canvas.vline(door_x + 1, door_y + 1, 15, body.frac(0.18))
    canvas.hline(door_x - 1, door_y - 1, 16, body.frac(0.50))     # drip moulding
    canvas.put(door_x + 11, door_y + 10, brass.frac(0.34))        # handle
    canvas.put(door_x + 11, door_y + 11, brass.frac(0.18))

    # Windows: DARKER than the body. An unlit interior at night is a hole.
    for window_x in (x + 8, x + 36):
        canvas.rect(window_x, ground - 29, 10, 8, body.frac(0.06))
        canvas.hline(window_x, ground - 30, 10, body.frac(0.44))   # the drip cap
        canvas.vline(window_x - 1, ground - 29, 8, body.frac(0.40))
    canvas.rect(door_x + 3, ground - 29, 8, 7, body.frac(0.08))    # door glass
    canvas.hline(door_x + 3, ground - 30, 8, body.frac(0.46))

    # The folding step, under the door. Down, because somebody just used it.
    canvas.hline(door_x + 3, ground - 12, 7, iron.frac(0.30))
    canvas.line(door_x + 3, ground - 13, door_x + 4, ground - 16, iron.frac(0.22))
    canvas.line(door_x + 9, ground - 13, door_x + 8, ground - 16, iron.frac(0.22))

    # Roof line, overhanging both ends -- the horizontal that reads first.
    canvas.rect(x - 1, ground - 34, 53, 2, body.frac(0.26))
    canvas.hline(x - 1, ground - 34, 53, body.frac(0.52))

    # The boot: the load, strapped down, with the straps drawn. Thad's case
    # came off this two minutes ago and the rest of it has not.
    canvas.rect(x + 30, ground - 39, 18, 5, body.frac(0.24))
    canvas.hline(x + 30, ground - 39, 18, body.frac(0.40))
    for strap_x in (x + 34, x + 43):
        canvas.vline(strap_x, ground - 39, 6, iron.frac(0.34))
        canvas.put(strap_x, ground - 36, brass.frac(0.30))         # buckle
    canvas.rect(x + 33, ground - 42, 7, 3, body.frac(0.34))        # a trunk on top
    canvas.hline(x + 33, ground - 42, 7, body.frac(0.48))

    # Driver's box, with the rail he holds and the footboard he braces on.
    canvas.rect(x + 2, ground - 39, 15, 5, body.frac(0.28))
    canvas.hline(x + 2, ground - 39, 15, body.frac(0.46))
    canvas.hline(x + 1, ground - 41, 16, iron.frac(0.32))          # the rail
    canvas.vline(x + 1, ground - 41, 3, iron.frac(0.26))
    canvas.vline(x + 16, ground - 41, 3, iron.frac(0.26))
    canvas.hline(x - 1, ground - 33, 6, body.frac(0.36))           # footboard

    # WEAR. Four days from Sacramento, and it goes on the two places a coach
    # actually wears: the panel below the door where boots scuff it, and the
    # roof edge where the load has been dragged on and off.
    for _ in range(14):
        wx = x + 3 + rng.randrange(0, 46)
        wy = ground - 19 + rng.randrange(0, 5)
        canvas.put(wx, wy, body.frac(0.34 if rng.random() < 0.5 else 0.14))
    for _ in range(8):
        canvas.put(x + 30 + rng.randrange(0, 18), ground - 35, body.frac(0.16))

    # The lamp on its bracket. Dimmer than Hob's on purpose: at full
    # brightness it tied it at 203 and the frame had two equally bright warm
    # points, which is one more than doc 17 allows.
    canvas.line(x - 3, ground - 33, x - 15, ground - 31, iron.frac(0.30))   # bracket
    canvas.rect(x - 17, ground - 33, 3, 4, iron.frac(0.24))
    canvas.put(x - 16, y - 4, brass.frac(0.42))             # the coach lantern
    canvas.put(x - 16, y - 5, brass.frac(0.58))


def watchman(canvas: IndexedCanvas, palette: Palette, x: int, y: int, cloth,
             swing: int = 0) -> None:
    """Hob, crossing, LIT BY HIS OWN LAMP. Errata 35c.

    He was five rectangles at cloth 0.05 to 0.10 -- a black slab, and 35c is
    right that a black slab is not a man you walked past, it is a shape. The
    whole Act III reveal rests on a player having seen him and not looked
    twice, and you cannot fail to look twice at something with no face.

    THE LAMP IS ON HIS LEFT, so his left side is lit and his right is not.
    That is the entire drawing: the same silhouette, with two columns of warm
    value down the near edge and a face that has a brow, an eye socket and a
    jaw. He should be UNREMARKABLE, which is a different thing from invisible.

    `swing` moves the lamp arm and the lit edge together. The light on him
    moves because the lamp does -- lighting him from a fixed side while the
    lamp swings would be worse than not swinging it.
    """
    skin = palette.family("dust")
    warm = palette.family("ochre")
    dark = palette.family("void")
    lit = max(0.0, 0.06 + swing * 0.02)          # the near edge, lamp-side

    # Coat: near-black on the far side, warm on the lamp side. Two columns,
    # because at seven pixels across two columns is a quarter of him.
    canvas.rect(x + 3, y - 2, 7, 14, cloth.frac(0.05))
    canvas.vline(x + 3, y - 2, 14, warm.frac(0.16 + lit))
    canvas.vline(x + 4, y - 1, 13, warm.frac(0.10 + lit * 0.5))
    canvas.hline(x + 3, y - 2, 7, cloth.frac(0.11))          # shoulder line
    canvas.hline(x + 4, y + 11, 6, dark.at(0))               # coat hem

    # Legs, with light between them.
    canvas.rect(x + 3, y + 12, 2, 4, cloth.frac(0.05))
    canvas.rect(x + 8, y + 12, 2, 4, cloth.frac(0.04))
    canvas.hline(x + 3, y + 15, 7, dark.at(0))

    # THE FACE. Five by five, and four of those pixels do the work: a lit
    # cheek and jaw on the lamp side, a dark eye socket, a brow above it.
    canvas.rect(x + 4, y - 7, 5, 5, cloth.frac(0.06))        # hat shadow / hair
    canvas.rect(x + 4, y - 5, 4, 3, skin.frac(0.16))         # the face, in shade
    canvas.vline(x + 4, y - 5, 3, skin.frac(0.34 + lit))     # lamp-side cheek
    canvas.put(x + 5, y - 5, skin.frac(0.30 + lit))
    canvas.put(x + 5, y - 4, dark.at(0))                     # the eye
    canvas.put(x + 6, y - 4, skin.frac(0.12))
    canvas.hline(x + 4, y - 6, 4, cloth.frac(0.09))          # the brow
    canvas.put(x + 4, y - 3, skin.frac(0.26 + lit))          # jaw, catching it
    # A hat with a brim, so the head is not a cube.
    canvas.hline(x + 3, y - 8, 7, cloth.frac(0.08))
    canvas.hline(x + 4, y - 9, 5, cloth.frac(0.05))

    # The arm to the lamp, and it moves with the swing.
    canvas.vline(x + 2 + swing, y + 1, 5, warm.frac(0.14 + lit))
    canvas.put(x + 2 + swing, y + 6, skin.frac(0.24 + lit))  # the hand on the bail


def lantern(canvas: IndexedCanvas, x: int, y: int) -> None:
    """Hob's lamp, in its four reserved entries and nothing else.

    Larger than it needs to be for its own sake, because doc 17 makes it the
    thing a player watches when they are not doing anything -- and doc 18
    makes it the thing that moves.

    Every pixel here is one of LAMP_BAND, so the pulse has the whole object
    and no part of any other object. Drawn after the lighting pass: a source
    is not a lit surface, and a band assigned before the pass does not survive
    it.
    """
    # ERRATA 33a: a source is a core plus a shaped falloff, not a bright
    # blob. Three steps out from the middle rather than two flat rectangles,
    # so the pane has a centre.
    canvas.rect(x - 3, y, 5, 6, LAMP_BAND[0])
    canvas.rect(x - 3, y + 1, 5, 4, LAMP_BAND[1])
    canvas.rect(x - 2, y + 2, 3, 2, LAMP_BAND[2])
    canvas.hline(x - 4, y - 1, 7, LAMP_BAND[0])             # its hood
    canvas.hline(x - 4, y + 6, 7, LAMP_BAND[0])             # its base
    canvas.vline(x - 1, y - 4, 3, LAMP_BAND[0])             # the bail


def main() -> None:
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas, palette = compose(with_coach=True)
    canvas.save(RENDERS / "room-01-stage-road.png", palette)
    canvas.save(RENDERS / "room-01-stage-road@4x.png", palette, scale=4)
    FOREGROUND.save_rgba(FOREGROUNDS / "room-01-stage-road.png", palette)

    # ERRATA 31d. The coach is an OBJECT STATE, not background art.
    #
    # It was painted into the background, so when T_COACH_DEPARTED flipped the
    # hotspot correctly became THE ROAD WEST OUT and answered "Gone. It made
    # very good time on the way out." while a coach sat in the frame -- ruling
    # 19b in reverse, and the sort of thing that passes every check because
    # nothing checks the picture against the line.
    #
    # THE SHIPPING BACKGROUND IS NOW THE DEPARTED COMPOSITION, and the coach
    # layer is the DIFFERENCE between the two composes. Differencing rather
    # than drawing the coach onto a transparent canvas, because the coach is
    # lit by the same pass as everything else and carries its own lantern:
    # the pixels that change are the coach, the team, and the light they
    # throw on the road, which is exactly the set that should leave with it.
    # Drawn separately it would have to be lit separately, and the seam
    # between two lighting passes is the kind of thing nobody sees until the
    # coach goes.
    departed, _ = compose(with_coach=False)
    departed.save(BACKGROUNDS / "room-01-stage-road.png", palette)
    departed.save(RENDERS / "room-01-stage-road-coach-gone@4x.png", palette, scale=4)

    layer = IndexedCanvas(WIDTH, HEIGHT, fill=255)
    changed = 0
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if canvas.get(x, y) != departed.get(x, y):
                layer.put(x, y, canvas.get(x, y))
                changed += 1
    OBJECTS.mkdir(parents=True, exist_ok=True)
    layer.save_rgba(OBJECTS / "room-01-coach.png", palette)
    print(f"  coach layer: {changed} px -> art/objects/room-01-coach.png")

    print("wrote renders/room-01-stage-road@4x.png (+ coach-gone)")
    print(f"  colours used: {len(canvas.used_indices())}")
    print(f"  ambient {AMBIENT} -- the only night exterior; lamp and window light only")


if __name__ == "__main__":
    main()
