"""Room 36's plate: Room 2's street at first light. One image operation, then a transfer.

Doc 20: Room 36, Main Street at dawn, replaces Room 2 after F5. The street is
3700 pixels wide and approved; no operation paints at that width, and a new
picture would not be Room 2's street. So operation 1 relit a small copy of the
whole street to first light (reference/room-36/prompts/dawn-01.txt), and this
script carries only its LIGHT back onto Room 2's own pixels:

  1. the sky above the ridge is the morning's, read off operation 1 (a night
     sky times any ratio is still a night sky with stars in it);
  2. the light is the ratio of the two pictures, each blurred so that no
     detail of the small one -- a window it moved, an edge it softened -- can
     reach the street, only its colour and brightness;
  3. Room 2's plate times that ratio, scaled up smoothly, is Room 36's plate.

Every board, sign and puddle is Room 2's; the sky, the warmth on the fronts
and the dark windows are the morning's. No pixel is invented.

Writes <staging>/candidate-<W>x<H>.png and frame.json. The defaults are Room 36's; Room 1 at dawn
(errata 119 B) is the same transfer on Room 1's lettered plate:
  room36-dawn.py --staging art/staging/room-36/coach-stop-dawn
                 --night art/staging/room-36/coach-stop-dawn/night-lettered.png --top 166 --rows 691 --shift-y -4
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

import argparse
ap = argparse.ArgumentParser()
ap.add_argument('--staging', default='art/staging/room-36/dawn-01')
ap.add_argument('--night', default='art/backgrounds/room-02-main-street.png')
ap.add_argument('--top', type=int, default=332)
ap.add_argument('--rows', type=int, default=359)
ap.add_argument('--shift-y', type=int, default=-1)
# ROOM 1 (errata 119 B): its hills are LOWER than the ones operation 3 drew, so the morning's ridge
# painted sky over their tops and left their outline floating. With --ridge-blue, the ridge is Room
# 1's own: its night sky grows bluer toward the horizon and its far hills are a duller blue, so each
# column's ridge is the first row below --ridge-from where the star-free blue drops under this.
ap.add_argument('--ridge-blue', type=float, default=None)
ap.add_argument('--ridge-from', type=int, default=60)
# ...and its town's lit windows are a few pixels each, far below the light's blur: inside this rect
# (x,y,w,h; several joined by ';') every warm lit pixel of the night plate is filled from the unlit pixels around it.
ap.add_argument('--unlight', default=None)
args = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, args.staging)
NIGHT = os.path.join(ROOT, args.night)
TOP, ROWS = args.top, args.rows       # where the operation's input put the small picture
SHIFT_Y = args.shift_y                # how far the operation moved it (Room 36: one row lower, edge correlation 0.375 at 0,-1)
BLUR = 4.0                    # in small pixels: light, not detail
SKY_DROP = 22                 # how far below the sky's light a pixel must be to be ridge
PIXEL = 6                     # the street's own pixel size, errata 54
SKY_SIGMA = 2.2               # how unlike Room 2's top rows of sky a pixel may be and still be sky
BAND = 70                     # full rows below the morning's ridge where Room 2's night sky is looked for

night = np.asarray(Image.open(NIGHT).convert('RGB')).astype(float)
H, W = night.shape[:2]

# 1. The sky, read off the morning: in operation 1's picture the sky is light
#    and the mountains darker, so each column's ridge is the first row, from
#    the top, that drops below the sky's light (and stays down). Room 2's night
#    sky above it -- stars and all -- is replaced by the morning's, scaled up and
#    laid in blocks the size of the street's own pixels.
small_in = np.asarray(Image.open(f'{S}/input.png').convert('RGB')).astype(float)[TOP:TOP + ROWS]
small_out = np.asarray(Image.open(f'{S}/source.png').convert('RGB')).astype(float)
small_out = np.roll(small_out, SHIFT_Y, axis=0)[TOP:TOP + ROWS]
slum = ndi.uniform_filter(small_out.mean(2), 3)
ridge_small = np.zeros(small_out.shape[1])
for x in range(small_out.shape[1]):
    col = slum[:, x]
    sky_level = np.median(col[:8])
    below = np.where(col < sky_level - SKY_DROP)[0]
    ridge_small[x] = below[0] if len(below) else ROWS // 3
ridge_small = ndi.minimum_filter1d(ridge_small, 5)          # never cut a peak or the steeple short
ridge = np.interp(np.arange(W), np.linspace(0, W - 1, len(ridge_small)), ridge_small) * H / ROWS
# THE SKY ALONG THE MORNING'S RIDGE, AND NO NIGHT LEFT UNDER IT. Above the
# morning's ridge it is sky. Operation 1 drew its mountains a little
# differently from Room 2's, so just below that ridge Room 2 can still show
# night sky (and stars) where its own peaks are lower: those pixels -- coloured
# like Room 2's top rows of pure sky, and joined to the sky above -- are sky
# too. Room 2's mountains are never painted over below that band.
smooth = np.stack([ndi.median_filter(night[..., c], 5) for c in range(3)], -1)
top = smooth[:24].reshape(-1, 3)
mean, cov = top.mean(0), np.cov(top.T) + np.eye(3) * 4.0
d = smooth - mean
dist = np.sqrt(np.einsum('...i,ij,...j->...', d, np.linalg.inv(cov), d))
rows = np.arange(H)[:, None]
if args.ridge_blue is not None:
    blue = ndi.median_filter(night[..., 2], 9)
    low = blue[args.ridge_from:] < args.ridge_blue
    ridge = np.where(low.any(0), low.argmax(0) + args.ridge_from, H // 3).astype(float)
    ridge = ndi.median_filter(ridge, 9) + 2
above = rows < (ridge[None, :] - 2)
band = (rows >= ridge[None, :] - 2) & (rows < ridge[None, :] + BAND) & (dist < SKY_SIGMA)
lab, _ = ndi.label(above | band)
keep = np.unique(lab[above & (lab > 0)])
sky = np.isin(lab, keep) & (above | band)
sky = ndi.binary_fill_holes(sky)
# A piece of night left floating in the morning -- not joined to the ground --
# is a torn edge, not a mountain: it is sky too.
ground, _ = ndi.label(~sky)
rooted = np.unique(ground[H - 1][ground[H - 1] > 0])
sky = ~np.isin(ground, rooted)
# THE MORNING'S SKY ONLY, AS A GRADIENT. Each row's colour is the median of
# the morning's sky across the columns where that row is still sky, carried
# down below the lowest; a broad left-to-right tint, blurred far wider than any
# roof or peak, keeps the glow where the morning put it (low, to the right).
# Nothing of the morning's buildings or mountains can ride in on it.
nrow, ncol = small_out.shape[:2]
open_sky = np.arange(nrow)[:, None] < (ridge_small[None, :] - 4)
rowcol = np.zeros((nrow, 3))
last = small_out[0].mean(0)
for y in range(nrow):
    cols = open_sky[y]
    if cols.sum() > ncol * 0.1:
        last = np.median(small_out[y, cols], axis=0)
    rowcol[y] = last
carried = np.where(open_sky[..., None], small_out, rowcol[:, None, :])
tint = np.stack([ndi.gaussian_filter1d(carried[..., c], 60, axis=1) for c in range(3)], -1)
small_sky = 0.5 * rowcol[:, None, :] + 0.5 * tint
blocky = Image.fromarray(np.clip(small_sky, 0, 255).astype(np.uint8)).resize((W // PIXEL, H // PIXEL), Image.BILINEAR)
blocky = np.asarray(blocky.resize((W, H), Image.NEAREST)).astype(float)
clean = night.copy()
clean[sky] = blocky[sky]

# 2. The light below the ridge, from the two small pictures.
blur = lambda a: np.stack([ndi.gaussian_filter(a[..., c], BLUR) for c in range(3)], -1)
ratio = (blur(small_out) + 6) / (blur(small_in) + 6)
ratio = np.clip(ratio, 0.25, 6.0)

# 3. Scaled up smoothly and laid over the street (the sky is already the morning's).
big = np.stack([np.asarray(Image.fromarray(ratio[..., c].astype(np.float32), mode='F')
                           .resize((W, H), Image.BILINEAR)) for c in range(3)], -1)
big[sky] = 1.0
dawn = np.clip(clean * big, 0, 255)
if args.unlight:
    lit = np.zeros((H, W), bool)
    for rect in args.unlight.split(';'):     # several rects: the town either side of what must keep its paint
        ux, uy, uw, uh = (int(v) for v in rect.split(','))
        box = night[uy:uy + uh, ux:ux + uw]
        lit[uy:uy + uh, ux:ux + uw] |= (box[..., 0] > 110) & (box[..., 0] - box[..., 2] > 45)
    lit = ndi.binary_dilation(lit, iterations=1)
    keepw = (~lit).astype(float)
    fill = np.stack([ndi.gaussian_filter(dawn[..., c] * keepw, 3) for c in range(3)], -1) \
        / np.maximum(ndi.gaussian_filter(keepw, 3), 1e-3)[..., None]
    dawn[lit] = fill[lit]
    print('windows put out', int(lit.sum()))
dawn = dawn.astype(np.uint8)
stars = sky
out = f'{S}/candidate-{W}x{H}.png'
Image.fromarray(dawn).save(out)
with open(f'{S}/frame.json', 'w') as f:
    json.dump({'source': f'{S}/source.png', 'night': os.path.relpath(NIGHT, ROOT), 'out': os.path.relpath(out, ROOT),
               'band': {'top': TOP, 'rows': ROWS, 'shiftY': SHIFT_Y}, 'blur': BLUR, 'skyPixels': int(stars.sum()),
               'why': 'Room 2\'s pixels under operation 1\'s light (tools/art/room36-dawn.py).'}, f, indent=1)
    f.write('\n')
print('sky pixels', int(stars.sum()), 'mean lum', round(float(dawn.mean()), 1), 'night', round(float(night.mean()), 1))
