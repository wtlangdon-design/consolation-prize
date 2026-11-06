"""Thad's action clips (chores) with his redrawn key poses (errata 112).

Each chore is the stand, a drawn key pose held for its middle frames, and the
stand again (doc 40; tools/rig/reseat_chore.py puts the current stand on the
ends). Here the key poses come from one sheet drawn at the cast sheet's level
(art/staging/thad-b/keyposes-03.png): every pose at ONE scale, the scale that
makes the standing pose on that sheet as tall as the chore's figure (526), each
seated on the chore's canvas with its soles on the old key pose's sole row and
its feet centred where the old key pose's feet were.

Usage: thad-chores.py <keyposes.png>
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = sys.argv[1]
# row, index in the row -> chore directory
POSES = {(0, 0): 'thad-give-offer-right', (0, 1): 'thad-pickup-low-right', (0, 2): 'thad-use-near-right',
         (0, 3): 'thad-carry-right', (0, 4): 'thad-shrug-right', (1, 0): 'thad-aboard-coach-right',
         (1, 1): 'thad-alight-coach-right'}
STANDING = (0, 3)      # pose 4 stands upright: the scale reference
CENTRED = {'thad-aboard-coach-right', 'thad-alight-coach-right'}


def cut_row(row):
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'r.png')
        info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'), SHEET, str(row), '1000', out, '--grid', '1']))
        im = Image.open(out).convert('RGBA')
        fr = info['frames']; fr = [fr[0]] + fr[2:]
        figs = []
        for x, y, w, h in fr:
            c = im.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))
        return figs, info['height']


def feet_x(a):
    """Centre of the drawn columns in the bottom 6% of a figure."""
    m = np.asarray(a)[..., 3] > 128
    rows = np.nonzero(m.any(1))[0]; b = rows[-1]; h = b - rows[0] + 1
    cols = np.nonzero(m[b - max(2, int(h * 0.06)):b + 1].any(0))[0]
    return (cols.min() + cols.max()) / 2, b


rows = {r: cut_row(r) for r in (0, 1)}
# Every figure in a row was cut at one scale (the row's tallest at 1000); bring row 1 to row 0's scale by
# the standing pose's height in the generated sheet (same pixels per man in both rows of the drawing).
src = np.asarray(Image.open(SHEET).convert('RGB')).astype(int)
d = np.sqrt((src[..., 0] - 255) ** 2 + src[..., 1] ** 2 + (src[..., 2] - 255) ** 2); fg = (d >= 120).sum(1) > 3
bands = []; s = None
for yy, on in enumerate(fg):
    if on and s is None: s = yy
    if not on and s is not None:
        if yy - s > 40: bands.append((s, yy))
        s = None
row_tall = [b - a for a, b in bands]                  # the sheet's own row heights
stand = rows[STANDING[0]][0][STANDING[1]]
man_sheet = stand.height / (1000 / row_tall[STANDING[0]])   # the standing man in sheet pixels
for (r, i), clip in POSES.items():
    fig = rows[r][0][i]
    sheet_px = fig.height / (1000 / row_tall[r])      # this pose's height in sheet pixels
    rig = json.load(open(os.path.join(ROOT, 'art/actors', clip, 'rig.json')))
    target_man = rig['figure'][1]
    k = target_man / man_sheet
    pose = fig.resize((max(1, round(fig.width * sheet_px * k / fig.height)), max(1, round(sheet_px * k))), Image.LANCZOS)
    a = np.asarray(pose).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); pose = Image.fromarray(a)
    frames = sorted(f for f in os.listdir(os.path.join(ROOT, 'art/actors', clip)) if f.endswith('.png'))
    for f in frames[1:-1]:
        p = os.path.join(ROOT, 'art/actors', clip, f)
        old = Image.open(p).convert('RGBA')
        ox, ob = feet_x(old)
        nx, nb = feet_x(pose)
        if clip in CENTRED:
            # A STEP UP OR DOWN: the lowest foot is the back foot, and lining up by it pushed the
            # figure off the canvas. The whole figure's centre goes where the old key pose's was.
            ob_ = np.nonzero((np.asarray(old)[..., 3] > 128).any(0))[0]; nb_ = np.nonzero((np.asarray(pose)[..., 3] > 128).any(0))[0]
            ox, nx = (ob_.min() + ob_.max()) / 2, (nb_.min() + nb_.max()) / 2
        canvas = Image.new('RGBA', old.size, (0, 0, 0, 0))
        canvas.alpha_composite(pose, (int(round(ox - nx)), int(ob - nb)))
        canvas.save(p)
    print(clip, 'key pose', pose.size, 'into', len(frames) - 2, 'frames')
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools/rig/reseat_chore.py'), *POSES.values()])
