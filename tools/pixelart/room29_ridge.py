"""Room 29 — the high ridge, looking down on Consolation.

Every other room in this game is at eye level in the town. This one is the
only view from outside it, and the composition exists to make one point:
from up here the false fronts are visibly false. You can see the flat
parapets standing a storey above the shallow buildings behind them, which
from Main Street is the one thing you cannot see. The town is a row of
painted boards with sheds behind, in a valley, in a very large landscape.

This is NOT the title image. The two shared a composition once and have
since diverged: title_screen.py has its own, with Consolation pushed to a
third of the frame and much nearer, because a poster has to show the town
performing. This room is a place Thad stands in Act IV, so it stays wide
and empty and mostly landscape. They share a viewpoint and a palette and
nothing else.

Scale is the whole job. The town occupies about a fifth of the frame's
width and sits low; the claims are single pixels; the road leaves east and
does not come back. Nothing here is drawn at a size that flatters it.
"""

from __future__ import annotations

import random
from pathlib import Path

from canvas import IndexedCanvas
from components import distant_hills, sky_gradient
from dither import BAYER2, BAYER4, dither_pixel
from palette import Palette
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]

WIDTH, HEIGHT = 320, 144
SEED = 18581104

HORIZON = 46          # where the far range sits down
VALLEY_FLOOR = 104    # the flat the town stands on
#: The town is a third of the frame, not a fifth. At 68px across, nine
#: buildings came to six pixels each -- too small to show a parapet
#: standing in front of a shed, which is the one thing this viewpoint
#: exists to show. It still sits low and it is still mostly landscape.
TOWN_LEFT, TOWN_RIGHT = 104, 212


def compose() -> tuple[IndexedCanvas, Palette]:
    palette = Palette.load()
    rng = random.Random(SEED)
    canvas = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))

    sky = palette.family("dusk")
    far = palette.family("sky")
    sage = palette.family("sage")
    pine_green = palette.family("pine_green")
    mud = palette.family("mud")
    umber = palette.family("umber")
    ochre = palette.family("ochre")
    bone = palette.family("bone")
    grey = palette.family("grey")

    # -- late low light ----------------------------------------------------
    # Warm at the horizon, cooling upward. Low sun, long shadows, and the
    # town in the last of it.
    for y in range(HORIZON + 8):
        position = 1.0 - (y / max(1, HORIZON + 8))
        dither_row(canvas, y, sky, 0.30 + 0.55 * position, BAYER4)

    # -- ranges, palest at the back ----------------------------------------
    distant_hills(canvas, 0, HORIZON - 16, WIDTH, 20, far, rng, layers=2, amplitude=6)
    distant_hills(canvas, 0, HORIZON - 6, WIDTH, 22, sage, rng, layers=3, amplitude=9)

    # -- the hillside, painted BEFORE anything stands on it ----------------
    #
    # The first pass drew the valley walls and the floor and left the band
    # between them unpainted, so a black bar ran the width of the frame
    # where the hillside should have been. Everything below the ranges is
    # ground, and it gets filled first as ground.
    for y in range(HORIZON + 2, HEIGHT):
        walk = (y - (HORIZON + 2)) / max(1, HEIGHT - HORIZON - 2)
        # Sage on the upper slopes giving way to bare mud lower down, which
        # is what four hundred holes in a hillside actually does to it.
        # Sage on the upper slopes giving way to bare mud lower down. The
        # two are interleaved through a transition band rather than butted
        # together -- a hard horizontal seam across the whole frame reads as
        # two different pictures stacked.
        if walk < 0.34:
            dither_row(canvas, y, sage, 0.30 - 0.10 * walk, BAYER2)
        elif walk < 0.50:
            blend = (walk - 0.34) / 0.16
            for x in range(WIDTH):
                use_mud = ((x * 7 + y * 3) % 16) / 16 < blend
                dither_pixel(canvas, x, y, mud if use_mud else sage,
                             (0.40 + 0.16 * walk) if use_mud else (0.26 - 0.06 * walk), BAYER2)
        else:
            dither_row(canvas, y, mud, 0.34 + 0.22 * walk, BAYER2)

    # -- the valley the town sits in ---------------------------------------
    ridge_lines(canvas, palette, rng, sage, pine_green)

    # -- valley floor: a paler flat the town stands on ---------------------
    for y in range(VALLEY_FLOOR - 14, VALLEY_FLOOR + 12):
        depth = abs(y - VALLEY_FLOOR) / 14
        dither_row(canvas, y, mud, 0.54 - 0.16 * depth, BAYER2)

    # -- four hundred small claims -----------------------------------------
    scatter_claims(canvas, palette, rng, ochre, umber)

    # -- the road, east to the horizon -------------------------------------
    road_east(canvas, palette, mud, ochre)

    # -- the town: false fronts seen from behind and above -----------------
    town(canvas, palette, rng, bone, umber, grey, ochre, mud)

    # -- the ridge we are standing on, cropping the bottom corners ---------
    foreground_ridge(canvas, palette, rng, umber, pine_green)

    return canvas, palette


