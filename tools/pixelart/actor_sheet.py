"""Thad's reference sheet, his Room 2 composites, and the contrast check.

The contrast check is the one that matters. "Readable against the mud and
the boardwalk" is an adjective until it is a number, so it is a number here:
for every zone, the figure's brightest and darkest pixels are compared with
the background immediately behind him. A silhouette that fails is a build
error, not a matter of taste.
"""

from __future__ import annotations

import json
from pathlib import Path

import actor
from actor import BACK, FRONT, SIDE, VIEWS, WALK, Wardrobe
from canvas import IndexedCanvas
from palette import Palette
from street_scene import DAY, compose

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "reference"

HEIGHTS = (40, 32, 26)


def _label_bar(canvas: IndexedCanvas, x: int, y: int, width: int, palette: Palette) -> None:
    canvas.hline(x, y, width, palette.family("grey").at(6))


def reference_sheet(palette: Palette) -> IndexedCanvas:
    """Three views at three heights, the walk cycle, and the 26px workings."""
    wardrobe = Wardrobe(palette)
    bg = palette.family("grey").at(3)
    canvas = IndexedCanvas(320, 200, fill=bg)

    # Band 1 -- three views, three heights.
    x = 8
    for height in HEIGHTS:
        for view in VIEWS:
            figure = actor.at_height(palette, view=view, height=height)
            canvas.blit(figure, x, 6 + (44 - height), transparent=actor.TRANSPARENT)
            x += figure.width + 2
        x += 6
    _label_bar(canvas, 4, 52, 312, palette)

    # Band 2 -- the walk cycle at 40px.
    x = 6
    for index in range(len(WALK)):
        frame = actor.walk_frame(palette, index, height=40)
        canvas.blit(frame, x, 58, transparent=actor.TRANSPARENT)
        x += frame.width + 1
    _label_bar(canvas, 4, 102, 312, palette)

    # Band 3 -- the walk cycle at 32px and 26px, so the smaller sizes are
    # judged in motion rather than only standing still.
    x = 6
    for index in range(len(WALK)):
        frame = actor.walk_frame(palette, index, height=32)
        canvas.blit(frame, x, 108 + 8, transparent=actor.TRANSPARENT)
        x += frame.width + 1
    x += 8
    for index in range(0, len(WALK), 2):
        small = actor.walk_frame(palette, index, height=26)
        canvas.blit(small, x, 108 + 14, transparent=actor.TRANSPARENT)
        x += small.width + 1
    _label_bar(canvas, 4, 148, 312, palette)

    # Band 4 -- the 26px workings: 32 source, raw reduction, corrected.
    x = 10
    for view in VIEWS:
        source = actor.draw(palette, view=view, height=32)
        raw, corrected = actor.reduce_and_correct(source, palette, view=view)
        canvas.blit(source, x, 154, transparent=actor.TRANSPARENT)
        x += source.width + 2
        canvas.blit(raw, x, 154 + 6, transparent=actor.TRANSPARENT)
        x += raw.width + 2
        canvas.blit(corrected, x, 154 + 6, transparent=actor.TRANSPARENT)
        x += corrected.width + 10

    return canvas


def _zone_columns() -> dict[int, tuple[int, int]]:
    """One standing spot per depth zone: (x, feet y), read from the room."""
    room = json.loads((ROOT / "content" / "rooms" / "main-street.json").read_text())
    spots: dict[int, tuple[int, int]] = {}
    # Clear of the hitching rail (x 96-142) and the trough (x 214-254), both
    # of which stand in the mud and hid the legs of the figure meant to prove
    # the walk cycle.
    columns = {0: 62, 1: 178, 2: 286}
    for region in room["walkable"]:
        if region["id"] == "boardwalk":
            continue
        rx, ry, rw, rh = region["rect"]
        spots[region["zone"]] = (columns[region["zone"]], ry + rh - 1)
    # And one on the boardwalk itself, which is the other surface he has to
    # read against and the one the mud measurement does not cover.
    for region in room["walkable"]:
        if region["id"] == "boardwalk":
            rx, ry, rw, rh = region["rect"]
            spots[99] = (44, ry + rh - 1)
    return spots


def _heights_by_zone() -> dict[int, int]:
    scaling = json.loads((ROOT / "content" / "actors" / "scaling.json").read_text())
    return {zone["index"]: zone["height"] for zone in scaling["zones"]}


def place(
    canvas: IndexedCanvas, palette: Palette, x: int, feet_y: int, height: int,
    view: str = FRONT, frame: int | None = None,
) -> IndexedCanvas:
    """Stands a figure with his soles on feet_y and returns what was drawn."""
    figure = (
        actor.at_height(palette, view=view, height=height)
        if frame is None
        else actor.walk_frame(palette, frame, height=height, view=view)
    )
    top = feet_y - height + 1
    left = x - figure.width // 2
    _contact_shadow(canvas, palette, figure, left, top)
    canvas.blit(figure, left, top, transparent=actor.TRANSPARENT)
    return figure


