"""Room 1, BESPOKE. The hero-room method, and Room 1 is its test.

WHAT IS DIFFERENT ABOUT THIS FILE. Every other room in this project is
assembled: a library of components, each drawn generically, placed by
coordinate. That is how you build forty-two rooms. It is not how you build the
first screen anybody sees, and Room 1 had been revised nine times without ever
becoming a picture, because a picture is not a set of correct objects.

So this script's only job is one image. The component library is vocabulary
here -- used where it helps, abandoned wherever it gets in the way -- and
objects are drawn FOR the position and the light they are in.

TWO RULES, and they are the whole architecture.

1. ONE LIGHT SOURCE, ONE FALLOFF, COMPUTED ONCE. Nothing here is shaded as it
   is drawn. The scene is laid down as buffers -- a MATERIAL id and a FORM
   value, which is the object's own modelling with no lighting in it at all --
   and then a single pass walks the whole frame, works out how much of Hob's
   lantern reaches each pixel, and resolves both at once.

   The pass decides VALUE first and once, then lets the falloff choose which
   family -- warm or cool -- realises it. That ordering is not a detail. Doing
   it the obvious way round, picking a warm ramp position when lit and a cool
   one when not, puts a large value gap under the dither and the pool comes out
   a fifty-per-cent chequerboard of bright ochre on dark mud. Deciding value
   first means the two candidates at the edge of the pool are the same
   brightness and differ only in hue, which is what a warm lamp bleeding into a
   cool night actually looks like.

   This is why the pool on the ground and the near side of the trough and the
   lit edge of Hob's coat all agree with each other: they are the same
   calculation, not three matched decisions.

2. OBJECTS ARE DRAWN AT THEIR POSITION'S ANGLE. The coach and the team are at
   the right of frame, so they are three-quarter and turned toward the centre.
   Nothing is a flat elevation that would look identical anywhere.

WHAT DELIBERATELY DOES NOT TRANSFER, per the brief: faces, horse anatomy, the
lantern's panes, individually lit windows at the reference's density. At this
width the town is forty pixels of suggestion.

TONE COMES FROM THE REFERENCE, NOT FROM THE BAND. Errata 40's numbers were
measured off MI's SCUMM Bar, which is a windowless night INTERIOR, and this is
an open road under an open sky. Under a sky there is no black: the sky is a
light source and it reaches everything. The reference re-framed to 320x144 and
quantised to our palette measures median 35.0, p10 16.0, 44.4% below 30, p90
53.7, and ONE PER CENT pure black. The first version of this file was built to
the interior band instead and shipped 19.7% pure black at a sixth of the
reference's colour saturation -- a brown-and-black picture where the reference
is a blue one. Nothing here lightens the room; it stops pretending the road is
a cellar.
"""

from __future__ import annotations

import math
import random

from canvas import IndexedCanvas
from dither import BAYER4, BAYER8
from palette import Palette
from renders import RENDERS

WIDTH, HEIGHT = 320, 144
SEED = 1858_0411

#: Where the ground begins. The town stands ON this line, which is the whole
#: reason it can be the focal point with nothing in front of it: everything
#: else in the picture stands on the ground BELOW it.
HORIZON = 44
#: Hob's lantern: the only source in the picture, and the centre of rule 1.
LANTERN = (92, 88)
LANTERN_RADIUS = 62.0

# --- MATERIALS -------------------------------------------------------------
#
# Each material is a pair of ramps -- what it looks like in lantern light and
# what it looks like in moonlight -- plus how much of its own form-shading to
# keep. The pair is the point: warm and cool are not one ramp brightened and
# dimmed, they are different families, because a lantern does not make blue
# timber into brighter blue timber.

SKY = 0
STARS = 1
RANGE_FAR = 2
RANGE_NEAR = 3
TOWN = 4
TOWN_LIT = 5
GROUND = 6
RUT = 7
PUDDLE = 8
TIMBER = 9
TIMBER_PALE = 10
IRON = 11
HORSE = 12
COAT = 13
FLESH = 14
LAMP_CORE = 15
COACH_BODY = 16
COACH_LIT = 17
GRASS = 18

