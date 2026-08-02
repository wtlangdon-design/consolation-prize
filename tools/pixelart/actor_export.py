"""Thad's shipping sprite sheets, and the clip table that indexes them.

The reference sheets in renders/ are for looking at. These are what the
engine loads.

TWO SHEETS, per ruling 24: the drawn near size and the drawn far size.
Everything between them is decimated at run time from the near sheet, so no
intermediate size is exported and none should be.

BOTH DIRECTIONS ARE EXPORTED rather than mirrored in the engine. Mirroring is
one line of canvas transform and it would work, but the light on this figure
falls from frame left in every drawing decision the wardrobe makes, and a
mirrored sprite lights him from the right for half the game. Flipping here
costs a few kilobytes of PNG and keeps the engine doing no transforms at all,
which is also the only way to be certain nothing lands on a half pixel.

The clip table goes to content/actors/thad.json. The engine reads frame rects
from there and knows nothing about how they were laid out -- same rule as the
room idle sheets, and for the same reason: two places computing the same
rectangle will eventually disagree.
"""

from __future__ import annotations

import json
from pathlib import Path

import actor
from canvas import IndexedCanvas
from superseded import refuse_if_superseded
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "art" / "actors"
TABLE = ROOT / "content" / "actors" / "thad.json"

#: Index 0 is void and the figure never uses it, so it is the key colour.
TRANSPARENT = actor.TRANSPARENT

LEFT, RIGHT, FRONT, BACK = "left", "right", "front", "back"
FACINGS = (FRONT, BACK, LEFT, RIGHT)

#: Which drawn view each facing comes from, and whether it is flipped.
#: He walks left and right across a lateral stage set; front and back are for
#: doorways and scripted beats.
VIEW_OF = {
    FRONT: (actor.FRONT, False),
    BACK: (actor.BACK, False),
    LEFT: (actor.SIDE, True),
    RIGHT: (actor.SIDE, False),
}


def flip(figure: IndexedCanvas) -> IndexedCanvas:
    out = IndexedCanvas(figure.width, figure.height, fill=TRANSPARENT)
    for y in range(figure.height):
        for x in range(figure.width):
            out.put(figure.width - 1 - x, y, figure.pixels[y][x])
    return out


def frames_for(palette: Palette, clip: str, facing: str, height: int,
               surface: str) -> list[IndexedCanvas]:
    """Every frame of one clip, in order, at one size and on one surface."""
    view, mirror = VIEW_OF[facing]
    if clip == "walk":
        cycle = actor.WALKS[surface]
        drawn = [actor.at_height(palette, view=view, height=height, surface=surface,
                                 **{k: v for k, v in step.items() if k != "sink"},
                                 sink=step["sink"])
                 for step in cycle]
    elif clip == "recoil":
        drawn = [actor.at_height(palette, view=view, height=height, surface=surface, **step)
                 for step in actor.RECOIL]
    else:
        # ERRATA 35b: idle is a CLIP now, not one frame. It was a single
        # standing pose in all four facings and both sizes, which is why the
        # man on screen more than anything else in the game was a statue.
        drawn = []
        for step in actor.IDLE:
            rows = step.get("breath", 0)
            figure = actor.at_height(palette, view=view, height=height, surface=surface,
                                     **{k: v for k, v in step.items() if k != "breath"})
            drawn.append(actor.breathe(figure, rows) if rows else figure)
    return [flip(figure) if mirror else figure for figure in drawn]


def build_sheet(palette: Palette, height: int) -> tuple[IndexedCanvas, list[dict]]:
    """One sheet and its clip table. Cells are uniform so the engine can
    stride by a constant instead of carrying a rect per frame."""
    build = actor.BUILDS[height]
    cell_w, cell_h = build.width, height + 2

    # Every clip in every facing, including the reaction. Exporting the
    # recoil front-only looked like a saving and was not: he recoils at
    # whatever he happens to be facing, and a missing facing fell through the
    # sprite's fallback to a standing frame, so the reaction silently did not
    # play for three quarters of the compass.
    plan: list[tuple[str, str, str, list[IndexedCanvas]]] = []
    for surface in actor.SURFACES:
        for facing in FACINGS:
            for clip in ("idle", "walk", "recoil"):
                plan.append((clip, facing, surface,
                             frames_for(palette, clip, facing, height, surface)))

    columns = max(len(frames) for _, _, _, frames in plan)
    sheet = IndexedCanvas(columns * cell_w, len(plan) * cell_h, fill=TRANSPARENT)

    clips = []
    for row, (clip, facing, surface, frames) in enumerate(plan):
        for column, figure in enumerate(frames):
            # Bottom-aligned on what is DRAWN, not on the nominal height: a
            # figure standing in mud has had its buried rows removed, so its
            # canvas is short, and aligning by height would float him back
            # out of the surface he was just sunk into.
            x = column * cell_w
            y = row * cell_h + (cell_h - 1 - actor.content_bottom(figure))
            sheet.blit(figure, x + (cell_w - figure.width) // 2, y,
                       transparent=TRANSPARENT)
        clips.append({
            "id": clip, "facing": facing, "surface": surface,
            "row": row, "frames": len(frames),
        })
    return sheet, clips


def main() -> None:
    palette = Palette.load()
    SHEETS.mkdir(parents=True, exist_ok=True)

    sizes = {}
    for name, height in (("near", actor.NEAR), ("far", actor.FAR)):
        sheet, clips = build_sheet(palette, height)
        path = SHEETS / f"thad-{name}.png"
        sheet.save_rgba(path, palette, transparent=TRANSPARENT)
        build = actor.BUILDS[height]
        sizes[name] = {
            "sheet": f"art/actors/thad-{name}.png",
            "height": height,
            "cell": [build.width, height + 2],
            "clips": clips,
        }
        print(f"wrote {path.relative_to(ROOT)}  {sheet.width}x{sheet.height}, "
              f"{len(clips)} clips")

    table = {
        "schema": 1,
        "id": "thad",
        "note": (
            "Errata ruling 24. Two drawn sizes and nothing between them: the "
            "engine decimates the near sheet for every height above the "
            "threshold and swaps to the far sheet at it. Frame rects are "
            "row * cell height, column * cell width -- declared here so the "
            "exporter and the engine cannot disagree about where a frame is. "
            "Anchor is the bottom centre of a cell: the figure's soles."
        ),
        "threshold": actor.eye_death_row(palette),
        "thresholdNote": (
            "The height at which decimation stops leaving him eyes. Measured "
            "by tools/pixelart/actor.py:eye_death_row, not chosen."
        ),
        "walkRate": 8.0,
        "reactRate": 7.0,
        # ERRATA 35b's long irregular cycle. Six frames at 2.4 Hz is a
        # two-and-a-half second loop -- slow enough to read as a man standing
        # rather than as a mechanism, and six divides evenly into nothing else
        # the game is doing. GENERATED HERE rather than hand-added to the
        # JSON: this file rewrites content/actors/thad.json wholesale, and a
        # value typed into the output is a value the next export deletes.
        "idleRate": 2.4,
        "sizes": sizes,
    }
    refuse_if_superseded(TABLE)
    TABLE.write_text(json.dumps(table, indent=2) + "\n")
    print(f"wrote {TABLE.relative_to(ROOT)}  threshold {table['threshold']}")


if __name__ == "__main__":
    main()
