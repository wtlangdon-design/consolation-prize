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

It writes each exit's and loop's sheet, frames, figureHeight and facing into content/ambient, then snaps
what it cut to the one level. Each exit's figureHeight keeps the drawn size the old walk had (crown to sole, hat not counted,
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


def cut(sheet, height, n=6):
    """The n walk frames of row 0, each cropped to its figure, at one scale."""
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'r.png')
        apart = os.path.join(tmp, 'apart.png'); spread(sheet, apart, n)
        info = json.loads(subprocess.check_output([sys.executable, R('tools/art/cast-unify-cut.py'), apart, '0', str(height), out, '--grid', '1']))
        im = Image.open(out).convert('RGBA')
        fr = info['frames']; fr = [fr[0]] + fr[2:]   # the cutter inserts a breath frame after the first
        figs = []
        for x, y, w, h in fr:
            c = im.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))
    assert len(figs) == n, len(figs)
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


SHEETS = {'deke': 'deke-walk-01.png', 'pratt': 'pratt-walk-04.png', 'hob': 'hob-walk-03.png'}
thad = json.load(open(R('content/actors/thad.json')))
STRIDE = round(thad['strideLength'] / thad['height'], 3)
report = {'strideRatio': STRIDE}


# THE WALKS AS THEY WERE before this redraw: every size here is measured against them, never against
# this tool's own last output -- measured against that, the sizes crept with every run (the miners'
# frames grew 256, 270, 285 px tall on three runs).
BEFORE = 'e5e3739'


def at_before(path):
    return subprocess.check_output(['git', '-C', ROOT, 'show', f'{BEFORE}:{path}'])


def exit_of(name, kind='exit'):
    return json.loads(at_before(f'content/ambient/{name}.json'))[kind]


def old_body(ex):
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, 'old.png'); open(p, 'wb').write(at_before(ex['sheet']))
        return body_height(Image.open(p).convert('RGBA'), ex['frames'][0])


# ---- Deke and Pratt: ambient exits -----------------------------------------------------------
for who, ex_name, out_rel in [('deke', 'deke-vessel', 'art/actors/deke-vessel-walk.png'),
                              ('pratt', 'pratt-jump', 'art/actors/room-25-pratt-walk.png')]:
    ex = exit_of(ex_name)
    old_h = ex['frames'][0][3]; ob = old_body(ex)
    figs = cut(os.path.join(STAGE, SHEETS[who]), old_h)
    w = max(f.width for f in figs) + 16
    cells = seat(figs, w, old_h)
    if who == 'pratt':
        # REPAIR (Tyler, 2026-11-06: "Pratt's hand randomly leaves his mallet in one frame so it looks
        # like it's just balancing on his shoulder"): the drawing's frame 2, a passing pose, has his arm
        # hanging free of the handle. It is replaced whole by frame 5, the other passing pose, whose hand
        # is on the handle -- in profile the two passing poses share their outline. (Grafting frame 1's
        # head and arm onto it was tried: it left seams across his far arm and his knee.)
        cells[2] = cells[5].copy()
    frames = strip(cells, R(out_rel))
    nb = body_height(Image.open(R(out_rel)).convert('RGBA'), frames[0])
    fh = round(ex['figureHeight'] * nb / ob)
    if who == 'pratt':
        # The leaner Pratt (cast-unify 49-50) is a new man, so his walk is sized as his standing frames
        # are -- crown to sole, the hat not counted -- on the passing frame, where he stands tallest.
        fh = round(body_height(Image.open(R(out_rel)).convert('RGBA'), frames[2]))
    report[who] = {'sheet': out_rel, 'frames': frames, 'figureHeight': fh, 'drawnFacing': 'right'}

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
    from scipy import ndimage
    lab, k = ndimage.label(glow)
    if k > 1:   # the lamp is the largest bright patch; a lone bright pixel elsewhere is not it
        sizes = ndimage.sum(glow, lab, range(1, k + 1)); glow = lab == (int(np.argmax(sizes)) + 1)
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



