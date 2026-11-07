"""The district map's church, moved to the east end of town (errata 163).

The map drew the church in the middle of Main Street's north row; in the game
it stands on Lower Street, at the east end of town (errata 43, 161). One image
edit moves it, and only the town's north row is taken from the edit: every
other pixel of the map stays the shipping map's, so the markers and the roads
the map's Thad walks (content/rooms/town-map.json) stay where they are.

  python3 tools/art/town-map-edit.py prepare
      writes art/staging/town-map/edit-01/input.png: the map's town, REGION at
      1:1, drawn up 2x to the edit's 1536 x 1024.
  python3 tools/art/town-map-edit.py prepare-redraw
      THE REDRAW (errata 163 A3), which supersedes the church edit and the
      night pass: writes art/staging/town-map/redraw-01/input.png (the whole
      shipping map) and layout.png (reference/town-map/town-layout-1920x864.png,
      the town as the game has it), each in the 20:9 safe region of a
      1536 x 1024 canvas, as every room plate is laid out (derive.mjs's
      window: x 8, y 170, 1520 x 684), the margins a flat light grey.
  python3 tools/art/town-map-edit.py promote-redraw --attempt N [--write]
      reads art/staging/town-map/redraw-0N/source.png, crops the same window,
      Lanczos back to 1920 x 864, and measures how far the drawing moved
      against the day map outside the town (phase correlation over the
      edges). Writes candidate.png; --write replaces the shipping map. The
      builder re-places the markers and the roads on the result.
  python3 tools/art/town-map-edit.py prepare-pass --attempt N
      THE PASS (errata 163 A3): writes art/staging/town-map/redraw-0N/input.png,
      the shipping night map alone in the same window, for an edit of it.
  python3 tools/art/town-map-edit.py promote-redraw --attempt N [--fit] [--write]
      --fit crops to the map's drawn frame rather than the fixed window.
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


WINDOW = (8, 170, 1520, 684)


LAYOUT = os.path.join(ROOT, 'reference/town-map/town-layout-1920x864.png')


def redraw_stage(n):
    return os.path.join(ROOT, f'art/staging/town-map/redraw-{n:02d}')


def windowed(path):
    x, y, w, h = WINDOW
    canvas = Image.new('RGB', (1536, 1024), (150, 150, 150))
    canvas.paste(Image.open(path).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    return canvas


def prepare_pass(n):
    out = redraw_stage(n)
    os.makedirs(out, exist_ok=True)
    windowed(MAP).save(os.path.join(out, 'input.png'))
    print(os.path.relpath(os.path.join(out, 'input.png'), ROOT))


def prepare_redraw():
    out = redraw_stage(1)
    os.makedirs(out, exist_ok=True)
    windowed(MAP).save(os.path.join(out, 'input.png'))
    windowed(LAYOUT).save(os.path.join(out, 'layout.png'))
    print(os.path.relpath(out, ROOT))


def edges(a):
    g = a.mean(axis=2)
    return np.abs(np.diff(g, axis=0))[:, :-1] + np.abs(np.diff(g, axis=1))[:-1, :]


def shift(day, night):
    """How far the night drawing sits from the day one, by phase correlation of their edges."""
    a, b = edges(day), edges(night)
    a = (a - a.mean()) / (a.std() + 1e-9)
    b = (b - b.mean()) / (b.std() + 1e-9)
    f = np.fft.fft2(a) * np.conj(np.fft.fft2(b))
    r = np.abs(np.fft.ifft2(f / (np.abs(f) + 1e-9)))
    dy, dx = np.unravel_index(np.argmax(r), r.shape)
    if dy > r.shape[0] // 2:
        dy -= r.shape[0]
    if dx > r.shape[1] // 2:
        dx -= r.shape[1]
    return int(dx), int(dy)


def promote_redraw(n, write, fit=False):
    x, y, w, h = WINDOW
    src = Image.open(os.path.join(redraw_stage(n), 'source.png')).convert('RGB')
    if fit:
        # --fit: THE DRAWN FRAME, NOT THE WINDOW. Redraw 1 painted the whole framed map a little larger and
        # lower than the window it was handed (x 1-1534, y 148-839 for x 8-1527, y 170-853), so the fixed
        # window cut it 19 px off and showed the grey canvas along its foot. The map's frame is found
        # against the canvas grey and taken whole (errata 163).
        a = np.asarray(src).astype(int)
        grey = np.abs(a - a[3, 3]).sum(-1) < 25
        rows = np.nonzero(grey[:, 200:1300].mean(1) < 0.5)[0]
        cols = np.nonzero(grey[300:700].mean(0) < 0.5)[0]
        x, y, w, h = int(cols.min()), int(rows.min()), int(cols.max() - cols.min() + 1), int(rows.max() - rows.min() + 1)
        print(f'fitted to the drawn frame: {w} x {h} from {x},{y}')
    night = src.crop((x, y, x + w, y + h)).resize((1920, 864), Image.LANCZOS)
    # Measured outside the town, which is redrawn on purpose: the diggings, the hill, the creek.
    day = np.asarray(Image.open(MAP).convert('RGB')).astype(float)[:, 960:]
    dx, dy = shift(day, np.asarray(night).astype(float)[:, 960:])
    print(f'outside the town the new drawing sits {dx:+d},{dy:+d} px from the old one' + ('' if max(abs(dx), abs(dy)) <= 6 else ' -- the diggings moved: check every marker'))
    night.save(os.path.join(redraw_stage(n), 'candidate.png'))
    print(os.path.relpath(os.path.join(redraw_stage(n), 'candidate.png'), ROOT))
    if write:
        night.save(MAP)
        print('promoted', os.path.relpath(MAP, ROOT))


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
    elif sys.argv[1:2] == ['prepare-redraw']:
        prepare_redraw()
    elif sys.argv[1:2] == ['prepare-pass']:
        prepare_pass(int(sys.argv[sys.argv.index('--attempt') + 1]))
    elif sys.argv[1:2] == ['promote-redraw']:
        promote_redraw(int(sys.argv[sys.argv.index('--attempt') + 1]), '--write' in sys.argv, '--fit' in sys.argv)
    elif sys.argv[1:2] == ['promote']:
        promote(int(sys.argv[sys.argv.index('--attempt') + 1]), '--write' in sys.argv)
    else:
        print(__doc__)
