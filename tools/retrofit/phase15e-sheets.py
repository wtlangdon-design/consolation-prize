"""PHASE 1.5E SHEETS (doc 36 Q121): Main Street's structural repair -- the board and the trough as plate.

    python3 tools/retrofit/phase15e-sheets.py
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
OLD = 'art/staging/room-02/street-candidate-01/candidate-plate.png'
NEW = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
C1 = 'art/staging/room-02/companions-01'; C2 = 'art/staging/room-02/companions-02'; C3 = 'art/staging/room-02/street-candidate-03'
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


def comp(plate, layers):
    im = Image.open(plate).convert('RGBA')
    for l in layers: im.alpha_composite(Image.open(l).convert('RGBA'))
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


before = comp(OLD, [f'{C2}/water-trough.png', f'{C2}/notices-board.png', f'{C1}/company-sign-weathered.png'])   # 1.5D as Tyler saw it
after = comp(NEW, [f'{C1}/company-sign-weathered.png'])
funeral = comp(NEW, [f'{C3}/notices-funeral-sheet.png', f'{C1}/company-sign-gilt.png'])
sheet(f'{OUT}/phase15e-main-street-full.webp', 'MAIN STREET, ACT I -- the structurally repaired plate (street-candidate-03), clean, 0.53',
      [(after.resize((round(3610 * 0.53), round(864 * 0.53)), Image.LANCZOS), 'the board (with its ordinary papers) and the trough + east rail are plate; only the Company lettering is a state layer here')], 1)
A = (1440, 110, 1960, 630)
sheet(f'{OUT}/phase15e-region-a.webp', 'REGION A -- board / storefront / church: before (1.5D) and after (1.5E), then the states and the structure at 3x',
      [(z(before, A, 1), 'BEFORE (1.5D as reviewed): the board overlay fused into the storefront porch; the stitch seam through the board'),
       (z(after, A, 1), 'AFTER: one structural repair -- the board freestanding on the boardwalk, the church wall continued, the porch end finished'),
       (z(after, (1560, 330, 1840, 620), 3), '3x: ORDINARY -- the plate is the board; no overlay'),
       (z(funeral, (1560, 330, 1840, 620), 3), '3x: ACT III -- only the aged funeral sheet overlays the same board'),
       (z(after, (1450, 0, 1900, 620), 2), '2x: the church front, gable and steeple untouched; its lower right wall continued behind the board; the storefront complete')], 2,
      note='The church was NOT repainted above y 335 or left of x 1585: the preflight found it intact outside the old stitch seam (Q121).')
B = (1880, 380, 2760, 864)
ms = captures('main-street')
items = [(z(before, B, 1), 'BEFORE (1.5D as reviewed): the pasted trough with its rim above the rail post, the post rising out of it'),
         (z(after, B, 1), 'AFTER: one structural repair -- trough and rail authored together, a stride of mud between them'),
         (z(after, (1950, 600, 2650, 864), 3), '3x: the patch; no compositing seam, mud continuous, contact shadows')]
if 'c03-thad-before-trough' in ms: items.append((frame(ms['c03-thad-before-trough'], (1880, 380, 2760, 864)), 'LIVE: Thad in front of the trough (mud_near, plane 0)'))
if 'c05-thad-behind-trough' in ms: items.append((frame(ms['c05-thad-behind-trough'], (1880, 380, 2760, 864)), 'LIVE: Thad behind the trough (mud_mid, plane 1): its far rim masks his feet'))
if 'c05-thad-behind-trough' in ms: items.append((frame(ms['c05-thad-behind-trough'], (1950, 600, 2400, 864), 2), '2x: the occlusion edge on the trough\'s far rim'))
sheet(f'{OUT}/phase15e-region-b.webp', 'REGION B -- trough / east hitching rail: before (1.5D) and after (1.5E), the 3x patch, Thad in front and behind', items, 2)
# the sanity pass at 1:1
sheet(f'{OUT}/phase15e-sanity.webp', 'MAIN STREET -- sanity pass at 1:1: board, adjacent building, church front, sign, trough, rail, dog zone, porches, boardwalk, patch boundaries',
      [(after.crop((1440, 0, 2000, 864)), 'board, storefront, church front; patch A boundary x 1585-1800, y 335-615'),
       (after.crop((1880, 300, 2760, 864)), 'trough, east rail, saloon porch; patch B boundary x 1960-2690, y 600-864'),
       (after.crop((2600, 400, 3400, 864)), 'the dog zone (2700-2830 x 720-780), the far east porch and boardwalk'),
       (after.crop((0, 60, 800, 864)), 'the Company sign (weathered state), the west rail and porch')], 2)
# live frames
act3 = captures('main-street-act3')
live = []
for name, cap in [('c06-look-notices', 'LOOK AT the posted notices (ordinary: plate board)'), ('c03-thad-before-trough', 'in front of the trough'), ('c05-thad-behind-trough', 'behind the trough'), ('c07-look-sign', 'the Company sign, weathered')]:
    if name in ms: live.append((frame(ms[name], scale=0.5), cap))
for name, cap in [('a01-funeral-notice', 'ACT III: the funeral sheet on the same board'), ('a02-gilt-sign', 'ACT III: the gilt lettering')]:
    if name in act3: live.append((frame(act3[name], scale=0.5), cap))
if live: sheet(f'{OUT}/phase15e-live.webp', 'MAIN STREET CANDIDATE -- live frames at half scale (Phase 1.5E)', live, 2)
# the opening set
r1 = Image.open('art/backgrounds/room-01-stage-road.png').convert('RGB')
r3 = comp('art/staging/room-03/corrected-03/plate-cold-dirt.png', ['art/staging/room-03/corrected-03/stove-fire-overlay.png'])
r5 = Image.open('art/backgrounds/room-05-assay-office.png').convert('RGB')
r2 = after.crop((1000, 0, 2920, 864))
k = 0.45
sheet(f'{OUT}/phase15e-opening-set.webp', 'THE OPENING SET -- Room 1 (shipping) -> Main Street (repaired candidate, window x 1000-2920) -> the Nugget (owner-accepted environment) -> Room 5 (shipping)',
      [(r1.resize((round(r1.width * k), round(r1.height * k)), Image.LANCZOS), 'Room 1, the stage road'), (r2.resize((round(1920 * k), round(864 * k)), Image.LANCZOS), 'Room 2, Main Street, street-candidate-03'),
       (r3.resize((round(r3.width * k), round(r3.height * k)), Image.LANCZOS), 'Room 3, the Nugget, corrected-03 (owner accepted, frozen)'), (r5.resize((round(r5.width * k), round(r5.height * k)), Image.LANCZOS), 'Room 5, the Assay Office')], 2,
      note='Environments only; no character is fixed here.')
