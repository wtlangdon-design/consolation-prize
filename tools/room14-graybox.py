"""Room 14's graybox: ruling 22 steps 1-6, before any art (errata 22).

Boot Hill at errata 54's size: a value block, the walkable band and the gate,
doc 54's subjects as silhouettes, Thad at every depth, and the LEGIBILITY GATE
(rulings 16, 17c, 18a). Nobody else stands here (doc 20).

Night, as every place the map reaches (errata 64a, 64d); the moon and the
town's lights below. Errata 34: elevated three-quarter, as Room 29 -- the
camera above the hill, looking along its rows. Three rows of markers: Mott's
stone at the front, THE NINETEEN's nine boards along the second row, and the
third row at the back, where Pike's board is second from the end (doc 27:
"Third row, second from the end") and the end plot beside him is PIKE'S
NEIGHBOR, the plot dug for Thad in Act III. Every position is a staging
decision under the standing delegation, recorded in errata 87.

Writes renders/room-14-graybox.png, renders/room-14-graybox-with-thad.png,
reference/room-14/layout-1536x1024.png and proofs/room-14/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: an exterior seen from above. The walk band is the grass before
# the front row; a man at its far edge is about 300 and at its near 410
# (0.63 per row), smaller than indoors, so the hill and its rows carry the
# frame and the back row's boards read small.
FAR = (680, 300)
NEAR = (855, 410)

# SURFACES (step 1). Night: the sky darkest, the hillside grass mid, the
# path a step lighter where Thad stands, held to mid-values for his anchors.
SURFACES = [
    ('night sky', (0, 0, 1920, 250), 30),
    ('the town below, far', (0, 250, 700, 90), 44),
    ('hillside grass, far', (0, 250, 1920, 340), 70),
    ('hillside grass, near', (0, 590, 1920, 274), 84),
]
OBJECTS = [
    ('THE GATE', (40, 360, 220, 330), 58, 'behind'),
    ("MOTT'S MARKER", (520, 420, 150, 250), 104, 'behind'),
    ('THE NINETEEN', (760, 470, 760, 140), 62, 'behind'),
    ("PIKE'S MARKER", (1530, 330, 80, 150), 60, 'behind'),
    ('THE THIRD ROW', (900, 330, 600, 120), 64, 'behind'),
    ("PIKE'S NEIGHBOR", (1630, 360, 190, 150), 56, 'behind'),
    ('THE MOON', (1500, 50, 90, 90), 200, 'light'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (330, 780, 'right'), 'before_pike': (1560, 700, 'right')}
WALK = (200, 680, 1620, 175)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE GATE', 'town_map')


def height_at(y):
    (fy, fh), (ny, nh) = FAR, NEAR
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


def main():
    plate = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(plate)
    for _, (x, y, w, h), v in SURFACES:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    # Moonlight on the grass: a broad, faint lift toward the right.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 1300) / 1100) ** 2 + ((yy - 760) / 260) ** 2), 0, 1) * 8
    base = np.asarray(plate).astype(float)
    base[590:] += pool[590:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'light':
            d.ellipse([x, y, x + w, y + h], fill=v)
    for x, y, w, h in BOTTLE_ROWS:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=96)
    plate.save(os.path.join(ROOT, 'renders/room-14-graybox.png'))

    arr = np.asarray(plate).astype(float)
    dark, light = anchors(thad_sprite())
    head_top = int(FAR[0] - FAR[1])
    surfaces = []
    regions = [(n, r) for n, r, _ in SURFACES] + [(n, r) for n, r, _, where in OBJECTS if where in ('behind',)]
    # Only what lies behind the walk band's x-extent can be stood against.
    wx0, wx1 = WALK[0] - 120, WALK[0] + WALK[2] + 120
    for name, (x, y, w, h) in regions:
        y0, y1 = max(y, head_top), min(y + h, NEAR[0])
        x0, x1 = max(x, wx0), min(x + w, wx1)
        if y1 <= y0 or x1 <= x0 or (x1 - x0) * (y1 - y0) < HEAD_AREA:
            continue
        sample = arr[y0:y1, x0:x1].ravel()
        p10, p90 = float(np.percentile(sample, 10)), float(np.percentile(sample, 90))
        dark_margin = p10 - dark
        light_margin = light - p90
        best, other = max(dark_margin, light_margin), min(dark_margin, light_margin)
        verdict = ('strong' if best >= 25 and other >= 25 else 'weak' if best >= 25 and other < 15
                   else 'pass' if best >= 25 else 'FAIL')
        surfaces.append({'surface': name, 'p10': round(p10, 1), 'p90': round(p90, 1),
                         'darkAnchorMargin': round(dark_margin, 1), 'lightAnchorMargin': round(light_margin, 1),
                         'verdict': verdict})
    # Light sources excluded (ruling 18b).
    surfaces = [s for s in surfaces if s['surface'] != 'THE MOON']

    comp = plate.convert('RGB')
    sprite = thad_sprite()
    dd = ImageDraw.Draw(comp)

    def put(x, y, flip=False):
        h = int(round(height_at(y)))
        s = sprite.resize((max(1, round(sprite.width * h / sprite.height)), h), Image.BOX)
        if flip:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        g = s.convert('LA').convert('RGBA')
        comp.paste(g, (x - g.width // 2, y - h), g)
    # Thad at the far edge in front of each wall group, at the near edge, and
    # at the entrance: the six places a player will stand him.
    figures = [(600, FAR[0], False), (1100, 780, False), (1560, FAR[0] + 20, True),
               (330, 790, False), (900, NEAR[0], False), (1700, NEAR[0], True)]
    for x, y, flip in sorted(figures, key=lambda f: f[1]):
        put(x, y, flip)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    wx, wy, ww, wh = WALK
    dd.rectangle([wx, wy, wx + ww, wy + wh], outline=(90, 200, 90), width=3)
    for name, (x, y, _) in MARKS.items():
        dd.ellipse([x - 8, y - 8, x + 8, y + 8], outline=(220, 180, 60), width=3)
    ex = [o for o in OBJECTS if o[0] == EXIT[0]][0][1]
    dd.rectangle([ex[0], ex[1], ex[0] + ex[2], ex[1] + ex[3]], outline=(200, 90, 90), width=3)
    comp.save(os.path.join(ROOT, 'renders/room-14-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at his talk mark before the table: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(1100, 780)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-14'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-14/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 14,
        'note': "Ruling 22 steps 1-6 for Boot Hill, written by tools/room14-graybox.py before any "
                'image operation. Positions and values are the plan the plate is generated against (errata 87).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 5's slope, set for an exterior seen from above"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: every marker has its foot '
                         'above the band\'s back edge, so Thad always passes in front of them and no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-14'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-14/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