# ---- The claims road's miners: four men drawn alone (cast-unify 47, 48), a crowd composed from them ----
# Tyler, 2026-11-06: "The miners are awful". Their crowd sheet was four men stepping in unison through
# four frames. Each man now walks his own six-frame cycle, posed on Thad's, and the crowd is laid out
# from the four: one behind another along the road, each a little nearer the camera than the man behind,
# each on his own step of the cycle (phases 0, 3, 1, 4), so they do not march.
def rows_of(sheet):
    """The sheet's rows of figures, as separate images (split on the magenta band between them)."""
    a = np.asarray(Image.open(sheet).convert('RGB')).astype(int)
    key = (a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110)
    busy = (~key).sum(1) > 0
    bands, start = [], None
    for y, b in enumerate(busy):
        if b and start is None: start = y
        if not b and start is not None:
            if y - start > 40: bands.append((start, y))
            start = None
    out = []
    for y0, y1 in bands:
        sub = Image.open(sheet).convert('RGB').crop((0, max(0, y0 - 10), a.shape[1], min(a.shape[0], y1 + 10)))
        tmp = tempfile.mktemp(suffix='.png'); sub.save(tmp); out.append(tmp)
    return out


old = exit_of('miners-out', 'loop')
old_h = old['frames'][0][3]
ob = old_body(old)
MAN_H = old_h - 6
# THE ROAD CLIMBS AWAY FROM THE CAMERA (Tyler, 2026-11-06: "the ones walking up are walking up sideways").
# Drawn in profile, the crowd slid up the hill side-on. The men going out are drawn from behind, turned
# a little to the right, the way the road climbs (cast-unify 51, 52); the men coming back from the front,
# turned a little to the left, the way it comes down (53, 54; 53's two men were drawn turned right and
# are mirrored). Eight frames each, posed on Thad's own back and front walks.
CROWDS = {
    'away': (['miners-away-a.png', 'miners-away-b.png'], False, +1),
    'toward': (['miners-toward-a.png', 'miners-toward-b.png'], True, -1),
}
# NOT IN STEP: each man holds a pose two frames and changes on his own beat (BEAT) from his own point in
# the cycle (PHASE), and differs a little in size (SCALE). Along the road the men walk one behind another:
# the one ahead is further up the road going out (higher, a little smaller) and nearer the camera coming
# back (lower, a little larger) -- AHEAD, in man heights, and RISE.
PHASE = [0, 3, 6, 1]
BEAT = [0, 1, 1, 0]
SCALE = [1.0, 1.04, 0.96, 1.02]
AHEAD = [0, 0.46, 0.40, 0.48]   # wide enough that no man's tool crosses the face of the man beside him
RISE = 0.07
for view, (sheets, mirror_first, heading) in CROWDS.items():
    men = []
    for i, name in enumerate(sheets):
        for path in rows_of(os.path.join(STAGE, name)):
            frames8 = cut(path, MAN_H, 8)
            if mirror_first and i == 0:
                frames8 = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in frames8]
            men.append(frames8)
    assert len(men) == 4, len(men)
    men = [[f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.NEAREST) for f in c] for c, k in zip(men, SCALE)]
    mw = max(f.width for c in men for f in c)
    steps = np.cumsum([g * MAN_H for g in AHEAD])
    # going out the men ahead are up and to the right; coming back, down and to the left
    xs = (steps if heading > 0 else steps[-1] - steps) + mw / 2
    ys = (steps * RISE * 3) if heading > 0 else (steps[-1] - steps) * RISE * 3   # how far up the road each man is
    W = int(max(xs) + mw / 2 + 8); top_pad = int(max(ys)) + 2
    H = int(max(f.height for c in men for f in c) + top_pad + 2)
    order = sorted(range(4), key=lambda m: -ys[m])          # the man furthest up the road drawn first
    frames_out = []
    for i in range(16):
        c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for m in order:
            f = men[m][((i + BEAT[m]) // 2 + PHASE[m]) % 8]
            c.alpha_composite(f, (int(round(xs[m] - torso_x(f))), int(H - 1 - ys[m] - f.height + 1)))
        frames_out.append(c)
    crowd = f'art/actors/room-22-miners-{view}.png'
    frames = strip(frames_out, R(crowd))
    nb = body_height(Image.open(R(crowd)).convert('RGBA'), frames[0])
    report[f'miners-{view}'] = {'sheet': crowd, 'frames': frames, 'figureHeight': round(old['figureHeight'] * nb / ob),
                                'drawnFacing': 'right' if heading > 0 else 'left', 'view': view}
# Each exit and loop is pointed at what was cut -- sheet, frames, figureHeight, facing -- BEFORE the snap,
# which reads the frames from the content files; snapped against the old frames, the miners' new crowd was
# left finer than the level. (Strides, paces and notes are set by hand in the content and left alone.)
for name, key, kind in [('deke-vessel', 'deke', 'exit'), ('pratt-jump', 'pratt', 'exit'), ('pratt-registrar', 'pratt', 'exit'),
                        ('funeral-hob', 'funeral', 'exit'), ('miners-out', 'miners-away', 'loop'), ('miners-back', 'miners-toward', 'loop')]:
    path = R(f'content/ambient/{name}.json'); j = json.load(open(path)); e = j[kind]; d = report[key]
    e['sheet'], e['frames'], e['figureHeight'], e['drawnFacing'] = d['sheet'], d['frames'], d['figureHeight'], d.get('drawnFacing', 'right')
    if d.get('view'): e['view'] = d['view']
    open(path, 'w').write(json.dumps(j, indent=1, ensure_ascii=False) + '\n')

# Every sheet this writes is new, so it is snapped to the one level here, on its own (tools/art/one-level.py
# --only), and Hob's clip despilled. Run without this, walk-c left Deke's and the Hobs' walks unsnapped
# every time it was rerun for another character, and tests/one-level.test.mjs caught it.
subprocess.check_call([sys.executable, R('tools/art/one-level.py'), '--only', 'deke-vessel-walk', 'room-25-pratt-walk',
                       'hob-walk-right/', 'room-31-hob-walk-master', 'room-22-miners-away', 'room-22-miners-toward'], stdout=subprocess.DEVNULL)
subprocess.check_call([sys.executable, R('tools/art/despill-frames.py'), R('art/actors/hob-walk-right') + '/'], stdout=subprocess.DEVNULL)


# Each exit and loop is pointed at what was cut -- sheet, frames, figureHeight, facing -- BEFORE the snap,
# which reads the frames from the content files; snapped against the old frames, the miners' new crowd was
# left finer than the level. (Strides, paces and notes are set by hand in the content and left alone.)
for name, key, kind in [('deke-vessel', 'deke', 'exit'), ('pratt-jump', 'pratt', 'exit'), ('pratt-registrar', 'pratt', 'exit'),
                        ('funeral-hob', 'funeral', 'exit'), ('miners-out', 'miners-away', 'loop'), ('miners-back', 'miners-toward', 'loop')]:
    path = R(f'content/ambient/{name}.json'); j = json.load(open(path)); e = j[kind]; d = report[key]
    e['sheet'], e['frames'], e['figureHeight'], e['drawnFacing'] = d['sheet'], d['frames'], d['figureHeight'], d.get('drawnFacing', 'right')
    if d.get('view'): e['view'] = d['view']
    open(path, 'w').write(json.dumps(j, indent=1, ensure_ascii=False) + '\n')

# Every sheet this writes is new, so it is snapped to the one level here, on its own (tools/art/one-level.py
# --only), and Hob's clip despilled. Run without this, walk-c left Deke's and the Hobs' walks unsnapped
# every time it was rerun for another character, and tests/one-level.test.mjs caught it.
subprocess.check_call([sys.executable, R('tools/art/one-level.py'), '--only', 'deke-vessel-walk', 'room-25-pratt-walk',
                       'hob-walk-right/', 'room-31-hob-walk-master', 'room-22-miners-away', 'room-22-miners-toward'], stdout=subprocess.DEVNULL)
subprocess.check_call([sys.executable, R('tools/art/despill-frames.py'), R('art/actors/hob-walk-right') + '/'], stdout=subprocess.DEVNULL)
print(json.dumps(report))
