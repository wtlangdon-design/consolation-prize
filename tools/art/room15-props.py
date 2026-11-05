"""Room 15's one prop: the feed bin without Grievance's blanket. No image operation.

Doc 04 LIV_A1 option 5 lends THE LIVERY BLANKET ("Bring it back before she
notices") and doc 23 says it comes back after A5. While it is out
(`T_BLANKET_BORROWED`) the bin is drawn bare and GRIEVANCE'S BLANKET is not a
subject. The blanket lies folded on the bin's lid in front of the plank panel
of the stall beside it, whose boards run straight down; so the bare bin is the
plate's own panel rows from just above the blanket, repeated down over it,
over the blanket's outline (everything in its box that is not the panel's wood, filled) -- the
method of Room 11's bare desk (tools/art/room11-props.py).

Writes art/props/room-15-bin-bare.png and renders/room-15-props.png, and prints
the prop's record (the renderer draws from x - floor(w / 2), y - h + 1).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-15-livery.png')
BLANKET = (1238, 489, 1418, 544)      # plate pixels (x0, y0, x1, y1): the folded blanket, down to the lid
PANEL = (474, 489)                    # the panel's rows just above it, below its top edge


def main():
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
    x0, y0, x1, y1 = BLANKET
    region = plate[y0:y1, x0:x1]
    # The blanket's outline: every pixel in the box that is not the panel's own
    # wood colour, closed and filled, so its pale stripes go with it.
    r, g, b = region[..., 0], region[..., 1], region[..., 2]
    wood = ((r - b) > 45) & (g > 0.5 * r) & (g < 0.85 * r)
    cloth = ndi.binary_fill_holes(ndi.binary_closing(~wood, iterations=3))
    lab, n = ndi.label(cloth)
    if n:
        sizes = ndi.sum(cloth, lab, range(1, n + 1))
        cloth = lab == 1 + int(np.argmax(sizes))
    cloth = ndi.binary_dilation(cloth, iterations=2)
    rows = plate[PANEL[0]:PANEL[1], x0:x1]
    fill = np.concatenate([rows] * (-(-(y1 - y0) // len(rows))), axis=0)[:y1 - y0]
    patch = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    patch[..., :3] = fill
    patch[..., 3] = np.where(cloth, 255, 0)
    ys, xs = np.where(cloth)
    t, bt, l, rt = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    patch = patch[t:bt, l:rt]
    Image.fromarray(patch).save(os.path.join(ROOT, 'art/props/room-15-bin-bare.png'))
    h, w = patch.shape[:2]
    record = {'sheet': 'art/props/room-15-bin-bare.png', 'x': int(x0 + l + w // 2), 'y': int(y0 + t + h - 1),
              'frame': [0, 0, int(w), int(h)]}
    shown = Image.fromarray(plate.astype(np.uint8)).convert('RGBA')
    shown.alpha_composite(Image.fromarray(patch), (int(x0 + l), int(y0 + t)))
    box = (1180, 400, 1460, 620)
    side = Image.new('RGB', (2 * (box[2] - box[0]) + 20, box[3] - box[1]))
    side.paste(Image.fromarray(plate.astype(np.uint8)).crop(box), (0, 0))
    side.paste(shown.convert('RGB').crop(box), (box[2] - box[0] + 20, 0))
    side.resize((side.width * 2, side.height * 2), Image.NEAREST).save(os.path.join(ROOT, 'renders/room-15-props.png'))
    print(json.dumps(record))


if __name__ == '__main__':
    main()
