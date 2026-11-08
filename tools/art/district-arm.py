"""The district map's east arm, drawn close up (errata 163 A9). No image operation here.

district-04 dressed the style-2 block-out (tools/art/district-blockout.py build --style 2) with the plan's layout,
mountains round the valley and the livery's corral, but drew the square's east arm as three buildings facing down.
The only time the arm came out right was an edit of the TOWN CLOSE UP (town-01, errata 163 A4). So:

  python3 tools/art/district-arm.py prepare --attempt N
      aligns district-0N's fitted candidate onto the block-out (ALIGN: the fit of five landmarks -- the graveyard,
      the hole, the tent, the creek at the top and at the right edge -- residuals within ~9 px), writes it as
      aligned.png, and writes arm-input.png (CROP at 3.2x, 1536 x 1024), arm-mask.png (transparent over ARM) and
      arm-plan.png (the style-2 block-out of the same CROP: where the three buildings go and which way they face).
  python3 tools/art/district-arm.py paste --attempt N --edit DIR [--write]
      takes DIR/source.png back down to CROP and pastes only ARM over aligned.png, feathered; writes
      candidate.png beside it, and with --write the shipping map.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP = os.path.join(ROOT, 'art/backgrounds/room-00-town-map.png')
# dressed = a * block + b, per axis, measured on district-04 (errata 163 A9).
ALIGN = {'x': (0.9985, 2.07), 'y': (0.9774, -5.72)}
CROP = (460, 280, 480, 320)             # 3:2, around the square's east side, in map pixels
ARM = (630, 312, 140, 256)              # the plan's three west-facing boxes, padded, in map pixels: the edit's mask
# What is pasted back: to the buildings' back walls only. district-05 also moved the loop road behind the arm ~30 px
# left; the aligned map's own road, just east of x 742, is kept.
PASTE = (630, 312, 112, 256)


def stage(n):
    return os.path.join(ROOT, f'art/staging/town-map/district-{n:02d}')


def prepare(n):
    src = Image.open(os.path.join(stage(n), 'candidate.png')).convert('RGB')
    (ax, bx), (ay, by) = ALIGN['x'], ALIGN['y']
    # output pixel p (block-out space) samples the dressing at a*p + b
    # Edges replicated first, so the shift never samples off the picture (black corners), then the map's frame
    # redrawn as the block-out draws it, since the shift moves the drawn one.
    P = 40
    a = np.asarray(src)
    padded = Image.fromarray(np.pad(a, ((P, P), (P, P), (0, 0)), mode='edge'))
    aligned = padded.transform(src.size, Image.AFFINE, (ax, 0, bx + P, 0, ay, by + P), Image.BICUBIC)
    from PIL import ImageDraw
    ImageDraw.Draw(aligned).rectangle([0, 0, src.width - 1, src.height - 1], outline=(60, 44, 30), width=6)
    aligned.save(os.path.join(stage(n), 'aligned.png'))
    x, y, w, h = CROP
    aligned.crop((x, y, x + w, y + h)).resize((1536, 1024), Image.NEAREST).save(os.path.join(stage(n), 'arm-input.png'))
    k = 1536 / w
    mask = np.full((1024, 1536, 4), 255, np.uint8)
    ax0, ay0, aw, ah = ARM
    mask[round((ay0 - y) * k):round((ay0 - y + ah) * k), round((ax0 - x) * k):round((ax0 - x + aw) * k), 3] = 0
    Image.fromarray(mask).save(os.path.join(stage(n), 'arm-mask.png'))
    plan_src = os.path.join(ROOT, f'art/staging/town-map/district-{n:02d}/input.png')
    block = Image.open(plan_src).convert('RGB')
    # the style-2 block-out at 1920 x 864 from its 20:9 window
    block = block.crop((8, 170, 8 + 1520, 170 + 684)).resize((1920, 864), Image.NEAREST)
    block.crop((x, y, x + w, y + h)).resize((1536, 1024), Image.NEAREST).save(os.path.join(stage(n), 'arm-plan.png'))
    print(os.path.relpath(stage(n), ROOT))


def paste(n, edit_dir, write):
    x, y, w, h = CROP
    edited = Image.open(os.path.join(ROOT, edit_dir, 'source.png')).convert('RGB').resize((w, h), Image.BOX)
    base = np.asarray(Image.open(os.path.join(stage(n), 'aligned.png')).convert('RGB')).astype(float)
    e = np.asarray(edited).astype(float)
    m = np.zeros(base.shape[:2])
    ax0, ay0, aw, ah = PASTE
    m[ay0:ay0 + ah, ax0:ax0 + aw] = 1
    m = ndi.gaussian_filter(m, 1.5)
    full = base.copy()
    full[y:y + h, x:x + w] = e
    out = base * (1 - m[..., None]) + full * m[..., None]
    img = Image.fromarray(out.round().clip(0, 255).astype(np.uint8))
    img.save(os.path.join(stage(n), 'candidate-arm.png'))
    print(os.path.relpath(os.path.join(stage(n), 'candidate-arm.png'), ROOT))
    if write:
        img.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


if __name__ == '__main__':
    n = int(sys.argv[sys.argv.index('--attempt') + 1])
    if sys.argv[1] == 'prepare':
        prepare(n)
    elif sys.argv[1] == 'paste':
        paste(n, sys.argv[sys.argv.index('--edit') + 1], '--write' in sys.argv)
    else:
        print(__doc__)
