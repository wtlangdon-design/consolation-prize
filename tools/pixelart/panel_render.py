"""The verb panel and inventory, drawn for review. Errata 26, as amended by 29.

Two pictures at 1x and 4x: the panel as the game currently draws it, and the
panel with a long list in it so the scroll and the name-length problem can be
looked at rather than reasoned about.

EVERY NUMBER COMES FROM content/ui/panel.json, which is the same file the
engine reads. This module deliberately hard-codes no geometry: a review render
that agrees with a description of the layout rather than with the layout is
worse than no render, because it looks like evidence.

ERRATA 29 replaced the text list with a grid of icons. What is drawn here is
what the game draws: the same sheet, the same cells, the same geometry, read
from the same JSON. The names have not gone anywhere -- they draw in the
sentence line on hover and on selection, which is ruling 29's first condition,
and the top panel shows one doing it.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from canvas import IndexedCanvas
from palette import Palette, Ramp
from renders import RENDERS
from title_screen import game_font

ROOT = Path(__file__).resolve().parents[2]
WIDTH, PANEL_Y, HEIGHT = 320, 144, 200

def act_one_items() -> list[str]:
    """Doc 23's eight item ids, in manifest order. Fixtures excluded."""
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    ids = []
    for relative in manifest["items"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if not data.get("fixture"):
            ids.append(data["id"])
    return ids


def display_names() -> dict:
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    names = {}
    for relative in manifest["items"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        names[data["id"]] = data.get("short") or data["name"]
    return names


def _load(name: str) -> dict:
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    return json.loads((ROOT / manifest[name]).read_text(encoding="utf-8"))


def triangle(canvas: IndexedCanvas, rect: dict, up: bool, ramp: Ramp, tone: float) -> None:
    rows = 4
    centre = rect["x"] + rect["width"] // 2
    top = rect["y"] + (rect["height"] - rows) // 2
    for row in range(rows):
        spread = row if up else rows - 1 - row
        canvas.rect(centre - spread, top + row, spread * 2 + 1, 1, ramp.frac(tone))


def draw_panel(canvas: IndexedCanvas, palette: Palette, panel: dict, verbs: dict,
               sentence: str, items: list[str], scroll: int, held: int | None) -> dict:
    grey = palette.family("grey")
    bone = palette.family("bone")
    umber = palette.family("umber")

    canvas.rect(0, PANEL_Y, WIDTH, HEIGHT - PANEL_Y, umber.frac(0.06))
    game_font(canvas, sentence, panel["sentence"]["x"], panel["sentence"]["y"], bone, 0.94)

    spec = panel["verbs"]
    for verb in verbs["verbs"]:
        x = spec["cols"][verb["col"]]
        y = spec["rows"][verb["row"]]
        canvas.rect(x, y, spec["width"], spec["height"], grey.frac(0.16))
        game_font(canvas, verb["label"], x + 3, y + 2, bone, 0.72)

    button = panel["menuButton"]
    bx = spec["cols"][button["col"]]
    by = spec["rows"][button["row"]]
    canvas.rect(bx, by, spec["width"], spec["height"], grey.frac(0.16))
    # Measured, not nudged. A hand-tuned offset is right until the label or
    # the button width changes, and then it is quietly wrong forever.
    label = "MENU"
    label_w = game_font(IndexedCanvas(WIDTH, 8), label, 0, 0, bone, 0.0)
    game_font(canvas, label, bx + (spec["width"] - label_w) // 2, by + 2, bone, 0.72)

    inventory = panel["inventory"]
    cell_w, cell_h = inventory["cell"]
    cols, rows = inventory["cols"], inventory["rows"]
    visible = cols * rows
    over = []

    icons = json.loads((ROOT / "content" / "ui" / "item-icons.json").read_text(encoding="utf-8"))
    sheet_image = Image.open(ROOT / icons["sheet"]).convert("RGBA")
    sheet = sheet_image.load()
    lookup = {tuple(palette.colours[i]): i for i in range(len(palette.colours))}

    for slot in range(visible):
        index = scroll + slot
        if index >= len(items):
            break
        x = inventory["x"] + (slot % cols) * cell_w
        y = inventory["y"] + (slot // cols) * cell_h
        if index == held:
            canvas.rect(x, y, cell_w, cell_h, grey.frac(0.30))
        cell = icons["icons"].get(items[index])
        if not cell:
            continue
        for row in range(cell[3]):
            for col in range(cell[2]):
                red, green, blue, alpha = sheet[cell[0] + col, cell[1] + row]
                if alpha:
                    canvas.put(x + col, y + row, lookup[(red, green, blue)])
        if index == held:
            canvas.outline(x, y, cell_w, cell_h, bone.frac(0.94))

    arrows = inventory["arrows"]
    half = (cell_h * rows) // 2
    for up in (True, False):
        rect = {"x": arrows["x"], "y": inventory["y"] + (0 if up else half),
                "width": arrows["width"], "height": half}
        canvas.rect(rect["x"], rect["y"], rect["width"], rect["height"], grey.frac(0.16))
        live = scroll > 0 if up else scroll + visible < len(items)
        triangle(canvas, rect, up, bone, 0.94 if live else 0.34)

    return {"overflow": over}


def main() -> None:
    palette = Palette.load()
    panel = _load("panel")
    verbs = _load("verbs")
    RENDERS.mkdir(parents=True, exist_ok=True)

    # Two panels stacked, so the layout can be compared against itself with a
    # short list and a long one.
    canvas = IndexedCanvas(WIDTH, (HEIGHT - PANEL_Y) * 2 + 4,
                           fill=palette.family("void").at(0))

    items = act_one_items()
    names = display_names()

    # Top: hovering an icon. The NAME is in the sentence line, which is ruling
    # 29 condition 1 and the reason the authored display names survived the
    # move from text to icons.
    short = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))
    draw_panel(short, palette, panel, verbs, f"Look at {names['letter']}", items, 0, None)

    # Bottom: one selected and applied to something in the room.
    long = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))
    report = draw_panel(long, palette, panel, verbs,
                        f"Use {names['tuning_fork']} on POSTED NOTICES", items, 0, 0)

    for index, source in enumerate((short, long)):
        for y in range(PANEL_Y, HEIGHT):
            for x in range(WIDTH):
                canvas.put(x, (HEIGHT - PANEL_Y + 4) * index + (y - PANEL_Y),
                           source.get(x, y))

    canvas.save(RENDERS / "verb-panel-and-inventory.png", palette)
    canvas.save(RENDERS / "verb-panel-and-inventory@4x.png", palette, scale=4)
    print("wrote renders/verb-panel-and-inventory.png and @4x.png")
    print(f"  verbs {len(verbs['verbs'])} in {len(panel['verbs']['cols'])} columns of "
          f"{len(panel['verbs']['rows'])}; the fourth row carries MENU")
    print(f"  inventory: {panel['inventory']['cols']}x{panel['inventory']['rows']} icons "
          f"at {panel['inventory']['cell'][0]}x{panel['inventory']['cell'][1]}, "
          f"{len(items)} carried")


if __name__ == "__main__":
    main()
