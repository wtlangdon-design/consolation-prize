"""Room 16's graybox: ruling 22 steps 1-6, before any art (errata 22).

Madame Ozymandia's tent at errata 54's size: a value block, the walkable band
and the flap, the merged subjects as silhouettes (eighteen), Ozymandia behind
her round table, Thad at every depth, and the LEGIBILITY GATE.

Night (errata 64a); the red lantern hung centre (doc 05: "It makes everyone's
face look like a secret being kept") and the stove. Bare earth for a floor
("She has chosen not to have a floor"). The table is round; she sits at the
head anyway, before the curtain, the client's cushions on the near side.
Every position is a staging decision under the standing delegation, recorded
in errata 89.

Writes renders/room-16-graybox.png, renders/room-16-graybox-with-thad.png,
reference/room-16/layout-1536x1024.png and proofs/room-16/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: an interior like Room 13's, a little smaller: 440 at the band's
# far edge, 516 at its near (0.69 per row, Room 5's slope).
FAR = (745, 440)
NEAR = (855, 516)

# SURFACES (step 1). Painted canvas in red lantern light, held to mid-values
# where Thad stands; bare earth below.
SURFACES = [
    ('tent roof, in shadow', (0, 0, 1920, 140), 38),
    ('tent walls, painted canvas', (0, 140, 1920, 560), 78),
    ('the ground, bare earth', (0, 700, 1920, 164), 90),
]
OBJECTS = [
    ('THE FLAP TO OUTSIDE', (20, 150, 240, 550), 56, 'behind'),
    ('THE TESTIMONIAL BOARD', (300, 200, 150, 190), 104, 'behind'),
    ('THE PRICE LIST', (470, 220, 100, 120), 104, 'behind'),
    ('THE INCENSE BURNER', (600, 560, 70, 140), 60, 'behind'),
    ('THE CUSHIONS', (620, 640, 150, 70), 70, 'behind'),
    ('THE CURTAIN', (800, 120, 320, 450), 52, 'behind'),
    ('THE LANTERN, RED', (930, 40, 60, 90), 210, 'light'),
    ('MADAME OZYMANDIA (behind the table)', (880, 250, 160, 300), 60, 'behind'),
    ("MADAME OZYMANDIA'S TABLE", (760, 520, 400, 180), 66, 'behind'),
    ('THE CRYSTAL BALL', (925, 450, 70, 75), 110, 'behind'),
    ('THE CARDS', (800, 500, 60, 25), 100, 'behind'),
    ('THE TEA SERVICE', (1050, 480, 80, 45), 96, 'behind'),
    ('THE MONEY BOX', (1130, 495, 60, 35), 58, 'behind'),
    ('THE SECOND ROD', (900, 640, 110, 50), 62, 'behind'),
    ('THE BRASS ROD', (1190, 360, 40, 340), 104, 'behind'),
    ('THE STOVE', (1300, 480, 130, 220), 46, 'behind'),
    ('THE CHART', (1560, 180, 200, 230), 100, 'behind'),
]
BOTTLE_ROWS = []
MARKS = {'entrance': (300, 790, 'right'), 'talk_ozymandia': (720, 790, 'right')}
WALK = (220, 745, 1660, 110)
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE FLAP TO OUTSIDE', 'town_map')


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
    # The red lantern, centre: a pool on the floor before it.
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 960) / 900) ** 2 + ((yy - 780) / 200) ** 2), 0, 1) * 10
    base = np.asarray(plate).astype(float)
    base[680:] += pool[680:]
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
    plate.save(os.path.join(ROOT, 'renders/room-16-graybox.png'))

    arr = np.asarray(plate).astype(float)
    dark, light = anchors(thad_sprite())
    head_top = int(FAR[0] - FAR[1])
    surfaces = []
    regions = [(n, r) for n, r, _ in SURFACES] + [(n, r) for n, r, _, where in OBJECTS if where == 'behind']
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
    surfaces = [s for s in surfaces if not s['surface'].startswith('MADAME OZYMANDIA (')]

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
    figures = [(450, FAR[0], False), (720, 790, False), (1600, FAR[0], True),
               (300, 790, False), (1250, NEAR[0], False), (1750, NEAR[0], True)]
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
    comp.save(os.path.join(ROOT, 'renders/room-16-graybox-with-thad.png'))

    # THE LAYOUT the composition master is generated against: the graybox
    # with Thad, in the 20:9 safe region of a 1536x1024 canvas (derive.mjs's
    # crop x 8, y 170, 1520x684), margins a flat lighter grey.
    # ONE Thad, at his talk mark before the table: the scale anchor
    # and the style standard. Six would be painted as six people.
    one = plate.convert('RGB')
    comp_all = comp
    comp = one
    dd = ImageDraw.Draw(comp)
    put(720, 790)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    comp = comp_all
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, 'reference/room-16'), exist_ok=True)
    lay.save(os.path.join(ROOT, 'reference/room-16/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 16,
        'note': "Ruling 22 steps 1-6 for Ozymandia's tent, written by tools/room16-graybox.py before any "
                'image operation. Positions and values are the plan the plate is generated against (errata 89).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 5's slope, a little smaller than Room 13's"},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': list(ex)},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'objects': [{'name': n, 'rect': list(r), 'where': w} for n, r, _, w in OBJECTS],
        'occluders': [],
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the table, the stove and the '
                         'cushions are behind it, and Ozymandia is cut at her table top, so no plane is needed.',
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-16'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-16/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:38} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
