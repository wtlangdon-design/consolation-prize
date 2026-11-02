"""Room 11's two props, laid over the plate. No image operation here.

THE DINNER (doc 48 S1 beat 1: "the table laid absurdly well"). Operation 4's
pixels over the desk where they differ from operation 2's
(tools/art/room11-compose.py wrote them at 1536), taken through the plate's
crop to 1920x864 and cut to their own box. Drawn while the dinner is on.

THE HANDKERCHIEF, GONE (doc 57 A10: after the dinner, "Room 11's own
handkerchief hotspot is not drawn from now on"). The handkerchief is a small
white fold on the desk's green leather; the plate's own leather from the same
rows, SHIFT pixels to its right, is laid over it wherever the two differ by
more than MASK (the linen and its dark outline), so the desk is bare. Drawn once `T_DINED` is set.

Writes art/props/room-11-dinner.png, art/props/room-11-desk-bare.png and
renders/room-11-props.png, and prints each prop's record (the renderer draws
from x - floor(w / 2), y - h + 1).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-11-fanshawe-office.png')
DINNER = os.path.join(ROOT, 'art/staging/room-11/dinner-01/dinner-1536.png')
CROP = (8, 170, 1528, 854)
HANDKERCHIEF = (888, 490, 990, 534)   # plate pixels (x0, y0, x1, y1)
SHIFT = 100
MASK = 60                             # summed difference from the leather beside it: the linen and its outline


def record(name, rgba, x0, y0):
    h, w = rgba.shape[:2]
    Image.fromarray(rgba).save(os.path.join(ROOT, f'art/props/{name}'))
    return {'sheet': f'art/props/{name}', 'x': x0 + w // 2, 'y': y0 + h - 1, 'frame': [0, 0, w, h]}


def main():
    plate = np.asarray(Image.open(PLATE).convert('RGBA')).copy()
    out = {}
    d = Image.open(DINNER).convert('RGBA').crop(CROP).resize((1920, 864), Image.NEAREST)
    a = np.asarray(d).copy()
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    ys, xs = np.where(a[..., 3] > 0)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out['dinner'] = record('room-11-dinner.png', a[y0:y1, x0:x1], int(x0), int(y0))
    hx0, hy0, hx1, hy1 = HANDKERCHIEF
    region = plate[hy0:hy1, hx0:hx1, :3].astype(int)
    beside = plate[hy0:hy1, hx0 + SHIFT:hx1 + SHIFT, :3].astype(int)
    pale = ndi.binary_dilation(ndi.binary_closing(np.abs(region - beside).sum(2) > MASK, iterations=2), iterations=2)
    patch = np.zeros((hy1 - hy0, hx1 - hx0, 4), np.uint8)
    patch[..., :3] = plate[hy0:hy1, hx0 + SHIFT:hx1 + SHIFT, :3]
    patch[..., 3] = np.where(pale, 255, 0)
    out['bare'] = record('room-11-desk-bare.png', patch, hx0, hy0)
    shown = Image.fromarray(plate)
    shown.alpha_composite(Image.fromarray(patch), (hx0, hy0))
    dinner = Image.fromarray(plate)
    dinner.alpha_composite(Image.fromarray(a))
    box = (820, 380, 1400, 740)
    side = Image.new('RGB', (3 * (box[2] - box[0]) + 40, box[3] - box[1]))
    side.paste(Image.fromarray(plate).crop(box).convert('RGB'), (0, 0))
    side.paste(shown.crop(box).convert('RGB'), (box[2] - box[0] + 20, 0))
    side.paste(dinner.crop(box).convert('RGB'), (2 * (box[2] - box[0]) + 40, 0))
    side.save(os.path.join(ROOT, 'renders/room-11-props.png'))
    print(json.dumps(out))


if __name__ == '__main__':
    main()
