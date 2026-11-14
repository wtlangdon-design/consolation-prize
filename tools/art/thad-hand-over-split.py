"""Thad's hand-over clip, split into his clip directories (reference/acted-directions-3/handback.md; errata 311).

acted-directions-3 handed the clip back as two strips, art/actors/thad-hand-over-right.png and -left.png: three frames
side by side on his stand canvas in that facing, frame i at x = 663 i. 0 is his stand frame, 1 the near arm out at
chest height with the hand closed on something small, 2 his stand frame again. This splits each, pixel for pixel, into
art/actors/thad-hand-over-<facing>/hand-over-00.png .. -02.png with the rig.json tools/build-actor-record.mjs reads.
No pixel is changed.

    python3 tools/art/thad-hand-over-split.py [--write]

Then: python3 tools/art/one-level.py --only thad-hand-over-left/hand-over-01 (the mirrored arm, snapped to the
one level every figure is drawn at), and node tools/build-actor-record.mjs thad (content/actors/thad.json gains the clip).
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRAMES = 3

for facing in ('right', 'left'):
    strip = Image.open(os.path.join(ROOT, f'art/actors/thad-hand-over-{facing}.png')).convert('RGBA')
    stand = json.load(open(os.path.join(ROOT, f'art/actors/thad-stand-{facing}/rig.json')))
    width = strip.width // FRAMES
    if width * FRAMES != strip.width:
        sys.exit(f'{facing}: {strip.width} px is not {FRAMES} frames side by side')
    frames = [strip.crop((i * width, 0, (i + 1) * width, strip.height)) for i in range(FRAMES)]
    first = Image.open(os.path.join(ROOT, f'art/actors/thad-stand-{facing}/stand-00.png')).convert('RGBA')
    if frames[0].tobytes() != first.tobytes() or frames[2].tobytes() != first.tobytes():
        sys.exit(f'{facing}: frames 0 and 2 are not his stand frame, byte for byte')
    rig = {
        'source': f'art/actors/thad-hand-over-{facing}.png',
        'clip': 'hand-over',
        'facing': facing,
        'figure': stand['figure'],
        'padding': stand['padding'],
        'frames': FRAMES,
        'note': ('Errata 307, 311: Monkey Island\'s one reusable reach, for every hand-over in the game. 0 his stand, 1 the '
                 'near arm out at chest height, the hand closed on something small, 2 his stand again. Only the arm of '
                 'frame 1 is taken from the drawing, so nothing else moves. acted-directions-3, cut by '
                 'tools/art/acted3-thad-cut.py, split here.'),
    }
    print(facing, json.dumps({'canvas': [width, strip.height]}))
    if '--write' in sys.argv:
        out = os.path.join(ROOT, f'art/actors/thad-hand-over-{facing}')
        os.makedirs(out, exist_ok=True)
        for i, frame in enumerate(frames):
            frame.save(os.path.join(out, f'hand-over-{i:02d}.png'))
        # 0 and 2 ARE his stand frame, file for file, so the clip cannot pop at either end (tests/acted-directions).
        import shutil
        for i in (0, 2):
            shutil.copyfile(os.path.join(ROOT, f'art/actors/thad-stand-{facing}/stand-00.png'), os.path.join(out, f'hand-over-{i:02d}.png'))
        with open(os.path.join(out, 'rig.json'), 'w') as f:
            f.write(json.dumps(rig, indent=2) + '\n')
