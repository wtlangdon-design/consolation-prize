"""The grey bands left on four more plates, painted out (errata 353). No image operation.

The Acts II to IV review's art directors found the generation's frame still on the Clarion (bottom), Mott's site
(bottom), Thad's room in Act IV (bottom) and the Company's vault (top and left). They are wider than errata 345's
lines, six to nine rows, which is why that errata's test looked five rows in and saw band on both sides. Each run is
replaced by the first row or column of the picture inside it.

The Clarion and Thad's room are graded from kept originals (tools/art/room-grade.py): the original is cleaned and the
grade run again. Run once; a plate whose edge is already the picture's is left alone.
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# plate: rows at the top, rows at the bottom, columns at the left
PLATES = {
    'art/backgrounds/room-30-motts-site.png': (0, 9, 0),
    'art/backgrounds/room-35-company-vault.png': (9, 0, 3),
    'reference/room-grade/originals/art__backgrounds__room-09-clarion.png': (0, 7, 0),
    'reference/room-grade/originals/art__backgrounds__room-19-thads-room-act4.png': (2, 3, 0),
}


def lum(line):
    line = line.astype(float)
    return float((0.299 * line[:, 0] + 0.587 * line[:, 1] + 0.114 * line[:, 2]).mean())


def main():
    for relative, (top, bottom, left) in PLATES.items():
        path = os.path.join(ROOT, relative)
        px = np.asarray(Image.open(path).convert('RGB')).copy()
        h = px.shape[0]
        dirty = (top and abs(lum(px[0]) - lum(px[top])) > 15) or (bottom and abs(lum(px[h - 1]) - lum(px[h - bottom - 1])) > 15) \
            or (left and abs(lum(px[:, 0]) - lum(px[:, left])) > 15)
        if not dirty:
            print(relative, 'already clean')
            continue
        if top:
            px[:top] = px[top]
        if bottom:
            px[h - bottom:] = px[h - bottom - 1]
        if left:
            px[:, :left] = px[:, left:left + 1]
        Image.fromarray(px, 'RGB').save(path)
        print(relative, 'top', top, 'bottom', bottom, 'left', left)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/art/room-grade.py')], check=True)


if __name__ == '__main__':
    main()
