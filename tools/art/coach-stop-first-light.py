"""The coach stop at the same first light as the street he has just left (errata 265; Tyler, 2026-11-10: "Fix the dawn").

Errata 263 relit Main Street at dawn to the very first light (mean light 63.9). The coach stop, the next screen and the
last in the game, was still the bright later morning the street used to be: a hour's jump in one doorway. This brings
it down to follow the street: a little lighter than the street, because he has walked to the edge of town and the
light has come on, but the same dawn. One function of a pixel, from the untouched original kept beside this tool's
record (reference/coach-stop-dawn/original.png): its lightness scaled so the plate's mean is TARGET, its colour
scaled by CHROMA about its own grey, and its shadows leaned a little to the street's cold. Nothing is redrawn and no
image operation is spent.

    python3 tools/art/coach-stop-first-light.py            write
    python3 tools/art/coach-stop-first-light.py --check    exit 1 if the shipped plate is not what this writes
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-36-coach-stop-dawn.png')
ORIGINAL = os.path.join(ROOT, 'reference/coach-stop-dawn/original.png')
STREET = os.path.join(ROOT, 'art/backgrounds/room-36-main-street-dawn.png')
TARGET = 74.0     # the street is 63.9; the coach stop a little on from it
CHROMA = 0.78
COLD = np.array([0.93, 0.97, 1.06])   # where the shadows lean, as the street's do
LUMA = np.array([0.2126, 0.7152, 0.0722])


def light(path):
    return float(np.asarray(Image.open(path).convert('RGB')).astype(float).mean())


def relit():
    a = np.asarray(Image.open(ORIGINAL).convert('RGB')).astype(float)
    k = TARGET / a.mean()
    for _ in range(4):   # the clip at white moves the mean a hair; settle it
        out = a * k
        grey = (out @ LUMA)[..., None]
        out = grey + (out - grey) * CHROMA
        lean = np.clip(1 - grey / 140, 0, 1) * 0.5
        out = out * (1 - lean) + out * COLD * lean
        out = np.clip(out, 0, 255)
        k *= TARGET / out.mean()
    return Image.fromarray(np.round(out).astype('uint8'), 'RGB')


if not os.path.exists(ORIGINAL):
    if '--check' in sys.argv:
        sys.exit('reference/coach-stop-dawn/original.png is missing: the plate has no original to be relit from')
    os.makedirs(os.path.dirname(ORIGINAL), exist_ok=True)
    shutil.copyfile(PLATE, ORIGINAL)
want = relit()
if '--check' in sys.argv:
    same = Image.open(PLATE).convert('RGB').tobytes() == want.tobytes()
    print('the coach stop is its original at first light' if same else 'stale: art/backgrounds/room-36-coach-stop-dawn.png')
    sys.exit(0 if same else 1)
want.save(PLATE)
print(f'coach stop: {light(ORIGINAL):.1f} -> {light(PLATE):.1f}; the street at dawn is {light(STREET):.1f}')
