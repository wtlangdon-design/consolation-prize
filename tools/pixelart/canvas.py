"""An indexed-colour drawing surface.

Every pixel is a palette index, never an RGB value. Colour only resolves at
export, which makes it impossible to accidentally introduce a colour that is
not in the locked palette -- the failure mode that would give the whole
project away.

There is no anti-aliasing anywhere in this module by construction: nothing
blends, nothing averages, every operation writes a whole index to a whole
pixel.
"""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

from PIL import Image

from palette import Palette


class IndexedCanvas:
    def __init__(self, width: int, height: int, fill: int = 0) -> None:
        self.width = width
        self.height = height
        self.pixels = [[fill] * width for _ in range(height)]
        # Off by default and free when off. Errata 32a says no room may
        # contain a row of objects sharing a baseline with clear air between
        # them, and that is a claim about the composition rather than about
        # the image -- two objects can look adjacent and be twenty pixels
        # apart. The only way to check it is to know which pixels belong to
        # which object, which only the code that drew them knows.
        self._tracking: str | None = None
        self.strokes: list[tuple[str, set[tuple[int, int]]]] = []

    @contextmanager
    def track(self, name: str):
        """Records every pixel written inside the block as one object."""
        previous, self._tracking = self._tracking, name
        owned: set[tuple[int, int]] = set()
        self.strokes.append((name, owned))
        self._own = owned
        try:
            yield
        finally:
            self._tracking = previous
            self._own = None

    _own: set[tuple[int, int]] | None = None

    # -- primitives ---------------------------------------------------------

    def put(self, x: int, y: int, index: int) -> None:
        if 0 <= x < self.width and 0 <= y < self.height:
            self.pixels[y][x] = index
            if self._own is not None:
                self._own.add((x, y))

    def get(self, x: int, y: int) -> int:
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.pixels[y][x]
        return 0

    def rect(self, x: int, y: int, width: int, height: int, index: int) -> None:
        if self._own is not None:
            for row in range(y, y + height):
                for col in range(x, x + width):
                    self.put(col, row, index)
            return
        for row in range(y, y + height):
            if 0 <= row < self.height:
                line = self.pixels[row]
                for col in range(max(0, x), min(self.width, x + width)):
                    line[col] = index

    def outline(self, x: int, y: int, width: int, height: int, index: int) -> None:
        self.hline(x, y, width, index)
        self.hline(x, y + height - 1, width, index)
        self.vline(x, y, height, index)
        self.vline(x + width - 1, y, height, index)

    def hline(self, x: int, y: int, length: int, index: int) -> None:
        self.rect(x, y, length, 1, index)

    def vline(self, x: int, y: int, length: int, index: int) -> None:
        self.rect(x, y, 1, length, index)

    def line(self, x0: int, y0: int, x1: int, y1: int, index: int) -> None:
        """Bresenham. Hard pixels only -- no coverage, no feathering."""
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        step_x = 1 if x0 < x1 else -1
        step_y = 1 if y0 < y1 else -1
        error = dx + dy
        while True:
            self.put(x0, y0, index)
            if x0 == x1 and y0 == y1:
                return
            doubled = 2 * error
            if doubled >= dy:
                error += dy
                x0 += step_x
            if doubled <= dx:
                error += dx
                y0 += step_y

    def blit(self, other: "IndexedCanvas", x: int, y: int, transparent: int | None = None) -> None:
        for row in range(other.height):
            for col in range(other.width):
                index = other.pixels[row][col]
                if transparent is not None and index == transparent:
                    continue
                self.put(x + col, y + row, index)

    def column_profile(self, x: int) -> list[int]:
        return [self.pixels[row][x] for row in range(self.height)]

    # -- export -------------------------------------------------------------

    def to_image(self, palette: Palette) -> Image.Image:
        image = Image.new("P", (self.width, self.height))
        image.putpalette(palette.flat())
        image.putdata([index for row in self.pixels for index in row])
        return image

    def save(self, path: Path, palette: Palette, scale: int = 1) -> Path:
        image = self.to_image(palette)
        if scale != 1:
            # NEAREST only. Any other filter would resample the pixel grid,
            # which is the one thing the art direction forbids outright.
            image = image.resize((self.width * scale, self.height * scale), Image.Resampling.NEAREST)
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, optimize=True)
        return path

    def save_rgba(self, path: Path, palette: Palette, transparent: int = 255) -> Path:
        """Exports with one index as full alpha. For foreground planes.

        Ruling 21a's foreground draws OVER the actor, so it cannot travel in
        the background PNG the actor is drawn on top of -- it needs its own
        image with holes in it.

        Index 255 is the key. It is one of the palette's five duplicate blacks
        and no composition uses it, which check-palette-cycling already relies
        on for a different reason: an index nothing draws with is an index
        nothing can lose to a key.
        """
        pixels = []
        for row in self.pixels:
            for index in row:
                red, green, blue = palette.colours[index]
                pixels.append((red, green, blue, 0 if index == transparent else 255))
        image = Image.new("RGBA", (self.width, self.height))
        image.putdata(pixels)
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, optimize=True)
        return path

    def used_indices(self) -> set[int]:
        return {index for row in self.pixels for index in row}
