"""PHASE 1.5C SHEETS (doc 36 Q119): the Nugget's one dirt floor, and the evidence
of the failed Main Street integration operation.

    python3 tools/retrofit/phase15c-sheets.py
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
NG_15B = 'art/staging/room-03/corrected-02/plate-cold-dirt.png'
NG_15C = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
NG_FIRE = 'art/staging/room-03/corrected-03/stove-fire-overlay.png'
MS_PLATE = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
MS_RAW = 'art/staging/room-02/integrate-01/window-1920x864.png'
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


def nugget():
    base = Image.open(NG_15C).convert('RGBA'); lit = base.copy(); lit.alpha_composite(Image.open(NG_FIRE)); lit = lit.convert('RGB'); base = base.convert('RGB')
    sheet(f'{OUT}/phase15c-nugget-full.webp', 'THE NUGGET, ONE DIRT FLOOR -- people-free, stove lit (0.75)', [(lit.resize((1440, 648), Image.LANCZOS), 'corrected-03: the whole public floor is one material; furniture as the model kept it; the spittoon restored by its authored silhouette')], 1)
    regions = [((680, 380, 1120, 560), 'card table'), ((1000, 380, 1300, 560), 'stove side and back wall'), ((1150, 480, 1750, 860), 'bar side'), ((480, 400, 760, 560), 'piano stool'), ((1360, 700, 1760, 864), 'spittoon and the near stool')]
    items = []
    for crop, name in regions:
        items.append((load(NG_15B, crop, 2, True), f'1.5B (rejected): {name}, 2x')); items.append((load(NG_15C, crop, 2, True), f'1.5C: {name}, 2x'))
    sheet(f'{OUT}/phase15c-nugget-floor-detail.webp', 'THE NUGGET -- the rejected 1.5B floor against the 1.5C floor, 2x nearest, the regions Tyler named', items, 2)
    sheet(f'{OUT}/phase15c-nugget-before-after.webp', 'THE NUGGET -- 1.5B (rejected) and 1.5C, same scale 0.5, with the 1.5C mask',
          [(load(NG_15B, scale=0.5), '1.5B: box restores reintroduced planks'), (lit.resize((960, 432), Image.LANCZOS), '1.5C: one floor'), (load('renders/opening-set-retrofit/phase15c-floor-mask-diagnostic.png', scale=0.5), 'THE MASK USED: the whole public floor, no furniture holes (table top only)')], 2)
    out = captures('nugget-stove-out'); caps = captures('nugget')
    stove = [(lit.crop((1040, 280, 1140, 380)).resize((300, 300), Image.NEAREST), 'LIT'), (base.crop((1040, 280, 1140, 380)).resize((300, 300), Image.NEAREST), 'OUT')]
    if 'c03-thad-by-stove' in caps: stove.append((frame(caps['c03-thad-by-stove'], (900, 250, 1300, 620)), 'LIVE, LIT'))
    if 's02-thad-by-cold-stove' in out: stove.append((frame(out['s02-thad-by-cold-stove'], (900, 250, 1300, 620)), 'LIVE, OUT'))
    sheet(f'{OUT}/phase15c-nugget-stove.webp', 'THE NUGGET -- stove states after the final floor (unchanged architecture)', stove, 4)


def main_street_failed():
    plate = Image.open(MS_PLATE).convert('RGB'); raw = Image.open(MS_RAW).convert('RGB'); W = 1200
    items = [(plate.crop((1540, 300, 1900, 620)), 'BEFORE: the papered wall (the plate)'), (raw.crop((1540 - W, 300, 1900 - W, 620)), 'RESULT: the model painted the wall away -- a window and a bench, no board, no papers'),
             (plate.crop((1900, 540, 2450, 864)), 'BEFORE: the trough site (mask y 560-800)'), (raw.crop((1900 - W, 540, 2450 - W, 864)), 'RESULT: a well-painted trough, placed at y 705-864, off the frame\'s bottom and past the rail post')]
    sheet(f'{OUT}/phase15c-street-failed-op.webp', 'MAIN STREET -- the one in-context integration operation FAILED on both subjects (evidence; nothing from it is used)', items, 2,
          note='The board zone came back as plain wall with a window; the trough was painted outside its mask and cut by the frame edge. Not composited. The plate stays candidate-01.')


if __name__ == '__main__':
    nugget(); main_street_failed()
