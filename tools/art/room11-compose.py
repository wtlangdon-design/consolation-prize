"""Room 11's plate source and the dinner, from room-11 operations 2 and 4. No
image operation here.

THE PORTRAIT. Operation 2 removed the people and, with them, the colonel from
his own portrait, leaving a landscape in the gilt frame; THE PORTRAIT's lines
("Colonel Fanshawe, painted at approximately twice life size") need him.
Operation 4 restored him (reference/room-11/prompts/dinner-01.txt) and laid
the desk for dinner in the same edit. So the plate source is operation 2's
picture with operation 4's pixels inside the portrait's canvas only -- where
they differ by more than DIFF, grown by GROW -- and everything else is
operation 2's.

THE DINNER (doc 48 S1 beat 1: "the table laid absurdly well"). Operation 4's
pixels over the desk, where they differ from operation 2's, as a prop drawn
while the dinner is on (errata 84 A).

Writes art/staging/room-11/plate-01/composite-source.png (1536x1024, the
plate's source for tools/art/room11-plate.mjs) and
art/staging/room-11/dinner-01/dinner-1536.png (the dinner's pixels, transparent
elsewhere; tools/art/room11-props.py places it on the derived plate).
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-11')
PLATE = f'{S}/plate-01/source.png'
EDIT = f'{S}/dinner-01/source.png'
CANVAS = (760, 196, 965, 466)     # the portrait's canvas inside its gilt frame (1536 source pixels)
DESK = (660, 486, 1090, 680)      # the desk top and the cloth's fall over its front
DIFF = 40
GROW = 3


def changed(a, b, box):
    x0, y0, x1, y1 = box
    d = np.abs(a[y0:y1, x0:x1] - b[y0:y1, x0:x1]).sum(2)
    return ndi.binary_dilation(ndi.binary_closing(d > DIFF, iterations=2), iterations=GROW)


def main():
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
    edit = np.asarray(Image.open(EDIT).convert('RGB')).astype(int)
    out = plate.copy()
    x0, y0, x1, y1 = CANVAS
    m = changed(plate, edit, CANVAS)
    out[y0:y1, x0:x1][m] = edit[y0:y1, x0:x1][m]
    Image.fromarray(out.astype(np.uint8)).save(f'{S}/plate-01/composite-source.png')
    x0, y0, x1, y1 = DESK
    m = changed(plate, edit, DESK)
    rgba = np.zeros((1024, 1536, 4), np.uint8)
    rgba[y0:y1, x0:x1, :3] = edit[y0:y1, x0:x1]
    rgba[y0:y1, x0:x1, 3] = np.where(m, 255, 0)
    Image.fromarray(rgba).save(f'{S}/dinner-01/dinner-1536.png')
    print('portrait pixels', int(changed(plate, edit, CANVAS).sum()), 'dinner pixels', int(m.sum()))


if __name__ == '__main__':
    main()
