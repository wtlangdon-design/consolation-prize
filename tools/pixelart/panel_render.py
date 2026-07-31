"""The verb panel and inventory, drawn for review. Errata ruling 26.

Two pictures at 1x and 4x: the panel as the game currently draws it, and the
panel with a long list in it so the scroll and the name-length problem can be
looked at rather than reasoned about.

EVERY NUMBER COMES FROM content/ui/panel.json, which is the same file the
engine reads. This module deliberately hard-codes no geometry: a review render
that agrees with a description of the layout rather than with the layout is
worse than no render, because it looks like evidence.

The long list is a DEMONSTRATION, not content. The names are doc 01's core
inventory, quoted, and they are here to show two things: that four rows plus
arrows reads at 1x, and that "Form 12-C (Amended, Void)" does not fit -- which
is the case errata 26 point 2 asks for a rule about, and the reason that rule
is authored short names rather than computed truncation.
"""

from __future__ import annotations

import json
from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette, Ramp
from renders import RENDERS
from title_screen import game_font

ROOT = Path(__file__).resolve().parents[2]
WIDTH, PANEL_Y, HEIGHT = 320, 144, 200

#: Doc 01's core inventory, quoted for the layout proof. Three of these are
#: the Act II running gag whose whole joke is that they are tellable apart.
DEMO = [
    "THE TUNING FORK",
    "THE DEED",
    "THE COMPANY MAP",
    "FORM 12-C",
    "FORM 12-C (AMENDED)",
    "FORM 12-C (AMENDED, VOID)",
    "A POCKET WATCH",
    "SOMEONE ELSE'S TEETH",
]


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
    visible = inventory["rows"]
    over = []
    for row in range(visible):
        index = scroll + row
        if index >= len(items):
            break
        y = inventory["y"] + row * inventory["rowHeight"]
        if index == held:
            canvas.rect(inventory["x"], y, inventory["width"], inventory["rowHeight"],
                        grey.frac(0.30))
        width = game_font(canvas, items[index], inventory["x"] + 2, y + 2, bone,
                          0.94 if index == held else 0.72)
        if width > inventory["width"] - 4:
            over.append((items[index], width))

    arrows = inventory["arrows"]
    half = (inventory["rowHeight"] * visible) // 2
    for up in (True, False):
        rect = {"x": arrows["x"], "y": inventory["y"] + (0 if up else half),
                "width": arrows["width"], "height": half}
        canvas.rect(rect["x"], rect["y"], rect["width"], rect["height"], grey.frac(0.16))
        live = scroll > 0 if up else scroll + visible < len(items)
        triangle(canvas, rect, up, bone, 0.94 if live else 0.34)

    return {"overflow": over, "room": inventory["width"] - 4}


def main() -> None:
    palette = Palette.load()
    panel = _load("panel")
    verbs = _load("verbs")
    RENDERS.mkdir(parents=True, exist_ok=True)

    # Two panels stacked, so the layout can be compared against itself with a
    # short list and a long one.
    canvas = IndexedCanvas(WIDTH, (HEIGHT - PANEL_Y) * 2 + 4,
                           fill=palette.family("void").at(0))

    short = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))
    draw_panel(short, palette, panel, verbs, "Look at THE TUNING FORK",
               ["THE TUNING FORK"], 0, 0)

    long = IndexedCanvas(WIDTH, HEIGHT, fill=palette.family("void").at(0))
    report = draw_panel(long, palette, panel, verbs, "Use THE COMPANY MAP on THE MUD",
                        DEMO, 2, 2)

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
    print(f"  inventory: {panel['inventory']['rows']} rows visible, "
          f"row holds {report['room']}px")
    for name, width in report["overflow"]:
        print(f"  DOES NOT FIT: \"{name}\" at {width}px -- needs an authored short name")
    if not report["overflow"]:
        print("  every demonstration name fits")


if __name__ == "__main__":
    main()
