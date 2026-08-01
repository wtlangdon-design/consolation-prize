"""Room 1 — the stage road at night. The compositor, and the draw order.

Eleven region modules, one shared contract in `layout`, and this file, which
knows the order they go down in and nothing else about any of them. Every
region exposes exactly `draw(canvas, ctx)` and owns nothing outside its own
file; every number two regions both need lives in `layout`.

THE ORDER, and the three places it is load-bearing rather than obvious:

    sky -> range_ -> town -> terrain -> road ->
    left_yard -> rail -> team -> coach -> hob ->
    LIGHTPASS -> void -> foreground

  1. THE GROUND GOES DOWN BEFORE ANYTHING STANDS ON IT. `terrain` and `road`
     author one continuous plane and five regions then occlude it. road.md
     §8: the top edge of the road region is not a boundary in the picture,
     the ground runs up past y=94 and is simply covered, and a road drawn as
     a self-contained band shows a step at the seam in both the value
     gradient and the rut spacing.

  2. THE LIGHT COMES AFTER THE DRAWING. Ruling 17a: the pass steps a colour
     along its own family ramp and cannot change hue, so every surface the
     lantern will ever touch has to be authored warm at its UNLIT value
     first. A region that authors its own lit values -- Hob's lamp-side rim,
     the sign post that stays at L 22-26 while the ground behind it climbs
     to 61 -- shields them through `ctx.shield`.

  3. THE FOREGROUND IS NOT IN THE BACKGROUND. Ruling 21a's near plane draws
     over the actor, so it lives on its own canvas with a transparency key
     and is composited into the review render only. The shipping asset is a
     separate RGBA file with holes in it.

TOLERANT MODE. With ROOM01_TOLERANT=1 in the environment, each region's
draw() is wrapped in try/except: the failing region and its traceback go to
stderr and the compose carries on without it. It exists because nine authors
edit nine modules in one tree at once, and a neighbour's half-finished file
must not block anybody's render.

IT IS OFF BY DEFAULT AND MUST STAY OFF. Every render, every audit and
`npm run validate` run with it unset, so an exception propagates and the
build stops. A compositor that swallows exceptions by default produces a
picture with a region missing and reports success, and the missing region is
exactly the one nobody notices is missing.
"""

from __future__ import annotations

import os
import sys
import traceback

import cycling
import void
from canvas import IndexedCanvas
from palette import Palette
from primitives import enforce_sky_ceiling

from . import (coach, foreground, hob, layout, left_yard, lightpass, rail,
               range_, road, sky, team, terrain, town)

ROOM_ID = "stage_road"

#: The environment variable, named once. See the docstring: it is a
#: concurrency tool for nine authors, not a robustness feature.
TOLERANT_ENV = "ROOM01_TOLERANT"

#: (name, module). The name is what tolerant mode prints and what a reader
#: checks the order against; it is not otherwise used.
REGIONS = (
    ("sky", sky),
    ("range", range_),
    ("town", town),
    ("terrain", terrain),
    ("road", road),
    ("left_yard", left_yard),
    ("rail", rail),
    ("team", team),
    ("coach", coach),
    ("hob", hob),
)

#: Ruling 21a's near plane, from the last compose. A module attribute rather
#: than a return value because six other tools already read it that way.
FOREGROUND: IndexedCanvas | None = None


def tolerant() -> bool:
    return os.environ.get(TOLERANT_ENV) == "1"


