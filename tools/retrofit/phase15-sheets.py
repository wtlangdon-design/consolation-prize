"""PHASE 1.5 PROOF SHEETS (doc 36 Q117): the corrected Main Street and Nugget
environments, for Tyler's environment review before Phase 2 casting.

    python3 tools/retrofit/phase15-sheets.py

Reads the accepted plates, the derived companions, the corrected Nugget base
and the live captures under renders/proofs/candidates/*/raw-captures-ignored/.
Frames are downscaled whole or cropped 1:1, never resampled up except the
stove at 3x nearest for legibility. Legacy actors in live frames are context.
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
NG_OLD = 'art/backgrounds/room-03-nugget.png'
NG_CLEAN = 'art/staging/room-03/clean-plate-02/candidate-1920x864.png'
NG_BASE = 'art/staging/room-03/corrected-01/plate-cold-dirt.png'
NG_FIRE = 'art/staging/room-03/corrected-01/stove-fire-overlay.png'
PLAY = (0, 0, 1920, 864)


def load(path, crop=None, scale=1.0, nearest=False):
    im = Image.open(path).convert('RGB')
    if crop:
        im = im.crop(crop)
    if scale != 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.NEAREST if nearest else Image.LANCZOS)
    return im


def sheet(out, title, items, cols, caption_h=40, pad=12, top=52, note=None):
    fw = max(im.width for im, _ in items); fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols
    note_h = (22 * (note.count('\n') + 1) + 10) if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * pad, top + note_h + rows * (fh + caption_h + pad) + pad), (22, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((pad, 14), title, fill=(236, 236, 240), font=TITLE)
    if note:
        d.text((pad, top - 4), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols); x = pad + c * (fw + pad); y = top + note_h + r * (fh + caption_h + pad)
        canvas.paste(im, (x, y)); d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=FONT)
    canvas.save(out, 'WEBP', quality=84, method=6); print(out, canvas.size)


def captures(dir_):
    p = f'renders/proofs/candidates/{dir_}/life.json'
    if not os.path.exists(p):
        return {}
    return {c['name']: c for c in json.load(open(p))['captures'] if os.path.exists(c['file'])}


def frame(cap, crop=None, scale=1.0, nearest=False):
    cam = cap.get('camera') or 0
    im = Image.open(cap['file']).convert('RGB').crop(PLAY)
    if crop:
        x0, y0, x1, y1 = crop
        im = im.crop((x0 - cam, y0, x1 - cam, y1))
    if scale != 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.NEAREST if nearest else Image.LANCZOS)
    return im


def main_street():
    plate = Image.open(MS_PLATE).convert('RGBA')
    comp = plate.copy()
    for n in ('water-trough', 'notices-frame', 'company-sign-weathered'):
        comp.alpha_composite(Image.open(f'{MS_LAYERS}/{n}.png'))
    comp = comp.convert('RGB')
    sheet(f'{OUT}/phase15-main-street-full.webp', 'MAIN STREET, CORRECTED -- the accepted plate with its three companions, whole (0.53)',
          [(comp.resize((round(3610 * 0.53), round(864 * 0.53)), Image.LANCZOS), 'plate + water trough + framed notices + weathered lettering. The plate file itself is unchanged.')], 1,
          note='0 image operations. Trough: the shipping plate\'s own, scaled 1.9, relit. Frame: the plate\'s own post wood. Lettering: the shipping gilt art, dulled and flaked (base) or fresh (Act III).')
    caps = captures('main-street')
    live = []
    for n, c in (('c01-arrival-east-end', 'arrival: the dog on the mud east of the rail'), ('c03-thad-before-trough', 'Thad in front of the trough'), ('c05-thad-behind-trough', 'Thad BEHIND the trough: it masks him (occludes plane 1)'), ('c06-look-notices', 'LOOK AT the framed notices'), ('c07-look-sign', 'LOOK AT the lettered sign'), ('c08-near-west-rail', 'the west rail')):
        if n in caps:
            live.append((frame(caps[n], scale=0.5), f'{n}: {c}'))
    if live:
        sheet(f'{OUT}/phase15-main-street-live.webp', 'MAIN STREET, CORRECTED -- live with the accepted Thad (0.5); orange figures are LEGACY CONTEXT', live, 2)
    detail = []
    if 'c01-arrival-east-end' in caps:
        detail.append((frame(caps['c01-arrival-east-end'], (2450, 640, 2900, 864), 2, True), 'DOG / RAIL 2x: exactly one dog, on the mud, east of the rail\'s end post'))
    if 'c03-thad-before-trough' in caps:
        detail.append((frame(caps['c03-thad-before-trough'], (1900, 480, 2450, 800)), 'TROUGH 1:1, Thad in front'))
    if 'c05-thad-behind-trough' in caps:
        detail.append((frame(caps['c05-thad-behind-trough'], (1900, 420, 2450, 760)), 'TROUGH 1:1, Thad behind: legs masked'))
    if 'c06-look-notices' in caps:
        detail.append((frame(caps['c06-look-notices'], (1540, 300, 1900, 640)), 'NOTICES 1:1: a framed board on the wall'))
    if 'c07-look-sign' in caps:
        detail.append((frame(caps['c07-look-sign'], (280, 90, 780, 300)), 'SIGN 1:1: CONSOLATION IMPROVEMENT COMPANY, weathered, on the blank plate board'))
    a3 = captures('main-street-act3')
    if 'a02-gilt-sign' in a3:
        detail.append((frame(a3['a02-gilt-sign'], (280, 90, 780, 300)), 'SIGN, ACT III state: fresh gilt (?objects=company_sign=gilt)'))
    if 'a01-funeral-notice' in a3:
        detail.append((frame(a3['a01-funeral-notice'], (1540, 300, 1900, 640)), 'NOTICES, ACT III state: the funeral sheet (?objects=posted_notices=funeral)'))
    if detail:
        sheet(f'{OUT}/phase15-main-street-detail.webp', 'MAIN STREET, CORRECTED -- detail proofs', detail, 2)


def nugget():
    base = Image.open(NG_BASE).convert('RGBA')
    lit = base.copy(); lit.alpha_composite(Image.open(NG_FIRE)); lit = lit.convert('RGB')
    base = base.convert('RGB')
    sheet(f'{OUT}/phase15-nugget-old-vs-corrected.webp', 'THE NUGGET -- shipping plate, accepted clean plate, corrected base (all 0.5, same scale)',
          [(load(NG_OLD, scale=0.5), 'SHIPPING: seven people baked, chandelier lit, plank floor'),
           (load(NG_CLEAN, scale=0.5), 'ACCEPTED CANDIDATE 02: nobody, chandelier cold, plank floor (wrong: canon is dirt)'),
           (lit.resize((960, 432), Image.LANCZOS), 'CORRECTED, stove LIT: compacted dirt floor, fire as its own layer'),
           (base.resize((960, 432), Image.LANCZOS), 'CORRECTED, stove OUT: the base plate alone')], 2,
          note='1 image operation (the floor, masked to the main floor; furniture inside the mask restored byte for byte from the accepted plate). Stove: 0 operations.')
    sheet(f'{OUT}/phase15-nugget-clean.webp', 'THE NUGGET, CORRECTED -- clean people-free frame, stove lit (0.75)',
          [(lit.resize((1440, 648), Image.LANCZOS), 'dirt floor, bar, card table with the abandoned hand, piano, stove, stairs, handbill, doors and window')], 1)
    sheet(f'{OUT}/phase15-nugget-floor.webp', 'THE NUGGET -- floor detail, 1:1: accepted planks against corrected dirt; furniture unchanged',
          [(load(NG_CLEAN, (300, 480, 1260, 864)), 'ACCEPTED: planks'), (load(NG_BASE, (300, 480, 1260, 864)), 'CORRECTED: compacted dirt, worn paths, the stove pool kept'),
           (load(NG_CLEAN, (1100, 450, 1800, 864)), 'ACCEPTED: stools and spittoon'), (load(NG_BASE, (1100, 450, 1800, 864)), 'CORRECTED: the same stools and spittoon (restored from the accepted plate: 0 pixels changed)')], 2)
    caps = captures('nugget'); out = captures('nugget-stove-out')
    stove = [(load(NG_CLEAN, (1040, 280, 1140, 380), 3, True), 'ACCEPTED plate: fire baked in'),
             (lit.crop((1040, 280, 1140, 380)).resize((300, 300), Image.NEAREST), 'CORRECTED, LIT: base + fire overlay'),
             (base.crop((1040, 280, 1140, 380)).resize((300, 300), Image.NEAREST), 'CORRECTED, OUT: base alone, the firebox cold')]
    if 'c03-thad-by-stove' in caps:
        stove.append((frame(caps['c03-thad-by-stove'], (900, 250, 1300, 620)), 'LIVE, LIT: Thad by the stove in its pool and field'))
    if 's02-thad-by-cold-stove' in out:
        stove.append((frame(out['s02-thad-by-cold-stove'], (900, 250, 1300, 620)), 'LIVE, OUT: no pool, no field (?objects=stove=out)'))
    sheet(f'{OUT}/phase15-nugget-stove.webp', 'THE NUGGET -- stove state architecture: LIT and OUT (no flicker yet; Phase 2 animates the overlay)', stove, 3)
    ms = Image.open(MS_PLATE).convert('RGB')
    view = [(load(NG_BASE, (30, 20, 330, 720)), 'through the batwing doors'), (load(NG_BASE, (360, 90, 520, 410)), 'through the window'),
            (ms.crop((2380, 260, 2830, 700)), 'Main Street candidate: the saloon frontage (what the street outside is made of)'),
            (ms.crop((3050, 250, 3400, 660)), 'Main Street candidate: the assay office end')]
    sheet(f'{OUT}/phase15-nugget-street-view.webp', 'THE NUGGET -- the view onto Main Street through the doors and the window, beside the rebuilt street', view, 4,
          note='Same night, same lit-window language, same weathered clapboard. The view is the far side of the street, which no plate draws; it is not the obsolete street.')
    # THE FUTURE PATRON-ZONE DIAGNOSTIC, apart from the review sheets
    plan = json.load(open('proofs/room-03/separation-plan.json'))
    im = lit.copy(); d = ImageDraw.Draw(im, 'RGBA')
    colours = [(255, 80, 80), (80, 200, 255), (255, 220, 80), (200, 120, 255), (120, 255, 140), (255, 160, 60), (255, 120, 200), (160, 255, 255), (255, 255, 160), (200, 200, 200), (255, 90, 160)]
    for i, zone in enumerate(plan['actorZones']):
        if 'zone' not in zone:
            continue
        x, y, w, h = zone['zone']; c = colours[i % len(colours)]
        d.rectangle([x, y, x + w, y + h], outline=c + (255,), width=3, fill=c + (36,))
        d.text((x + 4, y + 4), zone['who'], fill=(255, 255, 255), font=FONT)
        if 'feet' in zone:
            fx, fy = zone['feet']; d.ellipse([fx - 5, fy - 5, fx + 5, fy + 5], fill=c + (255,))
    d.text((12, 12), 'DIAGNOSTIC ONLY -- the nine reserved patron zones (3 bar, 4 card, landing man, stove man), the absent player\'s place, Deke, the raccoon. Zone markers, no people.', fill=(255, 255, 255), font=FONT)
    im.save(f'{OUT}/nugget-patron-zones-diagnostic.png'); print(f'{OUT}/nugget-patron-zones-diagnostic.png')


if __name__ == '__main__':
    main_street(); nugget()
