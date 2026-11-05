"""Room 14's two grave states, laid over the plate. No image operation here.

PIKE'S NEIGHBOR, dug (doc 05: "A grave, open, waiting, with my name on the
marker"): room-14 operation 4's pixels at the empty plot beside Pike, where
they differ from the plate (operation 3), taken through the plate's crop to
1920x864 and cut to their own box.

MY OWN PLOT (doc 05 Part Two-B, after the funeral): the composed state
(tools/art/room14-compose.py), cut the same way.

Writes art/props/room-14-fresh-plot.png, art/props/room-14-own-plot.png and
renders/room-14-props.png, and prints each prop's record (the renderer draws
from x - floor(w / 2), y - h + 1).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-14')
CROP = (8, 170, 1528, 854)
PLOT = (1200, 270, 1500, 460)   # source pixels around the plot: nothing outside it ships
THR = 60


def to_plate(path):
    return np.asarray(Image.open(path).convert('RGB').crop(CROP).resize((1920, 864), Image.NEAREST)).astype(int)


def cut(base, state, name):
    s = 1920 / (CROP[2] - CROP[0])
    x0, y0, x1, y1 = [int(round((v - o) * s)) for v, o in zip(PLOT, (CROP[0], CROP[1], CROP[0], CROP[1]))]
    m = np.zeros(base.shape[:2], bool)
    m[y0:y1, x0:x1] = np.abs(state - base).sum(2)[y0:y1, x0:x1] > THR
    m = ndi.binary_dilation(ndi.binary_closing(m, iterations=2), iterations=1)
    m[:y0], m[y1:], m[:, :x0], m[:, x1:] = False, False, False, False
    ys, xs = np.where(m)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
    rgba[..., :3] = state[by0:by1, bx0:bx1]
    rgba[..., 3] = np.where(m[by0:by1, bx0:bx1], 255, 0)
    Image.fromarray(rgba).save(os.path.join(ROOT, f'art/props/{name}'))
    h, w = rgba.shape[:2]
    return rgba, (int(bx0), int(by0)), {'sheet': f'art/props/{name}', 'x': int(bx0) + w // 2, 'y': int(by0) + h - 1,
                                        'frame': [0, 0, int(w), int(h)]}


def main():
    plate = os.path.join(ROOT, 'art/backgrounds/room-14-boot-hill.png')
    base = np.asarray(Image.open(plate).convert('RGB')).astype(int)
    out, shown = {}, []
    for key, src, name in (('fresh_plot', 'fresh-plot-01/source.png', 'room-14-fresh-plot.png'),
                           ('own_plot', 'own-plot-02/source.png', 'room-14-own-plot.png')):
        rgba, at, rec = cut(base, to_plate(os.path.join(S, src)), name)
        out[key] = rec
        img = Image.fromarray(base.astype(np.uint8)).convert('RGBA')
        img.alpha_composite(Image.fromarray(rgba), at)
        shown.append(img.convert('RGB'))
    box = (1400, 120, 1920, 480)
    w = box[2] - box[0]
    side = Image.new('RGB', (3 * w + 40, box[3] - box[1]))
    for i, img in enumerate([Image.fromarray(base.astype(np.uint8))] + shown):
        side.paste(img.crop(box), (i * (w + 20), 0))
    side.save(os.path.join(ROOT, 'renders/room-14-props.png'))
    print(json.dumps(out))


if __name__ == '__main__':
    main()
