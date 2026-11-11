"""Winnie's walk to the loose board, cut. Errata 275: from the hem-lifted sheet (winnie-walk-2); errata 270 cut the first.

(Errata 270's account follows.) (reference/second-ledger/walk-brief.md, errata 270).

  python3 tools/art/second-ledger-walk.py

Cuts art/staging/room-05/second-ledger/walk/sheet-03.png (room-05-second-ledger operation 3: six frames of her
walking to the left in profile, drawn against her own sheet and Thad in Room 5) into art/actors/winnie-walk.png:

  - at her own height: the tallest walker is brought to the standing figure of art/actors/winnie-second-ledger.png
    (518 px, the room's man where the board is), one factor for all six (the hand-back measured them 5.5% short);
  - registered on the head, so the body holds still and the skirt and boots move, all on one sole line;
  - graded to her sheet: the walk came a shade lighter and warmer (53,53,50 at the skirt against 45,46,45);
  - snapped to the one level (errata 112), as her other frames are;
  - IN A WALK'S ORDER. As drawn, five of the six were the open stride and one had the feet together: under a long
    skirt the two contact poses are one silhouette. The cycle is built from what was drawn: stride, closing, feet
    together, and again -- drawn frames 1 3 4 2 3 4 -- so the feet pass in each half.

Writes art/staging/room-05/second-ledger/winnie-walk.json (the frames and her figureHeight). No image operation.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/room-05/second-ledger/walk2/sheet-04-fix.png')
OUT = os.path.join(ROOT, 'art/actors/winnie-walk.png')
RECORD = os.path.join(ROOT, 'art/staging/room-05/second-ledger/winnie-walk.json')
MAN, TARGET = 518, 518
ORDER = [0, 1, 2, 3, 4, 5]   # errata 275: the hem-lifted sheet is drawn in walking order
GRADE = np.array([47.6 / 57.6, 47.4 / 54.4, 45.2 / 44.5])   # her fabric on her sheet over the fabric on this one
KEY = np.array([255, 0, 255])

src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py'), '__name__': 'one_level'}
exec(src[src.index('import json'):src.index('def man_at')].replace("N = float(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 115.0", 'N = 115.0'), ns)
snap = ns['snap']


def main():
    a = np.asarray(Image.open(SHEET).convert('RGB')).astype(int)
    # Drawn pixels: far from the key, and not the key's own pink bled into an edge (red and blue both well over green).
    fg = (np.abs(a - KEY).sum(2) > 120) & ~((np.minimum(a[..., 0], a[..., 2]) - a[..., 1]) > 22)
    xs = np.flatnonzero(fg.any(0))
    groups, start, prev = [], xs[0], xs[0]
    for x in xs[1:]:
        if x - prev > 20:
            groups.append((start, prev)); start = x
        prev = x
    groups.append((start, prev))
    assert len(groups) == 7, f'the sheet holds {len(groups)} figures, not the ruler and six'
    cut = []
    for x0, x1 in groups[1:]:
        ys = np.flatnonzero(fg[:, x0:x1 + 1].any(1))
        y0, y1 = ys[0], ys[-1]
        m = fg[y0:y1 + 1, x0:x1 + 1]
        rgb = np.clip(a[y0:y1 + 1, x0:x1 + 1] * GRADE, 0, 255)
        cut.append(Image.fromarray(np.dstack([rgb, m * 255]).astype(np.uint8), 'RGBA'))
    factor = TARGET / max(c.height for c in cut)
    big = []
    for c in cut:
        im = c.resize((round(c.width * factor), round(c.height * factor)), Image.NEAREST)
        al = np.asarray(im)[..., 3] > 128
        head = al[:int(im.height * 0.25)]
        cx = int(round(np.average(np.arange(im.width), weights=head.sum(0))))
        big.append((im, cx))
    left = max(cx for _, cx in big)
    right = max(im.width - cx for im, cx in big)
    W, H = left + right + 2, TARGET + 2
    cells = []
    for im, cx in big:
        cell = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        cell.alpha_composite(im, (left - cx + 1, H - 1 - im.height))
        arr = snap(np.asarray(cell).copy(), MAN / 115.0)
        arr[arr[..., 3] <= 128] = 0
        arr[..., 3] = np.where(arr[..., 3] > 128, 255, 0)
        cells.append(Image.fromarray(arr))
    sheet = Image.new('RGBA', (2 + len(ORDER) * (W + 2), H + 4), (0, 0, 0, 0))
    frames = []
    for i, which in enumerate(ORDER):
        x = 2 + i * (W + 2)
        sheet.alpha_composite(cells[which], (x, 2))
        frames.append([x, 2, W, H])
    sheet.save(OUT, optimize=True)
    tallest = max(int((np.asarray(c)[..., 3] > 0).any(1).sum()) for c in cells)
    record = {'sheet': os.path.relpath(OUT, ROOT), 'frames': frames, 'figureHeight': tallest, 'drawnFacing': 'left',
              'order': 'as drawn: contact, down, passing, contact, down, passing',
              'source': 'winnie-walk-2 attempt 2 (art/staging/room-05/second-ledger/walk2/sheet-04-fix.png): the hem lifted, errata 275'}
    json.dump(record, open(RECORD, 'w'), indent=1)
    print(json.dumps(record))


if __name__ == '__main__':
    main()
