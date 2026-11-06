"""Walk cycles redrawn on Thad's six poses (Tyler, 2026-11-06, of the walks recorded in the game:
"Thad and the racoons are good. Hob could be better generally. Hob at the funeral isn't great.
Deke isn't great. Pratt is horrible.").

art/staging/walk-c/<who>-walk-NN.png (cast-unify 40-45; Hob's second drawing (44) and Pratt's third (45)
state which leg leads in which frames, Pratt's every pose -- the first had the same leg in front
in all six, Pratt's second the same stride six times): one row of six frames walking RIGHT, each
pose copied from Thad's walk (art/staging/walk-c/thad-walk-poses.png), which is the walk Tyler
passed. Each row is cut at one scale, its tallest frame as tall as the walk it replaces, and every
frame is seated with its soles on one row and its TORSO (15-45% down the figure) on one column, so
the body travels steadily and the legs do the walking -- the method of tools/art/thad-walks.py.

  hob     art/actors/hob-walk-right/walk-0[0-5].png on the old 356x668 canvases, the lantern anchor
          (its handle, for the engine's light) found per frame above the glow.
  funeral the same walk, day-lit, relit into Room 31's night (tools/art/room31-relight-one.py) as
          art/actors/room-31-hob-walk-master.png.
  deke    art/actors/deke-vessel-walk.png
  pratt   art/actors/room-25-pratt-walk.png (both of his exits)

Each exit's figureHeight keeps the drawn size the old walk had (crown to sole, hat not counted,
measured on both). Its `strideRatio` is measured from its own frames (R5f): the planted foot's travel
against the body over a cycle, against the same measure on Thad's walk, whose recorded stride
(content/actors/thad.json, 141 / 240 = 0.588) calibrates it -- Hob 0.608, Deke and Pratt 0.600, the
funeral Hob 0.584. Prints the cut numbers for the content files.

Usage: walk-c.py
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/walk-c')
R = lambda p: os.path.join(ROOT, p)


def spread(sheet, out, n=6):
    """The sheet with its n figures pulled apart. Figures that overlap in columns without touching
    (Pratt's foot under the next pose's maul, cast-unify 45) defeat a cut by column gaps; this finds
    each figure as connected shapes -- the n largest, with every smaller piece given to the nearest
    -- and lays them out again on magenta with wide gaps."""
    from scipy import ndimage
    a = np.asarray(Image.open(sheet).convert('RGB')).astype(int)
    key = (a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110)
    lab, k = ndimage.label(~key)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, k + 1))
    bodies = list(np.argsort(sizes)[::-1][:n] + 1)
    cents = {b: ndimage.center_of_mass(lab == b) for b in bodies}
    owner = {b: b for b in bodies}
    for c in range(1, k + 1):
        if c in owner or sizes[c - 1] < 4: continue
        cy, cx = ndimage.center_of_mass(lab == c)
        owner[c] = min(bodies, key=lambda b: abs(cents[b][1] - cx) + 0.3 * abs(cents[b][0] - cy))
    bodies.sort(key=lambda b: cents[b][1])
    pieces = []
    for b in bodies:
        m = np.isin(lab, [c for c, o in owner.items() if o == b])
        ys, xs = np.nonzero(m)
        pieces.append((m, xs.min(), xs.max() + 1))
    gap = 80
    W = sum(x1 - x0 for _, x0, x1 in pieces) + gap * (len(pieces) + 1)
    o = np.zeros((a.shape[0], W, 3), np.uint8); o[...] = (255, 0, 255)
    x = gap
    for m, x0, x1 in pieces:
        sub = m[:, x0:x1]
        o[:, x:x + x1 - x0][sub] = a[:, x0:x1][sub]
        x += x1 - x0 + gap
    Image.fromarray(o).save(out)


def cut(sheet, height):
    """The six walk frames of row 0, each cropped to its figure, at one scale."""
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'r.png')
        apart = os.path.join(tmp, 'apart.png'); spread(sheet, apart)
        info = json.loads(subprocess.check_output([sys.executable, R('tools/art/cast-unify-cut.py'), apart, '0', str(height), out, '--grid', '1']))
        im = Image.open(out).convert('RGBA')
        fr = info['frames']; fr = [fr[0]] + fr[2:]   # the cutter inserts a breath frame after the first
        figs = []
        for x, y, w, h in fr:
            c = im.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))
    assert len(figs) == 6, len(figs)
    k = height / max(f.height for f in figs)
    out = []
    for f in figs:
        n = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)
        a = np.asarray(n).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
        out.append(Image.fromarray(a))
    return out


def torso_x(a):
    m = np.asarray(a)[..., 3] > 128
    rows = np.nonzero(m.any(1))[0]; t, b = rows[0], rows[-1]; h = b - t + 1
    cols = np.nonzero(m[t + int(h * 0.15):t + int(h * 0.45)].any(0))[0]
    return (cols.min() + cols.max()) / 2


def seat(figs, w, h, cx=None):
    """Each figure on a w x h canvas, soles on the last row, torso on column cx."""
    cx = w / 2 if cx is None else cx
    out = []
    for f in figs:
        c = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        c.alpha_composite(f, (int(round(cx - torso_x(f))), h - f.height))
        out.append(c)
    return out


def strip(cells, path):
    """A horizontal sheet, 2 px apart, as the other walk sheets are laid out; returns its frames."""
    w, h = cells[0].size
    s = Image.new('RGBA', (2 + len(cells) * (w + 2), h + 4), (0, 0, 0, 0))
    frames = []
    for i, c in enumerate(cells):
        x = 2 + i * (w + 2); s.alpha_composite(c, (x, 2)); frames.append([x, 2, w, h])
    s.save(path)
    return frames


def body_height(img, frame):
    """Crown to sole, the hat not counted (tools/art/figure-height.py --hat)."""
    with tempfile.TemporaryDirectory() as tmp:
        sp, fp = os.path.join(tmp, 's.png'), os.path.join(tmp, 'f.json')
        img.save(sp); json.dump({'frames': [frame]}, open(fp, 'w'))
        return float(json.loads(subprocess.check_output([sys.executable, R('tools/art/figure-height.py'), sp, fp, '--hat']))['figureHeight'])


SHEETS = {'deke': 'deke-walk-01.png', 'pratt': 'pratt-walk-03.png', 'hob': 'hob-walk-02.png'}
thad = json.load(open(R('content/actors/thad.json')))
STRIDE = round(thad['strideLength'] / thad['height'], 3)
report = {'strideRatio': STRIDE}


def exit_of(name):
    return json.load(open(R(f'content/ambient/{name}.json')))['exit']


def old_body(ex):
    im = Image.open(R(ex['sheet'])).convert('RGBA')
    return body_height(im, ex['frames'][0])


# ---- Deke and Pratt: ambient exits -----------------------------------------------------------
for who, ex_name, out_rel in [('deke', 'deke-vessel', 'art/actors/deke-vessel-walk.png'),
                              ('pratt', 'pratt-jump', 'art/actors/room-25-pratt-walk.png')]:
    ex = exit_of(ex_name)
    old_h = ex['frames'][0][3]; ob = old_body(ex)
    figs = cut(os.path.join(STAGE, SHEETS[who]), old_h)
    w = max(f.width for f in figs) + 16
    frames = strip(seat(figs, w, old_h), R(out_rel))
    nb = body_height(Image.open(R(out_rel)).convert('RGBA'), frames[0])
    report[who] = {'sheet': out_rel, 'frames': frames, 'figureHeight': round(ex['figureHeight'] * nb / ob), 'drawnFacing': 'right'}

# ---- Hob: his walk clip, then the funeral's night copy ----------------------------------------
stand = Image.open(R('art/actors/hob-stand-right/stand-00.png')).convert('RGBA')
# As drawn: its slate-blue coat already matches his standing frame. (A per-channel match of the whole
# figure's colours was tried and turned the coat olive -- the lantern and skin pulled it.)
day_path = os.path.join(STAGE, SHEETS['hob'])
rig_path = R('art/actors/hob-walk-right/rig.json'); rig = json.load(open(rig_path))
W, H = rig['figure']
figs = cut(day_path, H)
# The torso column of his standing frame, so he sets off from where he stood.
cells = seat(figs, W, H)   # torso on the canvas centre, where his clip's anchor (W/2) puts his feet
d = R('art/actors/hob-walk-right')
for f in os.listdir(d):
    if f.endswith('.png'): os.remove(os.path.join(d, f))
anchors = []
for i, c in enumerate(cells):
    c.save(os.path.join(d, f'walk-{i:02d}.png'))
    a = np.asarray(c).astype(int)
    # The glow: the brightest warm pixels, below his face (his skin is warm too).
    glow = (a[..., 3] > 128) & (a[..., 0] > 235) & (a[..., 1] > 200) & (a[..., 2] < 200)
    glow[:int(H * 0.4)] = False
    ys, xs = np.nonzero(glow)
    # The handle: above the glow's top, at its centre -- where the lantern hangs from.
    anchors.append([int(round(xs.mean())), int(max(0, ys.min() - 0.06 * H))])
rig['frames'] = 6
rig['lantern_anchor'] = anchors
rig['source'] = 'art/staging/walk-c/' + SHEETS['hob']
rig['note'] = ("WALK-C (Tyler, 2026-11-06, of the walks recorded in the game: \"Hob could be better generally\"): "
               "six frames posed on Thad's walk (cast-unify 44), cut by tools/art/walk-c.py, colours matched to his "
               "standing frame, the legs trading places as Thad's do. Supersedes the four-frame walk whose same leg led "
               "every step. lantern_anchor is the lantern's handle per frame, found above its glow.")
json.dump(rig, open(rig_path, 'w'), indent=1)
report['hob'] = {'frames': [f'art/actors/hob-walk-right/walk-{i:02d}.png' for i in range(6)], 'lantern_anchor': anchors}

ex = exit_of('funeral-hob')
old_h = ex['frames'][0][3]; ob = old_body(ex)
figs = cut(day_path, old_h)
w = max(f.width for f in figs) + 16
day_sheet = os.path.join(STAGE, 'funeral-walk-day.png')
frames = strip(seat(figs, w, old_h), day_sheet)
fj = os.path.join(STAGE, 'funeral-walk.json'); json.dump({'frames': frames}, open(fj, 'w'))
fx, fy = ex['path'][0]
subprocess.check_call([sys.executable, R('tools/art/room31-relight-one.py'), day_sheet, fj, str(fx), str(fy), R('art/actors/room-31-hob-walk-master.png')])
nb = body_height(Image.open(day_sheet).convert('RGBA'), frames[0])
report['funeral'] = {'sheet': 'art/actors/room-31-hob-walk-master.png', 'frames': frames, 'figureHeight': round(ex['figureHeight'] * nb / ob), 'drawnFacing': 'right'}

print(json.dumps(report))
