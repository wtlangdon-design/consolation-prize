"""The six interiors' grayboxes (reference/ancillary-interiors/brief.md, errata 183): ruling 22 steps 1-6, before
any art (errata 22), one room at a time, in Room 13's manner.

    python3 tools/interiors-graybox.py 42

A value block, the walkable band and the door, doc 105's subjects as silhouettes, the room's person where they
stand, Thad at every depth, and the LEGIBILITY GATE (rulings 16, 17c, 18a). Night, one visual state, as every
room the town reaches (errata 64a, 183). Every position is a staging decision under the standing delegation,
recorded in errata 183's build section.

Writes renders/room-NN-graybox.png, renders/room-NN-graybox-with-thad.png, reference/room-NN/layout-1536x1024.png
and proofs/room-NN/graybox.json.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864
THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: Room 5's interior numbers, as Room 13's: a standing man of 497 at y 740.
INTERIOR = {'far': (740, 497), 'near': (850, 573), 'from': "Room 5's interior numbers, as Room 13's (tools/room13-graybox.py)"}

ROOMS = {
    42: {
        'id': 'barbers', 'name': "THE BARBER'S",
        'what': "A one-room barber-surgeon's shop off the Lane, at night, lit by one lamp over the chair.",
        'depth': INTERIOR,
        'surfaces': [
            ('ceiling shadow', (0, 0, 1920, 60), 40),
            ('walls, dark plank', (0, 60, 1920, 630), 70),
            ('floor, worn boards', (0, 690, 1920, 174), 84),
        ],
        # name, rect, value, where. 'behind' stands behind the walk band.
        'objects': [
            ('THE DOOR TO THE LANE', (30, 150, 190, 540), 52, 'behind'),
            ('THE PRICE BOARD', (300, 110, 200, 150), 108, 'behind'),
            ('THE MIRROR', (790, 110, 250, 230), 104, 'behind'),
            ('THE CHAIR', (760, 390, 300, 300), 50, 'behind'),
            ('THE CHAIR (its bucket)', (1070, 600, 70, 90), 60, 'behind'),
            ('THE STROP', (690, 190, 50, 230), 92, 'behind'),
            ('THE JAR (on its shelf)', (1300, 220, 260, 120), 96, 'behind'),
            ('THE TRAY (on its stand)', (1300, 450, 260, 240), 58, 'behind'),
            ('THE BARBER (beside the chair)', (1140, 240, 140, 500), 56, 'behind'),
        ],
        'lamp': (900, 780, 700, 160),
        'marks': {'entrance': (260, 790, 'right'), 'talk_barber': (1420, 750, 'left')},
        'walk': (180, 740, 1600, 110),
        'exit': ('THE DOOR TO THE LANE', 'the_lane'),
        'layoutThad': (1420, 750),
        'figures': [(450, 740, False), (700, 800, False), (1500, 740, True), (260, 790, False), (900, 850, False),
                    (1650, 850, True)],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the chair, the tray and the barber are all '
                         'behind it, so no plane is needed.',
        'lightSources': ['THE BARBER'],
    },
}


def height_at(depth, y):
    (fy, fh), (ny, nh) = depth['far'], depth['near']
    return fh + (nh - fh) * (y - fy) / (ny - fy)


def thad_sprite():
    img = Image.open(THAD).convert('RGBA')
    return img.crop(img.getbbox())


def anchors(img):
    a = np.asarray(img).astype(float)
    m = a[..., 3] > 200
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[m]
    s = np.sort(lum)
    return float(s[: int(len(s) * 0.4)].mean()), float(s[int(len(s) * 0.85):].mean())


def build(n):
    r = ROOMS[n]
    depth = r['depth']
    far, near = depth['far'], depth['near']
    plate = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(plate)
    for _, (x, y, w, h), v in r['surfaces']:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    lx, ly, lw, lh = r['lamp']
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - lx) / lw) ** 2 + ((yy - ly) / lh) ** 2), 0, 1) * 10
    base = np.asarray(plate).astype(float)
    base[680:] += pool[680:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in r['objects']:
        if where != 'front':
            d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    plate.save(os.path.join(ROOT, f'renders/room-{n}-graybox.png'))

    arr = np.asarray(plate).astype(float)
    dark, light = anchors(thad_sprite())
    head_top = int(far[0] - far[1])
    head_area = int((far[1] * 0.13) ** 2) * 2
    walk = r['walk']
    surfaces = []
    regions = [(nm, rc) for nm, rc, _ in r['surfaces']] + [(nm, rc) for nm, rc, _, w in r['objects'] if w == 'behind']
    wx0, wx1 = walk[0] - 120, walk[0] + walk[2] + 120
    for name, (x, y, w, h) in regions:
        y0, y1 = max(y, head_top), min(y + h, near[0])
        x0, x1 = max(x, wx0), min(x + w, wx1)
        if y1 <= y0 or x1 <= x0 or (x1 - x0) * (y1 - y0) < head_area:
            continue
        sample = arr[y0:y1, x0:x1].ravel()
        p10, p90 = float(np.percentile(sample, 10)), float(np.percentile(sample, 90))
        dm, lm = p10 - dark, light - p90
        best, other = max(dm, lm), min(dm, lm)
        verdict = ('strong' if best >= 25 and other >= 25 else 'weak' if best >= 25 and other < 15
                   else 'pass' if best >= 25 else 'FAIL')
        surfaces.append({'surface': name, 'p10': round(p10, 1), 'p90': round(p90, 1),
                         'darkAnchorMargin': round(dm, 1), 'lightAnchorMargin': round(lm, 1), 'verdict': verdict})
    surfaces = [s for s in surfaces if not any(s['surface'].startswith(p) for p in r['lightSources'])]

    sprite = thad_sprite()

    def put(img, x, y, flip=False):
        h = int(round(height_at(depth, y)))
        s = sprite.resize((max(1, round(sprite.width * h / sprite.height)), h), Image.BOX)
        if flip:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        g = s.convert('LA').convert('RGBA')
        img.paste(g, (x - g.width // 2, y - h), g)

    comp = plate.convert('RGB')
    dd = ImageDraw.Draw(comp)
    for x, y, flip in sorted(r['figures'], key=lambda f: f[1]):
        put(comp, x, y, flip)
    wx, wy, ww, wh = walk
    dd.rectangle([wx, wy, wx + ww, wy + wh], outline=(90, 200, 90), width=3)
    for name, (x, y, _) in r['marks'].items():
        dd.ellipse([x - 8, y - 8, x + 8, y + 8], outline=(220, 180, 60), width=3)
    ex = [o for o in r['objects'] if o[0] == r['exit'][0]][0][1]
    dd.rectangle([ex[0], ex[1], ex[0] + ex[2], ex[1] + ex[3]], outline=(200, 90, 90), width=3)
    comp.save(os.path.join(ROOT, f'renders/room-{n}-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox with ONE Thad (six would be painted as
    # six people), in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's crop x 8, y 170, 1520x684).
    one = plate.convert('RGB')
    put(one, *r['layoutThad'])
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, f'reference/room-{n}'), exist_ok=True)
    lay.save(os.path.join(ROOT, f'reference/room-{n}/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': n,
        'note': f"Ruling 22 steps 1-6 for {r['name']}, written by tools/interiors-graybox.py before any image "
                'operation. Positions and values are the plan the plate is generated against (errata 183).',
        'what': r['what'],
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1), 'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': far[0], 'height': far[1]}, 'near': {'y': near[0], 'height': near[1]}, 'from': depth['from']},
        'walkable': list(walk),
        'exit': {'hotspot': r['exit'][0], 'to': r['exit'][1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in r['marks'].items()},
        'objects': [{'name': nm, 'rect': list(rc), 'where': w} for nm, rc, _, w in r['objects']],
        'occluders': [],
        'occlusionNote': r['occlusionNote'],
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, f'proofs/room-{n}'), exist_ok=True)
    with open(os.path.join(ROOT, f'proofs/room-{n}/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  "
              f"dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    build(int(sys.argv[1]))
