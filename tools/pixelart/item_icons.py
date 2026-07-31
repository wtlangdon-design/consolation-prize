"""Inventory icons for Act I's eight items. Errata 29.

Ruling 26 made the inventory text on the grounds that the 1990 original did.
Errata 29 overturns it: that was accuracy reasoning rather than design
reasoning, MI2's icon panel is the better interface, and this game targets the
era's discipline rather than its limitations.

TWO THINGS THE ICONS HAVE TO DO, and the second is the one that can fail
silently:

  1. Read at 28x19 against the panel's dark ground. Small, flat, high
     contrast, and no more detail than survives at 1x.
  2. BE DISTINGUISHABLE FROM EACH OTHER. Form 12-C, Form 12-C (Amended) and
     Form 12-C (Amended, Void) are three items whose whole running gag is that
     they can be told apart. Drawn as three identical papers the joke dies and
     nothing reports it -- the build passes, the panel looks right, and a
     player never learns there was a joke. check-item-names fails on two items
     rendering the same icon for exactly that reason: the uniqueness half was
     always what protected it, and only the medium has changed.

The three paper items in Act I -- the letter, the deed, the map -- are the
same near-identical risk one act early, so they are drawn as three different
papers rather than three papers with different marks on them: a sealed
envelope, a hand-drawn deed with a wax blob, a printed map with a circle on
it. The escalation trick the Form 12-Cs will need is the fallback for items
that genuinely ARE the same object twice; it is not the first move.
"""

from __future__ import annotations

import json
from pathlib import Path

from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]

#: One cell. Four across the panel's 122px inventory column, two rows deep.
CELL_W, CELL_H = 30, 21
COLS = 4

#: Transparency key, as every other sheet uses.
TRANSPARENT = 255


def _paper(canvas: IndexedCanvas, palette: Palette, x: int, y: int, w: int, h: int,
           tone: float = 0.62) -> None:
    bone = palette.family("bone")
    umber = palette.family("umber")
    canvas.rect(x, y, w, h, bone.frac(tone))
    canvas.hline(x, y, w, bone.frac(min(0.96, tone + 0.26)))
    canvas.vline(x, y, h, bone.frac(min(0.96, tone + 0.18)))
    canvas.hline(x, y + h - 1, w, umber.frac(0.14))
    canvas.vline(x + w - 1, y, h, umber.frac(0.20))


def _writing(canvas: IndexedCanvas, palette: Palette, x: int, y: int, w: int,
             rows: int, step: int = 2) -> None:
    ink = palette.family("umber")
    for row in range(rows):
        canvas.hline(x, y + row * step, w - (row % 2) * 2, ink.frac(0.16))


def tuning_fork(canvas: IndexedCanvas, palette: Palette) -> None:
    """Two tines and a stem. The one silhouette the player must never mistake."""
    grey = palette.family("grey")
    void = palette.family("void")
    steel, bright = grey.frac(0.62), grey.frac(0.92)
    for tine in (11, 17):
        canvas.rect(tine, 3, 2, 8, steel)
        canvas.put(tine, 3, bright)
    canvas.rect(11, 11, 8, 2, steel)
    canvas.hline(11, 11, 8, bright)
    canvas.rect(14, 13, 2, 5, steel)
    canvas.rect(13, 17, 4, 2, grey.frac(0.40))
    canvas.vline(10, 3, 8, void.at(0))
    canvas.vline(19, 3, 8, void.at(0))


def letter(canvas: IndexedCanvas, palette: Palette) -> None:
    """Sealed, and the seal is what tells it from the other two papers."""
    _paper(canvas, palette, 6, 4, 18, 13, tone=0.70)
    fold = palette.family("umber")
    canvas.line(6, 4, 15, 11, fold.frac(0.22))
    canvas.line(23, 4, 15, 11, fold.frac(0.22))
    seal = palette.family("accent_red")
    canvas.rect(14, 10, 3, 3, seal.frac(0.60))
    canvas.put(14, 10, seal.frac(0.86))


def four_dollars(canvas: IndexedCanvas, palette: Palette) -> None:
    """Four coins, and four is the number the writing keeps saying."""
    gold = palette.family("accent_gold")
    void = palette.family("void")
    for index, (cx, cy) in enumerate(((10, 7), (17, 6), (11, 13), (19, 12))):
        canvas.rect(cx, cy, 5, 5, gold.frac(0.52))
        canvas.hline(cx + 1, cy, 3, gold.frac(0.86))
        canvas.hline(cx + 1, cy + 4, 3, gold.frac(0.28))
        canvas.outline(cx - 1, cy - 1, 7, 7, void.at(0))
        if index == 1:
            canvas.put(cx + 2, cy + 2, gold.frac(0.30))


def deed(canvas: IndexedCanvas, palette: Palette) -> None:
    """Hand-drawn, badly, with a wax blob. Doc 02 calls it badly drawn."""
    _paper(canvas, palette, 7, 3, 16, 15, tone=0.56)
    _writing(canvas, palette, 9, 6, 12, 3)
    # A boundary sketched "from the stake, thereabouts".
    line = palette.family("umber")
    canvas.line(10, 13, 15, 11, line.frac(0.10))
    canvas.line(15, 11, 20, 14, line.frac(0.10))
    wax = palette.family("accent_rust")
    canvas.rect(18, 15, 3, 3, wax.frac(0.52))


