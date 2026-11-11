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


def stitch(self_test=False, use=None):
    use = use or {}
    total = np.zeros((BAND, SMALL_W, 3)); weight = np.zeros((BAND, SMALL_W, 1))
    for n, x in enumerate(XS, 1):
        path = os.path.join(STAGE, f'window-{n}.png' if self_test else use.get(n, f'out-{n}.png'))
        image = Image.open(path).convert('RGB')
        assert image.size == CANVAS, f'{path} is {image.size}, not {CANVAS}'
        band = np.asarray(image).astype(float)[AT[1]:AT[1] + BAND, AT[0]:AT[0] + WIN]
        cols = np.arange(WIN)
        edge = np.minimum(cols + 1, WIN - cols).astype(float)
        if x == 0: edge[:WIN // 2] = WIN
        if x + WIN == SMALL_W: edge[WIN // 2:] = WIN
        w = np.clip(edge / 200.0, 0, 1)[None, :, None]
        total[:, x:x + WIN] += band * w
        weight[:, x:x + WIN] += w
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
