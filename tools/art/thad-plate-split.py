"""Thad's plate clip, split into his clip directory (reference/act2-papers/handback.md section 4; errata 246).

act2-papers operation 4 handed the clip back as a strip, art/actors/thad-plate-front.png: three frames side by side,
each on his stand-front canvas (709 x 691), soles on row 625, frame i at x = 709 i. This splits it, pixel for pixel,
into art/actors/thad-plate-front/plate-00.png .. -02.png with the rig.json tools/build-actor-record.mjs reads, as
tools/art/thad-coat-bundle-split.py did for the coat. No pixel is changed.

    python3 tools/art/thad-plate-split.py [--write]

Then: node tools/build-actor-record.mjs thad (content/actors/thad.json gains the clip).
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STRIP = os.path.join(ROOT, 'art/actors/thad-plate-front.png')
OUT = os.path.join(ROOT, 'art/actors/thad-plate-front')
STAND = os.path.join(ROOT, 'art/actors/thad-stand-front/rig.json')
FRAMES = 3

strip = Image.open(STRIP).convert('RGBA')
stand = json.load(open(STAND))
width = strip.width // FRAMES
if width * FRAMES != strip.width:
    sys.exit(f'{STRIP}: {strip.width} px is not {FRAMES} frames side by side')
frames = [strip.crop((i * width, 0, (i + 1) * width, strip.height)) for i in range(FRAMES)]
soles = []
for frame in frames:
    box = frame.getchannel('A').getbbox()
    soles.append(box[3] - 1 if box else None)
rig = {
    'source': 'art/actors/thad-plate-front.png',
    'clip': 'plate',
    'facing': 'front',
    'figure': stand['figure'],
    'padding': stand['padding'],
    'frames': FRAMES,
    'note': ('Doc 115 II-1, the collection on Boot Hill: the plate in both hands at his waist, his hat under his arm. '
             '0 holding it, 1 a breath (derived), 2 the pull, arms out to the left and his weight on his heels. '
             'act2-papers operation 4, split here by tools/art/thad-plate-split.py. Played by the room while he '
             'holds the plate (Room.actorPoses) and by the scene\'s acted directions (doc 95; errata 246).'),
}
print(json.dumps({'canvas': [width, strip.height], 'soles': soles}))
if any(sole != stand['figure'][1] - 1 for sole in soles):
    sys.exit(f'the soles are on rows {soles}, not on row {stand["figure"][1] - 1} as his stand-front figure is')
if '--write' in sys.argv:
    os.makedirs(OUT, exist_ok=True)
    for i, frame in enumerate(frames):
        frame.save(os.path.join(OUT, f'plate-{i:02d}.png'))
    with open(os.path.join(OUT, 'rig.json'), 'w') as f:
        f.write(json.dumps(rig, indent=2) + '\n')
