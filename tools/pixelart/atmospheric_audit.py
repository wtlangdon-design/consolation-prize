"""Errata 33b: no scenery may be lighter than the sky.

The rule was already stated -- in street_scene.py's own comment, and in the
fix that gave Main Street its sky -- and nothing checked it, so the Company
facade sat at 219.5 against a sky whose p90 is 156 and was the brightest
object in the world.

TWO THINGS THE CHECK MUST GET RIGHT, and a naive version gets both wrong.

WHERE THE SKY IS. Measured over rows the room DECLARES as sky rather than
over everything above the `horizon` field: Main Street's false fronts reach
into the top third of the frame, so "above the horizon" includes buildings
and the check would end up grading the facade against itself.

AND WHERE THE SKYLINE IS. The rule is about things standing AGAINST the sky
-- a building, a hill, a steeple. It is not about the ground. Applied to
everything below the sky it failed Room 1 on twenty thousand pixels of
moonlit road, which is a lit plane in front of the viewer and is not seen
against anything. So the room declares the band the rule governs, and it is
the band where scenery meets air.

WHAT IS EXEMPT. Room 1's brightest object below the sky is Hob's lamp at
205.1 against a night sky p90 of 42.7, and that is CORRECT -- a source is
supposed to out-blaze a night sky, and errata 33a is about to widen the gap.
So light sources and their falloff are exempt, and the exemption is DECLARED
IN THE ROOM FILE rather than inferred from brightness. Inferred, the check
would excuse exactly what it exists to catch: the Company facade is bright,
so a brightness-based exemption forgives it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def luminance_table() -> list[float]:
    palette = json.loads((ROOT / "art/palette/consolation-256.json").read_text(encoding="utf-8"))
    return [0.2126 * int(c[1:3], 16) + 0.7152 * int(c[3:5], 16) + 0.0722 * int(c[5:7], 16)
            for c in palette["colours"]]


def rooms() -> list[dict]:
    manifest = json.loads((ROOT / "content/manifest.json").read_text(encoding="utf-8"))
    out = []
    for relative in manifest["rooms"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if data.get("atmosphere") and data.get("background"):
            out.append(data)
    return out


def audit(verbose: bool = True) -> int:
    lum = luminance_table()
    failures = 0
    checked = 0

    for room in rooms():
        image = Image.open(ROOT / room["background"])
        image = image.convert("P") if image.mode != "P" else image
        pixels = image.load()
        width, height = image.size
        checked += 1

        top, bottom = room["atmosphere"]["skyRows"]
        sky = sorted(lum[pixels[x, y]] for y in range(top, bottom) for x in range(width))
        ceiling = sky[9 * len(sky) // 10]
        skyline_top, skyline_bottom = room["atmosphere"]["skylineRows"]

        exempt = [(s["rect"][0], s["rect"][1], s["rect"][0] + s["rect"][2],
                   s["rect"][1] + s["rect"][3]) for s in room.get("lightSources", [])]

        def excused(x: int, y: int) -> bool:
            return any(x0 <= x < x1 and y0 <= y < y1 for x0, y0, x1, y1 in exempt)

        over: dict[int, int] = {}
        worst = (0.0, 0, 0)
        for y in range(skyline_top, min(skyline_bottom, height)):
            for x in range(width):
                value = lum[pixels[x, y]]
                if value <= ceiling or excused(x, y):
                    continue
                over[pixels[x, y]] = over.get(pixels[x, y], 0) + 1
                if value > worst[0]:
                    worst = (value, x, y)

        if verbose:
            print(f"\n{room['id']}")
            print(f"  sky p90, rows {top}-{bottom}      {ceiling:.1f}")
            print(f"  skyline band              rows {skyline_top}-{skyline_bottom}")
            print(f"  light sources exempt      {len(exempt)}")
        if over:
            failures += 1
            if verbose:
                print(f"  FAIL  {sum(over.values())} scenery px over the sky, "
                      f"worst {worst[0]:.1f} at ({worst[1]},{worst[2]})")
                for index, count in sorted(over.items(), key=lambda kv: -lum[kv[0]])[:4]:
                    print(f"        idx {index:3d}  L {lum[index]:6.1f}  x{count}")
        elif verbose:
            print("  pass  nothing below the sky is lighter than it")

    if verbose:
        print(f"\n{failures} of {checked} room(s) with scenery over the sky")
    return failures


if __name__ == "__main__":
    sys.exit(1 if audit() else 0)
