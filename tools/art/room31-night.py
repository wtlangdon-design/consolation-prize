"""Room 31 at night: the funeral, relit to the hill's own night. No image operation.

Tyler, 2026-11-06: "we don't want something flipping from night to day and back
to night" -- every outdoor room is night, so the funeral is too (errata 99 K).
Room-31 operation 4 is this hill at night (the grave dug open again); operation 2
is the same hill by day, the plate the funeral was cut against. Their light is
the ratio of the two, each blurred far past any detail -- the moon's blue and its
fall-off, never a board or a clod -- and the day's funeral is laid under it:

  1. the plate (art/staging/room-31/plate-01) times the ratio;
  2. the sky above the hill is operation 4's own, with its moon and stars,
     wherever the day's picture has sky (operation 4 kept the hill's line);
  3. every figure and the hearse, cut from the day master
     (tools/art/room31-cast.py), times the ratio where it stands, so the
     mourners are lit by the same moon as the grass behind them.

Run after tools/art/room31-cast.py, which writes the day sheets this relights.
Writes art/staging/room-31/night/plate-1920x864.png and night.json, and the
relit sheets in place.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-31')
DAY = f'{S}/plate-01/candidate-lifted-1920x864.png'
NIGHT = os.path.join(ROOT, 'art/backgrounds/room-31-funeral-night.png')
CAST = f'{S}/cast/cast.json'
WALK = f'{S}/hob-01/walk.json'
SIGMA = 28          # full pixels: the moon's light, not the hill's detail

day = np.asarray(Image.open(DAY).convert('RGB')).astype(float)
night = np.asarray(Image.open(NIGHT).convert('RGB')).astype(float)
H, W = day.shape[:2]


def sky_of(img, blue_over_red):
    """Sky joined to the top edge: blue well over red (by day bright, by night deep)."""
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    candidate = (b > r + blue_over_red) & (b > g + 8)
    lab, _ = ndi.label(candidate)
    keep = np.unique(lab[0][lab[0] > 0])
    return ndi.binary_fill_holes(np.isin(lab, keep))


day_sky = sky_of(day, 40)
blur = lambda a, m: np.stack([ndi.gaussian_filter(a[..., c] * m, SIGMA) / np.maximum(ndi.gaussian_filter(m, SIGMA), 1e-3)
                              for c in range(3)], -1)
ground = ndi.binary_erosion(~day_sky, iterations=12).astype(float)
ratio = np.clip((blur(night, ground) + 4) / (blur(day, ground) + 4), 0.1, 3.0)

lit = day * ratio
lit[day_sky] = night[day_sky]
out_dir = f'{S}/night'
os.makedirs(out_dir, exist_ok=True)
Image.fromarray(np.clip(lit, 0, 255).astype(np.uint8)).save(f'{out_dir}/plate-1920x864.png')


# THE CAST TAKES A HINT OF THE MOON, NOT ALL OF IT (Tyler, 2026-11-06: "one
# artist, one game"). At the full ratio the mourners went deep blue beside a
# Thad drawn in his own colours, and every other night room draws its people in
# theirs; the line-up showed them in another universe. CAST_LIGHT is how much of
# the night's ratio a figure takes: the plate takes all of it.
CAST_LIGHT = 0.35


def relight(sheet_path, frames, foot_x, foot_y):
    """Each frame drawn bottom-centre at (foot_x, foot_y) takes CAST_LIGHT of the ratio where it stands."""
    sheet = np.asarray(Image.open(sheet_path).convert('RGBA')).astype(float)
    for fx, fy, fw, fh in frames:
        x0, y0 = int(round(foot_x - fw / 2)), int(round(foot_y - fh))
        ys, xs = np.mgrid[0:fh, 0:fw]
        wy, wx = np.clip(ys + y0, 0, H - 1), np.clip(xs + x0, 0, W - 1)
        sheet[fy:fy + fh, fx:fx + fw, :3] *= ratio[wy, wx] ** CAST_LIGHT
    Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).save(sheet_path)


cast = json.load(open(CAST))
done = []
for name, fig in cast['figures'].items():
    relight(os.path.join(ROOT, fig['sheet']), fig['frames'], fig['x'], fig['y'])
    done.append(fig['sheet'])
for name, prop in cast['props'].items():
    relight(os.path.join(ROOT, prop['sheet']), [prop['frame']], prop['x'], prop['y'])
    done.append(prop['sheet'])
walk = json.load(open(WALK))
hob = cast['figures']['hob']
relight(os.path.join(ROOT, 'art/actors/room-31-hob-walk.png'), walk['frames'], hob['x'] + 60, hob['y'])
done.append('art/actors/room-31-hob-walk.png')
with open(f'{out_dir}/night.json', 'w') as f:
    json.dump({'day': os.path.relpath(DAY, ROOT), 'night': os.path.relpath(NIGHT, ROOT), 'sigma': SIGMA,
               'skyPixels': int(day_sky.sum()), 'relit': done,
               'why': 'Tyler, 2026-11-06: no night to day and back; the funeral under operation 4\'s moon (errata 99 K).'}, f, indent=1)
    f.write('\n')
print('relit plate and', len(done), 'sheets; day sky', int(day_sky.sum()))
