"""Lay a cast master out as Tyler reads it: ONE SCALE, ONE PIXEL GRID, named.

Tyler, 2026-11-06, on master 01: "And pixelation is similar between everyone?"
Measured, it was not. The generator drew every figure on about the same 3 px
grain, but it drew the middle and bottom rows about 9% shorter than the top
one, so once each figure is scaled to its height in the game those rows come
out 9% coarser. Asking the generator for one scale did not fix it (master 02
kept the same shortfall), so it is fixed here, where it can be measured:

  1. KEY each figure off the magenta (distance >= 120, as the sheet cutter),
     the ring eroded and despilled.
  2. ROW SCALE: each row is scaled so its median man is the top row's median
     man. Heights WITHIN a row are the artist's and are kept.
  3. GRID LOCK: every figure is reduced by GRID with a premultiplied BOX and
     drawn back up NEAREST, so every figure on the sheet is made of the same
     size of square pixel, by construction.

Usage: cast-master-sheet.py <master.png> <boxes.json> <out.png> [--labels]
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import binary_erosion

GRID = 3
NAMES = ["Thad", "Hob", "Deke Vessel", "Winnie Ledger", "Col. Fanshawe", "Rev. Sowerby",
         "Registrar Sump", "Ignatius Frame", "Nickel Pratt", "Ah-Lam Sheng", "Mme Ozymandia",
         "The undertaker", "The livery man", "The stage driver", "The hotel clerk",
         "The Company clerk", "The letter-writer", "The map seller", "The pie woman",
         "The man panning", "Judge (bald)", "Judge (gaunt)", "Judge (bearded)"]
ROWS = [range(0, 8), range(8, 16), range(16, 23)]
# Who the row-median is taken over: the ordinary men (not women, not the
# short clerk, not the slight launderer).
NOT_ORDINARY = {3, 9, 10, 14, 18}

src, boxes_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
labels = '--labels' in sys.argv
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
boxes = json.load(open(boxes_path))['boxes']
assert len(boxes) == len(NAMES), f'{len(boxes)} figures, {len(NAMES)} names'

def cut(box):
    x0, y0, x1, y1 = box
    sub = im[y0:y1 + 1, x0:x1 + 1]
    dist = np.sqrt((sub[..., 0] - 255) ** 2 + sub[..., 1] ** 2 + (sub[..., 2] - 255) ** 2)
    fg = binary_erosion(dist >= 120, iterations=1)
    rgb = sub.copy()
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] - 40, 0, None)
    rgb[..., 0] -= spill; rgb[..., 2] -= spill
    a = fg.astype(float)
    return np.dstack([np.clip(rgb, 0, 255), a * 255])

def lock(rgba, scale):
    """Scale, then reduce by GRID (premultiplied BOX) and draw back NEAREST."""
    h, w = rgba.shape[:2]
    th, tw = max(1, round(h * scale / GRID)), max(1, round(w * scale / GRID))
    pre = rgba.copy(); pre[..., :3] *= pre[..., 3:4] / 255
    small = np.stack([np.asarray(Image.fromarray(pre[..., c].astype(np.float32), 'F')
                                 .resize((tw, th), Image.BOX)) for c in range(4)], -1)
    a = small[..., 3]
    rgb = np.where(a[..., None] > 1, small[..., :3] * 255 / np.maximum(a[..., None], 1), 0)
    alpha = np.where(a >= 128, 255, 0)
    small = np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8)
    return Image.fromarray(small, 'RGBA').resize((tw * GRID, th * GRID), Image.NEAREST)

heights = [b[3] - b[1] for b in boxes]
def median_man(row):
    return float(np.median([heights[i] for i in row if i not in NOT_ORDINARY]))
ref = median_man(ROWS[0])
figs, report = [], []
for row in ROWS:
    s = ref / median_man(row)
    for i in row:
        figs.append(lock(cut(boxes[i]), s))
        report.append({'name': NAMES[i], 'drawn': heights[i], 'rowScale': round(s, 3), 'locked': figs[-1].height})

BG = (44, 45, 56)
gap, pad, label_h = 46, 40, 34 if labels else 0
row_imgs = [[figs[i] for i in row] for row in ROWS]
row_h = [max(f.height for f in r) for r in row_imgs]
W = max(sum(f.width for f in r) + gap * (len(r) - 1) for r in row_imgs) + 2 * pad
H = sum(row_h) + len(ROWS) * (label_h + 20) + 2 * pad
sheet = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except OSError:
    font = ImageFont.load_default()
y, k = pad, 0
for r, rh in zip(row_imgs, row_h):
    x = pad + (W - 2 * pad - (sum(f.width for f in r) + gap * (len(r) - 1))) // 2
    for f in r:
        sheet.paste(f, (x, y + rh - f.height), f)
        if labels:
            t = report[k]['name']; tw = draw.textlength(t, font=font)
            draw.text((x + f.width / 2 - tw / 2, y + rh + 8), t, fill=(225, 225, 230), font=font)
        x += f.width + gap; k += 1
    y += rh + label_h + 20
sheet.save(out)
print(json.dumps({'grid': GRID, 'topRowMedianMan': ref, 'figures': report}, indent=1))
