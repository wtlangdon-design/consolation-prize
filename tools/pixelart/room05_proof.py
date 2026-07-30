"""Room 5 proof: Thad at all three zones, and the 17c check after the fact.

The plan audit in room05_assay.py runs before composition; this one runs
after, on the pixels that actually exist, and the two should agree. Where
they disagree the plan is wrong and needs the real number folding back in.
"""

from __future__ import annotations

import json
from pathlib import Path

import actor
import room05_assay
from actor import BACK, FRONT, SIDE
from canvas import IndexedCanvas
from interior import floor_zone_rows
from palette import Palette
from room03_proof import masses, percentiles
from room05_assay import BOX, HEIGHT, WIDTH

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "reference"

BAND_ZONES = (2, 1, 0)
#: Far one behind the counter is impossible -- the counter is in the way --
#: so the far figure stands at the counter and the near two downstage of it.
BAND_COLUMNS = (196, 108, 232)

#: Sample rectangles must isolate ONE surface. The first set overlapped --
#: the "floor, mid" box sat on top of the counter and the "back wall" box on
#: the shelves -- and the check reported two failures that were entirely an
#: artefact of measuring two materials at once. A contaminated sample is
#: indistinguishable from a real failure, which makes getting these right
#: part of the check rather than incidental to it.
SURFACES = {
    "back wall": (100, 72, 120, 6),          # the strip below the shelves
    "counter top": (70, 90, 180, 3),      # rows 90-92; row 93 is the dark lip
    "counter front": (70, 97, 180, 13),
    "shelf bank": (104, 30, 50, 38),
    "plank floor, near": (60, 122, 200, 18),
    "plank floor, mid": (100, 79, 55, 9),    # left of the service grille
    "left wall": (4, 40, 22, 40),
    "window": (250, 34, 22, 34),
}


def zone_heights() -> dict:
    scaling = json.loads((ROOT / "content" / "actors" / "scaling.json").read_text())
    return {z["index"]: z["height"] for z in scaling["zones"]}


def audit() -> int:
    palette = Palette.load()
    clean, _, _ = room05_assay.compose()
    reference = actor.at_height(palette, view=FRONT, height=40, surface=actor.BOARDWALK)
    dark, light = masses(palette, reference)

    print("ROOM 5 -- composed, per-surface (ruling 17c)")
    print(f"  {'surface':<20}{'p10':>8}{'p90':>8}   {'coat':>8}{'face':>10}")
    failures = 0
    for name, (sx, sy, sw, sh) in SURFACES.items():
        values = [
            palette.luminance(clean.get(px, py))
            for py in range(sy, min(HEIGHT, sy + sh))
            for px in range(sx, min(WIDTH, sx + sw))
        ]
        _, p10, p90 = percentiles(values)
        coat, face = p10 - dark, light - p90
        mark = lambda v: f"{v:+8.0f}" + ("   " if v >= 25 else " ! ")
        print(f"  {name:<20}{p10:>8.1f}{p90:>8.1f}   {mark(coat)}{mark(face)}")
        if coat < 25 and face < 25:
            failures += 1
    return failures


def composite() -> IndexedCanvas:
    palette = Palette.load()
    canvas, _, _ = room05_assay.compose()
    heights = zone_heights()
    views = (BACK, SIDE, FRONT)
    for index, (top, bottom) in enumerate(floor_zone_rows(BOX)):
        zone = BAND_ZONES[index]
        figure = actor.at_height(palette, view=views[index], height=heights[zone],
                                 surface=actor.BOARDWALK)
        x, feet = BAND_COLUMNS[index], bottom - 1
        fig_top = feet - actor.content_bottom(figure)
        left = x - figure.width // 2
        bot = actor.content_bottom(figure)
        cols = [c for c in range(figure.width)
                if any(figure.pixels[r][c] != actor.TRANSPARENT
                       for r in range(max(0, bot - 3), bot + 1))]
        if cols:
            for px in range(left + min(cols) - 1, left + max(cols) + 2):
                for depth, steps in ((0, 2), (1, 1)):
                    canvas.put(px, fig_top + bot - depth,
                               palette.darken(canvas.get(px, fig_top + bot - depth), steps))
        canvas.blit(figure, left, fig_top, transparent=actor.TRANSPARENT)
    return canvas


def main() -> None:
    palette = Palette.load()
    scene = composite()
    scene.save(OUT / "room-05-thad.png", palette)
    scene.save(OUT / "room-05-thad@4x.png", palette, scale=4)
    failures = audit()
    print()
    print("PASS" if failures == 0 else f"FAIL -- {failures} surface(s) with no anchor")
    print(f"wrote {(OUT / 'room-05-thad@4x.png').relative_to(ROOT)}")


if __name__ == "__main__":
    main()

