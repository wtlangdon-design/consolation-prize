"""Thad's side walks (thad-walk-right, thad-walk-left) from his redrawn cycle (errata 102).

art/staging/thad-b/walks-04.png: two rows of six, right then left, drawn
against the cycles they replace. Each row is cut at one scale -- the scale that
makes its tallest frame as tall as the tallest old frame -- and each frame is
seated on the old frame's canvas with its soles on the old sole row and its
TORSO (rows 15-45% of the figure) centred where the old frame's torso was, so
the body travels as it did and the feet do not slide against the ground.

Usage: thad-walks.py <walks.png>
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CLIPS = ['thad-walk-right', 'thad-walk-left']


def torso_x(a):
    m = np.asarray(a)[..., 3] > 128
    rows = np.nonzero(m.any(1))[0]; t, b = rows[0], rows[-1]; h = b - t + 1
    cols = np.nonzero(m[t + int(h * 0.15):t + int(h * 0.45)].any(0))[0]
    return (cols.min() + cols.max()) / 2, b


for row, clip in enumerate(CLIPS):
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'r.png')
        info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'), sys.argv[1], str(row), '1000', out, '--grid', '1']))
        im = Image.open(out).convert('RGBA'); fr = info['frames']; fr = [fr[0]] + fr[2:]
        figs = []
        for x, y, w, h in fr:
            c = im.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))
    d = os.path.join(ROOT, 'art/actors', clip)
    files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    assert len(files) == len(figs) == 6, (len(files), len(figs))
    olds = [Image.open(os.path.join(d, f)).convert('RGBA') for f in files]
    old_tall = max(o.getbbox()[3] - o.getbbox()[1] for o in olds)
    k = old_tall / max(f.height for f in figs)
    for f, old, name in zip(figs, olds, files):
        n = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)
        a = np.asarray(n).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); n = Image.fromarray(a)
        ox, ob = torso_x(old); nx, nb = torso_x(n)
        canvas = Image.new('RGBA', old.size, (0, 0, 0, 0))
        canvas.alpha_composite(n, (int(round(ox - nx)), int(ob - nb)))
        canvas.save(os.path.join(d, name))
    print(clip, 'scale', round(k, 3))
