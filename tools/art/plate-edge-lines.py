"""The grey lines along the top and bottom of six plates, painted out (errata 345). No image operation.

The Act I review's art director saw a pale grey line across the very top of the Company's lobby, the livery and
Ozymandia's tent, and along the bottom of two of them: the generation's frame, left on when the plate was cut. A scan
of every plate found the church the same, and the tent's two séance plates carry the tent's. Each edge run is replaced
by the first row of the picture inside it, so the wall or the floor simply reaches the edge.

The church is graded from a kept original (tools/art/room-grade.py), so its original is the one cleaned and the
grade is run again; the plate that ships is the result.

Run once. A plate whose edge is already the picture's is left alone.
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# plate: (rows at the top to replace, rows at the bottom to replace)
PLATES = {
    'room-10-company-lobby.png': (3, 0),
    'room-15-livery.png': (3, 3),
    'room-16-tent.png': (4, 3),
    'room-16-tent-seance.png': (4, 3),
    'room-16-tent-seance-dark.png': (4, 3),
}
# original (under reference/room-grade/originals): rows, as above. Then tools/art/room-grade.py regrades it.
GRADED = {'art__backgrounds__room-17-church.png': (3, 3)}


def lum(row):
    return float((0.299 * row[:, 0] + 0.587 * row[:, 1] + 0.114 * row[:, 2]).mean())


def main():
    todo = [(os.path.join(ROOT, 'art/backgrounds', name), rows) for name, rows in PLATES.items()]
    todo += [(os.path.join(ROOT, 'reference/room-grade/originals', name), rows) for name, rows in GRADED.items()]
    for path, (top, bottom) in todo:
        name = os.path.basename(path)
        image = Image.open(path)
        px = np.asarray(image.convert('RGB')).copy()
        h = px.shape[0]
        if lum(px[0].astype(int)) - lum(px[top].astype(int)) < 20:
            print(name, 'already clean')
            continue
        px[:top] = px[top]
        if bottom:
            px[h - bottom:] = px[h - bottom - 1]
        Image.fromarray(px, 'RGB').save(path)
        print(name, 'top', top, 'bottom', bottom)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/art/room-grade.py')], check=True)


if __name__ == '__main__':
    main()
