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
    sky = palette.family(scheme.sky_family)
    sky_lightest = luminance(palette.colours[sky.frac(scheme.sky_bottom)])

    rows: list[tuple[str, float]] = [
        ("far range", luminance(palette.colours[palette.family(scheme.far_hill).frac(scheme.far_tone)])),
        ("near range", luminance(palette.colours[palette.family(scheme.near_hill).frac(scheme.near_tone)])),
    ]
    for lot in LOTS:
        family = palette.family(scheme.swap.get(lot.wall, lot.wall))
        pale = scheme.pale_shift if lot.wall == "bone" else 0.0
        tone = max(0.06, scheme.tone_for(palette, lot.wall, lot.tone) + scheme.facade_shift + pale)
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


def scheme_saturation(scheme) -> float:
    """Mean saturation of every family the scheme actually paints with."""
    palette = Palette.load()
    families = [scheme.sky_family, scheme.far_hill, scheme.near_hill, "mud", "pine_weathered"]
    families += [lot.wall for lot in LOTS]
    total, count = 0.0, 0
    for name in families:
        ramp = palette.family(scheme.swap.get(name, name))
        total += palette.saturation(ramp.frac(0.55))
        count += 1
    return total / count


if __name__ == "__main__":
    total = 0
    for scheme in (DAY, DAWN):
        print(f"{scheme.name.upper()}")
        total += audit(scheme)
        print()

    palette = Palette.load()
    day_sky = luminance(palette.colours[palette.family(DAY.sky_family).frac(DAY.sky_bottom)])
    dawn_sky = luminance(palette.colours[palette.family(DAWN.sky_family).frac(DAWN.sky_bottom)])
    day_sat, dawn_sat = scheme_saturation(DAY), scheme_saturation(DAWN)

    print("DAY vs DAWN")
    print(f"  sky at horizon     day {day_sky:6.1f}   dawn {dawn_sky:6.1f}   "
          f"{'dawn is paler' if dawn_sky > day_sky else 'DAWN IS DARKER -- reads as dusk'}")
    if dawn_sky <= day_sky:
        total += 1
    print(f"  mean saturation    day {day_sat:6.3f}   dawn {dawn_sat:6.3f}   "
          f"cut {100 * (1 - dawn_sat / day_sat):.0f}%")
    print(f"  shadow tint        day {DAY.shadow_tint or 'in-material':>12}   dawn {DAWN.shadow_tint or 'in-material':>12}")
    print()
    print("PASS" if total == 0 else f"FAIL -- {total} violation(s)")
    sys.exit(0 if total == 0 else 1)