#: material -> (warm family, cool family, warm base, cool base, form weight)
#:
#: A base is the material's position along its ramp WHEN ITS FORM IS FULL AND
#: THE LIGHT IS FULL. Form scales it and the light pass adds to it. So `umber
#: 0.42` is not a colour, it is "timber goes about two fifths of the way up
#: the umber ramp before the lantern is taken into account", and the same
#: number produces a lit near edge and a void far edge without being written
#: twice.
#:
#: Form weight is how much of its own modelling the material keeps: 1.0 is a
#: solid object being shaded, 0.0 is something that emits and is therefore the
#: same brightness whichever way it faces.
MATERIALS = {
    SKY:         ("accent_gold", "accent_indigo", 0.62, 0.42, 1.0),
    STARS:       ("bone", "bone", 0.55, 0.55, 0.0),
    RANGE_FAR:   ("accent_indigo", "accent_indigo", 0.34, 0.34, 0.5),
    RANGE_NEAR:  ("accent_indigo", "accent_indigo", 0.20, 0.20, 0.5),
    TOWN:        ("umber", "umber", 0.22, 0.22, 0.7),
    TOWN_LIT:    ("accent_gold", "accent_gold", 0.90, 0.90, 0.0),
    GROUND:      ("ochre", "mud", 0.62, 0.36, 1.0),
    RUT:         ("umber", "mud", 0.44, 0.16, 1.0),
    PUDDLE:      ("accent_gold", "sky", 0.55, 0.16, 0.8),
    TIMBER:      ("umber", "umber", 0.66, 0.30, 1.0),
    TIMBER_PALE: ("ochre", "dust", 0.80, 0.34, 1.0),
    IRON:        ("umber", "umber", 0.34, 0.26, 1.0),
    HORSE:       ("umber", "mud", 0.62, 0.34, 1.0),
    COAT:        ("umber", "accent_indigo", 0.62, 0.30, 1.0),
    FLESH:       ("dust", "dust", 0.52, 0.34, 1.0),
    LAMP_CORE:   ("accent_gold", "accent_gold", 1.00, 1.00, 0.0),
    COACH_BODY:  ("accent_rust", "umber", 0.52, 0.32, 1.0),
    COACH_LIT:   ("accent_gold", "accent_gold", 0.80, 0.80, 0.0),
    GRASS:       ("sage", "sage", 0.34, 0.24, 1.0),
}

EMPTY = 255

#: The cool half is a lit half too -- moonlight comes from above and models
#: things. Raising its midtones is what gives an unlit horse a back, a belly
#: and a shadow instead of three shades of the same near-black.
COOL_GAMMA = 0.72

#: How much wider the WARM half of the frame is than the raw falloff. Family
#: choice wants a slightly generous edge -- a lantern's colour reaches a little
#: past its useful brightness -- and this is that, and nothing else.
WARM_SPREAD = 1.30


class Scene:
    """The three buffers. Nothing is a palette index until the light pass runs.

    `material` is what a pixel is made of, `form` is its own modelling with no
    lighting in it whatsoever, and `glow` is the one concession: the town is
    two miles downhill and lights nothing in this frame except the air over
    itself. It is not a second falloff on objects and no object reads it.
    """

    def __init__(self) -> None:
        self.material = [[EMPTY] * WIDTH for _ in range(HEIGHT)]
        self.form = [[1.0] * WIDTH for _ in range(HEIGHT)]
        self.glow = [[0.0] * WIDTH for _ in range(HEIGHT)]

    def put(self, x: int, y: int, material: int, form: float = 1.0) -> None:
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            self.material[y][x] = material
            self.form[y][x] = form

    def hline(self, x: int, y: int, width: int, material: int, form: float = 1.0) -> None:
        for px in range(x, x + width):
            self.put(px, y, material, form)

    def vline(self, x: int, y: int, height: int, material: int, form: float = 1.0) -> None:
        for py in range(y, y + height):
            self.put(x, py, material, form)

    def rect(self, x: int, y: int, width: int, height: int,
             material: int, form: float = 1.0) -> None:
        for py in range(y, y + height):
            self.hline(x, py, width, material, form)

    def line(self, x0: int, y0: int, x1: int, y1: int,
             material: int, form: float = 1.0) -> None:
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        for step in range(steps + 1):
            t = step / steps
            self.put(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), material, form)

    def disc(self, cx: int, cy: int, rx: float, ry: float,
             material: int, form: float = 1.0) -> None:
        for py in range(int(cy - ry), int(cy + ry) + 1):
            for px in range(int(cx - rx), int(cx + rx) + 1):
                if ((px - cx) / max(rx, .01)) ** 2 + ((py - cy) / max(ry, .01)) ** 2 <= 1.0:
                    self.put(px, py, material, form)


def lantern_field() -> list[list[float]]:
    """How much of the lantern reaches each pixel. Rule 1, computed ONCE.

    Squashed vertically and biased downward, because a lantern held at waist
    height throws most of its light on the ground in front of the man holding
    it and very little on the sky behind him. The falloff is quadratic with a
    soft knee -- a linear one gives a flat disc with an edge, which is the
    thing that reads as a spotlight rather than a lamp.
    """
    lx, ly = LANTERN
    field = [[0.0] * WIDTH for _ in range(HEIGHT)]
    for y in range(HEIGHT):
        for x in range(WIDTH):
            dx = (x - lx) / LANTERN_RADIUS
            # Light goes DOWN and OUT: 1.9 vertical squash above the lamp,
            # 1.15 below it, so the pool is on the mud and not in the air.
            dy = (y - ly) / (LANTERN_RADIUS / (1.9 if y < ly else 1.15))
            dist = math.sqrt(dx * dx + dy * dy)
            if dist >= 1.0:
                continue
            field[y][x] = (1.0 - dist) ** 2
    return field


# --- THE COMPOSITION -------------------------------------------------------
#
# Positions are read off the reference re-framed to 320x144, not invented. The
# order is back to front, which is also the order the eye should find them in:
# sky, ranges, town, then everything standing on the ground.


