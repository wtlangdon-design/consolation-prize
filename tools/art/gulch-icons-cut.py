"""Fiddler's Gulch's three item icons, cut into the shipping sheet beside the others (reference/fiddlers-gulch/brief.md:
"Every item needs an icon. Draw them by the project's existing icon route"). No image operation here.

    python3 tools/art/gulch-icons-cut.py

Source: art/staging/gulch-icons/sheet-01.png, gulch-reserve attempt 1 -- three objects in a row on magenta, drawn
against the shipping icons. Each is keyed, cut and reduced by tools/art/item-icons-cut.py's own functions (its key,
its BOX reduction, its brighter-than-drawn guard and its despill), at the one factor that fits the largest of the
three in a 60x40 cell with a pixel of air, as that tool fits the 26. The cells are APPENDED to art/ui/item-icons.png
in its own four-across order, and content/ui/item-icons.json gains their rectangles; no existing cell moves.
"""
import importlib.util
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('icons', os.path.join(ROOT, 'tools/art/item-icons-cut.py'))
icons = importlib.util.module_from_spec(spec)
spec.loader.exec_module(icons)

SOURCE = os.path.join(ROOT, 'art/staging/gulch-icons/sheet-01.png')
IDS = ['third_copy', 'brass_rod', 'clarion']      # left to right, as reference/fiddlers-gulch/icons/prompt-01.txt asks


def main():
    table = json.load(open(icons.TABLE))
    for item in IDS:
        table['icons'].pop(item, None)              # re-running replaces this tool's own cells, and only those
    rgb = np.asarray(Image.open(SOURCE).convert('RGB'))
    mask = icons.key_mask(rgb)
    saved = icons.GRID
    icons.GRID = (len(IDS), 1)
    boxes = icons.objects(rgb, mask, IDS)
    icons.GRID = saved
    cw, ch = icons.CELL
    air = icons.AIR
    factor = max(max(w / (cw - 2 * air), h / (ch - 2 * air)) for _, _, _, w, h in boxes)
    old = Image.open(os.path.join(ROOT, icons.SHEET)).convert('RGBA')
    start = len(table['icons'])
    rows = -(-(start + len(IDS)) // icons.COLS_OUT)
    sheet = Image.new('RGBA', (icons.COLS_OUT * cw, rows * ch), (0, 0, 0, 0))
    sheet.alpha_composite(old.crop((0, 0, sheet.width, min(old.height, sheet.height))), (0, 0))
    for i, box in enumerate(boxes):
        icon = Image.fromarray(icons.reduce(rgb, mask, box, factor), 'RGBA')
        n = start + i
        x, y = (n % icons.COLS_OUT) * cw, (n // icons.COLS_OUT) * ch
        sheet.paste((0, 0, 0, 0), (x, y, x + cw, y + ch))
        sheet.alpha_composite(icon, (x + (cw - icon.width) // 2, y + (ch - icon.height) // 2))
        table['icons'][box[0]] = [x, y, cw, ch]
        print(f'{box[0]:<12} {box[3]}x{box[4]} -> {icon.width}x{icon.height} at cell {n}')
    sheet.save(os.path.join(ROOT, icons.SHEET))
    table['gulch'] = ('Fiddler\'s Gulch: third_copy, brass_rod and clarion, cut by tools/art/gulch-icons-cut.py from '
                      'art/staging/gulch-icons/sheet-01.png (gulch-reserve attempt 1), appended after the 27; '
                      f'{factor:.3f} source pixels to an art pixel.')
    with open(icons.TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
    print(f'factor {factor:.3f}; {icons.SHEET} is {sheet.width}x{sheet.height}')


if __name__ == '__main__':
    main()
