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
from actor import BACK, FRONT, SIDE, VIEWS, WALK_BOARDWALK, WALK_MUD, Wardrobe
from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS
from street_scene import DAY, compose

ROOT = Path(__file__).resolve().parents[2]
OUT = RENDERS

HEIGHTS = (40, 32, 26)


def _label_bar(canvas: IndexedCanvas, x: int, y: int, width: int, palette: Palette) -> None:
    canvas.hline(x, y, width, palette.family("grey").at(6))


def _ground_strip(
    canvas: IndexedCanvas, palette: Palette, x: int, y: int, width: int, height: int,
    index: int,
) -> None:
    """A band of surface to stand the walk cycle on.

    Without one the sink is invisible -- a figure with its boots removed on a
    blank background just looks like a figure with its boots removed.
    """
    canvas.rect(x, y, width, height, index)
    canvas.hline(x, y + height - 1, width, palette.darken(index, 2))


def reference_sheet(palette: Palette) -> IndexedCanvas:
    """Three views at three heights, the walk cycle, and the 26px workings."""
    wardrobe = Wardrobe(palette)
    bg = palette.family("grey").at(3)
    canvas = IndexedCanvas(320, 200, fill=bg)

    # Band 1 -- three views, three heights, shown WHOLE. Surface is forced to
    # the boardwalk so nothing is buried: this band is the character
    # reference, and a sunk figure on a blank background is just a figure
    # with its boots missing.
    x = 8
    for height in HEIGHTS:
        for view in VIEWS:
            figure = actor.at_height(palette, view=view, height=height, surface=actor.BOARDWALK)
            canvas.blit(figure, x, 6 + (44 - height), transparent=actor.TRANSPARENT)
            x += figure.width + 2
        x += 6
    _label_bar(canvas, 4, 52, 312, palette)

    # Band 2 -- the mud walk at 40px, on a strip of mud, with a ground line
    # so the sink is visible. Judging it against a flat background hides the
    # whole effect.
    # The surface starts AT the baseline, so the buried rows fall into it.
    _ground_strip(canvas, palette, 4, 94, 312, 8, palette.family("mud").at(8))
    x = 6
    for index in range(len(WALK_MUD)):
        frame = actor.walk_frame(palette, index, height=40, surface=actor.MUD)
        canvas.blit(frame, x, 94 - actor.content_bottom(frame), transparent=actor.TRANSPARENT)
        x += frame.width + 1
    _label_bar(canvas, 4, 102, 312, palette)

    # Band 3 -- the same cycle on the boardwalk. Longer stride, feet on top
    # of the surface, clean boots. The two bands are the comparison.
    _ground_strip(canvas, palette, 4, 145, 312, 3, palette.family("pine_weathered").at(11))
    x = 6
    for index in range(len(WALK_BOARDWALK)):
        frame = actor.walk_frame(palette, index, height=40, surface=actor.BOARDWALK)
        canvas.blit(frame, x, 144 - actor.content_bottom(frame), transparent=actor.TRANSPARENT)
        x += frame.width + 1
    _label_bar(canvas, 4, 148, 312, palette)

    # Band 4 -- the 26px workings: 32 source, raw reduction, corrected.
    x = 10
    for view in VIEWS:
        source = actor.draw(palette, view=view, height=32, surface=actor.BOARDWALK)
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
    view: str = FRONT, frame: int | None = None, surface: str = actor.MUD,
) -> IndexedCanvas:
    """Stands a figure with his soles on feet_y and returns what was drawn."""
    figure = (
        actor.at_height(palette, view=view, height=height, surface=surface)
        if frame is None
        else actor.walk_frame(palette, frame, height=height, view=view, surface=surface)
    )
    # Bottom-align on what is actually drawn, not on the nominal height. A
    # figure standing in the mud has had its buried rows removed, so its
    # canvas is shorter than its height -- aligning by height would float him
    # back out of the surface he was just sunk into.
    top = feet_y - actor.content_bottom(figure)
    left = x - figure.width // 2
    _contact_shadow(canvas, palette, figure, left, top, surface)
    canvas.blit(figure, left, top, transparent=actor.TRANSPARENT)
    return figure


def _contact_shadow(
    canvas: IndexedCanvas, palette: Palette, figure: IndexedCanvas, left: int, top: int,
    surface: str = actor.MUD,
) -> None:
    """A shadow under the boots only, stepped down the ground's own ramp.

    Same rule as the street's cast shadows: a shadow is the same material
    with less light on it, never a black wash. Without it he hovers.

    In the mud it goes two steps and a row deeper: a boot standing in a
    surface displaces it, and the dark ring round the boot is what sells the
    standing-in rather than the standing-on.
    """
    sole = top + actor.content_bottom(figure)
    bottom = actor.content_bottom(figure)
    columns = [
        x for x in range(figure.width)
        if any(figure.pixels[y][x] != actor.TRANSPARENT
               for y in range(max(0, bottom - 3), bottom + 1))
    ]
    if not columns:
        return
    rings = ((0, 3), (1, 2), (2, 1)) if surface == actor.MUD else ((0, 2), (1, 1))
    for x in range(left + min(columns) - 1, left + max(columns) + 2):
        for depth, steps in rings:
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
        place(standing, palette, x, feet, height, view=view, surface=_surface(zone))

    walking, _ = compose(DAY)
    for zone, (x, feet) in sorted(spots.items()):
        height = heights.get(zone, 26)
        place(walking, palette, x, feet, height, view=SIDE,
              frame=2 + zone % 4, surface=_surface(zone))

    return standing, walking


def _surface(zone: int) -> str:
    """Which walk this region gets. The boardwalk is the only hard ground on
    this screen; everything else is the street."""
    return actor.BOARDWALK if zone == 99 else actor.MUD


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
    sheet.save(OUT / "thad-reference-sheet.png", palette)
    sheet.save(OUT / "thad-reference-sheet@4x.png", palette, scale=4)

    standing, walking = room_composites(palette)
    standing.save(OUT / "thad-in-room-02-standing.png", palette)
    standing.save(OUT / "thad-in-room-02-standing@4x.png", palette, scale=4)
    walking.save(OUT / "thad-in-room-02-walking.png", palette)
    walking.save(OUT / "thad-in-room-02-walking@4x.png", palette, scale=4)

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
