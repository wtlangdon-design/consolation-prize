"""PHASE 1.5F SHEETS (doc 36 Q122): the sign, the chapel and the rail.

    python3 tools/retrofit/phase15f-sheets.py
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = TITLE = ImageFont.load_default()
NEW = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
OLD = 'art/staging/room-02/chapel-01/plate-before.png'      # the plate as Phase 1.5E left it
C1 = 'art/staging/room-02/companions-01'                     # the Phase 1.5 sign layers, superseded
C3 = 'art/staging/room-02/companions-03'                     # the aligned sign layers
SHEET = 'art/staging/room-02/street-candidate-03/notices-funeral-sheet.png'
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
    canvas.save(out, 'WEBP', quality=86, method=6); print(out, canvas.size)


def comp(plate, layers):
    im = Image.open(plate).convert('RGBA')
    for l in layers: im.alpha_composite(Image.open(l).convert('RGBA'))
    return im.convert('RGB')


def z(im, crop, k=3):
    c = im.crop(crop); return c.resize((c.width * k, c.height * k), Image.NEAREST)


def captures(dir_):
    p = f'renders/proofs/candidates/{dir_}/life.json'
    return {c['name']: c for c in json.load(open(p))['captures'] if os.path.exists(c['file'])} if os.path.exists(p) else {}


def frame(cap, crop=None, scale=1.0):
    cam = cap.get('camera') or 0; im = Image.open(cap['file']).convert('RGB').crop(PLAY)
    if crop: im = im.crop((crop[0] - cam, crop[1], crop[2] - cam, crop[3]))
    if scale != 1.0: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS if scale < 1 else Image.NEAREST)
    return im


# ---- THE SIGN -----------------------------------------------------------------
was = comp(NEW, [f'{C1}/company-sign-weathered.png'])
now = comp(NEW, [f'{C3}/company-sign-weathered.png'])
gilt = comp(NEW, [f'{C3}/company-sign-gilt.png'])
SIGNBOX = (320, 110, 730, 260)
guides = z(now, SIGNBOX, 3).copy()
d = ImageDraw.Draw(guides)
for y, colour in ((142, (0, 255, 255)), (226, (0, 255, 255)), (152, (255, 140, 0)), (216, (255, 140, 0))):
    d.line([(0, (y - SIGNBOX[1]) * 3), (guides.width, (y - SIGNBOX[1]) * 3)], fill=colour, width=1)
for x in (344, 704):
    d.line([((x - SIGNBOX[0]) * 3, 0), ((x - SIGNBOX[0]) * 3, guides.height)], fill=(0, 255, 255), width=1)
sheet(f'{OUT}/phase15f-sign.webp', 'THE IMPROVEMENT COMPANY SIGN -- the lettering aligned to its building (0 image operations)',
      [(z(was, SIGNBOX, 3), 'BEFORE: the type tilted +1.43 deg, and the source crop\'s wood came with it at partial alpha'),
       (z(now, SIGNBOX, 3), 'AFTER: de-rotated to level, letters only, centred on the board\'s inner face'),
       (guides, 'GUIDES: cyan = the board\'s own inner shadow lines (y 142 / 226, x 344 / 704); orange = the type\'s bounds (152 / 216). Margins 32/32 and 9/9'),
       (z(gilt, SIGNBOX, 3), 'ACT III: the gilt state, cut from the same corrected lettering -- the two cannot drift apart')], 2)

# ---- THE CHAPEL ---------------------------------------------------------------
CHAP = (1400, 120, 1860, 620)
ms = captures('main-street')
items = [(z(Image.open(OLD).convert('RGB'), CHAP, 2), 'BEFORE (Phase 1.5E): a steeple, a gable and a blank slab'),
         (z(Image.open(NEW).convert('RGB'), CHAP, 2), 'AFTER: door, lintel, steps, two windows, siding and a base; the board unchanged in front'),
         (z(Image.open(NEW).convert('RGB'), (1490, 330, 1750, 610), 3), '3x: the repair and the frozen board over it, no seam at the patch edge')]
if 'c06-look-notices' in ms:
    items.append((frame(ms['c06-look-notices'], (1300, 60, 2000, 700)), 'LIVE at 1:1 -- a complete building partly behind the nearer street architecture'))
sheet(f'{OUT}/phase15f-chapel.webp', 'THE CHAPEL FRONT -- one tightly masked repair, spent only after the diagnostic proved the facade had no architecture', items, 2,
      note='The board-hidden diagnosis is its own sheet: phase15f-chapel-diagnostic.webp.')

# ---- THE RAIL -----------------------------------------------------------------
rail = captures('main-street-rail')
RAILBOX = (2180, 520, 2760, 864)
order = [('r03-front-centre', 'A. THAD IN FRONT, mid-span (mud_near, plane 0): he draws over the bar'),
         ('r04-behind-centre', 'B. THAD BEHIND, mid-span (mud_mid, plane 1): the bar draws over him'),
         ('r05-behind-near-post', 'C. THAD BEHIND THE NEAR POST: the post crosses him, the bar crosses him'),
         ('r02-beside-far-post', 'D. THAD BESIDE THE FAR POST, in front: no clipping, no standing inside the rail'),
         ('r07-at-far-post', 'E. ASKED FOR THE GROUND THE FAR POST STANDS ON: he stops behind it, never inside it'),
         ('r06-front-again', 'F. BACK OUT IN FRONT: the same ground, the other side of the fence')]
items = [(frame(rail[n], RAILBOX), c) for n, c in order if n in rail]
if items:
    sheet(f'{OUT}/phase15f-rail.webp', 'THE EAST HITCHING RAIL -- depth by foot baseline, and ground to stand on behind it (0 image operations)', items, 3,
          note='THE PIE WOMAN stands at 2450,662 in every frame: she is on the far mud, so the rail draws over her too. Nothing here is Thad\'s own behaviour.')
    if 'r04-behind-centre' in rail:
        sheet(f'{OUT}/phase15f-rail-detail.webp', 'THE RAIL AT 2x -- the occlusion edge on the bar, and a second actor behind it',
              [(frame(rail['r04-behind-centre'], (2280, 600, 2680, 864), 2), 'Thad behind the bar; the pie woman behind it as well, by the same rule'),
               (frame(rail['r03-front-centre'], (2280, 600, 2680, 864), 2), 'Thad in front of the bar, from the same camera')], 2)

# ---- THE FULL STREET ----------------------------------------------------------
clean = comp(NEW, [f'{C3}/company-sign-weathered.png'])
sheet(f'{OUT}/phase15f-main-street-full.webp', 'MAIN STREET, ACT I -- the candidate after the three micro-corrections (0.53)',
      [(clean.resize((round(3610 * 0.53), round(864 * 0.53)), Image.LANCZOS), 'sign aligned; chapel front repaired; rail unchanged in art, corrected in depth')], 1)
funeral = comp(NEW, [SHEET, f'{C3}/company-sign-gilt.png'])
sheet(f'{OUT}/phase15f-act3.webp', 'MAIN STREET, ACT III -- the funeral sheet on the board, the gilt lettering on the sign',
      [(z(funeral, (1490, 330, 1800, 610), 2), 'the funeral sheet, on the same physical board'),
       (z(funeral, SIGNBOX, 2), 'the gilt lettering, on the same corrected alignment')], 2)