def dither_row(canvas: IndexedCanvas, y: int, ramp, tone: float, bayer) -> None:
    for x in range(canvas.width):
        dither_pixel(canvas, x, y, ramp, max(0.03, min(0.97, tone)), bayer)


def ridge_lines(canvas: IndexedCanvas, palette: Palette, rng, sage, pine) -> None:
    """Two valley walls running down into the frame, framing the town."""
    for side in (-1, 1):
        base_x = 0 if side < 0 else WIDTH - 1
        for step in range(3):
            tone = 0.30 - 0.06 * step
            crest = HORIZON + 6 + step * 9
            reach = 90 + step * 40
            for offset in range(reach):
                x = base_x + side * offset
                if not (0 <= x < WIDTH):
                    break
                fall = offset / reach
                top = int(crest + fall * fall * 46)
                for y in range(top, min(HEIGHT, top + 26)):
                    dither_pixel(canvas, x, y, sage if step < 2 else pine,
                                 max(0.05, tone - 0.10 * ((y - top) / 26)), BAYER4)


def scatter_claims(canvas: IndexedCanvas, palette: Palette, rng, ochre, umber) -> None:
    """Four hundred small claims, each one or two pixels.

    They are drawn at the size four hundred holes in a hillside actually are
    from a ridge, which is very nearly nothing. The point of the number is
    that it is a lot of people and it does not look like a lot.
    """
    placed = 0
    while placed < 400:
        x = rng.randrange(4, WIDTH - 4)
        y = rng.randrange(HORIZON + 12, HEIGHT - 26)
        # Not on the town, not on the road.
        if TOWN_LEFT - 6 < x < TOWN_RIGHT + 6 and VALLEY_FLOOR - 24 < y < VALLEY_FLOOR + 8:
            continue
        canvas.put(x, y, ochre.frac(0.22 + 0.18 * rng.random()))
        if rng.random() < 0.45:
            canvas.put(x, y + 1, umber.frac(0.16))     # the spoil below it
        placed += 1


def road_east(canvas: IndexedCanvas, palette: Palette, mud, ochre) -> None:
    """One road, leaving east, narrowing to nothing at the horizon."""
    start_x, start_y = TOWN_RIGHT, VALLEY_FLOOR - 2
    end_x, end_y = WIDTH - 2, HORIZON + 12
    steps = 90
    for step in range(steps):
        walk = step / steps
        x = int(start_x + (end_x - start_x) * walk)
        y = int(start_y + (end_y - start_y) * (walk ** 0.7))
        width = max(1, int(3 * (1 - walk)))
        canvas.hline(x, y, width, mud.frac(0.46))
        if width > 1:
            canvas.put(x, y, ochre.frac(0.34))


def town(canvas: IndexedCanvas, palette: Palette, rng, bone, umber, grey, ochre, mud=None) -> None:
    """Consolation from above and behind.

    The false fronts are the point. Each building is a tall flat parapet
    facing us at an angle, with a low shallow shed behind it -- so the
    silhouette is a row of boards standing a storey higher than the
    buildings they advertise. That is the joke the town is built on and
    this is the only viewpoint in the game that can show it.
    """
    ground = VALLEY_FLOOR
    x = TOWN_LEFT
    while x < TOWN_RIGHT:
        width = 10 + rng.randrange(0, 5)
        parapet = 11 + rng.randrange(0, 5)
        shed = parapet - 5 - rng.randrange(0, 3)

        # The shed behind: lower, DARKER, and set back up the frame. It has
        # to be visibly a different and smaller object or the pair reads as
        # one tall building and the whole point of the viewpoint is lost.
        back_y = ground - shed - 4
        canvas.rect(x + 2, back_y, width, shed + 2, umber.frac(0.12))
        canvas.hline(x + 2, back_y, width, umber.frac(0.26))
        canvas.hline(x + 2, back_y + 1, width, umber.frac(0.08))

        # The false front: taller, flat, pale, catching the low sun square on.
        top = ground - parapet
        canvas.rect(x, top, width, parapet, bone.frac(0.40 + 0.14 * rng.random()))
        canvas.hline(x, top, width, bone.frac(0.86))                 # lit top edge
        canvas.vline(x + width - 1, top, parapet, umber.frac(0.10))  # shade side
        canvas.vline(x, top, parapet, bone.frac(0.66))               # lit side
        # The shadow the parapet throws onto the shed roof behind it. This
        # one line is what makes the board read as standing IN FRONT OF
        # something rather than as the front wall of it.
        canvas.hline(x + 1, top + 1, width, umber.frac(0.06))

        x += width + 2 + rng.randrange(0, 3)

    # The far side of Main Street: a second row, lower in the frame and
    # smaller, seen from behind. Its false fronts face away from us, so all
    # that shows is roofline -- which is the other half of the same joke.
    near_ground = ground + 9
    x = TOWN_LEFT + 4
    while x < TOWN_RIGHT - 6:
        width = 8 + rng.randrange(0, 5)
        depth = 5 + rng.randrange(0, 3)
        canvas.rect(x, near_ground - depth, width, depth, umber.frac(0.18))
        canvas.hline(x, near_ground - depth, width, umber.frac(0.34))
        canvas.hline(x, near_ground - 1, width, umber.frac(0.08))
        x += width + 2 + rng.randrange(0, 3)

    # The street itself, between the rows.
    canvas.rect(TOWN_LEFT, ground + 1, TOWN_RIGHT - TOWN_LEFT, 3, mud.frac(0.62))
    canvas.hline(TOWN_LEFT, ground, TOWN_RIGHT - TOWN_LEFT, umber.frac(0.20))
    street_traffic(canvas, rng, ground, umber)

    # One spire, because doc 05's Room 2 has a distant steeple.
    spire_x = TOWN_LEFT + 8
    canvas.vline(spire_x, ground - 20, 8, grey.frac(0.40))
    canvas.put(spire_x, ground - 21, bone.frac(0.60))


