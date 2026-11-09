"""Thad's coat-bundle clip, split into his clip directory (reference/act3-estate-sale/handback.md; errata 238).

act3-estate-sale operation 2 handed the clip back as a strip, art/actors/thad-coat-bundle-front.png: four frames side
by side, each on his stand-front canvas (709 x 691) at his stand-front scale (figure 626 px, soles on row 625), frame i
at x = 709 i. An art/actors/thad-* directory is one of Thad's declared clips, so the strip waited for the wiring to
declare it. This splits it, pixel for pixel, into art/actors/thad-coat-bundle-front/coat-bundle-00.png .. -03.png with
the rig.json tools/build-actor-record.mjs reads (as thad-pick-fit-back has). No pixel is changed.

    python3 tools/art/thad-coat-bundle-split.py [--write]

Then: node tools/build-actor-record.mjs thad (content/actors/thad.json gains the clip).
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STRIP = os.path.join(ROOT, 'art/actors/thad-coat-bundle-front.png')
OUT = os.path.join(ROOT, 'art/actors/thad-coat-bundle-front')
STAND = os.path.join(ROOT, 'art/actors/thad-stand-front/rig.json')
FRAMES = 4

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
    'source': 'art/actors/thad-coat-bundle-front.png',
    'clip': 'coat-bundle',
    'facing': 'front',
    'figure': stand['figure'],
    'padding': stand['padding'],
    'frames': FRAMES,
    'note': ('Doc 111 C, USE THE RACCOON with him halfway out ("Thad takes off his coat and drops it over him. There is a '
             'great deal of coat, and then a great deal of raccoon."): in his shirtsleeves, both arms round the coat with '
             'the raccoon in it. 0 braced, the raccoon\'s face and a paw out of the top, 1 a breath (derived), 2 the bundle '
             'lurching left, 3 the paw swiping out, his head back. act3-estate-sale operation 2, cut on his stand-front '
             'canvas and scale by tools/art/act3-coat-cut.py, split here by tools/art/thad-coat-bundle-split.py. Played '
             'only by the hole\'s USE, a frame a line (ResponseRule.holds; errata 238).'),
}
print(json.dumps({'canvas': [width, strip.height], 'soles': soles}))
if any(sole != stand['figure'][1] - 1 for sole in soles):
    sys.exit(f'the soles are on rows {soles}, not on row {stand["figure"][1] - 1} as his stand-front figure is')
if '--write' in sys.argv:
    os.makedirs(OUT, exist_ok=True)
    for i, frame in enumerate(frames):
        frame.save(os.path.join(OUT, f'coat-bundle-{i:02d}.png'))
    with open(os.path.join(OUT, 'rig.json'), 'w') as f:
        f.write(json.dumps(rig, indent=2) + '\n')
