#!/usr/bin/env python3
"""
THE THREE BAR GATES, the same three the card cluster had to pass.

  1  STATIC RECOMPOSITION against the accepted master.
  2  ACTOR-OFF, each patron hidden in turn.
  3  SMALL MOTION, each nudged inside the occupational envelope.

    python3 tools/room03/bar-proofs.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-bar-01/source.png'
LAYERS = ROOT / 'art/staging/room-03/clean-bar-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'
MAGENTA = (255, 0, 255)

# THE SEATED MAN IS BEHIND THE COUNTER AND HIS FOREARMS ARE ON IT, so he splits
# either side of the furniture. The other two stand in front of the bar
# entirely and need no split.
ORDER = ['bar_1-behind', 'furniture-bar-complete', 'bar_1-front', 'bar_2', 'bar_3']
ACTORS = {'bar_1': ['bar_1-behind', 'bar_1-front'], 'bar_2': ['bar_2'], 'bar_3': ['bar_3']}
NUDGE = {'bar_1-behind': (-3, -3), 'bar_1-front': (-3, -3), 'bar_2': (4, -4), 'bar_3': (-5, -5)}


def rec():
    return json.loads((LAYERS / 'decompose.json').read_text())


def layer(name):
    r = rec()
    spec = r['furnitureComplete'] if name == 'furniture-bar-complete' else r['layers'][name]
    return Image.open(LAYERS / f'{name}.png').convert('RGBA'), spec['cropInMaster']


def compose(skip=(), nudge=None):
    canvas = Image.new('RGBA', (1024, 1024), (*MAGENTA, 255))
    for name in ORDER:
        if name in skip:
            continue
        img, crop = layer(name)
        dx, dy = nudge.get(name, (0, 0)) if nudge else (0, 0)
        canvas.alpha_composite(img, (crop[0] + dx, crop[1] + dy))
    return canvas.convert('RGB')


def band(img, title, scale=1):
    if scale != 1:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.NEAREST)
    out = Image.new('RGB', (img.width, img.height + 24), (18, 18, 20))
    out.paste(img, (0, 24))
    ImageDraw.Draw(out).text((6, 7), title, fill=(236, 230, 214))
    return out


def main() -> int:
    master = Image.open(SRC).convert('RGB')
    m = np.asarray(master).astype(int)
    key = (m[:, :, 0] > 180) & (m[:, :, 2] > 180) & (m[:, :, 1] < 90)
    cluster = ~key
    ok = True

    rebuilt = compose()
    diff = np.abs(m - np.asarray(rebuilt).astype(int)).max(axis=2)
    inside = int((diff * cluster > 0).sum())
    print('1 · STATIC RECOMPOSITION -- completed bar + three patrons vs the master')
    print(f'    differing pixels inside the cluster  {inside}   (must be 0)')
    ok &= inside == 0

    tab, tcrop = layer('furniture-bar-complete')
    surface = np.zeros(cluster.shape, bool)
    surface[tcrop[1]:tcrop[3], tcrop[0]:tcrop[2]] = np.asarray(tab)[:, :, 3] > 0

    print('\n2 · ACTOR-OFF -- each patron hidden, what the bar underneath looks like')
    panels = [band(master.resize((640, 640)), 'THE MASTER, all three present')]
    for who, parts in ACTORS.items():
        off = compose(skip=parts)
        a = np.asarray(off).astype(int)
        hole = ((a[:, :, 0] > 180) & (a[:, :, 2] > 180) & (a[:, :, 1] < 90)) & cluster
        on_bar = int((hole & surface).sum())
        print(f'    {who}: {int(hole.sum()):6d} px of field revealed, '
              f'{on_bar} of them on the bar   (must be 0)')
        ok &= on_bar == 0
        crops = [rec()['layers'][n]['cropInMaster'] for n in parts]
        r = (max(0, min(c[0] for c in crops) - 50), max(0, min(c[1] for c in crops) - 50),
             min(1024, max(c[2] for c in crops) + 50), min(1024, max(c[3] for c in crops) + 50))
        panels.append(band(off.crop(r), f'{who} HIDDEN -- the bar behind him must be whole'))

    print('\n3 · SMALL MOTION -- each patron nudged inside the occupational envelope')
    moved = compose(nudge=NUDGE)
    a = np.asarray(moved).astype(int)
    revealed = ((a[:, :, 0] > 180) & (a[:, :, 2] > 180) & (a[:, :, 1] < 90)) & cluster
    on_bar = int((revealed & surface).sum())
    print(f'    nudges {NUDGE}')
    print(f'    field showing through {int(revealed.sum())} px, {on_bar} of them on the bar   (must be 0)')
    ok &= on_bar == 0
    panels.append(band(moved.resize((640, 640)), 'ALL THREE NUDGED -- no hole opens on the bar'))

    PROOF.mkdir(parents=True, exist_ok=True)
    width = max(p.width for p in panels)
    sheet = Image.new('RGB', (width, sum(p.height + 8 for p in panels)), (18, 18, 20))
    y = 0
    for p in panels:
        sheet.paste(p, (0, y))
        y += p.height + 8
    path = PROOF / 'bar-phase2b-readiness.webp'
    sheet.save(path, 'WEBP', quality=90, method=6)
    print(f'\n    wrote {path}')
    print('\n' + ('BAR PHASE 2A ARCHITECTURE PASS' if ok else 'BAR PHASE 2A ARCHITECTURE FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
