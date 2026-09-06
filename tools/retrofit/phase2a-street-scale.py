"""PHASE 2A: MAIN STREET'S HUMAN SCALE, with Thad as the ruler (doc 36 Q127).

    python3 tools/retrofit/phase2a-street-scale.py

The architecture was rebuilt to the right human scale and the people were not.
Every ambient in this game was blitted 1:1 -- source rect to destination rect --
so a sheet drawn 157 px tall stayed 157 px tall in a street where a man at that
depth is 231. All three of Main Street's humans render at about two thirds of
Thad. This sheet puts each of them beside him at the same depth, at the size
the room's own curve asks for, so the question doc 36 Q127 has to answer can be
looked at: does this design still belong beside Thad when it is the right size?

Nothing here writes an asset and no image operation is made.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
THAD = 'art/actors/thad-stand-front/stand-00.png'
THAD_H = 626
ROOM = json.load(open('content/rooms/main-street-candidate.json'))
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    SM = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    F = SM = T = ImageFont.load_default()

# The room's own curve, from the walk boxes the compiler wrote.
CURVE = next(b['scaleMode'] for b in ROOM['walkBoxes'] if b['scaleMode']['kind'] == 'curve')


def man_at(y):
    c = CURVE
    t = (y - c['farY']) / (c['nearY'] - c['farY'])
    return c['farHeight'] + t * (c['nearHeight'] - c['farHeight'])


# WHERE THEY STAND AFTER PHASE 2A, and why. Canon first (each character's own
# placeNote), then the frozen rail rule, then a legal approach for Thad.
STAGING = json.load(open('reference/room-02-candidate/street-staging.json'))


def scaled(path, frame, target_h, drawn_h):
    im = Image.open(path).convert('RGBA')
    if frame:
        im = im.crop((frame[0], frame[1], frame[0] + frame[2], frame[1] + frame[3]))
    scale = target_h / drawn_h
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    # Premultiply before the resize -- doc 38 R4.
    r, g, b, a = im.split()
    black = Image.new('L', im.size, 0)
    pm = Image.merge('RGB', (Image.composite(r, black, a), Image.composite(g, black, a),
                             Image.composite(b, black, a))).resize(size, Image.LANCZOS)
    aa = a.resize(size, Image.LANCZOS)
    out = Image.new('RGBA', size)
    px, ap, op = pm.load(), aa.load(), out.load()
    for j in range(size[1]):
        for i in range(size[0]):
            al = ap[i, j]
            if al:
                cr, cg, cb = px[i, j]
                op[i, j] = (min(255, cr * 255 // al), min(255, cg * 255 // al),
                            min(255, cb * 255 // al), al)
    return out


def thad_at(h):
    return scaled(THAD, None, h, THAD_H)


def pair(who):
    """Thad and this character side by side at the same depth, 1:1."""
    y = who['at'][1]
    man = man_at(y)
    figure = scaled(who['sheet'], who['frame'], man * who['stature'], who['drawnHeight'])
    old = scaled(who['sheet'], who['frame'], who['drawnHeight'], who['drawnHeight'])
    him = thad_at(man)
    pad = 30
    w = him.width + figure.width + old.width + pad * 4
    h = max(him.height, figure.height, old.height) + 40
    tile = Image.new('RGBA', (w, h), (26, 24, 22, 255))
    base = h - 20
    x = pad
    for im, cap in ((him, f'Thad {round(man)}px'),
                    (old, f'{who["id"]} AS SHIPPED {who["drawnHeight"]}px'),
                    (figure, f'{who["id"]} AT SCALE {round(man * who["stature"])}px')):
        tile.alpha_composite(im, (x, base - im.height))
        d = ImageDraw.Draw(tile)
        d.line([x, base, x + im.width, base], fill=(255, 235, 120, 220), width=2)
        d.text((x, base + 4), cap, fill=(230, 230, 235), font=SM)
        x += im.width + pad
    return tile.convert('RGB')


def street():
    im = Image.open(PLATE).convert('RGBA')
    d = ImageDraw.Draw(im, 'RGBA')
    for who in STAGING['characters']:
        x, y = who['at']
        man = man_at(y)
        figure = scaled(who['sheet'], who['frame'], man * who['stature'], who['drawnHeight'])
        im.alpha_composite(figure, (int(x - figure.width / 2), int(y - figure.height)))
        d.line([x - 20, y, x + 20, y], fill=(255, 235, 120, 220), width=2)
        d.text((x - 40, y + 4), f"{who['id']} {round(man * who['stature'])}px",
               fill=(255, 235, 120), font=SM)
    # Thad at three depths for comparison, on legal ground.
    for x, y in ((900, 700), (2400, 840), (3300, 660)):
        man = man_at(y)
        him = thad_at(man)
        im.alpha_composite(him, (int(x - him.width / 2), int(y - him.height)))
        d.text((x - 30, y + 4), f'Thad {round(man)}px', fill=(160, 220, 255), font=SM)
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
    canvas.save(out, 'WEBP', quality=90, method=6)
    print(out, canvas.size)


report = {'schema': 1, 'room': 'main_street_candidate', 'curve': CURVE, 'characters': []}
items = []
for who in STAGING['characters']:
    y = who['at'][1]
    man = man_at(y)
    target = round(man * who['stature'])
    report['characters'].append({
        'id': who['id'], 'at': who['at'], 'stature': who['stature'],
        'manHere': round(man, 1), 'shippedHeight': who['drawnHeight'], 'targetHeight': target,
        'shippedFractionOfThad': round(who['drawnHeight'] / man, 3), 'why': who['why']})
    items.append((pair(who), f"{who['id']} at {who['at'][0]},{who['at'][1]}  --  "
                             f"shipped {who['drawnHeight']}px "
                             f"({round(who['drawnHeight'] / man * 100)}% of Thad), "
                             f"at scale {target}px"))
    print(f"{who['id']:14s} at {who['at']}  man here {man:6.1f}  shipped {who['drawnHeight']} "
          f"({who['drawnHeight'] / man:.2f} of Thad)  ->  {target}")

os.makedirs('proofs/room-02', exist_ok=True)
json.dump(report, open('proofs/room-02/phase2a-street-scale.json', 'w'), indent=1)
print('proofs/room-02/phase2a-street-scale.json')
sheet(f'{OUT}/phase2a-street-scale.webp',
      'PHASE 2A  Main Street: the three humans beside Thad, at the size the room asks for',
      items, 1,
      'Left to right in each row: Thad at that depth, the sheet AS SHIPPED (blitted 1:1), '
      'the same sheet at the room\'s own scale. Thad art unchanged.')
sheet(f'{OUT}/phase2a-street-staged.webp',
      'PHASE 2A  Main Street, staged: the three humans at scale, in their Phase 2A places',
      [(street().resize((1805, 432), Image.LANCZOS), 'blue captions are Thad, for comparison')], 1)
