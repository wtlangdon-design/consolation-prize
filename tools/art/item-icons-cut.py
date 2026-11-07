"""Cut errata 146's item icons, redrawn at slot size, into the shipping sheet.

The inventory slot is 180x80 (content/ui/panel.json) and Renderer.drawInventory
fits each icon by min(180/w, 80/h). The old 30x21 cells came to an uneven
x3.81, so some art pixels drew three screen pixels wide and some four
(errata 142). A 60x40 cell fits at exactly x2: every art pixel a 2x2 block.

Source: art/staging/item-icons/sheet-01.png, item-icons attempt 1 -- all 26 on
magenta, a grid of 6 across and 5 rows in content/ui/item-icons.json's order.

For each grid cell: key the magenta, take the object's bounding box, reduce it
to art pixels with a premultiplied BOX (the reduction tools/art/one-level.py
snaps figures with) at ONE factor for all 26, so they stay one scale family,
then threshold the alpha so the edge is crisp and despill what magenta is left.
The factor is the one that fits the largest object in 58x38, a pixel of air
inside the 60x40 cell. Each icon is centred in its cell.

Writes art/ui/item-icons.png (4 cells across) and content/ui/item-icons.json.

usage: python3 tools/art/item-icons-cut.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = os.path.join(ROOT, 'art/staging/item-icons/sheet-01.png')
TABLE = os.path.join(ROOT, 'content/ui/item-icons.json')
SHEET = 'art/ui/item-icons.png'
CELL = (60, 40)
AIR = 1
GRID = (6, 5)
COLS_OUT = 4
KEY_DISTANCE = 120  # from the sheet's own magenta, sampled at the corners


def key_mask(rgb):
    corners = np.array([rgb[2, 2], rgb[2, -3], rgb[-3, 2], rgb[-3, -3]], dtype=float)
    key = np.median(corners, axis=0)
    dist = np.sqrt(((rgb.astype(float) - key) ** 2).sum(-1))
    # Magenta-ish anywhere: red and blue high, green low.
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    magenta = (r > 170) & (b > 160) & (g < 90)
    return (dist > KEY_DISTANCE) & ~magenta


def despill(rgba):
    """Takes the magenta cast out of the outline: the pixels within two of the
    transparent ground, where the source's edges blended with the key. Only
    there -- the survey's purple ink is meant, and a whole-icon despill greys it."""
    out = rgba.astype(int)
    opaque = out[..., 3] > 0
    near = ~opaque
    for _ in range(2):
        grow = near.copy()
        grow[1:] |= near[:-1]; grow[:-1] |= near[1:]
        grow[:, 1:] |= near[:, :-1]; grow[:, :-1] |= near[:, 1:]
        near = grow
    ring = opaque & near
    # And anywhere at the key's own hue (magenta, about 300 degrees): the
    # source's blended edge pixels, some of them deeper than two. The survey's
    # ink is violet, about 265, and keeps its colour.
    mx, mn = out[..., :3].max(-1), out[..., :3].min(-1)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (out[..., 1] - out[..., 2]),
                                2 * out[..., 0] - out[..., 1] - out[..., 2])) % 360
    ring |= opaque & (hue > 285) & (hue < 335) & (mx - mn > 25)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    excess = np.where(ring, np.clip(np.minimum(r, b) - g, 0, None), 0)
    out[..., 0] = np.clip(r - excess, 0, 255)
    out[..., 2] = np.clip(b - excess, 0, 255)
    return out.astype(np.uint8)


LUMA = np.array([0.299, 0.587, 0.114])
GAP = 12  # source pixels of empty space a single object may contain


def main_run(on):
    """[start, end) of the longest run of True, bridging gaps up to GAP."""
    runs, start, last = [], None, None
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            elif i - last > GAP:
                runs.append((start, last + 1))
                start = i
            last = i
    if start is not None:
        runs.append((start, last + 1))
    return max(runs, key=lambda r: r[1] - r[0])


def objects(rgb, mask, ids):
    h, w = mask.shape
    cw, ch = w / GRID[0], h / GRID[1]
    found = []
    for i, item in enumerate(ids):
        cx, cy = i % GRID[0], i // GRID[0]
        x0, x1 = int(cx * cw), int((cx + 1) * cw)
        y0, y1 = int(cy * ch), int((cy + 1) * ch)
        m = mask[y0:y1, x0:x1].copy()
        if not m.any():
            raise SystemExit(f'{item}: nothing drawn in grid cell {i}')
        # The object is the longest run of drawn rows (and columns), allowing
        # small gaps: a neighbour's edge poking over the grid line (the jar's lid
        # into the survey's cell) is a separate run and is left out.
        by0, by1 = main_run(m.any(1))
        bx0, bx1 = main_run(m[by0:by1].any(0))
        by0, by1 = (lambda r: (by0 + r[0], by0 + r[1]))(main_run(m[by0:by1, bx0:bx1].any(1)))
        found.append((item, x0 + bx0, y0 + by0, bx1 - bx0, by1 - by0))
    return found


