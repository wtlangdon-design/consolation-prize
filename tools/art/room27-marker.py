"""Room 27's eleventh claim marker, THE BLANK ONE, as a prop. No image operation.

Doc 05: "Eleven holes", "Of the eleven, this is the one I think about", "The
last marker has no name at all." The composition master drew ten markers from
a layout of eleven, and three operations asked for the eleventh and drew none
(errata 99 C). So the eleventh is cut from the plate's own tenth -- its post
and its board, nothing behind them -- the faint marks on the board cleared
row by row to the board's own wood, and stood at the far end of the path in
front of the row, the last one, set apart, a little nearer and so a little
larger. A prop is drawn in depth order: Thad passes in front of it.

Writes art/props/room-27-blank-marker.png and prints the prop's place.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/staging/room-27/plate-01/candidate-lifted-1920x864.png')
CROP_Y = 190
K = 1520 / 1920        # game pixels to master pixels is 1 / 1.263
BOARD = (1390, 424, 1469, 478)   # the tenth marker's board, master pixels
POST = (1421, 407, 1440, 570)    # and its post
NEARER = 1.15                    # nearer the camera than the row
AT = (1855, 650)                 # its foot, at the path's far end


def g(x, y):
    return round((x - 8) / K), round((y - CROP_Y) / K)


def main():
    plate = np.asarray(Image.open(PLATE).convert('RGB')).astype(int)
    bx0, by0 = g(*BOARD[:2]); bx1, by1 = g(*BOARD[2:])
    px0, py0 = g(*POST[:2]); px1, py1 = g(*POST[2:])
    x0, y0, x1, y1 = min(bx0, px0), min(by0, py0), max(bx1, px1), max(by1, py1)
    out = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    board = plate[by0:by1, bx0:bx1].copy()
    # BARE: a pixel brighter than its row's wood by more than the grain is a
    # painted mark; it takes the row's median.
    for r in range(board.shape[0]):
        row = board[r]
        lum = row @ np.array([0.299, 0.587, 0.114])
        med = np.median(lum)
        wood = np.median(row, axis=0).astype(int)
        row[lum > med + 14] = wood
    out[py0 - y0:py1 - y0, px0 - x0:px1 - x0, :3] = plate[py0:py1, px0:px1]
    out[py0 - y0:py1 - y0, px0 - x0:px1 - x0, 3] = 255
    out[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0, :3] = board
    out[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0, 3] = 255
    img = Image.fromarray(out)
    img = img.resize((round(img.width * NEARER), round(img.height * NEARER)), Image.NEAREST)
    os.makedirs(os.path.join(ROOT, 'art/props'), exist_ok=True)
    img.save(os.path.join(ROOT, 'art/props/room-27-blank-marker.png'))
    view = Image.open(os.path.join(ROOT, 'art/backgrounds/room-27-claim-row.png')).convert('RGBA')
    view.alpha_composite(img, (AT[0] - img.width // 2, AT[1] - img.height + 1))
    view.convert('RGB').save(os.path.join(ROOT, 'renders/room-27-blank-marker.png'))
    print(json.dumps({'x': AT[0], 'y': AT[1], 'frame': [0, 0, img.width, img.height]}))


if __name__ == '__main__':
    main()
