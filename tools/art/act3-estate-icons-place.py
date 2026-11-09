"""Scene C's two item icons, moved into the shipping sheet (reference/act3-estate-sale/handback.md; errata 238).

act3-estate-sale operation 2 cut two 60x40 cells by tools/art/item-icons-cut.py's own reduction into a small sheet of
their own, art/ui/item-icons-act3-estate.png (tools/art/act3-coat-cut.py), for the main session to name and move. The
cells are already at slot size, so nothing is reduced again: each is APPENDED to art/ui/item-icons.png in its four-across
order, pixel for pixel, as tools/art/gulch-icons-cut.py appended the Gulch's three, and content/ui/item-icons.json gains
its rectangle. No existing cell moves. No image operation here.

The small sheet's ids are the items' own: raccoon_in_coat (THE RACCOON, IN MY COAT) and hen (THE HEN). MR. PRATT'S TWO
DOLLARS AND SIXTY CENTS (pratt_money) has no cell delivered, and keeps its iconPending.

    python3 tools/art/act3-estate-icons-place.py
"""
import importlib.util
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('icons', os.path.join(ROOT, 'tools/art/item-icons-cut.py'))
icons = importlib.util.module_from_spec(spec)
spec.loader.exec_module(icons)

SMALL = os.path.join(ROOT, 'art/ui/item-icons-act3-estate.json')
IDS = ['raccoon_in_coat', 'hen']


def main():
    table = json.load(open(icons.TABLE))
    for item in IDS:
        table['icons'].pop(item, None)              # re-running replaces this tool's own cells, and only those
    small = json.load(open(SMALL))
    source = Image.open(os.path.join(ROOT, small['sheet'])).convert('RGBA')
    cw, ch = icons.CELL
    if small['cell'] != [cw, ch]:
        raise SystemExit(f'{small["sheet"]}: cells are {small["cell"]}, the shipping sheet\'s are {[cw, ch]}')
    old = Image.open(os.path.join(ROOT, icons.SHEET)).convert('RGBA')
    start = len(table['icons'])
    rows = -(-(start + len(IDS)) // icons.COLS_OUT)
    sheet = Image.new('RGBA', (icons.COLS_OUT * cw, max(rows * ch, old.height)), (0, 0, 0, 0))
    sheet.alpha_composite(old, (0, 0))
    for i, item in enumerate(IDS):
        sx, sy, sw, sh = small['icons'][item]
        n = start + i
        x, y = (n % icons.COLS_OUT) * cw, (n // icons.COLS_OUT) * ch
        sheet.paste((0, 0, 0, 0), (x, y, x + cw, y + ch))
        sheet.paste(source.crop((sx, sy, sx + sw, sy + sh)), (x, y))
        table['icons'][item] = [x, y, cw, ch]
        print(f'{item:<16} -> cell {n} at {x},{y}')
    sheet.save(os.path.join(ROOT, icons.SHEET))
    table['act3Estate'] = ('Act III scene C: raccoon_in_coat and hen, cut by tools/art/act3-coat-cut.py (act3-estate-sale '
                           'operation 2) at slot size and moved in by tools/art/act3-estate-icons-place.py, appended after '
                           'the Gulch\'s three (errata 238). pratt_money has no cell delivered.')
    with open(icons.TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
    print(f'{icons.SHEET} is {sheet.width}x{sheet.height}')


if __name__ == '__main__':
    main()
