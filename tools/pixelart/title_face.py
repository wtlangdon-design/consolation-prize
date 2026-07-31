"""The display face for THE LAST CLAIM IN CONSOLATION. Signwriting, not a font.

The 5x7 game font is built for density -- three lines of Thad inside 320px --
and set large it reads as a caption blown up. This is a separate face, built
from strokes rather than typed out as bitmaps: a stem, a bar, a diagonal and
a bowl, each with a cut terminal, assembled per letter.

Strokes rather than hand-authored glyph blocks for two reasons. Twelve letters
at 44x54 is two thousand rows of ASCII art that nobody will ever edit
correctly. And weight, terminal depth and weathering become parameters, which
means the face can be tuned as a face instead of redrawn as twelve pictures.

TWO SIZES, because doc 17's revised layout is a HIERARCHY and not a fit.
The 1990 original sets "THE SECRET OF" small and "MONKEY ISLAND" enormous;
the mistake this replaces was setting five words at one size and solving for
the width. CLAIM is huge and carries the title's double meaning -- a mining
claim and an assertion -- and the connective words are small.

CUT TERMINALS, not slabs. The previous face put a plain rectangle across the
end of every stroke, which is a slab sans: competent, and plainer than 1858.
A terminal here is a taper -- the outermost row overhangs furthest and each
row inward overhangs one less -- so the stroke ends in a point rather than a
kerb. That is what reads as cut by hand rather than set in a grid.

WEATHERING is the rest of it. A painted sign on a frontier building is not
clean: the brush runs out, the boards show through, and the sun takes the top
edges first. Each glyph gets a deterministic per-letter erosion, keyed on the
character and its position so the same word always weathers identically and
a render is reproducible, plus a baseline jitter so the line is set by a hand.
"""

from __future__ import annotations

from dataclasses import dataclass

from canvas import IndexedCanvas
from palette import Ramp


@dataclass(frozen=True)
class Metrics:
    """One size of the face. Everything scales from these five numbers."""

    cell_w: int
    cell_h: int
    stem: int       # stroke weight
    serif: int      # how far the outermost row of a terminal overhangs
    track: int      # space between cells


#: The connective words. Small enough that two of them plus the huge word
#: still leave the town visible underneath.
SMALL = Metrics(cell_w=10, cell_h=13, stem=2, serif=1, track=2)

#: CLAIM. Fifty-four rows is 37% of the play area on its own, and the three
#: lines together come to about 62% -- which is the reference's proportion.
HUGE = Metrics(cell_w=44, cell_h=54, stem=9, serif=4, track=6)

SIZES = {"small": SMALL, "huge": HUGE}

#: Kept so callers that predate the two sizes still resolve.
CELL_W, CELL_H = HUGE.cell_w, HUGE.cell_h


class Pen:
    """Collects the filled cells of one glyph before any of it is drawn.

    A set rather than direct drawing so strokes can overlap freely -- a letter
    is a union of strokes, and drawing them in sequence would let a later
    terminal punch a hole in an earlier stroke.
    """

    def __init__(self, metrics: Metrics) -> None:
        self.m = metrics
        self.on: set[tuple[int, int]] = set()

    def rect(self, x: int, y: int, width: int, height: int) -> None:
        for row in range(y, y + height):
            for column in range(x, x + width):
                if 0 <= column < self.m.cell_w and 0 <= row < self.m.cell_h:
                    self.on.add((column, row))

    def _terminal(self, x: int, y: int, down: bool) -> None:
        """A cut, tapered end to a vertical stroke.

        The outermost row overhangs by the full serif and each row inward
        overhangs one less, so the end flares to a point instead of stopping
        at a kerb. This one function is most of what separates this face from
        the slab sans it replaces.
        """
        for step in range(self.m.serif + 1):
            over = self.m.serif - step
            row = y + step if down else y - step
            self.rect(x - over, row, self.m.stem + over * 2, 1)

    def stem(self, x: int, y: int = 0, height: int | None = None, serif: bool = True) -> None:
        height = self.m.cell_h if height is None else height
        self.rect(x, y, self.m.stem, height)
        if serif:
            self._terminal(x, y, down=True)
            self._terminal(x, y + height - 1, down=False)

    def bar(self, y: int, x: int = 0, width: int | None = None, cut: bool = False) -> None:
        width = self.m.cell_w if width is None else width
        self.rect(x, y, width, self.m.stem)
        if cut:
            # A horizontal arm gets the same treatment on its free end: the
            # outermost column tallest, tapering back into the bar.
            for step in range(self.m.serif + 1):
                over = self.m.serif - step
                self.rect(x + width - 1 - step, y - over, 1, self.m.stem + over * 2)

    def diagonal(self, x0: int, y0: int, x1: int, y1: int) -> None:
        steps = max(abs(x1 - x0), abs(y1 - y0))
        for step in range(steps + 1):
            walk = step / max(1, steps)
            self.rect(round(x0 + (x1 - x0) * walk), round(y0 + (y1 - y0) * walk),
                      self.m.stem, self.m.stem)