def sky_and_ranges(scene: Scene, rng: random.Random) -> None:
    """Night sky, BLACK overhead, and two ranges going blue with distance.

    The top two fifths of the frame are form zero, which the light pass turns
    into flat index 0. That is the picture's largest connected void and it is
    not a shadow -- it is the sky, which at night, above a lamp, is the
    blackest thing in front of you.
    """
    for y in range(HORIZON):
        t = y / HORIZON
        # Nothing at all for the top third, then a long slow lift toward the
        # ranges. A short steep one leaves a dithered seam across the frame.
        scene.hline(0, y, WIDTH, SKY, 0.62 + 0.38 * t ** 1.4)
    for _ in range(120):
        x, y = rng.randrange(WIDTH), rng.randrange(0, HORIZON - 10)
        scene.put(x, y, STARS, 0.4 + 0.6 * rng.random())

    # Two ranges. The far one is a shade off the sky; the near one is a flat
    # SILHOUETTE -- no modelling in it at all, because at two miles and no
    # moon on that face there is none to see, and because the town has to be
    # read against something with nothing in it.
    for material, base, amp, step, seed, form in (
        (RANGE_FAR, HORIZON - 12, 8, 27, 11, 1.0),
        (RANGE_NEAR, HORIZON - 3, 5, 37, 29, 1.0),
    ):
        peaks = random.Random(seed)
        heights = [base - peaks.randrange(0, amp) for _ in range(WIDTH // step + 2)]
        for x in range(WIDTH):
            i, f = divmod(x, step)
            top = round(heights[i] + (heights[i + 1] - heights[i]) * (f / step))
            for y in range(top, HORIZON):
                scene.put(x, y, material, form)


def town(scene: Scene, rng: random.Random) -> None:
    """Consolation, downhill and two miles off. THE FOCAL POINT.

    Forty pixels of suggestion, exactly as the brief says, and the one rule
    that matters is NOTHING STANDS IN FRONT OF IT. Every prop in this scene
    was moved until that was true.
    """
    base, left, right, middle = HORIZON, 116, 194, 155

    # The halo FIRST, because the buildings are drawn into it and the whole
    # read depends on which is in front of which. A tight bloom sitting on the
    # roofline, not a wash over the range: a wash is a smear and a smear is
    # what the last pass had.
    for y in range(base - 20, base):
        for px in range(middle - 52, middle + 52):
            d = math.hypot((px - middle) / 48, (y - (base - 5)) / 17)
            if d < 1.0:
                scene.glow[y][px] = max(scene.glow[y][px], (1.0 - d) ** 2.1)

    x = left
    while x < right:
        w = 4 + rng.randrange(0, 5)
        h = 3 + rng.randrange(0, 5)
        # Further from the middle reads as further away: roofs step up toward
        # the centre of the cluster, which is what gives it a hillside.
        drop = round(abs(x - middle) / 22)
        top = base - h - drop
        scene.rect(x, top, w, h + drop, TOWN, 0.30)
        scene.hline(x, top, w, TOWN, 1.0)                   # moon on the ridge
        # Windows, and MORE of them than a building this size would have. At
        # nine pixels across, one lit window per house reads as a house with a
        # light on; three reads as a town, which is the thing that has to
        # carry the focal point from a hundred and fifty pixels away.
        for _ in range(1 + rng.randrange(0, 3)):
            scene.put(x + rng.randrange(0, w), top + 1 + rng.randrange(0, max(1, h + drop - 1)),
                      TOWN_LIT)
        x += w + 1 + rng.randrange(0, 2)


def ground(scene: Scene, rng: random.Random) -> None:
    """Mud, with ruts CURVING from bottom-right into the middle distance.

    The curve is the composition's one big directional line and it is what
    stops the lower third being a field of texture. Drawn as a family of
    parallel arcs in perspective: they converge as they recede, so they carry
    depth as well as direction.
    """
    # The mud is two thirds of the frame and the single fastest way to make it
    # dead is to lay it in flat. It falls off THREE ways: darkest at the
    # horizon, darkest at the left and right edges, and lifting toward the
    # camera. That is not a vignette bolted on -- it is what a wet road looks
    # like under a sky, and it is what keeps the eye off the corners.
    lx, _ = LANTERN
    for y in range(HORIZON, HEIGHT):
        t = (y - HORIZON) / (HEIGHT - HORIZON)
        for x in range(WIDTH):
            edge = abs(x - lx) / WIDTH
            scene.put(x, y, GROUND, (0.26 + 0.74 * t ** 0.95) * (1.0 - 0.46 * edge ** 1.15))

    # Eight ruts, all aimed at one vanishing point up the road so they read as
    # one set of tracks rather than eight lines. They STOP well short of it:
    # drawn all the way in, nine converging lines stack into a solid wedge and
    # the road grows a spire.
    vx, vy = 208, HORIZON - 2
    for index in range(9):
        spread = (index - 4) * 30
        for y in range(HEIGHT - 1, HORIZON + 22, -1):
            t = (y - vy) / (HEIGHT - vy)
            x = round(vx + spread * t * t)          # squared: the curve
            if 0 <= x < WIDTH:
                scene.put(x, y, RUT, 0.42 - 0.16 * t)
                if t > 0.35:
                    scene.put(x + 1, y, RUT, 0.30 - 0.10 * t)
                if index % 2 == 0 and t > 0.7:
                    scene.put(x + 2, y, RUT, 0.24)

    # Puddles in the ruts, catching the SKY -- which is why they are the one
    # cool thing in the warm half of the picture.
    for cx, cy, rx, ry in ((84, 128, 9, 2), (128, 122, 7, 2), (150, 136, 11, 3),
                           (196, 114, 6, 2), (238, 128, 10, 3), (60, 138, 8, 2),
                           (172, 104, 5, 1), (272, 138, 9, 2)):
        scene.disc(cx, cy, rx, ry, PUDDLE, 0.55)
        scene.hline(cx - rx, cy - ry, rx * 2, PUDDLE, 0.95)

    for _ in range(260):
        x, y = rng.randrange(WIDTH), rng.randrange(HORIZON + 4, HEIGHT)
        scene.form[y][x] = max(0.0, scene.form[y][x] * rng.uniform(0.55, 1.45))


def sign(scene: Scene) -> None:
    """CONSOLATION · 2 MILES, on two posts, with a lantern on its own bracket.

    Left of frame and slightly turned, so its right-hand post reads nearer
    than its left. The board is TIMBER_PALE -- weathered board catches a
    lantern far better than the posts do, and it is the only pale mass on this
    side of the picture.
    """
    # Turned: the left edge is further off, so the board is a hair shorter
    # there and its top edge slopes. Two pixels of slope is the whole read.
    for col in range(48):
        t = col / 47
        top = 56 - round(2 * t)
        scene.vline(28 + col, top, 22, TIMBER_PALE, 0.50 + 0.22 * t)
        scene.put(28 + col, top, TIMBER_PALE, 0.95)         # moon on the edge
        scene.put(28 + col, top + 21, TIMBER, 0.06)         # under-edge, void
    scene.vline(76, 54, 22, TIMBER, 0.14)                   # the near end grain

    # The letters: ticks of uneven height and uneven spacing. Regular ones at
    # three-pixel pitch came out a barcode -- the eye reads even spacing as a
    # pattern and uneven spacing as writing, and that is the entire trick.
    letters = random.Random(1849)
    x = 31
    while x < 71:
        w = 1 + letters.randrange(0, 2)
        scene.rect(x, 60 + letters.randrange(0, 2), w, 4, TIMBER, 0.05)
        x += w + 1 + letters.randrange(0, 2)
    x = 43
    while x < 63:                                           # the second line,
        w = 1 + letters.randrange(0, 2)                     # shorter, centred:
        scene.rect(x, 68, w, 3, TIMBER, 0.05)               # place, then miles
        x += w + 1 + letters.randrange(0, 2)

    # Posts, the right one nearer and therefore thicker.
    scene.rect(33, 76, 3, 42, TIMBER, 0.16)
    scene.vline(33, 76, 42, TIMBER, 0.34)
    scene.rect(66, 76, 4, 44, TIMBER, 0.20)
    scene.vline(66, 76, 44, TIMBER, 0.44)
    scene.line(36, 80, 66, 78, TIMBER, 0.10)                # a brace

    # The bracket, out to the right of the board, and the lantern hanging off
    # it. Doc 17 gives the sign a lamp; the reference hangs it on an arm.
    scene.hline(76, 50, 12, TIMBER, 0.30)
    scene.line(76, 54, 84, 50, TIMBER, 0.22)                # the arm's stay
    scene.vline(86, 51, 3, IRON, 0.34)
    scene.rect(84, 54, 5, 7, IRON, 0.16)
    scene.rect(85, 55, 3, 5, LAMP_CORE)
    scene.hline(84, 53, 5, IRON, 0.50)                      # its hood


def hob(scene: Scene) -> None:
    """Hob, left of centre, lantern HELD OUT at arm's length.

    He is drawn three-quarter toward the town, which is where he is walking,
    and the lantern is on the side nearest the camera so it lights his front.
    The lit edge is NOT drawn here -- the light pass does it, because the pool
    on the mud at his feet and the warm side of his coat have to be the same
    calculation or he reads as a cut-out standing near a lamp.
    """
    lx, ly = LANTERN
    # The lamp, and the bail his hand is on.
    scene.rect(lx - 3, ly - 4, 7, 9, IRON, 0.24)
    scene.rect(lx - 2, ly - 3, 5, 7, LAMP_CORE)
    scene.hline(lx - 4, ly - 5, 9, IRON, 0.40)
    scene.hline(lx - 4, ly + 5, 9, IRON, 0.30)
    scene.vline(lx, ly - 8, 4, IRON, 0.34)

    # Coat: long, and wider at the hem than the shoulder, which is what a
    # frock coat does and what stops him reading as a plank.
    #
    # THE FORM RUNS ACROSS HIM, NOT DOWN HIM. The lamp is at his left hand, so
    # the left edge of the coat is nearly full form and the right edge is
    # nearly nothing, and the light pass turns that into a hot rim and a body
    # that disappears into the dark. Shading him top-to-bottom -- which is the
    # generic way, and what the component library does -- produced a man
    # standing beside a lantern rather than a man holding one.
    for row in range(26):
        t = row / 25
        half = 4 + round(t * 2.5)
        for col in range(half * 2):
            across = col / (half * 2 - 1)                   # 0 = lamp side
            scene.put(100 - half + col, 88 + row, COAT,
                      0.10 + 0.85 * (1.0 - across) ** 1.7)
    scene.hline(96, 88, 9, COAT, 0.30)                      # shoulder line
    # The arm holding it out: the whole reason the lamp is where it is.
    scene.line(96, 93, lx + 1, ly - 1, COAT, 0.95)
    scene.line(96, 95, lx + 1, ly + 1, COAT, 0.55)
    scene.put(lx + 1, ly, FLESH, 0.95)
    # Head, hat with a brim, and a face he is not showing us.
    scene.rect(97, 82, 6, 6, FLESH, 0.30)
    scene.vline(97, 82, 6, FLESH, 1.0)                      # lamp-side cheek
    scene.vline(98, 82, 6, FLESH, 0.60)
    scene.put(99, 84, COAT, 0.02)                           # the eye
    scene.hline(95, 81, 10, COAT, 0.18)                     # brim
    scene.put(95, 81, COAT, 0.9)
    scene.put(96, 81, COAT, 0.5)
    scene.hline(97, 79, 6, COAT, 0.10)                      # crown
    # Legs and boots, planted.
    scene.rect(96, 114, 3, 6, COAT, 0.40)
    scene.rect(101, 114, 3, 6, COAT, 0.12)
    scene.hline(95, 119, 10, COAT, 0.03)


def rail_and_trough(scene: Scene) -> None:
    """The hitching rail and water trough, middle ground, centre of frame.

    Turned very slightly so the near end is lower and thicker. It sits in the
    lantern's outer falloff, which is exactly what it is for: the object that
    proves the light reaches past Hob.
    """
    scene.line(120, 84, 168, 82, TIMBER, 0.44)
    scene.line(120, 86, 168, 84, TIMBER, 0.26)
    for px, top, height in ((121, 84, 18), (144, 83, 17), (167, 82, 16)):
        scene.rect(px, top, 3, height, TIMBER, 0.32)
    scene.rect(126, 96, 22, 8, TIMBER, 0.36)                # the trough
    scene.hline(126, 96, 22, TIMBER_PALE, 0.55)
    scene.hline(127, 98, 20, PUDDLE, 0.5)                   # water, catching sky
    scene.rect(128, 104, 3, 4, TIMBER, 0.22)
    scene.rect(143, 104, 3, 4, TIMBER, 0.22)


def team(scene: Scene) -> None:
    """Four horses, THREE-QUARTER, overlapping at four different depths.

    Rule 2's clearest case. They are on the right of frame walking left-to-
    right away from the camera, so each is seen from behind the shoulder: the
    barrel foreshortens, the far pair show as a second rump and one extra head
    over the near pair's backs. Nothing here is a side elevation.
    """
    # The rump is at the RIGHT, toward the coach, because that is where the
    # pole is; the heads are at the left, walking away up the road. So we are
    # behind and slightly left of the whole team.
    #
    # (rump x, ground line, body length, leg, barrel depth, moon) far to near.
    for rx, gy, length, leg, barrel, moon in (
        (206, 97, 26, 11, 9, 0.42), (196, 101, 28, 12, 10, 0.58),
        (208, 106, 30, 13, 11, 0.76), (198, 111, 32, 14, 12, 1.00),
    ):
        back = gy - leg - barrel
        head_x = rx - length

        # THE BODY IS A SILHOUETTE. Almost all of a horse at night is a hole
        # in the picture with a bright line along the top of it. Drawing it as
        # a mid-grey mass -- which is what the last pass did -- gets four
        # horse-shaped smudges the same value as the mud they stand on.
        for col in range(length):
            t = col / (length - 1)                          # 0 at rump
            # Croup high at the rump, dipping at the loin, rising to the
            # withers: three-quarter from behind, so the rump is also WIDER.
            top = back + round(2.2 * t - 3.0 * math.sin(t * math.pi) ** 2)
            belly = gy - leg + round(2.0 * t)
            for y in range(top, belly):
                depth_in = (y - top) / max(1, belly - top)
                scene.put(rx - col, y, HORSE, 0.52 * moon * (1.0 - 0.62 * depth_in))
            scene.put(rx - col, top, HORSE, moon * 0.86)    # the moonlit spine
            scene.put(rx - col, top + 1, HORSE, moon * 0.66)

        # Neck and head. It rises only two pixels out of the withers and then
        # runs FORWARD AND DOWN -- a horse in harness carries its head at
        # about the height of its own back, and the first version had four of
        # them craning up like geese.
        for step in range(9):
            t = step / 8
            nx = head_x - round(t * 7)
            ny = back - 2 + round(t * 4)
            scene.vline(nx, ny, max(3, 6 - round(t * 2)), HORSE, 0.30 * moon)
            scene.put(nx, ny, HORSE, moon * 0.85)           # crest, catching it
        scene.rect(head_x - 10, back + 2, 5, 4, HORSE, 0.30 * moon)
        scene.hline(head_x - 10, back + 2, 5, HORSE, moon * 0.7)
        scene.put(head_x - 11, back + 5, HORSE, 0.22 * moon)     # the muzzle
        scene.put(head_x - 6, back + 1, HORSE, moon * 0.6)       # an ear

        # Legs. Two per horse: at this size and this much overlap the far pair
        # is behind the near pair and adding it makes a fence, not a horse.
        for at, stride in ((0.16, 0), (0.80, 2)):
            legx = rx - round(at * length)
            for row in range(leg):
                lean = round(stride * row / leg)
                scene.put(legx + lean, gy - leg + row, HORSE, 0.40 * moon)
                scene.put(legx + 1 + lean, gy - leg + row, HORSE, 0.20 * moon)
        scene.line(rx + 1, back + 1, rx + 3, back + 9, HORSE, 0.5 * moon)   # tail


def coach(scene: Scene) -> None:
    """The stage, far right, THREE-QUARTER, with the driver on the box.

    Seen from behind and to the left, so the near side panel is wide, the far
    side is a sliver, and the roof rack runs away from us. The lit windows are
    the second warm thing in the frame after the lantern, and they are small:
    at this width a coach window is four pixels and it is enough.
    """
    # Body, with the near side taller than the far -- that difference is the
    # whole of the three-quarter read at this size.
    #
    # AND IT IS DARK. The pass before this drew it at an even mid-value and it
    # became the largest pale mass in the frame, pulling the eye off the town
    # it is supposed to sit behind. A coach at night is a black box with a
    # moonlit roofline and three lit windows, and the windows do all the work.
    for col in range(62):
        t = col / 61
        top = 46 + round(3 * t)
        bottom = 96 - round(4 * t)
        for y in range(top, bottom):
            down = (y - top) / max(1, bottom - top)
            scene.put(238 + col, y, COACH_BODY,
                      (0.74 - 0.34 * t) * (1.0 - 0.42 * down))
        scene.put(238 + col, top, COACH_BODY, 0.95 - 0.35 * t)
        scene.put(238 + col, top + 1, COACH_BODY, 0.62 - 0.24 * t)
    scene.rect(238, 40, 58, 7, COACH_BODY, 0.26)            # roof rack
    scene.hline(238, 40, 58, COACH_BODY, 0.78)
    for bag in ((242, 35, 9, 5), (256, 33, 11, 6), (272, 36, 8, 4)):
        scene.rect(*bag, TIMBER, 0.18)
        scene.hline(bag[0], bag[1], bag[2], TIMBER, 0.62)
    # Windows and the open door: warm, small, and the only interior we see.
    scene.rect(248, 56, 6, 8, COACH_LIT)
    scene.rect(262, 55, 7, 9, COACH_LIT)
    scene.rect(280, 57, 5, 7, COACH_LIT)
    scene.vline(258, 54, 12, COACH_BODY, 0.18)
    scene.vline(276, 54, 12, COACH_BODY, 0.18)
    # Wheels: near one large, far one small and mostly hidden. Spokes only on
    # the near wheel -- eight pixels of spoke on the far one is noise.
    for cx, cy, r, form in ((252, 92, 8, 0.46), (292, 96, 13, 0.62)):
        for a in range(0, 360, 6):
            rad = math.radians(a)
            scene.put(cx + round(r * math.cos(rad)), cy + round(r * 0.92 * math.sin(rad)),
                      IRON, form)
        if r > 10:
            for a in range(0, 360, 30):
                rad = math.radians(a)
                scene.line(cx, cy, cx + round(r * .82 * math.cos(rad)),
                           cy + round(r * .76 * math.sin(rad)), IRON, form * 0.7)
    # The pole, running forward to the team, and the driver on the box.
    #
    # He sits at the FRONT of the coach, which is its left side, and he sits
    # HIGH -- his head above the roofline and against the sky. Tucked below it
    # he was a dark panel on a dark box and read as neither.
    scene.line(238, 88, 208, 95, IRON, 0.30)
    scene.rect(226, 45, 15, 5, TIMBER, 0.16)                # the box
    scene.hline(226, 45, 15, TIMBER, 0.50)
    scene.rect(226, 40, 14, 2, TIMBER, 0.30)                # the dash rail
    # HE IS THE LIGHTEST THING ON THE COACH, not the darkest. He is the only
    # object in the frame with nothing above him, so the sky is on him, and
    # drawn dark against a dark sky he came out as a dithered column -- a
    # smokestack on a stagecoach. Value is what makes him a man; the shape
    # alone cannot at twelve pixels.
    scene.rect(229, 33, 11, 12, COAT, 0.34)                 # him, hunched
    scene.hline(229, 33, 11, COAT, 0.82)                    # moonlit shoulders
    scene.hline(230, 34, 9, COAT, 0.52)
    scene.vline(239, 34, 10, COAT, 0.10)                    # and a dark far arm
    scene.rect(232, 27, 5, 6, FLESH, 0.40)                  # a narrower head
    scene.vline(232, 27, 6, FLESH, 0.68)
    scene.hline(230, 26, 9, COAT, 0.74)                     # brim, against sky
    scene.hline(232, 23, 5, COAT, 0.46)                     # crown, narrower
    scene.hline(232, 22, 5, COAT, 0.30)
    scene.line(229, 36, 214, 74, IRON, 0.26)                # the reins, down
    scene.line(230, 37, 216, 76, IRON, 0.14)


def foreground(scene: Scene, rng: random.Random) -> None:
    """Bottom-left: a wagon wheel and a fence post, LARGE and cropped.

    Errata 32d and 32e done properly. Both are near-void by the light pass --
    they are the far side of the lantern and the near side of nothing -- and
    they exist to give the frame a scale anchor and its darkest mass.
    """
    # FORM ZERO. Not "dark timber" -- nothing. These two are between the
    # camera and every light in the picture, so there is no surface of either
    # of them that anything reaches, and the light pass writes index 0. That
    # is the scale anchor and it is also the frame's largest black.
    scene.rect(0, 90, 10, HEIGHT - 90, TIMBER, 0.22)
    scene.hline(0, 90, 10, TIMBER, 0.30)                    # one moonlit edge
    scene.line(10, 99, 23, 95, TIMBER, 0.20)                 # a rail off it
    scene.line(10, 98, 23, 94, TIMBER, 0.16)
    scene.line(10, 108, 25, 105, TIMBER, 0.18)

    cx, cy, r = 30, 126, 27
    for a in range(0, 360, 3):
        rad = math.radians(a)
        for ring in (r, r - 1, r - 2):
            scene.put(cx + round(ring * math.cos(rad)), cy + round(ring * math.sin(rad)),
                      TIMBER, 0.26)
    # The one lit thing about it: the top-left of the rim, where the sky is.
    for a in range(186, 262, 2):
        rad = math.radians(a)
        scene.put(cx + round(r * math.cos(rad)), cy + round(r * math.sin(rad)), TIMBER, 0.34)
    for a in range(0, 360, 30):
        rad = math.radians(a)
        scene.line(cx, cy, cx + round((r - 3) * math.cos(rad)),
                   cy + round((r - 3) * math.sin(rad)), TIMBER, 0.22)
    scene.disc(cx, cy, 4, 4, TIMBER, 0.28)
    for _ in range(40):
        scene.put(rng.randrange(0, 48), rng.randrange(128, 144), GRASS, 0.30)


def shadows(scene: Scene) -> None:
    """What every object in the frame stands in. Drawn LAST and into form.

    Errata 40's shadow-shape rule, applied where it is cheapest and does the
    most: a smear at the foot of a thing, wider than the thing and shallow. A
    coach with no shadow does not sit on the road, it hovers over it, and no
    amount of getting the coach right fixes that.

    It goes into the FORM buffer rather than stamping black, so the mud in a
    shadow is still mud and the light pass still decides what it looks like --
    which is how a shadow inside the lantern's pool comes out warm-dark
    instead of the same colour as one out at the frame edge.
    """
    for x, y, width, height, depth in (
        (86, 116, 34, 12, 0.86),        # Hob
        (120, 100, 56, 12, 0.62),       # the rail and trough
        (152, 104, 76, 16, 0.72),       # the team, one shadow for all four
        (232, 92, 84, 22, 0.80),        # the coach
        (28, 112, 50, 14, 0.55),        # the sign's posts
    ):
        for py in range(y, y + height):
            for px in range(x, x + width):
                if not (0 <= px < WIDTH and 0 <= py < HEIGHT):
                    continue
                if scene.material[py][px] not in (GROUND, RUT, PUDDLE, GRASS):
                    continue
                d = math.hypot((px - (x + width / 2)) / (width / 2),
                               (py - (y + height / 2)) / (height / 2))
                if d < 1.0:
                    scene.form[py][px] *= 1.0 - depth * (1.0 - d) ** 0.7


# --- THE LIGHT PASS --------------------------------------------------------


def ladder(palette: Palette, name: str) -> list[tuple[float, int]]:
    """A family as (luminance, index) steps, darkest first."""
    ramp = palette.family(name)
    return [(palette.luminance(ramp.at(step)), ramp.at(step)) for step in range(ramp.count)]


def pick(steps: list[tuple[float, int]], lum: float, x: int, y: int) -> int:
    """The entry of a family at a given luminance, dithered between two steps."""
    if lum <= steps[0][0]:
        return steps[0][1]
    if lum >= steps[-1][0]:
        return steps[-1][1]
    for index in range(1, len(steps)):
        if steps[index][0] >= lum:
            low_lum, low = steps[index - 1]
            high_lum, high = steps[index]
            blend = (lum - low_lum) / max(1e-6, high_lum - low_lum)
            return high if blend > BAYER8.threshold(x, y) else low
    return steps[-1][1]


#: Below this luminance a pixel is not dark, it is BLACK.
VOID_LUM = 6.0
#: How the lantern's reach turns into brightness. Under 1.0 the pool has a
#: broad shoulder; over it, a bright core and a fast fall. A lamp is the
#: second thing.
GAIN_CURVE = 1.35


def resolve(scene: Scene, field: list[list[float]], palette: Palette) -> IndexedCanvas:
    """RULE 1. One walk of the frame, and the only place colour is decided.

    Nothing above this line named a palette index. Every object was drawn as a
    material and a form, and here -- once, for all of them -- the lantern's
    reach at that pixel picks the material's WARM ramp or its COOL one and
    says how far up it to go.

    That is why the pool on the mud, the near edge of the trough, the lit side
    of Hob's coat and the warm rim of the nearest horse agree: they are not
    four matched decisions, they are one calculation read at four places. The
    thing that made every previous version of Room 1 a row of objects was that
    each object arrived already shaded and no amount of arranging could make
    them share a light.

    The family choice is DITHERED against the falloff, which is what gives the
    pool an edge that dissolves rather than a rim.
    """
    # Precomputed once: every family as a luminance ladder, and every
    # material's ceiling -- how bright it gets with the lantern full on it.
    ladders = {name: ladder(palette, name)
               for warm, cool, *_ in MATERIALS.values() for name in (warm, cool)}
    ceiling = {material: palette.luminance(palette.family(warm).frac(warm_base))
               for material, (warm, _, warm_base, _, _) in MATERIALS.items()}
    moonlit = {material: palette.luminance(palette.family(cool).frac(cool_base))
               for material, (_, cool, _, cool_base, _) in MATERIALS.items()}

    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=0)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            material = scene.material[y][x]
            if material == EMPTY:
                continue                                    # stays void
            warm_name, cool_name, _, cool_base, weight = MATERIALS[material]
            form = scene.form[y][x]
            # Form weight: 1.0 keeps all of an object's modelling, 0.0 keeps
            # none of it because the thing emits.
            shade = (1.0 - weight) + weight * form

            light = field[y][x]
            if material in (SKY, RANGE_FAR, RANGE_NEAR):
                # The town lights the air above itself and nothing else. It is
                # two miles downhill; it does not reach the mud.
                light = max(light, scene.glow[y][x])
            mix = min(1.0, light * WARM_SPREAD)

            # ONE LUMINANCE, TWO HUES. This is the fix that made the lantern a
            # lantern. The obvious version picks a warm ramp position when lit
            # and a cool one when not, and dithers between them -- but those
            # two positions are far apart in VALUE, so the transition comes out
            # a fifty-per-cent chequerboard of bright ochre on dark mud, which
            # is not a pool of light, it is a rash.
            #
            # So value is decided first and once, from the material and the
            # light, and the dither only chooses WHICH FAMILY realises it. At
            # the edge of the pool the two candidates are the same brightness
            # and differ only in hue, which is what a warm light bleeding into
            # a cool night actually looks like.
            # Form scales the material's moonlit VALUE, not its ramp position.
            # Scaling the position floors out at the family's darkest entry --
            # indigo bottoms at luminance 22 -- so a surface with no light on
            # it came out dark blue instead of black, and the frame measured
            # 0.0% near-void with a sky that was supposed to be the largest
            # black in it. In luminance the floor is where it belongs: zero.
            base = moonlit[material] * shade ** COOL_GAMMA
            lum = base + (ceiling[material] - base) * mix ** GAIN_CURVE

            if lum < VOID_LUM and BAYER8.threshold(x, y) >= lum / VOID_LUM:
                continue                                    # not dark: black
            family = warm_name if mix > BAYER4.threshold(x, y) else cool_name
            canvas.put(x, y, pick(ladders[family], lum, x, y))
    return canvas


def compose() -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    scene = Scene()

    # Back to front, which is also the order the eye should find them in.
    sky_and_ranges(scene, rng)
    town(scene, rng)
    ground(scene, rng)
    sign(scene)
    rail_and_trough(scene)
    team(scene)
    coach(scene)
    hob(scene)
    shadows(scene)                  # into form, and only where ground is left
    foreground(scene, rng)          # after the shadows: it casts none, it IS one

    return resolve(scene, lantern_field(), palette), palette


def main() -> None:
    canvas, palette = compose()
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas.save(RENDERS / "room-01-stage-road-hero.png", palette)
    canvas.save(RENDERS / "room-01-stage-road-hero@4x.png", palette, scale=4)

    from void_audit import measure
    stats = measure(canvas, palette)
    print("room-01-stage-road-hero.png / @4x")
    print(f"  median {stats['median']:.1f}   p10 {stats['p10']:.1f}   "
          f"below 30 {stats['below30']:.1f}%   p90 {stats['p90']:.1f}")
    print(f"  near-void {stats['voidArea']:.1f}% of frame, largest region "
          f"{stats['largest']:.1f}%, {stats['regions']} region(s) "
          f"({stats['components']} components)")
    print(f"  colours used: {len(canvas.used_indices())}")


if __name__ == "__main__":
    main()
