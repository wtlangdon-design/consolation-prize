#!/usr/bin/env python3
"""
SUPERSEDED BY tools/room03/card-proofs.py. DO NOT DELETE THIS FILE.

This gate was written against the four-layer card decomposition, one layer per
man. The far pair then had to be split behind/front -- the completed tabletop
was painting over their hands -- so the layer names it asks for (`card_2`,
`card_3`) no longer exist and it dies on a KeyError. `card-proofs.py` runs all
three gates against the seven-layer order that shipped.

It stays here, refusing by name, because a gate that is quietly deleted is a
gate the next person does not know was ever run. Same reason the render
refusals exist.

THE STATIC RECOMPOSITION GATE FOR THE CARD CLUSTER.

Tyler's clean-sheet reset, sec.9, and it is the gate that exists to stop the
previous disaster repeating: build the runtime layers, composite them OFFLINE
in runtime order, and require the result to reproduce the accepted master. A
decomposition that produces floating feet, shifted chairs, halos or wrong
occlusion fails HERE, while the cluster is still isolated and cheap to fix, and
does not enter the room.

WHAT THIS GATE CAN AND CANNOT PROVE, stated plainly because a gate that
oversells itself is worse than none. The layers are a PARTITION of the cluster,
so compositing them in any order rebuilds the master pixel for pixel, and a
zero here is expected rather than impressive. What it actually catches is the
class of mistake that partitions wrongly: a pixel assigned to two layers, a
pixel assigned to none, a crop written back at the wrong offset, an alpha that
is not binary, a layer written from a stale master. All five have happened to
this project.

WHAT PROVES THE DECOMPOSITION IS RIGHT is the second half: each actor is lifted
OFF the master and shown alone on the furniture, which is the picture that
shows whether a man took a piece of the table with him or left a piece of
himself behind.

    python3 tools/room03/card-gate.py
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-card-01/source.png'
LAYERS = ROOT / 'art/staging/room-03/clean-card-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'

# RUNTIME ORDER, back to front: the far men, then the table over their waists,
# then the near men, whose own chair backs come with them.
ORDER = ['card_2', 'card_3', 'furniture-table', 'card_1', 'card_4']
MAGENTA = (255, 0, 255)


def load(name):
    rec = json.loads((LAYERS / 'decompose.json').read_text())['layers'][name]
    return Image.open(LAYERS / f'{name}.png').convert('RGBA'), rec['cropInMaster']


def main() -> int:
    master = Image.open(SRC).convert('RGB')
    canvas = Image.new('RGBA', master.size, (*MAGENTA, 255))
    counts = np.zeros((master.size[1], master.size[0]), int)

    for name in ORDER:
        img, crop = load(name)
        canvas.alpha_composite(img, (crop[0], crop[1]))
        a = np.zeros(counts.shape, bool)
        a[crop[1]:crop[3], crop[0]:crop[2]] = np.asarray(img)[:, :, 3] > 0
        counts += a

    rebuilt = canvas.convert('RGB')
    m = np.asarray(master).astype(int)
    r = np.asarray(rebuilt).astype(int)
    diff = np.abs(m - r).max(axis=2)

    key = (m[:, :, 0] > 180) & (m[:, :, 2] > 180) & (m[:, :, 1] < 90)
    cluster = ~key
    ok = True
    # ONLY THE CLUSTER IS COMPARED, and the first run of this gate is why the
    # rule is written down: it filled the canvas with exact (255, 0, 255) and
    # reported 909,619 differing pixels against a MASTER WHOSE MAGENTA IS NOT
    # EXACTLY THAT. A generated field varies by a level or two, the key tolerates
    # it, and the gate was measuring the one part of the image that is thrown
    # away. Inside the cluster the same run differed nowhere.
    inside = diff * cluster
    print('STATIC RECOMPOSITION -- layers composited in runtime order vs the master\n')
    print(f'  differing pixels        {int((inside > 0).sum())}   (must be 0)')
    print(f'  max difference          {int(inside.max())}')
    print(f'  field pixels differing  {int(((diff > 0) & key).sum())}   '
          f'(ignored: the magenta is keyed out, not shipped)')
    print(f'  cluster pixels          {int(cluster.sum())}')
    print(f'  covered exactly once    {int((counts == 1).sum())}')
    print(f'  covered by two layers   {int((counts > 1).sum())}   (must be 0)')
    print(f'  cluster covered by none {int((cluster & (counts == 0)).sum())}   (must be 0)')
    ok &= int((inside > 0).sum()) == 0
    ok &= int((counts > 1).sum()) == 0
    ok &= int((cluster & (counts == 0)).sum()) == 0

    print(f'\n  master   sha256 {hashlib.sha256(SRC.read_bytes()).hexdigest()}')
    print(f'  rebuilt  sha256 {hashlib.sha256(rebuilt.tobytes()).hexdigest()[:64]} (raw RGB)')

    # THE PICTURE THAT SHOWS WHETHER A MAN TOOK THE TABLE WITH HIM
    PROOF.mkdir(parents=True, exist_ok=True)
    lifted = Image.new('RGB', (master.size[0], master.size[1] * 2 + 30), (18, 18, 20))
    lifted.paste(master, (0, 0))
    only_furniture = Image.new('RGBA', master.size, (*MAGENTA, 255))
    img, crop = load('furniture-table')
    only_furniture.alpha_composite(img, (crop[0], crop[1]))
    lifted.paste(only_furniture.convert('RGB'), (0, master.size[1] + 30))
    d = ImageDraw.Draw(lifted)
    d.text((8, master.size[1] + 8),
           'THE FURNITURE ALONE -- everything below is what stays when all four men are lifted off',
           fill=(232, 226, 210))
    path = PROOF / 'card-recomposition-gate.webp'
    lifted.save(path, 'WEBP', quality=90, method=6)
    print(f'\n  wrote {path}')
    print('\n' + ('CARD RECOMPOSITION GATE PASS' if ok else 'CARD RECOMPOSITION GATE FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(
        'card-gate.py is SUPERSEDED by tools/room03/card-proofs.py -- it asks '
        'for the pre-split layer names card_2 / card_3, which the behind/front '
        'split replaced. Run: python3 tools/room03/card-proofs.py')
