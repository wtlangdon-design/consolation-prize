"""Main Street, redrawn in the side streets' hand, the composition unchanged (errata 272; reference/main-street-redraw/brief.md).

Tyler, 2026-11-10, after the tool pass (errata 268): Main Street still does not look drawn by the same hand as Lower
Street, the Lane and the Back Alley. Their plates were painted at 1536 x 1024 and a 1520 x 684 band of each was drawn
up to 1920 x 864 (errata 63; tools/art/room43-plate.mjs), so every painted pixel is 1.263 screen pixels. Main Street
was painted wider and finer. No operation paints 3700 pixels, so the street is redrawn in three windows at the side
streets' own scale, and stitched back.

  python3 tools/art/main-street-redraw.py prepare
      the shipping plate drawn down by 1.263 to 2929 x 684, cut into three windows of 1520 x 684 (x 0, 705, 1409; they
      overlap by 815), each placed in a 1536 x 1024 canvas at 8,170 -- exactly where tools/art/room43-plate.mjs crops
      from -- with the rows above and below filled by repeating the band's edge. Writes
      art/staging/room-02/redraw/window-{1,2,3}.png, the operations' inputs.
  python3 tools/art/main-street-redraw.py stitch [--self-test]
      reads art/staging/room-02/redraw/out-{1,2,3}.png (the operations' outputs; with --self-test, the inputs), crops
      each band, feathers the overlaps (each window weighted by its distance from its own edge), draws the street back
      up to 3700 x 864 with nearest-neighbour (the side streets' square pixels), and writes
      art/staging/room-02/redraw/candidate-3700x864.png. --use N=FILE takes window N from FILE in the staging folder
      instead (a correction, e.g. --use 2=out-2-fix.png), and records the choice in candidate.json. It does not promote: the builder checks the doors and exits
      against the room first (the brief's checks).
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(ROOT, 'art/backgrounds/room-02-main-street.png')
ORIGINAL = os.path.join(ROOT, 'reference/night-streets/originals/room-02-main-street.png')
STAGE = os.path.join(ROOT, 'art/staging/room-02/redraw')
W, H = 3700, 864
SMALL_W, BAND = 2929, 684           # 3700 / 1.263, 864 / 1.263
WIN = 1520
XS = [0, 705, 1409]
CANVAS = (1536, 1024)
AT = (8, 170)


def prepare():
    os.makedirs(STAGE, exist_ok=True)
    # The street before the tool pass: the redraw is the hand, and the pass is put back on it after if it is wanted.
    source = ORIGINAL if os.path.exists(ORIGINAL) else PLATE
    small = Image.open(source).convert('RGB').resize((SMALL_W, BAND), Image.LANCZOS)
    for n, x in enumerate(XS, 1):
        band = np.asarray(small.crop((x, 0, x + WIN, BAND)))
        canvas = np.zeros((CANVAS[1], CANVAS[0], 3), np.uint8)
        top, left = AT[1], AT[0]
        canvas[top:top + BAND, left:left + WIN] = band
        canvas[:top, left:left + WIN] = band[:1]
        canvas[top + BAND:, left:left + WIN] = band[-1:]
        canvas[:, :left] = canvas[:, left:left + 1]
        canvas[:, left + WIN:] = canvas[:, left + WIN - 1:left + WIN]
        out = os.path.join(STAGE, f'window-{n}.png')
        Image.fromarray(canvas).save(out)
        print('wrote', os.path.relpath(out, ROOT))


def seam(a, b):
    """The cheapest top-to-bottom path through two overlapping drawings: each row's column where they differ least,
    moving at most one column a row. Left of it is `a`, right of it `b`. (Errata 277.)"""
    cost = np.abs(a - b).sum(2)
    h, w = cost.shape
    acc = cost.copy(); back = np.zeros((h, w), int)
    for y in range(1, h):
        left = np.r_[np.inf, acc[y - 1, :-1]]; mid = acc[y - 1]; right = np.r_[acc[y - 1, 1:], np.inf]
        choice = np.argmin(np.vstack([left, mid, right]), axis=0)
        back[y] = choice - 1
        acc[y] += np.minimum(np.minimum(left, mid), right)
    path = np.zeros(h, int); path[-1] = int(np.argmin(acc[-1]))
    for y in range(h - 1, 0, -1):
        path[y - 1] = path[y] + back[y, path[y]]
    return path


def stitch(self_test=False, use=None):
    """ERRATA 277: CUT, NOT BLENDED. The windows were first feathered into each other across their overlaps. Where two
    drawings of one porch sit a few pixels apart, a blend shows both: Tyler saw the Nugget's porch posts doubled. Each
    overlap is now cut along the path where the two drawings differ least, and each pixel comes from one drawing."""
    use = use or {}
    bands = []
    for n, x in enumerate(XS, 1):
        path = os.path.join(STAGE, f'window-{n}.png' if self_test else use.get(n, f'out-{n}.png'))
        image = Image.open(path).convert('RGB')
        assert image.size == CANVAS, f'{path} is {image.size}, not {CANVAS}'
        bands.append(np.asarray(image).astype(float)[AT[1]:AT[1] + BAND, AT[0]:AT[0] + WIN])
    total = np.zeros((BAND, SMALL_W, 3))
    # Where each window takes over: between window 1 and 2 inside 705..1409 (clear of window 3), between 2 and 3
    # inside 1520..2225 (clear of window 1).
    spans = [(XS[1] + 20, XS[2] - 20), (XS[0] + WIN + 20, XS[1] + WIN - 20)]
    cuts = []
    for k, (lo, hi) in enumerate(spans):
        a = bands[k][:, lo - XS[k]:hi - XS[k]]; b = bands[k + 1][:, lo - XS[k + 1]:hi - XS[k + 1]]
        cuts.append(seam(a, b) + lo)
    cols = np.arange(SMALL_W)[None, :]
    owner = np.where(cols < cuts[0][:, None], 0, np.where(cols < cuts[1][:, None], 1, 2))
    for k, x in enumerate(XS):
        mask = owner == k
        sub = np.zeros((BAND, SMALL_W, 3)); sub[:, x:x + WIN] = bands[k]
        total[mask] = sub[mask]
    weight = np.ones((BAND, SMALL_W, 1))
    small = Image.fromarray(np.clip(total / np.maximum(weight, 1e-6), 0, 255).astype(np.uint8))
    out = small.resize((W, H), Image.NEAREST)
    path = os.path.join(STAGE, 'candidate-3700x864.png')
    out.save(path)
    print('wrote', os.path.relpath(path, ROOT))
    if not self_test:
        import json
        json.dump({str(n): use.get(n, f'out-{n}.png') for n in (1, 2, 3)}, open(os.path.join(STAGE, 'candidate.json'), 'w'), indent=1)
    if self_test:
        a = np.asarray(out).astype(float); b = np.asarray(Image.open(ORIGINAL if os.path.exists(ORIGINAL) else PLATE).convert('RGB')).astype(float)
        print('self-test: mean difference from the plate', round(float(np.abs(a - b).mean()), 2), '(the drawing down and up alone)')


if __name__ == '__main__':
    if sys.argv[1:2] == ['prepare']:
        prepare()
    elif sys.argv[1:2] == ['stitch']:
        use = {int(a.split('=')[0]): a.split('=')[1] for a in sys.argv[sys.argv.index('--use') + 1:] if '=' in a} \
            if '--use' in sys.argv else {}
        stitch('--self-test' in sys.argv, use)
    else:
        print(__doc__)
        sys.exit(2)
