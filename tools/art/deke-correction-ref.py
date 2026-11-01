"""Deke Vessel attempt 2 reference (Tyler, 2026-11-01): Thad cropped from the
style reference on the left, attempt 1's five poses shrunk to Thad's height
beside him, on magenta. No content; art plumbing only."""
import numpy as np
from PIL import Image
R = '/home/user/consolation-prize/'
THAD_TOP, THAD_BASE = 39, 339          # measured on reference/room-03/deke/style-reference.png
THAD_H = THAD_BASE - THAD_TOP + 1      # 301
KEY = (255, 0, 255)

ref = Image.open(R + 'reference/room-03/deke/style-reference.png').convert('RGB')
thad = ref.crop((152, THAD_TOP - 6, 236, THAD_BASE + 6))

sheet = Image.open(R + 'art/staging/room-03/deke-01/sheet.png').convert('RGB')
a = np.asarray(sheet).astype(int)
fig = ~((a[..., 0] > 200) & (a[..., 2] > 200) & (a[..., 1] < 80))
cols = np.where(fig.any(0))[0]
runs, s, p = [], cols[0], cols[0]
for c in cols[1:]:
    if c - p > 8:
        runs.append((s, p)); s = c
    p = c
runs.append((s, p))
runs = [r for r in runs if r[1] - r[0] > 40]
assert len(runs) == 5, runs
rows = np.where(fig.any(1))[0]
top, base = rows[0], rows[-1]
scale = THAD_H / (base - top + 1)
small = sheet.crop((0, top, sheet.width, base + 1))
small = small.resize((round(small.width * scale), THAD_H), Image.BOX)
s = np.asarray(small).astype(int)
fringe = ((s[..., 0] - s[..., 1]) > 70) & ((s[..., 2] - s[..., 1]) > 70)
s[fringe] = KEY
small = Image.fromarray(s.astype(np.uint8))

W, H = 1024, 420
canvas = Image.new('RGB', (W, H), KEY)
y0 = (H - THAD_H) // 2
canvas.paste(thad, (40, y0 - 6))
x = 40 + thad.width + 40
canvas.paste(small, (x, y0))
assert x + small.width <= W - 20, (x, small.width)
canvas.save(R + 'art/staging/room-03/deke-02/reference.png')
print('scale', round(scale, 4), 'sheet', small.size, 'canvas', canvas.size)
