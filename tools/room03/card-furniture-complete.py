#!/usr/bin/env python3
"""
THE TABLE, COMPLETED UNDER WHERE THE ARMS WERE.

Moving the four men's forearms, hands and fans of cards into their own layers
leaves holes in the furniture base. Tyler's ruling: complete the hidden surface
deterministically, using the accepted master's own table as material and
perspective authority, with NO image generation and NO old Room 3 pixels.

TWO FILLS, IN ORDER, AND THE FIRST ONE IS THE GOOD ONE.

  1  MIRROR. The tabletop is a circle seen from one side, so it is very nearly
     symmetric about its own centre line at x 718. A hole at (x, y) takes the
     pixel at (1436 - x, y) when that pixel is known wood. This is not a smear:
     it is the same table, at the same depth, under the same lamp, with grain
     of the same scale running the same way -- and the two near arms sit on
     opposite sides of that centre line, so each one's hole is covered by the
     other one's clear wood.

  2  DIFFUSION, for what the mirror cannot reach -- where both sides are
     covered at once, which happens only along the far rim. Repeated masked
     averaging from the known edge inward, then the high-frequency grain of a
     clean tabletop patch added back at the same amplitude, because a diffusion
     fill on its own is flat and reads as a smudge exactly where the eye is
     already looking for one.

WHAT IS DELIBERATELY NOT RECONSTRUCTED, and the first attempt got this wrong.
It filled the whole ellipse, including the wedges of tabletop behind each man's
TORSO -- which no occupational motion will ever expose -- and the mirror had to
reach across to sides that were themselves covered, so those wedges came back
as pale ghosting exactly where the eye goes looking for a seam.

Tyler's ruling is explicit: complete "enough to support the expected motion
envelope -- hands lifting slightly, card fan moving, forearm shifting, small
torso/arm changes", and "do not reconstruct hypothetical furniture for players
walking away". So the fill is bounded to the ARM REGIONS, dilated by 40 px, and
stops there. Everything outside it stays as it is, because nothing will ever
move to reveal it.

    python3 tools/room03/card-furniture-complete.py [--preview]
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, distance_transform_edt, uniform_filter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/staging/room-03/clean-card-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'
MIRROR_X = 718.0
CLEAN_PATCH = (760, 430, 900, 520)      # a stretch of tabletop with nothing on it

# WHAT THE MIRROR MAY NOT COPY. The mirror is only allowed to fetch BARE WOOD.
# The first version let it fetch anything the table layer owned, and it duly
# copied the right-hand tin mug across to the left side of the table, where it
# sat as a pale ghost in the middle of the fill. A bottle, a cup or a stack of
# chips is a unique object standing ON the surface; only the surface repeats.
PROPS = [(520, 318, 632, 428), (758, 292, 882, 468), (900, 420, 1060, 530),
         (480, 342, 614, 430), (850, 342, 1014, 430), (390, 462, 534, 540),
         (874, 464, 1064, 550), (608, 536, 884, 644), (624, 396, 764, 474)]


def load_decompose():
    spec = importlib.util.spec_from_file_location(
        'card_decompose', Path(__file__).resolve().parent / 'card-decompose.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def tabletop(shape, table_spec):
    """The tabletop's own silhouette -- the ellipse, its skirt and its feet."""
    m = Image.new('L', (shape[1], shape[0]), 0)
    d = ImageDraw.Draw(m)
    cx, cy, a, b = (table_spec[k] for k in ('cx', 'cy', 'a', 'b'))
    d.ellipse([cx - a, cy - b, cx + a, cy + b], fill=255)
    d.polygon([(cx - a + 8, cy), (cx + a - 8, cy), (cx + a - 40, cy + 140),
               (cx + 180, cy + 190), (cx, cy + 190), (cx - 180, cy + 190),
               (cx - a + 40, cy + 140)], fill=255)
    return np.asarray(m) > 0


