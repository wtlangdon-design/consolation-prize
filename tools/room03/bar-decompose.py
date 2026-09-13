#!/usr/bin/env python3
"""
THE BAR CLUSTER, DECOMPOSED THE WAY THE CARD CLUSTER PROVED.

Tyler's ruling, Part II: no companion render, no generation. Deterministic
segmentation and hidden-surface completion exactly as proven on CARD.

WHAT IS EASIER HERE, AND WHAT IS HARDER. Easier: the three men stand well apart
along the bar, so no erosion is needed to break contacts between them and none
of them is drawn behind a chair. Harder: all three have forearms lying ON the
counter top, which is the same smooth-surface race the card table lost --
the furniture's flood crosses polished mahogany cheaply and takes the sleeve.

So this uses the same three parts that worked there:

  a FURNITURE CORE, seeded inside the back bar, the counter face and the rail;
  MAN SEEDS, inside each man's head, torso, legs and each forearm on the counter;
  a GRADIENT WATERSHED, which settles every boundary on the drawn outline.

and the same discipline: a seed must have somewhere to expand to, so the
furniture core is carved back out around each man.

    python3 tools/room03/bar-decompose.py --preview
    python3 tools/room03/bar-decompose.py
"""
import heapq
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, binary_erosion, distance_transform_edt, gaussian_filter, sobel

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-bar-01/source.png'
OUT = ROOT / 'art/staging/room-03/clean-bar-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'

# ---- SEEDS, READ OFF THE MASTER AT 1:1 WITH A 50 px GRID -------------------
#
# Each man: head, torso, hips, legs, and EVERY forearm that touches the counter.
# The forearms are listed separately because they are the pixels sec.15 says
# animate and the ones the furniture would otherwise take.
MEN = {
    # bar_1's BRIM AND SHOULDER needed their own seeds: the furniture layer was
    # keeping them, because the nearest markers to them were the counter's far
    # end rather than his head.
    'bar_1': [(127, 300, 13), (120, 348, 15), (106, 430, 15), (112, 486, 13),
              (150, 372, 10), (176, 376, 9), (95, 322, 8), (88, 360, 8)],
    'bar_2': [(345, 286, 17), (356, 362, 23), (356, 472, 21), (350, 562, 19),
              (332, 700, 13), (392, 660, 13), (302, 424, 11), (432, 420, 13)],
    'bar_3': [(790, 242, 19), (782, 302, 17), (772, 402, 28), (762, 472, 28),
              (762, 562, 26), (752, 682, 25), (746, 802, 21), (762, 898, 17),
              (692, 342, 15), (868, 512, 17),
              # his RIGHT UPPER SLEEVE, between his shoulder and the forearm on
              # the counter. Unseeded, the back-bar anchors beside it took it.
              (858, 374, 10), (886, 436, 10)],
}
# WHAT IS FURNITURE, seeded where it is unambiguous: inside the back bar, deep
# in the counter's front face, along the rail, on the stool, and on the
# counter top between the men.
FURNITURE = [(500, 196, 34), (950, 150, 30), (604, 330, 26), (452, 250, 24),
             (880, 260, 22), (560, 400, 18),
             (250, 502, 26), (500, 604, 34), (660, 712, 26), (952, 756, 34),
             (400, 520, 22), (600, 560, 24), (860, 660, 26), (980, 560, 26),
             (206, 392, 8), (556, 452, 10), (960, 470, 12),
             (212, 544, 7), (456, 724, 7), (628, 824, 7),
             (76, 486, 11), (84, 528, 9), (30, 400, 8), (46, 358, 7)]
# SOME FURNITURE STANDS INSIDE A MAN'S ROOM and has to be put back after the
# carve, or it goes to him: the seated man's STOOL is under him, the counter's
# far end is behind his shoulder, and the counter top runs on past the standing
# man's forearm. The first run gave bar_1 his own stool and the bar's far end,
# and gave bar_3 a wedge of counter top beside his elbow.
FURNITURE_ANCHORS = [(78, 452, 8), (66, 516, 6), (100, 520, 6),
                     (28, 394, 6), (40, 432, 5), (34, 352, 4),
                     (906, 466, 9), (952, 498, 11), (996, 540, 13),
                     (884, 602, 15), (958, 642, 17),
                     # AND THE BACK BAR BEHIND THE STANDING MAN'S SHOULDER. His
                     # room box erased the shelf seeds that were already there,
                     # so his flood took 180 x 250 px of shelving and bottles
                     # with him -- visible the moment he was rendered alone.
                     (884, 254, 12), (930, 202, 11), (906, 330, 9), (944, 396, 8),
                     (938, 522, 8), (968, 552, 8), (960, 590, 8),
                     # and the counter's end face and the rail beside the
                     # leaning man, which his room box erased the same way.
                     (295, 432, 9), (302, 482, 8), (300, 600, 6), (332, 622, 6)]

# BAR_1 SITS BEHIND THE COUNTER AND HIS FOREARMS LIE ON TOP OF IT. Same case as
# the far card players: he composites BEFORE the furniture so the counter's
# front face crosses his middle, and this small region composites AFTER it so
# his arms and his cup stay on the surface rather than under it.
BAR1_FRONT = [(100, 348), (198, 350), (200, 402), (100, 400)]

