"""The dinner table, as Tyler asked for it after the second render (2026-11-08): "Thad is very awkwardly
positioned at the table. Maybe you need the tablecloth to come all the way down and it can hide his legs
completely? And the other guy's shoulder is partially missing behind the candle." No image operation.

1. THE WALL BEHIND THE CANDLES, OUT OF THE PROP. room-11-dinner.png keeps the dinner plate's changed pixels
   (tools/art/room11-props.py), and around the candles, the lamp and the bottle's neck that is the wall
   lit by them: dark, wall-coloured pixels within 75 of the bare plate under them. Drawn in front of
   Fanshawe, they cut his shoulders. Above the cloth's top they are cleared; the objects keep every pixel.
2. THE CLOTH TO THE FLOOR, IN FRONT OF THAD. A second prop, room-11-dinner-drape.png: under the cloth's
   own hanging edge, column by column, the cloth carried down to the floor in its own texture (the band
   above the edge, repeated), shaded into folds and darkening toward a hem. It stands on the floor in
   front of the chair (`y` 722), so the depth sort draws it in front of him seated and behind him
   standing anywhere in the walk band; the table top stays behind him, so his forearms are on it.

Writes both PNGs and prints the drape's frame.
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROP = os.path.join(ROOT, 'art/props/room-11-dinner.png')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-11-fanshawe-office.png')
X0, Y0 = 824, 398                 # the prop's top-left on the plate (x 1095, y 643, 543 x 245, bottom-centred)
FLOOR = 722                       # the desk's base meets the carpet
TOP_ROWS = 92                     # above this row of the prop is above the cloth's top
BOTTLE = (258, 302, 36)           # the bottle's columns, and the row its neck begins

p = np.asarray(Image.open(PROP).convert('RGBA')).copy()
plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
H, W = p.shape[:2]
under = plate[Y0:Y0 + H, X0:X0 + W]
d = np.abs(p[..., :3].astype(int) - under).sum(2)
lum = 0.3 * p[..., 0] + 0.59 * p[..., 1] + 0.11 * p[..., 2]
zone = np.zeros((H, W), bool)
zone[:TOP_ROWS] = True
zone[BOTTLE[2]:, BOTTLE[0]:BOTTLE[1]] = False
wall = (p[..., 3] > 0) & zone & (d < 75) & (lum < 120)
p[wall] = 0
Image.fromarray(p).save(PROP)

# THE DRAPE.
lum = 0.3 * p[..., 0] + 0.59 * p[..., 1] + 0.11 * p[..., 2]
rows = FLOOR - Y0
drape = np.zeros((rows, W, 4), np.uint8)
# The cloth's lower edge in each column, found from below: the lowest light pixel over the dark desk. Smoothed
# across nine columns so a plate's rim or a dark fold cannot notch it.
from scipy.ndimage import median_filter
low = np.full(W, -1)
for x in range(W):
    light = np.where((p[TOP_ROWS:, x, 3] > 0) & (lum[TOP_ROWS:, x] > 120))[0]
    if len(light):
        low[x] = TOP_ROWS + light.max() + 1
xs = np.where(low >= 0)[0]
left, right = xs.min(), xs.max()
edge = np.interp(np.arange(W), xs, low[xs])
edge = median_filter(edge, size=9, mode='nearest').round().astype(int)
# Its colour is taken from under that ragged edge; the drape itself hangs from ONE straight line, the table
# top's front edge, so it reads as one cloth folded over the edge and down (Tyler: "all the way down").
FRONT = 147
colour_edge = edge.copy()
# Its colour: the hanging cloth's own, the median of the light pixels just above the edge, flat, in folds.
hang = np.array([p[max(TOP_ROWS, e - 14):e, x, :3][lum[max(TOP_ROWS, e - 14):e, x] > 110].reshape(-1, 3)
                 for x, e in zip(range(W), colour_edge) if left <= x <= right and e > TOP_ROWS], dtype=object)
base = np.median(np.vstack([h for h in hang if len(h)]), axis=0)
BLOCK = 4
for x in range(left, right + 1):
    bx = (x - left) // BLOCK
    fold = 0.88 + 0.12 * np.cos(2 * np.pi * bx * BLOCK / 40.0)
    side = 0.85 if x - left < 8 or right - x < 8 else 1.0
    for yy in range(FRONT, rows):
        by = (yy // BLOCK) * BLOCK
        depth = 1.0 - 0.16 * (by - FRONT) / max(1, rows - FRONT)
        hem = 0.7 if yy >= rows - BLOCK else (1.1 if yy < FRONT + BLOCK else 1.0)
        drape[yy, x, :3] = np.clip(base * fold * depth * hem * side, 0, 255)
        drape[yy, x, 3] = 255
Image.fromarray(drape).save(os.path.join(ROOT, 'art/props/room-11-dinner-drape.png'))
print({'x': X0 + W // 2, 'y': FLOOR, 'frame': [0, 0, W, rows], 'cleared': int(wall.sum())})
