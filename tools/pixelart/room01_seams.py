"""The two defects nine region critics structurally cannot see.

A blind critic is shown one region's crop and asked which of two pictures is
better. That works, and it has driven every round of this rebuild. It also has
two blind spots by construction, and both have now cost a round:

  A PIXEL NOBODY DREW. Row 68 was a one-row black rule across the valley for a
  whole round -- town ended its foot band there but only inside its own rect,
  range stopped on the same row, terrain started at 69. No region owned it, so
  no region's crop showed it as that region's fault.

  A TEXTURE NOBODY MODULATED. The mid-ground went out as a fifty per cent
  ordered checker at one density across the whole band, crossing every object
  in front of it. Two critics found it independently, from crops of something
  else, in the round AFTER it shipped -- and only because it was bad enough to
  ruin their regions too.

Both are cheap to detect mechanically and neither is a matter of taste, so
neither should be waiting on a critic to notice.

    python3 room01_seams.py

UNWRITTEN PIXELS are found by composing the room twice over two different
initial fills and diffing. A pixel some module wrote takes the same value both
times; a pixel nobody wrote still holds whichever fill it started from. No
bookkeeping in the drawing code, and it cannot drift out of date.

THE LATTICE TEST asks, per tile, how well (x + y) parity predicts which of the
tile's two dominant colours a pixel takes. A hand-placed cluster scores near
zero. A perfect checkerboard scores one. The threshold is not a number somebody
liked: it is THE REFERENCE'S OWN WORST TILE, so the rule is "no more ordered
than the picture we are matching", which is the only bar that cannot be argued
with.
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

from PIL import Image

import canvas as canvas_module
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / "reference" / "room-01" / "image-B-bar-320x144.png"

#: Tile side for the lattice test. Twelve is small enough that a genuinely
#: local patch of dither is judged on its own, and large enough that the parity
#: statistic is not just noise: 144 pixels per tile.
TILE = 12

#: A tile enters the test if its two commonest indices cover this much of it,
#: and the question is then asked about THOSE TWO only, ignoring the rest.
#:
#: This started at 0.80 and caught nothing. The band the critics called a
#: screen door measures twenty colours per tile -- the screen itself is only
#: two of them, but the light gradient, the objects standing in it and the
#: texture on top bring the rest along, and its dominant pair covers 66 per
#: cent. At 0.80 every tile in the defect returned "not a two-tone screen" and
#: the test passed a frame two independent critics had already failed.
DOMINANCE = 0.50

#: And only if the minority colour is actually present -- a flat tile is
#: perfectly "predicted" by anything.
MIN_MINORITY = 0.15

#: The grid sizes an ordered screen is built on. Two catches a checkerboard and
#: four catches a Bayer 4x4, which is the whole of what dither.py offers -- it
#: has BAYER2 and BAYER4 and nothing else.
#:
#: Eight was in this tuple briefly and had to come out. A 12x12 tile holds 144
#: pixels; an 8x8 grid cuts it into 64 cells of about two, and guessing each
#: cell's own majority from two samples is right nearly every time whatever the
#: tile contains. It scored RANDOM STIPPLE at 0.40 -- higher than a hard edge --
#: which is a metric measuring its own overfitting. Hence the sample floor
#: below, which would reject 8 anyway.
MODULI = (2, 4)

#: A modulus is only asked its question if each of its cells has this many
#: pixels to answer with. Below it the majority-per-cell guess is memorising
#: rather than detecting.
MIN_PER_CELL = 8


def compose_twice() -> tuple[list[list[int]], list[list[int]], int]:
    """Compose over two fills. Returns both pixel grids and the frame size."""
    import room01

    original = canvas_module.IndexedCanvas.__init__

    def with_fill(fill_value: int):
        def patched(self, width, height, fill=0):
            # ONLY the canvases that start at void get the sentinel. The
            # foreground plane is created at 255 and uses that as its
            # transparency key; substituting the sentinel there would make the
            # key a colour, blit the whole plane opaque, and report the entire
            # frame as unwritten -- which is exactly what the first version of
            # this check did.
            original(self, width, height, fill_value if fill == 0 else fill)
        return patched

    grids = []
    for fill_value in (0, 2):
        canvas_module.IndexedCanvas.__init__ = with_fill(fill_value)
        try:
            canvas, _ = room01.compose(with_coach=True)
        finally:
            canvas_module.IndexedCanvas.__init__ = original
        grids.append([row[:] for row in canvas.pixels])
    return grids[0], grids[1], len(grids[0][0])


def unwritten(first: list[list[int]], second: list[list[int]]) -> list[tuple[int, int]]:
    return [
        (x, y)
        for y in range(len(first))
        for x in range(len(first[0]))
        if first[y][x] != second[y][x]
    ]


def ordered_score(tile: list[tuple[int, int, int]]) -> float | None:
    """How predictable a pixel's colour is from its position in a small grid.

    Zero for hand-placed clusters and for random stipple. One for a screen --
    any screen. The first version of this asked only about (x + y) parity,
    which catches a strict checkerboard and lets a Bayer 4x4 through, and a
    Bayer 4x4 at one density across a whole band is precisely the defect this
    file exists to catch. So it now tries every modulus an ordered screen is
    built on and reports the worst.

    The score is normalised against ALWAYS GUESSING THE DOMINANT COLOUR, which
    is what a flat-ish tile would score for free. What is left is the part of
    the tile's structure that position alone explains.

    None when the tile is not a two-tone screen at all, which is most of them.
    """
    counts = Counter(index for _, _, index in tile)
    if len(counts) < 2:
        return None
    (top, top_n), (second, second_n) = counts.most_common(2)
    total = len(tile)
    if (top_n + second_n) / total < DOMINANCE:
        return None
    if second_n / total < MIN_MINORITY:
        return None

    pair = [(x, y, index) for x, y, index in tile if index in (top, second)]
    considered = len(pair)
    baseline = top_n / considered

    worst = 0.0
    for modulus in MODULI:
        if considered < MIN_PER_CELL * modulus * modulus:
            continue
        cells: dict[tuple[int, int], Counter] = {}
        for x, y, index in pair:
            cells.setdefault((x % modulus, y % modulus), Counter())[index] += 1
        # How often position predicts the colour, if you guess each cell's
        # own majority. A screen makes every cell unanimous.
        correct = sum(cell.most_common(1)[0][1] for cell in cells.values())
        explained = correct / considered
        if baseline >= 1.0:
            continue
        worst = max(worst, (explained - baseline) / (1.0 - baseline))
    return max(0.0, min(1.0, worst))


def scan(get_index, width: int, height: int) -> list[tuple[int, int, float]]:
    """Every tile that is a two-tone screen, with its parity bias."""
    found = []
    for top in range(0, height - TILE + 1, TILE // 2):
        for left in range(0, width - TILE + 1, TILE // 2):
            tile = [
                (x, y, get_index(x, y))
                for y in range(top, top + TILE)
                for x in range(left, left + TILE)
            ]
            bias = ordered_score(tile)
            if bias is not None:
                found.append((left, top, bias))
    return found


def main() -> None:
    palette = Palette.load()
    first, second, width = compose_twice()
    height = len(first)

    print("ROOM 1 -- the seams between regions\n")

    holes = unwritten(first, second)
    print(f"  unwritten pixels: {len(holes)}")
    if holes:
        rows = sorted({y for _, y in holes})
        print(f"    rows touched: {rows[:12]}{' ...' if len(rows) > 12 else ''}")
        print(f"    first few: {holes[:8]}")

    # The reference was not built from our palette, so it is quantised into it
    # before the tiles are cut. Bucketing it by its own 256 colours instead
    # would give almost every tile more than two, no tile would qualify as a
    # two-tone screen, and the ceiling would silently default to 1.00 -- a test
    # that can never fail. It did exactly that until this was fixed.
    reference = Image.open(REFERENCE).convert("RGB")
    ref_pixels = reference.load()
    cache: dict[tuple[int, int, int], int] = {}

    def ref_index(x: int, y: int) -> int:
        colour = ref_pixels[x, y]
        found = cache.get(colour)
        if found is None:
            red, green, blue = colour
            found = min(
                range(len(palette.colours)),
                key=lambda i: (
                    2 * (red - palette.colours[i][0]) ** 2
                    + 4 * (green - palette.colours[i][1]) ** 2
                    + 3 * (blue - palette.colours[i][2]) ** 2
                ),
            )
            cache[colour] = found
        return found

    ours = scan(lambda x, y: first[y][x], width, height)
    theirs = scan(ref_index, width, height)

    ceiling = max((bias for _, _, bias in theirs), default=1.0)
    print(f"\n  lattice test, {TILE}x{TILE} tiles at half-tile stride")
    print(f"    reference: {len(theirs)} two-tone tiles, worst ordered score {ceiling:.2f}")
    print(f"    ours:      {len(ours)} two-tone tiles, worst ordered score "
          f"{max((b for _, _, b in ours), default=0.0):.2f}")

    over = [(x, y, bias) for x, y, bias in ours if bias > ceiling]
    if over:
        print(f"\n    {len(over)} tile(s) more ordered than anything in the reference:")
        for x, y, bias in sorted(over, key=lambda entry: -entry[2])[:12]:
            print(f"      ({x:3d},{y:3d}) ordered {bias:.2f}")

    failed = bool(holes) or bool(over)
    print()
    if failed:
        print("  FAIL -- a hole nobody drew, or a screen nobody modulated.")
    else:
        print("  PASS -- every pixel is somebody's, and no tile out-orders the bar.")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
