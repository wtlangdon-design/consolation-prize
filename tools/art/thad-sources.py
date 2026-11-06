"""Fit Thad's redrawn standing poses (errata 102) into his four rig sources.

Each new pose is keyed off the generated sheet (tools/art/cast-unify-cut.py's
clean edge), scaled so the figure is exactly as tall as the figure in the old
source, and placed on a canvas of the old source's size with the same feet row
and the same horizontal centre -- so the rig's measured rows (hem, shoulder)
land where they did, and Thad stays the size every room expects.

Usage: thad-sources.py <sheet.png> <out dir> [--views right,left]   (writes thad-stand-{right,left,front,back}-src.png)
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sheet, out = sys.argv[1], sys.argv[2]
# --views right,left: a sheet of only those views, in that order.
VIEWS = sys.argv[sys.argv.index('--views') + 1].split(',') if '--views' in sys.argv else ['right', 'left', 'front', 'back']
os.makedirs(out, exist_ok=True)


def keyed_box(a):
    d = np.sqrt((a[..., 0] - 255.0) ** 2 + a[..., 1].astype(float) ** 2 + (a[..., 2] - 255.0) ** 2)
    fg = d >= 120
    ys, xs = np.nonzero(fg)
    return fg, xs.min(), ys.min(), xs.max(), ys.max()


with tempfile.TemporaryDirectory() as tmp:
    cut = os.path.join(tmp, 'cut.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'), sheet, '0', '900', cut, '--grid', '1']))
    cs = Image.open(cut).convert('RGBA')
    frames = info['frames']
    frames = [frames[0]] + frames[2:]          # the cutter inserts a breath after the first
assert len(frames) == len(VIEWS), frames
report = {}
for view, (x, y, w, h) in zip(VIEWS, frames):
    fig = cs.crop((x, y, x + w, y + h)); fig = fig.crop(fig.getbbox())
    old = np.asarray(Image.open(os.path.join(ROOT, f'reference/casting/thad-stand-{view}-src.png')).convert('RGB'))
    _, ox0, oy0, ox1, oy1 = keyed_box(old)
    th = oy1 - oy0 + 1
    k = th / fig.height
    fig = fig.resize((max(1, round(fig.width * k)), th), Image.LANCZOS)
    a = np.asarray(fig).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); fig = Image.fromarray(a)
    canvas = Image.new('RGBA', (old.shape[1], old.shape[0]), (255, 0, 255, 255))
    cx = (ox0 + ox1) // 2
    canvas.alpha_composite(fig, (cx - fig.width // 2, oy1 - fig.height + 1))
    canvas.convert('RGB').save(os.path.join(out, f'thad-stand-{view}-src.png'))
    report[view] = {'oldFigure': [int(ox0), int(oy0), int(ox1), int(oy1)], 'newWidth': fig.width, 'height': int(th)}
print(json.dumps(report))
