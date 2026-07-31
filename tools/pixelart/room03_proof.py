"""Room 3 proof: Thad at all three depth zones, and the ruling 16 audit.

Ruling 16 rule 1 says a character's palette is validated by measurement
against every room they appear in, and rule 4 gives the threshold: the
darkest large mass below the background's 10th percentile, or the lightest
large mass above its 90th, preferably both.

Room 2 was the easy case. Thad was built against mud measuring 44-58, so his
coat went down to 33 and his face and shirt did the work. This room inverts
half of that: the bar top and the lit floor are far lighter than mud, which
is exactly the condition under which a dark coat starts carrying him and a
pale face stops. The point of this file is to find out which, with numbers,
before eleven interiors get built on the assumption.
"""

from __future__ import annotations

import json
from pathlib import Path

import actor
import legibility
import legibility_audit
import room03_nugget
from actor import BACK, FRONT, SIDE
from canvas import IndexedCanvas
from interior import floor_zone_rows
from legibility import anchors
from palette import Palette
from renders import RENDERS
from room03_nugget import BOX, HEIGHT, WIDTH

ROOT = Path(__file__).resolve().parents[2]
OUT = RENDERS

#: Zone index per floor band, back to front. floor_zone_rows returns spans
#: far-to-near; the scaling file numbers zones near-to-far, so this is the
#: mapping between the two and not a redundant list.
BAND_ZONES = (2, 1, 0)

#: Where in each band to stand him, chosen to put him against different
#: things -- the far one against the back wall, the mid one on open floor,
#: the near one against the bar -- and clear of the tables, which he was
#: otherwise standing on top of.
BAND_COLUMNS = (140, 196, 246)


def zone_heights() -> dict[int, int]:
    scaling = json.loads((ROOT / "content" / "actors" / "scaling.json").read_text())
    return {zone["index"]: zone["height"] for zone in scaling["zones"]}


def percentiles(values: list[float]) -> tuple[float, float, float]:
    ordered = sorted(values)
    if not ordered:
        return 0.0, 0.0, 0.0
    return (
        sum(ordered) / len(ordered),
        ordered[len(ordered) // 10],
        ordered[len(ordered) * 9 // 10],
    )


def masses(palette: Palette, figure: IndexedCanvas) -> tuple[float, float]:
    """Luminance of his darkest and lightest LARGE masses.

    Large matters. A single lit pixel on a boot buckle is not legibility, so
    anything covering under a fortieth of the drawn figure is ignored -- that
    is roughly what one eye or one cuff comes to at 40px, and ruling 16 rule
    4 is explicitly about masses.
    """
    counts: dict[int, int] = {}
    for y in range(figure.height):
        for x in range(figure.width):
            index = figure.pixels[y][x]
            if index != actor.TRANSPARENT:
                counts[index] = counts.get(index, 0) + 1
    drawn = sum(counts.values())
    floor = max(2, drawn // 40)
    large = [index for index, count in counts.items() if count >= floor]
    if not large:
        large = list(counts)
    lums = [palette.luminance(index) for index in large]
    return min(lums), max(lums)


def audit(verbose: bool = True) -> int:
    palette = Palette.load()
    clean, _, _ = room03_nugget.compose()
    heights = zone_heights()
    bands = floor_zone_rows(BOX)

    failures = 0
    if verbose:
        print("ROOM 3 -- Thad against the Bountiful Nugget (errata ruling 16)")
        print(f"  {'where':<22}{'bg mean':>9}{'p10':>8}{'p90':>8}"
              f"{'dark':>8}{'light':>8}   verdict")

    for band_index, (top, bottom) in enumerate(bands):
        zone = BAND_ZONES[band_index]
        height = heights[zone]
        x = BAND_COLUMNS[band_index]
        feet = bottom - 1
        figure = actor.at_height(palette, view=FRONT, height=height, surface=actor.MUD)
        fig_top = feet - actor.content_bottom(figure)
        left = x - figure.width // 2

        behind: list[float] = []
        for fy in range(figure.height):
            for fx in range(figure.width):
                if figure.pixels[fy][fx] == actor.TRANSPARENT:
                    continue
                behind.append(palette.luminance(clean.get(left + fx, fig_top + fy)))
        mean, p10, p90 = percentiles(behind)
        dark, light = masses(palette, figure)

        dark_reads = dark < p10
        light_reads = light > p90
        if dark_reads and light_reads:
            verdict = "ok -- both"
        elif dark_reads:
            verdict = "ok -- coat only"
        elif light_reads:
            verdict = "ok -- face only"
        else:
            verdict = "FAILS -- neither"
            failures += 1

        if verbose:
            label = f"zone {zone} ({height}px)"
            print(f"  {label:<22}{mean:>9.1f}{p10:>8.1f}{p90:>8.1f}"
                  f"{dark:>8.1f}{light:>8.1f}   {verdict}")

    # Per-surface cross-check, delegated.
    #
    # This used to be a second implementation of ruling 16 living here: its
    # own anchors, its own rectangles, its own threshold. Every fix made to
    # the shared one since then missed it, so by the time doc 19 put eleven
    # men in this room it was reporting a FAIL using the keyline as the dark
    # anchor -- the exact bug legibility.py was written to kill -- against
    # rectangles that now have people standing in them.
    #
    # One implementation. legibility_audit.py owns the geometry; this owns
    # the zone composite, which is the thing it is actually for.
    dark, light = anchors(palette)
    _, fails, _ = legibility.audit(
        clean, palette, "  per-surface (shared geometry, rulings 16, 17c, 18)",
        legibility_audit.ROOM_03, legibility_audit.ROOM_03_LIGHTS,
        dark, light, verbose=verbose)
    failures += fails

    return failures


def composite() -> IndexedCanvas:
    """Thad standing in the room at all three zones."""
    palette = Palette.load()
    canvas, _, _ = room03_nugget.compose()
    heights = zone_heights()
    views = (BACK, SIDE, FRONT)

    for band_index, (top, bottom) in enumerate(floor_zone_rows(BOX)):
        zone = BAND_ZONES[band_index]
        figure = actor.at_height(
            palette, view=views[band_index], height=heights[zone], surface=actor.MUD,
        )
        x = BAND_COLUMNS[band_index]
        feet = bottom - 1
        fig_top = feet - actor.content_bottom(figure)
        left = x - figure.width // 2
        _contact(canvas, palette, figure, left, fig_top)
        canvas.blit(figure, left, fig_top, transparent=actor.TRANSPARENT)
    return canvas


def _contact(
    canvas: IndexedCanvas, palette: Palette, figure: IndexedCanvas, left: int, top: int,
) -> None:
    bottom = actor.content_bottom(figure)
    sole = top + bottom
    columns = [
        x for x in range(figure.width)
        if any(figure.pixels[y][x] != actor.TRANSPARENT
               for y in range(max(0, bottom - 3), bottom + 1))
    ]
    if not columns:
        return
    for x in range(left + min(columns) - 1, left + max(columns) + 2):
        for depth, steps in ((0, 3), (1, 2), (2, 1)):
            y = sole - depth
            canvas.put(x, y, palette.darken(canvas.get(x, y), steps))


def main() -> None:
    palette = Palette.load()
    OUT.mkdir(parents=True, exist_ok=True)
    scene = composite()
    scene.save(OUT / "room-03-nugget-with-thad.png", palette)
    scene.save(OUT / "room-03-nugget-with-thad@4x.png", palette, scale=4)
    failures = audit()
    print()
    print("PASS" if failures == 0 else f"FAIL -- {failures} zone(s) where he does not read")
    print(f"wrote {(OUT / 'room-03-thad@4x.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
