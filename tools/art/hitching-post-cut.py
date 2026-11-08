"""Cut Main Street's hitching rail and its three horses into an ambient sheet
(reference/hitching-post/brief.md, errata 178). No image operation.

Sources (room-02 attempts 3 and 4, art/staging/room-02/):
  hitching-01/sheet.png -- the rail and horses painted in context, on the night
      street beside Thad, inside a magenta box (the look and the scale);
  hitching-02/sheet.png -- six copies of that group on one sheet, each with one
      change (errata 77's motion): 1 rest, 2 the bay's tail (not used: it drew a
      flare at the head), 3 the chestnut's head down to the mud, 4 the grey's
      head up and its tail swished, 5 all three heads up, 6 a hind hoof rested.

THE GENERATOR REDREW EVERY COPY, so even frame 1 differs from the others in a
quarter of its pixels; swapped whole, the group would shimmer on every beat.
So frame 1 is the rest, and each action frame is frame 1 except where that
frame's own change is -- the pixels that differ from frame 1, widened by four,
inside the band of the horse that moves. The rail never moves.

Then: crop to the union of every frame, take the magenta out of the outline and
anything at the key's hue (as tools/art/item-icons-cut.py does), and lay the
frames out the way the other ambient sheets are. tools/art/one-level.py --only
snaps it to the cast's grid afterwards.

usage: python3 tools/art/hitching-post-cut.py
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = os.path.join(ROOT, 'art/staging/room-02/hitching-02/sheet.png')
OUT = os.path.join(ROOT, 'art/actors/room-02-horses.png')
RECORD = os.path.join(ROOT, 'art/staging/room-02/hitching-02/cut.json')
CELL = 512
RAIL = 334        # the rail's top row in each cell
EDGE = 6          # the cells' faint grid lines
# frame index on the sheet -> where its change may be taken (cell coordinates)
BANDS = {
    2: lambda yy, xx: (xx >= 196) & (xx < 288),       # the chestnut's head down
    3: lambda yy, xx: xx >= 290,                      # the grey's head up, tail swished
    4: lambda yy, xx: yy < RAIL,                      # all three heads up, above the rail
    5: lambda yy, xx: (yy >= RAIL - 20) & (xx < 304),  # a hind hoof rested
}


def fgmask(rgb, min_area=150):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    fg = ~((r > 170) & (b > 160) & (g < 110))
    fg[:EDGE] = fg[-EDGE:] = False
    fg[:, :EDGE] = fg[:, -EDGE:] = False
    lab, n = ndimage.label(fg)
    areas = ndimage.sum(fg, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i, a in enumerate(areas) if a >= min_area])


def despill(rgba):
    out = rgba.astype(int)
    opaque = out[..., 3] > 0
    near = ndimage.binary_dilation(~opaque, iterations=2) & opaque
    mx, mn = out[..., :3].max(-1), out[..., :3].min(-1)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (out[..., 1] - out[..., 2]),
                                2 * out[..., 0] - out[..., 1] - out[..., 2])) % 360
    tinted = near | (opaque & (hue > 285) & (hue < 335) & (mx - mn > 25))
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    excess = np.where(tinted, np.clip(np.minimum(r, b) - g, 0, None), 0)
    out[..., 0] = np.clip(r - excess, 0, 255)
    out[..., 2] = np.clip(b - excess, 0, 255)
    return out.astype(np.uint8)


def frames():
    sheet = np.asarray(Image.open(SOURCE).convert('RGB'))
    cells = [sheet[(i // 3) * CELL:(i // 3 + 1) * CELL, (i % 3) * CELL:(i % 3 + 1) * CELL] for i in range(6)]
    masks = [fgmask(c) for c in cells]
    rest, rmask = cells[0], masks[0]
    yy, xx = np.mgrid[0:CELL, 0:CELL]
    out = [np.dstack([rest, np.where(rmask, 255, 0)]).astype(np.uint8)]
    for k, band in BANDS.items():
        inside = band(yy, xx)
        moved = (np.abs(cells[k].astype(int) - rest.astype(int)).sum(-1) > 60) & (masks[k] | rmask) & inside
        region = ndimage.binary_dilation(moved, iterations=4) & inside
        rgb = np.where(region[..., None], cells[k], rest)
        alpha = np.where(region, masks[k], rmask)
        out.append(np.dstack([rgb, np.where(alpha, 255, 0)]).astype(np.uint8))
    return out


def main():
    fr = frames()
    union = np.zeros((CELL, CELL), bool)
    for f in fr:
        union |= f[..., 3] > 0
    ys, xs = np.where(union)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    w, h = x1 - x0, y1 - y0
    sheet = Image.new('RGBA', (len(fr) * (w + 2) + 2, h + 4), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(fr):
        sheet.alpha_composite(Image.fromarray(despill(f[y0:y1, x0:x1]), 'RGBA'), (2 + i * (w + 2), 2))
        rects.append([2 + i * (w + 2), 2, int(w), int(h)])
    sheet.save(OUT)
    rest = fr[0][y0:y1, x0:x1, 3] > 0
    rows = np.where(rest.any(1))[0]
    record = {'sheet': os.path.relpath(OUT, ROOT), 'source': os.path.relpath(SOURCE, ROOT), 'frames': rects,
              'figureHeight': int(rows.max() - rows.min() + 1),
              'frameNote': '0 rest · 1 the chestnut noses the mud · 2 the grey looks up, tail swished · '
                           '3 all three heads up · 4 a hind hoof rested'}
    with open(RECORD, 'w') as f:
        json.dump(record, f, indent=1)
    print(os.path.relpath(OUT, ROOT), sheet.size, 'frames', len(rects), 'frame', (int(w), int(h)),
          'rest height', record['figureHeight'])


if __name__ == '__main__':
    main()
