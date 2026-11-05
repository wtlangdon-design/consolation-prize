"""Room 21's Hob, at home for the confession (doc 48 S4; doc 04 HOB_E6 had him on his rounds
at night (Main Street, the back alley)'; Tyler, 2026-11-05: the alley). No
image operation here.

His approved drawing is the actor's own (art/actors/hob-idle-right, the Room 1
casting): six idle frames, his chest breathing and his lantern flickering. In
the alley he faces left, toward the gap Thad comes in by, so the frames are
mirrored; his deliberate action is to turn and look the other way, down the
alley, as a man on his rounds does (errata 77), and that is the same frames
unmirrored. Scaled to the room's curve at his feet (tests/scale.test.ts), every
frame cut from the one box so he never shifts.

Writes art/staging/room-21/hob/hob.png and .json, and renders/room-21-hob.png.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-21')
PLATE = os.path.join(ROOT, 'art/backgrounds/room-21-watchmans-shack.png')
SRC = os.path.join(ROOT, 'art/actors/hob-idle-right')
GAP = 2
# Between his chair and the cot, beside the table. The curve:
# 438 at y 745, 515 at y 858 (reference/room-21/annotation.json).
HOB = {'x': 1240, 'y': 790}


def height_at(y):
    return 438 + (515 - 438) * (y - 745) / (858 - 745)


def main():
    frames = [Image.open(os.path.join(SRC, f'idle-{i:02d}.png')).convert('RGBA') for i in range(6)]
    box = frames[0].getbbox()
    for f in frames[1:]:
        b = f.getbbox()
        box = (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    h = round(height_at(HOB['y']))
    scale = h / (box[3] - box[1])
    w = round((box[2] - box[0]) * scale)

    def cut(f, mirror):
        c = f.crop(box).resize((w, h), Image.LANCZOS)
        a = np.asarray(c).copy()
        a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
        c = Image.fromarray(a)
        return c.transpose(Image.FLIP_LEFT_RIGHT) if mirror else c

    left = [cut(f, True) for f in frames]
    right = [cut(frames[i], False) for i in (0, 2, 4)]
    allf = left + right
    sheet = Image.new('RGBA', (len(allf) * (w + GAP) + GAP, h + 2 * GAP), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(allf):
        x = GAP + i * (w + GAP)
        sheet.alpha_composite(f, (x, GAP))
        rects.append([x, GAP, w, h])
    os.makedirs(f'{S}/hob', exist_ok=True)
    sheet.save(f'{S}/hob/hob.png')
    record = {'sheet': 'art/staging/room-21/hob/hob.png', 'frames': rects,
              'frameNames': ['facing left, rest', 'breath', 'flicker', 'breath', 'flicker', 'breath',
                             'facing right, down the alley', 'breath', 'flicker'],
              'height': h, 'posture': 'standing', 'anchor': {'x': HOB['x'], 'y': HOB['y']},
              'topLeft': {'x': HOB['x'] - w // 2, 'y': HOB['y'] - h},
              'source': 'art/actors/hob-idle-right (the approved Room 1 casting), mirrored; no image operation'}
    json.dump(record, open(f'{S}/hob/hob.json', 'w'), indent=1)
    plate = Image.open(PLATE).convert('RGBA')
    views = []
    for i in (0, 6):
        v = plate.copy()
        v.alpha_composite(allf[i], (HOB['x'] - w // 2, HOB['y'] - h))
        views.append(v.crop((800, 250, 1500, 864)))
    strip = Image.new('RGBA', (views[0].width * 2, views[0].height))
    for i, v in enumerate(views):
        strip.paste(v, (i * v.width, 0))
    strip.convert('RGB').save(os.path.join(ROOT, 'renders/room-21-hob.png'))
    print(json.dumps({k: record[k] for k in ('height', 'topLeft', 'anchor')}), w)


if __name__ == '__main__':
    main()
