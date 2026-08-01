"""Two-frame idle sprites for drawn crowds. Errata ruling 20.

Ruling 20 corrects doc 18's framing: sprites are the game's principal source
of motion, not palette cycling. A drawn crowd of four or more needs at least
three animated members, and the eye gives the rest the credit.

WHY THE SHEET IS BUILT FROM ROOM JSON. The animated members must not also be
painted into the background, or they appear twice -- once still and once
moving, a pixel apart. So exactly one place has to own their positions, and
it is the room file, for the same reason the cycling bands live there: the
engine needs them at runtime and the composition needs them at build time,
and two copies of a coordinate stay in agreement for about one commit.

The composition reads this and DOES NOT paint them. It asserts the total.
"""

from __future__ import annotations

import json
from pathlib import Path

import crowd
from canvas import IndexedCanvas
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]

#: Where idle sheets ship. Not renders -- the engine loads these.
SHEETS = ROOT / "art" / "idles"

#: The transparency key, same as the foreground planes use.
TRANSPARENT = 255


def load(room_id: str) -> tuple[dict, list[dict]]:
    """The room's idle block and its figures, or ({}, []) if it has none."""
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    for relative in manifest["rooms"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if data["id"] != room_id:
            continue
        block = data.get("idles") or {}
        return block, block.get("figures", [])
    raise KeyError(f"no room declares id {room_id!r}")


def sheet(room_id: str, palette: Palette, rng, seed_base: int = 0) -> IndexedCanvas:
    """Both frames of every idle figure, laid out as the room JSON declares.

    Each figure gets two cells side by side. The cell rects are declared in
    content rather than computed here, so the engine and the sheet cannot
    disagree about where a frame is -- the engine reads the same numbers.
    """
    block, figures = load(room_id)
    if not figures:
        raise RuntimeError(f"{room_id} declares no idle figures")

    width = max(frame[0] + frame[2] for figure in figures for frame in figure["frames"])
    height = max(frame[1] + frame[3] for figure in figures for frame in figure["frames"])
    canvas = IndexedCanvas(width, height, fill=TRANSPARENT)

    # THE SEED CONTINUES THE ROOM'S COUNTER. It was never passed at all, so
    # all four of the Nugget's ANIMATED men were _build(0) -- one hat, one
    # posture, one girth, one stoop, four times over, and they are the four a
    # player's eye goes to because they are the ones that move.
    #
    # An offset rather than a hash: the painted seven take 0..6 and these take
    # 7..10, so the room's eleven men occupy eleven consecutive seeds and no
    # two share a build. Hashing the id would be tidier and it collides --
    # crc32 % 97 puts two of these four on the same number.
    for index, figure in enumerate(figures):
        for pose, frame in enumerate(figure["frames"]):
            fx, fy, fw, fh = frame
            # Feet on the cell's bottom row, centred. The engine places the
            # cell by the same rule, so a figure drawn here lands where its
            # `at` says on screen.
            if figure["kind"] == "seated":
                crowd.seated(canvas, palette, fx + fw // 2, fy + fh - 1,
                             figure["height"], rng, pose=pose,
                             seed=seed_base + index)
            else:
                crowd.standing(canvas, palette, fx + fw // 2, fy + fh - 1,
                               figure["height"], rng, pose=pose,
                               glass=bool(figure.get("glass")),
                               seed=seed_base + index)
    return canvas
