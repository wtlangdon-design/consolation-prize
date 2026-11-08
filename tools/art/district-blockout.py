"""The whole district blocked out, for the image to dress (errata 163 A8).

Tyler, 2026-11-07: "Feel free to create a completely new map if you need to where everything on the whole map should
be located. Paths, mountains, places, buildings, etc." reference/district/plan.json is where everything is, read
from the plates; this paints it as flat shapes in the night map's colours, a block-out the image is asked to dress
without moving anything. The markers and the roads the map's Thad walks are read from the same plan.

  python3 tools/art/district-blockout.py build
      writes reference/district/blockout-1920x864.png and art/staging/town-map/district-01/input.png (the
      block-out in the 20:9 window of a 1536 x 1024 canvas, as every plate is laid out).
  python3 tools/art/district-blockout.py promote --attempt N [--fit] [--write]
      crops district-0N/source.png back to 1920 x 864 (--fit: to the drawn frame), measures how far the drawing
      sits from the block-out, writes candidate.png, and with --write replaces the shipping map.
"""
import json
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAN = os.path.join(ROOT, 'reference/district/plan.json')
OUT = os.path.join(ROOT, 'reference/district/blockout-1920x864.png')
MAP = os.path.join(ROOT, 'art/backgrounds/room-00-town-map.png')
WINDOW = (8, 170, 1520, 684)
W, H = 1920, 864

GRASS, GRASS2 = (14, 34, 46), (18, 40, 52)
FOREST, FOREST_LIT = (8, 24, 34), (16, 40, 50)
MOUNT, MOUNT_LIT, MOUNT_SNOW = (22, 30, 46), (40, 52, 74), (70, 84, 110)
ROAD, ROAD_EDGE = (62, 70, 84), (34, 40, 52)
MUD = (46, 44, 50)
WATER, WATER_LIT = (30, 70, 140), (70, 120, 190)
ROOF, ROOF_LIT, WALL, FRONT, PORCH, WINDOW_LIT, LINE = (20, 32, 52), (34, 48, 72), (44, 40, 44), (104, 64, 30), (58, 38, 21), (230, 150, 50), (4, 10, 20)
WOOD, STONE, WHITE = (90, 64, 40), (90, 96, 110), (190, 196, 206)
LANTERN = (250, 170, 60)


def windows(d, x0, x1, y, n, size=3):
    step = (x1 - x0) / (n + 1)
    for i in range(n):
        cx = round(x0 + step * (i + 1))
        d.rectangle([cx - 1, y, cx + size - 2, y + size], fill=WINDOW_LIT)


