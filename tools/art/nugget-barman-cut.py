"""The Nugget's barman, cut (reference/nugget-barman/brief.md; errata 323, doc 133). No image operation.

nugget-barman operation 1 drew, on magenta, Thad standing (the ruler: a standing man) and four full-length frames of
the barman with their soles on Thad's row: rest (polishing), polish B, the glass set down, the look along the bar.

The brief places him as posture `band`, the sheet stopping at the counter top's front edge (y 515), at the height of
a standing man whose feet are hidden behind the counter (the curve's man at y 560: 246.4). Drawn that way the counter
crosses him at the knees and his working hands float above it. So he keeps that height and the band is cut at the
row where his set-down glass meets the counter (frame 3's glass, the lowest thing his hands reach): that row is y 515.
On the counter top itself (its back edge ~10 px above that row) only the glass is kept; his apron stops at the back edge.

  - one scale for all four: the drawn Thad is a standing man of 246.4;
  - each frame's columns found by the magenta between them; all four cut at the same sheet row (CUT), above it kept;
  - each centred in one cell on its torso (the waistcoat, 15-45% down), the cut row on the cell's bottom row;
  - despilled at the outline; snapped to the one level (errata 112) at the man.

Writes art/actors/room-03-barman.png (frames [2 + i*(W+2), 2, W, H]) and renders/room-03-barman-in-the-nugget.png.
  python3 tools/art/nugget-barman-cut.py [--write]
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
src = open(R('tools/art/final-look-cut.py')).read()
ns = {'__file__': R('tools/art/final-look-cut.py')}
saved, sys.argv = sys.argv, ['final-look-cut.py']
exec(src[:src.index('\ndef main(')], ns)
sys.argv = saved
alpha, rows_of, snap, scaled, despill_edge, opaque_rgb, N = (ns[k] for k in (
    'alpha', 'rows_of', 'snap', 'scaled', 'despill_edge', 'opaque_rgb', 'N'))
bt = {'__file__': R('tools/art/beside-thad.py')}
srcb = open(bt['__file__']).read(); exec(srcb[:srcb.index('def main')], bt)
ms = {'__file__': R('tools/art/cast-softer-measure.py')}
srcm = open(ms['__file__']).read(); exec(srcm[:srcm.index('def head(')], ms)

SHEET = 'art/staging/nugget-barman/sheet.png'
OUT = 'art/actors/room-03-barman.png'
FEET = (1580, 560)        # the brief: behind the bar, feet hidden at about y 560 (the curve's man there)
COUNTER = 515             # the counter top's front edge: the band's bottom row
CUT = 596                 # the sheet row where frame 3's set-down glass ends (measured: the glass spans 549-594)
SOFT_CONTRAST = 34.0      # errata 325: the rest frame's luminance spread after softening, about Thad's at this man's size (32.3)
BACK = 574                # the counter top's back edge, ~10 game px above its front edge: below it only the glass


def columns(op):
    busy = op.any(0); runs, s = [], None
    for x, on in enumerate(busy):
        if on and s is None: s = x
        if not on and s is not None:
            if x - s > 30: runs.append((s, x))
            s = None
    return runs


def main(write):
    room = bt['load']('content/rooms/nugget.json')
    man = bt['curve_man'](room, *FEET)
    a = np.asarray(Image.open(R(SHEET)).convert('RGB')).astype(int)
    op = opaque_rgb(a)
    runs = columns(op)
    assert len(runs) == 5, runs
    thad_rows = np.nonzero(op[:, runs[0][0]:runs[0][1]].any(1))[0]
    k = man / (thad_rows[-1] - thad_rows[0] + 1)
    crops = []
    for x0, x1 in runs[1:]:
        rows = np.nonzero(op[:, x0:x1].any(1))[0]
        y0 = rows[0]
        rgba = np.zeros((CUT - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = a[y0:CUT, x0:x1]; rgba[..., 3] = np.where(op[y0:CUT, x0:x1], 255, 0)
        # On the counter top (between its back edge and its front edge) only the set-down glass shows: his apron and
        # body stop at the back edge, or they read as a white strip laid on the counter.
        sub = a[BACK:CUT, x0:x1]
        glass = (sub[..., 0] > 120) & (sub[..., 1] > 120) & (sub[..., 2] > 120) & (np.abs(sub[..., 0] - sub[..., 2]) < 40)
        from scipy import ndimage as _ndi
        lab, n = _ndi.label(_ndi.binary_dilation(glass, iterations=2))
        keep = np.zeros_like(glass)
        for i in range(1, n + 1):                      # the glass is a compact piece; the apron's hem is a wide strip
            ys, xs = np.nonzero(lab == i)
            if xs.max() - xs.min() < 60:
                keep |= (lab == i)
        rgba[BACK - y0:, :, 3] = np.where(keep & op[BACK:CUT, x0:x1], 255, 0)
        crops.append((y0, scaled(rgba, k)))
    top = min(y0 for y0, _ in crops)
    H = round((CUT - top) * k)
    def torso_x(f):
        m = alpha(f); r = np.nonzero(m.any(1))[0]; hh = r[-1] - r[0] + 1
        c = np.nonzero(m[r[0] + int(.15 * hh):r[0] + int(.45 * hh)].any(0))[0]; return (c[0] + c[-1]) / 2
    half = int(np.ceil(max(max(torso_x(f), f.shape[1] - torso_x(f)) for _, f in crops))) + 2
    W = 2 * half
    block = man / N
    cells = []
    for y0, f in crops:
        c = np.zeros((H, W, 4), np.uint8)
        ox = int(round(half - torso_x(f))); oy = H - f.shape[0]
        c[oy:oy + f.shape[0], ox:ox + f.shape[1]][alpha(f)] = f[alpha(f)]
        cells.append(despill_edge(snap(c, block) if block > 1.05 else c, width=max(2, int(np.ceil(block)) + 1)))
    # THE STYLE GATE'S CORRECTION, WITHOUT AN OPERATION (errata 325). The one operation came back about twice Thad's
    # texture and contrast (11.41 and 62.5 against 6.60 and 32.3), and the cap was spent. Tyler rejects "accept it",
    # so the miss is corrected here: every frame's luminance is drawn in toward the rest frame's own middle, by one
    # factor for all four, until the rest frame's spread is Thad's. Each pixel moves all three channels by the same
    # amount, so hue is kept: the same man, in the same lamp, with the hard light taken off him.
    def lum3(x):
        return 0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2]
    rest_m = alpha(cells[0]); rest_l = lum3(cells[0][..., :3].astype(float))
    centre = float(rest_l[rest_m].mean()); factor = SOFT_CONTRAST / float(rest_l[rest_m].std())
    softened = []
    for c in cells:
        c = c.copy(); m = alpha(c); rgb = c[..., :3].astype(float); l = lum3(rgb)
        shift = (centre + (l - centre) * factor) - l
        rgb = np.clip(rgb + shift[..., None], 0, 255)
        c[..., :3] = np.where(m[..., None], np.round(rgb), c[..., :3]).astype(np.uint8)
        softened.append(c)
    cells = softened
    sheet = np.zeros((H + 4, 2 + 4 * (W + 2), 4), np.uint8); rects = []
    for i, c in enumerate(cells):
        x = 2 + i * (W + 2); sheet[2:2 + H, x:x + W] = c; rects.append([x, 2, W, H])
    thad = np.asarray(Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    thad = np.asarray(Image.fromarray(thad).crop(Image.fromarray(thad).getbbox()))
    th = np.asarray(Image.fromarray(thad).resize((round(thad.shape[1] * man / thad.shape[0]), round(man)), Image.BOX))
    bar2 = np.asarray(Image.open(R('art/actors/nugget-bar2.png')).convert('RGBA'))[2:247, 2:233]
    rest = cells[0]
    mk = lambda x: alpha(x)
    report = {'manAtFeet': round(man, 1), 'scale': round(k, 4), 'block': round(block, 3), 'cell': [W, H], 'frames': rects,
              'anchor': {'inCell': [W // 2, H - 1], 'room': [FEET[0], COUNTER]},
              # crown to the cut row (the cell's bottom), not to his lowest opaque row: below the counter's back edge
              # only the glass is kept, so the rest frame's own pixels stop above the cell's bottom
              'bandHeight': int(H - rows_of(rest)[0]),
              'crownInRoom': COUNTER - int(H - 1 - rows_of(rest)[0]),
              'feetInRoomAtHisHeight': round(COUNTER - (H - 1 - rows_of(rest)[0]) + man),
              'changedFromRest': [round(float(np.mean(np.any(c != rest, axis=2)[mk(rest) | mk(c)])), 3) for c in cells],
              'texture': {'barman': ms['texture'](rest), 'thadAtThisMan': ms['texture'](th), 'nuggetBar2': ms['texture'](bar2)},
              'contrast': {n: round(float(ms['lum'](x[..., :3])[mk(x)].std()), 1) for n, x in
                           (('barman', rest), ('thadAtThisMan', th), ('nuggetBar2', bar2))}}
    print(json.dumps(report, indent=1))
    if write:
        Image.fromarray(sheet).save(R(OUT))
        # ONE LEVEL (errata 112; tests/one-level.test.mjs): the grid the game reads at his anchor row, so a re-cut
        # lands on the same pixels the game ships (errata 325).
        import subprocess
        subprocess.run([sys.executable, R('tools/art/one-level.py'), '--only', 'room-03-barman'], check=True, stdout=subprocess.DEVNULL)
        render(cells, room, W, H)


def render(cells, room, W, H):
    plate = Image.open(R(room['background'])).convert('RGBA')
    panels = []
    for c in cells:
        im = plate.copy()
        f = bt['lit'](Image.fromarray(c), bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), *FEET))
        im.alpha_composite(f, (FEET[0] - W // 2, COUNTER - H + 1))
        for fid in ('nugget-bar1', 'nugget-bar2', 'nugget-bar3'):     # the drinkers in front of the counter
            d = json.load(open(R(f'content/ambient/{fid}.json'))); s = d['sprite']; x, y, w, h = s['frames'][0]
            dimg = Image.open(R(s['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
            dimg = bt['lit'](dimg, bt['grade_for'](room, d['id']), bt['mover_tint'](room.get('lamps'), d['x'], d['y']))
            im.alpha_composite(dimg, (d['x'] - w // 2, d['y'] - h + 1))
        thad = bt['load']('content/actors/thad.json')
        st = next(cl for cl in thad['clips'] if cl['id'] == 'stand' and cl['facing'] == 'right' and not cl.get('state'))
        tx, ty = 1080, 740
        t = Image.open(R(st['frames'][0])).convert('RGBA')
        t = bt['lit'](t, bt['grade_for'](room, 'thad'), bt['mover_tint'](room.get('lamps'), tx, ty))
        kt = bt['curve_man'](room, tx, ty) / st['figureHeight']
        ts = t.resize((round(t.width * kt), round(t.height * kt)), Image.NEAREST)
        im.alpha_composite(ts, (round(tx - st['anchor'][0] * kt), round(ty - st['anchor'][1] * kt)))
        panels.append(im.crop((960, 180, 1920, 864)).convert('RGB'))
    out = Image.new('RGB', (960 * 2 + 8, 684 * 2 + 8), (0, 0, 0))
    for i, p in enumerate(panels):
        out.paste(p, ((i % 2) * 968, (i // 2) * 692))
    out.save(R('renders/room-03-barman-in-the-nugget.png'))


if __name__ == '__main__':
    main('--write' in sys.argv)
