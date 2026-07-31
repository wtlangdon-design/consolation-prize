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
from pathlib import Path

import cycling
from canvas import IndexedCanvas
from components import distant_hills
from dither import BAYER2, BAYER4, dither_pixel
from lighting import Lamp, LightField, lamp_core
from palette import Palette
from renders import RENDERS

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


def compose(with_coach: bool = True, lamp_x: int | None = None) -> tuple[IndexedCanvas, Palette]:
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
            dither_pixel(canvas, x, y, indigo, max(0.04, 0.10 + 0.34 * (1 - height)), BAYER4)
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

    # -- the town sign -----------------------------------------------------
    town_sign(canvas, palette, 36, ROAD_Y - 34, umber, bone)

    # -- his case, at his feet, downstage ----------------------------------
    case(canvas, palette, 150, 126, umber, gold)

    # -- the coach, halted, driver unloading -------------------------------
    if with_coach:
        coach(canvas, palette, rng, COACH_X, ROAD_Y + 2, umber, grey, gold)

    # -- Hob, and his lamp -------------------------------------------------
    # Hob is lit; his lamp is not, so only Hob goes in before the pass.
    lx = LAMP[0] if lamp_x is None else lamp_x
    ly = LAMP[1]
    watchman(canvas, palette, lx, ly, grey)

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
    field.add_lamp(Lamp(x=250, y=40, radius=340, intensity=0.30, squash=0.8))
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

    # Doc 18 note 1, enforced before anything is written: a reserved index may
    # appear only inside its own element. reserve() moves the trespassers --
    # here the coach lantern and the clasp on Thad's case, both accent_gold --
    # and verify() proves none are left.
    elements = cycling.load("stage_road", palette)
    cycling.reserve(canvas, palette, elements)
    cycling.verify(canvas, elements)

    return canvas, palette


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


def team(canvas: IndexedCanvas, x: int, ground: int, hide, iron) -> None:
    """Two horses, hitched, heads down. Errata ruling 19a gives them lines.

    Drawn because the lines exist, not the other way round. Ruling 19b says a
    LOOK line may not describe what is not rendered, and THE TEAM's first
    variant opens "Two horses I can see" -- so a hotspot with no horses under
    it would violate the ruling it was added to serve. 19b's own first
    resolution permits it: anonymous background figures are not the
    interactable characters doc 11's no-figures rule is about.

    Two, and only two, are visible. The pair stand side by side, so the far
    one is mostly behind the near one and shows as a second head, a second
    rump and one extra pair of legs -- which is what "I am told there are
    four more" is counting from.
    """
    # Row by row, because at eighteen rows a horse is a silhouette and nothing
    # else. Drawn from rectangles first, it came out as two boxes on sticks --
    # the shape has to carry withers, a dip of back, a rump and a dropped head
    # or the eye files it as furniture.
    #
    # (row, left offset, width). The barrel is as long as the legs are tall,
    # which is the proportion that stops it. At twenty-two long over seven of
    # leg it came out a bench, and no amount of detail on a bench helps.
    BODY = (
        (0, 11, 13), (1, 10, 16), (2, 9, 18), (3, 9, 18),
        (4, 9, 18), (5, 10, 16), (6, 11, 14), (7, 12, 11),
    )
    NECK = ((0, 10, 4), (1, 8, 5), (2, 7, 5), (3, 5, 5), (4, 4, 5), (5, 3, 4))
    HEAD = ((6, 1, 5), (7, 0, 4), (8, 0, 3))

    # The offside horse is nearly black and the nearside nearly twice that.
    # At two steps apart the pair merged into one animal with eight legs;
    # the separation has to be tonal, because at this offset the shapes
    # overlap almost exactly and outline alone cannot do it.
    for offset, up, tone in ((-9, -3, 0.06), (0, 0, 0.28)):
        left, top = x + offset, ground - 17 + up
        for row, span, width in BODY:
            canvas.hline(left + span, top + 2 + row, width, hide.frac(tone))
        canvas.hline(left + 11, top + 2, 13, hide.frac(tone + 0.20))      # lit back
        canvas.hline(left + 21, top + 3, 6, hide.frac(tone + 0.13))       # rump
        canvas.vline(left + 12, top + 4, 4, hide.frac(tone - 0.07))       # shoulder
        for row, span, width in NECK + HEAD:
            canvas.hline(left + span, top + 1 + row, width, hide.frac(tone + 0.04))
        canvas.put(left + 7, top + 2, hide.frac(tone + 0.15))             # ear
        canvas.put(left, top + 10, hide.frac(tone + 0.18))                # muzzle
        # Fore under the shoulder, hind under the rump, one of each forward so
        # the four of them are not a fence.
        for leg_x, lean in ((11, 0), (14, 1), (22, 0), (25, -1)):
            canvas.vline(left + leg_x, top + 9, 4, hide.frac(tone - 0.06))
            canvas.vline(left + leg_x + lean, top + 13, ground - top - 13, hide.frac(tone - 0.11))
        canvas.line(left + 27, top + 2, left + 28, top + 10, hide.frac(tone - 0.03))   # tail
        # Moonlit edge down the chest and along the near flank, which is
        # what parts the nearside horse from the one standing behind it.
        canvas.line(left + 9, top + 3, left + 12, top + 8, hide.frac(tone + 0.22))
        canvas.hline(left + 12, top + 9, 11, hide.frac(tone + 0.10))
    # Harness: collar at the shoulder, and the trace running back to the pole.
    canvas.vline(x + 10, ground - 16, 5, iron.frac(0.36))
    canvas.hline(x + 28, ground - 13, 10, iron.frac(0.26))


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