def _run(name: str, draw, canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    if not tolerant():
        draw(canvas, ctx)
        return
    try:
        draw(canvas, ctx)
    except Exception:                                   # noqa: BLE001
        print(f"{TOLERANT_ENV}=1: region {name!r} raised and was skipped; "
              f"the frame is missing it", file=sys.stderr)
        traceback.print_exc()


def compose(with_coach: bool = True, lamp_x: int | None = None,
            swing: int = 0, graze: tuple[int, int] = (0, 0),
            tracked: bool = False) -> tuple[IndexedCanvas, Palette]:
    global FOREGROUND

    palette = Palette.load()
    ctx = layout.context(palette, with_coach=with_coach, lamp_x=lamp_x,
                         swing=swing, graze=graze, tracked=tracked)
    canvas = IndexedCanvas(layout.WIDTH, layout.HEIGHT,
                           fill=palette.family("void").at(0))

    for name, module in REGIONS:
        _run(name, module.draw, canvas, ctx)

    _run("lightpass", lightpass.draw, canvas, ctx)
    _run("void", _void_pools, canvas, ctx)

    plane = IndexedCanvas(layout.WIDTH, layout.HEIGHT,
                          fill=foreground.TRANSPARENT)
    _run("foreground", foreground.draw, plane, ctx)
    FOREGROUND = plane
    canvas.blit(plane, 0, 0, transparent=foreground.TRANSPARENT)

    # ERRATA 33b, enforced rather than remembered: no building and no hill
    # may be lighter than the sky. A rule nobody checks is already broken
    # somewhere nobody has looked -- Room 1's old hills were drawn in the sky
    # family and came out at 148-172 against a night sky of 42.7, and the
    # code called them "nearly silhouettes". The exemptions are DECLARED, in
    # layout §11, never inferred from brightness.
    enforce_sky_ceiling(canvas, palette, layout.SKY_CEILING_ROWS,
                        layout.SKYLINE_ROWS, exempt=layout.SKY_CEILING_EXEMPT)

    # Doc 18 note 1, enforced before anything is written: a reserved index
    # may appear only inside its own element. reserve() moves trespassers,
    # verify() proves none are left.
    elements = cycling.load(ROOM_ID, palette)
    cycling.reserve(canvas, palette, elements)
    cycling.verify(canvas, elements)

    return canvas, palette


def _void_pools(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """Errata 40's large connected regions of near-void, stamped after the light.

    NOT A DARKENING PASS. Stepping every material down its own ramp moves the
    histogram and changes nothing anybody looks at: the Nugget already had
    13.1% of its frame under luminance 12, in TWELVE HUNDRED components
    scattered through a dither, and measured it looked nearly right while
    looked at it had no black in it. The reference has its darkest tenth in a
    handful of big connected pools and every other thing in the picture is
    seen AGAINST those pools.

    SO THE POOLS ARE THE ONES THE FRAME ACTUALLY HAS. The whole-frame study
    §1 lists the eight largest by size and location, and four of them are in
    reach of a night exterior on this palette:

        171 px  x 8-24,   y 92-122   left timber structure base
        119 px  x 11-31,  y 35-47    left structure against the sky
        100 px  x 25-37,  y 64-92    sign post / gantry upright
        188 px  x 253-262, y 59-86   coach door and window opening

    The last is already `void` -- `coach` draws it, because at Lmed 2.6 it is
    the story beat rather than a shadow. The first three are deepened here.

    THE TWO LARGEST IN THE REFERENCE ARE THE TOP OF THE SKY, 1,811 px across
    y 0-8, AND THEY ARE OUT OF REACH. sky.md §4 and §6.5: `accent_indigo[0]`
    at L 21.65 is the palette floor for a saturated night blue, reaching L 9
    needs a 53% black checker across the top of the frame, an exhaustive
    search over every two-colour dither in the palette found nothing better,
    and mixing in `void` buys luminance by destroying the blue. So the
    frame's darkest decile has to be built from objects, and it will measure
    higher than the reference's 11.85 no matter how this pass is tuned.
    That is a palette fact, not a composition choice, and it is reported by
    void_audit rather than corrected here.
    """
    # Never over a reserved band. Doc 18 gives the cycling elements their own
    # entries and the whole scheme depends on those pixels being exactly
    # those pixels -- which is why every function in void.py takes a `keep`.
    keep = lambda x, y: layout.keep_at(canvas, x, y)      # noqa: E731

    # ...AND NEVER OVER THE TWO WAGON WHEELS. This pass runs last, so it
    # stamps over finished drawing, and left_yard.md §7.6 makes the far
    # wheel's tyre arc at x 12-21 "the only evidence there are two wheels".
    # A shadow pool that deletes the object it is the shadow OF is the one
    # failure mode a whole-frame pass has that no region can see: the region
    # renders correctly on its own and is gone in the composite.
    fx, fy, frx, fry = layout.WAGON_WHEEL_FAR
    nx, ny, nrx, nry = layout.WAGON_WHEEL_NEAR
    wheels = (
        (fx - frx, fy - fry, frx * 2 + 1, fry * 2 + 1),
        (nx - nrx, ny - nry, nrx * 2 + 1, nry * 2 + 1),
    )

    def clear_of_wheels(x: int, y: int) -> bool:
        if keep(x, y):
            return True
        return any(x0 <= x < x0 + w and y0 <= y < y0 + h
                   for x0, y0, w, h in wheels)

    # The timber's base, study §1's 171 px component at x 8-24, y 92-122. It
    # runs off the bottom of the mass into the corner and is the near plane's
    # own shadow before the near plane exists.
    #
    # ITS FLOOR IS THE VERGE, NOT INDEX 0. The reference measures this
    # component at L 11-16 (block mean 18.3) and road.md §8 asks that neither
    # side of the bottom-left corner carry a visible edge. At index 0 it was
    # 15 luminance below the reference, it was the only place road's measured
    # verge value became invisible, and the 4x4 rim -- a 30-point checker
    # against ground at L 25-40 -- read as noise rather than as dark.
    # `verge_mud` is grey 0 at L 16.0 and warmth 0 against the reference's
    # 15.1 and +0.2: the same pool, at the value the frame actually has, and
    # its rim now dithers across about ten luminance instead of thirty.
    floor = ctx.ink("verge_mud")
    void.smear(canvas, 6, 96, 20, 14, keep=clear_of_wheels, floor=floor)
    void.smear(canvas, 8, 108, 17, 12, keep=clear_of_wheels, floor=floor)
    # The gantry upright's channel, continuous with the shadow slot above it.
    #
    # FLAT, AND IT STOPS AT x=30. layout.SHADOW_SLOT is x 25-29 and nothing
    # wider: x 31-36 is the signboard's lit face, and left_yard.md §3.1 makes
    # the board's left edge the single most important edge in the region.
    # These two pools were twelve wide and dithered, so they put an ordered
    # checkerboard across six columns of that face -- §5 measures zero
    # checkerboard content anywhere in the rect -- and softened the one edge
    # the region is built on. The slot's core measures flat near-black; a
    # gap between two solids has no floor to dissolve into.
    slot_x, _, slot_w, _ = layout.SHADOW_SLOT
    void.smear(canvas, slot_x, 66, slot_w, 10, keep=keep, solid=True)
    void.smear(canvas, slot_x, 78, slot_w, 12, keep=keep, solid=True)
    # The left structure read against the sky, from the top tread down.
    void.smear(canvas, 11, 43, 14, 5, keep=keep)
    # rail.md §2.7's pocket is the ground both bright bars are read against,
    # and its floor is what makes them read. It is a POCKET, not a hole:
    # measured mean L 28.4, so ONLY ITS DEEPEST CORNER goes to void. The
    # rect was 26 x 6 and took 60-90% of x 130-155 / y 96-101 -- the bucket
    # and the pocket floor -- to index 0, against a measured mean of 28.4,
    # and rail.md §8.11 forbids ordered dither in this region outright.
    void.smear(canvas, 130, 99, 8, 4, keep=keep)
    # NO POOL UNDER THE COACH. It is the obvious place for one and it is
    # wrong twice over. road.md §4.4: after [depth + lamp pool + left
    # falloff] the residual is within −8…+3 L everywhere in the open road --
    # the coach casts nothing, the team casts nothing, the figures cast
    # nothing, and the night is too diffuse and the lamp too small for
    # anything else. coach.md §9 goes further: the road is measurably
    # BRIGHTER under the coach (36.3) than to its right (32.5), because the
    # depth gradient wins over the object. The undercarriage band at rows
    # 81-83 is real, sits INSIDE the vehicle's silhouette, and belongs to
    # `coach`, which draws it at its measured L 16-19 rather than at void.