# The furniture core is carved back out around each man so his seeds have
# somewhere to expand to -- the lesson the card cluster cost an hour.
MAN_ROOM = {
    'bar_1': [(18, 268), (206, 268), (206, 566), (18, 566)],
    'bar_2': [(268, 244), (486, 244), (486, 752), (268, 752)],
    'bar_3': [(626, 196), (940, 196), (940, 956), (626, 956)],
}


def key(rgb):
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (r > 180) & (b > 180) & (g < 90)


def watershed(cost, markers, inside):
    h, w = cost.shape
    labels = markers.copy()
    heap = []
    ys, xs = np.nonzero(markers)
    for y, x in zip(ys, xs):
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and inside[ny, nx] and labels[ny, nx] == 0:
                heapq.heappush(heap, (float(cost[ny, nx]), ny, nx, int(markers[y, x])))
    while heap:
        _, y, x, k = heapq.heappop(heap)
        if labels[y, x]:
            continue
        labels[y, x] = k
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and inside[ny, nx] and labels[ny, nx] == 0:
                heapq.heappush(heap, (float(cost[ny, nx]), ny, nx, k))
    return labels * inside


def split(rgb):
    cluster = ~key(rgb)
    h, w = cluster.shape
    order = list(MEN)
    markers = np.zeros((h, w), np.int32)

    furn = Image.new('I', (w, h), 0)
    fd = ImageDraw.Draw(furn)
    for x, y, r in FURNITURE:
        fd.ellipse([x - r, y - r, x + r, y + r], fill=len(order) + 1)
    for pts in MAN_ROOM.values():
        fd.polygon(pts, fill=0)
    for x, y, r in FURNITURE_ANCHORS:
        fd.ellipse([x - r, y - r, x + r, y + r], fill=len(order) + 1)
    markers = np.where((np.asarray(furn) > 0) & cluster, np.asarray(furn), markers)

    men = Image.new('I', (w, h), 0)
    md = ImageDraw.Draw(men)
    for i, who in enumerate(order, 1):
        for x, y, r in MEN[who]:
            md.ellipse([x - r, y - r, x + r, y + r], fill=i)
    stamped = np.asarray(men)
    markers = np.where((stamped > 0) & cluster, stamped, markers)

    grey = gaussian_filter(rgb.astype(float).mean(2), 0.8)
    grad = np.clip(np.hypot(sobel(grey, 0), sobel(grey, 1)), 0, 255)
    owned = watershed(grad, markers, cluster)

    furniture = owned == len(order) + 1
    masks = {who: owned == i for i, who in enumerate(order, 1)}
    stray = cluster & (owned == 0)
    if stray.any():
        base = np.where(furniture, 99, owned)
        _, idx = distance_transform_edt(base == 0, return_indices=True)
        fill = base[idx[0], idx[1]]
        for i, who in enumerate(order, 1):
            masks[who] = masks[who] | (stray & (fill == i))
        furniture = furniture | (stray & (fill == 99))
    return cluster, furniture, masks


def main():
    rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(np.uint8)
    cluster, furniture, masks = split(rgb)

    if '--preview' in sys.argv:
        lit = np.clip((rgb.astype(float) / 255) ** 0.5 * 255, 0, 255)
        tint = {'bar_1': (232, 204, 96), 'bar_2': (110, 200, 220), 'bar_3': (244, 150, 170)}
        lit[furniture] = lit[furniture] * 0.55 + np.array([90, 110, 255]) * 0.45
        for who, m in masks.items():
            lit[m] = lit[m] * 0.6 + np.array(tint[who]) * 0.4
        lit[~cluster] = (30, 0, 30)
        out = PROOF / 'bar-trace-preview.png'
        Image.fromarray(lit.astype('uint8')).save(out)
        print(f'wrote {out}   BLUE = the bar, one colour per patron')
        covered = furniture.copy()
        for who, m in masks.items():
            covered |= m
            ys, xs = np.nonzero(m)
            print(f'  {who:6s} {m.sum():7d} px  bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}')
        print(f'  furniture {int(furniture.sum())} px   cluster {int(cluster.sum())} px'
              f'   UNASSIGNED {int((cluster & ~covered).sum())} px (must be 0)')
        return

    OUT.mkdir(parents=True, exist_ok=True)
    rec = {'source': str(SRC.relative_to(ROOT)), 'method': 'seeded gradient watershed',
           'layers': {}}

    def write(name, mask):
        a = np.zeros((*rgb.shape[:2], 4), np.uint8)
        a[:, :, :3] = rgb
        a[:, :, 3] = np.where(mask, 255, 0)
        ys, xs = np.nonzero(mask)
        crop = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        Image.fromarray(a).crop(crop).save(OUT / f'{name}.png')
        rec['layers'][name] = {'pixels': int(mask.sum()), 'cropInMaster': crop}
        print(f'  wrote {name}.png  {crop[2] - crop[0]}x{crop[3] - crop[1]}  {int(mask.sum())} px')

    write('furniture-bar', furniture)
    front = Image.new('L', (rgb.shape[1], rgb.shape[0]), 0)
    ImageDraw.Draw(front).polygon(BAR1_FRONT, fill=255)
    on_top = np.asarray(front) > 0
    for who, m in masks.items():
        if who == 'bar_1':
            write('bar_1-behind', m & ~on_top)
            write('bar_1-front', m & on_top)
        else:
            write(who, m)
    (OUT / 'decompose.json').write_text(json.dumps(rec, indent=1) + '\n')


if __name__ == '__main__':
    main()
