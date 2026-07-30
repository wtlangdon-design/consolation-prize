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

import random
from pathlib import Path

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
    # A flat grey fill here read as a concrete wall standing behind the road
    # rather than as ground going away from the viewer, so it is graded and
    # then scrubbed over. Still grey, still cold: night ground is not warm and
    # ruling 17a means no amount of lamplight would make it so.
    for y in range(HORIZON + 2, HEIGHT):
        walk = (y - HORIZON - 2) / max(1, HEIGHT - HORIZON - 2)
        for x in range(WIDTH):
            dither_pixel(canvas, x, y, grey, max(0.03, 0.30 + 0.22 * walk), BAYER2)
    for _ in range(220):
        x, y = rng.randrange(WIDTH), rng.randrange(HORIZON + 3, ROAD_Y)
        canvas.put(x, y, sage.frac(0.10 + 0.14 * rng.random()))
        if rng.random() < 0.4:
            canvas.put(x + 1, y, sage.frac(0.08))
        if rng.random() < 0.3:
            canvas.put(x, y - 1, grey.frac(0.46))

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
    for _ in range(34):
        y = rng.randrange(ROAD_Y + 2, HEIGHT)
        x = rng.randrange(0, WIDTH - 8)
        length = 2 + rng.randrange(0, 6)
        canvas.hline(x, y, length, sky.frac(0.20 + 0.14 * rng.random()))

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

    # -- Hob's lamp --------------------------------------------------------
    lx = LAMP[0] if lamp_x is None else lamp_x
    ly = LAMP[1]
    watchman(canvas, palette, lx, ly, grey, gold)

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
    lamp_core(canvas, palette, lx - 1, ly + 2, "accent_gold", radius=1)
    canvas.rect(lx - 2, ly + 1, 3, 4, gold.at(gold.count - 1))

    return canvas, palette


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


def coach(canvas: IndexedCanvas, palette: Palette, rng, x: int, y: int, body, iron, brass) -> None:
    """The stage, halted. Departs on the driver's exit line, not a timer."""
    canvas.rect(x, y - 26, 52, 22, body.frac(0.34))
    canvas.hline(x, y - 26, 52, body.frac(0.50))
    canvas.rect(x + 4, y - 22, 12, 9, iron.frac(0.10))      # window, unlit
    canvas.rect(x + 22, y - 22, 12, 9, iron.frac(0.10))
    canvas.rect(x - 6, y - 30, 20, 5, body.frac(0.38))      # roof rack and load
    canvas.hline(x - 6, y - 30, 20, body.frac(0.54))
    for wheel_x, radius in ((x + 8, 7), (x + 40, 9)):
        canvas.outline(wheel_x - radius, y - radius - 4, radius * 2, radius * 2, iron.frac(0.36))
        canvas.hline(wheel_x - radius, y - 4 - radius, radius * 2, iron.frac(0.44))
        canvas.vline(wheel_x, y - radius * 2 - 4, radius * 2, iron.frac(0.30))
    canvas.rect(x - 18, y - 20, 14, 3, body.frac(0.30))     # shaft
    # Dimmer than Hob's lamp on purpose. At full brightness it tied it at
    # 203 and the frame had two equally bright warm points, which is one
    # more than doc 17 allows.
    canvas.put(x - 16, y - 4, brass.frac(0.42))             # the coach lantern
    canvas.put(x - 16, y - 5, brass.frac(0.58))


def watchman(canvas: IndexedCanvas, palette: Palette, x: int, y: int, cloth, brass) -> None:
    """Hob, crossing. A dark figure and a lamp, and the lamp is the subject."""
    canvas.rect(x + 3, y - 2, 7, 14, cloth.frac(0.06))      # body, near-black
    canvas.rect(x + 4, y - 7, 5, 5, cloth.frac(0.08))       # head
    canvas.rect(x + 3, y + 12, 3, 4, cloth.frac(0.05))      # legs
    canvas.rect(x + 7, y + 12, 3, 4, cloth.frac(0.05))
    canvas.vline(x + 2, y + 1, 5, cloth.frac(0.10))         # arm to the lamp
    # The lamp. Larger than it needs to be for its own sake, because doc 17
    # makes it the thing a player watches when they are not doing anything.
    canvas.rect(x - 3, y, 5, 6, brass.frac(0.52))
    canvas.rect(x - 2, y + 1, 3, 4, brass.at(brass.count - 2))
    canvas.hline(x - 4, y - 1, 7, brass.frac(0.34))         # its hood
    canvas.hline(x - 4, y + 6, 7, brass.frac(0.22))         # its base
    canvas.vline(x - 1, y - 4, 3, brass.frac(0.28))         # the bail


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
