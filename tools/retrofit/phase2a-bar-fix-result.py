"""PHASE 2A FINAL VISUAL CORRECTION: what the one authorized operation returned
(doc 36 Q130).

    python3 tools/retrofit/phase2a-bar-fix-result.py

The operation was spent and it did not do what it was asked. Tyler's standing
instruction for that case is to stop and report rather than generate again, so
nothing here is integrated -- this page exists so the failure is a thing a
person can look at rather than a sentence they have to take on trust.

The mask was supposed to make "do not reopen Bar Patron 1 and the Stove Man"
structural. It did not: the endpoint returned a NEW two-figure composition at a
different scale, and the two men outside the free window came back altered and
absent respectively. The numbers under each panel are measured, not asserted.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
SENT = 'art/staging/room-03/cast-bar-stove-02/source.png'
BACK = 'art/staging/room-03/cast-bar-stove-03/source.png'
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception:
    F = B = T = ImageFont.load_default()

record = json.load(open('art/staging/room-03/cast-bar-stove-03/edit-mask.json'))
boxes = {**record['kept'], **record['freed']}
free = set(record['freed'])
x0, y0, x1, y1 = record['freeWindow']


def ink(path, box):
    """How much of a box is NOT the magenta backdrop -- i.e. is there a man in it."""
    bx0, by0, bx1, by1 = box
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)[by0:by1, bx0:bx1]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    magenta = (r > 150) & (b > 150) & (g < 110) & (r - g > 70) & (b - g > 70)
    return 1 - magenta.mean()


def panel(path, title, window):
    im = Image.open(path).convert('RGBA')
    d = ImageDraw.Draw(im)
    if window:
        d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(90, 220, 255), width=5)
    for who, (bx0, by0, bx1, by1) in boxes.items():
        colour = (120, 255, 160) if who in free else (255, 110, 110)
        d.rectangle([bx0, by0, bx1 - 1, by1 - 1], outline=colour, width=4)
        left = ink(path, boxes[who])
        d.text((bx0 + 6, by0 + 6), f'{who}  {left * 100:.0f}% drawn', fill=colour, font=B)
    return im.convert('RGB').resize((1400, round(1400 * im.height / im.width)), Image.LANCZOS), title


panels = [
    panel(SENT, 'WHAT WAS SENT — cast-bar-stove-02, the sheet in the game today. '
                'Cyan is the free window; green boxes are the two men the operation was for; '
                'red boxes are the two Tyler said to keep.', True),
    panel(BACK, 'WHAT CAME BACK — cast-bar-stove-03. Two figures at a different scale, in none '
                'of the four original places. The Stove Man is gone. Bar Patron 3 is gone. '
                'Bar Patron 2 is wearing Thad\'s long blue-grey coat.', False),
]
w = max(im.width for im, _ in panels)
probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))


def wrap(text, width):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if probe.textlength(trial, font=F) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


blocks = [wrap(cap, w) for _, cap in panels]
h = sum(im.height + 14 + 20 * len(b) + 22 for (im, _), b in zip(panels, blocks))
canvas = Image.new('RGB', (w + 28, 108 + h), (22, 22, 26))
d = ImageDraw.Draw(canvas)
d.text((14, 16), 'PHASE 2A  The one authorized bar-patron operation, and what it returned',
       fill=(238, 238, 242), font=T)
HEAD = [
    ('SPENT AND NOT USED. Nothing from the returned sheet is integrated: the nine patrons in the '
     'game are unchanged. Tyler\'s instruction for this case was to stop and report, not to '
     'generate again.', (255, 150, 145)),
    ('"% drawn" is the fraction of each original box that is not flat magenta — measured, so '
     '"the Stove Man is gone" is a number and not an opinion.', (190, 190, 200)),
    ('WHAT DID WORK: the two men it drew are drawn in the vocabulary that was asked for — flat '
     'skin, a shape per eye, no catchlights, facial hair as one mass. The prompt is not the '
     'thing that failed. The MASK is: it did not confine the edit, and the endpoint returned a '
     'new composition instead of the source with one window repainted.', (150, 220, 255)),
]
y = 46
for text, colour in HEAD:
    for line in wrap(text, w - 8):
        d.text((14, y), line, fill=colour, font=F)
        y += 20
    y += 6
y += 8
for (im, _), block in zip(panels, blocks):
    canvas.paste(im, (14, y))
    y += im.height + 10
    for line in block:
        d.text((14, y), line, fill=(220, 220, 226), font=F)
        y += 20
    y += 22
canvas.save(f'{OUT}/phase2a-bar-fix-result.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-bar-fix-result.webp', canvas.size)
for who in boxes:
    print(f'  {who:11s} sent {ink(SENT, boxes[who]) * 100:5.1f}% drawn   '
          f'back {ink(BACK, boxes[who]) * 100:5.1f}%')
