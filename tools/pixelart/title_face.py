"""The display face for CONSOLATION PRIZE. Signwriting, not a system font.

The 5x7 game font is built for density -- three lines of Thad inside 320px --
and set large it reads as a caption blown up. This is a separate face at 22
rows, and it is built from strokes rather than typed out as bitmaps: a stem,
a bar, a diagonal and a bowl, each with slab serifs, assembled per letter.

Strokes rather than hand-authored glyph blocks for two reasons. Twelve
letters at 18x22 is 264 rows of ASCII art that nobody will ever edit
correctly. And weight, serif depth and weathering become parameters, which
means the face can be tuned as a face instead of redrawn as twelve pictures.

WEATHERING is the point of the whole exercise. A painted sign on a frontier
building is not clean: the brush runs out at the end of a stroke, the boards
underneath show through, and the sun takes the top edges first. So each
glyph gets a deterministic per-letter erosion -- keyed on the character and
its position, so the same word always weathers identically and a render is
reproducible -- plus a baseline jitter so the line is set by a hand rather
than by a grid.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from palette import Ramp

#: Glyph cell. Wider and far taller than the 5x7 game font.
CELL_W, CELL_H = 18, 22
TRACK = 3
STEM = 4          # stroke weight
SERIF = 2         # how far a slab serif overhangs its stroke


class Pen:
    """Collects the filled cells of one glyph before any of it is drawn.

    A set rather than direct drawing so strokes can overlap freely -- a
    letter is a union of strokes and drawing them in sequence would let a
    later stroke's serif punch a hole in an earlier one.
    """

    def __init__(self) -> None:
        self.on: set[tuple[int, int]] = set()

    def rect(self, x: int, y: int, width: int, height: int) -> None:
        for row in range(y, y + height):
            for column in range(x, x + width):
                if 0 <= column < CELL_W and 0 <= row < CELL_H:
                    self.on.add((column, row))

    def stem(self, x: int, y: int = 0, height: int = CELL_H, serif: bool = True) -> None:
        self.rect(x, y, STEM, height)
        if serif:
            self.rect(x - SERIF, y, STEM + SERIF * 2, 2)
            self.rect(x - SERIF, y + height - 2, STEM + SERIF * 2, 2)

    def bar(self, y: int, x: int = 0, width: int = CELL_W) -> None:
        self.rect(x, y, width, STEM)

    def diagonal(self, x0: int, y0: int, x1: int, y1: int) -> None:
        steps = max(abs(x1 - x0), abs(y1 - y0))
        for step in range(steps + 1):
            walk = step / max(1, steps)
            self.rect(round(x0 + (x1 - x0) * walk), round(y0 + (y1 - y0) * walk), STEM, STEM)


def _glyph(character: str) -> Pen:
    """One letter, as strokes. Only the letters the title needs."""
    pen = Pen()
    right = CELL_W - STEM
    middle = (CELL_H - STEM) // 2
    bottom = CELL_H - STEM

    if character == "C":
        pen.bar(0); pen.bar(bottom); pen.stem(0, serif=False)
        pen.rect(right, 0, STEM, 5); pen.rect(right, bottom - 4, STEM, 5)
    elif character == "O":
        pen.bar(0); pen.bar(bottom); pen.stem(0, serif=False); pen.stem(right, serif=False)
    elif character == "N":
        pen.stem(0); pen.stem(right); pen.diagonal(0, 0, right, bottom)
    elif character == "S":
        pen.bar(0); pen.bar(middle); pen.bar(bottom)
        pen.rect(0, 0, STEM, middle); pen.rect(right, middle, STEM, bottom - middle)
    elif character == "L":
        pen.stem(0); pen.bar(bottom)
    elif character == "A":
        pen.diagonal(0, bottom, CELL_W // 2 - STEM // 2, 0)
        pen.diagonal(right, bottom, CELL_W // 2 - STEM // 2, 0)
        pen.bar(middle + 3, 2, CELL_W - 4)
    elif character == "T":
        pen.bar(0); pen.stem(CELL_W // 2 - STEM // 2, serif=False)
        pen.rect(CELL_W // 2 - STEM, bottom, STEM * 2, STEM)     # foot serif
    elif character == "I":
        pen.stem(CELL_W // 2 - STEM // 2, serif=False)
        pen.rect(CELL_W // 2 - STEM * 2, 0, STEM * 4, STEM)
        pen.rect(CELL_W // 2 - STEM * 2, bottom, STEM * 4, STEM)
    elif character == "P":
        pen.stem(0); pen.bar(0); pen.bar(middle)
        pen.rect(right, 0, STEM, middle + STEM)
    elif character == "R":
        pen.stem(0); pen.bar(0); pen.bar(middle)
        pen.rect(right, 0, STEM, middle + STEM)
        pen.diagonal(CELL_W // 2 - 1, middle, right, bottom)
    elif character == "Z":
        pen.bar(0); pen.bar(bottom); pen.diagonal(right, 0, 0, bottom)
    elif character == "E":
        pen.stem(0); pen.bar(0); pen.bar(middle, 0, CELL_W - 3); pen.bar(bottom)
    return pen


def _erode(character: str, index: int, cells: set[tuple[int, int]]) -> set[tuple[int, int]]:
    """Takes bites out of a glyph's edges, deterministically.

    Keyed on the character and its position in the word, never on a random
    source, so the same title always weathers the same way and the render is
    reproducible. Only EDGE cells are eligible: eating a hole in the middle
    of a stroke reads as damage to the image, while a bitten edge reads as
    paint that has been on a board through some winters.
    """
    seed = (ord(character) * 2654435761 + index * 40503) & 0xFFFFFFFF
    edges = [
        cell for cell in cells
        if not all((cell[0] + dx, cell[1] + dy) in cells
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    ]
    edges.sort()
    bitten = set()
    for position, cell in enumerate(edges):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        # Top edges weather harder than the rest: that is where the sun is.
        # Tuned down from 0.20/0.09: at that rate whole chunks left the
        # stems and it read as a damaged image rather than as weathered
        # paint. Weathering should be legible only on inspection.
        chance = 0.13 if cell[1] < 3 else 0.05
        if (seed % 1000) / 1000 < chance:
            bitten.add(cell)
    return cells - bitten


def measure(text: str) -> int:
    return len(text) * (CELL_W + TRACK) - TRACK


def draw(
    canvas: IndexedCanvas, text: str, x: int, y: int, face: Ramp, shadow: Ramp,
    weathered: bool = True,
) -> None:
    """Sets a line in the display face, with a drop shadow and a lit top edge.

    The shadow is structural, not decoration: the title sits over a landscape
    running roughly 30 to 190 in luminance across its width, and a
    single-colour title would vanish somewhere along it. An offset dark copy
    guarantees an edge everywhere regardless of what is behind.
    """
    layers = []
    cursor = x
    for index, character in enumerate(text):
        if character == " ":
            cursor += CELL_W + TRACK
            continue
        cells = _glyph(character).on
        if weathered:
            cells = _erode(character, index, cells)
        # Baseline jitter: one pixel, alternating and keyed on position, so
        # the line is set by a signwriter rather than by a grid.
        lift = ((ord(character) + index) % 3) - 1
        layers.append((cursor, lift, cells))
        cursor += CELL_W + TRACK

    for offset, ramp, tone in ((3, shadow, 0.03), (0, face, 0.80)):
        for left, lift, cells in layers:
            for column, row in cells:
                canvas.put(left + column + offset, y + row + lift + offset, ramp.frac(tone))

    # Lit top edge, applied only where the cell above is empty.
    for left, lift, cells in layers:
        for column, row in cells:
            if (column, row - 1) not in cells:
                canvas.put(left + column, y + row + lift, face.frac(0.97))
