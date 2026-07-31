"""Light that falls off from sources, for interiors.

The exterior work had one light: the sun, infinitely far away, raking from
frame left. Every surface got a fixed lit edge and a fixed shade edge and
that was the whole model. Indoors that model is useless -- a chandelier
eight feet up lights the table under it and not the corner, and a window
throws a shaft that lands somewhere specific and leaves the rest dim.

So lighting here is a separate pass over a finished flat composition:

  1. Draw the room with every material at its own authored tone, unlit.
  2. Accumulate a floating-point illumination field -- ambient, plus each
     source with distance falloff, plus any window shafts.
  3. Walk the field and step each pixel along ITS OWN family ramp by the
     amount the field says.

Step three is the part that keeps this legal on a locked palette. A light
never blends toward white and never tints; it moves mahogany further up the
mahogany ramp and leaves it mahogany. That is the same rule the exterior
shadows used, run in the other direction and driven by a field instead of a
surface normal.

Quantising a smooth falloff into whole ramp steps would band badly -- four
visible contour rings around every lamp -- so the fractional part of each
step is resolved with an ordered Bayer threshold. Same dither as everywhere
else, doing the job it is actually good at.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from canvas import IndexedCanvas
from dither import BAYER4, BAYER8, Bayer
from palette import Palette

#: Ramp steps per unit of illumination above or below ambient-neutral (1.0).
#: Six means a source at double strength lifts a material six steps up its
#: ramp, which on a 20-step family is a strong but not blown-out highlight.
STEP_SCALE = 6.0

#: Illumination is clamped here. Without a ceiling a lamp's centre pixel
#: divides by nearly zero and punches a white hole in the middle of it.
MAX_LEVEL = 2.1
MIN_LEVEL = 0.10


@dataclass(frozen=True)
class Lamp:
    """A point source. `radius` is where it has fallen to roughly nothing."""

    x: int
    y: int
    radius: float
    intensity: float
    #: Vertical squash. A hanging lamp in a 320x144 room lights a floor
    #: ellipse, not a circle -- the room is far wider than it is tall and a
    #: circular pool reads as a ball of light rather than a lit floor.
    squash: float = 1.7


@dataclass(frozen=True)
class Shaft:
    """A slab of window light: a parallelogram, plus the dust in it.

    Defined by the opening it comes through and the direction it travels,
    rather than by its four corners, because a window that moves should drag
    its own light with it instead of needing the shaft re-authored.
    """

    x: int
    y: int
    width: int
    length: float
    #: Direction of travel in pixels-per-pixel. Positive dy is downward.
    dx: float
    dy: float
    intensity: float
    spread: float = 0.35


class LightField:
    """Per-pixel illumination, 1.0 meaning 'the material as authored'."""

    def __init__(self, width: int, height: int, ambient: float = 1.0) -> None:
        self.width = width
        self.height = height
        self.level = [[ambient] * width for _ in range(height)]

    # -- accumulation -------------------------------------------------------

    def add_lamp(self, lamp: Lamp) -> None:
        """Smooth falloff, squashed vertically, added to whatever is there."""
        reach = int(lamp.radius) + 1
        for y in range(max(0, lamp.y - int(reach / lamp.squash) - 1),
                       min(self.height, lamp.y + int(reach / lamp.squash) + 2)):
            row = self.level[y]
            for x in range(max(0, lamp.x - reach), min(self.width, lamp.x + reach + 1)):
                dx = (x - lamp.x) / lamp.radius
                dy = (y - lamp.y) * lamp.squash / lamp.radius
                distance = math.hypot(dx, dy)
                if distance >= 1.0:
                    continue
                # Smoothstep rather than inverse-square: physically wrong,
                # but inverse-square at this scale puts everything in the
                # first four pixels and leaves the rest flat.
                fade = 1.0 - distance
                row[x] += lamp.intensity * fade * fade * (3.0 - 2.0 * fade) / 2.0

    def add_shaft(self, shaft: Shaft) -> None:
        """A parallelogram of light travelling from an opening.

        Falls off along its length and softens across its width, so the far
        end of the shaft dissolves instead of stopping at a hard line.
        """
        run = math.hypot(shaft.dx, shaft.dy)
        if run == 0:
            return
        ux, uy = shaft.dx / run, shaft.dy / run
        # Perpendicular, for measuring how far across the shaft a pixel is.
        px, py = -uy, ux

        for y in range(self.height):
            row = self.level[y]
            for x in range(self.width):
                ox, oy = x - shaft.x, y - shaft.y
                along = ox * ux + oy * uy
                if along < 0 or along > shaft.length:
                    continue
                across = abs(ox * px + oy * py)
                # The beam widens as it travels, as a real one does.
                half = shaft.width / 2 + along * shaft.spread
                if across > half:
                    continue
                edge = 1.0 - (across / half) ** 2
                reach = 1.0 - (along / shaft.length) ** 1.4
                row[x] += shaft.intensity * edge * reach

    def add_glow_strip(self, x: int, y: int, width: int, height: int, intensity: float) -> None:
        """A soft rectangle, for a stove door or a lamp behind glass."""
        for row_y in range(max(0, y), min(self.height, y + height)):
            for col_x in range(max(0, x), min(self.width, x + width)):
                self.level[row_y][col_x] += intensity

    def scale_below(self, y: int, factor: float) -> None:
        """Multiplies everything below a line. Floors read darker than walls
        at the same illumination because they are lit at a glancing angle."""
        for row_y in range(max(0, y), self.height):
            row = self.level[row_y]
            for x in range(self.width):
                row[x] *= factor

    # -- application --------------------------------------------------------

    def apply(self, canvas: IndexedCanvas, palette: Palette, bayer: Bayer = BAYER4) -> None:
        """Steps every pixel along its own family ramp by the field."""
        for y in range(min(self.height, canvas.height)):
            row = self.level[y]
            for x in range(min(self.width, canvas.width)):
                level = max(MIN_LEVEL, min(MAX_LEVEL, row[x]))
                exact = (level - 1.0) * STEP_SCALE
                base = math.floor(exact)
                frac = exact - base
                steps = base + (1 if frac > bayer.threshold(x, y) else 0)
                if steps == 0:
                    continue
                index = canvas.pixels[y][x]
                canvas.pixels[y][x] = (
                    palette.lighten(index, steps) if steps > 0 else palette.darken(index, -steps)
                )

    def sample(self, x: int, y: int) -> float:
        return self.level[y][x]


def dust_motes(
    canvas: IndexedCanvas, palette: Palette, shaft: Shaft, rng, density: float = 0.05,
) -> None:
    """Individual lifted pixels inside a shaft.

    Doc 05 calls the light in this room dusty and that is the whole reason
    the shaft is visible at all -- a beam of light in clean air is invisible.
    Drawn after the lighting pass so the motes sit a step above the shaft
    they are in rather than being lifted twice.
    """
    run = math.hypot(shaft.dx, shaft.dy)
    ux, uy = shaft.dx / run, shaft.dy / run
    px, py = -uy, ux
    steps = int(shaft.length)
    for step in range(steps):
        half = shaft.width / 2 + step * shaft.spread
        for _ in range(int(half * density) + 1):
            if rng.random() > 0.30:
                continue
            offset = rng.uniform(-half, half)
            x = int(shaft.x + ux * step + px * offset)
            y = int(shaft.y + uy * step + py * offset)
            if 0 <= x < canvas.width and 0 <= y < canvas.height:
                canvas.put(x, y, palette.lighten(canvas.get(x, y), 2))


def lamp_core(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, family: str, radius: int = 1,
) -> None:
    """The visible body of a flame, which is not the same thing as its light.

    The field lifts surrounding materials; this puts the actual bright spot
    in, at the top of a warm family so it reads as the source rather than as
    the brightest lit thing nearby.
    """
    ramp = palette.family(family)
    canvas.put(x, y, ramp.at(ramp.count - 1))
    for offset_x, offset_y in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        if radius > 0:
            canvas.put(x + offset_x, y + offset_y, ramp.at(ramp.count - 3))


def collar(
    canvas: IndexedCanvas,
    palette: Palette,
    x: int,
    y: int,
    inner: int,
    outer: int,
    steps: int = 3,
    keep=None,
) -> int:
    """Errata 33a. A dark ring immediately outside a source. Returns pixels moved.

    THE CORE WAS NEVER THE PROBLEM. Hob's lamp measures 205.1, which is
    exactly accent_gold's ceiling, and a swap to bone at 231 was on the table
    and is not needed: core-to-surround is already 124. What was wrong is
    where the surround falls. The ground immediately around the lamp sat at
    81 in a frame whose median is 53 -- the lamp was in one of the LIGHTER
    parts of the picture, so it read as a pale object rather than as a hole
    punched in the night.

    In the reference the window blazes at about 200 and the wall runs right
    up to the frame at 40. There is a hard dark edge between the source and
    everything else, and the glow starts on the far side of it.

    So: the lighting pass lifts the whole neighbourhood, and this takes it
    back for a few pixels. Physically it is a lantern's ironwork and the
    shadow it throws on what it stands on. Compositionally it is the only
    thing that makes 205 read as a source.

    `keep` protects the source itself -- the collar is what is around a lamp,
    never the lamp.
    """
    moved = 0
    for row in range(y - outer, y + outer + 1):
        for col in range(x - outer, x + outer + 1):
            distance = math.hypot(col - x, (row - y) * 1.15)
            if distance < inner or distance > outer:
                continue
            if keep is not None and keep(col, row):
                continue
            # Hardest against the source, easing out, so the ring is an edge
            # rather than a band -- a uniformly dark annulus reads as a hole
            # cut in the ground, which is a different mistake.
            fade = 1.0 - (distance - inner) / max(1e-6, outer - inner)
            depth = max(1, round(steps * fade))
            canvas.put(col, row, palette.darken(canvas.get(col, row), depth))
            moved += 1
    return moved
