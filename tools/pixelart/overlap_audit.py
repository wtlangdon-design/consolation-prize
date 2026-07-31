"""Errata 32a and 32b, measured.

"Do the objects overlap" is a claim about the composition, not about the
image. Two objects can look adjacent in a 4x render and be twenty pixels
apart; a row of eight things on one baseline is exactly what a dense frame
looks like until you check. So the composition scripts tag their objects and
this counts what the tags say.

THREE NUMBERS, and they are the whole report:

  OVERLAP RATE -- what fraction of objects share at least one pixel with
  another object. Errata 32a: overlap is what makes forty objects a place
  instead of forty stickers, and it is free.

  BASELINE ROWS -- groups of three or more objects whose feet sit within two
  pixels of each other AND whose silhouettes never touch. That is the exact
  pattern 32a forbids: a row sharing a baseline with clear air between them.

  FLOOR LOAD -- what fraction of tagged object pixels fall on the walkable
  plane. Errata 32b: the hold is packed to the walls and its floor is nearly
  clear, and strewing the walkable plane is a legibility problem with extra
  steps rather than density.
"""

from __future__ import annotations

import sys

import room01_stage_road
import street_scene
from renders import RENDERS
from title_screen import game_font
from canvas import IndexedCanvas
from palette import Palette

#: Which rows are the plane the player walks on, per room.
MARGIN = 26
WALKABLE = {"room 1 -- stage road": (100, 144), "room 2 -- main street": (86, 144)}


def measure(name: str, strokes: list[tuple[str, set[tuple[int, int]]]]) -> dict:
    objects = [(tag, pixels) for tag, pixels in strokes if pixels]
    touching: set[str] = set()
    pairs = 0
    for i, (tag_a, a) in enumerate(objects):
        for tag_b, b in objects[i + 1:]:
            if a & b:
                pairs += 1
                touching.add(tag_a)
                touching.add(tag_b)

    # Feet, and the horizontal extent, for the baseline test.
    feet = {}
    extent = {}
    for tag, pixels in objects:
        feet[tag] = max(y for _, y in pixels)
        xs = [x for x, _ in pixels]
        extent[tag] = (min(xs), max(xs))

    # A ROW IS ADJACENT AS WELL AS LEVEL. The first version of this grouped
    # purely by baseline, so two sacks in a heap at frame left and a woodpile
    # at frame right scored as a row of three -- they are 260 pixels apart
    # and nobody reads them as a sequence. What errata 32a forbids is objects
    # you read ALONG: level, evenly spaced, and near enough to scan as one
    # line. So the group is split into runs wherever the horizontal gap opens
    # past a figure's width.
    GAP = 40
    by_pixels = dict(objects)
    rows = []
    seen: set[str] = set()
    for tag, base in sorted(feet.items(), key=lambda item: item[1]):
        if tag in seen:
            continue
        level = sorted((other for other, other_base in feet.items()
                        if abs(other_base - base) <= 2),
                       key=lambda t: extent[t][0])
        run: list[str] = []
        for other in level + [None]:
            if run and other is not None and extent[other][0] - extent[run[-1]][1] <= GAP:
                run.append(other)
                continue
            if len(run) >= 3:
                clear = all(not (by_pixels[p] & by_pixels[q])
                            for i, p in enumerate(run) for q in run[i + 1:])
                if clear:
                    rows.append((base, list(run)))
                    seen.update(run)
            run = [] if other is None else [other]

    # Errata 32b asks for the edges to be PACKED and the floor kept clear, so
    # the outer margin is not floor load -- counting it would score the thing
    # the ruling wants as the thing it forbids. Only the middle of the
    # walkable plane counts, which is the part a player actually crosses.
    low, high = WALKABLE[name]
    total = sum(len(pixels) for _, pixels in objects)
    on_floor = sum(len([1 for x, y in pixels if low <= y < high and MARGIN <= x < 320 - MARGIN])
                   for _, pixels in objects)

    return {
        "objects": len(objects),
        "pairs": pairs,
        "overlapping": len(touching),
        "rate": len(touching) / max(1, len(objects)),
        "rows": rows,
        "floor": on_floor / max(1, total),
    }


def report(name: str, result: dict) -> None:
    print(f"\n{name}")
    print(f"  objects tagged        {result['objects']}")
    print(f"  overlapping pairs     {result['pairs']}")
    print(f"  objects that overlap  {result['overlapping']}/{result['objects']} "
          f"({100 * result['rate']:.0f}%)")
    print(f"  on the walkable plane {100 * result['floor']:.0f}% of object pixels")
    if result["rows"]:
        print(f"  ERRATA 32a VIOLATIONS  {len(result['rows'])} baseline row(s) with clear air:")
        for base, group in result["rows"]:
            print(f"    y={base}: {', '.join(group)}")
    else:
        print("  errata 32a            no baseline row with clear air between its members")


def main() -> None:
    results = {}
    canvas, _ = room01_stage_road.compose(with_coach=True, tracked=True)
    results["room 1 -- stage road"] = measure("room 1 -- stage road", canvas.strokes)

    street = street_scene.compose(street_scene.DAY, tracked=True)[0]
    results["room 2 -- main street"] = measure("room 2 -- main street", street.strokes)

    for name, result in results.items():
        report(name, result)

    sheet(results)
    failures = sum(len(result["rows"]) for result in results.values())
    print(f"\n{failures} baseline row violation(s) across {len(results)} room(s)")
    return failures


def sheet(results: dict) -> None:
    """A picture of the numbers, because the numbers are about a picture."""
    palette = Palette.load()
    bone = palette.family("bone")
    grey = palette.family("grey")
    gold = palette.family("accent_gold")
    canvas = IndexedCanvas(320, 60, palette.role("panelBg"))
    y = 6
    for name, result in results.items():
        game_font(canvas, name.upper(), 6, y, bone, 0.86)
        game_font(canvas, f"{result['objects']} OBJECTS", 6, y + 10, grey, 0.7)
        game_font(canvas, f"{100 * result['rate']:.0f}% OVERLAP", 90, y + 10,
                  gold if result["rate"] > 0.8 else grey, 0.8)
        game_font(canvas, f"{100 * result['floor']:.0f}% ON FLOOR", 178, y + 10,
                  grey if result["floor"] < 0.2 else gold, 0.8)
        game_font(canvas, f"{len(result['rows'])} ROWS", 266, y + 10,
                  grey if not result["rows"] else gold, 0.8)
        y += 26
    canvas.save(RENDERS / "overlap-audit.png", palette)
    canvas.save(RENDERS / "overlap-audit@4x.png", palette, scale=4)


if __name__ == "__main__":
    sys.exit(0 if main() == 0 else 1)
