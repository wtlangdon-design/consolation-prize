"""Hob at the cast sheet's level (errata 102), from one sheet: his standing pose
and a four-frame walk, his lantern in every figure (cast-unify 37,
art/staging/hob-b/stand-walk-01.png).

  1. The standing pose is fitted into his rig source
     (reference/casting/hob-stand-right.png) at the old figure's height, feet
     and centre, so the rig's measured rows hold; stand, idle and idle-break are
     then rebuilt by tools/rig/character.py with the arguments their rig.json
     recorded.
  2. The walk frames are seated on the old walk canvases (356x668) at the old
     walk's height, by the torso, soles on the old sole row. The lantern anchor
     (the handle, for the engine's light) is moved with the lantern: the old
     anchor's offset from the old lantern's glow, applied to the new glow.

Usage: hob-b.py <sheet.png>
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = sys.argv[1]
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, 'r.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'), SHEET, '0', '1000', out, '--grid', '1']))
    im = Image.open(out).convert('RGBA'); fr = info['frames']; fr = [fr[0]] + fr[2:]
    figs = []
    for x, y, w, h in fr:
        c = im.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))
assert len(figs) == 5, len(figs)


def hard(img):
    a = np.asarray(img).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); return Image.fromarray(a)


# 1. the standing source
src = os.path.join(ROOT, 'reference/casting/hob-stand-right.png')
old = np.asarray(Image.open(os.path.join(ROOT, 'art/staging/hob-b/old/hob-stand-right.png')).convert('RGB')).astype(int)
d = np.sqrt((old[..., 0] - 255) ** 2 + old[..., 1] ** 2 + (old[..., 2] - 255) ** 2); ys, xs = np.nonzero(d >= 120)
th = ys.max() - ys.min() + 1
stand = figs[0]; k = th / stand.height
stand = hard(stand.resize((round(stand.width * k), th), Image.LANCZOS))
# the old figure's centre: its body, not the lantern -- the columns of its lower half
low = (d >= 120)[ys.max() - th // 3:ys.max() + 1]; lc = np.nonzero(low.any(0))[0]
new = np.asarray(stand)[..., 3] > 0; nl = np.nonzero(new[-th // 3:].any(0))[0]
canvas = Image.new('RGBA', (old.shape[1], old.shape[0]), (255, 0, 255, 255))
canvas.alpha_composite(stand, (int((lc.min() + lc.max()) / 2 - (nl.min() + nl.max()) / 2), int(ys.max() - th + 1)))
canvas.convert('RGB').save(src)
for clip in ('hob-stand-right', 'hob-idle-right', 'hob-idlebreak-right'):
    r = json.load(open(os.path.join(ROOT, 'art/actors', clip, 'rig.json')))
    args = [sys.executable, 'tools/rig/character.py', 'reference/casting/hob-stand-right.png', '--out', f'art/actors/{clip}',
            '--key', 'magenta', '--clip', r['clip'], '--view', r.get('view', 'profile'), '--facing', r.get('facing', 'right'), '--pad', str(r.get('padding', 260))]
    res = subprocess.run(args, capture_output=True, text=True, cwd=ROOT)
    if res.returncode:
        res = subprocess.run(args + ['--pose', 'standing'], capture_output=True, text=True, cwd=ROOT)
    print(clip, res.returncode, (res.stderr or res.stdout).strip().splitlines()[-1:])


# 2. the walk
def glow(a):
    a = np.asarray(a).astype(int); m = (a[..., 3] > 128) & (a[..., 0] > 200) & (a[..., 1] > 150)
    ys, xs = np.nonzero(m); return (xs.mean(), ys.min()) if len(ys) else None


def torso_x(a):
    m = np.asarray(a)[..., 3] > 128
    rows = np.nonzero(m.any(1))[0]; t, b = rows[0], rows[-1]; h = b - t + 1
    cols = np.nonzero(m[t + int(h * 0.2):t + int(h * 0.45)].any(0))[0]
    return (cols.min() + cols.max()) / 2, b


wd = os.path.join(ROOT, 'art/actors/hob-walk-right')
rig = json.load(open(os.path.join(wd, 'rig.json')))
files = sorted(f for f in os.listdir(wd) if f.endswith('.png'))
olds = [Image.open(os.path.join(ROOT, 'art/staging/hob-b/old/hob-walk-right', f)).convert('RGBA') for f in files]
old_tall = max(o.getbbox()[3] - o.getbbox()[1] for o in olds)
k = old_tall / max(f.height for f in figs[1:])
anchors = []
for f, o, name, (ax, ay) in zip(figs[1:], olds, files, rig['lantern_anchor']):
    n = hard(f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS))
    ox, ob = torso_x(o); nx, nb = torso_x(n)
    c = Image.new('RGBA', o.size, (0, 0, 0, 0)); c.alpha_composite(n, (int(round(ox - nx)), int(ob - nb))); c.save(os.path.join(wd, name))
    og, ng = glow(o), glow(c)
    anchors.append([int(round(ax - og[0] + ng[0])), int(round(ay - og[1] + ng[1]))])
rig['lantern_anchor'] = anchors
rig['source'] = 'art/staging/hob-b/stand-walk-01.png'
rig['note'] = ("ERRATA 102: redrawn at the cast sheet's level (cast-unify 37), four frames seated on the old canvases by "
               "tools/art/hob-b.py, lantern anchors moved with the lantern. " + rig['note'])
json.dump(rig, open(os.path.join(wd, 'rig.json'), 'w'), indent=1)
print('walk anchors', anchors)
