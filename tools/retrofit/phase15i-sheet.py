"""PHASE 1.5I SHEET (doc 36 Q125): the front-only hitching rail, drawn.

    python3 tools/retrofit/phase15i-sheet.py

Two things a person can check in a minute:

  1. THE GEOMETRY. Every walk box the room has, over the plate, with the rear
     of the rail shaded red. The thing to see is that there is NO GREEN BEHIND
     THE RAIL -- not a thin barrier between two walkable sides, but nothing.
  2. THE CLICKS. Each sampled walk from tools/gauntlet/rail-front-only.mjs,
     drawn as the path his feet actually took, with where the click was made.

Generated from the room and the record. No art is touched.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
OUT = 'renders/opening-set-retrofit'
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
ROOM = 'content/rooms/main-street-candidate.json'
RECORD = 'renders/proofs/candidates/rail-front-only/front-only.json'
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    SMALL = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    TITLE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
except Exception:
    FONT = SMALL = TITLE = ImageFont.load_default()

room = json.load(open(ROOM))
region = room['navigation']['frontOnly'][0]
record = json.load(open(RECORD)) if os.path.exists(RECORD) else None
plate = Image.open(PLATE).convert('RGB')
trough = next(h for h in room['hotspots'] if h['id'] == 'water_trough')

WIDE = (1900, 520, 2900, 864)      # the trough, the rail, and open street both sides
SCALE = 2


def tile(view=WIDE, scale=SCALE):
    x0, y0, x1, y1 = view
    im = plate.crop(view).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.NEAREST)
    return im, ImageDraw.Draw(im, 'RGBA'), (x0, y0, scale)


def rect(d, frame, box, fill, outline, width=2):
    x0, y0, s = frame
    x, y, w, h = box
    d.rectangle([(x - x0) * s, (y - y0) * s, (x + w - x0) * s, (y + h - y0) * s],
                fill=fill, outline=outline, width=width)


def geometry():
    im, d, frame = tile()
    x0, y0, s = frame
    # EVERY WALK BOX THE ROOM HAS: this is the floor, all of it.
    for box in room['walkBoxes']:
        xs = [p['x'] for p in box['points']]
        ys = [p['y'] for p in box['points']]
        rect(d, frame, [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)],
             (80, 230, 130, 46), (110, 245, 160, 220), 2)
        cx = (min(xs) + max(xs)) / 2
        if 1900 < cx < 2900:
            d.text(((cx - x0) * s - 30, (min(ys) - y0) * s + 4), box['id'],
                   fill=(190, 255, 210), font=SMALL)
    # THE REGION THAT IS NOT PLAYER GROUND.
    rect(d, frame, region['rect'], (235, 50, 50, 86), (255, 90, 90, 235), 3)
    d.text(((region['rect'][0] - x0) * s + 8, (region['rect'][1] - y0) * s + 8),
           'NOT PLAYER GROUND', fill=(255, 190, 190), font=FONT)
    # THE POST SAFETY COLUMNS.
    for post in region['posts']:
        rect(d, frame, [post['x'][0], post['base'], post['x'][1] - post['x'][0],
                        region['rect'][1] + region['rect'][3] - post['base'] + 8],
             (255, 200, 60, 70), (255, 220, 90, 230), 2)
    # THE FRONT LINE, and the trough's approach point.
    y = region['resolveBelowY']
    d.line([(region['rect'][0] - x0) * s, (y - y0) * s,
            (region['rect'][0] + region['rect'][2] - x0) * s, (y - y0) * s],
           fill=(120, 200, 255), width=3)
    tx, ty = trough['walkTo']['x'], trough['walkTo']['y']
    d.ellipse([(tx - x0) * s - 7, (ty - y0) * s - 7, (tx - x0) * s + 7, (ty - y0) * s + 7],
              outline=(120, 200, 255), width=3)
    d.text(((tx - x0) * s - 40, (ty - y0) * s - 26), 'trough approach',
           fill=(180, 225, 255), font=SMALL)
    return im


def walk(run):
    im, d, frame = tile()
    x0, y0, s = frame
    rect(d, frame, region['rect'], (235, 50, 50, 80), (255, 90, 90, 230), 3)
    points = [((one['x'] - x0) * s, (one['y'] - y0) * s) for one in run['samples']]
    colour = (255, 120, 120) if run['broke'] else (120, 255, 160)
    if len(points) > 1:
        d.line(points, fill=colour, width=3)
    for point in points:
        d.ellipse([point[0] - 2, point[1] - 2, point[0] + 2, point[1] + 2], fill=colour)
    if points:
        d.ellipse([points[0][0] - 6, points[0][1] - 6, points[0][0] + 6, points[0][1] + 6],
                  outline=(255, 255, 255), width=2)
    ax, ay = run['at']
    d.line([(ax - x0) * s - 9, (ay - y0) * s, (ax - x0) * s + 9, (ay - y0) * s],
           fill=(255, 235, 120), width=3)
    d.line([(ax - x0) * s, (ay - y0) * s - 9, (ax - x0) * s, (ay - y0) * s + 9],
           fill=(255, 235, 120), width=3)
    return im


def sheet(out, title, items, cols, note=None):
    fw = max(im.width for im, _ in items)
    fh = max(im.height for im, _ in items)
    rows = (len(items) + cols - 1) // cols
    note_h = 28 if note else 0
    canvas = Image.new('RGB', (cols * fw + (cols + 1) * 12,
                               52 + note_h + rows * (fh + 46 + 12) + 12), (22, 22, 26))
    d = ImageDraw.Draw(canvas)
    d.text((12, 14), title, fill=(236, 236, 240), font=TITLE)
    if note:
        d.text((12, 48), note, fill=(190, 190, 200), font=FONT)
    for i, (im, cap) in enumerate(items):
        r, c = divmod(i, cols)
        x = 12 + c * (fw + 12)
        y = 52 + note_h + r * (fh + 46 + 12)
        canvas.paste(im, (x, y))
        d.text((x, y + fh + 8), cap, fill=(222, 222, 228), font=FONT)
    canvas.save(out, 'WEBP', quality=88, method=6)
    print(out, canvas.size)


sheet(f'{OUT}/phase15i-rail-geometry.webp',
      'PHASE 1.5I  Main Street, east hitching rail: the walkable floor',
      [(geometry(), 'green = every walk box  ·  red = not player ground  ·  '
                    'amber = post safety  ·  blue = the front line at y 816')],
      1,
      'THE THING TO SEE: there is no green behind the rail. Not a barrier between two walkable '
      'sides -- no floor at all.')

if record:
    order = ['behind the rail', 'on the rail', 'past the ends', 'along the front', 'the trough']
    runs = sorted(record['runs'], key=lambda r: (order.index(r['group']), r['name']))
    items = [(walk(r), f"{r['name']}  ->  {r['landed']['x']},{r['landed']['y']}"
              + ('   BEHIND THE RAIL' if r['broke'] else '')) for r in runs]
    sheet(f'{OUT}/phase15i-rail-clicks.webp',
          'PHASE 1.5I  Every click, and the path his feet took',
          items, 3,
          'Yellow cross = where the click was made. White ring = where he started. '
          f"{len(record['failures'])} failure(s).")
