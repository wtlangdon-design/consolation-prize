"""Cut Main Street's hitching rail and its three horses into an ambient sheet
(reference/hitching-post/brief.md, errata 182). No image operation.

Source: art/staging/room-02/hitching-04/sheet.png, room-02 attempt 6 -- four
frames of one group on a 2 x 2 sheet: a black with a blaze, a palomino eating
hay, a full-sized paint saddle horse with its head up over the rail, the rail
at chest height. The generator was given four copies of the group in place,
and kept every quarter where it was (the posts agree to a pixel).

EVERY FRAME IS ONE OF THE GENERATOR'S QUARTERS, WHOLE. Nothing is stitched.
Three earlier cuts stitched one quarter of a sheet onto another, where the
generator had moved horses between them, and each shipped a fault Tyler found
-- a neck through the rail, a sliced muzzle, a third hind leg (errata 182). A
whole quarter is a whole drawing: each horse has its own four legs and head.
  0  sheet frame 1, the rest: the black looking out, the palomino eating, the paint over the rail;
  1  sheet frame 2: the black tosses its head;
  2  sheet frame 3: the palomino lifts its head from the hay;
  3  sheet frame 4: the paint turns its head toward the black and swishes its tail.

Then: crop to the union of every frame, take the magenta out of the outline, the
key's hue and the outline ink, give the hay's magenta-blended wisps the hay's
colour, and lay the frames out the way the other ambient sheets are.
tools/art/one-level.py --only snaps it to the cast's grid afterwards.

usage: python3 tools/art/hitching-post-cut.py
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SOURCE = os.path.join(ROOT, 'art/staging/room-02/hitching-04/sheet.png')
OUT = os.path.join(ROOT, 'art/actors/room-02-horses.png')
RECORD = os.path.join(ROOT, 'art/staging/room-02/hitching-04/cut.json')
CELL_W, CELL_H = 768, 512
EDGE = 4          # the cells' faint borders
HAY_ROWS = 395    # the hay pile lies below this row in each quarter


def fgmask(rgb, min_area=150):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    fg = ~((r > 170) & (b > 160) & (g < 110))
    fg[:EDGE] = fg[-EDGE:] = False
    fg[:, :EDGE] = fg[:, -EDGE:] = False
    lab, n = ndimage.label(fg)
    areas = ndimage.sum(fg, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i, a in enumerate(areas) if a >= min_area])


def despill(rgba, hay_from=None):
    out = rgba.astype(int)
    pink = pink_edge(out, hay_from)
    opaque = out[..., 3] > 0
    near = ndimage.binary_dilation(~opaque, iterations=2) & opaque
    mx, mn = out[..., :3].max(-1), out[..., :3].min(-1)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (out[..., 1] - out[..., 2]),
                                2 * out[..., 0] - out[..., 1] - out[..., 2])) % 360
    tinted = near | (opaque & (hue > 285) & (hue < 335) & (mx - mn > 25))
    # And the outline ink: the generator's near-black is plum (19,11,20) where it was
    # drawn against magenta -- key spill, which tools/check-residual-key.mjs reads as
    # keyed background. Nothing in the horses is that dark and that purple.
    r0, g0, b0 = out[..., 0], out[..., 1], out[..., 2]
    tinted |= opaque & (mx < 48) & (r0 - g0 >= 4) & (b0 - g0 >= 4)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    # An outline pixel that is more key than drawing -- the hay's wisps, blended
    # with the magenta they were drawn on -- is dropped: despilled, it turned pink.
    blended = near & ((np.minimum(r, b) - g) > 12)
    out[blended] = 0
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    excess = np.where(tinted & ~blended, np.clip(np.minimum(r, b) - g, 0, None), 0)
    out[..., 0] = np.clip(r - excess, 0, 255)
    out[..., 2] = np.clip(b - excess, 0, 255)
    out = inpaint(out, pink)
    return out.astype(np.uint8)


def pink_edge(out, hay_from=None):
    """Pixels within 6 of the edge that are gold or brown blended with the magenta
    they were drawn on: red above green, and blue not far below it (hay has blue
    far below green). Marked on the colours as
    generated, before the despill turns them red."""
    opaque = out[..., 3] > 0
    edge = ndimage.binary_dilation(~opaque, iterations=6) & opaque
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    # And the hay band at ground level, where the pile shows whole: nothing else
    # down there is that red (the paint's red stripes are on its back).
    hay = np.zeros_like(opaque)
    if hay_from is not None:
        hay[max(0, hay_from):, :] = True   # HAY_ROWS in the cropped frame's rows
    return (edge | (hay & opaque)) & (r - g > 12) & (b - g > -10)


def inpaint(out, pink):
    """Each marked pixel takes the median colour of its clean opaque neighbours
    -- the hay's wisps end in hay colour, not red -- or goes if it has none."""
    pink = pink & (out[..., 3] > 0)
    opaque = out[..., 3] > 0
    for _ in range(4):
        if not pink.any():
            break
        ys, xs = np.where(pink)
        fixed = np.zeros_like(pink)
        for y, x in zip(ys, xs):
            y0, y1, x0, x1 = max(0, y - 1), y + 2, max(0, x - 1), x + 2
            ok = opaque[y0:y1, x0:x1] & ~pink[y0:y1, x0:x1]
            if ok.any():
                out[y, x, :3] = np.median(out[y0:y1, x0:x1, :3][ok], axis=0)
                fixed[y, x] = True
        pink &= ~fixed
    out[pink] = 0
    return out


def shift(img, dx, dy, fill):
    out = np.empty_like(img)
    out[...] = fill
    h, w = img.shape[:2]
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = \
        img[max(0, -dy):h + min(0, -dy), max(0, -dx):w + min(0, -dx)]
    return out


def frames():
    sheet = np.asarray(Image.open(SOURCE).convert('RGB'))
    out = []
    for i in range(4):
        cell = sheet[(i // 2) * CELL_H:(i // 2 + 1) * CELL_H, (i % 2) * CELL_W:(i % 2 + 1) * CELL_W]
        out.append(np.dstack([cell, np.where(fgmask(cell), 255, 0)]).astype(np.uint8))
    return out


def main():
    fr = frames()
    union = np.zeros((CELL_H, CELL_W), bool)
    for f in fr:
        union |= f[..., 3] > 0
    ys, xs = np.where(union)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    w, h = x1 - x0, y1 - y0
    sheet = Image.new('RGBA', (len(fr) * (w + 2) + 2, h + 4), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(fr):
        sheet.alpha_composite(Image.fromarray(despill(f[y0:y1, x0:x1], HAY_ROWS - y0), 'RGBA'), (2 + i * (w + 2), 2))
        rects.append([2 + i * (w + 2), 2, int(w), int(h)])
    sheet.save(OUT)
    rest = fr[0][y0:y1, x0:x1, 3] > 0
    rows = np.where(rest.any(1))[0]
    record = {'sheet': os.path.relpath(OUT, ROOT), 'source': os.path.relpath(SOURCE, ROOT), 'frames': rects,
              'figureHeight': int(rows.max() - rows.min() + 1),
              'frameNote': '0 rest: the black looking out, the palomino eating, the paint over the rail · '
                           '1 the black tosses its head · 2 the palomino lifts its head from the hay · '
                           '3 the paint turns its head and swishes its tail'}
    with open(RECORD, 'w') as f:
        json.dump(record, f, indent=1)
    print(os.path.relpath(OUT, ROOT), sheet.size, 'frames', len(rects), 'frame', (int(w), int(h)),
          'rest height', record['figureHeight'])


if __name__ == '__main__':
    main()
