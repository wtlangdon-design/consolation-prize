"""A COMPANY LEDGER's icon, derived from the log's and appended to the shipping sheet (doc 113, A; errata 242).

No image operation: Room 11's four are spent and the scene was built with none. The ledger is "the same green as the log, the
same thickness, the same gilt" (doc 113), so its icon is the log's own book (padded_log's cell), its leather turned to the
green morocco doc 05 gives the Company's ledgers and two gilt bands laid across the spine for the gilt dates. The page
edges and the outline are the log's, untouched. Appended after the last cell exactly as tools/art/act3-estate-icons-place.py
appends; no existing cell moves.

    python3 tools/art/act2-ledger-icon.py
"""
import colorsys
import importlib.util
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('icons', os.path.join(ROOT, 'tools/art/item-icons-cut.py'))
icons = importlib.util.module_from_spec(spec)
spec.loader.exec_module(icons)

SOURCE, ITEM = 'padded_log', 'company_ledger'
GREEN_HUE = 0.40          # morocco green
GILT = (214, 176, 84, 255)


def ledger(cell):
    out = cell.copy()
    px = out.load()
    w, h = out.size
    leather = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # The leather is the warm, saturated brown; the pages are pale and the spine and outline are near grey.
            if s > 0.28 and 0.02 < hh < 0.12 and v < 0.6:
                nr, ng, nb = colorsys.hsv_to_rgb(GREEN_HUE, min(1.0, s * 1.05), v * 0.92)
                px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
                leather.append((x, y))
    if len(leather) < 80:
        raise SystemExit(f'{SOURCE}: only {len(leather)} leather pixels found; the log\'s icon is not the book this expects')
    # Two gilt bands across the spine: on two rows a third and two thirds down the cover, the grey run left of the leather.
    ys = sorted({y for _, y in leather})
    for start in (ys[len(ys) // 4], ys[len(ys) // 2]):
        for row in (start, start + 1):
            first = min((x for x, y in leather if y == row), default=None)
            if first is None:
                continue
            for x in range(first):
                r, g, b, a = px[x, row]
                if a and 90 < r + g + b < 330:
                    px[x, row] = GILT
    return out


def main():
    table = json.load(open(icons.TABLE))
    table['icons'].pop(ITEM, None)
    cw, ch = icons.CELL
    old = Image.open(os.path.join(ROOT, icons.SHEET)).convert('RGBA')
    sx, sy, sw, sh = table['icons'][SOURCE]
    cell = ledger(old.crop((sx, sy, sx + sw, sy + sh)))
    n = len(table['icons'])
    rows = -(-(n + 1) // icons.COLS_OUT)
    sheet = Image.new('RGBA', (icons.COLS_OUT * cw, max(rows * ch, old.height)), (0, 0, 0, 0))
    sheet.alpha_composite(old, (0, 0))
    x, y = (n % icons.COLS_OUT) * cw, (n // icons.COLS_OUT) * ch
    sheet.paste((0, 0, 0, 0), (x, y, x + cw, y + ch))
    sheet.paste(cell, (x, y))
    table['icons'][ITEM] = [x, y, cw, ch]
    table['act2Ledger'] = ('Act II, the double: company_ledger, derived from padded_log\'s cell by tools/art/act2-ledger-icon.py '
                           '(green morocco, two gilt bands; no image operation) and appended after the money (errata 242).')
    sheet.save(os.path.join(ROOT, icons.SHEET))
    with open(icons.TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
    print(f'{ITEM} -> cell {n} at {x},{y}; {icons.SHEET} is {sheet.width}x{sheet.height}')


if __name__ == '__main__':
    main()
