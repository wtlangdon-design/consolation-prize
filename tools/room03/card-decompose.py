#!/usr/bin/env python3
"""
THE CARD CLUSTER, DECOMPOSED INTO LAYERS THAT REBUILD IT EXACTLY.

Tyler's clean-sheet reset, sec.6-9. The accepted cluster master is the VISUAL
TRUTH; these layers exist to reconstruct it, and `card-gate.py` is what says
whether they do.

THE UNIT IS A MAN ON HIS OWN CHAIR, and that is a decision worth defending.
Sec.6 asks for a fixed furniture base and four independent actors. The obvious
reading puts the chairs in the base -- but the two near men are seen from
behind with their CHAIR BACKS DRAWN OVER THEIR LOWER TORSOS, six slats about
ten pixels wide alternating with the coat behind them, and measurement says
nothing separates them:

    hue 26-35 everywhere in the picture; chair back luminance 21.6 against coat
    27.8; across three horizontal profiles the slats oscillate 4-43 against a
    coat running 7-40; R-B overlaps in every zone where the two touch.

The slats are painted in shadow, so they are genuinely the same values as the
wool behind them. Hand-tracing at slat resolution would be the same kind of
authored boundary the retired lineage's halo came from, and it would have to be
done again for every man in the room.

So the chair goes with its man. Sec.34's four requirements are what actually
matter and all four hold: each player can swap to alternate frames
independently; the TABLE stays fixed; occlusion still works, because the table's
near rim is its own layer over the near men's laps; and nobody needs unbaking
later, because the man and his chair are one sprite that can be redrawn without
touching the room. Nobody is painted into the room, the floor, the table or the
lighting plate, which is what sec.5 forbids.

HOW THE FOUR ARE TOLD APART, without tracing a single man. Remove the table and
the four units nearly fall out as connected components -- nearly, because the
near men's heads touch the far men's coats at two places. So the people mask is
ERODED UNTIL FOUR MARKERS APPEAR (23 iterations, measured, not chosen) and every
people pixel is then given to its nearest marker. The separation is a distance
transform, not a judgement.

    python3 tools/room03/card-decompose.py --preview
    python3 tools/room03/card-decompose.py
"""
import json
import sys
from pathlib import Path

import heapq

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import (binary_dilation, binary_erosion, distance_transform_edt,
                           gaussian_filter, label, sobel)

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-card-01/source.png'
OUT = ROOT / 'art/staging/room-03/clean-card-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'

# THE TABLE, fitted to its own visible extremes rather than to the staging
# guide: left x 296, right x 1146, far rim y 338, near rim y 650. The first fit
# was 40 px too narrow and left a crescent of unmasked wood along the far rim
# that joined all four men into one component.
TABLE = dict(cx=718, cy=496, a=436, b=168)
TABLE_FEET = [(596, 620, 664, 716), (884, 620, 960, 716)]
ERODE = 23
CORE = 0.82        # the table's own marker, as a fraction of its ellipse

# WHO IS WHO, by where a marker's centroid lands. The four are in four corners
# of the frame, so this is a label and not a judgement.
WHO = [('card_1', 'near', 0, 768, 430, 1024),   # near left, flat cap, back view
       ('card_2', 'far', 0, 768, 0, 430),       # far left, grey hair -- THE CARD SHARP
       ('card_3', 'far', 768, 1536, 0, 430),    # far right, the young one
       ('card_4', 'near', 768, 1536, 430, 1024)]  # near right, bald, back view


def key(rgb):
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (r > 180) & (b > 180) & (g < 90)


def table_mask(shape):
    m = Image.new('L', (shape[1], shape[0]), 0)
    d = ImageDraw.Draw(m)
    cx, cy, a, b = TABLE['cx'], TABLE['cy'], TABLE['a'], TABLE['b']
    d.ellipse([cx - a, cy - b, cx + a, cy + b], fill=255)
    # the apron and the shadowed underside, down to the feet
    d.polygon([(cx - a + 8, cy), (cx + a - 8, cy), (cx + a - 40, cy + 140),
               (cx + 180, cy + 190), (cx, cy + 200), (cx - 180, cy + 190),
               (cx - a + 40, cy + 140)], fill=255)
    for foot in TABLE_FEET:
        d.rectangle(list(foot), fill=255)
    return np.asarray(m) > 0


