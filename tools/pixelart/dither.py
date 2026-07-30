"""Ordered (Bayer) dithering.

Ordered, never error-diffused. Doc 11 is specific about this and the reason
is visual, not technical: Floyd-Steinberg scatters isolated pixels in a way
that reads as JPEG noise at 320x144, while a Bayer matrix produces the
regular crosshatch the eye recognises as period dithering.

A dither here always mixes two *adjacent steps of one ramp*. Mixing distant
steps produces visible speckle; mixing across families produces mud.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from palette import Ramp

BAYER_2 = [
    [0, 2],
    [3, 1],
]

BAYER_4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]

BAYER_8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
]


class Bayer:
    def __init__(self, matrix: list[list[int]]) -> None:
        self.matrix = matrix
        self.size = len(matrix)
        self.levels = self.size * self.size

    def threshold(self, x: int, y: int) -> float:
        """Threshold in 0.0-1.0 for this pixel's position in the matrix."""
        return (self.matrix[y % self.size][x % self.size] + 0.5) / self.levels


BAYER2 = Bayer(BAYER_2)
BAYER4 = Bayer(BAYER_4)
BAYER8 = Bayer(BAYER_8)


def dither_pixel(canvas: IndexedCanvas, x: int, y: int, ramp: Ramp, position: float, bayer: Bayer = BAYER4) -> None:
    """Writes one pixel as a dithered blend between two adjacent ramp steps."""
    low, high, blend = ramp.span(position)
    canvas.put(x, y, high if blend > bayer.threshold(x, y) else low)


def dither_rect(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    position: float,
    bayer: Bayer = BAYER4,
) -> None:
    """Fills a rect with one dithered tone."""
    for row in range(y, y + height):
        for col in range(x, x + width):
            dither_pixel(canvas, col, row, ramp, position, bayer)


def vertical_gradient(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    top: float,
    bottom: float,
    bayer: Bayer = BAYER8,
) -> None:
    """Dithered vertical ramp. The workhorse for skies."""
    for row in range(height):
        position = top + (bottom - top) * (row / max(1, height - 1))
        for col in range(x, x + width):
            dither_pixel(canvas, col, y + row, ramp, position, bayer)


def horizontal_gradient(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    ramp: Ramp,
    left: float,
    right: float,
    bayer: Bayer = BAYER4,
) -> None:
    for col in range(width):
        position = left + (right - left) * (col / max(1, width - 1))
        for row in range(y, y + height):
            dither_pixel(canvas, x + col, row, ramp, position, bayer)


def speckle(
    canvas: IndexedCanvas,
    x: int,
    y: int,
    width: int,
    height: int,
    index: int,
    rng,
    density: float,
) -> None:
    """Scattered single pixels -- grit, wear, nail heads, mud texture."""
    count = int(width * height * density)
    for _ in range(count):
        canvas.put(x + rng.randrange(width), y + rng.randrange(height), index)
