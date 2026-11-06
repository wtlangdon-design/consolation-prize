"""Every character in the game side by side, at the size the player sees them.

Tyler, 2026-11-06: "put all characters in the game side by side in a line up. I
want them to all look like they were drawn by the same artist for the same game
at the same time."

Each figure is drawn at its IN-GAME size relative to a standing man at its own
feet in its own room (the room's depth curve), and the whole line-up is then
scaled so that man is MAN pixels tall. So two figures that look different sizes
here look different sizes in the game, and the pixel size each shows is the pixel
size the player sees -- which is what makes a figure feel drawn by another hand.
Nearest-neighbour throughout. Thad stands first, as the standard (CLAUDE.md:
"The standard is Thad's look").

Writes renders/character-lineup.png (and character-lineup.json: who, sheet, scale).
    python3 tools/art/character-lineup.py
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAN = 300
GAP = 26
PER_ROW = 11
BG = (58, 58, 66)


def read(path):
    with open(os.path.join(ROOT, path)) as f:
        return json.load(f)


manifest = read('content/manifest.json')
rooms = {}
for path in manifest['rooms']:
    r = read(path)
    rooms[r['id']] = r


def height_in(box, y):
    m = box['scaleMode']
    if m['kind'] == 'fixed':
        return m['height']
    pts = sorted([[m['farY'], m['farHeight']], *m.get('samples', []), [m['nearY'], m['nearHeight']]])
    y = max(pts[0][0], min(pts[-1][0], y)) if 'beyondY' not in m or y >= m['farY'] else y
    if 'beyondY' in m and y < m['farY']:
        up = m['farY'] - m['beyondY']
        k = max(0, min(1, (y - m['beyondY']) / up)) if up > 0 else 0
        return m['beyondHeight'] + (m['farHeight'] - m['beyondHeight']) * k
    for (y0, h0), (y1, h1) in zip(pts, pts[1:]):
        if y0 <= y <= y1:
            return h0 + (h1 - h0) * ((y - y0) / (y1 - y0) if y1 != y0 else 0)
    return pts[-1][1]


def man_at(room_id, x, y):
    room = rooms.get(room_id)
    if not room or not room.get('walkBoxes'):
        return None
    best = None
    for box in room['walkBoxes']:
        xs = [p['x'] for p in box['points']]
        ys = [p['y'] for p in box['points']]
        dx = max(min(xs) - x, 0, x - max(xs))
        dy = max(min(ys) - y, 0, y - max(ys))
        d = dx * dx + dy * dy
        if best is None or d < best[0]:
            best = (d, box)
    return height_in(best[1], y)


def frame_of(sheet, frame):
    fx, fy, fw, fh = frame
    im = Image.open(os.path.join(ROOT, sheet)).convert('RGBA').crop((fx, fy, fx + fw, fy + fh))
    bb = im.getbbox()
    return im.crop(bb) if bb else im, (bb[3] - bb[1]) if bb else fh


entries = []
# THAD, the standard: drawn at the man's height by definition.
thad = read('content/actors/thad.json')
stand = next(c for c in thad['clips'] if c['id'] == 'stand' and c['facing'] == 'front')
im = Image.open(os.path.join(ROOT, stand['frames'][0])).convert('RGBA')
im = im.crop(im.getbbox())
entries.append(('THAD (the standard)', 'actor', im, MAN / im.height, stand['frames'][0]))
hob = read('content/actors/hob.json')
hs = next(c for c in hob['clips'] if c['id'] == 'stand')
im = Image.open(os.path.join(ROOT, hs['frames'][0])).convert('RGBA')
im = im.crop(im.getbbox())
entries.append(('HOB (opening actor)', 'actor', im, MAN * 1.04 / im.height, hs['frames'][0]))

for path in manifest['ambient']:
    a = read(path)
    sp = a.get('sprite')
    if not sp or not sp.get('frames'):
        continue
    im, drawn_h = frame_of(sp['sheet'], sp['frames'][0])
    man = man_at(a['room'], a['x'], a['y'])
    if man is None:
        continue
    fh = sp.get('figureHeight')
    in_game = (man * sp.get('stature', 1) / fh) if fh else 1.0   # sheet pixels -> screen pixels
    rel = in_game / man                                         # screen pixels per man-height
    entries.append((a.get('name', a['id']) + f"\n{a['id']} · {a['room']}", a.get('posture', ''), im, rel * MAN, sp['sheet']))

font = ImageFont.load_default()
cells = []
for name, posture, im, scale, sheet in entries:
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    cells.append((name, posture, im.resize((w, h), Image.NEAREST), sheet, scale))
rows = [cells[i:i + PER_ROW] for i in range(0, len(cells), PER_ROW)]
row_h = int(MAN * 1.25) + 60
width = max(sum(c[2].width for c in row) + GAP * (len(row) + 1) for row in rows)
out = Image.new('RGB', (width, row_h * len(rows)), BG)
draw = ImageDraw.Draw(out)
for r, row in enumerate(rows):
    base = r * row_h + int(MAN * 1.2)
    draw.line([(0, base), (width, base)], fill=(80, 80, 90))
    draw.line([(0, base - MAN), (width, base - MAN)], fill=(70, 70, 80))
    x = GAP
    for name, posture, im, sheet, scale in row:
        out.paste(im, (x, base - im.height), im)
        draw.multiline_text((x, base + 6), name, fill=(220, 220, 220), font=font)
        x += im.width + GAP
out.save(os.path.join(ROOT, 'renders/character-lineup.png'))
with open(os.path.join(ROOT, 'renders/character-lineup.json'), 'w') as f:
    json.dump([{'who': c[0], 'posture': c[1], 'sheet': c[3], 'scale': round(c[4], 3)} for c in cells], f, indent=1)
    f.write('\n')
print(len(cells), 'figures;', out.size)
