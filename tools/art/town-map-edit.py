"""The district map's church, moved to the east end of town (errata 163).

The map drew the church in the middle of Main Street's north row; in the game
it stands on Lower Street, at the east end of town (errata 43, 161). One image
edit moves it, and only the town's north row is taken from the edit: every
other pixel of the map stays the shipping map's, so the markers and the roads
the map's Thad walks (content/rooms/town-map.json) stay where they are.

  python3 tools/art/town-map-edit.py prepare
      writes art/staging/town-map/edit-01/input.png: the map's town, REGION at
      1:1, drawn up 2x to the edit's 1536 x 1024.
  python3 tools/art/town-map-edit.py promote --attempt N [--write]
      reads art/staging/town-map/edit-0N/source.png, takes it back down 2x,
      and pastes only ROW (the north row) over the shipping map. Writes
      candidate.png beside it; --write also replaces
      art/backgrounds/room-00-town-map.png. Prints how much the edit moved
      outside the row, which is the measure of whether it kept to the brief.
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP = os.path.join(ROOT, 'art/backgrounds/room-00-town-map.png')
# 768 x 512 of the map, 3:2, so 2x is the edit's 1536 x 1024 exactly: the town and the bridge.
REGION = (240, 180, 768, 512)
# The town's north row, the church's row, with the road in front of it: what is taken from the edit.
ROW = (280, 200, 540, 215)


def stage(n):
    return os.path.join(ROOT, f'art/staging/town-map/edit-{n:02d}')


def prepare():
    x, y, w, h = REGION
    crop = Image.open(MAP).convert('RGB').crop((x, y, x + w, y + h))
    out = stage(1)
    os.makedirs(out, exist_ok=True)
    crop.resize((w * 2, h * 2), Image.NEAREST).save(os.path.join(out, 'input.png'))
    print(os.path.relpath(os.path.join(out, 'input.png'), ROOT))


def promote(n, write):
    x, y, w, h = REGION
    edited = Image.open(os.path.join(stage(n), 'source.png')).convert('RGB').resize((w, h), Image.BOX)
    base = Image.open(MAP).convert('RGB')
    before = np.asarray(base.crop((x, y, x + w, y + h))).astype(float)
    after = np.asarray(edited).astype(float)
    rx, ry, rw, rh = ROW
    inside = np.zeros((h, w), bool)
    inside[ry - y:ry - y + rh, rx - x:rx - x + rw] = True
    moved = np.abs(after - before).mean(axis=2)
    print(f'mean change inside the row {moved[inside].mean():.1f}, outside it {moved[~inside].mean():.1f} (0-255)')
    out = base.copy()
    out.paste(edited.crop((rx - x, ry - y, rx - x + rw, ry - y + rh)), (rx, ry))
    out.save(os.path.join(stage(n), 'candidate.png'))
    print(os.path.relpath(os.path.join(stage(n), 'candidate.png'), ROOT))
    if write:
        out.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


if __name__ == '__main__':
    if sys.argv[1:2] == ['prepare']:
        prepare()
    elif sys.argv[1:2] == ['promote']:
        promote(int(sys.argv[sys.argv.index('--attempt') + 1]), '--write' in sys.argv)
    else:
        print(__doc__)
