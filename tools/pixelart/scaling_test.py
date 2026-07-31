"""Evidence for ruling 15: decimation against the hand-corrected reductions.

Two renders and a table of numbers.

  thad-scaling-decimation@8x.png -- 40px Thad decimated to 32 and to 26,
  each beside the hand-corrected figure at the same height, at 8x. The
  question is whether the face survives, because the earlier finding was that
  reducing by ratio lands on the eyes.

  thad-scaling-heads@16x.png -- the same five figures cropped to the head and
  blown up further, because the face is where the answer is and at 8x a whole
  man is mostly coat.

  thad-scaling-continuous@4x.png -- every whole height decimation produces
  across Room 2's walkable band, in a row, so per-row popping can be counted
  rather than guessed at.

Nothing here changes what the game draws. Ruling 15 stands until it is
changed on purpose.
"""

from __future__ import annotations

import actor
import decimation
from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS

def eyes(palette: Palette, figure: IndexedCanvas) -> list[tuple[int, int]]:
    """The eye pixels: ink with skin on at least two sides.

    Not just "ink", which was the first version of this measurement and was
    useless -- the keyline is ink too, so it reported that every column of the
    figure carried an eye and that the eyes always survived. The render showed
    the opposite. A check that cannot fail is not a check.
    """
    wardrobe = actor.Wardrobe(palette)
    skin = (wardrobe.skin, wardrobe.skin_shade)
    found = []
    for y in range(1, figure.height - 1):
        for x in range(1, figure.width - 1):
            if figure.pixels[y][x] != wardrobe.ink:
                continue
            around = (figure.pixels[y][x - 1], figure.pixels[y][x + 1],
                      figure.pixels[y - 1][x], figure.pixels[y + 1][x])
            if sum(1 for pixel in around if pixel in skin) >= 2:
                found.append((x, y))
    return found


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


def strip(palette: Palette, panels: list[tuple[str, IndexedCanvas]], gap: int = 3) -> IndexedCanvas:
    width = sum(panel.width + gap for _, panel in panels) + gap
    height = max(panel.height for _, panel in panels) + gap * 2
    sheet = IndexedCanvas(width, height, fill=palette.family("mud").at(3))
    cursor = gap
    for _, panel in panels:
        sheet.blit(panel, cursor, height - gap - panel.height, transparent=actor.TRANSPARENT)
        cursor += panel.width + gap
    return sheet


def main() -> None:
    palette = Palette.load()
    RENDERS.mkdir(parents=True, exist_ok=True)
    source = actor.at_height(palette, view=actor.FRONT, height=40, surface=actor.BOARDWALK)

    print("SCUMM decimation vs the hand-corrected reductions -- evidence for ruling 15")
    print(f"  source: {source.width}x{source.height}, front view, boardwalk")
    print()

    panels: list[tuple[str, IndexedCanvas]] = [("40 source", source)]
    for wanted in (32, 26):
        scale = decimation.scale_for(source.height, wanted)
        decimated = decimation.decimate(source, scale)
        hand = actor.at_height(palette, view=actor.FRONT, height=wanted, surface=actor.BOARDWALK)
        panels.append((f"{wanted} decimated", decimated))
        panels.append((f"{wanted} hand", hand))

        print(f"  {wanted}px  scale {scale}  ->  {decimated.width}x{decimated.height} "
              f"(hand: {hand.width}x{hand.height})")
        print(f"      eyes: {len(eyes(palette, decimated))} decimated, "
              f"{len(eyes(palette, hand))} hand-corrected")
        print()

    strip(palette, panels).save(RENDERS / "thad-scaling-decimation@8x.png", palette, scale=8)
    print(f"wrote renders/thad-scaling-decimation@8x.png")

    heads = [(name, head_crop(panel)) for name, panel in panels]
    strip(palette, heads, gap=2).save(RENDERS / "thad-scaling-heads@16x.png", palette, scale=16)
    print(f"wrote renders/thad-scaling-heads@16x.png")

    # Continuous: every distinct height the table produces from 40 rows.
    heights: dict[int, int] = {}
    for scale in range(1, 256):
        rows = len(decimation.kept(source.height, scale))
        heights.setdefault(rows, scale)
    ladder = [(f"{rows}", decimation.decimate(source, scale))
              for rows, scale in sorted(heights.items()) if rows >= 12]
    strip(palette, ladder, gap=2).save(RENDERS / "thad-scaling-continuous@4x.png", palette, scale=4)
    print(f"wrote renders/thad-scaling-continuous@4x.png")
    print(f"  {len(ladder)} distinct heights between 12 and {source.height} rows")

    # What a walk across Room 2's band would actually do. The band is
    # 78..144, and ruling 15's three zones are 26, 32 and 40 -- so a
    # continuous scale would have to travel 14 rows over 66 of walk.
    print()
    print("  across Room 2's walkable band, rows 78-144:")
    span = 144 - 78
    steps = []
    for row in range(78, 145):
        wanted = 26 + round((row - 78) / span * 14)
        scale = decimation.scale_for(source.height, wanted)
        steps.append(len(decimation.kept(source.height, scale)))
    changes = sum(1 for a, b in zip(steps, steps[1:]) if a != b)
    print(f"    {changes} height changes over {span} rows of walk "
          f"-- one every {span / max(1, changes):.1f} rows")
    print(f"    heights visited: {sorted(set(steps))}")

    # The height change is not the visible one. This is.
    seen, flips = None, 0
    counts = set()
    for row in range(78, 145):
        wanted = 26 + round((row - 78) / span * 14)
        count = len(eyes(palette, decimation.decimate(
            source, decimation.scale_for(source.height, wanted))))
        counts.add(count)
        if seen is not None and count != seen:
            flips += 1
        seen = count
    print(f"    the number of drawn eyes changes {flips} time(s); counts seen {sorted(counts)}")


if __name__ == "__main__":
    main()
