"""PHASE 1.5G SHEETS (doc 36 Q123): three small sheets, one per thing Tyler named.

    python3 tools/retrofit/phase15g-sheets.py
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = TITLE = ImageFont.load_default()
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
MASK = 'art/staging/room-02/street-candidate-03/plane-1-trough-rail.png'
C3 = 'art/staging/room-02/companions-03'      # 1.5F, superseded
C4 = 'art/staging/room-02/companions-04'      # 1.5G
PLAY = (0, 0, 1920, 864)


def sheet(out, title, items, cols, caption_h=48, pad=12, top=52, note=None):
    fw = max(im.width for im, _ in items); fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols; note_h = (22 * (note.count('\n') + 1) + 10) if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * pad, top + note_h + rows * (fh + caption_h + pad) + pad), (22, 22, 26))
    d = ImageDraw.Draw(canvas); d.text((pad, 14), title, fill=(236, 236, 240), font=TITLE)
    if note: d.text((pad, top - 4), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols); x = pad + c * (fw + pad); y = top + note_h + r * (fh + caption_h + pad)
        canvas.paste(im, (x, y))
        line, rest = cap, ''
        while d.textlength(line, font=FONT) > fw and ' ' in line:
            line, _, tail = line.rpartition(' ')
            rest = f'{tail} {rest}'.strip()
        d.text((x, y + fh + 6), line, fill=(222, 222, 228), font=FONT)
        if rest: d.text((x, y + fh + 24), rest, fill=(222, 222, 228), font=FONT)
    canvas.save(out, 'WEBP', quality=88, method=6); print(out, canvas.size)


def captures(dir_):
    p = f'renders/proofs/candidates/{dir_}/life.json'
    return {c['name']: c for c in json.load(open(p))['captures'] if os.path.exists(c['file'])} if os.path.exists(p) else {}


def frame(cap, crop, scale=1):
    cam = cap.get('camera') or 0
    im = Image.open(cap['file']).convert('RGB').crop(PLAY).crop((crop[0] - cam, crop[1], crop[2] - cam, crop[3]))
    return im.resize((im.width * scale, im.height * scale), Image.NEAREST) if scale != 1 else im


def where(cap):
    at = cap['movers'].get('thad', {}).get('at')
    clip = cap['movers'].get('thad', {}).get('clipLevel')
    return f"feet {at[0]},{at[1]} · plane {clip}" if at else ''


def comp(layers):
    im = Image.open(PLATE).convert('RGBA')
    for l in layers: im.alpha_composite(Image.open(l).convert('RGBA'))
    return im.convert('RGB')


# ---- A. THE RAIL --------------------------------------------------------------
rail = captures('main-street-rail')
BOX = (2240, 420, 2700, 864)
# PHASE 1.5I: the captions describe the FRONT-ONLY rail. The clicks in the
# route are unchanged -- they are the clicks Tyler makes -- but the ground
# behind the rail is no longer floor, so each one leaves him in front of it.
plan = [('g02-front-midspan', 'IN FRONT, mid-span: he draws over the bar'),
        ('g03a-walk-starts', 'ASKED FOR THE GROUND BEHIND: he sets off along the front, not round the end'),
        ('g04-front-after-clicking-behind', 'CLICKED BEHIND, mid-span: he stops in front of the rail'),
        ('g05-clicked-the-rail', 'CLICKED ON THE RAIL: he stops in front of it, not on it'),
        ('g06-front-after-clicking-the-near-post', 'CLICKED THE NEAR POST: in front of it, clear of its foot'),
        ('g07-front-far-end', 'PAST THE FAR END, in front all the way')]
items = [(frame(rail[n], BOX), f'{c} ({where(rail[n])})') for n, c in plan if n in rail]
if items:
    sheet(f'{OUT}/phase15g-rail.webp', 'THE HITCHING RAIL -- front-only, and the ground behind it retired (0 image operations)', items, 3,
          note="The pie woman still stands behind the rail and the rail still crosses her legs: "
               "an ambient does not need floor, and her placement declares its own plane.")

# ---- B. THE TROUGH ------------------------------------------------------------
trough = captures('main-street-trough')
TBOX = (1900, 470, 2360, 864)
debug = Image.open(PLATE).convert('RGB').crop((1950, 650, 2270, 830))
m = np.array(Image.open(MASK).convert('RGBA'))[..., 3][650:830, 1950:2270] > 8
tint = np.array(debug).astype(float); tint[m] = tint[m] * 0.45 + np.array([0, 255, 0]) * 0.55
debug = Image.fromarray(tint.astype('uint8')).resize((320 * 2, 180 * 2), Image.NEAREST)
plan = [('t04-behind-centre', 'BEHIND THE CENTRE: only what the trough covers is gone'),
        ('t02-left-of-trough', 'LEFT of the trough, same depth: whole'),
        ('t06-right-of-trough', 'RIGHT of the trough, same depth: whole'),
        ('t09-in-front', 'IN FRONT: he draws over it'),
        ('t07-just-outside-east', 'JUST OUTSIDE THE EAST END: whole'),
        ('t08-regression-position', 'THE POSITION THAT CLIPPED HIM (2200,765): a LOOK AT now, and he stands clear')]
items = [(debug.resize((TBOX[2] - TBOX[0], round(debug.height * (TBOX[2] - TBOX[0]) / debug.width)), Image.NEAREST),
          'THE MASK, in green over the plate: it hugs the trough, and the contact shadow is ground, not an occluder')]
items += [(frame(trough[n], TBOX), f'{c} ({where(trough[n])})') for n, c in plan if n in trough]
if len(items) > 1:
    sheet(f'{OUT}/phase15g-trough.webp', 'THE WATER TROUGH -- the mask cut from the trough (0 image operations)', items, 3,
          note='18800 mask pixels, all of them inside the object; the Phase 1.5E polygon had 2995 outside it.')

# ---- C. THE SIGN --------------------------------------------------------------
SBOX = (330, 120, 720, 250)
k = 3
board = Image.open(PLATE).convert('RGB').crop(SBOX).resize(((SBOX[2] - SBOX[0]) * k, (SBOX[3] - SBOX[1]) * k), Image.NEAREST)
guides = board.copy(); d = ImageDraw.Draw(guides)
for y in (142, 226):
    d.line([(0, (y - SBOX[1]) * k), (guides.width, (y - SBOX[1]) * k)], fill=(0, 255, 255), width=1)
for x in (344, 704):
    d.line([((x - SBOX[0]) * k, 0), ((x - SBOX[0]) * k, guides.height)], fill=(0, 255, 255), width=1)


def z(image):
    return image.crop(SBOX).resize(((SBOX[2] - SBOX[0]) * k, (SBOX[3] - SBOX[1]) * k), Image.NEAREST)


weathered = z(comp([f'{C4}/company-sign-weathered.png']))
gilt = z(comp([f'{C4}/company-sign-gilt.png']))
lined = weathered.copy(); d = ImageDraw.Draw(lined)
rows = [line['baselineRow'] for line in json.load(open(f'{C4}/sign-rebuild.json'))['lines']]
for row in (179, 214):
    d.line([(0, (row - SBOX[1]) * k + k - 1), (lined.width, (row - SBOX[1]) * k + k - 1)], fill=(255, 140, 0), width=1)
sheet(f'{OUT}/phase15g-sign.webp', 'THE IMPROVEMENT COMPANY SIGN -- rebuilt letter by letter, 3x (0 image operations)',
      [(guides, 'THE BOARD, with its own inner edges in cyan: level at y 142 and 226, x 344 and 704'),
       (z(comp([f'{C3}/company-sign-weathered.png'])), 'BEFORE (1.5F, whole-crop rotation): the block is level, the letters step'),
       (weathered, 'AFTER: every glyph moved onto its line\'s row -- spread 6px and 7px, now 0 and 0'),
       (lined, 'THE SAME, with the two baselines drawn in orange'),
       (gilt, 'ACT III: the gilt state, the same geometry to the pixel')], 2)
