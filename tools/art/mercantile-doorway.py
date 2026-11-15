"""The mercantile's doorway, repainted (reference/mercantile-doorway/brief.md; errata 323). No image operation.

mercantile-doorway operation 1 repainted, under a mask, only what the open batwing doors of
art/backgrounds/room-12-mercantile.png show of the outside: the old plate showed a two-storey house with lit windows
across the way; Main Street is built on one side only, so the operation drew the open street at night (porch boards and
the first yard of mud under the store's lantern, the dark street, wooded hills, sky and stars).

  - THE MASK is found on the old plate, not drawn by hand: inside the doorway (x 56-252, y 0-724) the pixels lit by the
    outside's blue (b > r + 8) in pieces of 400 px or more; above the leaves' top rail (y < 283) and on the porch
    under them (y >= 632) each row filled from its first to its last such pixel, so the old house's lit windows and the
    small things standing on the rail's line go too; holes filled; and the foot of the old house's lit door between the
    leaves' stiles (x 140-147, y 283-293), which is not blue. The leaves, the frame and the store floor are not in it.
  - The operation's output (1536 x 1024: the plate's x 0-1080, y 0-720 at 1.4222) is brought back to plate size and
    laid in ONLY inside the mask. Everything outside the mask is the old plate's, and the tool asserts it: 0 pixels.

Reads the old plate from art/staging/mercantile-doorway/old-plate.png, so it re-runs to the same pixels.
Writes art/backgrounds/room-12-mercantile.png, art/staging/mercantile-doorway/plate-mask.png and
renders/room-12-mercantile-doorway-before-after.png.
  python3 tools/art/mercantile-doorway.py [--write]
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
ST = 'art/staging/mercantile-doorway'
OLD, SHEET, PLATE = f'{ST}/old-plate.png', f'{ST}/sheet.png', 'art/backgrounds/room-12-mercantile.png'
X0, X1, Y0, Y1 = 56, 252, 0, 724          # the doorway, generously; the mask is found inside it
RAIL, PORCH = 283, 632                     # the leaves' top rail; the porch under the leaves
DOOR_FOOT = (140, 148, 283, 294)           # x0, x1, y0, y1: the old house's lit door between the stiles
CROP = (0, 0, 1080, 720)                   # what the operation was given, at 1536 x 1024


def mask_of(a):
    r, b = a[..., 0].astype(int), a[..., 2].astype(int)
    blue = np.zeros(a.shape[:2], bool)
    blue[Y0:Y1, X0:X1] = (b > r + 8)[Y0:Y1, X0:X1]
    lab, n = ndi.label(blue)
    sizes = ndi.sum(blue, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 400])
    m = keep.copy()
    for y in list(range(Y0, RAIL)) + list(range(PORCH, Y1)):
        xs = np.nonzero(keep[y])[0]
        if len(xs):
            m[y, xs.min():xs.max() + 1] = True
    m = ndi.binary_fill_holes(m)
    x0, x1, y0, y1 = DOOR_FOOT
    m[y0:y1, x0:x1] = True
    return m


def main():
    write = '--write' in sys.argv
    old = np.asarray(Image.open(R(OLD)).convert('RGB'))
    m = mask_of(old)
    cx0, cy0, cx1, cy1 = CROP
    new = np.asarray(Image.open(R(SHEET)).convert('RGB').resize((cx1 - cx0, cy1 - cy0), Image.LANCZOS))
    assert not m[cy1:, :].any() and not m[:, cx1:].any(), 'the mask reaches past what the operation was given'
    out = old.copy()
    sub = out[cy0:cy1, cx0:cx1]
    mm = m[cy0:cy1, cx0:cx1]
    sub[mm] = new[mm]
    changed = np.any(out != old, axis=2)
    outside = int((changed & ~m).sum())
    assert outside == 0, f'{outside} pixels changed outside the mask'
    ys, xs = np.nonzero(m)
    # brightness: nothing outside brighter than the store's interior
    lum = lambda x: (0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2])
    inside = ~m
    inside[:, :X1] = False
    report = {'maskRect': {'x': int(xs.min()), 'y': int(ys.min()), 'w': int(xs.max() - xs.min() + 1),
                           'h': int(ys.max() - ys.min() + 1)},
              'maskPixels': int(m.sum()), 'changedInsideMask': int((changed & m).sum()),
              'changedOutsideMask': outside,
              'meanLight': {'doorwayBefore': round(float(lum(old)[m].mean()), 1),
                            'doorwayAfter': round(float(lum(out)[m].mean()), 1),
                            'storeInterior': round(float(lum(old)[inside].mean()), 1)},
              'p99Light': {'doorwayAfter': round(float(np.percentile(lum(out)[m], 99)), 1),
                           'storeInterior': round(float(np.percentile(lum(old)[inside], 99)), 1)}}
    print(json.dumps(report, indent=1))
    if write:
        Image.fromarray(out).save(R(PLATE))
        Image.fromarray(np.where(m, 255, 0).astype(np.uint8)).save(R(f'{ST}/plate-mask.png'))
        x0, y0, x1, y1 = 0, 0, 320, 760
        pair = np.concatenate([old[y0:y1, x0:x1], np.full((y1 - y0, 8, 3), 255, np.uint8), out[y0:y1, x0:x1]], 1)
        Image.fromarray(pair).resize((pair.shape[1] * 2, pair.shape[0] * 2), Image.NEAREST).save(
            R('renders/room-12-mercantile-doorway-before-after.png'))


if __name__ == '__main__':
    main()
