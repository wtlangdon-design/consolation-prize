"""ERRATA 367: THE COLONEL AT HIS DESK, 15% BIGGER (Tyler, 2026-11-16: "Yeah fanshawe is too short behind the desk";
then "Go"). No image operation.

A behind-counter sheet is drawn 1:1 (no figureHeight), its waist on the desk's back edge. Each frame is read back to its
own art pixels -- one sample at the centre of each block of the sheet's grid, anchored at the frame's bottom-left as
tools/art/one-level.py anchors it -- and drawn again 15% larger. The frame grows about its centre, so the engine, which
centres a frame on the figure's x and stands it on its y, draws him where he was, bigger, and the bottom row (the cut
along the desk) stays the bottom row. Then the sheet is put back on the game's one level (errata 112 G: a man is 115 art
pixels) by `tools/art/one-level.py --only <sheet> --resnap`, which samples each block at its centre, so nothing is
blurred: each art pixel is one of the drawing's own, and about one row and column in seven is drawn twice.

    python3 tools/art/desk-figures-bigger.py [--write]

Each sheet and its frames are read from their first state, kept in art/staging/desk-figures-bigger/, so a re-run gives
the same pixels.

Not the lobby clerk: drawn 15% bigger he is 0.52 of a man from crown to counter, past the waist-up rule's 0.45
(tests/scale.test.ts, from the church's preacher "enormous behind the podium"); as he is, he is at it.
"""
import json
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
WRITE = '--write' in sys.argv
SCALE = 1.15
KEEP = 'art/staging/desk-figures-bigger'
# record, spriteWhen index or None, the sheet's block (its grid as shipped: tools/art/one-level.py --dry)
SHEETS = [('fanshawe', None, 4.09), ('fanshawe', 0, 4.09)]


def first_state(path):
    keep = f'{KEEP}/{os.path.basename(path)}'
    if not os.path.exists(R(keep)):
        os.makedirs(R(KEEP), exist_ok=True); shutil.copy(R(path), R(keep))
    return np.asarray(Image.open(R(keep)).convert('RGBA'))


def bigger(frame, b0, b1):
    h, w = frame.shape[:2]
    cols, rows = int(np.ceil(w / b0)), int(np.ceil(h / b0))
    w1, h1 = int(round(cols * b1)), int(round(rows * b1))
    xs = np.arange(w1); ys = np.arange(h1)
    col = np.minimum((xs / b1).astype(int), cols - 1)
    row = np.minimum(((h1 - 1 - ys) / b1).astype(int), rows - 1)          # from the bottom
    sx = np.minimum(((col + 0.5) * b0).astype(int), w - 1)
    sy = np.clip(h - 1 - ((row + 0.5) * b0).astype(int), 0, h - 1)
    return frame[sy][:, sx]


def key(name, when):
    return name if when is None else f'{name}#{when}'


def sprite(rec, when):
    return rec['sprite'] if when is None else rec['spriteWhen'][when]['sprite']


def main():
    report = []
    # the frame rects as they stood before this tool, kept with the sheets, so a re-run reads the same cells
    kept = R(f'{KEEP}/frames.json')
    if not os.path.exists(kept):
        os.makedirs(R(KEEP), exist_ok=True)
        json.dump({key(n, w): sprite(json.load(open(R(f'content/ambient/{n}.json'))), w)['frames'] for n, w, _ in SHEETS},
                  open(kept, 'w'), indent=1)
    first_frames = json.load(open(kept))
    for rec_name, when, b0 in SHEETS:
        path = R(f'content/ambient/{rec_name}.json'); text = open(path).read(); rec = json.loads(text)
        sp = sprite(rec, when)
        sheet_path = sp['sheet']; src = first_state(sheet_path)
        b1 = b0 * SCALE
        cells = [bigger(src[y:y + h, x:x + w], b0, b1) for x, y, w, h in first_frames[key(rec_name, when)]]
        cw = max(c.shape[1] for c in cells); ch = max(c.shape[0] for c in cells)
        cw += cw % 2
        out = np.zeros((ch + 4, 2 + len(cells) * (cw + 2), 4), np.uint8); new_frames = []
        for i, c in enumerate(cells):
            x = 2 + i * (cw + 2) + (cw - c.shape[1]) // 2; y = 2 + ch - c.shape[0]
            out[y:y + c.shape[0], x:x + c.shape[1]] = c
            new_frames.append([2 + i * (cw + 2), 2, cw, ch])
        report.append({'sheet': sheet_path, 'block': [b0, round(b1, 3)], 'frames': new_frames})
        if WRITE:
            Image.fromarray(out).save(R(sheet_path))
            sp['frames'] = new_frames   # a spriteWhen sheet has its own frame rects
            open(path, 'w').write(json.dumps(rec, indent=1, ensure_ascii=False) + ('\n' if text.endswith('\n') else ''))
    if WRITE:
        # back on the one level, every block one of the drawing's own colours
        subprocess.run([sys.executable, R('tools/art/one-level.py'), '--resnap', '--only',
                        *sorted({os.path.basename(r['sheet']) for r in report})], check=True)
    print(json.dumps(report, indent=1))


if __name__ == '__main__':
    main()
