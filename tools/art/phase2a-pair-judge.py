"""PHASE 2A FINAL OPERATION: the judgement sheet — candidate against retained,
against Thad, against the accepted controls (doc 36 Q131).

    python3 tools/art/phase2a-pair-judge.py

NOTHING HERE IS SHIPPING ART and nothing here promotes anything. Each candidate
is scaled by the SAME pre-scaler the engine's sheets are built with, to the
SAME figure height the room draws that man at, so the comparison is against
what he would actually look like and not against a casting sheet.

The two accepted controls are the point of the row. Two failing men beside Thad
show a gap; they do not show whose gap it is. The Stove Man came off the same
family sheet at the same operation and passes, and card player 4 came off the
other family — so if the candidates sit with the controls, the defect is fixed,
and if they sit apart from them, it is not.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sheets_mod = import_module('phase2a-sheets'.replace('-', '_')) if False else None
OUT = 'renders/opening-set-retrofit'
CAND = 'art/staging/room-03/cast-bar-pair-01'
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    F = B = T = ImageFont.load_default()

SHEETS = {s['id']: s for s in json.load(open('art/staging/phase2a-sheets.json'))['sheets']}


def at(path, height):
    im = Image.open(path).convert('RGBA')
    if abs(im.height - height) < 2:
        return im
    s = height / im.height
    return im.resize((max(1, round(im.width * s)), height), Image.LANCZOS)


def head(im, share=0.26):
    top = im.crop((0, 0, im.width, max(8, round(im.height * share))))
    box = top.getbbox()
    return top.crop(box) if box else top


ROWS = [
    ('nugget_bar_2', 380, [
        ('RETAINED — in the game now', 'art/actors/cast-nugget-bar-2.png'),
        ('CANDIDATE — this operation', f'{CAND}/bar-2.png'),
        ('THAD at the same height', 'art/actors/thad-stand-front/stand-00.png'),
    ]),
    ('nugget_bar_3', 494, [
        ('RETAINED — in the game now', 'art/actors/cast-nugget-bar-3.png'),
        ('CANDIDATE — this operation', f'{CAND}/bar-3.png'),
        ('THAD at the same height', 'art/actors/thad-stand-front/stand-00.png'),
    ]),
    ('CONTROLS — accepted, unchanged', None, [
        ('stove man, 229 px — same sheet', 'art/actors/cast-nugget-stove-man.png'),
        ('card player 4, 163 px — other family', 'art/actors/cast-nugget-card-4.png'),
        ('THAD at 229 px', 'art/actors/thad-stand-front/stand-00.png'),
    ]),
]
CONTROL_H = {'art/actors/cast-nugget-stove-man.png': 229, 'art/actors/cast-nugget-card-4.png': 163,
             'art/actors/thad-stand-front/stand-00.png': 229}

Z = 3
gap = 26
probe = ImageDraw.Draw(Image.new('RGB', (8, 8)))
built = []
for title, height, items in ROWS:
    cells = []
    for label, path in items:
        h = height or CONTROL_H[path]
        crop = head(at(path, h))
        cells.append((label, crop, f'{crop.width}x{crop.height} px at {h} px tall'))
    built.append((title, cells))

rowh = [max(c.height * Z for _, c, _ in cells) + 62 for _, cells in built]
width = max(sum(max(c.width * Z, round(probe.textlength(sub, font=F)),
                    round(probe.textlength(label, font=B))) + gap
                for label, c, sub in cells) for _, cells in built) + gap
canvas = Image.new('RGB', (width, 96 + sum(r + 34 for r in rowh)), (24, 22, 26))
d = ImageDraw.Draw(canvas)
d.text((14, 16), 'PHASE 2A  The final operation, judged — candidate vs retained vs Thad, '
       'at the height the room draws each man', fill=(238, 238, 242), font=T)
d.text((14, 48), 'Every figure is pre-scaled to its own deployed figure height and then '
       'magnified 3x with hard pixels. NOTHING HERE IS SHIPPING ART: these are candidates until '
       'each one is judged.', fill=(190, 190, 200), font=F)
d.text((14, 68), 'THE QUESTION, one man at a time: at the same displayed height, does this face '
       'look authored by the renderer that authored Thad?', fill=(255, 200, 140), font=F)

y = 96
for (title, cells), rh in zip(built, rowh):
    d.text((14, y), title, fill=(255, 205, 140), font=B)
    y += 24
    x = gap
    for label, crop, sub in cells:
        big = crop.resize((crop.width * Z, crop.height * Z), Image.NEAREST)
        canvas.paste(big, (x, y), big)
        d.text((x, y + big.height + 6), label, fill=(230, 230, 235), font=B)
        d.text((x, y + big.height + 26), sub, fill=(150, 150, 160), font=F)
        x += max(big.width, round(probe.textlength(sub, font=F)),
                 round(probe.textlength(label, font=B))) + gap
    y += rh + 10
canvas.save(f'{OUT}/phase2a-pair-judgement.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-pair-judgement.webp', canvas.size)


# ---- THE BAND THAT DECIDED IT ----------------------------------------------
#
# The head crops above are the fair comparison and the eye band is the decisive
# one. Every measurement tried on this question has been inert -- colour count,
# flatness and neighbour step all rank THAD as the softer image, because his
# sprite is a resampled 742 px painting -- so the call is made by looking, and
# this is the thing looked at: a horizontal strip across the eyes at 8x.
#
# Thad and every accepted figure carry an eye that is ONE dark shape. A white
# sclera with an iris in it is the single feature that separates a face drawn
# for this game from a face drawn as a portrait, and it survives every other
# simplification.
def eyeband(im, top=0.05, bottom=0.12):
    strip = im.crop((0, round(im.height * top), im.width, round(im.height * bottom)))
    box = strip.getbbox()
    return strip.crop(box) if box else strip


BAND = [
    ('THAD at 494 px — accepted', 'art/actors/thad-stand-front/stand-00.png', 494),
    ('the pie woman — accepted', 'art/actors/cast-pie-woman.png', None),
    ('nugget_bar_2 CANDIDATE at 380 px', f'{CAND}/bar-2.png', 380),
    ('nugget_bar_3 CANDIDATE at 494 px', f'{CAND}/bar-3.png', 494),
]
ZB = 8
bands = [(label, eyeband(at(path, height) if height else Image.open(path).convert('RGBA')))
         for label, path, height in BAND]
bw = max(b.width * ZB for _, b in bands) + 40
bh = sum(b.height * ZB + 36 for _, b in bands) + 78
strip = Image.new('RGB', (bw, bh), (24, 22, 26))
ds = ImageDraw.Draw(strip)
ds.text((20, 14), 'PHASE 2A  A strip across the eyes, 8x — the feature that decided it',
        fill=(238, 238, 242), font=T)
ds.text((20, 44), 'Thad and every accepted figure have an eye that is ONE dark shape. Both '
        'candidates have a white with an iris in it.', fill=(255, 160, 150), font=F)
yb = 78
for label, band in bands:
    big = band.resize((band.width * ZB, band.height * ZB), Image.NEAREST)
    strip.paste(big, (20, yb), big)
    ds.text((20, yb + big.height + 6), label, fill=(230, 230, 235), font=B)
    yb += big.height + 36
strip.save(f'{OUT}/phase2a-pair-eyes.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-pair-eyes.webp', strip.size)
