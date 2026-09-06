"""PHASE 1.5B PROOF SHEETS (doc 36 Q118): the final environment cleanup.

    python3 tools/retrofit/phase15b-sheets.py

Main Street: the new trough (in-context prop art), the trough with Thad in
front and behind, the ordinary board and the funeral state. The Nugget: the
whole public floor as dirt, before/after at identical scale, the floor detail
sheet, the exact mask used, and the stove states after the correction.
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
MS_PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
MS_LAYERS = 'art/staging/room-02/companions-01'
NG_CLEAN = 'art/staging/room-03/clean-plate-02/candidate-1920x864.png'
NG_15 = 'art/staging/room-03/corrected-01/plate-cold-dirt.png'
NG_BASE = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
NG_FIRE = 'art/staging/room-03/corrected-03/stove-fire-overlay.png'
PLAY = (0, 0, 1920, 864)


def load(path, crop=None, scale=1.0, nearest=False):
    im = Image.open(path).convert('RGB')
    if crop: im = im.crop(crop)
    if scale != 1.0: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.NEAREST if nearest else Image.LANCZOS)
    return im


def sheet(out, title, items, cols, caption_h=40, pad=12, top=52, note=None):
    fw = max(im.width for im, _ in items); fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols
    note_h = (22 * (note.count('\n') + 1) + 10) if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * pad, top + note_h + rows * (fh + caption_h + pad) + pad), (22, 22, 26))
    d = ImageDraw.Draw(canvas); d.text((pad, 14), title, fill=(236, 236, 240), font=TITLE)
    if note: d.text((pad, top - 4), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols); x = pad + c * (fw + pad); y = top + note_h + r * (fh + caption_h + pad)
        canvas.paste(im, (x, y)); d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=FONT)
    canvas.save(out, 'WEBP', quality=84, method=6); print(out, canvas.size)


def captures(dir_):
    p = f'renders/proofs/candidates/{dir_}/life.json'
    return {c['name']: c for c in json.load(open(p))['captures'] if os.path.exists(c['file'])} if os.path.exists(p) else {}


def frame(cap, crop=None, scale=1.0, nearest=False):
    cam = cap.get('camera') or 0
    im = Image.open(cap['file']).convert('RGB').crop(PLAY)
    if crop: im = im.crop((crop[0] - cam, crop[1], crop[2] - cam, crop[3]))
    if scale != 1.0: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.NEAREST if nearest else Image.LANCZOS)
    return im


def main_street():
    plate = Image.open(MS_PLATE).convert('RGBA'); comp = plate.copy()
    for n in ('water-trough', 'notices-frame', 'company-sign-weathered'): comp.alpha_composite(Image.open(f'{MS_LAYERS}/{n}.png'))
    comp = comp.convert('RGB')
    caps = captures('main-street'); a3 = captures('main-street-act3')
    sheet(f'{OUT}/phase15b-main-street-full.webp', 'MAIN STREET, ACT I -- the accepted plate with its companions (0.53): new trough, framed board, weathered lettering',
          [(comp.resize((round(3610 * 0.53), round(864 * 0.53)), Image.LANCZOS), 'the plate file is unchanged; the trough is a companion cut from an in-context result (1 operation)')], 1)
    items = [(comp.crop((1900, 480, 2450, 760)), 'TROUGH 1:1: the new prop art in the accepted street')]
    if 'c03-thad-before-trough' in caps: items.append((frame(caps['c03-thad-before-trough'], (1900, 480, 2450, 800)), 'trough, Thad in front (live)'))
    if 'c05-thad-behind-trough' in caps: items.append((frame(caps['c05-thad-behind-trough'], (1900, 420, 2450, 760)), 'trough, Thad behind: masked by its own silhouette (live)'))
    if 'c01-arrival-east-end' in caps: items.append((frame(caps['c01-arrival-east-end'], (2450, 640, 2900, 864), 2, True), 'dog, unchanged, 2x'))
    if 'c06-look-notices' in caps: items.append((frame(caps['c06-look-notices'], (1540, 300, 1900, 640)), 'ORDINARY board, Act I (live)'))
    if 'a01-funeral-notice' in a3: items.append((frame(a3['a01-funeral-notice'], (1540, 300, 1900, 640)), 'FUNERAL state, Act III (?objects=posted_notices=funeral): paper on the board'))
    if 'c07-look-sign' in caps: items.append((frame(caps['c07-look-sign'], (280, 90, 780, 300)), 'sign, weathered (live)'))
    if 'a02-gilt-sign' in a3: items.append((frame(a3['a02-gilt-sign'], (280, 90, 780, 300)), 'sign, gilt, Act III (live)'))
    sheet(f'{OUT}/phase15b-main-street-detail.webp', 'MAIN STREET -- Phase 1.5B detail proofs', items, 2)
    fn = plate.copy(); fn.alpha_composite(Image.open(f'{MS_LAYERS}/notices-funeral.png'))
    sheet(f'{OUT}/phase15b-notice-states.webp', 'POSTED NOTICES -- the two states over the same plate, 2x nearest',
          [(comp.crop((1600, 360, 1820, 560)).resize((440, 400), Image.NEAREST), 'ordinary (Act I)'), (fn.convert('RGB').crop((1600, 360, 1820, 560)).resize((440, 400), Image.NEAREST), 'funeral (Act III): aged paper, worn edges, suggested print, tack, shadow -- no invented words')], 2)


def nugget():
    base = Image.open(NG_BASE).convert('RGBA'); lit = base.copy(); lit.alpha_composite(Image.open(NG_FIRE)); lit = lit.convert('RGB'); base = base.convert('RGB')
    sheet(f'{OUT}/phase15b-nugget-full.webp', 'THE NUGGET, CORRECTED -- the whole public floor as dirt, people-free, stove lit (0.75)', [(lit.resize((1440, 648), Image.LANCZOS), 'corrected-02: dirt from the doorway to the far wall\'s foot, the stove side, the bar side; furniture from the accepted plate')], 1)
    sheet(f'{OUT}/phase15b-nugget-before-after.webp', 'THE NUGGET -- accepted clean plate, Phase 1.5 (front floor only), Phase 1.5B (whole public floor); same scale 0.5',
          [(load(NG_CLEAN, scale=0.5), 'ACCEPTED CANDIDATE 02: planks'), (load(NG_15, scale=0.5), 'PHASE 1.5: dirt at the front, planks behind (rejected)'), (lit.resize((960, 432), Image.LANCZOS), 'PHASE 1.5B: one dirt floor'), (load('renders/opening-set-retrofit/phase15b-floor-mask-diagnostic.png', scale=0.5), 'THE MASK USED (red), furniture holes cut')], 2)
    sheet(f'{OUT}/phase15b-nugget-floor-detail.webp', 'THE NUGGET -- floor detail 1:1, Phase 1.5 against 1.5B',
          [(load(NG_15, (300, 380, 900, 700)), '1.5: piano approach and centre'), (load(NG_BASE, (300, 380, 900, 700)), '1.5B: piano approach and centre'),
           (load(NG_15, (700, 380, 1250, 640)), '1.5: card table'), (load(NG_BASE, (700, 380, 1250, 640)), '1.5B: card table'),
           (load(NG_15, (1000, 360, 1350, 620)), '1.5: stove side'), (load(NG_BASE, (1000, 360, 1350, 620)), '1.5B: stove side'),
           (load(NG_15, (1150, 480, 1800, 864)), '1.5: bar side'), (load(NG_BASE, (1150, 480, 1800, 864)), '1.5B: bar side'),
           (load(NG_15, (200, 560, 900, 864)), '1.5: foreground'), (load(NG_BASE, (200, 560, 900, 864)), '1.5B: foreground')], 2)
    out = captures('nugget-stove-out'); caps = captures('nugget')
    stove = [(lit.crop((1040, 280, 1140, 380)).resize((300, 300), Image.NEAREST), 'LIT: base + fire overlay'), (base.crop((1040, 280, 1140, 380)).resize((300, 300), Image.NEAREST), 'OUT: base alone')]
    if 'c03-thad-by-stove' in caps: stove.append((frame(caps['c03-thad-by-stove'], (900, 250, 1300, 620)), 'LIVE, LIT'))
    if 's02-thad-by-cold-stove' in out: stove.append((frame(out['s02-thad-by-cold-stove'], (900, 250, 1300, 620)), 'LIVE, OUT (?objects=stove=out)'))
    sheet(f'{OUT}/phase15b-nugget-stove.webp', 'THE NUGGET -- stove states after the floor correction (architecture unchanged)', stove, 4)


if __name__ == '__main__':
    main_street(); nugget()
