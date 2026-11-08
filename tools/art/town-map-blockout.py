"""The town blocked out on the district map, for the image to dress (errata 163 A7).

Tyler, 2026-11-07: "What if you create a layout of where every building/location should be located and give that
to CC with an updated prompt? Then it will know exactly where each building should go." The earlier redraw had a
layout as a SIDE picture beside the old map, and the model kept to the old arrangement. Here the block-out IS the
picture being edited: every building of Main Street's L as a flat shape in its exact place, its front (a lighter
strip with lit windows and a porch) on the side it faces, painted in the map's own colours over the map; a
masked edit dresses only that zone, and only that zone is taken back.

  python3 tools/art/town-map-blockout.py build
      writes reference/town-map/blockout-1920x864.png (the whole map with the town blocked out) and
      art/staging/town-map/blockout-01/input.png and mask.png (the town at 2x, 1536 x 1024; the mask
      transparent over ZONES only).
  python3 tools/art/town-map-blockout.py promote --attempt N [--write]
      takes blockout-0N/source.png back down 2x and pastes only ZONES over the shipping map; writes
      candidate.png beside it, and with --write the shipping map.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP = os.path.join(ROOT, 'art/backgrounds/room-00-town-map.png')
REGION = (160, 160, 768, 512)            # 2x is the edit's 1536 x 1024
# What the image may repaint, and all that is taken back: the old long row and the old east arm, with the ground
# round them. The square (and its trough), the loop road and the Lane stay the map's own pixels.
ZONES = [(212, 344, 432, 120), (626, 344, 128, 236)]

ROOF, ROOF_LIT, WALL, FRONT, PORCH, WINDOW, LINE = (20, 32, 52), (34, 48, 72), (44, 40, 44), (104, 64, 30), (58, 38, 21), (230, 150, 50), (4, 10, 20)

# THE PLAN, from the plates (reference/town-map/town-plan.json's reading of Room 2). x, y, w, h of the whole
# building as seen from the map's angle; `faces` is the side its front and porch are on.
ROW_BOTTOM = 458                # the long row: fronts face south onto the square, bottoms on the square's edge
ROW = [  # west to east, x, width, height: the mercantile (one storey, low), the Improvement Company (the biggest
    # in the row), the Clarion, and the fronts between, as Room 2's plate has them. The row starts east of the
    # square's west edge so the L's two arms come out about equal (Tyler, 2026-11-07: "I think it's a pretty equal
    # shaped L on both sides of the L in the game"): the map's view foreshortens north-south, so the east arm's
    # ~225 px down reads about as long as this row's ~320 px across. The square runs open past the row's west end.
    (312, 50, 80), (366, 62, 104), (432, 54, 96), (490, 48, 90), (542, 46, 86), (592, 42, 90),
]
ARM = [  # down the square's east side, facing west: the Nugget (largest, at the corner), the hotel, the assay office
    ('nugget', 640, 352, 110, 110),
    ('hotel', 650, 470, 96, 64),
    ('assay', 660, 540, 80, 36),
]


def windows(d, x0, x1, y, n, size=3):
    step = (x1 - x0) / (n + 1)
    for i in range(n):
        cx = round(x0 + step * (i + 1))
        d.rectangle([cx - size // 2, y, cx - size // 2 + size - 1, y + size], fill=WINDOW)


def south_facing(d, x, y, w, h):
    roof = int(h * 0.45)
    d.rectangle([x, y, x + w - 1, y + roof - 1], fill=ROOF, outline=LINE)
    d.rectangle([x + 2, y - 8, x + w - 3, y + 6], fill=ROOF_LIT, outline=LINE)            # the false front's top
    d.rectangle([x, y + roof, x + w - 1, y + h - 1], fill=FRONT, outline=LINE)
    windows(d, x, x + w, y + roof + 8, 3)
    windows(d, x, x + w, y + roof + 26, 2)
    d.rectangle([x - 1, y + h - 12, x + w, y + h - 1], fill=PORCH, outline=LINE)          # the porch, on the square


def west_facing(d, x, y, w, h, storeys):
    front = 22 if storeys == 2 else 16
    d.rectangle([x + front, y, x + w - 1, y + int(h * 0.7) - 1], fill=ROOF, outline=LINE)
    d.rectangle([x + front, y + int(h * 0.7), x + w - 1, y + h - 1], fill=WALL, outline=LINE)   # the south side wall
    windows(d, x + front, x + w, y + int(h * 0.7) + 4, max(1, (w - front) // 28))
    d.rectangle([x + 6, y - 6, x + front + 4, y + h - 1], fill=FRONT, outline=LINE)          # the front, facing west
    for i in range(storeys * 2):
        yy = y + 6 + i * ((h - 16) // (storeys * 2))
        d.rectangle([x + 10, yy, x + 13, yy + 3], fill=WINDOW)
    d.rectangle([x, y + 4, x + 7, y + h - 1], fill=PORCH, outline=LINE)                       # the porch, on the square


def build():
    base = Image.open(MAP).convert('RGB')
    a = np.asarray(base).copy()
    # Clear the zones to the square's own mud (rows 470-520 of x 250-370 hold no building and no trough), tiled.
    mud = a[470:520, 250:370]
    for zx, zy, zw, zh in ZONES:
        tile = np.tile(mud, (int(np.ceil(zh / mud.shape[0])), int(np.ceil(zw / mud.shape[1])), 1))[:zh, :zw]
        a[zy:zy + zh, zx:zx + zw] = tile
    img = Image.fromarray(a)
    d = ImageDraw.Draw(img)
    for x, w, h in ROW:
        south_facing(d, x, ROW_BOTTOM - h, w, h)
    for name, x, y, w, h in ARM:
        west_facing(d, x, y, w, h, 1 if name == 'assay' else 2)
    nx, ny, nw, nh = ARM[0][1:]
    d.rectangle([nx, ny + 30, nx + 18, ny + 40], fill=PORCH, outline=LINE)                     # the Nugget's balcony
    img.save(os.path.join(ROOT, 'reference/town-map/blockout-1920x864.png'))
    rx, ry, rw, rh = REGION
    out = os.path.join(ROOT, 'art/staging/town-map/blockout-01')
    os.makedirs(out, exist_ok=True)
    img.crop((rx, ry, rx + rw, ry + rh)).resize((rw * 2, rh * 2), Image.NEAREST).save(os.path.join(out, 'input.png'))
    mask = np.full((rh * 2, rw * 2, 4), 255, np.uint8)
    for zx, zy, zw, zh in ZONES:
        mask[(zy - ry) * 2:(zy - ry + zh) * 2, (zx - rx) * 2:(zx - rx + zw) * 2, 3] = 0
    Image.fromarray(mask).save(os.path.join(out, 'mask.png'))
    print('reference/town-map/blockout-1920x864.png', os.path.relpath(out, ROOT))


def promote(n, write):
    rx, ry, rw, rh = REGION
    stage = os.path.join(ROOT, f'art/staging/town-map/blockout-{n:02d}')
    edited = Image.open(os.path.join(stage, 'source.png')).convert('RGB').resize((rw, rh), Image.BOX)
    out = Image.open(MAP).convert('RGB')
    for zx, zy, zw, zh in ZONES:
        out.paste(edited.crop((zx - rx, zy - ry, zx - rx + zw, zy - ry + zh)), (zx, zy))
    out.save(os.path.join(stage, 'candidate.png'))
    print(os.path.relpath(os.path.join(stage, 'candidate.png'), ROOT))
    if write:
        out.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


if __name__ == '__main__':
    if sys.argv[1:2] == ['build']:
        build()
    elif sys.argv[1:2] == ['promote']:
        promote(int(sys.argv[sys.argv.index('--attempt') + 1]), '--write' in sys.argv)
    else:
        print(__doc__)
