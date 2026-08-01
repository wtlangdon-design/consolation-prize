"""Room 1 — Stage Road & Coach Stop. Night. The only night exterior.

A SHIM. The drawing lives in the `room01` package: eleven region modules
over one shared contract in `room01/layout.py`, one file per author, so that
nine people can work on one picture at once without editing one another's
lines. This file is what the rest of the toolchain already imports, and its
job is to keep on meaning exactly what it meant.

    room01_ab.py        the blind A/B harness
    room01_ambient.py   errata 35's motion frames
    cycling_render.py   doc 18's cycle GIF and states sheet
    void_audit.py       errata 40
    overlap_audit.py    errata 32a and 32b
    shadow_audit.py     ruling 21b
    legibility_audit.py rulings 16, 17c and 18

Six of those import `compose` and three read module constants off this file.
None of them should have to know the room was rebuilt, so the surface below
is unchanged: `compose`, `main`, and WIDTH, HEIGHT, HORIZON, ROAD_Y,
AMBIENT, SEED, LAMP, COACH_X, LAMP_BAND, PUDDLE_BAND, FOREGROUND.

WHAT main() WRITES, and why each one exists:

  renders/room-01-stage-road.png (+ @4x)   the review render, coach present.
  art/backgrounds/room-01-stage-road.png   the SHIPPING background, and it
      is the COACH-DEPARTED composition. Errata 31d: the coach is an object
      state, not background art. It was painted in, so when T_COACH_DEPARTED
      flipped, the hotspot correctly became THE ROAD WEST OUT and answered
      "Gone. It made very good time on the way out." while a coach sat in
      the frame -- ruling 19b in reverse, and the sort of thing that passes
      every check because nothing checks the picture against the line.
  art/foregrounds/room-01-stage-road.png   ruling 21a's near plane, RGBA,
      keyed on index 255, because it draws on the far side of the actor and
      cannot travel in the background PNG.
  art/objects/room-01-coach.png            the coach layer, computed as the
      DIFFERENCE between the two composes. Differencing rather than drawing
      the coach onto a transparent canvas, because the coach is lit by the
      same pass as everything else and carries its own lamps: the pixels
      that change are the coach, the team and the light they throw, which is
      exactly the set that should leave with it. Drawn separately it would
      have to be lit separately, and the seam between two lighting passes is
      the kind of thing nobody sees until the coach goes.
"""

from __future__ import annotations

from pathlib import Path

import room01
from canvas import IndexedCanvas
from palette import Palette
from renders import BACKGROUNDS, FOREGROUNDS, RENDERS
from room01 import layout

OBJECTS = BACKGROUNDS.parent / "objects"

ROOT = Path(__file__).resolve().parents[2]

WIDTH, HEIGHT = layout.WIDTH, layout.HEIGHT
SEED = layout.SEED

#: The room file's declared horizon, and where its road_far zone begins. Not
#: measurements of this drawing -- the engine uses them for actor scaling and
#: the room JSON is authoritative.
HORIZON = layout.HORIZON
ROAD_Y = layout.ROAD_Y

#: The old whole-frame lighting multiplier. The rebuild has no global
#: ambient: the sky is authored as a gradient, the ground as a graded field,
#: and the one light in the frame is the lantern's pool. Kept at its old
#: value so nothing that reads it changes meaning; nothing in `room01`
#: consults it.
AMBIENT = layout.AMBIENT

#: Hob's lamp, mid-crossing, and where the coach stands. The engine animates
#: him; this is where he is for the reference render. LAMP is the flame's hot
#: core (hob.md §2 item 16); COACH_X is the coach's front corner post
#: (coach.md §2.8), which is the vehicle's leading edge.
LAMP = layout.FLAME_CENTRE
COACH_X = layout.COACH_FRONT_POST[0]

#: The two reserved cycling bands, doc 18. Derived from the same declaration
#: content/rooms/stage-road.json gives the engine rather than typed twice,
#: because two copies of a palette range is exactly the sort of thing that
#: stays right for one commit. accent_gold 4-7 for the flame, accent_indigo
#: 2-4 for the road's standing water.
LAMP_BAND = list(layout.LAMP_BAND)
PUDDLE_BAND = list(layout.PUDDLE_BAND)

#: Ruling 21a's near plane, from the last compose. Set by compose(), read by
#: main(); it is an attribute rather than a return value because that is how
#: it has always been read.
FOREGROUND: IndexedCanvas | None = None


def compose(with_coach: bool = True, lamp_x: int | None = None,
            swing: int = 0, graze: tuple[int, int] = (0, 0),
            tracked: bool = False) -> tuple[IndexedCanvas, Palette]:
    """The whole frame. See room01/__init__.py for the draw order."""
    global FOREGROUND
    canvas, palette = room01.compose(with_coach=with_coach, lamp_x=lamp_x,
                                     swing=swing, graze=graze, tracked=tracked)
    FOREGROUND = room01.FOREGROUND
    return canvas, palette


def main() -> None:
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas, palette = compose(with_coach=True)
    canvas.save(RENDERS / "room-01-stage-road.png", palette)
    canvas.save(RENDERS / "room-01-stage-road@4x.png", palette, scale=4)
    FOREGROUND.save_rgba(FOREGROUNDS / "room-01-stage-road.png", palette)

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
    print(f"  median perceptual luminance {_median(canvas, palette):.1f} "
          f"(reference {layout.FRAME_MEDIAN})")


def _median(canvas: IndexedCanvas, palette: Palette) -> float:
    """The one whole-frame number worth printing on every render.

    Study §7.1: the most likely failure in the whole rebuild is that the
    median lands high and the night reads as dusk. A median of 35 instead of
    26 is a nine-unit error that no single region will flag, and it is the
    hardest thing to see from inside. Reported every time, never
    auto-corrected.
    """
    values = sorted(palette.luminance(canvas.get(x, y))
                    for y in range(canvas.height) for x in range(canvas.width))
    return values[len(values) // 2]


if __name__ == "__main__":
    main()
