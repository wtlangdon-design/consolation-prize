"""Ruling 24's snap, and doc 21 gap 2's colour cue, both as pictures.

Three renders and a table of numbers.

  thad-scaling-decimation@8x.png -- the drawn near sprite, the decimations
  either side of the measured threshold, and the drawn far sprite that takes
  over there. The middle figure is the argument: it is the one the player
  would be looking at if the snap were anywhere else.

  thad-scaling-heads@16x.png -- the same figures cropped to the head. The
  face is where the answer is, and at 8x a whole man is mostly coat.

  thad-cue-against-rooms@8x.png -- doc 21 gap 2. Thad at 40, 32, 26, 8 and 4
  against the darkest and the brightest composed backgrounds, which are
  measured rather than assumed: Room 3 at mean luminance 53 and Room 36 at
  101. The dossier's test is whether one persistent cue survives to
  map-token scale, and a token is 4 to 8 pixels.

The 8px and 4px figures are the FAR sprite decimated, not drawn. Ruling 24
allows two drawn sizes per character and a map token does not earn a third.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

import actor
import decimation
from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]

#: Measured, not assumed -- see the module docstring.
DARKEST = "room-03-nugget.png"
BRIGHTEST = "room-36-main-street-dawn.png"

#: Doc 21 gap 2 names these five. 32 is no longer drawn and comes out of the
#: decimation curve; 8 and 4 are map tokens.
CUE_HEIGHTS = (40, 32, 26, 8, 4)


def token(palette: Palette, height: int) -> IndexedCanvas:
    """A figure at a height below the far sprite: the far sprite, decimated.

    Anything under the threshold is the far sprite by ruling 24, and a map
    token is under everything. Decimating it loses the eyes, which is the
    point of the test -- the cue has to be the thing that survives.
    """
    if height >= actor.FAR:
        return actor.at_height(palette, view=actor.FRONT, height=height,
                               surface=actor.BOARDWALK, sink=0)
    far = actor.draw(palette, view=actor.FRONT, height=actor.FAR, surface=actor.BOARDWALK)
    return decimation.decimate(far, decimation.scale_for(far.height, height + 1))


def brightest_mass(palette: Palette, figure: IndexedCanvas) -> float:
    """Luminance of the figure's lightest drawn pixel. The cue, measured."""
    lums = [palette.luminance(figure.pixels[y][x])
            for y in range(figure.height) for x in range(figure.width)
            if figure.pixels[y][x] != actor.TRANSPARENT]
    return max(lums) if lums else 0.0


def head_crop(figure: IndexedCanvas, fraction: float = 0.4) -> IndexedCanvas:
    """The top of a figure, where the question actually lives.

    A 26px man beside a 40px man at 8x is mostly boots and coat, and the coat
    survives anything -- it is a flat mass. The face is four or five pixels
    doing all the work, so it gets its own render at 16x.
    """
    rows = max(1, round(figure.height * fraction))
    out = IndexedCanvas(figure.width, rows, fill=actor.TRANSPARENT)
    for y in range(rows):
        for x in range(figure.width):
            out.put(x, y, figure.pixels[y][x])
    return out


def strip(palette: Palette, panels: list[IndexedCanvas], gap: int = 3) -> IndexedCanvas:
    width = sum(panel.width + gap for panel in panels) + gap
    height = max(panel.height for panel in panels) + gap * 2
    sheet = IndexedCanvas(width, height, fill=palette.family("mud").at(3))
    cursor = gap
    for panel in panels:
        sheet.blit(panel, cursor, height - gap - panel.height, transparent=actor.TRANSPARENT)
        cursor += panel.width + gap
    return sheet


def _load_indexed(name: str) -> IndexedCanvas:
    image = Image.open(ROOT / "art" / "backgrounds" / name)
    canvas = IndexedCanvas(image.width, image.height)
    pixels = list(image.getdata())
    for y in range(image.height):
        for x in range(image.width):
            canvas.put(x, y, pixels[y * image.width + x])
    return canvas


