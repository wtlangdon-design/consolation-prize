"""The townspeople beside Thad and the cast Tyler passed, at one game height,
enlarged with hard pixel edges so the grid can be seen (errata 111). No image
operation.

Tyler, 2026-11-06, on the first cut: "None of the new characters seem to match
the pixelation level of the cast we worked really hard on." A side-by-side at
Thad's own resolution hid it; this is what the eye compares in the game: every
figure's rest frame at the size the game draws it where he stands -- 1:1 for a
sheet with no figureHeight, otherwise the room's man at his feet times his
stature -- reduced the way the renderer reduces (a box filter), then the whole
line enlarged x3 nearest-neighbour. Thad stands at Main Street's 170. (A first
version put every figure at one height, which blew the counter figures' torsos
up to a whole man's height and their pixels with them.)

usage: python3 tools/art/townspeople-lineup.py
Writes renders/townspeople-vs-cast@3x.png.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
THAD_H = 170
ZOOM = 3

CAST = ['deke-vessel', 'sump', 'fanshawe', 'undertaker', 'lobby-clerk']
NEW = ['message-boy', 'man-leaving-tomorrow', 'boundary-a', 'boundary-b', 'dogs-owner', 'fiddler']


def rest(path, frame=None):
    img = Image.open(os.path.join(ROOT, path)).convert('RGBA')
    if frame:
        x, y, w, h = frame
        img = img.crop((x, y, x + w, y + h))
    return img.crop(img.getbbox())


def at_height(img, h):
    return img.resize((max(1, round(img.width * h / img.height)), h), Image.BOX)


def rooms():
    manifest = json.load(open(os.path.join(ROOT, 'content/manifest.json')))
    out = {}
    for path in manifest['rooms']:
        room = json.load(open(os.path.join(ROOT, path)))
        out[room['id']] = room
    return out


def man_at(room, x, y):
    """The height of a man whose feet are at (x, y): the walk box's curve (as tools/art/townspeople-refs.py)."""
    for box in room['walkBoxes']:
        xs = [p['x'] for p in box['points']]
        ys = [p['y'] for p in box['points']]
        if min(xs) <= x <= max(xs) and min(ys) <= y <= max(ys):
            mode = box['scaleMode']
            if mode['kind'] == 'fixed':
                return mode['height']
            pts = sorted([(mode['farY'], mode['farHeight']), *[tuple(s) for s in mode.get('samples', [])],
                          (mode['nearY'], mode['nearHeight'])])
            for (y0, h0), (y1, h1) in zip(pts, pts[1:]):
                if y0 <= y <= y1:
                    return h0 + (h1 - h0) * (y - y0) / (y1 - y0)
            return pts[-1][1]
    # Behind a counter, off the walk boxes: the nearest box's curve at that depth.
    ys = [p['y'] for box in room['walkBoxes'] for p in box['points']]
    return man_at(room, room['walkBoxes'][0]['points'][0]['x'], min(max(y, min(ys)), max(ys)))


def main():
    all_rooms = rooms()
    cells = [at_height(rest('art/actors/thad-stand-front/stand-00.png'), THAD_H)]
    for name in CAST + NEW:
        npc = json.load(open(os.path.join(ROOT, f'content/ambient/{name}.json')))
        s = npc['sprite']
        img = rest(s['sheet'], s['frames'][0])
        if s.get('figureHeight'):
            scale = man_at(all_rooms[npc['room']], npc['x'], npc['y']) * s.get('stature', 1.0) / s['figureHeight']
            img = at_height(img, max(1, round(img.height * scale)))
        cells.append(img)
    H = max(c.height for c in cells)
    gap = 14
    width = sum(c.width for c in cells) + gap * (len(cells) + 1) + 30
    canvas = Image.new('RGBA', (width, H + 2 * gap), (58, 50, 44, 255))
    x = gap
    for i, c in enumerate(cells):
        if i == len(CAST) + 1:
            x += 30   # the new figures, after the cast
        canvas.alpha_composite(c, (x, gap + H - c.height))
        x += c.width + gap
    out = os.path.join(ROOT, 'renders/townspeople-vs-cast@3x.png')
    canvas.resize((canvas.width * ZOOM, canvas.height * ZOOM), Image.NEAREST).convert('RGB').save(out)
    print(os.path.relpath(out, ROOT), canvas.size)


if __name__ == '__main__':
    main()
