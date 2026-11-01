"""Room 4's graybox: ruling 22 steps 1-6, before any art (errata 22).

The Nugget's back room as masses only -- a value block, the walkable band and
the exit, the objects as silhouettes, Thad at every depth and at his duel mark,
the occluders -- and the LEGIBILITY GATE run against it (rulings 16, 17c, 18a):
every surface Thad can stand in front of is measured, and each of his two
anchors reports its margin. The plan is what the plate is generated against,
so a room that would bury him is re-blocked here, not re-lit later.

Every position here is a staging decision under the standing delegation,
recorded in errata 76 B and C; every object is doc 54's merged eleven.

Writes renders/room-04-graybox.png, renders/room-04-graybox-with-thad.png and
proofs/room-04/graybox.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 864

# Thad's two anchors, measured from his idle frames (dark mass: bottom 40% of
# opaque pixels; light mass: top 15%). Ruling 16 rule 3.
THAD = os.path.join(ROOT, 'art/actors/thad-idle-right/idle-00.png')

# THE DEPTH: a small room ("everyone's knees nearly touching", doc 09), so the
# camera sits close, as in Room 5. Far edge of the walkable floor and the
# near edge, with Thad's drawn height at each.
FAR = (610, 420)
NEAR = (840, 520)

# SURFACES: (name, rect, planned luminance). Grayscale only (step 1).
SURFACES = [
    ('ceiling shadow', (0, 0, 1920, 110), 38),
    ('back wall, painted plank', (0, 110, 1920, 330), 80),
    ('wainscot', (0, 440, 1920, 160), 66),
    ('floor, scored boards', (0, 600, 1920, 264), 82),
]
# OBJECTS, as silhouettes (step 3): name, rect, luminance, behind Thad or in front.
OBJECTS = [
    ('THE DOOR TO THE BAR', (70, 190, 210, 430), 64, 'behind'),
    ('THE SCOREBOARD', (360, 150, 300, 230), 62, 'behind'),
    ('THE CHALK', (470, 384, 60, 18), 150, 'behind'),
    ('THE WINDOW, PAINTED OVER', (1470, 150, 190, 230), 88, 'behind'),
    ('THE LAMP OVER THE TABLE', (930, 230, 90, 70), 210, 'behind'),
    ('THE LONG TABLE', (700, 450, 560, 150), 70, 'behind'),
    ('THE SECOND RULEBOOK', (1150, 440, 70, 22), 120, 'behind'),
    ('THE JUDGES\' PENCIL', (900, 446, 40, 10), 130, 'behind'),
    ('THE CHAIRS (challenger)', (610, 520, 80, 130), 56, 'behind'),
    ('THE CHAIRS (champion)', (1270, 520, 80, 130), 56, 'behind'),
    ('THE RING OF CHAIRS (back)', (1700, 470, 160, 170), 56, 'behind'),
    ('THE RING OF CHAIRS (near left)', (0, 760, 230, 104), 44, 'front'),
    ('THE RING OF CHAIRS (near right)', (1700, 760, 220, 104), 44, 'front'),
    ('THE SPIT LINE', (952, 640, 16, 200), 100, 'floor'),
]
# The judges sit behind the table, out of the lamp's pool (doc 05: "leaves the
# judges dark"). People, so sprites, never plate (doc 35): drawn here only as
# placement masses.
JUDGES = [(760, 330, 110, 170), (925, 320, 110, 180), (1090, 330, 110, 170)]
# STAGING MARKS (errata 23's actor_staging_marks): the duel. "Not across the
# line" (doc 54) puts Vessel on the far side of the spit line from Thad.
MARKS = {
    'entrance': (250, 700, 'right'),
    'thad_duel': (780, 740, 'right'),
    'vessel_duel': (1140, 740, 'left'),
}
WALK = (60, 600, 1860, 240)   # x, y, w, h
# His head at the far edge: about 0.13 of his height square.
HEAD_AREA = int((FAR[1] * 0.13) ** 2) * 2
EXIT = ('THE DOOR TO THE BAR', 'nugget')


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
    # The lamp's pool on the floor, centred under the shade: the duel is lit.
    pool = np.zeros((H, W))
    yy, xx = np.mgrid[0:H, 0:W]
    pool = np.clip(1 - (((xx - 975) / 520) ** 2 + ((yy - 760) / 170) ** 2), 0, 1) * 12
    base = np.asarray(plate).astype(float)
    base[600:] += pool[600:]
    plate = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(plate)
    for name, (x, y, w, h), v, _ in OBJECTS:
        if 'RING OF CHAIRS (near' in name:
            continue
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=v)
    plate.save(os.path.join(ROOT, 'renders/room-04-graybox.png'))

    # Measure every surface Thad can stand in front of: the band his body
    # covers from the walkable floor's far edge to its near edge.
    arr = np.asarray(plate).astype(float)
    dark, light = anchors(thad_sprite())
    head_top = int(FAR[0] - FAR[1])
    surfaces = []
    regions = [(n, r) for n, r, _ in SURFACES] + [(n, r) for n, r, _, where in OBJECTS if where == 'behind']
    for name, (x, y, w, h) in regions:
        y0, y1 = max(y, head_top), min(y + h, NEAR[0])
        # A SURFACE IS SOMETHING HE CAN BE LOST AGAINST. An accent smaller
        # than his head at the far edge (the pencil, the rulebook on the
        # table) cannot hide him, and ruling 17c measures surfaces.
        if y1 <= y0 or w * (y1 - y0) < HEAD_AREA:
            continue
        sample = arr[y0:y1, x:x + w].ravel()
        p10, p90 = float(np.percentile(sample, 10)), float(np.percentile(sample, 90))
        dark_margin = p10 - dark
        light_margin = light - p90
        best, other = max(dark_margin, light_margin), min(dark_margin, light_margin)
        verdict = ('strong' if best >= 25 and other >= 25 else 'weak' if best >= 25 and other < 15
                   else 'pass' if best >= 25 else 'FAIL')
        surfaces.append({'surface': name, 'p10': round(p10, 1), 'p90': round(p90, 1),
                         'darkAnchorMargin': round(dark_margin, 1), 'lightAnchorMargin': round(light_margin, 1),
                         'verdict': verdict})
    # Light sources excluded (ruling 18b): the lamp and the chalk are sources/accents, not surfaces stood against.
    surfaces = [s for s in surfaces if s['surface'] not in ('THE LAMP OVER THE TABLE', 'THE CHALK')]

    # Composite: Thad at the far edge, the duel marks and the near edge; the
    # near-left ring chair drawn OVER him (the occlusion test, step 5).
    comp = plate.convert('RGB')
    sprite = thad_sprite()
    dd = ImageDraw.Draw(comp)
    # Back to front: the judges sit behind the table, so they go down first
    # and the table over their lower halves; then the figures by depth; then
    # the near ring of chairs, which must draw OVER him (step 5).
    for x, y, w, h in JUDGES:
        dd.rectangle([x, y, x + w, y + h], fill=(40, 40, 40))
    tx0, ty0, tw, th = [o[1] for o in OBJECTS if o[0] == 'THE LONG TABLE'][0]
    dd.rectangle([tx0, ty0, tx0 + tw, ty0 + th], fill=(70, 70, 70))
    def put(x, y, flip=False):
        h = int(round(height_at(y)))
        s = sprite.resize((max(1, round(sprite.width * h / sprite.height)), h), Image.BOX)
        if flip:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        g = s.convert('LA').convert('RGBA')
        comp.paste(g, (x - g.width // 2, y - h), g)
    tx, ty, _ = MARKS['thad_duel']
    vx, vy, _ = MARKS['vessel_duel']
    figures = [(420, FAR[0], False), (1500, FAR[0], False), (150, NEAR[0] - 40, False),
               (tx, ty, False), (vx, vy, True)]  # the last: a figure at Vessel's mark, for reach and scale
    for x, y, flip in sorted(figures, key=lambda f: f[1]):
        put(x, y, flip)
    for name, (x, y, w, h), v, where in OBJECTS:
        if where == 'front':
            dd.rectangle([x, y, x + w, y + h], fill=(v, v, v))
    wx, wy, ww, wh = WALK
    dd.rectangle([wx, wy, wx + ww, wy + wh], outline=(90, 200, 90), width=3)
    for name, (x, y, _) in MARKS.items():
        dd.ellipse([x - 8, y - 8, x + 8, y + 8], outline=(220, 180, 60), width=3)
    dd.rectangle([70, 190, 280, 620], outline=(200, 90, 90), width=3)
    comp.save(os.path.join(ROOT, 'renders/room-04-graybox-with-thad.png'))

    worst = [s for s in surfaces if s['verdict'] in ('weak', 'FAIL')]
    out = {
        'room': 4,
        'note': 'Ruling 22 steps 1-6 for the Nugget back room, written by tools/room04-graybox.py before any '
                'image operation. Positions and values are the plan the plate is generated against (errata 76 B, C).',
        'thadAnchors': {'dark': round(dark, 1), 'light': round(light, 1),
                        'source': os.path.relpath(THAD, ROOT)},
        'depth': {'far': {'y': FAR[0], 'height': FAR[1]}, 'near': {'y': NEAR[0], 'height': NEAR[1]}},
        'walkable': WALK,
        'exit': {'hotspot': EXIT[0], 'to': EXIT[1], 'rect': [70, 190, 210, 430]},
        'marks': {k: {'x': v[0], 'y': v[1], 'facing': v[2]} for k, v in MARKS.items()},
        'judges': JUDGES,
        'occluders': [o[0] for o in OBJECTS if o[3] == 'front'],
        'surfaces': surfaces,
        'legibilityGate': 'PASS' if not worst else 'REVIEW',
        'weakOrFailing': worst,
    }
    os.makedirs(os.path.join(ROOT, 'proofs/room-04'), exist_ok=True)
    with open(os.path.join(ROOT, 'proofs/room-04/graybox.json'), 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(json.dumps({k: out[k] for k in ('thadAnchors', 'legibilityGate')}, indent=1))
    for s in surfaces:
        print(f"  {s['verdict']:6} {s['surface']:30} p10 {s['p10']:5} p90 {s['p90']:5}  dark {s['darkAnchorMargin']:6} light {s['lightAnchorMargin']:6}")


if __name__ == '__main__':
    main()
