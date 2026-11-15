"""The Nugget's barman, the second drawing, cut (reference/nugget-barman/brief.md, the second brief; errata 323, 325).
No image operation.

nugget-barman operation 2 drew, on magenta, Thad standing (the ruler) and four full-length frames of a new barman with
their soles on one row: rest (polishing, the cloth in his right hand), polish B, the glass set down, the look along
the bar with glass and cloth at his chest. It measured brighter and sharper than the drinkers, so operation 3, the
correction, redrew the four from it, shown the side-by-side; operation 3 is what ships.

NOTHING IS REGRADED (the second brief: "Do not soften, squeeze or regrade the figure in the cut"). The tool scales,
places, keys and snaps to the one level (errata 112); every colour is the operation's own.

  - one scale for all four: his rest frame, crown to sole, is the curve's standing man at the bar (feet hidden at
    y 560: 246.4);
  - all four cut at one sheet row (CUT): the foot of frame 3's set-down glass, which is put on the counter top's front
    edge, y 515 -- his hands meet the counter, as the first hand-back found;
  - on the counter top itself (BACK to CUT: its back edge, about 10 game px above the front edge) only what is ON the
    counter shows: the glass, the cloth and his hands. His apron below the back edge is behind the counter;
  - each centred in one cell on its torso (15-45% down), the cut row on the cell's bottom row; despilled at the
    outline; snapped to the one level at the man.

Writes art/actors/room-03-barman.png (frames [2 + i*(W+2), 2, W, H]), renders/room-03-barman-in-the-nugget.png (the
four frames in the bar) and renders/room-03-barman-between-the-drinkers.png (the rest frame in the room at game size,
between the drinkers, and the same crop at 3x).
  python3 tools/art/nugget-barman-cut-2.py [--op 2|3] [--write]   (3, the correction, by default; only 3 writes)
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

# Per operation: the sheet, the row where frame 3's set-down glass ends (put on the counter's front edge), and how many
# figures stand left of the barman's four (operation 2 kept Thad, the ruler; operation 3, the correction, dropped him).
OPS = {2: {'sheet': 'art/staging/nugget-barman/op-2/sheet.png', 'cut': 572, 'before': 1},   # glass base at 570-571
       3: {'sheet': 'art/staging/nugget-barman/op-3/sheet.png', 'cut': 561, 'before': 0}}   # glass base at 559-560
OP = int(sys.argv[sys.argv.index('--op') + 1]) if '--op' in sys.argv else 3   # 3 ships
SHEET, CUT = OPS[OP]['sheet'], OPS[OP]['cut']
OUT = 'art/actors/room-03-barman.png'
FEET = (1580, 560)        # the brief: behind the bar, feet hidden at about y 560 (the curve's man there)
COUNTER = 515             # the counter top's front edge: the band's bottom row
BACK = CUT - 24             # the counter top's back edge: ~10 game px (24 sheet px at this scale) above CUT


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
    assert len(runs) == 4 + OPS[OP]['before'], runs
    runs = runs[OPS[OP]['before'] - 1:] if OPS[OP]['before'] else [None] + runs
    rest_rows = np.nonzero(op[:, runs[1][0]:runs[1][1]].any(1))[0]
    k = man / (rest_rows[-1] - rest_rows[0] + 1)
    crops = []
    for x0, x1 in runs[1:]:
        rows = np.nonzero(op[:, x0:x1].any(1))[0]
        y0 = rows[0]
        rgba = np.zeros((CUT - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = a[y0:CUT, x0:x1]; rgba[..., 3] = np.where(op[y0:CUT, x0:x1], 255, 0)
        # On the counter top (between its back edge and its front edge) only the set-down glass shows: his apron and
        # body stop at the back edge, or they read as a white strip laid on the counter.
        sub = a[BACK:CUT, x0:x1]
        r_, g_, b_ = sub[..., 0], sub[..., 1], sub[..., 2]
        lum_ = 0.299 * r_ + 0.587 * g_ + 0.114 * b_
        grey = (np.abs(r_ - b_) < 45) & (lum_ > 45)    # the glass's rim and sides: grey
        cream = (lum_ > 150) & ((r_ - b_) < 100)       # the cloth: pale cream (the apron's tan is darker, lum ~100-130)
        skin = (r_ - b_) > 110                          # his hands: the apron's tan is r-b ~60-80
        on = (grey | cream | skin) & op[BACK:CUT, x0:x1]
        from scipy import ndimage as _ndi
        lab, n = _ndi.label(_ndi.binary_closing(on, iterations=2))
        keep = np.zeros_like(on)
        for i in range(1, n + 1):
            ys, xs = np.nonzero(lab == i)
            if len(ys) < 40 or xs.max() - xs.min() < 6:   # not stray flecks, not the thin dark edge of his trousers
                continue
            if not ((skin | cream) & (lab == i)).sum() >= 20:  # a hand, the cloth or the glass's highlights, not a shadow
                continue
            for y in np.unique(ys):                         # each row filled across the piece: the glass's beer, inside
                row = xs[ys == y]; keep[y, row.min():row.max() + 1] = True
        rgba[BACK - y0:, :, 3] = np.where(_ndi.binary_dilation(keep, iterations=1) & op[BACK:CUT, x0:x1], 255, 0)
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
    sheet = np.zeros((H + 4, 2 + 4 * (W + 2), 4), np.uint8); rects = []
    for i, c in enumerate(cells):
        x = 2 + i * (W + 2); sheet[2:2 + H, x:x + W] = c; rects.append([x, 2, W, H])
    thad = np.asarray(Image.open(R('art/actors/thad-stand-front/stand-00.png')).convert('RGBA'))
    thad = np.asarray(Image.fromarray(thad).crop(Image.fromarray(thad).getbbox()))
    th = np.asarray(Image.fromarray(thad).resize((round(thad.shape[1] * man / thad.shape[0]), round(man)), Image.BOX))
    bar2 = np.asarray(Image.open(R('art/actors/nugget-bar2.png')).convert('RGBA'))[2:247, 2:233]
    bar3 = np.asarray(Image.open(R('art/actors/nugget-bar3.png')).convert('RGBA'))[2:247, 2:390]
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
              'texture': {n: ms['texture'](x) for n, x in
                          (('barman', rest), ('thadAtThisMan', th), ('nuggetBar2', bar2), ('nuggetBar3', bar3))},
              'contrast': {n: round(float(ms['lum'](x[..., :3])[mk(x)].std()), 1) for n, x in
                           (('barman', rest), ('thadAtThisMan', th), ('nuggetBar2', bar2), ('nuggetBar3', bar3))},
              'meanLuminance': {n: round(float(ms['lum'](x[..., :3])[mk(x)].mean()), 1) for n, x in
                                (('barman', rest), ('thadAtThisMan', th), ('nuggetBar2', bar2), ('nuggetBar3', bar3))}}
    print(json.dumps(report, indent=1))
    report['op'] = OP
    if write:
        assert OP == 3, 'only the correction (operation 3) is written; --op 2 measures'
        Image.fromarray(sheet).save(R(OUT))
        # ONE LEVEL (errata 112; tests/one-level.test.mjs): the grid the game reads at his anchor row, once he is wired,
        # so a re-cut lands on the pixels the game ships (errata 326).
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
        if len(panels) == 1:                           # the rest frame between the drinkers, at game size and at 3x
            g = im.crop((1300, 260, 1860, 640)).convert('RGB')
            two = Image.new('RGB', (g.width + 8 + g.width * 3, g.height * 3), (0, 0, 0))
            two.paste(g, (0, 0)); two.paste(g.resize((g.width * 3, g.height * 3), Image.NEAREST), (g.width + 8, 0))
            two.save(R('renders/room-03-barman-between-the-drinkers.png'))
    out = Image.new('RGB', (960 * 2 + 8, 684 * 2 + 8), (0, 0, 0))
    for i, p in enumerate(panels):
        out.paste(p, ((i % 2) * 968, (i // 2) * 692))
    out.save(R('renders/room-03-barman-in-the-nugget.png'))


if __name__ == '__main__':
    main('--write' in sys.argv)
