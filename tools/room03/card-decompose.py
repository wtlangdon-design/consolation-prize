#!/usr/bin/env python3
"""
THE CARD CLUSTER, DECOMPOSED INTO LAYERS THAT REBUILD IT.

Tyler's clean-sheet reset, sec.6-9. The accepted cluster master is the VISUAL
TRUTH; these layers exist to reconstruct it exactly, and the gate in
`card-gate.py` is the thing that says whether they do.

THE LAYER ORDER IS READ OFF THE ART, NOT ASSUMED. At 3x the near men are seen
from behind with their CHAIR BACKS DRAWN OVER THEIR LOWER TORSOS -- the slats
cross the waistcoat -- while the far men have their chair posts BEHIND their
shoulders. So the cluster is five layers, not three:

    1  back furniture   the two far chairs
    2  card_2, card_3   the far players
    3  mid furniture    the table, its apron and legs, and everything on it
    4  card_1, card_4   the near players
    5  front furniture  the two near chairs, which occlude the near players

WHY THE SILHOUETTES ARE TRACED AND NOT CLASSIFIED. Wood and wool do not
separate here: measured over ten sample regions the table top runs hue 26 and
the near-left man's coat hue 29, his coat luminance 28 against the chair back's
22, and their R-B differ by six levels. A colour rule that cut one would cut the
other, which is the same finding the retired lineage reached from the other
direction when a difference matte "held his face and dropped most of the man".

SO THE FURNITURE IS TRACED AND THE PEOPLE ARE WHAT IS LEFT. The first attempt
here traced the four men directly and the preview showed why not to: two of the
four outlines wandered across the tabletop, claimed the chips and the abandoned
hand, and overlapped each other by ten thousand pixels. A man is a hard shape to
follow by hand and an easy one to get wrong by a hundred pixels.

A table and four chairs are not. They are ellipses and rectilinear frames, their
edges are the highest-contrast lines in the picture, and once they are removed
THE FOUR MEN FALL OUT AS FOUR CONNECTED COMPONENTS, because no man touches
another man. The separation stops being a judgement and becomes a label.

The far chairs are traced TIGHT, because they sit behind their men and anything
the polygon claims beyond the visible post is a piece of a person. The near
chairs may be traced generously where they cross their man, because there they
are genuinely in front of him and the pixels are genuinely chair.

    python3 tools/room03/card-decompose.py --preview   # what each layer claims
    python3 tools/room03/card-decompose.py             # write the layers
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, binary_erosion, label

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art/staging/room-03/clean-card-01/source.png'
OUT = ROOT / 'art/staging/room-03/clean-card-01/layers'
PROOF = ROOT / 'proofs/room-03/clean-sheet'

# ---- THE FURNITURE, TRACED AT 3x OFF THE MASTER ----------------------------
#
# THE TABLE is an ellipse on the ground plane plus the apron under its rim and
# the two feet below that. Its top surface runs from the far rim at y 350 to the
# near rim at y 645 and from x 300 to x 1105, and everything standing on it --
# bottle, cups, chips, coins and the abandoned hand -- belongs to it.
TABLE_ELLIPSE = (702.0, 497.0, 403.0, 148.0)     # cx, cy, semi-major, semi-minor
TABLE_SKIRT = [(310, 470), (1100, 470), (1096, 560), (1035, 622), (930, 664),
               (820, 682), (700, 688), (580, 682), (470, 664), (370, 622),
               (312, 560)]
TABLE_FEET = [(596, 620), (664, 620), (664, 712), (596, 712),
              (884, 620), (960, 620), (960, 712), (884, 712)]

# THE FOUR CHAIRS. The near pair are the frames drawn OVER their men; the far
# pair are the posts and top rails showing past their men's shoulders.
CHAIRS = {
    'chair_near_left': {
        'zone': 'front',
        'poly': [(118, 460), (176, 452), (196, 470), (330, 500), (352, 520),
                 (364, 560), (372, 640), (382, 700), (400, 760), (424, 812),
                 (470, 880), (498, 934), (506, 972), (476, 992), (446, 980),
                 (410, 920), (372, 856), (330, 800), (300, 760), (284, 800),
                 (296, 880), (304, 948), (286, 968), (256, 960), (244, 900),
                 (234, 830), (226, 760), (196, 742), (168, 720), (150, 690),
                 (140, 640), (130, 570), (120, 500)],
    },
    'chair_near_right': {
        'zone': 'front',
        'poly': [(1418, 466), (1370, 452), (1344, 470), (1210, 500), (1188, 520),
                 (1176, 560), (1166, 640), (1156, 700), (1138, 760), (1114, 812),
                 (1068, 880), (1040, 934), (1032, 972), (1062, 992), (1092, 980),
                 (1128, 920), (1166, 856), (1208, 800), (1238, 760), (1254, 800),
                 (1242, 880), (1234, 948), (1252, 968), (1282, 960), (1294, 900),
                 (1304, 830), (1312, 760), (1342, 742), (1370, 720), (1388, 690),
                 (1398, 640), (1408, 570), (1418, 500)],
    },
    'chair_far_left': {
        'zone': 'back',
        'poly': [(362, 196), (398, 196), (400, 236), (398, 300), (392, 350),
                 (366, 352), (360, 300), (358, 240)],
    },
    'chair_far_right': {
        'zone': 'back',
        'poly': [(1122, 196), (1166, 196), (1170, 250), (1168, 310), (1164, 360),
                 (1132, 362), (1126, 306), (1122, 244)],
    },
}

# WHO EACH COMPONENT IS, by the quadrant its centroid lands in. The four men do
# not touch, so this is a label and not a judgement.
WHO = [('card_2', 'far', 0, 760, 0, 400), ('card_3', 'far', 760, 1536, 0, 400),
       ('card_1', 'near', 0, 760, 400, 1024), ('card_4', 'near', 760, 1536, 400, 1024)]
GROW = 0


def key(rgb):
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (r > 180) & (b > 180) & (g < 90)


def poly_mask(points, shape):
    m = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return np.asarray(m) > 0


def furniture_mask(shape):
    """The table, its skirt, its feet and the four chairs."""
    m = Image.new('L', (shape[1], shape[0]), 0)
    d = ImageDraw.Draw(m)
    cx, cy, a, b = TABLE_ELLIPSE
    d.ellipse([cx - a, cy - b, cx + a, cy + b], fill=255)
    d.polygon(TABLE_SKIRT, fill=255)
    d.rectangle(TABLE_FEET[0] + TABLE_FEET[2], fill=255)
    d.rectangle(TABLE_FEET[4] + TABLE_FEET[6], fill=255)
    table = np.asarray(m) > 0
    chairs = {}
    for name, spec in CHAIRS.items():
        chairs[name] = poly_mask(spec['poly'], shape)
    return table, chairs


def main():
    rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(np.uint8)
    cluster = ~key(rgb)
    table, chairs = furniture_mask(rgb.shape[:2])

    # FRONT chairs take their pixels from whoever is behind them; BACK chairs
    # take only what is not already a person, which is why they are traced tight.
    front = np.zeros(rgb.shape[:2], bool)
    back = np.zeros(rgb.shape[:2], bool)
    for name, spec in CHAIRS.items():
        (front if spec['zone'] == 'front' else back)[chairs[name]] = True

    furn = (table | front | back) & cluster
    people = cluster & ~furn
    people = binary_erosion(people, np.ones((3, 3)))
    people = binary_dilation(people, np.ones((3, 3)))

    lab, n = label(people)
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    masks, unclaimed = {}, []
    for i in np.argsort(sizes)[::-1]:
        if sizes[i] < 1500:
            break
        comp = lab == i
        ys, xs = np.nonzero(comp)
        cx, cy = xs.mean(), ys.mean()
        for who, zone, x0, x1, y0, y1 in WHO:
            if x0 <= cx < x1 and y0 <= cy < y1:
                masks[who] = masks.get(who, np.zeros(comp.shape, bool)) | comp
                break
        else:
            unclaimed.append((int(sizes[i]), int(cx), int(cy)))

    if '--preview' in sys.argv:
        lit = np.clip((rgb.astype(float) / 255) ** 0.5 * 255, 0, 255)
        tint = {'card_1': (90, 240, 130), 'card_2': (240, 200, 90),
                'card_3': (110, 190, 250), 'card_4': (245, 120, 130)}
        lit[furn] = lit[furn] * 0.55 + np.array([120, 120, 255]) * 0.45
        for who, m in masks.items():
            edge = m & ~binary_erosion(m, np.ones((5, 5)))
            lit[m] = lit[m] * 0.6 + np.array(tint[who]) * 0.4
            lit[edge] = tint[who]
        out = PROOF / 'card-trace-preview.png'
        Image.fromarray(lit.astype('uint8')).save(out)
        print(f'wrote {out}   BLUE = furniture, one colour per man')
        for who, _, _, _, _, _ in WHO:
            m = masks.get(who)
            if m is None:
                print(f'  {who:7s} MISSING')
                continue
            ys, xs = np.nonzero(m)
            print(f'  {who:7s} {m.sum():7d} px  bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}')
        print(f'  furniture {int(furn.sum())} px   cluster {int(cluster.sum())} px')
        if unclaimed:
            print(f'  UNCLAIMED components (>1500 px): {unclaimed}')
        return

    OUT.mkdir(parents=True, exist_ok=True)
    rec = {'source': str(SRC.relative_to(ROOT)), 'actors': {}, 'furniture': {}}
    for who, m in masks.items():
        a = np.zeros((*rgb.shape[:2], 4), np.uint8)
        a[:, :, :3] = rgb
        a[:, :, 3] = np.where(m, 255, 0)
        ys, xs = np.nonzero(m)
        crop = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        Image.fromarray(a).crop(crop).save(OUT / f'{who}.png')
        rec['actors'][who] = {'pixels': int(m.sum()), 'cropInMaster': crop}
        print(f'  wrote {who}.png  {crop[2] - crop[0]}x{crop[3] - crop[1]}')
    for tag, m in (('back', back & cluster & ~np.logical_or.reduce(list(masks.values()))),
                   ('mid', table & cluster), ('front', front & cluster)):
        a = np.zeros((*rgb.shape[:2], 4), np.uint8)
        a[:, :, :3] = rgb
        a[:, :, 3] = np.where(m, 255, 0)
        Image.fromarray(a).save(OUT / f'furniture-{tag}.png')
        rec['furniture'][tag] = int(m.sum())
        print(f'  wrote furniture-{tag}.png  {int(m.sum())} px')
    (OUT / 'decompose.json').write_text(json.dumps(rec, indent=1) + '\n')


if __name__ == '__main__':
    main()
