"""Cut Main Street's hitching rail and its three horses into an ambient sheet
(reference/hitching-post/brief.md, errata 178). No image operation.

Source: art/staging/room-02/hitching-03/sheet.png, room-02 attempt 5 -- the
group redrawn after Tyler's first look ("three copies of the same horse ...
maybe one is eating? And are hitching posts that low?"): a black with a blaze,
a palomino eating from a pile of hay, a paint pony in a striped blanket, the
rail at chest height. Four frames on one sheet, 2 x 2.

ONLY FRAMES 1 AND 3 AGREE. The generator moved the palomino and the paint
pony about 30 px sideways in frames 2 and 4, so neither can be laid over the
rest without doubling a horse; frame 3 is the whole group 19 px higher and
otherwise in place. So:
  0  frame 1, the rest: the palomino eating, the black looking out, the paint dozing;
  1  the palomino chews: its lowered head lifted 4 px off the hay (from frame 1);
  2  frame 1 with frame 3's changes: the black tosses its head, the paint looks round
     -- the pixels that differ from frame 1, widened by four, in those horses' bands;
  3  the palomino chews again, 7 px.
Frames 2 and 4 of the sheet are not used.

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
SOURCE = os.path.join(ROOT, 'art/staging/room-02/hitching-03/sheet.png')
OUT = os.path.join(ROOT, 'art/actors/room-02-horses.png')
RECORD = os.path.join(ROOT, 'art/staging/room-02/hitching-03/cut.json')
CELL_W, CELL_H = 768, 512
EDGE = 4          # the cells' faint borders
DROP = 19         # sheet frame 3 sits this many rows higher than frame 1


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
    # And the outline ink: the generator's near-black is plum (19,11,20) where it was
    # drawn against magenta -- key spill, which tools/check-residual-key.mjs reads as
    # keyed background. Nothing in the horses is that dark and that purple.
    r0, g0, b0 = out[..., 0], out[..., 1], out[..., 2]
    tinted |= opaque & (mx < 48) & (r0 - g0 >= 4) & (b0 - g0 >= 4)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    excess = np.where(tinted, np.clip(np.minimum(r, b) - g, 0, None), 0)
    out[..., 0] = np.clip(r - excess, 0, 255)
    out[..., 2] = np.clip(b - excess, 0, 255)
    return out.astype(np.uint8)


def shift(img, dx, dy, fill):
    out = np.empty_like(img)
    out[...] = fill
    h, w = img.shape[:2]
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = \
        img[max(0, -dy):h + min(0, -dy), max(0, -dx):w + min(0, -dx)]
    return out


def frames():
    sheet = np.asarray(Image.open(SOURCE).convert('RGB'))
    cell = lambda i: sheet[(i // 2) * CELL_H:(i // 2 + 1) * CELL_H, (i % 2) * CELL_W:(i % 2 + 1) * CELL_W]
    one = cell(0)
    m1 = fgmask(one)
    three = shift(cell(2), 0, DROP, np.array([255, 0, 255], np.uint8))
    m3 = fgmask(three)
    yy, xx = np.mgrid[0:CELL_H, 0:CELL_W]
    rest = np.dstack([one, np.where(m1, 255, 0)]).astype(np.uint8)
    # The black's head (left of the palomino, above the rail) and the paint pony.
    band = ((xx < 300) & (yy < 330)) | (xx >= 470)
    moved = (np.abs(three.astype(int) - one.astype(int)).sum(-1) > 60) & (m3 | m1) & band
    region = ndimage.binary_dilation(moved, iterations=4) & band
    toss = np.dstack([np.where(region[..., None], three, one),
                      np.where(np.where(region, m3, m1), 255, 0)]).astype(np.uint8)
    # The palomino's lowered head, clear of the hay below it and the black's legs left of it.
    head = (xx >= 300) & (xx < 392) & (yy >= 318) & (yy < 424) & m1

    def chew(up):
        out = rest.copy()
        out[head] = 0
        lifted = np.zeros_like(rest)
        lifted[head] = rest[head]
        lifted = shift(lifted, 0, -up, np.array([0, 0, 0, 0], np.uint8))
        keep = lifted[..., 3] > 0
        out[keep] = lifted[keep]
        return out

    return [rest, chew(4), toss, chew(7)]


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
        sheet.alpha_composite(Image.fromarray(despill(f[y0:y1, x0:x1]), 'RGBA'), (2 + i * (w + 2), 2))
        rects.append([2 + i * (w + 2), 2, int(w), int(h)])
    sheet.save(OUT)
    rest = fr[0][y0:y1, x0:x1, 3] > 0
    rows = np.where(rest.any(1))[0]
    record = {'sheet': os.path.relpath(OUT, ROOT), 'source': os.path.relpath(SOURCE, ROOT), 'frames': rects,
              'figureHeight': int(rows.max() - rows.min() + 1),
              'frameNote': '0 rest: the palomino eating, the black looking out, the paint dozing · '
                           '1 the palomino chews · 2 the black tosses its head, the paint looks round · '
                           '3 the palomino chews'}
    with open(RECORD, 'w') as f:
        json.dump(record, f, indent=1)
    print(os.path.relpath(OUT, ROOT), sheet.size, 'frames', len(rects), 'frame', (int(w), int(h)),
          'rest height', record['figureHeight'])


if __name__ == '__main__':
    main()
