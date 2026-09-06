"""PHASE 2A: heads at gameplay size, 1:1 and magnified (doc 36 Q129).

    python3 tools/art/phase2a-face-compare.py

Tyler: the new NPCs read as painted illustrations reduced into the game, and
Thad beside them looks pixelated and simplified.

THE NUMBERS DO NOT SEE IT. Colour count, flatness and neighbour step were
measured at deployed size for Thad, Winnie and all twelve new figures, and they
do not separate them: Thad's own sprite is anti-aliased with 494 unique colours
per thousand pixels, inside the range the new cast occupies. Whatever is wrong
is not palette size. It is how much of a face is DRAWN -- how many features get
their own shapes -- and that is a thing to look at, not a thing to score.

So this crops every head at the size the game draws it, puts them in one row at
1:1, and again at 4x so the feature vocabulary is visible. Thad and Winnie
first, as the two accepted references.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
    T = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception:
    F = T = ImageFont.load_default()


def at_height(path, height, frame=None):
    im = Image.open(path).convert('RGBA')
    if frame:
        im = im.crop((frame[0], frame[1], frame[0] + frame[2], frame[1] + frame[3]))
    if height and abs(im.height - height) > 1:
        s = height / im.height
        im = im.resize((max(1, round(im.width * s)), height), Image.LANCZOS)
    return im


def head(im, share=0.26):
    """The top slice of a standing figure, trimmed to its own ink."""
    h = max(8, round(im.height * share))
    top = im.crop((0, 0, im.width, h))
    box = top.getbbox()
    return top.crop(box) if box else top


SUBJECTS = [
    ('THAD  (accepted)', at_height('art/actors/thad-stand-front/stand-00.png', 392)),
    ('WINNIE  (accepted)', at_height('art/staging/room-05/winnie-02-counter/winnie-counter-sheet.png',
                                     None, [0, 0, 258, 188])),
]
for one in json.load(open('art/staging/phase2a-sheets.json'))['sheets']:
    if one['id'] == 'letter_writer_station':
        continue
    SUBJECTS.append((one['id'], at_height(one['sheet'], None)))

heads = [(label, head(im)) for label, im in SUBJECTS]
ZOOM = 4
pad = 14
cellw = max(h.width for _, h in heads) * ZOOM + pad
cellh = max(h.height for _, h in heads) * ZOOM + 52
cols = 7
rows = (len(heads) + cols - 1) // cols
canvas = Image.new('RGB', (cols * cellw + pad, 96 + rows * cellh), (24, 22, 26))
d = ImageDraw.Draw(canvas)
d.text((14, 16), 'PHASE 2A  Heads at gameplay size, magnified 4x — Thad and Winnie first',
       fill=(238, 238, 242), font=T)
d.text((14, 48), 'Nothing is resized here except the 4x magnification: each head is cropped from the '
                 'sheet the engine draws.', fill=(190, 190, 200), font=F)
d.text((14, 68), 'THE QUESTION: if this face and Thad\'s were authored for the same game, would you '
                 'believe it?', fill=(255, 200, 140), font=F)
for i, (label, im) in enumerate(heads):
    r, c = divmod(i, cols)
    x = pad + c * cellw
    y = 96 + r * cellh
    big = im.resize((im.width * ZOOM, im.height * ZOOM), Image.NEAREST)
    canvas.paste(big, (x, y), big)
    d.text((x, y + big.height + 6), f'{label}', fill=(230, 230, 235), font=F)
    d.text((x, y + big.height + 24), f'{im.width}x{im.height} px as drawn',
           fill=(150, 150, 160), font=F)
canvas.save(f'{OUT}/phase2a-face-compare.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-face-compare.webp', canvas.size)

# ---- THE MATCHED-HEIGHT STRIP -----------------------------------------------
# THE COMPARISON THAT SETTLED IT. The grid above puts every head at the size
# the engine draws it, which is fair to the room and unfair to the question:
# the two bar men nearest the camera are drawn at 380 and 494 px because that
# is how tall a man is at that depth, so of course they carry more paint. The
# only honest test is to put Thad at the SAME figure height beside them and ask
# whether the two faces speak the same language. They do not, and that is the
# finding this file exists to record.
def figure(path, height):
    im = Image.open(path).convert('RGBA')
    if abs(im.height - height) < 2:
        return im
    s = height / im.height
    return im.resize((max(1, round(im.width * s)), height), Image.LANCZOS)


MATCHED = [
    ('THAD at 494 px', figure('art/actors/thad-stand-front/stand-00.png', 494),
     'accepted, frozen'),
    ('nugget_bar_3 at 494 px', Image.open('art/actors/cast-nugget-bar-3.png').convert('RGBA'),
     'as the engine draws him'),
    ('THAD at 380 px', figure('art/actors/thad-stand-front/stand-00.png', 380),
     'accepted, frozen'),
    ('nugget_bar_2 at 380 px', Image.open('art/actors/cast-nugget-bar-2.png').convert('RGBA'),
     'as the engine draws him'),
]
crops = [(label, head(im), sub) for label, im, sub in MATCHED]
Z2 = 3
gap = 30
w2 = sum(c.width * Z2 + gap for _, c, _ in crops) + gap
h2 = max(c.height * Z2 for _, c, _ in crops) + 152
strip = Image.new('RGB', (w2, h2), (24, 22, 26))
d2 = ImageDraw.Draw(strip)
d2.text((gap, 16), 'PHASE 2A  The same head height, side by side — 3x magnification, nothing '
        'else resized', fill=(238, 238, 242), font=T)
d2.text((gap, 48), 'THE REMAINING MISMATCH: the small and mid-depth cast now speaks Thad\'s '
        'language. The two bar men nearest the camera still do not.',
        fill=(255, 160, 150), font=F)
d2.text((gap, 68), 'Thad: hair in hard clumps, one flat skin mass, a shape per eye, one nose '
        'shadow, one mouth line. The bar men: continuous cheek gradients, individually drawn '
        'moustache hairs, a catchlight in the eye.', fill=(190, 190, 200), font=F)
x2 = gap
for label, im, sub in crops:
    big = im.resize((im.width * Z2, im.height * Z2), Image.NEAREST)
    strip.paste(big, (x2, 100), big)
    d2.text((x2, 108 + big.height), label, fill=(230, 230, 235), font=F)
    d2.text((x2, 126 + big.height), f'{im.width}x{im.height} px — {sub}',
            fill=(150, 150, 160), font=F)
    x2 += big.width + gap
strip.save(f'{OUT}/phase2a-matched-faces.webp', 'WEBP', quality=92, method=6)
print(f'{OUT}/phase2a-matched-faces.webp', strip.size)