def coach(canvas: IndexedCanvas, palette: Palette, rng, x: int, y: int, body, iron, brass) -> None:
    """The stage, halted, facing west. Departs on the driver's exit line.

    It read as a dark shed with two pale rectangles in it. The rectangles
    were the windows -- drawn in a different family from the body and landing
    LIGHTER than the wall they were cut into, so the one thing on the coach
    that caught the eye was the one thing that should have been a hole. The
    wheels were square outlines with a line through them.

    Rebuilt silhouette first, because at 1x that is all there is: two round
    wheels of visibly different size, a body slung between them, a roof line
    overhanging both ends, and a pole running out to the ground. Those four
    shapes are what makes a coach a coach at fifty pixels wide. Everything
    after them can only confirm a reading the silhouette has already made,
    and if the silhouette has not made it, no amount of it will.
    """
    ground = y + 3                       # where both wheels meet the road
    # Rear wheel larger than front, which is the proportion that says
    # "stagecoach" rather than "cart" before any detail is legible.
    cart_wheel(canvas, x + 40, ground - 10, 10, iron)
    cart_wheel(canvas, x + 9, ground - 7, 7, iron, spokes=6)

    # The pole, out to the front and down. It is what a coach is missing when
    # it reads as a shed: a shed is not attached to anything.
    canvas.line(x + 4, ground - 13, x - 21, ground - 3, iron.frac(0.26))
    canvas.line(x + 4, ground - 12, x - 21, ground - 2, iron.frac(0.16))
    canvas.vline(x - 21, ground - 5, 4, iron.frac(0.22))          # swingletree
    team(canvas, x - 52, ground, body, iron)

    # Body: swelled, so its underside is a curve and not a plank.
    for row in range(19):
        inset = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 6)[row]
        canvas.hline(x + 2 + inset, ground - 31 + row, 47 - inset * 2,
                     body.frac(0.30 - 0.10 * (row / 18)))
    canvas.hline(x + 2, ground - 31, 47, body.frac(0.42))
    canvas.hline(x + 4, ground - 20, 43, body.frac(0.20))         # the belt rail

    # Windows: DARKER than the body. An unlit interior at night is a hole.
    for window_x in (x + 12, x + 28):
        canvas.rect(window_x, ground - 29, 11, 8, body.frac(0.06))
        canvas.hline(window_x, ground - 30, 11, body.frac(0.44))   # the drip cap

    # Roof line, overhanging both ends -- the horizontal that reads first.
    canvas.rect(x - 1, ground - 34, 53, 2, body.frac(0.26))
    canvas.hline(x - 1, ground - 34, 53, body.frac(0.52))
    canvas.rect(x + 30, ground - 39, 18, 5, body.frac(0.24))       # the load
    canvas.hline(x + 30, ground - 39, 18, body.frac(0.40))
    canvas.rect(x + 2, ground - 39, 15, 5, body.frac(0.28))        # driver's box
    canvas.hline(x + 2, ground - 39, 15, body.frac(0.46))

    # Dimmer than Hob's lamp on purpose. At full brightness it tied it at
    # 203 and the frame had two equally bright warm points, which is one
    # more than doc 17 allows.
    canvas.put(x - 16, y - 4, brass.frac(0.42))             # the coach lantern
    canvas.put(x - 16, y - 5, brass.frac(0.58))


def watchman(canvas: IndexedCanvas, palette: Palette, x: int, y: int, cloth) -> None:
    """Hob, crossing. A dark figure, drawn before the pass because he is lit."""
    canvas.rect(x + 3, y - 2, 7, 14, cloth.frac(0.06))      # body, near-black
    canvas.rect(x + 4, y - 7, 5, 5, cloth.frac(0.08))       # head
    canvas.rect(x + 3, y + 12, 3, 4, cloth.frac(0.05))      # legs
    canvas.rect(x + 7, y + 12, 3, 4, cloth.frac(0.05))
    canvas.vline(x + 2, y + 1, 5, cloth.frac(0.10))         # arm to the lamp


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
    canvas.rect(x - 3, y, 5, 6, LAMP_BAND[1])
    canvas.rect(x - 2, y + 1, 3, 4, LAMP_BAND[2])
    canvas.hline(x - 4, y - 1, 7, LAMP_BAND[0])             # its hood
    canvas.hline(x - 4, y + 6, 7, LAMP_BAND[0])             # its base
    canvas.vline(x - 1, y - 4, 3, LAMP_BAND[0])             # the bail


def main() -> None:
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas, palette = compose(with_coach=True)
    canvas.save(RENDERS / "room-01-stage-road.png", palette)
    canvas.save(RENDERS / "room-01-stage-road@4x.png", palette, scale=4)
    canvas.save(ROOT / "art" / "backgrounds" / "room-01-stage-road.png", palette)

    departed, _ = compose(with_coach=False, lamp_x=250)
    departed.save(RENDERS / "room-01-stage-road-coach-gone@4x.png", palette, scale=4)

    print("wrote renders/room-01-stage-road@4x.png (+ coach-gone)")
    print(f"  colours used: {len(canvas.used_indices())}")
    print(f"  ambient {AMBIENT} -- the only night exterior; lamp and window light only")


if __name__ == "__main__":
    main()