def watershed(cost, markers, inside):
    """
    PRIORITY-FLOOD WATERSHED, written out because scikit-image is not installed
    and because a boundary this one matters should not be a black box.

    Every marker floods outward, always taking the CHEAPEST unclaimed neighbour
    next, so the frontier between two markers settles on the ridge of highest
    cost between them. With the gradient as cost that ridge is the drawn outline
    -- which is the one thing in this picture that does separate a sleeve from
    the tabletop when hue, luminance and R-B all fail to.
    """
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
    rough = table_mask(rgb.shape[:2]) & cluster
    people = cluster & ~rough
    people = binary_dilation(binary_erosion(people, np.ones((3, 3))), np.ones((3, 3)))

    # FOUR MARKERS FOR THE FOUR MEN, from an erosion deep enough to break the
    # two places where a near man's head touches a far man's coat.
    seed = binary_erosion(people, np.ones((3, 3)), iterations=ERODE)
    lab, _ = label(seed)
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    markers = np.zeros(people.shape, np.int32)
    for k, i in enumerate(np.argsort(sizes)[::-1][:4], 1):
        markers[lab == i] = k

    # AND A FIFTH FOR THE TABLE, which is what recovers the arms. Subtracting
    # the ellipse outright -- the first version of this -- left every forearm,
    # hand and fan of cards in the table layer, and those are exactly the pixels
    # sec.15 says have to animate. Giving the table a marker of its own and
    # letting the watershed settle the boundary puts them back on their men and
    # still keeps the bottle, the cups, the chips and the abandoned hand.
    cx, cy, a, b = (TABLE[k] for k in ('cx', 'cy', 'a', 'b'))
    core = Image.new('L', (rgb.shape[1], rgb.shape[0]), 0)
    cd = ImageDraw.Draw(core)
    cd.ellipse([cx - a * CORE, cy - b * CORE, cx + a * CORE, cy + b * CORE], fill=255)
    # AND THE NEAR RIM IS THE TABLE'S TOO, declared rather than hoped for. With
    # only the middle of the ellipse marked, the watershed walked the low-
    # gradient band along the apron and gave the whole near rim to the near-left
    # man -- his mask ran to x 1100, most of the way across a table he is not
    # sitting at. No arm rests on the near rim; the men reach in from the left,
    # the right and the far side. So the rim below the centre is marked table.
    cd.ellipse([cx - a, cy - b, cx + a, cy + b], fill=255)
    cd.ellipse([cx - a * 0.86, cy - b * 0.86, cx + a * 0.86, cy + b * 0.86], fill=0)
    cd.rectangle([0, 0, rgb.shape[1], int(cy + b * 0.45)], fill=0)
    cd.ellipse([cx - a * CORE, cy - b * CORE, cx + a * CORE, cy + b * CORE], fill=255)
    markers[(np.asarray(core) > 0) & cluster] = 5

    grey = gaussian_filter(rgb.astype(float).mean(2), 0.8)
    grad = np.clip(np.hypot(sobel(grey, 0), sobel(grey, 1)), 0, 255)
    owned = watershed(grad, markers, cluster)
    table = owned == 5
    owned = np.where(owned == 5, 0, owned)

    # EVERY CLUSTER PIXEL MUST LAND SOMEWHERE. The open-morphology that cleans
    # the people mask drops a few hundred single pixels off thin edges, and a
    # layer set that does not tile the cluster cannot recompose it -- the gate
    # would report a scatter of 136 stray pixels and be right to. So the
    # leftovers are given to whichever of the five layers is nearest.
    stray = cluster & ~table & (owned == 0)
    if stray.any():
        base = np.where(table, 5, owned)
        _, idx2 = distance_transform_edt(base == 0, return_indices=True)
        filled = base[idx2[0], idx2[1]]
        owned = np.where(stray & (filled < 5), filled, owned)
        table = table | (stray & (filled == 5))

    masks = {}
    for k in range(1, 5):
        m = owned == k
        ys, xs = np.nonzero(m)
        cx, cy = xs.mean(), ys.mean()
        for who, _, x0, x1, y0, y1 in WHO:
            if x0 <= cx < x1 and y0 <= cy < y1:
                masks[who] = m
                break
    return cluster, table, masks


def main():
    rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(np.uint8)
    cluster, table, masks = split(rgb)

    if '--preview' in sys.argv:
        lit = np.clip((rgb.astype(float) / 255) ** 0.5 * 255, 0, 255)
        tint = {'card_1': (232, 204, 96), 'card_2': (110, 200, 220),
                'card_3': (244, 150, 170), 'card_4': (110, 232, 130)}
        lit[table] = lit[table] * 0.55 + np.array([90, 110, 255]) * 0.45
        for who, m in masks.items():
            lit[m] = lit[m] * 0.6 + np.array(tint[who]) * 0.4
        lit[~cluster] = (30, 0, 30)
        out = PROOF / 'card-trace-preview.png'
        Image.fromarray(lit.astype('uint8')).save(out)
        print(f'wrote {out}   BLUE = the table, one colour per man-on-his-chair')
        for who, _, _, _, _, _ in WHO:
            m = masks.get(who)
            if m is None:
                print(f'  {who:7s} MISSING')
                continue
            ys, xs = np.nonzero(m)
            print(f'  {who:7s} {m.sum():7d} px  bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}')
        covered = table.copy()
        for m in masks.values():
            covered |= m
        print(f'  table {int(table.sum())} px   cluster {int(cluster.sum())} px'
              f'   UNASSIGNED {int((cluster & ~covered).sum())} px (must be 0)')
        return

    OUT.mkdir(parents=True, exist_ok=True)
    rec = {'source': str(SRC.relative_to(ROOT)), 'method': 'table mask, then nearest-marker',
           'erodeIterations': ERODE, 'table': TABLE, 'layers': {}}

    def write(name, mask):
        a = np.zeros((*rgb.shape[:2], 4), np.uint8)
        a[:, :, :3] = rgb
        a[:, :, 3] = np.where(mask, 255, 0)
        ys, xs = np.nonzero(mask)
        crop = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        Image.fromarray(a).crop(crop).save(OUT / f'{name}.png')
        rec['layers'][name] = {'pixels': int(mask.sum()), 'cropInMaster': crop}
        print(f'  wrote {name}.png  {crop[2] - crop[0]}x{crop[3] - crop[1]}  {int(mask.sum())} px')

    write('furniture-table', table)
    for who, _, _, _, _, _ in WHO:
        write(who, masks[who])
    (OUT / 'decompose.json').write_text(json.dumps(rec, indent=1) + '\n')


if __name__ == '__main__':
    main()