def _median_behind(palette: Palette, room: IndexedCanvas, x: int, y: int,
                   width: int, height: int) -> float:
    lums = [palette.luminance(room.get(px, py))
            for py in range(y, min(room.height, y + height))
            for px in range(x, min(room.width, x + width))]
    return sorted(lums)[len(lums) // 2] if lums else 0.0


def cue_against_rooms(palette: Palette) -> None:
    """Doc 21 gap 2's test, both ends of the value range, one picture."""
    rows = []
    print("  doc 21 gap 2 -- the cue against the extremes of what is composed")
    print("    room                    px   cue lum   behind   margin")
    for name in (DARKEST, BRIGHTEST):
        room = _load_indexed(name)
        # A band clear of the very top of each room, so the figures sit
        # against scenery rather than sky.
        panel = IndexedCanvas(160, 48, fill=palette.family("void").at(0))
        for y in range(panel.height):
            for x in range(panel.width):
                panel.put(x, y, room.get(80 + x, 60 + y))
        cursor = 6
        for height in CUE_HEIGHTS:
            figure = token(palette, height)
            at_x, at_y = cursor, panel.height - 4 - figure.height
            behind = _median_behind(palette, panel, at_x, at_y, figure.width, figure.height)
            panel.blit(figure, at_x, at_y, transparent=actor.TRANSPARENT)
            cue = brightest_mass(palette, figure)
            print(f"    {name[:18]:18s}  {height:5d}   {cue:7.1f}  {behind:7.1f}   "
                  f"{cue - behind:+6.1f}")
            cursor += figure.width + 12
        rows.append(panel)

    sheet = IndexedCanvas(rows[0].width, sum(row.height + 2 for row in rows) + 2,
                          fill=palette.family("grey").at(2))
    y = 2
    for row in rows:
        sheet.blit(row, 0, y)
        y += row.height + 2
    sheet.save(RENDERS / "thad-cue-against-rooms@8x.png", palette, scale=8)
    print("  wrote renders/thad-cue-against-rooms@8x.png")


def main() -> None:
    palette = Palette.load()
    RENDERS.mkdir(parents=True, exist_ok=True)
    threshold = actor.eye_death_row(palette)

    print("RULING 24 -- two drawn sizes, and the snap between them")
    print(f"  eye-death row, measured: {threshold}")
    print()
    print("   height  canvas   drawn-w   eyes   source")
    heights = [actor.NEAR, 36, threshold + 1, threshold, actor.FAR]
    panels = []
    for height in heights:
        figure = actor.at_height(palette, view=actor.FRONT, height=height,
                                 surface=actor.BOARDWALK, sink=0)
        columns = [x for x in range(figure.width)
                   if any(figure.pixels[y][x] != actor.TRANSPARENT
                          for y in range(figure.height))]
        drawn_w = max(columns) - min(columns) + 1 if columns else 0
        source = "drawn" if height in actor.BUILDS else "decimated"
        print(f"   {height:6d}  {figure.width:2d}x{figure.height:<3d}  {drawn_w:7d}   "
              f"{len(actor.eye_pixels(palette, figure)):4d}   {source}")
        panels.append(figure)
    print()

    strip(palette, panels).save(RENDERS / "thad-scaling-decimation@8x.png", palette, scale=8)
    print("  wrote renders/thad-scaling-decimation@8x.png")
    strip(palette, [head_crop(panel) for panel in panels], gap=2).save(
        RENDERS / "thad-scaling-heads@16x.png", palette, scale=16)
    print("  wrote renders/thad-scaling-heads@16x.png")

    # How big the one snap actually is, in the room it happens in.
    near = actor.at_height(palette, view=actor.FRONT, height=threshold + 1,
                           surface=actor.BOARDWALK, sink=0)
    far = actor.at_height(palette, view=actor.FRONT, height=actor.FAR,
                          surface=actor.BOARDWALK, sink=0)
    print(f"  the snap: {threshold + 1} rows -> {actor.FAR} rows, "
          f"canvas {near.width} -> {far.width}")
    print("  one snap per character per room. Above it every row is its own "
          "decimation.")
    print()
    cue_against_rooms(palette)


if __name__ == "__main__":
    main()
