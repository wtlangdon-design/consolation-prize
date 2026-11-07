"""Rooms 43 and 44, Lower Street and the Lane: ruling 22 steps 1-6, before any art.

Errata 43 made the town three walked streets: Main Street, LOWER STREET (2b)
east of it through the receding road, and THE LANE (2c) off Main Street's
alley, connecting through to Lower Street at its far end, so the three are a
loop. Neither was built. Tyler, 2026-11-07, offered Lower Street, both, or
waiting: "Lower Street and the Lane". Errata 161 records every position
below as a staging decision under the standing delegation.

Both are night (errata 64a: they inherit Main Street's), one screen each,
1920 x 864, frontal false fronts on a mud street, at Room 20's exterior depth.

Writes, per room: renders/room-NN-graybox.png, renders/room-NN-graybox-with-thad.png,
reference/room-NN/layout-1536x1024.png and proofs/room-NN/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864
THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# Room 20's exterior depth (the back alley, the street's own backs).
FAR = (705, 258)
NEAR = (858, 362)

STREETS = {
    43: {
        'id': 'lower_street',
        'name': 'LOWER STREET',
        'surfaces': [
            ('night sky', (0, 0, 1920, 220), 34),
            ('the fronts', (0, 220, 1920, 470), 76),
            ('the street', (0, 690, 1920, 174), 92),
        ],
        # name, rect, value, where. Doors and gaps are exits (see EXITS).
        'objects': [
            ('THE ROAD BACK TO MAIN STREET', (0, 300, 150, 390), 104, 'behind'),
            ("THE REGISTRAR'S", (170, 300, 340, 390), 62, 'behind'),
            ("THE REGISTRAR'S DOOR", (225, 380, 95, 310), 52, 'behind'),
            ("SUMP'S WINDOW", (355, 420, 120, 130), 104, 'behind'),
            ('THE ALLEY MOUTH', (530, 330, 90, 360), 50, 'behind'),
            ('THE CHURCH', (640, 160, 460, 530), 96, 'behind'),
            ('THE BELFRY', (810, 60, 120, 140), 90, 'behind'),
            ('THE CHURCH DOOR', (812, 360, 116, 300), 56, 'behind'),
            ('THE CHURCH STEPS', (780, 660, 180, 30), 100, 'behind'),
            ('THE BELL', (985, 470, 85, 220), 60, 'behind'),
            ('THE PASSAGE TO THE LANE', (1120, 360, 90, 330), 50, 'behind'),
            ('THE LIVERY', (1230, 230, 500, 460), 70, 'behind'),
            ('THE LIVERY DOORS', (1380, 330, 220, 360), 52, 'behind'),
            ('THE HAY LOFT', (1445, 240, 90, 80), 56, 'behind'),
            ('THE TROUGH', (1620, 610, 120, 70), 62, 'behind'),
            ('THE ROAD OUT', (1760, 330, 160, 360), 104, 'behind'),
        ],
        'walk': (160, 712, 1610, 140),
        'marks': {'from_main_street': (120, 790, 'right'), 'by_the_steps': (900, 740, 'left'),
                  'from_the_road_out': (1820, 800, 'left')},
        'exits': [('THE ROAD BACK TO MAIN STREET', 'main_street'), ("THE REGISTRAR'S DOOR", 'claims_registrar'),
                  ('THE ALLEY MOUTH', 'back_alley'), ('THE CHURCH DOOR', 'church'),
                  ('THE PASSAGE TO THE LANE', 'the_lane'), ('THE LIVERY DOORS', 'livery'),
                  ('THE ROAD OUT', 'claims_road')],
        'thad': (700, 760),
        'figures': [(450, 712, False), (900, 740, False), (1500, 712, True), (120, 790, False),
                    (1150, 852, False), (1800, 852, True)],
        'other': 'the bell-ringer, on the church steps beside the bell (doc 07 #4)',
        'occlusionNote': 'Nothing stands nearer the camera than the walk band: the steps, the bell post and the '
                         'trough stand behind it, so no plane is needed.',
    },
    44: {
        'id': 'the_lane',
        'name': 'THE LANE',
        'surfaces': [
            ('night sky', (0, 0, 1920, 200), 34),
            ('the fronts', (0, 200, 1920, 500), 74),
            ('the lane', (0, 700, 1920, 164), 90),
        ],
        'objects': [
            ('THE WAY BACK TO MAIN STREET', (0, 300, 140, 400), 104, 'behind'),
            ("THE UNDERTAKER'S", (160, 260, 360, 440), 60, 'behind'),
            ("THE UNDERTAKER'S DOOR", (285, 390, 100, 310), 48, 'behind'),
            ('THE COFFIN BY THE DOOR', (405, 420, 75, 280), 84, 'behind'),
            ("THE PHOTOGRAPHER'S", (540, 240, 320, 460), 66, 'behind'),
            ("THE PHOTOGRAPHER'S WINDOW", (575, 400, 180, 170), 104, 'behind'),
            ("OZYMANDIA'S TENT", (890, 330, 340, 370), 100, 'behind'),
            ('THE TENT FLAP', (1010, 430, 110, 270), 64, 'behind'),
            ("THE BARBER'S", (1260, 270, 240, 430), 72, 'behind'),
            ("THE BARBER'S POLE", (1270, 420, 30, 200), 104, 'behind'),
            ('THE EMPTY STOREFRONT', (1520, 270, 240, 430), 58, 'behind'),
            ('THE PASSAGE TO LOWER STREET', (1780, 320, 140, 380), 50, 'behind'),
        ],
        'walk': (150, 720, 1640, 132),
        'marks': {'from_main_street': (110, 800, 'right'), 'by_the_tent': (1060, 760, 'left'),
                  'from_lower_street': (1840, 800, 'left')},
        'exits': [('THE WAY BACK TO MAIN STREET', 'main_street'), ("THE UNDERTAKER'S DOOR", 'undertaker'),
                  ('THE TENT FLAP', 'ozymandias_tent'), ('THE PASSAGE TO LOWER STREET', 'lower_street')],
        'thad': (720, 770),
        'figures': [(450, 720, False), (1060, 760, False), (1500, 720, True), (110, 800, False),
                    (1150, 852, False), (1800, 852, True)],
        'other': 'nobody',
        'occlusionNote': 'Nothing stands nearer the camera than the walk band, so no plane is needed.',
    },
}


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


def build(number, spec):
    plate = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(plate)
    for _, (x, y, w, h), v in spec['surfaces']:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    for name, (x, y, w, h), v, where in spec['objects']:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    os.makedirs(os.path.join(ROOT, 'renders'), exist_ok=True)
    plate.save(os.path.join(ROOT, f'renders/room-{number}-graybox.png'))

    arr = np.asarray(plate).astype(float)
    sprite = thad_sprite()
    dark, light = anchors(sprite)
    head_top = int(FAR[0] - FAR[1])
    wx, wy, ww, wh = spec['walk']
    surfaces = []
    regions = [(n, r) for n, r, _ in spec['surfaces']] + [(n, r) for n, r, _, _ in spec['objects']]
    head_area = int((FAR[1] * 0.13) ** 2) * 2
    for name, (x, y, w, h) in regions:
        y0, y1 = max(y, head_top), min(y + h, NEAR[0])
        x0, x1 = max(x, wx - 120), min(x + w, wx + ww + 120)
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

    def put(img, x, y, flip=False):
        h = int(round(height_at(y)))
        s = sprite.resize((max(1, round(sprite.width * h / sprite.height)), h), Image.BOX)
        if flip:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        g = s.convert('LA').convert('RGBA')
        img.paste(g, (x - g.width // 2, y - h), g)

    comp = plate.convert('RGB')
    for x, y, flip in sorted(spec['figures'], key=lambda f: f[1]):
        put(comp, x, y, flip)
    dd = ImageDraw.Draw(comp)
    dd.rectangle([wx, wy, wx + ww, wy + wh], outline=(90, 200, 90), width=3)
    for _, (x, y, _) in spec['marks'].items():
        dd.ellipse([x - 8, y - 8, x + 8, y + 8], outline=(220, 180, 60), width=3)
    rects = {n: r for n, r, _, _ in spec['objects']}
    for name, _ in spec['exits']:
        x, y, w, h = rects[name]
        dd.rectangle([x, y, x + w, y + h], outline=(200, 90, 90), width=3)
    comp.save(os.path.join(ROOT, f'renders/room-{number}-graybox-with-thad.png'))

    # THE LAYOUT the composition master is drawn against: ONE Thad, the scale
    # anchor and the style standard, in derive.mjs's 20:9 safe band.
    one = plate.convert('RGB')
    put(one, *spec['thad'])
    lay = Image.new('RGB', (1536, 1024), (150, 150, 150))
    lay.paste(one.resize((1520, 684), Image.LANCZOS), (8, 170))
    os.makedirs(os.path.join(ROOT, f'reference/room-{number}'), exist_ok=True)
    lay.save(os.path.join(ROOT, f'reference/room-{number}/layout-1536x1024.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': number,
        'id': spec['id'],
        'note': f'Ruling 22 steps 1-6 for {spec["name"]}, written by tools/streets-graybox.py before any image '
                'operation. Positions and values are the plan the plate is generated against (errata 161).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1), 'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]},
                  'from': "Room 20's exterior depth"},
        'walkable': list(spec['walk']),
        'exits': [{'hotspot': n, 'to': to, 'rect': list(rects[n])} for n, to in spec['exits']],
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in spec['marks'].items()},
        'objects': [{'name': n, 'rect': list(r)} for n, r, _, _ in spec['objects']],
        'otherFigures': spec['other'],
        'occluders': [],
        'occlusionNote': spec['occlusionNote'],
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, f'proofs/room-{number}'), exist_ok=True)
    with open(os.path.join(ROOT, f'proofs/room-{number}/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(number, spec['name'], 'legibility', out['legibilityGate'])
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:34} dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    for number, spec in STREETS.items():
        build(number, spec)
