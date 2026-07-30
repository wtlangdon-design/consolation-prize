"""Verifies the one rule the atmosphere depends on.

Nothing in the picture may out-light the sky. The moment a hill or a wall
does, aerial perspective inverts and the frame reads as lidded rather than
open -- which is exactly the failure this pass existed to fix. Eyeballing it
does not work, because a saturated mid-green can look darker than a pale
blue while measuring lighter.
"""

from __future__ import annotations

import sys

from palette import Palette
from street_scene import DAWN, DAY, LOTS


def luminance(rgb: tuple[int, int, int]) -> float:
    red, green, blue = rgb
    return 0.299 * red + 0.587 * green + 0.114 * blue


def audit(scheme) -> int:
    palette = Palette.load()
    sky = palette.family("sky")
    sky_lightest = luminance(palette.colours[sky.frac(scheme.sky_bottom)])

    rows: list[tuple[str, float]] = [
        ("far range", luminance(palette.colours[palette.family(scheme.far_hill).frac(scheme.far_tone)])),
        ("near range", luminance(palette.colours[palette.family(scheme.near_hill).frac(scheme.near_tone)])),
    ]
    for lot in LOTS:
        family = palette.family(scheme.swap.get(lot.wall, lot.wall))
        pale = scheme.pale_shift if lot.wall == "bone" else 0.0
        tone = max(0.06, lot.tone + scheme.facade_shift + pale)
        rows.append((lot.kind, luminance(palette.colours[family.frac(tone)])))

    failures = 0
    print(f"  sky at its lightest: {sky_lightest:6.1f}")
    for name, value in rows:
        ok = value < sky_lightest
        failures += 0 if ok else 1
        print(f"    {name:<12}{value:8.1f}  {'ok' if ok else 'LIGHTER THAN SKY'}")

    # Aerial perspective also requires the far range to be closer to the sky
    # than the near range is.
    far, near = rows[0][1], rows[1][1]
    if far <= near:
        print(f"    far range ({far:.1f}) is not paler than near ({near:.1f}) -- perspective inverted")
        failures += 1
    return failures


if __name__ == "__main__":
    total = 0
    for scheme in (DAY, DAWN):
        print(f"{scheme.name.upper()}")
        total += audit(scheme)
        print()
    print("PASS" if total == 0 else f"FAIL -- {total} violation(s)")
    sys.exit(0 if total == 0 else 1)
