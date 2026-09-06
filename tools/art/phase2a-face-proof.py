"""PHASE 2A: the face proof, from SHIPPING assets, at two sizes (doc 36 Q132).

    python3 tools/art/phase2a-face-proof.py

Tyler's rule for this pass: no detached generated candidate may be shown as
shipping art. Every head here is read from `art/actors/`, which is what the
engine loads, and pre-scaled by the same curve-driven height the room draws
that character at.

TWO ROWS, BECAUSE ONE OF THEM IS THE REAL TEST. The magnified row is where the
feature vocabulary can be compared -- how many marks a face spends, and how
hard its edges are. The 1:1 row is the size the player actually sees, and a
correction that only works magnified has not worked. Nothing is smoothed in
either: the magnification is nearest-neighbour and the 1:1 row is untouched.

The controls are the point of the row. Two corrected men beside Thad show a
change; they do not show whether the change landed in the same language as the
rest of the cast. The stove man came off the same family sheet at the same
operation and was always accepted, and card player 4 came off the other
family -- so if the corrected men sit with the controls, they belong.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    F = B = T = ImageFont.load_default()

SHEETS = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}
THAD = 'art/actors/thad-stand-front/stand-00.png'

SUBJECTS = [
    ('THAD', THAD, None, 'accepted, frozen — the reference'),
    ('nugget_bar_2', SHEETS['nugget_bar_2']['sheet'], 'nugget_bar_2', 'CORRECTED'),
    ('nugget_bar_3', SHEETS['nugget_bar_3']['sheet'], 'nugget_bar_3', 'CORRECTED'),
    ('nugget_stove_man', SHEETS['nugget_stove_man']['sheet'], 'nugget_stove_man',
     'control — same family sheet, always accepted'),
    ('nugget_card_4', SHEETS['nugget_card_4']['sheet'], 'nugget_card_4',
     'control — the other family, accepted'),
]


def at(path, height):
    im = Image.open(path).convert('RGBA')
    if height is None or abs(im.height - height) < 2:
        return im
    scale = height / im.height
    return im.resize((max(1, round(im.width * scale)), height), Image.LANCZOS)


def head(im, share=0.24):
    top = im.crop((0, 0, im.width, max(8, round(im.height * share))))
    box = top.getbbox()
    return top.crop(box) if box else top


def row(zoom, title, note):
    cells = []
    for label, path, sheet_id, sub in SUBJECTS:
        height = SHEETS[sheet_id]['figureHeight'] if sheet_id else 494
        crop = head(at(path, height))
        cells.append((label, crop, f'{height} px tall — {sub}'))
    probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))
    widths = [max(c.width * zoom, round(probe.textlength(s, font=F)),
                  round(probe.textlength(l, font=B))) for l, c, s in cells]
    canvas = Image.new('RGB', (sum(widths) + 26 * (len(cells) + 1), 96
                               + max(c.height * zoom for _, c, _ in cells) + 46), (24, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((16, 16), title, fill=(238, 238, 242), font=T)
    d.text((16, 48), note, fill=(190, 190, 200), font=F)
    d.text((16, 68), 'Every head is read from art/actors/ — the files the engine loads — and '
           'pre-scaled to the height its room draws that character at.',
           fill=(150, 150, 160), font=F)
    x = 26
    for (label, crop, sub), width in zip(cells, widths):
        big = crop if zoom == 1 else crop.resize((crop.width * zoom, crop.height * zoom),
                                                 Image.NEAREST)
        canvas.paste(big, (x, 96), big)
        d.text((x, 100 + big.height), label, fill=(230, 230, 235), font=B)
        d.text((x, 120 + big.height), sub, fill=(150, 150, 160), font=F)
        x += width + 26
    return canvas


magnified = row(3, 'PHASE 2A  The corrected faces against Thad and two accepted controls — 3x',
                'Magnified with hard pixels so the feature vocabulary can be compared. '
                'THE QUESTION: does each face spend about as many marks as Thad does, at the '
                'height the room draws it?')
magnified.save(f'{OUT}/phase2a-face-proof-3x.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-face-proof-3x.webp', magnified.size)

life = row(1, 'PHASE 2A  The same five at 1:1 — the size the player actually sees',
           'Nothing is resized here at all. A correction that only works magnified has not '
           'worked, so this is the row that decides it.')
life.save(f'{OUT}/phase2a-face-proof-1x.webp', 'WEBP', quality=95, method=6)
print(f'{OUT}/phase2a-face-proof-1x.webp', life.size)
