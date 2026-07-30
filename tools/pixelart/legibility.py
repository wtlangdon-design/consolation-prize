"""Character legibility, per errata rulings 16, 17c and 18.

One module, because ruling 18b rule 3 says the sample geometry is part of
the check rather than incidental to it. Before this, every composed room
carried its own hand-written rectangles inside its own proof script, and
two of them were wrong in ways that produced confident, wrong answers:

  Room 5 -- the "counter top" sample included the counter's own dark lip and
            the "floor" sample sat on top of the counter. Two apparent
            FAILURES on surfaces that were fine.
  Room 1 -- the "verge" sample contained the lamp, so the verge measured 203
            and appeared to tie the lamp as the brightest object in the only
            night exterior in the game. An apparent PASS on a rule that was
            not actually being met.

Contamination is dangerous in both directions and looks identical to a real
result either way. So the geometry is declared here alongside the light
sources it must avoid, and overlaps are detected rather than remembered.

18a is the other half. A room passing on one anchor while the other fails
badly is a WEAK pass, and the whole point is that it must not look like a
strong one -- Room 1 shipped unplayable because it did.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from canvas import IndexedCanvas
from palette import Palette

#: Ruling 18a's thresholds.
STRONG = 25.0
WEAK_FLOOR = 15.0

#: A sample spanning more luminance than this probably contains two
#: materials. Not proof of contamination -- a genuinely dithered surface can
#: be wide -- but ruling 18b rule 2 says a surprising measurement is treated
#: as suspected contamination first and a finding second, and this is what
#: makes "surprising" mechanical.
SPREAD_LIMIT = 110.0


@dataclass(frozen=True)
class LightZone:
    """A source and the falloff around it, which samples must not contain."""

    name: str
    x: int
    y: int
    radius: int

    def contains(self, px: int, py: int) -> bool:
        return math.hypot(px - self.x, py - self.y) <= self.radius

    def overlaps(self, rect: tuple[int, int, int, int]) -> bool:
        x, y, w, h = rect
        # Nearest point of the rectangle to the source centre.
        near_x = min(max(self.x, x), x + w - 1)
        near_y = min(max(self.y, y), y + h - 1)
        return self.contains(near_x, near_y)


@dataclass(frozen=True)
class Surface:
    """A declared sample. `note` records WHY the rectangle is where it is."""

    name: str
    rect: tuple[int, int, int, int]
    note: str = ""
    #: Set when a head genuinely lands against this surface. Ruling 17c is
    #: specifically about the surfaces a character stands in front of.
    behind_head: bool = True


@dataclass
class Reading:
    surface: str
    p10: float
    p90: float
    dark_margin: float
    light_margin: float
    verdict: str
    warnings: list[str] = field(default_factory=list)


def percentiles(values: list[float]) -> tuple[float, float, float]:
    ordered = sorted(values)
    if not ordered:
        return 0.0, 0.0, 0.0
    return (sum(ordered) / len(ordered),
            ordered[len(ordered) // 10],
            ordered[len(ordered) * 9 // 10])


def anchors(palette: Palette, height: int = 40) -> tuple[float, float]:
    """The character's darkest and lightest LARGE masses.

    The coat BODY, not the outline ink. An earlier version took the minimum
    over every large index, which returned the near-black keyline at 9 and
    made every margin look 25 points healthier than it was -- Room 1 measured
    +14 on the ink where the coat proper was +7.
    """
    import actor

    figure = actor.at_height(palette, view=actor.FRONT, height=height, surface=actor.BOARDWALK)
    counts: dict[int, int] = {}
    for y in range(figure.height):
        for x in range(figure.width):
            index = figure.pixels[y][x]
            if index != actor.TRANSPARENT:
                counts[index] = counts.get(index, 0) + 1
    drawn = sum(counts.values())
    floor = max(4, drawn // 40)

    # A keyline is large by pixel count and is not something you see him by.
    #
    # Raising the size threshold does not separate the two -- the outline
    # wraps the whole figure and is one of the biggest colour counts on it.
    # What separates them is SHAPE: a keyline is entirely edge, so almost
    # none of its pixels have four neighbours of their own colour, while a
    # coat or a face is mostly interior. Room 1 measured +14 on the ink where
    # the coat proper was +7, which is the difference between a room that
    # looks fine and a room nobody can see the protagonist in.
    #
    # Measured at 40px: keyline 0.00, coat shade 0.00, sleeve 0.00 against
    # coat 0.27, boot 0.21, trousers 0.20, face 0.19. The threshold sits in
    # the gap. Ruling 16 rule 4 says the DARKEST large mass, so the anchor
    # comes out as the boot at 27 rather than the coat at 34 -- if his boots
    # vanish into the floor, part of him has vanished.
    def interior_fraction(index: int) -> float:
        cells = {(x, y) for y in range(figure.height) for x in range(figure.width)
                 if figure.pixels[y][x] == index}
        if not cells:
            return 0.0
        inside = sum(
            1 for (x, y) in cells
            if all((x + dx, y + dy) in cells for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        )
        return inside / len(cells)

    masses = [
        index for index, count in counts.items()
        if count >= floor and interior_fraction(index) >= 0.15
    ]
    lums = sorted(palette.luminance(index) for index in (masses or list(counts)))
    return lums[0], lums[-1]


def audit(
    canvas: IndexedCanvas, palette: Palette, room: str,
    surfaces: list[Surface], lights: list[LightZone],
    dark: float, light: float, verbose: bool = True,
) -> tuple[list[Reading], int, int]:
    """Measures every declared surface. Returns readings, fails, weak passes."""
    readings: list[Reading] = []
    for surface in surfaces:
        x, y, w, h = surface.rect
        warnings: list[str] = []

        # 18b rule 1: a sample containing a source is not a sample of the
        # surface. Detected, not remembered.
        for zone in lights:
            if zone.overlaps(surface.rect):
                warnings.append(f"CONTAMINATED by light source '{zone.name}'")

        values = [
            palette.luminance(canvas.get(px, py))
            for py in range(y, min(canvas.height, y + h))
            for px in range(x, min(canvas.width, x + w))
        ]
        _, p10, p90 = percentiles(values)
        if p90 - p10 > SPREAD_LIMIT:
            warnings.append(f"spread {p90 - p10:.0f} -- may span two materials")

        dark_margin = p10 - dark
        light_margin = light - p90
        best, worst = max(dark_margin, light_margin), min(dark_margin, light_margin)

        if best < STRONG:
            verdict = "FAIL"
        elif worst >= STRONG:
            verdict = "strong"
        elif worst < WEAK_FLOOR:
            # Ruling 18a's Room 1 case. Not a failure, but it must never look
            # like a strong pass -- that is exactly how Room 1 shipped.
            verdict = "WEAK"
        else:
            # 18a names strong, weak and fail but leaves the band between
            # 15 and 25 unnamed. Called "adequate" here: one anchor healthy,
            # the other thin but not alarming.
            verdict = "adequate"

        readings.append(Reading(surface.name, p10, p90, dark_margin, light_margin,
                                verdict, warnings))

    fails = sum(1 for r in readings if r.verdict == "FAIL" and not r.warnings)
    weak = sum(1 for r in readings if r.verdict == "WEAK" and not r.warnings)

    if verbose:
        print(f"{room} -- legibility (rulings 16, 17c, 18)")
        print(f"  anchors: darkest large mass {dark:.0f} (the boot; the coat body is 34),")
        print(f"           lightest large mass {light:.0f} (the face)")
        print(f"  {'surface':<20}{'p10':>7}{'p90':>7}{'dark':>8}{'light':>8}   verdict")
        for r in readings:
            print(f"  {r.surface:<20}{r.p10:>7.1f}{r.p90:>7.1f}"
                  f"{r.dark_margin:>+8.0f}{r.light_margin:>+8.0f}   {r.verdict}")
            for warning in r.warnings:
                print(f"      ! {warning}")
        contaminated = sum(1 for r in readings if r.warnings)
        print(f"  {len(readings)} surfaces: {fails} fail, {weak} weak, "
              f"{contaminated} flagged for contamination")
    return readings, fails, weak
