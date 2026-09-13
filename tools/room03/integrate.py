#!/usr/bin/env python3
"""
THE CLEAN-SHEET ROOM 3, ASSEMBLED: shell plate + the two accepted clusters.

WHAT THIS DOES AND DOES NOT DO. It writes the SHELL PLATE at the room's own
1920 x 864 and composites the cluster layers over it at the placements
`placement.py` solved, so a person can look at the room. It does not yet write
the runtime room JSON -- the layers are still composited here rather than by
the engine.

THE CROP BAND IS A REAL DECISION. The endpoint's widest size is 3:2 and the play
area is 1920 x 864, which is 2.22:1, so 416 rows of a 1920-wide shell have to
go. Three bands were composited and looked at:

    top 160   keeps the whole chandelier and loses the piano behind the card men
    top 320   keeps the piano and cuts the chandelier off entirely
    top 240   keeps the chandelier's arms AND the piano's top above the table

Both the chandelier and the piano carry canonical LOOK lines, so 240 is the band
that keeps the room's own jokes: a chandelier over a dirt floor, and a piano
nobody is at.

AND THE MAGENTA HAS TO GO BEFORE THE RESIZE, NOT AFTER. A keyed layer still has
magenta in its RGB wherever alpha is zero; resampling it mixes that magenta into
every edge pixel, and the first composite had a violet fringe around all three
bar patrons and both near chairs. Section 29 calls that contamination and it is
right. The fix is to flood each layer's transparent RGB outward from its own
edge first, so the filter has only the layer's own colours to mix.

    python3 tools/room03/integrate.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, distance_transform_edt

ROOT = Path(__file__).resolve().parents[2]
PROOF = ROOT / 'proofs/room-03/clean-sheet'
SHELL = ROOT / 'art/staging/room-03/clean-shell-01/source.png'
PLATE = ROOT / 'art/staging/room-03/clean-shell-01/room-shell-1920x864.png'
CROP_TOP = 240
ROOM = (1920, 864)

STACK = [
    ('card', 'art/staging/room-03/clean-card-01/layers',
     ['card_2-behind', 'card_3-behind', 'furniture-table-complete',
      'card_2-front', 'card_3-front', 'card_1', 'card_4']),
    ('bar', 'art/staging/room-03/clean-bar-01/layers',
     ['bar_1-behind', 'furniture-bar-complete', 'bar_1-front', 'bar_2', 'bar_3']),
]


def defringe(img):
    """
    DROP THE OUTERMOST PIXEL OF EVERY LAYER. The masters are drawn against
    magenta and their edges are anti-aliased INTO it, so the outermost ring of
    each silhouette is already part magenta before anything is keyed or
    resized. Flooding the transparent margin fixed the resize, and a violet
    line still ran round all three bar patrons and both near chairs, because
    that line is in the art. A pixel of silhouette is a cheap price for it.
    """
    a = np.asarray(img).astype(np.uint8).copy()
    solid = a[:, :, 3] > 0
    inner = binary_erosion(solid, np.ones((3, 3)))
    a[:, :, 3] = np.where(inner, a[:, :, 3], 0)
    return Image.fromarray(a)


def debleed(img):
    """
    Push each layer's own colour out into its transparent margin, so a resize
    has nothing foreign to mix in. The alpha is untouched.
    """
    a = np.asarray(img).astype(np.uint8).copy()
    solid = a[:, :, 3] > 0
    if solid.all() or not solid.any():
        return Image.fromarray(a)
    _, idx = distance_transform_edt(~solid, return_indices=True)
    for c in range(3):
        ch = a[:, :, c]
        ch[~solid] = ch[idx[0], idx[1]][~solid]
    return Image.fromarray(a)


def shell_plate():
    shell = Image.open(SHELL).convert('RGB')
    up = shell.resize((ROOM[0], round(ROOM[0] * shell.height / shell.width)), Image.LANCZOS)
    return up.crop((0, CROP_TOP, ROOM[0], CROP_TOP + ROOM[1]))


def compose(hide=()):
    place = json.loads((PROOF / 'placement.json').read_text())
    room = shell_plate().convert('RGBA')
    for tag, src, names in STACK:
        rec = json.loads((ROOT / src / 'decompose.json').read_text())
        s = place[tag]['scale']
        ox, oy = place[tag]['offset']
        for name in names:
            if name in hide:
                continue
            spec = (rec['furnitureComplete'] if name.endswith('-complete')
                    else rec['layers'][name])
            img = debleed(defringe(Image.open(ROOT / src / f'{name}.png').convert('RGBA')))
            w = max(1, int(round(img.width * s)))
            h = max(1, int(round(img.height * s)))
            room.alpha_composite(img.resize((w, h), Image.LANCZOS),
                                 (int(round(ox + spec['cropInMaster'][0] * s)),
                                  int(round(oy + spec['cropInMaster'][1] * s))))
    return room.convert('RGB')


def main():
    plate = shell_plate()
    PLATE.parent.mkdir(parents=True, exist_ok=True)
    plate.save(PLATE)
    print(f'wrote {PLATE}  {plate.width}x{plate.height}  (crop band top {CROP_TOP})')

    room = compose()
    out = PROOF / 'room-composite.png'
    room.save(out)
    print(f'wrote {out}')

    # WHAT THE SHELL ALONE LOOKS LIKE, which is the people-free confirmation.
    plate.save(PROOF / 'room-shell-people-free.png')
    print(f'wrote {PROOF / "room-shell-people-free.png"}')


if __name__ == '__main__':
    main()
