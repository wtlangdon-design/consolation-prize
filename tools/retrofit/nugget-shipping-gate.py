#!/usr/bin/env python3
"""
WHAT THE ROOM 3 SHIPPING REPAIR WAS NOT ALLOWED TO TOUCH, ASSERTED.

Tyler's rejection authorised exactly two repairs and nothing else. Prose
saying so is worth nothing, so this compares the repaired plate against the
rejected one pixel for pixel and fails loudly on any change outside the two
regions -- and on any change at all inside each protected box.

THE FOREGROUND MAN IS CHECKED AS A HASH OF HIS OWN PIXELS, not of his
bounding box: the halo repair changes the box he sits in, so a box hash would
be guaranteed to differ and would prove nothing about him. The mask is the one
`nugget-shipping-repair.py` keeps him by, so this is the same silhouette the
repair used, read back independently.

    python3 tools/retrofit/nugget-shipping-gate.py
"""
import hashlib
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def load_repair():
    """The repair tool, imported despite its hyphens, so the mask this gate
    checks him by is literally the one the repair kept him by."""
    path = Path(__file__).resolve().parent / 'nugget-shipping-repair.py'
    spec = importlib.util.spec_from_file_location('nugget_shipping_repair', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

ROOT = Path(__file__).resolve().parents[2]
OLD = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
NEW = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'

# The two regions the rejection authorises, as generous rectangles. Every
# changed pixel must fall inside one of them.
ALLOWED = {
    'A  stove-side bar end': (1150, 360, 1200, 570),
    'B  foreground bar man': (1610, 280, 1820, 805),
}

# boxes read from content/rooms/nugget-candidate.json and the build contract
PROTECTED = {
    'card_1': (745, 305, 880, 520),
    'card_2  THE CARD SHARP': (800, 250, 910, 430),
    'card_3': (940, 255, 1055, 430),
    'card_4': (995, 300, 1150, 545),
    'the abandoned hand': (858, 386, 898, 412),
    "Deke's empty fifth place": (875, 470, 975, 530),
    'bar_1  THE ONE-STRIKE MAN': (1195, 262, 1350, 605),
    'bar_2': (1330, 255, 1500, 665),
    'the stove man': (1108, 269, 1177, 438),
    'the landing man': (1275, 67, 1336, 235),
    'the piano': (505, 255, 705, 520),
    'the spittoon': (1400, 765, 1490, 860),
    'the bar, right of the repair': (1200, 300, 1600, 835),
}


def main() -> int:
    a = np.asarray(Image.open(OLD).convert('RGB')).astype(int)
    b = np.asarray(Image.open(NEW).convert('RGB')).astype(int)
    if a.shape != b.shape:
        print(f'FAIL  canvas changed {a.shape} -> {b.shape}')
        return 1
    changed = np.abs(a - b).max(axis=2) > 0

    ok = True
    allowed = np.zeros(changed.shape, bool)
    for name, (x0, y0, x1, y1) in ALLOWED.items():
        allowed[y0:y1, x0:x1] = True
        n = int(changed[y0:y1, x0:x1].sum())
        print(f'  region {name}: {n} px changed inside x {x0}-{x1} y {y0}-{y1}')
    stray = int((changed & ~allowed).sum())
    print(f'\nCHANGED OUTSIDE THE TWO AUTHORISED REGIONS: {stray}')
    if stray:
        ys, xs = np.nonzero(changed & ~allowed)
        print(f'  FAIL  bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}')
        ok = False

    print('\nPROTECTED BOXES -- every one of these must be 0')
    for name, (x0, y0, x1, y1) in PROTECTED.items():
        sub = changed[y0:y1, x0:x1].copy()
        # the foreground man's own repair legitimately falls inside the bar box
        if name.startswith('the bar'):
            sub[:, max(0, 1610 - x0):] = False
        n = int(sub.sum())
        print(f'  {"PASS" if n == 0 else "FAIL"}  {name:28s} {n} px')
        ok &= n == 0

    # HIS OWN PIXELS, hashed. Built the same way the repair builds its KEEP
    # mask, from the same traced silhouette, and read back from both plates.
    rep = load_repair()
    emp = np.asarray(Image.open(rep.EMPTY).convert('RGB')).astype(int)
    keep = rep.man_mask(a.shape[:2]) & (np.abs(a - emp).max(axis=2) > 0)
    ha = hashlib.sha256(a[keep].tobytes()).hexdigest()
    hb = hashlib.sha256(b[keep].tobytes()).hexdigest()
    print(f'\nTHE FOREGROUND BAR MAN -- {int(keep.sum())} human pixels, hashed')
    print(f'  before {ha}')
    print(f'  after  {hb}')
    print(f'  {"PASS  byte-identical" if ha == hb else "FAIL  HE MOVED"}')
    ok &= ha == hb

    print('\n' + ('GATE PASS' if ok else 'GATE FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
