"""Thad looking up at the driver's box (thad-lookup-left, thad-idlebreak-lookup-left), rebuilt
from his redrawn pose (errata 102; art/staging/thad-b/keyposes-03.png, pose 8).

The motion is measured from the clips it replaces, not invented: every frame is
the pose with the band from 30% of his height down to the coat's hem raised d
pixels -- head and collar still, legs planted -- where d runs 0,2,4,6,4,2 (the
idle) and 0,2,4,6,4,2,0,2,4,6,4,0 (the break). The pose sits on the old canvas
(279x610), 526 tall, where the old pose sat.

Usage: thad-lookup.py <keyposes.png>
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SEQ = {'thad-lookup-left': [0, 2, 4, 6, 4, 2], 'thad-idlebreak-lookup-left': [0, 2, 4, 6, 4, 2, 0, 2, 4, 6, 4, 0]}
HEM = 357                      # the coat's hem on the 526 figure (the old clip's note)
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, 'r.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'), sys.argv[1], '1', '1000', out, '--grid', '1']))
    im = Image.open(out).convert('RGBA'); fr = info['frames']; fr = [fr[0]] + fr[2:]
    x, y, w, h = fr[2]
    pose = im.crop((x, y, x + w, y + h)); pose = pose.crop(pose.getbbox())
k = 526 / pose.height
pose = pose.resize((max(1, round(pose.width * k)), 526), Image.LANCZOS)
a = np.asarray(pose).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); pose = Image.fromarray(a)
for clip, seq in SEQ.items():
    d = os.path.join(ROOT, 'art/actors', clip)
    files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    old0 = np.asarray(Image.open(os.path.join(d, files[0])).convert('RGBA'))
    m = old0[..., 3] > 128; ys = np.nonzero(m.any(1))[0]; xs = np.nonzero(m.any(0))[0]
    W, H = old0.shape[1], old0.shape[0]
    base = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    base.alpha_composite(pose, (int((xs.min() + xs.max()) / 2 - pose.width / 2), int(ys.max() - pose.height + 1)))
    b = np.asarray(base); top = ys.max() - 525; lo = top + int(526 * 0.30); hem = top + HEM
    for f, dy in zip(files, seq):
        o = b.copy()
        if dy:
            o[lo - dy:hem - dy] = b[lo:hem]
            o[hem - dy:hem] = b[hem - 1:hem].repeat(dy, 0) if False else b[hem - dy:hem]
        Image.fromarray(o).save(os.path.join(d, f))
    print(clip, len(files), 'frames')