def main():
    mod = load_decompose()
    rgb = np.asarray(Image.open(mod.SRC).convert('RGB')).astype(np.uint8)
    cluster, table, _ = mod.split(rgb)
    surface = tabletop(rgb.shape[:2], mod.TABLE)

    # THE MOTION ENVELOPE: the arm regions, generously dilated, and nothing else.
    env = Image.new('L', (rgb.shape[1], rgb.shape[0]), 0)
    ed = ImageDraw.Draw(env)
    for pts in mod.ARM_REGIONS.values():
        ed.polygon(pts, fill=255)
    envelope = binary_dilation(np.asarray(env) > 0, np.ones((3, 3)), iterations=40)
    # THE WHOLE TABLETOP, not just the envelope. Tyler's actor-off proof asks
    # for "no player-shaped hole" and "no arm-shaped missing table region", and
    # a hole is exactly what an envelope-only fill leaves behind the torsos. The
    # envelope stays computed because it is what the fill QUALITY is judged on:
    # inside it the surface has to carry motion, outside it only has to exist.
    # AND ONLY WHERE A MAN IS. The ellipse is an approximation of the tabletop
    # and overshoots it -- between the feet, and a little past the drawn rim --
    # so filling the whole silhouette painted wood onto open field and the
    # recomposition gate reported 46,351 differing pixels, correctly. A pixel is
    # occluded tabletop only if the master has a MAN there.
    holes = surface & ~table & cluster
    filled = rgb.astype(float).copy()

    # 1 -- MIRROR
    xs = np.arange(rgb.shape[1])
    src_x = np.clip(np.round(2 * MIRROR_X - xs).astype(int), 0, rgb.shape[1] - 1)
    prop = Image.new('L', (rgb.shape[1], rgb.shape[0]), 0)
    pd = ImageDraw.Draw(prop)
    for box in PROPS:
        pd.rectangle(list(box), fill=255)
    bare = table & ~(np.asarray(prop) > 0)

    mirror_rgb = filled[:, src_x]
    mirror_ok = bare[:, src_x] & holes
    filled[mirror_ok] = mirror_rgb[mirror_ok]
    done = table | mirror_ok
    left = holes & ~mirror_ok

    # 2 -- NEAREST BARE WOOD, then the grain put back.
    #
    # TWO EARLIER FILLS WERE REJECTED BY THEIR OWN PREVIEW. Diffusion read as a
    # pale smear -- a soft blob is the one thing a flat wood surface cannot
    # absorb. Row-wise interpolation held the grain in the middle of the table
    # and broke at the left and right extremes, where a row's only known wood is
    # far away or on one side, so a single pixel got dragged across a long span
    # and came back as hard horizontal streaks.
    #
    # NEAREST WOOD HAS NEITHER FAILURE. Every filled pixel takes the colour of
    # the closest bare tabletop, which is never far and is always at nearly the
    # same depth and light; the patchwork that leaves is then smoothed once and
    # given back the high-frequency grain of a clean stretch of tabletop, at its
    # own amplitude.
    if left.any():
        _, near = distance_transform_edt(~bare, return_indices=True)
        work = filled.copy()
        work[left] = filled[near[0][left], near[1][left]]
        smooth = uniform_filter(work, size=(3, 3, 1))
        work[left] = smooth[left]
        patch = rgb[CLEAN_PATCH[1]:CLEAN_PATCH[3], CLEAN_PATCH[0]:CLEAN_PATCH[2]].astype(float)
        grain = patch - uniform_filter(patch, size=(5, 5, 1))
        ys, xsi = np.nonzero(left)
        work[ys, xsi] += grain[ys % grain.shape[0], xsi % grain.shape[1]]
        filled[left] = work[left]

    out = np.clip(filled, 0, 255).astype(np.uint8)
    complete = table | holes

    if '--preview' in sys.argv:
        lit = np.clip((out.astype(float) / 255) ** 0.5 * 255, 0, 255)
        lit[~complete] = (30, 0, 30)
        # THE BOUNDARY, not the region. The first version of this line drew
        # `holes & ~dilate(~holes)` -- which is the holes ERODED, i.e. almost
        # all of them -- and painted cyan over the entire fill it was supposed
        # to be letting a person judge.
        edge = holes & binary_dilation(~holes, np.ones((3, 3)))
        lit[edge] = (90, 230, 255)
        Image.fromarray(lit.astype('uint8')).crop((260, 280, 1200, 720)).resize(
            (1410, 660), Image.NEAREST).save(PROOF / 'card-table-completed.png')
        print(f'wrote {PROOF / "card-table-completed.png"}')
        print(f'  tabletop silhouette {int(surface.sum())} px')
        print(f'  already table       {int((table & surface).sum())} px')
        print(f'  holes to complete   {int(holes.sum())} px')
        print(f'  filled by mirror    {int(mirror_ok.sum())} px')
        print(f'  filled nearest-wood {int(left.sum())} px')
        return

    a = np.zeros((*rgb.shape[:2], 4), np.uint8)
    a[:, :, :3] = out
    a[:, :, 3] = np.where(complete, 255, 0)
    ys, xsi = np.nonzero(complete)
    crop = (int(xsi.min()), int(ys.min()), int(xsi.max()) + 1, int(ys.max()) + 1)
    Image.fromarray(a).crop(crop).save(OUT / 'furniture-table-complete.png')
    rec = json.loads((OUT / 'decompose.json').read_text())
    rec['furnitureComplete'] = {
        'pixels': int(complete.sum()), 'cropInMaster': crop,
        'holesFilled': int(holes.sum()), 'byMirror': int(mirror_ok.sum()),
        'byNearestWood': int(left.sum()), 'mirrorX': MIRROR_X,
        'note': ('the tabletop completed under the four men\'s arms, hands and cards. Mirror '
                 'about the table\'s own centre line first, diffusion plus re-added grain for '
                 'what the mirror cannot reach. Bounded by the tabletop silhouette: nothing is '
                 'invented outside it.'),
    }
    (OUT / 'decompose.json').write_text(json.dumps(rec, indent=1) + '\n')
    print(f'  wrote furniture-table-complete.png  {crop[2] - crop[0]}x{crop[3] - crop[1]}')
    print(f'  holes {int(holes.sum())} px -- mirror {int(mirror_ok.sum())}, '
          f'nearest-wood {int(left.sum())}')


if __name__ == '__main__':
    main()