def company_map(canvas: IndexedCanvas, palette: Palette) -> None:
    """Printed, folded, and something on it is already circled."""
    _paper(canvas, palette, 5, 4, 20, 13, tone=0.78)
    fold = palette.family("grey")
    canvas.vline(12, 4, 13, fold.frac(0.34))
    canvas.vline(19, 4, 13, fold.frac(0.34))
    road = palette.family("umber")
    canvas.line(6, 14, 24, 8, road.frac(0.18))
    canvas.line(14, 16, 17, 5, road.frac(0.18))
    ring = palette.family("accent_red")
    canvas.outline(19, 8, 5, 5, ring.frac(0.70))


def horse_blanket(canvas: IndexedCanvas, palette: Palette) -> None:
    """Folded wool with a stripe. Nothing else in the panel is soft."""
    wool = palette.family("umber")
    stripe = palette.family("accent_rust")
    canvas.rect(6, 6, 18, 10, wool.frac(0.30))
    canvas.hline(6, 6, 18, wool.frac(0.48))
    canvas.hline(6, 15, 18, wool.frac(0.12))
    canvas.hline(6, 9, 18, stripe.frac(0.50))
    canvas.hline(6, 12, 18, stripe.frac(0.36))
    for x in range(7, 24, 4):
        canvas.put(x, 16, wool.frac(0.20))


def pickaxe(canvas: IndexedCanvas, palette: Palette) -> None:
    """The head is loose, and it is drawn loose -- off the haft by a pixel."""
    wood = palette.family("mud")
    iron = palette.family("grey")
    canvas.line(9, 17, 20, 4, wood.frac(0.40))
    canvas.line(10, 17, 21, 4, wood.frac(0.24))
    # The head, sitting a pixel proud of where it should be.
    canvas.line(15, 5, 24, 8, iron.frac(0.58))
    canvas.line(15, 6, 24, 9, iron.frac(0.34))
    canvas.line(15, 5, 8, 9, iron.frac(0.58))
    canvas.line(15, 6, 8, 10, iron.frac(0.34))


def filing_fee(canvas: IndexedCanvas, palette: Palette) -> None:
    """Two coins. Deliberately not four -- the count is the difference."""
    gold = palette.family("accent_gold")
    void = palette.family("void")
    for cx, cy in ((11, 8), (17, 11)):
        canvas.rect(cx, cy, 6, 6, gold.frac(0.46))
        canvas.hline(cx + 1, cy, 4, gold.frac(0.80))
        canvas.hline(cx + 1, cy + 5, 4, gold.frac(0.24))
        canvas.outline(cx - 1, cy - 1, 8, 8, void.at(0))


ICONS = {
    "tuning_fork": tuning_fork,
    "letter": letter,
    "four_dollars": four_dollars,
    "deed": deed,
    "company_map": company_map,
    "horse_blanket": horse_blanket,
    "pickaxe": pickaxe,
    "filing_fee": filing_fee,
}


def item_order() -> list[str]:
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    ids = []
    for relative in manifest["items"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if not data.get("fixture"):
            ids.append(data["id"])
    return ids


def build(palette: Palette) -> tuple[IndexedCanvas, dict]:
    ids = item_order()
    rows = (len(ids) + COLS - 1) // COLS
    sheet = IndexedCanvas(COLS * CELL_W, rows * CELL_H, fill=TRANSPARENT)
    cells = {}
    for index, item in enumerate(ids):
        draw = ICONS.get(item)
        if draw is None:
            raise KeyError(f"no icon drawn for item {item!r}")
        cell = IndexedCanvas(CELL_W, CELL_H, fill=TRANSPARENT)
        draw(cell, palette)
        x, y = (index % COLS) * CELL_W, (index // COLS) * CELL_H
        sheet.blit(cell, x, y, transparent=TRANSPARENT)
        cells[item] = [x, y, CELL_W, CELL_H]
    return sheet, cells


def main() -> None:
    palette = Palette.load()
    sheet, cells = build(palette)
    out = ROOT / "art" / "ui" / "item-icons.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save_rgba(out, palette, transparent=TRANSPARENT)

    table = ROOT / "content" / "ui" / "item-icons.json"
    table.write_text(json.dumps({
        "schema": 1,
        "note": ("Errata 29. Where each item's icon sits in the sheet. Declared here rather "
                 "than computed in two places, for the same reason the room idle sheets are: "
                 "the builder and the engine must not be able to disagree about a rectangle. "
                 "check-item-names reads the PNG itself and fails if two of these cells are "
                 "pixel-identical -- an icon nobody can tell from another icon is the running "
                 "gag dying quietly, which is what that check has always existed to stop."),
        "sheet": "art/ui/item-icons.png",
        "cell": [CELL_W, CELL_H],
        "icons": cells,
    }, indent=2) + "\n")

    # A review strip: every icon at 4x on the panel's own ground.
    ground = palette.family("umber").frac(0.06)
    strip = IndexedCanvas(sheet.width + 4, sheet.height + 4, fill=ground)
    strip.blit(sheet, 2, 2, transparent=TRANSPARENT)
    strip.save(RENDERS / "item-icons@4x.png", palette, scale=4)
    strip.save(RENDERS / "item-icons.png", palette)

    print(f"wrote art/ui/item-icons.png  {sheet.width}x{sheet.height}, {len(cells)} icons")
    print(f"wrote content/ui/item-icons.json and renders/item-icons@4x.png")
    for item, rect in cells.items():
        print(f"  {item:<15}{rect}")


if __name__ == "__main__":
    main()
