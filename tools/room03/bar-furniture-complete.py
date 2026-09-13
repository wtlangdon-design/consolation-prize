#!/usr/bin/env python3
"""
THE BAR, COMPLETED UNDER WHERE THE THREE MEN STAND.

Same rule as the card table and for the same reason: Tyler's actor-off gate
asks for no player-shaped hole, so every pixel of bar structure a man covers
has to exist underneath him. No image generation, no old Room 3 pixels.

WHY THIS ONE CANNOT USE A MIRROR. The card table is a circle and very nearly
symmetric about its own centre line, so one arm's hole was covered by the other
side's clear wood. A bar is a RUN: it has a near end, a far end, and a panelled
face whose pitch shortens with depth. There is nothing to mirror it onto.

WHAT IT USES INSTEAD IS THE RUN ITSELF. The counter's face repeats along its
length, so a hole takes the nearest bare structure -- which along a bar is
almost always the same member at nearly the same depth, a panel beside a panel
-- and then has the high-frequency grain of a clean stretch of counter added
back at its own amplitude. Bare means bare: bottles, lamps, the mirror and the
tin cups are unique objects and are excluded as sources, the way the card
table's mug had to be after it was copied across the table.

    python3 tools/room03/bar-furniture-complete.py [--preview]
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import (binary_dilation, binary_opening, distance_transform_edt,
                           uniform_filter)

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/staging/room-03/clean-bar-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'

# THE BAR'S OWN SILHOUETTE, traced at 1:1 off the master: counter top edge from
# the far end, up the back bar's left stile, along its top, down the right, and
# back along the counter's plinth and the brass rail.
SILHOUETTE = [(18, 350), (60, 340), (378, 402), (380, 130), (1008, 16),
              (1023, 20), (1023, 950), (900, 898), (700, 812), (500, 724),
              (300, 620), (150, 548), (20, 474)]
# Unique objects, never a fill source.
UNIQUE = [(404, 140, 1008, 420), (420, 130, 500, 220), (690, 80, 760, 150),
          (786, 76, 850, 146), (160, 356, 200, 396), (676, 300, 730, 372)]
CLEAN_PATCH = (520, 470, 660, 560)     # a stretch of counter face with nothing on it


def load():
    spec = importlib.util.spec_from_file_location(
        'bar_decompose', Path(__file__).resolve().parent / 'bar-decompose.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    mod = load()
    rgb = np.asarray(Image.open(mod.SRC).convert('RGB')).astype(np.uint8)
    cluster, furniture, masks = mod.split(rgb)
    h, w = cluster.shape

    sil = Image.new('L', (w, h), 0)
    ImageDraw.Draw(sil).polygon(SILHOUETTE, fill=255)
    surface = np.asarray(sil) > 0
    # ONLY WHERE A MAN IN FRONT OF THE BAR COVERS IT. bar_1 sits BEHIND the
    # counter -- his torso shows above it against nothing at all -- so his
    # pixels are not occluded bar, and filling them painted bar structure over
    # him: the recomposition gate reported 8,746 differing pixels, correctly.
    # Hiding him reveals empty field, which is what is actually behind him.
    in_front = masks['bar_2'] | masks['bar_3']
    front = Image.new('L', (w, h), 0)
    ImageDraw.Draw(front).polygon(mod.BAR1_FRONT, fill=255)
    in_front = in_front | (masks['bar_1'] & (np.asarray(front) > 0))
    holes = surface & ~furniture & cluster & in_front
    # one pixel of margin, because a seam one pixel wide is still a seam
    behind = masks['bar_1'] & ~(np.asarray(front) > 0)
    holes = binary_dilation(holes, np.ones((3, 3))) & surface & ~furniture & ~behind

    uni = Image.new('L', (w, h), 0)
    ud = ImageDraw.Draw(uni)
    for box in UNIQUE:
        ud.rectangle(list(box), fill=255)
    bare = furniture & ~(np.asarray(uni) > 0)
    # AND THE SOURCE MASK IS OPENED FIRST. The stray-pixel pass in the split
    # leaves a scatter of single furniture pixels INSIDE each man, and a
    # nearest-source fill treats every one of them as bare bar: the first run
    # painted the standing man's own checked shirt and skin back into his own
    # hole, in vertical streaks radiating from each stray. A fill source has to
    # be a surface, not a speck.
    bare = binary_opening(bare, np.ones((5, 5)))

    filled = rgb.astype(float).copy()
    _, near = distance_transform_edt(~bare, return_indices=True)
    filled[holes] = filled[near[0][holes], near[1][holes]]
    smooth = uniform_filter(filled, size=(3, 3, 1))
    filled[holes] = smooth[holes]
    patch = rgb[CLEAN_PATCH[1]:CLEAN_PATCH[3], CLEAN_PATCH[0]:CLEAN_PATCH[2]].astype(float)
    grain = patch - uniform_filter(patch, size=(5, 5, 1))
    ys, xs = np.nonzero(holes)
    filled[ys, xs] += grain[ys % grain.shape[0], xs % grain.shape[1]]

    out = np.clip(filled, 0, 255).astype(np.uint8)
    complete = furniture | holes

    if '--preview' in sys.argv:
        lit = np.clip((out.astype(float) / 255) ** 0.5 * 255, 0, 255)
        lit[~complete] = (30, 0, 30)
        edge = holes & binary_dilation(~holes, np.ones((3, 3)))
        lit[edge] = (90, 230, 255)
        Image.fromarray(lit.astype('uint8')).save(PROOF / 'bar-furniture-completed.png')
        print(f'wrote {PROOF / "bar-furniture-completed.png"}')
        print(f'  bar silhouette   {int(surface.sum())} px')
        print(f'  already bar      {int((furniture & surface).sum())} px')
        print(f'  holes completed  {int(holes.sum())} px')
        return

    a = np.zeros((h, w, 4), np.uint8)
    a[:, :, :3] = out
    a[:, :, 3] = np.where(complete, 255, 0)
    ys, xs = np.nonzero(complete)
    crop = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    Image.fromarray(a).crop(crop).save(OUT / 'furniture-bar-complete.png')
    rec = json.loads((OUT / 'decompose.json').read_text())
    rec['furnitureComplete'] = {'pixels': int(complete.sum()), 'cropInMaster': crop,
                                'holesFilled': int(holes.sum()),
                                'method': 'nearest bare bar structure, smoothed once, grain re-added'}
    (OUT / 'decompose.json').write_text(json.dumps(rec, indent=1) + '\n')
    print(f'  wrote furniture-bar-complete.png  {crop[2] - crop[0]}x{crop[3] - crop[1]}  '
          f'{int(holes.sum())} px completed')


if __name__ == '__main__':
    main()