def _glyph(character: str, m: Metrics) -> Pen:
    """One letter, as strokes. Only the letters the title and cards need."""
    pen = Pen(m)
    right = m.cell_w - m.stem
    middle = (m.cell_h - m.stem) // 2
    bottom = m.cell_h - m.stem
    half = m.cell_w // 2 - m.stem // 2
    shoulder = max(2, m.cell_h // 4)

    if character == "C":
        pen.bar(0, cut=True); pen.bar(bottom, cut=True); pen.stem(0, serif=False)
        pen.rect(right, 0, m.stem, shoulder); pen.rect(right, bottom - shoulder + 1, m.stem, shoulder)
    elif character == "O":
        pen.bar(0); pen.bar(bottom); pen.stem(0, serif=False); pen.stem(right, serif=False)
    elif character == "N":
        pen.stem(0); pen.stem(right); pen.diagonal(0, 0, right, bottom)
    elif character == "M":
        # Pointed middle, taken to the baseline. A shallow vee reads as an
        # H with a dent in it at 54 rows.
        pen.stem(0); pen.stem(right)
        pen.diagonal(0, 0, half, bottom - shoulder)
        pen.diagonal(right, 0, half, bottom - shoulder)
    elif character == "H":
        pen.stem(0); pen.stem(right); pen.bar(middle, 0, m.cell_w)
    elif character == "S":
        pen.bar(0, cut=True); pen.bar(middle); pen.bar(bottom, cut=True)
        pen.rect(0, 0, m.stem, middle); pen.rect(right, middle, m.stem, bottom - middle)
    elif character == "L":
        pen.stem(0); pen.bar(bottom, cut=True)
    elif character == "A":
        pen.diagonal(0, bottom, half, 0)
        pen.diagonal(right, bottom, half, 0)
        pen.bar(middle + m.stem // 2, m.stem // 2, m.cell_w - m.stem)
    elif character == "T":
        pen.bar(0, cut=True); pen.stem(half, serif=False)
        pen._terminal(half, m.cell_h - 1, down=False)
    elif character == "I":
        pen.stem(half, serif=False)
        pen._terminal(half, 0, down=True)
        pen._terminal(half, m.cell_h - 1, down=False)
    elif character == "P":
        pen.stem(0); pen.bar(0); pen.bar(middle, cut=True)
        pen.rect(right, 0, m.stem, middle + m.stem)
    elif character == "R":
        pen.stem(0); pen.bar(0); pen.bar(middle)
        pen.rect(right, 0, m.stem, middle + m.stem)
        pen.diagonal(half, middle, right, bottom)
    elif character == "Z":
        pen.bar(0, cut=True); pen.bar(bottom, cut=True); pen.diagonal(right, 0, 0, bottom)
    elif character == "E":
        pen.stem(0); pen.bar(0, cut=True)
        pen.bar(middle, 0, m.cell_w - m.serif - 1, cut=True); pen.bar(bottom, cut=True)
    elif character == "W":
        pen.stem(0); pen.stem(right)
        pen.diagonal(0, bottom, half, shoulder)
        pen.diagonal(right, bottom, half, shoulder)
    return pen


def _erode(character: str, index: int, cells: set[tuple[int, int]]) -> set[tuple[int, int]]:
    """Takes bites out of a glyph's edges, deterministically.

    Keyed on the character and its position in the word, never on a random
    source, so the same title always weathers the same way and the render is
    reproducible. Only EDGE cells are eligible: eating a hole in the middle of
    a stroke reads as damage to the image, while a bitten edge reads as paint
    that has been on a board through some winters.
    """
    seed = (ord(character) * 2654435761 + index * 40503) & 0xFFFFFFFF
    edges = [
        cell for cell in cells
        if not all((cell[0] + dx, cell[1] + dy) in cells
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    ]
    edges.sort()
    bitten = set()
    for cell in edges:
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        # Top edges weather harder than the rest: that is where the sun is.
        # Tuned down from 0.20/0.09: at that rate whole chunks left the stems
        # and it read as a damaged image rather than as weathered paint.
        chance = 0.13 if cell[1] < 3 else 0.05
        if (seed % 1000) / 1000 < chance:
            bitten.add(cell)
    return cells - bitten


def measure(text: str, m: Metrics = HUGE) -> int:
    return len(text) * (m.cell_w + m.track) - m.track


def draw(
    canvas: IndexedCanvas, text: str, x: int, y: int, face: Ramp, shadow: Ramp,
    m: Metrics = HUGE, weathered: bool = True,
) -> None:
    """Sets a line in the display face, with a drop shadow and a lit top edge.

    The shadow is structural, not decoration. Doc 17 property 4 wants the type
    to OVERLAP the art, so there is no plate behind these letters any more --
    they cross the sky, the hills and the false fronts, and an offset dark
    copy is what guarantees an edge everywhere regardless of what is behind.
    """
    depth = max(1, m.stem // 3)
    layers = []
    cursor = x
    for index, character in enumerate(text):
        if character == " ":
            cursor += m.cell_w + m.track
            continue
        cells = _glyph(character, m).on
        if weathered:
            cells = _erode(character, index, cells)
        # Baseline jitter: one pixel, alternating and keyed on position, so
        # the line is set by a signwriter rather than by a grid.
        lift = ((ord(character) + index) % 3) - 1
        layers.append((cursor, lift, cells))
        cursor += m.cell_w + m.track

    for offset, ramp, tone in ((depth, shadow, 0.03), (0, face, 0.80)):
        for left, lift, cells in layers:
            for column, row in cells:
                canvas.put(left + column + offset, y + row + lift + offset, ramp.frac(tone))

    # Lit top edge, applied only where the cell above is empty.
    for left, lift, cells in layers:
        for column, row in cells:
            if (column, row - 1) not in cells:
                canvas.put(left + column, y + row + lift, face.frac(0.99))
