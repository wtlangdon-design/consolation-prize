"""Thad's haul clip, split into his clip directory (reference/press-pull/handback.md section 3; errata 253).

press-pull operation 3 handed the clip back as a strip, art/actors/thad-haul-right.png: three frames side by side,
each on his idle-right canvas (663 x 691), soles on row 625, frame i at x = 663 i. This splits it, pixel for pixel,
into art/actors/thad-haul-right/haul-00.png .. -02.png with the rig.json tools/build-actor-record.mjs reads, as
tools/art/thad-plate-split.py did for the plate. No pixel is changed.

    python3 tools/art/thad-haul-split.py [--write]

Then: node tools/build-actor-record.mjs thad (content/actors/thad.json gains the clip).
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STRIP = os.path.join(ROOT, 'art/actors/thad-haul-right.png')
OUT = os.path.join(ROOT, 'art/actors/thad-haul-right')
IDLE = os.path.join(ROOT, 'art/actors/thad-idle-right/rig.json')
FRAMES = 3

strip = Image.open(STRIP).convert('RGBA')
idle = json.load(open(IDLE))
width = strip.width // FRAMES
if width * FRAMES != strip.width:
    sys.exit(f'{STRIP}: {strip.width} px is not {FRAMES} frames side by side')
frames = [strip.crop((i * width, 0, (i + 1) * width, strip.height)) for i in range(FRAMES)]
soles = []
for frame in frames:
    box = frame.getchannel('A').getbbox()
    soles.append(box[3] - 1 if box else None)
rig = {
    'source': 'art/actors/thad-haul-right.png',
    'clip': 'haul',
    'facing': 'right',
    'figure': idle['figure'],
    'padding': idle['padding'],
    'frames': FRAMES,
    'note': ('Doc 118 O-2, the press pulled: 0 both hands on the bar, 1 his weight going back, 2 the bar home against '
             'his chest. press-pull operation 3, split here by tools/art/thad-haul-split.py. Held by the press\'s own '
             'PULL (a rule\'s `holds`; errata 253).'),
}
print(json.dumps({'canvas': [width, strip.height], 'soles': soles}))
if any(sole != idle['figure'][1] - 1 for sole in soles):
    sys.exit(f'the soles are on rows {soles}, not on row {idle["figure"][1] - 1} as his idle-right figure is')
if '--write' in sys.argv:
    os.makedirs(OUT, exist_ok=True)
    for i, frame in enumerate(frames):
        frame.save(os.path.join(OUT, f'haul-{i:02d}.png'))
    with open(os.path.join(OUT, 'rig.json'), 'w') as f:
        f.write(json.dumps(rig, indent=2) + '\n')