def street_traffic(canvas: IndexedCanvas, rng, ground: int, umber) -> None:
    """People on Main Street, at one pixel each. Ruling 19b, doc 19.

    THE TOWN, BELOW says "you can see that every building on Main Street is a
    front with nothing behind it, and that people are moving between them
    anyway, briskly, all day." The first half was drawn and the second was
    not, which made the line describe half a picture.

    A pixel is the correct size. From this distance a man IS a pixel, and the
    line's argument depends on him being small enough that the fronts dwarf
    him -- draw them any larger and the joke inverts into a crowd scene. Two
    rows of them, because the street has a near side and a far side and a
    single row reads as a dotted line rather than as traffic.

    Drawn near-black rather than mid-tone: the street is the lightest strip in
    the valley and a figure the same weight as it disappears into it. A
    silhouette is also what a person at that distance actually is.

    They do not move. Doc 18 rule 3 is explicit that cycling never conveys
    information, and the town at this distance is not one of its rooms.
    """
    for offset, tone, count in ((1, 0.06, 10), (2, 0.04, 7)):
        stride = (TOWN_RIGHT - TOWN_LEFT) // (count + 1)
        for step in range(count):
            # Jittered off the grid: evenly spaced people are a fence.
            x = TOWN_LEFT + stride * (step + 1) + rng.randrange(-4, 5)
            canvas.put(x, ground + offset, umber.frac(tone))
            # About a third of them are two pixels tall -- near side of the
            # street, or a tall man, and the variation is what makes the row
            # read as bodies rather than as dirt.
            if rng.random() < 0.34:
                canvas.put(x, ground + offset - 1, umber.frac(max(0.05, tone - 0.10)))


def foreground_ridge(canvas: IndexedCanvas, palette: Palette, rng, umber, pine) -> None:
    """The rock we are standing on, dark, cropping the bottom of the frame."""
    for x in range(WIDTH):
        # An uneven brow, higher at the edges than in the middle.
        centre = abs(x - WIDTH / 2) / (WIDTH / 2)
        top = int(HEIGHT - 6 - centre * centre * 26 - (rng.random() < 0.3))
        for y in range(top, HEIGHT):
            dither_pixel(canvas, x, y, umber, max(0.03, 0.16 - 0.10 * ((y - top) / 12)), BAYER2)
        canvas.put(x, top, umber.frac(0.30))

    # A few sage clumps on the brow, so it is ground and not a black bar.
    for _ in range(40):
        x = rng.randrange(0, WIDTH)
        centre = abs(x - WIDTH / 2) / (WIDTH / 2)
        top = int(HEIGHT - 6 - centre * centre * 26)
        if 0 <= top - 2 < HEIGHT:
            canvas.put(x, top - 1, pine.frac(0.26))
            if rng.random() < 0.4:
                canvas.put(x, top - 2, pine.frac(0.34))


def main() -> None:
    canvas, palette = compose()
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas.save(RENDERS / "room-29-high-ridge.png", palette)
    canvas.save(RENDERS / "room-29-high-ridge@4x.png", palette, scale=4)
    native = ROOT / "art" / "backgrounds" / "room-29-high-ridge.png"
    canvas.save(native, palette)
    print(f"wrote renders/room-29-high-ridge@4x.png and {native.relative_to(ROOT)}")
    print(f"colours used: {len(canvas.used_indices())}")


if __name__ == "__main__":
    main()
