"""The Nugget, moving. Errata ruling 20, as something a person can watch.

The room composes to a still PNG and the four animated men live in a sheet, so
neither render shows what ruling 20 actually asks for -- four figures shifting
on four different beats, none of them together. This composites the sheet over
the background at real wall-clock rates, one GIF frame per instant the picture
changes, and writes the sheet itself alongside so the two frames can be
compared held still.
"""

from __future__ import annotations

import random
from fractions import Fraction

import idles
import room03_nugget
from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS

ROOM_ID = "nugget"
#: Long enough to see every figure change several times and to see that they
#: never agree. Not a true loop -- four incommensurate rates do not have a
#: short one, and a GIF that stutters at the seam is worse than one that does
#: not quite close.
SPAN = Fraction(24)


def frame_index(figure: dict, when: Fraction) -> int:
    rate = Fraction(figure["rate"]).limit_denominator(1000)
    phase = Fraction(figure.get("phase", 0)).limit_denominator(1000)
    return int((when * rate + phase) * 2) % 2


def main() -> None:
    palette = Palette.load()
    base, _, _ = room03_nugget.compose()
    sheet = idles.sheet(ROOM_ID, palette, random.Random(room03_nugget.SEED ^ 0x20))
    _, figures = idles.load(ROOM_ID)

    # Every instant any figure changes pose.
    instants = {Fraction(0)}
    for figure in figures:
        step = 1 / (Fraction(figure["rate"]).limit_denominator(1000) * 2)
        tick = Fraction(0)
        while tick < SPAN:
            instants.add(tick)
            tick += step
    ordered = sorted(instants)

    images, delays = [], []
    for position, when in enumerate(ordered):
        canvas = IndexedCanvas(base.width, base.height)
        for y in range(base.height):
            for x in range(base.width):
                canvas.put(x, y, base.get(x, y))
        for figure in figures:
            sx, sy, width, height = figure["frames"][frame_index(figure, when)]
            cell = IndexedCanvas(width, height)
            for y in range(height):
                for x in range(width):
                    cell.put(x, y, sheet.get(sx + x, sy + y))
            at_x, feet = figure["at"]
            canvas.blit(cell, at_x - width // 2, feet - height + 1,
                        transparent=idles.TRANSPARENT)
        images.append(canvas.to_image(palette).convert("RGB").resize(
            (base.width * 2, base.height * 2)))
        nxt = ordered[position + 1] if position + 1 < len(ordered) else SPAN
        delays.append(int(round(float(nxt - when) * 1000)))

    RENDERS.mkdir(parents=True, exist_ok=True)
    path = RENDERS / "room-03-nugget-idles.gif"
    images[0].save(path, save_all=True, append_images=images[1:],
                   duration=delays, loop=0, disposal=1, optimize=False)
    print(f"wrote renders/{path.name}")
    print(f"  {len(images)} distinct pictures over {float(SPAN):.0f}s")
    for figure in figures:
        print(f"  {figure['id']:<12}{figure['rate']} Hz, phase {figure.get('phase', 0)}, "
              f"at {figure['at']}")
    print("  the man on the landing is not in this list and never will be -- ruling 20")


if __name__ == "__main__":
    main()
