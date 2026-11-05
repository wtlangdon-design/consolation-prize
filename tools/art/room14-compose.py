"""Room 14's after-the-funeral grave, composed from two operations. No image operation here.

Room-14 operation 5 (own-plot-01) was asked for Thad's filled grave at the
empty plot beside Pike: a mound with new grass, a headboard, a tuning peg on
the headboard (doc 54, MY OWN PLOT). It drew the grassed mound but no
headboard, and put the peg on Pike's board. The cap was spent (5 of 5), so the
state is composed from pixels the operations already made (errata 87 F):

- the plate (operation 3, the scattered stones) as the ground;
- the new headboard from operation 4 (fresh-plot-01), where it differs from
  the plate, down to the earth at its foot;
- operation 5's grassed mound, where it differs from the plate, around it;
- operation 5's tuning peg, moved from Pike's board onto the new headboard.

Writes art/staging/room-14/own-plot-02/source.png (1536x1024, the plate's
frame) and renders/room-14-own-plot-compose.png.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-14')
THR = 60


def load(name):
    return np.asarray(Image.open(os.path.join(S, name)).convert('RGB')).astype(int)


def changed(a, b, box):
    x0, y0, x1, y1 = box
    m = np.zeros(a.shape[:2], bool)
    m[y0:y1, x0:x1] = np.abs(a - b).sum(2)[y0:y1, x0:x1] > THR
    return ndi.binary_closing(m, iterations=2) & _box(a.shape, box)


def _box(shape, box):
    x0, y0, x1, y1 = box
    m = np.zeros(shape[:2], bool)
    m[y0:y1, x0:x1] = True
    return m


def main():
    base = load('plate-02/source.png')
    fresh = load('fresh-plot-01/source.png')
    own = load('own-plot-01/source.png')
    out = base.copy()
    mound = changed(base, own, (1280, 366, 1400, 402))
    out[mound] = own[mound]
    board = changed(base, fresh, (1330, 308, 1390, 384))
    out[board] = fresh[board]
    peg = changed(base, own, (1262, 288, 1290, 305))
    ys, xs = np.where(peg)
    cols = np.where(board.any(0))[0]
    top = int(np.where(board.any(1))[0].min())
    dx = int(round(cols.mean() - xs.mean()))
    dy = top - int(ys.max()) - 1
    out[ys + dy, xs + dx] = own[ys, xs]
    os.makedirs(os.path.join(S, 'own-plot-02'), exist_ok=True)
    Image.fromarray(out.astype(np.uint8)).save(os.path.join(S, 'own-plot-02/source.png'))
    box = (1150, 260, 1500, 470)
    side = Image.new('RGB', (3 * (box[2] - box[0]) + 20, box[3] - box[1]), (255, 0, 255))
    for i, img in enumerate((base, fresh, out)):
        side.paste(Image.fromarray(img.astype(np.uint8)).crop(box), (i * (box[2] - box[0] + 10), 0))
    side = side.resize((side.width * 2, side.height * 2), Image.NEAREST)
    side.save(os.path.join(ROOT, 'renders/room-14-own-plot-compose.png'))
    print('peg moved by', dx, dy, '; board top', top)


if __name__ == '__main__':
    main()
