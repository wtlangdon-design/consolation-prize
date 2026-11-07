"""Cut errata 110's townspeople (reference/townspeople/brief.md) into their
shipping sheets, from the redraws at the cast's pixel size (errata 115: the
first sheets came back far finer than Thad, the second far coarser; the boy's
second redraw and the others' third land between, at Thad's and the Nugget
cast's level). No image operation: the sheets are townspeople-110's, in
art/staging/townspeople-110/<sheet>/.

Each figure is cut by tools/art/cut-ambient-sheet.py at the height the brief's
table gives (the room's man where he stands, a child's share of it for the
boy), then reassembled in the order the engine reads:

  frame 0   rest
  frame 1   a breath derived from rest (tools/rig/ambient-breath.py) -- the
            two-frame idle every standing ambient has (ruling 20)
  frame 2+  the actions the breaks play, and the TALK pose

The fiddler is the exception: his idle IS his playing, so frames 0 and 1 are
two bow positions and he has no breath.

Writes art/actors/<file>.png and art/staging/townspeople-110/cut.json (each
sheet's frames and the rest pose's own height, which the sprite declares as
`figureHeight`).

The fiddler is cut from errata 123's redraw as Charlie
(art/staging/fiddler-charlie/sheet-01.png, the fiddler-charlie cap): only his
face, hair and build changed, so the same height, order and frames.

usage: python3 tools/art/townspeople-cut.py [--only <sheet>]
  --only recuts one sheet and leaves the others, and their entries in
  cut.json, as they are (each was snapped afterwards by one-level.py).
"""
import json
import os
import subprocess
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/townspeople-110')
CUT = os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py')
BREATH = os.path.join(ROOT, 'tools/rig/ambient-breath.py')

# sheet, attempt, cut height, extra cutter args, [(out file, source pose
# indices in output order, where 'breath' derives from the first)]
FIGURES = [
    ('message-boy', 3, 109, ['--min-island', '120'],
     [('message-boy', [0, 'breath', 1, 3, 4])]),             # rest, breath, LOOK, FLIP, TALK
    ('man-leaving-tomorrow', 3, 152, ['--register', 'right'],
     [('man-leaving-tomorrow', [0, 'breath', 1, 2, 3, 4])]),  # rest, breath, REACH, LIFT, SET DOWN, TALK
    ('boundary-men', 3, 170, [],
     [('boundary-a', [0, 'breath', 1, 2]),                    # A: rest, breath, POINT, TALK
      ('boundary-b', [3, 'breath', 4, 5])]),                  # B: the same
    ('dogs-owner', 3, 317, [],
     [('dogs-owner', [0, 'breath', 1, 2, 3, 4, 'breath4'])]), # rest, breath, LOOK, CALL, TALK, GLAD, GLAD breath
    ('fiddler', 3, 288, [],
     [('fiddler', [0, 2, 1, 3, 4])]),                         # PLAY 1, PLAY 3, PLAY 2, TUNE, TALK
]
# A sheet drawn under another asset's cap, by sheet name.
SOURCE = {
    'fiddler': os.path.join(ROOT, 'art/staging/fiddler-charlie/sheet-01.png'),  # errata 123: Charlie
}
# A frame width the shipping sprite already declares, kept when a redraw cuts
# narrower, so content/ambient/<file>.json's frames stand unchanged (errata 123).
FRAME_WIDTH = {'fiddler': 144}


def cut(sheet, height, extra, tmp):
    out = os.path.join(tmp, 'cut.png')
    res = subprocess.run(['python3', CUT, sheet, str(height), out, *extra], check=True, capture_output=True, text=True)
    info = json.loads(res.stdout.strip().splitlines()[-1])
    img = Image.open(out).convert('RGBA')
    return [img.crop((x, y, x + w, y + h)) for x, y, w, h in info['frames']]


def split_pair(sheet, tmp):
    """The boundary men's one sheet as two: the widest magenta gap between the third and fourth pose."""
    a = np.asarray(Image.open(sheet).convert('RGB')).astype(int)
    fg = ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))
    cols = fg.sum(0) > 3
    runs, start = [], None
    for x, on in enumerate(cols):
        if on and start is None:
            start = x
        if not on and start is not None:
            if x - start > 40:
                runs.append((start, x))
            start = None
    assert len(runs) == 6, runs
    mid = (runs[2][1] + runs[3][0]) // 2
    img = Image.open(sheet).convert('RGB')
    left, right = os.path.join(tmp, 'a.png'), os.path.join(tmp, 'b.png')
    img.crop((0, 0, mid, img.height)).save(left)
    img.crop((mid, 0, img.width, img.height)).save(right)
    return left, right


def breath(frame, tmp):
    f0, f1 = os.path.join(tmp, 'f0.png'), os.path.join(tmp, 'f1.png')
    frame.save(f0)
    subprocess.run(['python3', BREATH, f0, f1], check=True, capture_output=True)
    return Image.open(f1).convert('RGBA')


def assemble(frames, path):
    w, h = frames[0].size
    sheet = Image.new('RGBA', (len(frames) * (w + 2) + 2, h + 4), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (2 + i * (w + 2), 2))
        rects.append([2 + i * (w + 2), 2, w, h])
    sheet.save(path)
    return rects


def standing_height(frame):
    rows = np.where(np.asarray(frame)[..., 3].any(1))[0]
    return int(rows.max() - rows.min() + 1)


def main():
    import sys
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    cut_json = os.path.join(STAGE, 'cut.json')
    report = json.load(open(cut_json)) if only and os.path.exists(cut_json) else {}
    for name, attempt, height, extra, outs in FIGURES:
        if only and name != only:
            continue
        src = SOURCE.get(name) or os.path.join(STAGE, name, f'sheet-{attempt:02d}.png')
        with tempfile.TemporaryDirectory() as tmp:
            if name == 'boundary-men':
                a, b = split_pair(src, tmp)
                poses = cut(a, height, extra, tmp) + cut(b, height, extra, tmp)
            else:
                poses = cut(src, height, extra, tmp)
            for out, order in outs:
                frames = []
                for k in order:
                    if k == 'breath':
                        frames.append(breath(frames[0], tmp))
                    elif k == 'breath4':
                        frames.append(breath(poses[4], tmp))
                    else:
                        frames.append(poses[k])
                # Frames from two halves of one sheet are cut separately and
                # may differ in width; pad to the widest, feet kept centred.
                w = max([f.width for f in frames] + [FRAME_WIDTH.get(out, 0)])
                hh = max(f.height for f in frames)
                padded = []
                for f in frames:
                    c = Image.new('RGBA', (w, hh), (0, 0, 0, 0))
                    c.alpha_composite(f, ((w - f.width) // 2, hh - f.height))
                    padded.append(c)
                path = os.path.join(ROOT, 'art/actors', f'{out}.png')
                rects = assemble(padded, path)
                report[out] = {'sheet': f'art/actors/{out}.png', 'source': os.path.relpath(src, ROOT),
                               'frames': rects, 'figureHeight': standing_height(padded[0])}
                print(out, len(rects), 'frames', rects[0][2:], 'standing', report[out]['figureHeight'])
    with open(cut_json, 'w') as f:
        json.dump(report, f, indent=1)


if __name__ == '__main__':
    main()
