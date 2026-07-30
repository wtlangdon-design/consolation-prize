"""Per-surface legibility, checked BEFORE composing. Errata ruling 17c.

17c's closing line: any interior placing a 150+ luminance surface where a
head falls must be checked before composition, not after. That is only
possible if a room can be described as a list of intended surfaces -- family
and tone -- and audited as a plan, which is what this module is.

The alternative is what happened with Room 3: compose it, measure it,
discover the bar top sits 5 luminance from Thad's face, and then be stuck
choosing between the composition and the character. Planning first makes
that a decision about a number in a table.

The lighting pass matters here. A surface authored at tone t is not seen at
tone t -- it is seen wherever the illumination field pushed it. So a plan
carries the ambient level it will be lit at, and the audit reports the LIT
luminance, which is the one the player's eye actually receives.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from lighting import MAX_LEVEL, MIN_LEVEL, STEP_SCALE
from palette import Palette


@dataclass(frozen=True)
class PlannedSurface:
    """A surface the room intends to have, before any of it is drawn."""

    name: str
    family: str
    tone: float
    #: Illumination this surface will sit at once the light pass has run.
    #: 1.0 is "as authored"; a room's ambient is typically below that.
    level: float = 1.0
    #: Whether a standing actor's head falls against this surface. 17c is
    #: specifically about the surfaces a head lands on.
    behind_head: bool = True


def lit_index(palette: Palette, family: str, tone: float, level: float) -> int:
    """The palette entry a surface actually ends up as, after lighting.

    Mirrors LightField.apply exactly, minus the Bayer term -- the dither
    only decides which of two adjacent steps a given pixel takes, so the
    un-dithered step is the right thing to plan against.
    """
    index = palette.family(family).frac(tone)
    clamped = max(MIN_LEVEL, min(MAX_LEVEL, level))
    steps = math.floor((clamped - 1.0) * STEP_SCALE)
    if steps > 0:
        return palette.lighten(index, steps)
    if steps < 0:
        return palette.darken(index, -steps)
    return index


def audit_plan(
    palette: Palette, room: str, surfaces: list[PlannedSurface],
    coat: float, face: float, margin: float = 25.0, verbose: bool = True,
) -> int:
    """Checks a planned room against a character's two anchors.

    Returns the number of surfaces where neither anchor separates. Anything
    above zero means the composition has to change before it is drawn, not
    after.
    """
    if verbose:
        print(f"{room} -- planned surfaces vs Thad (coat {coat:.0f}, face {face:.0f})")
        print(f"  {'surface':<22}{'family':<16}{'lit':>7}{'coat':>9}{'face':>9}   note")

    failures = 0
    for surface in surfaces:
        index = lit_index(palette, surface.family, surface.tone, surface.level)
        value = palette.luminance(index)
        coat_gap = value - coat
        face_gap = face - value
        coat_ok = coat_gap >= margin
        face_ok = face_gap >= margin

        if coat_ok and face_ok:
            note = "both"
        elif coat_ok:
            note = "coat carries"
        elif face_ok:
            note = "face carries"
        else:
            note = "NEITHER -- change before composing"
            if surface.behind_head:
                failures += 1
            else:
                note = "neither, but no head lands here"

        if verbose:
            print(f"  {surface.name:<22}{surface.family:<16}{value:>7.1f}"
                  f"{coat_gap:>+9.0f}{face_gap:>+9.0f}   {note}")

    if verbose:
        bright = [s for s in surfaces
                  if s.behind_head
                  and palette.luminance(lit_index(palette, s.family, s.tone, s.level)) >= 150]
        if bright:
            print(f"  {len(bright)} surface(s) at 150+ with a head against them: "
                  + ", ".join(s.name for s in bright))
        print(f"  {'PLAN OK' if failures == 0 else f'PLAN FAILS on {failures} surface(s)'}")
    return failures


def thad_anchors(palette: Palette) -> tuple[float, float]:
    """His darkest and lightest large masses, read from the sprite itself."""
    import actor

    figure = actor.at_height(palette, view=actor.FRONT, height=40, surface=actor.BOARDWALK)
    counts: dict[int, int] = {}
    for y in range(figure.height):
        for x in range(figure.width):
            index = figure.pixels[y][x]
            if index != actor.TRANSPARENT:
                counts[index] = counts.get(index, 0) + 1
    drawn = sum(counts.values())
    floor = max(2, drawn // 40)
    lums = [palette.luminance(i) for i, c in counts.items() if c >= floor]
    return min(lums), max(lums)