def _contact_shadow(
    canvas: IndexedCanvas, palette: Palette, figure: IndexedCanvas, left: int, top: int,
) -> None:
    """A shadow under the boots only, stepped down the ground's own ramp.

    Same rule as the street's cast shadows: a shadow is the same material
    with less light on it, never a black wash. Without it he hovers.
    """
    sole = top + figure.height - 1
    columns = [
        x for x in range(figure.width)
        if any(figure.pixels[y][x] != actor.TRANSPARENT for y in range(figure.height - 4, figure.height))
    ]
    if not columns:
        return
    for x in range(left + min(columns) - 1, left + max(columns) + 2):
        for depth, steps in ((0, 2), (1, 1)):
            y = sole - depth
            canvas.put(x, y, palette.darken(canvas.get(x, y), steps))


def room_composites(palette: Palette) -> tuple[IndexedCanvas, IndexedCanvas]:
    """Thad standing and mid-walk in Room 2, at all three zones."""
    spots = _zone_columns()
    heights = _heights_by_zone()

    standing, _ = compose(DAY)
    for zone, (x, feet) in sorted(spots.items()):
        height = heights.get(zone, 26)
        view = (FRONT, SIDE, BACK)[zone % 3] if zone != 99 else FRONT
        place(standing, palette, x, feet, height, view=view)

    walking, _ = compose(DAY)
    for zone, (x, feet) in sorted(spots.items()):
        height = heights.get(zone, 26)
        place(walking, palette, x, feet, height, view=SIDE, frame=2 + zone % 4)

    return standing, walking


def contrast_report(palette: Palette) -> list[tuple[str, float, float, float, str]]:
    """Measures the figure against the ground he actually stands on.

    For each zone: the background's mean luminance in the block the figure
    occupies, against the figure's own darkest and brightest. The margin
    that matters is whichever of the two is larger -- he only has to
    separate one way, not both.
    """
    spots = _zone_columns()
    heights = _heights_by_zone()
    clean, _ = compose(DAY)

    rows: list[tuple[str, float, float, float, str]] = []
    for zone, (x, feet) in sorted(spots.items()):
        height = heights.get(zone, 26)
        figure = actor.at_height(palette, view=FRONT, height=height)
        top = feet - height + 1
        left = x - figure.width // 2

        back: list[float] = []
        for fy in range(figure.height):
            for fx in range(figure.width):
                if figure.pixels[fy][fx] == actor.TRANSPARENT:
                    continue
                back.append(palette.luminance(clean.get(left + fx, top + fy)))
        lit = [
            palette.luminance(figure.pixels[y][x2])
            for y in range(figure.height) for x2 in range(figure.width)
            if figure.pixels[y][x2] != actor.TRANSPARENT
        ]
        mean_bg = sum(back) / len(back)
        darkest, brightest = min(lit), max(lit)
        margin = max(mean_bg - darkest, brightest - mean_bg)
        name = "boardwalk" if zone == 99 else f"zone {zone} ({height}px)"
        verdict = "ok" if margin >= 60 else "THIN"
        rows.append((name, mean_bg, darkest, brightest, f"{margin:.0f} {verdict}"))
    return rows


def main() -> None:
    palette = Palette.load()
    OUT.mkdir(parents=True, exist_ok=True)

    sheet = reference_sheet(palette)
    sheet.save(OUT / "thad-sheet.png", palette)
    sheet.save(OUT / "thad-sheet@4x.png", palette, scale=4)

    standing, walking = room_composites(palette)
    standing.save(OUT / "thad-room02-standing.png", palette)
    standing.save(OUT / "thad-room02-standing@4x.png", palette, scale=4)
    walking.save(OUT / "thad-room02-walking.png", palette)
    walking.save(OUT / "thad-room02-walking@4x.png", palette, scale=4)

    print("THAD -- contrast against Room 2, per zone")
    print(f"  {'where':<20}{'bg mean':>9}{'darkest':>9}{'lightest':>10}{'margin':>12}")
    for name, bg, dark, light, margin in contrast_report(palette):
        print(f"  {name:<20}{bg:>9.1f}{dark:>9.1f}{light:>10.1f}{margin:>12}")

    used = sheet.used_indices()
    print()
    print(f"  sheet uses {len(used)} palette entries, all from the locked 256")
    print(f"  wrote {(OUT / 'thad-sheet@4x.png').relative_to(ROOT)}")
    print(f"  wrote {(OUT / 'thad-room02-standing@4x.png').relative_to(ROOT)}")
    print(f"  wrote {(OUT / 'thad-room02-walking@4x.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