def reduce(rgb, mask, box, factor):
    """One object to art pixels: a BOX over straight colour with the key's mask as
    alpha. Pillow premultiplies an RGBA image itself when it resizes and returns
    straight colour, so the result is used as it comes. Premultiplying first and
    dividing by alpha again (the first cut, found by review on #211) brightened
    every part-covered edge pixel by up to 2x and lightened the dark outlines."""
    _, x, y, w, h = box
    a = mask[y:y + h, x:x + w]
    src = np.dstack([rgb[y:y + h, x:x + w], np.where(a, 255, 0)]).astype(np.uint8)
    tw, th = max(1, round(w / factor)), max(1, round(h / factor))
    small = np.asarray(Image.fromarray(src, 'RGBA').resize((tw, th), Image.BOX)).copy()
    keep = small[..., 3] >= 128
    small[..., 3] = np.where(keep, 255, 0)
    small[~keep, :3] = 0
    no_brighter(src, small, factor, box[0])
    return despill(small)


def no_brighter(src, small, factor, item):
    """A box average can never be brighter than the brightest drawn pixel it read.
    Fails the cut if one is -- the double un-premultiply this cutter once had."""
    drawn = src[..., 3] > 0
    for yy, xx in zip(*np.where(small[..., 3] > 0)):
        y0, x0 = max(0, int(yy * factor) - 1), max(0, int(xx * factor) - 1)
        y1, x1 = int(np.ceil((yy + 1) * factor)) + 1, int(np.ceil((xx + 1) * factor)) + 1
        foot = drawn[y0:y1, x0:x1]
        if not foot.any():
            continue
        # Luminance, not each channel: a key-tinted edge pixel is low in green
        # alone, and the defect this guards doubles brightness as a whole.
        top = (src[y0:y1, x0:x1, :3][foot].astype(float) @ LUMA).max()
        got = small[yy, xx, :3].astype(float) @ LUMA
        # A margin for where BOX's footprint edges fall; the defect is up to 2x.
        if got > top * 1.1 + 4:
            raise SystemExit(f'{item}: art pixel ({xx},{yy}) is luminance {got:.0f}, brighter than anything '
                             f'drawn under it ({top:.0f}): alpha divided twice?')


def main():
    table = json.load(open(TABLE))
    ids = list(table['icons'].keys())
    rgb = np.asarray(Image.open(SOURCE).convert('RGB'))
    mask = key_mask(rgb)
    boxes = objects(rgb, mask, ids)
    factor = max(max(w / (CELL[0] - 2 * AIR), h / (CELL[1] - 2 * AIR)) for _, _, _, w, h in boxes)
    rows = -(-len(ids) // COLS_OUT)
    sheet = Image.new('RGBA', (COLS_OUT * CELL[0], rows * CELL[1]), (0, 0, 0, 0))
    cells = {}
    for i, box in enumerate(boxes):
        icon = Image.fromarray(reduce(rgb, mask, box, factor), 'RGBA')
        x, y = (i % COLS_OUT) * CELL[0], (i // COLS_OUT) * CELL[1]
        sheet.alpha_composite(icon, (x + (CELL[0] - icon.width) // 2, y + (CELL[1] - icon.height) // 2))
        cells[box[0]] = [x, y, CELL[0], CELL[1]]
        print(f'{box[0]:<18} {box[3]}x{box[4]} -> {icon.width}x{icon.height}')
    sheet.save(os.path.join(ROOT, SHEET))
    table['cell'] = list(CELL)
    table['icons'] = cells
    table['sheet'] = SHEET
    table['errata146'] = ('Redrawn at slot size: 60x40 cells, drawn at a whole x2 into the 180x80 inventory slot '
                          '(tests/item-icons-scale.test.ts). Cut by tools/art/item-icons-cut.py from '
                          'art/staging/item-icons/sheet-01.png, item-icons attempt 1; one factor for all 26 '
                          f'({factor:.3f} source pixels to an art pixel).')
    with open(TABLE, 'w') as f:
        f.write(json.dumps(table, indent=2) + '\n')
    print(f'factor {factor:.3f}; wrote {SHEET} {sheet.width}x{sheet.height} and {os.path.relpath(TABLE, ROOT)}')


if __name__ == '__main__':
    main()