def south_facing(d, x, y, w, h, porch=True, tall=True):
    roof = int(h * 0.45)
    d.rectangle([x, y, x + w - 1, y + roof - 1], fill=ROOF, outline=LINE)
    if tall:
        d.rectangle([x + 2, y - 6, x + w - 3, y + 5], fill=ROOF_LIT, outline=LINE)
    d.rectangle([x, y + roof, x + w - 1, y + h - 1], fill=FRONT, outline=LINE)
    windows(d, x, x + w, y + roof + 5, max(1, w // 18))
    if h > 60:
        windows(d, x, x + w, y + roof + 20, max(1, w // 26))
    if porch:
        d.rectangle([x - 1, y + h - 9, x + w, y + h - 1], fill=PORCH, outline=LINE)


def west_facing(d, x, y, w, h, storeys):
    front = 20 if storeys == 2 else 14
    d.rectangle([x + front, y, x + w - 1, y + int(h * 0.7) - 1], fill=ROOF, outline=LINE)
    d.rectangle([x + front, y + int(h * 0.7), x + w - 1, y + h - 1], fill=WALL, outline=LINE)
    windows(d, x + front, x + w, y + int(h * 0.7) + 3, max(1, (w - front) // 28))
    d.rectangle([x + 6, y - 6, x + front + 4, y + h - 1], fill=FRONT, outline=LINE)
    for i in range(storeys * 2):
        yy = y + 6 + i * ((h - 14) // (storeys * 2))
        d.rectangle([x + 10, yy, x + 13, yy + 3], fill=WINDOW_LIT)
    d.rectangle([x, y + 4, x + 7, y + h - 1], fill=PORCH, outline=LINE)


def tree(d, x, y, r):
    d.ellipse([x - r, y - r, x + r, y + r], fill=FOREST, outline=LINE)
    d.ellipse([x - r + 2, y - r + 1, x + r // 2, y], fill=FOREST_LIT)


def poly_road(d, pts, width=9):
    pts = [tuple(p) for p in pts]
    d.line(pts, fill=ROAD_EDGE, width=width + 4, joint='curve')
    d.line(pts, fill=ROAD, width=width, joint='curve')


def build():
    plan = json.load(open(PLAN))
    rnd = random.Random(163)
    img = Image.new('RGB', (W, H), GRASS)
    d = ImageDraw.Draw(img)
    # Ground texture: speckle, so the dressing has grass to read.
    for _ in range(9000):
        x, y = rnd.randrange(W), rnd.randrange(H)
        d.point((x, y), fill=GRASS2)
    m = plan['mountains']
    d.polygon([tuple(p) for p in m['south_hills']], fill=(12, 28, 38))
    # Forest along the valley's foot, west and south, where the plates have trees.
    for _ in range(260):
        x = rnd.choice([rnd.randrange(150, 300), rnd.randrange(0, W)])
        y = rnd.randrange(640, 800) if x > 300 else rnd.randrange(150, 800)
        if 280 < x < 1100 and 230 < y < 680:
            continue
        tree(d, x, y, rnd.randrange(6, 11))
    for key in ('north', 'west', 'east'):
        d.polygon([tuple(p) for p in m[key]], fill=MOUNT)
    # Ridges: lit triangles along the mountain bands.
    for x in range(0, W, 46):
        top = 10 + rnd.randrange(30)
        if abs(x - m['pass'][0]) < 70:
            continue
        d.polygon([(x, top + 60), (x + 30, top), (x + 60, top + 60)], fill=MOUNT_LIT)
        d.polygon([(x + 24, top + 10), (x + 30, top), (x + 36, top + 10)], fill=MOUNT_SNOW)
    for y in range(20, H - 80, 60):
        d.polygon([(0, y + 50), (40 + rnd.randrange(30), y), (110, y + 50)], fill=MOUNT_LIT)
    for y in range(20, 460, 60):
        d.polygon([(1830, y + 50), (1880, y), (1920, y + 50)], fill=MOUNT_LIT)
    # The pass: a notch through the north ridge.
    px, py = m['pass']
    d.polygon([(px - 50, 0), (px + 50, 0), (px + 30, py + 10), (px - 30, py + 10)], fill=(28, 36, 50))
    # The creek.
    cr = [tuple(p) for p in plan['creek']]
    d.line(cr, fill=WATER, width=9, joint='curve')
    d.line(cr, fill=WATER_LIT, width=2)
    # Roads.
    for name, pts in plan['roads'].items():
        poly_road(d, pts, 7 if name in ('lane', 'back_alley', 'houses', 'ridge') else 10)
    # Bridges where a road crosses the creek.
    for bx, by in [(1160, 430), (1400, 615)]:
        d.rectangle([bx - 12, by - 8, bx + 12, by + 8], fill=WOOD, outline=LINE)
    t = plan['town']
    sx, sy, sw, sh = t['square']
    d.rectangle([sx, sy, sx + sw, sy + sh], fill=MUD, outline=ROAD_EDGE)
    x, y, w, h = t['trough']
    d.rectangle([x, y, x + w, y + h], fill=WOOD, outline=LINE)
    d.rectangle([x + 3, y + 3, x + w - 3, y + h - 3], fill=WATER)
    for x, y, w, h in t['row_south_facing']:
        south_facing(d, x, y, w, h)
    for name, x, y, w, h in t['arm_west_facing']:
        west_facing(d, x, y, w, h, 1 if name == 'assay' else 2)
    nx, ny = t['arm_west_facing'][0][1:3]
    d.rectangle([nx, ny + 28, nx + 18, ny + 38], fill=PORCH, outline=LINE)  # the Nugget's balcony
    for name, x, y, w, h in t['lane_south_facing']:
        if name == 'tent':
            d.polygon([(x, y + h), (x + w // 2, y), (x + w, y + h)], fill=(150, 60, 60), outline=LINE)
            for i in range(1, 4):
                d.line([(x + w // 2, y), (x + i * w // 4, y + h)], fill=(220, 210, 190), width=2)
            d.rectangle([x + w // 2 - 5, y + h - 14, x + w // 2 + 5, y + h], fill=WINDOW_LIT)
        else:
            south_facing(d, x, y, w, h, tall=name != 'storefront')
    for name, x, y, w, h in t['lower_south_facing']:
        if name == 'church':
            d.rectangle([x, y + 30, x + w, y + h], fill=(150, 156, 170), outline=LINE)
            d.polygon([(x - 2, y + 32), (x + w // 2, y + 8), (x + w + 2, y + 32)], fill=ROOF, outline=LINE)
            d.rectangle([x + w // 2 - 7, y - 6, x + w // 2 + 7, y + 14], fill=WHITE, outline=LINE)
            d.polygon([(x + w // 2 - 8, y - 6), (x + w // 2, y - 20), (x + w // 2 + 8, y - 6)], fill=ROOF, outline=LINE)
            d.rectangle([x + w // 2 - 5, y + h - 20, x + w // 2 + 5, y + h], fill=WOOD)
            windows(d, x, x + w, y + 46, 2)
        elif name == 'livery':
            d.rectangle([x, y, x + w, y + int(h * 0.5)], fill=ROOF, outline=LINE)
            d.rectangle([x, y + int(h * 0.5), x + w, y + h], fill=WOOD, outline=LINE)
            d.rectangle([x + w // 2 - 12, y + int(h * 0.55), x + w // 2 + 12, y + h], fill=WINDOW_LIT)
        else:
            south_facing(d, x, y, w, h)
    bx, by = t['bell_post']
    d.line([(bx, by), (bx, by + 26)], fill=WOOD, width=3)
    d.ellipse([bx + 1, by - 2, bx + 9, by + 8], fill=(150, 120, 60), outline=LINE)
    x, y, w, h = t['corral']
    d.rectangle([x, y, x + w, y + h], outline=WOOD, width=2)
    for x, y, w, h in t['back_alley_crates']:
        d.rectangle([x, y, x + w, y + h], fill=WOOD, outline=LINE)
    x, y, w, h = t['watchmans_shack']
    south_facing(d, x, y, w, h, porch=False, tall=False)
    for name, x, y, w, h in t['houses']:
        south_facing(d, x, y, w, h, tall=False)
    # The coach stop on its shoulder: a fenced yard, a wagon, a woodpile, a signboard.
    x, y, w, h = plan['coach_stop']
    d.rectangle([x, y, x + w, y + h], outline=WOOD, width=2)
    d.rectangle([x + 8, y + 10, x + 30, y + 24], fill=WOOD, outline=LINE)
    d.ellipse([x + 44, y + 14, x + 60, y + 30], fill=(70, 50, 30), outline=LINE)
    d.rectangle([x - 10, y - 14, x + 8, y - 4], fill=WOOD, outline=LINE)
    d.point((x + 20, y + 4), fill=LANTERN)
    # The diggings.
    P = plan['places']
    x, y, w, h = P['boot_hill']['fence']
    d.ellipse([x - 30, y - 10, x + w + 30, y + h + 30], fill=(30, 44, 54))
    d.rectangle([x, y, x + w, y + h], outline=WOOD, width=2)
    for i in range(12):
        gx, gy = x + 10 + (i % 6) * 16, y + 14 + (i // 6) * 26
        d.rectangle([gx, gy, gx + 5, gy + 9], fill=WHITE)
    sx, sy = P['claims_road']['signpost']
    d.line([(sx + 14, sy - 26), (sx + 14, sy - 4)], fill=WOOD, width=2)
    d.rectangle([sx + 8, sy - 26, sx + 28, sy - 20], fill=WOOD)
    x, y, w, h = P['prosperity']['hill']
    d.ellipse([x, y, x + w, y + h], fill=(48, 52, 62), outline=LINE)
    hx, hy = P['prosperity']['hole']
    d.ellipse([hx - 8, hy - 6, hx + 8, hy + 6], fill=(0, 0, 0))
    x, y, w, h = P['pratts_claim']['cabin']
    south_facing(d, x, y, w, h, porch=False, tall=False)
    d.line([tuple(p) for p in P['pratts_claim']['sluice']], fill=WOOD, width=4)
    for i, (x, y) in enumerate(P['claim_row']['stakes']):
        d.ellipse([x - 7, y + 4, x + 7, y + 12], fill=(60, 60, 66))
        d.line([(x, y - 8), (x, y + 6)], fill=WOOD, width=2)
    x, y, w, h = P['laundry']['building']
    south_facing(d, x, y, w, h, tall=False)
    d.line([tuple(p) for p in P['laundry']['lines']], fill=WHITE, width=1)
    d.line([tuple(p) for p in P['creek']['sluice']], fill=WOOD, width=5)
    cx, cy = P['high_ridge']['cairn']
    d.polygon([(cx - 10, cy + 12), (cx, cy - 12), (cx + 10, cy + 12)], fill=STONE, outline=LINE)
    x, y, w, h = P['motts_site']['field']
    d.ellipse([x, y, x + w, y + h], fill=(40, 44, 54))
    for i in range(14):
        hx, hy = x + 10 + rnd.randrange(w - 20), y + 8 + rnd.randrange(h - 16)
        d.ellipse([hx - 4, hy - 2, hx + 4, hy + 2], fill=(10, 12, 18))
    wx, wy = P['motts_site']['windlass']
    d.rectangle([wx - 8, wy - 10, wx + 8, wy], outline=WOOD, width=2)
    # Lanterns at the workings.
    for x, y in [(1495, 330), (1540, 572), (1715, 730), (1660, 236), (1030, 176)]:
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=LANTERN)
    # The map's frame, as the shipping map has one.
    d.rectangle([0, 0, W - 1, H - 1], outline=(60, 44, 30), width=6)
    img.save(OUT)
    canvas = Image.new('RGB', (1536, 1024), (150, 150, 150))
    x, y, w, h = WINDOW
    canvas.paste(img.resize((w, h), Image.LANCZOS), (x, y))
    stage = os.path.join(ROOT, 'art/staging/town-map/district-01')
    os.makedirs(stage, exist_ok=True)
    canvas.save(os.path.join(stage, 'input.png'))
    print(os.path.relpath(OUT, ROOT), os.path.relpath(stage, ROOT))


def edges(a):
    g = a.mean(axis=2)
    return np.abs(np.diff(g, axis=0))[:, :-1] + np.abs(np.diff(g, axis=1))[:-1, :]


def shift(a, b):
    a, b = edges(a), edges(b)
    a = (a - a.mean()) / (a.std() + 1e-9)
    b = (b - b.mean()) / (b.std() + 1e-9)
    f = np.fft.fft2(a) * np.conj(np.fft.fft2(b))
    r = np.abs(np.fft.ifft2(f / (np.abs(f) + 1e-9)))
    dy, dx = np.unravel_index(np.argmax(r), r.shape)
    dy -= r.shape[0] if dy > r.shape[0] // 2 else 0
    dx -= r.shape[1] if dx > r.shape[1] // 2 else 0
    return int(dx), int(dy)


def fitted(src):
    """The drawn frame: the bounding box of everything not the grey canvas, as town-map-edit.py --fit does."""
    a = np.asarray(src).astype(int)
    grey = (np.abs(a - 150).max(axis=2) <= 12)
    rows = np.where((~grey).mean(axis=1) > 0.6)[0]
    cols = np.where((~grey).mean(axis=0) > 0.6)[0]
    return (cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)


def promote(n, fit, write):
    stage = os.path.join(ROOT, f'art/staging/town-map/district-{n:02d}')
    src = Image.open(os.path.join(stage, 'source.png')).convert('RGB')
    if fit:
        box = fitted(src)
        print(f'fitted to the drawn frame {box}')
    else:
        x, y, w, h = WINDOW
        box = (x, y, x + w, y + h)
    out = src.crop(box).resize((W, H), Image.LANCZOS)
    dx, dy = shift(np.asarray(Image.open(OUT).convert('RGB')).astype(float), np.asarray(out).astype(float))
    print(f'the drawing sits {dx:+d},{dy:+d} px from the block-out' + ('' if max(abs(dx), abs(dy)) <= 8 else ' -- A MISS: the markers would be off'))
    out.save(os.path.join(stage, 'candidate.png'))
    print(os.path.relpath(os.path.join(stage, 'candidate.png'), ROOT))
    if write:
        out.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


if __name__ == '__main__':
    if sys.argv[1:2] == ['build']:
        build()
    elif sys.argv[1:2] == ['promote']:
        promote(int(sys.argv[sys.argv.index('--attempt') + 1]), '--fit' in sys.argv, '--write' in sys.argv)
    else:
        print(__doc__)
