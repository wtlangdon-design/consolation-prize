"""How many pixel BLOCKS tall a generated figure is, head to boots (errata 115).

A generated sheet is drawn on a grid of square blocks; the block count from
head to boots is what makes a figure read as finer or coarser than Thad,
whatever size it is drawn at. Measured as the spacing of the colour edges
inside the figure -- the first peak of their autocorrelation along rows and
along columns -- on the sheet at its own resolution (at game size the blocks
are too few pixels across to measure).

Calibrated (2026-11-06): Thad's stand frame is about 104 blocks tall, the
undertaker 104, Sump and Fanshawe about 84-87. The townspeople's first sheets
measured about 200 (too fine) and their second 62-84 (too coarse); Tyler's
reading of both agreed with the numbers. A child is drawn on the same grid at
his own height, so the boy's 62 is about 92 for a man.

The number flags; it does not decide (CLAUDE.md style gate step 2).

usage: python3 tools/art/measure-grid.py <sheet.png> [<sheet.png> ...]
       python3 tools/art/measure-grid.py --thad
"""
import importlib.util
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('cvt', os.path.join(ROOT, 'tools/art/cast-vs-thad.py'))
cvt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cvt)


def block(a):
    lum = a[..., :3].astype(float) @ np.array([0.299, 0.587, 0.114])
    inside = a[..., 3] > 0
    sizes = []
    for values, mask in ((lum, inside), (lum.T, inside.T)):
        edges = np.abs(np.diff(values, axis=1))
        edges[~(mask[:, 1:] & mask[:, :-1])] = 0
        edges = edges - edges.mean(axis=1, keepdims=True)
        ac = np.zeros(40)
        for lag in range(1, 40):
            ac[lag] = (edges[:, :-lag] * edges[:, lag:]).sum()
        ac /= max(ac[1:].max(), 1e-9)
        peaks = [k for k in range(3, 39) if ac[k] > ac[k - 1] and ac[k] >= ac[k + 1] and ac[k] > 0.05]
        if peaks:
            sizes.append(peaks[0])
    return float(np.mean(sizes)) if sizes else float('nan')


def main():
    if sys.argv[1:] == ['--thad']:
        img = Image.open(os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')).convert('RGBA')
        a = np.asarray(img.crop(img.getbbox()))
        b = block(a)
        print(f'thad: {a.shape[0]}px, block {b:.1f} -> about {a.shape[0] / b:.0f} blocks tall')
        return
    for path in sys.argv[1:]:
        for i, pose in enumerate(cvt.keyed_poses(path)):
            a = np.asarray(pose)
            b = block(a)
            print(f'{os.path.relpath(path, ROOT)} pose {i + 1}: {a.shape[0]}px, block {b:.1f} -> about {a.shape[0] / b:.0f} blocks tall')


if __name__ == '__main__':
    main()
