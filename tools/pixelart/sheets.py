"""Reference sheets: the locked palette, and every component drawn once."""

from __future__ import annotations

import random
from pathlib import Path

from canvas import IndexedCanvas
from components import (
    barrel,
    boardwalk,
    crate,
    distant_hills,
    door,
    false_front_cornice,
    hitching_rail,
    mud_street,
    plank_wall,
    shingle_roof,
    sky_gradient,
    water_trough,
    window,
)
from palette import Palette
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]
OUT = RENDERS


def palette_sheet(palette: Palette) -> IndexedCanvas:
    """16x16 grid of swatches, one cell per palette entry, family bands
    separated by a rule so the ramps are readable as ramps."""
    cell = 8
    canvas = IndexedCanvas(16 * cell, 16 * cell, fill=0)
    for index in range(256):
        col, row = index % 16, index // 16
        canvas.rect(col * cell, row * cell, cell, cell, index)

    # Mark where each family begins with a notch in the corner of its cell.
    ink = palette.role("inkBright")
    for span in palette.data["families"].values():
        start = span["start"]
        col, row = start % 16, start // 16
        canvas.put(col * cell, row * cell, ink)
        canvas.put(col * cell + 1, row * cell, ink)
        canvas.put(col * cell, row * cell + 1, ink)
    return canvas


def component_sheet(palette: Palette) -> IndexedCanvas:
    rng = random.Random(7)
    canvas = IndexedCanvas(320, 200, fill=palette.family("grey").frac(0.30))

    pine = palette.family("pine_weathered")
    fresh = palette.family("pine_fresh")
    umber = palette.family("umber")
    grey = palette.family("grey")
    sky = palette.family("sky")
    sage = palette.family("sage")
    mud = palette.family("mud")
    ochre = palette.family("ochre")

    # Row 1 -- atmosphere
    sky_gradient(canvas, 4, 4, 100, 40, sky)
    distant_hills(canvas, 4, 24, 100, 20, sage, rng, layers=3, amplitude=7)
    mud_street(canvas, 110, 4, 100, 40, mud, rng, grit=ochre)
    shingle_roof(canvas, 216, 4, 100, 40, umber, rng)

    # Row 2 -- wall systems
    plank_wall(canvas, 4, 52, 100, 44, pine, rng, base=0.52)
    false_front_cornice(canvas, 110, 52, 100, 18, pine, base=0.60, accent=palette.family("accent_gold"))
    plank_wall(canvas, 110, 70, 100, 26, fresh, rng, base=0.46, weathering=0.0)
    window(canvas, 224, 56, 26, 34, pine, grey, rng, panes=(2, 3))
    window(canvas, 262, 56, 26, 34, pine, grey, rng, lit=True, panes=(2, 3))
    door(canvas, 292, 62, 22, 32, pine, rng, base=0.44)

    # Row 3 -- ground and furniture
    boardwalk(canvas, 4, 108, 150, 12, pine, rng, base=0.60)
    barrel(canvas, 168, 100, 14, 20, fresh, grey, rng)
    barrel(canvas, 186, 104, 12, 16, umber, grey, rng)
    crate(canvas, 204, 102, 22, 18, fresh, rng)
    crate(canvas, 230, 108, 16, 12, ochre, rng)
    hitching_rail(canvas, 252, 104, 60, 16, pine, rng)

    water_trough(canvas, 4, 132, 54, 16, pine, sky, rng)
    mud_street(canvas, 66, 128, 250, 68, mud, rng, grit=ochre)
    boardwalk(canvas, 66, 128, 250, 10, pine, rng, base=0.58)

    return canvas


def main() -> None:
    palette = Palette.load()
    OUT.mkdir(parents=True, exist_ok=True)

    sheet = palette_sheet(palette)
    sheet.save(OUT / "palette-256-locked.png", palette)
    sheet.save(OUT / "palette-256-locked@4x.png", palette, scale=4)

    components = component_sheet(palette)
    components.save(OUT / "component-library-exterior.png", palette)
    components.save(OUT / "component-library-exterior@4x.png", palette, scale=4)

    print(f"wrote {(OUT / 'palette-256.png').relative_to(ROOT)} and @4x")
    print(f"wrote {(OUT / 'components.png').relative_to(ROOT)} and @4x")
    print(f"component sheet uses {len(components.used_indices())} colours")


if __name__ == "__main__":
    main()
