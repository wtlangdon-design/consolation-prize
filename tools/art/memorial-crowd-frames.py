"""ERRATA 377: THE MEMORIAL MOURNERS' FRAMES, FROM THE REDRAWN REST FRAME. No image operation.

Errata 376 (Tyler, 2026-11-17: "Redraw the mourners"): the image session drew only the rest pose
(art/staging/memorial-crowd/rest-cut.png, reference/memorial-crowd-art/handback.md), in a cell widened 443 -> 473 with
the soles on the old row. The record's other four frames are derived from it the way tools/art/room31-cast.py derived
the old sheet's (tools/rig/room04-idles.py's method: parts move whole pixels, nothing is repainted): 1 a breath, and
2-4 a different two or three of them shifting their weight. The thirds and the shifts are room31-cast.py's.

    python3 tools/art/memorial-crowd-frames.py [--write]

Writes art/actors/room-14-town-coming-down.png and the record's frame rects (content/ambient/memorial-town.json), then
puts the sheet back on the one level with `tools/art/one-level.py --resnap --only` (this sheet only).
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
REST = 'art/staging/memorial-crowd/rest-cut.png'
SHEET = 'art/actors/room-14-town-coming-down.png'
RECORD = 'content/ambient/memorial-town.json'
GAP = 2


def lean(a, pivot, crown_dx, cols=None):
    """Shear the rows above `pivot` (in `cols` only): crown_dx px at row 0, nothing at the pivot."""
    out = a.copy()
    c0, c1 = cols if cols else (0, a.shape[1])
    seg = a[:, c0:c1].copy()
    new = seg.copy()
    for y in range(pivot):
        dx = int(round(crown_dx * (pivot - y) / pivot))
        row = np.zeros_like(seg[y])
        if dx > 0:
            row[dx:] = seg[y, :-dx]
        elif dx < 0:
            row[:dx] = seg[y, -dx:]
        else:
            row = seg[y]
        new[y] = row
    if cols:
        hole = (new[..., 3] == 0) & (seg[..., 3] > 0)
        new[hole] = seg[hole]
    out[:, c0:c1] = new
    return out


def nod(a, line, depth, cols=None):
    """The rows above `line` (in `cols` only) resampled down: depth px at row 0, nothing at the line."""
    out = a.copy()
    c0, c1 = cols if cols else (0, a.shape[1])
    for y in range(line + 1):
        src = y - int(round(depth * (line - y) / max(1, line)))
        out[y, c0:c1] = a[src, c0:c1] if src >= 0 else 0
    return out


def breath(a, waist):
    """Everything above `waist` up one pixel."""
    out = a.copy()
    out[: waist - 1] = a[1:waist]
    out[waist - 1] = a[waist]
    return out


def main():
    a = np.asarray(Image.open(R(REST)).convert('RGBA')).copy()
    h, w = a.shape[:2]
    thirds = [(0, w * 30 // 100), (w * 30 // 100, w * 62 // 100), (w * 62 // 100, w)]
    f2 = lean(lean(a, h * 85 // 100, 9, thirds[0]), h * 85 // 100, -9, thirds[2])
    f3 = nod(lean(a, h * 85 // 100, -9, thirds[1]), h * 25 // 100, 8, thirds[0])
    f4 = lean(nod(a, h * 25 // 100, 8, thirds[2]), h * 85 // 100, 9, thirds[1])
    frames = [a, breath(a, h * 50 // 100), f2, f3, f4]
    out = np.zeros((h + 2 * GAP, len(frames) * (w + GAP) + GAP, 4), np.uint8)
    rects = []
    for i, f in enumerate(frames):
        x = GAP + i * (w + GAP)
        out[GAP:GAP + h, x:x + w] = f
        rects.append([x, GAP, w, h])
    print(json.dumps(rects))
    if '--write' in sys.argv:
        Image.fromarray(out).save(R(SHEET))
        text = open(R(RECORD)).read()
        rec = json.loads(text)
        indent = next(i for i in (1, 2) if json.dumps(rec, indent=i, ensure_ascii=False) + '\n' == text)
        rec['sprite']['frames'] = rects
        rec['sprite']['frameNote'] = ('0 hats held, turned down the hill (redrawn to Thad\'s proportions, errata 376) '
                                      '· 1 breath · 2-4 a different two or three of them shifting their weight '
                                      '(derived, tools/art/memorial-crowd-frames.py)')
        open(R(RECORD), 'w').write(json.dumps(rec, indent=indent, ensure_ascii=False) + '\n')
        # A nod resamples rows by whole pixels, off the block grid (frame 3 read 9.9% finer than the level): every
        # frame back on the one level, each block one of the drawing's own colours (one-level.py, this sheet only).
        subprocess.run([sys.executable, R('tools/art/one-level.py'), '--resnap', '--only', os.path.basename(SHEET)], check=True)


if __name__ == '__main__':
    main()
