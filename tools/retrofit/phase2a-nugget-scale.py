"""PHASE 2A: THE NUGGET'S DEPTH SCALE, three candidates, measured (doc 36 Q126).

    python3 tools/retrofit/phase2a-nugget-scale.py

Tyler: "Thad looks too small next to the bar." Thad's art is frozen, so the
room is what changes. This composites the ACCEPTED Thad frame over the ACCEPTED
plate at seven positions under each candidate and reports, per sample, his
rendered height and where the nearest dimensioned thing falls on him as a
fraction of his stature -- which is the test doc 36 Q126 states in words:
the counter should read at waist or lower ribs, never across the upper chest.

The measurements the candidates are built from are
reference/room-03-candidate/furniture-measurements.json; the candidates
themselves are scale-candidates.json beside it. Nothing here writes an asset.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
PLATE = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
THAD = 'art/actors/thad-stand-front/stand-00.png'
THAD_H = 626        # content/actors/thad.json, clip "stand": figureHeight
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    SM = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    F = SM = T = ImageFont.load_default()

SPEC = json.load(open('reference/room-03-candidate/scale-candidates.json'))
MEAS = json.load(open('reference/room-03-candidate/furniture-measurements.json'))
ITEMS = {one['id']: one for one in MEAS['items']}
BAR = ITEMS['bar_counter']

# The seven positions the brief names, on the floor, the same for every
# candidate. The two bar samples stand where candidate C's floor reaches and
# where A's and B's do not -- which is the comparison.
SAMPLES = [
    ('front-doors', 330, 760, None),
    ('by-the-piano', 600, 560, 'piano'),
    ('at-the-card-table', 860, 545, 'card_table'),
    ('near-the-stove', 1120, 560, None),
    ('middle-bar', 1470, 745, 'bar_counter'),
    ('bar-end', 1540, 800, 'bar_counter'),
    ('near-foreground', 700, 840, None),
]
# THE TWO BAR SAMPLES ARE WHERE CANDIDATE C'S COMPILED FLOOR ACTUALLY REACHES
# -- (1470,745) in floor_4_1 and (1540,800) in floor_5 -- not where one would
# like it to. Under A and B the same click lands wherever the OLD outline
# stopped, which is the comparison: the old floor turns in at 1170-1379 and
# leaves him looking at the counter from out in the room.
CURRENT_EDGE = [(506, 1200), (690, 1170), (750, 1320), (800, 1390), (864, 1400)]


def edge_at(y):
    for (y0, x0), (y1, x1) in zip(CURRENT_EDGE, CURRENT_EDGE[1:]):
        if y0 <= y <= y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    return CURRENT_EDGE[-1][1]


def line_at(pair, x):
    (x0, y0), (x1, y1) = pair
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def height_at(curve, y):
    far, near = curve['far'], curve['near']
    t = (y - far['y']) / (near['y'] - far['y'])
    return far['height'] + t * (near['height'] - far['height'])


def place(candidate):
    """Feet positions for this candidate: C reaches the bar, A and B do not."""
    out = []
    for name, x, y, thing in SAMPLES:
        px = x
        if candidate['floor'] == 'current':
            limit = edge_at(y) - 30      # 30 px so he is not standing on the seam
            px = min(x, limit)
        out.append((name, int(round(px)), y, thing))
    return out


def rows_for(candidate):
    rows = []
    for name, x, y, thing in place(candidate):
        h = height_at(candidate, y)
        row = {'sample': name, 'feet': [x, y], 'height': round(h, 1)}
        if thing == 'bar_counter':
            top = line_at(BAR['topLine'], x if x > 1200 else 1205)
            base = line_at(BAR['baseLine'], x if x > 1205 else 1205)
            row['counterTopY'] = round(top, 1)
            row['counterBaseY'] = round(base, 1)
            row['gapToBar'] = round(max(0.0, line_at(BAR['baseLine'], x) - y) * 0 + 0, 1)
            # WHERE THE COUNTER'S TOP EDGE FALLS ON HIM, as a fraction of stature.
            row['onHim'] = round((y - top) / h, 3)
            row['reads'] = reads(row['onHim'])
        elif thing:
            item = ITEMS[thing]
            row['thing'] = thing
            row['onHim'] = round((y - item['topY']) / h, 3)
            row['reads'] = reads(row['onHim'])
        rows.append(row)
    return rows


def reads(fraction):
    if fraction < 0.50: return 'below the hip'
    if fraction < 0.60: return 'hip'
    if fraction <= 0.72: return 'waist / lower ribs  <-- the target'
    if fraction <= 0.82: return 'upper chest'
    if fraction <= 0.95: return 'shoulders'
    return 'over his head'


def composite(candidate):
    im = Image.open(PLATE).convert('RGBA')
    thad = Image.open(THAD).convert('RGBA')
    d = ImageDraw.Draw(im, 'RGBA')
    if candidate['floor'] == 'extended':
        pts = [(x, y) for x, y in SPEC['barBaseLine']]
        d.line(pts, fill=(120, 255, 160, 200), width=3)
    for name, x, y, _ in place(candidate):
        h = height_at(candidate, y)
        scale = h / THAD_H
        # Premultiply before the resize, doc 38 R4: transparent pixels are
        # stored black and an unpremultiplied resize drags edges toward it.
        r, g, b, a = thad.split()
        pm = Image.merge('RGB', (
            Image.composite(r, Image.new('L', thad.size, 0), a),
            Image.composite(g, Image.new('L', thad.size, 0), a),
            Image.composite(b, Image.new('L', thad.size, 0), a)))
        size = (max(1, round(thad.width * scale)), max(1, round(thad.height * scale)))
        pm = pm.resize(size, Image.LANCZOS)
        aa = a.resize(size, Image.LANCZOS)
        px = pm.load(); ap = aa.load()
        un = Image.new('RGBA', size)
        up = un.load()
        for j in range(size[1]):
            for i in range(size[0]):
                al = ap[i, j]
                if al == 0:
                    continue
                cr, cg, cb = px[i, j]
                up[i, j] = (min(255, cr * 255 // al), min(255, cg * 255 // al),
                            min(255, cb * 255 // al), al)
        feet = round(THAD_H * scale)
        im.alpha_composite(un, (int(x - size[0] / 2), int(y - feet)))
        d.line([x - 22, y, x + 22, y], fill=(255, 235, 120, 230), width=2)
        d.text((x - 20, y + 4), f'{name} {round(h)}px', fill=(255, 235, 120), font=SM)
    return im.convert('RGB')


def sheet(out, title, items, cols, note=None):
    fw = max(im.width for im, _ in items)
    fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols
    nh = 28 if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * 12,
                               52 + nh + rows * (fh + 46 + 12) + 12), (22, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((12, 14), title, fill=(236, 236, 240), font=T)
    if note:
        d.text((12, 48), note, fill=(190, 190, 200), font=F)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols)
        x = 12 + c * (fw + 12)
        y = 52 + nh + r * (fh + 46 + 12)
        canvas.paste(im, (x, y))
        d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=F)
    canvas.save(out, 'WEBP', quality=88, method=6)
    print(out, canvas.size)


report = {'schema': 1, 'room': 'nugget_candidate', 'candidates': []}
items = []
for candidate in SPEC['candidates']:
    rows = rows_for(candidate)
    report['candidates'].append({
        'id': candidate['id'], 'label': candidate['label'],
        'far': candidate['far'], 'near': candidate['near'], 'floor': candidate['floor'],
        'samples': rows})
    im = composite(candidate).resize((960, 432), Image.LANCZOS)
    items.append((im, f"{candidate['id']} -- {candidate['label']}"))
    print(f"\n{candidate['id']}  {candidate['label']}")
    for row in rows:
        extra = f"   counter on him {row['onHim']}  ({row['reads']})" if 'onHim' in row else ''
        print(f"   {row['sample']:20s} feet {row['feet'][0]:5d},{row['feet'][1]:3d}  "
              f"{row['height']:6.1f}px{extra}")

os.makedirs('proofs/room-03', exist_ok=True)
json.dump(report, open('proofs/room-03/phase2a-scale-study.json', 'w'), indent=1)
print('\nproofs/room-03/phase2a-scale-study.json')
sheet(f'{OUT}/phase2a-nugget-scale.webp',
      'PHASE 2A  The Nugget: three depth models, the same Thad, the same seven places',
      items, 1,
      'Thad art unchanged in all three. A = current. B = the curve rescaled 1.145 (the median of '
      'eight furniture readings). C = B, and the floor carried up to the bar.')
