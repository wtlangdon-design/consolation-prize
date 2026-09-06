"""PHASE 2A: the two static crowd compositions, labelled (doc 36 Q129).

    python3 tools/retrofit/phase2a-composition.py

The acceptance gate for this phase is a room full of people with NO animation
on any of them: if the composition only works once things are moving, it does
not work. This draws both rooms from the same data the engine uses -- the
staging records and the pre-scaled sheets -- with every figure named and its
feet marked, so a person can check that nine is nine, that nobody is standing
in the furniture, and that the piano has nobody at it.

Nothing here is a substitute for the live capture; it is the labelled version
of it, and the two are made from the same numbers.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
THAD = 'art/actors/thad-stand-front/stand-00.png'
THAD_H = 626
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    SM = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    F = SM = T = ImageFont.load_default()

SHEETS = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}


def scaled(path, target_h):
    im = Image.open(path).convert('RGBA')
    if abs(im.height - target_h) < 2:
        return im
    scale = target_h / im.height
    return im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                     Image.LANCZOS)


def curve_height(curve, y):
    far, near = curve['far'], curve['near']
    span = near['y'] - far['y']
    t = max(0.0, min(1.0, (y - far['y']) / span)) if span else 1.0
    return far['height'] + t * (near['height'] - far['height'])


def compose(plate, curve, people, thads, title_marks):
    im = Image.open(plate).convert('RGBA')
    d = ImageDraw.Draw(im, 'RGBA')
    # Painter's order: farthest feet first, so a nearer figure covers a further one.
    order = sorted(people + thads, key=lambda one: one['at'][1])
    for who in order:
        if who.get('thad'):
            h = curve_height(curve, who['at'][1])
            fig = scaled(THAD, h)
            colour = (150, 210, 255)
        else:
            sheet = SHEETS[who['id']]
            fig = Image.open(sheet['sheet']).convert('RGBA')
            h = fig.height
            colour = (255, 225, 130)
            for prop in who.get('props', []):
                pim = Image.open(prop['sheet']).convert('RGBA')
                im.alpha_composite(pim, (int(prop['x'] - pim.width / 2), int(prop['y'] - pim.height)))
        x, y = who['at']
        im.alpha_composite(fig, (int(x - fig.width / 2), int(y - fig.height)))
        d.line([x - 16, y, x + 16, y], fill=colour + (235,), width=2)
        label = f"{who['label']} {round(h)}px"
        w = d.textlength(label, font=SM)
        d.rectangle([x - w / 2 - 3, y + 3, x + w / 2 + 3, y + 20], fill=(0, 0, 0, 150))
        d.text((x - w / 2, y + 4), label, fill=colour, font=SM)
    for mark in title_marks:
        mx, my, text = mark
        d.text((mx, my), text, fill=(255, 140, 140), font=F)
    return im.convert('RGB')


def sheet(out, title, items, note=None):
    fw = max(im.width for im, _ in items)
    fh = max(im.height for im, _ in items)
    nh = 28 if note else 0
    canvas = Image.new('RGB', (fw + 24, 52 + nh + len(items) * (fh + 46 + 12) + 12), (22, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((12, 14), title, fill=(236, 236, 240), font=T)
    if note:
        d.text((12, 48), note, fill=(190, 190, 200), font=F)
    for i, (im, cap) in enumerate(items):
        y = 52 + nh + i * (fh + 46 + 12)
        canvas.paste(im, (12, y))
        d.text((12, y + fh + 8), cap, fill=(222, 222, 228), font=F)
    canvas.save(out, 'WEBP', quality=90, method=6)
    print(out, canvas.size)


# ---- THE NUGGET -------------------------------------------------------------
ng = json.load(open('reference/room-03-candidate/nugget-staging.json'))
people = [{'id': c['id'], 'label': c['id'].replace('nugget_', ''), 'at': c['at']}
          for c in ng['characters']]
thads = [{'thad': True, 'label': 'THAD', 'at': [1450, 780]},
         {'thad': True, 'label': 'THAD', 'at': [560, 800]}]
nugget = compose('art/staging/room-03/corrected-03/plate-cold-dirt.png', ng['curve'],
                 people, thads,
                 [(505, 300, 'NOBODY AT THE PIANO'),
                  (880, 300, "the abandoned hand on the table's near edge: the side with no chair")])
sheet(f'{OUT}/phase2a-nugget-crowd.webp',
      'PHASE 2A  The Bountiful Nugget, nine runtime patrons, NO ANIMATION',
      [(nugget, 'yellow feet are patrons, blue are Thad at two depths. Nine people: 3 bar, '
                '4 cards, 1 landing, 1 stove.')],
      'Every figure is the pre-scaled shipping sheet at the size the engine draws it. Four men '
      'are round the table with cards in hand, the fifth chair is empty above an abandoned hand, '
      'the stove man is turned INTO the iron, and the piano has nobody at it.')

# ---- MAIN STREET ------------------------------------------------------------
st = json.load(open('reference/room-02-candidate/street-staging.json'))
room2 = json.load(open('content/rooms/main-street-candidate.json'))
c2 = next(b['scaleMode'] for b in room2['walkBoxes'] if b['scaleMode']['kind'] == 'curve')
curve2 = {'far': {'y': c2['farY'], 'height': c2['farHeight']},
          'near': {'y': c2['nearY'], 'height': c2['nearHeight']}}
station = SHEETS['letter_writer_station']
street_people = []
for c in st['characters']:
    one = {'id': c['id'], 'label': c['id'], 'at': c['at']}
    if c['id'] == 'letter_writer':
        one['props'] = [{'sheet': station['sheet'], 'x': 1548, 'y': 658}]
    street_people.append(one)
dog = json.load(open('content/ambient/dog.json'))
placed = dog['placements']['main_street_candidate']
street = compose('art/staging/room-02/street-candidate-03/candidate-plate.png', curve2,
                 street_people,
                 [{'thad': True, 'label': 'THAD', 'at': [2400, 840]},
                  {'thad': True, 'label': 'THAD', 'at': [1000, 720]}],
                 [(2240, 700, 'the hitching rail: front side only, frozen')])
# the dog last, at 1:1 -- his art and his placement are unchanged by this phase
d = ImageDraw.Draw(street, 'RGBA')
dogim = Image.open(dog['sprite']['sheet']).convert('RGBA').crop((2, 2, 2 + 113, 2 + 51))
street.paste(dogim, (int(placed['x'] - 56), int(placed['y'] - 51)), dogim)
d.text((placed['x'] - 30, placed['y'] + 4), 'dog (unchanged)', fill=(255, 225, 130), font=SM)
sheet(f'{OUT}/phase2a-street-crowd.webp',
      'PHASE 2A  Main Street, the three humans and the dog, NO ANIMATION',
      [(street.resize((1805, 432), Image.LANCZOS), 'the letter-writer with his station; '
        'the pie woman restaged in front of the trough; the map seller unmoved; the dog unchanged')])
