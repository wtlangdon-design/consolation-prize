"""Room 21's two states after the confession, laid over the plate. No image
operation here.

Doc 48 S4: "Hob sets two cups" (beat 1), and after the tree, "Outside, dawn is
starting" (beat 3). Room-21 operation 3 painted both into the plate; this
aligns it to operation 2 (it drifted a few pixels), takes it through the
plate's crop to 1920x864, and cuts two props:

  THE CUPS -- only the pixels that differ from the plate, on the table: from
  the night of the confession (`T_SAME_HAND`, E9) on.
  THE DAWN WINDOW -- the window's glass and frame, whole: once the confession
  is over (`T_HOB_IS_MOTT`).

Writes art/props/room-21-cups.png, art/props/room-21-dawn-window.png and
renders/room-21-props.png, and prints each prop's record (the renderer draws
from x - floor(w / 2), y - h + 1).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-21')
CROP = (18, 174, 1518, 849)            # tools/art/room21-plate.mjs
WINDOW = (606, 266, 830, 466)          # source pixels: the window and its frame
CUPS = (640, 548, 870, 592)            # source pixels: the table top
THR = 60


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(int)


def aligned(base, state):
    """The dawn state shifted onto the plate: the shift that best matches the door and stove."""
    best = None
    for dy in range(-10, 11):
        for dx in range(-10, 11):
            a = base[300:700, 40:520]
            b = state[300 + dy:700 + dy, 40 + dx:520 + dx]
            err = float(np.abs(a - b).mean())
            if best is None or err < best[0]:
                best = (err, dy, dx)
    _, dy, dx = best
    out = np.roll(np.roll(state, -dy, axis=0), -dx, axis=1)
    print(f'  dawn aligned by dy {dy}, dx {dx} (mean error {best[0]:.1f})')
    return out


def to_plate(arr):
    return np.asarray(Image.fromarray(arr.astype(np.uint8)).crop(CROP).resize((1920, 864), Image.NEAREST)).astype(int)


def scaled(box):
    s = 1920 / (CROP[2] - CROP[0])
    return [int(round((v - o) * s)) for v, o in zip(box, (CROP[0], CROP[1], CROP[0], CROP[1]))]


def write(name, rgba, x0, y0):
    os.makedirs(os.path.join(ROOT, 'art/props'), exist_ok=True)
    Image.fromarray(rgba).save(os.path.join(ROOT, f'art/props/room-21-{name}.png'))
    h, w = rgba.shape[:2]
    return {'sheet': f'art/props/room-21-{name}.png', 'x': int(x0 + w // 2), 'y': int(y0 + h - 1), 'frame': [0, 0, int(w), int(h)]}


def main():
    base = load(f'{S}/plate-01/source.png')
    dawn = aligned(base, load(f'{S}/dawn-01/source.png'))
    p, d = to_plate(base), to_plate(dawn)
    records = {}
    # THE DAWN WINDOW, whole.
    x0, y0, x1, y1 = scaled(WINDOW)
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = d[y0:y1, x0:x1]
    rgba[..., 3] = 255
    records['dawn_window'] = write('dawn-window', rgba, x0, y0)
    # THE CUPS, only what changed.
    x0, y0, x1, y1 = scaled(CUPS)
    m = np.abs(d - p).sum(2)[y0:y1, x0:x1] > THR
    m = ndi.binary_dilation(ndi.binary_opening(m, iterations=1), iterations=1)
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i in np.argsort(sizes)[::-1][:2]]
    m = np.isin(lab, keep)
    ys, xs = np.where(m)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((b - t, r - l, 4), np.uint8)
    rgba[..., :3] = d[y0 + t:y0 + b, x0 + l:x0 + r]
    rgba[..., 3] = np.where(m[t:b, l:r], 255, 0)
    records['cups'] = write('cups', rgba, x0 + l, y0 + t)
    # The render: the plate, and the plate with both.
    plate = Image.open(os.path.join(ROOT, 'art/backgrounds/room-21-watchmans-shack.png')).convert('RGBA')
    after = plate.copy()
    for rec in records.values():
        im = Image.open(os.path.join(ROOT, rec['sheet'])).convert('RGBA')
        after.alpha_composite(im, (rec['x'] - im.width // 2, rec['y'] - im.height + 1))
    strip = Image.new('RGB', (1920, 864 * 2))
    strip.paste(plate.convert('RGB'), (0, 0))
    strip.paste(after.convert('RGB'), (0, 864))
    strip.save(os.path.join(ROOT, 'renders/room-21-props.png'))
    print(json.dumps(records))


if __name__ == '__main__':
    main()
