"""PHASE 1.5H SHEET (doc 36 Q124): the rail's no-cross navigation, drawn.

    python3 tools/retrofit/phase15h-sheet.py

Draws each sampled walk over the plate -- the path the actor's feet actually
took, not the two ends of it -- with the fence's barrier strip shaded, so a
person can see the route go round the end instead of through the rail. The
overlay is generated from the record; no art is touched.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
RECORD = 'renders/proofs/candidates/rail-crossing/crossings.json'
VIEW = (2180, 560, 2760, 864)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = TITLE = ImageFont.load_default()

record = json.load(open(RECORD))
barrier = record['barrier']
plate = Image.open(PLATE).convert('RGB')


def draw_path(samples, colour, wide=(2180, 560, 2760, 864), scale=2):
    x0, y0, x1, y1 = wide
    tile = plate.crop(wide).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.NEAREST)
    d = ImageDraw.Draw(tile, 'RGBA')
    sx, sy, sw, sh = barrier['strip']
    d.rectangle([(sx - x0) * scale, (sy - y0) * scale, (sx + sw - x0) * scale, (sy + sh - y0) * scale],
                fill=(255, 60, 60, 70), outline=(255, 90, 90, 200))
    points = [((s['x'] - x0) * scale, (s['y'] - y0) * scale) for s in samples]
    if len(points) > 1:
        d.line(points, fill=colour, width=3)
    for point in points:
        d.ellipse([point[0] - 2, point[1] - 2, point[0] + 2, point[1] + 2], fill=colour)
    if points:
        d.ellipse([points[0][0] - 5, points[0][1] - 5, points[0][0] + 5, points[0][1] + 5], outline=(255, 255, 255), width=2)
    return tile


def sheet(out, title, items, cols, note=None):
    fw = max(im.width for im, _ in items); fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols
    note_h = 28 if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * 12, 52 + note_h + rows * (fh + 46 + 12) + 12), (22, 22, 26))
    d = ImageDraw.Draw(canvas); d.text((12, 14), title, fill=(236, 236, 240), font=TITLE)
    if note: d.text((12, 48), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols); x = 12 + c * (fw + 12); y = 52 + note_h + r * (fh + 46 + 12)
        canvas.paste(im, (x, y)); d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=FONT)
    canvas.save(out, 'WEBP', quality=88, method=6); print(out, canvas.size)


runs = {run['name']: run for run in record['runs']}
clicks = {click['name']: click for click in record['clicks']}
items = []
for name, colour, caption in [
        ('front-to-back-x2444', (120, 220, 255), 'FRONT -> BACK at the centre: round the east end, never through'),
        ('back-to-front-x2444', (255, 200, 110), 'BACK -> FRONT at the centre: the same way back'),
        ('front-to-back-x2298', (120, 220, 255), 'FRONT -> BACK at the west quarter: still round the east end'),
        ('back-to-front-x2590', (255, 200, 110), 'BACK -> FRONT at the east quarter: the short way round')]:
    if name in runs:
        items.append((draw_path(runs[name]['samples'], colour), f"{caption} ({len(runs[name]['samples'])} samples)"))
for name, caption in [('on-the-bar', 'CLICKED ON THE BAR: he stops on the ground beyond it'),
                      ('in-the-gap-beneath', 'CLICKED IN THE GAP UNDER THE BAR: he stops at the fence, not in it')]:
    if name in clicks:
        items.append((draw_path(clicks[name]['samples'], (200, 255, 160)), caption))
sheet(f'{OUT}/phase15h-rail-navigation.webp',
      'THE HITCHING RAIL -- every walk sampled every 120ms, drawn (0 image operations)', items, 2,
      note=f"The red strip is the fence's own footing, {barrier['strip']}: no walk crosses it between x "
           f"{barrier['span'][0]} and {barrier['span'][1]}. White ring = where the walk started.")
