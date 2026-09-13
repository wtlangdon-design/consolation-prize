#!/usr/bin/env python3
"""
THE THREE CARD GATES TYLER'S RULING MAKES MANDATORY.

  1  STATIC RECOMPOSITION -- completed furniture + four actors, composited in
     runtime order, against the accepted master.
  2  ACTOR-OFF -- each player hidden in turn, to prove the layer underneath is
     structurally complete: no player-shaped hole, no arm-shaped missing table,
     no halo, no duplicate held cards.
  3  SMALL MOTION -- each actor nudged inside the occupational envelope, to
     prove that animating him later will not require unbaking anything.

WHY RECOMPOSITION USES THE ORIGINAL FURNITURE AND THE PROOFS USE THE COMPLETED
ONE. The completed table has wood painted in where the arms were; compositing
it under the actors reproduces the master exactly anyway, because the actors
cover every filled pixel. Using the raw layer for gate 1 and the completed layer
for gates 2 and 3 would let a fill error hide behind an actor in the one test
that is exact. So gate 1 runs on the COMPLETED table too, and a difference means
the fill leaked outside the silhouette it was given.

    python3 tools/room03/card-proofs.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-card-01/source.png'
LAYERS = ROOT / 'art/staging/room-03/clean-card-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'
MAGENTA = (255, 0, 255)

# runtime order, back to front
ORDER = ['card_2-behind', 'card_3-behind', 'furniture-table-complete',
         'card_2-front', 'card_3-front', 'card_1', 'card_4']
ACTORS = {'card_1': ['card_1'], 'card_2': ['card_2-behind', 'card_2-front'],
          'card_3': ['card_3-behind', 'card_3-front'], 'card_4': ['card_4']}
# the occupational envelope, per actor: a few pixels, never a walk
NUDGE = {'card_1': (5, -4), 'card_2-behind': (-4, -3), 'card_2-front': (-4, -3),
         'card_3-behind': (4, -3), 'card_3-front': (4, -3), 'card_4': (-5, -4)}


def rec():
    return json.loads((LAYERS / 'decompose.json').read_text())


def layer(name):
    r = rec()
    spec = r['furnitureComplete'] if name == 'furniture-table-complete' else r['layers'][name]
    return Image.open(LAYERS / f'{name}.png').convert('RGBA'), spec['cropInMaster']


def compose(skip=(), nudge=None, size=(1536, 1024)):
    canvas = Image.new('RGBA', size, (*MAGENTA, 255))
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
    print('1 · STATIC RECOMPOSITION -- completed furniture + four actors vs the master')
    print(f'    differing pixels inside the cluster  {inside}   (must be 0)')
    print(f'    max difference                       {int((diff * cluster).max())}')
    ok &= inside == 0

    print('\n2 · ACTOR-OFF -- each player hidden, what the layer underneath looks like')
    panels = [band(master.resize((768, 512)), 'THE MASTER, all four present')]
    for who, parts in ACTORS.items():
        off = compose(skip=parts)
        a = np.asarray(off).astype(int)
        gone = (np.asarray(rebuilt).astype(int) != a).any(axis=2)
        hole = gone & (
            (a[:, :, 0] > 180) & (a[:, :, 2] > 180) & (a[:, :, 1] < 90))
        crops = [rec()['layers'][n]['cropInMaster'] for n in parts]
        r = (min(c[0] for c in crops), min(c[1] for c in crops),
             max(c[2] for c in crops), max(c[3] for c in crops))
        tab, tcrop = layer('furniture-table-complete')
        surface = np.zeros(cluster.shape, bool)
        surface[tcrop[1]:tcrop[3], tcrop[0]:tcrop[2]] = np.asarray(tab)[:, :, 3] > 0
        in_table = int((hole & surface).sum())
        print(f'    {who}: {int(gone.sum()):7d} px revealed, '
              f'{int(hole.sum()):6d} fall on empty field, '
              f'{in_table} of those inside the tabletop   (must be 0)')
        ok &= in_table == 0
        panels.append(band(off.crop((max(0, r[0] - 60), max(0, r[1] - 60),
                                     min(1536, r[2] + 60), min(1024, r[3] + 60))),
                           f'{who} HIDDEN -- nothing behind him may be a hole in the table'))

    print('\n3 · SMALL MOTION -- each actor nudged inside the occupational envelope')
    moved = compose(nudge=NUDGE)
    a = np.asarray(moved).astype(int)
    revealed = ((a[:, :, 0] > 180) & (a[:, :, 2] > 180) & (a[:, :, 1] < 90)) & cluster
    tab, tcrop = layer('furniture-table-complete')
    surface = np.zeros(cluster.shape, bool)
    surface[tcrop[1]:tcrop[3], tcrop[0]:tcrop[2]] = np.asarray(tab)[:, :, 3] > 0
    on_table = int((revealed & surface).sum())
    print(f'    nudges {NUDGE}')
    print(f'    field showing through inside the cluster {int(revealed.sum())} px, '
          f'{on_table} of them on the tabletop   (must be 0)')
    ok &= on_table == 0
    panels.append(band(moved.resize((768, 512)), 'ALL FOUR NUDGED -- no hole opens on the table'))

    PROOF.mkdir(parents=True, exist_ok=True)
    width = max(p.width for p in panels)
    sheet = Image.new('RGB', (width, sum(p.height + 8 for p in panels)), (18, 18, 20))
    y = 0
    for p in panels:
        sheet.paste(p, (0, y))
        y += p.height + 8
    path = PROOF / 'card-phase2b-readiness.webp'
    sheet.save(path, 'WEBP', quality=90, method=6)
    print(f'\n    wrote {path}')
    print('\n' + ('CARD PHASE 2A ARCHITECTURE PASS' if ok else 'CARD PHASE 2A ARCHITECTURE FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
