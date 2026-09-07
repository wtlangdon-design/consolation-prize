"""THE PICTURE BEHIND THE FURNITURE-REGISTRATION FINDING (doc 36 Q133).

    python3 tools/retrofit/nugget-furniture-diagnostic.py

The audit's numbers say the accepted character art cannot make the contacts the
canonical furniture requires. This draws that on the accepted plate so a person
can see it rather than take it on trust: the canonical contact lines in cyan,
the existing figures placed as close to them as their own proportions allow,
and the gap left over.

NOTHING HERE SHIPS. It writes one render. The plate is opened read-only and no
pixel of it is modified, and no character sheet is modified either.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
F = json.load(open('reference/room-03-candidate/nugget-furniture.json'))
SHEETS = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}
CURVE = F['depthCurve']
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    SMALL = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = SMALL = TITLE = ImageFont.load_default()

CYAN, RED, AMBER = (120, 230, 255), (255, 110, 110), (255, 200, 120)


def lift(im, gamma=0.55):
    """The plate is a night interior; this only brightens the DIAGNOSTIC copy."""
    a = np.asarray(im.convert('RGB')).astype(float) / 255.0
    return Image.fromarray((np.power(a, gamma) * 255).astype(np.uint8)).convert('RGBA')


def man_height(y):
    span = CURVE['nearY'] - CURVE['farY']
    return CURVE['farHeight'] + (y - CURVE['farY']) / span * (CURVE['nearHeight'] - CURVE['farHeight'])


def counter_y(x):
    e = F['bar']['counterFrontTopEdge']
    return e['at1150'] + (x - 1150) * e['slopePerPx']


def place(canvas, sheet_id, x, foot_y, height=None):
    im = Image.open(SHEETS[sheet_id]['sheet']).convert('RGBA')
    if height and abs(im.height - height) > 1:
        s = height / im.height
        im = im.resize((max(1, round(im.width * s)), round(height)), Image.LANCZOS)
    canvas.alpha_composite(im, (int(x - im.width / 2), int(foot_y - im.height)))
    return im


plate = lift(Image.open(F['plate']))
d = ImageDraw.Draw(plate, 'RGBA')

# ---- CARD TABLE -------------------------------------------------------------
table = F['cardTable']
cx, cy = table['topEllipse']['centre']
rx, ry = table['topEllipse']['rx'], table['topEllipse']['ry']
d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=CYAN + (255,), width=3)
d.line([620, table['seatY'], 1200, table['seatY']], fill=CYAN + (220,), width=2)
d.text((1108, table['seatY'] - 20), 'canonical seat line', fill=CYAN, font=SMALL)
d.line([620, table['floorY'], 1200, table['floorY']], fill=CYAN + (220,), width=2)
d.text((1108, table['floorY'] - 20), 'canonical floor line', fill=CYAN, font=SMALL)

# The left chair, with an existing player scaled to the room and his feet on the
# chair's floor: the gap between his hips and the seat is the finding.
chair = table['visibleChairs'][0]
seated_h = 0.72 * man_height(chair['floorY'])
im = place(plate, 'nugget_card_1', chair['seatCentre'][0], chair['floorY'], seated_h)
hip = chair['floorY'] - (1 - 0.66) * seated_h
d.line([chair['seatCentre'][0] - 70, hip, chair['seatCentre'][0] + 70, hip], fill=RED + (255,), width=3)
d.text((chair['seatCentre'][0] + 78, hip - 8), f"his hips: {hip - chair['seatCentre'][1]:+.0f}px "
       f'below the seat', fill=RED, font=FONT)

# ---- BAR --------------------------------------------------------------------
for x in range(1160, 1915, 6):
    d.line([x, counter_y(x), x + 4, counter_y(x + 4)], fill=CYAN + (230,), width=3)
d.text((1600, counter_y(1600) - 26), 'canonical counter top', fill=CYAN, font=SMALL)

for stool in F['bar']['stools']:
    sx, sy = stool['seatCentre']
    d.ellipse([sx - 46, sy - 12, sx + 46, sy + 12], outline=CYAN + (255,), width=3)

# The seated man at the far stool, sized as the room wants him: his forearms end
# up well above the counter, which is the mismatch stated as a number.
far = F['bar']['stools'][0]
seated_bar = 0.72 * man_height(far['floorY'])
place(plate, 'nugget_bar_1', far['seatCentre'][0], far['floorY'], seated_bar)
arm = far['floorY'] - (1 - 0.35) * seated_bar
d.line([far['seatCentre'][0] - 80, arm, far['seatCentre'][0] + 80, arm], fill=RED + (255,), width=3)
d.text((far['seatCentre'][0] + 60, arm - 8),
       f'his forearms: {arm - counter_y(far["seatCentre"][0]):+.0f}px from the counter',
       fill=RED, font=FONT)

# The leaning man standing at the bar's own floor line: his elbow lands high.
face = F['bar']['counterFrontFaceBottom']
lx = 1620
stand_y = face['at1400'] + (lx - 1400) * face['slopePerPx']
lean_h = 0.97 * man_height(stand_y)
place(plate, 'nugget_bar_2', lx, stand_y, lean_h)
elbow = stand_y - (1 - 0.32) * lean_h
d.line([lx - 90, elbow, lx + 90, elbow], fill=RED + (255,), width=3)
d.text((lx - 300, elbow - 26), f'his elbow: {counter_y(lx) - elbow:+.0f}px above the counter',
       fill=RED, font=FONT)

crop = plate.convert('RGB')
panels = [(crop.crop((600, 300, 1260, 560)), 'CARD TABLE — the canonical table, seat line and floor '
           'line in cyan, with an existing seated player scaled as the room wants him. His hips '
           'land below the seat: the drawing puts his seat lower on his body than these chairs do. '
           'And he faces the camera, as all four of them do.'),
          (crop.crop((1140, 400, 1920, 864)), 'BAR — the canonical counter top and the three stool '
           'seats in cyan. The seated man\'s forearms land above the counter at this stool; the '
           'leaning man, standing at the bar\'s own floor line, lands his elbow about 100px above '
           'the counter he is supposed to be resting on.')]

probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))
width = max(p.width for p, _ in panels)


def wrap(text, w):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if probe.textlength(trial, font=SMALL) <= w:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


blocks = [wrap(c, width) for _, c in panels]
height = 104 + sum(p.height + 12 + 20 * len(b) + 22 for (p, _), b in zip(panels, blocks))
title_w = round(probe.textlength('THE NUGGET  Why the patrons cannot be registered to the '
                                 'furniture as drawn', font=TITLE)) + 40
canvas = Image.new('RGB', (max(width + 28, title_w), height), (22, 22, 26))
dd = ImageDraw.Draw(canvas)
dd.text((14, 16), 'THE NUGGET  Why the patrons cannot be registered to the furniture as drawn',
        fill=(238, 238, 242), font=TITLE)
dd.text((14, 48), 'Cyan is the canonical furniture, read off the accepted plate. Red is where an '
        'existing figure\'s contact actually lands when the room scales him.', fill=(190, 190, 200),
        font=SMALL)
dd.text((14, 70), 'The plate is brightened HERE ONLY, so the geometry is visible; nothing in the '
        'room is changed and no character art is modified.', fill=(150, 150, 160), font=SMALL)
y = 104
for (panel, _), block in zip(panels, blocks):
    canvas.paste(panel, (14, y))
    y += panel.height + 10
    for line in block:
        dd.text((14, y), line, fill=(222, 222, 228), font=SMALL)
        y += 20
    y += 22
canvas.save(f'{OUT}/phase2a-furniture-registration.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-furniture-registration.webp', canvas.size)
