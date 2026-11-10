"""Thad's four acted clips, split into his clip directories (reference/acted-directions-2/handback.md; errata 264).

acted-directions-2 handed two strips back, each frame on his idle canvas of that facing with his soles on his idle
frames' own row:

    art/actors/thad-acted2-back.png    0 the rod out to the left, 1 the same trembling, 2 the rod to the right,
                                       3 chalking on the stake, 4 one corner of the blanket lifted, 5 the other
    art/actors/thad-acted2-right.png   0 going down on one knee, a hand to the floor, 1 crawling

This splits them, pixel for pixel, into the directories tools/build-actor-record.mjs reads, one clip to a direction,
as tools/art/thad-haul-split.py did for the haul. No pixel is changed but a few dozen a frame that still carry the
key (pink: red and blue over green by more than tools/check-key-fringe.mjs allows), whose red and blue are pulled down
toward their green, as that check asks.

    python3 tools/art/thad-acted2-split.py [--write]

Then: node tools/build-actor-record.mjs thad (content/actors/thad.json gains the clips).
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image


def despill(frame):
    """Pixels with blue over green and (r + b) / 2 - g over 24: red and blue scaled toward green until it is 24."""
    a = np.array(frame).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    score = (r + b) / 2 - g
    hit = (b > g) & (score > 24) & (a[..., 3] > 0)
    k = np.where(hit, 24 / np.maximum(score, 1e-6), 1)
    a[..., 0] = np.where(hit, g + (r - g) * k, r)
    a[..., 2] = np.where(hit, g + (b - g) * k, b)
    return Image.fromarray(np.round(a).astype('uint8'), 'RGBA'), int(hit.sum())

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CLIPS = [
    ('rod', 'back', 'art/actors/thad-acted2-back.png', 6, ['stand', 0, 1, 2],
     'Doc 107, the brass rod at the two passages: 0 standing (his stand-back frame, byte for byte, as every clip an '
     'acted direction plays must begin: tests/acted-directions.test.ts), 1 held out down the left passage, 2 the same '
     'trembling (derived), 3 turned to the right passage, still. Played only by its acted direction (doc 95 row 80).'),
    ('chalk', 'back', 'art/actors/thad-acted2-back.png', 6, ['stand', 3],
     'Doc 118, the turn on the claim: 0 standing (his stand-back frame itself, so the clip is his full height and '
     'cannot pop at either end, as pick-fit is made), 1 chalking the figure on his own stake. Played only by its '
     'acted direction (doc 95 row 130).'),
    ('blanket', 'back', 'art/actors/thad-acted2-back.png', 6, ['stand', 4, 5],
     "Grievance's blanket lifted off her a corner at a time: 0 standing (his stand-back frame), 1 one corner (left "
     "hand), 2 the other (right hand). "
     'Played only by its acted direction (doc 95 row 136).'),
    ('crawl', 'right', 'art/actors/thad-acted2-right.png', 2, ['stand', 0, 1],
     'Doc 111, the séance in the dark: 0 standing (his stand-right frame itself, so the clip is his full height), '
     '1 going down on one knee, a hand to the floor, 2 crawling. Played only by its acted direction (doc 95 row 112).'),
]

for clip, facing, strip_path, count, take, note in CLIPS:
    strip = Image.open(os.path.join(ROOT, strip_path)).convert('RGBA')
    idle = json.load(open(os.path.join(ROOT, f'art/actors/thad-idle-{facing}/rig.json')))
    width = strip.width // count
    if width * count != strip.width:
        sys.exit(f'{strip_path}: {strip.width} px is not {count} frames side by side')
    stand = Image.open(os.path.join(ROOT, f'art/actors/thad-stand-{facing}/stand-00.png')).convert('RGBA')
    if stand.size != (width, strip.height):
        sys.exit(f'{clip}: his stand-{facing} canvas {stand.size} is not the strip\'s {(width, strip.height)}')
    frames = [stand if i == 'stand' else strip.crop((i * width, 0, (i + 1) * width, strip.height)) for i in take]
    cleaned = [frame if take[i] == 'stand' else despill(frame) for i, frame in enumerate(frames)]
    spilled = [0 if take[i] == 'stand' else one[1] for i, one in enumerate(cleaned)]
    frames = [one if take[i] == 'stand' else one[0] for i, one in enumerate(cleaned)]
    soles = [frame.getchannel('A').getbbox()[3] - 1 for frame in frames]
    print(json.dumps({'clip': clip, 'facing': facing, 'canvas': [width, strip.height], 'soles': soles, 'despilled': spilled}))
    # The crawl's lowest pixel is a knee or a hand on the floor: the same row as his soles.
    if any(sole != idle['figure'][1] - 1 for sole in soles):
        sys.exit(f'{clip}: the lowest drawn rows are {soles}, not row {idle["figure"][1] - 1} as his idle-{facing} figure is')
    if '--write' in sys.argv:
        out = os.path.join(ROOT, f'art/actors/thad-{clip}-{facing}')
        os.makedirs(out, exist_ok=True)
        for i, frame in enumerate(frames):
            target = os.path.join(out, f'{clip}-{i:02d}.png')
            if take[i] == 'stand':
                # Byte for byte: the file itself, not a picture of it saved again.
                shutil.copyfile(os.path.join(ROOT, f'art/actors/thad-stand-{facing}/stand-00.png'), target)
            else:
                frame.save(target)
        rig = {'source': strip_path, 'clip': clip, 'facing': facing, 'figure': idle['figure'], 'padding': idle['padding'],
               'frames': len(frames), 'note': note + ' acted-directions-2, split here by tools/art/thad-acted2-split.py (errata 264).'}
        with open(os.path.join(out, 'rig.json'), 'w') as f:
            f.write(json.dumps(rig, indent=2) + '\n')
