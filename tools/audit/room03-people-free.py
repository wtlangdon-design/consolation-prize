#!/usr/bin/env python3
"""
ROOM 3 ASSET TRUTH AUDIT -- is there a people-free version of the PREFERRED plate?

Read only. No image operation, no art written, no runtime touched.

THE TEST. The preferred room is nugget-candidate.json drawing
art/staging/room-03/rebuild-05/plate-room-03-repaired.png, in which seven
patrons are PAINTED. A genuine people-free version of that same room would,
compared against it, be:

    NEAR IDENTICAL outside the seven patron boxes   (same architecture,
                                                     furniture, floor,
                                                     lighting, perspective)
    STRONGLY DIFFERENT inside them                  (the men are gone)

Provenance notes cannot answer this and are not consulted. Every 1920x864
image in the repository is compared pixel to pixel on both halves.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PREF = ROOT / 'art/staging/room-03/rebuild-05/plate-room-03-repaired.png'
ROOM = json.loads((ROOT / 'content/rooms/nugget-candidate.json').read_text())
PEOPLE = [p for p in ROOM['population']['people'] if p['kind'] in ('baked', 'voice')]


def boxes_mask():
    m = np.zeros((864, 1920), bool)
    for p in PEOPLE:
        x, y, w, h = p['box']
        m[y:y + h, x:x + w] = True
    return m


def load(p):
    im = Image.open(p)
    if im.size != (1920, 864):
        return None
    return np.asarray(im.convert('RGB')).astype(float)


def main():
    ref = load(PREF)
    inside = boxes_mask()
    outside = ~inside

    cands = sorted(set(
        list(ROOT.glob('art/**/*.png')) +
        list(ROOT.glob('proofs/**/*.png')) +
        list(ROOT.glob('renders/**/*.png'))))

    print(f'reference  {PREF.relative_to(ROOT)}')
    print(f'{len(PEOPLE)} painted patrons, {inside.sum()} px inside their boxes, '
          f'{outside.sum()} px outside\n')
    print(f'{"candidate":<62} {"OUT":>7} {"IN":>7}  reading')
    print('-' * 100)

    rows = []
    for c in cands:
        if 'raw-captures-ignored' in str(c):
            continue
        a = load(c)
        if a is None:
            continue
        d = np.abs(a - ref).mean(axis=2)
        out, ins = float(d[outside].mean()), float(d[inside].mean())
        rel = str(c.relative_to(ROOT))
        if out < 0.5 and ins < 0.5:
            note = 'IDENTICAL -- this is the preferred plate'
        elif out < 2.0 and ins > 12.0:
            note = '*** SAME ROOM, PEOPLE CHANGED OR GONE ***'
        elif out < 2.0:
            note = 'same architecture, people also unchanged'
        else:
            note = 'different room'
        rows.append((out, ins, rel, note))

    for out, ins, rel, note in sorted(rows, key=lambda r: r[0]):
        print(f'{rel:<62} {out:7.2f} {ins:7.2f}  {note}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
