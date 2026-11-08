"""The town on the district map, placed by code (errata 163 A5).

Tyler, 2026-11-07: "I really want it to look as similar to the actual game as possible ... Why wouldn't we give
cc more specific instructions to do it totally right?" Four tries showed the image model will not follow a
layout: asked to rearrange the town it redrew all of it or dropped half. So it draws only BUILDINGS, on
magenta, and this places them where reference/town-map/town-plan.json says, read off the game's plates.

  python3 tools/art/town-map-pieces.py assemble --attempt N [--sheet path]
      cuts the pieces sheet (default art/staging/town-map/pieces-0N/source.png) on its magenta key, clears the
      plan's `clear` boxes from their `from` patches, sets each piece in its box, and writes
      art/staging/town-map/pieces-0N/assembled.png (the whole map) and, for the finishing pass,
      finish-input.png and finish-mask.png (the town region at 2x, 1536 x 1024; the mask transparent only
      over the plan's `finish` boxes).
  python3 tools/art/town-map-pieces.py finish --attempt N [--write]
      takes the finishing pass's source.png back down 2x and pastes ONLY the finish boxes over the assembly,
      so nothing outside them moves; writes candidate.png beside it, and with --write the shipping map.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP = os.path.join(ROOT, 'art/backgrounds/room-00-town-map.png')
PLAN = os.path.join(ROOT, 'reference/town-map/town-plan.json')
# The town at 2x for the finishing pass: 768 x 512 of the map is the edit's 1536 x 1024 exactly.
REGION = (160, 160, 768, 512)


def stage(n):
    return os.path.join(ROOT, f'art/staging/town-map/pieces-{n:02d}')


def cut(sheet):
    """The buildings on a magenta sheet, left to right, each cropped to its own opaque box."""
    a = np.asarray(sheet.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    key = (r > 150) & (b > 150) & (g < 110)
    alpha = np.where(key, 0, 255).astype(np.uint8)
    rgba = np.dstack([a.astype(np.uint8), alpha])
    cols = (alpha > 0).sum(axis=0) > 3
    runs, start = [], None
    for x, on in enumerate(list(cols) + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            if x - start > 20:
                runs.append((start, x))
            start = None
    pieces = []
    for x0, x1 in runs:
        part = rgba[:, x0:x1]
        rows = np.where((part[..., 3] > 0).sum(axis=1) > 2)[0]
        img = Image.fromarray(part[rows[0]:rows[-1] + 1])
        pieces.append(img)
    return pieces


def assemble(n, sheet_path=None):
    plan = json.load(open(PLAN))
    out = np.asarray(Image.open(MAP).convert('RGB')).copy()
    for c in plan['clear']:
        x, y, w, h = c['box']
        fx, fy, fw, fh = c['from']
        patch = out[fy:fy + fh, fx:fx + fw]
        reps = (int(np.ceil(h / fh)), int(np.ceil(w / fw)), 1)
        out[y:y + h, x:x + w] = np.tile(patch, reps)[:h, :w]
    img = Image.fromarray(out)
    sheet = Image.open(sheet_path or os.path.join(stage(n), 'source.png'))
    pieces = cut(sheet)
    order = plan['pieces']['order']
    if len(pieces) != len(order):
        raise SystemExit(f'the sheet has {len(pieces)} buildings on its key, the plan wants {len(order)} ({", ".join(order)})')
    for name, piece in zip(order, pieces):
        x, y, w, h = plan['pieces']['boxes'][name]
        scale = min(h / piece.height, w / piece.width)
        small = piece.resize((max(1, round(piece.width * scale)), max(1, round(piece.height * scale))), Image.BOX)
        a = np.asarray(small)
        hard = np.dstack([a[..., :3], np.where(a[..., 3] > 128, 255, 0).astype(np.uint8)])
        img.paste(Image.fromarray(hard[..., :3]), (x, y + h - small.height), Image.fromarray(hard[..., 3]))
        print(f'{name}: {piece.width}x{piece.height} -> {small.width}x{small.height} at {x},{y + h - small.height}')
    os.makedirs(stage(n), exist_ok=True)
    img.save(os.path.join(stage(n), 'assembled.png'))
    rx, ry, rw, rh = REGION
    img.crop((rx, ry, rx + rw, ry + rh)).resize((rw * 2, rh * 2), Image.NEAREST).save(os.path.join(stage(n), 'finish-input.png'))
    mask = np.full((rh * 2, rw * 2, 4), 255, np.uint8)
    for x, y, w, h in boxes(plan):
        mask[(y - ry) * 2:(y - ry + h) * 2, (x - rx) * 2:(x - rx + w) * 2, 3] = 0
    Image.fromarray(mask).save(os.path.join(stage(n), 'finish-mask.png'))
    print(os.path.relpath(stage(n), ROOT))


def boxes(plan):
    pad = plan['finish']['pad']
    for x, y, w, h in [c['box'] for c in plan['clear']] + list(plan['pieces']['boxes'].values()):
        yield x - pad, y - pad, w + 2 * pad, h + 2 * pad


def finish(n, write):
    plan = json.load(open(PLAN))
    rx, ry, rw, rh = REGION
    edited = Image.open(os.path.join(stage(n), 'finish', 'source.png')).convert('RGB').resize((rw, rh), Image.BOX)
    out = Image.open(os.path.join(stage(n), 'assembled.png')).convert('RGB')
    for x, y, w, h in boxes(plan):
        out.paste(edited.crop((x - rx, y - ry, x - rx + w, y - ry + h)), (x, y))
    out.save(os.path.join(stage(n), 'candidate.png'))
    print(os.path.relpath(os.path.join(stage(n), 'candidate.png'), ROOT))
    if write:
        out.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


if __name__ == '__main__':
    n = int(sys.argv[sys.argv.index('--attempt') + 1]) if '--attempt' in sys.argv else 1
    if sys.argv[1:2] == ['assemble']:
        assemble(n, sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None)
    elif sys.argv[1:2] == ['finish']:
        finish(n, '--write' in sys.argv)
    else:
        print(__doc__)
