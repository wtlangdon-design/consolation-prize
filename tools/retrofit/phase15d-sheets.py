"""PHASE 1.5D SHEETS (doc 36 Q120): Main Street's final local art -- the board and the trough.

    python3 tools/retrofit/phase15d-sheets.py
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15); TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = TITLE = ImageFont.load_default()
PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
C1 = 'art/staging/room-02/companions-01'; C2 = 'art/staging/room-02/companions-02'
PLAY = (0, 0, 1920, 864)


def sheet(out, title, items, cols, caption_h=40, pad=12, top=52, note=None):
    fw = max(im.width for im, _ in items); fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols; note_h = (22 * (note.count('\n') + 1) + 10) if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * pad, top + note_h + rows * (fh + caption_h + pad) + pad), (22, 22, 26))
    d = ImageDraw.Draw(canvas); d.text((pad, 14), title, fill=(236, 236, 240), font=TITLE)
    if note: d.text((pad, top - 4), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols); x = pad + c * (fw + pad); y = top + note_h + r * (fh + caption_h + pad)
        canvas.paste(im, (x, y)); d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=FONT)
    canvas.save(out, 'WEBP', quality=84, method=6); print(out, canvas.size)


def comp(layers):
    im = Image.open(PLATE).convert('RGBA')
    for l in layers: im.alpha_composite(Image.open(l))
    return im.convert('RGB')


def z(im, crop, k=2):
    c = im.crop(crop); return c.resize((c.width * k, c.height * k), Image.NEAREST)


def captures(dir_):
    p = f'renders/proofs/candidates/{dir_}/life.json'
    return {c['name']: c for c in json.load(open(p))['captures'] if os.path.exists(c['file'])} if os.path.exists(p) else {}


def frame(cap, crop=None, scale=1.0):
    cam = cap.get('camera') or 0; im = Image.open(cap['file']).convert('RGB').crop(PLAY)
    if crop: im = im.crop((crop[0] - cam, crop[1], crop[2] - cam, crop[3]))
    if scale != 1.0: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS if scale < 1 else Image.NEAREST)
    return im


old = comp([f'{C1}/water-trough.png', f'{C1}/notices-frame.png', f'{C1}/company-sign-weathered.png'])
new = comp([f'{C2}/water-trough.png', f'{C2}/notices-board.png', f'{C1}/company-sign-weathered.png'])
fun = comp([f'{C2}/water-trough.png', f'{C2}/notices-funeral.png', f'{C1}/company-sign-weathered.png'])
sheet(f'{OUT}/phase15d-main-street-full.webp', 'MAIN STREET, ACT I -- the accepted plate with the 1.5D board and trough companions (0.53)',
      [(new.resize((round(3610 * 0.53), round(864 * 0.53)), Image.LANCZOS), 'plate unchanged; board and trough are the two local operations\' zones as state images')], 1)
sheet(f'{OUT}/phase15d-board-detail.webp', 'THE NOTICE BOARD -- 1.5B (rejected) against 1.5D, 2x nearest',
      [(z(old, (1540, 300, 1900, 620)), '1.5B: deterministic frame over the papered wall (rejected)'), (z(new, (1540, 300, 1900, 620)), '1.5D: the board painted around the papers on a local centred canvas'),
       (z(new, (1540, 300, 1900, 620), 3), '1.5D at 3x'), (z(fun, (1540, 300, 1900, 620), 3), 'FUNERAL state on the 1.5D board, 3x -- future-state, for information')], 2)
sheet(f'{OUT}/phase15d-trough-detail.webp', 'THE TROUGH -- 1.5B (rejected) against 1.5D, 2x nearest',
      [(z(old, (1900, 540, 2500, 864)), '1.5B: silhouette-cut prop (rejected)'), (z(new, (1900, 540, 2500, 864)), '1.5D: painted in context on a local centred canvas, the 1.5C trough as reference'), (z(new, (1900, 540, 2500, 864), 3), '1.5D at 3x')], 2)
caps = captures('main-street'); a3 = captures('main-street-act3')
occ = []
if 'c03-thad-before-trough' in caps: occ.append((frame(caps['c03-thad-before-trough'], (1900, 480, 2500, 864)), 'Thad IN FRONT (live)'))
if 'c05-thad-behind-trough' in caps: occ.append((frame(caps['c05-thad-behind-trough'], (1900, 420, 2500, 830)), 'Thad BEHIND: the trough\'s far side masks his feet and shins (live)'))
if 'c06-look-notices' in caps: occ.append((frame(caps['c06-look-notices'], (1500, 280, 1900, 680)), 'ORDINARY board, Act I (live)'))
if 'a01-funeral-notice' in a3: occ.append((frame(a3['a01-funeral-notice'], (1500, 280, 1900, 680)), 'FUNERAL state, Act III (live, ?objects=posted_notices=funeral)'))
if 'c01-arrival-east-end' in caps: occ.append((frame(caps['c01-arrival-east-end'], (2450, 640, 2900, 864), 2), 'the dog, unchanged, 2x'))
if 'c07-look-sign' in caps: occ.append((frame(caps['c07-look-sign'], (280, 90, 780, 300)), 'the sign, unchanged'))
if occ: sheet(f'{OUT}/phase15d-live.webp', 'MAIN STREET -- live proofs with the accepted Thad; orange figures are LEGACY CONTEXT', occ, 2)
sheet(f'{OUT}/phase15d-sanity.webp', 'MAIN STREET -- sanity pass at 1:1: rails, porches, board, trough, dog zone, sign',
      [(new.crop((0, 560, 700, 864)), 'west rail and the Company porch'), (new.crop((1500, 250, 2100, 864)), 'board, porch, the trough site west edge'), (new.crop((1950, 400, 2900, 864)), 'trough, east rail, saloon porch, dog zone'), (new.crop((250, 60, 800, 300)), 'the sign board')], 2)
